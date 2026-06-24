import { useState, useCallback } from 'react';
import {
  staffService, deliveryPricingService,
  RestaurantStaff, DeliveryPricing,
  CreateStaffPayload, UpdateStaffPayload,
} from '@/services/staffService';

export function useStaffManager(restaurantId?: string) {
  const [staff, setStaff] = useState<RestaurantStaff[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    const { data, error } = await staffService.fetchAll(restaurantId);
    if (data) setStaff(data);
    setLoading(false);
    return { error };
  }, [restaurantId]);

  const createStaff = useCallback(async (payload: CreateStaffPayload): Promise<{ error: string | null }> => {
    setSaving(true);
    const { data, error } = await staffService.create(payload);
    setSaving(false);
    if (error) return { error };
    if (data) setStaff(prev => [data, ...prev]);
    return { error: null };
  }, []);

  const updateStaff = useCallback(async (id: string, updates: UpdateStaffPayload): Promise<{ error: string | null }> => {
    setSaving(true);
    const { error } = await staffService.update(id, updates);
    setSaving(false);
    if (error) return { error };
    setStaff(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    return { error: null };
  }, []);

  const deleteStaff = useCallback(async (id: string): Promise<{ error: string | null }> => {
    const { error } = await staffService.delete(id);
    if (error) return { error };
    setStaff(prev => prev.filter(s => s.id !== id));
    return { error: null };
  }, []);

  const toggleActive = useCallback(async (id: string, is_active: boolean): Promise<{ error: string | null }> => {
    const { error } = await staffService.toggleActive(id, is_active);
    if (error) return { error };
    setStaff(prev => prev.map(s => s.id === id ? { ...s, is_active } : s));
    return { error: null };
  }, []);

  return {
    staff, loading, saving,
    loadStaff, createStaff, updateStaff, deleteStaff, toggleActive,
  };
}

export function useDeliveryPricing() {
  const [pricing, setPricing] = useState<DeliveryPricing[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const loadPricing = useCallback(async () => {
    setLoading(true);
    const { data, error } = await deliveryPricingService.fetchAll();
    if (data) setPricing(data);
    setLoading(false);
    return { error };
  }, []);

  const updatePricing = useCallback(async (id: string, updates: Partial<DeliveryPricing>): Promise<{ error: string | null }> => {
    setSaving(id);
    const { error } = await deliveryPricingService.update(id, updates);
    setSaving(null);
    if (error) return { error };
    setPricing(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    return { error: null };
  }, []);

  const archiveOldOrders = useCallback(async () => {
    return deliveryPricingService.archiveOldOrders();
  }, []);

  return { pricing, loading, saving, loadPricing, updatePricing, archiveOldOrders };
}
