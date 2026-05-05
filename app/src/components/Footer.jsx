import { Link } from 'react-router-dom';
import { useBrand } from '../context/BrandContext';

const POLICIES = [
  { label: 'About Us',         to: '/about'    },
  { label: 'Privacy Policy',   to: '/privacy'  },
  { label: 'Shipping Policy',  to: '/shipping' },
  { label: 'Refund Policy',    to: '/returns'  },
  { label: 'Terms of Service', to: '/terms'    },
  { label: 'Contact Us',       to: '/contact'  },
];

function FacebookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.45A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.97C5.12 20 12 20 12 20s6.88 0 8.59-.45a2.78 2.78 0 0 0 1.95-1.97A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/>
    </svg>
  );
}

const SOCIAL_CONFIG = [
  { key: 'facebook',  Icon: FacebookIcon,  label: 'Facebook'  },
  { key: 'instagram', Icon: InstagramIcon, label: 'Instagram' },
  { key: 'youtube',   Icon: YoutubeIcon,   label: 'YouTube'   },
];

export default function Footer() {
  const { logoUrl, brandName, socials } = useBrand();
  const activeSocials = SOCIAL_CONFIG.filter(s => socials?.[s.key]);

  return (
    <footer style={{
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-glass)',
      marginTop: 80,
    }}>
      <div className="container" style={{ padding: '60px 24px 0' }}>

        {/* Main row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 48,
          flexWrap: 'wrap',
          paddingBottom: 48,
        }}>

          {/* ── Left: Brand ── */}
          <div style={{ maxWidth: 440 }}>
            {/* Brand name / logo */}
            {logoUrl ? (
              <img src={logoUrl} alt={brandName}
                style={{ height: 56, maxWidth: 300, objectFit: 'contain', display: 'block', marginBottom: 20 }} />
            ) : (
              <h2 style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 'clamp(42px, 6vw, 72px)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 20px',
                lineHeight: 1,
                letterSpacing: '-1px',
              }}>
                {brandName}
              </h2>
            )}

            {/* Tagline */}
            <p style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              marginBottom: 24,
              lineHeight: 1.6,
            }}>
              {brandName} – Women Fashion Trendy &amp; affordable styles
            </p>

            {/* Contact */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>India</p>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
                Phone: <strong style={{ color: 'var(--text-primary)' }}>9173063820</strong>
              </p>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
                Email: <strong style={{ color: 'var(--text-primary)' }}>support@shopnow.in</strong>
              </p>
            </div>

            {/* Socials */}
            {activeSocials.length > 0 && (
              <>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
                  Stay Connected
                </p>
                <div style={{ display: 'flex', gap: 16 }}>
                  {activeSocials.map(({ key, Icon, label }) => (
                    <a
                      key={key}
                      href={socials[key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                    >
                      <Icon />
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── Right: Policies ── */}
          <div>
            <h4 style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 18px',
            }}>
              Our Policies
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {POLICIES.map(({ label, to }) => (
                <Link
                  key={to}
                  to={to}
                  style={{
                    fontSize: 14,
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid var(--border-glass)',
          padding: '20px 0',
        }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Copyrights &copy; 2026 {brandName}. All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
