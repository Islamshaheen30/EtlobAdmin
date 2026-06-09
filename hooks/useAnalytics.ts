import { useState, useCallback } from 'react';
import {
  analyticsService,
  AnalyticsSummary,
  TopRestaurant,
  RiderStat,
  CategoryBreakdown,
} from '@/services/analyticsService';

export interface AreaStat {
  area: string;
  restaurantCount: number;
  todayOrders: number;
}

export interface AnalyticsData {
  summary: AnalyticsSummary | null;
  topRestaurants: TopRestaurant[];
  allRestaurantsForArea: TopRestaurant[];
  riderStats: RiderStat[];
  categoryBreakdown: CategoryBreakdown[];
  restaurantStatusBreakdown: { active: number; inactive: number; suspended: number } | null;
  riderStatusBreakdown: { online: number; offline: number; on_delivery: number } | null;
  areaStats: AreaStat[];
}

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsData>({
    summary: null,
    topRestaurants: [],
    allRestaurantsForArea: [],
    riderStats: [],
    categoryBreakdown: [],
    restaurantStatusBreakdown: null,
    riderStatusBreakdown: null,
    areaStats: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [summaryRes, topRestRes, allRestRes, riderRes, catRes, restStatusRes, riderStatusRes] = await Promise.all([
      analyticsService.fetchSummary(),
      analyticsService.fetchTopRestaurants(5),
      analyticsService.fetchAllRestaurantsForArea(),
      analyticsService.fetchRiderStats(5),
      analyticsService.fetchCategoryBreakdown(),
      analyticsService.fetchRestaurantStatusBreakdown(),
      analyticsService.fetchRiderStatusBreakdown(),
    ]);

    // Compute area stats from all restaurants
    const allRests = allRestRes.data || [];
    const areaMap: Record<string, AreaStat> = {};
    allRests.forEach((r: TopRestaurant) => {
      const area = r.area || 'Other';
      if (!areaMap[area]) areaMap[area] = { area, restaurantCount: 0, todayOrders: 0 };
      areaMap[area].restaurantCount += 1;
      areaMap[area].todayOrders += r.today_orders || 0;
    });
    const areaStats = Object.values(areaMap).sort((a, b) => b.todayOrders - a.todayOrders);

    setData({
      summary: summaryRes.data,
      topRestaurants: topRestRes.data || [],
      allRestaurantsForArea: allRests,
      riderStats: riderRes.data || [],
      categoryBreakdown: catRes.data || [],
      restaurantStatusBreakdown: restStatusRes.data,
      riderStatusBreakdown: riderStatusRes.data,
      areaStats,
    });

    if (summaryRes.error) setError(summaryRes.error);
    setLoading(false);
  }, []);

  return { data, loading, error, load };
}
