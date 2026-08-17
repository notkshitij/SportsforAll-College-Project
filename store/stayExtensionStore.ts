import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { INITIAL_EXTENSIONS, INITIAL_SCAN_LOGS } from '../services/mockDb';
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
          const refreshed = StayExtensionService.refreshExtensionStatuses(state.extensions);
          if (refreshed === state.extensions) {
            return state;
          }
          return {
            extensions: refreshed,
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
          activePass: INITIAL_EXTENSIONS[0],
          lastCreatedPass: INITIAL_EXTENSIONS[0],
          lastScanResult: null,
        });
      },
    }),
    {
      name: 'sportsforall-extensions-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.refreshStatuses();
        }
      },
    }
  )
);
