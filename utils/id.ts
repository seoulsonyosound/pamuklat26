/**
 * Generates a 15-character alphanumeric ID compatible with PocketBase record IDs.
 */
export function generatePbId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : null;

  if (cryptoObj && cryptoObj.getRandomValues) {
    const array = new Uint8Array(15);
    cryptoObj.getRandomValues(array);
    for (let i = 0; i < 15; i++) {
      result += chars.charAt(array[i] % chars.length);
    }
  } else {
    // Fallback for non-browser/legacy environments
    for (let i = 0; i < 15; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }

  return result;
}
