import { QRData, ScanResultType, StayExtension } from '../types';
import { getRemainingTime } from './dateUtils';
import { hmacSHA256 } from './cryptoUtils';

export const GUARD_SITE_URL =
  process.env.EXPO_PUBLIC_GUARD_SITE_URL || 'https://sportsforall-poornima.vercel.app';

export const QR_SECRET_KEY =
  process.env.EXPO_PUBLIC_QR_SECRET_KEY || 'pu_sportsforall_secure_qr_secret_key_2026';

export function encodeSecureQRPayload(
  bookingId: string,
  type: 'entry' | 'exit',
  secretKey: string = QR_SECRET_KEY,
  validityMs: number = 5 * 60 * 1000 // 5 minutes validity
): string {
  const exp = Date.now() + validityMs;
  const message = `${bookingId}|${type}|${exp}`;
  const sig = hmacSHA256(secretKey, message);
  return `${GUARD_SITE_URL}/?booking_id=${bookingId}&type=${type}&exp=${exp}&sig=${sig}`;
}

export function encodeQRPayload(extension: StayExtension): string {
  // Fallback to entry-type with the default key for backward compatibility
  return encodeSecureQRPayload(extension.id, 'entry');
}

export function decodeAndVerifySecureQRPayload(
  rawText: string,
  secretKey: string = QR_SECRET_KEY
): {
  isValidFormat: boolean;
  scanResult: ScanResultType;
  bookingId?: string;
  type?: 'entry' | 'exit';
  exp?: number;
  sig?: string;
  errorReason?: string;
} {
  if (!rawText || typeof rawText !== 'string') {
    return {
      isValidFormat: false,
      scanResult: 'invalid',
      errorReason: 'Empty or invalid QR code string',
    };
  }

  let bookingId: string | null = null;
  let type: 'entry' | 'exit' | null = null;
  let exp: number | null = null;
  let sig: string | null = null;

  try {
    if (rawText.includes('booking_id=') && rawText.includes('sig=')) {
      const urlObj = new URL(rawText);
      bookingId = urlObj.searchParams.get('booking_id');
      type = urlObj.searchParams.get('type') as any;
      const expStr = urlObj.searchParams.get('exp');
      exp = expStr ? parseInt(expStr, 10) : null;
      sig = urlObj.searchParams.get('sig');
    } else {
      const queryStr = rawText.split('?')[1] || rawText;
      const params = new URLSearchParams(queryStr);
      bookingId = params.get('booking_id');
      type = params.get('type') as any;
      const expStr = params.get('exp');
      exp = expStr ? parseInt(expStr, 10) : null;
      sig = params.get('sig');
    }
  } catch (e) {
    return {
      isValidFormat: false,
      scanResult: 'invalid',
      errorReason: 'Failed to parse secure QR parameters',
    };
  }

  if (!bookingId || !type || !exp || !sig) {
    return {
      isValidFormat: false,
      scanResult: 'invalid',
      errorReason: 'Missing secure QR attributes',
    };
  }

  if (type !== 'entry' && type !== 'exit') {
    return {
      isValidFormat: false,
      scanResult: 'invalid',
      errorReason: 'Invalid check type',
    };
  }

  const message = `${bookingId}|${type}|${exp}`;
  const expectedSig = hmacSHA256(secretKey, message);

  if (sig !== expectedSig) {
    return {
      isValidFormat: true,
      scanResult: 'invalid',
      bookingId,
      type,
      exp,
      sig,
      errorReason: 'SECURITY WARNING: Cryptographic signature mismatch! This QR code may have been forged or tampered with.',
    };
  }

  const now = Date.now();
  if (now > exp) {
    const diff = now - exp;
    const minutesAgo = Math.floor(diff / 60000);
    const secondsAgo = Math.floor((diff % 60000) / 1000);
    return {
      isValidFormat: true,
      scanResult: 'expired',
      bookingId,
      type,
      exp,
      sig,
      errorReason: `QR code expired ${minutesAgo > 0 ? minutesAgo + 'm ' : ''}${secondsAgo}s ago. Please refresh the QR screen.`,
    };
  }

  return {
    isValidFormat: true,
    scanResult: 'valid',
    bookingId,
    type,
    exp,
    sig,
  };
}

export function decodeAndVerifyQRPayload(rawText: string): {
  isValidFormat: boolean;
  scanResult: ScanResultType;
  qrData?: QRData;
  errorReason?: string;
} {
  if (!rawText || typeof rawText !== 'string') {
    return {
      isValidFormat: false,
      scanResult: 'invalid',
      errorReason: 'Empty or invalid QR code string',
    };
  }

  // Handle secure cryptographically signed QR codes
  if (rawText.includes('booking_id=') && rawText.includes('sig=')) {
    const secureResult = decodeAndVerifySecureQRPayload(rawText);
    if (!secureResult.isValidFormat || secureResult.scanResult === 'invalid') {
      return {
        isValidFormat: secureResult.isValidFormat,
        scanResult: 'invalid',
        errorReason: secureResult.errorReason,
      };
    }

    const qrData: QRData = {
      version: '1.0',
      passId: secureResult.bookingId!,
      studentId: 'scanned',
      studentName: 'Secure Stay Pass',
      enrollment: 'SECURE',
      department: 'Sports Complex',
      duration: 4,
      transactionId: secureResult.bookingId!,
      validUntil: new Date(secureResult.exp!).toISOString(),
      createdAt: new Date().toISOString(),
      signature: secureResult.sig,
    };

    return {
      isValidFormat: true,
      scanResult: secureResult.scanResult,
      qrData,
      errorReason: secureResult.errorReason,
    };
  }

  // Legacy JSON decoding
  let parsed: any;
  try {
    parsed = JSON.parse(rawText.trim());
  } catch {
    return {
      isValidFormat: false,
      scanResult: 'invalid',
      errorReason: 'QR Code payload is not in recognized Poornima Sports format',
    };
  }

  if (
    !parsed ||
    !parsed.studentId ||
    !parsed.studentName ||
    !parsed.enrollment ||
    !parsed.validUntil ||
    !parsed.transactionId
  ) {
    return {
      isValidFormat: false,
      scanResult: 'invalid',
      errorReason: 'Missing required Poornima University security attributes in QR data',
    };
  }

  const qrData: QRData = {
    version: parsed.version || '1.0',
    passId: parsed.passId || `pass_${parsed.transactionId}`,
    studentId: parsed.studentId,
    studentName: parsed.studentName,
    enrollment: parsed.enrollment,
    studentYear: parsed.studentYear,
    department: parsed.department || 'Poornima University',
    duration: parsed.duration || 1,
    transactionId: parsed.transactionId,
    validFrom: parsed.validFrom,
    validUntil: parsed.validUntil,
    createdAt: parsed.createdAt || new Date().toISOString(),
    signature: parsed.signature,
  };

  const { isExpired, formatted } = getRemainingTime(qrData.validUntil);

  if (isExpired) {
    return {
      isValidFormat: true,
      scanResult: 'expired',
      qrData,
      errorReason: `QR Pass has expired (${formatted})`,
    };
  }

  return {
    isValidFormat: true,
    scanResult: 'valid',
    qrData,
  };
}

