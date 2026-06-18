import React, { useState, useCallback, useEffect } from 'react';
import {
  View, StyleSheet, Text, Pressable, TextInput, FlatList,
  Modal, ScrollView, ActivityIndicator, KeyboardAvoidingView,
  Platform, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import { offerService, restaurantService, Offer, CreateOfferPayload, Restaurant } from '@/services/menuService';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';

export default function OffersScreen() {
  const { restaurantId } = useLocalSearchParams<{ restaurantId?: string }>();
  const router = useRouter();
  const { colors, t, isRTL, theme } = useApp();
  const { showAlert } = useAlert();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editOffer, setEditOffer] = useState<Offer | null>(null);
  const [form, setForm] = useState<{
    restaurant_id: string;
    title: string;
    title_ar: string;
    description: string;
    description_ar: string;
    image_url: string | null;
    discount_percent: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
  }>({
    restaurant_id: restaurantId || '',
    title: '', title_ar: '',
    description: '', description_ar: '',
    image_url: null,
    discount_percent: '',
    start_date: '', end_date: '',
    is_active: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [offersRes, restsRes] = await Promise.all([
      offerService.fetchAll(restaurantId),
      restaurantService.fetchAll(),
    ]);
    if (offersRes.data) setOffers(offersRes.data);
    if (restsRes.data) setRestaurants(restsRes.data);
    setLoading(false);
  }, [restaurantId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const getRestaurantName = (id: string) => {
    const r = restaurants.find(x => x.id === id);
    if (!r) return '—';
    return isRTL ? (r.name_ar || r.name) : r.name;
  };

  const openAdd = () => {
    setEditOffer(null);
    setForm({
      restaurant_id: restaurantId || (restaurants[0]?.id || ''),
      title: '', title_ar: '', description: '', description_ar: '',
      image_url: null, discount_percent: '', start_date: '', end_date: '', is_active: true,
    });
    setShowModal(true);
  };

  const openEdit = (offer: Offer) => {
    setEditOffer(offer);
    setForm({
      restaurant_id: offer.restaurant_id,
      title: offer.title, title_ar: offer.title_ar,
      description: offer.description, description_ar: offer.description_ar,
      image_url: offer.image_url || null,
      discount_percent: offer.discount_percent?.toString() || '',
      start_date: offer.start_date ? offer.start_date.slice(0, 10) : '',
      end_date: offer.end_date ? offer.end_date.slice(0, 10) : '',
      is_active: offer.is_active,
    });
    setShowModal(true);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert(t('error'), isRTL ? 'يجب السماح بالوصول إلى الصور' : 'Photo library permission required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const fileName = asset.uri.split('/').pop() || 'offer.jpg';
    setUploadingImg(true);
    const { url, error } = await offerService.uploadImage('offer', asset.uri, fileName);
    setUploadingImg(false);
    if (error) { showAlert(t('error'), error); return; }
    if (url) setForm(f => ({ ...f, image_url: url }));
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.restaurant_id) {
      showAlert(t('error'), t('fillAllFields'));
      return;
    }
    setSaving(true);
    const payload: CreateOfferPayload = {
      restaurant_id: form.restaurant_id,
      title: form.title.trim(),
      title_ar: form.title_ar.trim() || form.title.trim(),
      description: form.description.trim(),
      description_ar: form.description_ar.trim(),
      image_url: form.image_url,
      discount_percent: form.discount_percent ? parseFloat(form.discount_percent) : null,
      start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
      is_active: form.is_active,
    };
    let error: string | null = null;
    if (editOffer) {
      ({ error } = await offerService.update(editOffer.id, payload));
      if (!error) setOffers(prev => prev.map(o => o.id === editOffer.id ? { ...o, ...payload } : o));
    } else {
      const { data, error: err } = await offerService.create(payload);
      error = err;
      if (!error && data) setOffers(prev => [data, ...prev]);
    }
    setSaving(false);
    if (error) {
      showAlert(t('error'), error);
    } else {
      setShowModal(false);
      showAlert(t('success'), editOffer
        ? (isRTL ? 'تم تحديث العرض' : 'Offer updated')
        : (isRTL ? 'تم إضافة العرض' : 'Offer created'));
    }
  };

  const handleDelete = (offer: Offer) => {
    showAlert(
      isRTL ? 'حذف العرض' : 'Delete Offer',
      isRTL ? `حذف "${offer.title}"؟` : `Delete "${offer.title}"?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: isRTL ? 'حذف' : 'Delete', style: 'destructive',
          onPress: async () => {
            const { error } = await offerService.delete(offer.id);
            if (error) showAlert(t('error'), error);
            else setOffers(prev => prev.filter(o => o.id !== offer.id));
          },
        },
      ]
    );
  };

  const handleToggleActive = async (offer: Offer) => {
    const { error } = await offerService.update(offer.id, { is_active: !offer.is_active });
    if (!error) setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, is_active: !o.is_active } : o));
  };

  const isExpired = (offer: Offer) => {
    if (!offer.end_date) return false;
    return new Date(offer.end_date) < new Date();
  };

  const renderItem = ({ item }: { item: Offer }) => {
    const expired = isExpired(item);
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.offerBanner} contentFit="cover" transition={200} />
        ) : (
          <View style={[styles.offerBannerPlaceholder, { backgroundColor: `${Colors.brand}18` }]}>
            <MaterialIcons name="local-offer" size={28} color={Colors.brand} />
          </View>
        )}
        <View style={styles.cardBody}>
          {/* Title row */}
          <View style={[styles.titleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.offerTitle, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? (item.title_ar || item.title) : item.title}
              </Text>
              <Text style={[styles.restName, { color: Colors.brand, textAlign: isRTL ? 'right' : 'left' }]}>
                {getRestaurantName(item.restaurant_id)}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              {item.discount_percent ? (
                <View style={[styles.discountBadge, { backgroundColor: Colors.brand }]}>
                  <Text style={styles.discountText}>{item.discount_percent}% OFF</Text>
                </View>
              ) : null}
              <View style={[
                styles.statusBadge,
                { backgroundColor: item.is_active && !expired ? `${Colors.success}20` : `${Colors.danger}15`,
                  borderColor: item.is_active && !expired ? `${Colors.success}50` : `${Colors.danger}40` }
              ]}>
                <View style={[styles.dot, { backgroundColor: item.is_active && !expired ? Colors.success : Colors.danger }]} />
                <Text style={[styles.statusText, { color: item.is_active && !expired ? Colors.success : Colors.danger }]}>
                  {expired ? (isRTL ? 'منتهي' : 'Expired') : item.is_active ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'معطل' : 'Inactive')}
                </Text>
              </View>
            </View>
          </View>

          {/* Description */}
          {(isRTL ? item.description_ar : item.description) ? (
            <Text style={[styles.offerDesc, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
              {isRTL ? item.description_ar : item.description}
            </Text>
          ) : null}

          {/* Dates */}
          {(item.start_date || item.end_date) ? (
            <View style={[styles.datesRow, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: colors.inputBg }]}>
              <MaterialIcons name="date-range" size={13} color={colors.icon} />
              <Text style={[styles.datesText, { color: colors.textMuted }]}>
                {item.start_date ? new Date(item.start_date).toLocaleDateString() : '—'}
                {' → '}
                {item.end_date ? new Date(item.end_date).toLocaleDateString() : '—'}
              </Text>
            </View>
          ) : null}

          {/* Actions */}
          <View style={[styles.actions, { flexDirection: isRTL ? 'row-reverse' : 'row', borderTopColor: colors.border }]}>
            <View style={[styles.toggleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Switch
                value={item.is_active}
                onValueChange={() => handleToggleActive(item)}
                trackColor={{ false: colors.border, true: `${Colors.success}88` }}
                thumbColor={item.is_active ? Colors.success : colors.textMuted}
              />
              <Text style={[styles.toggleLabel, { color: item.is_active ? Colors.success : colors.textMuted }]}>
                {item.is_active ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'معطل' : 'Off')}
              </Text>
            </View>
            <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: Spacing.sm }]}>
              <Pressable style={[styles.iconBtn, { backgroundColor: `${Colors.brand}22` }]} onPress={() => openEdit(item)}>
                <MaterialIcons name="edit" size={15} color={Colors.brand} />
              </Pressable>
              <Pressable style={[styles.iconBtn, { backgroundColor: `${Colors.danger}22` }]} onPress={() => handleDelete(item)}>
                <MaterialIcons name="delete" size={15} color={Colors.danger} />
              </Pressable>
            </View>
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
            {isRTL ? 'إدارة العروض' : 'Offers Management'}
          </Text>
          <Text style={[styles.headerSub, { color: Colors.brand, textAlign: isRTL ? 'right' : 'left' }]}>
            {offers.length} {isRTL ? 'عرض' : 'offers'} · {offers.filter(o => o.is_active).length} {isRTL ? 'نشط' : 'active'}
          </Text>
        </View>
        <Pressable style={[styles.addBtn, { backgroundColor: Colors.brand }]} onPress={openAdd}>
          <MaterialIcons name="add" size={18} color="#000" />
          <Text style={styles.addBtnText}>{isRTL ? 'إضافة' : 'Add'}</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.brand} />
        </View>
      ) : (
        <FlatList
          data={offers}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={[styles.empty, { backgroundColor: colors.card }]}>
              <MaterialIcons name="local-offer" size={44} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {isRTL ? 'لا توجد عروض بعد' : 'No offers yet'}
              </Text>
              <Pressable style={[styles.addBtn, { backgroundColor: Colors.brand }]} onPress={openAdd}>
                <MaterialIcons name="add" size={16} color="#000" />
                <Text style={styles.addBtnText}>{isRTL ? 'إضافة عرض' : 'Add Offer'}</Text>
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
                  {editOffer ? (isRTL ? 'تعديل العرض' : 'Edit Offer') : (isRTL ? 'إضافة عرض جديد' : 'New Offer')}
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
                            style={[styles.optChip, { backgroundColor: form.restaurant_id === r.id ? Colors.brand : colors.inputBg, borderColor: form.restaurant_id === r.id ? Colors.brand : colors.border }]}
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

                <FieldInput label={isRTL ? 'عنوان العرض (English)' : 'Offer Title (English)'} value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} colors={colors} isRTL={isRTL} placeholder="e.g. Summer Special 20% Off" />
                <FieldInput label={isRTL ? 'عنوان العرض (عربي)' : 'Offer Title (Arabic)'} value={form.title_ar} onChange={v => setForm(f => ({ ...f, title_ar: v }))} colors={colors} isRTL={isRTL} placeholder="مثال: عرض الصيف خصم 20%" rtl />
                <FieldInput label={isRTL ? 'الوصف (English)' : 'Description (English)'} value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} colors={colors} isRTL={isRTL} placeholder="Offer details..." multiline />
                <FieldInput label={isRTL ? 'الوصف (عربي)' : 'Description (Arabic)'} value={form.description_ar} onChange={v => setForm(f => ({ ...f, description_ar: v }))} colors={colors} isRTL={isRTL} placeholder="تفاصيل العرض..." multiline rtl />
                <FieldInput label={isRTL ? 'نسبة الخصم (%)' : 'Discount (%)'} value={form.discount_percent} onChange={v => setForm(f => ({ ...f, discount_percent: v }))} colors={colors} isRTL={isRTL} placeholder="e.g. 20" keyboard="decimal-pad" />

                {/* Dates */}
                <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: Spacing.sm }]}>
                  <View style={{ flex: 1 }}>
                    <FieldInput label={isRTL ? 'تاريخ البدء' : 'Start Date'} value={form.start_date} onChange={v => setForm(f => ({ ...f, start_date: v }))} colors={colors} isRTL={isRTL} placeholder="YYYY-MM-DD" keyboard="numbers-and-punctuation" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <FieldInput label={isRTL ? 'تاريخ الانتهاء' : 'End Date'} value={form.end_date} onChange={v => setForm(f => ({ ...f, end_date: v }))} colors={colors} isRTL={isRTL} placeholder="YYYY-MM-DD" keyboard="numbers-and-punctuation" />
                  </View>
                </View>

                {/* Image */}
                <Text style={[styles.fieldLabel, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left', marginBottom: Spacing.xs }]}>
                  {isRTL ? 'صورة العرض (16:9)' : 'Offer Image (16:9)'}
                </Text>
                {form.image_url ? (
                  <View style={{ marginBottom: Spacing.md }}>
                    <Image source={{ uri: form.image_url }} style={styles.previewBanner} contentFit="cover" transition={200} />
                    <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: Spacing.sm, marginTop: Spacing.sm }]}>
                      <Pressable style={[styles.imgActionBtn, { backgroundColor: `${Colors.brand}22`, borderColor: `${Colors.brand}55` }]} onPress={pickImage}>
                        <MaterialIcons name="swap-horiz" size={14} color={Colors.brand} />
                        <Text style={[styles.imgActionText, { color: Colors.brand }]}>{isRTL ? 'تغيير' : 'Change'}</Text>
                      </Pressable>
                      <Pressable style={[styles.imgActionBtn, { backgroundColor: `${Colors.danger}18`, borderColor: `${Colors.danger}40` }]} onPress={() => setForm(f => ({ ...f, image_url: null }))}>
                        <MaterialIcons name="delete-outline" size={14} color={Colors.danger} />
                        <Text style={[styles.imgActionText, { color: Colors.danger }]}>{isRTL ? 'حذف' : 'Remove'}</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    style={[styles.imgUploadArea, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                    onPress={pickImage}
                    disabled={uploadingImg}
                  >
                    {uploadingImg ? (
                      <ActivityIndicator size="small" color={Colors.brand} />
                    ) : (
                      <>
                        <MaterialIcons name="add-photo-alternate" size={28} color={Colors.brand} />
                        <Text style={[styles.imgUploadText, { color: Colors.brand }]}>
                          {isRTL ? 'رفع صورة العرض' : 'Upload Offer Image'}
                        </Text>
                      </>
                    )}
                  </Pressable>
                )}

                {/* Active toggle */}
                <View style={[styles.activeRow, { backgroundColor: colors.inputBg, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text style={[styles.activeLabel, { color: colors.text, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'تفعيل العرض' : 'Active Offer'}
                  </Text>
                  <Switch
                    value={form.is_active}
                    onValueChange={v => setForm(f => ({ ...f, is_active: v }))}
                    trackColor={{ false: colors.border, true: `${Colors.success}88` }}
                    thumbColor={form.is_active ? Colors.success : colors.textMuted}
                  />
                </View>

                <Pressable
                  style={[styles.saveBtn, { backgroundColor: Colors.brand, opacity: saving ? 0.7 : 1 }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? <ActivityIndicator size="small" color="#000" /> : (
                    <>
                      <MaterialIcons name="check-circle" size={18} color="#000" />
                      <Text style={styles.saveBtnText}>
                        {editOffer ? (isRTL ? 'حفظ التغييرات' : 'Save Changes') : (isRTL ? 'إضافة العرض' : 'Add Offer')}
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

function FieldInput({ label, value, onChange, colors, isRTL, placeholder, keyboard, multiline, rtl }: any) {
  return (
    <View style={{ marginBottom: Spacing.md }}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
      <TextInput
        style={[styles.input, {
          backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border,
          textAlign: rtl ? 'right' : (isRTL ? 'right' : 'left'),
          minHeight: multiline ? 72 : undefined,
          textAlignVertical: multiline ? 'top' : undefined,
        }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard || 'default'}
        autoCapitalize="none"
        multiline={multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: Spacing.md, paddingVertical: 10, alignItems: 'center', gap: Spacing.sm, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  headerSub: { fontSize: FontSize.xs, marginTop: 1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radius.md },
  addBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#000' },
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: 40 },
  card: { borderRadius: Radius.md, borderWidth: 1, overflow: 'hidden' },
  offerBanner: { width: '100%', height: 130 },
  offerBannerPlaceholder: { width: '100%', height: 80, alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: Spacing.md },
  titleRow: { alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.sm, marginBottom: Spacing.xs },
  offerTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  restName: { fontSize: FontSize.xs, marginTop: 2 },
  discountBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  discountText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#000' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: Radius.full, borderWidth: 1 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: FontWeight.bold },
  offerDesc: { fontSize: FontSize.xs, lineHeight: 17, marginBottom: Spacing.sm },
  datesRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, padding: 6, borderRadius: Radius.sm, marginBottom: Spacing.sm },
  datesText: { fontSize: 10 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.sm, borderTopWidth: 1 },
  toggleRow: { alignItems: 'center', gap: 6 },
  toggleLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  iconBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', padding: Spacing.xxl, borderRadius: Radius.md, gap: Spacing.sm, marginTop: Spacing.xl },
  emptyText: { fontSize: FontSize.base },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
  sheetHeader: { justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1 },
  sheetTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  sheetBody: { padding: Spacing.lg },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginBottom: Spacing.xs },
  input: { borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.sm, paddingVertical: 11, fontSize: FontSize.base },
  optChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1 },
  optChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  previewBanner: { width: '100%', height: 120, borderRadius: Radius.md },
  imgActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.sm, borderWidth: 1 },
  imgActionText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  imgUploadArea: { height: 100, borderRadius: Radius.md, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: Spacing.md },
  imgUploadText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  activeRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.md },
  activeLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: 14, borderRadius: Radius.md, marginTop: Spacing.xs },
  saveBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#000' },
});
