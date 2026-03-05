// NotebookLM Code Highlight - popup.js

const enabledToggle = document.getElementById('enabledToggle');
const statusBadge = document.getElementById('statusBadge');
const themeRadios = document.querySelectorAll('input[name="theme"]');

// Load current settings and reflect in UI
chrome.storage.sync.get({ enabled: true, theme: 'dark' }, (settings) => {
  setEnabled(settings.enabled);
  setTheme(settings.theme);
});

// Toggle: enabled/disabled
enabledToggle.addEventListener('change', () => {
  const enabled = enabledToggle.checked;
  setEnabled(enabled);
  chrome.storage.sync.set({ enabled });
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
  document.querySelector('.popup-container').classList.toggle('disabled', !enabled);
}

function setTheme(theme) {
  themeRadios.forEach((radio) => {
    radio.checked = radio.value === theme;
  });
  document.querySelectorAll('.theme-option').forEach((el) => {
    el.classList.toggle('selected', el.querySelector('input').value === theme);
  });
}
