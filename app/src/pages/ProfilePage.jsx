import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, MapPin, Package, Heart, LogOut, ShieldCheck, Plus, Trash2, Edit3, Save, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrdersContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { shortDate, inr } from '../utils/format';

export default function ProfilePage() {
  const { user, logout, updateProfile, addAddress, removeAddress } = useAuth();
  const { myOrders } = useOrders();
  const { count: wishCount } = useWishlist();
  const toast = useToast();

  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({ label: 'Home', name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' });

  const saveProfile = () => {
    updateProfile(profileForm);
    setEditing(false);
    toast.success('Profile updated.');
  };

  const saveAddress = () => {
    if (!addressForm.name || !addressForm.line1 || !addressForm.city || !addressForm.pincode) {
      toast.error('Please fill name, address, city and pincode.');
      return;
    }
    addAddress(addressForm);
    setAddressForm({ label: 'Home', name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' });
    setShowAddAddress(false);
    toast.success('Address saved.');
  };

  const recentOrders = myOrders.slice(0, 3);

  return (
    <div style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh' }}>
      <div className="container" style={{ padding: '40px 24px 80px' }}>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 800,
            marginBottom: 8,
          }}>
          My Account
        </motion.h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
          Welcome back, <strong>{user?.name}</strong>
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 32 }}>
          <StatCard icon={Package} label="Orders" value={myOrders.length} link="/orders" />
          <StatCard icon={Heart} label="Wishlist" value={wishCount} link="/wishlist" />
          <StatCard icon={MapPin} label="Addresses" value={(user?.addresses || []).length} />
          <StatCard icon={ShieldCheck} label="Account type" value={user?.role === 'admin' ? 'Admin' : 'Member'} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {/* Profile */}
          <Section title="Profile" icon={User} action={
            editing ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveProfile} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 13 }}><Save size={14} /> Save</button>
                <button onClick={() => { setEditing(false); setProfileForm({ name: user?.name || '', phone: user?.phone || '' }); }} className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: 13 }}><X size={14} /> Cancel</button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)} className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: 13 }}><Edit3 size={14} /> Edit</button>
            )
          }>
            <FieldRow label="Name">
              {editing ? (
                <Input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
              ) : <span>{user?.name}</span>}
            </FieldRow>
            <FieldRow label="Email"><span>{user?.email}</span></FieldRow>
            <FieldRow label="Phone">
              {editing ? (
                <Input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="+91 ..." />
              ) : <span>{user?.phone || <em style={{ color: 'var(--text-muted)' }}>Not set</em>}</span>}
            </FieldRow>
            <FieldRow label="Member since"><span>{shortDate(user?.createdAt)}</span></FieldRow>

            <button
              onClick={() => { logout(); toast.info('Signed out.'); }}
              className="btn btn-ghost"
              style={{ marginTop: 18, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
            >
              <LogOut size={16} /> Sign out
            </button>
          </Section>

          {/* Addresses */}
          <Section title="Saved Addresses" icon={MapPin} action={
            <button onClick={() => setShowAddAddress((v) => !v)} className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: 13 }}>
              <Plus size={14} /> {showAddAddress ? 'Close' : 'Add new'}
            </button>
          }>
            {(user?.addresses || []).length === 0 && !showAddAddress && (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No saved addresses yet.</p>
            )}
            {(user?.addresses || []).map((a) => (
              <div key={a.id} style={{
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-glass)',
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 10,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
              }}>
                <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                  <div style={{ fontWeight: 700 }}>{a.name} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>· {a.label}</span></div>
                  <div style={{ color: 'var(--text-secondary)' }}>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>{a.city}, {a.state} - {a.pincode}</div>
                  {a.phone && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{a.phone}</div>}
                </div>
                <button onClick={() => { removeAddress(a.id); toast.info('Address removed.'); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {showAddAddress && (
              <div style={{
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-glass)',
                borderRadius: 12,
                padding: 14,
                marginTop: 8,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
              }}>
                <Input placeholder="Label (Home, Office)" value={addressForm.label} onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })} />
                <Input placeholder="Recipient name" value={addressForm.name} onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })} />
                <Input placeholder="Address line 1" value={addressForm.line1} onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })} style={{ gridColumn: '1 / -1' }} />
                <Input placeholder="Address line 2 (optional)" value={addressForm.line2} onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })} style={{ gridColumn: '1 / -1' }} />
                <Input placeholder="City" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} />
                <Input placeholder="State" value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} />
                <Input placeholder="Pincode" value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} />
                <Input placeholder="Phone" value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} />
                <button onClick={saveAddress} className="btn btn-primary" style={{ gridColumn: '1 / -1', justifyContent: 'center' }}>
                  <Save size={14} /> Save address
                </button>
              </div>
            )}
          </Section>
        </div>

        {/* Recent Orders */}
        <Section title="Recent Orders" icon={Package} action={
          <Link to="/orders" className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: 13 }}>View all</Link>
        } style={{ marginTop: 24 }}>
          {recentOrders.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No orders yet. <Link to="/men" style={{ color: 'var(--accent)' }}>Start shopping</Link>.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentOrders.map((o) => (
                <Link key={o.id} to={`/orders/${o.id}`} style={{
                  textDecoration: 'none',
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: 'var(--text-primary)',
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{o.number}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      {o.items.length} item{o.items.length !== 1 ? 's' : ''} · {shortDate(o.createdAt)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700 }}>{inr(o.totals.total)}</div>
                    <div style={{ fontSize: 12, color: 'var(--accent)', textTransform: 'capitalize' }}>{o.status.replace(/_/g, ' ')}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, link }) {
  const inner = (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-glass)',
      borderRadius: 16,
      padding: '18px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      transition: 'all var(--transition)',
      height: '100%',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><Icon size={20} color="var(--accent)" /></div>
      <div>
        <div style={{ color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
      </div>
    </div>
  );
  return link ? <Link to={link} style={{ textDecoration: 'none' }}>{inner}</Link> : inner;
}

function Section({ title, icon: Icon, children, action, style = {} }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-glass)',
      borderRadius: 18,
      padding: '20px 22px',
      ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8 }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, fontWeight: 700 }}>
          <Icon size={18} color="var(--accent)" /> {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function FieldRow({ label, children }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      gap: 12,
      padding: '10px 0',
      borderBottom: '1px solid var(--border-glass)',
      fontSize: 14,
    }}>
      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
      <span style={{ textAlign: 'right' }}>{children}</span>
    </div>
  );
}

function Input(props) {
  return (
    <input {...props} style={{
      background: 'var(--bg-glass)',
      border: '1px solid var(--border-glass)',
      borderRadius: 8,
      padding: '8px 10px',
      color: 'var(--text-primary)',
      fontSize: 14,
      fontFamily: 'var(--font-body)',
      outline: 'none',
      width: '100%',
      ...(props.style || {}),
    }} />
  );
}
