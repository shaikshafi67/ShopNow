import { createContext, useContext, useState, useCallback } from 'react';

const STORAGE_KEY = 'shopnow:pages_v2';

const now = new Date().toISOString();

export const SEED_PAGES = [
  {
    id: 'privacy', title: 'Privacy Policy', slug: 'privacy',
    status: 'published', template: 'page', updatedAt: now, createdAt: now,
    metaTitle: 'Privacy Policy — ShopNow', metaDescription: 'Read ShopNow\'s privacy policy to understand how we collect and use your data.',
    content: `<p>Last updated: January 2026. We take your privacy seriously and only collect what we need to serve you better.</p><h2>What We Collect</h2><ul><li>Account data — name, email, phone, and shipping address.</li><li>Order data — what you bought, when, and where it was shipped.</li><li>Try-on photos — processed on-device whenever possible, never sold.</li><li>Usage analytics — pages visited and features used, in aggregate.</li></ul><h2>How We Use It</h2><p>We use your data to fulfil orders, personalise recommendations, improve the product, and send you updates you have explicitly opted into. We never sell your data to third parties.</p><h2>Your Rights</h2><ul><li>Access — request a copy of all the data we hold about you.</li><li>Correction — fix any inaccurate data on file.</li><li>Deletion — close your account and erase all personal data.</li><li>Portability — export your data in a machine-readable format.</li></ul><h2>Cookies</h2><p>We use essential cookies to keep you signed in and remember your cart, plus analytics cookies to understand usage. You can manage cookie preferences from your account settings.</p><h2>Contact</h2><p>For any privacy-related question or to exercise your rights, write to <strong>privacy@shopnow.example</strong>.</p>`,
  },
  {
    id: 'terms', title: 'Terms of Use', slug: 'terms',
    status: 'published', template: 'page', updatedAt: now, createdAt: now,
    metaTitle: 'Terms of Use — ShopNow', metaDescription: 'Terms and conditions for using ShopNow.',
    content: `<p>Last updated: January 2026. By using ShopNow you agree to the following terms.</p><h2>Using ShopNow</h2><p>You must be 18 or older, or have the consent of a parent or guardian, to make a purchase. You are responsible for keeping your account credentials secure.</p><h2>Orders and Payment</h2><ul><li>All prices are in Indian Rupees (₹) and inclusive of GST unless stated otherwise.</li><li>We reserve the right to cancel orders flagged for fraud or pricing errors.</li><li>Promotional discounts cannot be combined unless explicitly stated.</li><li>Payment is processed by trusted gateways — we do not store full card details.</li></ul><h2>Try-On Content</h2><p>You retain ownership of any photos you upload for the 3D try-on. By uploading, you grant us a limited licence to process the image for the sole purpose of generating your try-on result.</p><h2>Intellectual Property</h2><p>All site content — including text, images, logos, and software — is the property of ShopNow or its licensors and protected by copyright laws.</p><h2>Limitation of Liability</h2><p>ShopNow is not liable for indirect or consequential losses arising from the use of the platform. Our total liability is limited to the value of the relevant order.</p><h2>Governing Law</h2><p>These terms are governed by the laws of India. Any disputes will be subject to the exclusive jurisdiction of the courts of Bengaluru, Karnataka.</p>`,
  },
  {
    id: 'shipping', title: 'Shipping Policy', slug: 'shipping',
    status: 'published', template: 'page', updatedAt: now, createdAt: now,
    metaTitle: 'Shipping Information — ShopNow', metaDescription: 'Delivery times, shipping charges, and tracking information.',
    content: `<p>Fast, tracked delivery to your doorstep. Free shipping on all orders above ₹999.</p><h2>Delivery Times</h2><ul><li>Metro cities — 1 to 2 business days.</li><li>Tier-1 cities — 2 to 4 business days.</li><li>Other regions — 4 to 7 business days.</li><li>International orders — 7 to 14 business days.</li></ul><h2>Shipping Charges</h2><ul><li>Free standard shipping on orders above ₹999.</li><li>Standard shipping on orders below ₹999 — ₹49.</li><li>Express delivery (24-hour metro) — ₹149.</li><li>International — calculated at checkout based on destination.</li></ul><h2>Order Processing</h2><p>Orders placed before 2:00 PM IST on a business day are processed the same day. Orders placed after 2:00 PM, on weekends, or on holidays are processed the next business day.</p><h2>Tracking</h2><p>You will receive a tracking link via email and SMS as soon as your order ships. You can also track your order from the <strong>Track Order</strong> page using your order ID.</p>`,
  },
  {
    id: 'returns', title: 'Return Policy', slug: 'returns',
    status: 'published', template: 'page', updatedAt: now, createdAt: now,
    metaTitle: 'Returns & Exchanges — ShopNow', metaDescription: 'Easy 30-day returns and exchange policy.',
    content: `<p>Easy 30-day returns. If something is not right, we will make it right — no questions asked.</p><h2>Return Policy</h2><ul><li>30-day return window from the date of delivery.</li><li>Items must be unworn, unwashed, and have all original tags attached.</li><li>Original packaging required for fastest refunds.</li><li>Innerwear, swimwear, and final-sale items cannot be returned.</li></ul><h2>How to Return</h2><ul><li>Open the order from your account and tap "Request Return".</li><li>Choose a reason and select pickup or self-ship.</li><li>Pack the item securely with tags intact.</li><li>Hand it to our courier or drop it at the nearest partner location.</li></ul><h2>Refund Timeline</h2><p>Once we receive and inspect your return, refunds are issued within 3 to 5 business days to your original payment method. UPI and wallet refunds are usually instant after approval.</p><h2>Exchanges</h2><p>Want a different size or colour? Request an exchange instead of a return — we will pick up the original and ship the replacement at no extra cost.</p>`,
  },
  {
    id: 'about', title: 'About Us', slug: 'about',
    status: 'published', template: 'page', updatedAt: now, createdAt: now,
    metaTitle: 'About ShopNow', metaDescription: 'Learn about ShopNow and our mission to transform fashion shopping.',
    content: `<p>Welcome to <strong>ShopNow</strong> — reimagining how the world shops for fashion by letting you try anything on, virtually, before you buy.</p><h2>Our Mission</h2><p>Online shopping has a fit problem. Up to 40% of fashion returns happen because of sizing. We are fixing that with AI and 3D — so you only ever order what truly suits you.</p><h2>Our Story</h2><p>ShopNow was founded in 2024 by a small team of engineers, designers, and fashion enthusiasts in Bengaluru. What began as a research project on virtual garments has grown into a platform serving customers across India.</p><h2>What Makes Us Different</h2><ul><li>Photoreal 3D try-on powered by advanced diffusion models.</li><li>Curated collections — we only stock what we would wear ourselves.</li><li>Sustainable packaging on every single order.</li><li>A no-questions-asked 30-day return promise.</li></ul><h2>The Numbers</h2><ul><li>50,000+ happy customers across India.</li><li>120+ partner brands.</li><li>94% customer satisfaction score.</li><li>&lt; 8% return rate, well below the industry average.</li></ul>`,
  },
  {
    id: 'contact', title: 'Contact Us', slug: 'contact',
    status: 'published', template: 'page', updatedAt: now, createdAt: now,
    metaTitle: 'Contact ShopNow', metaDescription: 'Get in touch with ShopNow support team.',
    content: `<p>We are here to help. Choose the channel that works best for you — we reply fast.</p><h2>Customer Support</h2><ul><li>Email — <strong>support@shopnow.example</strong></li><li>Phone — +91 80000 00000 (Mon to Sat, 9 AM to 9 PM IST)</li><li>Live Chat — tap the chat bubble at the bottom of any page.</li><li>WhatsApp — +91 80000 00000</li></ul><h2>Press &amp; Media</h2><p>For press enquiries, partnerships, or interview requests, write to press@shopnow.example with a brief about your story.</p><h2>Office</h2><p>ShopNow Technologies Pvt Ltd<br>4th Floor, Innovation Hub, HSR Layout<br>Bengaluru, Karnataka 560102, India.</p>`,
  },
  {
    id: 'careers', title: 'Careers', slug: 'careers',
    status: 'published', template: 'page', updatedAt: now, createdAt: now,
    metaTitle: 'Careers at ShopNow', metaDescription: 'Join the ShopNow team and help build the future of fashion.',
    content: `<p>Help us build the future of fashion. Remote-friendly, ambitious, and humble.</p><h2>Why ShopNow</h2><ul><li>Work on hard, original problems in 3D, AI, and commerce.</li><li>Small team, high autonomy — your work ships to real users every week.</li><li>Competitive compensation, meaningful equity, and a learning budget.</li><li>Remote-first across India with quarterly team offsites.</li></ul><h2>Open Roles</h2><ul><li>Senior Frontend Engineer — React, WebGL, Three.js (Remote).</li><li>ML Engineer — diffusion models, garment synthesis (Bengaluru / Remote).</li><li>Product Designer — visual systems, motion (Remote).</li><li>Customer Experience Lead (Bengaluru).</li><li>Growth Marketing Manager (Bengaluru / Remote).</li></ul><h2>How to Apply</h2><p>Send your CV, portfolio, and a short note about why you want to join to <strong>careers@shopnow.example</strong>. We read every application and reply within a week.</p>`,
  },
];

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : SEED_PAGES;
  } catch { return SEED_PAGES; }
}

