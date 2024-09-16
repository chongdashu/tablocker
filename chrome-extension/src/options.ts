import { TabStats } from './types';

const blockedCountElement = document.getElementById('blockedCount') as HTMLSpanElement;
const allowedCountElement = document.getElementById('allowedCount') as HTMLSpanElement;
const enableNotificationsCheckbox = document.getElementById(
  'enableNotifications'
) as HTMLInputElement;

function updateStats() {
  chrome.storage.local.get('tabStats', data => {
    const stats: TabStats = data.tabStats || { blocked: 0, allowed: 0 };
    blockedCountElement.textContent = stats.blocked.toString();
    allowedCountElement.textContent = stats.allowed.toString();
  });
}

function updateSettings() {
  chrome.storage.sync.get('settings', data => {
    const settings = data.settings || { enableNotifications: false };
    enableNotificationsCheckbox.checked = settings.enableNotifications;
  });
}

enableNotificationsCheckbox.addEventListener('change', () => {
  chrome.storage.sync.set({
    settings: { enableNotifications: enableNotificationsCheckbox.checked },
  });
});

// Add this new function to listen for storage changes
function listenForStorageChanges() {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.tabStats) {
      updateStats();
    }
  });
}

updateStats();
updateSettings();
listenForStorageChanges(); // Add this line to start listening for changes
