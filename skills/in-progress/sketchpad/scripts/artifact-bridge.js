// Injected only into the sandboxed preview; never written into the author's HTML.
(() => {
  const reportSelection = () => {
    const selection = window.getSelection();
    const quote = selection?.toString().trim();
    const node = selection?.anchorNode;
    const element = (node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement)?.closest('[id]');
    if (quote && element) parent.postMessage({
      type: 'sketchpad-selection',
      anchor: { kind: 'html', id: element.id, quote: quote.slice(0, 12000) },
    }, '*');
  };
  document.addEventListener('mouseup', reportSelection);
  document.addEventListener('keyup', reportSelection);
})();