function persist(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const PagesContext = createContext(null);

export function PagesProvider({ children }) {
  const [pages, setPages] = useState(load);

  const updatePage = useCallback((id, data) => {
    setPages((prev) => {
      const next = prev.map((p) => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p);
      persist(next);
      return next;
    });
  }, []);

  const deletePage = useCallback((id) => {
    setPages((prev) => { const next = prev.filter((p) => p.id !== id); persist(next); return next; });
  }, []);

  const bulkDelete = useCallback((ids) => {
    setPages((prev) => { const next = prev.filter((p) => !ids.includes(p.id)); persist(next); return next; });
  }, []);

  const bulkSetStatus = useCallback((ids, status) => {
    setPages((prev) => {
      const next = prev.map((p) => ids.includes(p.id) ? { ...p, status, updatedAt: new Date().toISOString() } : p);
      persist(next);
      return next;
    });
  }, []);

  const createPage = useCallback((data) => {
    const page = {
      id: 'page_' + Date.now(),
      title: data.title || 'Untitled page',
      slug: data.slug || 'untitled-' + Date.now(),
      content: data.content || '',
      status: 'hidden',
      template: 'page',
      metaTitle: '',
      metaDescription: '',
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setPages((prev) => { const next = [page, ...prev]; persist(next); return next; });
    return page;
  }, []);

  const getPage = useCallback((id) => pages.find((p) => p.id === id) || null, [pages]);

  return (
    <PagesContext.Provider value={{ pages, updatePage, createPage, deletePage, bulkDelete, bulkSetStatus, getPage }}>
      {children}
    </PagesContext.Provider>
  );
}

export function usePages() { return useContext(PagesContext); }
