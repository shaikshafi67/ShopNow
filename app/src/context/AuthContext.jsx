import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  const buildUser = useCallback(async (authUser) => {
    if (!authUser) { setUser(null); return; }
    const [{ data: profile }, { data: addresses }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', authUser.id).single(),
      supabase.from('addresses').select('*').eq('user_id', authUser.id).order('created_at'),
    ]);
    setUser({
      id:        authUser.id,
      email:     authUser.email,
      name:      profile?.name  ?? '',
      phone:     profile?.phone ?? '',
      role:      profile?.role  ?? 'user',
      addresses: (addresses ?? []).map(a => ({
        id: a.id, label: a.label, name: a.name, phone: a.phone,
        line1: a.line1, line2: a.line2, city: a.city, state: a.state, pincode: a.pincode,
      })),
      createdAt: profile?.created_at ?? authUser.created_at,
    });
  }, []);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => buildUser(session?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) =>
      buildUser(session?.user ?? null).catch(() => setUser(null))
    );
    return () => subscription.unsubscribe();
  }, [buildUser]);

  const register = useCallback(async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { name } },
    });
    if (error) throw new Error(error.message);
    return data.user;
  }, []);

  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const updateUser = useCallback(async (updates) => {
    if (!user) return;
    if (updates.name !== undefined || updates.phone !== undefined) {
      await supabase.from('profiles').update({ name: updates.name, phone: updates.phone }).eq('id', user.id);
    }
    if (updates.email && updates.email !== user.email) {
      await supabase.auth.updateUser({ email: updates.email });
    }
    const { data: { user: authUser } } = await supabase.auth.getUser();
    await buildUser(authUser);
  }, [user, buildUser]);

  const addAddress = useCallback(async (addr) => {
    if (!user) return null;
    const { data, error } = await supabase.from('addresses').insert({
      user_id: user.id, label: addr.label ?? 'Home', name: addr.name ?? '',
      phone: addr.phone ?? '', line1: addr.line1 ?? '', line2: addr.line2 ?? '',
      city: addr.city ?? '', state: addr.state ?? '', pincode: addr.pincode ?? '',
    }).select().single();
    if (error) throw new Error(error.message);
    const { data: { user: au } } = await supabase.auth.getUser();
    await buildUser(au);
    return data;
  }, [user, buildUser]);

  const removeAddress = useCallback(async (addressId) => {
    if (!user) return;
    await supabase.from('addresses').delete().eq('id', addressId).eq('user_id', user.id);
    const { data: { user: au } } = await supabase.auth.getUser();
    await buildUser(au);
  }, [user, buildUser]);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  const resetPassword = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new Error(error.message);
  }, []);

  // Admin: fetch all users from profiles
  const getAllUsers = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*');
    return data ?? [];
  }, []);

  return (
    <AuthContext.Provider value={{
      user, loading, isAuthenticated, isAdmin,
      login, register, logout,
      updateUser, updateProfile: updateUser,
      addAddress, removeAddress,
      resetPassword,
      allUsers: [], findByEmail: () => null, // populated by admin context if needed
      getAllUsers,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
