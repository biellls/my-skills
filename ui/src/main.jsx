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
const documentFingerprint = (elements, files) => JSON.stringify({ elements, files });
const ExcalidrawEditor = React.memo(function ExcalidrawEditor({ initialData, onApi, onChange }) {
  return <Excalidraw initialData={initialData} excalidrawAPI={onApi} onChange={onChange} />;
});

function messageContent(message) {
  const lines = String(message || '').split('\n');
  return lines.map((line, lineIndex) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return <React.Fragment key={lineIndex}>{lineIndex > 0 && <br />}{parts.map((part, index) => part.startsWith('**') && part.endsWith('**') ? <strong key={index}>{part.slice(2, -2)}</strong> : part)}</React.Fragment>;
  });
}
function anchorText(anchor) {
  if (!anchor) return '';
  if (anchor.quote) return `“${anchor.quote}”`;
  return anchor.label || 'selected diagram element';
}
function humanType(type) {
  return type === 'proposal' ? 'Proposal' : type === 'reply' ? 'Reply' : type === 'comment' ? 'Comment' : type === 'scene.changed' ? 'Diagram saved' : 'Message';
}
function humanAuthor(author) { return author === 'agent' ? 'Agent' : 'You'; }

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
  const [sceneOpen, setSceneOpen] = useState(false);
  const [composer, setComposer] = useState({ kind: 'message', anchor: null, replyTo: null });
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
  const composerRef = useRef(null);
  const discussionRef = useRef(null);

  const refresh = async () => {
    try {
      const [nextState, nextScene] = await Promise.all([api('/api/state'), api('/api/scene')]);
      setState(nextState);
      setArtifactRevision((old) => { if (old && old !== nextState.artifactRevision) setArtifactKey((key) => key + 1); return nextState.artifactRevision; });
      if (!loaded.current) {
        loaded.current = true; initialData.current = nextScene.scene; sceneRef.current = nextScene.scene;
        persistedFingerprint.current = documentFingerprint(nextScene.scene.elements, nextScene.scene.files); revisionRef.current = nextScene.revision;
        setScene(nextScene.scene); setSceneRevision(nextScene.revision); setStatus('Ready. Start with the question, a sketch, or a message.');
      } else if (nextScene.revision !== revisionRef.current) {
        if (dirtyRef.current) setConflict('A newer diagram exists. Your unsaved edit is still here; save it after resolving the difference.');
        else {
          syncing.current = true; sceneRef.current = nextScene.scene; persistedFingerprint.current = documentFingerprint(nextScene.scene.elements, nextScene.scene.files);
          revisionRef.current = nextScene.revision; excalidrawApi.current?.updateScene({ elements: nextScene.scene.elements, appState: nextScene.scene.appState, files: nextScene.scene.files });
          setScene(nextScene.scene); setSceneRevision(nextScene.revision); setTimeout(() => { syncing.current = false; }, 0); setStatus('Diagram updated from the workspace.');
        }
      }
    } catch (error) { setStatus(error.message); }
  };
  useEffect(() => { refresh(); const timer = setInterval(refresh, 1500); return () => clearInterval(timer); }, []);
  useEffect(() => {
    const receiveSelection = (event) => { if (event.source !== iframe.current?.contentWindow || event.data?.type !== 'sketchpad-selection') return; setSelectionAnchor(event.data.anchor); };
    window.addEventListener('message', receiveSelection); return () => window.removeEventListener('message', receiveSelection);
  }, []);
  useEffect(() => { if (composer.kind !== 'message' || composer.anchor || composer.replyTo) composerRef.current?.focus(); }, [composer]);

  const submit = async (kind, body) => { await api(`/api/${kind}`, { method: 'POST', body: JSON.stringify({ author: 'human', ...body }) }); await refresh(); };
  const handleChange = useCallback((elements, appState, files) => {
    if (syncing.current) return;
    sceneRef.current = { ...sceneRef.current, elements, appState, files };
    const nextFingerprint = documentFingerprint(elements, files);
    if (!editorInitialized.current) { editorInitialized.current = true; persistedFingerprint.current = nextFingerprint; dirtyRef.current = false; setDirty(false); }
    const nextDirty = editorInitialized.current && nextFingerprint !== persistedFingerprint.current;
    dirtyRef.current = nextDirty; setDirty((old) => old === nextDirty ? old : nextDirty);
    const nextSelection = Object.keys(appState.selectedElementIds || {})[0] || null;
    setSelectedElementId((old) => old === nextSelection ? old : nextSelection);
  }, []);
  const handleExcalidrawApi = useCallback((instance) => { excalidrawApi.current = instance; }, []);
  const saveScene = async () => {
    try {
      setStatus('Exporting a faithful diagram preview…');
      const snapshot = sceneRef.current;
      const persistedScene = JSON.parse(serializeAsJSON(snapshot.elements, snapshot.appState, snapshot.files, 'local'));
      const snapshotFingerprint = documentFingerprint(snapshot.elements, snapshot.files);
      const preview = await exportToBlob({ elements: snapshot.elements, appState: snapshot.appState, files: snapshot.files, mimeType: 'image/png', exportPadding: 16 });
      const saved = await api('/api/scene', { method: 'PUT', body: JSON.stringify({ baseRevision: revisionRef.current, scene: persistedScene }) });
      const previewResponse = await fetch(`/api/scene/preview?revision=${saved.revision}`, { method: 'PUT', headers: { 'content-type': 'image/png' }, body: preview });
      if (!previewResponse.ok) throw new Error(`preview HTTP ${previewResponse.status}`);
      revisionRef.current = saved.revision; setSceneRevision(saved.revision); persistedFingerprint.current = snapshotFingerprint;
      if (documentFingerprint(sceneRef.current.elements, sceneRef.current.files) === snapshotFingerprint) { dirtyRef.current = false; setDirty(false); setConflict(''); setStatus('Saved. The diagram and its preview are up to date.'); }
      else { setConflict('Saved an earlier snapshot; a newer edit remains unsaved.'); setStatus('Your newer edit was preserved. Save again when ready.'); }
      await refresh();
    } catch (error) { setStatus(`Not saved: ${error.message}`); }
  };
  const openComposer = (kind = 'message', anchor = null, replyTo = null) => {
    setComposer({ kind, anchor, replyTo });
    if (anchor) setSelectionAnchor(null);
  };
  const selectedComment = async () => {
    if (!selectedElementId) return setStatus('Select a diagram element first.');
    const element = sceneRef.current.elements.find((item) => item.id === selectedElementId);
    openComposer('proposal', { kind: 'diagram', id: selectedElementId, label: element?.text || 'selected diagram element' });
  };
  const selectionComment = async () => {
    if (!selectionAnchor) return setStatus('Select text inside the artifact first.');
    openComposer('comment', selectionAnchor);
  };
  const sendComposer = async (event) => {
    event.preventDefault();
    if (!message.trim()) return;
    try {
      const endpoint = composer.replyTo ? 'replies' : composer.kind === 'proposal' ? 'proposals' : composer.kind === 'comment' ? 'comments' : 'messages';
      const body = { message, anchor: composer.anchor || undefined, replyTo: composer.replyTo || undefined };
      await submit(endpoint, body); setMessage(''); setComposer({ kind: 'message', anchor: null, replyTo: null }); setStatus('Added to the conversation.');
    } catch (error) { setStatus(error.message); }
  };
  if (!scene || !state) return <main className="loading">{status}</main>;
  const visibleEvents = state.events.filter((event) => event.type !== 'artifact.changed');
  const composerLabel = composer.replyTo ? 'Reply to this thought' : composer.kind === 'comment' ? 'Comment on the selected passage' : composer.kind === 'proposal' ? 'Make a proposal about the diagram' : 'Add to the conversation';
  return <>
    <header className="topbar">
      <div className="brand"><div className="brand-mark" aria-hidden="true">✦</div><div><h1>Sketchpad</h1><p>A calm space for questions, sketches, and useful disagreement.</p></div></div>
      <div className="workspace-state"><span className="live-dot" />Local workspace</div>
    </header>
    <main className="workspace">
      <section className="reading-column">
        <div className="section-heading"><div><p className="kicker">Working canvas</p><h2>Make the question visible</h2></div><span className="revision">Draft {artifactRevision + 1}</span></div>
        <div className="artifact-card"><iframe key={artifactKey} ref={iframe} src={`/artifact?revision=${artifactRevision}`} title="Working idea canvas" /></div>
        <div className="artifact-actions"><button className="secondary" onClick={selectionComment}>Comment on selected passage</button><span className="selection-note">{selectionAnchor ? `Selected: ${anchorText(selectionAnchor)}` : 'Select a phrase above to leave an anchored note.'}</span></div>
      </section>
      <aside className="discussion-column" ref={discussionRef}>
        <div className="section-heading discussion-heading"><div><p className="kicker">Think together</p><h2>Conversation</h2></div><span className="count">{visibleEvents.length}</span></div>
        <div className="conversation-list">{visibleEvents.length ? visibleEvents.map((event) => <article className={`thought ${event.type === 'proposal' ? 'is-proposal' : ''}`} key={event.id}>
          <div className="thought-meta"><span className={`author ${event.author}`}>{humanAuthor(event.author)}</span><span className="thought-type">{humanType(event.type)}</span><span className="thought-time">{event.replyTo ? 'in reply' : ''}</span></div>
          <div className="thought-body">{event.type === 'scene.changed' ? 'The diagram was saved.' : messageContent(event.message || '')}</div>
          {event.anchor && <div className="anchor-chip"><span aria-hidden="true">↳</span> {anchorText(event.anchor)}</div>}
          <button className="reply-link" onClick={() => openComposer('message', null, event.id)}>Reply</button>
        </article>) : <div className="empty-state"><div className="empty-icon">◌</div><strong>Nothing decided yet</strong><p>Bring a question, observation, or small alternative here. The useful thread starts with you.</p></div>}</div>
        <form className="composer" onSubmit={sendComposer}>
          {(composer.anchor || composer.replyTo) && <div className="composer-context"><span>{composerLabel}</span><button type="button" className="dismiss" onClick={() => setComposer({ kind: 'message', anchor: null, replyTo: null })} aria-label="Cancel context">×</button>{composer.anchor && <small>{anchorText(composer.anchor)}</small>}</div>}
          <textarea ref={composerRef} value={message} onChange={(event) => setMessage(event.target.value)} placeholder={composerLabel + '…'} aria-label={composerLabel} />
          <div className="composer-footer"><span className="hint">Enter your perspective; suggestions stay proposals.</span><button className="primary" disabled={!message.trim()}>Send</button></div>
        </form>
      </aside>
      <section className={`diagram-section ${sceneOpen ? 'is-open' : ''}`}>
        <div className="diagram-summary"><div><p className="kicker">Optional, editable</p><h2>Diagram <span className="source-pill">saved with the workspace</span></h2><p>Use a native canvas when a picture clarifies the conversation. It is not required.</p></div><button className="secondary open-diagram" onClick={() => setSceneOpen((open) => !open)}>{sceneOpen ? 'Close editor' : 'Open diagram editor'} <span aria-hidden="true">{sceneOpen ? '↑' : '↓'}</span></button></div>
        {sceneOpen && <div className="diagram-editor-wrap"><div className="editor-shell"><ExcalidrawEditor initialData={initialData.current || scene} onApi={handleExcalidrawApi} onChange={handleChange} /></div><div className="diagram-tools"><button className="primary" onClick={saveScene}>Save diagram + preview</button><button className="secondary" onClick={selectedComment}>Propose on selected element</button><button className="secondary" onClick={() => { const blob = new Blob([JSON.stringify(sceneRef.current, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'workspace.excalidraw'; link.click(); }}>Export diagram</button><span className="save-status">{conflict || status} {dirty && ' · unsaved edit'}</span></div></div>}
      </section>
      <button className="mobile-discuss" onClick={() => { discussionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); setTimeout(() => composerRef.current?.focus(), 350); }}>Discuss <span aria-hidden="true">↓</span></button>
    </main>
  </>;
}
createRoot(document.getElementById('root')).render(<App />);
