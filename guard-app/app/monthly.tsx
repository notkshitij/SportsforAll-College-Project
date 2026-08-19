import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../src/components/Header';
import { Toast } from '../src/components/Toast';
import { ExportService } from '../src/services/exportService';
import { VerificationService } from '../src/services/verificationService';
import { useThemeStore } from '../src/store/themeStore';
import { StayExtension, ToastMessage } from '../src/types';
import { formatDateTimeNice, formatTime12h } from '../src/utils/dateUtils';

export default function MonthlyReportScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();

  const [records, setRecords] = useState<StayExtension[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Approved' | 'CheckedOut' | 'Expired' | 'Flagged'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

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

  const fetchRecords = async () => {
    try {
      const data = await VerificationService.getAllPassRecords();
      setRecords(data);
    } catch (err: any) {
      addToast('Failed to fetch records: ' + err.message, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecords();
  };

  // Helper to compute pass status
  const getPassComputedStatus = (item: StayExtension): 'Approved' | 'CheckedOut' | 'Expired' | 'Flagged' | 'Valid' => {
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
  };

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      // Search filter
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        item.studentName?.toLowerCase().includes(term) ||
        item.studentEnrollment?.toLowerCase().includes(term) ||
        item.department?.toLowerCase().includes(term) ||
        item.transactionId?.toLowerCase().includes(term) ||
        item.email?.toLowerCase().includes(term);

      if (!matchSearch) return false;

      // Status filter
      const computed = getPassComputedStatus(item);
      if (statusFilter !== 'all') {
        if (statusFilter === 'Approved' && computed !== 'Approved' && computed !== 'Valid') return false;
        if (statusFilter === 'CheckedOut' && computed !== 'CheckedOut') return false;
        if (statusFilter === 'Expired' && computed !== 'Expired') return false;
        if (statusFilter === 'Flagged' && computed !== 'Flagged') return false;
      }

      // Month filter
      if (selectedMonth !== 'all') {
        const itemMonth = new Date(item.createdAt).getMonth().toString();
        if (itemMonth !== selectedMonth) return false;
      }

      return true;
    });
  }, [records, searchTerm, statusFilter, selectedMonth]);

  const handleExportCSV = async () => {
    if (filteredRecords.length === 0) {
      addToast('No records match current filters.', 'warning');
      return;
    }
    setIsExporting(true);
    try {
      await ExportService.exportToCSV(filteredRecords);
      addToast('CSV export generated successfully!', 'success');
    } catch (err: any) {
      addToast('Export failed: ' + err.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintPDF = async () => {
    if (filteredRecords.length === 0) {
      addToast('No records match current filters.', 'warning');
      return;
    }
    setIsPrinting(true);
    try {
      await ExportService.printReportPDF(filteredRecords);
    } catch (err: any) {
      addToast('Print failed: ' + err.message, 'error');
    } finally {
      setIsPrinting(false);
    }
  };

  const renderStatusPill = (status: 'Approved' | 'CheckedOut' | 'Expired' | 'Flagged' | 'Valid') => {
    let bg = colors.successLight;
    let text = colors.successDark;
    let label = 'Approved / In';

    if (status === 'CheckedOut') {
      bg = colors.infoLight;
      text = colors.primary;
      label = 'Checked Out';
    } else if (status === 'Expired') {
      bg = colors.dangerLight;
      text = colors.danger;
      label = 'Expired';
    } else if (status === 'Flagged') {
      bg = colors.warningLight;
      text = colors.warningDark;
      label = 'Flagged';
    } else if (status === 'Valid') {
      bg = colors.successLight;
      text = colors.success;
      label = 'Valid';
    }

    return (
      <View style={[styles.statusPill, { backgroundColor: bg }]}>
        <Text style={[styles.statusPillText, { color: text }]}>{label}</Text>
      </View>
    );
  };

  const renderItem = ({ item, index }: { item: StayExtension; index: number }) => {
    const computed = getPassComputedStatus(item);

    return (
      <View
        style={[
          styles.rowCard,
          {
            backgroundColor: colors.surfaceCard,
            borderColor: colors.borderLight,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={[styles.indexNumber, { color: colors.textMuted }]}>#{index + 1}</Text>
            <View>
              <Text style={[styles.studentName, { color: colors.primary }]}>{item.studentName}</Text>
              <Text style={[styles.studentEmail, { color: colors.textSecondary }]}>{item.email}</Text>
            </View>
          </View>
          {renderStatusPill(computed)}
        </View>

        <View style={[styles.cardDivider, { backgroundColor: colors.borderLight }]} />

        <View style={styles.cardGrid}>
          <View style={styles.gridCol}>
            <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Roll Number</Text>
            <Text style={[styles.gridValue, { color: colors.text }]}>{item.studentEnrollment || '—'}</Text>
          </View>

          <View style={styles.gridCol}>
            <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Department</Text>
            <Text style={[styles.gridValue, { color: colors.text }]}>{item.department || '—'}</Text>
          </View>

          <View style={styles.gridCol}>
            <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Stay Window</Text>
            <Text style={[styles.gridValue, { color: colors.text }]}>
              {formatTime12h(item.validFrom || item.createdAt)} – {formatTime12h(item.validUntil)}
            </Text>
          </View>

          <View style={styles.gridCol}>
            <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Transaction ID</Text>
            <Text style={[styles.gridValue, { color: colors.text }]}>{item.transactionId || '—'}</Text>
          </View>

          <View style={styles.gridCol}>
            <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Amount / Paid</Text>
            <Text style={[styles.gridValue, { color: colors.text, fontWeight: '700' }]}>
              ₹{item.amount || 100} ({item.paymentMethod || 'UPI'})
            </Text>
          </View>

          <View style={styles.gridCol}>
            <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Verified By</Text>
            <Text style={[styles.gridValue, { color: colors.text }]}>Gate Guard</Text>
          </View>
        </View>

        <View style={[styles.cardFooter, { borderTopColor: colors.borderLight }]}>
          <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
          <Text style={[styles.footerDate, { color: colors.textMuted }]}>
            Issued: {formatDateTimeNice(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 6, paddingHorizontal: 16 }]}>
      <Header currentRoute="monthly" />

      {/* Control Panel: Search, Filter, Actions */}
      <View style={[styles.controlCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by student name, roll no, txn ID..."
            placeholderTextColor={colors.textMuted}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(['all', 'Approved', 'CheckedOut', 'Expired', 'Flagged'] as const).map((st) => (
            <TouchableOpacity
              key={st}
              style={[
                styles.filterChip,
                {
                  backgroundColor: statusFilter === st ? colors.primary : colors.backgroundSubtle,
                  borderColor: statusFilter === st ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setStatusFilter(st)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: statusFilter === st ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                {st === 'all'
                  ? 'All Status'
                  : st === 'Approved'
                  ? 'Approved / In'
                  : st === 'CheckedOut'
                  ? 'Checked Out'
                  : st}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Action Buttons: CSV + Print */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={handleExportCSV}
            disabled={isExporting}
            activeOpacity={0.8}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="download-outline" size={16} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>Export CSV</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderWidth: 1 }]}
            onPress={handlePrintPDF}
            disabled={isPrinting}
            activeOpacity={0.8}
          >
            {isPrinting ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <>
                <Ionicons name="print-outline" size={16} color={colors.text} />
                <Text style={[styles.actionBtnText, { color: colors.text }]}>Print / PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Record Counter */}
      <View style={styles.countRow}>
        <Text style={[styles.countText, { color: colors.textSecondary }]}>
          Showing <Text style={{ fontWeight: '800', color: colors.text }}>{filteredRecords.length}</Text> of{' '}
          {records.length} records
        </Text>
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading records...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRecords}
          keyExtractor={(item) => item.id || item.transactionId}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="document-text-outline" size={44} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No records found</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                Try adjusting your search query or filters.
              </Text>
            </View>
          }
        />
      )}

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  controlCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    height: '100%',
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  countRow: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 40,
    gap: 10,
  },
  rowCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  indexNumber: {
    fontSize: 12,
    fontWeight: '700',
  },
  studentName: {
    fontSize: 14,
    fontWeight: '800',
  },
  studentEmail: {
    fontSize: 11,
    marginTop: 1,
  },
  cardDivider: {
    height: 1,
    width: '100%',
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
  },
  gridCol: {
    width: '50%',
    gap: 2,
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  gridValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  footerDate: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 9999,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 12,
  },
});
