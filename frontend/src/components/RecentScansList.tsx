import React, { useState } from 'react';
import {
  ListFilter,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Inbox,
  ArrowRight,
} from './icons';
import { ScanLog } from '../types';
import { formatTime12h, formatDateTimeNice } from '../utils/dateUtils';
import './RecentScansList.css';

interface RecentScansListProps {
  scans: ScanLog[];
  onSelectScan: (scan: ScanLog) => void;
  onClearScans: () => void;
}

export const RecentScansList: React.FC<RecentScansListProps> = ({
  scans,
  onSelectScan,
  onClearScans,
}) => {
  const [filter, setFilter] = useState<'all' | 'valid' | 'expired' | 'invalid'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredScans = scans.filter((s) => {
    if (filter !== 'all' && s.scanResult !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.studentName.toLowerCase().includes(q) ||
        s.enrollment.toLowerCase().includes(q) ||
        s.transactionId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportToCSV = () => {
    if (scans.length === 0) return;

    const headers = [
      'ID',
      'Student Name',
      'Enrollment',
      'Department',
      'Transaction ID',
      'Amount',
      'Result',
      'Action Taken',
      'Scanned At',
    ];
    const rows = scans.map((s) => [
      `"${s.id}"`,
      `"${s.studentName}"`,
      `"${s.enrollment}"`,
      `"${s.department || 'Poornima University'}"`,
      `"${s.transactionId}"`,
      s.amount || 100,
      `"${s.scanResult}"`,
      `"${s.actionTaken || 'Approved'}"`,
      `"${new Date(s.scannedAt).toLocaleString()}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Poornima_Guard_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="recent-scans-card">
      <div className="recent-scans-header">
        <h2>
          <ListFilter size={20} color="var(--primary)" />
          <span>Verification Log & Gate Audit</span>
        </h2>

        <div className="recent-actions-row">
          {/* Status Tabs */}
          <div className="filter-buttons-bar">
            <button
              className={`filter-tab-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({scans.length})
            </button>
            <button
              className={`filter-tab-btn ${filter === 'valid' ? 'active' : ''}`}
              onClick={() => setFilter('valid')}
            >
              Valid ({scans.filter((s) => s.scanResult === 'valid').length})
            </button>
            <button
              className={`filter-tab-btn ${filter === 'expired' ? 'active' : ''}`}
              onClick={() => setFilter('expired')}
            >
              Expired ({scans.filter((s) => s.scanResult === 'expired').length})
            </button>
            <button
              className={`filter-tab-btn ${filter === 'invalid' ? 'active' : ''}`}
              onClick={() => setFilter('invalid')}
            >
              Flagged ({scans.filter((s) => s.scanResult === 'invalid').length})
            </button>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={exportToCSV}
            disabled={scans.length === 0}
            title="Download CSV report"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            className="btn btn-ghost btn-sm"
            onClick={onClearScans}
            disabled={scans.length === 0}
            title="Clear scan history"
          >
            <Trash2 size={14} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Scans Table */}
      {filteredScans.length === 0 ? (
        <div className="empty-scans-placeholder">
          <div className="empty-scans-icon">
            <Inbox size={28} />
          </div>
          <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
            No verification scans logged yet
          </p>
          <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
            Start the camera or enter a student ID above to begin checking passes
          </p>
        </div>
      ) : (
        <div className="scans-table-container">
          <table className="scans-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll / Enrollment</th>
                <th>Transaction ID</th>
                <th>Validity Result</th>
                <th>Time Scanned</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredScans.map((scan) => {
                const isValid = scan.scanResult === 'valid';
                const isExpired = scan.scanResult === 'expired';
                return (
                  <tr
                    key={scan.id}
                    className="scan-table-row"
                    onClick={() => onSelectScan(scan)}
                  >
                    <td>
                      <div className="student-table-name">
                        <span>{scan.studentName}</span>
                      </div>
                      <div className="student-table-sub">
                        {scan.department || 'Poornima University'}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                        {scan.enrollment}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                        {scan.transactionId}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          isValid ? 'badge-valid' : isExpired ? 'badge-expired' : 'badge-invalid'
                        }`}
                      >
                        {isValid ? 'ENTRY GRANTED' : isExpired ? 'EXPIRED' : 'FLAGGED'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {formatTime12h(scan.scannedAt)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <ArrowRight size={16} color="var(--text-muted)" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
