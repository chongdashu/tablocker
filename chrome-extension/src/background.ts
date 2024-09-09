/// <reference types="chrome" />

import type { BlockedSite, TabStats } from './types';
import { matchesWildcard } from './utils';

chrome.tabs.onCreated.addListener(async tab => {
  const { blockedSites } = await chrome.storage.sync.get('blockedSites');
  const url = tab.pendingUrl || tab.url;

  if (url && blockedSites) {
    const isBlocked = blockedSites.some((site: BlockedSite) => matchesWildcard(url, site.pattern));
    if (isBlocked) {
      chrome.tabs.remove(tab.id!);
      updateStats('blocked');
    }
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    updateStats('allowed');
  }
});

async function updateStats(type: 'blocked' | 'allowed') {
  const { tabStats } = await chrome.storage.sync.get('tabStats');
  const stats: TabStats = tabStats || { blocked: 0, allowed: 0 };
  stats[type]++;
  await chrome.storage.sync.set({ tabStats: stats });
}
