const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const http = require('node:http');
const { createServer, initialScene } = require('./server.js');

async function fixture() { const data=await fs.mkdtemp(path.join(os.tmpdir(),'browser-collab-')); const running=await createServer({data,port:0}); const url=`http://127.0.0.1:${running.address.port}`; return {data,url,close:()=>new Promise(r=>running.server.close(r))}; }
async function api(url,p,init={}) { const r=await fetch(url+p,{...init,headers:{'content-type':'application/json',...(init.headers||{})}}); const body=await r.json(); return {r,body}; }
async function raw(url, options) { return new Promise((resolve,reject) => { const request=http.request(new URL(url), options, response => { let body=''; response.on('data', chunk => body += chunk); response.on('end', () => resolve({ status: response.statusCode, body })); }); request.on('error', reject); request.end(options.body); }); }

test('serves isolated app and artifact but no arbitrary filesystem path', async t => {
  const f=await fixture(); t.after(f.close);
  assert.equal((await fetch(f.url+'/')).status,200); const app=await fetch(f.url+'/'); assert.match(await app.text(),/Sketchpad/); assert.equal((await fetch(f.url+'/artifact-defaults.css')).status,200);
  assert.match(await (await fetch(f.url+'/artifact')).text(),/When does disagreement help us think/);
  assert.equal((await fetch(f.url+'/../state.json')).status,404);
  assert.equal((await fetch(f.url+'/%2e%2e/%2e%2e/etc/passwd')).status,404);
  const artifactHeaders=await fetch(f.url+'/artifact'); assert.match(artifactHeaders.headers.get('content-security-policy'),/default-src 'none'/); assert.match(artifactHeaders.headers.get('content-security-policy'),/sandbox allow-scripts/);
  assert.match(await artifactHeaders.text(), /sketchpad-selection/);
  const state=(await api(f.url,'/api/state')).body; assert.equal(state.paths.dataDir,f.data); assert.equal(state.paths.scenePath,path.join(f.data,'scene.excalidraw')); assert.ok(state.workspaceId);
  const preview=await fetch(f.url+'/api/scene/preview.svg'); assert.equal(preview.status,200); assert.match(await preview.text(),/<svg/);
});

test('long poll wakes when a new event arrives', async t => {
  const f=await fixture(); t.after(f.close);
  const waiting=fetch(f.url+'/api/events?after=0&wait=2000').then(r=>r.json());
  await new Promise(r=>setTimeout(r,30));
  await api(f.url,'/api/messages',{method:'POST',body:JSON.stringify({author:'human',message:'wake up'})});
  const result=await waiting; assert.equal(result.events[0].message,'wake up');
});

test('agent output is not re-delivered, while unacked human input retries after restart', async t => {
  const f=await fixture(); t.after(f.close);
  let x=await api(f.url,'/api/comments',{method:'POST',body:JSON.stringify({author:'human',message:'Could this be clearer?',anchor:{kind:'html',id:'idea-question',quote:'make an agent'}})}); assert.equal(x.r.status,201); const humanId=x.body.id;
  x=await api(f.url,'/api/proposals',{method:'POST',body:JSON.stringify({author:'agent',message:'**Proposal:** show one concrete trade-off.\n\n**Reason:** it reduces blank-page work.',anchor:{kind:'diagram',id:'question',label:'Idea / question'}})}); assert.equal(x.r.status,201);
  const first=await api(f.url,'/api/events?after=0&wait=0'); assert.deepEqual(first.body.events.map(e=>e.id),[humanId]); assert.equal(first.body.events[0].anchor.kind,'html');
  const reply=await api(f.url,'/api/replies',{method:'POST',body:JSON.stringify({author:'agent',replyTo:humanId,message:'I would keep the quote anchored.'})}); assert.equal(reply.r.status,201);
  await api(f.url,'/api/ack',{method:'POST',body:JSON.stringify({id:humanId})});
  assert.deepEqual((await api(f.url,'/api/events?after=0&wait=0')).body.events,[]);
  x=await api(f.url,'/api/messages',{method:'POST',body:JSON.stringify({author:'human',message:'A new human question'})}); assert.deepEqual((await api(f.url,'/api/events?after=1&wait=0')).body.events.map(e=>e.id),[x.body.id]);
  await f.close(); const restarted=await createServer({data:f.data,port:0}); t.after(()=>new Promise(r=>restarted.server.close(r)));
  const persisted=await api(`http://127.0.0.1:${restarted.address.port}`,'/api/events?after=0&wait=0'); assert.deepEqual(persisted.body.events.map(e=>e.id),[x.body.id]);
});

test('event batches do not lose unacked human input', async t => {
  const f=await fixture(); t.after(f.close);
  for (let i=0;i<22;i++) await api(f.url,'/api/messages',{method:'POST',body:JSON.stringify({author:'human',message:`human-${i}`})});
  let batch=(await api(f.url,'/api/events?after=0&wait=0')).body.events; assert.equal(batch.length,20);
  for (const item of batch) await api(f.url,'/api/ack',{method:'POST',body:JSON.stringify({id:item.id})});
  batch=(await api(f.url,'/api/events?after=20&wait=0')).body.events; assert.equal(batch.length,2); assert.deepEqual(batch.map(e=>e.message),['human-20','human-21']);
});

