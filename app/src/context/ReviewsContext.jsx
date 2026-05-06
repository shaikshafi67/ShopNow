import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useOrders } from './OrdersContext';

const ReviewsContext = createContext(null);
export function useReviews() {
  const ctx = useContext(ReviewsContext);
  if (!ctx) throw new Error('useReviews must be used within ReviewsProvider');
  return ctx;
}

const toApp = (r) => ({
  id:        r.id,
  productId: r.product_id,
  userId:    r.user_id,
  userName:  r.user_name,
  rating:    r.rating,
  title:     r.title,
  body:      r.body,
  verified:  r.verified,
  createdAt: r.created_at,
});

export function ReviewsProvider({ children }) {
  const { user } = useAuth();
  const { orders } = useOrders();
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    supabase.from('reviews').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setReviews((data ?? []).map(toApp)));
  }, []);

  const hasPurchased = useCallback((productId) => {
    if (!user) return false;
    return orders.some((o) => o.userId === user.id && o.status !== 'cancelled' && o.items.some((it) => it.productId === productId));
  }, [orders, user]);

  const forProduct = useCallback((productId) => reviews
    .filter((r) => r.productId === productId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  [reviews]);

  const summary = useCallback((productId) => {
    const list = reviews.filter((r) => r.productId === productId);
    if (list.length === 0) return { count: 0, avg: 0, breakdown: [0,0,0,0,0] };
    const breakdown = [0,0,0,0,0];
    list.forEach((r) => { breakdown[Math.min(4, Math.max(0, Math.round(r.rating) - 1))]++; });
    const avg = list.reduce((s, r) => s + r.rating, 0) / list.length;
    return { count: list.length, avg: Math.round(avg * 10) / 10, breakdown };
  }, [reviews]);

  const submit = useCallback(async ({ productId, rating, title, body }) => {
    if (!user) throw new Error('You must be signed in to leave a review.');
    if (!rating || rating < 1 || rating > 5) throw new Error('Please pick a rating from 1 to 5.');
    if (!body?.trim()) throw new Error('Please write a short review.');

    const { data, error } = await supabase.from('reviews').insert({
      product_id: productId,
      user_id:    user.id,
      user_name:  user.name || 'Anonymous',
      rating,
      title:      (title || '').trim(),
      body:       body.trim(),
      verified:   hasPurchased(productId),
    }).select().single();

    if (error) throw new Error(error.message);
    const review = toApp(data);
    setReviews((arr) => [review, ...arr]);
    return review;
  }, [user, hasPurchased]);

  const remove = useCallback(async (reviewId) => {
    await supabase.from('reviews').delete().eq('id', reviewId);
    setReviews((arr) => arr.filter((r) => r.id !== reviewId));
  }, []);

  const all = useMemo(() => reviews, [reviews]);

  return (
    <ReviewsContext.Provider value={{ all, forProduct, summary, submit, remove, hasPurchased }}>
      {children}
    </ReviewsContext.Provider>
  );
}
