import { ScanLog, StayExtension, User } from '../types';
import { encodeQRPayload } from '../utils/qrUtils';

export const INITIAL_STUDENT_USER: User = {
  id: 'stu_001',
  email: 'student@poornima.edu.in',
  name: 'Arjun Sharma',
  enrollment: 'PU-2024-1001',
  department: 'Computer Science & Engineering',
  year: '2nd Year (Semester 4)',
  role: 'student',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  createdAt: '2024-01-10T10:00:00Z',
};

export const INITIAL_GUARD_USER: User = {
  id: 'guard_001',
  email: 'guard@poornima.edu.in',
  name: 'Rahul Kumar',
  enrollment: 'SEC-804',
  department: 'Campus Security Department',
  role: 'guard',
  avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
  createdAt: '2023-08-15T08:00:00Z',
};

export const INITIAL_USERS: User[] = [
  INITIAL_STUDENT_USER,
  INITIAL_GUARD_USER,
  {
    id: 'stu_002',
    email: 'priya.verma@poornima.edu.in',
    name: 'Priya Verma',
    enrollment: 'PU-2024-1045',
    department: 'Civil Engineering',
    year: '3rd Year',
    role: 'student',
    createdAt: '2024-01-12T10:00:00Z',
  },
  {
    id: 'stu_003',
    email: 'rohit.meena@poornima.edu.in',
    name: 'Rohit Meena',
    enrollment: 'PU-2024-1120',
    department: 'Mechanical Engineering',
    year: '1st Year',
    role: 'student',
    createdAt: '2024-02-01T10:00:00Z',
  },
];

// Demo transactions: one valid today (plus a couple of past expired ones)
const now = new Date();
const validPassExpiry = new Date(now.getTime() + 45 * 60 * 1000); // 45 mins from now
const past1Expiry = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
const past2Expiry = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 2 days ago

const sampleExtension1: StayExtension = {
  id: 'ext_001',
  studentId: 'stu_001',
  studentName: 'Arjun Sharma',
  studentEnrollment: 'PU-2024-1001',
  studentYear: '2nd Year (Semester 4)',
  email: 'student@poornima.edu.in',
  department: 'Computer Science & Engineering',
  duration: 4,
  reason: 'Sports Complex Stay (Today, 4:00 PM - 8:00 PM)',
  amount: 100,
  transactionId: 'TXN12345678',
  paymentMethod: 'UPI',
  upiApp: 'Google Pay',
  qrCode: '',
  createdAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
  validFrom: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
  validUntil: validPassExpiry.toISOString(),
  status: 'valid',
};
sampleExtension1.qrCode = encodeQRPayload(sampleExtension1);

const sampleExtension2: StayExtension = {
  id: 'ext_002',
  studentId: 'stu_001',
  studentName: 'Arjun Sharma',
  studentEnrollment: 'PU-2024-1001',
  studentYear: '2nd Year (Semester 4)',
  email: 'student@poornima.edu.in',
  department: 'Computer Science & Engineering',
  duration: 4,
  reason: 'Sports Complex Stay (Today, 4:00 PM - 8:00 PM)',
  amount: 100,
  transactionId: 'TXN87654321',
  paymentMethod: 'UPI',
  upiApp: 'PhonePe',
  qrCode: '',
  createdAt: new Date(past1Expiry.getTime() - 4 * 60 * 60 * 1000).toISOString(),
  validFrom: new Date(past1Expiry.getTime() - 4 * 60 * 60 * 1000).toISOString(),
  validUntil: past1Expiry.toISOString(),
  status: 'expired',
};
sampleExtension2.qrCode = encodeQRPayload(sampleExtension2);

const sampleExtension3: StayExtension = {
  id: 'ext_003',
  studentId: 'stu_001',
  studentName: 'Arjun Sharma',
  studentEnrollment: 'PU-2024-1001',
  studentYear: '2nd Year (Semester 4)',
  email: 'student@poornima.edu.in',
  department: 'Computer Science & Engineering',
  duration: 4,
  reason: 'Sports Complex Stay (Today, 4:00 PM - 8:00 PM)',
  amount: 100,
  transactionId: 'TXN99231845',
  paymentMethod: 'UPI',
  upiApp: 'Paytm',
  qrCode: '',
  createdAt: new Date(past2Expiry.getTime() - 1 * 60 * 60 * 1000).toISOString(),
  validFrom: new Date(past2Expiry.getTime() - 1 * 60 * 60 * 1000).toISOString(),
  validUntil: past2Expiry.toISOString(),
  status: 'expired',
};
sampleExtension3.qrCode = encodeQRPayload(sampleExtension3);

export const INITIAL_EXTENSIONS: StayExtension[] = [
  sampleExtension1,
  sampleExtension2,
  sampleExtension3,
];

export const INITIAL_SCAN_LOGS: ScanLog[] = [
  {
    id: 'scan_001',
    guardId: 'guard_001',
    guardName: 'Rahul Kumar',
    studentId: 'stu_001',
    studentName: 'Arjun Sharma',
    enrollment: 'PU-2024-1001',
    studentYear: '2nd Year (Semester 4)',
    transactionId: 'TXN12345678',
    validUntil: validPassExpiry.toISOString(),
    scanResult: 'valid',
    scannedAt: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'scan_002',
    guardId: 'guard_001',
    guardName: 'Rahul Kumar',
    studentId: 'stu_002',
    studentName: 'Priya Verma',
    enrollment: 'PU-2024-1045',
    studentYear: '3rd Year',
    transactionId: 'TXN44556677',
    validUntil: new Date(now.getTime() + 120 * 60 * 1000).toISOString(),
    scanResult: 'valid',
    scannedAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'scan_003',
    guardId: 'guard_001',
    guardName: 'Rahul Kumar',
    studentId: 'stu_003',
    studentName: 'Rohit Meena',
    enrollment: 'PU-2024-1120',
    studentYear: '1st Year',
    transactionId: 'TXN22331199',
    validUntil: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
    scanResult: 'expired',
    reason: 'Pass expired 20 mins ago',
    scannedAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 'scan_004',
    guardId: 'guard_001',
    guardName: 'Rahul Kumar',
    studentId: 'unknown',
    studentName: 'External Visitor / Unregistered',
    enrollment: 'N/A',
    transactionId: 'TXN-CORRUPT',
    validUntil: '',
    scanResult: 'invalid',
    reason: 'Invalid or forged QR token format',
    scannedAt: new Date(now.getTime() - 80 * 60 * 1000).toISOString(),
  },
];
