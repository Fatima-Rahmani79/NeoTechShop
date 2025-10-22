"use strict";

/**
 * Unified and careful refactor to fix badge/modal update delay.
 * - Single source of cart functions (getCart/saveCart/addToCart/updateCartUI/updateCartBadge)
 * - Event delegation for all ".addToCart" clicks
 * - Products cached via loadProducts()
 * - Ensures data-price attributes store AFN values when rendering
 * - All UI text preserved in Persian; comments in English
 */

const USD_TO_AFN = 66; // conversion rate constant

/* --------------------------
   Utility helpers
   -------------------------- */
const $ = (sel, ctx = document) => (ctx || document).querySelector(sel);
const $$ = (sel, ctx = document) =>
  Array.from((ctx || document).querySelectorAll(sel));

function safeParseInt(v, fallback = 0) {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? fallback : n;
}
function safeParseFloat(v, fallback = 0) {
  const n = parseFloat(v);
  return Number.isNaN(n) ? fallback : n;
}
function usdToAfn(usd) {
  return Math.round(Number(usd) * USD_TO_AFN);
}
function numberToLocaleString(n) {
  if (typeof n !== "number") n = Number(n) || 0;
  return n.toLocaleString();
}
function debounce(fn, ms = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/* --------------------------
   Products loader (cached)
   -------------------------- */
let productsCache = null;
async function loadProducts() {
  if (productsCache) return productsCache;
  try {
    const res = await fetch("assets/data/products.json");
    const data = await res.json();
    productsCache = data || [];
    return productsCache;
  } catch (err) {
    console.error("Error loading products.json:", err);
    productsCache = [];
    return productsCache;
  }
}

/* --------------------------
   Cart: single source-of-truth functions
   -------------------------- */
function getCart() {
  try {
    return JSON.parse(localStorage.getItem("cart")) || [];
  } catch {
    return [];
  }
}

/* ---------- Robust cart update (paste/replace saveCart + add these helpers) ---------- */

/* helper: return cart count */
function getCartCount() {
  const cart = getCart();
  return (cart || []).reduce((s, it) => s + safeParseInt(it.quantity, 0), 0);
}

/* update any possible badge elements across different templates/selectors */
function updateAnyBadgeElements(count) {
  // list of likely selectors used in different templates/navbars
  const selectors = [
    "#cart-count",               // original id
    ".cart-count",               // alternative class
    "#cartBtn .badge",           // badge inside cart button
    "#cartBtn span",             // sometimes a span
    ".nav-cart-badge",           // custom class
    ".header-cart-badge"         // another common name
  ];

  selectors.forEach((sel) => {
    const el = document.querySelector(sel);
    if (!el) return;
    // if element contains more content (icon + number), try to set text only
    if (el.tagName.toLowerCase() === "span" || el.tagName.toLowerCase() === "div" || el.tagName.toLowerCase() === "button") {
      el.textContent = String(count);
    } else {
      // fallback
      el.textContent = String(count);
    }
  });

  // as a last attempt: if cart button has aria-label or data-count attribute, update it
  const cartBtn = document.getElementById("cartBtn");
  if (cartBtn) {
    try {
      cartBtn.setAttribute("data-count", String(count));
      // optionally update aria label for accessibility
      const aria = `سبد خرید، ${count} مورد`;
      cartBtn.setAttribute("aria-label", aria);
    } catch {}
  }
}

/* Replace old saveCart with this robust version */
function saveCart(cart) {
  try {
    localStorage.setItem("cart", JSON.stringify(cart || []));
  } catch (err) {
    console.error("saveCart: localStorage set error", err);
  }

  // compute count
  const count = (cart || []).reduce((s, it) => s + safeParseInt(it.quantity, 0), 0);

  // update internal UI immediately (modal/items/etc.)
  updateCartUI(); // keeps modal list and totals in sync
  // update badges explicitly (covers multiple selectors/templates)
  updateAnyBadgeElements(count);

  // dispatch a custom event so any other script can react
  try {
    document.dispatchEvent(new CustomEvent("cart:updated", { detail: { count } }));
  } catch (err) {
    // older browsers fallback
    const ev = document.createEvent("CustomEvent");
    ev.initCustomEvent("cart:updated", true, true, { count });
    document.dispatchEvent(ev);
  }

  // write a timestamp (useful for other tabs / debugging)
  try {
    localStorage.setItem("cartLastUpdated", String(Date.now()));
  } catch {}
}

/* Listeners to ensure badges update even if nav/badge renders AFTER initial load */
function initCartUpdateListeners() {
  // 1) Listen to the custom event
  document.addEventListener("cart:updated", (e) => {
    const count = e?.detail?.count ?? getCartCount();
    updateAnyBadgeElements(count);
  });

  // 2) If some part of the header/nav is injected after load, observe DOM and patch when badge appears
  const bodyObserver = new MutationObserver((mutations, obs) => {
    const found = document.querySelector("#cart-count") ||
                  document.querySelector(".cart-count") ||
                  document.querySelector("#cartBtn .badge") ||
                  document.querySelector(".nav-cart-badge");
    if (found) {
      updateAnyBadgeElements(getCartCount());
      obs.disconnect(); // stop observing once we succeeded
    }
  });

  // Start observing - lightweight and will early-exit when it finds one of selectors
  try {
    bodyObserver.observe(document.body, { childList: true, subtree: true });
  } catch (err) {
    // in case document.body not ready (very rare), schedule small timeout
    setTimeout(() => {
      try {
        bodyObserver.observe(document.body, { childList: true, subtree: true });
      } catch {}
    }, 200);
  }

  // 3) Ensure update on window.load (if some templates load late)
  window.addEventListener("load", () => {
    updateAnyBadgeElements(getCartCount());
  });

  // 4) Optional: also run once immediately (in case badge is already present)
  updateAnyBadgeElements(getCartCount());
}

/* Make sure you call initCartUpdateListeners() in your DOMContentLoaded / init sequence:
   e.g. inside document.addEventListener("DOMContentLoaded", ...) { initCartUpdateListeners(); }
*/


function addToCart(product) {
  // product: { id (number), name (string), price (AFN number), image (string), quantity (number) }
  if (!product || !product.id) return;
  const cart = getCart();
  const existing = cart.find((it) => it.id === product.id);
  if (existing) {
    existing.quantity =
      safeParseInt(existing.quantity, 0) + safeParseInt(product.quantity, 1);
  } else {
    cart.push({
      id: product.id,
      name: product.name || "محصول",
      price: safeParseInt(product.price, 0),
      image: product.image || "",
      quantity: safeParseInt(product.quantity, 1),
    });
  }
  saveCart(cart);
}

/* Update cart counters and modal contents */
function updateCartUI() {
  const cart = getCart();
  const totalCount = cart.reduce(
    (s, it) => s + safeParseInt(it.quantity, 0),
    0
  );

  // update any elements with id or class "cart-count" (compatibility)
  const idBadge = document.getElementById("cart-count");
  if (idBadge) idBadge.textContent = totalCount;

  // also update elements with class .cart-count (if some pages use that)
  $$(".cart-count").forEach((el) => (el.textContent = totalCount));

  // If cart modal exists, re-render items & total
  const cartItemsContainer = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");
  if (cartItemsContainer) {
    if (cart.length === 0) {
      cartItemsContainer.innerHTML = "<p>سبد خرید خالی است.</p>";
      if (cartTotal) cartTotal.textContent = "0 افغانی";
    } else {
      cartItemsContainer.innerHTML = cart
        .map(
          (it) => `
          <div class="cart-item" data-id="${it.id}">
            <img src="${it.image}" alt="${it.name}" width="60" height="60" />
            <div class="cart-item-info">
              <div class="cart-item-name">${it.name}</div>
              <div class="cart-item-qty">تعداد: ${it.quantity}</div>
              <div class="cart-item-price">${numberToLocaleString(
                it.price
              )} افغانی / واحد</div>
            </div>
            <button class="remove-cart-item" data-id="${it.id}">حذف</button>
          </div>
        `
        )
        .join("");
      const total = cart.reduce((s, it) => s + it.price * it.quantity, 0);
      if (cartTotal)
        cartTotal.textContent = `${numberToLocaleString(total)} افغانی`;
    }
  }
}

/* Alias kept for compatibility */
function updateCartBadge() {
  updateCartUI();
  initCartUpdateListeners();
}

/* --------------------------
   Event handlers initialization
   -------------------------- */
function initActiveNavLink() {
  $$(".nav-link").forEach((link) => {
    try {
      if (link.href === window.location.href) link.classList.add("active");
    } catch {
      // ignore
    }
  });
}

function initMenuToggle() {
  const hamburger = $("#hamburger");
  const navLinks = $("#nav-links");
  const dropdown = document.querySelector(".dropdown");

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () =>
      navLinks.classList.toggle("show")
    );
  }

  if (dropdown) {
    dropdown.addEventListener("click", () => {
      if (window.innerWidth <= 768) dropdown.classList.toggle("show");
    });
  }
}

