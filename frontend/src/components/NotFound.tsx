import React from 'react';
import { AlertTriangle, ArrowRight } from './icons';
import './NotFound.css';

interface NotFoundProps {
  onGoHome: () => void;
}

export const NotFound: React.FC<NotFoundProps> = ({ onGoHome }) => {
  return (
    <div className="not-found-container">
      <div className="not-found-card">
        <div className="not-found-icon-box">
          <AlertTriangle size={48} color="var(--danger)" />
        </div>
        <div className="not-found-code">404</div>
        <h1 className="not-found-title">Page Not Found</h1>
        <p className="not-found-desc">
          The requested URL does not exist or has been moved. Please check the address or return to the main gate scanner.
        </p>

        <button className="not-found-btn" onClick={onGoHome}>
          <span>Return to Gate Scanner</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
