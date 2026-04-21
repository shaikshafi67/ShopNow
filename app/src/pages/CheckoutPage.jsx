import { useState, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, MapPin, CreditCard, ChevronRight, Truck, Lock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrdersContext';
import { useCatalog } from '../context/CatalogContext';
import { useToast } from '../context/ToastContext';
import { useNotifications } from '../context/NotifContext';
import { inr, shortDate, addDays } from '../utils/format';
import RazorpayModal from '../components/RazorpayModal';

export default function CheckoutPage() {
  const { items, totals, clear } = useCart();
  const { user, addAddress } = useAuth();
  const { placeOrder } = useOrders();
  const { decrementStock } = useCatalog();
  const toast = useToast();
  const notif = useNotifications();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedAddrId, setSelectedAddrId] = useState((user?.addresses || [])[0]?.id || null);
  const [newAddr, setNewAddr] = useState({ label: 'Home', name: user?.name || '', phone: user?.phone || '', line1: '', line2: '', city: '', state: '', pincode: '' });
  const [savingAddress, setSavingAddress] = useState((user?.addresses || []).length === 0);
  const [razorpayOpen, setRazorpayOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/checkout' }} />;
  }
  if (items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const selectedAddress = useMemo(() => (user.addresses || []).find((a) => a.id === selectedAddrId), [user, selectedAddrId]);

  const submitNewAddress = () => {
    if (!newAddr.name || !newAddr.line1 || !newAddr.city || !newAddr.pincode) {
      toast.error('Please fill name, address, city and pincode.');
      return null;
    }
    const a = addAddress(newAddr);
    setSelectedAddrId(a.id);
    setSavingAddress(false);
    return a;
  };

  const continueToPayment = () => {
    if (savingAddress) {
      const a = submitNewAddress();
      if (!a) return;
    } else if (!selectedAddrId) {
      toast.error('Please select a delivery address.');
      return;
    }
    setStep(2);
  };

  const openRazorpay = () => {
    setRazorpayOpen(true);
  };

  const handlePaymentSuccess = (paymentData) => {
    setRazorpayOpen(false);

    const order = placeOrder({
      items,
      totals,
      address: selectedAddress,
      payment: paymentData,
    });
    items.forEach((it) => decrementStock(it.productId, it.qty));
    clear();

    notif.add({
      title: 'Order Placed!',
      body: `Your order ${order.number} has been placed successfully. Total: ${inr(order.totals.total)}.`,
      type: 'order',
      link: `/orders/${order.id}`,
    });

    toast.success('Order placed successfully!');
    navigate(`/orders/${order.id}?placed=1`, { replace: true });
  };

  return (
    <div style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh' }}>
      <div className="container" style={{ padding: '36px 24px 80px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(26px, 4vw, 36px)',
          fontWeight: 800,
          marginBottom: 6,
        }}>Checkout</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Step {step} of 2 · {step === 1 ? 'Delivery address' : 'Payment'}</p>

        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <Step n={1} label="Address" active={step >= 1} done={step > 1} />
          <ChevronRight size={16} color="var(--text-muted)" />
          <Step n={2} label="Payment" active={step >= 2} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 24, alignItems: 'start' }} className="checkout-grid">
          <div>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.section
                  key="addr"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  style={card()}
                >
                  <h2 style={cardHeading()}><MapPin size={18} color="var(--accent)" /> Delivery address</h2>

                  {(user.addresses || []).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                      {user.addresses.map((a) => (
                        <label key={a.id} style={{
                          display: 'flex', gap: 12, alignItems: 'flex-start',
                          background: 'var(--bg-glass)',
                          border: `1px solid ${selectedAddrId === a.id && !savingAddress ? 'var(--accent)' : 'var(--border-glass)'}`,
                          borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
                        }}>
                          <input
                            type="radio"
                            name="addr"
                            checked={selectedAddrId === a.id && !savingAddress}
                            onChange={() => { setSelectedAddrId(a.id); setSavingAddress(false); }}
                            style={{ marginTop: 4, accentColor: 'var(--accent)' }}
                          />
                          <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                            <div style={{ fontWeight: 700 }}>{a.name} · <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{a.label}</span></div>
                            <div style={{ color: 'var(--text-secondary)' }}>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</div>
                            <div style={{ color: 'var(--text-secondary)' }}>{a.city}, {a.state} - {a.pincode}</div>
                            {a.phone && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{a.phone}</div>}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => setSavingAddress((v) => !v)}
                    className="btn btn-ghost"
                    style={{ marginBottom: 14 }}
                  >
                    {savingAddress ? 'Use saved address' : '+ Add new address'}
                  </button>

                  {savingAddress && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                      <Field placeholder="Label (Home, Office)" value={newAddr.label} onChange={(v) => setNewAddr({ ...newAddr, label: v })} />
                      <Field placeholder="Recipient name" value={newAddr.name} onChange={(v) => setNewAddr({ ...newAddr, name: v })} />
                      <Field placeholder="Address line 1" value={newAddr.line1} onChange={(v) => setNewAddr({ ...newAddr, line1: v })} full />
                      <Field placeholder="Address line 2 (optional)" value={newAddr.line2} onChange={(v) => setNewAddr({ ...newAddr, line2: v })} full />
                      <Field placeholder="City" value={newAddr.city} onChange={(v) => setNewAddr({ ...newAddr, city: v })} />
                      <Field placeholder="State" value={newAddr.state} onChange={(v) => setNewAddr({ ...newAddr, state: v })} />
                      <Field placeholder="Pincode" value={newAddr.pincode} onChange={(v) => setNewAddr({ ...newAddr, pincode: v })} />
                      <Field placeholder="Phone" value={newAddr.phone} onChange={(v) => setNewAddr({ ...newAddr, phone: v })} />
                    </div>
                  )}

                  <button onClick={continueToPayment} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    Continue to payment <ChevronRight size={16} />
                  </button>
                </motion.section>
              )}

              {step === 2 && (
                <motion.section
                  key="pay"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  style={card()}
                >
                  <h2 style={cardHeading()}><CreditCard size={18} color="var(--accent)" /> Payment</h2>

                  {/* Razorpay payment card */}
                  <div style={{
                    background: 'linear-gradient(135deg, #2B3A67 0%, #1A237E 100%)',
                    borderRadius: 14, padding: '24px 22px', marginBottom: 18, color: 'white',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', width: 200, height: 200, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.05)', right: -60, top: -60,
                    }} />
                    <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                      Total Amount
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 900, fontFamily: 'var(--font-display)', marginBottom: 16 }}>
                      {inr(totals.total)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, opacity: 0.8 }}>
                      <Lock size={14} />
                      <span>Payments are secured by <strong>Razorpay</strong></span>
                    </div>
                  </div>

                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 18 }}>
                    Click below to open the secure Razorpay payment gateway. You can pay using UPI, Credit/Debit Cards, Netbanking, or Wallets.
                  </p>

                  <div style={{
                    background: 'var(--bg-glass)', border: '1px dashed var(--border-glass)',
                    borderRadius: 10, padding: 12, fontSize: 12, color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18,
                  }}>
                    <Lock size={14} /> Payments are secured by Razorpay. Auto-detects live/demo mode.
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setStep(1)} className="btn btn-ghost" style={{ flex: '0 0 auto' }}>Back</button>
                    <button
                      onClick={openRazorpay}
                      className="btn btn-primary"
                      style={{
                        flex: 1, justifyContent: 'center',
                        background: 'linear-gradient(135deg, #2B3A67 0%, #1A237E 100%)',
                        border: 'none',
                      }}
                    >
                      Pay with Razorpay <CreditCard size={16} />
                    </button>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>

          {/* Summary */}
          <aside style={{
            ...card(), position: 'sticky', top: 'calc(var(--nav-height) + 16px)',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Order summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14, maxHeight: 200, overflowY: 'auto' }}>
              {items.map((it) => (
                <div key={it._key} style={{ display: 'flex', gap: 10, fontSize: 13 }}>
                  <div style={{
                    width: 42, height: 50, borderRadius: 6,
                    background: it.image ? `url(${it.image}) center/cover` : 'var(--bg-glass)',
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</div>
                    <div style={{ color: 'var(--text-muted)' }}>Qty {it.qty}{it.size ? ` · ${it.size}` : ''}</div>
                  </div>
                  <div style={{ fontWeight: 700 }}>{inr(it.price * it.qty)}</div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 12 }}>
              <Row label="Subtotal" value={inr(totals.subtotal)} />
              {totals.savings > 0 && <Row label="Discount" value={`- ${inr(totals.savings)}`} accent="#22c55e" />}
              <Row label="Shipping" value={totals.shipping === 0 ? 'FREE' : inr(totals.shipping)} accent={totals.shipping === 0 ? '#22c55e' : undefined} />
              <Row label="Tax" value={inr(totals.tax)} />
              <div style={{ borderTop: '1px solid var(--border-glass)', margin: '10px 0' }} />
              <Row label="Total" value={inr(totals.total)} bold />
            </div>

            <p style={{ marginTop: 12, color: 'var(--text-secondary)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Truck size={14} color="var(--accent)" /> Delivery by {shortDate(addDays(new Date(), 5))}
            </p>
          </aside>
        </div>
      </div>

      <RazorpayModal
        open={razorpayOpen}
        amount={totals.total}
        user={user}
        onSuccess={handlePaymentSuccess}
        onClose={() => setRazorpayOpen(false)}
      />

      <style>{`
        @media (max-width: 900px) {
          .checkout-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function Step({ n, label, active, done }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: done ? 'var(--accent)' : (active ? 'var(--bg-glass)' : 'transparent'),
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border-glass)'}`,
        color: done ? 'white' : (active ? 'var(--accent)' : 'var(--text-muted)'),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 13,
      }}>
        {done ? <CheckCircle size={16} /> : n}
      </div>
      <span style={{ fontSize: 14, fontWeight: 600, color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}

function Row({ label, value, bold, accent }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', padding: '5px 0',
      fontSize: bold ? 16 : 13, fontWeight: bold ? 800 : 500,
    }}>
      <span style={{ color: bold ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{label}</span>
      <span style={{ color: accent || 'inherit' }}>{value}</span>
    </div>
  );
}

const card = () => ({
  background: 'var(--bg-card)',
  border: '1px solid var(--border-glass)',
  borderRadius: 18,
  padding: 22,
});
const cardHeading = () => ({
  display: 'flex', alignItems: 'center', gap: 10,
  fontSize: 18, fontWeight: 700, marginBottom: 16,
});

const fieldStyle = () => ({
  background: 'var(--bg-glass)',
  border: '1px solid var(--border-glass)',
  borderRadius: 10,
  padding: '10px 12px',
  color: 'var(--text-primary)',
  fontSize: 14,
  fontFamily: 'var(--font-body)',
  outline: 'none',
});

function Field({ value, onChange, placeholder, full }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ ...fieldStyle(), width: '100%', gridColumn: full ? '1 / -1' : 'auto' }}
    />
  );
}