/* Toast helper (kept) */
function showToast(message, duration = 3000) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), duration);
}

/* Cart modal open/close and remove handling */
function initCartModal() {
  const cartBtn = document.getElementById("cartBtn");
  const cartModal = document.getElementById("cartModal");
  const closeModal = document.querySelector(".close-modal");

  if (cartBtn && cartModal) {
    cartBtn.addEventListener("click", () => {
      updateCartUI();
      initCartUpdateListeners();
      cartModal.style.display = "block";
    });
  }
  if (closeModal && cartModal) {
    closeModal.addEventListener(
      "click",
      () => (cartModal.style.display = "none")
    );
    window.addEventListener("click", (e) => {
      if (e.target === cartModal) cartModal.style.display = "none";
    });
  }

  // delegated remove handler
  document.addEventListener("click", (e) => {
    const rem = e.target.closest(".remove-cart-item");
    if (!rem) return;
    const id = safeParseInt(rem.dataset.id);
    if (!id) return;
    const newCart = getCart().filter((it) => it.id !== id);
    saveCart(newCart);
    showToast("محصول از سبد حذف شد.");
  });
}

/* Checkout button (kept behavior) */
function initCheckout() {
  const checkoutBtn = document.querySelector(".btn-checkout");
  if (!checkoutBtn) return;
  checkoutBtn.addEventListener("click", (e) => {
    const loggedIn = sessionStorage.getItem("loggedIn") === "true";
    if (!loggedIn) {
      e.preventDefault();
      sessionStorage.setItem("fromCheckout", "true");
      window.location.href = "auth.html";
    } else {
      window.location.href = "checkout.html";
    }
  });
}

