// Etlob Admin Panel – Mock Data Service (Cleaned for Production)

export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'dispatched' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'wallet';
export type PaymentStatus = 'paid' | 'pending' | 'failed';

export interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  phone: string;
  restaurant: string;
  rider: string | null;
  riderId: string | null;
  items: { name: string; qty: number; price: number }[];
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  address: string;
  createdAt: Date;
  estimatedTime: number; // minutes
  area: string;
}

export interface Restaurant {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  rating: number;
  totalOrders: number;
  revenue: number;
  status: 'active' | 'inactive' | 'suspended';
  commission: number;
  area: string;
  phone: string;
  joinedDate: string;
  todayOrders: number;
}

export interface Rider {
  id: string;
  name: string;
  nameAr: string;
  phone: string;
  area: string;
  status: 'online' | 'offline' | 'on_delivery';
  totalDeliveries: number;
  todayDeliveries: number;
  rating: number;
  vehicle: string;
  earnings: number;
  joinedDate: string;
}

export interface DashboardStats {
  totalOrdersToday: number;
  totalRevenue: number;
  activeRiders: number;
  activeRestaurants: number;
  pendingOrders: number;
  deliveredToday: number;
  cancelledToday: number;
  avgDeliveryTime: number;
  revenueGrowth: number;
  ordersGrowth: number;
}

// Cleaned Data for Real-time Operation
export const mockRestaurants: Restaurant[] = [];
export const mockRiders: Rider[] = [];
export const generateMockOrders = (): Order[] => [];

export const getDashboardStats = (): DashboardStats => ({
  totalOrdersToday: 0,
  totalRevenue: 0,
  activeRiders: 0,
  activeRestaurants: 0,
  pendingOrders: 0,
  deliveredToday: 0,
  cancelledToday: 0,
  avgDeliveryTime: 0,
  revenueGrowth: 0,
  ordersGrowth: 0,
});

export const getWeeklyData = () => [
  { day: 'Mon', orders: 0, revenue: 0 },
  { day: 'Tue', orders: 0, revenue: 0 },
  { day: 'Wed', orders: 0, revenue: 0 },
  { day: 'Thu', orders: 0, revenue: 0 },
  { day: 'Fri', orders: 0, revenue: 0 },
  { day: 'Sat', orders: 0, revenue: 0 },
  { day: 'Sun', orders: 0, revenue: 0 },
];
