import type { BlockedSite, TabStats } from './types';
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
          checkIfBlocked(url, blockedSites).then((isBlocked: boolean) => {
            console.log('Is URL blocked?', isBlocked);

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
                updateStats('blocked');
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
                  updateStats('blocked');
                  // Show toast notification
                  chrome.tabs.create({ url: 'toast.html?message=URL was automatically shut' });
                }
              });
            } else {
              console.log('URL is not blocked');
              // If the tab has finished loading and is not blocked
              if (changeInfo.status === 'complete') {
                console.log('Tab finished loading, updating stats');
                updateStats('allowed');
              }
            }
          } else {
            console.log('Blocking is disabled, allowing all URLs');
            if (changeInfo.status === 'complete') {
              console.log('Tab finished loading, updating stats');
              updateStats('allowed');
            }
          }
        });
      }
    });
  }

  // Function to update tab statistics
  function updateStats(type: 'blocked' | 'allowed') {
    console.log(`Updating stats: ${type}`);
    // Retrieve current tab stats from storage
    chrome.storage.local.get('tabStats', result => {
      // Initialize stats object if it doesn't exist
      const stats: TabStats = result.tabStats || { blocked: 0, allowed: 0 };
      // Increment the appropriate counter
      stats[type]++;
      console.log('Updated stats:', stats);
      // Save the updated stats back to storage
      chrome.storage.local.set({ tabStats: stats });
    });
  }

  function checkIfBlocked(url: string, blockedSites: BlockedSite[]): Promise<boolean> {
    return chrome.storage.local.get('isBlocking').then(result => {
      const isBlocking = result.isBlocking !== false; // Default to true if not set
      updateBadge(isBlocking);
      if (!isBlocking) {
        console.log('Blocking is disabled');
        return false;
      }

      console.log('Checking if URL is blocked');
      return blockedSites.some((site: BlockedSite) => {
        const matches = matchesWildcard(url, site.pattern);
        console.log(`Checking pattern ${site.pattern}: ${matches ? 'Matched' : 'Not matched'}`);
        return matches;
      });
    });
  }

  // New function to update the badge
  function updateBadge(isBlocking?: boolean) {
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
  }

  // Listen for changes in storage
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.isBlocking) {
      updateBadge(changes.isBlocking.newValue);
    }
  });
})();
