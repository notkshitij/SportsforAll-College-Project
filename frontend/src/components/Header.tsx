import React from 'react';
import { Moon, Sun } from './icons';
import { APP_CONFIG } from '../constants/config';
import './Header.css';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  currentRoute?: 'scanner' | 'monthly';
  onNavigate?: (route: 'scanner' | 'monthly') => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  onToggleTheme,
  currentRoute = 'scanner',
  onNavigate,
}) => {
  return (
    <header className="portal-header">
      {/* Brand & Logo */}
      <div className="header-brand-group">
        <div className="portal-logo-container">
          <img src="/pu_logo.png" alt="Poornima University" className="portal-logo-img" />
        </div>
        <div className="brand-titles">
          <h1>
            <span>Sports Pass Verification</span>
          </h1>
          <p>{APP_CONFIG.UNIVERSITY_NAME} • {APP_CONFIG.CAMPUS_NAME}</p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="header-actions">
        {onNavigate && (
          <button
            className="nav-route-btn"
            onClick={() => onNavigate(currentRoute === 'monthly' ? 'scanner' : 'monthly')}
          >
            {currentRoute === 'monthly' ? 'Gate Scanner' : 'Monthly Records'}
          </button>
        )}

        <button
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
};
