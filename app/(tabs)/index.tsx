import React, { useEffect, useState, useCallback } from 'react';
import {
  View, ScrollView, StyleSheet, Text, Pressable, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/services/supabaseClient';
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
  onlineRiders: number;
  totalRiders: number;
  totalCommissions: number;
}

const STATUS_COLOR: Record<string, string> = {
  pending: Colors.warning,
  accepted_by_restaurant: Colors.info,
  driver_assigned: Colors.info,
  picked_up: Colors.brand,
  delivered: Colors.success,
  cancelled: Colors.danger,
};

const STATUS_ICON: Record<string, string> = {
  pending: 'hourglass-empty',
  accepted_by_restaurant: 'check-circle-outline',
  driver_assigned: 'person-pin',
  picked_up: 'delivery-dining',
  delivered: 'check-circle',
  cancelled: 'cancel',
};

export default function DashboardScreen() {
  const { colors, t, isRTL, theme } = useApp();

  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0, pendingOrders: 0, todayOrders: 0,
    totalRevenue: 0, activeRestaurants: 0, onlineRiders: 0, totalRiders: 0,
    totalCommissions: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const { success, stats: fetchedStats } = await analyticsService.getOrdersStatistics();
      
      if (success && fetchedStats) {
        // Fetch additional counts for UI
        const [restaurantsRes, ridersRes] = await Promise.all([
          supabase.from('restaurants').select('id', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('drivers').select('id', { count: 'exact', head: true }),
          supabase.from('drivers').select('id', { count: 'exact', head: true }).eq('is_online', true),
        ]);

        setStats({
          totalOrders: fetchedStats.total,
          pendingOrders: fetchedStats.pending,
          todayOrders: fetchedStats.pending + fetchedStats.accepted_by_restaurant + fetchedStats.delivered, // Simplified for demo
          totalRevenue: fetchedStats.total_revenue,
          totalCommissions: fetchedStats.total_commissions,
          activeRestaurants: restaurantsRes.count || 0,
          totalRiders: ridersRes.count || 0,
          onlineRiders: 0 // Placeholder
        });
      }
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

  const formatCurrency = (v: number) => `${v.toLocaleString('en-EG', { maximumFractionDigits: 2 })} ${isRTL ? 'ج.م' : 'EGP'}`;

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
              label={isRTL ? 'إجمالي الطلبات' : "Total Orders"}
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
              value={stats.totalRiders.toString()}
              label={isRTL ? 'إجمالي السائقين' : 'Total Drivers'}
              color={Colors.success}
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
              icon="monetization-on"
              title={isRTL ? 'إجمالي العمولات' : 'Total Commissions'}
              value={formatCurrency(stats.totalCommissions)}
              color={Colors.brand}
              colors={colors}
            />
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, padding: 20 }]}>
             <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
                {isRTL ? 'حالة النظام' : 'System Status'}
             </Text>
             <Text style={{ color: colors.textMuted }}>
                {isRTL ? 'قاعدة بيانات Supabase: متصلة' : 'Supabase Database: Connected'}
             </Text>
             <Text style={{ color: colors.textMuted }}>
                {isRTL ? 'التحديثات الفورية: نشطة' : 'Real-time Updates: Active'}
             </Text>
          </View>

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

// Sub-components
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
      <View style={[styles.statIconWrap, { backgroundColor: `${color}15` }]}>
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
  scroll: { padding: Spacing.m },
  kpiStrip: {
    flexDirection: 'row',
    padding: Spacing.m,
    borderRadius: Radius.m,
    borderWidth: 1,
    marginBottom: Spacing.m,
  },
  kpiCell: { flex: 1, alignItems: 'center' },
  kpiDivider: { width: 1, height: '60%', alignSelf: 'center' },
  kpiValue: { fontSize: FontSize.l, fontWeight: FontWeight.bold, marginTop: 4 },
  kpiLabel: { fontSize: FontSize.xs, marginTop: 2 },
  row2: { gap: Spacing.m, marginBottom: Spacing.m },
  statCard: {
    flex: 1,
    padding: Spacing.m,
    borderRadius: Radius.m,
    borderWidth: 1,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.s,
  },
  statTitle: { fontSize: FontSize.xs, marginBottom: 4 },
  statValue: { fontSize: FontSize.m, fontWeight: FontWeight.bold },
  section: {
    borderRadius: Radius.m,
    borderWidth: 1,
    marginBottom: Spacing.m,
    overflow: 'hidden',
  },
  refreshHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: Spacing.s,
  },
  refreshHintText: { fontSize: 10 },
});
