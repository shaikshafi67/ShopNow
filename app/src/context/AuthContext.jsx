import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { read, write, uid, sha256 } from '../utils/storage';

const AuthContext = createContext(null);
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

const SEED_ADMIN = {
  id: 'admin_seed',
  name: 'Admin',
  email: 'admin@shopnow.local',
  phone: '',
  role: 'admin',
  createdAt: '2026-01-01T00:00:00.000Z',
  // password = "admin123"
  passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
};

function loadUsers() {
  const list = read('users', null);
  if (!list || list.length === 0) {
    const seeded = [SEED_ADMIN];
    write('users', seeded);
    return seeded;
  }
  if (!list.find((u) => u.role === 'admin')) {
    const merged = [SEED_ADMIN, ...list];
    write('users', merged);
    return merged;
  }
  return list;
}

function publicUser(u) {
  if (!u) return null;
  // strip passwordHash before exposing
  const { passwordHash, ...rest } = u;
  return rest;
}

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(loadUsers);
  const [sessionId, setSessionId] = useState(() => {
    try { return sessionStorage.getItem('shopnow:session') || null; }
    catch { return null; }
  });

  useEffect(() => { write('users', users); }, [users]);

  // Sync users from localStorage when another tab registers/updates
  useEffect(() => {
    function refreshUsers() {
      const fresh = read('users', null);
      if (fresh && Array.isArray(fresh) && fresh.length > 0) {
        setUsers(fresh);
      }
    }
    // Storage event = another tab changed localStorage
    function onStorage(e) {
      if (e.key === 'shopnow:users') refreshUsers();
    }
    // Focus event = user switches back to this tab
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', refreshUsers);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', refreshUsers);
    };
  }, []);

  useEffect(() => {
    try {
      if (sessionId) sessionStorage.setItem('shopnow:session', sessionId);
      else sessionStorage.removeItem('shopnow:session');
    } catch { /* ignore */ }
  }, [sessionId]);

  const user = useMemo(
    () => publicUser(users.find((u) => u.id === sessionId)),
    [users, sessionId],
  );

  const register = useCallback(async ({ name, email, password, phone = '' }) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!name?.trim()) throw new Error('Name is required.');
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw new Error('Enter a valid email.');
    if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');
    if (users.find((u) => u.email === cleanEmail)) throw new Error('An account with this email already exists.');

    const passwordHash = await sha256(password);
    const newUser = {
      id: uid('usr'),
      name: name.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      role: 'user',
      createdAt: new Date().toISOString(),
      passwordHash,
      addresses: [],
    };
    setUsers((arr) => [...arr, newUser]);
    setSessionId(newUser.id);
    return publicUser(newUser);
  }, [users]);

  const login = useCallback(async ({ email, password }) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const found = users.find((u) => u.email === cleanEmail);
    if (!found) throw new Error('No account with this email.');
    const passwordHash = await sha256(password || '');
    if (found.passwordHash !== passwordHash) throw new Error('Incorrect password.');
    setSessionId(found.id);
    return publicUser(found);
  }, [users]);

  const logout = useCallback(() => {
    setSessionId(null);
  }, []);

  const updateProfile = useCallback((patch) => {
    if (!user) return;
    setUsers((arr) => arr.map((u) => (u.id === user.id ? { ...u, ...patch } : u)));
  }, [user]);

  const addAddress = useCallback((addr) => {
    if (!user) return;
    const a = { id: uid('addr'), ...addr };
    setUsers((arr) => arr.map((u) => (u.id === user.id ? { ...u, addresses: [...(u.addresses || []), a] } : u)));
    return a;
  }, [user]);

  const removeAddress = useCallback((addrId) => {
    if (!user) return;
    setUsers((arr) => arr.map((u) => (u.id === user.id
      ? { ...u, addresses: (u.addresses || []).filter((a) => a.id !== addrId) }
      : u)));
  }, [user]);

  const findByEmail = useCallback((email) => {
    const clean = (email || '').trim().toLowerCase();
    return users.find((u) => u.email === clean) || null;
  }, [users]);

  const resetPassword = useCallback(async (email, newPassword) => {
    const clean = (email || '').trim().toLowerCase();
    const found = users.find((u) => u.email === clean);
    if (!found) throw new Error('No account found with this email.');
    if (!newPassword || newPassword.length < 6) throw new Error('Password must be at least 6 characters.');
    const passwordHash = await sha256(newPassword);
    setUsers((arr) => arr.map((u) => (u.email === clean ? { ...u, passwordHash } : u)));
  }, [users]);

  const allUsers = useMemo(() => users.map(publicUser), [users]);

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    register,
    login,
    logout,
    updateProfile,
    addAddress,
    removeAddress,
    findByEmail,
    resetPassword,
    allUsers,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
