/**
 * Utility functions for phone number normalization
 */

/**
 * Normalize Indonesian phone number
 * - Remove all non-digit characters (-, spaces, parentheses, etc)
 * - Convert +62 or 62 prefix to 0
 * - Keep only digits
 * 
 * Examples:
 * - "0822-3412-1212" → "08223412121 2"
 * - "+6282234121212" → "082234121212"
 * - "6282234121212" → "082234121212"
 * - "0822 3412 1212" → "082234121212"
 * - "(0822) 3412-1212" → "08223412121 2"
 */
export function normalizePhoneNumber(phone: string | undefined | null): string | undefined {
  if (!phone) return undefined;

  // Remove all non-digit characters
  let normalized = phone.replace(/\D/g, '');

  // If empty after cleaning, return undefined
  if (!normalized) return undefined;

  // Handle +62 or 62 prefix (Indonesian country code)
  if (normalized.startsWith('62')) {
    // Replace 62 with 0
    normalized = '0' + normalized.substring(2);
  }

  // Return normalized phone number or undefined if empty
  return normalized || undefined;
}

/**
 * Format phone number for display (optional)
 * Adds dashes for better readability: 0822-3412-1212
 */
export function formatPhoneNumber(phone: string | undefined | null): string {
  if (!phone) return '';

  const normalized = normalizePhoneNumber(phone);
  if (!normalized) return '';

  // Format: 0822-3412-1212
  if (normalized.length >= 11) {
    return `${normalized.substring(0, 4)}-${normalized.substring(4, 8)}-${normalized.substring(8)}`;
  }

  return normalized;
}

/**
 * Validate Indonesian phone number
 * - Must be at least 10 digits
 * - Must be all digits after normalization
 * 
 * @param phone - Normalized phone number (after normalizePhoneNumber)
 * @returns Error message if invalid, undefined if valid
 */
export function validatePhoneNumber(phone: string | undefined | null): string | undefined {
  if (!phone) return undefined; // Empty is valid (will be checked in contact validation)

  // Must be all digits
  if (!/^\d+$/.test(phone)) {
    return 'Nomor HP harus berisi angka saja';
  }

  // Must be at least 10 digits
  if (phone.length < 10) {
    return 'Nomor HP minimal 10 digit';
  }

  // Must be at most 15 digits (international standard)
  if (phone.length > 15) {
    return 'Nomor HP maksimal 15 digit';
  }

  return undefined; // Valid
}

/**
 * Normalize Instagram username
 * - Remove @ symbol if present at the beginning
 * - Trim whitespace
 * - Keep only the username without @
 * 
 * Examples:
 * - "@username" → "username"
 * - "username" → "username"
 * - " @username " → "username"
 * - "@@username" → "@username" (only removes first @)
 */
export function normalizeInstagramUsername(username: string | undefined | null): string | undefined {
  if (!username) return undefined;

  // Trim whitespace
  let normalized = username.trim();

  // If empty after trimming, return undefined
  if (!normalized) return undefined;

  // Remove @ symbol at the beginning
  if (normalized.startsWith('@')) {
    normalized = normalized.substring(1);
  }

  // Return normalized username or undefined if empty
  return normalized || undefined;
}
