import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Sync Firebase user with Supabase profiles table
async function syncProfile(firebaseUser) {
  if (!firebaseUser) return null;

  const { data: existing } = await supabase
    .from('profiles')
    .select('*, addresses(*)')
    .eq('firebase_uid', firebaseUser.uid)
    .maybeSingle();

  if (existing) return existing;

  // Create profile for new user
  const isAdmin = firebaseUser.email === 'admin@shopnow.local';
  const { data: newProfile } = await supabase
    .from('profiles')
    .insert({
      firebase_uid: firebaseUser.uid,
      email:        firebaseUser.email,
      name:         firebaseUser.displayName || '',
      phone:        '',
      role:         isAdmin ? 'admin' : 'user',
    })
    .select('*, addresses(*)')
    .single();

  return newProfile;
}

function buildUser(firebaseUser, profile) {
  return {
    id:        profile?.id ?? firebaseUser.uid,
    uid:       firebaseUser.uid,
    email:     firebaseUser.email,
    name:      profile?.name  ?? firebaseUser.displayName ?? '',
    phone:     profile?.phone ?? '',
    role:      profile?.role  ?? 'user',
    addresses: (profile?.addresses ?? []).map(a => ({
      id: a.id, label: a.label, name: a.name, phone: a.phone,
      line1: a.line1, line2: a.line2, city: a.city, state: a.state, pincode: a.pincode,
    })),
    createdAt: profile?.created_at ?? firebaseUser.metadata?.creationTime,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await syncProfile(firebaseUser);
          setUser(buildUser(firebaseUser, profile));
        } catch {
          setUser(buildUser(firebaseUser, null));
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = useCallback(async (emailOrForm, password) => {
    const email = typeof emailOrForm === 'object' ? emailOrForm.email    : emailOrForm;
    const pass  = typeof emailOrForm === 'object' ? emailOrForm.password : password;
    const { user: fbUser } = await signInWithEmailAndPassword(auth, email, pass);
    return fbUser;
  }, []);

  const register = useCallback(async (nameOrForm, email, password) => {
    const name = typeof nameOrForm === 'object' ? nameOrForm.name     : nameOrForm;
    const em   = typeof nameOrForm === 'object' ? nameOrForm.email    : email;
    const pass = typeof nameOrForm === 'object' ? nameOrForm.password : password;
    const { user: fbUser } = await createUserWithEmailAndPassword(auth, em, pass);
    await firebaseUpdateProfile(fbUser, { displayName: name });
    return fbUser;
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
  }, []);

  const updateUser = useCallback(async (updates) => {
    if (!user) return;
    if (updates.name) await firebaseUpdateProfile(auth.currentUser, { displayName: updates.name });
    await supabase.from('profiles')
      .update({ name: updates.name, phone: updates.phone })
      .eq('firebase_uid', auth.currentUser.uid);
    const profile = await syncProfile(auth.currentUser);
    setUser(buildUser(auth.currentUser, profile));
  }, [user]);

  const addAddress = useCallback(async (addr) => {
    if (!user) return null;
    const { data, error } = await supabase.from('addresses').insert({
      user_id: user.id, label: addr.label ?? 'Home', name: addr.name ?? '',
      phone: addr.phone ?? '', line1: addr.line1 ?? '', line2: addr.line2 ?? '',
      city: addr.city ?? '', state: addr.state ?? '', pincode: addr.pincode ?? '',
    }).select().single();
    if (error) throw new Error(error.message);
    const profile = await syncProfile(auth.currentUser);
    setUser(buildUser(auth.currentUser, profile));
    return data;
  }, [user]);

  const removeAddress = useCallback(async (addressId) => {
    if (!user) return;
    await supabase.from('addresses').delete().eq('id', addressId).eq('user_id', user.id);
    const profile = await syncProfile(auth.currentUser);
    setUser(buildUser(auth.currentUser, profile));
  }, [user]);

  const resetPassword = useCallback(async (email) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  const isAuthenticated = !!user;
  const isAdmin         = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user, loading, isAuthenticated, isAdmin,
      login, register, logout,
      updateUser, updateProfile: updateUser,
      addAddress, removeAddress, resetPassword,
      allUsers: [], findByEmail: () => null,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
