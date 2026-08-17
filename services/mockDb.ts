import { ScanLog, StayExtension, User } from '../types';

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
];

// No seeded fake passes or scan logs — these fill up naturally from real
// student payments / real guard scans. Everything starts empty.
export const INITIAL_EXTENSIONS: StayExtension[] = [];
export const INITIAL_SCAN_LOGS: ScanLog[] = [];
