import { BlockedSite } from './types';
import './styles.css';
import { matchesWildcard } from './utils';

document.addEventListener('DOMContentLoaded', () => {
  const urlPatternInput = document.getElementById('urlPattern') as HTMLInputElement;
  const addPatternButton = document.getElementById('addPattern') as HTMLButtonElement;
  const patternList = document.getElementById('patternList') as HTMLUListElement;
  const toggleButton = document.getElementById('toggleButton') as HTMLButtonElement;
  const powerIcon = document.getElementById('powerIcon') as HTMLSpanElement;

  // Load the current state
  chrome.storage.local.get('isBlocking', result => {
    const isBlocking = result.isBlocking !== false; // Default to true if not set
    updateToggleUI(isBlocking);
  });

  toggleButton.addEventListener('click', () => {
    chrome.storage.local.get(['isBlocking', 'blockedSites'], result => {
      const currentState = result.isBlocking !== false; // Default to true if not set
      const newState = !currentState;
      const blockedSites = result.blockedSites || [];

      chrome.storage.local.set({ isBlocking: newState }, () => {
        updateToggleUI(newState);

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
      powerIcon.textContent = '⏻';
      powerIcon.classList.remove('text-red-500');
      powerIcon.classList.add('text-green-500');
    } else {
      powerIcon.textContent = '⏻';
      powerIcon.classList.remove('text-green-500');
      powerIcon.classList.add('text-red-500');
    }
  }

  addPatternButton.addEventListener('click', addPattern);

  function addPattern() {
    const pattern = urlPatternInput.value.trim();
    if (pattern) {
      chrome.storage.local.get('blockedSites', (data: { blockedSites?: BlockedSite[] }) => {
        const blockedSites: BlockedSite[] = data.blockedSites || [];
        blockedSites.push({ pattern, createdAt: new Date().toISOString() });
        chrome.storage.local.set({ blockedSites }, () => {
          urlPatternInput.value = '';
          renderPatternList();
        });
      });
    }
  }

  function renderPatternList() {
    chrome.storage.local.get('blockedSites', (data: { blockedSites?: BlockedSite[] }) => {
      const blockedSites: BlockedSite[] = data.blockedSites || [];
      patternList.innerHTML = '';
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
    });
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

  renderPatternList();
});
