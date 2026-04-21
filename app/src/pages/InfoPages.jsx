import InfoPage from './InfoPage';

export function SizeGuidePage() {
  return (
    <InfoPage
      title="Size Guide"
      subtitle="Find your perfect fit. Our sizes follow international standards — measure yourself once and shop with confidence."
      sections={[
        {
          heading: 'How to Measure',
          body: 'Use a soft measuring tape and keep it parallel to the floor. For the most accurate readings, ask a friend to help and measure over light clothing.',
          list: [
            'Chest — measure around the fullest part, under the arms.',
            'Waist — measure around the narrowest part of your natural waist.',
            'Hips — measure around the widest part, about 20cm below your waist.',
            'Inseam — measure from the top of the inner thigh down to the ankle.',
          ],
        },
        {
          heading: 'Men — Tops (cm)',
          list: [
            'S — Chest 90–96, Waist 76–82',
            'M — Chest 97–102, Waist 83–88',
            'L — Chest 103–108, Waist 89–94',
            'XL — Chest 109–114, Waist 95–100',
            'XXL — Chest 115–120, Waist 101–106',
          ],
        },
        {
          heading: 'Women — Tops (cm)',
          list: [
            'XS — Bust 80–84, Waist 60–64, Hips 86–90',
            'S — Bust 85–89, Waist 65–69, Hips 91–95',
            'M — Bust 90–94, Waist 70–74, Hips 96–100',
            'L — Bust 95–99, Waist 75–79, Hips 101–105',
            'XL — Bust 100–104, Waist 80–84, Hips 106–110',
          ],
        },
        {
          heading: 'Still Unsure?',
          body: 'Try our 3D Try-On — upload a photo and see exactly how clothes fit on you before buying. Most customers find their perfect size on the first try.',
        },
      ]}
      cta={{
        heading: 'Skip the guesswork',
        body: 'Try clothes on virtually with our AI-powered 3D fitting room.',
        primaryLabel: 'Open 3D Try-On',
        primaryTo: '/tryon/live',
      }}
    />
  );
}

export function ShippingInfoPage() {
  return (
    <InfoPage
      title="Shipping Info"
      subtitle="Fast, tracked delivery to your doorstep. Free shipping on all orders above ₹999."
      sections={[
        {
          heading: 'Delivery Times',
          list: [
            'Metro cities — 1 to 2 business days.',
            'Tier-1 cities — 2 to 4 business days.',
            'Other regions — 4 to 7 business days.',
            'International orders — 7 to 14 business days.',
          ],
        },
        {
          heading: 'Shipping Charges',
          list: [
            'Free standard shipping on orders above ₹999.',
            'Standard shipping on orders below ₹999 — ₹49.',
            'Express delivery (24-hour metro) — ₹149.',
            'International — calculated at checkout based on destination.',
          ],
        },
        {
          heading: 'Order Processing',
          body: 'Orders placed before 2:00 PM IST on a business day are processed the same day. Orders placed after 2:00 PM, on weekends, or on holidays are processed the next business day.',
        },
        {
          heading: 'Tracking',
          body: 'You will receive a tracking link via email and SMS as soon as your order ships. You can also track your order from the Track Order page using your order ID.',
        },
      ]}
      cta={{
        heading: 'Need to track an order?',
        body: 'Enter your order ID to see real-time status and delivery updates.',
        primaryLabel: 'Track Order',
        primaryTo: '/track-order',
      }}
    />
  );
}

