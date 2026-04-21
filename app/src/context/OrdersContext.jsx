import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { read, write, uid } from '../utils/storage';
import { addDays, orderId as makeOrderId } from '../utils/format';
import { useAuth } from './AuthContext';

const OrdersContext = createContext(null);
export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider');
  return ctx;
}

export const ORDER_STAGES = [
  { id: 'placed', label: 'Order Placed' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'packed', label: 'Packed' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'out_for_delivery', label: 'Out for Delivery' },
  { id: 'delivered', label: 'Delivered' },
];

export const ORDER_STATUS_OPTIONS = [...ORDER_STAGES.map((s) => s.id), 'cancelled'];

export function OrdersProvider({ children }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState(() => read('orders', []));
  useEffect(() => { write('orders', orders); }, [orders]);

  const placeOrder = useCallback(({ items, totals, address, payment }) => {
    const now = new Date();
    const order = {
      id: uid('ord'),
      number: makeOrderId(),
      userId: user?.id || null,
      userEmail: user?.email || (address?.email ?? 'guest@shopnow.local'),
      items,
      totals,
      address,
      payment,
      status: 'placed',
      createdAt: now.toISOString(),
      estimatedDelivery: addDays(now, 5).toISOString(),
      timeline: [{ stage: 'placed', at: now.toISOString() }],
    };
    setOrders((arr) => [order, ...arr]);
    return order;
  }, [user]);

  const updateStatus = useCallback((orderId, status) => {
    setOrders((arr) => arr.map((o) => {
      if (o.id !== orderId) return o;
      const timeline = [...(o.timeline || []), { stage: status, at: new Date().toISOString() }];
      return { ...o, status, timeline };
    }));
  }, []);

  const cancel = useCallback((orderId) => {
    updateStatus(orderId, 'cancelled');
  }, [updateStatus]);

  const removeOrder = useCallback((orderId) => {
    setOrders((arr) => arr.filter((o) => o.id !== orderId));
  }, []);

  const myOrders = useMemo(() => {
    if (!user) return [];
    return orders.filter((o) => o.userId === user.id);
  }, [orders, user]);

  const findById = useCallback((id) => orders.find((o) => o.id === id || o.number === id), [orders]);

  const value = {
    orders,
    myOrders,
    placeOrder,
    updateStatus,
    cancel,
    removeOrder,
    findById,
  };
  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}
