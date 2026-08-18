export const APP_CONFIG = {
  UNIVERSITY_NAME: 'Poornima University',
  CAMPUS_NAME: 'Main Sports Complex',
  APP_NAME: 'Sportsforall — Guard Portal',
  VERSION: '2.4.0',
  FACILITY_HOURS: {
    START_HOUR: 16, // 4:00 PM
    END_HOUR: 20,   // 8:00 PM
  },
  DEFAULT_GUARD: {
    id: 'guard_001',
    name: 'Rahul Kumar (Officer)',
    enrollment: 'SEC-804',
    email: 'guard@poornima.edu.in',
    department: 'Campus Security & Gate 2 Checkpoint',
    role: 'guard' as const,
  }
};