export function ReturnsPage() {
  return (
    <InfoPage
      title="Returns & Exchanges"
      subtitle="Easy 30-day returns. If something is not right, we will make it right — no questions asked."
      sections={[
        {
          heading: 'Return Policy',
          list: [
            '30-day return window from the date of delivery.',
            'Items must be unworn, unwashed, and have all original tags attached.',
            'Original packaging required for fastest refunds.',
            'Innerwear, swimwear, and final-sale items cannot be returned.',
          ],
        },
        {
          heading: 'How to Return',
          list: [
            'Open the order from your account and tap "Request Return".',
            'Choose a reason and select pickup or self-ship.',
            'Pack the item securely with tags intact.',
            'Hand it to our courier or drop it at the nearest partner location.',
          ],
        },
        {
          heading: 'Refund Timeline',
          body: 'Once we receive and inspect your return, refunds are issued within 3 to 5 business days to your original payment method. UPI and wallet refunds are usually instant after approval.',
        },
        {
          heading: 'Exchanges',
          body: 'Want a different size or colour? Request an exchange instead of a return — we will pick up the original and ship the replacement at no extra cost.',
        },
      ]}
      cta={{
        heading: 'Need help with a return?',
        body: 'Our support team responds within 24 hours, every day of the week.',
        primaryLabel: 'Contact Support',
        primaryTo: '/contact',
      }}
    />
  );
}

export function TrackOrderPage() {
  return (
    <InfoPage
      title="Track Your Order"
      subtitle="Enter your order ID and registered email to see live status updates."
      sections={[
        {
          heading: 'Where to Find Your Order ID',
          body: 'Your order ID was sent to you via email and SMS at the time of purchase. It looks like SHN-2026-XXXXXX. You can also find it in the "My Orders" section of your account.',
        },
        {
          heading: 'Status Stages',
          list: [
            'Confirmed — payment received, preparing your order.',
            'Packed — your items are packed and ready for pickup.',
            'Shipped — handed to courier with a live tracking link.',
            'Out for Delivery — arriving today.',
            'Delivered — enjoy your order. Try it on and tell us how it fits.',
          ],
        },
        {
          heading: 'Delayed Order?',
          body: 'Most delays are caused by incorrect addresses or courier rerouting. If your order has not moved in 48 hours, contact our support team and we will sort it out fast.',
        },
      ]}
      cta={{
        heading: 'Have an issue with your order?',
        body: 'Reach out and we will help you within 24 hours.',
        primaryLabel: 'Contact Us',
        primaryTo: '/contact',
      }}
    />
  );
}

export function ContactPage() {
  return (
    <InfoPage
      title="Contact Us"
      subtitle="We are here to help. Choose the channel that works best for you — we reply fast."
      sections={[
        {
          heading: 'Customer Support',
          list: [
            'Email — support@shopnow.example',
            'Phone — +91 80000 00000 (Mon to Sat, 9 AM to 9 PM IST)',
            'Live Chat — tap the chat bubble at the bottom of any page.',
            'WhatsApp — +91 80000 00000',
          ],
        },
        {
          heading: 'Press & Media',
          body: 'For press enquiries, partnerships, or interview requests, write to press@shopnow.example with a brief about your story.',
        },
        {
          heading: 'Careers',
          body: 'Want to build the future of fashion with us? Email your CV to careers@shopnow.example or visit our Careers page for open roles.',
        },
        {
          heading: 'Office',
          body: 'ShopNow Technologies Pvt Ltd — 4th Floor, Innovation Hub, HSR Layout, Bengaluru, Karnataka 560102, India.',
        },
      ]}
      cta={{
        heading: 'Looking for something specific?',
        body: 'Browse our help articles or jump straight into shopping.',
        primaryLabel: 'Shop Now',
        primaryTo: '/men',
      }}
    />
  );
}

export function AboutPage() {
  return (
    <InfoPage
      title="About ShopNow"
      subtitle="We are reimagining how the world shops for fashion — by letting you try anything on, virtually, before you buy."
      sections={[
        {
          heading: 'Our Mission',
          body: 'Online shopping has a fit problem. Up to 40% of fashion returns happen because of sizing. We are fixing that with AI and 3D — so you only ever order what truly suits you.',
        },
        {
          heading: 'Our Story',
          body: 'ShopNow was founded in 2024 by a small team of engineers, designers, and fashion enthusiasts in Bengaluru. What began as a research project on virtual garments has grown into a platform serving customers across India.',
        },
        {
          heading: 'What Makes Us Different',
          list: [
            'Photoreal 3D try-on powered by advanced diffusion models.',
            'Curated collections — we only stock what we would wear ourselves.',
            'Sustainable packaging on every single order.',
            'A no-questions-asked 30-day return promise.',
          ],
        },
        {
          heading: 'The Numbers',
          list: [
            '50,000+ happy customers across India.',
            '120+ partner brands.',
            '94% customer satisfaction score.',
            '< 8% return rate, well below the industry average.',
          ],
        },
      ]}
      cta={{
        heading: 'See it for yourself',
        body: 'Try on the latest drop in 3D — no signup needed.',
        primaryLabel: 'Try-On Now',
        primaryTo: '/tryon/live',
      }}
    />
  );
}

