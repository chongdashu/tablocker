import axios from 'axios';
import { BASE_URL } from './config';
import './styles.css';
import { getValidAccessToken, isPaidUser } from './utils';

document.addEventListener('DOMContentLoaded', async () => {
  const loginButton = document.getElementById('loginButton') as HTMLButtonElement;
  const signupButton = document.getElementById('signupButton') as HTMLButtonElement;
  const logoutButton = document.getElementById('logoutButton') as HTMLButtonElement;
  const statusBar = document.getElementById('statusBar') as HTMLDivElement;
  const authSection = document.getElementById('authSection') as HTMLDivElement;
  const loggedInSection = document.getElementById('loggedInSection') as HTMLDivElement;
  const userEmail = document.getElementById('userEmail') as HTMLParagraphElement;
  const rememberEmailCheckbox = document.getElementById('rememberEmail') as HTMLInputElement;
  const emailInput = document.getElementById('email') as HTMLInputElement;

  // Load remembered email if it exists
  chrome.storage.local.get('rememberedEmail', result => {
    const rememberedEmail = result.rememberedEmail;
    if (rememberedEmail) {
      if (emailInput) {
        emailInput.value = rememberedEmail;
      }
      rememberEmailCheckbox.checked = true;
    }
  });

  loginButton.addEventListener('click', handleLogin);
  signupButton.addEventListener('click', handleSignup);
  logoutButton.addEventListener('click', handleLogout);

  // Check for existing session
  await checkSession();

  async function checkSession() {
    const storedToken = await new Promise<string | null>(resolve =>
      chrome.storage.local.get('token', result => resolve(result.token || null))
    );
    if (storedToken) {
      try {
        const response = await axios.get(`${BASE_URL}/api/auth/session`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
          withCredentials: true,
        });
        if (response.data.email) {
          showLoggedInState(response.data.email);
        } else {
          showLoggedOutState();
        }
      } catch (error) {
        console.error('Session check error:', error);
        showLoggedOutState();
      }
    } else {
      showLoggedOutState();
    }
  }

  function showLoggedInState(email: string) {
    authSection.classList.add('hidden');
    loggedInSection.classList.remove('hidden');
    userEmail.textContent = `Logged in as: ${email}`;
    setStatus('Logged in successfully', 'success');
  }

  function showLoggedOutState() {
    authSection.classList.remove('hidden');
    loggedInSection.classList.add('hidden');
    userEmail.textContent = '';
    setStatus('Please log in to access all features', 'info');
  }

  async function handleLogin() {
    setLoading('loginButton', true);
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

    // Remember email if checkbox is checked
    if (rememberEmailCheckbox.checked) {
      await chrome.storage.local.set({ rememberedEmail: email });
    } else {
      await chrome.storage.local.remove('rememberedEmail');
    }

    try {
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);

      const { data } = await axios.post(`${BASE_URL}/api/auth/login`, params, {
        withCredentials: true,
      });
      setLoading('loginButton', false);
      await chrome.storage.local.set({
        token: data.access_token,
        refreshToken: data.refresh_token,
        tokenExpiry: Date.now() + data.expires_in * 1000,
      });
      const isPaid = await isPaidUser();
      setStatus('Login successful!', 'success');
      chrome.runtime.sendMessage({ action: 'login_success' });
      setTimeout(() => {
        window.close();
      }, 1000);
    } catch (error: any) {
      setLoading('loginButton', false);
      console.error('Login error:', error.response?.data?.detail || error.message);
      setStatus(
        'Login Error: ' + (error.response?.data?.detail || error.message || 'Please try again.'),
        'error'
      );
    }
  }

  async function handleSignup() {
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

      // Handle the new RegistrationResponse
      if (data.requires_verification) {
        setStatus(data.message, 'success');
        // Optionally, you can store the user_id if needed for future use
        await chrome.storage.local.set({
          pendingVerification: true,
          pendingVerificationEmail: data.email,
        });
      } else {
        // This case is unlikely given our current setup, but included for completeness
        setStatus('Signup successful! Please verify your email address.', 'success');
      }

      // Remove any existing token data as we don't receive tokens on registration anymore
      await chrome.storage.local.remove(['token', 'refreshToken', 'tokenExpiry']);
    } catch (error: any) {
      setLoading('signupButton', false);
      console.error('Signup error:', error.response?.data?.detail || error.message);
      setStatus('Signup Error: ' + (error.response?.data?.detail || 'Please try again.'), 'error');
    }
  }

  async function handleLogout() {
    try {
      const token = await getValidAccessToken();
      await axios.post(
        `${BASE_URL}/api/auth/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );
      await chrome.storage.local.remove(['token', 'refreshToken', 'tokenExpiry']);
      showLoggedOutState();
      setStatus('Logged out successfully', 'success');
      chrome.runtime.sendMessage({ action: 'logout_success' });
    } catch (error: any) {
      console.error('Logout error:', error.response?.data?.message || error.message);
      setStatus('Logout Error: ' + (error.response?.data?.message || 'Please try again.'), 'error');
    }
  }

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
});