test('scene and artifact writes use revisions and never silently overwrite', async t => {
  const f=await fixture(); t.after(f.close);
  const original=(await api(f.url,'/api/scene')).body; const scene=structuredClone(original.scene);
  scene.elements[0].x=777;
  let x=await api(f.url,'/api/scene',{method:'PUT',body:JSON.stringify({baseRevision:original.revision,scene})}); assert.equal(x.r.status,200); assert.equal(x.body.revision,1);
  scene.elements[0].x=12; x=await api(f.url,'/api/scene',{method:'PUT',body:JSON.stringify({baseRevision:0,scene})}); assert.equal(x.r.status,409);
  const now=await api(f.url,'/api/scene'); assert.equal(now.body.scene.elements[0].x,777);
  const stalePreview=await fetch(f.url+'/api/scene/preview.png'); assert.equal(stalePreview.status,404);
  const preview=await fetch(f.url+'/api/scene/preview?revision=1',{method:'PUT',headers:{'content-type':'image/png'},body:Buffer.from('89504e470d0a1a0a','hex')}); assert.equal(preview.status,200); const savedPreview=await fetch(f.url+'/api/scene/preview.png'); assert.equal(savedPreview.headers.get('content-type'),'image/png'); assert.equal((await savedPreview.arrayBuffer()).byteLength,8);
  scene.elements[0].x=778; x=await api(f.url,'/api/scene',{method:'PUT',body:JSON.stringify({baseRevision:1,scene})}); assert.equal(x.r.status,200); assert.equal((await fetch(f.url+'/api/scene/preview.png')).status,404);
  const invalidPreview=await fetch(f.url+'/api/scene/preview?revision=2',{method:'PUT',headers:{'content-type':'image/png'},body:Buffer.from('not png')}); assert.equal(invalidPreview.status,400);
  const html=await fs.readFile(path.join(f.data,'artifact.html'),'utf8'); x=await api(f.url,'/api/artifact',{method:'PUT',body:JSON.stringify({baseRevision:0,html:html+'<!-- changed example -->'})}); assert.equal(x.r.status,200);
  x=await api(f.url,'/api/artifact',{method:'PUT',body:JSON.stringify({baseRevision:0,html:'lost edit'})}); assert.equal(x.r.status,409); assert.match(await fs.readFile(path.join(f.data,'artifact.html'),'utf8'),/changed example/);
});

test('security rejects prefix hosts, foreign/null origins, and non-JSON writes', async t => {
  const f=await fixture(); t.after(f.close); const port=new URL(f.url).port;
  let r=await raw(f.url+'/api/messages',{method:'POST',headers:{'content-type':'application/json',host:`127.0.0.1.attacker:${port}`},body:JSON.stringify({message:'nope'})}); assert.equal(r.status,403);
  r=await fetch(f.url+'/api/messages',{method:'POST',headers:{'content-type':'application/json',origin:`http://evil.test:${port}`},body:JSON.stringify({message:'nope'})}); assert.equal(r.status,403);
  r=await fetch(f.url+'/api/messages',{method:'POST',headers:{'content-type':'application/json',origin:'null'},body:JSON.stringify({message:'nope'})}); assert.equal(r.status,403);
  r=await fetch(f.url+'/api/messages',{method:'POST',headers:{'content-type':'text/plain'},body:JSON.stringify({message:'nope'})}); assert.equal(r.status,415);
});

test('revisions reject missing, null, strings, negatives, and unsafe values', async t => {
  const f=await fixture(); t.after(f.close); const scene=(await api(f.url,'/api/scene')).body.scene;
  for (const value of [undefined,null,'0',-1,Number.MAX_SAFE_INTEGER+1]) { const payload={scene}; if(value!==undefined)payload.baseRevision=value; const r=await api(f.url,'/api/scene',{method:'PUT',body:JSON.stringify(payload)}); assert.equal(r.r.status,400); }
});

test('CLI rejects invalid base revision before making a request', async () => {
  const file=path.join(await fs.mkdtemp(path.join(os.tmpdir(),'sketchpad-cli-')),'a.html'); await fs.writeFile(file,'<p>test</p>'); const result=spawnSync(process.execPath,[path.join(__dirname,'collab.js'),'artifact',file,'--base-revision','null'],{encoding:'utf8'}); assert.notEqual(result.status,0); assert.match(result.stderr,/base-revision must be a non-negative integer/);
});

test('compact scene preserves IDs, labels and real bindings without dumping raw scene', () => {
  const scene=initialScene(); const compact=require('./server.js').compactScene(scene,3); assert.equal(compact.revision,3); assert.equal(compact.elements.find(e=>e.id==='question-label').label,'Idea / question'); assert.deepEqual(compact.elements.find(e=>e.id==='question-to-sketch').bindings,['question','human-sketch']); assert.equal(compact.elements[0].seed,undefined);
});
