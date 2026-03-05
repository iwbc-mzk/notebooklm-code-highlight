// NotebookLM Code Highlight - popup.js

const enabledToggle = document.getElementById('enabledToggle');
const mermaidToggle = document.getElementById('mermaidToggle');
const mermaidRow = document.getElementById('mermaidRow');
const themeSection = document.getElementById('themeSection');
const statusBadge = document.getElementById('statusBadge');
const themeRadios = document.querySelectorAll('input[name="theme"]');

// Load current settings and reflect in UI
chrome.storage.sync.get({ enabled: true, theme: 'dark', mermaidEnabled: true }, (settings) => {
  setEnabled(settings.enabled);
  setTheme(settings.theme);
  setMermaidEnabled(settings.mermaidEnabled);
});

// Toggle: enabled/disabled
enabledToggle.addEventListener('change', () => {
  const enabled = enabledToggle.checked;
  setEnabled(enabled);
  chrome.storage.sync.set({ enabled });
});

// Toggle: mermaid
mermaidToggle.addEventListener('change', () => {
  const mermaidEnabled = mermaidToggle.checked;
  setMermaidEnabled(mermaidEnabled);
  chrome.storage.sync.set({ mermaidEnabled });
});

// Theme: dark / light
themeRadios.forEach((radio) => {
  radio.addEventListener('change', () => {
    if (!radio.checked) return;
    const theme = radio.value;
    setTheme(theme);
    chrome.storage.sync.set({ theme });
  });
});

function setEnabled(enabled) {
  enabledToggle.checked = enabled;
  statusBadge.textContent = enabled ? 'ON' : 'OFF';
  statusBadge.classList.toggle('off', !enabled);
  mermaidRow.classList.toggle('disabled', !enabled);
  themeSection.classList.toggle('disabled', !enabled);
}

function setMermaidEnabled(mermaidEnabled) {
  mermaidToggle.checked = mermaidEnabled;
}

function setTheme(theme) {
  themeRadios.forEach((radio) => {
    radio.checked = radio.value === theme;
  });
  document.querySelectorAll('.theme-option').forEach((el) => {
    el.classList.toggle('selected', el.querySelector('input').value === theme);
  });
}
