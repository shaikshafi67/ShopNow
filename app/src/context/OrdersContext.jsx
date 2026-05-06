import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { addDays, orderId as makeOrderId } from '../utils/format';
import { useAuth } from './AuthContext';

const OrdersContext = createContext(null);
export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider');
  return ctx;
}

export const ORDER_STATUS_OPTIONS = [
  'placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled',
];

export const ORDER_STAGES = [
  { id: 'placed',           label: 'Order Placed' },
  { id: 'confirmed',        label: 'Confirmed' },
  { id: 'packed',           label: 'Packed' },
  { id: 'shipped',          label: 'Shipped' },
  { id: 'out_for_delivery', label: 'Out for Delivery' },
  { id: 'delivered',        label: 'Delivered' },
];

const toApp = (row, items = []) => ({
  id:                row.id,
  number:            row.number,
  userId:            row.user_id,
  userEmail:         row.user_email,
  status:            row.status,
  totals: {
    subtotal: Number(row.subtotal),
    original: Number(row.original_total),
    savings:  Number(row.savings),
    shipping: Number(row.shipping),
    tax:      Number(row.tax),
    total:    Number(row.total),
  },
  address:           row.address,
  payment:           row.payment,
  timeline:          row.timeline ?? [],
  estimatedDelivery: row.estimated_delivery,
  createdAt:         row.created_at,
  items:             items.map(i => ({
    _key:          `${i.product_id}::${i.size ?? ''}::${i.color_index ?? 0}`,
    productId:     i.product_id,
    name:          i.name,
    price:         Number(i.price),
    originalPrice: Number(i.original_price),
    image:         i.image,
    size:          i.size,
    color:         i.color_index,
    colorHex:      i.color_hex,
    qty:           i.qty,
  })),
});

export function OrdersProvider({ children }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  const load = useCallback(async () => {
    if (!user) { setOrders([]); return; }

    const query = user.role === 'admin'
      ? supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false })
      : supabase.from('orders').select('*, order_items(*)').eq('user_id', user.id).order('created_at', { ascending: false });

    const { data } = await query;
    setOrders((data ?? []).map(o => toApp(o, o.order_items)));
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const placeOrder = useCallback(async ({ items, totals, address, payment }) => {
    if (!user) throw new Error('Must be logged in to place an order');

    const number = makeOrderId();
    const now    = new Date().toISOString();
    const timeline = [{ stage: 'placed', at: now }];

    const { data: order, error } = await supabase.from('orders').insert({
      number,
      user_id:           user.id,
      user_email:        user.email,
      status:            'placed',
      subtotal:          totals.subtotal,
      original_total:    totals.original ?? totals.subtotal,
      savings:           totals.savings ?? 0,
      shipping:          totals.shipping,
      tax:               totals.tax,
      total:             totals.total,
      address:           address,
      payment:           payment,
      timeline,
      estimated_delivery: addDays(new Date(), 5).toISOString(),
    }).select().single();

    if (error) throw new Error(error.message);

    await supabase.from('order_items').insert(
      items.map(it => ({
        order_id:       order.id,
        product_id:     it.productId ?? null,
        name:           it.name,
        price:          it.price,
        original_price: it.originalPrice,
        image:          it.image,
        size:           it.size,
        color_index:    it.color,
        color_hex:      it.colorHex,
        qty:            it.qty,
      }))
    );

    const appOrder = toApp(order, items.map(it => ({
      product_id: it.productId, name: it.name, price: it.price,
      original_price: it.originalPrice, image: it.image,
      size: it.size, color_index: it.color, color_hex: it.colorHex, qty: it.qty,
    })));

    setOrders(prev => [appOrder, ...prev]);
    return appOrder;
  }, [user]);

  const updateStatus = useCallback(async (orderId, status) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const timeline = [...(order.timeline ?? []), { stage: status, at: new Date().toISOString() }];
    await supabase.from('orders').update({ status, timeline }).eq('id', orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, timeline } : o));
  }, [orders]);

  const myOrders  = useMemo(() => user ? orders.filter(o => o.userId === user.id) : [], [orders, user]);
  const findById  = useCallback((id) => orders.find(o => o.id === id) ?? null, [orders]);
  const cancel    = useCallback((id) => updateStatus(id, 'cancelled'), [updateStatus]);

  return (
    <OrdersContext.Provider value={{ orders, myOrders, loading: false, placeOrder, updateStatus, findById, cancel, reload: load }}>
      {children}
    </OrdersContext.Provider>
  );
}
