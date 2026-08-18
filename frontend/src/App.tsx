import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { QRScanner } from './components/QRScanner';
import { ManualLookup } from './components/ManualLookup';
import { VerificationModal } from './components/VerificationModal';
import { RecentScansList } from './components/RecentScansList';
import { GuardAuthModal } from './components/GuardAuthModal';
import { Toast, ToastMessage } from './components/Toast';
import { VerificationService } from './services/verificationService';
import { audioFeedback } from './services/audioService';
import { ScanLog, StayExtension, VerificationResult } from './types';
import { APP_CONFIG } from './constants/config';
import './App.css';

export function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('poornima_guard_theme') === 'dark';
  });

  const [guardName, setGuardName] = useState(() => {
    return localStorage.getItem('poornima_guard_name') || APP_CONFIG.DEFAULT_GUARD.name;
  });

  const [guardBadge, setGuardBadge] = useState(() => {
    return localStorage.getItem('poornima_guard_badge') || APP_CONFIG.DEFAULT_GUARD.enrollment;
  });

  const [scans, setScans] = useState<ScanLog[]>([]);
  const [activeResult, setActiveResult] = useState<VerificationResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Load initial scans on mount
  useEffect(() => {
    const loadedScans = VerificationService.getRecentScans();
    setScans(loadedScans);
  }, []);

  // Sync theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('poornima_guard_theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('poornima_guard_theme', 'light');
    }
  }, [isDarkMode]);

  // Add toast helper
  const addToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Perform pass verification
  const handleVerify = async (rawInput: string) => {
    setIsLoading(true);
    try {
      const res = await VerificationService.verifyCodeOrId(rawInput);
      setActiveResult(res);
      setIsModalOpen(true);

      // Play audio feedback
      if (res.scanResult === 'valid') {
        audioFeedback.playSuccessChime();
        addToast(`✅ Valid Pass: ${res.pass.studentName}`, 'success');
      } else if (res.scanResult === 'expired') {
        audioFeedback.playWarningBuzzer();
        addToast(`⚠️ Expired Pass: ${res.pass.studentName}`, 'warning');
      } else {
        audioFeedback.playWarningBuzzer();
        addToast(`❌ Invalid / Flagged: ${res.errorReason || 'Access Denied'}`, 'error');
      }

      // Log the scan
      const newScanLog: ScanLog = {
        id: `scan_${Date.now()}`,
        guardId: guardBadge,
        guardName: guardName,
        studentId: res.pass.studentId,
        studentName: res.pass.studentName,
        enrollment: res.pass.studentEnrollment,
        studentYear: res.pass.studentYear,
        department: res.pass.department,
        transactionId: res.pass.transactionId,
        amount: res.pass.amount || 100,
        validFrom: res.pass.validFrom,
        validUntil: res.pass.validUntil,
        scanResult: res.scanResult,
        actionTaken: res.scanResult === 'valid' ? 'Approved' : 'Inspected',
        reason: res.errorReason,
        scannedAt: new Date().toISOString(),
      };

      VerificationService.saveScanLog(newScanLog);
      setScans(VerificationService.getRecentScans());
    } catch (err: any) {
      audioFeedback.playWarningBuzzer();
      addToast(err.message || 'Pass not found.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Approve student entry
  const handleApproveEntry = async (pass: StayExtension) => {
    try {
      await VerificationService.approvePass(pass.id, guardName);
      addToast(`🎉 Entry granted for ${pass.studentName}! Gate Opened.`, 'success');
      setIsModalOpen(false);
      // Refresh scans
      setScans(VerificationService.getRecentScans());
    } catch (err: any) {
      addToast('Error approving pass: ' + err.message, 'error');
    }
  };

  // Flag student pass
  const handleFlagPass = async (pass: StayExtension, reason: string) => {
    try {
      await VerificationService.flagPass(pass.id, guardName, reason);
      addToast(`⚠️ Pass for ${pass.studentName} flagged and rejected.`, 'warning');
      setIsModalOpen(false);
      // Refresh scans
      setScans(VerificationService.getRecentScans());
    } catch (err: any) {
      addToast('Error flagging pass: ' + err.message, 'error');
    }
  };

  // Switch active guard officer
  const handleSelectGuard = (name: string, badge: string) => {
    setGuardName(name);
    setGuardBadge(badge);
    localStorage.setItem('poornima_guard_name', name);
    localStorage.setItem('poornima_guard_badge', badge);
    addToast(`Active officer switched to ${name}`, 'info');
  };

  // Clear scans
  const handleClearScans = () => {
    if (window.confirm('Are you sure you want to clear the local verification history?')) {
      localStorage.removeItem('poornima_guard_recent_scans_v2');
      setScans([]);
      addToast('Scan log history cleared.', 'info');
    }
  };

  // Re-open scan details from table
  const handleSelectScanFromTable = (scan: ScanLog) => {
    handleVerify(scan.transactionId || scan.enrollment || scan.studentName);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <Header
        guardName={guardName}
        guardBadge={guardBadge}
        onSwitchGuard={() => setIsAuthModalOpen(true)}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Top Statistics Bar */}
      <StatsBar scans={scans} />

      {/* Main Grid: Scanner & Manual Search */}
      <div className="portal-main-grid">
        <div className="scanner-column">
          <QRScanner
            onScanSuccess={(qrData) => handleVerify(qrData)}
            onError={(msg) => addToast(msg, 'error')}
          />
        </div>

        <div className="info-column">
          <ManualLookup onVerify={handleVerify} isLoading={isLoading} />
        </div>
      </div>

      {/* Full Verification History & Audit Log */}
      <RecentScansList
        scans={scans}
        onSelectScan={handleSelectScanFromTable}
        onClearScans={handleClearScans}
      />

      {/* Footer */}
      <footer className="portal-footer">
        <p>
          © {new Date().getFullYear()} {APP_CONFIG.UNIVERSITY_NAME} • Campus Security & Sports Pass
          Verification System
        </p>
      </footer>

      {/* Student Verification Pass Modal */}
      <VerificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        result={activeResult}
        onApprove={handleApproveEntry}
        onFlag={handleFlagPass}
      />

      {/* Guard Authentication / Switch Modal */}
      <GuardAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentGuardName={guardName}
        onSelectGuard={handleSelectGuard}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
