import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, Moon, Sun, UserCheck } from './icons';
import { formatTime12h, isFacilityOperatingNow } from '../utils/dateUtils';
import { APP_CONFIG } from '../constants/config';
import './Header.css';

interface HeaderProps {
  guardName: string;
  guardBadge: string;
  onSwitchGuard: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  guardName,
  guardBadge,
  onSwitchGuard,
  isDarkMode,
  onToggleTheme,
}) => {
  const [timeStr, setTimeStr] = useState(formatTime12h(new Date()));
  const [facilityStatus, setFacilityStatus] = useState(isFacilityOperatingNow());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(formatTime12h(new Date()));
      setFacilityStatus(isFacilityOperatingNow());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="portal-header">
      {/* Brand & Logo */}
      <div className="header-brand-group">
        <div className="portal-logo-container">
          <img src="/pu_logo.png" alt="Poornima University" className="portal-logo-img" />
        </div>
        <div className="brand-titles">
          <h1>
            <span>🛡️ Guard Verification Portal</span>
          </h1>
          <p>{APP_CONFIG.UNIVERSITY_NAME} • Main Sports Complex Gate</p>
        </div>
      </div>

      {/* Clock & Facility Status */}
      <div className="header-center-info">
        <div className="time-chip">
          <Clock size={16} color="var(--primary)" />
          <span>{timeStr}</span>
        </div>

        <div className={`facility-status-chip ${facilityStatus.isOpen ? 'open' : 'closed'}`}>
          <span className={`pulse-dot ${facilityStatus.isOpen ? 'valid' : 'warning'}`}></span>
          <span>{facilityStatus.message}</span>
        </div>
      </div>

      {/* Actions & Guard User Chip */}
      <div className="header-actions">
        <button
          className="guard-profile-chip"
          onClick={onSwitchGuard}
          title="Click to change active guard officer or view login profile"
        >
          <div className="guard-avatar-icon">
            <UserCheck size={16} />
          </div>
          <div className="guard-info-text">
            <div className="guard-name">{guardName}</div>
            <div className="guard-role">{guardBadge} • Active</div>
          </div>
        </button>

        <button
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
};
