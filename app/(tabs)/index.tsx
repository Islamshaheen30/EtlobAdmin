import React, { useEffect, useState, useCallback } from 'react';
import {
  View, ScrollView, StyleSheet, Text, Pressable, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { getSupabaseClient } from '@/template';
import { useApp } from '@/hooks/useApp';
import { TopBar } from '@/components';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  todayOrders: number;
  totalRevenue: number;
  activeRestaurants: number;
  onlineRiders: number;
  totalRiders: number;
}

interface TopRestaurant {
  id: string;
  name: string;
  name_ar: string;
  today_orders: number;
  rating: number;
}

interface RecentOrder {
  id: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
}

const STATUS_COLOR: Record<string, string> = {
  pending: Colors.warning,
  accepted: Colors.info,
  preparing: Colors.info,
  dispatched: Colors.brand,
  delivered: Colors.success,
  cancelled: Colors.danger,
};

const STATUS_ICON: Record<string, string> = {
  pending: 'hourglass-empty',
  accepted: 'check-circle-outline',
  preparing: 'restaurant',
  dispatched: 'delivery-dining',
  delivered: 'check-circle',
  cancelled: 'cancel',
};

export default function DashboardScreen() {
  const { colors, t, isRTL, theme } = useApp();

  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0, pendingOrders: 0, todayOrders: 0,
    totalRevenue: 0, activeRestaurants: 0, onlineRiders: 0, totalRiders: 0,
  });
  const [topRestaurants, setTopRestaurants] = useState<TopRestaurant[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    const supabase = getSupabaseClient();
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [ordersRes, restaurantsRes, ridersRes, recentRes] = await Promise.all([
        supabase.from('orders').select('id, total, status, created_at').eq('is_archived', false),
        supabase.from('restaurants').select('id, name, name_ar, today_orders, rating, status'),
        supabase.from('riders').select('id, status'),
        supabase.from('orders')
          .select('id, customer_name, total, status, created_at')
          .eq('is_archived', false)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      // Stats
      const orders = ordersRes.data || [];
      const todayOrders = orders.filter(o => new Date(o.created_at) >= today);
      const pending = orders.filter(o => o.status === 'pending');
      const revenue = orders
        .filter(o => o.status === 'delivered')
        .reduce((acc, o) => acc + (Number(o.total) || 0), 0);

      const restaurants = restaurantsRes.data || [];
      const activeRestaurants = restaurants.filter(r => r.status === 'active').length;

      const riders = ridersRes.data || [];
      const onlineRiders = riders.filter(r => r.status === 'online' || r.status === 'on_delivery').length;

      setStats({
        totalOrders: orders.length,
        pendingOrders: pending.length,
        todayOrders: todayOrders.length,
        totalRevenue: revenue,
        activeRestaurants,
        onlineRiders,
        totalRiders: riders.length,
      });

      // Top restaurants by today_orders
      const sorted = [...restaurants]
        .sort((a, b) => (b.today_orders || 0) - (a.today_orders || 0))
        .slice(0, 3);
      setTopRestaurants(sorted.map(r => ({
        id: r.id, name: r.name, name_ar: r.name_ar,
        today_orders: r.today_orders || 0, rating: r.rating || 5,
      })));

      setRecentOrders(recentRes.data || []);
    } catch (_) {
      // silently fail — data stays at defaults
    }
  }, []);

  const load = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    await fetchDashboard();
    setLoading(false);
    setRefreshing(false);
  }, [fetchDashboard]);

  useFocusEffect(useCallback(() => {
    load();
    // Poll every 30 seconds
    const interval = setInterval(() => fetchDashboard(), 30000);
    return () => clearInterval(interval);
  }, [load, fetchDashboard]));

  const formatCurrency = (v: number) => `${v.toLocaleString('en-EG', { maximumFractionDigits: 0 })} ${isRTL ? 'ج.م' : 'EGP'}`;

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return isRTL ? 'الآن' : 'just now';
    if (mins < 60) return isRTL ? `${mins} د` : `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return isRTL ? `${hrs} س` : `${hrs}h`;
    return isRTL ? `${Math.floor(hrs / 24)} ي` : `${Math.floor(hrs / 24)}d`;
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <TopBar title={t('dashboard')} />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.brand} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={Colors.brand}
              colors={[Colors.brand]}
            />
          }
        >
          {/* ── Headline KPI strip ──────────────────────────────────────── */}
          <View style={[styles.kpiStrip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <KpiCell
              icon="receipt-long"
              value={stats.todayOrders.toString()}
              label={isRTL ? 'طلبات اليوم' : "Today's Orders"}
              color={Colors.brand}
              colors={colors}
            />
            <View style={[styles.kpiDivider, { backgroundColor: colors.border }]} />
            <KpiCell
              icon="pending"
              value={stats.pendingOrders.toString()}
              label={isRTL ? 'قيد الانتظار' : 'Pending'}
              color={Colors.warning}
              colors={colors}
            />
            <View style={[styles.kpiDivider, { backgroundColor: colors.border }]} />
            <KpiCell
              icon="delivery-dining"
              value={`${stats.onlineRiders}/${stats.totalRiders}`}
              label={isRTL ? 'مناديب نشطون' : 'Riders Online'}
              color={Colors.success}
              colors={colors}
            />
          </View>

          {/* ── Revenue + Active restaurants ────────────────────────────── */}
          <View style={[styles.row2, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <StatCard
              icon="account-balance-wallet"
              title={isRTL ? 'الإيرادات (مُسلَّم)' : 'Revenue (Delivered)'}
              value={formatCurrency(stats.totalRevenue)}
              color={Colors.success}
              colors={colors}
            />
            <StatCard
              icon="storefront"
              title={isRTL ? 'مطاعم نشطة' : 'Active Restaurants'}
              value={stats.activeRestaurants.toString()}
              color={Colors.info}
              colors={colors}
            />
          </View>

          {/* ── Top Restaurants ─────────────────────────────────────────── */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row', borderBottomColor: colors.border }]}>
              <View style={[styles.sectionIconWrap, { backgroundColor: `${Colors.brand}20` }]}>
                <MaterialIcons name="trending-up" size={16} color={Colors.brand} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {isRTL ? 'أفضل المطاعم اليوم' : 'Top Restaurants Today'}
              </Text>
            </View>

            {topRestaurants.length === 0 ? (
              <View style={styles.emptyInner}>
                <MaterialIcons name="storefront" size={28} color={colors.textMuted} />
                <Text style={[styles.emptyInnerText, { color: colors.textMuted }]}>
                  {isRTL ? 'لا توجد بيانات بعد' : 'No data yet'}
                </Text>
              </View>
            ) : (
              topRestaurants.map((r, i) => (
                <View
                  key={r.id}
                  style={[styles.rankRow, {
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    borderTopColor: i > 0 ? colors.border : 'transparent',
                    borderTopWidth: i > 0 ? 1 : 0,
                  }]}
                >
                  <View style={[styles.rankBadge, {
                    backgroundColor: i === 0 ? `${Colors.brand}25` : colors.inputBg,
                  }]}>
                    <Text style={[styles.rankNum, { color: i === 0 ? Colors.brand : colors.textMuted }]}>
                      #{i + 1}
                    </Text>
                  </View>
                  <Text style={[styles.rankName, { color: colors.text, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? (r.name_ar || r.name) : r.name}
                  </Text>
                  <View style={[styles.rankStats, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={[styles.rankStat, { backgroundColor: `${Colors.brand}15` }]}>
                      <MaterialIcons name="receipt-long" size={11} color={Colors.brand} />
                      <Text style={[styles.rankStatText, { color: Colors.brand }]}>{r.today_orders}</Text>
                    </View>
                    <View style={[styles.rankStat, { backgroundColor: `${Colors.warning}15` }]}>
                      <MaterialIcons name="star" size={11} color={Colors.warning} />
                      <Text style={[styles.rankStatText, { color: Colors.warning }]}>{r.rating.toFixed(1)}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* ── Recent Orders ────────────────────────────────────────────── */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row', borderBottomColor: colors.border }]}>
              <View style={[styles.sectionIconWrap, { backgroundColor: `${Colors.info}20` }]}>
                <MaterialIcons name="schedule" size={16} color={Colors.info} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {isRTL ? 'آخر الطلبات' : 'Recent Orders'}
              </Text>
              <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
                {isRTL ? `${stats.totalOrders} طلب` : `${stats.totalOrders} total`}
              </Text>
            </View>

            {recentOrders.length === 0 ? (
              <View style={styles.emptyInner}>
                <MaterialIcons name="receipt-long" size={28} color={colors.textMuted} />
                <Text style={[styles.emptyInnerText, { color: colors.textMuted }]}>
                  {isRTL ? 'لا توجد طلبات بعد' : 'No orders yet'}
                </Text>
              </View>
            ) : (
              recentOrders.map((order, i) => {
                const stColor = STATUS_COLOR[order.status] || colors.textMuted;
                const stIcon = STATUS_ICON[order.status] || 'help-outline';
                return (
                  <View
                    key={order.id}
                    style={[styles.orderRow, {
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                      borderTopColor: i > 0 ? colors.border : 'transparent',
                      borderTopWidth: i > 0 ? 1 : 0,
                    }]}
                  >
                    <View style={[styles.orderIcon, { backgroundColor: `${stColor}20` }]}>
                      <MaterialIcons name={stIcon as any} size={16} color={stColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.orderName, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
                        {order.customer_name || (isRTL ? 'عميل' : 'Customer')}
                      </Text>
                      <Text style={[styles.orderStatus, { color: stColor, textAlign: isRTL ? 'right' : 'left' }]}>
                        {order.status}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 3 }}>
                      <Text style={[styles.orderTotal, { color: colors.text }]}>
                        {Number(order.total || 0).toFixed(0)} {isRTL ? 'ج.م' : 'EGP'}
                      </Text>
                      <Text style={[styles.orderTime, { color: colors.textMuted }]}>
                        {timeAgo(order.created_at)}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* ── Refresh hint ─────────────────────────────────────────────── */}
          <View style={styles.refreshHint}>
            <MaterialIcons name="autorenew" size={12} color={colors.textMuted} />
            <Text style={[styles.refreshHintText, { color: colors.textMuted }]}>
              {isRTL ? 'يتحدث كل 30 ثانية — اسحب للتحديث' : 'Auto-refresh every 30s · Pull to refresh'}
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function KpiCell({ icon, value, label, color, colors }: any) {
  return (
    <View style={kpiStyles.cell}>
      <MaterialIcons name={icon} size={18} color={color} />
      <Text style={[kpiStyles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[kpiStyles.label, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function StatCard({ icon, title, value, color, colors }: any) {
  return (
    <View style={[statStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[statStyles.iconWrap, { backgroundColor: `${color}20` }]}>
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
      <Text style={[statStyles.title, { color: colors.textSecondary }]}>{title}</Text>
      <Text style={[statStyles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const kpiStyles = StyleSheet.create({
  cell: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, gap: 3 },
  value: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  label: { fontSize: 10, textAlign: 'center' },
});

const statStyles = StyleSheet.create({
  card: { flex: 1, borderRadius: Radius.md, borderWidth: 1, padding: Spacing.md, gap: Spacing.xs },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title: { fontSize: FontSize.xs, lineHeight: 15 },
  value: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: Spacing.md, gap: Spacing.md },

  kpiStrip: {
    flexDirection: 'row', borderRadius: Radius.md, borderWidth: 1, overflow: 'hidden',
  },
  kpiDivider: { width: 1 },

  row2: { gap: Spacing.md },

  section: { borderRadius: Radius.md, borderWidth: 1, overflow: 'hidden' },
  sectionHeader: {
    alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.md, borderBottomWidth: 1,
  },
  sectionIconWrap: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  sectionCount: { fontSize: FontSize.xs },

  // Top restaurants
  rankRow: { alignItems: 'center', gap: Spacing.sm, padding: Spacing.md },
  rankBadge: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  rankNum: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  rankName: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  rankStats: { gap: Spacing.xs },
  rankStat: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: Radius.full },
  rankStatText: { fontSize: 10, fontWeight: FontWeight.bold },

  // Recent orders
  orderRow: { alignItems: 'center', gap: Spacing.sm, padding: Spacing.md },
  orderIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  orderName: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  orderStatus: { fontSize: FontSize.xs, marginTop: 2 },
  orderTotal: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  orderTime: { fontSize: 10 },

  emptyInner: { alignItems: 'center', padding: Spacing.xl, gap: Spacing.sm },
  emptyInnerText: { fontSize: FontSize.xs },

  refreshHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  refreshHintText: { fontSize: 10 },
});
