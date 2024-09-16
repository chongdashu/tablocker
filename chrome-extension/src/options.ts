import { TabStats } from './types';

const blockedCountElement = document.getElementById('blockedCount') as HTMLSpanElement;

const enableBadgesCheckbox = document.getElementById(
  'enableBadges'
) as HTMLInputElement;

function updateStats() {
  chrome.storage.local.get('tabStats', data => {
    const stats: TabStats = data.tabStats || { blocked: 0 };
    blockedCountElement.textContent = stats.blocked.toString();
  });
}

function updateSettings() {
  chrome.storage.sync.get('settings', data => {
    const settings = data.settings || { enableBadges: true };
    enableBadgesCheckbox.checked = settings.enableBadges;
  });
}

enableBadgesCheckbox.addEventListener('change', () => {
  chrome.storage.sync.set({
    settings: { enableBadges: enableBadgesCheckbox.checked },
  });
});

function listenForStorageChanges() {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.tabStats) {
      updateStats();
    }
  });
}

updateStats();
updateSettings();
listenForStorageChanges();
