#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const fsp = fs.promises;
const path = require('node:path');
const http = require('node:http');
const { URL } = require('node:url');
const { createHash } = require('node:crypto');

const DEMO = path.resolve(__dirname, '..', 'demo');
const MAX_BODY = 256 * 1024;
const MAX_TEXT = 12_000;

const initialScene = () => ({
  type: 'excalidraw', version: 2, source: 'sketchpad',
  elements: [
    { id: 'question', type: 'rectangle', x: 80, y: 100, width: 260, height: 90, angle: 0, strokeColor: '#1f2937', backgroundColor: '#dbeafe', fillStyle: 'solid', strokeWidth: 2, roughness: 0, opacity: 100, groupIds: [], frameId: null, roundness: { type: 3 }, seed: 1, version: 1, versionNonce: 1, isDeleted: false, boundElements: [{ type: 'arrow', id: 'question-to-sketch' }], updated: 1, link: null, locked: false },
    { id: 'question-label', type: 'text', x: 105, y: 132, width: 210, height: 25, angle: 0, strokeColor: '#1f2937', backgroundColor: 'transparent', fillStyle: 'solid', strokeWidth: 1, roughness: 0, opacity: 100, groupIds: [], frameId: null, seed: 2, version: 1, versionNonce: 2, isDeleted: false, text: 'Idea / question', fontSize: 20, fontFamily: 1, textAlign: 'center', verticalAlign: 'middle', containerId: 'question', originalText: 'Idea / question', autoResize: true, lineHeight: 1.25, updated: 1, link: null, locked: false },
    { id: 'human-sketch', type: 'rectangle', x: 500, y: 100, width: 270, height: 90, angle: 0, strokeColor: '#1f2937', backgroundColor: '#dcfce7', fillStyle: 'solid', strokeWidth: 2, roughness: 0, opacity: 100, groupIds: [], frameId: null, roundness: { type: 3 }, seed: 3, version: 1, versionNonce: 3, isDeleted: false, boundElements: [{ type: 'arrow', id: 'question-to-sketch' }], updated: 1, link: null, locked: false },
    { id: 'human-sketch-label', type: 'text', x: 525, y: 132, width: 220, height: 25, angle: 0, strokeColor: '#1f2937', backgroundColor: 'transparent', fillStyle: 'solid', strokeWidth: 1, roughness: 0, opacity: 100, groupIds: [], frameId: null, seed: 4, version: 1, versionNonce: 4, isDeleted: false, text: 'Human sketch', fontSize: 20, fontFamily: 1, textAlign: 'center', verticalAlign: 'middle', containerId: 'human-sketch', originalText: 'Human sketch', autoResize: true, lineHeight: 1.25, updated: 1, link: null, locked: false },
    { id: 'question-to-sketch', type: 'arrow', x: 340, y: 145, width: 160, height: 0, angle: 0, strokeColor: '#7c3aed', backgroundColor: 'transparent', fillStyle: 'solid', strokeWidth: 2, roughness: 0, opacity: 100, groupIds: [], frameId: null, points: [[0, 0], [160, 0]], startBinding: { elementId: 'question', focus: 0, gap: 1 }, endBinding: { elementId: 'human-sketch', focus: 0, gap: 1 }, startArrowhead: null, endArrowhead: 'triangle', seed: 5, version: 1, versionNonce: 5, isDeleted: false, updated: 1, link: null, locked: false }
  ], appState: { viewBackgroundColor: '#fffdf8', gridSize: null, gridStep: 20 }, files: {}
});

