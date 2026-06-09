import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, Text, Pressable, TextInput, FlatList,
  Modal, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useApp } from '@/hooks/useApp';
import { useRidersManager } from '@/hooks/useRidersManager';
import { useAlert } from '@/template';
import { RiderProfile } from '@/services/riderService';
import { StatusBadge, TopBar } from '@/components';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';

type RiderStatusFilter = 'all' | 'online' | 'offline' | 'on_delivery';

const VEHICLES = ['Motorcycle', 'Bicycle', 'Car', 'Scooter'];
const AREAS = ['Maadi', 'Heliopolis', 'New Cairo', 'Zamalek', 'Downtown', 'Nasr City', 'Giza'];

const STATUS_COLORS: Record<string, string> = {
  online: Colors.success,
  offline: '#888',
  on_delivery: Colors.info,
};

function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function RidersScreen() {
  const { colors, t, isRTL, theme } = useApp();
  const { showAlert } = useAlert();
  const { riders, loading, error, loadRiders, createRider, updateRider, deleteRider } = useRidersManager();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RiderStatusFilter>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editRider, setEditRider] = useState<RiderProfile | null>(null);
  const [saving, setSaving] = useState(false);

  // Add form state
  const [form, setForm] = useState({
    name: '', name_ar: '', email: '', password: '',
    phone: '', area: AREAS[0], vehicle: VEHICLES[0],
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '', name_ar: '', phone: '', area: AREAS[0], vehicle: VEHICLES[0],
  });

  useFocusEffect(useCallback(() => { loadRiders(); }, []));

  const filtered = useMemo(() => {
    let r = riders;
    if (statusFilter !== 'all') r = r.filter(x => x.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(x =>
        x.name.toLowerCase().includes(q) ||
        (x.name_ar || '').includes(q) ||
        (x.area || '').toLowerCase().includes(q) ||
        (x.email || '').toLowerCase().includes(q)
      );
    }
    return r;
  }, [riders, search, statusFilter]);

  const statusLabel: Record<string, string> = {
    all: t('allStatuses'),
    online: t('online'),
    offline: t('offline'),
    on_delivery: t('onDelivery'),
  };

  const onlineCount = riders.filter(r => r.status === 'online').length;
  const onDeliveryCount = riders.filter(r => r.status === 'on_delivery').length;

  const handleAdd = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      showAlert(t('error'), t('fillAllFields'));
      return;
    }
    setSaving(true);
    const { error: err } = await createRider({
      email: form.email.trim().toLowerCase(),
      password: form.password,
      name: form.name.trim(),
      name_ar: form.name_ar.trim() || form.name.trim(),
      phone: form.phone.trim(),
      area: form.area,
      vehicle: form.vehicle,
    });
    setSaving(false);
    if (err) {
      showAlert(t('error'), err);
    } else {
      setShowAddModal(false);
      setForm({ name: '', name_ar: '', email: '', password: '', phone: '', area: AREAS[0], vehicle: VEHICLES[0] });
      showAlert(t('success'), isRTL ? 'تم إضافة المندوب بنجاح' : 'Rider added successfully');
    }
  };

  const handleEdit = async () => {
    if (!editRider || !editForm.name.trim()) {
      showAlert(t('error'), t('fillAllFields'));
      return;
    }
    setSaving(true);
    const { error: err } = await updateRider(editRider.id, {
      name: editForm.name.trim(),
      name_ar: editForm.name_ar.trim() || editForm.name.trim(),
      phone: editForm.phone.trim(),
      area: editForm.area,
      vehicle: editForm.vehicle,
    });
    setSaving(false);
    if (err) {
      showAlert(t('error'), err);
    } else {
      setEditRider(null);
      showAlert(t('success'), isRTL ? 'تم تحديث البيانات بنجاح' : 'Rider updated successfully');
    }
  };

  const handleDelete = (rider: RiderProfile) => {
    showAlert(
      isRTL ? 'حذف المندوب' : 'Delete Rider',
      isRTL ? `هل أنت متأكد من حذف ${rider.name}؟` : `Delete ${rider.name}? This cannot be undone.`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: isRTL ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error: err } = await deleteRider(rider.id);
            if (err) showAlert(t('error'), err);
            else showAlert(t('success'), isRTL ? 'تم حذف المندوب' : 'Rider deleted');
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: RiderProfile }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header */}
      <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.avatar, { backgroundColor: STATUS_COLORS[item.status] }]}>
          <Text style={styles.avatarText}>{item.name[0]?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? (item.name_ar || item.name) : item.name}
          </Text>
          <Text style={[styles.email, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
            {item.email || '—'}
          </Text>
          <View style={[styles.subRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <MaterialIcons name="location-on" size={12} color={colors.icon} />
            <Text style={[styles.meta, { color: colors.textMuted }]}>{item.area || '—'} · {item.vehicle || '—'}</Text>
          </View>
        </View>
        <StatusBadge status={item.status} label={statusLabel[item.status] || item.status} small />
      </View>

      {/* Stats */}
      <View style={[styles.statsRow, { flexDirection: isRTL ? 'row-reverse' : 'row', borderTopColor: colors.border }]}>
        <RiderStat icon="delivery-dining" value={item.today_deliveries?.toString() || '0'} label={t('todayDeliveries')} color={Colors.brand} colors={colors} />
        <RiderStat icon="history" value={item.total_deliveries?.toString() || '0'} label={t('totalDeliveries')} color={Colors.info} colors={colors} />
        <RiderStat icon="star" value={(item.rating || 5).toFixed(1)} label={t('rating')} color={Colors.warning} colors={colors} />
        <RiderStat icon="account-balance-wallet" value={`${item.earnings || 0}`} label={t('earnings')} color={Colors.success} colors={colors} />
      </View>

      {/* Actions */}
      <View style={[styles.cardActions, { flexDirection: isRTL ? 'row-reverse' : 'row', borderTopColor: colors.border }]}>
        <Pressable
          style={[styles.actionBtn, { backgroundColor: `${Colors.brand}22`, borderColor: `${Colors.brand}44` }]}
          onPress={() => {
            setEditRider(item);
            setEditForm({ name: item.name, name_ar: item.name_ar || '', phone: item.phone || '', area: item.area || AREAS[0], vehicle: item.vehicle || VEHICLES[0] });
          }}
        >
          <MaterialIcons name="edit" size={14} color={Colors.brand} />
          <Text style={[styles.actionText, { color: Colors.brand }]}>{isRTL ? 'تعديل' : 'Edit'}</Text>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, { backgroundColor: `${Colors.danger}22`, borderColor: `${Colors.danger}44` }]}
          onPress={() => handleDelete(item)}
        >
          <MaterialIcons name="delete" size={14} color={Colors.danger} />
          <Text style={[styles.actionText, { color: Colors.danger }]}>{isRTL ? 'حذف' : 'Delete'}</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <TopBar title={t('riders')} />

      {/* Live Summary */}
      <View style={[styles.summary, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <SummaryChip label={t('online')} value={onlineCount} color={Colors.success} colors={colors} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <SummaryChip label={t('onDelivery')} value={onDeliveryCount} color={Colors.info} colors={colors} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <SummaryChip label={t('offline')} value={riders.length - onlineCount - onDeliveryCount} color={colors.textMuted} colors={colors} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Pressable style={styles.addChip} onPress={() => setShowAddModal(true)}>
          <MaterialIcons name="add" size={18} color="#000" />
          <Text style={styles.addChipText}>{isRTL ? 'إضافة' : 'Add'}</Text>
        </Pressable>
      </View>

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

      {/* Filter */}
      <View style={[styles.filterWrap, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.filterScroll}>
          {(['all', 'online', 'on_delivery', 'offline'] as RiderStatusFilter[]).map(s => (
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
        </View>
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
              <MaterialIcons name="delivery-dining" size={40} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('noRiders')}</Text>
              <Pressable style={[styles.addEmptyBtn, { backgroundColor: Colors.brand }]} onPress={() => setShowAddModal(true)}>
                <MaterialIcons name="add" size={16} color="#000" />
                <Text style={styles.addEmptyText}>{isRTL ? 'إضافة مندوب' : 'Add Rider'}</Text>
              </Pressable>
            </View>
          }
        />
      )}

      {/* ── ADD MODAL ─────────────────────────────────────────────────────── */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
            <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
              <View style={[styles.sheetHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>
                  {isRTL ? 'إضافة مندوب جديد' : 'Add New Rider'}
                </Text>
                <Pressable onPress={() => setShowAddModal(false)}>
                  <MaterialIcons name="close" size={22} color={colors.icon} />
                </Pressable>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <FormField label={isRTL ? 'الاسم (English)' : 'Name (English)'} value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} colors={colors} isRTL={isRTL} icon="person" placeholder="Ahmed Hassan" />
                <FormField label={isRTL ? 'الاسم (عربي)' : 'Name (Arabic)'} value={form.name_ar} onChange={v => setForm(f => ({ ...f, name_ar: v }))} colors={colors} isRTL={isRTL} icon="person" placeholder="أحمد حسن" rtlInput />
                <FormField label={isRTL ? 'البريد الإلكتروني' : 'Email'} value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} colors={colors} isRTL={isRTL} icon="email" placeholder="rider@etlob.com" keyboard="email-address" />
                <View style={styles.passRow}>
                  <View style={{ flex: 1 }}>
                    <FormField label={isRTL ? 'كلمة المرور' : 'Password'} value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} colors={colors} isRTL={isRTL} icon="lock" placeholder="Min 6 chars" />
                  </View>
                  <Pressable style={[styles.genBtn, { backgroundColor: Colors.brand }]} onPress={() => setForm(f => ({ ...f, password: generatePassword() }))}>
                    <MaterialIcons name="refresh" size={16} color="#000" />
                    <Text style={styles.genText}>{isRTL ? 'توليد' : 'Gen'}</Text>
                  </Pressable>
                </View>
                <FormField label={isRTL ? 'رقم الهاتف' : 'Phone'} value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} colors={colors} isRTL={isRTL} icon="phone" placeholder="+20 1XX XXX XXXX" keyboard="phone-pad" />

                {/* Area picker */}
                <Text style={[styles.fieldLabel, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t('area')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
                  <View style={{ flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: 2 }}>
                    {AREAS.map(a => (
                      <Pressable key={a} style={[styles.optionChip, { backgroundColor: form.area === a ? Colors.brand : colors.inputBg, borderColor: form.area === a ? Colors.brand : colors.border }]} onPress={() => setForm(f => ({ ...f, area: a }))}>
                        <Text style={[styles.optionText, { color: form.area === a ? '#000' : colors.textSecondary }]}>{a}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>

                {/* Vehicle picker */}
                <Text style={[styles.fieldLabel, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'المركبة' : 'Vehicle'}</Text>
                <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
                  {VEHICLES.map(v => (
                    <Pressable key={v} style={[styles.optionChip, { backgroundColor: form.vehicle === v ? Colors.brand : colors.inputBg, borderColor: form.vehicle === v ? Colors.brand : colors.border }]} onPress={() => setForm(f => ({ ...f, vehicle: v }))}>
                      <Text style={[styles.optionText, { color: form.vehicle === v ? '#000' : colors.textSecondary }]}>{v}</Text>
                    </Pressable>
                  ))}
                </View>

                <Pressable style={[styles.saveBtn, { backgroundColor: Colors.brand, opacity: saving ? 0.7 : 1 }]} onPress={handleAdd} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color="#000" /> : (
                    <>
                      <MaterialIcons name="check" size={18} color="#000" />
                      <Text style={styles.saveBtnText}>{isRTL ? 'إضافة المندوب' : 'Add Rider'}</Text>
                    </>
                  )}
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── EDIT MODAL ────────────────────────────────────────────────────── */}
      <Modal visible={!!editRider} transparent animationType="slide" onRequestClose={() => setEditRider(null)}>
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
            <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
              <View style={[styles.sheetHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>
                  {isRTL ? 'تعديل بيانات المندوب' : 'Edit Rider'}
                </Text>
                <Pressable onPress={() => setEditRider(null)}>
                  <MaterialIcons name="close" size={22} color={colors.icon} />
                </Pressable>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <FormField label={isRTL ? 'الاسم (English)' : 'Name (English)'} value={editForm.name} onChange={v => setEditForm(f => ({ ...f, name: v }))} colors={colors} isRTL={isRTL} icon="person" placeholder="Ahmed Hassan" />
                <FormField label={isRTL ? 'الاسم (عربي)' : 'Name (Arabic)'} value={editForm.name_ar} onChange={v => setEditForm(f => ({ ...f, name_ar: v }))} colors={colors} isRTL={isRTL} icon="person" placeholder="أحمد حسن" rtlInput />
                <FormField label={isRTL ? 'رقم الهاتف' : 'Phone'} value={editForm.phone} onChange={v => setEditForm(f => ({ ...f, phone: v }))} colors={colors} isRTL={isRTL} icon="phone" placeholder="+20 1XX XXX XXXX" keyboard="phone-pad" />

                <Text style={[styles.fieldLabel, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t('area')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
                  <View style={{ flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: 2 }}>
                    {AREAS.map(a => (
                      <Pressable key={a} style={[styles.optionChip, { backgroundColor: editForm.area === a ? Colors.brand : colors.inputBg, borderColor: editForm.area === a ? Colors.brand : colors.border }]} onPress={() => setEditForm(f => ({ ...f, area: a }))}>
                        <Text style={[styles.optionText, { color: editForm.area === a ? '#000' : colors.textSecondary }]}>{a}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>

                <Text style={[styles.fieldLabel, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'المركبة' : 'Vehicle'}</Text>
                <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
                  {VEHICLES.map(v => (
                    <Pressable key={v} style={[styles.optionChip, { backgroundColor: editForm.vehicle === v ? Colors.brand : colors.inputBg, borderColor: editForm.vehicle === v ? Colors.brand : colors.border }]} onPress={() => setEditForm(f => ({ ...f, vehicle: v }))}>
                      <Text style={[styles.optionText, { color: editForm.vehicle === v ? '#000' : colors.textSecondary }]}>{v}</Text>
                    </Pressable>
                  ))}
                </View>

                <Pressable style={[styles.saveBtn, { backgroundColor: Colors.brand, opacity: saving ? 0.7 : 1 }]} onPress={handleEdit} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color="#000" /> : (
                    <>
                      <MaterialIcons name="save" size={18} color="#000" />
                      <Text style={styles.saveBtnText}>{isRTL ? 'حفظ التغييرات' : 'Save Changes'}</Text>
                    </>
                  )}
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function FormField({ label, value, onChange, colors, isRTL, icon, placeholder, keyboard, rtlInput }: any) {
  return (
    <View style={{ marginBottom: Spacing.md }}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
      <View style={[styles.inputRow, { backgroundColor: colors.inputBg, borderColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <MaterialIcons name={icon} size={16} color={colors.icon} />
        <TextInput
          style={[styles.input, { color: colors.text, textAlign: rtlInput ? 'right' : (isRTL ? 'right' : 'left') }]}
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

function RiderStat({ icon, value, label, color, colors }: any) {
  return (
    <View style={riderStatStyles.wrap}>
      <MaterialIcons name={icon} size={14} color={color} />
      <Text style={[riderStatStyles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[riderStatStyles.label, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function SummaryChip({ label, value, color, colors }: any) {
  return (
    <View style={summaryStyles.chip}>
      <Text style={[summaryStyles.value, { color }]}>{value}</Text>
      <Text style={[summaryStyles.label, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const riderStatStyles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', gap: 2 },
  value: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  label: { fontSize: 9, textAlign: 'center' },
});

const summaryStyles = StyleSheet.create({
  chip: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm },
  value: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  label: { fontSize: FontSize.xs, marginTop: 2 },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  summary: { flexDirection: 'row', borderBottomWidth: 1, alignItems: 'center' },
  divider: { width: 1, marginVertical: 8 },
  addChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: Spacing.sm, backgroundColor: Colors.brand, borderRadius: 0 },
  addChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#000' },
  searchWrap: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1 },
  searchBar: { alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.sm, paddingVertical: 10, borderRadius: Radius.md },
  searchInput: { flex: 1, fontSize: FontSize.base },
  filterWrap: { borderBottomWidth: 1, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  filterScroll: { flexDirection: 'row', gap: Spacing.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1 },
  chipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: 40 },
  card: { borderRadius: Radius.md, borderWidth: 1, overflow: 'hidden' },
  cardHeader: { padding: Spacing.md, alignItems: 'center', gap: Spacing.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  name: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  email: { fontSize: 10, marginTop: 1 },
  subRow: { alignItems: 'center', gap: 3, marginTop: 2 },
  meta: { fontSize: FontSize.xs },
  statsRow: { flexDirection: 'row', borderTopWidth: 1, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  cardActions: { flexDirection: 'row', borderTopWidth: 1, gap: Spacing.sm, padding: Spacing.sm },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: Radius.sm, borderWidth: 1 },
  actionText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  empty: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, borderRadius: Radius.md, gap: Spacing.sm, marginTop: Spacing.xl },
  emptyText: { fontSize: FontSize.base },
  addEmptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full, marginTop: Spacing.sm },
  addEmptyText: { color: '#000', fontWeight: FontWeight.bold },
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: { width: '100%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, maxHeight: '85%' },
  sheetHeader: { justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  sheetTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginBottom: Spacing.xs },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.sm, paddingVertical: 12, borderRadius: Radius.md, borderWidth: 1 },
  input: { flex: 1, fontSize: FontSize.base },
  passRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  genBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 12, borderRadius: Radius.md, marginBottom: Spacing.md },
  genText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#000' },
  optionChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1 },
  optionText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: 14, borderRadius: Radius.md },
  saveBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#000' },
});
