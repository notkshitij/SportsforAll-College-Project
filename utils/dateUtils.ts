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
  return date.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateTimeNice(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return 'Invalid date';
  const day = date.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit' });
  const month = date.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short' });
  const year = date.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric' });
  const time = formatTime12h(date);
  return `${day} ${month} ${year}, ${time}`;
}

export function formatDateShort(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  const day = date.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit' });
  const month = date.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short' });
  return `${day} ${month}`;
}

export function calculateValidUntil(durationHours: number, baseDate: Date = new Date()): string {
  const expiry = new Date(baseDate.getTime() + durationHours * 60 * 60 * 1000);
  return expiry.toISOString();
}

/**
 * Extracts the booked stay time window (e.g. "4:00 PM – 8:00 PM") from the pass reason / purpose string.
 */
export function extractStayWindowFromReason(reason?: string): string | null {
  if (!reason || typeof reason !== 'string') return null;

  // Matches patterns like "4:00 PM - 8:00 PM", "4:00 PM – 8:00 PM", "4 PM - 8 PM", "04:00 PM to 08:00 PM"
  const match = reason.match(
    /(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm))\s*(?:[-–—]|to)\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm))/i
  );
  if (match) {
    return `${match[1].trim()} – ${match[2].trim()}`;
  }
  return null;
}

/**
 * Returns the formatted Stay Window (e.g. "4:00 PM – 8:00 PM") for a pass.
 * Priority:
 * 1. Booked stay slot extracted directly from `reason` / purpose string (source of truth for booking)
 * 2. Fallback to validFrom – validUntil (formatted in IST)
 * 3. Default to university sports complex facility hours (4:00 PM – 8:00 PM)
 */
export function formatStayWindow(
  passOrReason?:
    | { reason?: string; validFrom?: string; validUntil?: string; createdAt?: string }
    | string
    | null,
  validUntil?: string
): string {
  // Case 1: Pass object
  if (passOrReason && typeof passOrReason === 'object') {
    const fromReason = extractStayWindowFromReason(passOrReason.reason);
    if (fromReason) {
      return fromReason;
    }

    if (passOrReason.validFrom && passOrReason.validUntil) {
      const fromTime = formatTime12h(passOrReason.validFrom);
      const untilTime = formatTime12h(passOrReason.validUntil);
      if (fromTime !== '--:--' && untilTime !== '--:--') {
        return `${fromTime} – ${untilTime}`;
      }
    }
  }

  // Case 2: String argument
  if (typeof passOrReason === 'string') {
    const fromReason = extractStayWindowFromReason(passOrReason);
    if (fromReason) {
      return fromReason;
    }

    if (validUntil) {
      const fromTime = formatTime12h(passOrReason);
      const untilTime = formatTime12h(validUntil);
      if (fromTime !== '--:--' && untilTime !== '--:--') {
        return `${fromTime} – ${untilTime}`;
      }
    }
  }

  // Case 3: Default official sports complex facility hours
  const startHour = APP_CONFIG.OPERATING_HOURS_START || 16; // 16 -> 4:00 PM
  const endHour = APP_CONFIG.OPERATING_HOURS_END || 20;     // 20 -> 8:00 PM
  const startFormatted = startHour > 12 ? `${startHour - 12}:00 PM` : `${startHour}:00 AM`;
  const endFormatted = endHour > 12 ? `${endHour - 12}:00 PM` : `${endHour}:00 AM`;
  return `${startFormatted} – ${endFormatted}`;
}

/**
 * Returns today's fixed sports-complex stay window: 4:00 PM to 8:00 PM IST.
 * Guaranteed timezone-safe for Asia/Kolkata (UTC+5:30) on any device or server.
 */
export function getTodayStayWindow(): { validFrom: string; validUntil: string } {
  const now = new Date();
  const istDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD
  const startHourStr = String(APP_CONFIG.OPERATING_HOURS_START || 16).padStart(2, '0');
  const endHourStr = String(APP_CONFIG.OPERATING_HOURS_END || 20).padStart(2, '0');
  const from = new Date(`${istDateStr}T${startHourStr}:00:00+05:30`);
  const until = new Date(`${istDateStr}T${endHourStr}:00:00+05:30`);
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
