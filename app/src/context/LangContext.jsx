import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { read, write } from '../utils/storage';

const LangContext = createContext(null);

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}

const DICT = {
  en: {
    home: 'Home', men: 'Men', women: 'Women', tryOn: 'Try-On',
    searchPlaceholder: 'Search for products, brands…',
    signIn: 'Sign in', signOut: 'Sign out',
    myProfile: 'My Profile', myOrders: 'My Orders', wishlist: 'Wishlist',
    adminDashboard: 'Admin Dashboard',
    addToCart: 'Add to Cart', buyNow: 'Buy Now',
    cart: 'Cart', checkout: 'Checkout',
    yourCart: 'Your Cart', emptyCart: 'Your cart is empty',
    yourWishlist: 'Your Wishlist', noFavourites: 'No favourites yet',
    orderPlaced: 'Order placed successfully!',
    shopMen: 'Shop Men', shopWomen: 'Shop Women',
    featured: 'Featured Products', newForMen: 'New for Men', newForWomen: 'New for Women',
    freeShipping: 'Free Shipping', easyReturns: 'Easy Returns',
    securePayments: 'Secure Payments', premiumQuality: 'Premium Quality',
    notifications: 'Notifications', noNotifications: 'No notifications yet',
    markAllRead: 'Mark all read',
    lightMode: 'Light mode', darkMode: 'Dark mode',
    viewAll: 'View all', filters: 'Filters', sortBy: 'Sort by',
    price: 'Price', rating: 'Rating', reviews: 'Reviews',
    size: 'Size', color: 'Color', quantity: 'Quantity',
    description: 'Description', similarProducts: 'Similar Products',
    ratingsReviews: 'Ratings & Reviews', writeReview: 'Write a review',
    deliveryAddress: 'Delivery address', paymentMethod: 'Payment method',
    orderSummary: 'Order summary',
    language: 'Language',
  },
  hi: {
    home: 'होम', men: 'पुरुष', women: 'महिला', tryOn: 'ट्राई-ऑन',
    searchPlaceholder: 'उत्पाद, ब्रांड खोजें…',
    signIn: 'साइन इन', signOut: 'साइन आउट',
    myProfile: 'मेरी प्रोफाइल', myOrders: 'मेरे ऑर्डर', wishlist: 'विशलिस्ट',
    adminDashboard: 'एडमिन डैशबोर्ड',
    addToCart: 'कार्ट में डालें', buyNow: 'अभी खरीदें',
    cart: 'कार्ट', checkout: 'चेकआउट',
    yourCart: 'आपका कार्ट', emptyCart: 'आपका कार्ट खाली है',
    yourWishlist: 'आपकी विशलिस्ट', noFavourites: 'अभी कोई पसंदीदा नहीं',
    orderPlaced: 'ऑर्डर सफलतापूर्वक दिया गया!',
    shopMen: 'पुरुष खरीदारी', shopWomen: 'महिला खरीदारी',
    featured: 'विशेष उत्पाद', newForMen: 'पुरुषों के लिए नया', newForWomen: 'महिलाओं के लिए नया',
    freeShipping: 'मुफ्त शिपिंग', easyReturns: 'आसान रिटर्न',
    securePayments: 'सुरक्षित भुगतान', premiumQuality: 'प्रीमियम गुणवत्ता',
    notifications: 'सूचनाएं', noNotifications: 'अभी कोई सूचना नहीं',
    markAllRead: 'सभी पढ़ा गया',
    lightMode: 'लाइट मोड', darkMode: 'डार्क मोड',
    viewAll: 'सभी देखें', filters: 'फ़िल्टर', sortBy: 'क्रमबद्ध करें',
    price: 'कीमत', rating: 'रेटिंग', reviews: 'समीक्षाएं',
    size: 'साइज', color: 'रंग', quantity: 'मात्रा',
    description: 'विवरण', similarProducts: 'समान उत्पाद',
    ratingsReviews: 'रेटिंग और समीक्षाएं', writeReview: 'समीक्षा लिखें',
    deliveryAddress: 'डिलीवरी पता', paymentMethod: 'भुगतान विधि',
    orderSummary: 'ऑर्डर सारांश',
    language: 'भाषा',
  },
};

export const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'hi', label: 'हिन्दी', short: 'हिं' },
];

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => read('lang', 'en'));

  useEffect(() => { write('lang', lang); }, [lang]);

  const t = useCallback((key) => {
    return DICT[lang]?.[key] || DICT.en[key] || key;
  }, [lang]);

  const cycle = useCallback(() => {
    setLang((l) => l === 'en' ? 'hi' : 'en');
  }, []);

  return (
    <LangContext.Provider value={{ lang, setLang, t, cycle }}>
      {children}
    </LangContext.Provider>
  );
}
