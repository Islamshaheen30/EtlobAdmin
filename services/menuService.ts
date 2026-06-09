import { getSupabaseClient } from '@/template';

export interface Restaurant {
  id: string;
  name: string;
  name_ar: string;
  category: string;
  area: string;
  phone: string;
  status: 'active' | 'inactive' | 'suspended';
  rating: number;
  total_orders: number;
  today_orders: number;
  commission: number;
  image_url?: string | null;
  logo_url?: string | null;
  opening_hours?: string;
  closing_hours?: string;
  is_open_override?: boolean | null;
  created_at?: string;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  name_ar: string;
  sort_order: number;
  created_at?: string;
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