function safeDataDir(dir) { return path.resolve(dir); }
function initialState() { return { revision: 0, sceneRevision: 0, previewRevision: null, artifactRevision: 0, nextEventId: 1, events: [], comments: [], scene: initialScene() }; }
async function atomicWrite(file, value) {
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fsp.writeFile(tmp, value, 'utf8');
  await fsp.rename(tmp, file);
}
async function readState(data) {
  try { const state = JSON.parse(await fsp.readFile(path.join(data, 'state.json'), 'utf8')); state.previewRevision ??= null; return state; }
  catch (e) { if (e.code !== 'ENOENT') throw e; const state = initialState(); await atomicWrite(path.join(data, 'state.json'), JSON.stringify(state, null, 2)); return state; }
}
async function initData(data) {
  await fsp.mkdir(data, { recursive: true });
  const files = [['artifact.html', 'artifact.html'], ['scene.excalidraw', null]];
  for (const [dest, source] of files) {
    const target = path.join(data, dest);
    try { await fsp.access(target); } catch { await atomicWrite(target, source ? await fsp.readFile(path.join(DEMO, source), 'utf8') : JSON.stringify(initialScene(), null, 2)); }
  }
  await readState(data);
}
function cleanText(value, field) {
  if (typeof value !== 'string' || !value.trim() || value.length > MAX_TEXT) throw new Error(`${field} must be non-empty text of at most ${MAX_TEXT} characters`);
  return value.trim();
}
function anchor(body) {
  if (!body.anchor) return null;
  if (typeof body.anchor !== 'object' || !['html', 'diagram'].includes(body.anchor.kind)) throw new Error('anchor.kind must be html or diagram');
  const id = cleanText(body.anchor.id, 'anchor.id');
  const result = { kind: body.anchor.kind, id };
  if (body.anchor.quote != null) result.quote = cleanText(body.anchor.quote, 'anchor.quote');
  if (body.anchor.label != null) result.label = cleanText(body.anchor.label, 'anchor.label');
  return result;
}
function json(res, status, value) { const body = JSON.stringify(value); res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'content-length': Buffer.byteLength(body) }); res.end(body); }
function error(res, status, message) { json(res, status, { error: message }); }
async function body(req) {
  const contentType = (req.headers['content-type'] || '').split(';', 1)[0].toLowerCase();
  if (contentType !== 'application/json') { const e = new Error('JSON mutation requires application/json'); e.status = 415; throw e; }
  let total = 0; const chunks = [];
  for await (const chunk of req) { total += chunk.length; if (total > MAX_BODY) throw new Error('request body too large'); chunks.push(chunk); }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
async function binaryBody(req, max = 8 * 1024 * 1024) {
  let total = 0; const chunks = [];
  for await (const chunk of req) { total += chunk.length; if (total > max) throw new Error('preview too large'); chunks.push(chunk); }
  return Buffer.concat(chunks);
}
function event(state, type, author, payload, replyTo = null) {
  const item = { id: state.nextEventId++, type, author, createdAt: new Date().toISOString(), replyTo, ...payload, acknowledged: false };
  state.events.push(item); state.revision++;
  return item;
}
function revision(value, field = 'revision') { if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) { const e = new Error(`${field} must be a non-negative integer`); e.status = 400; throw e; } return value; }
function pending(state) { return state.events.filter(e => !e.acknowledged && e.author === 'human'); }
function loopbackHost(req, server) { try { const value = req.headers.host; if (!value || /[@/]/.test(value)) return false; const parsed = new URL(`http://${value}`); const port = parsed.port ? Number(parsed.port) : 80; return !parsed.username && !parsed.password && parsed.pathname === '/' && ['127.0.0.1', 'localhost'].includes(parsed.hostname) && port === server.address().port; } catch { return false; } }
function validOrigin(req, server) { const origin = req.headers.origin; if (!origin) return true; if (origin === 'null') return false; try { const parsed = new URL(origin); const requestHost = new URL(`http://${req.headers.host}`); const port = parsed.port ? Number(parsed.port) : 80; return parsed.protocol === 'http:' && parsed.hostname === requestHost.hostname && ['127.0.0.1', 'localhost'].includes(parsed.hostname) && port === server.address().port && parsed.pathname === '/' && !parsed.username && !parsed.password; } catch { return false; } }
function validPng(bytes) { return bytes.length >= 8 && Buffer.from([137,80,78,71,13,10,26,10]).equals(bytes.subarray(0, 8)); }
function compactScene(scene, sceneRevision) {
  return { revision: sceneRevision, elements: (scene.elements || []).filter(e => !e.isDeleted).map(e => ({ id: e.id, type: e.type, label: e.text || null, x: Math.round(e.x || 0), y: Math.round(e.y || 0), width: Math.round(e.width || 0), height: Math.round(e.height || 0), bindings: [e.startBinding?.elementId, e.endBinding?.elementId].filter(Boolean) })) };
}
function svgEscape(value) { return String(value ?? '').replace(/[&<>\"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&apos;' }[c])); }
function scenePreview(scene) {
  const elements = (scene.elements || []).filter(e => !e.isDeleted).map(e => {
    if (e.type === 'arrow') { const p=e.points?.[1] || [100,0]; return `<line x1="${Number(e.x)||0}" y1="${Number(e.y)||0}" x2="${(Number(e.x)||0)+(Number(p[0])||0)}" y2="${(Number(e.y)||0)+(Number(p[1])||0)}" stroke="#7c3aed" stroke-width="3" marker-end="url(#arrow)"/>`; }
    if (e.type === 'text') return `<text x="${(Number(e.x)||0)+(Number(e.width)||0)/2}" y="${(Number(e.y)||0)+20}" text-anchor="middle" fill="#172033">${svgEscape(e.text)}</text>`;
    return `<rect x="${Number(e.x)||0}" y="${Number(e.y)||0}" width="${Number(e.width)||20}" height="${Number(e.height)||20}" rx="10" fill="${svgEscape(e.backgroundColor || '#fff')}" stroke="${svgEscape(e.strokeColor || '#172033')}" stroke-width="2"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 300" role="img"><defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#7c3aed"/></marker></defs>${elements}</svg>`;
}

async function createServer({ data, port = 4317, host = '127.0.0.1' }) {
  data = safeDataDir(data); await initData(data);
  const workspaceId = createHash('sha256').update(data).digest('hex').slice(0, 24);
  const paths = { dataDir: data, artifactPath: path.join(data, 'artifact.html'), scenePath: path.join(data, 'scene.excalidraw'), previewPath: path.join(data, 'scene-preview.png') };
  const waiters = new Set(); let mutation = Promise.resolve();
  function mutate(fn) {
    const run = mutation.then(async () => {
      const state = await readState(data); const result = await fn(state); await atomicWrite(path.join(data, 'state.json'), JSON.stringify(state, null, 2));
      for (const wake of waiters) wake(); return result;
    });
    mutation = run.catch(() => {});
    return run;
  }
  async function route(req, res) {
    const url = new URL(req.url, `http://${host}`); const method = req.method;
    try {
      if (!loopbackHost(req, server)) return error(res, 403, 'strict loopback Host required');
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && !validOrigin(req, server)) return error(res, 403, 'foreign or null Origin rejected');
      if (method === 'GET' && url.pathname === '/') return staticFile(res, path.join(DEMO, 'index.html'), 'text/html; charset=utf-8');
      if (method === 'GET' && url.pathname.startsWith('/assets/')) { const root=path.resolve(DEMO, 'assets'); const asset=path.resolve(root, decodeURIComponent(url.pathname.slice('/assets/'.length))); if (!asset.startsWith(root + path.sep)) return error(res, 404, 'not found'); return staticFile(res, asset, mimeType(asset)); }
      if (method === 'GET' && url.pathname === '/artifact') {
        const html = await fsp.readFile(path.join(data, 'artifact.html'), 'utf8');
        const bridge = await fsp.readFile(path.join(__dirname, 'artifact-bridge.js'), 'utf8');
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'content-security-policy': "sandbox allow-scripts; default-src 'none'; style-src 'self' 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:;" });
        return res.end(`${html}\n<script>${bridge}</script>`);
      }
      if (method === 'GET' && url.pathname === '/artifact-defaults.css') return staticFile(res, path.join(DEMO, 'artifact-defaults.css'), 'text/css; charset=utf-8', true);
      if (method === 'GET' && url.pathname === '/api/state') {
        const s = await readState(data); return json(res, 200, { workspaceId, paths, revision: s.revision, scene: { ...compactScene(s.scene, s.sceneRevision), previewAvailable: s.previewRevision === s.sceneRevision }, artifactRevision: s.artifactRevision, comments: s.comments, events: s.events.map(({ acknowledged, ...e }) => e) });
      }
      if (method === 'GET' && url.pathname === '/api/events') {
        const afterRaw = url.searchParams.get('after'); const timeoutRaw = url.searchParams.get('wait'); const timeout = Math.min(Math.max(Number(timeoutRaw || 0), 0), 30000);
        if (afterRaw != null && afterRaw !== '' && (!/^(0|[1-9][0-9]*)$/.test(afterRaw) || !Number.isSafeInteger(Number(afterRaw)))) return error(res, 400, 'after must be a non-negative integer');
        const get = async () => pending(await readState(data));
        let found = await get();
        if (!found.length && timeout) await new Promise(resolve => { const timer = setTimeout(() => { waiters.delete(wake); resolve(); }, timeout); const wake = () => { clearTimeout(timer); waiters.delete(wake); resolve(); }; waiters.add(wake); });
        found = await get(); return json(res, 200, { events: found.slice(0, 20) });
      }
      if (method === 'POST' && url.pathname === '/api/ack') {
        const b = await body(req); const id = revision(b.id, 'id');
        const result = await mutate(s => { const e = s.events.find(x => x.id === id); if (!e) throw new Error('event not found'); e.acknowledged = true; return e; }); return json(res, 200, { acknowledged: result.id });
      }
      if (method === 'POST' && ['/api/messages', '/api/comments', '/api/proposals', '/api/replies'].includes(url.pathname)) {
        const b = await body(req); const author = b.author === 'agent' ? 'agent' : 'human'; const message = cleanText(b.message, 'message'); const a = anchor(b);
        const result = await mutate(s => {
          if (url.pathname === '/api/replies') { const replyTo = Number(b.replyTo); if (!s.events.some(e => e.id === replyTo)) throw new Error('replyTo event not found'); const r = event(s, 'reply', author, { message, anchor: a }, replyTo); s.comments.push({ id: `reply-${r.id}`, author, message, anchor: a, replyTo, createdAt: r.createdAt }); return r; }
          const type = url.pathname === '/api/proposals' ? 'proposal' : url.pathname === '/api/comments' ? 'comment' : 'message'; const e = event(s, type, author, { message, anchor: a });
          if (type !== 'message') s.comments.push({ id: `comment-${e.id}`, author, message, anchor: a, proposal: type === 'proposal', createdAt: e.createdAt });
          return e;
        }); return json(res, 201, result);
      }
      if (method === 'GET' && url.pathname === '/api/scene') { const s = await readState(data); return json(res, 200, { revision: s.sceneRevision, scene: s.scene }); }
      if (method === 'GET' && url.pathname === '/api/scene/preview.svg') { const s = await readState(data); const preview=scenePreview(s.scene); res.writeHead(200, { 'content-type':'image/svg+xml; charset=utf-8', 'cache-control':'no-store' }); return res.end(preview); }
      if (method === 'GET' && url.pathname === '/api/scene/preview.png') { const s = await readState(data); if (s.previewRevision !== s.sceneRevision) return error(res, 404, 'current scene has no PNG preview'); return staticFile(res, path.join(data, 'scene-preview.png'), 'image/png', true); }
      if (method === 'PUT' && url.pathname === '/api/scene/preview') {
        const revisionRaw=url.searchParams.get('revision'); if (!/^(0|[1-9][0-9]*)$/.test(revisionRaw || '') || !Number.isSafeInteger(Number(revisionRaw))) return error(res, 400, 'revision must be a non-negative integer'); const revision=Number(revisionRaw); if ((req.headers['content-type'] || '').split(';', 1)[0].toLowerCase() !== 'image/png') return error(res, 415, 'preview must be image/png'); const bytes=await binaryBody(req); if (!validPng(bytes)) return error(res, 400, 'preview is not a PNG');
        await mutate(async s => { if (revision !== s.sceneRevision) { const e=new Error(`stale preview revision: expected ${s.sceneRevision}, got ${revision}`); e.status=409; throw e; } await atomicWrite(path.join(data, 'scene-preview.png'), bytes); s.previewRevision=revision; return s.sceneRevision; }); return json(res, 200, { revision });
      }
      if (method === 'PUT' && url.pathname === '/api/scene') {
        const b = await body(req); const base = revision(b.baseRevision, 'baseRevision');
        const result = await mutate(async s => { if (base !== s.sceneRevision) { const e = new Error(`stale scene revision: expected ${s.sceneRevision}, got ${base}`); e.status = 409; throw e; } if (!b.scene || b.scene.type !== 'excalidraw' || !Array.isArray(b.scene.elements)) throw new Error('scene must be Excalidraw JSON with elements'); s.scene = b.scene; s.sceneRevision++; s.previewRevision = null; const e = event(s, 'scene.changed', b.author === 'agent' ? 'agent' : 'human', { sceneRevision: s.sceneRevision, scene: compactScene(s.scene, s.sceneRevision) }); await atomicWrite(path.join(data, 'scene.excalidraw'), JSON.stringify(s.scene, null, 2)); return { revision: s.sceneRevision, event: e }; });
        return json(res, 200, result);
      }
      if (method === 'PUT' && url.pathname === '/api/artifact') {
        const b = await body(req); const base = revision(b.baseRevision, 'baseRevision'); const html = cleanText(b.html, 'html');
        const result = await mutate(async s => { if (base !== s.artifactRevision) { const e = new Error(`stale artifact revision: expected ${s.artifactRevision}, got ${base}`); e.status = 409; throw e; } await atomicWrite(path.join(data, 'artifact.html'), html); s.artifactRevision++; return event(s, 'artifact.changed', 'agent', { artifactRevision: s.artifactRevision }); });
        return json(res, 200, { revision: result.artifactRevision });
      }
      return error(res, 404, 'not found');
    } catch (e) { return error(res, e.status || (e instanceof SyntaxError ? 400 : 422), e.message); }
  }
  const server = http.createServer((req, res) => { route(req, res); });
  await new Promise(resolve => server.listen(port, '127.0.0.1', resolve));
  return { server, data, address: server.address() };
}
function mimeType(file) { return { '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.woff2':'font/woff2', '.png':'image/png', '.svg':'image/svg+xml' }[path.extname(file)] || 'application/octet-stream'; }
async function staticFile(res, file, type, sandbox = false) { try { const content = await fsp.readFile(file); res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store', 'content-security-policy': sandbox ? "default-src 'none'; style-src 'self' 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:;" : "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data: blob:;", ...(sandbox ? { 'x-content-type-options': 'nosniff' } : {}) }); res.end(content); } catch { error(res, 404, 'not found'); } }

module.exports = { createServer, initialScene, compactScene, initData };

if (require.main === module) {
  const data = process.argv[2] || path.join(process.cwd(), '.sketchpad');
  createServer({ data, port: Number(process.argv[3] || 4317) }).then(({ address }) => console.log(`sketchpad listening at http://${address.address}:${address.port} (data ${data})`));
}
