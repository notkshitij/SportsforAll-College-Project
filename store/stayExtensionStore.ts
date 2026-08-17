import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { INITIAL_EXTENSIONS, INITIAL_SCAN_LOGS } from '../services/mockDb';
import { PassHistoryService } from '../services/passHistoryService';
import { StayExtensionService } from '../services/stayExtensionService';
import { ScanLog, ScanResultType, StayExtension, User } from '../types';

interface StayExtensionState {
  extensions: StayExtension[];
  scanLogs: ScanLog[];
  activePass: StayExtension | null;
  lastCreatedPass: StayExtension | null;
  lastScanResult: {
    scanLog: ScanLog;
    scanResult: ScanResultType;
    studentName: string;
    enrollment: string;
    studentYear?: string;
    validFrom?: string;
    validUntil: string;
    reason?: string;
    remainingFormatted?: string;
  } | null;

  // Actions
  addExtension: (extension: StayExtension) => void;
  getStudentExtensions: (studentId: string) => StayExtension[];
  getActivePassForStudent: (studentId: string) => StayExtension | null;
  refreshStatuses: () => void;
  recordScanLog: (log: ScanLog) => void;
  verifyCodeAndLog: (
    rawCode: string,
    guard: User
  ) => {
    scanLog: ScanLog;
    scanResult: ScanResultType;
    studentName: string;
    enrollment: string;
    studentYear?: string;
    validFrom?: string;
    validUntil: string;
    reason?: string;
    remainingFormatted?: string;
  };
  setLastCreatedPass: (pass: StayExtension | null) => void;
  clearLastScanResult: () => void;
  resetToDefaults: () => void;
}

export const useStayExtensionStore = create<StayExtensionState>()(
  persist(
    (set, get) => ({
      extensions: INITIAL_EXTENSIONS,
      scanLogs: INITIAL_SCAN_LOGS,
      activePass: INITIAL_EXTENSIONS[0] || null,
      lastCreatedPass: INITIAL_EXTENSIONS[0] || null,
      lastScanResult: null,

      addExtension: (extension: StayExtension) => {
        set((state) => {
          const updated = [extension, ...state.extensions];
          return {
            extensions: updated,
            activePass: extension,
            lastCreatedPass: extension,
          };
        });

        // Permanently store the FULL pass in Supabase (never deleted from
        // there, regardless of local 7-day pruning). Fire-and-forget so
        // pass creation isn't blocked by network latency.
        PassHistoryService.upsertPass(extension).catch((e) =>
          console.warn('Pass history sync failed:', e?.message)
        );
      },

      getStudentExtensions: (studentId: string) => {
        const { extensions } = get();
        return extensions.filter((e) => e.studentId === studentId);
      },

      getActivePassForStudent: (studentId: string) => {
        const { extensions } = get();
        return StayExtensionService.getActiveStudentPass(extensions, studentId);
      },

      refreshStatuses: () => {
        set((state) => {
          const refreshedStatuses = StayExtensionService.refreshExtensionStatuses(state.extensions);
          // Anything older than 7 days quietly stops being shown on this
          // device (it stays in Supabase forever via PassHistoryService).
          const pruned = StayExtensionService.pruneOldExtensions(refreshedStatuses, 7);

          if (pruned === state.extensions) {
            return state;
          }
          return {
            extensions: pruned,
          };
        });
      },

      recordScanLog: (log: ScanLog) => {
        set((state) => ({
          scanLogs: [log, ...state.scanLogs],
        }));
      },

      verifyCodeAndLog: (rawCode: string, guard: User) => {
        const { extensions } = get();
        const result = StayExtensionService.verifyScannedCode(rawCode, guard, extensions);
        
        // Append to scan logs
        set((state) => ({
          scanLogs: [result.scanLog, ...state.scanLogs],
          lastScanResult: result,
        }));

        return result;
      },

      setLastCreatedPass: (pass: StayExtension | null) => {
        set({ lastCreatedPass: pass });
      },

      clearLastScanResult: () => {
        set({ lastScanResult: null });
      },

      resetToDefaults: () => {
        set({
          extensions: INITIAL_EXTENSIONS,
          scanLogs: INITIAL_SCAN_LOGS,
          activePass: INITIAL_EXTENSIONS[0] || null,
          lastCreatedPass: INITIAL_EXTENSIONS[0] || null,
          lastScanResult: null,
        });
      },
    }),
    {
      name: 'sportsforall-extensions-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 3,
      // v1 -> v2: strip out the old seeded fake demo passes/scan logs
      // (ext_001..003, scan_001..004) that used to ship pre-installed.
      // v2 -> v3: one-time full local wipe of pre-Supabase-sync legacy passes & scan logs.
      migrate: (persistedState: any, version) => {
        if (!persistedState) return persistedState;

        if (version < 2) {
          const FAKE_EXTENSION_IDS = new Set(['ext_001', 'ext_002', 'ext_003']);
          const FAKE_SCAN_IDS = new Set(['scan_001', 'scan_002', 'scan_003', 'scan_004']);
          persistedState.extensions = (persistedState.extensions || []).filter(
            (e: StayExtension) => !FAKE_EXTENSION_IDS.has(e.id)
          );
          persistedState.scanLogs = (persistedState.scanLogs || []).filter(
            (s: ScanLog) => !FAKE_SCAN_IDS.has(s.id)
          );
          if (persistedState.activePass && FAKE_EXTENSION_IDS.has(persistedState.activePass.id)) {
            persistedState.activePass = null;
          }
          if (
            persistedState.lastCreatedPass &&
            FAKE_EXTENSION_IDS.has(persistedState.lastCreatedPass.id)
          ) {
            persistedState.lastCreatedPass = null;
          }
        }

        if (version < 3) {
          persistedState.extensions = [];
          persistedState.scanLogs = [];
          persistedState.activePass = null;
          persistedState.lastCreatedPass = null;
        }

        return persistedState;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.refreshStatuses();
        }
      },
    }
  )
);
