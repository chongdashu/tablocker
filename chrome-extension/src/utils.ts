export function matchesWildcard(str: string, pattern: string): boolean {
  // Convert the wildcard pattern to a regex pattern
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special regex characters
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');

  // Create a case-insensitive regex that matches anywhere in the string
  const regex = new RegExp(regexPattern, 'i');

  // Test if the regex matches anywhere in the string
  return regex.test(str);
}

// Debug environment variable
const DEBUG_IS_PAID_USER = true;

import axios from 'axios';
import { BASE_URL } from './config';
import { BlockedSite, SyncBlockedPatternsResponse } from './types';

export async function isPaidUser(): Promise<boolean> {
  // Replace local token retrieval with getValidAccessToken
  const token = await getValidAccessToken();
  if (!token) {
    return false; // No token, user is not logged in
  }

  const response = await fetch(`${BASE_URL}/api/auth/session`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch session');
  }

  const data: SessionResponse = await response.json();
  return data.is_paying || false; // Ensure we return false if is_paying is undefined
}

interface SessionResponse {
  email: string | null;
  supabase_user_id: string;
  is_paying: boolean;
}

export async function syncBlockedPatterns(
  patterns: BlockedSite[]
): Promise<SyncBlockedPatternsResponse> {
  // Replace local token retrieval with getValidAccessToken
  const token = await getValidAccessToken();
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`${BASE_URL}/api/user/blocklist/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ patterns }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to sync blocked patterns');
  }

  return await response.json();
}

export async function getBlockedPatterns(): Promise<BlockedSite[]> {
  // Replace local token retrieval with getValidAccessToken
  const token = await getValidAccessToken();
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`${BASE_URL}/api/user/blocklist`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get blocked patterns');
  }

  return await response.json();
}

// export function setIsPaidUser(isPaid: boolean): Promise<void> {
//   return new Promise(resolve => {
//     chrome.storage.local.set({ isPaidUser: isPaid }, resolve);
//   });
// }

export function mergePatterns(
  localPatterns: BlockedSite[],
  serverPatterns: BlockedSite[]
): BlockedSite[] {
  const mergedPatterns: BlockedSite[] = [...localPatterns];

  serverPatterns.forEach(serverPattern => {
    const existingIndex = mergedPatterns.findIndex(p => p.pattern === serverPattern.pattern);
    if (existingIndex === -1) {
      mergedPatterns.push(serverPattern);
    } else {
      // If the pattern exists locally, keep the newer one based on createdAt
      const localCreatedAt = new Date(mergedPatterns[existingIndex].created_at);
      const serverCreatedAt = new Date(serverPattern.created_at);
      if (serverCreatedAt > localCreatedAt) {
        mergedPatterns[existingIndex] = serverPattern;
      }
    }
  });

  return mergedPatterns;
}

export async function syncStats(syncRequest: any) {
  // Replace local token retrieval with getValidAccessToken
  const token = await getValidAccessToken();
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`${BASE_URL}/api/user/stats/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(syncRequest),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return { success: true, message: data.message };
}

export async function getValidAccessToken(): Promise<string | null> {
  const { token, refreshToken, tokenExpiry } = await new Promise<{
    token?: string;
    refreshToken?: string;
    tokenExpiry?: number;
  }>(resolve => chrome.storage.local.get(['token', 'refreshToken', 'tokenExpiry'], resolve));

  if (token && tokenExpiry && Date.now() < tokenExpiry) {
    return token;
  } else if (refreshToken) {
    try {
      const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, {
        refresh_token: refreshToken,
      });
      await chrome.storage.local.set({
        token: data.access_token,
        refreshToken: data.refresh_token,
        tokenExpiry: Date.now() + data.expires_in * 1000,
      });
      return data.access_token;
    } catch (error: any) {
      console.error('Token refresh error:', error.response?.data?.detail || error.message);
      return null;
    }
  }
  return null;
}
