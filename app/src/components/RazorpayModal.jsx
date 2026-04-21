import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Smartphone, Building2, Wallet, Truck, Shield, CheckCircle, Loader2, ChevronRight, AlertTriangle } from 'lucide-react';
import { inr } from '../utils/format';

/*
 * Razorpay Payment Gateway Integration
 * =====================================
 * This component handles BOTH modes:
 *
 * 1. REAL MODE  → When the backend is running (server/index.js)
 *    - Creates order via /api/create-order
 *    - Opens real Razorpay Checkout modal
 *    - Verifies payment via /api/verify-payment
 *
 * 2. DEMO MODE  → When backend is not available
 *    - Shows simulated Razorpay-style UI
 *    - No real charges
 */

const API_BASE = 'http://localhost:3001';

// ── Check if real Razorpay backend is available ──────────────────────────
async function checkBackend() {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(2000) });
    const data = await res.json();
    return data.status === 'ok' && data.razorpay;
  } catch {
    return false;
  }
}

// ── Real Razorpay Checkout ───────────────────────────────────────────────
async function openRealRazorpay({ amount, user, onSuccess, onClose }) {
  // Step 1: Create order on backend
  const orderRes = await fetch(`${API_BASE}/api/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount,
      receipt: `rcpt_${Date.now()}`,
      notes: { customer: user?.name, email: user?.email },
    }),
  });

  if (!orderRes.ok) {
    const err = await orderRes.json();
    throw new Error(err.error || 'Failed to create order');
  }

  const order = await orderRes.json();

  // Step 2: Open Razorpay Checkout
  return new Promise((resolve, reject) => {
    const options = {
      key: order.key,
      amount: order.amount,
      currency: order.currency,
      name: 'ShopNow',
      description: 'Fashion Purchase',
      order_id: order.id,
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
        contact: user?.phone || '',
      },
      theme: {
        color: '#2B3A67',
        backdrop_color: 'rgba(0,0,0,0.7)',
      },
      modal: {
        ondismiss: () => {
          onClose();
          reject(new Error('Payment cancelled'));
        },
      },
      handler: async (response) => {
        // Step 3: Verify payment on backend
        try {
          const verifyRes = await fetch(`${API_BASE}/api/verify-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
          });
          const result = await verifyRes.json();

          if (result.verified) {
            resolve({
              method: 'razorpay',
              status: 'paid',
              txnId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              gateway: 'razorpay',
              verified: true,
            });
          } else {
            reject(new Error('Payment verification failed'));
          }
        } catch (err) {
          reject(err);
        }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => {
      reject(new Error(response.error.description || 'Payment failed'));
    });
    rzp.open();
  });
}

// ── Demo Mode UI Components ──────────────────────────────────────────────

const METHODS = [
  { id: 'upi', label: 'UPI', icon: Smartphone, desc: 'Pay using any UPI app' },
  { id: 'card', label: 'Cards', icon: CreditCard, desc: 'Credit / Debit / ATM cards' },
  { id: 'netbanking', label: 'Netbanking', icon: Building2, desc: 'All Indian banks' },
  { id: 'wallet', label: 'Wallets', icon: Wallet, desc: 'Paytm, PhonePe, etc.' },
  { id: 'cod', label: 'Cash on Delivery', icon: Truck, desc: 'Pay when delivered' },
];

const BANKS = ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra', 'Yes Bank', 'Punjab National Bank', 'Bank of Baroda'];

const UPI_APPS = [
  { name: 'Google Pay', color: '#4285F4' },
  { name: 'PhonePe', color: '#5F259F' },
  { name: 'Paytm', color: '#00BAF2' },
  { name: 'BHIM', color: '#00796B' },
];

// ── Main Export ──────────────────────────────────────────────────────────

