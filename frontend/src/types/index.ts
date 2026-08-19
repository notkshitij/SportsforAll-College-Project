export type UserRole = 'student' | 'guard';

export interface User {
  id: string;
  email: string;
  name: string;
  enrollment: string;
  department: string;
  year?: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  createdAt: string;
}

export type StayDurationHours = 1 | 4;

export interface StayExtension {
  id: string;
  studentId: string;
  studentName: string;
  studentEnrollment: string;
  studentYear?: string;
  email: string;
  department: string;
  duration: StayDurationHours;
  reason: string;
  amount: number; // ₹100
  transactionId: string;
  paymentMethod: 'UPI' | 'Card' | 'Net Banking';
  upiApp?: string;
  cardLast4?: string;
  bank?: string;
  qrCode: string;
  createdAt: string;
  validFrom: string; // ISO string
  validUntil: string; // ISO string
  status: 'valid' | 'expired' | 'Pending' | 'Verified' | 'Failed' | 'CheckedIn' | 'CheckedOut';
  verifiedBy?: string;
  verifiedAt?: string;
  flagReason?: string;
}

export interface QRData {
  version: '1.0' | string;
  passId: string;
  studentId: string;
  studentName: string;
  enrollment: string;
  studentYear?: string;
  department: string;
  duration: StayDurationHours;
  transactionId: string;
  validFrom?: string;
  validUntil: string;
  createdAt: string;
  signature?: string;
}

export type ScanResultType = 'valid' | 'expired' | 'invalid';

export interface ScanLog {
  id: string;
  guardId: string;
  guardName: string;
  studentId: string;
  studentName: string;
  enrollment: string;
  studentYear?: string;
  department?: string;
  transactionId: string;
  amount: number;
  validFrom?: string;
  validUntil: string;
  scanResult: ScanResultType;
  actionTaken?: 'Approved' | 'Flagged' | 'Inspected';
  reason?: string;
  scannedAt: string;
}

export interface VerificationResult {
  scanResult: ScanResultType;
  isValidFormat: boolean;
  pass: StayExtension;
  errorReason?: string;
  remainingFormatted?: string;
  isFacilityOpenNow: boolean;
  qrType?: 'entry' | 'exit';
  signatureValid?: boolean;
  qrExpired?: boolean;
}

