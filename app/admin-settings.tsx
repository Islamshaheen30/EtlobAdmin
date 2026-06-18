import React, { useState, useCallback } from 'react';
import {
  View, StyleSheet, Text, Pressable, TextInput, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import { adminSettingsService, AdminSetting } from '@/services/menuService';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';

interface SettingField {
  key: string;
  labelEn: string;
  labelAr: string;
  descEn: string;
  descAr: string;
  icon: string;
  multiline?: boolean;
  keyboard?: string;
}

const SETTING_FIELDS: SettingField[] = [
  {
    key: 'cart_conflict_message',
    labelEn: 'Cart Conflict Message',
    labelAr: 'رسالة تعارض السلة',
    descEn: 'Shown when a user tries to order from a different restaurant while having items in cart',
    descAr: 'تظهر عند محاولة المستخدم الطلب من مطعم مختلف مع وجود عناصر في السلة',
    icon: 'shopping-cart',
    multiline: true,
  },
  {
    key: 'delivery_fee_base',
    labelEn: 'Base Delivery Fee (EGP)',
    labelAr: 'رسوم التوصيل الأساسية (ج.م)',
    descEn: 'Default delivery fee charged to customers',
    descAr: 'رسوم التوصيل الافتراضية المحصلة من العملاء',
    icon: 'local-shipping',
    keyboard: 'decimal-pad',
  },
  {
    key: 'min_order_amount',
    labelEn: 'Minimum Order Amount (EGP)',
    labelAr: 'الحد الأدنى للطلب (ج.م)',
    descEn: 'Minimum order value required to place an order',
    descAr: 'الحد الأدنى لقيمة الطلب المطلوب لإتمام الطلب',
    icon: 'monetization-on',
    keyboard: 'decimal-pad',
  },
];

export default function AdminSettingsScreen() {
  const router = useRouter();
  const { colors, t, isRTL, theme } = useApp();
  const { showAlert } = useAlert();

  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await adminSettingsService.getAll();
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((s: AdminSetting) => { map[s.key] = s.value || ''; });
      setSettings(map);
      setEditedValues(map);
    }
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleSave = async (key: string) => {
    const value = editedValues[key] ?? '';
    setSavingKey(key);
    const { error } = await adminSettingsService.upsert(key, value);
    setSavingKey(null);
    if (error) {
      showAlert(t('error'), error);
    } else {
      setSettings(prev => ({ ...prev, [key]: value }));
      showAlert(t('success'), isRTL ? 'تم حفظ الإعداد' : 'Setting saved');
    }
  };

  const isDirty = (key: string) => editedValues[key] !== (settings[key] ?? '');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Pressable style={[styles.backBtn, { backgroundColor: colors.inputBg }]} onPress={() => router.back()} hitSlop={8}>
          <MaterialIcons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={20} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? 'إعدادات النظام' : 'System Settings'}
          </Text>
          <Text style={[styles.headerSub, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? 'إعدادات لوحة الإدارة' : 'Admin panel configuration'}
          </Text>
        </View>
        <View style={[styles.iconWrap, { backgroundColor: `${Colors.brand}20` }]}>
          <MaterialIcons name="settings" size={20} color={Colors.brand} />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.brand} />
        </View>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

            {/* Info Banner */}
            <View style={[styles.infoBanner, { backgroundColor: `${Colors.brand}12`, borderColor: `${Colors.brand}30` }]}>
              <MaterialIcons name="info-outline" size={16} color={Colors.brand} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {isRTL
                  ? 'هذه الإعدادات مخزنة في قاعدة البيانات وتنطبق على جميع تطبيقات العملاء'
                  : 'These settings are stored in the database and apply across all customer apps'}
              </Text>
            </View>

            {SETTING_FIELDS.map(field => {
              const dirty = isDirty(field.key);
              const currentValue = editedValues[field.key] ?? '';
              return (
                <View key={field.key} style={[styles.settingCard, { backgroundColor: colors.card, borderColor: dirty ? `${Colors.brand}60` : colors.border }]}>
                  {/* Card header */}
                  <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row', borderBottomColor: colors.border }]}>
                    <View style={[styles.settingIconWrap, { backgroundColor: `${Colors.brand}20` }]}>
                      <MaterialIcons name={field.icon as any} size={16} color={Colors.brand} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.settingLabel, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
                        {isRTL ? field.labelAr : field.labelEn}
                      </Text>
                      <Text style={[styles.settingDesc, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
                        {isRTL ? field.descAr : field.descEn}
                      </Text>
                    </View>
                    {dirty ? (
                      <View style={[styles.dirtyDot, { backgroundColor: Colors.brand }]} />
                    ) : null}
                  </View>

                  {/* Input */}
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.inputBg,
                          borderColor: dirty ? `${Colors.brand}60` : colors.border,
                          color: colors.text,
                          textAlign: isRTL ? 'right' : 'left',
                          minHeight: field.multiline ? 80 : undefined,
                          textAlignVertical: field.multiline ? 'top' : undefined,
                        },
                      ]}
                      value={currentValue}
                      onChangeText={v => setEditedValues(prev => ({ ...prev, [field.key]: v }))}
                      keyboardType={field.keyboard as any || 'default'}
                      multiline={field.multiline}
                      placeholderTextColor={colors.textMuted}
                      placeholder={isRTL ? 'أدخل القيمة...' : 'Enter value...'}
                    />
                  </View>

                  {/* Save button */}
                  <View style={[styles.cardFooter, { flexDirection: isRTL ? 'row-reverse' : 'row', borderTopColor: colors.border }]}>
                    {dirty ? (
                      <Pressable
                        style={[styles.resetBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                        onPress={() => setEditedValues(prev => ({ ...prev, [field.key]: settings[field.key] ?? '' }))}
                      >
                        <MaterialIcons name="undo" size={14} color={colors.textMuted} />
                        <Text style={[styles.resetText, { color: colors.textMuted }]}>
                          {isRTL ? 'إلغاء' : 'Reset'}
                        </Text>
                      </Pressable>
                    ) : (
                      <View style={[styles.savedTag, { backgroundColor: `${Colors.success}15` }]}>
                        <MaterialIcons name="check-circle" size={13} color={Colors.success} />
                        <Text style={[styles.savedText, { color: Colors.success }]}>
                          {isRTL ? 'محفوظ' : 'Saved'}
                        </Text>
                      </View>
                    )}
                    <Pressable
                      style={[styles.saveBtn, { backgroundColor: dirty ? Colors.brand : colors.inputBg, opacity: savingKey === field.key ? 0.7 : 1 }]}
                      onPress={() => handleSave(field.key)}
                      disabled={!dirty || savingKey === field.key}
                    >
                      {savingKey === field.key ? (
                        <ActivityIndicator size="small" color="#000" />
                      ) : (
                        <>
                          <MaterialIcons name="save" size={14} color={dirty ? '#000' : colors.textMuted} />
                          <Text style={[styles.saveBtnText, { color: dirty ? '#000' : colors.textMuted }]}>
                            {isRTL ? 'حفظ' : 'Save'}
                          </Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                </View>
              );
            })}

            {/* DB Info */}
            <View style={[styles.dbInfo, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialIcons name="storage" size={16} color={colors.icon} />
              <Text style={[styles.dbInfoText, { color: colors.textMuted }]}>
                {isRTL
                  ? 'الإعدادات مخزنة في جدول admin_settings في قاعدة البيانات مع التحكم الكامل بالصلاحيات'
                  : 'Settings stored in admin_settings table with full RLS access control'}
              </Text>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

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
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: Spacing.md, gap: Spacing.md },
  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1,
  },
  infoText: { flex: 1, fontSize: FontSize.xs, lineHeight: 18 },
  settingCard: { borderRadius: Radius.md, borderWidth: 1, overflow: 'hidden' },
  cardHeader: {
    alignItems: 'flex-start', gap: Spacing.sm,
    padding: Spacing.md, borderBottomWidth: 1,
  },
  settingIconWrap: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  settingDesc: { fontSize: FontSize.xs, lineHeight: 16, marginTop: 2 },
  dirtyDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  inputWrap: { padding: Spacing.md, paddingBottom: 0 },
  input: {
    borderWidth: 1, borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm, paddingVertical: 11,
    fontSize: FontSize.sm, lineHeight: 20,
  },
  cardFooter: {
    alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.sm, borderTopWidth: 1, marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: Radius.sm, borderWidth: 1,
  },
  resetText: { fontSize: FontSize.xs },
  savedTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.sm,
  },
  savedText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: Radius.md,
  },
  saveBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  dbInfo: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1,
  },
  dbInfoText: { flex: 1, fontSize: 10, lineHeight: 16 },
});
