import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';
import { useStayExtensionStore } from '../../store/stayExtensionStore';
import { useThemeStore } from '../../store/themeStore';
import { ScanLog } from '../../types';
import { formatDateTimeNice, formatTime12h } from '../../utils/dateUtils';

export default function ScanLogsScreen() {
  const { colors, isDarkMode } = useThemeStore();
  const { scanLogs } = useStayExtensionStore();

  const [filter, setFilter] = useState<'all' | 'valid' | 'expired' | 'invalid'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = scanLogs.filter((log) => {
    if (filter === 'valid' && log.scanResult !== 'valid') return false;
    if (filter === 'expired' && log.scanResult !== 'expired') return false;
    if (filter === 'invalid' && log.scanResult !== 'invalid') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = log.studentName.toLowerCase().includes(q);
      const matchEnroll = log.enrollment.toLowerCase().includes(q);
      const matchTxn = log.transactionId.toLowerCase().includes(q);
      return matchName || matchEnroll || matchTxn;
    }

    return true;
  });

  const renderItem = ({ item }: { item: ScanLog }) => {
    const isValid = item.scanResult === 'valid';
    const isExpired = item.scanResult === 'expired';

    return (
      <Card
        variant="outlined"
        style={[
          styles.logCard,
          {
            borderColor: isValid
              ? 'rgba(16, 185, 129, 0.3)'
              : 'rgba(239, 68, 68, 0.3)',
          },
        ]}
      >
        <View style={styles.logMainRow}>
          <View
            style={[
              styles.logIcon,
              {
                backgroundColor: isValid
                  ? isDarkMode
                    ? 'rgba(16, 185, 129, 0.2)'
                    : '#D1FAE5'
                  : isDarkMode
                  ? 'rgba(239, 68, 68, 0.15)'
                  : '#FEE2E2',
              },
            ]}
          >
            <Ionicons
              name={isValid ? 'checkmark-circle' : isExpired ? 'time' : 'close-circle'}
              size={22}
              color={isValid ? colors.success : colors.danger}
            />
          </View>

          <View style={styles.logDetails}>
            <View style={styles.logTopLine}>
              <Text style={[styles.studentName, { color: colors.text }]} numberOfLines={1}>
                {item.studentName}
              </Text>
              <Badge
                label={isValid ? 'VALID' : isExpired ? 'EXPIRED' : 'INVALID'}
                variant={isValid ? 'valid' : 'expired'}
                size="sm"
              />
            </View>

            <Text style={[styles.logMeta, { color: colors.textSecondary }]}>
              ID: {item.enrollment}{item.studentYear ? ` • ${item.studentYear}` : ''} • Scanned at: {formatTime12h(item.scannedAt)}
            </Text>

            <Text style={[styles.logDate, { color: colors.textMuted }]}>
              {formatDateTimeNice(item.scannedAt)}
            </Text>

            {item.reason ? (
              <View style={styles.reasonRow}>
                <Ionicons name="alert-circle-outline" size={14} color={colors.danger} />
                <Text style={[styles.reasonText, { color: colors.danger }]}>
                  {item.reason}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Security Scan Logs"
        subtitle="Audited Pass Verification History"
      />

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          onPress={() => setFilter('all')}
          style={[
            styles.filterBtn,
            filter === 'all' && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
            { borderColor: colors.border },
          ]}
        >
          <Text
            style={[
              styles.filterBtnText,
              { color: filter === 'all' ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            All ({scanLogs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFilter('valid')}
          style={[
            styles.filterBtn,
            filter === 'valid' && {
              backgroundColor: colors.success,
              borderColor: colors.success,
            },
            { borderColor: colors.border },
          ]}
        >
          <Text
            style={[
              styles.filterBtnText,
              { color: filter === 'valid' ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            Valid
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFilter('expired')}
          style={[
            styles.filterBtn,
            filter === 'expired' && {
              backgroundColor: '#EF4444',
              borderColor: '#EF4444',
            },
            { borderColor: colors.border },
          ]}
        >
          <Text
            style={[
              styles.filterBtnText,
              { color: filter === 'expired' ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            Expired
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFilter('invalid')}
          style={[
            styles.filterBtn,
            filter === 'invalid' && {
              backgroundColor: '#F59E0B',
              borderColor: '#F59E0B',
            },
            { borderColor: colors.border },
          ]}
        >
          <Text
            style={[
              styles.filterBtnText,
              { color: filter === 'invalid' ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            Invalid
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <View
          style={[
            styles.searchWrapper,
            {
              backgroundColor: isDarkMode ? colors.surfaceCard : '#FFFFFF',
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            placeholder="Search student name or reg. no..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Logs List */}
      <FlatList
        data={filteredLogs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="clipboard-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Scan Logs Found
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {searchQuery
                ? 'No matches found for your search term.'
                : 'Scanned student QR passes will be logged here.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 6,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  searchBox: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingBottom: 110,
    gap: 10,
  },
  logCard: {
    padding: 14,
  },
  logMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  logIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logDetails: {
    flex: 1,
    gap: 2,
  },
  logTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  logMeta: {
    fontSize: 12,
  },
  logDate: {
    fontSize: 11,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  reasonText: {
    fontSize: 11,
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
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 280,
  },
});
