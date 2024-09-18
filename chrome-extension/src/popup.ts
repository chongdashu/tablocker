import axios from 'axios';
import { BASE_URL } from './config';
import './styles.css';
import { BlockedSite } from './types';
import { isPaidUser, matchesWildcard } from './utils';

document.addEventListener('DOMContentLoaded', async () => {
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

  // Load the stored token if available
  const storedToken = localStorage.getItem('token');
  if (storedToken) {
    try {
      const response = await axios.get(`${BASE_URL}/api/auth/session`, {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
        withCredentials: true,
      });
      if (response.data.email) {
        // logoutButton.classList.remove('hidden');
        const isPaid = await isPaidUser();
        if (isPaid) {
          proStatus.classList.remove('hidden');
        } else {
          proStatus.classList.add('hidden');
        }
        setStatus('Logged in as ' + response.data.email, 'success');
      } else {
        logoutButton.classList.add('hidden');
        proStatus.classList.add('hidden');
        setStatus('Please log in to access all features', 'info');
      }
    } catch (error) {
      console.error('Session check error:', error);
      logoutButton.classList.add('hidden');
      proStatus.classList.add('hidden');
      setStatus('Unable to check login status. Please try again later.' + error, 'error');
    }
  } else {
    logoutButton.classList.add('hidden');
    proStatus.classList.add('hidden');
    setStatus('Please log in to access all features', 'info');
  }

  loginButton.addEventListener('click', async () => {
    setLoading('loginButton', true);
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;

    if (!emailInput || !passwordInput) {
      setStatus('Email or password input not found', 'error');
      setLoading('loginButton', false);
      return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      setStatus('Please enter both email and password', 'error');
      setLoading('loginButton', false);
      return;
    }
    try {
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);

      const { data } = await axios.post(`${BASE_URL}/api/auth/login`, params, {
        withCredentials: true,
      });
      setLoading('loginButton', false);
      localStorage.setItem('token', data.access_token); // Store the token
      authSection.classList.add('hidden');
      logoutButton.classList.remove('hidden');
      const isPaid = await isPaidUser();
      if (isPaid) {
        proStatus.classList.remove('hidden');
      } else {
        proStatus.classList.add('hidden');
      }
      setStatus('', 'success');
      renderPatternList();
    } catch (error: any) {
      setLoading('loginButton', false);
      console.error(error);
      console.error('Login error:', error.response?.data?.detail || error.message);
      setStatus(
        'Login Error: ' + (error.response?.data?.detail || error.message || 'Please try again.'),
        'error'
      );
    }
  });

  signupButton.addEventListener('click', async () => {
    setLoading('signupButton', true);
    const email = (document.getElementById('email') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;

    try {
      const { data } = await axios.post(
        `${BASE_URL}/api/auth/register`,
        { username: email, password: password },
        { withCredentials: true }
      );
      setLoading('signupButton', false);
      localStorage.setItem('token', data.access_token); // Store the token if returned
      setStatus('Signup successful! Please verify your email.', 'success');
    } catch (error: any) {
      setLoading('signupButton', false);
      console.error(error);
      console.error('Signup error:', error.response?.data?.detail || error.message);
      setStatus('Signup Error: ' + (error.response?.data?.detail || 'Please try again.'), 'error');
    }
  });

  logoutButton.addEventListener('click', async () => {
    try {
      const token = localStorage.getItem('token'); // Retrieve the token
      await axios.post(
        `${BASE_URL}/api/auth/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`, // Include token in headers
          },
          withCredentials: true,
        }
      );
      localStorage.removeItem('token'); // Remove the token on logout
      authSection.classList.remove('hidden');
      logoutButton.classList.add('hidden');
      proStatus.classList.add('hidden');
      setStatus('Logged out successfully', 'success');
    } catch (error: any) {
      console.error('Logout error:', error.response?.data?.message || error.message);
      setStatus('Logout Error: ' + (error.response?.data?.message || 'Please try again.'), 'error');
    }
  });

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
      blockingStatusElement.textContent = '🚫 Blocked sites will be prevented from opening';
    } else {
      statusIndicator.textContent = 'Blocking Inactive';
      statusIndicator.classList.remove('bg-green-200', 'text-green-800');
      statusIndicator.classList.add('bg-red-200', 'text-red-800');
      blockingStatusElement.textContent = '🟢 All sites allowed through';
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

  async function updatePatternCounter(count: number) {
    const isPaid = await isPaidUser();
    if (patternCounter) {
      patternCounter.textContent = isPaid ? `${count}` : `${count}/5`;
    }

    const addPatternButton = document.getElementById('addPattern') as HTMLButtonElement;
    const urlPatternInput = document.getElementById('urlPattern') as HTMLInputElement;

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

  function renderPatternList() {
    chrome.storage.local.get('blockedSites', (data: { blockedSites?: BlockedSite[] }) => {
      const blockedSites: BlockedSite[] = data.blockedSites || [];
      patternList.innerHTML = '';

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
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const currentTab = tabs[0];
      if (currentTab && currentTab.url) {
        const url = new URL(currentTab.url);
        const domain = url.hostname;

        chrome.storage.local.get('blockedSites', (data: { blockedSites?: BlockedSite[] }) => {
          const blockedSites: BlockedSite[] = data.blockedSites || [];
          const isBlocked = blockedSites.some(site =>
            matchesWildcard(currentTab.url!, site.pattern)
          );

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

  const isPaid = await isPaidUser();

  if (isPaid) {
    proStatus.classList.remove('hidden');
  } else {
    proStatus.classList.add('hidden');
  }

  updateCurrentDomainInfo();

  renderPatternList();

  profileButton.addEventListener('click', openLoginPopup);

  function openLoginPopup() {
    chrome.windows.create({
      url: chrome.runtime.getURL('login.html'),
      type: 'popup',
      width: 400,
      height: 600,
    });
  }
});

function setStatus(message: string, type: 'error' | 'success' | 'info') {
  const statusBar = document.getElementById('statusBar')!;
  const statusIcon = document.getElementById('statusIcon')!;
  const statusMessage = document.getElementById('statusMessage')!;

  if (message) {
    statusBar.classList.remove('hidden');
    statusMessage.textContent = message;

    statusBar.classList.remove(
      'bg-green-100',
      'text-green-800',
      'bg-red-100',
      'text-red-800',
      'bg-blue-100',
      'text-blue-800'
    );
    statusIcon.classList.remove('text-green-500', 'text-red-500', 'text-blue-500');

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
  } else {
    statusBar.classList.add('hidden');
    statusMessage.textContent = '';
  }
}

function setLoading(buttonId: string, isLoading: boolean) {
  const button = document.getElementById(buttonId) as HTMLButtonElement;
  const spinner = document.getElementById(`${buttonId}Spinner`) as SVGElement | null;
  const buttonText = button.querySelector('span');

  if (isLoading) {
    button.disabled = true;
    spinner?.classList.remove('hidden');
    buttonText!.textContent = buttonId === 'loginButton' ? 'Logging in...' : 'Signing up...';
  } else {
    button.disabled = false;
    spinner?.classList.add('hidden');
    buttonText!.textContent = buttonId === 'loginButton' ? 'Login' : 'Sign Up';
  }
}
