/* Season Gift — shared core (data model + API + utilities)
   Loaded by every standalone page (admin.html, whatsapp.html, driver.html).
   State lives in localStorage so the three separately-deployed pages share
   one "database" in the browser — exactly like the platform's real pitch
   (one core, several apps reading/writing it), just without a server. */
(function (global) {
"use strict";

const STORAGE_KEY = "sg_db_v1";

let seq = 1;
const nextId = (p) => `${p}-${String(seq++).padStart(4, "0")}`;
const nowISO = () => new Date().toISOString();

// ---------------- Product illustrations (flat SVG, no external images/licensing) ----------------
function svgBg() { return '<rect width="260" height="150" fill="#EFEAE0"/>'; }
function svgHamper(hex) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="260" height="150" viewBox="0 0 260 150">' + svgBg() +
    '<path d="M55 80 L205 80 L190 135 L70 135 Z" fill="' + hex + '"/>' +
    '<path d="M55 80 L205 80 L200 92 L60 92 Z" fill="' + hex + '" opacity="0.6"/>' +
    '<path d="M95 80 Q95 40 130 40 Q165 40 165 80" stroke="#8a6a2c" stroke-width="6" fill="none"/>' +
    '<circle cx="130" cy="60" r="9" fill="#B0553A"/><circle cx="112" cy="70" r="7" fill="#C98A3E"/><circle cx="150" cy="70" r="7" fill="#2F5D4C"/>' +
    '<rect x="60" y="95" width="140" height="4" fill="#fff" opacity="0.5"/><rect x="63" y="110" width="132" height="4" fill="#fff" opacity="0.4"/></svg>';
}
function svgChocolate(hex) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="260" height="150" viewBox="0 0 260 150">' + svgBg() +
    '<rect x="55" y="45" width="150" height="80" rx="6" fill="' + hex + '"/>' +
    '<rect x="55" y="45" width="150" height="18" rx="6" fill="' + hex + '" opacity="0.6"/>' +
    '<rect x="122" y="45" width="16" height="80" fill="#fff" opacity="0.85"/><rect x="55" y="78" width="150" height="14" fill="#fff" opacity="0.85"/>' +
    '<circle cx="130" cy="85" r="12" fill="#B0553A"/></svg>';
}
function svgBouquet(hex) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="260" height="150" viewBox="0 0 260 150">' + svgBg() +
    '<path d="M120 130 L130 70 L140 130 Z" fill="#3F6B4E"/>' +
    '<circle cx="105" cy="60" r="16" fill="' + hex + '"/><circle cx="130" cy="45" r="18" fill="' + hex + '"/><circle cx="155" cy="60" r="16" fill="' + hex + '"/>' +
    '<circle cx="118" cy="52" r="7" fill="#F1EEE6" opacity="0.8"/><circle cx="142" cy="52" r="7" fill="#F1EEE6" opacity="0.8"/>' +
    '<path d="M100 130 L160 130 L150 108 L110 108 Z" fill="#C9A876"/></svg>';
}
function svgMug(hex) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="260" height="150" viewBox="0 0 260 150">' + svgBg() +
    '<rect x="85" y="45" width="80" height="80" rx="8" fill="' + hex + '"/>' +
    '<path d="M165 60 Q195 60 195 85 Q195 110 165 110" stroke="' + hex + '" stroke-width="10" fill="none"/>' +
    '<rect x="95" y="55" width="60" height="14" rx="3" fill="#fff" opacity="0.8"/></svg>';
}
function svgCandle(hex) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="260" height="150" viewBox="0 0 260 150">' + svgBg() +
    '<rect x="95" y="55" width="30" height="75" rx="4" fill="' + hex + '"/><rect x="135" y="70" width="30" height="60" rx="4" fill="' + hex + '" opacity="0.75"/>' +
    '<path d="M110 55 Q113 42 110 35 Q107 42 110 55" fill="#C98A3E"/><path d="M150 70 Q153 57 150 50 Q147 57 150 70" fill="#C98A3E"/></svg>';
}
function svgTeddy(hex) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="260" height="150" viewBox="0 0 260 150">' + svgBg() +
    '<circle cx="130" cy="105" r="36" fill="' + hex + '"/>' +
    '<circle cx="130" cy="55" r="26" fill="' + hex + '"/>' +
    '<circle cx="106" cy="30" r="11" fill="' + hex + '"/><circle cx="154" cy="30" r="11" fill="' + hex + '"/>' +
    '<circle cx="120" cy="52" r="3" fill="#2b2b2b"/><circle cx="140" cy="52" r="3" fill="#2b2b2b"/>' +
    '<ellipse cx="130" cy="62" rx="8" ry="6" fill="#8a6a2c"/></svg>';
}
function svgCake(hex) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="260" height="150" viewBox="0 0 260 150">' + svgBg() +
    '<rect x="70" y="90" width="120" height="38" rx="6" fill="' + hex + '"/>' +
    '<rect x="90" y="58" width="80" height="34" rx="6" fill="' + hex + '" opacity="0.85"/>' +
    '<rect x="127" y="36" width="6" height="24" fill="#C98A3E"/>' +
    '<circle cx="130" cy="30" r="5" fill="#E8A23D"/>' +
    '<circle cx="100" cy="105" r="4" fill="#fff" opacity="0.7"/><circle cx="160" cy="105" r="4" fill="#fff" opacity="0.7"/></svg>';
}
const PRODUCT_DRAW = { hamper: svgHamper, chocolate: svgChocolate, bouquet: svgBouquet, mug: svgMug, candle: svgCandle, teddy: svgTeddy, cake: svgCake };
function imgFor(type, hex) { return 'data:image/svg+xml;utf8,' + encodeURIComponent(PRODUCT_DRAW[type](hex)); }

