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
  // In a real implementation, you would check against your backend or a stored value
  // For now, we'll use the debug variable and store the status in chrome.storage.local
  return new Promise((resolve) => {
    if (DEBUG_IS_PAID_USER) {
      resolve(true);
    } else {
      chrome.storage.local.get('isPaidUser', (result) => {
        resolve(result.isPaidUser === true);
      });
    }
  });
}

export function setIsPaidUser(isPaid: boolean): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ isPaidUser: isPaid }, resolve);
  });
}
