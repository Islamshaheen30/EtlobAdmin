import { getSupabaseClient } from '@/template';

export type StaffRole = 'accountant' | 'call_center' | 'restaurant_owner';

export interface RestaurantStaff {
  id: string;
  restaurant_id: string;
  name: string;
  name_ar: string;
  username: string;
  password_hash?: string;
  role: StaffRole;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  // joined from restaurants
  restaurant_name?: string;
  restaurant_name_ar?: string;
}

export interface CreateStaffPayload {
  restaurant_id: string;
  name: string;
  name_ar: string;
  username: string;
  password: string;
  role: StaffRole;
}

export interface UpdateStaffPayload {
  name?: string;
  name_ar?: string;
  username?: string;
  password?: string;
  role?: StaffRole;
  is_active?: boolean;
}

export interface DeliveryPricing {
  id: string;
  vehicle_type: 'bicycle' | 'motorcycle' | 'scooter';
  fee_type: 'distance_based' | 'flat_rate';
  price_per_km: number;
  flat_fee_egp: number;
  min_fee_egp: number;
  max_fee_egp?: number | null;
  is_active: boolean;
  notes: string;
  created_at?: string;
  updated_at?: string;
}

const getClient = () => getSupabaseClient();

export const staffService = {
  async fetchAll(restaurantId?: string): Promise<{ data: RestaurantStaff[] | null; error: string | null }> {
    let query = getClient()
      .from('restaurant_staff')
      .select('*, restaurants(name, name_ar)')
      .order('created_at', { ascending: false });
    if (restaurantId) query = query.eq('restaurant_id', restaurantId);
    const { data, error } = await query;
    if (error) return { data: null, error: error.message };
    const mapped = (data || []).map((s: any) => ({
      ...s,
      restaurant_name: s.restaurants?.name || '',
      restaurant_name_ar: s.restaurants?.name_ar || '',
    }));
    return { data: mapped, error: null };
  },

  async create(payload: CreateStaffPayload): Promise<{ data: RestaurantStaff | null; error: string | null }> {
    // Hash password via DB function call using RPC — store using crypt
    const { data, error } = await getClient()
      .from('restaurant_staff')
      .insert({
        restaurant_id: payload.restaurant_id,
        name: payload.name,
        name_ar: payload.name_ar,
        username: payload.username,
        password_hash: payload.password, // will be hashed by trigger
        role: payload.role,
      })
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  async update(id: string, updates: UpdateStaffPayload): Promise<{ error: string | null }> {
    const payload: any = { ...updates };
    if (updates.password) {
      payload.password_hash = updates.password;
      delete payload.password;
    }
    const { error } = await getClient()
      .from('restaurant_staff')
      .update(payload)
      .eq('id', id);
    if (error) return { error: error.message };
    return { error: null };
  },

  async delete(id: string): Promise<{ error: string | null }> {
    const { error } = await getClient()
      .from('restaurant_staff')
      .delete()
      .eq('id', id);
    if (error) return { error: error.message };
    return { error: null };
  },

  async toggleActive(id: string, is_active: boolean): Promise<{ error: string | null }> {
    const { error } = await getClient()
      .from('restaurant_staff')
      .update({ is_active })
      .eq('id', id);
    if (error) return { error: error.message };
    return { error: null };
  },
};

export const deliveryPricingService = {
  async fetchAll(): Promise<{ data: DeliveryPricing[] | null; error: string | null }> {
    const { data, error } = await getClient()
      .from('delivery_pricing')
      .select('*')
      .order('vehicle_type')
      .order('fee_type');
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  async update(id: string, updates: Partial<DeliveryPricing>): Promise<{ error: string | null }> {
    const { error } = await getClient()
      .from('delivery_pricing')
      .update(updates)
      .eq('id', id);
    if (error) return { error: error.message };
    return { error: null };
  },

  async upsert(payload: Omit<DeliveryPricing, 'id' | 'created_at' | 'updated_at'>): Promise<{ error: string | null }> {
    const { error } = await getClient()
      .from('delivery_pricing')
      .upsert(payload, { onConflict: 'vehicle_type,fee_type' });
    if (error) return { error: error.message };
    return { error: null };
  },

  async archiveOldOrders(): Promise<{ count: number; error: string | null }> {
    const { data, error } = await getClient().rpc('archive_old_orders');
    if (error) return { count: 0, error: error.message };
    return { count: data || 0, error: null };
  },
};
