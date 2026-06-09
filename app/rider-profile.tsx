import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth, useAlert } from '@/template';
import { useRouter } from 'expo-router';
import { useApp } from '@/hooks/useApp';
import { riderService, RiderProfile } from '@/services/riderService';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';

const STATUS_COLORS: Record<string, string> = {
  online: Colors.success,
  offline: '#888',
  on_delivery: Colors.info,
};

export default function RiderProfileScreen() {
  const { logout } = useAuth();
  const { showAlert } = useAlert();
  const { colors, theme, t, isRTL, toggleLanguage, toggleTheme, language } = useApp();
  const router = useRouter();

  const [rider, setRider] = useState<RiderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const load = async () => {
    const { data, error } = await riderService.fetchOwn();
    if (error || !data) {
      showAlert(t('error'), error || t('loginError'));
    } else {
      setRider(data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const handleLogout = async () => {
    showAlert(
      t('logout'),
      t('logoutConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const cycleStatus = async () => {
    if (!rider) return;
    const cycle: RiderProfile['status'][] = ['online', 'on_delivery', 'offline'];
    const next = cycle[(cycle.indexOf(rider.status) + 1) % cycle.length];
    setStatusLoading(true);
    const { error } = await riderService.updateStatus(rider.id, next);
    if (error) showAlert(t('error'), error);
    else setRider(r => r ? { ...r, status: next } : r);
    setStatusLoading(false);
  };

  const statusLabel: Record<string, string> = {
    online: t('online'),
    offline: t('offline'),
    on_delivery: t('onDelivery'),
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={Colors.brand} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text style={[styles.topTitle, { color: colors.text }]}>
          {isRTL ? 'ملفي الشخصي' : 'My Profile'}
        </Text>
        <View style={[styles.topActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable style={[styles.pill, { backgroundColor: colors.inputBg }]} onPress={toggleLanguage}>
            <Text style={[styles.pillText, { color: colors.text }]}>{language === 'en' ? 'ع' : 'EN'}</Text>
          </Pressable>
          <Pressable style={[styles.iconBtn, { backgroundColor: colors.inputBg }]} onPress={toggleTheme}>
            <MaterialIcons name={theme === 'dark' ? 'light-mode' : 'dark-mode'} size={18} color={Colors.brand} />
          </Pressable>
          <Pressable style={[styles.iconBtn, { backgroundColor: `${Colors.danger}22` }]} onPress={handleLogout}>
            <MaterialIcons name="logout" size={18} color={Colors.danger} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.brand} />}
      >
        {rider ? (
          <>
            {/* Hero Card */}
            <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.avatarLg, { backgroundColor: Colors.brand }]}>
                <Text style={styles.avatarText}>{rider.name[0]?.toUpperCase()}</Text>
              </View>
              <Text style={[styles.heroName, { color: colors.text }]}>
                {isRTL ? (rider.name_ar || rider.name) : rider.name}
              </Text>
              <Text style={[styles.heroEmail, { color: colors.textMuted }]}>{rider.email}</Text>

              {/* Status Toggle */}
              <Pressable
                style={[styles.statusBtn, { backgroundColor: `${STATUS_COLORS[rider.status]}22`, borderColor: STATUS_COLORS[rider.status] }]}
                onPress={cycleStatus}
                disabled={statusLoading}
              >
                {statusLoading ? (
                  <ActivityIndicator size="small" color={STATUS_COLORS[rider.status]} />
                ) : (
                  <>
                    <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[rider.status] }]} />
                    <Text style={[styles.statusText, { color: STATUS_COLORS[rider.status] }]}>
                      {statusLabel[rider.status]}
                    </Text>
                    <MaterialIcons name="swap-horiz" size={14} color={STATUS_COLORS[rider.status]} />
                  </>
                )}
              </Pressable>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <StatBox icon="delivery-dining" value={rider.today_deliveries} label={t('todayDeliveries')} color={Colors.brand} colors={colors} />
              <StatBox icon="history" value={rider.total_deliveries} label={t('totalDeliveries')} color={Colors.info} colors={colors} />
              <StatBox icon="star" value={rider.rating.toFixed(1)} label={t('rating')} color={Colors.warning} colors={colors} />
              <StatBox icon="account-balance-wallet" value={`${rider.earnings}`} label={t('earnings')} color={Colors.success} colors={colors} />
            </View>

            {/* Details Card */}
            <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'معلومات الحساب' : 'Account Information'}
              </Text>
              <DetailRow icon="phone" label={t('phone')} value={rider.phone || '—'} colors={colors} isRTL={isRTL} />
              <DetailRow icon="location-on" label={t('area')} value={rider.area || '—'} colors={colors} isRTL={isRTL} />
              <DetailRow icon="directions-bike" label={isRTL ? 'المركبة' : 'Vehicle'} value={rider.vehicle || '—'} colors={colors} isRTL={isRTL} />
              <DetailRow icon="calendar-today" label={t('joinedDate')} value={rider.joined_date || '—'} colors={colors} isRTL={isRTL} />
            </View>

            {/* Info Notice */}
            <View style={[styles.notice, { backgroundColor: `${Colors.brand}15`, borderColor: `${Colors.brand}33` }]}>
              <MaterialIcons name="info" size={16} color={Colors.brand} />
              <Text style={[styles.noticeText, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL
                  ? 'لتعديل بيانات حسابك، يرجى التواصل مع المشرف.'
                  : 'To update your account details, please contact your admin.'}
              </Text>
            </View>
          </>
        ) : (
          <View style={[styles.empty, { backgroundColor: colors.card }]}>
            <MaterialIcons name="person-off" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {isRTL ? 'لم يتم العثور على الملف الشخصي' : 'Profile not found'}
            </Text>
            <Pressable
              style={[styles.retryBtn, { backgroundColor: Colors.brand }]}
              onPress={() => { setLoading(true); load(); }}
            >
              <Text style={styles.retryText}>{isRTL ? 'إعادة المحاولة' : 'Retry'}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ icon, value, label, color, colors }: any) {
  return (
    <View style={[statStyles.box, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <MaterialIcons name={icon} size={20} color={color} />
      <Text style={[statStyles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[statStyles.label, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function DetailRow({ icon, label, value, colors, isRTL }: any) {
  return (
    <View style={[detailStyles.row, { flexDirection: isRTL ? 'row-reverse' : 'row', borderBottomColor: colors.border }]}>
      <MaterialIcons name={icon} size={16} color={Colors.brand} />
      <Text style={[detailStyles.label, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[detailStyles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  box: { flex: 1, alignItems: 'center', padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, gap: 4 },
  value: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  label: { fontSize: 9, textAlign: 'center' },
});

const detailStyles = StyleSheet.create({
  row: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm, borderBottomWidth: 1 },
  label: { fontSize: FontSize.sm, width: 90 },
  value: { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1 },
  topTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  topActions: { alignItems: 'center', gap: Spacing.sm },
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full },
  pillText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  iconBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 40 },
  heroCard: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.lg, alignItems: 'center', gap: Spacing.sm },
  avatarLg: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  avatarText: { color: '#000', fontSize: 32, fontWeight: FontWeight.bold },
  heroName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  heroEmail: { fontSize: FontSize.sm },
  statusBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1.5, marginTop: Spacing.xs },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  statsGrid: { flexDirection: 'row', gap: Spacing.sm },
  detailCard: { borderRadius: Radius.md, borderWidth: 1, padding: Spacing.md, gap: 0 },
  sectionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, marginBottom: Spacing.sm },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1 },
  noticeText: { flex: 1, fontSize: FontSize.sm, lineHeight: 20 },
  empty: { alignItems: 'center', padding: Spacing.xxl, borderRadius: Radius.lg, gap: Spacing.md, marginTop: Spacing.xxl },
  emptyText: { fontSize: FontSize.base },
  retryBtn: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: Radius.full, marginTop: Spacing.sm },
  retryText: { color: '#000', fontWeight: FontWeight.bold },
});
