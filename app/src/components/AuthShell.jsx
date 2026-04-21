import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div style={{
      paddingTop: 'var(--nav-height)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 20% 10%, rgba(124,106,255,0.12), transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,106,154,0.08), transparent 40%)',
    }}>
      <div className="container" style={{ padding: '40px 24px 80px', display: 'flex', justifyContent: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            width: '100%',
            maxWidth: 440,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-glass)',
            borderRadius: 24,
            padding: '36px 32px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 24, textDecoration: 'none' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: 'var(--gradient-1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px var(--accent-glow)',
            }}>
              <Sparkles size={18} color="white" />
            </div>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
              background: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>ShopNow</span>
          </Link>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28,
            fontWeight: 800,
            textAlign: 'center',
            marginBottom: 8,
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: 14,
              textAlign: 'center',
              marginBottom: 28,
            }}>{subtitle}</p>
          )}

          {children}

          {footer && (
            <p style={{
              marginTop: 24,
              textAlign: 'center',
              fontSize: 14,
              color: 'var(--text-secondary)',
            }}>
              {footer}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export function FormField({ label, ...props }) {
  return (
    <label style={{ display: 'block', marginBottom: 16 }}>
      <span style={{
        display: 'block',
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--text-secondary)',
        marginBottom: 6,
      }}>{label}</span>
      <input
        {...props}
        style={{
          width: '100%',
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-glass)',
          borderRadius: 12,
          padding: '12px 14px',
          color: 'var(--text-primary)',
          fontSize: 15,
          fontFamily: 'var(--font-body)',
          outline: 'none',
          transition: 'border-color var(--transition)',
          ...(props.style || {}),
        }}
        onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; props.onFocus?.(e); }}
        onBlur={(e) => { e.target.style.borderColor = 'var(--border-glass)'; props.onBlur?.(e); }}
      />
    </label>
  );
}
