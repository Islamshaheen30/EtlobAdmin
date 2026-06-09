import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { generateMockOrders, Order, OrderStatus } from '@/services/mockData';

interface OrdersContextType {
  orders: Order[];
  assignRider: (orderId: string, riderId: string, riderName: string) => void;
  updateStatus: (orderId: string, status: OrderStatus) => void;
  verifyPayment: (orderId: string) => void;
  cancelOrder: (orderId: string) => void;
  newOrderCount: number;
  clearNewOrderCount: () => void;
}

export const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(generateMockOrders());
  const [newOrderCount, setNewOrderCount] = useState(0);

  // Simulate incoming orders every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      const newOrder: Order = {
        id: `o_${Date.now()}`,
        orderNumber: `#ETL-${4522 + Math.floor(Math.random() * 100)}`,
        customer: ['Mona Sherif', 'Hassan Fahmy', 'Rania Adel', 'Sameh Gamal'][Math.floor(Math.random() * 4)],
        phone: '+20 100 999 0000',
        restaurant: ['Burger Palace', 'Shawarma King', 'Koshary Time', 'Pizza Heaven'][Math.floor(Math.random() * 4)],
        rider: null,
        riderId: null,
        items: [{ name: 'Special Item', qty: 1, price: Math.floor(Math.random() * 150) + 50 }],
        total: Math.floor(Math.random() * 200) + 60,
        status: 'pending',
        paymentMethod: ['cash', 'card', 'wallet'][Math.floor(Math.random() * 3)] as any,
        paymentStatus: 'pending',
        address: 'Cairo, Egypt',
        createdAt: new Date(),
        estimatedTime: 25 + Math.floor(Math.random() * 15),
        area: ['Maadi', 'Heliopolis', 'Zamalek', 'New Cairo'][Math.floor(Math.random() * 4)],
      };
      setOrders(prev => [newOrder, ...prev]);
      setNewOrderCount(c => c + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const assignRider = (orderId: string, riderId: string, riderName: string) => {
    setOrders(prev =>
      prev.map(o =>
        o.id === orderId ? { ...o, rider: riderName, riderId, status: 'dispatched' } : o
      )
    );
  };

  const updateStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status } : o)));
  };

  const verifyPayment = (orderId: string) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, paymentStatus: 'paid' } : o))
    );
  };

  const cancelOrder = (orderId: string) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: 'cancelled' } : o))
    );
  };

  const clearNewOrderCount = () => setNewOrderCount(0);

  return (
    <OrdersContext.Provider
      value={{ orders, assignRider, updateStatus, verifyPayment, cancelOrder, newOrderCount, clearNewOrderCount }}
    >
      {children}
    </OrdersContext.Provider>
  );
}
