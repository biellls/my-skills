const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createServer, initialScene } = require('./server.js');

async function fixture() { const data=await fs.mkdtemp(path.join(os.tmpdir(),'browser-collab-')); const running=await createServer({data,port:0}); const url=`http://127.0.0.1:${running.address.port}`; return {data,url,close:()=>new Promise(r=>running.server.close(r))}; }
async function api(url,p,init={}) { const r=await fetch(url+p,{...init,headers:{'content-type':'application/json',...(init.headers||{})}}); const body=await r.json(); return {r,body}; }

test('serves isolated app and artifact but no arbitrary filesystem path', async t => {
  const f=await fixture(); t.after(f.close);
  assert.equal((await fetch(f.url+'/')).status,200); const app=await fetch(f.url+'/'); assert.match(await app.text(),/Sketchpad/); assert.equal((await fetch(f.url+'/artifact-defaults.css')).status,200);
  assert.match(await (await fetch(f.url+'/artifact')).text(),/Self-referential demo/);
  assert.equal((await fetch(f.url+'/../state.json')).status,404);
  assert.equal((await fetch(f.url+'/%2e%2e/%2e%2e/etc/passwd')).status,404);
  const artifactHeaders=await fetch(f.url+'/artifact'); assert.match(artifactHeaders.headers.get('content-security-policy'),/default-src 'none'/);
  const preview=await fetch(f.url+'/api/scene/preview.svg'); assert.equal(preview.status,200); assert.match(await preview.text(),/<svg/);
});

test('long poll wakes when a new event arrives', async t => {
  const f=await fixture(); t.after(f.close);
  const waiting=fetch(f.url+'/api/events?after=0&wait=2000').then(r=>r.json());
  await new Promise(r=>setTimeout(r,30));
  await api(f.url,'/api/messages',{method:'POST',body:JSON.stringify({author:'human',message:'wake up'})});
  const result=await waiting; assert.equal(result.events[0].message,'wake up');
});

test('both authors, anchors, replies and acknowledgement retry survive restart', async t => {
  const f=await fixture(); t.after(f.close);
  let x=await api(f.url,'/api/comments',{method:'POST',body:JSON.stringify({author:'human',message:'Could this be clearer?',anchor:{kind:'html',id:'idea-question',quote:'make an agent'}})}); assert.equal(x.r.status,201);
  x=await api(f.url,'/api/proposals',{method:'POST',body:JSON.stringify({author:'agent',message:'**Proposal:** show one concrete trade-off.\n\n**Reason:** it reduces blank-page work.',anchor:{kind:'diagram',id:'question',label:'Idea / question'}})}); assert.equal(x.r.status,201);
  const first=await api(f.url,'/api/events?after=0&wait=0'); assert.equal(first.body.events.length,2); assert.equal(first.body.events[0].anchor.kind,'html');
  await api(f.url,'/api/ack',{method:'POST',body:JSON.stringify({id:first.body.events[0].id})});
  const reply=await api(f.url,'/api/replies',{method:'POST',body:JSON.stringify({author:'agent',replyTo:first.body.events[0].id,message:'I would keep the quote anchored.'})}); assert.equal(reply.r.status,201);
  const retry=await api(f.url,'/api/events?after=0&wait=0'); assert.deepEqual(retry.body.events.map(e=>e.id),[first.body.events[1].id,reply.body.id]);
  await f.close(); const restarted=await createServer({data:f.data,port:0}); t.after(()=>new Promise(r=>restarted.server.close(r)));
  const persisted=await api(`http://127.0.0.1:${restarted.address.port}`,'/api/events?after=0&wait=0'); assert.deepEqual(persisted.body.events.map(e=>e.id),[first.body.events[1].id,reply.body.id]);
});

test('scene and artifact writes use revisions and never silently overwrite', async t => {
  const f=await fixture(); t.after(f.close);
  const original=(await api(f.url,'/api/scene')).body; const scene=structuredClone(original.scene);
  scene.elements[0].x=777;
  let x=await api(f.url,'/api/scene',{method:'PUT',body:JSON.stringify({baseRevision:original.revision,scene})}); assert.equal(x.r.status,200); assert.equal(x.body.revision,1);
  scene.elements[0].x=12; x=await api(f.url,'/api/scene',{method:'PUT',body:JSON.stringify({baseRevision:0,scene})}); assert.equal(x.r.status,409);
  const now=await api(f.url,'/api/scene'); assert.equal(now.body.scene.elements[0].x,777);
  const preview=await fetch(f.url+'/api/scene/preview?revision=1',{method:'PUT',headers:{'content-type':'image/png'},body:Buffer.from('png')}); assert.equal(preview.status,200); const savedPreview=await fetch(f.url+'/api/scene/preview.png'); assert.equal(savedPreview.headers.get('content-type'),'image/png'); assert.equal((await savedPreview.arrayBuffer()).byteLength,3);
  const html=await fs.readFile(path.join(f.data,'artifact.html'),'utf8'); x=await api(f.url,'/api/artifact',{method:'PUT',body:JSON.stringify({baseRevision:0,html:html+'<!-- changed example -->'})}); assert.equal(x.r.status,200);
  x=await api(f.url,'/api/artifact',{method:'PUT',body:JSON.stringify({baseRevision:0,html:'lost edit'})}); assert.equal(x.r.status,409); assert.match(await fs.readFile(path.join(f.data,'artifact.html'),'utf8'),/changed example/);
});

test('compact scene preserves IDs, labels and real bindings without dumping raw scene', () => {
  const scene=initialScene(); const compact=require('./server.js').compactScene(scene,3); assert.equal(compact.revision,3); assert.equal(compact.elements.find(e=>e.id==='question-label').label,'Idea / question'); assert.deepEqual(compact.elements.find(e=>e.id==='question-to-sketch').bindings,['question','human-sketch']); assert.equal(compact.elements[0].seed,undefined);
});