/* Slider initialization (kept logic, fixed prev/next naming) */
function initSlider() {
  const slides = document.querySelectorAll(".slide");
  if (!slides || slides.length === 0) return;
  const prevBtn = document.querySelector(".prev");
  const nextBtn = document.querySelector(".next");
  const indicatorsContainer = document.querySelector(".indicators");
  if (!indicatorsContainer) return;

  let current = 0;
  let slideInterval;

  slides.forEach((_, i) => {
    const dot = document.createElement("span");
    if (i === 0) dot.classList.add("active");
    indicatorsContainer.appendChild(dot);
  });

  const dots = document.querySelectorAll(".indicators span");

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === index);
      if (dots[i]) dots[i].classList.toggle("active", i === index);
    });
    current = index;
  }

  function startInterval() {
    slideInterval = setInterval(() => {
      current = (current + 1) % slides.length;
      showSlide(current);
    }, 6000);
  }

  function resetInterval() {
    clearInterval(slideInterval);
    startInterval();
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      current = (current - 1 + slides.length) % slides.length;
      showSlide(current);
      resetInterval();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      current = (current + 1) % slides.length;
      showSlide(current);
      resetInterval();
    });
  }

  dots.forEach((dot, i) =>
    dot.addEventListener("click", () => {
      showSlide(i);
      resetInterval();
    })
  );

  startInterval();
}

