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

export async function isPaidUser(): Promise<boolean> {
  try {
    const response = await fetch('https://your-backend.com/api/session', {
      method: 'GET',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch session');
    }
    const data = await response.json();
    if (!data.session) return false;
    // Optionally, implement additional checks (e.g., user roles)
    return true; // User is authenticated
  } catch (error) {
    console.error('Error checking session:', error);
    return false;
  }
}

export function setIsPaidUser(isPaid: boolean): Promise<void> {
  return new Promise(resolve => {
    chrome.storage.local.set({ isPaidUser: isPaid }, resolve);
  });
}
