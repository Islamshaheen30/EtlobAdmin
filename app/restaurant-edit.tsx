import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, Text, Pressable, TextInput, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import { restaurantService, restaurantLogoService, calcRestaurantOpenStatus, Restaurant } from '@/services/menuService';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';

type OverrideMode = 'auto' | 'open' | 'closed';

function toOverrideMode(v: boolean | null | undefined): OverrideMode {
  if (v === true) return 'open';
  if (v === false) return 'closed';
  return 'auto';
}
function fromOverrideMode(m: OverrideMode): boolean | null {
  if (m === 'open') return true;
  if (m === 'closed') return false;
  return null;
}

// ── Hour Selector ─────────────────────────────────────────────────────────────
function TimeSelector({
  value, onChange, label, colors, isRTL,
}: {
  value: string; onChange: (v: string) => void;
  label: string; colors: any; isRTL: boolean;
}) {
  const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
  const HALF_HOURS = Array.from({ length: 48 }, (_, i) => {
    const h = Math.floor(i / 2);
    const m = i % 2 === 0 ? '00' : '30';
    return `${String(h).padStart(2, '0')}:${m}`;
  });

  const [showPicker, setShowPicker] = useState(false);

  const formatDisplay = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  return (
    <View style={{ marginBottom: Spacing.md }}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
        {label}
      </Text>
      <Pressable
        style={[styles.timeBtn, { backgroundColor: colors.inputBg, borderColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        onPress={() => setShowPicker(v => !v)}
      >
        <MaterialIcons name="access-time" size={18} color={Colors.brand} />
        <Text style={[styles.timeBtnText, { color: colors.text }]}>{formatDisplay(value)}</Text>
        <MaterialIcons name={showPicker ? 'expand-less' : 'expand-more'} size={18} color={colors.icon} />
      </Pressable>

      {showPicker ? (
        <View style={[styles.timePickerWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ flexDirection: 'row', gap: Spacing.xs, padding: Spacing.sm }}
          >
            {HALF_HOURS.map(t => {
              const selected = t === value;
              return (
                <Pressable
                  key={t}
                  style={[styles.timeChip, {
                    backgroundColor: selected ? Colors.brand : colors.inputBg,
                    borderColor: selected ? Colors.brand : colors.border,
                  }]}
                  onPress={() => { onChange(t); setShowPicker(false); }}
                >
                  <Text style={[styles.timeChipText, { color: selected ? '#000' : colors.textSecondary }]}>
                    {formatDisplay(t)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

// ── Open/Closed Live Badge ────────────────────────────────────────────────────
function OpenStatusBadge({ restaurant, isRTL, colors }: { restaurant: Partial<Restaurant>; isRTL: boolean; colors: any }) {
  const [status, setStatus] = useState<'open' | 'closed'>('closed');

  useEffect(() => {
    const update = () => {
      setStatus(calcRestaurantOpenStatus(restaurant as Restaurant));
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [restaurant.is_open_override, restaurant.opening_hours, restaurant.closing_hours]);

  const isOpen = status === 'open';
  return (
    <View style={[styles.openBadge, { backgroundColor: isOpen ? `${Colors.success}20` : `${Colors.danger}15`, borderColor: isOpen ? `${Colors.success}50` : `${Colors.danger}40` }]}>
      <View style={[styles.openDot, { backgroundColor: isOpen ? Colors.success : Colors.danger }]} />
      <Text style={[styles.openBadgeText, { color: isOpen ? Colors.success : Colors.danger }]}>
        {isOpen
          ? (isRTL ? 'مفتوح الآن' : 'Open Now')
          : (isRTL ? 'مغلق الآن' : 'Closed Now')}
      </Text>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function RestaurantEditScreen() {
  const { restaurantId } = useLocalSearchParams<{ restaurantId: string }>();
  const router = useRouter();
  const { colors, t, isRTL, theme } = useApp();
  const { showAlert } = useAlert();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [form, setForm] = useState({
    name: '',
    name_ar: '',
    opening_hours: '09:00',
    closing_hours: '22:00',
    is_open_override: null as boolean | null,
    logo_url: null as string | null,
    status: 'active' as 'active' | 'inactive' | 'suspended',
  });
  const [overrideMode, setOverrideMode] = useState<OverrideMode>('auto');

  // Derived restaurant object for live badge
  const liveRestaurant: Partial<Restaurant> = {
    opening_hours: form.opening_hours,
    closing_hours: form.closing_hours,
    is_open_override: form.is_open_override,
  };

  // ── Load restaurant data ─────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      if (!restaurantId) return;
      setLoading(true);
      const { data, error } = await restaurantService.fetchAll();
      setLoading(false);
      if (error || !data) {
        showAlert(t('error'), error || 'Not found');
        return;
      }
      const r = data.find(x => x.id === restaurantId);
      if (!r) { showAlert(t('error'), 'Restaurant not found'); return; }
      setForm({
        name: r.name || '',
        name_ar: r.name_ar || '',
        opening_hours: r.opening_hours || '09:00',
        closing_hours: r.closing_hours || '22:00',
        is_open_override: r.is_open_override ?? null,
        logo_url: r.logo_url || null,
        status: r.status || 'active',
      });
      setOverrideMode(toOverrideMode(r.is_open_override));
    };
    load();
  }, [restaurantId]);

  // Sync override mode → form
  useEffect(() => {
    setForm(f => ({ ...f, is_open_override: fromOverrideMode(overrideMode) }));
  }, [overrideMode]);

  // ── Logo picker ──────────────────────────────────────────────────────────
  const pickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert(t('error'), isRTL ? 'يجب السماح بالوصول إلى الصور' : 'Photo library permission required');
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
    setUploadingLogo(true);
    const { url, error } = await restaurantLogoService.uploadLogo(restaurantId || '', asset.uri, fileName);
    setUploadingLogo(false);
    if (error) { showAlert(t('error'), error); return; }
    if (url) setForm(f => ({ ...f, logo_url: url }));
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim()) {
      showAlert(t('error'), t('fillAllFields'));
      return;
    }
    setSaving(true);
    const { error } = await restaurantService.update(restaurantId || '', {
      name: form.name.trim(),
      name_ar: form.name_ar.trim() || form.name.trim(),
      opening_hours: form.opening_hours,
      closing_hours: form.closing_hours,
      is_open_override: form.is_open_override,
      logo_url: form.logo_url,
      status: form.status,
    } as any);
    setSaving(false);
    if (error) {
      showAlert(t('error'), error);
    } else {
      showAlert(t('success'), isRTL ? 'تم حفظ بيانات المطعم' : 'Restaurant updated successfully');
      router.back();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.brand} />
        </View>
      </SafeAreaView>
    );
  }

  const displayName = isRTL ? (form.name_ar || form.name) : form.name;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Pressable style={[styles.backBtn, { backgroundColor: colors.inputBg }]} onPress={() => router.back()} hitSlop={8}>
          <MaterialIcons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={20} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? 'تعديل المطعم' : 'Edit Restaurant'}
          </Text>
          <Text style={[styles.headerSub, { color: Colors.brand, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
            {displayName || '—'}
          </Text>
        </View>
        <OpenStatusBadge restaurant={liveRestaurant} isRTL={isRTL} colors={colors} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* ── Logo ────────────────────────────────────────────────────────── */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SectionTitle icon="photo-camera" label={isRTL ? 'شعار المطعم' : 'Restaurant Logo'} colors={colors} isRTL={isRTL} />
            <View style={[styles.logoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.logoPreview, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                {form.logo_url ? (
                  <Image source={{ uri: form.logo_url }} style={styles.logoImg} contentFit="cover" transition={200} />
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <MaterialIcons name="storefront" size={32} color={colors.textMuted} />
                    <Text style={[styles.logoPlaceholderText, { color: colors.textMuted }]}>
                      {isRTL ? 'لا يوجد شعار' : 'No Logo'}
                    </Text>
                  </View>
                )}
                {uploadingLogo ? (
                  <View style={styles.logoOverlay}>
                    <ActivityIndicator size="small" color={Colors.brand} />
                  </View>
                ) : null}
              </View>
              <View style={{ flex: 1, gap: Spacing.sm }}>
                <Pressable
                  style={[styles.logoUploadBtn, { backgroundColor: `${Colors.brand}22`, borderColor: `${Colors.brand}55` }]}
                  onPress={pickLogo}
                  disabled={uploadingLogo}
                >
                  <MaterialIcons name="upload" size={16} color={Colors.brand} />
                  <Text style={[styles.logoUploadText, { color: Colors.brand }]}>
                    {uploadingLogo
                      ? (isRTL ? 'جارٍ الرفع...' : 'Uploading...')
                      : (form.logo_url
                          ? (isRTL ? 'تغيير الشعار' : 'Change Logo')
                          : (isRTL ? 'رفع شعار' : 'Upload Logo'))}
                  </Text>
                </Pressable>
                {form.logo_url ? (
                  <Pressable
                    style={[styles.logoUploadBtn, { backgroundColor: `${Colors.danger}18`, borderColor: `${Colors.danger}40` }]}
                    onPress={() => setForm(f => ({ ...f, logo_url: null }))}
                  >
                    <MaterialIcons name="delete-outline" size={16} color={Colors.danger} />
                    <Text style={[styles.logoUploadText, { color: Colors.danger }]}>
                      {isRTL ? 'حذف الشعار' : 'Remove Logo'}
                    </Text>
                  </Pressable>
                ) : null}
                <Text style={[styles.logoHint, { color: colors.textMuted }]}>
                  {isRTL ? 'يُفضَّل صورة مربعة عالية الجودة' : 'Square image recommended · JPG/PNG'}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Name ─────────────────────────────────────────────────────────── */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SectionTitle icon="edit" label={isRTL ? 'اسم المطعم' : 'Restaurant Name'} colors={colors} isRTL={isRTL} />
            <FormField
              label={isRTL ? 'الاسم بالإنجليزية' : 'Name (English)'}
              value={form.name}
              onChange={v => setForm(f => ({ ...f, name: v }))}
              colors={colors} isRTL={isRTL}
              icon="storefront"
              placeholder="e.g. Burger Palace"
            />
            <FormField
              label={isRTL ? 'الاسم بالعربية' : 'Name (Arabic)'}
              value={form.name_ar}
              onChange={v => setForm(f => ({ ...f, name_ar: v }))}
              colors={colors} isRTL={isRTL}
              icon="storefront"
              placeholder="مثال: قصر البرجر"
              rtl
            />
          </View>

          {/* ── Opening Hours ────────────────────────────────────────────────── */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SectionTitle icon="schedule" label={isRTL ? 'ساعات العمل' : 'Working Hours'} colors={colors} isRTL={isRTL} />

            {/* Current status preview */}
            <View style={[styles.hoursPreview, { backgroundColor: colors.inputBg, borderColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <MaterialIcons name="info-outline" size={15} color={colors.icon} />
              <Text style={[styles.hoursPreviewText, { color: colors.textSecondary }]}>
                {isRTL
                  ? `مواعيد العمل: ${form.opening_hours} – ${form.closing_hours}`
                  : `Working hours: ${form.opening_hours} – ${form.closing_hours}`}
              </Text>
              <OpenStatusBadge restaurant={liveRestaurant} isRTL={isRTL} colors={colors} />
            </View>

            <TimeSelector
              value={form.opening_hours}
              onChange={v => setForm(f => ({ ...f, opening_hours: v }))}
              label={isRTL ? 'وقت الفتح' : 'Opening Time'}
              colors={colors}
              isRTL={isRTL}
            />
            <TimeSelector
              value={form.closing_hours}
              onChange={v => setForm(f => ({ ...f, closing_hours: v }))}
              label={isRTL ? 'وقت الإغلاق' : 'Closing Time'}
              colors={colors}
              isRTL={isRTL}
            />
          </View>

          {/* ── Status Override ──────────────────────────────────────────────── */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SectionTitle icon="toggle-on" label={isRTL ? 'التحكم اليدوي في الحالة' : 'Manual Status Override'} colors={colors} isRTL={isRTL} />
            <Text style={[styles.overrideDesc, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL
                ? 'يمكنك إلغاء الحساب التلقائي وتعيين الحالة يدوياً'
                : 'Override automatic time-based calculation and set status manually'}
            </Text>

            <View style={[styles.overridePills, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {(['auto', 'open', 'closed'] as OverrideMode[]).map(mode => {
                const selected = overrideMode === mode;
                const color = mode === 'open' ? Colors.success : mode === 'closed' ? Colors.danger : Colors.brand;
                const icon = mode === 'open' ? 'check-circle' : mode === 'closed' ? 'cancel' : 'autorenew';
                const labelText = mode === 'auto'
                  ? (isRTL ? 'تلقائي' : 'Auto')
                  : mode === 'open'
                    ? (isRTL ? 'مفتوح دائماً' : 'Force Open')
                    : (isRTL ? 'مغلق دائماً' : 'Force Closed');
                return (
                  <Pressable
                    key={mode}
                    style={[
                      styles.overridePill,
                      { flex: 1, borderColor: selected ? color : colors.border, backgroundColor: selected ? `${color}20` : colors.inputBg },
                    ]}
                    onPress={() => setOverrideMode(mode)}
                  >
                    <MaterialIcons name={icon} size={16} color={selected ? color : colors.textMuted} />
                    <Text style={[styles.overridePillText, { color: selected ? color : colors.textSecondary }]}>
                      {labelText}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {overrideMode !== 'auto' ? (
              <View style={[styles.overrideWarning, { backgroundColor: `${Colors.warning}18`, borderColor: `${Colors.warning}40` }]}>
                <MaterialIcons name="warning-amber" size={14} color={Colors.warning} />
                <Text style={[styles.overrideWarningText, { color: Colors.warning }]}>
                  {isRTL
                    ? 'الوضع اليدوي نشط — سيتجاهل مواعيد العمل'
                    : 'Manual override active — working hours will be ignored'}
                </Text>
              </View>
            ) : null}
          </View>

          {/* ── Restaurant Status (active/inactive/suspended) ─────────────────── */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SectionTitle icon="business" label={isRTL ? 'حالة المطعم في المنصة' : 'Platform Status'} colors={colors} isRTL={isRTL} />
            <Text style={[styles.overrideDesc, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left', marginBottom: Spacing.sm }]}>
              {isRTL ? 'يتحكم في ظهور المطعم في المنصة' : 'Controls restaurant visibility on the platform'}
            </Text>
            <View style={[styles.overridePills, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {(['active', 'inactive', 'suspended'] as const).map(s => {
                const selected = form.status === s;
                const color = s === 'active' ? Colors.success : s === 'inactive' ? Colors.warning : Colors.danger;
                const labelMap = {
                  active: isRTL ? 'نشط' : 'Active',
                  inactive: isRTL ? 'غير نشط' : 'Inactive',
                  suspended: isRTL ? 'موقوف' : 'Suspended',
                };
                return (
                  <Pressable
                    key={s}
                    style={[
                      styles.overridePill,
                      { flex: 1, borderColor: selected ? color : colors.border, backgroundColor: selected ? `${color}20` : colors.inputBg },
                    ]}
                    onPress={() => setForm(f => ({ ...f, status: s }))}
                  >
                    <Text style={[styles.overridePillText, { color: selected ? color : colors.textSecondary }]}>
                      {labelMap[s]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── Save Button ──────────────────────────────────────────────────── */}
          <Pressable
            style={[styles.saveBtn, { backgroundColor: Colors.brand, opacity: saving || uploadingLogo ? 0.7 : 1 }]}
            onPress={handleSave}
            disabled={saving || uploadingLogo}
          >
            {saving ? <ActivityIndicator size="small" color="#000" /> : (
              <>
                <MaterialIcons name="check-circle" size={20} color="#000" />
                <Text style={styles.saveBtnText}>
                  {isRTL ? 'حفظ التغييرات' : 'Save Changes'}
                </Text>
              </>
            )}
          </Pressable>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionTitle({ icon, label, colors, isRTL }: any) {
  return (
    <View style={[styles.sectionTitle, { flexDirection: isRTL ? 'row-reverse' : 'row', borderBottomColor: colors.border }]}>
      <View style={[styles.sectionIconWrap, { backgroundColor: `${Colors.brand}20` }]}>
        <MaterialIcons name={icon} size={15} color={Colors.brand} />
      </View>
      <Text style={[styles.sectionTitleText, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

function FormField({ label, value, onChange, colors, isRTL, icon, placeholder, rtl }: any) {
  return (
    <View style={{ marginBottom: Spacing.sm }}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
      <View style={[styles.inputRow, {
        backgroundColor: colors.inputBg, borderColor: colors.border,
        flexDirection: isRTL ? 'row-reverse' : 'row',
      }]}>
        <MaterialIcons name={icon} size={16} color={colors.icon} />
        <TextInput
          style={[styles.input, { color: colors.text, textAlign: rtl ? 'right' : (isRTL ? 'right' : 'left') }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChange}
          autoCapitalize="none"
        />
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    alignItems: 'center', gap: Spacing.sm, borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  headerSub: { fontSize: FontSize.xs, marginTop: 1 },
  scroll: { padding: Spacing.md, gap: Spacing.md },

  // Sections
  section: { borderRadius: Radius.md, borderWidth: 1, overflow: 'hidden' },
  sectionTitle: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    borderBottomWidth: 1, marginBottom: Spacing.md - 4,
  },
  sectionIconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sectionTitleText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  // Logo
  logoRow: { alignItems: 'flex-start', gap: Spacing.md, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  logoPreview: {
    width: 96, height: 96, borderRadius: Radius.md, borderWidth: 1,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  logoImg: { width: '100%', height: '100%' },
  logoPlaceholder: { alignItems: 'center', gap: 4 },
  logoPlaceholderText: { fontSize: 10, textAlign: 'center' },
  logoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoUploadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: Radius.sm, borderWidth: 1,
  },
  logoUploadText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  logoHint: { fontSize: 10, lineHeight: 14 },

  // Fields
  fieldLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginBottom: Spacing.xs },
  inputRow: {
    alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 11,
    borderRadius: Radius.md, borderWidth: 1,
  },
  input: { flex: 1, fontSize: FontSize.base },

  // Hours preview
  hoursPreview: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 9,
    borderRadius: Radius.sm, borderWidth: 1,
    marginHorizontal: Spacing.md, marginBottom: Spacing.md,
  },
  hoursPreviewText: { flex: 1, fontSize: FontSize.xs },

  // Time selector
  timeBtn: {
    alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 11,
    borderRadius: Radius.md, borderWidth: 1,
    marginHorizontal: Spacing.md,
  },
  timeBtnText: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  timePickerWrap: {
    borderRadius: Radius.sm, borderWidth: 1,
    marginHorizontal: Spacing.md, marginTop: Spacing.xs,
  },
  timeChip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1,
  },
  timeChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },

  // Override pills
  overrideDesc: { fontSize: FontSize.xs, lineHeight: 18, paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  overridePills: { gap: Spacing.xs, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  overridePill: {
    alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 10, borderRadius: Radius.md, borderWidth: 1,
  },
  overridePillText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  overrideWarning: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    borderRadius: Radius.sm, borderWidth: 1,
    marginHorizontal: Spacing.md, marginBottom: Spacing.md,
  },
  overrideWarningText: { fontSize: FontSize.xs, flex: 1 },

  // Open badge
  openBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Radius.full, borderWidth: 1,
  },
  openDot: { width: 7, height: 7, borderRadius: 4 },
  openBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },

  // Save
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: 15, borderRadius: Radius.md,
  },
  saveBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#000' },
});
