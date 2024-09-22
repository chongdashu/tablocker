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

import { BASE_URL } from './config';
import { BlockedSite, SyncBlockedPatternsResponse } from './types';

export async function isPaidUser(): Promise<boolean> {
  try {
    const token = localStorage.getItem('token');
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
  } catch (error) {
    console.error('Error checking paid status:', error);
    return false;
  }
}

interface SessionResponse {
  email: string | null;
  supabase_user_id: string;
  is_paying: boolean;
}

export async function syncBlockedPatterns(
  patterns: BlockedSite[]
): Promise<SyncBlockedPatternsResponse> {
  try {
    const token = localStorage.getItem('token');
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
  } catch (error) {
    console.error('Error syncing blocked patterns:', error);
    throw error;
  }
}

export async function getBlockedPatterns(): Promise<BlockedSite[]> {
  try {
    const token = localStorage.getItem('token');
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
  } catch (error) {
    console.error('Error getting blocked patterns:', error);
    throw error;
  }
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
      const localCreatedAt = new Date(mergedPatterns[existingIndex].createdAt);
      const serverCreatedAt = new Date(serverPattern.createdAt);
      if (serverCreatedAt > localCreatedAt) {
        mergedPatterns[existingIndex] = serverPattern;
      }
    }
  });

  return mergedPatterns;
}
