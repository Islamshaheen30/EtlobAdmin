import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Text, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@/hooks/useApp';
import { useOrders } from '@/hooks/useOrders';
import { OrderCard, TopBar } from '@/components';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { OrderStatus } from '@/services/mockData';

const STATUS_FILTERS: (OrderStatus | 'all')[] = ['all', 'pending', 'accepted', 'preparing', 'dispatched', 'delivered', 'cancelled'];

export default function OrdersScreen() {
  const { colors, t, isRTL, theme } = useApp();
  const { orders, newOrderCount, clearNewOrderCount } = useOrders();
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const statusLabel: Record<string, string> = {
    all: t('allStatuses'),
    pending: t('pending'),
    accepted: t('accepted'),
    preparing: t('preparing'),
    dispatched: t('dispatched'),
    delivered: t('deliveredStatus'),
    cancelled: t('cancelledStatus'),
  };

  const filtered = useMemo(() => {
    let result = orders;
    if (filter !== 'all') result = result.filter(o => o.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(o =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        o.restaurant.toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, filter, search]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <TopBar title={t('orders')} showBadge badgeCount={newOrderCount} />

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.inputBg, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <MaterialIcons name="search" size={18} color={colors.icon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}
            placeholder={t('search')}
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <Pressable onPress={() => setSearch('')}>
              <MaterialIcons name="close" size={16} color={colors.icon} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Filter Chips */}
      <View style={[styles.filterWrap, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {STATUS_FILTERS.map(s => {
            const isActive = filter === s;
            const count = s === 'all' ? orders.length : orders.filter(o => o.status === s).length;
            return (
              <Pressable
                key={s}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isActive ? Colors.brand : colors.inputBg,
                    borderColor: isActive ? Colors.brand : colors.border,
                  },
                ]}
                onPress={() => { setFilter(s); clearNewOrderCount(); }}
              >
                <Text style={[styles.chipText, { color: isActive ? '#000' : colors.textSecondary }]}>
                  {statusLabel[s]}
                </Text>
                <Text style={[styles.chipCount, { color: isActive ? '#00000099' : colors.textMuted }]}>
                  {count}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Orders List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {filtered.length > 0 ? (
          filtered.map(order => <OrderCard key={order.id} order={order} />)
        ) : (
          <View style={[styles.empty, { backgroundColor: colors.card }]}>
            <MaterialIcons name="inbox" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('noOrders')}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  searchWrap: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1 },
  searchBar: { alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.sm, paddingVertical: 10, borderRadius: Radius.md },
  searchInput: { flex: 1, fontSize: FontSize.base },
  filterWrap: { borderBottomWidth: 1 },
  filterScroll: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1 },
  chipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  chipCount: { fontSize: FontSize.xs },
  list: { padding: Spacing.md, paddingBottom: 40 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, borderRadius: Radius.md, gap: Spacing.sm, marginTop: Spacing.xl },
  emptyText: { fontSize: FontSize.base },
});
