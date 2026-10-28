/**
 * Validation utilities for Attendance Check Karo.
 * Note: These provide client-side format and domain checks.
 * The application runs 100% offline with device-specific local storage,
 * and does not perform remote email ownership or mailbox verification.
 */

/**
 * Normalizes an email address:
 * - Strips zero-width and invisible characters
 * - Trims leading and trailing whitespace
 * - Converts to lower case
 */
export function normalizeEmail(email: string): string {
  if (!email) return '';
  return email
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
    .toLowerCase();
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Recognized major personal email providers.
 */
export const MAJOR_EMAIL_PROVIDERS = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'outlook.in',
  'hotmail.com',
  'hotmail.co.uk',
  'live.com',
  'live.in',
  'msn.com',
  'yahoo.com',
  'yahoo.co.in',
  'yahoo.co.uk',
  'yahoo.in',
  'ymail.com',
  'rocketmail.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'proton.me',
  'protonmail.com',
  'zoho.com',
  'zoho.in',
  'zohomail.com',
  'zohomail.in',
  'aol.com',
  'rediffmail.com',
]);

/**
 * Checks if a domain is an authorized college/institutional domain or a recognized email provider.
 * Policy:
 * 1. Recognized major email providers (gmail.com, outlook.com, yahoo.com, icloud.com, etc.)
 * 2. Academic / college domains:
 *    - .edu or .edu.<country-code> (e.g. college.edu, nit.edu.in, nus.edu.sg)
 *    - .ac.<country-code> (e.g. iitd.ac.in, ox.ac.uk, ucl.ac.uk)
 *    - .res.in (Indian research institutes)
 *    - Specialized education TLDs: .college, .university, .academy, .school
 */
export function isAllowedEmailDomain(domain: string): boolean {
  const cleanDomain = domain.toLowerCase().trim();

  // 1. Direct match with major email providers
  if (MAJOR_EMAIL_PROVIDERS.has(cleanDomain)) {
    return true;
  }

  // 2. Subdomains of recognized providers (e.g. student.gmail.com)
  for (const provider of MAJOR_EMAIL_PROVIDERS) {
    if (cleanDomain.endsWith('.' + provider)) {
      return true;
    }
  }

  // 3. Academic / college domains:
  // - Ending with .edu (e.g. stanford.edu, mit.edu)
  // - Ending with .(edu|ac).<2-letter-country> (e.g. iitd.ac.in, bits-pilani.ac.in, ox.ac.uk, nus.edu.sg)
  // - Ending with .res.in
  // - Specialized education TLDs: .college, .university, .academy, .school
  if (
    /(^|\.)edu$/i.test(cleanDomain) ||
    /\.(edu|ac)\.[a-z]{2}$/i.test(cleanDomain) ||
    /\.(res\.in|college|university|academy|school)$/i.test(cleanDomain)
  ) {
    return true;
  }

  return false;
}

/**
 * Validates email syntax and domain requirements:
 * - Must be non-empty
 * - Must contain '@' and a domain
 * - Must have a valid top-level domain (minimum 2 letters, e.g. .edu, .com, .in)
 * - Rejects malformed patterns such as b3@bn, consecutive dots, or spaces
 * - Enforces allowed college / recognized email provider domains
 */
export function validateEmail(rawEmail: string): ValidationResult {
  const email = normalizeEmail(rawEmail);

  if (!email) {
    return { valid: false, error: 'Please enter your email address.' };
  }

  if (email.length > 254) {
    return { valid: false, error: 'Email address is too long (maximum 254 characters).' };
  }

  if (!email.includes('@')) {
    return { valid: false, error: "Email address must include an '@' symbol." };
  }

  const parts = email.split('@');
  if (parts.length !== 2) {
    return { valid: false, error: "Email address cannot contain multiple '@' symbols." };
  }

  const [localPart, domainPart] = parts;

  if (!localPart) {
    return { valid: false, error: "Please enter the part of your email before the '@' symbol." };
  }

  if (!domainPart) {
    return { valid: false, error: "Please enter a domain after the '@' symbol (e.g. college.edu)." };
  }

  // Reject consecutive dots
  if (email.includes('..')) {
    return { valid: false, error: 'Email address cannot contain consecutive dots.' };
  }

  // Require domain to have at least one dot and a top-level domain with >= 2 characters
  const domainParts = domainPart.split('.');
  if (domainParts.length < 2) {
    return {
      valid: false,
      error: 'Please enter a complete domain with an extension (e.g. student@college.edu).',
    };
  }

  const tld = domainParts[domainParts.length - 1];
  if (!/^[a-zA-Z]{2,24}$/.test(tld)) {
    return {
      valid: false,
      error: 'Please enter a valid domain extension with at least 2 letters (e.g. .edu, .com, .org).',
    };
  }

  // General RFC-compliant email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return {
      valid: false,
      error: 'Please enter a valid email address format (e.g. name@college.edu).',
    };
  }

  // Domain policy check: college domains or recognized email providers only
  if (!isAllowedEmailDomain(domainPart)) {
    return {
      valid: false,
      error: 'Please use a college email address (e.g., student@college.edu, .ac.in) or a recognized provider (@gmail.com, @outlook.com).',
    };
  }

  return { valid: true };
}

/**
 * Validates a user's full name:
 * - Must be non-empty
 * - Must be at least 2 characters long
 */
export function validateName(rawName: string): ValidationResult {
  const name = (rawName || '').trim();

  if (!name) {
    return { valid: false, error: 'Please enter your full name.' };
  }

  if (name.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters long.' };
  }

  if (name.length > 80) {
    return { valid: false, error: 'Name is too long (maximum 80 characters).' };
  }

  return { valid: true };
}
