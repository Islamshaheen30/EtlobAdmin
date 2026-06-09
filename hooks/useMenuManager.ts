import { useState, useCallback } from 'react';
import {
  menuService, restaurantService,
  Restaurant, MenuCategory, MenuItem,
  CreateMenuItemPayload, CreateCategoryPayload,
} from '@/services/menuService';

export function useRestaurantsManager() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRestaurants = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await restaurantService.fetchAll();
    if (err) setError(err);
    else setRestaurants(data || []);
    setLoading(false);
  }, []);

  const updateRestaurant = useCallback(async (id: string, updates: Partial<Restaurant>): Promise<{ error: string | null }> => {
    const { error: err } = await restaurantService.update(id, updates);
    if (err) return { error: err };
    setRestaurants(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    return { error: null };
  }, []);

  return { restaurants, loading, error, loadRestaurants, updateRestaurant };
}

export function useMenuManager(restaurantId: string) {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    const [catRes, itemRes] = await Promise.all([
      menuService.fetchCategories(restaurantId),
      menuService.fetchItems(restaurantId),
    ]);
    if (catRes.data) setCategories(catRes.data);
    if (itemRes.data) setItems(itemRes.data);
    setLoading(false);
  }, [restaurantId]);

  const createCategory = useCallback(async (payload: CreateCategoryPayload): Promise<{ error: string | null }> => {
    setSaving(true);
    const { data, error } = await menuService.createCategory(payload);
    setSaving(false);
    if (error) return { error };
    if (data) setCategories(prev => [...prev, data]);
    return { error: null };
  }, []);

  const updateCategory = useCallback(async (id: string, updates: Partial<MenuCategory>): Promise<{ error: string | null }> => {
    const { error } = await menuService.updateCategory(id, updates);
    if (error) return { error };
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    return { error: null };
  }, []);

  const deleteCategory = useCallback(async (id: string): Promise<{ error: string | null }> => {
    const { error } = await menuService.deleteCategory(id);
    if (error) return { error };
    setCategories(prev => prev.filter(c => c.id !== id));
    // Remove category_id reference from items
    setItems(prev => prev.map(item => item.category_id === id ? { ...item, category_id: null } : item));
    return { error: null };
  }, []);

  const createItem = useCallback(async (payload: CreateMenuItemPayload): Promise<{ error: string | null }> => {
    setSaving(true);
    const { data, error } = await menuService.createItem(payload);
    setSaving(false);
    if (error) return { error };
    if (data) setItems(prev => [data, ...prev]);
    return { error: null };
  }, []);

  const updateItem = useCallback(async (id: string, updates: Partial<MenuItem>): Promise<{ error: string | null }> => {
    const { error } = await menuService.updateItem(id, updates);
    if (error) return { error };
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    return { error: null };
  }, []);

  const deleteItem = useCallback(async (id: string): Promise<{ error: string | null }> => {
    const { error } = await menuService.deleteItem(id);
    if (error) return { error };
    setItems(prev => prev.filter(i => i.id !== id));
    return { error: null };
  }, []);

  const toggleAvailability = useCallback(async (id: string, is_available: boolean): Promise<{ error: string | null }> => {
    const { error } = await menuService.toggleAvailability(id, is_available);
    if (error) return { error };
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_available } : i));
    return { error: null };
  }, []);

  return {
    categories, items, loading, saving,
    load, createCategory, updateCategory, deleteCategory,
    createItem, updateItem, deleteItem, toggleAvailability,
  };
}