function seedDB() {
  const db = {
    users: [
      { id: "usr-0001", name: "Owner (Season Gift)", role: "owner" },
      { id: "usr-0002", name: "Priya (Staff)", role: "staff" },
      { id: "usr-0003", name: "Ravi (Driver)", role: "driver" },
      { id: "usr-0004", name: "Ken (Driver)", role: "driver" },
    ],
    customers: [],
    products: [
      { id: "prd-0001", name: "Gift Hamper — Classic", price: 950, warehouseStock: 30, received: 0, sold: 6, location: "Main Store", reorderThreshold: 8, type: "hamper", hex: "#C9A876" },
      { id: "prd-0002", name: "Deluxe Celebration Hamper", price: 1650, warehouseStock: 18, received: 0, sold: 3, location: "Main Store", reorderThreshold: 6, type: "hamper", hex: "#B08A5A" },
      { id: "prd-0003", name: "Chocolate Box — Deluxe", price: 480, warehouseStock: 16, received: 0, sold: 10, location: "Main Store", reorderThreshold: 10, type: "chocolate", hex: "#B0553A" },
      { id: "prd-0004", name: "Truffle Tin — 12pc", price: 320, warehouseStock: 25, received: 0, sold: 4, location: "Main Store", reorderThreshold: 8, type: "chocolate", hex: "#7A3E2A" },
      { id: "prd-0005", name: "Flower Bouquet — Rose Mix", price: 650, warehouseStock: 20, received: 0, sold: 5, location: "Main Store", reorderThreshold: 5, type: "bouquet", hex: "#B0553A" },
      { id: "prd-0006", name: "Tropical Bloom Bouquet", price: 890, warehouseStock: 15, received: 0, sold: 2, location: "Main Store", reorderThreshold: 5, type: "bouquet", hex: "#2F5D4C" },
      { id: "prd-0007", name: "Personalised Mug", price: 320, warehouseStock: 45, received: 0, sold: 5, location: "Warehouse", reorderThreshold: 12, type: "mug", hex: "#2F5D4C" },
      { id: "prd-0008", name: "Scented Candle Duo", price: 540, warehouseStock: 22, received: 0, sold: 3, location: "Warehouse", reorderThreshold: 8, type: "candle", hex: "#C9A876" },
      { id: "prd-0009", name: "Teddy Bear Gift Set", price: 720, warehouseStock: 16, received: 0, sold: 2, location: "Warehouse", reorderThreshold: 6, type: "teddy", hex: "#C98A3E" },
      { id: "prd-0010", name: "Birthday Cake — Chocolate", price: 850, warehouseStock: 10, received: 0, sold: 1, location: "Main Store", reorderThreshold: 4, type: "cake", hex: "#6B4226" },
    ],
    orders: [],
    deliveries: [],
    invoices: [],
    reviews: [],
    stockAudit: [],
    expenses: [
      { id: "exp-0001", category: "Salaries", description: "Staff salaries — September", amount: 45000, at: "2026-09-01T09:00:00.000Z" },
      { id: "exp-0002", category: "Rent", description: "Main Store rent", amount: 15000, at: "2026-09-01T09:00:00.000Z" },
      { id: "exp-0003", category: "Utilities", description: "Electricity & water", amount: 3200, at: "2026-09-03T09:00:00.000Z" },
      { id: "exp-0004", category: "Marketing", description: "Facebook & Instagram ads", amount: 2500, at: "2026-09-05T09:00:00.000Z" },
    ],
    seq: 1,
  };
  db.products.forEach(p => { p.img = imgFor(p.type, p.hex); });
  return db;
}

