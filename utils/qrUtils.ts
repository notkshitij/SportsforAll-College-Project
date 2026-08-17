import { QRData, ScanResultType, StayExtension } from '../types';
import { getRemainingTime } from './dateUtils';

export function encodeQRPayload(extension: StayExtension): string {
  const qrData: QRData = {
    version: '1.0',
    passId: extension.id,
    studentId: extension.studentId,
    studentName: extension.studentName,
    enrollment: extension.studentEnrollment,
    studentYear: extension.studentYear,
    department: extension.department,
    duration: extension.duration,
    transactionId: extension.transactionId,
    validFrom: extension.validFrom,
    validUntil: extension.validUntil,
    createdAt: extension.createdAt,
    signature: `PU-SIG-${extension.transactionId.slice(-4)}`,
  };
  return JSON.stringify(qrData);
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

  let parsed: any;
  try {
    parsed = JSON.parse(rawText.trim());
  } catch {
    // If it's a plain transaction ID or manual pass ID format like TXN12345678 or pass_001
    return {
      isValidFormat: false,
      scanResult: 'invalid',
      errorReason: 'QR Code payload is not in recognized Poornima Sports format',
    };
  }

  // Validate required fields
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
