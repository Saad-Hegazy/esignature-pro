import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique token for document signing
 */
export const generateDocumentToken = (): string => {
  return uuidv4();
};

/**
 * Calculate expiry date based on days
 */
export const calculateExpiryDate = (days: number): Date => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  return expiryDate;
};

/**
 * Check if a date has expired
 */
export const isExpired = (date: Date): boolean => {
  return new Date() > date;
};

/**
 * Format file size to human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get client IP address from request
 */
export const getClientIp = (req: any): string => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded 
    ? forwarded.split(',')[0].trim() 
    : req.socket?.remoteAddress || 'unknown';
  return ip;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate signature link
 */
export const generateSignatureLink = (token: string, baseUrl?: string): string => {
  const base = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return `${base}/sign/${token}`;
};

/**
 * Sanitize filename to prevent security issues
 */
export const sanitizeFilename = (filename: string): string => {
  // Remove path separators and dangerous characters
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);
};
