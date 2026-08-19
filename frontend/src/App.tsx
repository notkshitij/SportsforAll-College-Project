import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { StudentPassVerificationCard } from './components/StudentPassVerificationCard';
import { MonthlyReport } from './components/MonthlyReport';
import { NotFound } from './components/NotFound';
import { Toast, ToastMessage } from './components/Toast';
import { VerificationService } from './services/verificationService';
import { audioFeedback } from './services/audioService';
import { StayExtension, VerificationResult } from './types';
import { APP_CONFIG } from './constants/config';
import { QrCode, ShieldCheck, Clock } from './components/icons';
import './App.css';

type RouteType = 'scanner' | 'monthly' | 'not-found';

function getRouteFromPath(pathname: string): RouteType {
  const clean = pathname.toLowerCase().replace(/\/+$/, '');
  if (clean === '' || clean === '/' || clean === '/index.html' || clean === '/scanner') {
    return 'scanner';
  }
  if (clean === '/monthly') {
    return 'monthly';
  }
  return 'not-found';
}

export function App() {
  const [currentRoute, setCurrentRoute] = useState<RouteType>(() => {
    return getRouteFromPath(window.location.pathname);
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('poornima_guard_theme') === 'dark';
  });

  const [guardName] = useState(() => {
    return localStorage.getItem('poornima_guard_name') || APP_CONFIG.DEFAULT_GUARD.name;
  });

  const [activeResult, setActiveResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Navigation handler
  const handleNavigate = (route: RouteType) => {
    setCurrentRoute(route);
    const targetPath = route === 'monthly' ? '/monthly' : route === 'scanner' ? '/' : window.location.pathname;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(getRouteFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
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

  // Toast notifications helper
  const addToast = useCallback(
    (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
      const id = `toast_${Date.now()}_${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Perform pass verification
  const handleVerify = async (rawInput: string) => {
    setIsLoading(true);
    try {
      let queryInput = rawInput.trim();
      if (queryInput.includes('?pass=') || queryInput.includes('&pass=')) {
        try {
          const parsedUrl = new URL(queryInput, window.location.origin);
          const passFromUrl = parsedUrl.searchParams.get('pass');
          if (passFromUrl) {
            queryInput = passFromUrl;
          }
        } catch {
          // Ignore URL parse error and fallback to raw string
        }
      }

      const res = await VerificationService.verifyCodeOrId(queryInput);
      setActiveResult(res);
      setCurrentRoute('scanner');

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
    } catch (err: any) {
      audioFeedback.playWarningBuzzer();
      addToast(err.message || 'Pass not found.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-verify pass on page load if query parameters are present in URL
  useEffect(() => {
    const search = window.location.search;
    if (search.includes('booking_id=') || search.includes('pass=')) {
      handleVerify(window.location.href);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Approve student entry or exit
  const handleApproveEntry = async (pass: StayExtension) => {
    try {
      const type = activeResult?.qrType || 'entry';
      await VerificationService.approvePass(pass.id, guardName, type);
      audioFeedback.playSuccessChime();
      const isExit = type === 'exit';
      addToast(
        isExit
          ? `🎉 Exit Approved for ${pass.studentName}! Check-out recorded.`
          : `🎉 Entry Approved for ${pass.studentName}! Gate Opened.`,
        'success'
      );
    } catch (err: any) {
      addToast('Error confirming pass: ' + err.message, 'error');
    }
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        currentRoute={currentRoute === 'monthly' ? 'monthly' : 'scanner'}
        onNavigate={(r) => handleNavigate(r)}
      />

      {/* Main Content Area */}
      <main className="verification-main-content">
        {currentRoute === 'not-found' ? (
          /* 404 Page Not Found */
          <NotFound onGoHome={() => handleNavigate('scanner')} />
        ) : currentRoute === 'monthly' ? (
          /* Monthly Records Tabular View */
          <MonthlyReport onBackToScanner={() => handleNavigate('scanner')} />
        ) : isLoading ? (
          /* Loading State */
          <div className="standby-card">
            <div className="loading-spinner"></div>
            <h3>Verifying Student Pass...</h3>
            <p>Fetching official payment and stay records from Poornima University server</p>
          </div>
        ) : activeResult ? (
          /* Student Pass Fee Receipt & Verification Details */
          <StudentPassVerificationCard
            result={activeResult}
            onApprove={handleApproveEntry}
          />
        ) : (
          /* Clean Standby State (Waiting for scan from any camera/scanner) */
          <div className="standby-card">
            <div className="standby-icon-box">
              <QrCode size={48} color="var(--primary)" />
            </div>
            <h2>Scan Student QR Code</h2>
            <p className="standby-desc">
              Scan the student's <strong>Sportsforall Digital QR Pass</strong> using any camera or scanner app to view complete fee receipt details & approve facility access.
            </p>
            <div className="standby-info-row">
              <div className="standby-chip">
                <Clock size={16} color="var(--primary)" />
                <span>Operating Hours: 4:00 PM – 8:00 PM</span>
              </div>
              <div className="standby-chip">
                <ShieldCheck size={16} color="var(--success)" />
                <span>Live Database Verification</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="portal-footer">
        <p>Developed by Manvendra Singh & Kshitij Jain</p>
      </footer>

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