export function CareersPage() {
  return (
    <InfoPage
      title="Careers"
      subtitle="Help us build the future of fashion. Remote-friendly, ambitious, and humble."
      sections={[
        {
          heading: 'Why ShopNow',
          list: [
            'Work on hard, original problems in 3D, AI, and commerce.',
            'Small team, high autonomy — your work ships to real users every week.',
            'Competitive compensation, meaningful equity, and a learning budget.',
            'Remote-first across India with quarterly team offsites.',
          ],
        },
        {
          heading: 'Open Roles',
          list: [
            'Senior Frontend Engineer — React, WebGL, Three.js (Remote).',
            'ML Engineer — diffusion models, garment synthesis (Bengaluru / Remote).',
            'Product Designer — visual systems, motion (Remote).',
            'Customer Experience Lead (Bengaluru).',
            'Growth Marketing Manager (Bengaluru / Remote).',
          ],
        },
        {
          heading: 'How to Apply',
          body: 'Send your CV, portfolio, and a short note about why you want to join to careers@shopnow.example. We read every application and reply within a week.',
        },
      ]}
      cta={{
        heading: 'Do not see your role?',
        body: 'We are always open to talking with exceptional people. Drop us a line.',
        primaryLabel: 'Get in Touch',
        primaryTo: '/contact',
      }}
    />
  );
}

export function PressPage() {
  return (
    <InfoPage
      title="Press"
      subtitle="News, brand assets, and media enquiries. For coverage, get in touch with our press team."
      sections={[
        {
          heading: 'In the News',
          list: [
            '"How ShopNow is rebuilding fashion shopping with AI" — TechCrunch India, March 2026.',
            '"The startup that ended the fitting-room nightmare" — YourStory, January 2026.',
            '"The 30 most innovative fashion startups of 2025" — Vogue Business, December 2025.',
          ],
        },
        {
          heading: 'Press Kit',
          body: 'Download our brand assets — logos, founder photos, product screenshots, and one-pager — from press.shopnow.example/kit.',
        },
        {
          heading: 'Media Enquiries',
          body: 'For interviews, quotes, or expert commentary on fashion, AI, or e-commerce trends, write to press@shopnow.example. We typically respond within one business day.',
        },
      ]}
      cta={{
        heading: 'Want to feature us?',
        body: 'Drop us a line — we love working with thoughtful storytellers.',
        primaryLabel: 'Contact Press',
        primaryTo: '/contact',
      }}
    />
  );
}

export function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy Policy"
      subtitle="Last updated: January 2026. We take your privacy seriously and only collect what we need to serve you better."
      sections={[
        {
          heading: 'What We Collect',
          list: [
            'Account data — name, email, phone, and shipping address.',
            'Order data — what you bought, when, and where it was shipped.',
            'Try-on photos — processed on-device whenever possible, never sold.',
            'Usage analytics — pages visited and features used, in aggregate.',
          ],
        },
        {
          heading: 'How We Use It',
          body: 'We use your data to fulfil orders, personalise recommendations, improve the product, and send you updates you have explicitly opted into. We never sell your data to third parties.',
        },
        {
          heading: 'Your Rights',
          list: [
            'Access — request a copy of all the data we hold about you.',
            'Correction — fix any inaccurate data on file.',
            'Deletion — close your account and erase all personal data.',
            'Portability — export your data in a machine-readable format.',
          ],
        },
        {
          heading: 'Cookies',
          body: 'We use essential cookies to keep you signed in and remember your cart, plus analytics cookies to understand usage. You can manage cookie preferences from your account settings.',
        },
        {
          heading: 'Contact',
          body: 'For any privacy-related question or to exercise your rights, write to privacy@shopnow.example.',
        },
      ]}
      cta={{
        heading: 'Questions about your data?',
        body: 'Our privacy team replies within 5 business days.',
        primaryLabel: 'Contact Us',
        primaryTo: '/contact',
      }}
    />
  );
}

