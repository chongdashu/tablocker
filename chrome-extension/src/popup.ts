import { BlockedSite } from './types';
import './styles.css';
import { matchesWildcard } from './utils';

document.addEventListener('DOMContentLoaded', () => {
  const urlPatternInput = document.getElementById('urlPattern') as HTMLInputElement;
  const addPatternButton = document.getElementById('addPattern') as HTMLButtonElement;
  const patternList = document.getElementById('patternList') as HTMLUListElement;
  const toggleButton = document.getElementById('toggleButton') as HTMLButtonElement;
  const powerIcon = document.getElementById('powerIcon') as HTMLSpanElement;
  const statusIndicator = document.getElementById('statusIndicator') as HTMLDivElement;
  const domainInfo = document.getElementById('domainInfo') as HTMLParagraphElement;
  const quickBlockButton = document.getElementById('quickBlockButton') as HTMLButtonElement;
  const blockStatus = document.getElementById('blockStatus') as HTMLSpanElement;
  const blockingStatusElement = document.getElementById('blockingStatus') as HTMLParagraphElement;
  const patternCounter = document.getElementById('patternCounter');

  // Load the current state
  chrome.storage.local.get('isBlocking', result => {
    const isBlocking = result.isBlocking !== false; // Default to true if not set
    updateToggleUI(isBlocking);
    updateStatusIndicator(isBlocking);
  });

  toggleButton.addEventListener('click', () => {
    chrome.storage.local.get(['isBlocking', 'blockedSites'], result => {
      const currentState = result.isBlocking !== false; // Default to true if not set
      const newState = !currentState;
      const blockedSites = result.blockedSites || [];

      chrome.storage.local.set({ isBlocking: newState }, () => {
        updateToggleUI(newState);
        updateStatusIndicator(newState);
        // The badge will be updated automatically due to the storage listener in background.ts

        if (newState) {
          // Close all tabs that match the patterns when blocking is enabled
          chrome.tabs.query({}, tabs => {
            tabs.forEach(tab => {
              if (tab.url) {
                const isBlocked = blockedSites.some((site: BlockedSite) =>
                  matchesWildcard(tab.url!, site.pattern)
                );
                if (isBlocked) {
                  chrome.tabs.remove(tab.id!);
                }
              }
            });
          });
        }
      });
    });
  });

  function updateToggleUI(isBlocking: boolean) {
    if (isBlocking) {
      powerIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
        <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/>
      </svg>`;
      powerIcon.classList.remove('text-red-500');
      powerIcon.classList.add('text-green-500');
    } else {
      powerIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
        <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/>
      </svg>`;
      powerIcon.classList.remove('text-green-500');
      powerIcon.classList.add('text-red-500');
    }
  }

  function updateStatusIndicator(isBlocking: boolean) {
    if (isBlocking) {
      statusIndicator.textContent = 'Blocking Active';
      statusIndicator.classList.remove('bg-red-200', 'text-red-800');
      statusIndicator.classList.add('bg-green-200', 'text-green-800');
      blockingStatusElement.textContent = "🚫 Blocked sites will be prevented from opening";
    } else {
      statusIndicator.textContent = 'Blocking Inactive';
      statusIndicator.classList.remove('bg-green-200', 'text-green-800');
      statusIndicator.classList.add('bg-red-200', 'text-red-800');
      blockingStatusElement.textContent = "🟢 All sites allowed through";
    }
  }

  addPatternButton.addEventListener('click', addPattern);

  function addPattern() {
    const pattern = urlPatternInput.value.trim();
    if (pattern) {
      chrome.storage.local.get('blockedSites', (data: { blockedSites?: BlockedSite[] }) => {
        const blockedSites: BlockedSite[] = data.blockedSites || [];
        if (blockedSites.length < 5) {  // Add this check
          blockedSites.push({ pattern, createdAt: new Date().toISOString() });
          chrome.storage.local.set({ blockedSites }, () => {
            urlPatternInput.value = '';
            renderPatternList();
          });
        } else {
          // Optionally, show an error message that max limit is reached
          alert('Maximum number of patterns (5) reached.');
        }
      });
    }
  }

  function renderPatternList() {
    chrome.storage.local.get('blockedSites', (data: { blockedSites?: BlockedSite[] }) => {
      const blockedSites: BlockedSite[] = data.blockedSites || [];
      patternList.innerHTML = '';

      // Add this line to update the counter
      updatePatternCounter(blockedSites.length);

      blockedSites.forEach((site, index) => {
        const li = document.createElement('li');
        li.className = 'flex justify-between items-center bg-white p-3 rounded-lg shadow-sm';
        li.innerHTML = `
          <span class="text-indigo-800">${site.pattern}</span>
          <button class="text-red-500 hover:text-red-700 transition duration-200" data-index="${index}">Remove</button>
        `;
        patternList.appendChild(li);
      });
      addRemoveListeners();
      updateCurrentDomainInfo();
    });
  }

  // Add this new function
  function updatePatternCounter(count: number) {
    const counterElement = document.getElementById('patternCounter');
    const addPatternButton = document.getElementById('addPattern') as HTMLButtonElement;
    const urlPatternInput = document.getElementById('urlPattern') as HTMLInputElement;

    if (counterElement) {
      counterElement.textContent = `${count}/5`;

      if (count >= 5) {
        addPatternButton.disabled = true;
        addPatternButton.innerHTML = '🔒 Go Pro for Unlimited Blocked Patterns';
        addPatternButton.classList.add('bg-gray-400', 'cursor-not-allowed');
        addPatternButton.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
        urlPatternInput.disabled = true;
        urlPatternInput.classList.add('bg-gray-100', 'cursor-not-allowed');
      } else {
        addPatternButton.disabled = false;
        addPatternButton.textContent = 'Add Pattern';
        addPatternButton.classList.remove('bg-gray-400', 'cursor-not-allowed');
        addPatternButton.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
        urlPatternInput.disabled = false;
        urlPatternInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
      }
    }
  }

  function addRemoveListeners() {
    const removeButtons = document.querySelectorAll('[data-index]');
    removeButtons.forEach(button => {
      button.addEventListener('click', e => {
        const index = parseInt((e.target as HTMLButtonElement).getAttribute('data-index')!);
        chrome.storage.local.get('blockedSites', (data: { blockedSites?: BlockedSite[] }) => {
          const blockedSites: BlockedSite[] = data.blockedSites || [];
          blockedSites.splice(index, 1);
          chrome.storage.local.set({ blockedSites }, renderPatternList);
        });
      });
    });
  }

  function updateCurrentDomainInfo() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      if (currentTab && currentTab.url) {
        const url = new URL(currentTab.url);
        const domain = url.hostname;

        chrome.storage.local.get('blockedSites', (data: { blockedSites?: BlockedSite[] }) => {
          const blockedSites: BlockedSite[] = data.blockedSites || [];
          const isBlocked = blockedSites.some(site => matchesWildcard(currentTab.url!, site.pattern));

          domainInfo.textContent = domain;

          if (isBlocked) {
            blockStatus.textContent = '🚫 Blocked';
            blockStatus.classList.add('bg-red-100', 'text-red-800');
            blockStatus.classList.remove('bg-green-100', 'text-green-800');
            quickBlockButton.classList.add('hidden');
          } else {
            blockStatus.textContent = '✅ Not Blocked';
            blockStatus.classList.add('bg-green-100', 'text-green-800');
            blockStatus.classList.remove('bg-red-100', 'text-red-800');
            quickBlockButton.classList.remove('hidden');

            // Add this line to set up the click event listener
            quickBlockButton.onclick = () => quickBlockDomain(domain);
          }
        });
      } else {
        domainInfo.textContent = 'No active tab';
        blockStatus.textContent = '';
        quickBlockButton.classList.add('hidden');
      }
    });
  }

  function quickBlockDomain(domain: string) {
    chrome.storage.local.get('blockedSites', (data: { blockedSites?: BlockedSite[] }) => {
      const blockedSites: BlockedSite[] = data.blockedSites || [];
      blockedSites.push({ pattern: `*://${domain}/*`, createdAt: new Date().toISOString() });
      chrome.storage.local.set({ blockedSites }, () => {
        updateCurrentDomainInfo();
        renderPatternList();
      });
    });
  }

  updateCurrentDomainInfo();

  renderPatternList();
});
