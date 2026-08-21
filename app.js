// ATHO KADAI - Kiosk KOT & Billing Application Logic

const DEFAULT_MENU = [
  { id: 'a1', name: 'Soup (Plain Pe-Tho)', tamil: 'சூப்', price: 30, category: 'Soups', desc: 'Hot plantain stem broth with fried fritters', inStock: true },
  { id: 'a2', name: 'Egg Soup', tamil: 'முட்டை சூப்', price: 40, category: 'Soups', desc: 'Rich Burmese soup topped with egg', inStock: true },
  { id: 'a3', name: 'Egg Masala', tamil: 'முட்டை மசாலா', price: 20, category: 'Starters', desc: 'Hard boiled egg with garlic oil & fried onion topping', inStock: true },
  { id: 'a4', name: 'Veg Atho', tamil: 'வெஜ் அத்தோ', price: 80, category: 'Signature Atho', desc: 'Tossed noodles with raw cabbage, fried garlic & onion', inStock: true },
  { id: 'a5', name: 'Egg Atho', tamil: 'முட்டை அத்தோ', price: 90, category: 'Signature Atho', desc: 'Classic Burmese noodles tossed with egg & fried garlic', inStock: true },
  { id: 'a6', name: 'Chicken Atho', tamil: 'சிக்கன் அத்தோ', price: 100, category: 'Signature Atho', desc: 'Special Atho noodles topped with shredded chicken', inStock: true },
  { id: 'a7', name: 'Egg Sejo (Fried Atho)', tamil: 'முட்டை சேஜோ', price: 100, category: 'Fried Atho (Sejo)', desc: 'Spicy wok-fried Atho noodles with egg & vegetables', inStock: true },
  { id: 'a8', name: 'Chicken Sejo', tamil: 'சிக்கன் சேஜோ', price: 120, category: 'Fried Atho (Sejo)', desc: 'Wok-fried spicy Atho noodles tossed with chicken', inStock: true }
];

let appState = {
  restaurantName: 'ATHO KADAI (அத்தோ கடை)',
  categories: ['All', 'Soups', 'Starters', 'Signature Atho', 'Fried Atho (Sejo)'],
  currentCategory: 'All',
  menu: [],
  cart: [],
  nextTokenNumber: 1, // Auto-incrementing non-editable token counter
  targetKotId: null, // Set when appending items to an existing customer KOT
  activeOrders: [],
  salesHistory: []
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  loadLocalStorageData();
  renderCategories();
  renderMenu();
  renderKotList();
  renderSalesDashboard();
  updateOrderFormDisplay();
});

function loadLocalStorageData() {
  const savedMenu = localStorage.getItem('athokadai_menu');
  appState.menu = savedMenu ? JSON.parse(savedMenu) : DEFAULT_MENU;

  const savedOrders = localStorage.getItem('athokadai_active_orders');
  appState.activeOrders = savedOrders ? JSON.parse(savedOrders) : [];

  const savedSales = localStorage.getItem('athokadai_sales');
  appState.salesHistory = savedSales ? JSON.parse(savedSales) : [];

  const savedToken = localStorage.getItem('athokadai_token_counter');
  if (savedToken) {
    appState.nextTokenNumber = parseInt(savedToken, 10);
  } else if (appState.activeOrders.length > 0) {
    appState.nextTokenNumber = appState.activeOrders.length + 1;
  }
}

function saveState() {
  localStorage.setItem('athokadai_menu', JSON.stringify(appState.menu));
  localStorage.setItem('athokadai_active_orders', JSON.stringify(appState.activeOrders));
  localStorage.setItem('athokadai_sales', JSON.stringify(appState.salesHistory));
  localStorage.setItem('athokadai_token_counter', appState.nextTokenNumber.toString());
  updateBadges();
}

function updateBadges() {
  const activeCount = appState.activeOrders.length;
  const navBadge = document.getElementById('nav-active-badge');
  if (navBadge) navBadge.innerText = activeCount;
}

