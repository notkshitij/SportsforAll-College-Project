import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';
import { useAuthStore } from '../../store/authStore';
import { useStayExtensionStore } from '../../store/stayExtensionStore';
import { useThemeStore } from '../../store/themeStore';
import { StayExtension } from '../../types';
import {
  formatDateShort,
  formatDateTimeNice,
  formatTime12h,
} from '../../utils/dateUtils';
import { formatCurrencyINR } from '../../utils/formatUtils';

export default function HistoryScreen() {
  const router = useRouter();
  const { colors, isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const { extensions, setLastCreatedPass } = useStayExtensionStore();

  const studentUser = user as NonNullable<typeof user>;
  const studentPasses = extensions.filter(
    (e) => e.studentId === studentUser.id
  );

  const [filterTab, setFilterTab] = useState<'all' | 'valid' | 'expired'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredPasses = studentPasses.filter((pass) => {
    if (filterTab === 'valid' && pass.status !== 'valid') return false;
    if (filterTab === 'expired' && pass.status !== 'expired') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTxn = pass.transactionId.toLowerCase().includes(q);
      const matchReason = pass.reason.toLowerCase().includes(q);
      const matchDuration = `${pass.duration} hour`.includes(q);
      return matchTxn || matchReason || matchDuration;
    }

    return true;
  });

  const handleOpenQR = (pass: StayExtension) => {
    setLastCreatedPass(pass);
    router.push('/(student)/qr-display');
  };

  const handleOpenReceipt = (pass: StayExtension) => {
    setLastCreatedPass(pass);
    router.push('/(student)/receipt');
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderItem = ({ item }: { item: StayExtension }) => {
    const isValid = item.status === 'valid';
    const isExpanded = expandedId === item.id;

    return (
      <Card
        variant="outlined"
        onPress={() => toggleExpand(item.id)}
        style={[
          styles.historyCard,
          {
            borderColor: isValid ? colors.primary : colors.border,
          },
        ]}
      >
        <View style={styles.cardMainRow}>
          <View
            style={[
              styles.iconWrapper,
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
              name={isValid ? 'checkmark-circle' : 'time'}
              size={24}
              color={isValid ? colors.success : colors.danger}
            />
          </View>

          <View style={styles.cardContent}>
            <View style={styles.topInfoRow}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {formatDateShort(item.createdAt)} - {item.duration} Hour
                {item.duration > 1 ? 's' : ''} Stay
              </Text>
              <Badge
                label={isValid ? 'PAID / VALID' : 'EXPIRED'}
                variant={isValid ? 'valid' : 'expired'}
                size="sm"
              />
            </View>

            <Text style={[styles.cardDate, { color: colors.textMuted }]}>
              Issued: {formatDateTimeNice(item.createdAt)}
            </Text>

            <View style={styles.validUntilRow}>
              <Text style={[styles.validLabel, { color: colors.textSecondary }]}>
                Valid Until:{' '}
                <Text style={{ color: isValid ? colors.success : colors.danger, fontWeight: '700' }}>
                  {formatTime12h(item.validUntil)}
                </Text>
              </Text>
              <Text style={[styles.amountText, { color: colors.primary }]}>
                {formatCurrencyINR(item.amount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Expanded View Actions */}
        {isExpanded && (
          <View style={styles.expandedSection}>
            <View style={styles.expandedDetails}>
              <Text style={[styles.expItem, { color: colors.textSecondary }]}>
                • TXN ID: <Text style={{ fontWeight: '700', color: colors.text }}>{item.transactionId}</Text>
              </Text>
              <Text style={[styles.expItem, { color: colors.textSecondary }]}>
                • Method: UPI ({item.upiApp || 'Online'})
              </Text>
              {item.reason ? (
                <Text style={[styles.expItem, { color: colors.textSecondary }]}>
                  • Reason: {item.reason}
                </Text>
              ) : null}
            </View>

            <View style={styles.expandedActionRow}>
              <Button
                title="View QR Code"
                variant="primary"
                size="sm"
                icon="qr-code-outline"
                onPress={() => handleOpenQR(item)}
                style={styles.expBtn}
              />
              <Button
                title="E-Receipt"
                variant="outline"
                size="sm"
                icon="receipt-outline"
                onPress={() => handleOpenReceipt(item)}
                style={styles.expBtn}
              />
            </View>
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Pass History"
        subtitle="All Past Passes & Payments"
      />

      {/* Filter Tabs */}
      <View style={styles.filterTabsRow}>
        <TouchableOpacity
          onPress={() => setFilterTab('all')}
          style={[
            styles.filterTab,
            filterTab === 'all' && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
            { borderColor: colors.border },
          ]}
        >
          <Text
            style={[
              styles.filterTabText,
              { color: filterTab === 'all' ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            All ({studentPasses.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFilterTab('valid')}
          style={[
            styles.filterTab,
            filterTab === 'valid' && {
              backgroundColor: colors.success,
              borderColor: colors.success,
            },
            { borderColor: colors.border },
          ]}
        >
          <Text
            style={[
              styles.filterTabText,
              { color: filterTab === 'valid' ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            Valid
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFilterTab('expired')}
          style={[
            styles.filterTab,
            filterTab === 'expired' && {
              backgroundColor: colors.danger,
              borderColor: colors.danger,
            },
            { borderColor: colors.border },
          ]}
        >
          <Text
            style={[
              styles.filterTabText,
              { color: filterTab === 'expired' ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            Expired
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Box */}
      <View style={styles.searchContainer}>
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
            placeholder="Search by TXN ID or Reason..."
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

      {/* Passes List */}
      <FlatList
        data={filteredPasses}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="documents-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Passes Found
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {searchQuery
                ? 'Try a different search keyword.'
                : 'Your pass history will appear here once you purchase a pass.'}
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
  filterTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchContainer: {
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
    gap: 12,
  },
  historyCard: {
    padding: 16,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 2,
  },
  topInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardDate: {
    fontSize: 11,
  },
  validUntilRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  validLabel: {
    fontSize: 12,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '800',
  },
  expandedSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.15)',
    gap: 10,
  },
  expandedDetails: {
    gap: 4,
  },
  expItem: {
    fontSize: 12,
  },
  expandedActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  expBtn: {
    flex: 1,
  },
  emptyContainer: {
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
    maxWidth: 260,
  },
});
