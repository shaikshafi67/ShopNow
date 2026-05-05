import { useState } from 'react';
import { Link } from 'react-router-dom';
import InfoPage from './InfoPage';
import { usePages } from '../context/PagesContext';

/* Renders a page whose content is managed via the admin Pages editor (rich HTML). */
function DynamicInfoPage({ pageId, fallbackTitle }) {
  const { getPage } = usePages();
  const page = getPage(pageId);
  const title = page?.title ?? fallbackTitle;
  const content = page?.content ?? '<p>Content coming soon.</p>';

  return (
    <InfoPage title={title} htmlContent={content} />
  );
}

export function PrivacyPage()  { return <DynamicInfoPage pageId="privacy"  fallbackTitle="Privacy Policy" />; }
export function TermsPage()    { return <DynamicInfoPage pageId="terms"    fallbackTitle="Terms of Use" />; }
export function ShippingInfoPage() { return <DynamicInfoPage pageId="shipping" fallbackTitle="Shipping Information" />; }
export function ReturnsPage()  { return <DynamicInfoPage pageId="returns"  fallbackTitle="Returns & Exchanges" />; }
export function AboutPage()    { return <DynamicInfoPage pageId="about"    fallbackTitle="About ShopNow" />; }
export function ContactPage()  { return <DynamicInfoPage pageId="contact"  fallbackTitle="Contact Us" />; }
export function CareersPage()  { return <DynamicInfoPage pageId="careers"  fallbackTitle="Careers" />; }

/* ── Pages without context editing (utility/catalog pages) ── */

/* ─── Size Guide ─── */
const MEN_SHIRTS = [
  { size:'S',    chestIn:'36–38', chestCm:'91–96',   waistIn:'30–32', waistCm:'76–81',  sleeveIn:'32½', sleeveCm:'82' },
  { size:'M',    chestIn:'38–40', chestCm:'96–102',  waistIn:'32–34', waistCm:'81–86',  sleeveIn:'33',  sleeveCm:'84' },
  { size:'L',    chestIn:'40–42', chestCm:'102–107', waistIn:'34–36', waistCm:'86–91',  sleeveIn:'33½', sleeveCm:'85' },
  { size:'XL',   chestIn:'42–44', chestCm:'107–112', waistIn:'36–38', waistCm:'91–96',  sleeveIn:'34',  sleeveCm:'86' },
  { size:'XXL',  chestIn:'44–46', chestCm:'112–117', waistIn:'38–40', waistCm:'96–102', sleeveIn:'34½', sleeveCm:'87' },
  { size:'XXXL', chestIn:'46–48', chestCm:'117–122', waistIn:'40–42', waistCm:'102–107',sleeveIn:'35',  sleeveCm:'89' },
];

const WOMEN_TOPS = [
  { size:'XS',  bustIn:'30–31', bustCm:'76–79',   waistIn:'24–25', waistCm:'61–64', hipIn:'33–34', hipCm:'84–86'  },
  { size:'S',   bustIn:'32–33', bustCm:'81–84',   waistIn:'26–27', waistCm:'66–69', hipIn:'35–36', hipCm:'89–91'  },
  { size:'M',   bustIn:'34–35', bustCm:'86–89',   waistIn:'28–29', waistCm:'71–74', hipIn:'37–38', hipCm:'94–97'  },
  { size:'L',   bustIn:'36–37', bustCm:'91–94',   waistIn:'30–31', waistCm:'76–79', hipIn:'39–40', hipCm:'99–102' },
  { size:'XL',  bustIn:'38–39', bustCm:'97–99',   waistIn:'32–33', waistCm:'81–84', hipIn:'41–42', hipCm:'104–107'},
  { size:'XXL', bustIn:'40–41', bustCm:'102–104', waistIn:'34–35', waistCm:'86–89', hipIn:'43–44', hipCm:'109–112'},
];

