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
  amount: number; // ₹100 fixed
  transactionId: string;
  paymentMethod: 'UPI';
  upiApp?: 'Google Pay' | 'PhonePe' | 'Paytm' | 'BHIM UPI' | 'CRED UPI';
  qrCode: string;
  createdAt: string;
  validFrom: string; // ISO string — today 4:00 PM
  validUntil: string; // ISO string — today 8:00 PM
  status: 'valid' | 'expired' | 'CheckedIn' | 'CheckedOut' | 'Failed';
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface QRData {
  version: '1.0';
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
  transactionId: string;
  validFrom?: string;
  validUntil: string;
  scanResult: ScanResultType;
  reason?: string;
  scannedAt: string;
}

export interface PaymentInitiationParams {
  student: User;
  duration?: StayDurationHours;
  reason?: string;
  upiApp?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  amount: number;
  paidAt: string;
  paymentMethod: string;
  error?: string;
}