export function TermsPage() {
  return (
    <InfoPage
      title="Terms of Service"
      subtitle="Last updated: January 2026. By using ShopNow you agree to the following terms."
      sections={[
        {
          heading: 'Using ShopNow',
          body: 'You must be 18 or older, or have the consent of a parent or guardian, to make a purchase. You are responsible for keeping your account credentials secure.',
        },
        {
          heading: 'Orders and Payment',
          list: [
            'All prices are in Indian Rupees (₹) and inclusive of GST unless stated otherwise.',
            'We reserve the right to cancel orders flagged for fraud or pricing errors.',
            'Promotional discounts cannot be combined unless explicitly stated.',
            'Payment is processed by trusted gateways — we do not store full card details.',
          ],
        },
        {
          heading: 'Try-On Content',
          body: 'You retain ownership of any photos you upload for the 3D try-on. By uploading, you grant us a limited licence to process the image for the sole purpose of generating your try-on result.',
        },
        {
          heading: 'Intellectual Property',
          body: 'All site content — including text, images, logos, and software — is the property of ShopNow or its licensors and protected by copyright laws.',
        },
        {
          heading: 'Limitation of Liability',
          body: 'ShopNow is not liable for indirect or consequential losses arising from the use of the platform. Our total liability is limited to the value of the relevant order.',
        },
        {
          heading: 'Governing Law',
          body: 'These terms are governed by the laws of India. Any disputes will be subject to the exclusive jurisdiction of the courts of Bengaluru, Karnataka.',
        },
      ]}
      cta={{
        heading: 'Need clarification?',
        body: 'Our legal team is happy to answer questions about these terms.',
        primaryLabel: 'Contact Us',
        primaryTo: '/contact',
      }}
    />
  );
}

export function NewArrivalsPage() {
  return (
    <InfoPage
      title="New Arrivals"
      subtitle="Just dropped — the latest pieces from our newest collections. Refreshed weekly."
      sections={[
        {
          heading: 'This Week',
          body: 'Our newest drops blend modern silhouettes with everyday comfort. Each piece is curated by our in-house stylists and available in limited quantities — once they sell out, they are gone.',
        },
        {
          heading: 'Restocks',
          body: 'Customer favourites are back in stock. If you missed out last time, check now — popular sizes go fast.',
        },
      ]}
      cta={{
        heading: 'Browse the latest',
        body: 'Jump straight into the freshest pieces — try them on in 3D before checkout.',
        primaryLabel: 'Shop Men',
        primaryTo: '/men',
      }}
    />
  );
}

export function SalePage() {
  return (
    <InfoPage
      title="Sale"
      subtitle="Up to 60% off on selected styles. While stocks last — popular sizes sell out fast."
      sections={[
        {
          heading: 'How the Sale Works',
          list: [
            'Discounts are applied automatically at checkout.',
            'Sale items can be returned within 15 days (instead of the usual 30).',
            'Cannot be combined with other discount codes.',
            'Free shipping still applies on orders above ₹999.',
          ],
        },
        {
          heading: 'Tip',
          body: 'Use the 3D try-on before checkout — sale items move fast and you do not want to wait for a return.',
        },
      ]}
      cta={{
        heading: 'Shop the sale',
        body: 'Limited quantities — your size may already be running low.',
        primaryLabel: 'Shop Women',
        primaryTo: '/women',
      }}
    />
  );
}
