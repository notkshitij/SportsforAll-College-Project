import React from 'react';
import { QrCode, CheckCircle2, AlertTriangle, XCircle, IndianRupee } from './icons';
import { ScanLog } from '../types';
import './StatsBar.css';

interface StatsBarProps {
  scans: ScanLog[];
}

export const StatsBar: React.FC<StatsBarProps> = ({ scans }) => {
  const totalScans = scans.length;
  const validCount = scans.filter((s) => s.scanResult === 'valid').length;
  const expiredCount = scans.filter((s) => s.scanResult === 'expired').length;
  const invalidCount = scans.filter((s) => s.scanResult === 'invalid').length;
  const totalRevenue = scans.reduce((sum, s) => sum + (s.amount || 100), 0);

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon-wrapper stat-icon-blue">
          <QrCode size={24} />
        </div>
        <div className="stat-content">
          <span className="stat-label">Total Verified</span>
          <span className="stat-value">{totalScans}</span>
          <span className="stat-subtext">Today's scan entries</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrapper stat-icon-green">
          <CheckCircle2 size={24} />
        </div>
        <div className="stat-content">
          <span className="stat-label">Granted Entry</span>
          <span className="stat-value">{validCount}</span>
          <span className="stat-subtext">Valid sports passes</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrapper stat-icon-amber">
          <AlertTriangle size={24} />
        </div>
        <div className="stat-content">
          <span className="stat-label">Expired Passes</span>
          <span className="stat-value">{expiredCount}</span>
          <span className="stat-subtext">Outside validity window</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrapper stat-icon-red">
          <XCircle size={24} />
        </div>
        <div className="stat-content">
          <span className="stat-label">Flagged Alerts</span>
          <span className="stat-value">{invalidCount}</span>
          <span className="stat-subtext">Security flags / Denied</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrapper stat-icon-blue">
          <IndianRupee size={24} />
        </div>
        <div className="stat-content">
          <span className="stat-label">Pass Revenue</span>
          <span className="stat-value">₹{totalRevenue}</span>
          <span className="stat-subtext">Fixed ₹100 / pass</span>
        </div>
      </div>
    </div>
  );
};
