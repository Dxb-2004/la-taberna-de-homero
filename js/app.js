/**
 * LA TABERNA DE HOMERO - APLICACIÓN PRINCIPAL (Versión Profesional)
 * Gestión de catálogo, carrito, filtros reactivos y checkout a WhatsApp
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- ESTADO GLOBAL ---
  let cart = loadCart();
  let currentCategory = 'all';
  let searchQuery = '';
  let sortBy = 'default';
  const pickupAddress = 'Vicente López 139, Bahía Blanca';
  let currentQuoteIndex = 0;

  // --- ELEMENTOS DEL DOM ---
  const productsGrid = document.getElementById('productsGrid');
  const categoriesRow = document.getElementById('categoriesRow');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const sortSelect = document.getElementById('sortSelect');
  const resultsCount = document.getElementById('resultsCount');
  const currentSectionTitle = document.getElementById('currentSectionTitle');

  // Carrito
  const cartDrawerBackdrop = document.getElementById('cartDrawerBackdrop');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartBtnTrigger = document.getElementById('cartBtnTrigger');
  const mobileCartBtn = document.getElementById('mobileCartBtn');
  const cartCloseBtn = document.getElementById('cartCloseBtn');
  const cartItemsList = document.getElementById('cartItemsList');
  const cartEmptyView = document.getElementById('cartEmptyView');
  const checkoutFormSection = document.getElementById('checkoutFormSection');
  const cartFooter = document.getElementById('cartFooter');
  const cartCountBadges = document.querySelectorAll('.cart-count-badge');
  const cartTotalAmount = document.getElementById('cartTotalAmount');
  const whatsappCheckoutBtn = document.getElementById('whatsappCheckoutBtn');

  // Modal de Detalle
  const productModalBackdrop = document.getElementById('productModalBackdrop');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalImg = document.getElementById('modalImg');
  const modalBadge = document.getElementById('modalBadge');
  const modalTitle = document.getElementById('modalTitle');
  const modalPrice = document.getElementById('modalPrice');
  const modalDesc = document.getElementById('modalDesc');
  const modalDetailsList = document.getElementById('modalDetailsList');
  const modalAddToCartBtn = document.getElementById('modalAddToCartBtn');
  const modalShareBtn = document.getElementById('modalShareBtn');

  // Frase / Cita
  const homerQuoteText = document.getElementById('homerQuoteText');
  const refreshQuoteBtn = document.getElementById('refreshQuoteBtn');

  // Contenedor Toasts
  const toastContainer = document.getElementById('toastContainer');

  // Opciones de Pago
  const paymentSelect = document.getElementById('paymentMethod');
  const cashChangeGroup = document.getElementById('cashChangeGroup');

  // Sincronizar catálogo con TavernDB si está presente
  if (typeof TavernDB !== 'undefined') {
    PRODUCTS = TavernDB.getProducts();
    if (typeof getDynamicCategories === 'function') {
      CATEGORIES = getDynamicCategories();
    }
  }

  // --- INICIALIZACIÓN ---
  initCategories();
  renderProducts();
  updateCartUI();
  updateLiveStoreStatus();
  setupEventListeners();
  initDatabaseManager();

  // Escuchar actualizaciones reactivas de la Base de Datos
  window.addEventListener('taberna:db-updated', () => {
    PRODUCTS = typeof TavernDB !== 'undefined' ? TavernDB.getProducts() : [...DEFAULT_PRODUCTS];
    if (typeof getDynamicCategories === 'function') {
      CATEGORIES = getDynamicCategories();
    }
    initCategories();
    renderProducts();
    updateCartUI();
    renderDatabaseInventory();
  });

  // Actualizar estado de apertura cada minuto
  setInterval(updateLiveStoreStatus, 60000);

  // --- CÁLCULO DE HORARIO EN VIVO (Lunes a Sábado: 10:30-13:30 / 17:00-21:00) ---
  function updateLiveStoreStatus() {
    const statusTextEl = document.getElementById('statusText');
    const pulseEl = document.querySelector('.status-pulse');
    if (!statusTextEl || !pulseEl) return;

    const now = new Date();
    let day = now.getDay(); // 0: Dom, 1: Lun, 6: Sáb
    let hours = now.getHours();
    let minutes = now.getMinutes();

    try {
      const argDateStr = now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" });
      const argDate = new Date(argDateStr);
      day = argDate.getDay();
      hours = argDate.getHours();
      minutes = argDate.getMinutes();
    } catch(e) {}

    const timeVal = hours * 60 + minutes;
    const mStart = 10 * 60 + 30; // 10:30
    const mEnd = 13 * 60 + 30;   // 13:30
    const eStart = 17 * 60;      // 17:00
    const eEnd = 21 * 60;        // 21:00

    const isWorkingDay = day >= 1 && day <= 6; // Lunes a Sábado
    const isOpenNow = isWorkingDay && ((timeVal >= mStart && timeVal < mEnd) || (timeVal >= eStart && timeVal < eEnd));

    if (isOpenNow) {
      pulseEl.style.backgroundColor = 'var(--accent-green)';
      pulseEl.style.boxShadow = '0 0 6px var(--accent-green)';
      const closesAt = timeVal < mEnd ? '13:30' : '21:00';
      statusTextEl.innerHTML = `<strong>Abierto ahora</strong> (cierra ${closesAt} hs) • Lun a Sáb`;
    } else {
      pulseEl.style.backgroundColor = '#F59E0B';
      pulseEl.style.boxShadow = '0 0 6px #F59E0B';
      if (!isWorkingDay) {
        statusTextEl.innerHTML = `Domingo cerrado • Abre el Lunes 10:30 hs`;
      } else if (timeVal < mStart) {
        statusTextEl.innerHTML = `Abre hoy 10:30 hs • Lun a Sáb: 10:30-13:30 / 17:00-21:00`;
      } else if (timeVal >= mEnd && timeVal < eStart) {
        statusTextEl.innerHTML = `Turno tarde abre 17:00 hs (hasta 21:00 hs)`;
      } else {
        statusTextEl.innerHTML = `Cerrado por hoy • Abre mañana 10:30 hs`;
      }
    }
  }

  // --- FORMATEO DE MONEDA ---
  function formatMoney(amount) {
    return '$ ' + new Intl.NumberFormat('es-AR').format(amount);
  }

  // --- CATEGORÍAS ---
  function initCategories() {
    categoriesRow.innerHTML = '';
    if (typeof getDynamicCategories === 'function') {
      CATEGORIES = getDynamicCategories();
    }
    CATEGORIES.forEach(cat => {
      const count = cat.id === 'all' 
        ? PRODUCTS.length 
        : PRODUCTS.filter(p => p.category === cat.id).length;

      const btn = document.createElement('button');
      btn.className = `category-tab-btn ${cat.id === currentCategory ? 'active' : ''}`;
      btn.setAttribute('data-category', cat.id);
      btn.innerHTML = `
        <i class="bi ${cat.icon}"></i>
        <span>${cat.name}</span>
        <span class="tab-counter">${count}</span>
      `;

      btn.addEventListener('click', () => {
        document.querySelectorAll('.category-tab-btn').forEach(el => el.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = cat.id;
        currentSectionTitle.textContent = cat.id === 'all' ? 'Todos los Productos' : cat.name;
        renderProducts();
      });

      categoriesRow.appendChild(btn);
    });
  }

  // --- RENDERIZADO DEL CATÁLOGO ---
  function renderProducts() {
    // 1. Filtrar por Categoría
    let filtered = currentCategory === 'all' 
      ? [...PRODUCTS] 
      : PRODUCTS.filter(p => p.category === currentCategory);

    // 2. Filtrar por Búsqueda
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => {
        const inName = p.name.toLowerCase().includes(query);
        const inDesc = p.description.toLowerCase().includes(query);
        const inTags = p.tags && p.tags.some(t => t.toLowerCase().includes(query));
        return inName || inDesc || inTags;
      });
    }

    // 3. Ordenamiento
    if (sortBy === 'price-asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name-asc') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Actualizar indicador
    resultsCount.textContent = `${filtered.length} producto${filtered.length === 1 ? '' : 's'}`;

    // Vista vacía
    if (filtered.length === 0) {
      productsGrid.innerHTML = `
        <div class="catalog-empty-view">
          <div class="empty-icon-wrap">🔍</div>
          <h3 class="empty-title">No encontramos resultados</h3>
          <p class="empty-text">No hay coincidencias para "<strong>${escapeHtml(searchQuery)}</strong>". Probá buscando términos como "fernet", "nachos", "cerveza" o "quentos".</p>
          <button class="btn btn-primary btn-sm" id="resetFiltersBtn">
            <i class="bi bi-arrow-counterclockwise"></i> Ver todos los productos
          </button>
        </div>
      `;

      document.getElementById('resetFiltersBtn')?.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        currentCategory = 'all';
        initCategories();
        renderProducts();
      });
      return;
    }

    // Renderizar grilla
    productsGrid.innerHTML = filtered.map(prod => {
      const catObj = CATEGORIES.find(c => c.id === prod.category) || { name: prod.category };
      const inCartItem = cart.find(c => c.id === prod.id);
      const cartQty = inCartItem ? inCartItem.quantity : 0;

      return `
        <article class="product-card" data-id="${prod.id}">
          <div class="card-media">
            <span class="card-badge-tag">${catObj.name.replace(/^[^\s]+ /, '')}</span>
            ${prod.badge ? `<span class="card-promo-badge">${prod.badge}</span>` : ''}
            <img src="${prod.image}" alt="${escapeHtml(prod.name)}" loading="lazy">
          </div>
          <div class="card-content">
            <h3 class="card-title">${escapeHtml(prod.name)}</h3>
            <p class="card-description">${escapeHtml(prod.description)}</p>
            <div class="card-footer">
              <div class="price-container">
                <span class="price-sub">Precio</span>
                <span class="price-num">${formatMoney(prod.price)}</span>
              </div>
              <div class="card-cta-group">
                <button class="quick-view-btn" title="Ver detalles completos" data-action="view" data-id="${prod.id}">
                  <i class="bi bi-eye"></i>
                </button>
                <button class="add-cart-btn" data-action="add" data-id="${prod.id}">
                  <i class="bi bi-plus-lg"></i>
                  <span>${cartQty > 0 ? `Agregado (${cartQty})` : 'Agregar'}</span>
                </button>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  // --- CARRITO: GESTIÓN Y PERSISTENCIA ---
  function loadCart() {
    try {
      const stored = localStorage.getItem('homero_cart_pro');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem('homero_cart_pro', JSON.stringify(cart));
    } catch (e) {
      console.error('Error al guardar carrito:', e);
    }
  }

  function addToCart(productId, qty = 1) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const existingIndex = cart.findIndex(item => item.id === productId);
    if (existingIndex > -1) {
      cart[existingIndex].quantity += qty;
    } else {
      cart.push({
        id: product.id,
        quantity: qty
      });
    }

    saveCart();
    updateCartUI();
    renderProducts(); // actualiza el estado de los botones en las cards
    triggerCartBounce();
    showToast(`¡${product.name} agregado al pedido! 🍻`);
  }

  function updateQuantity(productId, delta) {
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex === -1) return;

    cart[itemIndex].quantity += delta;
    if (cart[itemIndex].quantity <= 0) {
      cart.splice(itemIndex, 1);
    }

    saveCart();
    updateCartUI();
    renderProducts();
  }

  function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
    renderProducts();
  }

  function getCartTotal() {
    return cart.reduce((sum, item) => {
      const prod = PRODUCTS.find(p => p.id === item.id);
      return sum + (prod ? prod.price * item.quantity : 0);
    }, 0);
  }

  function getCartCount() {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }

  function updateCartUI() {
    const totalCount = getCartCount();
    const totalPrice = getCartTotal();

    // Actualizar badges
    cartCountBadges.forEach(badge => {
      badge.textContent = totalCount;
      badge.style.display = totalCount > 0 ? 'flex' : 'none';
    });

    cartTotalAmount.textContent = formatMoney(totalPrice);

    // Carrito vacío
    if (cart.length === 0) {
      cartItemsList.style.display = 'none';
      checkoutFormSection.style.display = 'none';
      cartFooter.style.display = 'none';
      cartEmptyView.style.display = 'flex';
      return;
    }

    cartEmptyView.style.display = 'none';
    cartItemsList.style.display = 'flex';
    checkoutFormSection.style.display = 'block';
    cartFooter.style.display = 'flex';

    // Renderizar renglones del pedido
    cartItemsList.innerHTML = cart.map(item => {
      const prod = PRODUCTS.find(p => p.id === item.id);
      if (!prod) return '';
      const itemSubtotal = prod.price * item.quantity;
      return `
        <div class="cart-line-item" data-id="${prod.id}">
          <img src="${prod.image}" alt="${escapeHtml(prod.name)}" class="cart-thumb">
          <div class="cart-item-meta">
            <h4 class="cart-product-name">${escapeHtml(prod.name)}</h4>
            <div class="cart-product-price">${formatMoney(itemSubtotal)}</div>
          </div>
          <div class="cart-quantity-stepper">
            <button class="stepper-btn" data-action="step-minus" data-id="${prod.id}">−</button>
            <span class="stepper-value">${item.quantity}</span>
            <button class="stepper-btn" data-action="step-plus" data-id="${prod.id}">+</button>
          </div>
          <button class="item-delete-btn" data-action="remove" data-id="${prod.id}" title="Quitar">
            <i class="bi bi-trash3"></i>
          </button>
        </div>
      `;
    }).join('');
  }

  function triggerCartBounce() {
    cartBtnTrigger.classList.add('bounce');
    setTimeout(() => cartBtnTrigger.classList.remove('bounce'), 350);
  }

  // --- CONTROL DEL DRAWER ---
  function openCart() {
    cartDrawerBackdrop.classList.add('open');
    cartDrawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    cartDrawerBackdrop.classList.remove('open');
    cartDrawer.classList.remove('open');
    document.body.style.overflow = '';
  }

  // --- MODAL DE PRODUCTO ---
  function openProductModal(productId) {
    const prod = PRODUCTS.find(p => p.id === productId);
    if (!prod) return;

    modalImg.src = prod.image;
    modalImg.alt = prod.name;
    modalBadge.textContent = prod.badge || 'La Taberna de Homero';
    modalTitle.textContent = prod.name;
    modalPrice.textContent = formatMoney(prod.price);
    modalDesc.textContent = prod.description;

    modalDetailsList.innerHTML = (prod.details || []).map(d => `
      <li class="modal-feature-row">
        <i class="bi bi-check2-circle"></i>
        <span>${escapeHtml(d)}</span>
      </li>
    `).join('');

    modalAddToCartBtn.onclick = () => {
      addToCart(prod.id, 1);
      closeProductModal();
    };

    modalShareBtn.onclick = () => {
      if (navigator.share) {
        navigator.share({
          title: prod.name,
          text: `Mirá ${prod.name} en La Taberna de Homero (${formatMoney(prod.price)})`,
          url: window.location.href
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?producto=${prod.id}`);
        showToast('¡Enlace del producto copiado!');
      }
    };

    productModalBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeProductModal() {
    productModalBackdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  // --- CHECKOUT PROFESIONAL A WHATSAPP ---
  function processWhatsAppCheckout() {
    if (cart.length === 0) return;

    const customerName = document.getElementById('customerName').value.trim();
    const customerNotes = document.getElementById('customerNotes').value.trim();
    const paymentMethodValue = paymentSelect.value;
    const cashChangeValue = document.getElementById('cashChange').value.trim();

    if (!customerName) {
      alert('Por favor ingresá tu nombre para identificar el pedido.');
      document.getElementById('customerName').focus();
      return;
    }

    const orderId = 'TH-' + Math.floor(1000 + Math.random() * 9000);

    // Mensaje estructurado y profesional (Retiro en local)
    let msg = `🍺 *NUEVO PEDIDO #${orderId} - LA TABERNA DE HOMERO*\n`;
    msg += `─────────────────────────\n`;
    msg += `👤 *Cliente:* ${customerName}\n`;
    msg += `📍 *Modalidad:* Retiro en Mostrador / Local\n`;
    msg += `🏢 *Punto de Retiro:* Vicente López 139, Bahía Blanca\n`;
    msg += `💳 *Forma de Pago:* ${paymentMethodValue}\n`;
    if (paymentMethodValue === 'Efectivo' && cashChangeValue) {
      msg += `💵 *Abona con:* $ ${cashChangeValue} (solicita cambio)\n`;
    }

    if (customerNotes) {
      msg += `📝 *Observaciones:* ${customerNotes}\n`;
    }

    msg += `─────────────────────────\n`;
    msg += `🛒 *DETALLE DEL PEDIDO:*\n`;

    cart.forEach(item => {
      const prod = PRODUCTS.find(p => p.id === item.id);
      if (prod) {
        msg += `• ${item.quantity}x ${prod.name} ➔ ${formatMoney(prod.price * item.quantity)}\n`;
      }
    });

    const total = getCartTotal();
    msg += `─────────────────────────\n`;
    msg += `💰 *TOTAL A PAGAR: ${formatMoney(total)}*\n\n`;
    msg += `_Mensaje generado automáticamente desde la web oficial de La Taberna de Homero._`;

    // Confetti elegante
    if (window.confetti) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    }

    // Redirección a WhatsApp
    const encodedMsg = encodeURIComponent(msg);
    const waUrl = `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodedMsg}`;
    window.open(waUrl, '_blank');
  }

  // --- TOAST NOTIFICATIONS ---
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-pill';
    toast.innerHTML = `<i class="bi bi-check-circle-fill"></i> <span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 2900);
  }

  // --- ROTACIÓN DE CITA ---
  function nextHomerQuote() {
    currentQuoteIndex = (currentQuoteIndex + 1) % HOMER_QUOTES.length;
    homerQuoteText.textContent = HOMER_QUOTES[currentQuoteIndex];
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // Carrito
    cartBtnTrigger.addEventListener('click', openCart);
    mobileCartBtn.addEventListener('click', openCart);
    cartCloseBtn.addEventListener('click', closeCart);
    cartDrawerBackdrop.addEventListener('click', (e) => {
      if (e.target === cartDrawerBackdrop) closeCart();
    });

    // Clicks en grilla de productos
    productsGrid.addEventListener('click', (e) => {
      const addBtn = e.target.closest('[data-action="add"]');
      const viewBtn = e.target.closest('[data-action="view"]');

      if (addBtn) {
        const id = parseInt(addBtn.dataset.id, 10);
        addToCart(id, 1);
      } else if (viewBtn) {
        const id = parseInt(viewBtn.dataset.id, 10);
        openProductModal(id);
      }
    });

    // Clicks en Drawer de Carrito
    cartItemsList.addEventListener('click', (e) => {
      const stepPlus = e.target.closest('[data-action="step-plus"]');
      const stepMinus = e.target.closest('[data-action="step-minus"]');
      const removeBtn = e.target.closest('[data-action="remove"]');

      if (stepPlus) {
        const id = parseInt(stepPlus.dataset.id, 10);
        updateQuantity(id, 1);
      } else if (stepMinus) {
        const id = parseInt(stepMinus.dataset.id, 10);
        updateQuantity(id, -1);
      } else if (removeBtn) {
        const id = parseInt(removeBtn.dataset.id, 10);
        removeFromCart(id);
      }
    });

    // Búsqueda en tiempo real
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      clearSearchBtn.style.display = searchQuery.length > 0 ? 'block' : 'none';
      renderProducts();
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.style.display = 'none';
      searchInput.focus();
      renderProducts();
    });

    // Ordenamiento
    sortSelect.addEventListener('change', (e) => {
      sortBy = e.target.value;
      renderProducts();
    });

    // Modal
    modalCloseBtn.addEventListener('click', closeProductModal);
    productModalBackdrop.addEventListener('click', (e) => {
      if (e.target === productModalBackdrop) closeProductModal();
    });

    // Método de pago
    paymentSelect.addEventListener('change', (e) => {
      if (e.target.value === 'Efectivo') {
        cashChangeGroup.style.display = 'block';
      } else {
        cashChangeGroup.style.display = 'none';
      }
    });

    // Botón de WhatsApp
    whatsappCheckoutBtn.addEventListener('click', processWhatsAppCheckout);

    // Cita
    refreshQuoteBtn.addEventListener('click', nextHomerQuote);

    // Pin Interactivo Móvil (Draggable & Bounce)
    setupDraggablePin();

    // Toggle Vista de Mapa Interactivo en Sede
    const toggleLiveMapBtn = document.getElementById('toggleLiveMapBtn');
    const closeLiveMapBtn = document.getElementById('closeLiveMapBtn');
    const mapStylizedView = document.getElementById('mapStylizedView');
    const mapIframeView = document.getElementById('mapIframeView');

    if (toggleLiveMapBtn && mapIframeView && mapStylizedView) {
      toggleLiveMapBtn.addEventListener('click', () => {
        mapStylizedView.style.display = 'none';
        mapIframeView.style.display = 'block';
      });
    }

    if (closeLiveMapBtn && mapIframeView && mapStylizedView) {
      closeLiveMapBtn.addEventListener('click', () => {
        mapIframeView.style.display = 'none';
        mapStylizedView.style.display = 'flex';
      });
    }

    // Escape y Atajos
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeCart();
        closeProductModal();
        document.getElementById('databaseModalBackdrop')?.classList.remove('active');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        document.getElementById('openDbBtn')?.click();
      }
    });

    // Abrir producto si viene en query string
    const urlParams = new URLSearchParams(window.location.search);
    const prodParam = urlParams.get('producto');
    if (prodParam) {
      const id = parseInt(prodParam, 10);
      if (id) setTimeout(() => openProductModal(id), 400);
    }
  }

  // --- CONTROL DEL PIN INTERACTIVO MÓVIL (Arrastrable & Físicas) ---
  function setupDraggablePin() {
    const pinWrapper = document.getElementById('draggablePinWrapper');
    const marker = document.getElementById('draggableMarkerPin');
    if (!pinWrapper || !marker) return;

    let isDragging = false;
    let startX = 0, startY = 0;
    let currentX = 0, currentY = 0;
    let hasMoved = false;

    function getCoords(e) {
      if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      return { x: e.clientX, y: e.clientY };
    }

    function onPointerDown(e) {
      isDragging = true;
      hasMoved = false;
      marker.classList.add('dragging');
      pinWrapper.classList.add('is-active');

      const coords = getCoords(e);
      startX = coords.x - currentX;
      startY = coords.y - currentY;
      marker.style.transition = 'none';
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      const coords = getCoords(e);
      const deltaX = coords.x - startX;
      const deltaY = coords.y - startY;

      if (Math.hypot(deltaX - currentX, deltaY - currentY) > 2) {
        hasMoved = true;
      }

      // Límites de arrastre elásticos dentro del contenedor
      const boundLimit = 110;
      currentX = Math.max(-boundLimit, Math.min(boundLimit, deltaX));
      currentY = Math.max(-boundLimit, Math.min(boundLimit, deltaY));

      const tilt = currentX * 0.18;
      marker.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${tilt}deg) scale(1.18)`;

      if (e.cancelable) e.preventDefault();
    }

    function onPointerUp() {
      if (!isDragging) return;
      isDragging = false;
      marker.classList.remove('dragging');
      pinWrapper.classList.remove('is-active');

      // Rebote elástico de regreso al origen
      marker.style.transition = 'transform 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.35)';
      marker.style.transform = 'translate(0px, 0px) rotate(0deg) scale(1)';
      currentX = 0;
      currentY = 0;

      setTimeout(() => {
        if (!isDragging) {
          marker.style.transition = '';
          marker.style.transform = '';
        }
      }, 560);
    }

    marker.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    marker.addEventListener('touchstart', onPointerDown, { passive: false });
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);

    // Click / Tap lúdico si no se arrastró
    marker.addEventListener('click', () => {
      if (!hasMoved) {
        marker.classList.add('pin-hop');
        setTimeout(() => marker.classList.remove('pin-hop'), 650);
      }
    });
  }

  // --- GESTOR DE BASE DE DATOS Y CARGA DE ARCHIVOS ---
  let parsedImportCache = [];
  let currentUploadedPhotoDataUrl = null;

  function initDatabaseManager() {
    const dbModal = document.getElementById('databaseModalBackdrop');
    const openDbBtn = document.getElementById('openDbBtn');
    const openDbCatalogBtn = document.getElementById('openDbCatalogBtn');
    const dbModalCloseBtn = document.getElementById('dbModalCloseBtn');
    if (!dbModal) return;

    // Abrir modal
    function openDbModal(tabName = 'upload') {
      dbModal.classList.add('active');
      dbModal.setAttribute('aria-hidden', 'false');
      switchDbTab(tabName);
    }

    // Cerrar modal
    function closeDbModal() {
      dbModal.classList.remove('active');
      dbModal.setAttribute('aria-hidden', 'true');
    }

    openDbBtn?.addEventListener('click', () => openDbModal('upload'));
    openDbCatalogBtn?.addEventListener('click', () => openDbModal('upload'));
    dbModalCloseBtn?.addEventListener('click', closeDbModal);
    dbModal.addEventListener('click', (e) => {
      if (e.target === dbModal) closeDbModal();
    });

    // Pestañas
    const tabBtns = dbModal.querySelectorAll('.db-tab-btn');
    const tabPanes = {
      'upload': document.getElementById('dbTabUpload'),
      'new-product': document.getElementById('dbTabNewProduct'),
      'inventory': document.getElementById('dbTabInventory'),
      'backup': document.getElementById('dbTabBackup')
    };

    function switchDbTab(targetTab) {
      tabBtns.forEach(btn => {
        if (btn.dataset.dbtab === targetTab) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      Object.entries(tabPanes).forEach(([key, pane]) => {
        if (!pane) return;
        if (key === targetTab) {
          pane.classList.add('active');
        } else {
          pane.classList.remove('active');
        }
      });

      if (targetTab === 'inventory') {
        renderDatabaseInventory();
      }
    }

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => switchDbTab(btn.dataset.dbtab));
    });

    // Pestaña 1: Carga de Archivo (Drag & Drop + Explorar)
    const dropzone = document.getElementById('dbDropzone');
    const fileInput = document.getElementById('dbFileInput');
    const browseBtn = document.getElementById('dbBrowseFilesBtn');
    const previewCard = document.getElementById('dbPreviewCard');
    const previewFilename = document.getElementById('dbPreviewFilename');
    const previewCount = document.getElementById('dbPreviewCount');
    const previewTableBody = document.getElementById('dbPreviewTableBody');
    const cancelPreviewBtn = document.getElementById('dbCancelPreviewBtn');
    const confirmImportBtn = document.getElementById('dbConfirmImportBtn');

    browseBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput?.click();
    });

    dropzone?.addEventListener('click', () => {
      fileInput?.click();
    });

    ['dragenter', 'dragover'].forEach(evt => {
      dropzone?.addEventListener(evt, (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(evt => {
      dropzone?.addEventListener(evt, (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone?.addEventListener('drop', (e) => {
      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        handleSelectedFile(e.dataTransfer.files[0]);
      }
    });

    fileInput?.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length > 0) {
        handleSelectedFile(fileInput.files[0]);
      }
    });

    function handleSelectedFile(file) {
      if (!file) return;
      const fileName = file.name.toLowerCase();
      const isCSV = fileName.endsWith('.csv') || file.type.includes('csv');
      const isJSON = fileName.endsWith('.json') || file.type.includes('json');

      if (!isCSV && !isJSON) {
        showToast('⚠️ Por favor seleccioná un archivo .CSV o .JSON válido.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          let parsed = [];
          if (isCSV) {
            parsed = TavernDB.parseCSV(content);
          } else {
            parsed = TavernDB.parseJSON(content);
          }

          if (parsed.length === 0) {
            showToast('⚠️ No se detectaron productos válidos en el archivo.');
            return;
          }

          parsedImportCache = parsed;
          previewFilename.textContent = file.name;
          previewCount.textContent = `${parsed.length} producto${parsed.length === 1 ? '' : 's'} detectado${parsed.length === 1 ? '' : 's'}`;

          // Renderizar hasta 12 filas de preview
          previewTableBody.innerHTML = parsed.slice(0, 12).map(p => `
            <tr>
              <td><strong>${escapeHtml(p.name)}</strong></td>
              <td><span class="badge badge-gold-outline" style="font-size: 0.72rem;">${escapeHtml(p.category)}</span></td>
              <td><strong>${formatMoney(p.price)}</strong></td>
              <td>${p.badge ? `<span style="font-size: 0.75rem;">${escapeHtml(p.badge)}</span>` : '<span style="color: #94A3B8;">-</span>'}</td>
              <td style="font-size: 0.75rem; color: var(--text-secondary);">${p.details ? escapeHtml(p.details.slice(0, 2).join(' • ')) : '-'}</td>
            </tr>
          `).join('');

          if (parsed.length > 12) {
            previewTableBody.innerHTML += `
              <tr>
                <td colspan="5" style="text-align: center; color: var(--text-secondary); font-style: italic;">
                  ... y ${parsed.length - 12} productos más en este archivo.
                </td>
              </tr>
            `;
          }

          previewCard.style.display = 'block';
          dropzone.style.display = 'none';
        } catch (err) {
          console.error(err);
          showToast(`❌ Error al leer archivo: ${err.message}`);
        }
      };
      reader.readAsText(file, 'UTF-8');
    }

    cancelPreviewBtn?.addEventListener('click', () => {
      parsedImportCache = [];
      previewCard.style.display = 'none';
      dropzone.style.display = 'block';
      if (fileInput) fileInput.value = '';
    });

    confirmImportBtn?.addEventListener('click', () => {
      if (!parsedImportCache || parsedImportCache.length === 0) return;

      const modeInput = document.querySelector('input[name="dbImportMode"]:checked');
      const mode = modeInput ? modeInput.value : 'append';

      const res = TavernDB.importProducts(parsedImportCache, mode);
      if (res.success) {
        showToast(`🎉 ¡${res.importedCount} productos importados con éxito a la base de datos!`);
        parsedImportCache = [];
        previewCard.style.display = 'none';
        dropzone.style.display = 'block';
        if (fileInput) fileInput.value = '';
        switchDbTab('inventory');
      } else {
        showToast(`❌ Error al importar: ${res.error}`);
      }
    });

    // Descarga de plantillas
    document.getElementById('dbDownloadCSVTemplateBtn')?.addEventListener('click', () => {
      TavernDB.downloadCSVTemplate();
    });
    document.getElementById('dbDownloadJSONTemplateBtn')?.addEventListener('click', () => {
      TavernDB.downloadJSONTemplate();
    });

    // Pestaña 2: Nuevo Producto (Formulario Manual)
    const newProdForm = document.getElementById('dbNewProductForm');
    const prodCategorySelect = document.getElementById('dbProdCategory');
    const prodCategoryCustom = document.getElementById('dbProdCategoryCustom');
    const prodImageFileInput = document.getElementById('dbProdImageFile');
    const prodImageUrlInput = document.getElementById('dbProdImageUrl');
    const imagePreviewWrap = document.getElementById('dbImagePreviewWrap');
    const imagePreviewEl = document.getElementById('dbImagePreview');
    const removeImageBtn = document.getElementById('dbRemoveImageBtn');

    prodCategorySelect?.addEventListener('change', () => {
      if (prodCategorySelect.value === 'nueva') {
        prodCategoryCustom.style.display = 'block';
        prodCategoryCustom.focus();
      } else {
        prodCategoryCustom.style.display = 'none';
      }
    });

    prodImageFileInput?.addEventListener('change', async () => {
      if (prodImageFileInput.files && prodImageFileInput.files[0]) {
        try {
          const compressed = await TavernDB.compressImageFile(prodImageFileInput.files[0], 800, 0.8);
          currentUploadedPhotoDataUrl = compressed;
          imagePreviewEl.src = compressed;
          imagePreviewWrap.style.display = 'inline-block';
          if (prodImageUrlInput) prodImageUrlInput.value = '';
        } catch (e) {
          showToast(`⚠️ ${e.message}`);
        }
      }
    });

    prodImageUrlInput?.addEventListener('input', () => {
      const url = prodImageUrlInput.value.trim();
      if (url.startsWith('http://') || url.startsWith('https://')) {
        currentUploadedPhotoDataUrl = null;
        imagePreviewEl.src = url;
        imagePreviewWrap.style.display = 'inline-block';
      }
    });

    removeImageBtn?.addEventListener('click', () => {
      currentUploadedPhotoDataUrl = null;
      if (prodImageFileInput) prodImageFileInput.value = '';
      if (prodImageUrlInput) prodImageUrlInput.value = '';
      imagePreviewWrap.style.display = 'none';
    });

    newProdForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('dbProdName').value.trim();
      const price = parseFloat(document.getElementById('dbProdPrice').value) || 0;
      let category = prodCategorySelect.value;
      if (category === 'nueva') {
        category = prodCategoryCustom.value.trim() || 'varios';
      }
      const badge = document.getElementById('dbProdBadge').value.trim();
      const desc = document.getElementById('dbProdDesc').value.trim();
      const details = document.getElementById('dbProdDetails').value.trim();
      const stock = document.getElementById('dbProdStock').checked;
      const image = currentUploadedPhotoDataUrl || prodImageUrlInput.value.trim() || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=600&auto=format&fit=crop&q=80';

      const res = TavernDB.addProduct({
        name,
        price,
        category,
        badge,
        description: desc,
        details,
        stock,
        image
      });

      if (res.success) {
        showToast(`✅ Producto "${name}" guardado en la base de datos.`);
        newProdForm.reset();
        currentUploadedPhotoDataUrl = null;
        imagePreviewWrap.style.display = 'none';
        prodCategoryCustom.style.display = 'none';
        switchDbTab('inventory');
      } else {
        showToast(`❌ Error: ${res.error}`);
      }
    });

    // Pestaña 3: Inventario & Reset
    const invSearchInput = document.getElementById('dbInvSearchInput');
    invSearchInput?.addEventListener('input', () => {
      renderDatabaseInventory(invSearchInput.value.toLowerCase().trim());
    });

    document.getElementById('dbResetDefaultsBtn')?.addEventListener('click', () => {
      const confirmReset = window.confirm('¿Seguro que querés restablecer la base de datos a los 24 productos oficiales de la taberna? Se perderán las modificaciones no respaldadas.');
      if (confirmReset) {
        TavernDB.resetToDefaults();
        showToast('🔄 Base de datos restablecida a valores oficiales.');
        renderDatabaseInventory();
      }
    });

    // Pestaña 4: Copias de Seguridad
    document.getElementById('dbExportCSVBtn')?.addEventListener('click', () => {
      TavernDB.exportToCSV();
      showToast('📥 Exportando catálogo en CSV compatible con Excel...');
    });

    document.getElementById('dbExportJSONBtn')?.addEventListener('click', () => {
      TavernDB.exportToJSON();
      showToast('📥 Descargando copia de seguridad JSON...');
    });
  }

  // Renderizar la tabla de inventario en el modal
  function renderDatabaseInventory(filterQuery = '') {
    const tableBody = document.getElementById('dbInventoryTableBody');
    const badgeCount = document.getElementById('dbInventoryBadge');
    if (!tableBody) return;

    const allProducts = typeof TavernDB !== 'undefined' ? TavernDB.getProducts() : PRODUCTS;
    if (badgeCount) badgeCount.textContent = allProducts.length;

    let items = [...allProducts];
    if (filterQuery) {
      items = items.filter(p => 
        p.name.toLowerCase().includes(filterQuery) || 
        (p.category && p.category.toLowerCase().includes(filterQuery))
      );
    }

    if (items.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
            No se encontraron productos en el inventario.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = items.map(p => `
      <tr>
        <td>
          <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" class="db-table-thumb" onerror="this.src='assets/logo-homero-pizza-transparent.png'">
        </td>
        <td style="font-family: monospace; font-size: 0.78rem; color: var(--text-muted);">#${p.id}</td>
        <td>
          <strong>${escapeHtml(p.name)}</strong>
          ${p.badge ? `<br><small style="color: var(--accent-gold); font-weight: 600;">${escapeHtml(p.badge)}</small>` : ''}
        </td>
        <td><span class="badge badge-gold-outline" style="font-size: 0.72rem;">${escapeHtml(p.category)}</span></td>
        <td><strong>${formatMoney(p.price)}</strong></td>
        <td>
          <span style="font-size: 0.75rem; font-weight: 700; color: ${p.stock ? 'var(--accent-green)' : '#EF4444'};">
            ${p.stock ? '● En Stock' : '○ Sin Stock'}
          </span>
        </td>
        <td style="text-align: right;">
          <button type="button" class="btn-icon-danger" data-db-delete="${p.id}" title="Eliminar de la base de datos">
            <i class="bi bi-trash3-fill"></i>
          </button>
        </td>
      </tr>
    `).join('');

    // Eventos de borrado
    tableBody.querySelectorAll('[data-db-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-db-delete');
        const prod = TavernDB.getProductById(id);
        const name = prod ? prod.name : `ID #${id}`;
        if (window.confirm(`¿Seguro que querés eliminar "${name}" de la base de datos?`)) {
          TavernDB.deleteProduct(id);
          showToast(`🗑️ "${name}" eliminado de la base de datos.`);
          renderDatabaseInventory(filterQuery);
        }
      });
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
