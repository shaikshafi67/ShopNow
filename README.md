# ShopNow — 3D-Enabled Smart Fashion eCommerce

ShopNow is a full-stack, client-side, 3D fashion eCommerce platform designed to enhance user experience using interactive 3D product visualization, Razorpay payment integration, and a Myntra-inspired modern UI. 

## Features
- **3D Virtual Try-On**: Interactive 360° views of clothing.
- **Myntra-Style UI/UX**: Premium styling, sharp component layouts, smooth Framer Motion transitions.
- **Razorpay Integration**: Fully functional payment gateway with live and demo modes.
- **Admin Dashboard**: Comprehensive order, user, and inventory management with custom analytics charts and file uploads.
- **Localization**: Multi-language support (English / Hindi).
- **Cart & Wishlist**: Persistent state management utilizing LocalStorage.
- **Invoice Generation**: Automated, professional HTML invoices for orders.

## Tech Stack
- React 19, Vite, Framer Motion, Lucide React
- Three.js / React Three Fiber for 3D rendering
- Node.js / Express for Razorpay backend

## Getting Started

### Prerequisites
- Node.js v18+

### Installation
1. Clone the repository
2. Navigate to the `app` directory
3. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application
To run both the frontend and the Razorpay backend server concurrently:
```bash
npm run dev:full
```
- Frontend: http://localhost:5175
- Backend: http://localhost:3001

## Setup Razorpay
To enable real payments, copy `app/.env.example` to `app/.env` and add your keys:
```
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY
RAZORPAY_KEY_SECRET=YOUR_SECRET
```

