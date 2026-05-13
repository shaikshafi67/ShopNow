---
title: ShopNow
emoji: 🛍️
colorFrom: purple
colorTo: pink
sdk: docker
pinned: false
---

<div align="center">

# 🛍️ ShopNow — Smart Fashion eCommerce

**A full-stack, 3D-enabled fashion eCommerce platform with AI Virtual Try-On, Razorpay payments, and a Myntra-inspired UI.**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-0.183-black?logo=threedotjs)](https://threejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-enabled-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [Project Structure](#-project-structure) · [Deployment](#-deployment) · [Environment Variables](#-environment-variables)

</div>

---

## 📌 Overview

ShopNow is a modern, full-stack fashion eCommerce web application that combines **3D product visualization**, **AI-powered Virtual Try-On**, and a fully functional **Razorpay payment gateway**. Designed with a premium dark glass-morphism aesthetic inspired by Myntra, it delivers an immersive shopping experience across all devices.

---

## ✨ Features

| Category | Description |
|---|---|
| 🧥 **3D Virtual Try-On** | Live webcam-based try-on with 4-pose guided capture, AI garment overlay (IDM-VTON via Hugging Face), and an interactive 360° garment viewer |
| 💳 **Payment Gateway** | Full Razorpay integration — create orders, verify signatures, and generate professional HTML invoices |
| 🎨 **Premium UI/UX** | Dark glass-morphism design, smooth Framer Motion transitions, GSAP animations, and scroll-linked parallax |
| 🗂️ **Product Catalog** | 37 products across Men's & Women's collections with live search, category filters, price range slider, and sort options |
| 🛒 **Cart & Wishlist** | Persistent state management using LocalStorage with real-time badge counts |
| 🌐 **Multi-language** | English / Hindi localization support |
| 📊 **Admin Dashboard** | Order, user, and inventory management with analytics charts and file uploads |
| 🔍 **Smart Search** | Ranked results scoring across product name, category, tag, and description |
| 📄 **Invoice Generation** | Automated, professional HTML invoices for every order |
| 📱 **Fully Responsive** | Optimized for mobile (≤600px), tablet (≤900px), and desktop |

---

## 🛠️ Tech Stack

### Frontend
| Library | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 5 | Build tool & dev server |
| React Router | v7 | Client-side routing with animated transitions |
| Framer Motion | 12 | Page & component animations |
| GSAP | 3 | Advanced timeline animations |
| Lucide React | latest | Icon system |

### 3D & AI
| Library / Service | Purpose |
|---|---|
| Three.js + @react-three/fiber + drei | 3D rendering & garment viewer |
| TensorFlow.js + BodyPix | Body segmentation |
| MediaPipe Pose | Real-time pose detection |
| Hugging Face Gradio (IDM-VTON) | AI virtual try-on inference |
| Google Gemini API | Multi-angle garment generation |

### Backend & Infrastructure
| Technology | Purpose |
|---|---|
| Node.js + Express | Razorpay payment server & static file serving |
| Supabase | Database, auth, and real-time subscriptions |
| Firebase | Additional cloud services |
| Docker | Containerized deployment (Hugging Face Spaces) |

### Tooling
- ESLint (React Hooks plugin), Vitest + Testing Library, Concurrently, kill-port

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- A **Razorpay** account (for payment features)
- A **Supabase** project (for database features)

### 1. Clone the Repository

```bash
git clone https://github.com/shaikshafi67/ShopNow.git
cd ShopNow
```

### 2. Install Dependencies

```bash
cd app
npm install
```

### 3. Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp app/.env.example app/.env
```

See the [Environment Variables](#-environment-variables) section for all required keys.

### 4. Run the Application

Run both the **Vite frontend** and the **Razorpay backend** concurrently:

```bash
# From the /app directory
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend (Razorpay) | http://localhost:3001 |

---

## 📁 Project Structure

```
E-Commerce Website/
├── app/                        # React + Vite frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components (Navbar, Footer, etc.)
│   │   ├── pages/              # Route-level page components
│   │   ├── context/            # React Context providers (Cart, Wishlist, etc.)
│   │   ├── data/               # Product catalog data (37 products)
│   │   ├── hooks/              # Custom hooks (useCamera, etc.)
│   │   └── utils/              # Utilities (tryon_client.js, gemini3d.js, etc.)
│   ├── public/                 # Static assets
│   ├── .env.example            # Environment variable template
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Express backend (Razorpay + static serving)
│   └── src/
│       └── index.js
│
├── supabase/
│   └── migrations/             # SQL migration files
│
├── api/                        # Additional API handlers
├── Dockerfile                  # Docker build for Hugging Face Spaces deployment
├── FEATURES.md                 # Detailed feature documentation
└── README.md
```

---

## 🗺️ Routes

```
/                  → Home (hero, featured products, CTA)
/men               → Men's catalog (T-Shirts, Shirts, Jeans)
/women             → Women's catalog (Tops, Dresses, Kurtis, Sarees, Co-ords)
/product/:id       → Product detail (gallery, size, color, 3D try-on launcher)
/tryon/live        → Live AI Virtual Try-On (webcam + 4-pose workflow)
/cart              → Shopping cart
/wishlist          → Saved items
/search?q=...      → Search results
/new-arrivals      → Latest drops
/sale              → Sale items
/size-guide        → Size measurement charts
/shipping          → Shipping information
/returns           → Returns & exchanges
/track-order       → Order tracking
/contact           → Contact us
/about             → About ShopNow
/careers           → Open roles
/press             → Press & media
/privacy           → Privacy policy
/terms             → Terms of service
*                  → 404 Not Found
```

---

## 🔑 Environment Variables

Create an `app/.env` file based on `app/.env.example`:

```env
# Razorpay — Payment Gateway
VITE_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET

# Supabase — Database & Auth
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini — Multi-angle AI Generation
VITE_GEMINI_API_KEY=your_gemini_api_key

# Hugging Face — Virtual Try-On Inference
VITE_HF_TOKEN=hf_your_huggingface_token
```

> **Note:** Never commit your `.env` file. It is already listed in `.gitignore`.

---

## 🐳 Deployment

### Hugging Face Spaces (Docker)

The app is configured for deployment to [Hugging Face Spaces](https://huggingface.co/spaces) using Docker.

The `Dockerfile` at the root:
1. **Builds** the Vite frontend (`app/`) → static files in `app/dist/`
2. **Sets up** the Express server (`server/`) to serve the static files and handle Razorpay API calls
3. **Exposes** port `7860` (Hugging Face default)

```bash
# Build the Docker image locally (optional test)
docker build -t shopnow .
docker run -p 7860:7860 --env-file app/.env shopnow
```

Set your environment variables as **Secrets** in the Hugging Face Space settings — never hardcode them in the Dockerfile.

---

## 🧪 Testing

```bash
# From the /app directory

# Run tests once
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

---

## 📖 Documentation

- **[FEATURES.md](FEATURES.md)** — Comprehensive breakdown of every implemented feature, page, component, and integration.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">
Made with ❤️ by <strong>ShopNow Team</strong>
</div>