const WOMEN_KURTIS = [
  { size:'XS',   bustIn:'32', bustCm:'81',  waistIn:'26', waistCm:'66', hipIn:'34', hipCm:'86',  lenIn:'42' },
  { size:'S',    bustIn:'34', bustCm:'86',  waistIn:'28', waistCm:'71', hipIn:'36', hipCm:'91',  lenIn:'43' },
  { size:'M',    bustIn:'36', bustCm:'91',  waistIn:'30', waistCm:'76', hipIn:'38', hipCm:'97',  lenIn:'44' },
  { size:'L',    bustIn:'38', bustCm:'97',  waistIn:'32', waistCm:'81', hipIn:'40', hipCm:'102', lenIn:'44½'},
  { size:'XL',   bustIn:'40', bustCm:'102', waistIn:'34', waistCm:'86', hipIn:'42', hipCm:'107', lenIn:'45' },
  { size:'XXL',  bustIn:'42', bustCm:'107', waistIn:'36', waistCm:'91', hipIn:'44', hipCm:'112', lenIn:'45½'},
  { size:'XXXL', bustIn:'44', bustCm:'112', waistIn:'38', waistCm:'97', hipIn:'46', hipCm:'117', lenIn:'46' },
];

const WOMEN_SAREES = [
  { size:'32', bustIn:'32', bustCm:'81',  waistIn:'26', waistCm:'66', blouseLen:'15',  sareeLen:'5.5 m' },
  { size:'34', bustIn:'34', bustCm:'86',  waistIn:'28', waistCm:'71', blouseLen:'15',  sareeLen:'5.5 m' },
  { size:'36', bustIn:'36', bustCm:'91',  waistIn:'30', waistCm:'76', blouseLen:'15½', sareeLen:'5.5 m' },
  { size:'38', bustIn:'38', bustCm:'97',  waistIn:'32', waistCm:'81', blouseLen:'16',  sareeLen:'5.5 m' },
  { size:'40', bustIn:'40', bustCm:'102', waistIn:'34', waistCm:'86', blouseLen:'16',  sareeLen:'5.5 m' },
  { size:'42', bustIn:'42', bustCm:'107', waistIn:'36', waistCm:'91', blouseLen:'16½', sareeLen:'5.5 m' },
];

const WOMEN_JEANS = [
  { size:'26', waistIn:'26', waistCm:'66', hipIn:'35', hipCm:'89',  inseamIn:'30',  inseamCm:'76' },
  { size:'28', waistIn:'28', waistCm:'71', hipIn:'37', hipCm:'94',  inseamIn:'30',  inseamCm:'76' },
  { size:'30', waistIn:'30', waistCm:'76', hipIn:'39', hipCm:'99',  inseamIn:'30½', inseamCm:'77' },
  { size:'32', waistIn:'32', waistCm:'81', hipIn:'41', hipCm:'104', inseamIn:'31',  inseamCm:'79' },
  { size:'34', waistIn:'34', waistCm:'86', hipIn:'43', hipCm:'109', inseamIn:'31',  inseamCm:'79' },
  { size:'36', waistIn:'36', waistCm:'91', hipIn:'45', hipCm:'114', inseamIn:'31½', inseamCm:'80' },
];

