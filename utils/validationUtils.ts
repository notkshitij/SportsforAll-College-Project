import { APP_CONFIG } from '../constants/config';

export function isValidPoornimaEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@poornima\.edu\.in$/;
  return emailRegex.test(cleanEmail);
}

export function isValidOTP(otp: string): boolean {
  if (!otp || typeof otp !== 'string') return false;
  const clean = otp.trim();
  return /^\d{6}$/.test(clean);
}

export function isValidDuration(duration: number): boolean {
  return duration === 1 || duration === 4;
}
