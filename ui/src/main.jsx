import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Excalidraw, exportToBlob, serializeAsJSON } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import './styles.css';

const api = async (url, options) => {
  const response = await fetch(url, { ...options, headers: { ...(options?.body instanceof Blob ? {} : { 'content-type': 'application/json' }), ...(options?.headers || {}) } });
  const content = await response.text();
  let data; try { data = JSON.parse(content); } catch { data = { text: content }; }
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
};
const escapeText = (value) => String(value ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const documentFingerprint = (elements, files) => JSON.stringify({ elements, files });
const ExcalidrawEditor = React.memo(function ExcalidrawEditor({ initialData, onApi, onChange }) {
  return <Excalidraw initialData={initialData} excalidrawAPI={onApi} onChange={onChange} />;
});

function App() {
  const [state, setState] = useState(null);
  const [scene, setScene] = useState(null);
  const [sceneRevision, setSceneRevision] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [conflict, setConflict] = useState('');
  const [message, setMessage] = useState('');
  const [selectionAnchor, setSelectionAnchor] = useState(null);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [status, setStatus] = useState('Loading workspace…');
  const [artifactRevision, setArtifactRevision] = useState(0);
  const [artifactKey, setArtifactKey] = useState(0);
  const excalidrawApi = useRef(null);
  const initialData = useRef(null);
  const iframe = useRef(null);
  const syncing = useRef(false);
  const loaded = useRef(false);
  const sceneRef = useRef(null);
  const revisionRef = useRef(0);
  const dirtyRef = useRef(false);
  const persistedFingerprint = useRef('');
  const editorInitialized = useRef(false);

  const refresh = async () => {
    try {
      const [nextState, nextScene] = await Promise.all([api('/api/state'), api('/api/scene')]);
      setState(nextState);
      setArtifactRevision((old) => { if (old && old !== nextState.artifactRevision) setArtifactKey((key) => key + 1); return nextState.artifactRevision; });
      if (!loaded.current) { loaded.current = true; initialData.current = nextScene.scene; sceneRef.current = nextScene.scene; persistedFingerprint.current = documentFingerprint(nextScene.scene.elements, nextScene.scene.files); revisionRef.current = nextScene.revision; setScene(nextScene.scene); setSceneRevision(nextScene.revision); setStatus('Ready. Sketch, select, or send a question.'); }
      else if (nextScene.revision !== revisionRef.current) {
        if (dirtyRef.current) setConflict('A newer scene exists. Your unsaved human edit remains here; save it only after resolving the conflict.');
        else { syncing.current = true; sceneRef.current = nextScene.scene; persistedFingerprint.current = documentFingerprint(nextScene.scene.elements, nextScene.scene.files); revisionRef.current = nextScene.revision; excalidrawApi.current?.updateScene({ elements: nextScene.scene.elements, appState: nextScene.scene.appState, files: nextScene.scene.files }); setScene(nextScene.scene); setSceneRevision(nextScene.revision); setTimeout(() => { syncing.current = false; }, 0); setStatus('Scene updated from the authoritative workspace.'); }
      }
    } catch (error) { setStatus(error.message); }
  };
  useEffect(() => { refresh(); const timer = setInterval(refresh, 1500); return () => clearInterval(timer); }, []);
  useEffect(() => {
    const receiveSelection = (event) => { if (event.source !== iframe.current?.contentWindow || event.data?.type !== 'sketchpad-selection') return; setSelectionAnchor(event.data.anchor); };
    window.addEventListener('message', receiveSelection); return () => window.removeEventListener('message', receiveSelection);
  }, []);

  const submit = async (kind, body) => { await api(`/api/${kind}`, { method: 'POST', body: JSON.stringify({ author: 'human', ...body }) }); await refresh(); };
  const handleChange = useCallback((elements, appState, files) => {
    if (syncing.current) return;
    sceneRef.current = { ...sceneRef.current, elements, appState, files };
    const nextFingerprint = documentFingerprint(elements, files);
    if (!editorInitialized.current) { editorInitialized.current = true; persistedFingerprint.current = nextFingerprint; dirtyRef.current = false; setDirty(false); }
    const nextDirty = editorInitialized.current && nextFingerprint !== persistedFingerprint.current;
    dirtyRef.current = nextDirty;
    setDirty((old) => old === nextDirty ? old : nextDirty);
    const nextSelection = Object.keys(appState.selectedElementIds || {})[0] || null;
    setSelectedElementId((old) => old === nextSelection ? old : nextSelection);
  }, []);
  const handleExcalidrawApi = useCallback((instance) => { excalidrawApi.current = instance; }, []);
  const saveScene = async () => {
    try {
      setStatus('Exporting a faithful PNG preview…');
      const snapshot = sceneRef.current;
      const persistedScene = JSON.parse(serializeAsJSON(snapshot.elements, snapshot.appState, snapshot.files, 'local'));
      const snapshotFingerprint = documentFingerprint(snapshot.elements, snapshot.files);
      const preview = await exportToBlob({ elements: snapshot.elements, appState: snapshot.appState, files: snapshot.files, mimeType: 'image/png', exportPadding: 16 });
      const saved = await api('/api/scene', { method: 'PUT', body: JSON.stringify({ baseRevision: revisionRef.current, scene: persistedScene }) });
      const previewResponse = await fetch(`/api/scene/preview?revision=${saved.revision}`, { method: 'PUT', headers: { 'content-type': 'image/png' }, body: preview });
      if (!previewResponse.ok) throw new Error(`preview HTTP ${previewResponse.status}`);
      revisionRef.current = saved.revision; setSceneRevision(saved.revision); persistedFingerprint.current = snapshotFingerprint;
      if (documentFingerprint(sceneRef.current.elements, sceneRef.current.files) === snapshotFingerprint) { dirtyRef.current = false; setDirty(false); setConflict(''); setStatus('Saved. Native Excalidraw scene and official PNG preview are authoritative.'); } else { setConflict('Saved an earlier snapshot; a newer local human edit remains unsaved.'); setStatus('Your newer human edit was preserved. Save again when ready.'); }
      await refresh();
    } catch (error) { setStatus(`Not saved: ${error.message}`); }
  };
  const selectedComment = async () => {
    if (!selectedElementId) return setStatus('Select a diagram element first.');
    const text = window.prompt('Proposal or comment on this Excalidraw element', 'I propose…'); if (!text) return;
    await submit('proposals', { message: text, anchor: { kind: 'diagram', id: selectedElementId, label: sceneRef.current.elements.find((e) => e.id === selectedElementId)?.text || selectedElementId } });
  };
  const selectionComment = async () => {
    if (!selectionAnchor) return setStatus('Select text inside the artifact first.');
    const text = window.prompt('Comment on selection', 'I notice…'); if (!text) return;
    await submit('comments', { message: text, anchor: selectionAnchor }); setSelectionAnchor(null); setStatus('Anchored comment queued.');
  };
  if (!scene || !state) return <main className="loading">{status}</main>;
  return <>
    <header><h1>Sketchpad <small>exploratory browser collaboration</small></h1><small>artifact r{artifactRevision} · scene r{sceneRevision}</small></header>
    <main className="layout">
      <section className="panel artifact"><h2>Idea artifact</h2><iframe key={artifactKey} ref={iframe} sandbox="allow-scripts" src={`/artifact?revision=${artifactRevision}`} title="Isolated idea artifact" /><div className="tools"><button onClick={selectionComment}>Comment on selection</button><span className="status">{selectionAnchor ? `Selected ${selectionAnchor.id}: “${selectionAnchor.quote}”` : 'Select a phrase in the artifact.'}</span></div></section>
      <section className="panel scene"><h2>Native Excalidraw scene <span className="badge">authoritative</span></h2><div className="editor-shell"><ExcalidrawEditor initialData={initialData.current || scene} onApi={handleExcalidrawApi} onChange={handleChange} /></div><div className="tools"><button className="primary" onClick={saveScene}>Save scene + PNG preview</button><button onClick={selectedComment}>Comment/propose on selection</button><button onClick={() => { const blob = new Blob([JSON.stringify(sceneRef.current, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'workspace.excalidraw'; link.click(); }}>Export .excalidraw</button></div><div className="status">{conflict || status} {dirty && ' · unsaved human edit'}</div></section>
      <section className="panel conversation"><h2>Conversation</h2><div className="scroll">{state.events.map((event) => <article className={event.type === 'proposal' ? 'proposal' : ''} key={event.id}><b className={`author ${event.author}`}>{escapeText(event.author)}</b> <strong>{escapeText(event.type)}</strong><p>{escapeText(event.message || 'Scene changed')}</p>{event.anchor && <small className="anchor">{escapeText(event.anchor.kind)}:{escapeText(event.anchor.id)} {event.anchor.quote && `“${escapeText(event.anchor.quote)}”`}</small>}<small>event #{event.id}</small></article>)}</div><form onSubmit={async (event) => { event.preventDefault(); if (!message.trim()) return; await submit('messages', { message }); setMessage(''); }}><textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Question, example, or uncertainty…" /><button className="primary">Send message</button></form></section>
      <section className="panel comments"><h2>Anchored comments</h2><div className="scroll">{state.comments.length ? state.comments.map((comment) => <article className={comment.proposal ? 'proposal' : ''} key={comment.id}><b className={`author ${comment.author}`}>{escapeText(comment.author)}</b>{comment.proposal && ' proposal'}<p>{escapeText(comment.message)}</p>{comment.anchor && <small className="anchor">{escapeText(comment.anchor.kind)}:{escapeText(comment.anchor.id)} {comment.anchor.quote && `“${escapeText(comment.anchor.quote)}”`}</small>}</article>) : <span className="status">No comments yet.</span>}</div></section>
    </main>
  </>;
}
createRoot(document.getElementById('root')).render(<App />);
