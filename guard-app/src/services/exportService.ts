import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { APP_CONFIG } from '../constants/config';
import { StayExtension } from '../types';
import { formatDateTimeNice, formatStayWindow, formatTime12h } from '../utils/dateUtils';

function getPassComputedStatus(item: StayExtension): 'Approved' | 'CheckedOut' | 'Expired' | 'Flagged' | 'Valid' {
  if (item.status === 'Failed') return 'Flagged';
  if (item.status === 'CheckedOut') return 'CheckedOut';
  
  const isPastExpiry = new Date(item.validUntil).getTime() < Date.now();
  if (isPastExpiry || item.status === 'expired') {
    return 'Expired';
  }
  
  if (item.status === 'CheckedIn') {
    return 'Approved';
  }
  
  return 'Valid';
}

export class ExportService {
  /**
   * Export pass records to CSV and open system share dialog
   */
  static async exportToCSV(records: StayExtension[]): Promise<boolean> {
    if (!records || records.length === 0) {
      throw new Error('No records available to export.');
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

    const rows = records.map((r, i) => {
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

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const fileName = `Sportsforall_Student_Pass_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    const fileUri = `${FileSystem.documentDirectory || ''}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Student Pass Records (CSV)',
        UTI: 'public.comma-separated-values-text',
      });
      return true;
    } else {
      throw new Error('Sharing is not available on this device.');
    }
  }

  /**
   * Generate printable HTML and invoke system Print / PDF dialog
   */
  static async printReportPDF(records: StayExtension[]): Promise<void> {
    if (!records || records.length === 0) {
      throw new Error('No records available to print.');
    }

    const tableRowsHtml = records
      .map((item, index) => {
        const computed = getPassComputedStatus(item);
        const statusClass =
          computed === 'Approved' || computed === 'Valid'
            ? 'pill-valid'
            : computed === 'CheckedOut'
            ? 'pill-checkout'
            : computed === 'Expired'
            ? 'pill-expired'
            : 'pill-failed';

        const statusLabel =
          computed === 'Approved'
            ? 'Approved / In'
            : computed === 'Valid'
            ? 'Valid'
            : computed === 'CheckedOut'
            ? 'Checked Out'
            : computed === 'Expired'
            ? 'Expired'
            : 'Flagged';

        return `
          <tr>
            <td style="text-align: center; color: #64748B;">${index + 1}</td>
            <td style="white-space: nowrap;">${formatDateTimeNice(item.createdAt)}</td>
            <td>
              <div style="font-weight: 700; color: #1E40AF;">${item.studentName || '—'}</div>
              <div style="font-size: 8pt; color: #64748B;">${item.email || '—'}</div>
            </td>
            <td style="font-weight: 600;">${item.studentEnrollment || '—'}</td>
            <td>${item.department || '—'}</td>
            <td>${item.studentYear || '—'}</td>
            <td style="white-space: nowrap;">${formatStayWindow(item)}</td>
            <td><span class="status-pill ${statusClass}">${statusLabel}</span></td>
            <td style="font-family: monospace; font-size: 8pt;">${item.transactionId || '—'}</td>
            <td style="font-weight: 700;">₹${item.amount != null ? item.amount : 100}</td>
            <td>Gate Guard</td>
          </tr>
        `;
      })
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Monthly Student Pass Records — ${APP_CONFIG.UNIVERSITY_NAME}</title>
          <style>
            @page {
              size: landscape;
              margin: 8mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0F172A;
              margin: 0;
              padding: 0;
              font-size: 9pt;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #2563EB;
              padding-bottom: 8px;
              margin-bottom: 12px;
            }
            .title {
              font-size: 16pt;
              font-weight: 800;
              color: #1E40AF;
              margin: 0;
            }
            .subtitle {
              font-size: 9pt;
              color: #475569;
              margin: 2px 0 0 0;
            }
            .meta {
              font-size: 8.5pt;
              color: #64748B;
              text-align: right;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 4px;
            }
            th {
              background-color: #F1F5F9;
              color: #334155;
              font-size: 7.5pt;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              padding: 6px 6px;
              border-bottom: 1.5px solid #CBD5E1;
              text-align: left;
            }
            td {
              padding: 6px 6px;
              border-bottom: 1px solid #E2E8F0;
              font-size: 8.5pt;
              vertical-align: middle;
            }
            .status-pill {
              display: inline-block;
              padding: 2px 6px;
              border-radius: 9999px;
              font-size: 7pt;
              font-weight: 700;
              text-transform: uppercase;
            }
            .pill-valid {
              background-color: #ECFDF5;
              color: #065F46;
              border: 1px solid #10B981;
            }
            .pill-checkout {
              background-color: #EFF6FF;
              color: #1E40AF;
              border: 1px solid #3B82F6;
            }
            .pill-expired {
              background-color: #FEF2F2;
              color: #991B1B;
              border: 1px solid #EF4444;
            }
            .pill-failed {
              background-color: #FFFBEB;
              color: #92400E;
              border: 1px solid #F59E0B;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">Monthly Student Pass Records</h1>
              <p class="subtitle">${APP_CONFIG.UNIVERSITY_NAME} • Campus Sports Complex Entry & Exit Logs</p>
            </div>
            <div class="meta">
              <div><strong>Generated:</strong> ${formatDateTimeNice(new Date())}</div>
              <div><strong>Total Records:</strong> ${records.length}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="text-align: center;">#</th>
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
              ${tableRowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `;

    await Print.printAsync({ html });
  }
}