/* Search logic (debounced) */
function initSearch() {
  const searchInput = document.querySelector(".nav-search");
  const resultsContainer = document.getElementById("searchResults");
  if (!searchInput || !resultsContainer) return;

  async function displayResults(items) {
    if (!items || items.length === 0) {
      resultsContainer.innerHTML = "<p>محصولی یافت نشد</p>";
      resultsContainer.style.display = "block";
      return;
    }
    resultsContainer.innerHTML = items
      .map((p) => {
        const afn = usdToAfn(p.price);
        return `
          <a href="product.html?id=${p.id}" class="search-item">
            <img src="${p.images[0]}" alt="${p.name}" />
            <div class="info">
              <h4>${p.shortName}</h4>
              <p class="brand">${p.brand}</p>
              <p class="price">${numberToLocaleString(afn)} افغانی</p>
            </div>
          </a>`;
      })
      .join("");
    resultsContainer.style.display = "block";
  }

  const handleInput = debounce(async (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) {
      resultsContainer.innerHTML = "";
      resultsContainer.style.display = "none";
      return;
    }
    const products = await loadProducts();
    const filtered = products.filter((p) => {
      const fields = [
        p.name,
        p.shortName,
        p.brand,
        p.category,
        p.shortDesc,
      ].filter(Boolean);
      return fields.some((f) => f.toLowerCase().includes(q));
    });
    await displayResults(filtered);
  }, 250);

  searchInput.addEventListener("input", handleInput);

  // hide when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search")) resultsContainer.style.display = "none";
  });
}

/* --------------------------
   Renderers for Featured & Special offers
   Ensure data-price attributes are AFN (numbers), not locale strings.
   -------------------------- */
async function renderFeaturedProducts() {
  const container = document.getElementById("ftr-product-container");
  if (!container) return;
  const products = await loadProducts();
  const bestSeller = products.filter((p) => p.bestSeller === true);

  container.innerHTML = bestSeller
    .map((p) => {
      const afn = usdToAfn(p.price);
      // data-price is AFN number
      return `
      <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-4 d-flex justify-content-center">
        <div class="card h-120 shadow-sm rounded-4 g-3 ftr-product-card" data-id="${
          p.id
        }" data-name="${p.shortName}" data-price="${afn}" data-image="${
        p.images[0]
      }" style="width: 19rem;">
          <img src="${p.images[0]}" class="card-img-top mx-auto mt-3" alt="${
        p.name
      }" style="width: 150px; height: 150px; object-fit: contain;">
          <div class="card-body text-center d-flex flex-column">
            <h5 class="card-title " title="${p.name}">${p.shortName}</h5>
            <p class="card-text text-success fw-bold">قیمت: ${numberToLocaleString(
              afn
            )} افغانی</p>
            <a href="product.html?id=${
              p.id
            }" class="CTA btn-outline-primary mb-2">مشاهده محصول</a>
            <button class="btn-success addToCart" data-id="${
              p.id
            }">افزودن به سبد خرید</button>
          </div>
        </div>
      </div>`;
    })
    .join("");
}

