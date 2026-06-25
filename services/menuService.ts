import { getSupabaseClient } from '@/template';

export interface Restaurant {
  id: string;
  name: string;
  name_ar: string;
  category: string;
  area: string;
  phone: string;
  status: 'active' | 'inactive' | 'suspended';
  operational_status: 'open' | 'closed' | 'busy';
  rating: number;
  total_orders: number;
  today_orders: number;
  commission: number;
  image_url?: string | null;
  logo_url?: string | null;
  opening_hours?: string;
  closing_hours?: string;
  is_open_override?: boolean | null;
  latitude?: number | null;
  longitude?: number | null;
  delivery_radius?: number;
  prep_time_minutes?: number;
  owner_username?: string;
  owner_password?: string;
  created_at?: string;
}

export interface CreateRestaurantPayload {
  name: string;
  name_ar: string;
  area: string;
  logo_url?: string | null;
  category?: string;
  phone?: string;
  status?: 'active' | 'inactive' | 'suspended';
  operational_status?: 'open' | 'closed' | 'busy';
  owner_username?: string;
  owner_password?: string;
}

export interface Offer {
  id: string;
  restaurant_id: string;
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  image_url?: string | null;
  discount_percent?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateOfferPayload {
  restaurant_id: string;
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  image_url?: string | null;
  discount_percent?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
}

export interface AdminSetting {
  id: string;
  key: string;
  value: string | null;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  name_ar: string;
  sort_order: number;
  created_at?: string;
}

export interface MenuItemAddon {
  name: string;
  name_ar: string;
  price: number;
  is_required: boolean;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  price: number;
  images: string[];
  is_available: boolean;
  sort_order: number;
  addons: MenuItemAddon[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateMenuItemPayload {
  restaurant_id: string;
  category_id: string | null;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  price: number;
  images: string[];
  is_available: boolean;
  addons?: MenuItemAddon[];
}

export interface CreateCategoryPayload {
  restaurant_id: string;
  name: string;
  name_ar: string;
}

const getClient = () => getSupabaseClient();

export const restaurantService = {
  async fetchAll(): Promise<{ data: Restaurant[] | null; error: string | null }> {
    const { data, error } = await getClient()
      .from('restaurants')
      .select('*')
      .order('name');
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  async create(payload: CreateRestaurantPayload): Promise<{ data: Restaurant | null; error: string | null }> {
    const { data, error } = await getClient()
      .from('restaurants')
      .insert({
        name: payload.name,
        name_ar: payload.name_ar,
        area: payload.area,
        logo_url: payload.logo_url || null,
        category: payload.category || 'General',
        phone: payload.phone || '',
        status: payload.status || 'active',
        operational_status: payload.operational_status || 'open',
        owner_username: payload.owner_username || '',
        owner_password_hash: payload.owner_password || '', // Using hash field in DB
        rating: 5.0,
        total_orders: 0,
        today_orders: 0,
        commission: 15.0,
        opening_hours: '09:00',
        closing_hours: '22:00',
      })
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  async closeDailyAccounting() {
    const { data, error } = await getClient().rpc('close_daily_accounts');
    if (error) return { error: error.message };
    return { data, error: null };
  },

  async update(id: string, updates: Partial<Restaurant>): Promise<{ error: string | null }> {
    const { error } = await getClient()
      .from('restaurants')
      .update(updates)
      .eq('id', id);
    if (error) return { error: error.message };
    return { error: null };
  },
};

export const menuService = {
  // ── Categories ──────────────────────────────────────────────────────────

  async fetchCategories(restaurantId: string): Promise<{ data: MenuCategory[] | null; error: string | null }> {
    const { data, error } = await getClient()
      .from('menu_categories')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('sort_order');
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  async createCategory(payload: CreateCategoryPayload): Promise<{ data: MenuCategory | null; error: string | null }> {
    const { data, error } = await getClient()
      .from('menu_categories')
      .insert(payload)
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  async updateCategory(id: string, updates: Partial<MenuCategory>): Promise<{ error: string | null }> {
    const { error } = await getClient()
      .from('menu_categories')
      .update(updates)
      .eq('id', id);
    if (error) return { error: error.message };
    return { error: null };
  },

  async deleteCategory(id: string): Promise<{ error: string | null }> {
    const { error } = await getClient()
      .from('menu_categories')
      .delete()
      .eq('id', id);
    if (error) return { error: error.message };
    return { error: null };
  },

  // ── Menu Items ───────────────────────────────────────────────────────────

  async fetchItems(restaurantId: string): Promise<{ data: MenuItem[] | null; error: string | null }> {
    const { data, error } = await getClient()
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('sort_order');
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  async createItem(payload: CreateMenuItemPayload): Promise<{ data: MenuItem | null; error: string | null }> {
    const { data, error } = await getClient()
      .from('menu_items')
      .insert(payload)
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  async updateItem(id: string, updates: Partial<MenuItem>): Promise<{ error: string | null }> {
    const { error } = await getClient()
      .from('menu_items')
      .update(updates)
      .eq('id', id);
    if (error) return { error: error.message };
    return { error: null };
  },

  async deleteItem(id: string): Promise<{ error: string | null }> {
    const { error } = await getClient()
      .from('menu_items')
      .delete()
      .eq('id', id);
    if (error) return { error: error.message };
    return { error: null };
  },

  async toggleAvailability(id: string, is_available: boolean): Promise<{ error: string | null }> {
    return menuService.updateItem(id, { is_available });
  },

  // ── Image Upload ─────────────────────────────────────────────────────────

  async uploadImage(restaurantId: string, fileUri: string, fileName: string): Promise<{ url: string | null; error: string | null }> {
    const supabase = getClient();
    try {
      const response = await fetch(fileUri);
      const blob = await response.blob();
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const base64Data = base64.split(',')[1];
      const uint8Array = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const path = `${restaurantId}/${Date.now()}-${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(path, uint8Array, { contentType: blob.type || 'image/jpeg', upsert: false });
      if (uploadError) return { url: null, error: uploadError.message };
      const { data } = supabase.storage.from('menu-images').getPublicUrl(path);
      return { url: data.publicUrl, error: null };
    } catch (e: any) {
      return { url: null, error: e.message || 'Upload failed' };
    }
  },
};

// ── Offers Service ────────────────────────────────────────────────────────────
export const offerService = {
  async fetchAll(restaurantId?: string): Promise<{ data: Offer[] | null; error: string | null }> {
    let query = getClient().from('offers').select('*').order('created_at', { ascending: false });
    if (restaurantId) query = query.eq('restaurant_id', restaurantId);
    const { data, error } = await query;
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  async create(payload: CreateOfferPayload): Promise<{ data: Offer | null; error: string | null }> {
    const { data, error } = await getClient().from('offers').insert(payload).select().single();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  async update(id: string, updates: Partial<Offer>): Promise<{ error: string | null }> {
    const { error } = await getClient().from('offers').update(updates).eq('id', id);
    if (error) return { error: error.message };
    return { error: null };
  },

  async delete(id: string): Promise<{ error: string | null }> {
    const { error } = await getClient().from('offers').delete().eq('id', id);
    if (error) return { error: error.message };
    return { error: null };
  },

  async uploadImage(offerId: string, fileUri: string, fileName: string): Promise<{ url: string | null; error: string | null }> {
    const supabase = getClient();
    try {
      const response = await fetch(fileUri);
      const blob = await response.blob();
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const base64Data = base64.split(',')[1];
      const uint8Array = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const path = `offers/${offerId || 'new'}/${Date.now()}-${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(path, uint8Array, { contentType: blob.type || 'image/jpeg', upsert: false });
      if (uploadError) return { url: null, error: uploadError.message };
      const { data } = supabase.storage.from('menu-images').getPublicUrl(path);
      return { url: data.publicUrl, error: null };
    } catch (e: any) {
      return { url: null, error: e.message || 'Upload failed' };
    }
  },
};

// ── Admin Settings Service ─────────────────────────────────────────────────────
export const adminSettingsService = {
  async getAll(): Promise<{ data: AdminSetting[] | null; error: string | null }> {
    const { data, error } = await getClient().from('admin_settings').select('*').order('key');
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  async get(key: string): Promise<{ value: string | null; error: string | null }> {
    const { data, error } = await getClient().from('admin_settings').select('value').eq('key', key).single();
    if (error) return { value: null, error: error.message };
    return { value: data?.value ?? null, error: null };
  },

  async upsert(key: string, value: string): Promise<{ error: string | null }> {
    const { error } = await getClient().from('admin_settings').upsert({ key, value }, { onConflict: 'key' });
    if (error) return { error: error.message };
    return { error: null };
  },
};

// ── Restaurant Logo Upload ───────────────────────────────────────────────────
export const restaurantLogoService = {
  async uploadLogo(restaurantId: string, fileUri: string, fileName: string): Promise<{ url: string | null; error: string | null }> {
    const supabase = getClient();
    try {
      const response = await fetch(fileUri);
      const blob = await response.blob();
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const base64Data = base64.split(',')[1];
      const uint8Array = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const path = `${restaurantId}/logo-${Date.now()}-${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('restaurant-logos')
        .upload(path, uint8Array, { contentType: blob.type || 'image/jpeg', upsert: false });
      if (uploadError) return { url: null, error: uploadError.message };
      const { data } = supabase.storage.from('restaurant-logos').getPublicUrl(path);
      return { url: data.publicUrl, error: null };
    } catch (e: any) {
      return { url: null, error: e.message || 'Upload failed' };
    }
  },
};

// ── Time-based Open/Closed Status ────────────────────────────────────────────
export function calcRestaurantOpenStatus(restaurant: Restaurant): 'open' | 'closed' {
  if (restaurant.is_open_override === true) return 'open';
  if (restaurant.is_open_override === false) return 'closed';
  // Auto: time-based
  const opening = restaurant.opening_hours || '09:00';
  const closing = restaurant.closing_hours || '22:00';
  const now = new Date();
  const [openH, openM] = opening.split(':').map(Number);
  const [closeH, closeM] = closing.split(':').map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const openMins = openH * 60 + openM;
  const closeMins = closeH * 60 + closeM;
  if (closeMins > openMins) {
    return nowMins >= openMins && nowMins < closeMins ? 'open' : 'closed';
  }
  // Overnight (e.g. 22:00 → 02:00)
  return nowMins >= openMins || nowMins < closeMins ? 'open' : 'closed';
}
