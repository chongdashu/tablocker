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

// export function setIsPaidUser(isPaid: boolean): Promise<void> {
//   return new Promise(resolve => {
//     chrome.storage.local.set({ isPaidUser: isPaid }, resolve);
//   });
// }

