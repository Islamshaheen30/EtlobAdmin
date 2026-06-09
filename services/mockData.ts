// Etlob Admin Panel – Mock Data Service

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

// ─── Restaurants ────────────────────────────────────────────────────────────
export const mockRestaurants: Restaurant[] = [
  { id: 'r1', name: 'Burger Palace', nameAr: 'قصر البرجر', category: 'Burgers', rating: 4.7, totalOrders: 1240, revenue: 24800, status: 'active', commission: 15, area: 'Maadi', phone: '+20 100 123 4567', joinedDate: '2023-01-15', todayOrders: 34 },
  { id: 'r2', name: 'Pizza Heaven', nameAr: 'سماء البيتزا', category: 'Pizza', rating: 4.5, totalOrders: 980, revenue: 19600, status: 'active', commission: 15, area: 'Zamalek', phone: '+20 101 234 5678', joinedDate: '2023-03-20', todayOrders: 22 },
  { id: 'r3', name: 'Shawarma King', nameAr: 'ملك الشاورما', category: 'Shawarma', rating: 4.8, totalOrders: 2100, revenue: 31500, status: 'active', commission: 12, area: 'Heliopolis', phone: '+20 102 345 6789', joinedDate: '2022-11-01', todayOrders: 58 },
  { id: 'r4', name: 'Sushi Nile', nameAr: 'سوشي النيل', category: 'Sushi', rating: 4.6, totalOrders: 560, revenue: 16800, status: 'active', commission: 18, area: 'New Cairo', phone: '+20 103 456 7890', joinedDate: '2023-06-10', todayOrders: 15 },
  { id: 'r5', name: 'Koshary Time', nameAr: 'وقت الكشري', category: 'Egyptian', rating: 4.9, totalOrders: 3200, revenue: 12800, status: 'active', commission: 10, area: 'Downtown', phone: '+20 104 567 8901', joinedDate: '2022-08-05', todayOrders: 87 },
  { id: 'r6', name: 'Grillhouse', nameAr: 'بيت الجريل', category: 'Grills', rating: 4.3, totalOrders: 720, revenue: 21600, status: 'inactive', commission: 15, area: 'Giza', phone: '+20 105 678 9012', joinedDate: '2023-04-18', todayOrders: 0 },
  { id: 'r7', name: 'Falafel Express', nameAr: 'فلافل إكسبريس', category: 'Egyptian', rating: 4.4, totalOrders: 1560, revenue: 9360, status: 'active', commission: 10, area: 'Nasr City', phone: '+20 106 789 0123', joinedDate: '2022-12-01', todayOrders: 42 },
  { id: 'r8', name: 'Pasta Bella', nameAr: 'باستا بيلا', category: 'Italian', rating: 4.2, totalOrders: 390, revenue: 11700, status: 'suspended', commission: 15, area: 'Zamalek', phone: '+20 107 890 1234', joinedDate: '2023-07-22', todayOrders: 0 },
];

// ─── Riders ─────────────────────────────────────────────────────────────────
export const mockRiders: Rider[] = [
  { id: 'rd1', name: 'Ahmed Hassan', nameAr: 'أحمد حسن', phone: '+20 111 111 1111', area: 'Maadi', status: 'on_delivery', totalDeliveries: 892, todayDeliveries: 12, rating: 4.8, vehicle: 'Motorcycle', earnings: 1240, joinedDate: '2022-09-01' },
  { id: 'rd2', name: 'Mohamed Ali', nameAr: 'محمد علي', phone: '+20 112 222 2222', area: 'Heliopolis', status: 'online', totalDeliveries: 654, todayDeliveries: 8, rating: 4.6, vehicle: 'Motorcycle', earnings: 980, joinedDate: '2023-01-15' },
  { id: 'rd3', name: 'Khaled Samir', nameAr: 'خالد سمير', phone: '+20 113 333 3333', area: 'Zamalek', status: 'offline', totalDeliveries: 1203, todayDeliveries: 0, rating: 4.9, vehicle: 'Bicycle', earnings: 1560, joinedDate: '2022-06-20' },
  { id: 'rd4', name: 'Omar Tarek', nameAr: 'عمر طارق', phone: '+20 114 444 4444', area: 'New Cairo', status: 'on_delivery', totalDeliveries: 445, todayDeliveries: 6, rating: 4.5, vehicle: 'Motorcycle', earnings: 720, joinedDate: '2023-03-10' },
  { id: 'rd5', name: 'Youssef Nabil', nameAr: 'يوسف نبيل', phone: '+20 115 555 5555', area: 'Giza', status: 'online', totalDeliveries: 778, todayDeliveries: 10, rating: 4.7, vehicle: 'Motorcycle', earnings: 1100, joinedDate: '2022-11-05' },
  { id: 'rd6', name: 'Mostafa Ibrahim', nameAr: 'مصطفى إبراهيم', phone: '+20 116 666 6666', area: 'Downtown', status: 'online', totalDeliveries: 334, todayDeliveries: 5, rating: 4.4, vehicle: 'Motorcycle', earnings: 580, joinedDate: '2023-05-18' },
  { id: 'rd7', name: 'Amr Gamal', nameAr: 'عمرو جمال', phone: '+20 117 777 7777', area: 'Nasr City', status: 'on_delivery', totalDeliveries: 1089, todayDeliveries: 14, rating: 4.8, vehicle: 'Motorcycle', earnings: 1380, joinedDate: '2022-08-12' },
];

