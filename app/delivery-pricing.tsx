import React, { useState, useCallback } from 'react';
import {
  View, StyleSheet, Text, Pressable, TextInput, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import { useDeliveryPricing } from '@/hooks/useStaffManager';
import { DeliveryPricing } from '@/services/staffService';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';

const VEHICLE_META: Record<string, { icon: string; labelEn: string; labelAr: string; color: string }> = {
  motorcycle: { icon: 'two-wheeler', labelEn: 'Motorcycle', labelAr: 'دراجة نارية', color: Colors.brand },
  bicycle:    { icon: 'pedal-bike', labelEn: 'Bicycle',    labelAr: 'دراجة هوائية', color: Colors.success },
  scooter:    { icon: 'electric-scooter', labelEn: 'Scooter', labelAr: 'سكوتر',    color: Colors.info },
};

const FEE_META: Record<string, { icon: string; labelEn: string; labelAr: string; descEn: string; descAr: string }> = {
  flat_rate:       { icon: 'paid',     labelEn: 'Flat Rate',       labelAr: 'سعر ثابت',    descEn: 'Same fee regardless of distance', descAr: 'رسوم ثابتة بغض النظر عن المسافة' },
  distance_based:  { icon: 'route',   labelEn: 'Distance-Based',   labelAr: 'حسب المسافة', descEn: 'Charged per km traveled',          descAr: 'يُحسب لكل كيلومتر مقطوع' },
};

export default function DeliveryPricingScreen() {
  const router = useRouter();
  const { colors, t, isRTL, theme } = useApp();
  const { showAlert } = useAlert();
  const { pricing, loading, saving, loadPricing, updatePricing, archiveOldOrders } = useDeliveryPricing();
  const [editValues, setEditValues] = useState<Record<string, Partial<DeliveryPricing>>>({});
  const [archiving, setArchiving] = useState(false);

  useFocusEffect(useCallback(() => {
    loadPricing().then(() => setEditValues({}));
  }, [loadPricing]));

  const getEdit = (item: DeliveryPricing): Partial<DeliveryPricing> => editValues[item.id] || {};

  const setField = (id: string, field: keyof DeliveryPricing, value: any) => {
    setEditValues(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const isDirty = (item: DeliveryPricing) => !!editValues[item.id] && Object.keys(editValues[item.id]).length > 0;

  const handleSave = async (item: DeliveryPricing) => {
    const updates = editValues[item.id];
    if (!updates) return;
    const { error } = await updatePricing(item.id, updates);
    if (error) {
      showAlert(t('error'), error);
    } else {
      setEditValues(prev => { const n = { ...prev }; delete n[item.id]; return n; });
      showAlert(t('success'), isRTL ? 'تم حفظ التسعيرة' : 'Pricing updated');
    }
  };

  const handleReset = (id: string) => {
    setEditValues(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const handleArchive = async () => {
    showAlert(
      isRTL ? 'أرشفة الطلبات القديمة' : 'Archive Old Orders',
      isRTL
        ? 'سيتم أرشفة الطلبات المنتهية والملغاة قبل 90 يوماً. هل تريد المتابعة؟'
        : 'Orders older than 90 days (delivered or cancelled) will be archived. Continue?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: isRTL ? 'أرشفة' : 'Archive',
          onPress: async () => {
            setArchiving(true);
            const { count, error } = await archiveOldOrders();
            setArchiving(false);
            if (error) showAlert(t('error'), error);
            else showAlert(
              t('success'),
              isRTL ? `تم أرشفة ${count} طلب` : `${count} orders archived successfully`
            );
          },
        },
      ]
    );
  };

  // Group by vehicle type
  const grouped: Record<string, DeliveryPricing[]> = {};
  pricing.forEach(p => {
    if (!grouped[p.vehicle_type]) grouped[p.vehicle_type] = [];
    grouped[p.vehicle_type].push(p);
  });

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
            {isRTL ? 'تسعيرة التوصيل' : 'Delivery Pricing'}
          </Text>
          <Text style={[styles.headerSub, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? 'حسب نوع المركبة وطريقة الحساب' : 'By vehicle type and calculation method'}
          </Text>
        </View>
        <Pressable
          style={[styles.archiveBtn, { backgroundColor: `${Colors.warning}20`, borderColor: `${Colors.warning}50` }]}
          onPress={handleArchive}
          disabled={archiving}
        >
          {archiving ? (
            <ActivityIndicator size="small" color={Colors.warning} />
          ) : (
            <>
              <MaterialIcons name="archive" size={14} color={Colors.warning} />
              <Text style={[styles.archiveBtnText, { color: Colors.warning }]}>
                {isRTL ? '90 يوم' : '90-day'}
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Retention info banner */}
      <View style={[styles.retentionBanner, { backgroundColor: `${Colors.info}12`, borderColor: `${Colors.info}30` }]}>
        <MaterialIcons name="info-outline" size={14} color={Colors.info} />
        <Text style={[styles.retentionText, { color: Colors.info }]}>
          {isRTL
            ? 'سياسة الاحتفاظ بالبيانات: يمكن الاستعلام عن الطلبات لمدة 90 يوماً قبل الأرشفة التلقائية'
            : 'Data retention: Orders are queryable for 90 days before archiving. Use the Archive button to run manually.'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.brand} />
        </View>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

            {(['motorcycle', 'bicycle', 'scooter'] as const).map(vehicleType => {
              const meta = VEHICLE_META[vehicleType];
              const items = grouped[vehicleType] || [];
              return (
                <View key={vehicleType} style={[styles.vehicleSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {/* Vehicle header */}
                  <View style={[styles.vehicleHeader, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: `${meta.color}12`, borderBottomColor: `${meta.color}20` }]}>
                    <View style={[styles.vehicleIconWrap, { backgroundColor: `${meta.color}25` }]}>
                      <MaterialIcons name={meta.icon as any} size={20} color={meta.color} />
                    </View>
                    <Text style={[styles.vehicleTitle, { color: meta.color }]}>
                      {isRTL ? meta.labelAr : meta.labelEn}
                    </Text>
                    <Text style={[styles.vehicleCount, { color: colors.textMuted }]}>
                      {items.length} {isRTL ? 'خيارات' : 'options'}
                    </Text>
                  </View>

                  {/* Fee type cards */}
                  {items.map(item => {
                    const feeMeta = FEE_META[item.fee_type];
                    const edit = getEdit(item);
                    const dirty = isDirty(item);
                    const currentPricePerKm = edit.price_per_km !== undefined ? edit.price_per_km : item.price_per_km;
                    const currentFlatFee = edit.flat_fee_egp !== undefined ? edit.flat_fee_egp : item.flat_fee_egp;
                    const currentMinFee = edit.min_fee_egp !== undefined ? edit.min_fee_egp : item.min_fee_egp;
                    const currentMaxFee = edit.max_fee_egp !== undefined ? edit.max_fee_egp : item.max_fee_egp;
                    const currentActive = edit.is_active !== undefined ? edit.is_active : item.is_active;

                    return (
                      <View key={item.id} style={[styles.feeCard, { borderTopColor: colors.border, backgroundColor: dirty ? `${Colors.brand}08` : 'transparent' }]}>
                        {/* Fee type header */}
                        <View style={[styles.feeTypeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                          <View style={[styles.feeTypeIconWrap, { backgroundColor: `${meta.color}15` }]}>
                            <MaterialIcons name={feeMeta.icon as any} size={16} color={meta.color} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.feeTypeTitle, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
                              {isRTL ? feeMeta.labelAr : feeMeta.labelEn}
                            </Text>
                            <Text style={[styles.feeTypeDesc, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
                              {isRTL ? feeMeta.descAr : feeMeta.descEn}
                            </Text>
                          </View>
                          <View style={[styles.activeToggleWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <Text style={[styles.activeLabel, { color: currentActive ? Colors.success : colors.textMuted }]}>
                              {currentActive ? (isRTL ? 'مفعّل' : 'On') : (isRTL ? 'معطّل' : 'Off')}
                            </Text>
                            <Switch
                              value={!!currentActive}
                              onValueChange={v => setField(item.id, 'is_active', v)}
                              trackColor={{ false: colors.border, true: `${Colors.success}88` }}
                              thumbColor={currentActive ? Colors.success : colors.textMuted}
                            />
                          </View>
                          {dirty ? <View style={[styles.dirtyDot, { backgroundColor: Colors.brand }]} /> : null}
                        </View>

                        {/* Pricing fields */}
                        <View style={styles.fieldsGrid}>
                          {item.fee_type === 'distance_based' ? (
                            <PricingField
                              label={isRTL ? 'سعر الكيلومتر (ج.م)' : 'Price per km (EGP)'}
                              value={currentPricePerKm?.toString() || '0'}
                              onChange={v => setField(item.id, 'price_per_km', parseFloat(v) || 0)}
                              colors={colors} isRTL={isRTL}
                              accent={meta.color}
                            />
                          ) : (
                            <PricingField
                              label={isRTL ? 'الرسوم الثابتة (ج.م)' : 'Flat Fee (EGP)'}
                              value={currentFlatFee?.toString() || '0'}
                              onChange={v => setField(item.id, 'flat_fee_egp', parseFloat(v) || 0)}
                              colors={colors} isRTL={isRTL}
                              accent={meta.color}
                            />
                          )}
                          <PricingField
                            label={isRTL ? 'الحد الأدنى (ج.م)' : 'Min Fee (EGP)'}
                            value={currentMinFee?.toString() || '0'}
                            onChange={v => setField(item.id, 'min_fee_egp', parseFloat(v) || 0)}
                            colors={colors} isRTL={isRTL}
                            accent={meta.color}
                          />
                          <PricingField
                            label={isRTL ? 'الحد الأقصى (ج.م)' : 'Max Fee (EGP)'}
                            value={currentMaxFee?.toString() || ''}
                            onChange={v => setField(item.id, 'max_fee_egp', v ? parseFloat(v) : null)}
                            colors={colors} isRTL={isRTL}
                            accent={meta.color}
                            optional
                          />
                        </View>

                        {/* Actions */}
                        {dirty ? (
                          <View style={[styles.feeActions, { flexDirection: isRTL ? 'row-reverse' : 'row', borderTopColor: colors.border }]}>
                            <Pressable
                              style={[styles.resetBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                              onPress={() => handleReset(item.id)}
                            >
                              <MaterialIcons name="undo" size={14} color={colors.textMuted} />
                              <Text style={[styles.resetText, { color: colors.textMuted }]}>
                                {isRTL ? 'إلغاء' : 'Reset'}
                              </Text>
                            </Pressable>
                            <Pressable
                              style={[styles.saveBtn, { backgroundColor: Colors.brand, opacity: saving === item.id ? 0.7 : 1 }]}
                              onPress={() => handleSave(item)}
                              disabled={saving === item.id}
                            >
                              {saving === item.id ? (
                                <ActivityIndicator size="small" color="#000" />
                              ) : (
                                <>
                                  <MaterialIcons name="save" size={14} color="#000" />
                                  <Text style={styles.saveBtnText}>{isRTL ? 'حفظ' : 'Save'}</Text>
                                </>
                              )}
                            </Pressable>
                          </View>
                        ) : (
                          <View style={[styles.savedRow, { borderTopColor: colors.border }]}>
                            <MaterialIcons name="check-circle" size={13} color={Colors.success} />
                            <Text style={[styles.savedText, { color: Colors.success }]}>
                              {isRTL ? 'محفوظ' : 'Saved'}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })}

            {/* Data Retention card */}
            <View style={[styles.retentionCard, { backgroundColor: colors.card, borderColor: `${Colors.warning}30` }]}>
              <View style={[styles.retentionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.retIconWrap, { backgroundColor: `${Colors.warning}20` }]}>
                  <MaterialIcons name="history" size={18} color={Colors.warning} />
                </View>
                <Text style={[styles.retTitle, { color: colors.text, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>
                  {isRTL ? 'سياسة الاحتفاظ بالبيانات (90 يوم)' : '90-Day Data Retention Policy'}
                </Text>
              </View>
              <Text style={[styles.retDesc, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL
                  ? 'يمكن الاستعلام عن الطلبات المكتملة أو الملغاة لمدة 90 يوماً. بعد ذلك، يتم وضع علامة "مؤرشف" عليها ولا تظهر في طرق العرض العادية، لكنها تبقى في قاعدة البيانات.'
                  : 'Delivered and cancelled orders remain queryable for 90 days. After that, they are marked as archived and excluded from normal views but retained in the database for compliance.'}
              </Text>
              <View style={[styles.retStats, { flexDirection: isRTL ? 'row-reverse' : 'row', borderTopColor: colors.border }]}>
                <View style={styles.retStat}>
                  <Text style={[styles.retStatValue, { color: Colors.warning }]}>90</Text>
                  <Text style={[styles.retStatLabel, { color: colors.textMuted }]}>{isRTL ? 'يوم استعلام' : 'days query'}</Text>
                </View>
                <View style={[styles.retDivider, { backgroundColor: colors.border }]} />
                <View style={styles.retStat}>
                  <Text style={[styles.retStatValue, { color: Colors.info }]}>∞</Text>
                  <Text style={[styles.retStatLabel, { color: colors.textMuted }]}>{isRTL ? 'احتفاظ أرشيف' : 'archive retain'}</Text>
                </View>
                <View style={[styles.retDivider, { backgroundColor: colors.border }]} />
                <Pressable style={[styles.runArchiveBtn, { backgroundColor: `${Colors.warning}20` }]} onPress={handleArchive} disabled={archiving}>
                  {archiving ? (
                    <ActivityIndicator size="small" color={Colors.warning} />
                  ) : (
                    <>
                      <MaterialIcons name="archive" size={14} color={Colors.warning} />
                      <Text style={[styles.runArchiveText, { color: Colors.warning }]}>
                        {isRTL ? 'تشغيل الآن' : 'Run Now'}
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

function PricingField({ label, value, onChange, colors, isRTL, accent, optional }: any) {
  return (
    <View style={pfStyles.wrap}>
      <Text style={[pfStyles.label, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
        {label}{optional ? (isRTL ? ' (اختياري)' : ' (opt.)') : ''}
      </Text>
      <View style={[pfStyles.inputRow, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <TextInput
          style={[pfStyles.input, { color: colors.text }]}
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          placeholder={optional ? '—' : '0.00'}
          placeholderTextColor={colors.textMuted}
          textAlign="center"
        />
      </View>
      <View style={[pfStyles.egpBadge, { backgroundColor: `${accent}18` }]}>
        <Text style={[pfStyles.egpText, { color: accent }]}>EGP</Text>
      </View>
    </View>
  );
}

const pfStyles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontSize: 10, textAlign: 'center', lineHeight: 13 },
  inputRow: { borderWidth: 1, borderRadius: Radius.sm, paddingVertical: 8, width: '100%' },
  input: { fontSize: FontSize.base, fontWeight: FontWeight.bold, textAlign: 'center' },
  egpBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  egpText: { fontSize: 10, fontWeight: FontWeight.bold },
});

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
  archiveBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.md, borderWidth: 1 },
  archiveBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  retentionBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'transparent' },
  retentionText: { flex: 1, fontSize: 11, lineHeight: 16 },
  scroll: { padding: Spacing.md, gap: Spacing.md },
  vehicleSection: { borderRadius: Radius.md, borderWidth: 1, overflow: 'hidden' },
  vehicleHeader: { alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderBottomWidth: 1 },
  vehicleIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  vehicleTitle: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.bold },
  vehicleCount: { fontSize: FontSize.xs },
  feeCard: { borderTopWidth: 1, padding: Spacing.md },
  feeTypeRow: { alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.md },
  feeTypeIconWrap: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  feeTypeTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  feeTypeDesc: { fontSize: FontSize.xs, lineHeight: 15, marginTop: 1 },
  activeToggleWrap: { alignItems: 'center', gap: 4 },
  activeLabel: { fontSize: 10, fontWeight: FontWeight.bold },
  dirtyDot: { width: 8, height: 8, borderRadius: 4, position: 'absolute', top: 0, right: 0 },
  fieldsGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  feeActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1 },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.sm, borderWidth: 1 },
  resetText: { fontSize: FontSize.xs },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.md },
  saveBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#000' },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: Spacing.sm, borderTopWidth: 1 },
  savedText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  retentionCard: { borderRadius: Radius.md, borderWidth: 1, overflow: 'hidden' },
  retentionHeader: { alignItems: 'center', gap: Spacing.sm, padding: Spacing.md },
  retIconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  retTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  retDesc: { fontSize: FontSize.xs, lineHeight: 17, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  retStats: { alignItems: 'center', padding: Spacing.md, borderTopWidth: 1, gap: Spacing.md },
  retStat: { flex: 1, alignItems: 'center', gap: 2 },
  retStatValue: { fontSize: FontSize.xxl || 24, fontWeight: FontWeight.bold },
  retStatLabel: { fontSize: 10, textAlign: 'center' },
  retDivider: { width: 1, height: 36 },
  runArchiveBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radius.md },
  runArchiveText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
});
