import React, { useState, useCallback } from 'react';
import {
  View, ScrollView, StyleSheet, Text, Pressable, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useApp } from '@/hooks/useApp';
import { useAnalytics } from '@/hooks/useAnalytics';
import { getWeeklyData } from '@/services/mockData';
import { MiniBarChart, SectionHeader, TopBar } from '@/components';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { AreaStat } from '@/hooks/useAnalytics';
import { TopRestaurant, RiderStat, CategoryBreakdown } from '@/services/analyticsService';

type ChartMode = 'orders' | 'revenue';

export default function AnalyticsScreen() {
  const { colors, t, isRTL, theme } = useApp();
  const { data, loading, error, load } = useAnalytics();
  const [chartMode, setChartMode] = useState<ChartMode>('orders');
  const weekly = getWeeklyData();

  useFocusEffect(useCallback(() => { load(); }, []));

  const { summary, topRestaurants, riderStats, categoryBreakdown, restaurantStatusBreakdown, riderStatusBreakdown, areaStats } = data;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <TopBar title={t('analytics')} />

      {loading && !summary ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.brand} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            {isRTL ? 'تحميل البيانات...' : 'Loading analytics...'}
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* ── Summary KPI Row ───────────────────────────────────────────── */}
          <View style={[styles.kpiGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <KPICard
              icon="storefront"
              value={summary?.totalRestaurants ?? '—'}
              label={isRTL ? 'المطاعم' : 'Restaurants'}
              sub={`${summary?.activeRestaurants ?? 0} ${isRTL ? 'نشط' : 'active'}`}
              color={Colors.brand}
              colors={colors}
            />
            <KPICard
              icon="delivery-dining"
              value={summary?.totalRiders ?? '—'}
              label={isRTL ? 'المناديب' : 'Riders'}
              sub={`${summary?.onlineRiders ?? 0} ${isRTL ? 'متاح' : 'online'}`}
              color={Colors.info}
              colors={colors}
            />
            <KPICard
              icon="restaurant-menu"
              value={summary?.totalMenuItems ?? '—'}
              label={isRTL ? 'الأصناف' : 'Menu Items'}
              sub={`${summary?.availableMenuItems ?? 0} ${isRTL ? 'متاح' : 'avail.'}`}
              color={Colors.success}
              colors={colors}
            />
            <KPICard
              icon="category"
              value={summary?.totalMenuCategories ?? '—'}
              label={isRTL ? 'الأقسام' : 'Categories'}
              sub={isRTL ? 'قسم قائمة' : 'menu cats'}
              color={Colors.warning}
              colors={colors}
            />
          </View>

          {/* ── Weekly Chart ──────────────────────────────────────────────── */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SectionHeader title={t('weeklyOverview')} icon="bar-chart" />
            <View style={[styles.toggle, { backgroundColor: colors.inputBg }]}>
              {(['orders', 'revenue'] as ChartMode[]).map(m => (
                <Pressable
                  key={m}
                  style={[styles.toggleBtn, { backgroundColor: chartMode === m ? Colors.brand : 'transparent' }]}
                  onPress={() => setChartMode(m)}
                >
                  <Text style={[styles.toggleText, { color: chartMode === m ? '#000' : colors.textSecondary }]}>
                    {m === 'orders' ? t('totalOrders') : t('revenue')}
                  </Text>
                </Pressable>
              ))}
            </View>
            <MiniBarChart data={weekly} mode={chartMode} />
          </View>

          {/* ── Restaurant Status Breakdown ───────────────────────────────── */}
          {restaurantStatusBreakdown ? (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SectionHeader title={isRTL ? 'حالة المطاعم' : 'Restaurant Status'} icon="storefront" />
              <View style={[styles.statusRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <StatusPill
                  label={isRTL ? 'نشط' : 'Active'}
                  count={restaurantStatusBreakdown.active}
                  total={summary?.totalRestaurants || 1}
                  color={Colors.success}
                  colors={colors}
                />
                <StatusPill
                  label={isRTL ? 'غير نشط' : 'Inactive'}
                  count={restaurantStatusBreakdown.inactive}
                  total={summary?.totalRestaurants || 1}
                  color={Colors.warning}
                  colors={colors}
                />
                <StatusPill
                  label={isRTL ? 'موقوف' : 'Suspended'}
                  count={restaurantStatusBreakdown.suspended}
                  total={summary?.totalRestaurants || 1}
                  color={Colors.danger}
                  colors={colors}
                />
              </View>
            </View>
          ) : null}

          {/* ── Top Restaurants ───────────────────────────────────────────── */}
          {topRestaurants.length > 0 ? (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SectionHeader title={t('topRestaurants')} icon="emoji-events" />
              {topRestaurants.map((r: TopRestaurant, i: number) => {
                const maxOrders = Math.max(...topRestaurants.map((x: TopRestaurant) => x.today_orders || 0), 1);
                const pct = Math.max(((r.today_orders || 0) / maxOrders) * 100, 4);
                return (
                  <View key={r.id} style={[styles.restRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={[styles.rankBadge, { backgroundColor: i < 3 ? `${Colors.brand}25` : colors.inputBg }]}>
                      <Text style={[styles.rank, { color: i < 3 ? Colors.brand : colors.textMuted }]}>#{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={[styles.restNameRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.restName, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                            {isRTL ? (r.name_ar || r.name) : r.name}
                          </Text>
                          <Text style={[styles.restMeta, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
                            {r.category} · {r.area}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.restOrders, { color: Colors.brand }]}>
                            {r.today_orders ?? 0}
                          </Text>
                          <Text style={[styles.restOrdersLabel, { color: colors.textMuted }]}>
                            {isRTL ? 'طلب اليوم' : 'today'}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                        <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: i === 0 ? Colors.brand : i === 1 ? Colors.brandLight : colors.textMuted }]} />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          {/* ── Rider Performance ─────────────────────────────────────────── */}
          {riderStats.length > 0 || riderStatusBreakdown ? (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SectionHeader title={isRTL ? 'أداء المناديب' : 'Rider Performance'} icon="delivery-dining" />

              {/* Rider status pills */}
              {riderStatusBreakdown ? (
                <View style={[styles.statusRow, { flexDirection: isRTL ? 'row-reverse' : 'row', marginBottom: Spacing.md }]}>
                  <StatusPill label={isRTL ? 'متصل' : 'Online'} count={riderStatusBreakdown.online} total={summary?.totalRiders || 1} color={Colors.success} colors={colors} />
                  <StatusPill label={isRTL ? 'في رحلة' : 'On Delivery'} count={riderStatusBreakdown.on_delivery} total={summary?.totalRiders || 1} color={Colors.brand} colors={colors} />
                  <StatusPill label={isRTL ? 'غير متصل' : 'Offline'} count={riderStatusBreakdown.offline} total={summary?.totalRiders || 1} color={colors.textMuted} colors={colors} />
                </View>
              ) : null}

              {/* Top riders */}
              {riderStats.map((rider: RiderStat, i: number) => {
                const maxDeliveries = Math.max(...riderStats.map((x: RiderStat) => x.today_deliveries || 0), 1);
                const pct = Math.max(((rider.today_deliveries || 0) / maxDeliveries) * 100, 4);
                const statusColor = rider.status === 'online' ? Colors.success : rider.status === 'on_delivery' ? Colors.brand : colors.textMuted;
                return (
                  <View key={rider.id} style={[styles.riderRow, { flexDirection: isRTL ? 'row-reverse' : 'row', borderTopColor: colors.border }]}>
                    <View style={[styles.riderAvatar, { backgroundColor: `${statusColor}25` }]}>
                      <MaterialIcons name="person" size={16} color={statusColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={[styles.riderNameRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.riderName, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                            {isRTL ? (rider.name_ar || rider.name) : rider.name}
                          </Text>
                          <View style={[styles.riderMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                            <Text style={[styles.riderArea, { color: colors.textMuted }]}>
                              {rider.area}
                            </Text>
                          </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.riderDeliveries, { color: Colors.info }]}>
                            {rider.today_deliveries ?? 0}
                          </Text>
                          <Text style={[styles.riderDeliveriesLabel, { color: colors.textMuted }]}>
                            {isRTL ? 'توصيل اليوم' : 'today'}
                          </Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 4 }}>
                        <View style={[styles.progressTrack, { backgroundColor: colors.border, flex: 1 }]}>
                          <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: Colors.info }]} />
                        </View>
                        <View style={[styles.ratingChip, { backgroundColor: `${Colors.brand}20` }]}>
                          <MaterialIcons name="star" size={10} color={Colors.brand} />
                          <Text style={[styles.ratingText, { color: Colors.brand }]}>{rider.rating?.toFixed(1)}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          {/* ── Category Breakdown ────────────────────────────────────────── */}
          {categoryBreakdown.length > 0 ? (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SectionHeader title={isRTL ? 'أقسام القائمة' : 'Menu Category Breakdown'} icon="category" />
              <View style={styles.catGrid}>
                {categoryBreakdown.slice(0, 8).map((cat: CategoryBreakdown, i: number) => {
                  const catColors = [Colors.brand, Colors.info, Colors.success, Colors.warning, Colors.danger, '#8B5CF6', '#EC4899', '#14B8A6'];
                  const color = catColors[i % catColors.length];
                  const availability = cat.itemCount > 0 ? Math.round((cat.availableCount / cat.itemCount) * 100) : 0;
                  return (
                    <View key={`${cat.categoryName}-${i}`} style={[styles.catCell, { backgroundColor: `${color}15`, borderColor: `${color}30` }]}>
                      <View style={[styles.catColorDot, { backgroundColor: color }]} />
                      <Text style={[styles.catName, { color: colors.text }]} numberOfLines={1}>
                        {isRTL ? (cat.categoryNameAr || cat.categoryName) : cat.categoryName}
                      </Text>
                      <Text style={[styles.catItemCount, { color }]}>
                        {cat.itemCount} {isRTL ? 'صنف' : 'items'}
                      </Text>
                      <Text style={[styles.catAvail, { color: colors.textMuted }]}>
                        {availability}% {isRTL ? 'متاح' : 'avail.'}
                      </Text>
                      {cat.restaurantName ? (
                        <Text style={[styles.catRestName, { color: colors.textMuted }]} numberOfLines={1}>
                          {isRTL ? (cat.restaurantNameAr || cat.restaurantName) : cat.restaurantName}
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
              {categoryBreakdown.length > 8 ? (
                <Text style={[styles.moreCats, { color: colors.textMuted }]}>
                  +{categoryBreakdown.length - 8} {isRTL ? 'قسم آخر' : 'more categories'}
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* ── Area Density ──────────────────────────────────────────────── */}
          {areaStats.length > 0 ? (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SectionHeader title={isRTL ? 'كثافة الطلبات حسب المنطقة' : 'Order Density by Area'} icon="map" />
              <View style={styles.areaGrid}>
                {areaStats.map((area: AreaStat) => {
                  const maxOrders = Math.max(...areaStats.map((a: AreaStat) => a.todayOrders), 1);
                  const intensity = Math.min((area.todayOrders / maxOrders), 1);
                  return (
                    <View
                      key={area.area}
                      style={[
                        styles.areaChip,
                        { backgroundColor: `rgba(255,195,0,${0.08 + intensity * 0.65})`, borderColor: `rgba(255,195,0,${0.15 + intensity * 0.55})` },
                      ]}
                    >
                      <MaterialIcons name="location-on" size={12} color={Colors.brand} />
                      <Text style={[styles.areaName, { color: colors.text }]}>{area.area}</Text>
                      <Text style={[styles.areaOrders, { color: Colors.brand }]}>
                        {area.todayOrders}
                      </Text>
                      <Text style={[styles.areaRests, { color: colors.textMuted }]}>
                        {area.restaurantCount} {isRTL ? 'مطعم' : 'rests'}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* ── Empty state ───────────────────────────────────────────────── */}
          {!loading && !summary && !error ? (
            <View style={[styles.emptyWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialIcons name="bar-chart" size={40} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {isRTL ? 'لا توجد بيانات بعد' : 'No data yet'}
              </Text>
            </View>
          ) : null}

          {error ? (
            <View style={[styles.errorWrap, { backgroundColor: `${Colors.danger}15`, borderColor: `${Colors.danger}30` }]}>
              <MaterialIcons name="error-outline" size={16} color={Colors.danger} />
              <Text style={[styles.errorText, { color: Colors.danger }]}>{error}</Text>
            </View>
          ) : null}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KPICard({ icon, value, label, sub, color, colors }: any) {
  return (
    <View style={[kpiStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[kpiStyles.iconWrap, { backgroundColor: `${color}20` }]}>
        <MaterialIcons name={icon} size={18} color={color} />
      </View>
      <Text style={[kpiStyles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[kpiStyles.label, { color: colors.textSecondary }]} numberOfLines={1}>{label}</Text>
      <Text style={[kpiStyles.sub, { color: color }]} numberOfLines={1}>{sub}</Text>
    </View>
  );
}

function StatusPill({ label, count, total, color, colors }: any) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <View style={[pillStyles.wrap, { backgroundColor: `${color}15`, borderColor: `${color}30` }]}>
      <Text style={[pillStyles.count, { color }]}>{count}</Text>
      <Text style={[pillStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[pillStyles.pct, { color: colors.textMuted }]}>{pct}%</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const kpiStyles = StyleSheet.create({
  card: { flex: 1, borderRadius: Radius.md, borderWidth: 1, padding: Spacing.sm, alignItems: 'center', gap: 3 },
  iconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  value: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  label: { fontSize: 10, fontWeight: FontWeight.medium, textAlign: 'center' },
  sub: { fontSize: 10, textAlign: 'center' },
});

const pillStyles = StyleSheet.create({
  wrap: { flex: 1, borderRadius: Radius.md, borderWidth: 1, padding: Spacing.sm, alignItems: 'center', gap: 2 },
  count: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  label: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  pct: { fontSize: 10 },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { fontSize: FontSize.sm },
  scroll: { padding: Spacing.md, gap: Spacing.md },
  kpiGrid: { gap: Spacing.xs },
  card: { borderRadius: Radius.md, borderWidth: 1, padding: Spacing.md, gap: Spacing.sm },
  toggle: { flexDirection: 'row', borderRadius: Radius.md, padding: 3 },
  toggleBtn: { flex: 1, paddingVertical: 7, borderRadius: Radius.sm - 2, alignItems: 'center' },
  toggleText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  statusRow: { gap: Spacing.xs },

  // Restaurants
  restRow: { alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  rankBadge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  rank: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  restNameRow: { alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  restName: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  restMeta: { fontSize: 10, marginTop: 1 },
  restOrders: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  restOrdersLabel: { fontSize: 10 },
  progressTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  // Riders
  riderRow: { alignItems: 'flex-start', gap: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, marginTop: Spacing.xs },
  riderAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  riderNameRow: { alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  riderName: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  riderMeta: { alignItems: 'center', gap: 4, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  riderArea: { fontSize: 10 },
  riderDeliveries: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  riderDeliveriesLabel: { fontSize: 10 },
  ratingChip: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full },
  ratingText: { fontSize: 10, fontWeight: FontWeight.bold },

  // Categories
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  catCell: { borderRadius: Radius.md, borderWidth: 1, padding: Spacing.sm, minWidth: '45%', flex: 1, gap: 2 },
  catColorDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 2 },
  catName: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  catItemCount: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  catAvail: { fontSize: 10 },
  catRestName: { fontSize: 10, marginTop: 2, fontStyle: 'italic' },
  moreCats: { fontSize: FontSize.xs, textAlign: 'center', paddingTop: Spacing.sm },

  // Areas
  areaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  areaChip: { borderRadius: Radius.sm, borderWidth: 1, padding: Spacing.sm, alignItems: 'center', minWidth: '30%', flex: 1, gap: 2 },
  areaName: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  areaOrders: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  areaRests: { fontSize: 10 },

  // States
  emptyWrap: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, borderRadius: Radius.md, borderWidth: 1, gap: Spacing.sm },
  emptyText: { fontSize: FontSize.base },
  errorWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1 },
  errorText: { fontSize: FontSize.sm, flex: 1 },
});
