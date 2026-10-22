/**
 * LA TABERNA DE HOMERO - SISTEMA DE BASE DE DATOS Y GESTIÓN DE ARCHIVOS
 * Motor de persistencia en localStorage con soporte para:
 * - Carga e importación de archivos CSV y JSON
 * - Carga de fotos locales con compresión automática en cliente (Base64 WebP/JPEG)
 * - Alta, baja y modificación de productos
 * - Exportación de copias de seguridad (CSV compatible con Excel y JSON)
 * - Sincronización reactiva con el catálogo y carrito
 */

const TavernDB = (() => {
  const STORAGE_KEY = 'taberna_homero_products_db_v1';
  let memoryProducts = [];

  // Helper para obtener productos por defecto de forma segura
  function getDefaultList() {
    if (typeof DEFAULT_PRODUCTS !== 'undefined' && Array.isArray(DEFAULT_PRODUCTS)) {
      return [...DEFAULT_PRODUCTS];
    }
    return [];
  }

  // --- INICIALIZACIÓN ---
  function init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryProducts = parsed;
        } else {
          memoryProducts = getDefaultList();
          saveToStorage(memoryProducts, false);
        }
      } else {
        memoryProducts = getDefaultList();
        saveToStorage(memoryProducts, false);
      }
    } catch (e) {
      console.warn('Error accediendo a localStorage, usando catálogo por defecto:', e);
      memoryProducts = getDefaultList();
    }

    syncGlobalProducts();
  }

  // Sincroniza la variable global PRODUCTS y dispara evento reactivo
  function syncGlobalProducts(dispatch = false) {
    if (typeof PRODUCTS !== 'undefined') {
      PRODUCTS = [...memoryProducts];
    }
    if (typeof CATEGORIES !== 'undefined' && typeof getDynamicCategories === 'function') {
      CATEGORIES = getDynamicCategories();
    }
    if (dispatch) {
      window.dispatchEvent(new CustomEvent('taberna:db-updated', {
        detail: { products: memoryProducts, count: memoryProducts.length }
      }));
    }
  }

  // Guardar en localStorage
  function saveToStorage(list, notify = true) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      memoryProducts = [...list];
      syncGlobalProducts(notify);
      return { success: true };
    } catch (e) {
      console.error('Error guardando en base de datos:', e);
      // En caso de cuota excedida por imágenes muy grandes
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        return { 
          success: false, 
          error: 'La base de datos del navegador superó el límite de almacenamiento. Intentá usar imágenes más livianas o URLs directas.' 
        };
      }
      return { success: false, error: e.message || 'Error al guardar.' };
    }
  }

  // --- CONSULTAS Y CRUD ---
  function getProducts() {
    if (!memoryProducts || memoryProducts.length === 0) {
      init();
    }
    return [...memoryProducts];
  }

  function getProductById(id) {
    return memoryProducts.find(p => String(p.id) === String(id));
  }

  function addProduct(data) {
    const list = [...memoryProducts];
    const newId = data.id 
      ? Number(data.id) 
      : (list.length > 0 ? Math.max(...list.map(p => Number(p.id) || 0)) + 1 : 1);

    const newProduct = {
      id: newId,
      name: (data.name || 'Producto Sin Nombre').trim(),
      category: (data.category || 'varios').toLowerCase().trim(),
      price: Math.max(0, Number(data.price) || 0),
      badge: (data.badge || '').trim(),
      image: (data.image || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=600&auto=format&fit=crop&q=80').trim(),
      description: (data.description || 'Producto disponible en La Taberna de Homero.').trim(),
      details: Array.isArray(data.details) 
        ? data.details 
        : (data.details ? String(data.details).split('|').map(s => s.trim()).filter(Boolean) : ['Disponible para retiro en el local']),
      stock: data.stock !== undefined ? Boolean(data.stock) : true,
      tags: Array.isArray(data.tags)
        ? data.tags
        : (data.tags ? String(data.tags).split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : [])
    };

    list.unshift(newProduct);
    const res = saveToStorage(list, true);
    return { ...res, product: newProduct };
  }

  function updateProduct(id, updatedData) {
    const list = [...memoryProducts];
    const idx = list.findIndex(p => String(p.id) === String(id));
    if (idx === -1) return { success: false, error: 'Producto no encontrado' };

    list[idx] = {
      ...list[idx],
      ...updatedData,
      id: Number(id),
      price: Math.max(0, Number(updatedData.price ?? list[idx].price)),
      details: Array.isArray(updatedData.details) 
        ? updatedData.details 
        : (typeof updatedData.details === 'string' ? updatedData.details.split('|').map(s => s.trim()).filter(Boolean) : list[idx].details)
    };

    return saveToStorage(list, true);
  }

  function deleteProduct(id) {
    const list = memoryProducts.filter(p => String(p.id) !== String(id));
    return saveToStorage(list, true);
  }

  function resetToDefaults() {
    const defaults = getDefaultList();
    return saveToStorage(defaults, true);
  }

  function clearAll() {
    return saveToStorage([], true);
  }

  // --- PARSERS DE ARCHIVOS ---

  /**
   * Parser robusto de CSV (soporta comas, punto y coma, tabs y valores entre comillas)
   */
  function parseCSV(text) {
    if (!text || typeof text !== 'string') return [];

    // Limpiar BOM UTF-8 si viene de Excel
    let cleanText = text.replace(/^\uFEFF/, '').trim();
    if (!cleanText) return [];

    const lines = cleanText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    // Detectar delimitador (coma, punto y coma o tab)
    const firstLine = lines[0];
    let delimiter = ',';
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;

    if (semicolonCount > commaCount && semicolonCount >= tabCount) {
      delimiter = ';';
    } else if (tabCount > commaCount && tabCount > semicolonCount) {
      delimiter = '\t';
    }

    // Helper para separar respetando comillas
    function splitCSVLine(line, delim) {
      const result = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            current += '"';
            i++; // saltar comilla escapada
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === delim && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    }

    const headers = splitCSVLine(lines[0], delimiter).map(h => 
      h.toLowerCase()
       .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remover acentos
       .replace(/[^a-z0-9]/g, '')
    );

    // Mapeo inteligente de encabezados
    const colMap = {
      name: headers.findIndex(h => ['nombre', 'name', 'producto', 'titulo', 'item'].includes(h)),
      price: headers.findIndex(h => ['precio', 'price', 'valor', 'costo', 'importe'].includes(h)),
      category: headers.findIndex(h => ['categoria', 'category', 'rubro', 'seccion', 'tipo'].includes(h)),
      badge: headers.findIndex(h => ['etiqueta', 'badge', 'destacado', 'subtitulo'].includes(h)),
      image: headers.findIndex(h => ['imagen', 'image', 'foto', 'img', 'url', 'link'].includes(h)),
      description: headers.findIndex(h => ['descripcion', 'description', 'desc', 'detalle', 'info'].includes(h)),
      details: headers.findIndex(h => ['detalles', 'details', 'caracteristicas', 'especificaciones'].includes(h)),
      stock: headers.findIndex(h => ['stock', 'disponible', 'activo', 'habilitado'].includes(h)),
      id: headers.findIndex(h => ['id', 'codigo', 'cod', 'sku'].includes(h))
    };

    if (colMap.name === -1 && colMap.price === -1) {
      throw new Error('El archivo CSV debe tener al menos columnas como "Nombre" y "Precio".');
    }

    const parsedProducts = [];

    for (let i = 1; i < lines.length; i++) {
      const row = splitCSVLine(lines[i], delimiter);
      if (row.length === 0 || row.every(val => val === '')) continue;

      const name = colMap.name !== -1 ? row[colMap.name] : `Producto #${i}`;
      if (!name) continue;

      // Limpiar precio (remover $, puntos de miles, etc)
      let price = 0;
      if (colMap.price !== -1 && row[colMap.price]) {
        let rawPrice = String(row[colMap.price]).replace(/[$\s]/g, '');
        // Si tiene formato 1.500,00 o 1500
        if (rawPrice.includes('.') && rawPrice.includes(',')) {
          rawPrice = rawPrice.replace(/\./g, '').replace(',', '.');
        } else if (rawPrice.includes(',')) {
          rawPrice = rawPrice.replace(',', '.');
        }
        price = parseFloat(rawPrice) || 0;
      }

      const category = colMap.category !== -1 && row[colMap.category] 
        ? row[colMap.category].toLowerCase().trim() 
        : 'varios';

      const badge = colMap.badge !== -1 ? row[colMap.badge] : '';
      const image = colMap.image !== -1 && row[colMap.image] ? row[colMap.image] : '';
      const description = colMap.description !== -1 ? row[colMap.description] : '';
      
      let details = [];
      if (colMap.details !== -1 && row[colMap.details]) {
        details = row[colMap.details].split(/[|;]/).map(d => d.trim()).filter(Boolean);
      }

      let stock = true;
      if (colMap.stock !== -1 && row[colMap.stock] !== undefined) {
        const sVal = String(row[colMap.stock]).toLowerCase().trim();
        stock = !(sVal === 'false' || sVal === '0' || sVal === 'no' || sVal === 'agotado');
      }

      let customId = colMap.id !== -1 && !isNaN(parseInt(row[colMap.id])) 
        ? parseInt(row[colMap.id]) 
        : null;

      parsedProducts.push({
        id: customId,
        name,
        price,
        category,
        badge,
        image: image || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=600&auto=format&fit=crop&q=80',
        description: description || `Producto ${name} disponible en La Taberna de Homero.`,
        details: details.length > 0 ? details : ['Disponible para retiro en Vicente López 139'],
        stock,
        tags: [category, name.toLowerCase()]
      });
    }

    return parsedProducts;
  }

  /**
   * Parser robusto de JSON
   */
  function parseJSON(text) {
    if (!text || typeof text !== 'string') return [];
    const parsed = JSON.parse(text);

    let items = [];
    if (Array.isArray(parsed)) {
      items = parsed;
    } else if (parsed && Array.isArray(parsed.products)) {
      items = parsed.products;
    } else if (parsed && Array.isArray(parsed.productos)) {
      items = parsed.productos;
    } else if (parsed && Array.isArray(parsed.items)) {
      items = parsed.items;
    } else {
      throw new Error('El archivo JSON debe contener un arreglo de productos (ej: [{ "name": "...", "price": 1000 }]).');
    }

    return items.map((p, idx) => ({
      id: p.id ? Number(p.id) : null,
      name: String(p.name || p.nombre || `Producto ${idx + 1}`).trim(),
      price: Math.max(0, Number(p.price || p.precio || 0)),
      category: String(p.category || p.categoria || 'varios').toLowerCase().trim(),
      badge: String(p.badge || p.etiqueta || '').trim(),
      image: String(p.image || p.imagen || p.foto || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=600&auto=format&fit=crop&q=80').trim(),
      description: String(p.description || p.descripcion || '').trim(),
      details: Array.isArray(p.details || p.detalles) 
        ? (p.details || p.detalles) 
        : (p.details ? String(p.details).split('|').map(s => s.trim()) : ['Disponible para retiro en Vicente López 139']),
      stock: p.stock !== undefined ? Boolean(p.stock) : true,
      tags: Array.isArray(p.tags) ? p.tags : []
    }));
  }

  /**
   * Importa productos parsed a la base de datos (con opción de añadir o reemplazar)
   */
  function importProducts(newItems, mode = 'append') {
    if (!Array.isArray(newItems) || newItems.length === 0) {
      return { success: false, error: 'No se encontraron productos válidos para importar.' };
    }

    let currentList = mode === 'replace' ? [] : [...memoryProducts];

    // Calcular el mayor ID actual
    let maxId = currentList.length > 0 ? Math.max(...currentList.map(p => Number(p.id) || 0)) : 0;

    const formatted = newItems.map(item => {
      maxId++;
      return {
        ...item,
        id: item.id && !currentList.some(p => p.id === item.id) ? item.id : maxId
      };
    });

    const finalList = mode === 'replace' ? formatted : [...currentList, ...formatted];
    const res = saveToStorage(finalList, true);
    return {
      ...res,
      importedCount: formatted.length,
      totalCount: finalList.length
    };
  }

  // --- COMPRESIÓN DE FOTOS CLIENTE (Para almacenar en LocalStorage sin explotar el límite) ---
  function compressImageFile(file, maxWidth = 800, quality = 0.8) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        return reject(new Error('El archivo seleccionado no es una imagen válida.'));
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Intentar exportar a WebP, si no JPEG
          let dataUrl = canvas.toDataURL('image/webp', quality);
          if (dataUrl.indexOf('data:image/webp') !== 0) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('No se pudo procesar la imagen seleccionada.'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo.'));
      reader.readAsDataURL(file);
    });
  }

  // --- EXPORTACIÓN Y PLANTILLAS ---
  function exportToJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(memoryProducts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `catalogo-la-taberna-de-homero-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  function exportToCSV() {
    const headers = ["id", "name", "category", "price", "badge", "description", "details", "stock", "image"];
    const rows = memoryProducts.map(p => [
      p.id,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.category || '').replace(/"/g, '""')}"`,
      p.price || 0,
      `"${(p.badge || '').replace(/"/g, '""')}"`,
      `"${(p.description || '').replace(/"/g, '""')}"`,
      `"${Array.isArray(p.details) ? p.details.join('|').replace(/"/g, '""') : ''}"`,
      p.stock ? 'SI' : 'NO',
      `"${(p.image || '').replace(/"/g, '""')}"`
    ]);

    // Agregar UTF-8 BOM (\uFEFF) para que Excel lo abra con acentos perfectos
    const csvContent = "\uFEFF" + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", url);
    downloadAnchor.setAttribute("download", `catalogo-la-taberna-de-homero-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  }

  function downloadCSVTemplate() {
    const sampleCSV = `\uFEFFNombre;Categoria;Precio;Etiqueta;Descripcion;Detalles;Stock;Imagen
Cerveza Duff Helada 710cc;cervezas;4500;🍻 Exclusiva;La cerveza más fría de la taberna;Botella 710cc|Rubia bien helada|Retiro por Vicente López 139;SI;https://images.unsplash.com/photo-1608270191993-9c595781604a?w=600&auto=format&fit=crop&q=80
Pizza Muzzarella Artesanal;pizzas;7800;🍕 Lista para Horno;Masa artesanal con abundante muzzarella fresca;Fermentación lenta|350g de muzzarella|Lista para hornear;SI;https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80
Vino Malbec Joven 750ml;vinos;5200;🍷 Bodega;Malbec mendocino frutado y fresco;Botella 750ml|Graduación 13.5%|Ideal para previa;SI;https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&auto=format&fit=crop&q=80`;

    const blob = new Blob([sampleCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla-productos-taberna.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function downloadJSONTemplate() {
    const sampleJSON = [
      {
        name: "Cerveza Artesanal IPA 500cc",
        category: "cervezas",
        price: 4200,
        badge: "⭐ Nueva",
        description: "IPA bien aromática y refrescante.",
        details: ["Lata 500cc", "Sabor lupulado", "Fría de cámara"],
        stock: true,
        image: "https://images.unsplash.com/photo-1608270191993-9c595781604a?w=600&auto=format&fit=crop&q=80"
      },
      {
        name: "Papas Fritas Onduladas 150g",
        category: "snacks",
        price: 2400,
        badge: "🍟 Crujientes",
        description: "Papas crocantes estilo gourmet.",
        details: ["Bolsa 150g", "Sal marina", "Textura ondulada"],
        stock: true,
        image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80"
      }
    ];

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sampleJSON, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = 'plantilla-productos-taberna.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // --- GESTIÓN DE SEGURIDAD Y ACCESO ADMINISTRADOR ---
  const ADMIN_PASS_KEY = 'taberna_homero_admin_pass_v1';
  const ADMIN_SESSION_KEY = 'taberna_homero_admin_session_active';
  const DEFAULT_ADMIN_PASSWORD = 'homero123';

  function getAdminPassword() {
    try {
      return localStorage.getItem(ADMIN_PASS_KEY) || DEFAULT_ADMIN_PASSWORD;
    } catch(e) {
      return DEFAULT_ADMIN_PASSWORD;
    }
  }

  function setAdminPassword(newPassword) {
    if (!newPassword || newPassword.trim().length < 4) {
      return { success: false, error: 'La contraseña debe tener al menos 4 caracteres.' };
    }
    try {
      localStorage.setItem(ADMIN_PASS_KEY, newPassword.trim());
      return { success: true };
    } catch(e) {
      return { success: false, error: 'No se pudo guardar la contraseña en el navegador.' };
    }
  }

  function verifyAdminPassword(inputPass) {
    return Boolean(inputPass && inputPass.trim() === getAdminPassword());
  }

  function isAdminLoggedIn() {
    try {
      return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
    } catch(e) {
      return false;
    }
  }

  function loginAdmin(inputPass) {
    if (verifyAdminPassword(inputPass)) {
      try {
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      } catch(e) {}
      return { success: true };
    }
    return { success: false, error: 'Contraseña incorrecta. Por favor verificá los datos.' };
  }

  function logoutAdmin() {
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch(e) {}
    return { success: true };
  }

  // Inicializar al cargar el script
  init();

  return {
    init,
    getProducts,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    resetToDefaults,
    clearAll,
    parseCSV,
    parseJSON,
    importProducts,
    compressImageFile,
    exportToJSON,
    exportToCSV,
    downloadCSVTemplate,
    downloadJSONTemplate,
    getAdminPassword,
    setAdminPassword,
    verifyAdminPassword,
    isAdminLoggedIn,
    loginAdmin,
    logoutAdmin
  };
})();

// Exportar globalmente
if (typeof window !== 'undefined') {
  window.TavernDB = TavernDB;
}
if (typeof globalThis !== 'undefined') {
  globalThis.TavernDB = TavernDB;
}

// Sincronizar inmediatamente
if (typeof PRODUCTS !== 'undefined') {
  PRODUCTS = TavernDB.getProducts();
}
