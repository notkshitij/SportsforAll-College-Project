import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform, Share } from 'react-native';
import { APP_CONFIG } from '../constants/config';
import { StayExtension } from '../types';
import { formatDateTimeNice, formatTime12h } from '../utils/dateUtils';
import { formatCurrencyINR, generateReceiptId } from '../utils/formatUtils';

export class QRService {
  /**
   * Share receipt text / summary via WhatsApp, Email, or system share sheet
   */
  static async shareReceiptText(extension: StayExtension): Promise<boolean> {
    const receiptId = generateReceiptId(new Date(extension.createdAt));
    const validUntilTime = formatTime12h(extension.validUntil);
    const dateFormatted = formatDateTimeNice(extension.createdAt);

    const message = `🏛️ *${APP_CONFIG.UNIVERSITY_NAME} - ${APP_CONFIG.APP_NAME}*
🎫 *SPORTS STAY EXTENSION PASS*
━━━━━━━━━━━━━━━━━━━━
📄 *Receipt ID:* ${receiptId}
👤 *Student:* ${extension.studentName}
🆔 *Enrollment:* ${extension.studentEnrollment}
🏛️ *Dept:* ${extension.department}
⏱️ *Duration:* ${extension.duration} Hour(s)
⏰ *Valid Until:* ${validUntilTime}
💰 *Amount Paid:* ${formatCurrencyINR(extension.amount)}
💳 *TXN ID:* ${extension.transactionId}
📅 *Date:* ${dateFormatted}
━━━━━━━━━━━━━━━━━━━━
✅ *Status:* VALID DIGITAL PASS
📍 *Location:* Poornima University Sports Complex`;

    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: `Sports Extension Pass - ${extension.studentName}`,
            text: message,
          });
          return true;
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(message);
          alert('Receipt summary copied to clipboard!');
          return true;
        }
      }

      await Share.share({
        title: `Poornima Sports Stay Pass - ${extension.transactionId}`,
        message,
      });
      return true;
    } catch (err) {
      console.warn('Share error:', err);
      return false;
    }
  }

  /**
   * Generate and print / download PDF receipt
   */
  static async generateReceiptPdf(extension: StayExtension): Promise<string | null> {
    const receiptId = generateReceiptId(new Date(extension.createdAt));
    const dateFormatted = formatDateTimeNice(extension.createdAt);
    const validUntilFormatted = formatDateTimeNice(extension.validUntil);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Sportsforall Pass Receipt</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 40px 20px;
            color: #1e293b;
            background: #ffffff;
          }
          .receipt-container {
            max-width: 600px;
            margin: 0 auto;
            border: 2px solid #2563eb;
            border-radius: 16px;
            padding: 32px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #cbd5e1;
            padding-bottom: 20px;
            margin-bottom: 24px;
          }
          .univ-title {
            color: #1e40af;
            font-size: 22px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 4px 0;
          }
          .app-title {
            color: #2563eb;
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 8px 0;
          }
          .badge {
            display: inline-block;
            background: #dcfce7;
            color: #15803d;
            font-size: 12px;
            font-weight: 700;
            padding: 4px 12px;
            border-radius: 20px;
            border: 1px solid #86efac;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .info-table td {
            padding: 10px 0;
            border-bottom: 1px solid #f1f5f9;
            font-size: 14px;
          }
          .label {
            color: #64748b;
            font-weight: 500;
            width: 40%;
          }
          .value {
            color: #0f172a;
            font-weight: 700;
            text-align: right;
          }
          .amount-box {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 12px;
            padding: 16px;
            text-align: center;
            margin: 24px 0;
          }
          .amount-label {
            font-size: 13px;
            color: #3b82f6;
            font-weight: 600;
            text-transform: uppercase;
          }
          .amount-value {
            font-size: 28px;
            font-weight: 800;
            color: #1e40af;
            margin-top: 4px;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            border-top: 2px dashed #cbd5e1;
            padding-top: 16px;
            margin-top: 24px;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <h1 class="univ-title">${APP_CONFIG.UNIVERSITY_NAME}</h1>
            <div class="app-title">${APP_CONFIG.APP_NAME} Stay Extension Pass</div>
            <div class="badge">✅ OFFICIAL VERIFIED RECEIPT</div>
          </div>

          <table class="info-table">
            <tr>
              <td class="label">Receipt Number:</td>
              <td class="value">${receiptId}</td>
            </tr>
            <tr>
              <td class="label">Transaction ID:</td>
              <td class="value">${extension.transactionId}</td>
            </tr>
            <tr>
              <td class="label">Student Name:</td>
              <td class="value">${extension.studentName}</td>
            </tr>
            <tr>
              <td class="label">Enrollment No:</td>
              <td class="value">${extension.studentEnrollment}</td>
            </tr>
            <tr>
              <td class="label">Department:</td>
              <td class="value">${extension.department}</td>
            </tr>
            <tr>
              <td class="label">Stay Duration:</td>
              <td class="value">${extension.duration} Hour(s)</td>
            </tr>
            <tr>
              <td class="label">Issue Time:</td>
              <td class="value">${dateFormatted}</td>
            </tr>
            <tr>
              <td class="label">Valid Until:</td>
              <td class="value" style="color: #16a34a;">${validUntilFormatted}</td>
            </tr>
            <tr>
              <td class="label">Payment Method:</td>
              <td class="value">UPI (${extension.upiApp || 'Online'})</td>
            </tr>
          </table>

          <div class="amount-box">
            <div class="amount-label">Total Amount Paid</div>
            <div class="amount-value">${formatCurrencyINR(extension.amount)}</div>
          </div>

          <div class="footer">
            <p>This is a computer-generated digital pass issued by Poornima University Sports Council.</p>
            <p>Present the digital QR code at the security checkpoint upon request.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: `Download ${APP_CONFIG.APP_NAME} Receipt`,
        });
      } else {
        await Print.printAsync({ html: htmlContent });
      }
      return uri;
    } catch (err) {
      console.warn('PDF generation error:', err);
      return null;
    }
  }
}
