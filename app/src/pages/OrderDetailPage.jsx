import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, Truck, MapPin, CreditCard, ChevronLeft, Clock, XCircle, Star, Download, FileText } from 'lucide-react';
import { useOrders, ORDER_STAGES } from '../context/OrdersContext';
import { useAuth } from '../context/AuthContext';
import { inr, shortDate } from '../utils/format';

const STAGE_ICONS = { placed: Package, confirmed: CheckCircle, packed: Package, shipped: Truck, out_for_delivery: Truck, delivered: CheckCircle, cancelled: XCircle };

function generateInvoiceHTML(order) {
  const itemsRows = order.items.map((it) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;">${it.name}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center;">${it.size || '-'}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center;">${it.qty}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;">&#8377;${it.price.toLocaleString('en-IN')}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:700;">&#8377;${(it.price * it.qty).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  const addr = order.address;
  const addrStr = addr ? `${addr.name}<br>${addr.line1}${addr.line2 ? ', ' + addr.line2 : ''}<br>${addr.city}, ${addr.state} - ${addr.pincode}${addr.phone ? '<br>' + addr.phone : ''}` : 'N/A';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Invoice ${order.number}</title>
<style>
  body { font-family: 'Segoe UI', -apple-system, sans-serif; color: #1a1a2e; margin: 0; padding: 40px; background: white; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .brand { font-size: 28px; font-weight: 900; background: linear-gradient(135deg, #7c6aff, #ff6a9a); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .invoice-title { font-size: 32px; font-weight: 300; color: #666; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
  .meta-box h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
  th { background: #f8f8fc; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; color: #666; border-bottom: 2px solid #eee; }
  .totals { margin-left: auto; width: 280px; }
  .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
  .totals .row.total { border-top: 2px solid #1a1a2e; padding-top: 10px; margin-top: 6px; font-size: 18px; font-weight: 800; }
  .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px; }
  .badge { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">ShopNow</div>
      <div style="color:#666;font-size:13px;margin-top:4px;">Virtual Try-On Fashion</div>
    </div>
    <div style="text-align:right;">
      <div class="invoice-title">INVOICE</div>
      <div style="color:#666;font-size:14px;margin-top:4px;">${order.number}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-box">
      <h4>Bill To</h4>
      <div style="font-size:14px;line-height:1.8;">${addrStr}</div>
    </div>
    <div class="meta-box" style="text-align:right;">
      <h4>Invoice Details</h4>
      <div style="font-size:14px;line-height:1.8;">
        <strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}<br>
        <strong>Payment:</strong> ${(order.payment?.method || 'N/A').toUpperCase()}<br>
        <strong>Status:</strong> <span class="badge" style="background:${order.payment?.status === 'paid' ? '#e8f5e9' : '#fff3e0'};color:${order.payment?.status === 'paid' ? '#2e7d32' : '#ef6c00'};">${order.payment?.status || 'pending'}</span>
        ${order.payment?.txnId ? '<br><strong>Txn:</strong> ' + order.payment.txnId : ''}
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th style="text-align:center;">Size</th>
        <th style="text-align:center;">Qty</th>
        <th style="text-align:right;">Price</th>
        <th style="text-align:right;">Amount</th>
      </tr>
    </thead>
    <tbody>${itemsRows}</tbody>
  </table>

  <div class="totals">
    <div class="row"><span style="color:#666;">Subtotal</span><span>&#8377;${order.totals.subtotal.toLocaleString('en-IN')}</span></div>
    ${order.totals.savings > 0 ? `<div class="row"><span style="color:#666;">Discount</span><span style="color:#2e7d32;">- &#8377;${order.totals.savings.toLocaleString('en-IN')}</span></div>` : ''}
    <div class="row"><span style="color:#666;">Shipping</span><span>${order.totals.shipping === 0 ? 'FREE' : '&#8377;' + order.totals.shipping.toLocaleString('en-IN')}</span></div>
    <div class="row"><span style="color:#666;">Tax (GST 5%)</span><span>&#8377;${order.totals.tax.toLocaleString('en-IN')}</span></div>
    <div class="row total"><span>Total</span><span>&#8377;${order.totals.total.toLocaleString('en-IN')}</span></div>
  </div>

  <div class="footer">
    <p>Thank you for shopping with ShopNow!</p>
    <p>This is a computer-generated invoice and does not require a signature.</p>
    <p style="margin-top:8px;">shopnow.local · support@shopnow.local</p>
  </div>
</body>
</html>`;
}

function downloadInvoice(order) {
  const html = generateInvoiceHTML(order);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.addEventListener('load', () => {
      win.document.title = `Invoice ${order.number}`;
    });
  }
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const justPlaced = params.get('placed') === '1';
  const { findById, cancel } = useOrders();
  const { isAdmin } = useAuth();
  const order = findById(id);

  if (!order) {
    return (
      <div style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh', textAlign: 'center', padding: '120px 24px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Order not found</h2>
        <Link to="/orders" className="btn btn-ghost" style={{ textDecoration: 'none' }}>Back to orders</Link>
      </div>
    );
  }

  const isCancelled = order.status === 'cancelled';
  const isDelivered = order.status === 'delivered';
  const canCancel = !isCancelled && !isDelivered;
  const currentStageIndex = ORDER_STAGES.findIndex((s) => s.id === order.status);

  return (
    <div style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh' }}>
      <div className="container" style={{ padding: '36px 24px 80px', maxWidth: 900 }}>
        {justPlaced && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: 14, padding: '14px 20px', marginBottom: 24,
              display: 'flex', alignItems: 'center', gap: 12,
            }}
          >
            <CheckCircle size={22} color="#22c55e" />
            <div>
              <div style={{ fontWeight: 700, color: '#22c55e' }}>Order placed successfully!</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                You'll receive updates via email. Estimated delivery: {shortDate(order.estimatedDelivery)}.
              </div>
            </div>
          </motion.div>
        )}

        {/* Title bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Link to="/orders" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <ChevronLeft size={16} /> My orders
            </Link>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 800 }}>
              {order.number}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
              Placed on {shortDate(order.createdAt)} · {order.items.length} item{order.items.length !== 1 ? 's' : ''} · {inr(order.totals.total)}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => downloadInvoice(order)}
              className="btn btn-secondary"
              style={{ fontSize: 13, gap: 6 }}
            >
              <Download size={15} /> Download Invoice
            </button>
            {canCancel && (
              <button
                onClick={() => { if (window.confirm('Cancel this order?')) cancel(order.id); }}
                className="btn btn-ghost"
                style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', fontSize: 13 }}
              >
                <XCircle size={15} /> Cancel order
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 20 }} className="order-detail-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Tracking timeline */}
            {!isCancelled && (
              <Card title="Tracking" icon={Truck}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 4 }}>
                  {ORDER_STAGES.map((s, i) => {
                    const done = i <= currentStageIndex;
                    const active = i === currentStageIndex;
                    const tEntry = order.timeline?.find((t) => t.stage === s.id);
                    return (
                      <div key={s.id} style={{ display: 'flex', gap: 14, position: 'relative' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%', zIndex: 1,
                            background: done ? 'var(--accent)' : 'var(--bg-glass)',
                            border: `2px solid ${done ? 'var(--accent)' : 'var(--border-glass)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: active ? '0 0 0 4px rgba(124,106,255,0.2)' : 'none',
                          }}>
                            {done ? <CheckCircle size={14} color="white" /> : <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border-glass)' }} />}
                          </div>
                          {i < ORDER_STAGES.length - 1 && (
                            <div style={{ width: 2, flex: 1, minHeight: 28, background: done ? 'var(--accent)' : 'var(--border-glass)', opacity: done ? 0.6 : 0.3 }} />
                          )}
                        </div>
                        <div style={{ paddingBottom: i < ORDER_STAGES.length - 1 ? 16 : 0, paddingTop: 4 }}>
                          <div style={{ fontWeight: active ? 700 : 500, fontSize: 14, color: done ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {s.label}
                          </div>
                          {tEntry && (
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                              {shortDate(tEntry.at)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{
                  marginTop: 14, padding: '10px 14px',
                  background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                  borderRadius: 10, fontSize: 13, color: 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <Clock size={14} color="var(--accent)" />
                  Estimated delivery: <strong style={{ color: 'var(--text-primary)' }}>{shortDate(order.estimatedDelivery)}</strong>
                </div>
              </Card>
            )}

            {isCancelled && (
              <div style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 14, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center',
              }}>
                <XCircle size={22} color="#ef4444" />
                <div>
                  <div style={{ fontWeight: 700, color: '#ef4444' }}>Order cancelled</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Refund will be processed within 5–7 business days.
                  </div>
                </div>
              </div>
            )}

            {/* Items */}
            <Card title="Items" icon={Package}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {order.items.map((it) => (
                  <div key={it._key || it.productId} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{
                      width: 60, height: 72, borderRadius: 10, flexShrink: 0,
                      background: it.image ? `url(${it.image}) center/cover` : 'var(--bg-glass)',
                      border: '1px solid var(--border-glass)',
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link to={`/product/${it.productId}`} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
                        {it.name}
                      </Link>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
                        Qty: {it.qty}{it.size ? ` · Size: ${it.size}` : ''}
                      </div>
                      {isDelivered && (
                        <Link to={`/product/${it.productId}?review=1`} style={{
                          color: 'var(--accent)', fontSize: 13, textDecoration: 'none',
                          display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4,
                        }}>
                          <Star size={13} /> Write a review
                        </Link>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700 }}>{inr(it.price * it.qty)}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{inr(it.price)} each</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Invoice quick card */}
            <div
              onClick={() => downloadInvoice(order)}
              style={{
                background: 'rgba(124,106,255,0.06)', border: '1px solid rgba(124,106,255,0.2)',
                borderRadius: 14, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(124,106,255,0.12)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(124,106,255,0.06)'; }}
            >
              <FileText size={20} color="var(--accent)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>Download Invoice</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>PDF-ready format</div>
              </div>
              <Download size={16} color="var(--accent)" />
            </div>

            <Card title="Delivery address" icon={MapPin}>
              {order.address ? (
                <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{order.address.name}</div>
                  <div>{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}</div>
                  <div>{order.address.city}, {order.address.state} - {order.address.pincode}</div>
                  {order.address.phone && <div>{order.address.phone}</div>}
                </div>
              ) : <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>No address on record</span>}
            </Card>

            <Card title="Payment" icon={CreditCard}>
              <div style={{ fontSize: 14, lineHeight: 1.8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Method</span>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{order.payment?.method?.replace('_', ' ')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                  <span style={{ fontWeight: 600, color: order.payment?.status === 'paid' ? '#22c55e' : 'var(--text-primary)' }}>
                    {order.payment?.status || 'pending'}
                  </span>
                </div>
                {order.payment?.txnId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Txn ID</span>
                    <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{order.payment.txnId}</span>
                  </div>
                )}
              </div>
            </Card>

            <Card title="Price details" icon={Package}>
              <div style={{ fontSize: 14 }}>
                <PriceRow label="Subtotal" value={inr(order.totals.subtotal)} />
                {order.totals.savings > 0 && <PriceRow label="Discount" value={`- ${inr(order.totals.savings)}`} accent="#22c55e" />}
                <PriceRow label="Shipping" value={order.totals.shipping === 0 ? 'FREE' : inr(order.totals.shipping)} accent={order.totals.shipping === 0 ? '#22c55e' : undefined} />
                <PriceRow label="Tax" value={inr(order.totals.tax)} />
                <div style={{ borderTop: '1px solid var(--border-glass)', margin: '8px 0' }} />
                <PriceRow label="Total" value={inr(order.totals.total)} bold />
              </div>
            </Card>
          </div>
        </div>
      </div>

      <style>{`@media(max-width:900px){.order-detail-grid{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}

function Card({ title, icon: Icon, children }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 16, padding: '18px 20px' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, marginBottom: 14, color: 'var(--text-primary)' }}>
        <Icon size={16} color="var(--accent)" /> {title}
      </h3>
      {children}
    </div>
  );
}

function PriceRow({ label, value, bold, accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontWeight: bold ? 700 : 400 }}>
      <span style={{ color: bold ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{label}</span>
      <span style={{ color: accent || 'inherit' }}>{value}</span>
    </div>
  );
}