async function renderSpecialOffers() {
  const container = document.getElementById("special-offers-container-slider");
  if (!container) return;
  const products = await loadProducts();
  const specialOffer = products.filter((p) => p.specialOffer === true);
  const discount = 5;

  container.innerHTML = specialOffer
    .map((p) => {
      const originalAfn = usdToAfn(p.price);
      const discounted = Math.round((originalAfn * (100 - discount)) / 100);
      return `
      <div class="swiper-slide">
        <div class="special-offer-slide" data-id="${p.id}" data-name="${
        p.shortName
      }" data-price="${discounted}" data-image="${p.images[0]}">
          <span class="special-offer-badge">%${discount} تخفیف</span>
          <img src="${p.images[0]}" alt="${p.name}">
          <h3>${p.shortName}</h3>
          <p class="product-price">قیمت اصلی: ${numberToLocaleString(
            originalAfn
          )} افغانی</p>
          <p class="special-offer-price">قیمت با تخفیف: ${numberToLocaleString(
            discounted
          )} افغانی</p>
          <div class="buttons">
            <button class="CTA"><a href="product.html?id=${
              p.id
            }">مشاهده محصول</a></button>
            <button class="addToCart">افزودن به سبد خرید</button>
          </div>
        </div>
      </div>`;
    })
    .join("");

  // initialize swiper if available
  if (typeof Swiper !== "undefined") {
    // eslint-disable-next-line no-new
    new Swiper(".specialOffersSwiper", {
      slidesPerView: 4,
      spaceBetween: 20,
      loop: true,
      pagination: { el: ".swiper-pagination", clickable: true },
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      breakpoints: {
        320: { slidesPerView: 1 },
        576: { slidesPerView: 2 },
        992: { slidesPerView: 3 },
        1200: { slidesPerView: 4 },
      },
    });
  }
}

/* --------------------------
   Product page init (product.html)
   Renders details and ensures product-info has data-price in AFN
   -------------------------- */
