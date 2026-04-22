import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle, RefreshCw, ArrowLeft, Lock } from 'lucide-react';
import emailjs from '@emailjs/browser';
import AuthShell, { FormField } from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const EMAILJS_SERVICE  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_KEY      = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const EMAIL_CONFIGURED = EMAILJS_SERVICE && EMAILJS_SERVICE !== 'your_service_id';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendResetOTP({ name, email, otp }) {
  if (!EMAIL_CONFIGURED) return false;
  try {
    await emailjs.send(
      EMAILJS_SERVICE,
      EMAILJS_TEMPLATE,
      { to_name: name, to_email: email, otp },
      { publicKey: EMAILJS_KEY },
    );
    return true;
  } catch {
    return false;
  }
}

/* ── OTP Input ───────────────────────────────────────────────────────── */
function OTPInput({ value, onChange }) {
  const inputs = useRef([]);
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      if (digits[i]) { onChange(digits.map((d, j) => (j === i ? '' : d)).join('')); }
      else if (i > 0) inputs.current[i - 1]?.focus();
      return;
    }
    if (e.key === 'ArrowLeft' && i > 0) { inputs.current[i - 1]?.focus(); return; }
    if (e.key === 'ArrowRight' && i < 5) { inputs.current[i + 1]?.focus(); return; }
    const ch = e.key.replace(/\D/g, '');
    if (!ch) return;
    const next = [...digits]; next[i] = ch;
    onChange(next.join('').slice(0, 6));
    if (i < 5) inputs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) { onChange(pasted); inputs.current[Math.min(pasted.length, 5)]?.focus(); }
    e.preventDefault();
  };

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '20px 0' }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text" inputMode="numeric" maxLength={1} value={d}
          onChange={() => {}}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          style={{
            width: 44, height: 52, textAlign: 'center', fontSize: 22, fontWeight: 700,
            border: `2px solid ${d ? 'var(--accent)' : 'var(--border-glass)'}`,
            borderRadius: 12, background: 'var(--bg-glass)', color: 'var(--text-primary)',
            outline: 'none', transition: 'border-color 0.2s', fontFamily: 'var(--font-body)',
          }}
        />
      ))}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────────── */
export default function ForgotPasswordPage() {
  const { findByEmail, resetPassword } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState('email'); // 'email' | 'otp' | 'password'
  const [email, setEmail] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [otp, setOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  /* Step 1 — verify email exists and send OTP */
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    const clean = email.trim().toLowerCase();
    if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setError('Enter a valid email address.');
      return;
    }
    const user = findByEmail(clean);
    if (!user) {
      setError('No account found with this email address.');
      return;
    }
    setBusy(true);
    const code = generateOTP();
    setOtp(code);
    setFoundUser(user);
    const sent = await sendResetOTP({ name: user.name, email: clean, otp: code });
    setEmailSent(sent);
    setBusy(false);
    setStep('otp');
  };

  /* Step 2 — verify OTP */
  const handleVerifyOTP = () => {
    setOtpError('');
    if (otpInput.length < 6) { setOtpError('Enter the 6-digit code.'); return; }
    if (otpInput !== otp) { setOtpError('Incorrect code. Please try again.'); return; }
    setStep('password');
  };

  const handleResend = async () => {
    setBusy(true);
    const code = generateOTP();
    setOtp(code);
    setOtpInput('');
    setOtpError('');
    const sent = await sendResetOTP({ name: foundUser.name, email: foundUser.email, otp: code });
    setEmailSent(sent);
    setBusy(false);
    toast.success('New code sent!');
  };

  /* Step 3 — set new password */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setBusy(true);
    try {
      await resetPassword(foundUser.email, newPassword);
      toast.success('Password reset successfully! Please log in.');
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Reset password"
      subtitle={
        step === 'email' ? "Enter your email and we'll send a verification code." :
        step === 'otp'   ? `Enter the 6-digit code sent to ${email}` :
                           'Create a new password for your account.'
      }
      footer={<><Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><ArrowLeft size={14} /> Back to sign in</Link></>}
    >
      <AnimatePresence mode="wait">

        {/* ── Step 1: Email ── */}
        {step === 'email' && (
          <motion.form key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSendOTP}>
            <FormField
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14 }}>
                {error}
              </div>
            )}
            <button type="submit" disabled={busy} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: busy ? 0.7 : 1 }}>
              <Mail size={16} /> {busy ? 'Sending code…' : 'Send verification code'}
            </button>
          </motion.form>
        )}

        {/* ── Step 2: OTP ── */}
        {step === 'otp' && (
          <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            {emailSent ? (
              <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#16a34a' }}>
                <CheckCircle size={15} /> Verification code sent to <strong>{email}</strong>
              </div>
            ) : (
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#92400e' }}>
                Email service not configured — demo code: <strong>{otp}</strong>
              </div>
            )}

            <OTPInput value={otpInput} onChange={(v) => { setOtpInput(v); setOtpError(''); }} />

            {otpError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14 }}>
                {otpError}
              </div>
            )}

            <button onClick={handleVerifyOTP} disabled={otpInput.length < 6} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              <CheckCircle size={16} /> Verify code
            </button>

            <button onClick={handleResend} disabled={busy} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}>
              <RefreshCw size={14} /> {busy ? 'Sending…' : 'Resend code'}
            </button>
          </motion.div>
        )}

        {/* ── Step 3: New Password ── */}
        {step === 'password' && (
          <motion.form key="password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleResetPassword}>
            <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#16a34a' }}>
              <CheckCircle size={15} /> Email verified — set your new password
            </div>
            <FormField
              label="New password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              required
            />
            <FormField
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              required
            />
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14 }}>
                {error}
              </div>
            )}
            <button type="submit" disabled={busy} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: busy ? 0.7 : 1 }}>
              <Lock size={16} /> {busy ? 'Saving…' : 'Reset password'}
            </button>
          </motion.form>
        )}

      </AnimatePresence>
    </AuthShell>
  );
}
