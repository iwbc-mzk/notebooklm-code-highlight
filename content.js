// NotebookLM Code Highlight - content.js
// Detects <pre><code> blocks in NotebookLM chat and applies syntax highlighting.
// Mermaid classDiagram blocks are rendered as diagrams instead.

const LANGUAGES = ['python', 'go', 'javascript', 'html', 'xml', 'css'];
const DEBOUNCE_MS = 500;

let settings = { enabled: true, theme: 'dark', mermaidEnabled: true };
const debounceTimers = new WeakMap();

// Load persisted settings, then start
chrome.storage.sync.get({ enabled: true, theme: 'dark', mermaidEnabled: true }, (result) => {
  settings = result;
  applyTheme(settings.theme);
  initMermaid();
  startObserver();
});

// Reflect settings changes from popup in real time
chrome.storage.onChanged.addListener((changes) => {
  if ('enabled' in changes) {
    settings.enabled = changes.enabled.newValue;
    if (!settings.enabled) {
      removeAllHighlights();
      removeAllMermaidDiagrams();
    } else {
      processExisting();
    }
  }
  if ('theme' in changes) {
    settings.theme = changes.theme.newValue;
    applyTheme(settings.theme);
    if (settings.mermaidEnabled) {
      initMermaid();
      rerenderAllMermaid();
    }
  }
  if ('mermaidEnabled' in changes) {
    settings.mermaidEnabled = changes.mermaidEnabled.newValue;
    if (!settings.mermaidEnabled) {
      removeAllMermaidDiagrams();
      // Re-highlight former mermaid blocks as code
      document.querySelectorAll('.message-text-content pre > code').forEach(scheduleHighlight);
    } else {
      processExisting();
    }
  }
});

function applyTheme(theme) {
  document.documentElement.setAttribute('data-hljs-theme', theme);
}

// ---- Mermaid ----

function initMermaid() {
  mermaid.initialize({
    startOnLoad: false,
    theme: settings.theme === 'dark' ? 'dark' : 'default',
    securityLevel: 'strict',
  });
}

function isMermaidCode(text) {
  return /^\s*classDiagram\b/.test(text);
}

async function renderMermaid(codeEl, text) {
  const pre = codeEl.parentElement;
  if (!pre) return;

  // Remove previous diagram container if re-rendering
  const existing = pre.previousElementSibling;
  if (existing?.classList.contains('mermaid-container')) existing.remove();

  try {
    const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const { svg } = await mermaid.render(id, text);

    const container = document.createElement('div');
    container.className = 'mermaid-container';
    container.innerHTML = svg;

    pre.parentElement.insertBefore(container, pre);
    pre.style.display = 'none';
    pre.dataset.mermaidRendered = 'true';
  } catch (err) {
    console.warn('[NotebookLM Code Highlight] Mermaid render error:', err);
    // Rendering failed: keep code block visible as-is
    pre.style.display = '';
    delete pre.dataset.mermaidRendered;
  }
}

function removeMermaidDiagram(pre) {
  const container = pre.previousElementSibling;
  if (container?.classList.contains('mermaid-container')) container.remove();
  pre.style.display = '';
  delete pre.dataset.mermaidRendered;
  // Reset highlight state so hljs re-applies on next scheduleHighlight
  const codeEl = pre.querySelector('code');
  if (codeEl) codeEl.dataset.highlighted = '';
}

function removeAllMermaidDiagrams() {
  document.querySelectorAll('pre[data-mermaid-rendered="true"]').forEach(removeMermaidDiagram);
}

function rerenderAllMermaid() {
  document.querySelectorAll('pre[data-mermaid-rendered="true"] > code').forEach((codeEl) => {
    const text = codeEl.dataset.lastText;
    if (!text) return;
    const pre = codeEl.parentElement;
    const existing = pre?.previousElementSibling;
    if (existing?.classList.contains('mermaid-container')) existing.remove();
    renderMermaid(codeEl, text);
  });
}

// ---- Highlight logic ----

function scheduleHighlight(codeEl) {
  if (debounceTimers.has(codeEl)) clearTimeout(debounceTimers.get(codeEl));
  debounceTimers.set(
    codeEl,
    setTimeout(() => {
      debounceTimers.delete(codeEl);
      highlightElement(codeEl);
    }, DEBOUNCE_MS)
  );
}

