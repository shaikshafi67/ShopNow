import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Share2, X as XIcon, Music2, Mail, ArrowRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-glass)',
      padding: '60px 0 30px',
      marginTop: 80,
    }}>
      <div className="container">
        {/* Newsletter strip */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            background: 'linear-gradient(135deg, rgba(124,106,255,0.15) 0%, rgba(255,106,154,0.15) 100%)',
            border: '1px solid var(--border-glass)',
            borderRadius: 24,
            padding: '40px 40px',
            marginBottom: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
              Get Exclusive Drops First
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Join 50,000+ fashion-forward subscribers. No spam, ever.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              placeholder="your@email.com"
              style={{
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-glass)',
                borderRadius: 50,
                padding: '12px 20px',
                color: 'var(--text-primary)',
                fontSize: 14,
                outline: 'none',
                width: 240,
                fontFamily: 'var(--font-body)',
              }}
            />
            <button className="btn btn-primary" style={{ gap: 8 }}>
              Subscribe <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>

        {/* Main footer grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 48, flexWrap: 'wrap' }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'var(--gradient-1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={18} color="white" />
              </div>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
                background: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>ShopNow</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, maxWidth: 280, marginBottom: 20 }}>
              The future of fashion shopping. Try on clothes virtually with our cutting-edge 3D AI technology before you buy.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {[Share2, XIcon, Music2].map((Icon, i) => (
                <motion.a
                  key={i}
                  whileHover={{ scale: 1.1, y: -2 }}
                  href="#"
                  style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-glass)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    transition: 'all var(--transition)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-glass)'; }}
                >
                  <Icon size={18} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links */}
          {[
            {
              title: 'Shop',
              links: [
                { label: 'Men\'s Collection', to: '/men' },
                { label: 'Women\'s Collection', to: '/women' },
                { label: '3D Try-On', to: '/tryon/live' },
                { label: 'New Arrivals', to: '/new-arrivals' },
                { label: 'Sale', to: '/sale' },
              ],
            },
            {
              title: 'Help',
              links: [
                { label: 'Size Guide', to: '/size-guide' },
                { label: 'Shipping Info', to: '/shipping' },
                { label: 'Returns', to: '/returns' },
                { label: 'Track Order', to: '/track-order' },
                { label: 'Contact Us', to: '/contact' },
              ],
            },
            {
              title: 'Company',
              links: [
                { label: 'About Us', to: '/about' },
                { label: 'Careers', to: '/careers' },
                { label: 'Press', to: '/press' },
                { label: 'Privacy Policy', to: '/privacy' },
                { label: 'Terms', to: '/terms' },
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-muted)', marginBottom: 16 }}>
                {col.title}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map((l) => (
                  <Link
                    key={l.label}
                    to={l.to}
                    style={{
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                      fontSize: 14,
                      transition: 'color var(--transition)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div style={{
          borderTop: '1px solid var(--border-glass)',
          paddingTop: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            © 2026 ShopNow. All rights reserved. Made in India.
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            {['Visa', 'Mastercard', 'UPI', 'GPay'].map(p => (
              <span key={p} style={{
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-glass)',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 12,
                color: 'var(--text-muted)',
              }}>{p}</span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          footer .container > div:nth-child(2) {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 600px) {
          footer .container > div:nth-child(1) {
            flex-direction: column !important;
          }
          footer .container > div:nth-child(2) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}
