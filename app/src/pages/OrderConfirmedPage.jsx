import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, Package, Truck, MapPin, Clock, ShoppingBag,
  Bell, ArrowRight, Star, Home, ChevronRight,
} from 'lucide-react';
import { useOrders } from '../context/OrdersContext';
import { inr, shortDate, addDays } from '../utils/format';

// ─── Confetti ────────────────────────────────────────────────────────────────
const COLORS = ['#7c6aff','#ff6a9a','#f59e0b','#22c55e','#3b82f6','#ec4899','#a855f7','#06b6d4'];

function Confetti() {
  const pieces = useMemo(() =>
    Array.from({ length: 72 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 2 + Math.random() * 1.5,
      color: COLORS[i % COLORS.length],
      size: 5 + Math.random() * 9,
      rotate: Math.random() * 360,
      shape: i % 3,
    }))
  , []);

  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
      {pieces.map(p => (
        <motion.div
          key={p.id}
          initial={{ y: -10, x:`${p.x}vw`, opacity:1, rotate:p.rotate }}
          animate={{ y:'105vh', opacity:[1,1,0.5,0], rotate: p.rotate + 540 * (p.id % 2 ? 1:-1) }}
          transition={{ duration:p.duration, delay:p.delay, ease:'easeIn' }}
          style={{
            position:'absolute', top:0,
            width: p.shape===2 ? p.size*2.2 : p.size,
            height: p.size,
            borderRadius: p.shape===1 ? '50%' : p.shape===2 ? 3 : 2,
            background: p.color,
          }}
        />
      ))}
    </div>
  );
}

// ─── Order Timeline Steps ────────────────────────────────────────────────────
const TIMELINE_STEPS = [
  { id:'placed',           label:'Order Placed',      icon:CheckCircle, color:'#22c55e' },
  { id:'confirmed',        label:'Confirmed',          icon:CheckCircle, color:'#7c6aff' },
  { id:'packed',           label:'Packed',             icon:Package,     color:'#7c6aff' },
  { id:'shipped',          label:'Shipped',            icon:Truck,       color:'#7c6aff' },
  { id:'out_for_delivery', label:'Out for Delivery',   icon:Truck,       color:'#f59e0b' },
  { id:'delivered',        label:'Delivered',          icon:CheckCircle, color:'#22c55e' },
];