// Update Order Form Fields (Auto Token & Clear Name)
function updateOrderFormDisplay() {
  const tokenInput = document.getElementById('cart-token-display');
  const nameInput = document.getElementById('cart-customer-name');
  const appendBanner = document.getElementById('append-mode-banner');

  if (appState.targetKotId) {
    const existingKot = appState.activeOrders.find(o => o.id === appState.targetKotId);
    if (existingKot) {
      if (tokenInput) tokenInput.value = existingKot.tableNo; // Keep exact token number
      if (nameInput) nameInput.value = existingKot.customerName; // Keep exact customer name
      if (appendBanner) {
        appendBanner.style.display = 'flex';
        document.getElementById('append-customer-info').innerText = `${existingKot.tableNo} - ${existingKot.customerName}`;
      }
      return;
    }
  }

  // Normal New Order State
  if (appendBanner) appendBanner.style.display = 'none';
  if (tokenInput) tokenInput.value = `Token #${appState.nextTokenNumber}`;
  if (nameInput) nameInput.value = ''; // Auto cleared for next order
}

function cancelAppendMode() {
  appState.targetKotId = null;
  appState.cart = [];
  updateCartFloatBar();
  renderMenu();
  updateOrderFormDisplay();
  showToast('Cancelled append mode. Ready for new order!');
}

// Navigation View Switcher
function switchView(viewName) {
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));

  document.getElementById(`view-${viewName}`).classList.add('active');
  document.getElementById(`nav-btn-${viewName}`).classList.add('active');

  if (viewName === 'orders') renderKotList();
  if (viewName === 'sales') renderSalesDashboard();
}

// Category Pills
function renderCategories() {
  const container = document.getElementById('category-pills');
  if (!container) return;
  container.innerHTML = appState.categories.map(cat => `
    <button class="cat-pill ${cat === appState.currentCategory ? 'active' : ''}" onclick="selectCategory('${cat}')">
      ${cat}
    </button>
  `).join('');
}

function selectCategory(cat) {
  appState.currentCategory = cat;
  renderCategories();
  renderMenu();
}

// Render Menu
function renderMenu() {
  const container = document.getElementById('menu-items-list');
  if (!container) return;

  const filtered = appState.menu.filter(item => {
    return appState.currentCategory === 'All' || item.category === appState.currentCategory;
  });

  container.innerHTML = filtered.map(item => {
    const cartItem = appState.cart.find(ci => ci.id === item.id);
    const qty = cartItem ? cartItem.qty : 0;

    return `
      <div class="dish-card">
        <div>
          <div class="dish-header">
            <span style="font-size:12px; font-weight:800; background:#000; color:#fff; padding:2px 8px; border-radius:4px;">${item.category}</span>
          </div>
          <div class="dish-title">${item.name}</div>
          <div class="dish-tamil">${item.tamil || ''}</div>
          <div style="font-size:12px; color:#555; margin-bottom:10px;">${item.desc || ''}</div>
        </div>

        <div class="dish-footer">
          <div class="dish-price">₹${item.price}</div>
          ${qty > 0 ? `
            <div class="qty-counter">
              <button class="qty-btn" onclick="updateCartItemQty('${item.id}', -1)">-</button>
              <span class="qty-num">${qty}</span>
              <button class="qty-btn" onclick="updateCartItemQty('${item.id}', 1)">+</button>
            </div>
          ` : `
            <button class="add-btn" onclick="addToCart('${item.id}')">+ ADD</button>
          `}
        </div>
      </div>
    `;
  }).join('');
}

// Cart Operations
function addToCart(dishId) {
  const dish = appState.menu.find(d => d.id === dishId);
  if (!dish) return;

  const existing = appState.cart.find(ci => ci.id === dishId);
  if (existing) {
    existing.qty++;
  } else {
    appState.cart.push({ id: dish.id, name: dish.name, tamil: dish.tamil, price: dish.price, qty: 1 });
  }

  updateCartFloatBar();
  renderMenu();
  showToast(`Added ${dish.name}`);
}

