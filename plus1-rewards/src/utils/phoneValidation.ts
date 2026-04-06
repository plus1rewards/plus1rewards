// src/utils/phoneValidation.ts

/**
 * Normalizes a phone number by removing spaces, dashes, and other non-digit characters
 * @param phone - The phone number string to normalize
 * @returns The normalized phone number with only digits
 */
export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Validates if a phone number is a valid South African mobile number
 * Accepts formats like: 0602962491, 060 296 2491, 060-296-2491, etc.
 * @param phone - The phone number to validate
 * @returns True if valid, false otherwise
 */
export function isValidMobileNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  
  // Check if it's exactly 10 digits and starts with 0
  return /^0\d{9}$/.test(normalized);
}

/**
 * Formats a phone number for display with spaces
 * @param phone - The phone number to format
 * @returns Formatted phone number like "060 296 2491"
 */
export function formatPhoneNumber(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  
  if (normalized.length === 10) {
    return `${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6)}`;
  }
  
  return phone; // Return original if not 10 digits
}