import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, Text, Pressable, TextInput, FlatList,
  Modal, ScrollView, ActivityIndicator, KeyboardAvoidingView,
  Platform, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useApp } from '@/hooks/useApp';
import { useMenuManager } from '@/hooks/useMenuManager';
import { useAlert } from '@/template';
import { menuService, MenuCategory, MenuItem } from '@/services/menuService';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';

const PRESET_CATEGORIES = [
  { en: 'Appetizers', ar: 'المقبلات' },
  { en: 'Main Courses', ar: 'الأطباق الرئيسية' },
  { en: 'Desserts', ar: 'الحلويات' },
  { en: 'Drinks', ar: 'المشروبات' },
  { en: 'Sides', ar: 'الإضافات' },
  { en: 'Specials', ar: 'العروض' },
];

type ActiveTab = 'items' | 'categories';

export default function MenuManagementScreen() {
  const { restaurantId, restaurantName, restaurantNameAr } = useLocalSearchParams<{
    restaurantId: string;
    restaurantName: string;
    restaurantNameAr: string;
  }>();
  const router = useRouter();
  const { colors, t, isRTL, theme } = useApp();
  const { showAlert } = useAlert();

  const {
    categories, items, loading, saving,
    load, createCategory, updateCategory, deleteCategory,
    createItem, updateItem, deleteItem, toggleAvailability,
  } = useMenuManager(restaurantId || '');

  const [activeTab, setActiveTab] = useState<ActiveTab>('items');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [search, setSearch] = useState('');

  // Item modal state
  const [showItemModal, setShowItemModal] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [itemForm, setItemForm] = useState({
    name: '', name_ar: '', description: '', description_ar: '',
    price: '', category_id: null as string | null, images: [] as string[],
    is_available: true,
  });
  const [uploadingImages, setUploadingImages] = useState(false);

  // Category modal state
  const [showCatModal, setShowCatModal] = useState(false);
  const [editCat, setEditCat] = useState<MenuCategory | null>(null);
  const [catForm, setCatForm] = useState({ name: '', name_ar: '' });
  const [savingCat, setSavingCat] = useState(false);

  useFocusEffect(useCallback(() => { load(); }, []));

  const filteredItems = useMemo(() => {
    let list = items;
    if (selectedCategory !== 'all') {
      list = list.filter(i => i.category_id === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.name_ar.includes(q) ||
        i.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, selectedCategory, search]);

  const displayName = isRTL ? (restaurantNameAr || restaurantName) : restaurantName;

  // ── Image picker ─────────────────────────────────────────────────────────
  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert(t('error'), isRTL ? 'يجب السماح بالوصول إلى الصور' : 'Photo library permission required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });
    if (result.canceled) return;

    setUploadingImages(true);
    const uploadedUrls: string[] = [];
    for (const asset of result.assets) {
      const fileName = asset.uri.split('/').pop() || 'image.jpg';
      const { url, error } = await menuService.uploadImage(restaurantId || '', asset.uri, fileName);
      if (error) {
        showAlert(t('error'), error);
        break;
      }
      if (url) uploadedUrls.push(url);
    }
    setUploadingImages(false);
    if (uploadedUrls.length > 0) {
      setItemForm(f => ({ ...f, images: [...f.images, ...uploadedUrls].slice(0, 5) }));
    }
  };

  const removeImage = (index: number) => {
    setItemForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  };

  // ── Item CRUD ─────────────────────────────────────────────────────────────
  const openAddItem = () => {
    setEditItem(null);
    setItemForm({ name: '', name_ar: '', description: '', description_ar: '', price: '', category_id: null, images: [], is_available: true });
    setShowItemModal(true);
  };

  const openEditItem = (item: MenuItem) => {
    setEditItem(item);
    setItemForm({
      name: item.name, name_ar: item.name_ar,
      description: item.description, description_ar: item.description_ar,
      price: item.price.toString(), category_id: item.category_id,
      images: item.images || [], is_available: item.is_available,
    });
    setShowItemModal(true);
  };

  const handleSaveItem = async () => {
    if (!itemForm.name.trim() || !itemForm.price.trim()) {
      showAlert(t('error'), t('fillAllFields'));
      return;
    }
    const price = parseFloat(itemForm.price);
    if (isNaN(price) || price < 0) {
      showAlert(t('error'), isRTL ? 'السعر غير صحيح' : 'Invalid price');
      return;
    }

    const payload = {
      restaurant_id: restaurantId || '',
      category_id: itemForm.category_id,
      name: itemForm.name.trim(),
      name_ar: itemForm.name_ar.trim() || itemForm.name.trim(),
      description: itemForm.description.trim(),
      description_ar: itemForm.description_ar.trim(),
      price,
      images: itemForm.images,
      is_available: itemForm.is_available,
    };

    let error: string | null = null;
    if (editItem) {
      ({ error } = await updateItem(editItem.id, payload));
    } else {
      ({ error } = await createItem(payload));
    }

    if (error) {
      showAlert(t('error'), error);
    } else {
      setShowItemModal(false);
      showAlert(t('success'), editItem
        ? (isRTL ? 'تم تحديث الصنف' : 'Item updated')
        : (isRTL ? 'تم إضافة الصنف' : 'Item added'));
    }
  };

  const handleDeleteItem = (item: MenuItem) => {
    showAlert(
      isRTL ? 'حذف الصنف' : 'Delete Item',
      isRTL ? `حذف "${item.name}"؟` : `Delete "${item.name}"?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: isRTL ? 'حذف' : 'Delete', style: 'destructive',
          onPress: async () => {
            const { error } = await deleteItem(item.id);
            if (error) showAlert(t('error'), error);
          },
        },
      ]
    );
  };

  // ── Category CRUD ─────────────────────────────────────────────────────────
  const openAddCat = () => {
    setEditCat(null);
    setCatForm({ name: '', name_ar: '' });
    setShowCatModal(true);
  };

  const openEditCat = (cat: MenuCategory) => {
    setEditCat(cat);
    setCatForm({ name: cat.name, name_ar: cat.name_ar });
    setShowCatModal(true);
  };

  const handleSaveCat = async () => {
    if (!catForm.name.trim()) {
      showAlert(t('error'), t('fillAllFields'));
      return;
    }
    setSavingCat(true);
    let error: string | null = null;
    if (editCat) {
      ({ error } = await updateCategory(editCat.id, { name: catForm.name.trim(), name_ar: catForm.name_ar.trim() || catForm.name.trim() }));
    } else {
      ({ error } = await createCategory({ restaurant_id: restaurantId || '', name: catForm.name.trim(), name_ar: catForm.name_ar.trim() || catForm.name.trim() }));
    }
    setSavingCat(false);
    if (error) {
      showAlert(t('error'), error);
    } else {
      setShowCatModal(false);
      showAlert(t('success'), editCat ? (isRTL ? 'تم تحديث القسم' : 'Category updated') : (isRTL ? 'تم إضافة القسم' : 'Category added'));
    }
  };

  const handleDeleteCat = (cat: MenuCategory) => {
    showAlert(
      isRTL ? 'حذف القسم' : 'Delete Category',
      isRTL ? `حذف قسم "${cat.name}"؟ سيتم إزالة الأصناف من هذا القسم.` : `Delete category "${cat.name}"? Items will be uncategorized.`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: isRTL ? 'حذف' : 'Delete', style: 'destructive',
          onPress: async () => {
            const { error } = await deleteCategory(cat.id);
            if (error) showAlert(t('error'), error);
          },
        },
      ]
    );
  };

  const getCategoryName = (id: string | null) => {
    if (!id) return isRTL ? 'بدون قسم' : 'Uncategorized';
    const cat = categories.find(c => c.id === id);
    return cat ? (isRTL ? cat.name_ar : cat.name) : (isRTL ? 'بدون قسم' : 'Uncategorized');
  };

  const itemCountForCategory = (catId: string) =>
    items.filter(i => i.category_id === catId).length;

  const renderItem = ({ item }: { item: MenuItem }) => (
    <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Images strip */}
      {item.images && item.images.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.imgStrip, { borderBottomColor: colors.border }]}>
          {item.images.map((uri, idx) => (
            <Image key={idx} source={{ uri }} style={styles.itemImg} contentFit="cover" transition={200} />
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.itemBody}>
        {/* Title row */}
        <View style={[styles.itemTitleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.itemName, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? (item.name_ar || item.name) : item.name}
            </Text>
            {(isRTL ? item.description_ar : item.description) ? (
              <Text style={[styles.itemDesc, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
                {isRTL ? item.description_ar : item.description}
              </Text>
            ) : null}
          </View>
          <View style={styles.itemPriceWrap}>
            <Text style={[styles.itemPrice, { color: Colors.brand }]}>{item.price} {t('egp')}</Text>
          </View>
        </View>

        {/* Meta row */}
        <View style={[styles.itemMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.catTag, { backgroundColor: `${Colors.brand}20` }]}>
            <MaterialIcons name="category" size={11} color={Colors.brand} />
            <Text style={[styles.catTagText, { color: Colors.brand }]}>{getCategoryName(item.category_id)}</Text>
          </View>
          {item.images && item.images.length > 0 ? (
            <View style={[styles.catTag, { backgroundColor: colors.inputBg }]}>
              <MaterialIcons name="photo-library" size={11} color={colors.icon} />
              <Text style={[styles.catTagText, { color: colors.textMuted }]}>{item.images.length}</Text>
            </View>
          ) : null}
        </View>

        {/* Actions row */}
        <View style={[styles.itemActions, { flexDirection: isRTL ? 'row-reverse' : 'row', borderTopColor: colors.border }]}>
          {/* Availability toggle */}
          <View style={[styles.availRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Switch
              value={item.is_available}
              onValueChange={async (v) => {
                const { error } = await toggleAvailability(item.id, v);
                if (error) showAlert(t('error'), error);
              }}
              trackColor={{ false: colors.border, true: `${Colors.success}88` }}
              thumbColor={item.is_available ? Colors.success : colors.textMuted}
            />
            <Text style={[styles.availText, { color: item.is_available ? Colors.success : colors.textMuted }]}>
              {item.is_available ? (isRTL ? 'متاح' : 'Available') : (isRTL ? 'مخفي' : 'Hidden')}
            </Text>
          </View>
          <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: Spacing.sm }]}>
            <Pressable style={[styles.actionBtn, { backgroundColor: `${Colors.brand}22` }]} onPress={() => openEditItem(item)}>
              <MaterialIcons name="edit" size={15} color={Colors.brand} />
            </Pressable>
            <Pressable style={[styles.actionBtn, { backgroundColor: `${Colors.danger}22` }]} onPress={() => handleDeleteItem(item)}>
              <MaterialIcons name="delete" size={15} color={Colors.danger} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );

  const renderCategory = ({ item: cat }: { item: MenuCategory }) => (
    <View style={[styles.catCard, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <View style={[styles.catIcon, { backgroundColor: `${Colors.brand}20` }]}>
        <MaterialIcons name="category" size={20} color={Colors.brand} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.catName, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
          {isRTL ? (cat.name_ar || cat.name) : cat.name}
        </Text>
        <Text style={[styles.catCount, { color: colors.textMuted }]}>
          {itemCountForCategory(cat.id)} {isRTL ? 'صنف' : 'items'}
        </Text>
      </View>
      <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: Spacing.sm }}>
        <Pressable style={[styles.actionBtn, { backgroundColor: `${Colors.brand}22` }]} onPress={() => openEditCat(cat)}>
          <MaterialIcons name="edit" size={15} color={Colors.brand} />
        </Pressable>
        <Pressable style={[styles.actionBtn, { backgroundColor: `${Colors.danger}22` }]} onPress={() => handleDeleteCat(cat)}>
          <MaterialIcons name="delete" size={15} color={Colors.danger} />
        </Pressable>
      </View>
    </View>
  );

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
            {isRTL ? 'قائمة الطعام' : 'Menu Management'}
          </Text>
          <Text style={[styles.headerSub, { color: Colors.brand, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
            {displayName}
          </Text>
        </View>
        <View style={[styles.headerStats, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.statPill, { backgroundColor: `${Colors.brand}20` }]}>
            <Text style={[styles.statPillText, { color: Colors.brand }]}>{items.length} {isRTL ? 'صنف' : 'items'}</Text>
          </View>
          <View style={[styles.statPill, { backgroundColor: colors.inputBg }]}>
            <Text style={[styles.statPillText, { color: colors.textMuted }]}>{categories.length} {isRTL ? 'قسم' : 'cats'}</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsRow, { backgroundColor: colors.surface, borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {(['items', 'categories'] as ActiveTab[]).map(tab => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && { borderBottomColor: Colors.brand }]}
            onPress={() => setActiveTab(tab)}
          >
            <MaterialIcons
              name={tab === 'items' ? 'restaurant-menu' : 'category'}
              size={16}
              color={activeTab === tab ? Colors.brand : colors.textMuted}
            />
            <Text style={[styles.tabText, { color: activeTab === tab ? Colors.brand : colors.textMuted }]}>
              {tab === 'items' ? (isRTL ? 'الأصناف' : 'Menu Items') : (isRTL ? 'الأقسام' : 'Categories')}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeTab === 'items' ? (
        <>
          {/* Search + Add */}
          <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.searchBar, { backgroundColor: colors.inputBg, flex: 1, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <MaterialIcons name="search" size={16} color={colors.icon} />
              <TextInput
                style={[styles.searchInput, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}
                placeholder={t('search')}
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />
            </View>
            <Pressable style={[styles.addBtn, { backgroundColor: Colors.brand }]} onPress={openAddItem}>
              <MaterialIcons name="add" size={18} color="#000" />
              <Text style={styles.addBtnText}>{isRTL ? 'إضافة' : 'Add'}</Text>
            </Pressable>
          </View>

          {/* Category filter */}
          <View style={[styles.catFilter, { borderBottomColor: colors.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm }}>
              <Pressable
                style={[styles.chip, { backgroundColor: selectedCategory === 'all' ? Colors.brand : colors.inputBg, borderColor: selectedCategory === 'all' ? Colors.brand : colors.border }]}
                onPress={() => setSelectedCategory('all')}
              >
                <Text style={[styles.chipText, { color: selectedCategory === 'all' ? '#000' : colors.textSecondary }]}>
                  {isRTL ? 'الكل' : 'All'} ({items.length})
                </Text>
              </Pressable>
              {categories.map(cat => (
                <Pressable
                  key={cat.id}
                  style={[styles.chip, { backgroundColor: selectedCategory === cat.id ? Colors.brand : colors.inputBg, borderColor: selectedCategory === cat.id ? Colors.brand : colors.border }]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text style={[styles.chipText, { color: selectedCategory === cat.id ? '#000' : colors.textSecondary }]}>
                    {isRTL ? cat.name_ar : cat.name} ({itemCountForCategory(cat.id)})
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
              data={filteredItems}
              keyExtractor={item => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={[styles.empty, { backgroundColor: colors.card }]}>
                  <MaterialIcons name="restaurant-menu" size={40} color={colors.textMuted} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {isRTL ? 'لا توجد أصناف' : 'No menu items yet'}
                  </Text>
                  <Pressable style={[styles.addEmptyBtn, { backgroundColor: Colors.brand }]} onPress={openAddItem}>
                    <MaterialIcons name="add" size={16} color="#000" />
                    <Text style={styles.addEmptyText}>{isRTL ? 'إضافة صنف' : 'Add Item'}</Text>
                  </Pressable>
                </View>
              }
            />
          )}
        </>
      ) : (
        <>
          {/* Categories header */}
          <View style={[styles.catHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.catHeaderText, { color: colors.textMuted }]}>
              {categories.length} {isRTL ? 'قسم' : 'categories'}
            </Text>
            <Pressable style={[styles.addBtn, { backgroundColor: Colors.brand }]} onPress={openAddCat}>
              <MaterialIcons name="add" size={18} color="#000" />
              <Text style={styles.addBtnText}>{isRTL ? 'إضافة قسم' : 'Add Category'}</Text>
            </Pressable>
          </View>

          {/* Preset suggestions */}
          {categories.length === 0 && (
            <View style={[styles.presetWrap, { borderBottomColor: colors.border }]}>
              <Text style={[styles.presetTitle, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'أقسام شائعة — اضغط للإضافة:' : 'Common categories — tap to add:'}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: 2, paddingVertical: Spacing.xs }}>
                {PRESET_CATEGORIES.map(p => (
                  <Pressable
                    key={p.en}
                    style={[styles.presetChip, { borderColor: Colors.brand }]}
                    onPress={async () => {
                      await createCategory({ restaurant_id: restaurantId || '', name: p.en, name_ar: p.ar });
                    }}
                  >
                    <MaterialIcons name="add" size={12} color={Colors.brand} />
                    <Text style={[styles.presetText, { color: Colors.brand }]}>{isRTL ? p.ar : p.en}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {loading ? (
            <View style={styles.loadingWrap}><ActivityIndicator size="large" color={Colors.brand} /></View>
          ) : (
            <FlatList
              data={categories}
              keyExtractor={item => item.id}
              renderItem={renderCategory}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={[styles.empty, { backgroundColor: colors.card }]}>
                  <MaterialIcons name="category" size={40} color={colors.textMuted} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {isRTL ? 'لا توجد أقسام' : 'No categories yet'}
                  </Text>
                </View>
              }
            />
          )}
        </>
      )}

      {/* ── ITEM MODAL ─────────────────────────────────────────────────────── */}
      <Modal visible={showItemModal} transparent animationType="slide" onRequestClose={() => setShowItemModal(false)}>
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
            <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
              {/* Sheet header */}
              <View style={[styles.sheetHeader, { flexDirection: isRTL ? 'row-reverse' : 'row', borderBottomColor: colors.border }]}>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>
                  {editItem ? (isRTL ? 'تعديل الصنف' : 'Edit Item') : (isRTL ? 'إضافة صنف جديد' : 'Add Menu Item')}
                </Text>
                <Pressable onPress={() => setShowItemModal(false)} hitSlop={8}>
                  <MaterialIcons name="close" size={22} color={colors.icon} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheetBody}>
                {/* Name EN */}
                <FormField label={isRTL ? 'اسم الصنف (English)' : 'Item Name (English)'} value={itemForm.name} onChange={v => setItemForm(f => ({ ...f, name: v }))} colors={colors} isRTL={isRTL} icon="restaurant" placeholder="e.g. Double Burger" />
                {/* Name AR */}
                <FormField label={isRTL ? 'اسم الصنف (عربي)' : 'Item Name (Arabic)'} value={itemForm.name_ar} onChange={v => setItemForm(f => ({ ...f, name_ar: v }))} colors={colors} isRTL={isRTL} icon="restaurant" placeholder="مثال: برجر مضاعف" rtl />
                {/* Price */}
                <FormField label={isRTL ? `السعر (${t('egp')})` : `Price (${t('egp')})`} value={itemForm.price} onChange={v => setItemForm(f => ({ ...f, price: v }))} colors={colors} isRTL={isRTL} icon="attach-money" placeholder="0.00" keyboard="decimal-pad" />
                {/* Desc EN */}
                <FormField label={isRTL ? 'الوصف (English)' : 'Description (English)'} value={itemForm.description} onChange={v => setItemForm(f => ({ ...f, description: v }))} colors={colors} isRTL={isRTL} icon="notes" placeholder="Optional description..." multiline />
                {/* Desc AR */}
                <FormField label={isRTL ? 'الوصف (عربي)' : 'Description (Arabic)'} value={itemForm.description_ar} onChange={v => setItemForm(f => ({ ...f, description_ar: v }))} colors={colors} isRTL={isRTL} icon="notes" placeholder="وصف اختياري..." multiline rtl />

                {/* Category */}
                <Text style={[styles.fieldLabel, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                  {isRTL ? 'القسم' : 'Category'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
                  <View style={{ flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: 2 }}>
                    <Pressable
                      style={[styles.optChip, { backgroundColor: itemForm.category_id === null ? Colors.brand : colors.inputBg, borderColor: itemForm.category_id === null ? Colors.brand : colors.border }]}
                      onPress={() => setItemForm(f => ({ ...f, category_id: null }))}
                    >
                      <Text style={[styles.optChipText, { color: itemForm.category_id === null ? '#000' : colors.textSecondary }]}>
                        {isRTL ? 'بدون قسم' : 'None'}
                      </Text>
                    </Pressable>
                    {categories.map(cat => (
                      <Pressable
                        key={cat.id}
                        style={[styles.optChip, { backgroundColor: itemForm.category_id === cat.id ? Colors.brand : colors.inputBg, borderColor: itemForm.category_id === cat.id ? Colors.brand : colors.border }]}
                        onPress={() => setItemForm(f => ({ ...f, category_id: cat.id }))}
                      >
                        <Text style={[styles.optChipText, { color: itemForm.category_id === cat.id ? '#000' : colors.textSecondary }]}>
                          {isRTL ? cat.name_ar : cat.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>

                {/* Availability */}
                <View style={[styles.availToggleRow, { backgroundColor: colors.inputBg, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 }]}>
                    <MaterialIcons name={itemForm.is_available ? 'visibility' : 'visibility-off'} size={18} color={itemForm.is_available ? Colors.success : colors.textMuted} />
                    <View>
                      <Text style={[styles.availLabel, { color: colors.text }]}>
                        {isRTL ? 'إظهار في القائمة' : 'Show in Menu'}
                      </Text>
                      <Text style={[styles.availSub, { color: colors.textMuted }]}>
                        {itemForm.is_available ? (isRTL ? 'متاح للطلب' : 'Available to order') : (isRTL ? 'مخفي عن العملاء' : 'Hidden from customers')}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={itemForm.is_available}
                    onValueChange={v => setItemForm(f => ({ ...f, is_available: v }))}
                    trackColor={{ false: colors.border, true: `${Colors.success}88` }}
                    thumbColor={itemForm.is_available ? Colors.success : colors.textMuted}
                  />
                </View>

                {/* Images */}
                <Text style={[styles.fieldLabel, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left', marginTop: Spacing.md }]}>
                  {isRTL ? `الصور (${itemForm.images.length}/5)` : `Images (${itemForm.images.length}/5)`}
                </Text>
                <View style={styles.imagesGrid}>
                  {itemForm.images.map((uri, idx) => (
                    <View key={idx} style={styles.imgThumbWrap}>
                      <Image source={{ uri }} style={styles.imgThumb} contentFit="cover" transition={200} />
                      <Pressable style={styles.imgRemove} onPress={() => removeImage(idx)}>
                        <MaterialIcons name="close" size={12} color="#fff" />
                      </Pressable>
                    </View>
                  ))}
                  {itemForm.images.length < 5 && (
                    <Pressable
                      style={[styles.imgAddBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                      onPress={pickImages}
                      disabled={uploadingImages}
                    >
                      {uploadingImages ? (
                        <ActivityIndicator size="small" color={Colors.brand} />
                      ) : (
                        <>
                          <MaterialIcons name="add-photo-alternate" size={22} color={Colors.brand} />
                          <Text style={[styles.imgAddText, { color: Colors.brand }]}>
                            {isRTL ? 'إضافة صور' : 'Add Photos'}
                          </Text>
                        </>
                      )}
                    </Pressable>
                  )}
                </View>

                {/* Save */}
                <Pressable style={[styles.saveBtn, { backgroundColor: Colors.brand, opacity: saving ? 0.7 : 1 }]} onPress={handleSaveItem} disabled={saving || uploadingImages}>
                  {saving ? <ActivityIndicator size="small" color="#000" /> : (
                    <>
                      <MaterialIcons name="check-circle" size={18} color="#000" />
                      <Text style={styles.saveBtnText}>
                        {editItem ? (isRTL ? 'حفظ التغييرات' : 'Save Changes') : (isRTL ? 'إضافة الصنف' : 'Add Item')}
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

      {/* ── CATEGORY MODAL ──────────────────────────────────────────────────── */}
      <Modal visible={showCatModal} transparent animationType="slide" onRequestClose={() => setShowCatModal(false)}>
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
            <View style={[styles.sheet, { backgroundColor: colors.surface, maxHeight: '50%' }]}>
              <View style={[styles.sheetHeader, { flexDirection: isRTL ? 'row-reverse' : 'row', borderBottomColor: colors.border }]}>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>
                  {editCat ? (isRTL ? 'تعديل القسم' : 'Edit Category') : (isRTL ? 'إضافة قسم جديد' : 'Add Category')}
                </Text>
                <Pressable onPress={() => setShowCatModal(false)} hitSlop={8}>
                  <MaterialIcons name="close" size={22} color={colors.icon} />
                </Pressable>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheetBody}>
                <FormField label={isRTL ? 'اسم القسم (English)' : 'Category Name (English)'} value={catForm.name} onChange={v => setCatForm(f => ({ ...f, name: v }))} colors={colors} isRTL={isRTL} icon="category" placeholder="e.g. Main Courses" />
                <FormField label={isRTL ? 'اسم القسم (عربي)' : 'Category Name (Arabic)'} value={catForm.name_ar} onChange={v => setCatForm(f => ({ ...f, name_ar: v }))} colors={colors} isRTL={isRTL} icon="category" placeholder="مثال: الأطباق الرئيسية" rtl />
                <Pressable style={[styles.saveBtn, { backgroundColor: Colors.brand, opacity: savingCat ? 0.7 : 1 }]} onPress={handleSaveCat} disabled={savingCat}>
                  {savingCat ? <ActivityIndicator size="small" color="#000" /> : (
                    <>
                      <MaterialIcons name="check-circle" size={18} color="#000" />
                      <Text style={styles.saveBtnText}>
                        {editCat ? (isRTL ? 'حفظ' : 'Save') : (isRTL ? 'إضافة القسم' : 'Add Category')}
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

function FormField({ label, value, onChange, colors, isRTL, icon, placeholder, keyboard, multiline, rtl }: any) {
  return (
    <View style={{ marginBottom: Spacing.md }}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
      <View style={[styles.inputRow, {
        backgroundColor: colors.inputBg, borderColor: colors.border,
        flexDirection: isRTL ? 'row-reverse' : 'row',
        alignItems: multiline ? 'flex-start' : 'center',
        paddingTop: multiline ? 10 : undefined,
      }]}>
        <MaterialIcons name={icon} size={16} color={colors.icon} style={multiline ? { marginTop: 2 } : undefined} />
        <TextInput
          style={[styles.input, { color: colors.text, textAlign: rtl ? 'right' : (isRTL ? 'right' : 'left') }, multiline && { minHeight: 60, textAlignVertical: 'top' }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboard || 'default'}
          autoCapitalize="none"
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: Spacing.md, paddingVertical: 10, alignItems: 'center', gap: Spacing.sm, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  headerSub: { fontSize: FontSize.xs, marginTop: 1 },
  headerStats: { gap: Spacing.xs },
  statPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  statPillText: { fontSize: 10, fontWeight: FontWeight.semibold },
  tabsRow: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  searchWrap: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm, alignItems: 'center', borderBottomWidth: 1 },
  searchBar: { alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.sm, paddingVertical: 9, borderRadius: Radius.md },
  searchInput: { flex: 1, fontSize: FontSize.sm },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radius.md },
  addBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#000' },
  catFilter: { borderBottomWidth: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: 40 },
  itemCard: { borderRadius: Radius.md, borderWidth: 1, overflow: 'hidden' },
  imgStrip: { borderBottomWidth: 1 },
  itemImg: { width: 100, height: 80, margin: 4, borderRadius: Radius.sm },
  itemBody: { padding: Spacing.md },
  itemTitleRow: { gap: Spacing.sm, marginBottom: Spacing.xs },
  itemName: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  itemDesc: { fontSize: FontSize.xs, lineHeight: 16, marginTop: 3 },
  itemPriceWrap: { alignItems: 'flex-end' },
  itemPrice: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  itemMeta: { gap: Spacing.xs, marginBottom: Spacing.sm },
  catTag: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  catTagText: { fontSize: 10, fontWeight: FontWeight.medium },
  itemActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.sm, borderTopWidth: 1, marginTop: Spacing.xs },
  availRow: { alignItems: 'center', gap: 6 },
  availText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  actionBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  catCard: { borderRadius: Radius.md, borderWidth: 1, padding: Spacing.md, alignItems: 'center', gap: Spacing.md },
  catIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  catCount: { fontSize: FontSize.xs, marginTop: 2 },
  catHeader: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
  catHeaderText: { fontSize: FontSize.sm },
  presetWrap: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1 },
  presetTitle: { fontSize: FontSize.xs, marginBottom: Spacing.xs },
  presetChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1 },
  presetText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1 },
  chipText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  empty: { alignItems: 'center', padding: Spacing.xxl, borderRadius: Radius.md, gap: Spacing.sm, marginTop: Spacing.xl },
  emptyText: { fontSize: FontSize.base },
  addEmptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full, marginTop: Spacing.sm },
  addEmptyText: { color: '#000', fontWeight: FontWeight.bold },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
  sheetHeader: { justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1 },
  sheetTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  sheetBody: { padding: Spacing.lg },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginBottom: Spacing.xs },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.sm, paddingVertical: 11, borderRadius: Radius.md, borderWidth: 1 },
  input: { flex: 1, fontSize: FontSize.base },
  optChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1 },
  optChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  availToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.md },
  availLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  availSub: { fontSize: FontSize.xs, marginTop: 2 },
  imagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  imgThumbWrap: { position: 'relative' },
  imgThumb: { width: 80, height: 80, borderRadius: Radius.sm },
  imgRemove: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  imgAddBtn: { width: 80, height: 80, borderRadius: Radius.sm, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },
  imgAddText: { fontSize: 10, fontWeight: FontWeight.semibold, textAlign: 'center' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: 14, borderRadius: Radius.md, marginTop: Spacing.sm },
  saveBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#000' },
});