function SizeTable({ headers, rows, accent = '#7c6aff' }) {
  const thStyle = {
    padding: '11px 14px', fontSize: 11, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '1px',
    background: accent + '18', color: accent,
    borderBottom: `2px solid ${accent}33`,
    whiteSpace: 'nowrap', textAlign: 'left',
  };
  const tdStyle = (i) => ({
    padding: '10px 14px', fontSize: 13,
    borderBottom: '1px solid var(--border-glass)',
    color: i === 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
    fontWeight: i === 0 ? 700 : 400,
    whiteSpace: 'nowrap',
  });
  return (
    <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border-glass)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
        <thead>
          <tr>{headers.map((h, i) => <th key={i} style={thStyle}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? 'var(--bg-glass)' : 'transparent' }}>
              {row.map((cell, ci) => <td key={ci} style={tdStyle(ci)}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SizeSection({ title, accent, children }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 4, height: 28, borderRadius: 2, background: accent, flexShrink: 0 }} />
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function SizeGuidePage() {
  const [unit, setUnit] = useState('both'); // 'in' | 'cm' | 'both'
  const show = (val, type) => unit === 'both' ? val : unit === type ? val : null;

  const menHeaders = ['Size',
    ...(unit !== 'cm' ? ['Chest (in)', 'Waist (in)', 'Sleeve (in)'] : []),
    ...(unit !== 'in' ? ['Chest (cm)', 'Waist (cm)', 'Sleeve (cm)'] : []),
  ];

  const topHeaders = ['Size',
    ...(unit !== 'cm' ? ['Bust (in)', 'Waist (in)', 'Hip (in)'] : []),
    ...(unit !== 'in' ? ['Bust (cm)', 'Waist (cm)', 'Hip (cm)'] : []),
  ];

  const kurti_headers = ['Size',
    ...(unit !== 'cm' ? ['Bust (in)', 'Waist (in)', 'Hip (in)', 'Length (in)'] : []),
    ...(unit !== 'in' ? ['Bust (cm)', 'Waist (cm)', 'Hip (cm)'] : []),
  ];

  const sareeHeaders = ['Blouse Size',
    ...(unit !== 'cm' ? ['Bust (in)', 'Waist (in)', 'Blouse Len (in)'] : []),
    ...(unit !== 'in' ? ['Bust (cm)', 'Waist (cm)'] : []),
    'Saree Length',
  ];

  const jeansHeaders = ['Waist Size',
    ...(unit !== 'cm' ? ['Waist (in)', 'Hip (in)', 'Inseam (in)'] : []),
    ...(unit !== 'in' ? ['Waist (cm)', 'Hip (cm)', 'Inseam (cm)'] : []),
  ];

  const menRows = MEN_SHIRTS.map(r => [r.size,
    ...(unit !== 'cm' ? [r.chestIn, r.waistIn, r.sleeveIn] : []),
    ...(unit !== 'in' ? [r.chestCm, r.waistCm, r.sleeveCm] : []),
  ]);
  const topRows = WOMEN_TOPS.map(r => [r.size,
    ...(unit !== 'cm' ? [r.bustIn, r.waistIn, r.hipIn] : []),
    ...(unit !== 'in' ? [r.bustCm, r.waistCm, r.hipCm] : []),
  ]);
  const kurti_rows = WOMEN_KURTIS.map(r => [r.size,
    ...(unit !== 'cm' ? [r.bustIn, r.waistIn, r.hipIn, r.lenIn] : []),
    ...(unit !== 'in' ? [r.bustCm, r.waistCm, r.hipCm] : []),
  ]);
  const sareeRows = WOMEN_SAREES.map(r => [r.size,
    ...(unit !== 'cm' ? [r.bustIn, r.waistIn, r.blouseLen] : []),
    ...(unit !== 'in' ? [r.bustCm, r.waistCm] : []),
    r.sareeLen,
  ]);
  const jeansRows = WOMEN_JEANS.map(r => [r.size,
    ...(unit !== 'cm' ? [r.waistIn, r.hipIn, r.inseamIn] : []),
    ...(unit !== 'in' ? [r.waistCm, r.hipCm, r.inseamCm] : []),
  ]);

  const btnStyle = (active) => ({
    padding: '8px 18px', borderRadius: 20, border: 'none', cursor: 'pointer',
    fontSize: 12, fontWeight: 700,
    background: active ? 'var(--accent)' : 'var(--bg-glass)',
    color: active ? 'white' : 'var(--text-secondary)',
    border: `1px solid ${active ? 'var(--accent)' : 'var(--border-glass)'}`,
    transition: 'all 0.2s',
  });

  return (
    <div style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div className="container" style={{ padding: '60px 24px 100px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: 12 }}>Fit Guide</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,5vw,52px)', fontWeight: 800, letterSpacing: '-2px', marginBottom: 14 }}>
            Size Chart
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 540, margin: '0 auto 28px' }}>
            Measure yourself once and shop with confidence. All sizes follow Indian standard sizing.
          </p>

          {/* Unit toggle */}
          <div style={{ display: 'inline-flex', gap: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 30, padding: 4 }}>
            {[['both','Inches + CM'],['in','Inches only'],['cm','CM only']].map(([val, label]) => (
              <button key={val} onClick={() => setUnit(val)} style={btnStyle(unit === val)}>{label}</button>
            ))}
          </div>
        </div>

        {/* How to Measure */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 20, padding: '24px 28px', marginBottom: 48 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, marginBottom: 16, color: 'var(--text-primary)' }}>📐 How to Measure</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[
              ['Chest / Bust', 'Measure around the fullest part, just under the arms.'],
              ['Waist', 'Measure around the narrowest part of your natural waist.'],
              ['Hip', 'Measure around the widest part, ~20 cm below your waist.'],
              ['Sleeve', 'From center back neck, over shoulder, down to wrist.'],
              ['Inseam', 'From top of inner thigh down to the ankle.'],
              ['Kurti Length', 'From the highest shoulder point down to the hem.'],
            ].map(([title, desc]) => (
              <div key={title} style={{ background: 'var(--bg-glass)', borderRadius: 10, padding: '12px 14px' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{title}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ══ MEN'S SECTION ══ */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32, paddingBottom: 16, borderBottom: '2px solid var(--border-glass)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124,106,255,0.15)', border: '1px solid rgba(124,106,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👔</div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, margin: 0, color: '#7c6aff' }}>Men's Size Chart</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Shirts, T-Shirts & Tops</p>
            </div>
          </div>

          <SizeSection title="Shirts & T-Shirts" accent="#7c6aff">
            <SizeTable headers={menHeaders} rows={menRows} accent="#7c6aff" />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
              💡 For a relaxed fit, size up. For slim fit shirts, choose your exact chest size.
            </p>
          </SizeSection>
        </div>

        {/* ══ WOMEN'S SECTION ══ */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32, paddingBottom: 16, borderBottom: '2px solid var(--border-glass)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,106,154,0.15)', border: '1px solid rgba(255,106,154,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👗</div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, margin: 0, color: '#ff6a9a' }}>Women's Size Chart</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Sarees, Kurtis, Tops & Jeans</p>
            </div>
          </div>

          <SizeSection title="Tops & Blouses" accent="#ff6a9a">
            <SizeTable headers={topHeaders} rows={topRows} accent="#ff6a9a" />
          </SizeSection>

          <SizeSection title="Kurtis" accent="#fb923c">
            <SizeTable headers={kurti_headers} rows={kurti_rows} accent="#fb923c" />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
              💡 Kurti length is measured from shoulder to hem. Standard length is 42–46 inches.
            </p>
          </SizeSection>

          <SizeSection title="Sarees (Blouse Sizing)" accent="#a855f7">
            <SizeTable headers={sareeHeaders} rows={sareeRows} accent="#a855f7" />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
              💡 Standard saree length is 5.5 metres including blouse piece. Petticoat size matches your waist measurement.
            </p>
          </SizeSection>

          <SizeSection title="Jeans & Trousers" accent="#3b82f6">
            <SizeTable headers={jeansHeaders} rows={jeansRows} accent="#3b82f6" />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
              💡 Waist size shown is the US/UK numeric waist. Standard inseam is 30–31½ inches for regular length.
            </p>
          </SizeSection>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '40px 24px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 20 }}>
          <p style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: 8 }}>Still not sure of your size?</p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 14 }}>Try our 3D Try-On — see exactly how any outfit fits on you before buying.</p>
          <Link to="/tryon/live" style={{ textDecoration: 'none' }}>
            <button style={{ padding: '13px 32px', borderRadius: 50, background: 'var(--gradient-1)', border: 'none', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              Open 3D Try-On →
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function TrackOrderPage() {
  return (
    <InfoPage
      title="Track Your Order"
      subtitle="Enter your order ID and registered email to see live status updates."
      sections={[
        { heading: 'Where to Find Your Order ID', body: 'Your order ID was sent to you via email and SMS at the time of purchase. It looks like SHN-2026-XXXXXX. You can also find it in the "My Orders" section of your account.' },
        { heading: 'Status Stages', list: ['Confirmed — payment received, preparing your order.', 'Packed — your items are packed and ready for pickup.', 'Shipped — handed to courier with a live tracking link.', 'Out for Delivery — arriving today.', 'Delivered — enjoy your order.'] },
        { heading: 'Delayed Order?', body: 'Most delays are caused by incorrect addresses or courier rerouting. If your order has not moved in 48 hours, contact our support team and we will sort it out fast.' },
      ]}
      cta={{ heading: 'Have an issue with your order?', body: 'Reach out and we will help you within 24 hours.', primaryLabel: 'Contact Us', primaryTo: '/contact' }}
    />
  );
}

export function PressPage() {
  return (
    <InfoPage
      title="Press"
      subtitle="News, brand assets, and media enquiries. For coverage, get in touch with our press team."
      sections={[
        { heading: 'In the News', list: ['"How ShopNow is rebuilding fashion shopping with AI" — TechCrunch India, March 2026.', '"The startup that ended the fitting-room nightmare" — YourStory, January 2026.', '"The 30 most innovative fashion startups of 2025" — Vogue Business, December 2025.'] },
        { heading: 'Press Kit', body: 'Download our brand assets — logos, founder photos, product screenshots, and one-pager — from press.shopnow.example/kit.' },
        { heading: 'Media Enquiries', body: 'For interviews, quotes, or expert commentary on fashion, AI, or e-commerce trends, write to press@shopnow.example.' },
      ]}
      cta={{ heading: 'Want to feature us?', body: 'Drop us a line — we love working with thoughtful storytellers.', primaryLabel: 'Contact Press', primaryTo: '/contact' }}
    />
  );
}

export function NewArrivalsPage() {
  return (
    <InfoPage
      title="New Arrivals"
      subtitle="Just dropped — the latest pieces from our newest collections. Refreshed weekly."
      sections={[
        { heading: 'This Week', body: 'Our newest drops blend modern silhouettes with everyday comfort. Each piece is curated by our in-house stylists and available in limited quantities — once they sell out, they are gone.' },
        { heading: 'Restocks', body: 'Customer favourites are back in stock. If you missed out last time, check now — popular sizes go fast.' },
      ]}
      cta={{ heading: 'Browse the latest', body: 'Jump straight into the freshest pieces — try them on in 3D before checkout.', primaryLabel: 'Shop Men', primaryTo: '/men' }}
    />
  );
}

export function SalePage() {
  return (
    <InfoPage
      title="Sale"
      subtitle="Up to 60% off on selected styles. While stocks last — popular sizes sell out fast."
      sections={[
        { heading: 'How the Sale Works', list: ['Discounts are applied automatically at checkout.', 'Sale items can be returned within 15 days (instead of the usual 30).', 'Cannot be combined with other discount codes.', 'Free shipping still applies on orders above ₹999.'] },
        { heading: 'Tip', body: 'Use the 3D try-on before checkout — sale items move fast and you do not want to wait for a return.' },
      ]}
      cta={{ heading: 'Shop the sale', body: 'Limited quantities — your size may already be running low.', primaryLabel: 'Shop Women', primaryTo: '/women' }}
    />
  );
}
