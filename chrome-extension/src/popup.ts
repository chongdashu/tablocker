import axios from 'axios';
import { BASE_URL } from './config';
import './styles.css';
import { BlockedSite } from './types';
import {
  getBlockedPatterns,
  isPaidUser,
  matchesWildcard,
  mergePatterns,
  syncBlockedPatterns,
} from './utils';

const REQUEST_TIMEOUT = 5000; // 5 seconds timeout

document.addEventListener('DOMContentLoaded', async () => {
  // DOM element references
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
  const proStatus = document.getElementById('proStatus') as HTMLSpanElement;
  const authSection = document.getElementById('authSection') as HTMLDivElement;
  const loginButton = document.getElementById('loginButton') as HTMLButtonElement;
  const signupButton = document.getElementById('signupButton') as HTMLButtonElement;
  const logoutButton = document.getElementById('logoutButton') as HTMLButtonElement;
  const statusBar = document.getElementById('statusBar') as HTMLDivElement;
  const profileButton = document.getElementById('profileButton') as HTMLButtonElement;

  // Cached data
  let cachedProStatus: boolean | null = null;
  let cachedBlockedSites: BlockedSite[] | null = null;

  // Initial UI setup
  initializeUI();

  // Load stored data and update UI
  loadCachedDataAndUpdateUI();

  // Check session and perform network-dependent operations
  const storedToken = localStorage.getItem('token');
  if (storedToken) {
    checkSessionAndUpdateUI(storedToken);
  } else {
    handleLoggedOutState();
  }

  // Load and render patterns after all other operations
  await loadAndRenderPatterns();

  // Event listeners
  toggleButton.addEventListener('click', handleToggleClick);
  addPatternButton.addEventListener('click', handleAddPattern);
  profileButton.addEventListener('click', openLoginPopup);
  quickBlockButton.addEventListener('click', handleQuickBlock);

  // Functions

  function initializeUI() {
    updateToggleUI(true); // Assume blocking is active by default
    updateStatusIndicator(true);
    setStatus('Loading...', 'info');
    quickBlockButton.classList.add('hidden');
    proStatus.classList.add('hidden'); // Hide Pro status by default
  }

  async function loadCachedDataAndUpdateUI() {
    cachedProStatus = await getCachedProStatus();
    cachedBlockedSites = await getCachedBlockedSites();

    const token = localStorage.getItem('token');
    updateProStatusUI(token ? cachedProStatus : false);

    if (cachedBlockedSites) {
      renderPatternList(cachedBlockedSites);
      updateCurrentDomainInfo(cachedBlockedSites);
    }

    chrome.storage.local.get(['isBlocking'], result => {
      const isBlocking = result.isBlocking !== false;
      updateToggleUI(isBlocking);
      updateStatusIndicator(isBlocking);
    });
  }

  async function loadAndRenderPatterns() {
    try {
      const token = localStorage.getItem('token');
      const isPaid = token ? await isPaidUser() : false;
      updateProStatusUI(isPaid);

      if (token) {
        // User is logged in, load patterns from server
        await loadPatternsFromServer();
      } else {
        // User is not logged in, load patterns from local storage
        const blockedSites = await getBlockedSites();
        renderPatternList(blockedSites);
        updateCurrentDomainInfo(blockedSites);
      }

      // Apply pattern limit for free users
      if (!isPaid) {
        const blockedSites = await getBlockedSites();
        const limitedSites = blockedSites.slice(0, 5); // Limit to 5 patterns for free users
        await chrome.storage.local.set({ blockedSites: limitedSites });
        renderPatternList(limitedSites);
        updateCurrentDomainInfo(limitedSites);
      }
    } catch (error) {
      console.error('Error in loadAndRenderPatterns:', error);
      setStatus('Failed to load patterns', 'error');
    }
  }

  async function checkSessionAndUpdateUI(token: string) {
    try {
      const response = await axios.get(`${BASE_URL}/api/auth/session`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
        timeout: REQUEST_TIMEOUT,
      });

      if (response.data.email) {
        handleLoggedInState(response.data.email);
      } else {
        handleLoggedOutState();
      }
    } catch (error) {
      console.error('Session check error:', error);
      handleLoggedOutState();
    }
  }

  function handleLoggedInState(email: string) {
    setStatus(`Logged in as ${email}`, 'success');
    isPaidUser().then(isPaid => {
      updateProStatusUI(isPaid);
      setCachedProStatus(isPaid);
    });
  }

  function handleLoggedOutState() {
    logoutButton.classList.add('hidden');
    updateProStatusUI(false);
    setStatus('Sign up or log in to sync blocked sites & settings.', 'info');
  }

  function handleToggleClick() {
    chrome.storage.local.get(['isBlocking', 'blockedSites'], result => {
      const currentState = result.isBlocking !== false;
      const newState = !currentState;
      const blockedSites = result.blockedSites || [];

      chrome.storage.local.set({ isBlocking: newState }, () => {
        updateToggleUI(newState);
        updateStatusIndicator(newState);

        if (newState) {
          closeBlockedTabs(blockedSites);
        }
      });
    });
  }

  async function handleAddPattern() {
    const pattern = urlPatternInput.value.trim();
    if (pattern) {
      const isPaid = await isPaidUser();
      const blockedSites = await getBlockedSites();

      if (!isPaid && blockedSites.length >= 5) {
        setStatus('Upgrade to Pro to add more patterns', 'error');
        return;
      }

      const newPattern = { pattern, created_at: new Date().toISOString() };
      blockedSites.push(newPattern);

      try {
        await chrome.storage.local.set({ blockedSites });
        renderPatternList(blockedSites);
        await syncPatterns();
        setStatus('Pattern added and synced successfully', 'success');
        urlPatternInput.value = '';
      } catch (error) {
        console.error('Error adding pattern:', error);
        setStatus('Failed to add pattern', 'error');
      }
    }
  }

  function handleQuickBlock() {
    chrome.tabs.query({ active: true, currentWindow: true }, async tabs => {
      const currentTab = tabs[0];
      if (currentTab && currentTab.url) {
        const url = new URL(currentTab.url);
        const domain = url.hostname;
        const pattern = `*://${domain}/*`;

        const blockedSites = await getBlockedSites();
        blockedSites.push({ pattern, created_at: new Date().toISOString() });

        await chrome.storage.local.set({ blockedSites });
        renderPatternList(blockedSites);
        updateCurrentDomainInfo(blockedSites);
        await syncPatterns();
        setStatus('Domain blocked and synced successfully', 'success');
      }
    });
  }

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
      blockingStatusElement.textContent = '🚫 Blocked sites will be prevented from opening';
    } else {
      statusIndicator.textContent = 'Blocking Inactive';
      statusIndicator.classList.remove('bg-green-200', 'text-green-800');
      statusIndicator.classList.add('bg-red-200', 'text-red-800');
      blockingStatusElement.textContent = '🟢 All sites allowed through';
    }
  }

  async function renderPatternList(blockedSites: BlockedSite[]) {
    patternList.innerHTML = '';
    const token = localStorage.getItem('token');
    const isPaid = token
      ? cachedProStatus !== null
        ? cachedProStatus
        : await isPaidUser()
      : false;
    updatePatternCounter(blockedSites.length, isPaid);

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
  }

  function updateCurrentDomainInfo(blockedSites: BlockedSite[]) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const currentTab = tabs[0];
      if (currentTab && currentTab.url) {
        const url = new URL(currentTab.url);
        const domain = url.hostname;

        domainInfo.textContent = domain;

        const isBlocked = blockedSites.some(site => matchesWildcard(currentTab.url!, site.pattern));

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
        }
      } else {
        domainInfo.textContent = 'No active tab';
        blockStatus.textContent = '';
        quickBlockButton.classList.add('hidden');
      }
    });
  }

  async function updatePatternCounter(count: number, isPaid: boolean) {
    if (patternCounter) {
      patternCounter.textContent = isPaid ? `${count}` : `${count}/5`;
    }

    if (!isPaid && count >= 5) {
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

  function addRemoveListeners() {
    const removeButtons = document.querySelectorAll('[data-index]');
    removeButtons.forEach(button => {
      button.addEventListener('click', async e => {
        const index = parseInt((e.target as HTMLButtonElement).getAttribute('data-index')!);
        try {
          await removePattern(index);
          setStatus('Pattern removed and synced successfully', 'success');
        } catch (error) {
          console.error('Error removing pattern:', error);
          setStatus('Failed to remove pattern', 'error');
        }
      });
    });
  }

  async function removePattern(index: number) {
    const blockedSites = await getBlockedSites();
    blockedSites.splice(index, 1);

    await chrome.storage.local.set({ blockedSites });
    renderPatternList(blockedSites);
    await syncPatterns();
  }

  function openLoginPopup() {
    chrome.windows.create({
      url: chrome.runtime.getURL('login.html'),
      type: 'popup',
      width: 400,
      height: 600,
    });
  }

  async function syncPatterns() {
    try {
      const storedPatterns = await getBlockedSites();
      const syncedPatterns = await syncBlockedPatterns(storedPatterns);

      if (syncedPatterns.success) {
        await chrome.storage.local.set({ blockedSites: syncedPatterns.blocked_patterns });
        renderPatternList(syncedPatterns.blocked_patterns);
        setStatus('Patterns synced successfully', 'success');
      } else {
        throw new Error('Sync was not successful');
      }
    } catch (error) {
      console.error('Error syncing patterns:', error);
      setStatus(
        `Failed to sync patterns: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    }
  }

  async function loadPatternsFromServer() {
    try {
      const serverPatterns = await getBlockedPatterns();
      const localPatterns = await getBlockedSites();

      const mergedPatterns = mergePatterns(localPatterns, serverPatterns);

      await chrome.storage.local.set({ blockedSites: mergedPatterns });
      renderPatternList(mergedPatterns);
      updateCurrentDomainInfo(mergedPatterns);
      setCachedBlockedSites(mergedPatterns);

      if (mergedPatterns.length > serverPatterns.length) {
        await syncPatterns();
      }
    } catch (error) {
      console.error('Error loading patterns from server:', error);
      setStatus('Failed to load patterns from server', 'error');
    }
  }

  async function getCachedProStatus(): Promise<boolean | null> {
    return new Promise(resolve => {
      chrome.storage.local.get('cachedProStatus', result => {
        resolve(result.cachedProStatus || null);
      });
    });
  }

  function setCachedProStatus(isPro: boolean) {
    chrome.storage.local.set({ cachedProStatus: isPro });
  }

  async function getCachedBlockedSites(): Promise<BlockedSite[] | null> {
    return new Promise(resolve => {
      chrome.storage.local.get('cachedBlockedSites', result => {
        resolve(result.cachedBlockedSites || null);
      });
    });
  }

  function setCachedBlockedSites(sites: BlockedSite[]) {
    chrome.storage.local.set({ cachedBlockedSites: sites });
  }

  function updateProStatusUI(isPro: boolean | null) {
    const token = localStorage.getItem('token');
    if (!token || isPro === false) {
      proStatus.classList.add('hidden');
    } else if (isPro === true) {
      proStatus.classList.remove('hidden');
    }
  }

  function closeBlockedTabs(blockedSites: BlockedSite[]) {
    chrome.tabs.query({}, tabs => {
      tabs.forEach(tab => {
        if (tab.url) {
          const isBlocked = blockedSites.some(site => matchesWildcard(tab.url!, site.pattern));
          if (isBlocked) {
            chrome.tabs.remove(tab.id!);
          }
        }
      });
    });
  }

  async function getBlockedSites(): Promise<BlockedSite[]> {
    return new Promise(resolve => {
      chrome.storage.local.get('blockedSites', result => {
        resolve(result.blockedSites || []);
      });
    });
  }

  function setStatus(message: string, type: 'error' | 'success' | 'info') {
    const statusBar = document.getElementById('statusBar')!;
    const statusIcon = document.getElementById('statusIcon')!;
    const statusMessage = document.getElementById('statusMessage')!;

    if (message) {
      statusBar.classList.remove('hidden');
      statusMessage.textContent = message;

      statusBar.className = ''; // Reset classes
      statusBar.classList.add(
        'fixed',
        'top-0',
        'left-0',
        'right-0',
        'p-2',
        'rounded-b-lg',
        'shadow-md',
        'transition-all',
        'duration-300',
        'ease-in-out',
        'z-50'
      );

      if (type === 'error') {
        statusBar.classList.add('bg-red-100', 'text-red-800');
        statusIcon.innerHTML = `
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        `;
        statusIcon.classList.add('text-red-500');
      } else if (type === 'success') {
        statusBar.classList.add('bg-green-100', 'text-green-800');
        statusIcon.innerHTML = `
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        `;
        statusIcon.classList.add('text-green-500');
      } else if (type === 'info') {
        statusBar.classList.add('bg-blue-100', 'text-blue-800');
        statusIcon.innerHTML = `
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        `;
        statusIcon.classList.add('text-blue-500');
      }

      // Automatically hide the status bar after 5 seconds
      setTimeout(() => {
        statusBar.classList.add('hidden');
      }, 5000);
    } else {
      statusBar.classList.add('hidden');
    }
  }

  // Message listener for login/logout events
  chrome.runtime.onMessage.addListener(message => {
    if (message.action === 'login_success' || message.action === 'logout_success') {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        checkSessionAndUpdateUI(storedToken);
      } else {
        handleLoggedOutState();
      }
      loadCachedDataAndUpdateUI();
    }
  });
});