const STATUS_ORDER = ['placed','confirmed','packed','shipped','out_for_delivery','delivered'];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OrderConfirmedPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { findById, orders } = useOrders();

  // Get state passed from checkout (instant, before DB re-fetch)
  const passedState = location.state || {};

  // Try to find order in context; fall back to passed state
  const [order, setOrder] = useState(() => (id ? findById(id) : null));

  useEffect(() => {
    if (!id) return;
    const found = findById(id);
    if (found) setOrder(found);
  }, [id, orders, findById]);

  // Bell pulse state — show notification bell animation
  const [bellRang, setBellRang] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setBellRang(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const isCOD = (order?.payment?.method ?? passedState.paymentMethod) === 'cod';
  const orderNumber = order?.number ?? passedState.orderNumber ?? '—';
  const total = order?.totals?.total ?? passedState.total ?? 0;
  const estimatedDelivery = order?.estimatedDelivery
    ? shortDate(order.estimatedDelivery)
    : shortDate(addDays(new Date(), 5));

  const currentStatusIdx = STATUS_ORDER.indexOf(order?.status ?? 'placed');

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(124,106,255,0.08) 0%, transparent 60%), var(--bg-primary)',
      paddingTop: 'calc(var(--nav-height) + 20px)',
      paddingBottom: 80,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <Confetti />

      {/* Background glow orbs */}
      <div style={{ position:'fixed', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(124,106,255,0.07) 0%, transparent 70%)', top:-100, left:'50%', transform:'translateX(-50%)', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,106,154,0.05) 0%, transparent 70%)', bottom:'20%', right:'5%', pointerEvents:'none', zIndex:0 }} />

      <div className="container" style={{ position:'relative', zIndex:1, maxWidth:680 }}>

        {/* ── Hero Section ── */}
        <motion.div
          initial={{ opacity:0, y:30 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.6, ease:[0.34,1.2,0.64,1] }}
          style={{ textAlign:'center', marginBottom:36 }}
        >
          {/* 3D floating icon */}
          <motion.div
            animate={{ y:[0,-12,0] }}
            transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
            style={{ display:'inline-block', marginBottom:12, position:'relative' }}
          >
            {/* Glow pulse ring */}
            <motion.div
              animate={{ scale:[1,1.3,1], opacity:[0.4,0.1,0.4] }}
              transition={{ duration:2.5, repeat:Infinity, ease:'easeInOut' }}
              style={{
                position:'absolute', width:160, height:160, borderRadius:'50%',
                background:'radial-gradient(circle, rgba(124,106,255,0.3) 0%, transparent 70%)',
                top:'50%', left:'50%', transform:'translate(-50%,-50%)',
                pointerEvents:'none',
              }}
            />
            {/* Circle backdrop */}
            <motion.div
              initial={{ scale:0, rotate:-20 }}
              animate={{ scale:1, rotate:0 }}
              transition={{ type:'spring', stiffness:220, damping:16, delay:0.15 }}
              style={{
                width:120, height:120, borderRadius:'50%',
                background:'linear-gradient(135deg, rgba(124,106,255,0.2) 0%, rgba(255,106,154,0.12) 100%)',
                border:'2px solid rgba(124,106,255,0.35)',
                display:'flex', alignItems:'center', justifyContent:'center',
                position:'relative', boxShadow:'0 0 40px rgba(124,106,255,0.2)',
              }}
            >
              {/* SVG animated ring */}
              <svg width="120" height="120" style={{ position:'absolute', top:0, left:0 }}>
                <motion.circle
                  cx="60" cy="60" r="55"
                  fill="none" stroke="url(#cg)" strokeWidth="2.5" strokeLinecap="round"
                  initial={{ pathLength:0 }}
                  animate={{ pathLength:1 }}
                  transition={{ duration:1.2, delay:0.3, ease:'easeOut' }}
                  strokeDasharray="1" strokeDashoffset="0"
                />
                <defs>
                  <linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7c6aff" />
                    <stop offset="100%" stopColor="#ff6a9a" />
                  </linearGradient>
                </defs>
              </svg>
              <Package size={50} color="#7c6aff" strokeWidth={1.4} />
            </motion.div>

            {/* Green checkmark badge */}
            <motion.div
              initial={{ scale:0 }}
              animate={{ scale:1 }}
              transition={{ type:'spring', stiffness:320, damping:16, delay:0.6 }}
              style={{
                position:'absolute', bottom:2, right:2,
                width:36, height:36, borderRadius:'50%',
                background:'linear-gradient(135deg, #22c55e, #16a34a)',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 0 16px rgba(34,197,94,0.55)',
              }}
            >
              <CheckCircle size={22} color="white" />
            </motion.div>
          </motion.div>

          {/* Bell notification animation */}
          <AnimatePresence>
            {bellRang && (
              <motion.div
                initial={{ scale:0, opacity:0, y:-20 }}
                animate={{ scale:1, opacity:1, y:0 }}
                exit={{ opacity:0 }}
                transition={{ type:'spring', stiffness:300, damping:18 }}
                style={{
                  display:'inline-flex', alignItems:'center', gap:8,
                  background:'rgba(124,106,255,0.12)', border:'1px solid rgba(124,106,255,0.3)',
                  borderRadius:50, padding:'6px 14px', marginBottom:16,
                }}
              >
                <motion.div
                  animate={{ rotate:[-20,20,-15,15,-10,10,0] }}
                  transition={{ duration:0.7, delay:0.1 }}
                >
                  <Bell size={14} color="#7c6aff" fill="rgba(124,106,255,0.3)" />
                </motion.div>
                <span style={{ fontSize:12, color:'#7c6aff', fontWeight:700 }}>
                  Order notification sent to your account
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.h1
            initial={{ opacity:0, y:16 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:0.45, duration:0.5 }}
            style={{
              fontFamily:'var(--font-display)',
              fontSize:'clamp(30px, 6vw, 42px)',
              fontWeight:900, lineHeight:1.1, marginBottom:10,
              background:'linear-gradient(135deg, #7c6aff 0%, #ff6a9a 100%)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              backgroundClip:'text',
            }}
          >
            🎉 Order Confirmed!
          </motion.h1>

          <motion.p
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            transition={{ delay:0.6 }}
            style={{ color:'var(--text-secondary)', fontSize:15, lineHeight:1.7, maxWidth:400, margin:'0 auto' }}
          >
            {isCOD
              ? 'Your order is placed! Pay in cash when your package arrives. We\'ll keep you updated.'
              : 'Payment received and your order is confirmed. Sit back while we prepare your items!'}
          </motion.p>
        </motion.div>

        {/* ── Order Summary Card ── */}
        <motion.div
          initial={{ opacity:0, y:24 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay:0.7, duration:0.5 }}
          style={{
            background:'var(--bg-card)',
            border:'1px solid rgba(124,106,255,0.2)',
            borderRadius:20, padding:'22px 24px', marginBottom:16,
            boxShadow:'0 8px 40px rgba(124,106,255,0.08)',
          }}
        >
          {/* Order number row */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, paddingBottom:14, borderBottom:'1px solid var(--border-glass)' }}>
            <div>
              <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:1.2, marginBottom:4 }}>Order Number</div>
              <div style={{ fontFamily:'monospace', fontSize:18, fontWeight:900, color:'var(--accent)', letterSpacing:1.5 }}>{orderNumber}</div>
            </div>
            <span style={{
              fontSize:12, fontWeight:700, padding:'5px 14px', borderRadius:20,
              background: isCOD ? 'rgba(249,115,22,0.15)' : 'rgba(34,197,94,0.15)',
              color: isCOD ? '#f97316' : '#22c55e',
              border: `1px solid ${isCOD ? 'rgba(249,115,22,0.3)' : 'rgba(34,197,94,0.3)'}`,
            }}>
              {isCOD ? '🚚 Cash on Delivery' : '✅ Paid Online'}
            </span>
          </div>

          {/* Key info grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
            {[
              { label:'Total Amount', value: inr(total), icon: null, highlight:true },
              { label:'Estimated Delivery', value: estimatedDelivery, icon: <Truck size={14} color="#7c6aff" /> },
            ].map(item => (
              <div key={item.label} style={{
                background:'var(--bg-glass)', borderRadius:12, padding:'12px 14px',
                border:'1px solid var(--border-glass)',
              }}>
                <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:0.8, marginBottom:6, display:'flex', alignItems:'center', gap:4 }}>
                  {item.icon} {item.label}
                </div>
                <div style={{ fontWeight:800, fontSize:16, fontFamily:'var(--font-display)', color: item.highlight ? 'var(--text-primary)' : 'var(--accent)' }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Items preview */}
          {order?.items?.length > 0 && (
            <div style={{ borderTop:'1px solid var(--border-glass)', paddingTop:14 }}>
              <div style={{ fontSize:12, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:10 }}>Items Ordered</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {order.items.map((it, i) => (
                  <motion.div
                    key={it._key ?? i}
                    initial={{ opacity:0, x:-12 }}
                    animate={{ opacity:1, x:0 }}
                    transition={{ delay:0.9 + i*0.06 }}
                    style={{ display:'flex', alignItems:'center', gap:12 }}
                  >
                    <div style={{
                      width:46, height:54, borderRadius:8, flexShrink:0,
                      background: it.image ? `url(${it.image}) center/cover no-repeat` : 'var(--bg-glass)',
                      border:'1px solid var(--border-glass)',
                    }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{it.name}</div>
                      <div style={{ color:'var(--text-muted)', fontSize:12 }}>Qty {it.qty}{it.size ? ` · ${it.size}` : ''}</div>
                    </div>
                    <div style={{ fontWeight:800, fontSize:14, flexShrink:0 }}>{inr(it.price * it.qty)}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Delivery Timeline ── */}
        <motion.div
          initial={{ opacity:0, y:24 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay:0.85, duration:0.5 }}
          style={{
            background:'var(--bg-card)',
            border:'1px solid var(--border-glass)',
            borderRadius:20, padding:'22px 24px', marginBottom:16,
          }}
        >
          <div style={{ fontSize:14, fontWeight:800, marginBottom:18, display:'flex', alignItems:'center', gap:8 }}>
            <Clock size={16} color="var(--accent)" /> Order Timeline
          </div>

          <div style={{ position:'relative' }}>
            {/* Vertical connector line */}
            <div style={{
              position:'absolute', left:15, top:16, bottom:16, width:2,
              background:'linear-gradient(to bottom, #22c55e, rgba(124,106,255,0.2))',
              borderRadius:2,
            }} />

            {TIMELINE_STEPS.map((step, i) => {
              const done = i <= currentStatusIdx;
              const active = i === currentStatusIdx;
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity:0, x:-16 }}
                  animate={{ opacity:1, x:0 }}
                  transition={{ delay:1.0 + i*0.07 }}
                  style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom: i < TIMELINE_STEPS.length-1 ? 18 : 0, position:'relative' }}
                >
                  {/* Icon dot */}
                  <div style={{
                    width:32, height:32, borderRadius:'50%', flexShrink:0,
                    background: done
                      ? `linear-gradient(135deg, ${step.color}, ${step.color}cc)`
                      : 'var(--bg-glass)',
                    border: `2px solid ${done ? step.color : 'var(--border-glass)'}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow: active ? `0 0 16px ${step.color}55` : 'none',
                    zIndex:1,
                  }}>
                    <Icon size={14} color={done ? 'white' : 'var(--text-muted)'} />
                  </div>
                  <div style={{ paddingTop:5 }}>
                    <div style={{
                      fontSize:13, fontWeight: active ? 800 : 600,
                      color: done ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}>
                      {step.label}
                      {active && (
                        <span style={{
                          marginLeft:8, fontSize:10, padding:'2px 8px', borderRadius:10,
                          background:'rgba(34,197,94,0.15)', color:'#22c55e', fontWeight:700,
                        }}>CURRENT</span>
                      )}
                    </div>
                    {i === 0 && order?.createdAt && (
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
                        {new Date(order.createdAt).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Delivery Address ── */}
        {order?.address && (
          <motion.div
            initial={{ opacity:0, y:20 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:1.0 }}
            style={{
              background:'var(--bg-card)', border:'1px solid var(--border-glass)',
              borderRadius:20, padding:'18px 24px', marginBottom:16,
            }}
          >
            <div style={{ fontSize:14, fontWeight:800, marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
              <MapPin size={16} color="var(--accent)" /> Delivery Address
            </div>
            <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.8 }}>
              <div style={{ fontWeight:700, color:'var(--text-primary)' }}>{order.address.name}</div>
              <div>{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}</div>
              <div>{order.address.city}, {order.address.state} — {order.address.pincode}</div>
              {order.address.phone && <div style={{ color:'var(--text-muted)' }}>{order.address.phone}</div>}
            </div>
          </motion.div>
        )}

        {/* ── CTA Buttons ── */}
        <motion.div
          initial={{ opacity:0, y:20 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay:1.1 }}
          style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}
        >
          <Link
            to={`/orders/${id}`}
            style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              padding:'14px 20px', borderRadius:50, textDecoration:'none',
              background:'linear-gradient(135deg, #7c6aff 0%, #ff6a9a 100%)',
              color:'white', fontFamily:'var(--font-body)',
              fontSize:14, fontWeight:700,
              boxShadow:'0 8px 28px rgba(124,106,255,0.3)',
            }}
          >
            <Package size={16} /> Track Order <ChevronRight size={14} />
          </Link>

          <Link
            to="/"
            style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              padding:'14px 20px', borderRadius:50, textDecoration:'none',
              background:'var(--bg-glass)', border:'1px solid var(--border-glass)',
              color:'var(--text-primary)', fontFamily:'var(--font-body)',
              fontSize:14, fontWeight:700,
            }}
          >
            <Home size={16} /> Continue Shopping
          </Link>
        </motion.div>

        {/* ── Sparkles ── */}
        {[
          { top:'8%',  left:'4%',  delay:0.5, size:18 },
          { top:'12%', right:'6%', delay:0.8, size:14 },
          { top:'45%', left:'2%',  delay:1.1, size:16 },
          { top:'55%', right:'3%', delay:1.3, size:12 },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ scale:0, opacity:0 }}
            animate={{ scale:[0,1.3,1], opacity:[0,1,0.7] }}
            transition={{ delay:s.delay, duration:0.5 }}
            style={{ position:'fixed', ...s, pointerEvents:'none', zIndex:2 }}
          >
            <Star size={s.size} color={COLORS[i*2]} fill={COLORS[i*2]} />
          </motion.div>
        ))}

      </div>
    </div>
  );
}
