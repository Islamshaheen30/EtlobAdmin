import React, { useState, useMemo, useCallback } from 'react';
import { Image } from 'expo-image';
import {
  View, ScrollView, StyleSheet, Text, Pressable, TextInput,
  FlatList, ActivityIndicator, Modal, KeyboardAvoidingView, Platform,
  Alert, Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '@/hooks/useApp';
import { useRestaurantsManager } from '@/hooks/useMenuManager';
import { Restaurant, calcRestaurantOpenStatus, restaurantLogoService } from '@/services/menuService';
import { staffService } from '@/services/staffService';
import { StatusBadge, TopBar } from '@/components';
import { useAlert } from '@/template';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';

type StatusFilter = 'all' | 'active' | 'inactive' | 'suspended';

// ── Credential helpers ─────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 16);
}

function generateUsername(name: string): string {
  const slug = slugify(name) || 'restaurant';
  const suffix = Math.random().toString(36).slice(2, 6);
  return `owner_${slug}_${suffix}`;
}

function generatePassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '@#$!&';
  const all = upper + lower + digits + symbols;
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  // Guarantee at least one of each type
  const mandatory = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  const extra = Array.from({ length: 8 }, () => pick(all));
  return [...mandatory, ...extra]
    .sort(() => Math.random() - 0.5)
    .join('');
}

// ── Credential Dialog shown after creation ──────────────────────────────────

