import { APP_CONFIG } from '../constants/config';

export function formatTime12h(dateInput?: string | Date): string {
  const date = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateNice(dateInput?: string | Date): string {
  const date = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(date.getTime())) return 'Invalid Date';
  return date.toLocaleDateString('en-IN', {
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
