import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { read, write, uid } from '../utils/storage';
import { useAuth } from './AuthContext';
import { useOrders } from './OrdersContext';

const ReviewsContext = createContext(null);
export function useReviews() {
  const ctx = useContext(ReviewsContext);
  if (!ctx) throw new Error('useReviews must be used within ReviewsProvider');
  return ctx;
}

export function ReviewsProvider({ children }) {
  const { user } = useAuth();
  const { orders } = useOrders();
  const [reviews, setReviews] = useState(() => read('reviews', []));
  useEffect(() => { write('reviews', reviews); }, [reviews]);

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

  const submit = useCallback(({ productId, rating, title, body }) => {
    if (!user) throw new Error('You must be signed in to leave a review.');
    if (!rating || rating < 1 || rating > 5) throw new Error('Please pick a rating from 1 to 5.');
    if (!body?.trim()) throw new Error('Please write a short review.');
    const review = {
      id: uid('rev'),
      productId,
      userId: user.id,
      userName: user.name,
      rating,
      title: (title || '').trim(),
      body: body.trim(),
      verified: hasPurchased(productId),
      createdAt: new Date().toISOString(),
    };
    setReviews((arr) => [review, ...arr]);
    return review;
  }, [user, hasPurchased]);

  const remove = useCallback((reviewId) => {
    setReviews((arr) => arr.filter((r) => r.id !== reviewId));
  }, []);

  const all = useMemo(() => reviews, [reviews]);

  return (
    <ReviewsContext.Provider value={{ all, forProduct, summary, submit, remove, hasPurchased }}>
      {children}
    </ReviewsContext.Provider>
  );
}
