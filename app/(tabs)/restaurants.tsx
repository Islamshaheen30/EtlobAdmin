import React, { useState, useMemo, useCallback } from 'react';
import { Image } from 'expo-image';
import {
  View, ScrollView, StyleSheet, Text, Pressable, TextInput,
  FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useApp } from '@/hooks/useApp';
import { useRestaurantsManager } from '@/hooks/useMenuManager';
import { Restaurant, calcRestaurantOpenStatus } from '@/services/menuService';
import { StatusBadge, TopBar } from '@/components';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';

type StatusFilter = 'all' | 'active' | 'inactive' | 'suspended';

export default function RestaurantsScreen() {
  const { colors, t, isRTL, theme } = useApp();
  const router = useRouter();
  const { restaurants, loading, loadRestaurants } = useRestaurantsManager();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useFocusEffect(useCallback(() => { loadRestaurants(); }, []));

  const filtered = useMemo(() => {
    let r = restaurants;
    if (statusFilter !== 'all') r = r.filter(x => x.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(x =>
        x.name.toLowerCase().includes(q) ||
        (x.name_ar || '').includes(q) ||
        (x.category || '').toLowerCase().includes(q) ||
        (x.area || '').toLowerCase().includes(q)
      );
    }
    return r;
  }, [restaurants, search, statusFilter]);

  const statusLabel: Record<string, string> = {
    all: t('allStatuses'),
    active: t('active'),
    inactive: t('inactive'),
    suspended: t('suspended'),
  };

  const handleManageMenu = (restaurant: Restaurant) => {
    router.push({
      pathname: '/menu-management',
      params: {
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        restaurantNameAr: restaurant.name_ar || restaurant.name,
      },
    });
  };

  const handleEditRestaurant = (restaurant: Restaurant) => {
    router.push({ pathname: '/restaurant-edit', params: { restaurantId: restaurant.id } });
  };

  const handleOffers = (restaurant: Restaurant) => {
    router.push({ pathname: '/offers', params: { restaurantId: restaurant.id } });
  };

  const renderItem = ({ item }: { item: Restaurant }) => {
    const opStatus = item.operational_status || 'open';
    const opColor = opStatus === 'open' ? Colors.success : opStatus === 'busy' ? Colors.warning : Colors.danger;
    const opLabel = opStatus === 'open'
      ? (isRTL ? 'مفتوح' : 'Open')
      : opStatus === 'busy'
        ? (isRTL ? 'مشغول' : 'Busy')
        : (isRTL ? 'مغلق' : 'Closed');

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Header */}
        <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {item.logo_url ? (
            <Image source={{ uri: item.logo_url }} style={styles.avatarImg} contentFit="cover" transition={200} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: Colors.brand }]}>
              <Text style={styles.avatarText}>{item.name[0]}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? (item.name_ar || item.name) : item.name}
            </Text>
            <Text style={[styles.category, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
              {item.category} · {item.area}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 5 }}>
            <StatusBadge status={item.status} label={statusLabel[item.status] || item.status} small />
            {/* Operational status badge */}
            <View style={[styles.openBadge, { backgroundColor: `${opColor}20`, borderColor: `${opColor}50` }]}>
              <View style={[styles.openDot, { backgroundColor: opColor }]} />
              <Text style={[styles.openBadgeText, { color: opColor }]}>{opLabel}</Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={[styles.statsRow, { flexDirection: isRTL ? 'row-reverse' : 'row', borderTopColor: colors.border }]}>
          <StatChip icon="star" value={item.rating?.toString() || '—'} label={t('rating')} color={Colors.brand} colors={colors} />
          <StatChip icon="receipt-long" value={item.today_orders?.toString() || '0'} label={t('todayOrders')} color={Colors.info} colors={colors} />
          <StatChip icon="radio-button-checked" value={`${item.delivery_radius ?? 5}km`} label={isRTL ? 'نطاق' : 'Radius'} color={Colors.info} colors={colors} />
          <StatChip icon="hourglass-empty" value={`${item.prep_time_minutes ?? 30}m`} label={isRTL ? 'تحضير' : 'Prep'} color={Colors.warning} colors={colors} />
        </View>

        {/* Hours row */}
        <View style={[styles.hoursRow, { flexDirection: isRTL ? 'row-reverse' : 'row', borderTopColor: colors.border }]}>
          <MaterialIcons name="schedule" size={12} color={colors.icon} />
          <Text style={[styles.hoursText, { color: colors.textMuted }]}>
            {item.opening_hours || '09:00'} – {item.closing_hours || '22:00'}
          </Text>
          {item.latitude && item.longitude ? (
            <View style={[styles.overrideTag, { backgroundColor: `${Colors.info}15` }]}>
              <MaterialIcons name="location-on" size={10} color={Colors.info} />
              <Text style={[styles.overrideTagText, { color: Colors.info }]}>GPS</Text>
            </View>
          ) : null}
          {item.is_open_override !== null && item.is_open_override !== undefined ? (
            <View style={[styles.overrideTag, { backgroundColor: `${Colors.warning}20` }]}>
              <MaterialIcons name="pan-tool" size={10} color={Colors.warning} />
              <Text style={[styles.overrideTagText, { color: Colors.warning }]}>
                {isRTL ? 'يدوي' : 'Manual'}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Footer */}
        <View style={[styles.footer, { flexDirection: isRTL ? 'row-reverse' : 'row', borderTopColor: colors.border }]}>
          <View style={[styles.footerItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <MaterialIcons name="phone" size={13} color={colors.icon} />
            <Text style={[styles.footerText, { color: colors.textMuted }]}>{item.phone || '—'}</Text>
          </View>
          <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: Spacing.xs }]}>
            <Pressable
              style={[styles.menuBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
              onPress={() => handleEditRestaurant(item)}
            >
              <MaterialIcons name="edit" size={14} color={colors.icon} />
              <Text style={[styles.menuBtnText, { color: colors.textSecondary }]}>
                {isRTL ? 'تعديل' : 'Edit'}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.menuBtn, { backgroundColor: `${Colors.info}18`, borderColor: `${Colors.info}44` }]}
              onPress={() => handleOffers(item)}
            >
              <MaterialIcons name="local-offer" size={14} color={Colors.info} />
              <Text style={[styles.menuBtnText, { color: Colors.info }]}>
                {isRTL ? 'عروض' : 'Offers'}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.menuBtn, { backgroundColor: `${Colors.brand}22`, borderColor: `${Colors.brand}55` }]}
              onPress={() => handleManageMenu(item)}
            >
              <MaterialIcons name="restaurant-menu" size={14} color={Colors.brand} />
              <Text style={[styles.menuBtnText, { color: Colors.brand }]}>
                {isRTL ? 'القائمة' : 'Menu'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <TopBar title={t('restaurants')} />

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
        </View>
      </View>

      {/* Status Filter */}
      <View style={[styles.filterWrap, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(['all', 'active', 'inactive', 'suspended'] as StatusFilter[]).map(s => (
            <Pressable
              key={s}
              style={[styles.chip, { backgroundColor: statusFilter === s ? Colors.brand : colors.inputBg, borderColor: statusFilter === s ? Colors.brand : colors.border }]}
              onPress={() => setStatusFilter(s)}
            >
              <Text style={[styles.chipText, { color: statusFilter === s ? '#000' : colors.textSecondary }]}>
                {statusLabel[s]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.brand} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={[styles.empty, { backgroundColor: colors.card }]}>
              <MaterialIcons name="storefront" size={40} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('noRestaurants')}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function StatChip({ icon, value, label, color, colors }: any) {
  return (
    <View style={chipStyles.chip}>
      <MaterialIcons name={icon} size={14} color={color} />
      <Text style={[chipStyles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[chipStyles.label, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: { flex: 1, alignItems: 'center', gap: 2 },
  value: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  label: { fontSize: 10 },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  searchWrap: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1 },
  searchBar: { alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.sm, paddingVertical: 10, borderRadius: Radius.md },
  searchInput: { flex: 1, fontSize: FontSize.base },
  filterWrap: { borderBottomWidth: 1 },
  filterScroll: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1 },
  chipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: 40 },
  card: { borderRadius: Radius.md, borderWidth: 1, overflow: 'hidden' },
  cardHeader: { padding: Spacing.md, alignItems: 'center', gap: Spacing.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#000', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  name: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  category: { fontSize: FontSize.xs, marginTop: 2 },
  statsRow: { flexDirection: 'row', borderTopWidth: 1, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  footer: { borderTopWidth: 1, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, justifyContent: 'space-between', alignItems: 'center' },
  footerItem: { alignItems: 'center', gap: 4 },
  footerText: { fontSize: FontSize.xs },
  menuBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: Radius.sm, borderWidth: 1 },
  menuBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  empty: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, borderRadius: Radius.md, gap: Spacing.sm, marginTop: Spacing.xl },
  emptyText: { fontSize: FontSize.base },
  openBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: Radius.full, borderWidth: 1 },
  openDot: { width: 6, height: 6, borderRadius: 3 },
  openBadgeText: { fontSize: 10, fontWeight: FontWeight.bold },
  hoursRow: { alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: 6, borderTopWidth: 1 },
  hoursText: { fontSize: 10, flex: 1 },
  overrideTag: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full },
  overrideTagText: { fontSize: 10, fontWeight: FontWeight.medium },
});