function CredentialsModal({
  visible, onClose, restaurantName, username, password, isRTL, colors,
}: {
  visible: boolean;
  onClose: () => void;
  restaurantName: string;
  username: string;
  password: string;
  isRTL: boolean;
  colors: any;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={credStyles.overlay}>
        <View style={[credStyles.card, { backgroundColor: colors.surface }]}>
          {/* Icon */}
          <View style={credStyles.iconWrap}>
            <MaterialIcons name="check-circle" size={48} color={Colors.success} />
          </View>
          <Text style={[credStyles.title, { color: colors.text }]}>
            {isRTL ? 'تم إنشاء المطعم!' : 'Restaurant Created!'}
          </Text>
          <Text style={[credStyles.sub, { color: colors.textSecondary }]}>
            {isRTL
              ? `تم إنشاء "${restaurantName}" وحفظ بيانات الدخول أدناه.`
              : `"${restaurantName}" is live. Owner credentials saved below.`}
          </Text>

          <View style={[credStyles.credBox, { backgroundColor: colors.inputBg, borderColor: `${Colors.brand}40` }]}>
            <View style={credStyles.credRow}>
              <MaterialIcons name="person" size={16} color={Colors.brand} />
              <View style={{ flex: 1 }}>
                <Text style={[credStyles.credLabel, { color: colors.textMuted }]}>
                  {isRTL ? 'اسم المستخدم' : 'Username'}
                </Text>
                <Text style={[credStyles.credValue, { color: colors.text }]} selectable>{username}</Text>
              </View>
              <Pressable
                hitSlop={8}
                onPress={() => {
                  Clipboard.setString(username);
                }}
              >
                <MaterialIcons name="content-copy" size={16} color={colors.icon} />
              </Pressable>
            </View>
            <View style={[credStyles.divider, { backgroundColor: colors.border }]} />
            <View style={credStyles.credRow}>
              <MaterialIcons name="lock" size={16} color={Colors.brand} />
              <View style={{ flex: 1 }}>
                <Text style={[credStyles.credLabel, { color: colors.textMuted }]}>
                  {isRTL ? 'كلمة المرور' : 'Password'}
                </Text>
                <Text style={[credStyles.credValue, { color: colors.text }]} selectable>{password}</Text>
              </View>
              <Pressable
                hitSlop={8}
                onPress={() => {
                  Clipboard.setString(password);
                }}
              >
                <MaterialIcons name="content-copy" size={16} color={colors.icon} />
              </Pressable>
            </View>
          </View>

          <View style={[credStyles.warningRow, { backgroundColor: `${Colors.warning}15`, borderColor: `${Colors.warning}40` }]}>
            <MaterialIcons name="warning-amber" size={14} color={Colors.warning} />
            <Text style={[credStyles.warningText, { color: Colors.warning }]}>
              {isRTL
                ? 'يرجى حفظ هذه البيانات الآن — لن تظهر مرة أخرى بهذا الشكل.'
                : 'Save these credentials now — they will not be shown again.'}
            </Text>
          </View>

          <Pressable style={[credStyles.doneBtn, { backgroundColor: Colors.brand }]} onPress={onClose}>
            <Text style={credStyles.doneBtnText}>
              {isRTL ? 'تم، تم الحفظ' : 'Done, Saved'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const credStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  card: { width: '100%', borderRadius: Radius.lg || 20, padding: Spacing.xl || 28, alignItems: 'center', gap: Spacing.md },
  iconWrap: { marginBottom: Spacing.xs },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, textAlign: 'center' },
  sub: { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },
  credBox: { width: '100%', borderRadius: Radius.md, borderWidth: 1.5, overflow: 'hidden' },
  credRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md },
  credLabel: { fontSize: FontSize.xs, marginBottom: 2 },
  credValue: { fontSize: FontSize.base, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  divider: { height: 1 },
  warningRow: { width: '100%', flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, padding: Spacing.sm, borderRadius: Radius.sm, borderWidth: 1 },
  warningText: { flex: 1, fontSize: FontSize.xs, lineHeight: 16 },
  doneBtn: { width: '100%', paddingVertical: 14, borderRadius: Radius.md, alignItems: 'center' },
  doneBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#000' },
});

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function RestaurantsScreen() {
  const { colors, t, isRTL, theme } = useApp();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { restaurants, loading, loadRestaurants, createRestaurant } = useRestaurantsManager();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // ── Create modal state ──────────────────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    name_ar: '',
    area: '',
    logo_url: null as string | null,
    logoLocalUri: null as string | null,
    logoFileName: '',
  });

  // ── Credentials modal state ─────────────────────────────────────────────
  const [credModal, setCredModal] = useState<{
    visible: boolean;
    restaurantName: string;
    username: string;
    password: string;
  }>({ visible: false, restaurantName: '', username: '', password: '' });

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

  // ── Logo picker ─────────────────────────────────────────────────────────
  const pickCreateLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert(t('error'), isRTL ? 'يجب السماح بالوصول للصور' : 'Photo library permission required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const fileName = asset.uri.split('/').pop() || 'logo.jpg';
    setCreateForm(f => ({ ...f, logoLocalUri: asset.uri, logoFileName: fileName }));
  };

  const resetCreateForm = () => {
    setCreateForm({ name: '', name_ar: '', area: '', logo_url: null, logoLocalUri: null, logoFileName: '' });
  };

  // ── Create restaurant ───────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      showAlert(t('error'), isRTL ? 'اسم المطعم بالإنجليزية مطلوب' : 'Restaurant name (English) is required');
      return;
    }

    setCreating(true);

    // 1. Upload logo if selected (need restaurant ID first — upload after creation)
    // We'll create the restaurant first, then upload & update logo_url
    const username = generateUsername(createForm.name);
    const password = generatePassword();

    // 2. Create restaurant record
    const { data: newRestaurant, error: createErr } = await createRestaurant({
      name: createForm.name.trim(),
      name_ar: createForm.name_ar.trim() || createForm.name.trim(),
      area: createForm.area.trim(),
      logo_url: null,
      owner_username: username,
      owner_password: password,
    });

    if (createErr || !newRestaurant) {
      setCreating(false);
      showAlert(t('error'), createErr || 'Failed to create restaurant');
      return;
    }

    // 3. Upload logo if selected
    let logoUrl: string | null = null;
    if (createForm.logoLocalUri && createForm.logoFileName) {
      setUploadingLogo(true);
      const { url, error: uploadErr } = await restaurantLogoService.uploadLogo(
        newRestaurant.id,
        createForm.logoLocalUri,
        createForm.logoFileName
      );
      setUploadingLogo(false);
      if (!uploadErr && url) {
        logoUrl = url;
        // Update restaurant with logo
        const { default: menuServiceModule } = await import('@/services/menuService');
      }
      // Update restaurant logo_url
      if (logoUrl) {
        const { restaurantService: rs } = await import('@/services/menuService');
        await rs.update(newRestaurant.id, { logo_url: logoUrl });
        // Also update local state via refresh
        await loadRestaurants();
      }
    }

    // 4. Create restaurant_owner staff record
    await staffService.create({
      restaurant_id: newRestaurant.id,
      name: createForm.name.trim(),
      name_ar: createForm.name_ar.trim() || createForm.name.trim(),
      username,
      password,
      role: 'restaurant_owner',
    });

    setCreating(false);
    setShowCreateModal(false);
    resetCreateForm();

    // 5. Show credentials
    setCredModal({
      visible: true,
      restaurantName: isRTL ? (createForm.name_ar.trim() || createForm.name.trim()) : createForm.name.trim(),
      username,
      password,
    });
  };

  // ── Navigation ──────────────────────────────────────────────────────────
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

  const handleStaff = (restaurant: Restaurant) => {
    router.push({ pathname: '/restaurant-staff', params: { restaurantId: restaurant.id } });
  };

  // ── Render item ─────────────────────────────────────────────────────────
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
            <Pressable
              style={[styles.menuBtn, { backgroundColor: `${Colors.success}18`, borderColor: `${Colors.success}44` }]}
              onPress={() => handleStaff(item)}
            >
              <MaterialIcons name="people" size={14} color={Colors.success} />
              <Text style={[styles.menuBtnText, { color: Colors.success }]}>
                {isRTL ? 'موظفين' : 'Staff'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────
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

      {/* Status Filter + Create button */}
      <View style={[styles.filterWrap, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={{ flex: 1, overflow: 'hidden' }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {(['all', 'active', 'inactive', 'suspended'] as StatusFilter[]).map(s => (
              <Pressable
                key={s}
                style={[styles.chip, {
                  backgroundColor: statusFilter === s ? Colors.brand : colors.inputBg,
                  borderColor: statusFilter === s ? Colors.brand : colors.border,
                }]}
                onPress={() => setStatusFilter(s)}
              >
                <Text style={[styles.chipText, { color: statusFilter === s ? '#000' : colors.textSecondary }]}>
                  {statusLabel[s]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
        {/* ── Create New Restaurant button ── */}
        <Pressable
          style={[styles.createBtn, { backgroundColor: Colors.brand }]}
          onPress={() => {
            resetCreateForm();
            setShowCreateModal(true);
          }}
        >
          <MaterialIcons name="add" size={18} color="#000" />
          <Text style={styles.createBtnText}>
            {isRTL ? 'مطعم جديد' : 'New'}
          </Text>
        </Pressable>
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
              <Pressable
                style={[styles.createBtn, { backgroundColor: Colors.brand, paddingHorizontal: 20, paddingVertical: 10 }]}
                onPress={() => { resetCreateForm(); setShowCreateModal(true); }}
              >
                <MaterialIcons name="add" size={16} color="#000" />
                <Text style={styles.createBtnText}>{isRTL ? 'إضافة مطعم' : 'Add Restaurant'}</Text>
              </Pressable>
            </View>
          }
        />
      )}

      {/* ── CREATE RESTAURANT MODAL ──────────────────────────────────────── */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
            <View style={[styles.sheet, { backgroundColor: colors.surface }]}>

              {/* Sheet header */}
              <View style={[styles.sheetHeader, {
                flexDirection: isRTL ? 'row-reverse' : 'row',
                borderBottomColor: colors.border,
              }]}>
                <View style={[styles.sheetIconWrap, { backgroundColor: `${Colors.brand}20` }]}>
                  <MaterialIcons name="storefront" size={20} color={Colors.brand} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sheetTitle, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'إضافة مطعم جديد' : 'Create New Restaurant'}
                  </Text>
                  <Text style={[styles.sheetSub, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL
                      ? 'سيتم توليد اسم مستخدم وكلمة مرور تلقائياً'
                      : 'Username & password will be auto-generated'}
                  </Text>
                </View>
                <Pressable onPress={() => setShowCreateModal(false)} hitSlop={8}>
                  <MaterialIcons name="close" size={22} color={colors.icon} />
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.sheetBody}
              >
                {/* ── Logo picker ─────────────────────────────────────────── */}
                <View style={[styles.logoSection, {
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  backgroundColor: colors.inputBg,
                  borderColor: colors.border,
                }]}>
                  <Pressable
                    style={[styles.logoPreview, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={pickCreateLogo}
                  >
                    {createForm.logoLocalUri ? (
                      <Image
                        source={{ uri: createForm.logoLocalUri }}
                        style={styles.logoImg}
                        contentFit="cover"
                        transition={200}
                      />
                    ) : (
                      <View style={styles.logoPlaceholderInner}>
                        <MaterialIcons name="add-photo-alternate" size={28} color={colors.textMuted} />
                        <Text style={[styles.logoPlaceholderText, { color: colors.textMuted }]}>
                          {isRTL ? 'شعار' : 'Logo'}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                  <View style={{ flex: 1, gap: Spacing.sm }}>
                    <Text style={[styles.logoSectionTitle, { color: colors.text }]}>
                      {isRTL ? 'شعار المطعم' : 'Restaurant Logo'}
                    </Text>
                    <Text style={[styles.logoSectionSub, { color: colors.textMuted }]}>
                      {isRTL ? 'اختياري · صورة مربعة' : 'Optional · Square image recommended'}
                    </Text>
                    <Pressable
                      style={[styles.logoPickBtn, {
                        backgroundColor: createForm.logoLocalUri ? `${Colors.danger}18` : `${Colors.brand}18`,
                        borderColor: createForm.logoLocalUri ? `${Colors.danger}40` : `${Colors.brand}40`,
                      }]}
                      onPress={createForm.logoLocalUri
                        ? () => setCreateForm(f => ({ ...f, logoLocalUri: null, logoFileName: '' }))
                        : pickCreateLogo}
                    >
                      <MaterialIcons
                        name={createForm.logoLocalUri ? 'delete-outline' : 'upload'}
                        size={14}
                        color={createForm.logoLocalUri ? Colors.danger : Colors.brand}
                      />
                      <Text style={[styles.logoPickBtnText, {
                        color: createForm.logoLocalUri ? Colors.danger : Colors.brand,
                      }]}>
                        {createForm.logoLocalUri
                          ? (isRTL ? 'إزالة' : 'Remove')
                          : (isRTL ? 'اختيار صورة' : 'Choose Image')}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* ── Name (English) ─────────────────────────────────────── */}
                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'اسم المطعم بالإنجليزية *' : 'Restaurant Name (English) *'}
                  </Text>
                  <View style={[styles.inputRow, {
                    backgroundColor: colors.inputBg,
                    borderColor: createForm.name.trim() ? Colors.brand : colors.border,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                  }]}>
                    <MaterialIcons name="storefront" size={16} color={colors.icon} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="e.g. Burger Palace"
                      placeholderTextColor={colors.textMuted}
                      value={createForm.name}
                      onChangeText={v => setCreateForm(f => ({ ...f, name: v }))}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                {/* ── Name (Arabic) ──────────────────────────────────────── */}
                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'اسم المطعم بالعربية' : 'Restaurant Name (Arabic)'}
                  </Text>
                  <View style={[styles.inputRow, {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.border,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                  }]}>
                    <MaterialIcons name="storefront" size={16} color={colors.icon} />
                    <TextInput
                      style={[styles.input, { color: colors.text, textAlign: 'right' }]}
                      placeholder="مثال: قصر البرجر"
                      placeholderTextColor={colors.textMuted}
                      value={createForm.name_ar}
                      onChangeText={v => setCreateForm(f => ({ ...f, name_ar: v }))}
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* ── Address ────────────────────────────────────────────── */}
                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'عنوان / منطقة المطعم' : 'Restaurant Address / Area'}
                  </Text>
                  <View style={[styles.inputRow, {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.border,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                  }]}>
                    <MaterialIcons name="location-on" size={16} color={colors.icon} />
                    <TextInput
                      style={[styles.input, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}
                      placeholder={isRTL ? 'مثال: 12 شارع النيل، المعادي، القاهرة' : 'e.g. 12 Nile St, Maadi, Cairo'}
                      placeholderTextColor={colors.textMuted}
                      value={createForm.area}
                      onChangeText={v => setCreateForm(f => ({ ...f, area: v }))}
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* ── Auto-credentials info banner ───────────────────────── */}
                <View style={[styles.autoCredBanner, {
                  backgroundColor: `${Colors.info}12`,
                  borderColor: `${Colors.info}35`,
                }]}>
                  <MaterialIcons name="auto-fix-high" size={16} color={Colors.info} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.autoCredTitle, { color: Colors.info }]}>
                      {isRTL ? 'بيانات الدخول تلقائية' : 'Auto-Generated Credentials'}
                    </Text>
                    <Text style={[styles.autoCredSub, { color: colors.textMuted }]}>
                      {isRTL
                        ? 'سيتم إنشاء اسم مستخدم وكلمة مرور قوية تلقائياً وحفظها بأمان في قاعدة البيانات بدور "مالك المطعم".'
                        : 'A unique username and strong password will be auto-generated, stored securely, and assigned the Restaurant_Owner role.'}
                    </Text>
                  </View>
                </View>

                {/* ── Save button ────────────────────────────────────────── */}
                <Pressable
                  style={[styles.saveBtn, {
                    backgroundColor: Colors.brand,
                    opacity: creating || uploadingLogo ? 0.7 : 1,
                  }]}
                  onPress={handleCreate}
                  disabled={creating || uploadingLogo}
                >
                  {creating || uploadingLogo ? (
                    <>
                      <ActivityIndicator size="small" color="#000" />
                      <Text style={styles.saveBtnText}>
                        {uploadingLogo
                          ? (isRTL ? 'جارٍ رفع الشعار...' : 'Uploading logo...')
                          : (isRTL ? 'جارٍ الإنشاء...' : 'Creating...')}
                      </Text>
                    </>
                  ) : (
                    <>
                      <MaterialIcons name="add-business" size={18} color="#000" />
                      <Text style={styles.saveBtnText}>
                        {isRTL ? 'إنشاء المطعم' : 'Create Restaurant'}
                      </Text>
                    </>
                  )}
                </Pressable>
                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── CREDENTIALS MODAL ────────────────────────────────────────────── */}
      <CredentialsModal
        visible={credModal.visible}
        onClose={() => {
          setCredModal(c => ({ ...c, visible: false }));
          loadRestaurants();
        }}
        restaurantName={credModal.restaurantName}
        username={credModal.username}
        password={credModal.password}
        isRTL={isRTL}
        colors={colors}
      />
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

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

  filterWrap: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingRight: Spacing.sm },
  filterScroll: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1 },
  chipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },

  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: Radius.md,
    marginVertical: Spacing.xs,
  },
  createBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#000' },

  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: 40 },

  // Card
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

  // Modal / Sheet
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
  sheetHeader: {
    alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.lg, borderBottomWidth: 1,
  },
  sheetIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  sheetSub: { fontSize: FontSize.xs, marginTop: 1 },
  sheetBody: { padding: Spacing.lg, gap: Spacing.md },

  // Logo picker
  logoSection: {
    alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1,
  },
  logoPreview: {
    width: 80, height: 80, borderRadius: Radius.md, borderWidth: 1,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  logoImg: { width: '100%', height: '100%' },
  logoPlaceholderInner: { alignItems: 'center', gap: 4 },
  logoPlaceholderText: { fontSize: FontSize.xs },
  logoSectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  logoSectionSub: { fontSize: FontSize.xs, lineHeight: 16 },
  logoPickBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: Radius.sm, borderWidth: 1,
    alignSelf: 'flex-start',
  },
  logoPickBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },

  // Form fields
  fieldWrap: { gap: Spacing.xs },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 12,
    borderRadius: Radius.md, borderWidth: 1,
  },
  input: { flex: 1, fontSize: FontSize.base },

  // Auto-cred banner
  autoCredBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1,
  },
  autoCredTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, marginBottom: 3 },
  autoCredSub: { fontSize: FontSize.xs, lineHeight: 16 },

  // Save button
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: 14, borderRadius: Radius.md,
    marginTop: Spacing.sm,
  },
  saveBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#000' },
});
