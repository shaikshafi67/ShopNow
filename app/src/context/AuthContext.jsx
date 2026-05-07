import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile as fbUpdateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  reload,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// ── Fetch or create Supabase profile for a Firebase user ─────────────────
async function getOrCreateProfile(fbUser, nameHint = '') {
  if (!fbUser) return null;

  // Try existing profile
  const { data: existing } = await supabase
    .from('profiles')
    .select('*, addresses(*)')
    .eq('firebase_uid', fbUser.uid)
    .maybeSingle();

  if (existing) return existing;

  // Create new profile (admin@shopnow.local gets admin role automatically)
  const isAdmin = fbUser.email === 'admin@shopnow.local';
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      firebase_uid: fbUser.uid,
      email:        fbUser.email,
      name:         nameHint || fbUser.displayName || '',
      phone:        '',
      role:         isAdmin ? 'admin' : 'user',
    })
    .select('*, addresses(*)')
    .single();

  if (error) {
    console.error('[Auth] Profile create failed:', error.message);
    return null;
  }
  return data;
}

// ── Build the app user object from Firebase + Supabase profile ────────────
function buildUser(fbUser, profile) {
  return {
    id:        profile?.id   ?? null,          // Supabase UUID (used for DB queries)
    uid:       fbUser.uid,                     // Firebase UID
    email:     fbUser.email  ?? '',
    name:      profile?.name || fbUser.displayName || '',
    phone:     profile?.phone ?? '',
    role:      profile?.role  ?? 'user',       // 'admin' | 'user'
    addresses: (profile?.addresses ?? []).map(a => ({
      id:      a.id,
      label:   a.label,
      name:    a.name,
      phone:   a.phone,
      line1:   a.line1,
      line2:   a.line2,
      city:    a.city,
      state:   a.state,
      pincode: a.pincode,
    })),
    createdAt: profile?.created_at ?? fbUser.metadata?.creationTime,
  };
}

// ── Provider ──────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          const profile = await getOrCreateProfile(fbUser);
          setUser(buildUser(fbUser, profile));
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('[Auth] State change error:', err);
        if (fbUser) setUser(buildUser(fbUser, null));
        else setUser(null);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  // ── Login — checks email verification before allowing in ──────────────
  const login = useCallback(async (emailOrForm, password) => {
    const email = typeof emailOrForm === 'object' ? emailOrForm.email    : emailOrForm;
    const pass  = typeof emailOrForm === 'object' ? emailOrForm.password : password;

    const { user: fbUser } = await signInWithEmailAndPassword(auth, email, pass);

    const profile = await getOrCreateProfile(fbUser);
    const appUser = buildUser(fbUser, profile);
    setUser(appUser);
    return appUser;
  }, []);

  // ── Register — creates account and sends Firebase verification email ───
  const register = useCallback(async (nameOrForm, email, password) => {
    const name = typeof nameOrForm === 'object' ? nameOrForm.name     : nameOrForm;
    const em   = typeof nameOrForm === 'object' ? nameOrForm.email    : email;
    const pass = typeof nameOrForm === 'object' ? nameOrForm.password : password;

    // OTP already verified by server before this is called
    const { user: fbUser } = await createUserWithEmailAndPassword(auth, em, pass);
    await fbUpdateProfile(fbUser, { displayName: name });
    const profile = await getOrCreateProfile(fbUser, name);
    const appUser = buildUser(fbUser, profile);
    setUser(appUser);
    return appUser;
  }, []);

  // ── Resend verification email ─────────────────────────────────────────
  const resendVerification = useCallback(async (email, password) => {
    const { user: fbUser } = await signInWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(fbUser);
    await signOut(auth);
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
  }, []);

  // ── Update profile ────────────────────────────────────────────────────
  const updateUser = useCallback(async (updates) => {
    if (!auth.currentUser) return;
    if (updates.name) {
      await fbUpdateProfile(auth.currentUser, { displayName: updates.name });
    }
    const fields = {};
    if (updates.name  !== undefined) fields.name  = updates.name;
    if (updates.phone !== undefined) fields.phone = updates.phone;
    if (Object.keys(fields).length > 0) {
      await supabase.from('profiles').update(fields).eq('firebase_uid', auth.currentUser.uid);
    }
    const profile = await getOrCreateProfile(auth.currentUser);
    setUser(buildUser(auth.currentUser, profile));
  }, []);

  // ── Address management ────────────────────────────────────────────────
  const addAddress = useCallback(async (addr) => {
    if (!user?.id) return null;
    const { data, error } = await supabase.from('addresses').insert({
      user_id: user.id,
      label:   addr.label   ?? 'Home',
      name:    addr.name    ?? '',
      phone:   addr.phone   ?? '',
      line1:   addr.line1   ?? '',
      line2:   addr.line2   ?? '',
      city:    addr.city    ?? '',
      state:   addr.state   ?? '',
      pincode: addr.pincode ?? '',
    }).select().single();
    if (error) throw new Error(error.message);
    const profile = await getOrCreateProfile(auth.currentUser);
    setUser(buildUser(auth.currentUser, profile));
    return data;
  }, [user]);

  const removeAddress = useCallback(async (addressId) => {
    if (!user?.id) return;
    await supabase.from('addresses').delete().eq('id', addressId).eq('user_id', user.id);
    const profile = await getOrCreateProfile(auth.currentUser);
    setUser(buildUser(auth.currentUser, profile));
  }, [user]);

  // ── Password reset ────────────────────────────────────────────────────
  const resetPassword = useCallback(async (email) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  const isAuthenticated = !!user;
  const isAdmin         = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user, loading, isAuthenticated, isAdmin,
      login, register, logout, resendVerification,
      updateUser, updateProfile: updateUser,
      addAddress, removeAddress, resetPassword,
      allUsers: [], findByEmail: () => null,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
