import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const isProd = process.env.NODE_ENV === 'production';

// In production the server itself serves the frontend, so no CORS needed
if (!isProd) {
  app.use(cors({
    origin: [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://localhost:5174',
    ],
  }));
}
app.use(express.json());

// Health check — lets the frontend know real Razorpay is available
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    razorpay: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
  });
});

// Create a Razorpay order (amount from frontend is in rupees; Razorpay needs paise)
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, receipt, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(Number(amount) * 100), // rupees → paise
      currency: 'INR',
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {},
    });

    res.json({ ...order, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error('create-order error:', err);
    res.status(500).json({ error: err.message || 'Failed to create order' });
  }
});

// Verify Razorpay payment signature
app.post('/api/verify-payment', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ verified: false, error: 'Missing payment fields' });
    }

    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const expected = hmac.digest('hex');

    const verified = expected === razorpay_signature;
    res.json({ verified });
  } catch (err) {
    console.error('verify-payment error:', err);
    res.status(500).json({ verified: false, error: err.message });
  }
});

// In production, serve the built Vite frontend and handle client-side routing
if (isProd) {
  const distPath = path.resolve(__dirname, '../../app/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`ShopNow server → http://localhost:${PORT} [${isProd ? 'production' : 'dev'}]`);
  console.log(`Razorpay key: ${process.env.RAZORPAY_KEY_ID || '(not set)'}`);
});
