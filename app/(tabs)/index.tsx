import React, { useCallback, useState } from 'react';
import {
  View, ScrollView, StyleSheet, Text, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { getSupabaseClient } from '@/template';
import { analyticsService } from '@/services/analyticsService';
import { useApp } from '@/hooks/useApp';
import { TopBar } from '@/components';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  todayOrders: number;
  totalRevenue: number;
  activeRestaurants: number;
  totalRestaurants: number;
  onlineRiders: number;
  totalRiders: number;
}

export default function DashboardScreen() {
  const { colors, t, isRTL, theme } = useApp();

  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0, pendingOrders: 0, todayOrders: 0,
    totalRevenue: 0, activeRestaurants: 0, totalRestaurants: 0,
    onlineRiders: 0, totalRiders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();

      // Fetch summary (restaurants + riders) and orders in parallel
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString();

      const [summaryRes, ordersRes, todayOrdersRes, revenueRes] = await Promise.all([
        analyticsService.fetchSummary(),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('is_archived', false),
        supabase.from('orders').select('id', { count: 'exact', head: true })
          .eq('is_archived', false)
          .gte('created_at', todayIso),
        supabase.from('orders').select('total').eq('is_archived', false).eq('status', 'delivered'),
      ]);

      const pendingRes = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
        .eq('is_archived', false);

      const revenue = (revenueRes.data || []).reduce(
        (sum: number, o: any) => sum + parseFloat(o.total || '0'), 0
      );

      const summary = summaryRes.data;
      setStats({
        totalOrders: ordersRes.count || 0,
        pendingOrders: pendingRes.count || 0,
        todayOrders: todayOrdersRes.count || 0,
        totalRevenue: revenue,
        activeRestaurants: summary?.activeRestaurants || 0,
        totalRestaurants: summary?.totalRestaurants || 0,
        onlineRiders: summary?.onlineRiders || 0,
        totalRiders: summary?.totalRiders || 0,
      });
    } catch (error) {
      console.error('Dashboard fetch error:', error);
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
    const interval = setInterval(() => fetchDashboard(), 30000);
    return () => clearInterval(interval);
  }, [load, fetchDashboard]));

  const formatCurrency = (v: number) =>
    `${v.toLocaleString('en-EG', { maximumFractionDigits: 2 })} ${isRTL ? 'ج.م' : 'EGP'}`;

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
          {/* KPI Strip */}
          <View style={[styles.kpiStrip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <KpiCell
              icon="receipt-long"
              value={stats.totalOrders.toString()}
              label={isRTL ? 'إجمالي الطلبات' : 'Total Orders'}
              color={Colors.brand}
              colors={colors}
            />
            <View style={[styles.kpiDivider, { backgroundColor: colors.border }]} />
            <KpiCell
              icon="pending-actions"
              value={stats.pendingOrders.toString()}
              label={isRTL ? 'قيد الانتظار' : 'Pending'}
              color={Colors.warning}
              colors={colors}
            />
            <View style={[styles.kpiDivider, { backgroundColor: colors.border }]} />
            <KpiCell
              icon="today"
              value={stats.todayOrders.toString()}
              label={isRTL ? 'طلبات اليوم' : "Today's Orders"}
              color={Colors.info}
              colors={colors}
            />
          </View>

          {/* Financial Cards */}
          <View style={[styles.row2, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <StatCard
              icon="account-balance-wallet"
              title={isRTL ? 'إجمالي الإيرادات' : 'Total Revenue'}
              value={formatCurrency(stats.totalRevenue)}
              color={Colors.success}
              colors={colors}
            />
            <StatCard
              icon="storefront"
              title={isRTL ? 'المطاعم النشطة' : 'Active Restaurants'}
              value={`${stats.activeRestaurants} / ${stats.totalRestaurants}`}
              color={Colors.brand}
              colors={colors}
            />
          </View>

          {/* Riders Card */}
          <View style={[styles.row2, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <StatCard
              icon="delivery-dining"
              title={isRTL ? 'السائقون المتصلون' : 'Online Riders'}
              value={`${stats.onlineRiders} / ${stats.totalRiders}`}
              color={Colors.info}
              colors={colors}
            />
            <StatCard
              icon="local-shipping"
              title={isRTL ? 'إجمالي السائقين' : 'Total Riders'}
              value={stats.totalRiders.toString()}
              color={Colors.success}
              colors={colors}
            />
          </View>

          {/* System status */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.sectionRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <MaterialIcons name="circle" size={10} color={Colors.success} />
              <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
                {isRTL ? 'قاعدة البيانات: متصلة' : 'Database: Connected'}
              </Text>
            </View>
            <View style={[styles.sectionRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <MaterialIcons name="circle" size={10} color={Colors.success} />
              <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
                {isRTL ? 'تحديث تلقائي: كل 30 ثانية' : 'Auto-refresh: every 30s'}
              </Text>
            </View>
          </View>

          <View style={styles.refreshHint}>
            <MaterialIcons name="autorenew" size={12} color={colors.textMuted} />
            <Text style={[styles.refreshHintText, { color: colors.textMuted }]}>
              {isRTL ? 'اسحب للتحديث الفوري' : 'Pull down to refresh'}
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function KpiCell({ icon, value, label, color, colors }: any) {
  return (
    <View style={styles.kpiCell}>
      <MaterialIcons name={icon} size={20} color={color} />
      <Text style={[styles.kpiValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function StatCard({ icon, title, value, color, colors }: any) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.statIconWrap, { backgroundColor: `${color}18` }]}>
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statTitle, { color: colors.textMuted }]}>{title}</Text>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: Spacing.md },

  kpiStrip: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  kpiCell: { flex: 1, alignItems: 'center', gap: 3 },
  kpiDivider: { width: 1, height: '60%', alignSelf: 'center' },
  kpiValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  kpiLabel: { fontSize: FontSize.xs, textAlign: 'center' },

  row2: { gap: Spacing.md, marginBottom: Spacing.md },
  statCard: { flex: 1, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1 },
  statIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm,
  },
  statTitle: { fontSize: FontSize.xs, marginBottom: 4 },
  statValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold },

  section: {
    borderRadius: Radius.md, borderWidth: 1,
    marginBottom: Spacing.md, padding: Spacing.md, gap: Spacing.sm,
  },
  sectionRow: { alignItems: 'center', gap: Spacing.sm },
  sectionText: { fontSize: FontSize.sm },

  refreshHint: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 4, marginTop: Spacing.sm,
  },
  refreshHintText: { fontSize: 10 },
});
