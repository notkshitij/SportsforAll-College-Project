export const lightColors = {
  primary: '#2563EB', // Poornima Royal Blue
  primaryDark: '#1E40AF',
  primaryLight: '#DBEAFE',
  primaryGradientStart: '#2563EB',
  primaryGradientEnd: '#1D4ED8',
  secondary: '#0EA5E9',
  accent: '#F59E0B',
  
  success: '#10B981',
  successLight: '#D1FAE5',
  successDark: '#047857',
  
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  dangerDark: '#B91C1C',
  
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningDark: '#B45309',
  
  info: '#3B82F6',
  infoLight: '#EFF6FF',
  
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceCard: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',
  
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderFocus: '#2563EB',
  
  tabBarBg: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
  tabBarActive: '#2563EB',
  tabBarInactive: '#94A3B8',
  
  cardShadow: 'rgba(15, 23, 42, 0.08)',
  qrBg: '#FFFFFF',
  qrFg: '#0F172A',
  
  sportsTrackBg: '#E0F2FE',
  overlay: 'rgba(15, 23, 42, 0.6)',
};

export const darkColors = {
  primary: '#3B82F6',
  primaryDark: '#1D4ED8',
  primaryLight: '#1E3A8A',
  primaryGradientStart: '#3B82F6',
  primaryGradientEnd: '#1D4ED8',
  secondary: '#38BDF8',
  accent: '#FBBF24',
  
  success: '#34D399',
  successLight: '#064E3B',
  successDark: '#10B981',
  
  danger: '#F87171',
  dangerLight: '#7F1D1D',
  dangerDark: '#EF4444',
  
  warning: '#FBBF24',
  warningLight: '#78350F',
  warningDark: '#F59E0B',
  
  info: '#60A5FA',
  infoLight: '#1E3A8A',
  
  background: '#0B0F19',
  surface: '#111827',
  surfaceCard: '#1F2937',
  surfaceElevated: '#374151',
  
  text: '#F9FAFB',
  textSecondary: '#CBD5E1',
  textMuted: '#64748B',
  textInverse: '#0F172A',
  
  border: '#334155',
  borderLight: '#1E293B',
  borderFocus: '#60A5FA',
  
  tabBarBg: '#111827',
  tabBarBorder: '#1F2937',
  tabBarActive: '#60A5FA',
  tabBarInactive: '#64748B',
  
  cardShadow: 'rgba(0, 0, 0, 0.4)',
  qrBg: '#FFFFFF', // QR codes need white background for high contrast scanning
  qrFg: '#000000',
  
  sportsTrackBg: '#1E293B',
  overlay: 'rgba(0, 0, 0, 0.8)',
};

export type AppColors = typeof lightColors;
export default lightColors;