// ─── Orders ──────────────────────────────────────────────────────────────────
const now = new Date();
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60000);

export const generateMockOrders = (): Order[] => [
  { id: 'o1', orderNumber: '#ETL-4521', customer: 'Sara Ahmed', phone: '+20 100 000 0001', restaurant: 'Burger Palace', rider: 'Ahmed Hassan', riderId: 'rd1', items: [{ name: 'Double Burger', qty: 2, price: 85 }, { name: 'Fries', qty: 2, price: 30 }], total: 230, status: 'dispatched', paymentMethod: 'card', paymentStatus: 'paid', address: '12 Nile Corniche, Maadi', createdAt: minutesAgo(8), estimatedTime: 25, area: 'Maadi' },
  { id: 'o2', orderNumber: '#ETL-4520', customer: 'Tamer Magdy', phone: '+20 100 000 0002', restaurant: 'Shawarma King', rider: null, riderId: null, items: [{ name: 'Shawarma Wrap', qty: 3, price: 55 }], total: 165, status: 'pending', paymentMethod: 'cash', paymentStatus: 'pending', address: '45 El Thawra St, Heliopolis', createdAt: minutesAgo(3), estimatedTime: 30, area: 'Heliopolis' },
  { id: 'o3', orderNumber: '#ETL-4519', customer: 'Nour El-Din', phone: '+20 100 000 0003', restaurant: 'Pizza Heaven', rider: 'Omar Tarek', riderId: 'rd4', items: [{ name: 'Margherita Large', qty: 1, price: 120 }, { name: 'Pepsi', qty: 2, price: 15 }], total: 150, status: 'preparing', paymentMethod: 'wallet', paymentStatus: 'paid', address: '8 Hassan Maamon, New Cairo', createdAt: minutesAgo(15), estimatedTime: 20, area: 'New Cairo' },
  { id: 'o4', orderNumber: '#ETL-4518', customer: 'Laila Hassan', phone: '+20 100 000 0004', restaurant: 'Koshary Time', rider: 'Amr Gamal', riderId: 'rd7', items: [{ name: 'Large Koshary', qty: 2, price: 25 }, { name: 'Daura', qty: 1, price: 10 }], total: 60, status: 'delivered', paymentMethod: 'cash', paymentStatus: 'paid', address: '3 Tahrir Sq, Downtown', createdAt: minutesAgo(45), estimatedTime: 15, area: 'Downtown' },
  { id: 'o5', orderNumber: '#ETL-4517', customer: 'Karim Fawzy', phone: '+20 100 000 0005', restaurant: 'Sushi Nile', rider: null, riderId: null, items: [{ name: 'Salmon Roll x8', qty: 1, price: 180 }, { name: 'Miso Soup', qty: 2, price: 40 }], total: 260, status: 'accepted', paymentMethod: 'card', paymentStatus: 'paid', address: '17 90th St, New Cairo', createdAt: minutesAgo(5), estimatedTime: 35, area: 'New Cairo' },
  { id: 'o6', orderNumber: '#ETL-4516', customer: 'Hana Mostafa', phone: '+20 100 000 0006', restaurant: 'Burger Palace', rider: null, riderId: null, items: [{ name: 'Crispy Chicken', qty: 1, price: 75 }], total: 75, status: 'cancelled', paymentMethod: 'card', paymentStatus: 'failed', address: '22 Road 9, Maadi', createdAt: minutesAgo(60), estimatedTime: 25, area: 'Maadi' },
  { id: 'o7', orderNumber: '#ETL-4515', customer: 'Walid Fares', phone: '+20 100 000 0007', restaurant: 'Falafel Express', rider: 'Youssef Nabil', riderId: 'rd5', items: [{ name: 'Falafel Box', qty: 4, price: 35 }, { name: 'Hummus', qty: 2, price: 20 }], total: 180, status: 'dispatched', paymentMethod: 'cash', paymentStatus: 'pending', address: '11 Makram Ebeid, Nasr City', createdAt: minutesAgo(22), estimatedTime: 20, area: 'Nasr City' },
  { id: 'o8', orderNumber: '#ETL-4514', customer: 'Dina Khalil', phone: '+20 100 000 0008', restaurant: 'Grillhouse', rider: 'Mohamed Ali', riderId: 'rd2', items: [{ name: 'Mixed Grill', qty: 1, price: 220 }, { name: 'Bread', qty: 4, price: 10 }], total: 260, status: 'delivered', paymentMethod: 'card', paymentStatus: 'paid', address: '5 Al Bahr, Zamalek', createdAt: minutesAgo(90), estimatedTime: 30, area: 'Zamalek' },
];

export const getDashboardStats = (): DashboardStats => ({
  totalOrdersToday: 247,
  totalRevenue: 18640,
  activeRiders: 5,
  activeRestaurants: 6,
  pendingOrders: 12,
  deliveredToday: 198,
  cancelledToday: 18,
  avgDeliveryTime: 28,
  revenueGrowth: 12.4,
  ordersGrowth: 8.7,
});

export const getWeeklyData = () => [
  { day: 'Mon', orders: 180, revenue: 13500 },
  { day: 'Tue', orders: 210, revenue: 15750 },
  { day: 'Wed', orders: 195, revenue: 14625 },
  { day: 'Thu', orders: 230, revenue: 17250 },
  { day: 'Fri', orders: 280, revenue: 21000 },
  { day: 'Sat', orders: 310, revenue: 23250 },
  { day: 'Sun', orders: 247, revenue: 18525 },
];
