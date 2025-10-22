
(function (window, document) {
  'use strict';

  const STORAGE_KEY = 'cart';

  function readStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Cart read error', e);
      return [];
    }
  }

  function writeStorage(cart) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Cart save error', e);
    }
  }

  function getCart() {
    return readStorage();
  }

  function saveCart(cart) {
    writeStorage(cart);
    // keep UI in sync
    updateCartUI();
  }

  function clearCart() {
    writeStorage([]);
    updateCartUI();
  }

  function ensureInt(n, fallback = 0) {
    const x = parseInt(n, 10);
    return Number.isFinite(x) ? x : fallback;
  }

  function addToCart(product = {}) {
    if (!product || typeof product.id === 'undefined') return;
    const cart = getCart();
    const id = ensureInt(product.id, product.id); // allow numeric or string ids
    const existing = cart.find(it => String(it.id) === String(id));
    const qty = Math.max(1, ensureInt(product.quantity || 1, 1));

    if (existing) {
      existing.quantity = ensureInt(existing.quantity, 0) + qty;
    } else {
      // minimal normalization
      cart.push({
        id: product.id,
        name: product.name || product.shortName || 'محصول',
        shortName: product.shortName || product.name || '',
        price: ensureInt(product.price || 0, 0),
        image: product.image || product.images?.[0] || '',
        quantity: qty,
      });
    }
    saveCart(cart);
  }

  function removeFromCart(id) {
    const cart = getCart().filter(it => String(it.id) !== String(id));
    saveCart(cart);
  }

  function changeQuantity(id, delta) {
    const cart = getCart().map(it => ({ ...it })); // shallow clone
    const idx = cart.findIndex(it => String(it.id) === String(id));
    if (idx === -1) return;
    cart[idx].quantity = ensureInt(cart[idx].quantity, 0) + ensureInt(delta, 0);
    if (cart[idx].quantity <= 0) cart.splice(idx, 1);
    saveCart(cart);
  }

  function getCartTotal() {
    return getCart().reduce((s, it) => s + (ensureInt(it.price, 0) * ensureInt(it.quantity, 0)), 0);
  }

  function getCartCount() {
    // sum of quantities (more intuitive than length)
    return getCart().reduce((s, it) => s + ensureInt(it.quantity, 0), 0);
  }

  function formatCurrency(n) {
    if (typeof n !== 'number') n = Number(n) || 0;
    return n.toLocaleString() + ' افغانی';
  }

  // Default selectors; pages can still have their own IDs/classes
  const DEFAULTS = {
    itemsContainerId: 'cartItems',
    totalId: 'cartTotal',
    countId: 'cartCount',
    summaryContainerId: 'cartSummary', // optional
  };

  function updateCartUI(opts = {}) {
    const cfg = { ...DEFAULTS, ...opts };
    const container = document.getElementById(cfg.itemsContainerId);
    const totalEl = document.getElementById(cfg.totalId);
    const countEl = document.getElementById(cfg.countId);
    const cart = getCart();

    // update count (nav badge etc.)
    if (countEl) countEl.textContent = String(getCartCount());

    if (!container) return;

    // reset
    container.innerHTML = '';

    if (cart.length === 0) {
      container.innerHTML = '<p>سبد خرید شما خالی است.</p>';
      if (totalEl) totalEl.textContent = formatCurrency(0);
      return;
    }

    let total = 0;

    cart.forEach(item => {
      total += (ensureInt(item.price, 0) * ensureInt(item.quantity, 0));

      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <img src="${item.image || ''}" alt="${escapeHtml(item.name || '')}">
        <div class="cart-item-details">
          <p>${escapeHtml(item.name || item.shortName || '')}</p>
          <div class="cart-qty-controls">
            <button class="qty-btn decrease" data-id="${escapeAttr(item.id)}">−</button>
            <span class="qty-value">${ensureInt(item.quantity, 0)}</span>
            <button class="qty-btn increase" data-id="${escapeAttr(item.id)}">+</button>
          </div>
          <small class="item-line-price">${formatCurrency(ensureInt(item.price,0) * ensureInt(item.quantity,0))}</small>
        </div>
        <button class="remove-btn" data-id="${escapeAttr(item.id)}" aria-label="حذف">🗑️</button>
      `;
      container.appendChild(row);
    });

    if (totalEl) totalEl.textContent = formatCurrency(total);

    // attach single click handler (delegation)
    // use onclick overwrite to avoid duplicate handlers if called many times
    container.onclick = function (e) {
      const t = e.target;
      // find button with data-id
      if (t.matches('.increase')) {
        changeQuantity(t.dataset.id, 1);
        return;
      }
      if (t.matches('.decrease')) {
        changeQuantity(t.dataset.id, -1);
        return;
      }
      if (t.matches('.remove-btn')) {
        removeFromCart(t.dataset.id);
        return;
      }
    };
  }

  // small helpers to avoid XSS when injecting names (since content is local project)
  function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
  function escapeAttr(s) {
    if (s === null || s === undefined) return '';
    return String(s).replaceAll('"', '&quot;');
  }

  // expose API
  const CartAPI = {
    getCart,
    saveCart,
    addToCart,
    removeFromCart,
    changeQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    updateCartUI,
    formatCurrency,
  };

  // attach to window for legacy scripts
  if (!window.CartAPI) window.CartAPI = CartAPI;

  // auto-update nav badge and any cart container on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    CartAPI.updateCartUI();
  });

  // make available for module imports if environment supports (optional)
  try {
    if (typeof window.define === 'function' && window.define.amd) {
      define(() => CartAPI);
    }
  } catch (e) {
    // ignore
  }
})(window, document);