let db = null;

function loadDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      db = JSON.parse(raw);
      seq = db.seq || 1;
      db.products.forEach(p => { if (!p.img) p.img = imgFor(p.type, p.hex); });
      return db;
    }
  } catch (e) { /* corrupted storage — fall through to reseed */ }
  db = seedDB();
  saveDB();
  return db;
}

function saveDB() {
  db.seq = seq;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); }
  catch (e) { /* storage full or unavailable (private mode) — demo still works in-memory */ }
}

function resetDB() {
  localStorage.removeItem(STORAGE_KEY);
  seq = 1;
  db = seedDB();
  saveDB();
  return db;
}

// ---------------- Inventory model ----------------
function currentStock(p) { return Math.max(0, p.warehouseStock + p.received - p.sold); }
const WHOLESALE_COST_RATIO = 0.55;

function invRestock(productId, qty) {
  const p = db.products.find(p => p.id === productId); if (!p) return;
  const before = currentStock(p); p.received += qty;
  db.stockAudit.push({ id: nextId("man"), productId: p.id, change: qty, before, after: currentStock(p), reason: "stock received into warehouse", at: nowISO() });
  const cost = Math.round(p.price * WHOLESALE_COST_RATIO * qty);
  db.expenses.push({ id: nextId("exp"), category: "Purchases", description: `Stock received — ${qty} x ${p.name}`, amount: cost, at: nowISO() });
  saveDB();
  return p;
}

// ---------------- Core API ----------------
const ledgerBook = {
  createInvoice(order, method) {
    return { ledgerId: `LB-${order.id}`, orderId: order.id, amount: order.total, status: "pending", method: method || null, issuedAt: nowISO() };
  }
};

