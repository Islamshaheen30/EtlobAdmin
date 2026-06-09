import { getSupabaseClient } from '@/template';

export interface AnalyticsSummary {
  totalRestaurants: number;
  activeRestaurants: number;
  totalRiders: number;
  onlineRiders: number;
  totalMenuItems: number;
  availableMenuItems: number;
  totalMenuCategories: number;
}

export interface TopRestaurant {
  id: string;
  name: string;
  name_ar: string;
  today_orders: number;
  total_orders: number;
  rating: number;
  category: string;
  area: string;
  status: string;
}

export interface RiderStat {
  id: string;
  name: string;
  name_ar: string;
  today_deliveries: number;
  total_deliveries: number;
  rating: number;
  status: string;
  area: string;
  earnings: number;
}

export interface CategoryBreakdown {
  categoryName: string;
  categoryNameAr: string;
  itemCount: number;
  availableCount: number;
  restaurantName: string;
  restaurantNameAr: string;
}

export interface AreaStat {
  area: string;
  restaurantCount: number;
  todayOrders: number;
}

const getClient = () => getSupabaseClient();

export const analyticsService = {
  async fetchSummary(): Promise<{ data: AnalyticsSummary | null; error: string | null }> {
    try {
      const [restRes, ridersRes, itemsRes, catsRes] = await Promise.all([
        getClient().from('restaurants').select('id, status'),
        getClient().from('riders').select('id, status'),
        getClient().from('menu_items').select('id, is_available'),
        getClient().from('menu_categories').select('id'),
      ]);

      if (restRes.error) return { data: null, error: restRes.error.message };
      if (ridersRes.error) return { data: null, error: ridersRes.error.message };
      if (itemsRes.error) return { data: null, error: itemsRes.error.message };

      const restaurants = restRes.data || [];
      const riders = ridersRes.data || [];
      const items = itemsRes.data || [];
      const cats = catsRes.data || [];

      return {
        data: {
          totalRestaurants: restaurants.length,
          activeRestaurants: restaurants.filter((r: any) => r.status === 'active').length,
          totalRiders: riders.length,
          onlineRiders: riders.filter((r: any) => r.status === 'online' || r.status === 'on_delivery').length,
          totalMenuItems: items.length,
          availableMenuItems: items.filter((i: any) => i.is_available).length,
          totalMenuCategories: cats.length,
        },
        error: null,
      };
    } catch (e: any) {
      return { data: null, error: e.message };
    }
  },

  async fetchTopRestaurants(limit = 5): Promise<{ data: TopRestaurant[] | null; error: string | null }> {
    const { data, error } = await getClient()
      .from('restaurants')
      .select('id, name, name_ar, today_orders, total_orders, rating, category, area, status')
      .eq('status', 'active')
      .order('today_orders', { ascending: false })
      .limit(limit);

    if (error) return { data: null, error: error.message };
    return { data: data || [], error: null };
  },

  async fetchAllRestaurantsForArea(): Promise<{ data: TopRestaurant[] | null; error: string | null }> {
    const { data, error } = await getClient()
      .from('restaurants')
      .select('id, name, name_ar, today_orders, total_orders, rating, category, area, status');

    if (error) return { data: null, error: error.message };
    return { data: data || [], error: null };
  },

  async fetchRiderStats(limit = 5): Promise<{ data: RiderStat[] | null; error: string | null }> {
    const { data, error } = await getClient()
      .from('riders')
      .select('id, name, name_ar, today_deliveries, total_deliveries, rating, status, area, earnings')
      .order('today_deliveries', { ascending: false })
      .limit(limit);

    if (error) return { data: null, error: error.message };
    return { data: data || [], error: null };
  },

  async fetchCategoryBreakdown(): Promise<{ data: CategoryBreakdown[] | null; error: string | null }> {
    // Get categories with item counts joined with restaurant name
    const { data: cats, error: catsError } = await getClient()
      .from('menu_categories')
      .select(`
        id,
        name,
        name_ar,
        restaurant_id,
        restaurants!menu_categories_restaurant_id_fkey(name, name_ar)
      `);

    if (catsError) return { data: null, error: catsError.message };

    const { data: items, error: itemsError } = await getClient()
      .from('menu_items')
      .select('id, category_id, is_available');

    if (itemsError) return { data: null, error: itemsError.message };

    const breakdown: CategoryBreakdown[] = (cats || []).map((cat: any) => {
      const catItems = (items || []).filter((i: any) => i.category_id === cat.id);
      return {
        categoryName: cat.name,
        categoryNameAr: cat.name_ar,
        itemCount: catItems.length,
        availableCount: catItems.filter((i: any) => i.is_available).length,
        restaurantName: cat.restaurants?.name || '',
        restaurantNameAr: cat.restaurants?.name_ar || '',
      };
    });

    // Sort by itemCount desc
    breakdown.sort((a, b) => b.itemCount - a.itemCount);

    return { data: breakdown, error: null };
  },

  async fetchRestaurantStatusBreakdown(): Promise<{ data: { active: number; inactive: number; suspended: number } | null; error: string | null }> {
    const { data, error } = await getClient()
      .from('restaurants')
      .select('status');

    if (error) return { data: null, error: error.message };

    const rows = data || [];
    return {
      data: {
        active: rows.filter((r: any) => r.status === 'active').length,
        inactive: rows.filter((r: any) => r.status === 'inactive').length,
        suspended: rows.filter((r: any) => r.status === 'suspended').length,
      },
      error: null,
    };
  },

  async fetchRiderStatusBreakdown(): Promise<{ data: { online: number; offline: number; on_delivery: number } | null; error: string | null }> {
    const { data, error } = await getClient()
      .from('riders')
      .select('status');

    if (error) return { data: null, error: error.message };

    const rows = data || [];
    return {
      data: {
        online: rows.filter((r: any) => r.status === 'online').length,
        offline: rows.filter((r: any) => r.status === 'offline').length,
        on_delivery: rows.filter((r: any) => r.status === 'on_delivery').length,
      },
      error: null,
    };
  },
};
