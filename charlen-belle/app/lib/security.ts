import crypto from 'crypto';

// Rate limiting helper
const rateLimit = new Map();

export function checkRateLimit(identifier: string, limit: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const userRequests = rateLimit.get(identifier) || [];
  
  // Filter requests within time window
  const recentRequests = userRequests.filter((time: number) => now - time < windowMs);
  
  if (recentRequests.length >= limit) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimit.set(identifier, recentRequests);
  return true;
}

// Generate secure OTP
export function generateOTP(length: number = 6): string {
  return crypto.randomInt(0, Math.pow(10, length)).toString().padStart(length, '0');
}

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .trim();
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone number (Indonesia)
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
  return phoneRegex.test(phone);
}