function updateCartItemQty(dishId, delta) {
  const index = appState.cart.findIndex(ci => ci.id === dishId);
  if (index > -1) {
    appState.cart[index].qty += delta;
    if (appState.cart[index].qty <= 0) {
      appState.cart.splice(index, 1);
    }
  }
  updateCartFloatBar();
  renderMenu();
  renderCartDrawerItems();
}

function updateCartFloatBar() {
  const floatBar = document.getElementById('cart-float-bar');
  const totalCount = appState.cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = appState.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  document.getElementById('cart-badge-count').innerText = totalCount;
  document.getElementById('cart-float-price').innerText = `₹${subtotal}`;

  if (totalCount > 0) {
    floatBar.style.display = 'flex';
  } else {
    floatBar.style.display = 'none';
  }
}

function openCartModal() {
  if (appState.cart.length === 0) {
    showToast('Select menu items first');
    return;
  }

  const modalTitle = document.getElementById('cart-modal-title');
  if (appState.targetKotId) {
    const existingKot = appState.activeOrders.find(o => o.id === appState.targetKotId);
    if (modalTitle && existingKot) {
      modalTitle.innerText = `Adding Items to ${existingKot.tableNo} (${existingKot.customerName})`;
    }
  } else if (modalTitle) {
    modalTitle.innerText = `Send Items to Token #${appState.nextTokenNumber}`;
  }

  renderCartDrawerItems();
  document.getElementById('cart-modal').classList.add('active');
}

function closeCartModal() {
  document.getElementById('cart-modal').classList.remove('active');
}

function renderCartDrawerItems() {
  const container = document.getElementById('cart-items-list');
  if (appState.cart.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding: 20px;">No items selected</div>`;
    closeCartModal();
    return;
  }

  container.innerHTML = appState.cart.map(item => `
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding:10px 0;">
      <div>
        <div style="font-weight:900; font-size:15px;">${item.name}</div>
        <div style="font-size:12px; color:#555;">₹${item.price} x ${item.qty}</div>
      </div>
      <div style="display:flex; align-items:center; gap:12px;">
        <span style="font-weight:900; font-size:16px;">₹${item.price * item.qty}</span>
        <div class="qty-counter">
          <button class="qty-btn" onclick="updateCartItemQty('${item.id}', -1)">-</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="updateCartItemQty('${item.id}', 1)">+</button>
        </div>
      </div>
    </div>
  `).join('');

  const total = appState.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  document.getElementById('bill-grand-total').innerText = `₹${total}`;
}

// Send Order to KOT
function sendToKot() {
  if (appState.cart.length === 0) return;

  const orderType = document.getElementById('cart-order-type').value;

  // Case A: Append items to existing active customer KOT
  if (appState.targetKotId) {
    const existingOrder = appState.activeOrders.find(o => o.id === appState.targetKotId);
    if (existingOrder) {
      appState.cart.forEach(cartItem => {
        const itemInKot = existingOrder.items.find(i => i.id === cartItem.id);
        if (itemInKot) {
          itemInKot.qty += cartItem.qty;
          itemInKot.served = false; // New addition turns item unserved
        } else {
          existingOrder.items.push({ ...cartItem, served: false });
        }
      });

      existingOrder.total = existingOrder.items.reduce((sum, i) => sum + (i.price * i.qty), 0);
      existingOrder.isFullyServed = false; // Turn back RED because new unserved item added!
      
      saveState();
      appState.cart = [];
      appState.targetKotId = null;
      updateCartFloatBar();
      renderMenu();
      updateOrderFormDisplay(); // Reset to next auto token & empty customer name
      closeCartModal();
      switchView('orders');
      showToast(`Updated KOT for ${existingOrder.customerName}!`);
      return;
    }
  }

  // Case B: Create new customer KOT
  const enteredName = document.getElementById('cart-customer-name').value.trim();
  const currentTokenStr = `Token #${appState.nextTokenNumber}`;
  const finalCustName = enteredName ? enteredName : currentTokenStr;

  const newKot = {
    id: 'KOT-' + Math.floor(100 + Math.random() * 900),
    customerName: finalCustName,
    orderType: orderType,
    tableNo: currentTokenStr,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    items: appState.cart.map(i => ({ ...i, served: false })),
    total: appState.cart.reduce((sum, i) => sum + (i.price * i.qty), 0),
    isFullyServed: false // Default RED (pending)
  };

  appState.activeOrders.unshift(newKot);

  // Auto-increment Token counter for the next customer!
  appState.nextTokenNumber++;
  saveState();

  appState.cart = [];
  updateCartFloatBar();
  renderMenu();
  updateOrderFormDisplay(); // Token increments to Token #2, Customer Name cleared!
  closeCartModal();
  switchView('orders');
  showToast(`Created ${currentTokenStr} (${finalCustName})!`);
}

