/**
 * LA TABERNA DE HOMERO - CONTROLADOR DEL PANEL DE ADMINISTRACIÓN
 * Gestión reactiva para smartphones, tablets y escritorio
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- ELEMENTOS PRINCIPALES ---
  const loginSection = document.getElementById('adminLoginSection');
  const dashboardSection = document.getElementById('adminDashboardSection');
  const loginForm = document.getElementById('adminLoginForm');
  const passwordInput = document.getElementById('adminPasswordInput');
  const togglePassBtn = document.getElementById('togglePasswordBtn');
  const togglePassIcon = document.getElementById('togglePasswordIcon');
  const loginError = document.getElementById('adminLoginError');
  const logoutBtn = document.getElementById('adminLogoutBtn');

  // Tabs de Escritorio y Barra Móvil
  const desktopTabBtns = document.querySelectorAll('.admin-desktop-tabs .admin-tab-btn');
  const mobileDockBtns = document.querySelectorAll('.admin-mobile-dock .admin-dock-item');
  const tabPanes = {
    'inventory': document.getElementById('paneInventory'),
    'new-product': document.getElementById('paneNewProduct'),
    'upload': document.getElementById('paneUpload'),
    'backup': document.getElementById('paneBackup'),
    'security': document.getElementById('paneSecurity')
  };

  // Contenedor Toasts
  const toastContainer = document.getElementById('toastContainer');

  // Estado
  let currentActiveTab = 'inventory';
  let currentUploadedPhotoBase64 = null;
  let parsedImportCache = [];

  // --- INICIALIZACIÓN ---
  checkAuth();
  setupEventListeners();

  function checkAuth() {
    if (typeof TavernDB !== 'undefined' && TavernDB.isAdminLoggedIn()) {
      showDashboard();
    } else {
      showLogin();
    }
  }

  function showLogin() {
    if (loginSection) loginSection.style.display = 'flex';
    if (dashboardSection) dashboardSection.style.display = 'none';
    if (passwordInput) {
      passwordInput.value = '';
      setTimeout(() => passwordInput.focus(), 150);
    }
    if (loginError) loginError.style.display = 'none';
  }

  function showDashboard() {
    if (loginSection) loginSection.style.display = 'none';
    if (dashboardSection) dashboardSection.style.display = 'block';
    updateStats();
    renderInventory();
  }

  // --- GESTIÓN DE PESTAÑAS (Sincronizado entre escritorio y dock móvil) ---
  function switchTab(targetTab) {
    currentActiveTab = targetTab;

    // Actualizar botones de escritorio
    desktopTabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === targetTab);
    });

    // Actualizar barra dock de celular
    mobileDockBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === targetTab);
    });

    // Mostrar panel correspondiente
    Object.entries(tabPanes).forEach(([key, pane]) => {
      if (!pane) return;
      if (key === targetTab) {
        pane.style.display = 'block';
      } else {
        pane.style.display = 'none';
      }
    });

    if (targetTab === 'inventory') {
      renderInventory();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- ESTADÍSTICAS EN VIVO ---
  function updateStats() {
    if (typeof TavernDB === 'undefined') return;
    const prods = TavernDB.getProducts();

    const statTotal = document.getElementById('statTotalProds');
    const statCats = document.getElementById('statTotalCats');
    const statNoStock = document.getElementById('statOutOfStock');

    if (statTotal) statTotal.textContent = prods.length;
    if (statCats) {
      const uniqueCats = new Set(prods.map(p => p.category).filter(Boolean));
      statCats.textContent = uniqueCats.size;
    }
    if (statNoStock) {
      const outOfStockCount = prods.filter(p => !p.stock).length;
      statNoStock.textContent = outOfStockCount;
    }
  }

  // --- RENDERIZADO DEL INVENTARIO (Optimizado para Touch / Móvil) ---
  function renderInventory(filterQuery = '', filterCategory = 'all') {
    const listContainer = document.getElementById('adminInventoryList');
    if (!listContainer || typeof TavernDB === 'undefined') return;

    let items = TavernDB.getProducts();

    if (filterCategory !== 'all') {
      items = items.filter(p => p.category === filterCategory);
    }

    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase().trim();
      items = items.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.category && p.category.toLowerCase().includes(q))
      );
    }

    if (items.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem; color: #6B7280;">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
          <h4 style="margin: 0; color: #111827;">No se encontraron productos</h4>
          <p style="font-size: 0.85rem; margin: 0.25rem 0 1rem;">Intentá con otro término o agregá un nuevo producto.</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = items.map(p => `
      <div class="mobile-product-card" data-id="${p.id}">
        <img src="${escapeHtml(p.image)}" 
             alt="${escapeHtml(p.name)}" 
             class="mobile-product-thumb" 
             onerror="this.src='assets/logo-homero-pizza-transparent.png'">
        
        <div class="mobile-product-details">
          <h4 class="mobile-product-name">${escapeHtml(p.name)}</h4>
          <div class="mobile-product-meta">
            <span class="mobile-product-price">$ ${new Intl.NumberFormat('es-AR').format(p.price)}</span>
            <span class="mobile-product-cat">${escapeHtml(p.category)}</span>
            ${p.badge ? `<span style="font-size: 0.68rem; color: #D97706; font-weight: 700;">${escapeHtml(p.badge)}</span>` : ''}
          </div>
          <div style="margin-top: 0.35rem; display: flex; align-items: center; gap: 0.5rem;">
            <label style="font-size: 0.72rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.3rem; font-weight: 600; color: ${p.stock ? '#059669' : '#DC2626'};">
              <input type="checkbox" data-stock-toggle="${p.id}" ${p.stock ? 'checked' : ''} style="accent-color: #059669;">
              ${p.stock ? 'En Stock' : 'Agotado'}
            </label>
          </div>
        </div>

        <div class="mobile-product-actions">
          <button type="button" class="btn-mobile-delete" data-delete-id="${p.id}" title="Eliminar producto">
            <i class="bi bi-trash3-fill"></i>
          </button>
        </div>
      </div>
    `).join('');

    // Switch de Stock interactivo
    listContainer.querySelectorAll('[data-stock-toggle]').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const id = e.target.dataset.stockToggle;
        TavernDB.updateProduct(id, { stock: e.target.checked });
        showToast(`Stock actualizado para producto #${id}`);
        updateStats();
      });
    });

    // Botones de eliminación
    listContainer.querySelectorAll('[data-delete-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.deleteId;
        const prod = TavernDB.getProductById(id);
        const name = prod ? prod.name : `ID #${id}`;
        if (confirm(`¿Eliminar "${name}" del catálogo?`)) {
          TavernDB.deleteProduct(id);
          showToast(`🗑️ "${name}" eliminado.`);
          updateStats();
          renderInventory(filterQuery, filterCategory);
        }
      });
    });
  }

  // --- LISTENERS DE EVENTOS ---
  function setupEventListeners() {
    // 1. Login
    loginForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredPass = passwordInput.value;
      const res = TavernDB.loginAdmin(enteredPass);
      if (res.success) {
        showDashboard();
        showToast('👑 ¡Bienvenido al panel de administración!');
      } else {
        if (loginError) {
          loginError.style.display = 'flex';
          loginError.classList.remove('shake');
          void loginError.offsetWidth;
          loginError.classList.add('shake');
        }
        passwordInput.select();
      }
    });

    // 2. Toggle Ver Contraseña
    togglePassBtn?.addEventListener('click', () => {
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        togglePassIcon.className = 'bi bi-eye-slash';
      } else {
        passwordInput.type = 'password';
        togglePassIcon.className = 'bi bi-eye';
      }
    });

    // 3. Logout
    logoutBtn?.addEventListener('click', () => {
      TavernDB.logoutAdmin();
      showLogin();
      showToast('🔒 Sesión cerrada.');
    });

    // 4. Tabs
    desktopTabBtns.forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    mobileDockBtns.forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // 5. Buscador de Inventario
    const searchInput = document.getElementById('adminSearchInput');
    const categorySelect = document.getElementById('adminCategoryFilter');

    searchInput?.addEventListener('input', () => {
      renderInventory(searchInput.value, categorySelect ? categorySelect.value : 'all');
    });

    categorySelect?.addEventListener('change', () => {
      renderInventory(searchInput ? searchInput.value : '', categorySelect.value);
    });

    // 6. Restablecer valores de fábrica
    document.getElementById('adminResetDefaultsBtn')?.addEventListener('click', () => {
      if (confirm('¿Restablecer el catálogo a los 24 productos originales de la tienda? Se perderán las modificaciones no guardadas.')) {
        TavernDB.resetToDefaults();
        updateStats();
        renderInventory();
        showToast('🔄 Catálogo restablecido con éxito.');
      }
    });

    // 7. Carga de Foto con Cámara de Celular / Archivo
    const cameraInput = document.getElementById('mobileCameraInput');
    const urlInput = document.getElementById('adminProdUrlInput');
    const imgPreviewBox = document.getElementById('adminImagePreviewWrap');
    const imgPreviewEl = document.getElementById('adminImagePreview');
    const removeImgBtn = document.getElementById('adminRemoveImgBtn');

    cameraInput?.addEventListener('change', async () => {
      if (cameraInput.files && cameraInput.files[0]) {
        try {
          const compressed = await TavernDB.compressImageFile(cameraInput.files[0], 800, 0.8);
          currentUploadedPhotoBase64 = compressed;
          imgPreviewEl.src = compressed;
          imgPreviewBox.style.display = 'block';
          if (urlInput) urlInput.value = '';
          showToast('📸 Foto procesada y optimizada.');
        } catch (e) {
          showToast(`⚠️ Error al cargar imagen: ${e.message}`);
        }
      }
    });

    urlInput?.addEventListener('input', () => {
      const url = urlInput.value.trim();
      if (url.startsWith('http://') || url.startsWith('https://')) {
        currentUploadedPhotoBase64 = null;
        imgPreviewEl.src = url;
        imgPreviewBox.style.display = 'block';
      }
    });

    removeImgBtn?.addEventListener('click', () => {
      currentUploadedPhotoBase64 = null;
      if (cameraInput) cameraInput.value = '';
      if (urlInput) urlInput.value = '';
      imgPreviewBox.style.display = 'none';
    });

    // Categoría nueva
    const prodCategorySelect = document.getElementById('adminProdCategory');
    const customCategoryInput = document.getElementById('adminProdCategoryCustom');
    prodCategorySelect?.addEventListener('change', () => {
      if (prodCategorySelect.value === 'nueva') {
        customCategoryInput.style.display = 'block';
        customCategoryInput.focus();
      } else {
        customCategoryInput.style.display = 'none';
      }
    });

    // 8. Formulario Nuevo Producto
    const newProdForm = document.getElementById('adminNewProductForm');
    newProdForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('adminProdName').value.trim();
      const price = parseFloat(document.getElementById('adminProdPrice').value) || 0;
      let category = prodCategorySelect.value;
      if (category === 'nueva') {
        category = customCategoryInput.value.trim() || 'varios';
      }
      const badge = document.getElementById('adminProdBadge').value.trim();
      const desc = document.getElementById('adminProdDesc').value.trim();
      const details = document.getElementById('adminProdDetails').value.trim();
      const stock = document.getElementById('adminProdStock').checked;
      const image = currentUploadedPhotoBase64 || (urlInput ? urlInput.value.trim() : '') || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=600&auto=format&fit=crop&q=80';

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
        showToast(`✅ "${name}" agregado con éxito al catálogo.`);
        newProdForm.reset();
        currentUploadedPhotoBase64 = null;
        imgPreviewBox.style.display = 'none';
        customCategoryInput.style.display = 'none';
        updateStats();
        switchTab('inventory');
      } else {
        showToast(`❌ Error: ${res.error}`);
      }
    });

    // 9. Cargar Archivos (CSV / JSON)
    const fileInput = document.getElementById('adminFileInput');
    const dropzone = document.getElementById('adminDropzone');
    const previewCard = document.getElementById('adminPreviewCard');
    const previewSummary = document.getElementById('adminPreviewSummary');
    const previewTableBody = document.getElementById('adminPreviewTableBody');
    const cancelImportBtn = document.getElementById('adminCancelImportBtn');
    const confirmImportBtn = document.getElementById('adminConfirmImportBtn');

    dropzone?.addEventListener('click', () => fileInput?.click());

    fileInput?.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        processSelectedFile(fileInput.files[0]);
      }
    });

    function processSelectedFile(file) {
      if (!file) return;
      const isCSV = file.name.toLowerCase().endsWith('.csv');
      const isJSON = file.name.toLowerCase().endsWith('.json');

      if (!isCSV && !isJSON) {
        showToast('⚠️ Seleccioná un archivo .CSV o .JSON válido.');
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
            showToast('⚠️ No se detectaron productos en el archivo.');
            return;
          }

          parsedImportCache = parsed;
          previewSummary.textContent = `${file.name} (${parsed.length} productos detectados)`;

          previewTableBody.innerHTML = parsed.slice(0, 10).map(p => `
            <tr>
              <td><strong>${escapeHtml(p.name)}</strong></td>
              <td><span class="mobile-product-cat">${escapeHtml(p.category)}</span></td>
              <td>$ ${new Intl.NumberFormat('es-AR').format(p.price)}</td>
            </tr>
          `).join('');

          if (parsed.length > 10) {
            previewTableBody.innerHTML += `
              <tr>
                <td colspan="3" style="text-align: center; color: #6B7280; font-size: 0.78rem;">
                  ... y ${parsed.length - 10} productos más.
                </td>
              </tr>
            `;
          }

          previewCard.style.display = 'block';
          dropzone.style.display = 'none';
        } catch (err) {
          showToast(`❌ Error al procesar archivo: ${err.message}`);
        }
      };
      reader.readAsText(file, 'UTF-8');
    }

    cancelImportBtn?.addEventListener('click', () => {
      parsedImportCache = [];
      previewCard.style.display = 'none';
      dropzone.style.display = 'block';
      if (fileInput) fileInput.value = '';
    });

    confirmImportBtn?.addEventListener('click', () => {
      if (!parsedImportCache || parsedImportCache.length === 0) return;
      const mode = document.querySelector('input[name="adminImportMode"]:checked')?.value || 'append';
      const res = TavernDB.importProducts(parsedImportCache, mode);

      if (res.success) {
        showToast(`🎉 ¡${res.importedCount} productos importados con éxito!`);
        parsedImportCache = [];
        previewCard.style.display = 'none';
        dropzone.style.display = 'block';
        if (fileInput) fileInput.value = '';
        updateStats();
        switchTab('inventory');
      } else {
        showToast(`❌ Error: ${res.error}`);
      }
    });

    // Descarga de plantillas
    document.getElementById('adminDownloadCSVTemplateBtn')?.addEventListener('click', () => {
      TavernDB.downloadCSVTemplate();
    });
    document.getElementById('adminDownloadJSONTemplateBtn')?.addEventListener('click', () => {
      TavernDB.downloadJSONTemplate();
    });

    // 10. Respaldos
    document.getElementById('adminExportCSVBtn')?.addEventListener('click', () => {
      TavernDB.exportToCSV();
      showToast('📥 Descargando planilla CSV para Excel...');
    });
    document.getElementById('adminExportJSONBtn')?.addEventListener('click', () => {
      TavernDB.exportToJSON();
      showToast('📥 Descargando respaldo JSON...');
    });

    // 11. Seguridad / Cambio de Contraseña
    const changePassForm = document.getElementById('adminChangePassForm');
    const changePassError = document.getElementById('adminChangePassError');

    changePassForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const currentPass = document.getElementById('adminCurrentPassInput').value;
      const newPass = document.getElementById('adminNewPassInput').value;
      const confirmPass = document.getElementById('adminConfirmPassInput').value;

      if (!TavernDB.verifyAdminPassword(currentPass)) {
        changePassError.textContent = 'La contraseña actual ingresada es incorrecta.';
        changePassError.style.display = 'block';
        return;
      }

      if (newPass.length < 4) {
        changePassError.textContent = 'La nueva contraseña debe tener al menos 4 caracteres.';
        changePassError.style.display = 'block';
        return;
      }

      if (newPass !== confirmPass) {
        changePassError.textContent = 'Las nuevas contraseñas no coinciden.';
        changePassError.style.display = 'block';
        return;
      }

      const res = TavernDB.setAdminPassword(newPass);
      if (res.success) {
        changePassError.style.display = 'none';
        changePassForm.reset();
        showToast('🔑 ¡Contraseña de administrador actualizada con éxito!');
      } else {
        changePassError.textContent = res.error || 'Error al actualizar contraseña.';
        changePassError.style.display = 'block';
      }
    });

    // Sincronizar reactivamente si cambia la BD en otra pestaña
    window.addEventListener('taberna:db-updated', () => {
      updateStats();
      if (currentActiveTab === 'inventory') {
        renderInventory();
      }
    });
  }

  // Toasts
  function showToast(message) {
    if (!toastContainer) {
      alert(message);
      return;
    }
    const toast = document.createElement('div');
    toast.className = 'toast-bubble toast-slide-in';
    toast.innerHTML = `<span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-fade-out');
      setTimeout(() => toast.remove(), 350);
    }, 2800);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
