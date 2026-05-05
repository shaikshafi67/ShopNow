import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, ArrowLeft } from 'lucide-react';

export default function InfoPage({ title, subtitle, sections = [], cta, htmlContent }) {
  return (
    <div style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(124,106,255,0.12) 0%, rgba(255,106,154,0.06) 100%)',
        borderBottom: '1px solid var(--border-glass)',
        padding: '60px 0 50px',
      }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: 'var(--text-muted)', fontSize: 13 }}
          >
            <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
            <ChevronRight size={14} />
            <span style={{ color: 'var(--text-secondary)' }}>{title}</span>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(34px, 5vw, 56px)', fontWeight: 800, lineHeight: 1.05, marginBottom: 14 }}>
              {title}
            </h1>
            {subtitle && <p style={{ color: 'var(--text-secondary)', fontSize: 17, maxWidth: 720, lineHeight: 1.6 }}>{subtitle}</p>}
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ padding: '56px 24px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>

          {/* ── HTML content from admin editor ── */}
          {htmlContent ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                borderRadius: 20, padding: '36px 40px', marginBottom: 32,
                lineHeight: 1.8, fontSize: 15, color: 'var(--text-secondary)',
              }}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          ) : (
            /* ── Legacy structured sections ── */
            sections.map((sec, i) => (
              <motion.section
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 20, padding: '28px 32px', marginBottom: 20 }}
              >
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 14, color: 'var(--text-primary)' }}>
                  {sec.heading}
                </h2>
                {sec.body && <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.7, marginBottom: sec.list ? 16 : 0 }}>{sec.body}</p>}
                {sec.list && (
                  <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {sec.list.map((item, j) => (
                      <li key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6 }}>
                        <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>—</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.section>
            ))
          )}

          {/* CTA strip */}
          {cta && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              style={{ marginTop: 32, background: 'linear-gradient(135deg, rgba(124,106,255,0.1), rgba(255,106,154,0.06))', border: '1px solid var(--border-glass)', borderRadius: 20, padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}
            >
              <div>
                <p style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{cta.heading}</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{cta.body}</p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link to={cta.primaryTo || '/men'} className="btn btn-primary" style={{ textDecoration: 'none' }}>{cta.primaryLabel || 'Shop Now'}</Link>
                <Link to="/" className="btn btn-ghost" style={{ textDecoration: 'none' }}><ArrowLeft size={15} /> Back Home</Link>
              </div>
            </motion.div>
          )}

          {/* Default back link when no CTA */}
          {!cta && (
            <div style={{ marginTop: 24 }}>
              <Link to="/" className="btn btn-ghost" style={{ textDecoration: 'none' }}><ArrowLeft size={15} /> Back Home</Link>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .info-html-content h1,.info-html-content h2,.info-html-content h3{font-family:var(--font-display);}
        .info-html-content h2{font-size:20px;font-weight:700;margin:24px 0 10px;color:var(--text-primary);}
        .info-html-content p{margin-bottom:12px;}
        .info-html-content ul,.info-html-content ol{padding-left:22px;margin-bottom:14px;}
        .info-html-content li{margin-bottom:6px;}
        .info-html-content a{color:var(--accent);}
        .info-html-content hr{border:none;border-top:1px solid var(--border-glass);margin:20px 0;}
        .info-html-content strong{color:var(--text-primary);}
      `}</style>
    </div>
  );
}