async function initProductPage() {
  const productDetailEl = document.getElementById("productDetail");
  if (!productDetailEl) return;

  const urlParams = new URLSearchParams(window.location.search);
  const productId = safeParseInt(urlParams.get("id"));
  const similarProductsEl = document.getElementById("similiarProducts");
  const commentsEl = document.getElementById("comments");

  const products = await loadProducts();
  const product = products.find((p) => p.id === productId);

  if (!product) {
    productDetailEl.innerHTML = `<p>محصول یافت نشد.</p>`;
    return;
  }

  // images
  const imagesHtml = `
    <div class="main-image">
      <img id="mainProductImage" src="${product.images[0]}" alt="${
    product.name
  }">
    </div>
    <div class="image-gallery">
      ${product.images
        .map(
          (img, i) =>
            `<img src="${img}" class="${
              i === 0 ? "active" : ""
            }" alt="image-${i}">`
        )
        .join("")}
    </div>`;

  // specs (same as before, keep safe fallbacks)
  let specsHtml = "";
  if (product.category === "laptop") {
    specsHtml = `
      <div class="spec"><strong>حافظه:</strong> ${product.memory || ""}</div>
      <div class="spec"><strong>ذخیره‌سازی:</strong> ${
        product.storage || ""
      }</div>
      <div class="spec"><strong>پردازنده:</strong> ${
        product.processor || ""
      }</div>
      <div class="spec"><strong>نمایشگر:</strong> ${product.display || ""}</div>
      <div class="spec"><strong>گرافیک:</strong> ${product.graphics || ""}</div>
      <div class="spec"><strong>تاچ اسکرین:</strong> ${
        product.touchscreen ? "بله" : "خیر"
      }</div>`;
  } else if (product.category === "monitor") {
    specsHtml = `
      <div class="spec"><strong>سایز:</strong> ${product.size || ""}</div>
      <div class="spec"><strong>رزولوشن:</strong> ${
        product.resolution || ""
      }</div>
      <div class="spec"><strong>نرخ تازه‌سازی:</strong> ${
        product.refreshRate || ""
      }</div>
      <div class="spec"><strong>نوع پنل:</strong> ${
        product.panelType || ""
      }</div>
      <div class="spec"><strong>پورت‌ها:</strong> ${(product.ports || []).join(
        ", "
      )}</div>`;
  } else if (product.category === "audio") {
    specsHtml = `
      <div class="spec"><strong>اتصال:</strong> ${
        product.connectivity || ""
      }</div>
      <div class="spec"><strong>عمر باتری:</strong> ${
        product.batteryLife || ""
      }</div>`;
  } else if (product.category === "accessory") {
    specsHtml = `
      <div class="spec"><strong>نوع:</strong> ${product.type || ""}</div>
      <div class="spec"><strong>اتصال:</strong> ${
        product.connectivity || ""
      }</div>`;
  }

  specsHtml += `
    <div class="spec"><strong>رنگ:</strong> ${product.color || ""}</div>
    <div class="spec"><strong>برند:</strong> ${product.brand || ""}</div>
    <div class="spec"><strong>موجودی:</strong> ${product.stock || ""}</div>`;

  const discount = product.specialOffer ? 5 : 0;
  const originalAfn = usdToAfn(product.price);
  const finalAfn = product.specialOffer
    ? Math.round((originalAfn * (100 - discount)) / 100)
    : originalAfn;

  productDetailEl.innerHTML = `
    <div class="product-name">
      <h2>${product.shortName}</h2>
      <p class="short-desc">${product.name}</p>
    </div>
    <div class="product-images">${imagesHtml}</div> 
    <div class="product-info" data-id="${product.id}" data-name="${
    product.shortName
  }" data-price="${finalAfn}" data-image="${product.images[0]}">
      ${
        product.specialOffer
          ? `<p class="discount">٪${discount} تخفیف ویژه</p>
        <p class="price-dis">قیمت اصلی: ${numberToLocaleString(
          originalAfn
        )} افغانی</p>
        <p class="price">قیمت با تخفیف: ${numberToLocaleString(
          finalAfn
        )} افغانی</p>`
          : `<p class="price">قیمت: ${numberToLocaleString(
              finalAfn
            )} افغانی</p>`
      }
      <h3>مشخصات</h3>
      <div class="product-details">
        <p class="long-desc">${product.longDesc || ""}</p>
      </div>
      <div class="specs">${specsHtml}</div>
      <button class="addToCart">افزودن به سبد خرید</button>
    </div>`;

  // gallery interactions
  const mainImage = $("#mainProductImage");
  const galleryImages = productDetailEl.querySelectorAll(".image-gallery img");
  galleryImages.forEach((img) =>
    img.addEventListener("click", () => {
      if (mainImage) mainImage.src = img.src;
      galleryImages.forEach((i) => i.classList.remove("active"));
      img.classList.add("active");
    })
  );

  // reviews
  if (product.reviews?.length && commentsEl) {
    commentsEl.innerHTML = product.reviews
      .map((r) => {
        const stars =
          "★".repeat(Math.round(r.rating || 0)) +
          "☆".repeat(5 - Math.round(r.rating || 0));
        return `<div class="review"><div class="user">${r.user} - ${r.date}</div><div class="stars">${stars}</div><div class="comment">${r.comment}</div></div>`;
      })
      .join("");
  } else if (commentsEl) {
    commentsEl.innerHTML = "<p>هیچ نظری ثبت نشده است.</p>";
  }

  // related
  if (product.relatedProducts?.length && similarProductsEl) {
    const related = products.filter((p) =>
      product.relatedProducts.includes(p.id)
    );
    similarProductsEl.innerHTML = related
      .map(
        (p) =>
          `<div class="similar-product"><img src="${p.images[0]}" alt="${
            p.name
          }"><h4>${p.shortName}</h4><p>${numberToLocaleString(
            usdToAfn(p.price)
          )} افغانی</p><a href="product.html?id=${
            p.id
          }" class="CTA">مشاهده محصول</a></div>`
      )
      .join("");
  }
}

/* --------------------------
   Delegated handler for addToCart buttons (global)
   Works for featured, special offers, product page, etc.
   -------------------------- */