const core = {
  listProducts: () => db.products,
  updateProductPrice(id, price) { const p = db.products.find(p => p.id === id); if (p) p.price = price; saveDB(); return p; },
  findOrCreateCustomer({ name, phone }) {
    let c = db.customers.find(c => c.phone === phone);
    if (!c) { c = { id: nextId("cus"), name: name || phone, phone, createdAt: nowISO() }; db.customers.push(c); }
    saveDB();
    return c;
  },
  listCustomers: () => db.customers,
  createOrder({ customerId, items, source, status = "pending" }) {
    const total = items.reduce((s, it) => { const p = db.products.find(p => p.id === it.productId); return s + (p ? p.price * it.qty : 0); }, 0);
    const order = { id: nextId("ord"), customerId, items, source, status, total, createdAt: nowISO() };
    db.orders.push(order);
    saveDB();
    return order;
  },
  listOrders: () => db.orders,
  getOrder: (id) => db.orders.find(o => o.id === id),
  confirmOrder(id) {
    const order = core.getOrder(id); if (!order) throw new Error("order not found");
    order.status = "confirmed";
    for (const it of order.items) {
      const p = db.products.find(p => p.id === it.productId);
      if (p) {
        const before = currentStock(p); p.sold += it.qty;
        db.stockAudit.push({ id: nextId("aud"), productId: p.id, change: -it.qty, before, after: currentStock(p), reason: `order ${order.id} confirmed`, at: nowISO() });
      }
    }
    saveDB();
    return order;
  },
  createDelivery({ orderId, driverId }) {
    const d = { id: nextId("del"), orderId, driverId: driverId || null, status: "unassigned", location: null, proof: null, createdAt: nowISO() };
    db.deliveries.push(d);
    saveDB();
    return d;
  },
  listDeliveries: () => db.deliveries,
  getDelivery: (id) => db.deliveries.find(d => d.id === id),
  updateDeliveryStatus(id, status) {
    const d = core.getDelivery(id); if (!d) throw new Error("not found");
    const wasDelivered = d.status === "delivered";
    d.status = status;
    if (status === "delivered" && !wasDelivered) {
      if (!d.proof) d.proof = { type: "photo", note: "Auto-captured on delivery", at: nowISO() };
      const order = core.getOrder(d.orderId);
      if (order && order.status !== "fulfilled") order.status = "fulfilled";
    }
    saveDB();
    return d;
  },
  assignDriver(id, driverId) { const d = core.getDelivery(id); if (!d) throw new Error("not found"); d.driverId = driverId; d.status = "assigned"; saveDB(); return d; },
  pingLocation(id, lat, lng) { const d = core.getDelivery(id); if (!d) throw new Error("not found"); d.location = { lat, lng, at: nowISO() }; saveDB(); return d; },
  attachProof(id, proof) { const d = core.getDelivery(id); if (!d) throw new Error("not found"); d.proof = proof; saveDB(); return d; },
  listUsers: (role) => role ? db.users.filter(u => u.role === role) : db.users,
};

function finConfirmAndInvoice(orderId, method) {
  const order = core.confirmOrder(orderId);
  const invoice = ledgerBook.createInvoice(order, method);
  db.invoices.push(invoice);
  saveDB();
  return { order, invoice };
}
function finMarkPaid(ledgerId) { const inv = db.invoices.find(i => i.ledgerId === ledgerId); if (inv) inv.status = "paid"; saveDB(); return inv; }
const PAYMENT_METHOD_LABEL = { card: "Card / Payment Link", juice: "Juice by MCB", push: "Push to Phone", cash: "Cash on Delivery", bank: "Bank Transfer", null: "Manual / unspecified" };
const PAYMENT_METHODS = [["card", "💳 Card"], ["juice", "📱 Juice"], ["push", "📲 Push to phone"], ["cash", "💵 Cash on delivery"], ["bank", "🏦 Bank transfer"]];

function routeSequence(stops, start) {
  start = start || { lat: -20.1609, lng: 57.5012 };
  const remaining = [...stops]; const sequenced = []; let current = start;
  while (remaining.length) {
    let bestIdx = 0, bestDist = Infinity;
    remaining.forEach((s, idx) => { const dist = Math.hypot(s.lat - current.lat, s.lng - current.lng); if (dist < bestDist) { bestDist = dist; bestIdx = idx; } });
    const [next] = remaining.splice(bestIdx, 1); sequenced.push(next); current = next;
  }
  return sequenced;
}

function reviewSubmit({ deliveryId, rating, comment }) {
  const delivery = core.getDelivery(deliveryId); if (!delivery) throw new Error("not found");
  const review = { id: nextId("rev"), deliveryId, orderId: delivery.orderId, rating: Number(rating), comment: comment || "", at: nowISO() };
  db.reviews.push(review);
  saveDB();
  return review;
}

/* Shared checkout core — every order, whatever its source (WhatsApp, Facebook, Instagram,
   walk-in, phone), routes through the exact same payment gateway and core writes. */