function highlightElement(codeEl) {
  if (!settings.enabled) return;

  const text = codeEl.textContent;
  const pre = codeEl.parentElement;
  if (!pre) return;

  // ---- Mermaid path ----
  if (settings.mermaidEnabled && isMermaidCode(text)) {
    if (pre.dataset.mermaidRendered === 'true' && codeEl.dataset.lastText === text) return;
    codeEl.dataset.lastText = text;
    renderMermaid(codeEl, text);
    return;
  }

  // If previously rendered as mermaid, clean up before applying hljs
  if (pre.dataset.mermaidRendered === 'true') {
    removeMermaidDiagram(pre);
  }

  // ---- hljs path ----
  if (codeEl.dataset.highlighted === 'true' && codeEl.dataset.lastText === text) return;

  pre.querySelectorAll('.hljs-lang-label, .hljs-copy-btn').forEach((el) => el.remove());

  const result = hljs.highlightAuto(text, LANGUAGES);
  codeEl.innerHTML = result.value;
  codeEl.dataset.highlighted = 'true';
  codeEl.dataset.lastText = text;

  const lang = result.language || '';
  pre.classList.add('hljs-pre');
  codeEl.classList.add('hljs');

  // Language label (top-left)
  const label = document.createElement('div');
  label.className = 'hljs-lang-label';
  label.textContent = lang;
  pre.appendChild(label);

  // Copy button (top-right)
  const copyBtn = document.createElement('button');
  copyBtn.className = 'hljs-copy-btn';
  copyBtn.textContent = 'Copy';
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
    });
  });
  pre.appendChild(copyBtn);
}

function removeAllHighlights() {
  document.querySelectorAll('code[data-highlighted="true"]').forEach((codeEl) => {
    const pre = codeEl.parentElement;
    if (pre) pre.querySelectorAll('.hljs-lang-label, .hljs-copy-btn').forEach((el) => el.remove());
    codeEl.innerHTML = codeEl.dataset.lastText || codeEl.textContent;
    codeEl.dataset.highlighted = '';
    codeEl.dataset.lastText = '';
    codeEl.classList.remove('hljs');
    pre?.classList.remove('hljs-pre');
  });
}

function processExisting() {
  document.querySelectorAll('.message-text-content pre > code').forEach(scheduleHighlight);
}

// ---- MutationObserver ----

function findCodeElFromNode(node) {
  if (node.nodeType === Node.ELEMENT_NODE) {
    if (node.matches('code') && node.parentElement?.matches('pre')) return node;
    if (node.matches('pre')) return node.querySelector(':scope > code') || null;
    return node.querySelector('pre > code') || null;
  }
  if (node.nodeType === Node.TEXT_NODE) {
    const el = node.parentElement?.closest('code');
    if (el && el.parentElement?.matches('pre')) return el;
  }
  return null;
}

const observer = new MutationObserver((mutations) => {
  if (!settings.enabled) return;
  const seen = new Set();

  for (const mutation of mutations) {
    const candidates = [];

    if (mutation.type === 'childList') {
      for (const node of mutation.addedNodes) {
        candidates.push(findCodeElFromNode(node));
      }
      candidates.push(findCodeElFromNode(mutation.target));
    } else if (mutation.type === 'characterData') {
      const el = mutation.target.parentElement?.closest('code');
      if (el?.parentElement?.matches('pre')) candidates.push(el);
    }

    for (const codeEl of candidates) {
      if (codeEl && !seen.has(codeEl)) {
        seen.add(codeEl);
        scheduleHighlight(codeEl);
      }
    }
  }
});

function startObserver() {
  const chatPanel = document.querySelector('.chat-panel-content');
  if (chatPanel) {
    attachObserver(chatPanel);
    processExisting();
  } else {
    const panelWatcher = new MutationObserver(() => {
      const panel = document.querySelector('.chat-panel-content');
      if (panel) {
        panelWatcher.disconnect();
        attachObserver(panel);
        processExisting();
      }
    });
    panelWatcher.observe(document.body, { childList: true, subtree: true });
  }
}

function attachObserver(target) {
  observer.observe(target, { childList: true, subtree: true, characterData: true });
}
