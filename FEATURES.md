# ShopNow — Features Overview

A modern, 3D-enabled fashion e-commerce frontend built with React 19, Vite, Three.js, and Framer Motion. This document lists everything currently implemented in the project.

---

## 1. Branding & Design System

- **Brand:** ShopNow — Virtual Try-On Fashion
- **Theme:** Dark, glass-morphism UI with gradient accents (purple → pink)
- **Typography:** Custom display + body font pairing via CSS variables
- **Animations:** Smooth page transitions, scroll-linked parallax, and micro-interactions powered by Framer Motion
- **Iconography:** Lucide React icons throughout
- **Responsive:** Adapts from mobile (≤600px) through tablet (≤900px) to desktop

---

## 2. Navigation

### Top Navbar (`Navbar.jsx`)
- Sticky, transparent on top, frosted-glass when scrolled
- Animated brand logo with gradient mark
- Desktop links: Home · Men · Women · Try-On (special pill)
- **Search modal** — opens a full-screen overlay search input that routes to `/search?q=...`
- **Wishlist icon** with live count badge
- **Cart button** with item count badge
- **Mobile drawer menu** that slides in from the right with staggered link animations

### Footer (`Footer.jsx`)
- Newsletter signup strip (email capture UI)
- Three link columns — Shop, Help, Company — every link routed to a real page
- Social icon row (Share, X, Music)
- Payment method badges (Visa, Mastercard, UPI, GPay)
- Fully responsive grid that collapses to 2 columns / 1 column on smaller screens

---

## 3. Pages

### Home (`/`)
- Animated hero with rotating word ("STYLE / FASHION / CULTURE / IDENTITY")
- Parallax background blobs
- Scrolling marquee strip with promotional taglines
- 4-feature grid (3D Try-On, AI Sizing, Premium Quality, Easy Returns)
- "Featured Products" carousel
- Separate "New for Men" and "New for Women" sections
- Final CTA banner driving traffic to the 3D Try-On

### Men's Catalog (`/men`)
- 3 categories: T-Shirts, Shirts, Jeans
- Filters:
  - Category tabs (All / T-Shirts / Shirts / Jeans)
  - **Live search** within the catalog
  - **Price range** slider
  - **Sort by** Featured / Price ↑ / Price ↓ / Rating / Discount
- Mobile-friendly filter drawer
- Animated product grid

### Women's Catalog (`/women`)
- 4 categories: Tops, Dresses, Kurtis, Sarees, Co-ords
- Same filtering/sorting capabilities as Men's page

### Product Detail (`/product/:id`)
- Image gallery with arrow navigation and thumbnails
- **Size selector** (XS – XXL with availability checks)
- **Color swatches**
- **Quantity stepper**
- Add to Cart with success feedback animation
- Wishlist toggle
- Share button
- Inline **3D Try-On launcher modal**
- Trust badges: Free shipping, 30-day returns, secure payments
- "Similar products" carousel

### 3D Live Try-On (`/tryon/live`)
- **Live webcam capture** via `getUserMedia`
- **4-pose guided workflow** — Front, Right, Back, Left with on-screen instructions
- 5-second **animated countdown ring** before each capture
- Real-time pose feedback
- Clothing carousel — pick from men's & women's products to try on
- **AI try-on submission** to a Hugging Face Gradio endpoint (`tryon_client.js`)
- Health-check for the try-on backend
- **3D 360° garment viewer** (`TryOn3DViewer.jsx`) — drag to rotate, multiple angles
- Body segmentation utilities (BodyPix / MediaPipe Pose)
- Face restoration via CodeFormer integration
- Multi-angle generation via Google Gemini API (`gemini3d.js`)

### Static Try-On (`/tryon`)
- Photo upload flow with tips for best results

### Cart (`/cart`)
- Empty-state UI with shop CTAs (storage layer not yet wired)

### Wishlist (`/wishlist`)
- Empty-state UI with shop CTAs

### Search (`/search?q=...`)
- Reads query from URL parameters
- Scores matches across product **name, category, tag, and description**
- Ranked results rendered in a product grid
- Empty / no-match / no-query states