// Render Active KOT Cards (Red vs Green)
function renderKotList() {
  const container = document.getElementById('orders-list');
  if (!container) return;

  const countBadge = document.getElementById('active-orders-count');
  if (countBadge) countBadge.innerText = `${appState.activeOrders.length} Active KOTs`;

  if (appState.activeOrders.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 50px 20px; border:3px solid #000; border-radius:8px; background:#fff;">
        <h3 style="font-size:22px; font-weight:900;">NO ACTIVE KOTs</h3>
        <p style="font-weight:700; color:#555; margin-top:6px;">Create a new order from the Take Order tab</p>
        <button class="btn btn-primary" style="margin-top:15px;" onclick="switchView('menu')">Go to Take Order</button>
      </div>
    `;
    return;
  }

  container.innerHTML = appState.activeOrders.map(kot => {
    const isRed = !kot.isFullyServed;
    const cardClass = isRed ? 'status-red' : 'status-green';
    const statusText = isRed ? '🔴 PREPARING / DUE' : '🟢 ALL SERVED';

    return `
      <div class="kot-card ${cardClass}">
        <div class="kot-header">
          <div>
            <div class="kot-customer-title">${kot.tableNo} - ${kot.customerName}</div>
            <div style="font-size:13px; font-weight:800; color:#333;">${kot.orderType} • Order Time: ${kot.timestamp}</div>
          </div>
          <span class="kot-status-badge">${statusText}</span>
        </div>

        <table class="kot-items-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${kot.items.map(item => `
              <tr class="kot-item-row ${item.served ? 'served' : ''}">
                <td style="font-weight:800;">${item.name}</td>
                <td style="font-weight:900;">x${item.qty}</td>
                <td style="font-weight:900;">₹${item.price * item.qty}</td>
                <td>
                  <button class="serve-check-btn ${item.served ? 'is-served' : ''}" onclick="toggleItemServed('${kot.id}', '${item.id}')">
                    ${item.served ? '✓ Served' : 'Mark Served'}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="kot-actions-bar">
          <div>
            <span style="font-size:12px; font-weight:800; text-transform:uppercase;">Bill Total:</span>
            <div class="kot-total-price">₹${kot.total}</div>
          </div>
          
          <div style="display:flex; gap:8px;">
            <button class="btn btn-add-item" onclick="appendMoreItemsToKot('${kot.id}')">
              + Add Item
            </button>
            <button class="btn btn-success" onclick="openSettlePaymentModal('${kot.id}')">
              Customer Paid
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Toggle Served Status
function toggleItemServed(kotId, itemId) {
  const kot = appState.activeOrders.find(o => o.id === kotId);
  if (!kot) return;

  const item = kot.items.find(i => i.id === itemId);
  if (item) {
    item.served = !item.served;
  }

  // Check if ALL items in KOT are served -> Update to GREEN!
  kot.isFullyServed = kot.items.every(i => i.served);

  saveState();
  renderKotList();
}

// Append More Items to Existing Active Customer KOT
function appendMoreItemsToKot(kotId) {
  appState.targetKotId = kotId;
  const kot = appState.activeOrders.find(o => o.id === kotId);
  if (!kot) return;

  appState.cart = [];
  updateCartFloatBar();
  updateOrderFormDisplay(); // Preserves token & customer name for existing order
  switchView('menu');

  showToast(`Select extra items for ${kot.tableNo} (${kot.customerName})`);
}

// Settle Payment
let activeSettleKotId = null;

function openSettlePaymentModal(kotId) {
  activeSettleKotId = kotId;
  const kot = appState.activeOrders.find(o => o.id === kotId);
  if (!kot) return;

  document.getElementById('settle-cust-name').innerText = `${kot.tableNo} (${kot.customerName})`;
  document.getElementById('settle-amount').innerText = `₹${kot.total}`;
  document.getElementById('settle-modal').classList.add('active');
}

function closeSettleModal() {
  document.getElementById('settle-modal').classList.remove('active');
  activeSettleKotId = null;
}

function confirmSettlement() {
  if (!activeSettleKotId) return;

  const kotIndex = appState.activeOrders.findIndex(o => o.id === activeSettleKotId);
  if (kotIndex === -1) return;

  const kot = appState.activeOrders[kotIndex];
  const paymentMode = document.getElementById('settle-payment-mode').value;

  const completedSale = {
    ...kot,
    paymentMode: paymentMode,
    settledAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    settledDate: new Date().toLocaleDateString()
  };

  appState.salesHistory.unshift(completedSale);
  appState.activeOrders.splice(kotIndex, 1);

  saveState();
  closeSettleModal();
  renderKotList();
  renderSalesDashboard();
  showToast(`Bill settled for ${completedSale.tableNo}! Added to Sales.`);
}

// Render Sales Dashboard
function renderSalesDashboard() {
  const totalRevenue = appState.salesHistory.reduce((sum, s) => sum + s.total, 0);
  const totalOrders = appState.salesHistory.length;
  const avgValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  document.getElementById('stat-revenue').innerText = `₹${totalRevenue}`;
  document.getElementById('stat-count').innerText = totalOrders;
  document.getElementById('stat-avg').innerText = `₹${avgValue.toFixed(0)}`;

  const historyContainer = document.getElementById('sales-history-list');
  if (!historyContainer) return;

  if (appState.salesHistory.length === 0) {
    historyContainer.innerHTML = `<div style="text-align:center; padding:30px 0; color:#555; font-weight:700;">No settled bills today</div>`;
    return;
  }

  historyContainer.innerHTML = appState.salesHistory.map(sale => `
    <div style="background:#fff; border:2px solid #000; border-radius:6px; padding:12px; margin-bottom:10px; display:flex; justify-space-between; align-items:center;">
      <div>
        <div style="font-size:16px; font-weight:900;">${sale.tableNo} - ${sale.customerName} (${sale.orderType})</div>
        <div style="font-size:12px; color:#555;">${sale.items.map(i => `${i.name} x${i.qty}`).join(', ')}</div>
        <div style="font-size:11px; font-weight:800; margin-top:2px;">Paid via ${sale.paymentMode} at ${sale.settledAt}</div>
      </div>
      <div style="font-size:22px; font-weight:900; background:#000; color:#fff; padding:4px 12px; border-radius:4px;">
        ₹${sale.total}
      </div>
    </div>
  `).join('');
}

function resetDayData() {
  if (confirm('Reset today\'s sales log and token counter back to Token #1?')) {
    appState.salesHistory = [];
    appState.nextTokenNumber = 1;
    saveState();
    updateOrderFormDisplay();
    renderSalesDashboard();
    showToast('Reset completed!');
  }
}

// Toast Helper
function showToast(msg) {
  const box = document.getElementById('toast-box');
  if (!box) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerText = msg;
  box.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}
