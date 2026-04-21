import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import AuthShell, { FormField } from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const u = await register(form);
      toast.success(`Welcome, ${u.name.split(' ')[0]}.`);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Create account"
      subtitle="Join 50,000+ shoppers using ShopNow."
      footer={<>Already have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link></>}
    >
      <form onSubmit={submit}>
        <FormField label="Full name" name="name" value={form.name} onChange={onChange} placeholder="Your name" required autoComplete="name" />
        <FormField label="Email" type="email" name="email" value={form.email} onChange={onChange} placeholder="you@example.com" required autoComplete="email" />
        <FormField label="Phone (optional)" type="tel" name="phone" value={form.phone} onChange={onChange} placeholder="+91 80000 00000" autoComplete="tel" />
        <FormField label="Password" type="password" name="password" value={form.password} onChange={onChange} placeholder="At least 6 characters" required autoComplete="new-password" />
        <FormField label="Confirm password" type="password" name="confirm" value={form.confirm} onChange={onChange} placeholder="Re-enter password" required autoComplete="new-password" />

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#ef4444',
            padding: '10px 14px',
            borderRadius: 10,
            fontSize: 13,
            marginBottom: 14,
          }}>{error}</div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', opacity: busy ? 0.7 : 1 }}
        >
          <UserPlus size={16} /> {busy ? 'Creating account…' : 'Create account'}
        </button>

        <p style={{
          marginTop: 16, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6,
        }}>
          By creating an account you agree to our <Link to="/terms" style={{ color: 'var(--text-secondary)' }}>Terms</Link> and <Link to="/privacy" style={{ color: 'var(--text-secondary)' }}>Privacy Policy</Link>.
        </p>
      </form>
    </AuthShell>
  );
}
