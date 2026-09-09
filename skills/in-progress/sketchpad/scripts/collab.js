#!/usr/bin/env node
'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { createServer } = require('./server.js');

function options(argv) { const out = { _: [] }; for (let i=0;i<argv.length;i++) { const x=argv[i]; if (!x.startsWith('--')) out._.push(x); else { const k=x.slice(2).replace(/-([a-z])/g,(_,c)=>c.toUpperCase()); out[k] = argv[i+1] && !argv[i+1].startsWith('--') ? argv[++i] : true; } } return out; }
function dataDir(o) { return path.resolve(String(o.data || process.env.SKETCHPAD_DATA || '.sketchpad')); }
function baseUrl(o) { return `http://127.0.0.1:${o.port || process.env.SKETCHPAD_PORT || 4317}`; }
function cliRevision(value, field = 'revision') { if (value === undefined || !/^(0|[1-9][0-9]*)$/.test(String(value)) || !Number.isSafeInteger(Number(value))) throw new Error(`--${field.replace(/[A-Z]/g, m => '-' + m.toLowerCase())} must be a non-negative integer`); return Number(value); }
async function request(o, pathname, init={}) { const r=await fetch(baseUrl(o)+pathname,{...init,headers:{'content-type':'application/json',...(init.headers||{})}}); const text=await r.text(); let j; try { j=JSON.parse(text); } catch { j={text}; } if(!r.ok) { const e=new Error(j.error||`HTTP ${r.status}`); e.status=r.status; throw e; } return j; }
function print(value) { console.log(JSON.stringify(value,null,2)); }
function requireText(o,key) { if (!o[key] || typeof o[key] !== 'string') throw new Error(`--${key.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())} is required`); return o[key]; }
async function main() {
  const o=options(process.argv.slice(2)), cmd=o._[0];
  if (!cmd || o.help) { console.log('serve | wait | ack | send | comment | propose | reply | state | scene-context | artifact | save-scene'); return; }
  if (cmd==='serve') { const port=Number(o.port||4317); const data=dataDir(o); const {address}=await createServer({data,port}); const url=`http://${address.address}:${address.port}`; console.log(`sketchpad listening at ${url}`); console.log(`data: ${data}`); if(o.open) spawn(process.platform==='darwin'?'open':process.platform==='win32'?'start':'xdg-open',[url],{stdio:'ignore',detached:true}).unref(); await new Promise(()=>{}); return; }
  if(cmd==='wait') { const after=o.after === undefined ? 0 : cliRevision(o.after, 'after'); const events=(await request(o,`/api/events?after=${after}&wait=${encodeURIComponent(Number(o.timeout||30000))}`)).events; print({events, nextAfter:events.length?events[events.length-1].id:after, reminder:'ack every human event only after the active agent has inspected and acted; keep the same --after while any event remains unacked'}); return; }
  if(cmd==='ack') { print(await request(o,'/api/ack',{method:'POST',body:JSON.stringify({id:cliRevision(o._[1]||o.id, 'id')})})); return; }
  if(cmd==='state') { const current=await request(o,'/api/state'); print({...current.paths, artifactRevision:current.artifactRevision, sceneRevision:current.scene.revision, previewAvailable:current.scene.previewAvailable}); return; }
  if(cmd==='scene-context') { const current=await request(o,'/api/state'); const context=current.scene; if(o.preview){ const r=await fetch(baseUrl(o)+'/api/scene/preview.png'); if(!r.ok)throw Error(`official PNG preview HTTP ${r.status} (save the scene in the browser first)`); await fs.writeFile(path.resolve(String(o.preview)),Buffer.from(await r.arrayBuffer())); context.preview=path.resolve(String(o.preview)); } context.rawScene=current.paths.scenePath; print(context); return; }
  if(cmd==='send' || cmd==='comment' || cmd==='propose') {
    const message=cmd==='send'?requireText(o,'message'):cmd==='comment'?requireText(o,'message'):`**Proposal:** ${requireText(o,'suggestion')}\n\n**Reason:** ${requireText(o,'reason')}`;
    const b={author:o.author==='human'?'human':'agent',message}; if(o.anchorId) b.anchor={kind:o.anchorKind||'html',id:o.anchorId,...(o.quote?{quote:o.quote}:{}),...(o.label?{label:o.label}:{})}; const endpoint=cmd==='send'?'messages':cmd==='comment'?'comments':'proposals'; print(await request(o,`/api/${endpoint}`,{method:'POST',body:JSON.stringify(b)})); return;
  }
  if(cmd==='reply') { const replyTo=Number(o._[1]||o.replyTo); const b={author:o.author==='human'?'human':'agent',message:requireText(o,'message'),replyTo}; if(o.anchorId)b.anchor={kind:o.anchorKind||'html',id:o.anchorId,...(o.quote?{quote:o.quote}:{})}; print(await request(o,'/api/replies',{method:'POST',body:JSON.stringify(b)})); return; }
  if(cmd==='artifact') { const file=o._[1]; if(!file)throw Error('artifact FILE is required'); const html=await fs.readFile(path.resolve(file),'utf8'); print(await request(o,'/api/artifact',{method:'PUT',body:JSON.stringify({baseRevision:cliRevision(o.baseRevision,'baseRevision'),html})})); return; }
  if(cmd==='save-scene') { const file=o._[1]; if(!file)throw Error('save-scene FILE is required'); const scene=JSON.parse(await fs.readFile(path.resolve(file),'utf8')); print(await request(o,'/api/scene',{method:'PUT',body:JSON.stringify({author:'agent',baseRevision:cliRevision(o.baseRevision,'baseRevision'),scene})})); return; }
  throw Error(`unknown command: ${cmd}`);
}
main().catch(e=>{ console.error(`error: ${e.message}`); process.exitCode=1; });
