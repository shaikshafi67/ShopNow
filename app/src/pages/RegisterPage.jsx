import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Mail, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import emailjs from '@emailjs/browser';
import AuthShell, { FormField } from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const EMAILJS_SERVICE  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_KEY      = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const EMAIL_CONFIGURED = !!(EMAILJS_SERVICE && EMAILJS_KEY && EMAILJS_SERVICE !== 'your_service_id');

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail({ name, email, otp }) {
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

/* ── 6-box OTP input ──────────────────────────────────────────────── */
function OTPInput({ value, onChange }) {
  const inputs = useRef([]);
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      if (digits[i]) { onChange(digits.map((d, j) => j === i ? '' : d).join('')); }
      else if (i > 0) inputs.current[i - 1]?.focus();
      return;
    }
    if (e.key === 'ArrowLeft'  && i > 0) { inputs.current[i - 1]?.focus(); return; }
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
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => (inputs.current[i] = el)}
          value={d}
          onChange={() => {}}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          maxLength={1}
          inputMode="numeric"
          style={{
            width: 48, height: 56, borderRadius: 12, textAlign: 'center',
            fontSize: 22, fontWeight: 700,
            border: `2px solid ${d ? 'var(--accent)' : 'var(--border-glass)'}`,
            background: d ? 'rgba(124,106,255,0.06)' : 'var(--bg-glass)',
            color: 'var(--text-primary)', outline: 'none',
            transition: 'border-color 0.2s', fontFamily: 'var(--font-body)',
          }}
        />
      ))}
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────── */
export default function RegisterPage() {
  const { register } = useAuth();
  const toast        = useToast();
  const navigate     = useNavigate();

  const [step, setStep]           = useState('form');   // 'form' | 'verify'
  const [form, setForm]           = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState(null);
  const [otp, setOtp]             = useState('');
  const [otpInput, setOtpInput]   = useState('');
  const [otpError, setOtpError]   = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [cooldown, setCooldown]   = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  /* Step 1 — validate form and send OTP */
  const submitForm = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim())                                { setError('Full name is required.');             return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Enter a valid email address.');        return; }
    if (form.password.length < 6)                         { setError('Password must be at least 6 chars.'); return; }
    if (form.password !== form.confirm)                   { setError('Passwords do not match.');            return; }

    setBusy(true);
    try {
      await sendVerification();
      setStep('verify');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const sendVerification = async () => {
    const code = generateOTP();
    setOtp(code);
    setCooldown(60);
    const sent = await sendOTPEmail({ name: form.name, email: form.email, otp: code });
    setEmailSent(sent);
  };

  /* Step 2 — verify OTP then create Firebase account */
  const verifyOtp = async () => {
    setOtpError('');
    if (otpInput.length < 6) { setOtpError('Enter the full 6-digit code.'); return; }
    if (otpInput !== otp)    { setOtpError('Incorrect code. Please try again.'); setOtpInput(''); return; }

    setBusy(true);
    try {
      const u = await register({ ...form });
      toast.success(`Welcome, ${u.name.split(' ')[0]}! Account created ✓`);
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err.message
        ?.replace('Firebase: ', '')
        ?.replace(/\(auth\/.*?\)\.?/, '')
        ?.trim() || 'Registration failed.';
      setOtpError(msg);
    } finally {
      setBusy(false);
    }
  };

  const resendOtp = async () => {
    if (cooldown > 0) return;
    setOtpInput(''); setOtpError('');
    await sendVerification();
    toast.info(emailSent ? 'New code sent to your email.' : 'New code generated.');
  };

  /* ── Step 1: Registration form ──────────────────────────── */
  if (step === 'form') {
    return (
      <AuthShell
        title="Create account"
        subtitle="Join ShopNow and start shopping."
        footer={<>Already have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link></>}
      >
        <form onSubmit={submitForm}>
          <FormField label="Full name"        name="name"     value={form.name}     onChange={onChange} placeholder="Your name"          required autoComplete="name" />
          <FormField label="Email address"    type="email"    name="email"    value={form.email}    onChange={onChange} placeholder="you@gmail.com"     required autoComplete="email" />
          <FormField label="Phone (optional)" type="tel"      name="phone"    value={form.phone}    onChange={onChange} placeholder="+91 98765 43210"   autoComplete="tel" />
          <FormField label="Password"         type="password" name="password" value={form.password} onChange={onChange} placeholder="At least 6 chars"  required autoComplete="new-password" />
          <FormField label="Confirm password" type="password" name="confirm"  value={form.confirm}  onChange={onChange} placeholder="Re-enter password" required autoComplete="new-password" />

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={busy} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: busy ? 0.7 : 1 }}>
            <UserPlus size={16} /> {busy ? 'Sending code…' : 'Continue'}
          </button>

          <p style={{ marginTop: 14, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            By registering you agree to our <Link to="/terms" style={{ color: 'var(--text-secondary)' }}>Terms</Link> and <Link to="/privacy" style={{ color: 'var(--text-secondary)' }}>Privacy Policy</Link>.
          </p>
        </form>
      </AuthShell>
    );
  }

  /* ── Step 2: OTP verification ───────────────────────────── */
  return (
    <AuthShell
      title="Verify your email"
      subtitle={`We sent a 6-digit code to ${form.email}`}
      footer={
        <button onClick={() => { setStep('form'); setOtpInput(''); setOtpError(''); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={15} /> Change email
        </button>
      }
    >
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(124,106,255,0.1)', border: '2px solid rgba(124,106,255,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
          <Mail size={32} color="var(--accent)" />
        </motion.div>

        {emailSent ? (
          <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '10px 18px', fontSize: 13, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={15} /> Code sent to <strong>{form.email}</strong>
          </div>
        ) : (
          <div style={{ background: 'rgba(124,106,255,0.08)', border: '1px dashed rgba(124,106,255,0.3)', borderRadius: 10, padding: '10px 18px', fontSize: 13, color: 'var(--text-secondary)' }}>
            Your code is{' '}
            <span style={{ fontWeight: 800, fontSize: 20, color: 'var(--accent)', letterSpacing: 3 }}>{otp}</span>
          </div>
        )}
      </div>

      <div style={{ marginBottom: 20 }}>
        <OTPInput value={otpInput} onChange={v => { setOtpInput(v); setOtpError(''); }} />
      </div>

      {otpError && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14, textAlign: 'center' }}>
          {otpError}
        </div>
      )}

      <button onClick={verifyOtp} disabled={otpInput.length < 6 || busy} className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center', opacity: otpInput.length < 6 || busy ? 0.5 : 1, marginBottom: 14 }}>
        <CheckCircle size={16} /> {busy ? 'Creating account…' : 'Verify & Create Account'}
      </button>

      <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
        Didn't receive the code?{' '}
        {cooldown > 0 ? (
          <span>Resend in {cooldown}s</span>
        ) : (
          <button onClick={resendOtp} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontWeight: 600, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <RefreshCw size={13} /> Resend code
          </button>
        )}
      </div>
    </AuthShell>
  );
}