let driverRotation = 0;
function estimateDeliveryText() {
  const now = new Date();
  const eta = new Date(now);
  if (now.getHours() < 15) {
    eta.setHours(now.getHours() + 3, 0, 0, 0);
    return 'Today, by ' + eta.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  eta.setDate(eta.getDate() + 1);
  eta.setHours(11, 0, 0, 0);
  return 'Tomorrow, by ' + eta.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
function completeOrderPayment(order, method) {
  const { invoice } = finConfirmAndInvoice(order.id, method);
  if (method !== "cash") finMarkPaid(invoice.ledgerId);
  const delivery = core.createDelivery({ orderId: order.id });
  const drivers = core.listUsers("driver");
  const driver = drivers[driverRotation % drivers.length]; driverRotation++;
  core.assignDriver(delivery.id, driver.id);
  const lat = -20.1609 + (Math.random() - 0.5) * 0.05, lng = 57.5012 + (Math.random() - 0.5) * 0.05;
  core.pingLocation(delivery.id, lat, lng);
  const eta = estimateDeliveryText();
  const methodLabel = PAYMENT_METHOD_LABEL[method];
  const status = method === "cash" ? "Pending (COD)" : "Paid";
  return { invoice, delivery, driver, eta, methodLabel, status };
}

// ---------------- WhatsApp parsing ----------------
function waParse(text) {
  const lower = text.toLowerCase();
  const matched = db.products.filter(p => lower.includes(p.name.toLowerCase().split(" ")[0]));
  const qtyMatch = lower.match(/(\d+)\s*x?/);
  const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
  return { matched, qty };
}
function waSimulate({ phone, name, message }) {
  const customer = core.findOrCreateCustomer({ name, phone });
  const { matched, qty } = waParse(message);
  if (matched.length === 0) {
    return { reply: `Hi ${customer.name}! I couldn't match a product in "${message}". A staff member will follow up shortly.`, handoff: true, customer };
  }
  const items = matched.map(p => ({ productId: p.id, qty }));
  const order = core.createOrder({ customerId: customer.id, items, source: "whatsapp", status: "pending" });
  return { reply: `Thanks ${customer.name}! I've noted ${qty} x ${matched.map(p => p.name).join(", ")} — total Rs ${order.total}. Our team will confirm shortly.`, handoff: false, customer, order };
}

// ---------------- Shared view helpers ----------------
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function productNames(items) { return items.map(it => { const p = db.products.find(p => p.id === it.productId); return `${it.qty} x ${p ? p.name : it.productId}`; }).join(", "); }
function customerName(id) { const c = db.customers.find(c => c.id === id); return c ? c.name : id; }
function driverName(id) { const u = db.users.find(u => u.id === id); return u ? u.name : "—"; }
function initials(name) { return (name || "?").trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase(); }

const ICONS = {
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.9-6.2A8 8 0 1 1 21 12Z"/></svg>',
  box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8v8l9 5 9-5V8Z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg>',
  receipt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2Z"/><path d="M9 7h6M9 11h6"/></svg>',
  truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 7h12v9H2z"/><path d="M14 10h4l4 3.5V16h-8z"/><circle cx="6.5" cy="18" r="1.7"/><circle cx="17.5" cy="18" r="1.7"/></svg>',
  wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3"/><path d="M3 7v10a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2Z"/><circle cx="17" cy="14" r="1.3"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5 15 9l7 1-5 4.9L18.4 22 12 18.3 5.6 22 7 14.9 2 10l7-1Z"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 15 15 9"/><path d="M13.5 5.5 15 4a3.5 3.5 0 0 1 5 5l-1.5 1.5"/><path d="M10.5 18.5 9 20a3.5 3.5 0 0 1-5-5l1.5-1.5"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m10 8.5 6 3.5-6 3.5Z"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17h.01"/></svg>',
  log: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v5H4zM4 12h10M4 16h10M4 20h6"/></svg>',
  route: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.3"/><circle cx="18" cy="18" r="2.3"/><path d="M8 7c3 0 2 8 5 8h5"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.3"/></svg>',
  qr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM19 14h2M14 19h2M19 19h2"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5 9.5 18 20 6"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15M13 6l6 6-6 6"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/></svg>',
  reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 1 3 6.7"/><path d="M3 21v-6h6"/></svg>',
  store: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M4 9h16v11H4z"/><path d="M9 20v-6h6v6"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l1.5-2h7L17 8h3v11H4Z"/><circle cx="12" cy="13.5" r="3.2"/></svg>',
  external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/></svg>',
};
function icon(name) { return `<span class="icon">${ICONS[name] || ""}</span>`; }
function applyIcons(root) {
  (root || document).querySelectorAll("[data-icon]").forEach(el => {
    if (el.dataset.iconApplied) return;
    el.insertAdjacentHTML("afterbegin", icon(el.dataset.icon));
    el.dataset.iconApplied = "1";
  });
}

// ---------------- Mini map (abstract, offline — no tile/API dependency) ----------------
const MAP_BOUNDS = { latMin: -20.32, latMax: -20.08, lngMin: 57.465, lngMax: 57.525 };
const MAP_LANDMARKS = [
  { lat: -20.1609, lng: 57.5012, label: "Main Store", icon: "store" },
  { lat: -20.235, lng: 57.4938, label: "Warehouse", icon: "box" },
];
function mapXY(lat, lng, w, h) {
  const x = ((lng - MAP_BOUNDS.lngMin) / (MAP_BOUNDS.lngMax - MAP_BOUNDS.lngMin)) * w;
  const y = ((MAP_BOUNDS.latMax - lat) / (MAP_BOUNDS.latMax - MAP_BOUNDS.latMin)) * h;
  return [Math.max(10, Math.min(w - 10, x)), Math.max(10, Math.min(h - 10, y))];
}
function pinPath() { return "M0,0 C-3,-4 -13,-15 -13,-24 A13,13 0 1 1 13,-24 C13,-15 3,-4 0,0 Z"; }
function buildMiniMap(lat, lng, pulsing) {
  const w = 300, h = 190;
  const blocks = [
    [14, 16, 58, 34], [80, 14, 64, 36], [154, 18, 56, 32], [220, 14, 64, 36],
    [14, 96, 56, 34], [86, 100, 60, 30], [158, 98, 56, 34], [224, 98, 58, 32],
    [16, 150, 54, 30], [86, 150, 58, 28], [158, 150, 54, 30], [222, 150, 58, 28],
  ].map(([x, y, bw, bh]) => `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="3" fill="#e4e9dc"/>`).join("");
  const park = `<rect x="200" y="30" width="46" height="40" rx="8" fill="#d7e8cf"/>`;
  const water = `<path d="M300,0 L300,190 L250,190 C232,150 250,90 300,60 Z" fill="#cfe3ef"/>`;
  const majorRoads = `M0,80 L300,68 M0,132 L300,140`;
  const minorRoads = `M76,0 L64,190 M150,0 L150,190 M0,10 L300,20 M0,190 L60,0 M300,10 L210,190`;
  const roads = `
    <path d="${majorRoads}" stroke="#ffffff" stroke-width="7" fill="none"/>
    <path d="${majorRoads}" stroke="#f0c85a" stroke-width="4" fill="none"/>
    <path d="${minorRoads}" stroke="#ffffff" stroke-width="4.5" fill="none"/>
    <path d="${minorRoads}" stroke="#e4e0d2" stroke-width="2.5" fill="none"/>
  `;
  let landmarks = "";
  MAP_LANDMARKS.forEach(l => {
    const [x, y] = mapXY(l.lat, l.lng, w, h);
    landmarks += `<g transform="translate(${x},${y})">
      <path d="${pinPath()}" fill="#5b6c85" stroke="#fff" stroke-width="1.5"/>
      <circle cy="-24" r="5.5" fill="#fff"/>
      <text x="0" y="16" font-size="8.5" font-weight="600" text-anchor="middle" fill="#3a4658" stroke="#fff" stroke-width="3" paint-order="stroke">${l.label}</text>
    </g>`;
  });
  let driverMark = "";
  if (lat != null && lng != null) {
    const [x, y] = mapXY(lat, lng, w, h);
    driverMark = `<g transform="translate(${x},${y})">
      ${pulsing ? `<circle cy="0" r="6" fill="var(--bad)" opacity=".3"><animate attributeName="r" values="6;20;6" dur="1.8s" repeatCount="indefinite"/><animate attributeName="opacity" values=".4;0;.4" dur="1.8s" repeatCount="indefinite"/></circle>` : ""}
      <ellipse cy="1" rx="7" ry="2.5" fill="rgba(0,0,0,.18)"/>
      <path d="${pinPath()}" fill="var(--bad)" stroke="#fff" stroke-width="1.8"/>
      <circle cy="-24" r="5.5" fill="#fff"/>
      <circle cy="-24" r="2.6" fill="var(--bad)"/>
    </g>`;
  }
  return `<div class="minimap"><svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${w}" height="${h}" fill="#eef1ea"/>
    ${water}${blocks}${park}${roads}${landmarks}${driverMark}
  </svg>${pulsing ? `<div class="live-badge"><span class="dot"></span>LIVE</div>` : ""}</div>`;
}

// ---------------- Delivery slip mockup ----------------
function buildBarcode(text) {
  let bars = ""; let x = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    const w = 1 + (code % 3);
    if (code % 2 === 0) bars += `<rect x="${x}" y="0" width="${w}" height="34" fill="var(--ink)"/>`;
    x += w + 1.5;
  }
  return `<svg viewBox="0 0 ${x} 34" style="width:100%;height:36px;display:block">${bars}</svg>`;
}
function buildDeliverySlip(delivery, order, customer) {
  return `<div class="dslip">
    <div class="dslip-head"><span>SEASON GIFT</span><span>DELIVERY NOTE</span></div>
    <div class="dslip-row"><span class="muted">Delivery</span><span class="mono">${delivery.id}</span></div>
    <div class="dslip-row"><span class="muted">Order</span><span class="mono">${order.id}</span></div>
    <div class="dslip-row"><span class="muted">Customer</span><span>${customer ? customer.name : "—"}</span></div>
    <div class="dslip-row"><span class="muted">Items</span><span style="text-align:right;max-width:65%">${productNames(order.items)}</span></div>
    <div class="dslip-row"><span class="muted">Route</span><span>Main Store → Customer address</span></div>
    <div class="dslip-row"><span class="muted">Status</span><span class="badge unassigned">unassigned</span></div>
    <div class="dslip-barcode">${buildBarcode(delivery.id)}</div>
  </div>`;
}

// ---------------- Public namespace ----------------
global.SG = {
  STORAGE_KEY,
  get db() { return db; },
  loadDB, saveDB, resetDB,
  nextId, nowISO, currentStock, invRestock, WHOLESALE_COST_RATIO,
  core, ledgerBook, finConfirmAndInvoice, finMarkPaid, PAYMENT_METHOD_LABEL, PAYMENT_METHODS,
  routeSequence, reviewSubmit, waParse, waSimulate, completeOrderPayment, estimateDeliveryText,
  escapeHtml, productNames, customerName, driverName, initials,
  icon, applyIcons, ICONS,
  buildMiniMap, buildBarcode, buildDeliverySlip,
  get driverRotation() { return driverRotation; }, bumpDriverRotation() { return driverRotation++; },
};

loadDB();

/* Cross-tab/page live sync: when another SeasonGift page (open in a different
   tab) writes to localStorage, this page gets a native "storage" event and
   can reload + re-render — this is what makes "send a WhatsApp order in one
   tab, see it land in Admin in another tab" actually work with zero backend. */
global.addEventListener("storage", (e) => {
  if (e.key === STORAGE_KEY) {
    loadDB();
    global.dispatchEvent(new CustomEvent("sg:db-changed"));
  }
});

})(window);