### 404
- Animated, branded "Page not found" with home button

---

## 4. Information Pages (Footer)

All accessible from the footer and use a shared, animated `InfoPage` component (hero + breadcrumb + content sections + CTA strip).

### Shop
- **New Arrivals** — `/new-arrivals`
- **Sale** — `/sale`

### Help
- **Size Guide** — `/size-guide` (with Men's and Women's measurement charts)
- **Shipping Info** — `/shipping`
- **Returns & Exchanges** — `/returns`
- **Track Order** — `/track-order`
- **Contact Us** — `/contact`

### Company
- **About** — `/about`
- **Careers** — `/careers` (with sample open roles)
- **Press** — `/press`
- **Privacy Policy** — `/privacy`
- **Terms of Service** — `/terms`

---

## 5. Product Catalog

- **37 products** across men's and women's collections
- Each product includes:
  - Multiple images
  - Price, original price, discount %
  - Star rating + review count
  - Color and size variants
  - Tag (Bestseller / New / Trending)
  - Description
  - `tryOnReady` flag for 3D compatibility

**Categories:**
- Men's: T-Shirts, Shirts, Jeans
- Women's: Tops, Dresses, Kurtis, Sarees, Co-ords

---

## 6. 3D & AI Integrations

| Capability | Library / Service |
|------------|-------------------|
| 3D rendering | Three.js + @react-three/fiber + @react-three/drei |
| Garment 360° viewer | Custom `TryOn3DViewer` |
| Pose detection | MediaPipe Pose |
| Body segmentation | TensorFlow.js + BodyPix |
| Virtual try-on (IDM-VTON) | Hugging Face Gradio client |
| Face restoration | CodeFormer (HF) |
| Multi-angle generation | Google Gemini API |
| Camera capture | `useCamera` hook (`getUserMedia`) |

---

## 7. Routing

Implemented in `App.jsx` using React Router v7 with animated page transitions (`AnimatePresence`).

```
/                    → Home
/men                 → Men's catalog
/women               → Women's catalog
/product/:id         → Product detail
/tryon               → Static try-on (redirects to /tryon/live)
/tryon/live          → Live 3D try-on
/cart                → Cart
/wishlist            → Wishlist
/search?q=...        → Search results
/new-arrivals        → Latest drops
/sale                → Sale
/size-guide          → Size guide
/shipping            → Shipping info
/returns             → Returns & exchanges
/track-order         → Order tracking
/contact             → Contact
/about               → About
/careers             → Careers
/press               → Press
/privacy             → Privacy policy
/terms               → Terms of service
*                    → 404
```

The footer is hidden on the immersive try-on route for a cleaner experience.

---

## 8. Tech Stack

**Frontend**
- React 19
- Vite 8 (with Rolldown bundler)
- React Router v7
- Framer Motion (animations)
- Lucide React (icons)
- GSAP (advanced animations)

**3D / AI**
- Three.js
- @react-three/fiber + @react-three/drei
- @tensorflow/tfjs + body-pix
- @mediapipe/pose
- @google/generative-ai
- @gradio/client (Hugging Face)

**Tooling**
- ESLint with React Hooks plugin
- Vite dev server with HMR

---

## 9. Build Status

- Production build passes cleanly (~890ms, ~2150 modules)
- Total gzipped JS: ~295 KB (split across chunks for lazy loading)
- Zero emoji characters in source (intentional clean text-only UI)
- Dev server: `npm run dev` → typically `http://localhost:5173`

---

## 10. What Is *Not* Yet Built

For transparency — the following are commonly expected on a full e-commerce site but **not currently implemented**:

- User accounts / authentication (login, register, JWT)
- Real persisted cart and wishlist (currently UI-only shells)
- Backend API (Node + Express + MongoDB)
- Admin dashboard
- Real payment gateway (Razorpay / Stripe)
- Order placement and order history
- Reviews submission (ratings shown are static)
- Real-time notifications
- Dark / light mode toggle (site is dark-mode only)
- Multi-language support
- Inventory management
- Email / SMS infrastructure
- Deployment configuration

These can be added in subsequent phases.
