import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import AuthShell, { FormField } from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const u = await login(form);
      toast.success(`Welcome back, ${u.name.split(' ')[0]}.`);
      // Admin always goes to admin panel; regular users never land on admin pages
      const isAdminRoute = redirectTo.startsWith('/admin');
      let destination;
      if (u.role === 'admin') destination = '/admin';
      else if (isAdminRoute) destination = '/';
      else destination = redirectTo;
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Welcome back. Sign in to continue shopping."
      footer={<>Don't have an account? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Create one</Link></>}
    >
      <form onSubmit={submit}>
        <FormField
          label="Email"
          type="email"
          name="email"
          value={form.email}
          onChange={onChange}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        <FormField
          label="Password"
          type="password"
          name="password"
          value={form.password}
          onChange={onChange}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />

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
          <LogIn size={16} /> {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <p style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          <Link to="/forgot-password" style={{ color: 'var(--accent)', fontWeight: 600 }}>Forgot password?</Link>
        </p>
      </form>
    </AuthShell>
  );
}
