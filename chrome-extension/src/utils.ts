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
