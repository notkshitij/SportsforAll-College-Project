import { User } from '../types';

export const APP_CONFIG = {
  APP_NAME: 'Sportsforall',
  UNIVERSITY_NAME: 'Poornima University',
  UNIVERSITY_TAGLINE: 'Sports & Recreation Facility Stay Management System',
  UNIVERSITY_CAMPUS: 'Jaipur, Rajasthan',
  ALLOWED_EMAIL_DOMAIN: '@poornima.edu.in',
  
  // Operating Hours (4:00 PM to 8:00 PM)
  OPERATING_HOURS_START: 16, // 16:00 (4:00 PM)
  OPERATING_HOURS_END: 20,   // 20:00 (8:00 PM)
  
  // Pricing
  EXTENSION_PRICE_INR: 100, // Fixed ₹100 for stay extension
  
  // Durations
  DURATIONS_HOURS: [1, 4] as const,
  
  // Mock Defaults
  MOCK_OTP: '123456',
  PAYMENT_MOCK_DELAY_MS: 2000,
  
  // Demo Accounts
  DEMO_STUDENT: {
    id: 'stu_001',
    email: 'student@poornima.edu.in',
    name: 'Arjun Sharma',
    enrollment: 'PU-2024-1001',
    department: 'Computer Science & Engineering',
    year: '2nd Year',
    role: 'student',
    createdAt: '2024-01-10T10:00:00Z',
  } as User,
  DEMO_GUARD: {
    id: 'guard_001',
    email: 'guard@poornima.edu.in',
    name: 'Rahul Kumar',
    enrollment: 'SEC-804',
    department: 'Campus Security Department',
    role: 'guard',
    createdAt: '2023-08-15T08:00:00Z',
  } as User,
  
  // Razorpay Key & Test Details
  RAZORPAY_KEY_ID: 'rzp_test_sportsforall_pu',
  CURRENCY: 'INR',
  CURRENCY_SYMBOL: '₹',
  
  // University Contact
  HELPDESK_EMAIL: 'director.admin@poornima.edu.in',
  EMERGENCY_SECURITY_PHONE: '+91 9829255103',
};