export default function RazorpayModal({ open, amount, user, onSuccess, onClose }) {
  const [backendAvailable, setBackendAvailable] = useState(null); // null = checking
  const [method, setMethod] = useState('upi');
  const [stage, setStage] = useState('select'); // select | form | processing | success | error
  const [upiId, setUpiId] = useState('');
  const [cardNum, setCardNum] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [bank, setBank] = useState('');
  const [error, setError] = useState('');

  // Check backend availability on open
  useEffect(() => {
    if (open) {
      setStage('select');
      setError('');
      setBackendAvailable(null);
      checkBackend().then(setBackendAvailable);
    }
  }, [open]);

  // Try REAL Razorpay first
  const handleRealPay = useCallback(async () => {
    setStage('processing');
    try {
      const result = await openRealRazorpay({ amount, user, onSuccess, onClose });
      onSuccess(result);
    } catch (err) {
      if (err.message !== 'Payment cancelled') {
        setError(err.message);
        setStage('error');
      }
    }
  }, [amount, user, onSuccess, onClose]);

  // Demo mode payment
  const handleDemoPay = async () => {
    if (!validateDemo()) return;
    setStage('processing');
    await new Promise((r) => setTimeout(r, 1500));
    setStage('success');
    await new Promise((r) => setTimeout(r, 1800));
    const txnId = 'pay_demo_' + Math.random().toString(36).slice(2, 14).toUpperCase();
    onSuccess({
      method,
      status: method === 'cod' ? 'pending' : 'paid',
      txnId,
      gateway: 'razorpay_demo',
    });
  };

  const validateDemo = () => {
    setError('');
    if (method === 'upi' && !upiId.includes('@')) { setError('Enter a valid UPI ID (e.g. name@upi)'); return false; }
    if (method === 'card') {
      if (cardNum.replace(/\s/g, '').length < 12) { setError('Enter a valid card number'); return false; }
      if (!cardExp || !cardCvv) { setError('Fill all card details'); return false; }
    }
    if (method === 'netbanking' && !bank) { setError('Select a bank'); return false; }
    return true;
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={stage === 'processing' || stage === 'success' ? undefined : onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 4000,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}
      >
        <motion.div
          initial={{ scale: 0.92, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.92, y: 30 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 440,
            background: '#fff',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
            color: '#2d2d2d',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #2B3A67 0%, #1A237E 100%)',
            padding: '18px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            color: 'white',
          }}>
            <div>
              <div style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>ShopNow</div>
              <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)' }}>{inr(amount)}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, opacity: 0.7 }}>
                  <Shield size={12} /> Secured by
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.5 }}>
                  <span style={{ color: '#3395FF' }}>Razorpay</span>
                </div>
              </div>
              {stage !== 'processing' && stage !== 'success' && (
                <button onClick={onClose} style={{
                  background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6,
                  padding: 6, cursor: 'pointer', color: 'white', display: 'flex',
                }}>
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Mode indicator */}
          {backendAvailable !== null && (
            <div style={{
              background: backendAvailable ? '#E8F5E9' : '#FFF3E0',
              padding: '6px 16px', fontSize: 12, fontWeight: 600,
              color: backendAvailable ? '#2E7D32' : '#E65100',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: backendAvailable ? '#4CAF50' : '#FF9800',
              }} />
              {backendAvailable ? '🔒 Live Razorpay — Real payment' : '🧪 Demo Mode — No charges'}
            </div>
          )}

          {/* Body */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            <AnimatePresence mode="wait">
              {/* Real Razorpay — one-click */}
              {stage === 'select' && backendAvailable && (
                <motion.div
                  key="real"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ padding: '30px 24px', textAlign: 'center' }}
                >
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: '#EEF0FF', display: 'inline-flex',
                    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
                  }}>
                    <Shield size={32} color="#2B3A67" />
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: '#2B3A67', marginBottom: 8 }}>
                    Razorpay Secure Checkout
                  </h3>
                  <p style={{ color: '#666', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                    Pay <strong>{inr(amount)}</strong> securely via UPI, Cards, Netbanking, or Wallets through Razorpay's official payment gateway.
                  </p>
                  <button onClick={handleRealPay} style={payBtn}>
                    Pay {inr(amount)} with Razorpay <ChevronRight size={16} />
                  </button>
                  <p style={{ color: '#999', fontSize: 11, marginTop: 12 }}>
                    Razorpay Test Mode • Use test card: 4111 1111 1111 1111
                  </p>
                </motion.div>
              )}

              {/* Demo Mode — full form */}
              {stage === 'select' && backendAvailable === false && (
                <motion.div
                  key="demo"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  style={{ display: 'flex', height: '100%' }}
                >
                  {/* Method sidebar */}
                  <div style={{
                    width: 150, background: '#f7f8fa',
                    borderRight: '1px solid #eee',
                    padding: '8px 0', flexShrink: 0,
                  }}>
                    {METHODS.map((m) => {
                      const Icon = m.icon;
                      const active = method === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => { setMethod(m.id); setError(''); }}
                          style={{
                            width: '100%', padding: '12px 14px',
                            background: active ? '#fff' : 'transparent',
                            border: 'none', borderLeft: active ? '3px solid #2B3A67' : '3px solid transparent',
                            borderRight: active ? 'none' : '1px solid #eee',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                            fontSize: 13, fontWeight: active ? 700 : 500,
                            color: active ? '#2B3A67' : '#666',
                            fontFamily: 'var(--font-body)',
                          }}
                        >
                          <Icon size={16} /> {m.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Method form */}
                  <div style={{ flex: 1, padding: '20px 20px 16px' }}>
                    {method === 'upi' && (
                      <div>
                        <h3 style={formTitle}>Pay using UPI</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                          {UPI_APPS.map((app) => (
                            <button key={app.name}
                              onClick={() => setUpiId(`user@${app.name.toLowerCase().replace(/\s/g, '')}`)}
                              style={{ padding: '10px 12px', borderRadius: 8, background: '#f7f8fa', border: '1px solid #eee', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: app.color, fontFamily: 'var(--font-body)' }}
                            >{app.name}</button>
                          ))}
                        </div>
                        <div style={{ fontSize: 12, color: '#999', textAlign: 'center', marginBottom: 12 }}>— or enter UPI ID —</div>
                        <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@upi" style={inputStyle} />
                      </div>
                    )}

                    {method === 'card' && (
                      <div>
                        <h3 style={formTitle}>Card Details</h3>
                        <input value={cardNum} onChange={(e) => setCardNum(formatCardNum(e.target.value))} placeholder="Card Number" maxLength={19} style={{ ...inputStyle, marginBottom: 10 }} />
                        <input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Name on Card" style={{ ...inputStyle, marginBottom: 10 }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <input value={cardExp} onChange={(e) => setCardExp(formatExp(e.target.value))} placeholder="MM / YY" maxLength={7} style={inputStyle} />
                          <input value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="CVV" type="password" maxLength={4} style={inputStyle} />
                        </div>
                      </div>
                    )}

                    {method === 'netbanking' && (
                      <div>
                        <h3 style={formTitle}>Select your bank</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {BANKS.map((b) => (
                            <label key={b} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: bank === b ? '#EEF0FF' : '#f7f8fa', border: `1px solid ${bank === b ? '#2B3A67' : '#eee'}`, cursor: 'pointer', fontSize: 14 }}>
                              <input type="radio" name="bank" checked={bank === b} onChange={() => setBank(b)} style={{ accentColor: '#2B3A67' }} />
                              {b}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {method === 'wallet' && (
                      <div>
                        <h3 style={formTitle}>Wallet Payment</h3>
                        <p style={{ color: '#666', fontSize: 14, lineHeight: 1.6 }}>You'll be redirected to your wallet app to pay {inr(amount)}.</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
                          {['Paytm', 'PhonePe', 'MobiKwik', 'FreeCharge'].map((w) => (
                            <button key={w} style={{ padding: '12px', borderRadius: 8, background: '#f7f8fa', border: '1px solid #eee', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)' }}>{w}</button>
                          ))}
                        </div>
                      </div>
                    )}

                    {method === 'cod' && (
                      <div>
                        <h3 style={formTitle}>Cash on Delivery</h3>
                        <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 8, padding: '12px 14px', fontSize: 14, color: '#5D4037', lineHeight: 1.6 }}>
                          Pay <strong>{inr(amount)}</strong> in cash when your order is delivered.
                        </div>
                      </div>
                    )}

                    {error && (
                      <div style={{ background: '#FFEBEE', color: '#C62828', borderRadius: 6, padding: '8px 12px', fontSize: 13, marginTop: 12 }}>{error}</div>
                    )}

                    <button onClick={handleDemoPay} style={payBtn}>
                      Pay {inr(amount)} <ChevronRight size={16} />
                    </button>

                    <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: '#999' }}>
                      <Shield size={11} /> Demo mode — No real payment charged
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Loading backend check */}
              {stage === 'select' && backendAvailable === null && (
                <motion.div key="checking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ padding: '60px 24px', textAlign: 'center' }}>
                  <Loader2 size={36} color="#2B3A67" style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={{ color: '#666', marginTop: 16, fontSize: 14 }}>Connecting to payment gateway...</p>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </motion.div>
              )}

              {/* Processing */}
              {stage === 'processing' && (
                <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ padding: '60px 24px', textAlign: 'center' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block', marginBottom: 24 }}>
                    <Loader2 size={48} color="#2B3A67" />
                  </motion.div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: '#2B3A67', marginBottom: 8 }}>Processing Payment</h3>
                  <p style={{ color: '#666', fontSize: 14 }}>Please do not close this window...</p>
                </motion.div>
              )}

              {/* Success */}
              {stage === 'success' && (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  style={{ padding: '60px 24px', textAlign: 'center' }}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                    style={{ width: 72, height: 72, borderRadius: '50%', background: '#E8F5E9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <CheckCircle size={38} color="#2E7D32" />
                  </motion.div>
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: '#2E7D32', marginBottom: 8 }}>Payment Successful</h3>
                  <p style={{ color: '#666', fontSize: 15 }}>{inr(amount)} paid successfully</p>
                  <p style={{ color: '#999', fontSize: 13, marginTop: 8 }}>Redirecting to order confirmation...</p>
                </motion.div>
              )}

              {/* Error */}
              {stage === 'error' && (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#FFEBEE', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <AlertTriangle size={34} color="#C62828" />
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: '#C62828', marginBottom: 8 }}>Payment Failed</h3>
                  <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>{error}</p>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <button onClick={() => setStage('select')} style={{ ...payBtn, maxWidth: 200 }}>Try Again</button>
                    <button onClick={onClose} style={{ padding: '12px 24px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)' }}>Cancel</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const formTitle = { fontSize: 15, fontWeight: 700, color: '#2B3A67', marginBottom: 16, fontFamily: 'var(--font-display)' };

const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #ddd',
  fontSize: 15, fontFamily: 'var(--font-body)', outline: 'none', color: '#333',
  background: '#fff', boxSizing: 'border-box',
};

const payBtn = {
  width: '100%', padding: '14px 0',
  background: 'linear-gradient(135deg, #2B3A67 0%, #1A237E 100%)',
  color: 'white', border: 'none', borderRadius: 8,
  fontSize: 16, fontWeight: 700, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  fontFamily: 'var(--font-body)', marginTop: 18,
};

function formatCardNum(v) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})/g, '$1 ').trim();
}
function formatExp(v) {
  const d = v.replace(/\D/g, '').slice(0, 4);
  if (d.length > 2) return d.slice(0, 2) + ' / ' + d.slice(2);
  return d;
}
