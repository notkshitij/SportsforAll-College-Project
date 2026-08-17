import { APP_CONFIG } from '../constants/config';

export function isFacilityOperatingNow(): { isOpen: boolean; message: string; nextStatusTime: string } {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeVal = currentHour + currentMinute / 60;

  const startHour = APP_CONFIG.OPERATING_HOURS_START;
  const endHour = APP_CONFIG.OPERATING_HOURS_END;

  const isOpen = currentTimeVal >= startHour && currentTimeVal < endHour;

  if (isOpen) {
    const hoursLeft = Math.floor(endHour - currentTimeVal);
    const minsLeft = Math.floor(((endHour - currentTimeVal) % 1) * 60);
    return {
      isOpen: true,
      message: `Open until 8:00 PM (${hoursLeft}h ${minsLeft}m remaining today)`,
      nextStatusTime: '8:00 PM',
    };
  } else if (currentTimeVal < startHour) {
    return {
      isOpen: false,
      message: `Opens today at 4:00 PM (4 PM - 8 PM Operating Hours)`,
      nextStatusTime: '4:00 PM',
    };
  } else {
    return {
      isOpen: false,
      message: `Closed for today (Operating Hours: 4 PM - 8 PM)`,
      nextStatusTime: 'Tomorrow 4:00 PM',
    };
  }
}

export function formatTime12h(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateTimeNice(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return 'Invalid date';
  const day = date.getDate().toString().padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const time = formatTime12h(date);
  return `${day} ${month} ${year}, ${time}`;
}

export function formatDateShort(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  const day = date.getDate().toString().padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  return `${day} ${month}`;
}

export function calculateValidUntil(durationHours: number, baseDate: Date = new Date()): string {
  const expiry = new Date(baseDate.getTime() + durationHours * 60 * 60 * 1000);
  return expiry.toISOString();
}

/**
 * Returns today's fixed sports-complex stay window: 4:00 PM to 8:00 PM.
 * Used for the simplified "stay today" pass (no duration/reason selection).
 */
export function getTodayStayWindow(): { validFrom: string; validUntil: string } {
  const now = new Date();
  const from = new Date(now);
  from.setHours(APP_CONFIG.OPERATING_HOURS_START, 0, 0, 0);
  const until = new Date(now);
  until.setHours(APP_CONFIG.OPERATING_HOURS_END, 0, 0, 0);
  return {
    validFrom: from.toISOString(),
    validUntil: until.toISOString(),
  };
}

export function getRemainingTime(validUntilIso: string): {
  isExpired: boolean;
  totalSeconds: number;
  formatted: string;
  diffMinutes: number;
} {
  const target = new Date(validUntilIso).getTime();
  const now = Date.now();
  const diffMs = target - now;

  if (isNaN(target)) {
    return { isExpired: true, totalSeconds: 0, formatted: 'Invalid date', diffMinutes: 0 };
  }

  if (diffMs <= 0) {
    const expiredAgoMs = Math.abs(diffMs);
    const expiredMinutes = Math.floor(expiredAgoMs / (1000 * 60));
    const expiredHours = Math.floor(expiredMinutes / 60);
    const text =
      expiredHours > 0
        ? `Expired ${expiredHours}h ${expiredMinutes % 60}m ago`
        : `Expired ${expiredMinutes} mins ago`;
    return {
      isExpired: true,
      totalSeconds: 0,
      formatted: text,
      diffMinutes: -expiredMinutes,
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let formatted = '';
  if (hours > 0) {
    formatted = `${hours}h ${minutes}m ${seconds}s remaining`;
  } else {
    formatted = `${minutes}m ${seconds}s remaining`;
  }

  return {
    isExpired: false,
    totalSeconds,
    formatted,
    diffMinutes: Math.floor(totalSeconds / 60),
  };
}
