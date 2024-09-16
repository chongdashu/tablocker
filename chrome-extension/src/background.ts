import type { BlockedSite, TabStats, DailyStats, BlockedPattern, BlockedDetail } from './types';
import { matchesWildcard } from './utils';

(async function () {
  // Wait for the Chrome APIs to be available
  while (!chrome || !chrome.storage || !chrome.storage.local || !chrome.tabs) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  console.log('Chrome APIs are available');

  // Now we can safely use Chrome APIs
  chrome.runtime.onInstalled.addListener(initializeExtension);
  initializeExtension();

  function initializeExtension() {
    console.log('Initializing extension');

    // Set initial badge
    updateBadge();

    // Listen for new tab creation
    chrome.tabs.onCreated.addListener(tab => {
      console.log('New tab created:', tab);

      // Retrieve the list of blocked sites from storage
      chrome.storage.local.get('blockedSites', result => {
        const blockedSites = result.blockedSites || [];
        console.log('Retrieved blocked sites:', blockedSites);

        // Get the URL of the new tab (pending or current)
        const url = tab.pendingUrl || tab.url;
        console.log('Tab URL:', url);

        if (url && blockedSites.length > 0) {
          checkIfBlocked(url, blockedSites).then(({ isBlocked, pattern }) => {
            if (isBlocked) {
              console.log('Attempting to remove blocked tab');
              // If the site is blocked, attempt to remove the tab
              chrome.tabs.remove(tab.id!, (wasRemoved: boolean) => {
                if (!wasRemoved) {
                  console.error(`Failed to remove blocked tab with id ${tab.id}`);
                } else {
                  console.log(`Successfully removed blocked tab with id ${tab.id}`);
                  // Show toast notification
                  chrome.tabs.create({ url: 'toast.html?message=URL was automatically shut' });
                }
                // Update the stats to reflect a blocked tab, regardless of removal success
                updateStats('blocked', pattern, url);
              });
            } else {
              console.log('URL is not blocked, allowing tab to open');
            }
          });
        } else {
          console.log('No URL or no blocked sites, skipping check');
        }
      });
    });

    // Listen for tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      console.log('Tab updated:', tabId, changeInfo, tab);
      // If the tab is loading and has a URL
      if (changeInfo.status === 'loading' && tab.url) {
        console.log('Tab is loading, checking if URL is blocked');
        // Retrieve the list of blocked sites and blocking state from storage
        chrome.storage.local.get(['blockedSites', 'isBlocking'], result => {
          const blockedSites = result.blockedSites || [];
          const isBlocking = result.isBlocking !== false; // Default to true if not set
          console.log('Retrieved blocked sites:', blockedSites);
          console.log('Is blocking enabled:', isBlocking);

          if (isBlocking) {
            // Check if the URL matches any of the blocked site patterns
            const isBlocked = blockedSites.some((site: BlockedSite) =>
              matchesWildcard(tab.url!, site.pattern)
            );
            if (isBlocked) {
              console.log('URL is blocked, removing tab');
              chrome.tabs.remove(tabId, () => {
                if (chrome.runtime.lastError) {
                  console.error('Failed to remove blocked tab:', chrome.runtime.lastError);
                } else {
                  console.log('Successfully removed blocked tab');
                  updateStats('blocked', tab.url!, tab.url!);
                  // Show toast notification
                  chrome.tabs.create({ url: 'toast.html?message=URL was automatically shut' });
                }
              });
            } else {
              console.log('URL is not blocked');
              // Remove the updateStats call for 'allowed'
            }
          } else {
            console.log('Blocking is disabled, allowing all URLs');
            // Remove the updateStats call for 'allowed'
          }
        });
      }
    });
  }

  // Function to update tab statistics
  function updateStats(type: 'blocked', pattern: string, url: string) {
    console.log(`Updating stats: ${type}, pattern: ${pattern}, url: ${url}`);
    const today = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toISOString();

    chrome.storage.local.get(['tabStats', 'dailyStats', 'blockedPatterns', 'blockedDetails'], result => {
      const tabStats: TabStats = result.tabStats || { blocked: 0 };
      const dailyStats: { [date: string]: DailyStats } = result.dailyStats || {};
      const blockedPatterns: BlockedPattern = result.blockedPatterns || {};
      const blockedDetails: BlockedDetail[] = result.blockedDetails || [];

      // Update total blocked count
      tabStats.blocked++;

      // Update daily stats
      if (!dailyStats[today]) {
        dailyStats[today] = { blocked: 0 };
      }
      dailyStats[today].blocked++;

      // Update blocked patterns
      if (!blockedPatterns[pattern]) {
        blockedPatterns[pattern] = { count: 0, lastBlocked: '' };
      }
      blockedPatterns[pattern].count++;
      blockedPatterns[pattern].lastBlocked = timestamp;

      // Update blocked details
      blockedDetails.push({ url, pattern, timestamp });

      console.log('Updated stats:', { tabStats, dailyStats, blockedPatterns, blockedDetails });
      chrome.storage.local.set({ tabStats, dailyStats, blockedPatterns, blockedDetails });
    });
  }

  function checkIfBlocked(url: string, blockedSites: BlockedSite[]): Promise<{ isBlocked: boolean; pattern: string }> {
    return chrome.storage.local.get('isBlocking').then(result => {
      const isBlocking = result.isBlocking !== false;
      updateBadge(isBlocking);
      if (!isBlocking) {
        console.log('Blocking is disabled');
        return { isBlocked: false, pattern: '' };
      }

      console.log('Checking if URL is blocked');
      for (const site of blockedSites) {
        const matches = matchesWildcard(url, site.pattern);
        console.log(`Checking pattern ${site.pattern}: ${matches ? 'Matched' : 'Not matched'}`);
        if (matches) {
          return { isBlocked: true, pattern: site.pattern };
        }
      }
      return { isBlocked: false, pattern: '' };
    });
  }

  // Modify the updateBadge function
  function updateBadge(isBlocking?: boolean) {
    chrome.storage.sync.get('settings', (settingsData) => {
      const settings = settingsData.settings || { enableBadges: true };

      if (settings.enableBadges) {
        chrome.storage.local.get('isBlocking', result => {
          const blocking = isBlocking !== undefined ? isBlocking : result.isBlocking !== false;
          if (blocking) {
            chrome.action.setBadgeText({ text: '✓' });
            chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' }); // Green
          } else {
            chrome.action.setBadgeText({ text: '✗' });
            chrome.action.setBadgeBackgroundColor({ color: '#F44336' }); // Red
          }
        });
      } else {
        chrome.action.setBadgeText({ text: '' });
      }
    });
  }

  // Add a listener for settings changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.settings) {
      const newSettings = changes.settings.newValue;
      if (newSettings.enableBadges !== undefined) {
        updateBadge(); // This will update the badge based on the new setting
      }
    }
    if (namespace === 'local' && changes.isBlocking) {
      updateBadge(changes.isBlocking.newValue);
    }
  });
})();
