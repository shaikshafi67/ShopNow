import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { uid } from '../utils/storage';
import { get, set } from '../utils/idb';
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

// Persist helper — always saves immediately to IndexedDB
function persist(orders) {
  set('orders', orders).catch((err) => console.error('Failed to save orders', err));
}

export function OrdersProvider({ children }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  // Track whether the initial async load has completed so saves are guarded
  const ready = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const stored = await get('orders');
        if (!cancelled) {
          if (stored && Array.isArray(stored) && stored.length > 0) {
            setOrders(stored);
          }
          ready.current = true;
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load orders', err);
        if (!cancelled) {
          ready.current = true;
          setLoading(false);
        }
      }
    }
    init();
    // Cleanup: ignore stale async result on StrictMode remount
    return () => { cancelled = true; };
  }, []);

  // Save whenever orders change, but only after initial load
  useEffect(() => {
    if (ready.current) {
      persist(orders);
    }
  }, [orders]);

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
    setOrders((arr) => {
      const next = [order, ...arr];
      // Save immediately regardless of ready flag — order must never be lost
      persist(next);
      return next;
    });
    return order;
  }, [user]);

  const updateStatus = useCallback((orderId, status) => {
    setOrders((arr) => {
      const next = arr.map((o) => {
        if (o.id !== orderId) return o;
        const timeline = [...(o.timeline || []), { stage: status, at: new Date().toISOString() }];
        return { ...o, status, timeline };
      });
      persist(next);
      return next;
    });
  }, []);

  const cancel = useCallback((orderId) => {
    updateStatus(orderId, 'cancelled');
  }, [updateStatus]);

  const removeOrder = useCallback((orderId) => {
    setOrders((arr) => {
      const next = arr.filter((o) => o.id !== orderId);
      persist(next);
      return next;
    });
  }, []);

  // Match by userId OR email so orders always appear even if session drifted
  const myOrders = useMemo(() => {
    if (!user) return [];
    return orders.filter(
      (o) => o.userId === user.id || (user.email && o.userEmail === user.email),
    );
  }, [orders, user]);

  const findById = useCallback(
    (id) => orders.find((o) => o.id === id || o.number === id),
    [orders],
  );

  const value = {
    orders,
    myOrders,
    loading,
    placeOrder,
    updateStatus,
    cancel,
    removeOrder,
    findById,
  };
  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}
