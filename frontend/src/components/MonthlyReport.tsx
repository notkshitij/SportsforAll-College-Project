import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Download,
  Printer,
  ChevronDown,
  BarChart2,
} from './icons';
import { StayExtension } from '../types';
import { VerificationService } from '../services/verificationService';
import { formatDateTimeNice, formatStayWindow, formatTime12h } from '../utils/dateUtils';
import { APP_CONFIG } from '../constants/config';
import './MonthlyReport.css';

interface MonthlyReportProps {
  onBackToScanner?: () => void;
}

/**
 * Determine accurate real-time pass status based on database record and validUntil timestamp
 */
function getPassComputedStatus(item: StayExtension): 'Approved' | 'CheckedOut' | 'Expired' | 'Flagged' | 'Valid' {
  if (item.status === 'Failed') return 'Flagged';
  if (item.status === 'CheckedOut') return 'CheckedOut';
  
  // Real-time time check: If validUntil timestamp is in the past, the pass is EXPIRED
  const isPastExpiry = new Date(item.validUntil).getTime() < Date.now();
  if (isPastExpiry || item.status === 'expired') {
    return 'Expired';
  }
  
  if (item.status === 'CheckedIn') {
    return 'Approved';
  }
  
  return 'Valid';
}

export const MonthlyReport: React.FC<MonthlyReportProps> = () => {
  const [records, setRecords] = useState<StayExtension[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  useEffect(() => {
    async function loadRecords() {
      setIsLoading(true);
      try {
        const data = await VerificationService.getAllPassRecords();
        setRecords(data);
      } finally {
        setIsLoading(false);
      }
    }
    loadRecords();
  }, []);

  // Filtered dataset with accurate computed status
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        (r.studentName && r.studentName.toLowerCase().includes(q)) ||
        (r.studentEnrollment && r.studentEnrollment.toLowerCase().includes(q)) ||
        (r.department && r.department.toLowerCase().includes(q)) ||
        (r.transactionId && r.transactionId.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q));

      const computed = getPassComputedStatus(r);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'CheckedIn' && (computed === 'Approved' || computed === 'Valid')) ||
        (statusFilter === 'CheckedOut' && computed === 'CheckedOut') ||
        (statusFilter === 'expired' && computed === 'Expired') ||
        (statusFilter === 'Failed' && computed === 'Flagged');

      const matchesMonth =
        selectedMonth === 'all' ||
        new Date(r.createdAt).getMonth().toString() === selectedMonth;

      return matchesQuery && matchesStatus && matchesMonth;
    });
  }, [records, searchQuery, statusFilter, selectedMonth]);

  // CSV Export Helper
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      alert('No records available to export.');
      return;
    }

    const headers = [
      'Sr No',
      'Date & Time',
      'Student Name',
      'Roll Number',
      'Department',
      'Academic Year',
      'Email',
      'Stay Window',
      'Status',
      'Transaction ID',
      'Payment Method',
      'Amount (INR)',
      'Verified By',
    ];

    const rows = filteredRecords.map((r, i) => {
      const computed = getPassComputedStatus(r);
      return [
        i + 1,
        `"${formatDateTimeNice(r.createdAt)}"`,
        `"${r.studentName || '—'}"`,
        `"${r.studentEnrollment || '—'}"`,
        `"${r.department || '—'}"`,
        `"${r.studentYear || '—'}"`,
        `"${r.email || '—'}"`,
        `"${formatStayWindow(r)}"`,
        `"${computed}"`,
        `"${r.transactionId || '—'}"`,
        `"${r.paymentMethod || 'UPI'}"`,
        r.amount != null ? r.amount : 100,
        `"Gate Guard"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Sportsforall_Student_Pass_Report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="monthly-report-container">
      {/* Top Action Bar */}
      <div className="report-header-bar">
        <div className="report-header-left">
          <div className="report-title-group">
            <div className="report-title-icon-box">
              <BarChart2 size={22} color="var(--primary)" />
            </div>
            <div>
              <h1 className="report-title">Monthly Student Pass Records</h1>
              <p className="report-subtitle">
                {APP_CONFIG.UNIVERSITY_NAME} • Campus Sports Complex Entry & Exit Logs
              </p>
            </div>
          </div>
        </div>

        <div className="export-btn-group">
          <button className="btn-export csv" onClick={handleExportCSV}>
            <Download size={15} />
            <span>Export to CSV / Excel</span>
          </button>
          <button className="btn-export print" onClick={handlePrint}>
            <Printer size={15} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="report-filter-bar">
        <div className="search-box-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by student name, roll number, department, txn id..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="filter-search-input"
          />
          {searchQuery ? (
            <button
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              ✕
            </button>
          ) : null}
        </div>

        <div className="filter-selects">
          <div className="custom-select-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="CheckedIn">Approved / Active</option>
              <option value="CheckedOut">Checked Out</option>
              <option value="expired">Expired</option>
              <option value="Failed">Flagged / Denied</option>
            </select>
            <ChevronDown size={14} className="select-chevron" />
          </div>

          <div className="custom-select-wrap">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Months</option>
              <option value="0">January</option>
              <option value="1">February</option>
              <option value="2">March</option>
              <option value="3">April</option>
              <option value="4">May</option>
              <option value="5">June</option>
              <option value="6">July</option>
              <option value="7">August</option>
              <option value="8">September</option>
              <option value="9">October</option>
              <option value="10">November</option>
              <option value="11">December</option>
            </select>
            <ChevronDown size={14} className="select-chevron" />
          </div>
        </div>
      </div>

      {/* Main Tabular View */}
      <div className="report-table-wrapper">
        {isLoading ? (
          <div className="table-loading">
            <div className="loading-spinner"></div>
            <p>Loading real records from database...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="table-empty">
            <p>No matching student pass records found in database.</p>
          </div>
        ) : (
          <table className="report-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date & Time</th>
                <th>Student Name</th>
                <th>Roll No.</th>
                <th>Department</th>
                <th>Year</th>
                <th>Stay Window</th>
                <th>Status</th>
                <th>Txn ID</th>
                <th>Amount</th>
                <th>Verified By</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((item, index) => {
                const computedStatus = getPassComputedStatus(item);

                return (
                  <tr key={item.id || index}>
                    <td className="cell-index">{index + 1}</td>
                    <td className="cell-date">{formatDateTimeNice(item.createdAt)}</td>
                    <td className="cell-name">
                      <div className="name-bold">{item.studentName || '—'}</div>
                      <div className="email-sub">{item.email || '—'}</div>
                    </td>
                    <td className="cell-roll">{item.studentEnrollment || '—'}</td>
                    <td className="cell-dept">{item.department || '—'}</td>
                    <td className="cell-year">{item.studentYear || '—'}</td>
                    <td className="cell-window">
                      {formatStayWindow(item)}
                    </td>
                    <td className="cell-status">
                      <span
                        className={`status-pill ${
                          computedStatus === 'Approved'
                            ? 'pill-valid'
                            : computedStatus === 'Valid'
                            ? 'pill-valid'
                            : computedStatus === 'CheckedOut'
                            ? 'pill-checkout'
                            : computedStatus === 'Expired'
                            ? 'pill-expired'
                            : 'pill-failed'
                        }`}
                      >
                        {computedStatus === 'Approved'
                          ? 'Approved / In'
                          : computedStatus === 'Valid'
                          ? 'Valid'
                          : computedStatus === 'CheckedOut'
                          ? 'Checked Out'
                          : computedStatus === 'Expired'
                          ? 'Expired'
                          : 'Flagged'}
                      </span>
                    </td>
                    <td className="cell-txn">{item.transactionId || '—'}</td>
                    <td className="cell-amount">₹{item.amount != null ? item.amount : 100}</td>
                    <td className="cell-guard">Gate Guard</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
