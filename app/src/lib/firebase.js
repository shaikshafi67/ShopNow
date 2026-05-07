import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Replace these with your Firebase project config from Firebase Console
// Project Settings → Your apps → Web app → SDK setup and configuration
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || 'AIzaSyA6uUMUs-KeV9gOvRKYPH1_iDV_qZ6dkRk',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || 'shopnow-306e8.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || 'shopnow-306e8',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || 'shopnow-306e8.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '92184312458',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '1:92184312458:web:a1d4688d0eae1148b9cb73',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
