/**
 * ShopNow — Razorpay Payment Backend
 * ===================================
 * Minimal Express server for Razorpay order creation and payment verification.
 *
 * Usage:
 *   1. Copy .env.example → .env
 *   2. Add your Razorpay Key ID & Secret
 *   3. Run: node server/index.js
 *   4. Frontend calls this on port 3001
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Razorpay from 'razorpay';
import crypto from 'node:crypto';

const app = express();
app.use(cors());
app.use(express.json());

// ── Razorpay Instance ──────────────────────────────────────────────────────
const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!KEY_ID || !KEY_SECRET || KEY_ID.includes('XXXX')) {
  console.warn('\n⚠️  Razorpay keys not configured!');
  console.warn('   Copy .env.example → .env and add your keys.');
  console.warn('   Get keys at: https://dashboard.razorpay.com/app/keys\n');
}

const razorpay = new Razorpay({
  key_id: KEY_ID,
  key_secret: KEY_SECRET,
});

// ── Health Check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    razorpay: !!(KEY_ID && KEY_SECRET && !KEY_ID.includes('XXXX')),
    mode: KEY_ID?.startsWith('rzp_live_') ? 'live' : 'test',
  });
});

// ── Create Order ───────────────────────────────────────────────────────────
// Frontend calls this before opening Razorpay Checkout
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {},
    };

    const order = await razorpay.orders.create(options);

    console.log(`✅ Order created: ${order.id} | ₹${amount}`);

    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: KEY_ID, // Send public key to frontend
    });
  } catch (err) {
    console.error('❌ Order creation failed:', err.message);
    res.status(500).json({ error: err.message || 'Order creation failed' });
  }
});

// ── Verify Payment ─────────────────────────────────────────────────────────
// Frontend calls this after payment completion to verify authenticity
app.post('/api/verify-payment', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment details' });
    }

    // Generate expected signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', KEY_SECRET)
      .update(body)
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (isValid) {
      console.log(`✅ Payment verified: ${razorpay_payment_id}`);
      res.json({
        verified: true,
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
      });
    } else {
      console.warn(`⚠️  Payment verification failed: ${razorpay_payment_id}`);
      res.status(400).json({ verified: false, error: 'Signature mismatch' });
    }
  } catch (err) {
    console.error('❌ Verification error:', err.message);
    res.status(500).json({ error: err.message || 'Verification failed' });
  }
});

// ── Fetch Payment Details ──────────────────────────────────────────────────
app.get('/api/payment/:paymentId', async (req, res) => {
  try {
    const payment = await razorpay.payments.fetch(req.params.paymentId);
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Serve Frontend in Production ───────────────────────────────────────────
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve the static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// Handles any requests that don't match the API ones
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// ── Start Server ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 ShopNow Payment Server running on http://localhost:${PORT}`);
  console.log(`   Mode: ${KEY_ID?.startsWith('rzp_live_') ? '🔴 LIVE' : '🟢 TEST'}`);
  console.log(`   Key:  ${KEY_ID?.slice(0, 12)}...`);
  console.log(`\n   Endpoints:`);
  console.log(`   POST /api/create-order    → Create Razorpay order`);
  console.log(`   POST /api/verify-payment  → Verify payment signature`);
  console.log(`   GET  /api/health          → Server status\n`);
});
