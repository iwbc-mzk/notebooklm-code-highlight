// NotebookLM Code Highlight - content.js
// Detects <pre><code> blocks in NotebookLM chat and applies syntax highlighting.

const LANGUAGES = ['python', 'go', 'javascript', 'html', 'xml', 'css'];
const DEBOUNCE_MS = 500;

let settings = { enabled: true, theme: 'dark' };
const debounceTimers = new WeakMap();

// Load persisted settings, then start
chrome.storage.sync.get({ enabled: true, theme: 'dark' }, (result) => {
  settings = result;
  applyTheme(settings.theme);
  startObserver();
});

// Reflect settings changes from popup in real time
chrome.storage.onChanged.addListener((changes) => {
  if ('enabled' in changes) {
    settings.enabled = changes.enabled.newValue;
    if (!settings.enabled) removeAllHighlights();
    else processExisting();
  }
  if ('theme' in changes) {
    settings.theme = changes.theme.newValue;
    applyTheme(settings.theme);
  }
});

function applyTheme(theme) {
  document.documentElement.setAttribute('data-hljs-theme', theme);
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
  // Skip if already highlighted with the same text (stable, no streaming)
  if (codeEl.dataset.highlighted === 'true' && codeEl.dataset.lastText === text) return;

  const pre = codeEl.parentElement;
  if (!pre) return;

  // Remove previous decorations before re-rendering
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
    // Chat panel not yet in DOM — wait for it
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
