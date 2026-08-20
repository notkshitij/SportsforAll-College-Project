import { APP_CONFIG } from '../constants/config';

export function formatTime12h(dateInput?: string | Date): string {
  const date = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateNice(dateInput?: string | Date): string {
  const date = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(date.getTime())) return 'Invalid Date';
  return date.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTimeNice(dateInput?: string | Date): string {
  const date = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(date.getTime())) return 'Invalid Date';
  return `${formatDateNice(date)}, ${formatTime12h(date)}`;
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
  const startHour = APP_CONFIG.FACILITY_HOURS.START_HOUR; // 16 -> 4:00 PM
  const endHour = APP_CONFIG.FACILITY_HOURS.END_HOUR;     // 20 -> 8:00 PM
  const startFormatted = startHour > 12 ? `${startHour - 12}:00 PM` : `${startHour}:00 AM`;
  const endFormatted = endHour > 12 ? `${endHour - 12}:00 PM` : `${endHour}:00 AM`;
  return `${startFormatted} – ${endFormatted}`;
}

export function isFacilityOperatingNow(): {
  isOpen: boolean;
  message: string;
  nextEvent: string;
} {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeDec = currentHour + currentMinute / 60;

  const startHour = APP_CONFIG.FACILITY_HOURS.START_HOUR; // 16 (4:00 PM)
  const endHour = APP_CONFIG.FACILITY_HOURS.END_HOUR;     // 20 (8:00 PM)

  if (currentTimeDec >= startHour && currentTimeDec < endHour) {
    const minsLeft = Math.floor((endHour - currentTimeDec) * 60);
    const hrs = Math.floor(minsLeft / 60);
    const mins = minsLeft % 60;
    const timeLeftStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    return {
      isOpen: true,
      message: 'Sports Facility Open (4:00 PM – 8:00 PM)',
      nextEvent: `Closes in ${timeLeftStr}`,
    };
  } else if (currentTimeDec < startHour) {
    const minsUntil = Math.floor((startHour - currentTimeDec) * 60);
    const hrs = Math.floor(minsUntil / 60);
    const mins = minsUntil % 60;
    const timeUntilStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    return {
      isOpen: false,
      message: 'Facility Closed (Opens at 4:00 PM)',
      nextEvent: `Opens in ${timeUntilStr}`,
    };
  } else {
    return {
      isOpen: false,
      message: 'Facility Closed for the Night',
      nextEvent: 'Opens tomorrow at 4:00 PM',
    };
  }
}

export function getRemainingTime(validUntilIso: string): {
  isExpired: boolean;
  formatted: string;
  totalSeconds: number;
} {
  const now = new Date().getTime();
  const target = new Date(validUntilIso).getTime();

  if (isNaN(target)) {
    return { isExpired: true, formatted: 'Invalid date', totalSeconds: 0 };
  }

  const diffMs = target - now;

  if (diffMs <= 0) {
    const elapsedMinutes = Math.floor(Math.abs(diffMs) / (1000 * 60));
    const elapsedHrs = Math.floor(elapsedMinutes / 60);
    const mins = elapsedMinutes % 60;
    const formatted =
      elapsedHrs > 0
        ? `Expired ${elapsedHrs}h ${mins}m ago`
        : `Expired ${mins}m ago`;
    return { isExpired: true, formatted, totalSeconds: 0 };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let formatted = '';
  if (hours > 0) {
    formatted = `${hours}h ${minutes}m remaining`;
  } else if (minutes > 0) {
    formatted = `${minutes}m ${seconds}s remaining`;
  } else {
    formatted = `${seconds}s remaining`;
  }

  return {
    isExpired: false,
    formatted,
    totalSeconds,
  };
}
