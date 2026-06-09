import React from 'react';
import { View, ScrollView, StyleSheet, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@/hooks/useApp';
import { useOrders } from '@/hooks/useOrders';
import { getDashboardStats, getWeeklyData } from '@/services/mockData';
import { StatCard, SectionHeader, MiniBarChart, OrderCard, TopBar } from '@/components';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';

export default function DashboardScreen() {
  const { colors, t, isRTL, theme } = useApp();
  const { orders, newOrderCount, clearNewOrderCount } = useOrders();
  const stats = getDashboardStats();
  const weekly = getWeeklyData();

  const recentOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').slice(0, 5);
  const pendingCount = orders.filter(o => o.status === 'pending').length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <TopBar title={t('etlobAdmin')} subtitle={t('hello')} showBadge badgeCount={newOrderCount} />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        onScrollBeginDrag={clearNewOrderCount}
      >
        {/* Alert Banner */}
        {pendingCount > 0 ? (
          <View style={[styles.alertBanner, { backgroundColor: `${Colors.warning}22`, borderColor: `${Colors.warning}44` }]}>
            <MaterialIcons name="warning-amber" size={18} color={Colors.warning} />
            <Text style={[styles.alertText, { color: Colors.warning }]}>
              {pendingCount} {t('pendingOrders')} – {t('assignRider')}
            </Text>
          </View>
        ) : null}

        {/* Stat Grid */}
        <View style={styles.grid2}>
          <StatCard
            label={t('totalOrders')}
            value={stats.totalOrdersToday}
            icon="receipt-long"
            growth={stats.ordersGrowth}
            accent
          />
          <StatCard
            label={t('revenue')}
            value={`${stats.totalRevenue.toLocaleString()} ${t('egp')}`}
            icon="attach-money"
            growth={stats.revenueGrowth}
          />
        </View>
        <View style={styles.grid2}>
          <StatCard
            label={t('activeRiders')}
            value={stats.activeRiders}
            icon="delivery-dining"
            iconColor={Colors.info}
          />
          <StatCard
            label={t('activeRestaurants')}
            value={stats.activeRestaurants}
            icon="storefront"
            iconColor={Colors.success}
          />
        </View>
        <View style={styles.grid3}>
          <MiniStat label={t('delivered')} value={stats.deliveredToday} color={Colors.success} />
          <MiniStat label={t('cancelled')} value={stats.cancelledToday} color={Colors.danger} />
          <MiniStat label={t('avgDeliveryTime')} value={`${stats.avgDeliveryTime}m`} color={Colors.info} />
        </View>

        {/* Weekly Chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SectionHeader title={t('weeklyOverview')} icon="bar-chart" />
          <MiniBarChart data={weekly} mode="orders" />
        </View>

        {/* Live Orders */}
        <SectionHeader title={t('liveOrders')} icon="radio-button-on" />
        {recentOrders.length > 0 ? (
          recentOrders.map(order => <OrderCard key={order.id} order={order} />)
        ) : (
          <View style={[styles.empty, { backgroundColor: colors.card }]}>
            <MaterialIcons name="check-circle" size={32} color={Colors.success} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('noOrders')}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string | number; color: string }) {
  const { colors, isRTL } = useApp();
  return (
    <View style={[miniStyles.card, { backgroundColor: colors.card, borderColor: colors.border, flex: 1 }]}>
      <Text style={[miniStyles.value, { color }]}>{value}</Text>
      <Text style={[miniStyles.label, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>{label}</Text>
    </View>
  );
}

const miniStyles = StyleSheet.create({
  card: { borderRadius: Radius.md, padding: Spacing.sm, borderWidth: 1, alignItems: 'center' },
  value: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  label: { fontSize: 10, marginTop: 2, textAlign: 'center' },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 40 },
  grid2: { flexDirection: 'row', gap: Spacing.sm },
  grid3: { flexDirection: 'row', gap: Spacing.sm },
  chartCard: { borderRadius: Radius.md, borderWidth: 1, padding: Spacing.md },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  alertText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, flex: 1 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, borderRadius: Radius.md, gap: Spacing.sm },
  emptyText: { fontSize: FontSize.base },
});
