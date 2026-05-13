import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import AuthShell, { FormField } from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail]   = useState('');
  const [sent, setSent]     = useState(false);
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const clean = email.trim().toLowerCase();
    if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setError('Enter a valid email address.');
      return;
    }
    setBusy(true);
    try {
      await resetPassword(clean);
      setSent(true);
    } catch (err) {
      const msg = err.message?.replace('Firebase: ', '')?.replace(/\(auth\/.*?\)\.?/, '')?.trim();
      setError(msg || 'Failed to send reset email. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Reset password"
      subtitle={sent ? 'Check your inbox for the reset link.' : "Enter your email and we'll send a reset link."}
      footer={
        <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={32} color="#16a34a" />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>
            We sent a password reset link to
          </p>
          <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>{email}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Click the link in the email to reset your password. Check spam if you don't see it.
          </p>
          <button
            onClick={() => { setSent(false); setEmail(''); }}
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}
          >
            Try a different email
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
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
            <Mail size={16} /> {busy ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
