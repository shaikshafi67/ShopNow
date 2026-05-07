import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Mail, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import AuthShell, { FormField } from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function RegisterPage() {
  const { register, resendVerification } = useAuth();
  const toast    = useToast();
  const navigate = useNavigate();

  const [step, setStep]       = useState('form');   // 'form' | 'verify'
  const [form, setForm]       = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState(null);
  const [resending, setResending] = useState(false);

  const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  /* ── Step 1: Validate and create Firebase account ── */
  const submitForm = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim())                                { setError('Full name is required.');             return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Enter a valid email address.');        return; }
    if (form.password.length < 6)                         { setError('Password must be at least 6 chars.'); return; }
    if (form.password !== form.confirm)                   { setError('Passwords do not match.');            return; }

    setBusy(true);
    try {
      await register({ ...form });
      // Firebase sent a verification email — show the verify screen
      setStep('verify');
    } catch (err) {
      const msg = err.message
        ?.replace('Firebase: ', '')
        ?.replace(/\(auth\/.*?\)\.?/, '')
        ?.trim() || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  /* ── Resend verification email ── */
  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification(form.email, form.password);
      toast.success('Verification email resent. Check your inbox.');
    } catch {
      toast.error('Could not resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  /* ── Step 1: Registration form ── */
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

          <button type="submit" disabled={busy} className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', opacity: busy ? 0.7 : 1 }}>
            <UserPlus size={16} />
            {busy ? 'Creating account…' : 'Create account'}
          </button>

          <p style={{ marginTop: 14, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            By registering you agree to our{' '}
            <Link to="/terms" style={{ color: 'var(--text-secondary)' }}>Terms</Link> and{' '}
            <Link to="/privacy" style={{ color: 'var(--text-secondary)' }}>Privacy Policy</Link>.
          </p>
        </form>
      </AuthShell>
    );
  }

  /* ── Step 2: Email verification sent screen ── */
  return (
    <AuthShell
      title="Verify your email"
      subtitle="We sent a verification link to your inbox"
      footer={
        <button onClick={() => { setStep('form'); setError(null); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={15} /> Back to registration
        </button>
      }
    >
      <div style={{ textAlign: 'center' }}>

        {/* Email icon */}
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(124,106,255,0.1)', border: '2px solid rgba(124,106,255,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Mail size={36} color="var(--accent)" />
        </motion.div>

        {/* Info box */}
        <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, padding: '16px 20px', marginBottom: 24, textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <CheckCircle size={16} color="#16a34a" />
            <span style={{ fontWeight: 700, color: '#16a34a', fontSize: 14 }}>Account created!</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
            A verification link was sent to <strong>{form.email}</strong>.<br />
            Click the link in the email to activate your account, then sign in.
          </p>
        </div>

        {/* Steps */}
        <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 12, padding: '16px 20px', marginBottom: 24, textAlign: 'left' }}>
          {[
            { n: 1, text: `Open the email sent to ${form.email}` },
            { n: 2, text: 'Click the "Verify email" link' },
            { n: 3, text: 'Come back and sign in' },
          ].map(s => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                {s.n}
              </div>
              {s.text}
            </div>
          ))}
        </div>

        {/* Go to login */}
        <button onClick={() => navigate('/login')} className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 14 }}>
          <CheckCircle size={16} /> Go to Sign in
        </button>

        {/* Resend */}
        <button onClick={handleResend} disabled={resending}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontWeight: 600, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, opacity: resending ? 0.6 : 1 }}>
          <RefreshCw size={13} /> {resending ? 'Sending…' : 'Resend verification email'}
        </button>
      </div>
    </AuthShell>
  );
}
