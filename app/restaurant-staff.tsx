import React, { useState, useCallback, useEffect } from 'react';
import {
  View, StyleSheet, Text, Pressable, TextInput, FlatList,
  Modal, ScrollView, ActivityIndicator, KeyboardAvoidingView,
  Platform, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import { useStaffManager } from '@/hooks/useStaffManager';
import { restaurantService } from '@/services/menuService';
import { RestaurantStaff, CreateStaffPayload } from '@/services/staffService';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';

const ROLES: { value: 'accountant' | 'call_center'; labelEn: string; labelAr: string; icon: string; color: string; descEn: string; descAr: string }[] = [
  {
    value: 'accountant',
    labelEn: 'Accountant',
    labelAr: 'محاسب',
    icon: 'account-balance',
    color: Colors.success,
    descEn: 'Analytics & revenue data only',
    descAr: 'التحليلات والإيرادات فقط',
  },
  {
    value: 'call_center',
    labelEn: 'Call Center',
    labelAr: 'خدمة العملاء',
    icon: 'headset-mic',
    color: Colors.info,
    descEn: 'Incoming orders, accept/reject & invoices only',
    descAr: 'الطلبات الواردة وقبول/رفض الفواتير فقط',
  },
];

function getRoleInfo(role: string) {
  return ROLES.find(r => r.value === role) || ROLES[0];
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function RestaurantStaffScreen() {
  const { restaurantId } = useLocalSearchParams<{ restaurantId?: string }>();
  const router = useRouter();
  const { colors, t, isRTL, theme } = useApp();
  const { showAlert } = useAlert();

  const { staff, loading, saving, loadStaff, createStaff, updateStaff, deleteStaff, toggleActive } = useStaffManager(restaurantId);

  const [restaurants, setRestaurants] = useState<{ id: string; name: string; name_ar: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editStaff, setEditStaff] = useState<RestaurantStaff | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState<{
    restaurant_id: string;
    name: string;
    name_ar: string;
    username: string;
    password: string;
    role: 'accountant' | 'call_center';
  }>({
    restaurant_id: restaurantId || '',
    name: '', name_ar: '', username: '', password: '',
    role: 'call_center',
  });

  useFocusEffect(useCallback(() => { loadStaff(); }, [loadStaff]));

  useEffect(() => {
    restaurantService.fetchAll().then(({ data }) => {
      if (data) setRestaurants(data.map(r => ({ id: r.id, name: r.name, name_ar: r.name_ar })));
    });
  }, []);

  const openAdd = () => {
    setEditStaff(null);
    setShowPassword(false);
    setForm({
      restaurant_id: restaurantId || (restaurants[0]?.id || ''),
      name: '', name_ar: '', username: '', password: '',
      role: 'call_center',
    });
    setShowModal(true);
  };

  const openEdit = (s: RestaurantStaff) => {
    setEditStaff(s);
    setShowPassword(false);
    setForm({
      restaurant_id: s.restaurant_id,
      name: s.name, name_ar: s.name_ar,
      username: s.username, password: '',
      role: s.role,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.username.trim()) {
      showAlert(t('error'), t('fillAllFields'));
      return;
    }
    if (!editStaff && !form.password.trim()) {
      showAlert(t('error'), isRTL ? 'كلمة المرور مطلوبة' : 'Password is required');
      return;
    }

    if (editStaff) {
      const updates: any = {
        name: form.name.trim(),
        name_ar: form.name_ar.trim() || form.name.trim(),
        username: form.username.trim(),
        role: form.role,
      };
      if (form.password.trim()) updates.password = form.password.trim();
      const { error } = await updateStaff(editStaff.id, updates);
      if (error) { showAlert(t('error'), error); return; }
    } else {
      const payload: CreateStaffPayload = {
        restaurant_id: form.restaurant_id,
        name: form.name.trim(),
        name_ar: form.name_ar.trim() || form.name.trim(),
        username: form.username.trim(),
        password: form.password.trim(),
        role: form.role,
      };
      const { error } = await createStaff(payload);
      if (error) { showAlert(t('error'), error); return; }
    }

    setShowModal(false);
    showAlert(t('success'), editStaff
      ? (isRTL ? 'تم تحديث بيانات الموظف' : 'Staff member updated')
      : (isRTL ? 'تم إضافة الموظف' : 'Staff member added'));
  };

  const handleDelete = (s: RestaurantStaff) => {
    showAlert(
      isRTL ? 'حذف الموظف' : 'Delete Staff',
      isRTL ? `حذف "${s.name}"؟` : `Delete "${s.name}"?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: isRTL ? 'حذف' : 'Delete', style: 'destructive',
          onPress: async () => {
            const { error } = await deleteStaff(s.id);
            if (error) showAlert(t('error'), error);
            else showAlert(t('success'), isRTL ? 'تم حذف الموظف' : 'Staff deleted');
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: RestaurantStaff }) => {
    const roleInfo = getRoleInfo(item.role);
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Header */}
        <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.avatar, { backgroundColor: `${roleInfo.color}25` }]}>
            <MaterialIcons name={roleInfo.icon as any} size={20} color={roleInfo.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.staffName, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? (item.name_ar || item.name) : item.name}
            </Text>
            <View style={[styles.metaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <MaterialIcons name="alternate-email" size={12} color={colors.icon} />
              <Text style={[styles.metaText, { color: colors.textMuted }]}>{item.username}</Text>
            </View>
            {item.restaurant_name ? (
              <View style={[styles.metaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <MaterialIcons name="storefront" size={12} color={colors.icon} />
                <Text style={[styles.metaText, { color: colors.textMuted }]}>
                  {isRTL ? (item.restaurant_name_ar || item.restaurant_name) : item.restaurant_name}
                </Text>
              </View>
            ) : null}
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <View style={[styles.roleBadge, { backgroundColor: `${roleInfo.color}18`, borderColor: `${roleInfo.color}40` }]}>
              <Text style={[styles.roleText, { color: roleInfo.color }]}>
                {isRTL ? roleInfo.labelAr : roleInfo.labelEn}
              </Text>
            </View>
            <View style={[styles.statusBadge, {
              backgroundColor: item.is_active ? `${Colors.success}18` : `${Colors.danger}15`,
              borderColor: item.is_active ? `${Colors.success}40` : `${Colors.danger}35`,
            }]}>
              <View style={[styles.statusDot, { backgroundColor: item.is_active ? Colors.success : Colors.danger }]} />
              <Text style={[styles.statusText, { color: item.is_active ? Colors.success : Colors.danger }]}>
                {item.is_active ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'معطل' : 'Inactive')}
              </Text>
            </View>
          </View>
        </View>

        {/* Permissions preview */}
        <View style={[styles.permissionsRow, { backgroundColor: `${roleInfo.color}10`, borderTopColor: `${roleInfo.color}20` }]}>
          <MaterialIcons name="security" size={12} color={roleInfo.color} />
          <Text style={[styles.permText, { color: roleInfo.color }]}>
            {isRTL ? roleInfo.descAr : roleInfo.descEn}
          </Text>
        </View>

        {/* Actions */}
        <View style={[styles.cardActions, { flexDirection: isRTL ? 'row-reverse' : 'row', borderTopColor: colors.border }]}>
          <View style={[styles.toggleWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Switch
              value={item.is_active}
              onValueChange={v => toggleActive(item.id, v)}
              trackColor={{ false: colors.border, true: `${Colors.success}88` }}
              thumbColor={item.is_active ? Colors.success : colors.textMuted}
            />
            <Text style={[styles.toggleLabel, { color: colors.textMuted }]}>
              {isRTL ? 'تفعيل' : 'Active'}
            </Text>
          </View>
          <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: Spacing.sm }]}>
            <Pressable
              style={[styles.iconBtn, { backgroundColor: `${Colors.brand}22` }]}
              onPress={() => openEdit(item)}
            >
              <MaterialIcons name="edit" size={15} color={Colors.brand} />
            </Pressable>
            <Pressable
              style={[styles.iconBtn, { backgroundColor: `${Colors.danger}22` }]}
              onPress={() => handleDelete(item)}
            >
              <MaterialIcons name="delete" size={15} color={Colors.danger} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

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
            {isRTL ? 'إدارة الموظفين' : 'Staff Management'}
          </Text>
          <Text style={[styles.headerSub, { color: Colors.brand, textAlign: isRTL ? 'right' : 'left' }]}>
            {staff.length} {isRTL ? 'موظف' : 'staff'} · {staff.filter(s => s.is_active).length} {isRTL ? 'نشط' : 'active'}
          </Text>
        </View>
        <Pressable style={[styles.addBtn, { backgroundColor: Colors.brand }]} onPress={openAdd}>
          <MaterialIcons name="person-add" size={16} color="#000" />
          <Text style={styles.addBtnText}>{isRTL ? 'إضافة' : 'Add'}</Text>
        </Pressable>
      </View>

      {/* Role Legend */}
      <View style={[styles.legendWrap, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {ROLES.map(role => (
          <View key={role.value} style={[styles.legendItem, { backgroundColor: `${role.color}12`, borderColor: `${role.color}30`, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <MaterialIcons name={role.icon as any} size={14} color={role.color} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.legendTitle, { color: role.color }]}>
                {isRTL ? role.labelAr : role.labelEn}
              </Text>
              <Text style={[styles.legendDesc, { color: colors.textMuted }]}>
                {isRTL ? role.descAr : role.descEn}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.brand} />
        </View>
      ) : (
        <FlatList
          data={staff}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={[styles.empty, { backgroundColor: colors.card }]}>
              <MaterialIcons name="people" size={44} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {isRTL ? 'لا يوجد موظفون بعد' : 'No staff members yet'}
              </Text>
              <Pressable style={[styles.addBtn, { backgroundColor: Colors.brand }]} onPress={openAdd}>
                <MaterialIcons name="person-add" size={16} color="#000" />
                <Text style={styles.addBtnText}>{isRTL ? 'إضافة موظف' : 'Add Staff'}</Text>
              </Pressable>
            </View>
          }
        />
      )}

      {/* MODAL */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
            <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
              <View style={[styles.sheetHeader, { flexDirection: isRTL ? 'row-reverse' : 'row', borderBottomColor: colors.border }]}>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>
                  {editStaff
                    ? (isRTL ? 'تعديل الموظف' : 'Edit Staff Member')
                    : (isRTL ? 'إضافة موظف جديد' : 'Add New Staff Member')}
                </Text>
                <Pressable onPress={() => setShowModal(false)} hitSlop={8}>
                  <MaterialIcons name="close" size={22} color={colors.icon} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheetBody}>

                {/* Restaurant selector */}
                {!restaurantId ? (
                  <View style={{ marginBottom: Spacing.md }}>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                      {isRTL ? 'المطعم' : 'Restaurant'}
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: 2 }}>
                        {restaurants.map(r => (
                          <Pressable
                            key={r.id}
                            style={[styles.optChip, {
                              backgroundColor: form.restaurant_id === r.id ? Colors.brand : colors.inputBg,
                              borderColor: form.restaurant_id === r.id ? Colors.brand : colors.border,
                            }]}
                            onPress={() => setForm(f => ({ ...f, restaurant_id: r.id }))}
                          >
                            <Text style={[styles.optChipText, { color: form.restaurant_id === r.id ? '#000' : colors.textSecondary }]}>
                              {isRTL ? (r.name_ar || r.name) : r.name}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                ) : null}

                {/* Role selection */}
                <Text style={[styles.fieldLabel, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left', marginBottom: Spacing.sm }]}>
                  {isRTL ? 'الدور الوظيفي' : 'Role'}
                </Text>
                <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: Spacing.sm, marginBottom: Spacing.lg }]}>
                  {ROLES.map(role => {
                    const selected = form.role === role.value;
                    return (
                      <Pressable
                        key={role.value}
                        style={[styles.roleCard, {
                          backgroundColor: selected ? `${role.color}18` : colors.inputBg,
                          borderColor: selected ? role.color : colors.border,
                          flex: 1,
                        }]}
                        onPress={() => setForm(f => ({ ...f, role: role.value }))}
                      >
                        <MaterialIcons name={role.icon as any} size={22} color={selected ? role.color : colors.textMuted} />
                        <Text style={[styles.roleCardTitle, { color: selected ? role.color : colors.text }]}>
                          {isRTL ? role.labelAr : role.labelEn}
                        </Text>
                        <Text style={[styles.roleCardDesc, { color: colors.textMuted }]}>
                          {isRTL ? role.descAr : role.descEn}
                        </Text>
                        {selected ? (
                          <View style={[styles.roleCheck, { backgroundColor: role.color }]}>
                            <MaterialIcons name="check" size={10} color="#fff" />
                          </View>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>

                <FieldInput label={isRTL ? 'الاسم (English)' : 'Full Name (English)'} value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} colors={colors} isRTL={isRTL} icon="person" placeholder="e.g. Sara Ahmed" />
                <FieldInput label={isRTL ? 'الاسم (عربي)' : 'Full Name (Arabic)'} value={form.name_ar} onChange={v => setForm(f => ({ ...f, name_ar: v }))} colors={colors} isRTL={isRTL} icon="person" placeholder="مثال: سارة أحمد" rtl />
                <FieldInput label={isRTL ? 'اسم المستخدم' : 'Username'} value={form.username} onChange={v => setForm(f => ({ ...f, username: v.toLowerCase().trim() }))} colors={colors} isRTL={isRTL} icon="alternate-email" placeholder="e.g. sara.accountant" keyboard="email-address" />

                {/* Password */}
                <View style={{ marginBottom: Spacing.md }}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                    {editStaff
                      ? (isRTL ? 'كلمة مرور جديدة (اتركها فارغة للإبقاء)' : 'New Password (leave blank to keep)')
                      : (isRTL ? 'كلمة المرور *' : 'Password *')}
                  </Text>
                  <View style={[styles.passRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={[styles.inputRow, { flex: 1, backgroundColor: colors.inputBg, borderColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <MaterialIcons name="lock" size={16} color={colors.icon} />
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder={isRTL ? 'كلمة المرور' : 'Password'}
                        placeholderTextColor={colors.textMuted}
                        value={form.password}
                        onChangeText={v => setForm(f => ({ ...f, password: v }))}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                      />
                      <Pressable onPress={() => setShowPassword(v => !v)} hitSlop={8}>
                        <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={16} color={colors.icon} />
                      </Pressable>
                    </View>
                    <Pressable
                      style={[styles.genBtn, { backgroundColor: Colors.brand }]}
                      onPress={() => setForm(f => ({ ...f, password: generatePassword() }))}
                    >
                      <MaterialIcons name="refresh" size={15} color="#000" />
                      <Text style={styles.genText}>{isRTL ? 'توليد' : 'Gen'}</Text>
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  style={[styles.saveBtn, { backgroundColor: Colors.brand, opacity: saving ? 0.7 : 1 }]}
                  onPress={handleSave}
                  disabled={!!saving}
                >
                  {saving ? <ActivityIndicator size="small" color="#000" /> : (
                    <>
                      <MaterialIcons name="check-circle" size={18} color="#000" />
                      <Text style={styles.saveBtnText}>
                        {editStaff ? (isRTL ? 'حفظ التغييرات' : 'Save Changes') : (isRTL ? 'إضافة الموظف' : 'Add Staff Member')}
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
    </SafeAreaView>
  );
}

function FieldInput({ label, value, onChange, colors, isRTL, icon, placeholder, keyboard, rtl }: any) {
  return (
    <View style={{ marginBottom: Spacing.md }}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
      <View style={[styles.inputRow, { backgroundColor: colors.inputBg, borderColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <MaterialIcons name={icon} size={16} color={colors.icon} />
        <TextInput
          style={[styles.input, { color: colors.text, textAlign: rtl ? 'right' : (isRTL ? 'right' : 'left') }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboard || 'default'}
          autoCapitalize="none"
        />
      </View>
    </View>
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
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radius.md },
  addBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#000' },
  legendWrap: { borderBottomWidth: 1, padding: Spacing.md, gap: Spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, padding: Spacing.sm, borderRadius: Radius.sm, borderWidth: 1 },
  legendTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  legendDesc: { fontSize: 10, lineHeight: 14, marginTop: 1 },
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: 40 },
  card: { borderRadius: Radius.md, borderWidth: 1, overflow: 'hidden' },
  cardHeader: { padding: Spacing.md, alignItems: 'center', gap: Spacing.sm },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  staffName: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  metaRow: { alignItems: 'center', gap: 4, marginTop: 2 },
  metaText: { fontSize: FontSize.xs },
  roleBadge: {
    paddingHorizontal: 9, paddingVertical: 3, borderRadius: Radius.full, borderWidth: 1,
  },
  roleText: { fontSize: 10, fontWeight: FontWeight.bold },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: Radius.full, borderWidth: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: FontWeight.bold },
  permissionsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: 8, borderTopWidth: 1 },
  permText: { fontSize: FontSize.xs, flex: 1 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.sm, borderTopWidth: 1 },
  toggleWrap: { alignItems: 'center', gap: 6 },
  toggleLabel: { fontSize: FontSize.xs },
  iconBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, borderRadius: Radius.md, gap: Spacing.sm, marginTop: Spacing.xl },
  emptyText: { fontSize: FontSize.base },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
  sheetHeader: { justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1 },
  sheetTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  sheetBody: { padding: Spacing.lg },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginBottom: Spacing.xs },
  optChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1 },
  optChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  roleCard: { padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1.5, alignItems: 'center', gap: 4, position: 'relative' },
  roleCardTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, textAlign: 'center' },
  roleCardDesc: { fontSize: 10, textAlign: 'center', lineHeight: 13 },
  roleCheck: { position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  inputRow: { alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.sm, paddingVertical: 12, borderRadius: Radius.md, borderWidth: 1 },
  input: { flex: 1, fontSize: FontSize.base },
  passRow: { gap: Spacing.sm, alignItems: 'center' },
  genBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 12, borderRadius: Radius.md },
  genText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#000' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: 14, borderRadius: Radius.md, marginTop: Spacing.sm },
  saveBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#000' },
});
