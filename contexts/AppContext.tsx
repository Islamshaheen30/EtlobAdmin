import React, { createContext, useState, ReactNode } from 'react';
import { Colors } from '@/constants/theme';

type Theme = 'dark' | 'light';
type Language = 'en' | 'ar';

interface ThemeColors {
  bg: string;
  surface: string;
  card: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  icon: string;
  inputBg: string;
  overlay: string;
  tabBar: string;
  tabBorder: string;
}

interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  language: Language;
  toggleLanguage: () => void;
  isRTL: boolean;
  t: (key: string) => string;
  colors: ThemeColors;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard',
    orders: 'Orders',
    restaurants: 'Restaurants',
    riders: 'Riders',
    analytics: 'Analytics',
    totalOrders: 'Total Orders',
    revenue: 'Revenue',
    activeRiders: 'Active Riders',
    activeRestaurants: 'Active Restaurants',
    pendingOrders: 'Pending Orders',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    avgDeliveryTime: 'Avg. Delivery Time',
    recentOrders: 'Recent Orders',
    quickStats: 'Quick Stats',
    orderStatus: 'Order Status',
    pending: 'Pending',
    accepted: 'Accepted',
    preparing: 'Preparing',
    dispatched: 'Dispatched',
    deliveredStatus: 'Delivered',
    cancelledStatus: 'Cancelled',
    assignRider: 'Assign Rider',
    viewDetails: 'View Details',
    search: 'Search...',
    allStatuses: 'All',
    customer: 'Customer',
    restaurant: 'Restaurant',
    rider: 'Rider',
    total: 'Total',
    paymentMethod: 'Payment',
    paymentStatus: 'Payment Status',
    address: 'Address',
    orderTime: 'Order Time',
    estimatedTime: 'Est. Time',
    min: 'min',
    egp: 'EGP',
    paid: 'Paid',
    unpaid: 'Unpaid',
    failed: 'Failed',
    cash: 'Cash',
    card: 'Card',
    wallet: 'Wallet',
    active: 'Active',
    inactive: 'Inactive',
    suspended: 'Suspended',
    online: 'Online',
    offline: 'Offline',
    onDelivery: 'On Delivery',
    totalDeliveries: 'Total Deliveries',
    todayDeliveries: "Today's Deliveries",
    rating: 'Rating',
    earnings: 'Earnings',
    commission: 'Commission',
    category: 'Category',
    area: 'Area',
    phone: 'Phone',
    joinedDate: 'Joined',
    todayOrders: "Today's Orders",
    weeklyOverview: 'Weekly Overview',
    topRestaurants: 'Top Restaurants',
    orderBreakdown: 'Order Breakdown',
    growth: 'Growth',
    vs: 'vs last week',
    noOrders: 'No orders found',
    noRiders: 'No riders found',
    noRestaurants: 'No restaurants found',
    minutes: 'minutes',
    liveOrders: 'Live Orders',
    dispatch: 'Dispatch',
    verify: 'Verify Payment',
    cancel: 'Cancel Order',
    etlobAdmin: 'Etlob Admin',
    hello: 'Hello, Admin',
    todayDate: 'Today',
    items: 'items',
    signIn: 'Sign In',
    signInSub: 'Admin & Rider access only',
    email: 'Email',
    password: 'Password',
    logout: 'Logout',
    logoutConfirm: 'Are you sure you want to logout?',
    cancel: 'Cancel',
    error: 'Error',
    success: 'Success',
    fillAllFields: 'Please fill in all required fields.',
    loginFailed: 'Login Failed',
    loginError: 'Invalid credentials or account not found.',
    accessDenied: 'Access Denied',
    notAuthorized: 'Your account is not authorized for this panel.',
    revenueGrowth: 'Revenue Growth',
    ordersGrowth: 'Orders Growth',
    active: 'Active',
    staff: 'Staff',
    staffManagement: 'Staff Management',
    deliveryPricing: 'Delivery Pricing',
    accountant: 'Accountant',
    callCenter: 'Call Center',
    ownerUsername: 'Owner Username',
    ownerPassword: 'Owner Password',
    adminCommission: 'Admin Commission (EGP)',
    dailyClosingTime: 'Daily Closing Time',
    commissionEgp: 'Commission (EGP)',
    vehicleType: 'Vehicle Type',
    bicycle: 'Bicycle',
    motorcycle: 'Motorcycle',
    scooter: 'Scooter',
    flatRate: 'Flat Rate',
    distanceBased: 'Distance Based',
    archiveOrders: 'Archive Old Orders',
    pricePerKm: 'Price per km',
    flatFee: 'Flat Fee',
    minFee: 'Min Fee',
    maxFee: 'Max Fee',
  },
  ar: {
    dashboard: 'لوحة التحكم',
    orders: 'الطلبات',
    restaurants: 'المطاعم',
    riders: 'المناديب',
    analytics: 'التحليلات',
    totalOrders: 'إجمالي الطلبات',
    revenue: 'الإيرادات',
    activeRiders: 'المناديب النشطون',
    activeRestaurants: 'المطاعم النشطة',
    pendingOrders: 'طلبات قيد الانتظار',
    delivered: 'تم التوصيل',
    cancelled: 'ملغية',
    avgDeliveryTime: 'متوسط وقت التوصيل',
    recentOrders: 'الطلبات الأخيرة',
    quickStats: 'إحصائيات سريعة',
    orderStatus: 'حالة الطلب',
    pending: 'قيد الانتظار',
    accepted: 'مقبول',
    preparing: 'قيد التحضير',
    dispatched: 'تم الإرسال',
    deliveredStatus: 'تم التوصيل',
    cancelledStatus: 'ملغي',
    assignRider: 'تعيين مندوب',
    viewDetails: 'عرض التفاصيل',
    search: 'بحث...',
    allStatuses: 'الكل',
    customer: 'العميل',
    restaurant: 'المطعم',
    rider: 'المندوب',
    total: 'الإجمالي',
    paymentMethod: 'طريقة الدفع',
    paymentStatus: 'حالة الدفع',
    address: 'العنوان',
    orderTime: 'وقت الطلب',
    estimatedTime: 'الوقت المتوقع',
    min: 'دقيقة',
    egp: 'ج.م',
    paid: 'مدفوع',
    unpaid: 'غير مدفوع',
    failed: 'فشل',
    cash: 'نقدي',
    card: 'بطاقة',
    wallet: 'محفظة',
    active: 'نشط',
    inactive: 'غير نشط',
    suspended: 'موقوف',
    online: 'متصل',
    offline: 'غير متصل',
    onDelivery: 'في رحلة',
    totalDeliveries: 'إجمالي التوصيلات',
    todayDeliveries: 'توصيلات اليوم',
    rating: 'التقييم',
    earnings: 'الأرباح',
    commission: 'العمولة',
    category: 'التصنيف',
    area: 'المنطقة',
    phone: 'الهاتف',
    joinedDate: 'تاريخ الانضمام',
    todayOrders: 'طلبات اليوم',
    weeklyOverview: 'نظرة أسبوعية',
    topRestaurants: 'أفضل المطاعم',
    orderBreakdown: 'تفاصيل الطلبات',
    growth: 'النمو',
    vs: 'مقارنة بالأسبوع الماضي',
    noOrders: 'لا توجد طلبات',
    noRiders: 'لا يوجد مناديب',
    noRestaurants: 'لا توجد مطاعم',
    minutes: 'دقائق',
    liveOrders: 'الطلبات الحية',
    dispatch: 'إرسال',
    verify: 'تحقق من الدفع',
    cancel: 'إلغاء الطلب',
    etlobAdmin: 'إدارة أطلب',
    hello: 'مرحباً، المشرف',
    todayDate: 'اليوم',
    items: 'عناصر',
    signIn: 'تسجيل الدخول',
    signInSub: 'للمشرفين والمناديب فقط',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    logout: 'تسجيل الخروج',
    logoutConfirm: 'هل أنت متأكد من تسجيل الخروج؟',
    cancel: 'إلغاء',
    error: 'خطأ',
    success: 'نجاح',
    fillAllFields: 'يرجى ملء جميع الحقول المطلوبة.',
    loginFailed: 'فشل تسجيل الدخول',
    loginError: 'بيانات غير صحيحة أو الحساب غير موجود.',
    accessDenied: 'رفض الوصول',
    notAuthorized: 'حسابك غير مصرح له بالوصول.',
    revenueGrowth: 'نمو الإيرادات',
    ordersGrowth: 'نمو الطلبات',
    active: 'نشط',
    staff: 'الموظفون',
    staffManagement: 'إدارة الموظفين',
    deliveryPricing: 'تسعيرة التوصيل',
    accountant: 'محاسب',
    callCenter: 'خدمة عملاء',
    ownerUsername: 'اسم مستخدم المالك',
    ownerPassword: 'كلمة مرور المالك',
    adminCommission: 'عمولة الإدارة (ج.م)',
    dailyClosingTime: 'وقت الإغلاق اليومي',
    commissionEgp: 'العمولة (ج.م)',
    vehicleType: 'نوع المركبة',
    bicycle: 'دراجة هوائية',
    motorcycle: 'دراجة نارية',
    scooter: 'سكوتر',
    flatRate: 'سعر ثابت',
    distanceBased: 'حسب المسافة',
    archiveOrders: 'أرشفة الطلبات القديمة',
    pricePerKm: 'سعر الكيلومتر',
    flatFee: 'رسوم ثابتة',
    minFee: 'حد أدنى',
    maxFee: 'حد أقصى',
  },
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [language, setLanguage] = useState<Language>('en');

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  const toggleLanguage = () => setLanguage(l => (l === 'en' ? 'ar' : 'en'));

  const isRTL = language === 'ar';

  const t = (key: string): string => translations[language][key] || key;

  const colors: ThemeColors = theme === 'dark' ? Colors.dark : Colors.light;

  return (
    <AppContext.Provider value={{ theme, toggleTheme, language, toggleLanguage, isRTL, t, colors }}>
      {children}
    </AppContext.Provider>
  );
}