function initDelegatedAddToCart() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".addToCart");
    if (!btn) return;

    // find nearest card/container that has data-id/data-price
    const card =
      btn.closest("[data-id][data-price]") || // preferred: element with both
      btn.closest("[data-id]") ||
      btn.closest(".ftr-product-card") ||
      btn.closest(".special-offer-slide") ||
      document.querySelector(".product-info");

    if (!card) {
      showToast("خطا در افزودن محصول.");
      return;
    }

    const id = safeParseInt(card.dataset.id);
    if (!id) {
      showToast("شناسهٔ محصول معتبر نیست.");
      return;
    }

    // data-price is expected to be AFN (we ensured renderers set AFN)
    let priceAFN = safeParseInt(card.dataset.price, 0);

    // fallback: if data-price exists but is float (maybe USD formatted), try parseFloat then convert
    if (!priceAFN && card.dataset.price) {
      const floatVal = safeParseFloat(card.dataset.price, 0);
      if (floatVal > 0) {
        // assume original was USD -> convert
        priceAFN = usdToAfn(floatVal);
      }
    }

    // if still 0, attempt to read from product cache (safer)
    if (!priceAFN) {
      // look up in products cache for id
      const p = (productsCache || []).find((x) => x.id === id);
      if (p) priceAFN = usdToAfn(p.price);
    }

    const name =
      card.dataset.name ||
      btn.dataset.name ||
      card.querySelector(".card-title")?.textContent?.trim() ||
      "محصول";
    const image = card.dataset.image || card.querySelector("img")?.src || "";

    const product = {
      id,
      name,
      price: priceAFN,
      image,
      quantity: 1,
    };

    addToCart(product);

    // immediate UI feedback
    showToast("به سبد اضافه شد.");
    const originalText = btn.textContent;
    btn.textContent = "✅ اضافه شد!";
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = originalText;
      btn.disabled = false;
    }, 1200);
  });
}

/* --------------------------
   Logout handler
   -------------------------- */
function initLogout() {
  const logoutBtn = document.getElementById("logoutNav");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.removeItem("loggedIn");
      updateHeaderUser();
      showToast("شما خارج شدید.");
    });
  }
}

function updateHeaderUser() {
  const loggedIn = sessionStorage.getItem("loggedIn") === "true";
  const welcomeNav = document.getElementById("welcomeNav");
  const logoutNav = document.getElementById("logoutNav");
  const loginBtns = document.querySelectorAll(".btn-login");

  if (loggedIn) {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (welcomeNav) {
      welcomeNav.style.display = "inline-block";
      welcomeNav.textContent = `خوش آمدی، ${user.username || "کاربر"}!`;
    }
    if (logoutNav) logoutNav.style.display = "inline-block";
    loginBtns.forEach((b) => (b.style.display = "none"));
  } else {
    if (welcomeNav) welcomeNav.style.display = "none";
    if (logoutNav) logoutNav.style.display = "none";
    loginBtns.forEach((b) => (b.style.display = "inline-block"));
  }
}

/* --------------------------
   App init
   -------------------------- */
document.addEventListener("DOMContentLoaded", async () => {
  // Core UI initializations
  initActiveNavLink();
  initMenuToggle();
  initCartModal();
  initCheckout();
  initSlider();
  initSearch();
  initDelegatedAddToCart();
  initLogout();
  updateHeaderUser();

  // Render products & features (these will set data-price as AFN)
  await Promise.all([
    renderFeaturedProducts(),
    renderSpecialOffers(),
    loadProducts(),
  ]);

  // If on product page, initialize it (after products loaded)
  await initProductPage();

  // Ensure badge & UI in sync on first load
  updateCartUI();
  updateCartBadge();

  // Also update badge after window load just-in-case some nav renders later
  window.addEventListener("load", () => {
    updateCartUI();
    updateCartBadge();
  });
});

