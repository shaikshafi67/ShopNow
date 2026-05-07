import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Razorpay ─────────────────────────────────────────────────────────────
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ── OTP store (in-memory, expires in 10 min) ──────────────────────────────
const otpStore = new Map(); // email → { otp, expiresAt }

// ── Email transporter ─────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const isProd = process.env.NODE_ENV === 'production';

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

// ── Health ────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status:   'ok',
    razorpay: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    email:    !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
  });
});

// ── Send OTP ──────────────────────────────────────────────────────────────
app.post('/api/send-otp', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    otpStore.set(email.toLowerCase(), { otp, expiresAt });

    // Send email if Gmail is configured
    const emailConfigured = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD;

    if (emailConfigured) {
      await transporter.sendMail({
        from:    `"ShopNow" <${process.env.GMAIL_USER}>`,
        to:      email,
        subject: 'Your ShopNow Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 12px;">
            <h2 style="color: #7c6aff; margin: 0 0 8px;">ShopNow</h2>
            <h3 style="color: #1a1a1a; margin: 0 0 24px;">Email Verification</h3>
            <p style="color: #555; margin: 0 0 16px;">Hello ${name || 'there'},</p>
            <p style="color: #555; margin: 0 0 24px;">Your verification code is:</p>
            <div style="background: #7c6aff; color: white; font-size: 36px; font-weight: 900; letter-spacing: 8px; text-align: center; padding: 20px; border-radius: 10px; margin: 0 0 24px;">${otp}</div>
            <p style="color: #888; font-size: 13px; margin: 0;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
            <p style="color: #bbb; font-size: 12px; margin: 0;">If you didn't request this, ignore this email.</p>
          </div>
        `,
      });
      return res.json({ success: true, sent: true });
    }

    // Gmail not configured — return OTP for demo mode
    console.log(`[OTP] Demo mode — OTP for ${email}: ${otp}`);
    return res.json({ success: true, sent: false, otp });

  } catch (err) {
    console.error('send-otp error:', err.message);
    res.status(500).json({ error: 'Failed to send OTP. Check server email config.' });
  }
});

// ── Verify OTP ────────────────────────────────────────────────────────────
app.post('/api/verify-otp', (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ valid: false, error: 'Email and OTP required' });

    const record = otpStore.get(email.toLowerCase());
    if (!record)                    return res.json({ valid: false, error: 'OTP expired or not found. Request a new one.' });
    if (Date.now() > record.expiresAt) { otpStore.delete(email.toLowerCase()); return res.json({ valid: false, error: 'OTP expired. Request a new one.' }); }
    if (record.otp !== otp)         return res.json({ valid: false, error: 'Incorrect code. Please try again.' });

    otpStore.delete(email.toLowerCase()); // single-use
    return res.json({ valid: true });
  } catch (err) {
    res.status(500).json({ valid: false, error: err.message });
  }
});

// ── Razorpay: Create Order ────────────────────────────────────────────────
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, receipt, notes } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
    const order = await razorpay.orders.create({
      amount: Math.round(Number(amount) * 100),
      currency: 'INR',
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {},
    });
    res.json({ ...order, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to create order' });
  }
});

// ── Razorpay: Verify Payment ──────────────────────────────────────────────
app.post('/api/verify-payment', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
      return res.status(400).json({ verified: false, error: 'Missing fields' });
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    res.json({ verified: hmac.digest('hex') === razorpay_signature });
  } catch (err) {
    res.status(500).json({ verified: false, error: err.message });
  }
});

// ── Serve frontend in production ──────────────────────────────────────────
if (isProd) {
  const distPath = path.resolve(__dirname, '../../app/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`ShopNow server → http://localhost:${PORT} [${isProd ? 'production' : 'dev'}]`);
  console.log(`Razorpay: ${process.env.RAZORPAY_KEY_ID || '(not set)'}`);
  console.log(`Email:    ${process.env.GMAIL_USER || '(not configured — demo mode)'}`);
});
