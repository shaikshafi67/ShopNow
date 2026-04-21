export function inr(amount) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '₹0';
  return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export function shortDate(d) {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function relTime(d) {
  const date = d instanceof Date ? d : new Date(d);
  const diff = Date.now() - date.getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const day = Math.round(h / 24);
  if (day < 30) return `${day}d ago`;
  return shortDate(date);
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function orderId() {
  const y = new Date().getFullYear();
  const r = Math.floor(Math.random() * 900000 + 100000);
  return `SHN-${y}-${r}`;
}
