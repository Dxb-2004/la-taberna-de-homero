/**
 * LA TABERNA DE HOMERO - Catálogo de Productos y Datos del Local
 * Bahía Blanca, Buenos Aires, Argentina
 */

const STORE_CONFIG = {
  name: "LA TABERNA DE HOMERO",
  slogan: "¡La mejor taberna de Bahía Blanca para tus previas, snacks y antojos! 🍻🍩",
  address: "Vicente López 139, B8000 Bahía Blanca, Buenos Aires",
  phone: "+542914981200",
  whatsappNumber: "542914981200", // Código internacional para wa.me sin signos
  whatsappFormatted: "+54 9 291 498-1200",
  email: "latabernadehomero1@gmail.com",
  instagram: "https://www.instagram.com/la.taberna.de.homero_?igsh=bmdtaXVzcWJkMHpq",
  instagramHandle: "@la.taberna.de.homero_",
  facebook: "https://www.facebook.com/share/159zCgoJ67/",
  googleMaps: "https://www.google.com/maps/search/?api=1&query=Vicente+L%C3%B3pez+139,+Bah%C3%ADa+Blanca,+Buenos+Aires",
  hours: "Lunes a Sábado: 10:30 a 13:30 hs y de 17:00 a 21:00 hs (Domingos cerrado)",
  schedule: {
    days: "Lunes a Sábado",
    morning: "10:30 a 13:30 hs",
    evening: "17:00 a 21:00 hs",
    sunday: "Cerrado"
  },
  pickupLocation: "Vicente López 139, Bahía Blanca",
  currency: "ARS",
  currencySymbol: "$",
  coverImage: "https://cdn.catalog-store.link/5f74c93c397c4390f095a906e1c4f458_image.jpg",
  logoImage: "assets/logo-homero-pizza.svg",
  bannerImage: "https://cdn.catalog-store.link/5f74c93c397c4390f095a906e1c4f458_image.jpg"
};

const DEFAULT_CATEGORIES = [
  { id: "all", name: "🔥 Todos", icon: "bi-grid-fill" },
  { id: "combos", name: "🍸 Combos Previas", icon: "bi-cup-straw", badge: "Más Vendido" },
  { id: "snacks", name: "🍟 Snacks & Quentos", icon: "bi-box2-heart-fill", badge: "Línea Quentos" }
];

let CATEGORIES = [...DEFAULT_CATEGORIES];

const HOMER_QUOTES = [
  "«¡Por el alcohol: la causa y la solución de todos los problemas de la vida!» 🍻",
  "«Mmm... Cerveza helada y papitas crujientes... ¡Arrghlglgl!» 🤤",
  "«¡A la grande le puse Cuca! Pero a esta previa le pongo fernet con coca.» 🦎🍸",
  "«¡Operador, deme el número de la Taberna de Homero en Vicente López 139!» 📞",
  "«No estoy gordo, estoy lleno de amor... y de Doritos con queso.» 🧀",
  "«¡D'oh! Menos mal que en la Taberna de Homero retiro todo al toque y bien frío.» 🍕❄️",
  "«Moe, una ronda para todos y unos conos de queso para llevar.» 🤠"
];

const DEFAULT_PRODUCTS = [
  // --- COMBOS PARA LA PREVIA (De la tienda oficial) ---
  {
    id: 1,
    name: "Combo Fernet 450 + Coca-Cola 1.5L",
    category: "combos",
    price: 15800,
    badge: "⭐ El Rey de la Previa",
    image: "https://cdn.catalog-store.link/20b715af3338fbcc88eb8e14e1dd1915_photo.webp",
    description: "La combinación sagrada argentina. Fernet Branca clásico de 450cc acompañado de una Coca-Cola original de 1.5 litros bien fría. Listo para arrancar la noche.",
    details: ["Fernet Branca 450cc", "Coca-Cola Original 1.5 Litros", "Listo para armar en jarra o vaso largo"],
    stock: true,
    tags: ["previa", "fernet", "coca", "branca", "combo"]
  },
  {
    id: 2,
    name: "Combo Blu + Manaos Tónica",
    category: "combos",
    price: 20000,
    badge: "🔥 Super Promo",
    image: "https://cdn.catalog-store.link/49e0d363a6ff12e7088b5a742a0f63dd_photo.webp",
    description: "Combo refrescante y fiestero. Botella de Blu licor/aperitivo acompañada de gaseosa Manaos Tónica para un trago chispeante e ideal con amigos.",
    details: ["Aperitivo Blu botella", "Gaseosa Manaos Tónica fría", "Rinde para múltiples copas"],
    stock: true,
    tags: ["blu", "tonica", "manaos", "trago", "combo"]
  },
  {
    id: 3,
    name: "Combo Gancia + Sprite",
    category: "combos",
    price: 11600,
    badge: "🍋 Clásico Refrescante",
    image: "https://cdn.catalog-store.link/1f64e2cc59023198725c07c025163d2e_photo.webp",
    description: "El aperitivo más fresco de la taberna. Americano Gancia clásico con Sprite lima-limón. Servilo con abundante hielo y rodajas de limón.",
    details: ["Botella Americano Gancia", "Sprite Lima Limón", "Excelente para tardes y previas"],
    stock: true,
    tags: ["gancia", "sprite", "limon", "aperitivo", "combo"]
  },
  {
    id: 4,
    name: "Combo Campari + Cepita 1L",
    category: "combos",
    price: 12500,
    badge: "🍊 El Favorito",
    image: "https://cdn.catalog-store.link/783926c64c2dff98bf680f126b404b4f_photo.webp",
    description: "Amor a primer trago. Campari bitter italiano combinado con el inconfundible jugo de naranja Cepita de 1 litro para un Campari Orange insuperable.",
    details: ["Campari Bitter botella", "Jugo Cepita Naranja 1L", "Ideal con rodaja de naranja"],
    stock: true,
    tags: ["campari", "cepita", "naranja", "tragos", "combo"]
  },
  {
    id: 5,
    name: "Combo Fernet 1882 + Coca-Cola 1.5L",
    category: "combos",
    price: 11000,
    badge: "💸 Precio Bomba",
    image: "https://cdn.catalog-store.link/dd52cbb14bb4af49bff86ba9ff9a23b6_photo.webp",
    description: "Fernet cordobés 1882 de gran cuerpo y sabor herbal con Coca-Cola de 1.5L. Máxima calidad al mejor precio de Bahía Blanca.",
    details: ["Fernet 1882", "Coca-Cola 1.5 Litros", "Excelente relación precio/calidad"],
    stock: true,
    tags: ["fernet", "1882", "coca", "combo", "ahorro"]
  },

  // --- SNACKS & QUENTOS (De la tienda oficial) ---
  {
    id: 6,
    name: "Quentos - Nachos Guacamole",
    category: "snacks",
    price: 2200,
    badge: "🥑 Picante Suave",
    image: "https://cdn.catalog-store.link/ccaed2c299a2784232321a8be3616e51_photo.webp",
    description: "Nachos crocantes de maíz sazonados con un irresistible toque de guacamole. Perfectos para dippear o comer solos.",
    details: ["Nachos de puro maíz", "Sabor guacamole auténtico", "Textura ultra crujiente"],
    stock: true,
    tags: ["quentos", "nachos", "guacamole", "snacks"]
  },
  {
    id: 7,
    name: "Quentos - Conos de Queso",
    category: "snacks",
    price: 2200,
    badge: "🧀 Súper Queso",
    image: "https://cdn.catalog-store.link/0ec5f4da04509251523621ab72c45890_photo.webp",
    description: "Los divertidos y adictivos conitos crujientes bañados con intenso sabor a queso cheddar. No podés parar de comerlos.",
    details: ["Conitos de maíz inflado", "Sabor queso intenso", "Snack clásico de fiesta"],
    stock: true,
    tags: ["quentos", "conos", "queso", "snacks"]
  },
  {
    id: 8,
    name: "Quentos - Nacho Sabor Queso",
    category: "snacks",
    price: 2200,
    badge: "🧀 Nachos",
    image: "https://cdn.catalog-store.link/5d80f8a3707e3af89ee06ff17e0e255e_photo.webp",
    description: "Nachos triangulares crocantes con una fina y deliciosa capa de queso tostado. Ideales para acompañar cervezas.",
    details: ["Triángulos de maíz crocante", "Queso dorado", "Ideal con birra"],
    stock: true,
    tags: ["quentos", "nachos", "queso", "snacks"]
  },
  {
    id: 9,
    name: "Quentos - Queso Crema y Ciboulette",
    category: "snacks",
    price: 2200,
    badge: "🌿 Gourmet",
    image: "https://cdn.catalog-store.link/1a94c30b8e614e6d14eb8787bc0aee42_photo.webp",
    description: "Papas fritas con el balance perfecto entre suavidad de queso crema y la frescura herbal del ciboulette.",
    details: ["Papas seleccionadas", "Sabor crema y ciboulette", "Toque fresco y suave"],
    stock: true,
    tags: ["quentos", "papas", "crema", "ciboulette", "snacks"]
  },
  {
    id: 10,
    name: "Quentos - Jamón Serrano",
    category: "snacks",
    price: 2200,
    badge: "🥓 Ahumado",
    image: "https://cdn.catalog-store.link/d1af1029cd9e8fc2c9538c0f248830c7_photo.webp",
    description: "Papas fritas con sabor ahumado a jamón serrano curado. Típico sabor español que marida de diez con fernet y birras.",
    details: ["Sabor jamón serrano", "Corte clásico crocante", "Aroma tostado"],
    stock: true,
    tags: ["quentos", "papas", "jamon", "serrano", "snacks"]
  },
  {
    id: 11,
    name: "Quentos - Mostaza Agridulce",
    category: "snacks",
    price: 2200,
    badge: "🌭 Mostaza",
    image: "https://cdn.catalog-store.link/9d581d3554e66778ba5a3bac7e00271b_photo.webp",
    description: "El toque audaz de la mostaza en grano suave y agridulce que transforma cada bocado en una explosión de sabor.",
    details: ["Sabor mostaza especiada", "Equilibrio justo", "Adictivo snack"],
    stock: true,
    tags: ["quentos", "papas", "mostaza", "snacks"]
  },
  {
    id: 12,
    name: "Quentos - Limón",
    category: "snacks",
    price: 2200,
    badge: "🍋 Cítrico",
    image: "https://cdn.catalog-store.link/3845dea5a65611dcead072730aa4e8d1_photo.webp",
    description: "Papas fritas con un toque chispeante de jugo de limón natural y sal fina. Especiales para abrir el apetito.",
    details: ["Sabor limón refrescante", "Sal justa", "Gran maridaje con cerveza"],
    stock: true,
    tags: ["quentos", "papas", "limon", "snacks"]
  },
  {
    id: 13,
    name: "Quentos - Asado Criollo",
    category: "snacks",
    price: 2200,
    badge: "🥩 Bien Argentino",
    image: "https://cdn.catalog-store.link/33cbdf43955ed23077cd2ed77729c228_photo.webp",
    description: "El inconfundible sabor a asado a las brasas hecho papa frita. Sabor ahumado a carne asada bien de campo.",
    details: ["Sabor asado a la parrilla", "Toque especiado ahumado", "Papas doradas"],
    stock: true,
    tags: ["quentos", "papas", "asado", "snacks"]
  },
  {
    id: 14,
    name: "Quentos - Mega Queso",
    category: "snacks",
    price: 2200,
    badge: "🧀🧀 Queso Extra",
    image: "https://cdn.catalog-store.link/4e08dc3513187f5ca7b4bb03be207db9_photo.webp",
    description: "Para los fanáticos incondicionales del queso: doble cobertura de sabor a quesos seleccionados maduros.",
    details: ["Súper sabor a queso", "Color vibrante", "Crocante supremo"],
    stock: true,
    tags: ["quentos", "papas", "mega", "queso", "snacks"]
  },
  {
    id: 15,
    name: "Nikitos - Palitos Salados",
    category: "snacks",
    price: 1300,
    badge: "🥨 Económico",
    image: "https://cdn.catalog-store.link/3a8de8132991d4e15e5c20b0d1365346_photo.webp",
    description: "Los legendarios palitos salados Nikitos que nunca fallan en la mesa con amigos y vermut. Crujientes y económicos.",
    details: ["Harina de trigo horneada y frita", "Punto justo de sal", "Envase clásico"],
    stock: true,
    tags: ["nikitos", "palitos", "salados", "snacks"]
  },
  {
    id: 16,
    name: "Quentos - Papas Pay",
    category: "snacks",
    price: 2200,
    badge: "🌭 Para Panchos & Lomitos",
    image: "https://cdn.catalog-store.link/0a0a5c46b7a91b3d6dc69c7765410e72_photo.webp",
    description: "Papas pay finitas y crocantes. El acompañamiento imprescindible para tus panchos, hamburguesas y milanesas.",
    details: ["Corte pay ultrafino", "Sin exceso de aceite", "Súper crocantes"],
    stock: true,
    tags: ["quentos", "papas", "pay", "panchos", "snacks"]
  },
  {
    id: 17,
    name: "Quentos - Batatas Rústicas",
    category: "snacks",
    price: 2200,
    badge: "🍠 Batatas Gourmet",
    image: "https://cdn.catalog-store.link/9bc3b0604788d1aa2e188d65c03da917_photo.webp",
    description: "Deliciosas batatas seleccionadas con corte rústico y cocción lenta para lograr un dulzor natural y textura crocante inigualable.",
    details: ["Batatas naturales", "Corte rústico con piel", "Sabor agridulce natural"],
    stock: true,
    tags: ["quentos", "batatas", "rusticas", "snacks"]
  },
  {
    id: 18,
    name: "Quentos - Batatas Sal Marina",
    category: "snacks",
    price: 2200,
    badge: "🌊 Sal Marina",
    image: "https://cdn.catalog-store.link/97bfcc5a4bf7e2f409d2cb8534fad442_photo.webp",
    description: "Batatas fritas premium aderezadas con cristales de sal marina. El contraste ideal entre lo dulce de la batata y la sal fina.",
    details: ["Sal marina natural", "Crocancia crujiente", "100% libre de conservantes"],
    stock: true,
    tags: ["quentos", "batatas", "sal", "marina", "snacks"]
  },
  {
    id: 19,
    name: "Quentos - Batatas Crunch",
    category: "snacks",
    price: 2200,
    badge: "⚡ Extra Crunch",
    image: "https://cdn.catalog-store.link/0b4caff69d6429003bec13f1728a470c_photo.webp",
    description: "Corte ondulado especial que retiene el doble de sabor y ofrece un crujido estruendoso en cada mordida.",
    details: ["Corte grueso acanalado", "Máxima resistencia al dip", "Textura crunch"],
    stock: true,
    tags: ["quentos", "batatas", "crunch", "snacks"]
  },
  {
    id: 20,
    name: "Quentos - Batatas Dulces Especiales",
    category: "snacks",
    price: 2200,
    badge: "🍯 Toque Dulce",
    image: "https://cdn.catalog-store.link/1723f9920810c940ea14e0bba15e52d6_photo.webp",
    description: "La joya de Quentos: batatas doradas a punto con notas caramelizadas. Ideales para un picoteo gourmet.",
    details: ["Batata morada y dorada", "Caramelización justa", "El snack que te sorprende"],
    stock: true,
    tags: ["quentos", "batatas", "dulces", "snacks"]
  },
  {
    id: 21,
    name: "Quentos - Barbacoa BBQ",
    category: "snacks",
    price: 2200,
    badge: "🍖 Salsa BBQ",
    image: "https://cdn.catalog-store.link/3d808b51c4c82ce292bf1535b0b4a190_photo.webp",
    description: "Papas fritas bañadas con salsa BBQ americana dulce y ahumada con especias seleccionadas.",
    details: ["Sabor barbacoa ahumada", "Toque dulce y picante", "Papas crocantes"],
    stock: true,
    tags: ["quentos", "papas", "barbacoa", "bbq", "snacks"]
  },
  {
    id: 22,
    name: "Quentos - Ketchup Dulce",
    category: "snacks",
    price: 2200,
    badge: "🍅 Ketchup",
    image: "https://cdn.catalog-store.link/f0d1e5d9334187c8592c03c8970b0007_photo.webp",
    description: "El clásico sabor de las papitas con ketchup que a todos nos encanta. Delicada acidez de tomate maduro y azúcar rubia.",
    details: ["Sabor tomate kétchup", "Intenso y rico", "Para toda la familia"],
    stock: true,
    tags: ["quentos", "papas", "ketchup", "snacks"]
  },
  {
    id: 23,
    name: "Conitos 3D Originales",
    category: "snacks",
    price: 3200,
    badge: "✨ Los Clásicos",
    image: "https://cdn.catalog-store.link/13948d754e340cb8481de1d5ba54322a_photo.webp",
    description: "Los inconfundibles conitos tridimensionales 3D de maíz inflado. Livianos, aireados y con un crujido inconfundible.",
    details: ["Conitos 3D aireados", "Sabor maíz tostado", "Envase individual generoso"],
    stock: true,
    tags: ["3d", "conitos", "snacks", "clasico"]
  },
  {
    id: 24,
    name: "Doritos Mega Queso",
    category: "snacks",
    price: 3200,
    badge: "🧀 Súper Famosos",
    image: "https://cdn.catalog-store.link/9bf0cd0d4244d26f9fa926207b5e4f88_photo.webp",
    description: "Las tortillas de maíz triangulares más famosas del planeta con su inconfundible condimento de queso cheddar fuerte.",
    details: ["Tortillas de maíz tostadas", "Queso cheddar audaz", "El snack legendario"],
    stock: true,
    tags: ["doritos", "nachos", "queso", "snacks"]
  }
];

// Instancia reactiva de productos (conectada a TavernDB en js/database.js)
let PRODUCTS = [...DEFAULT_PRODUCTS];

// Función para sincronizar categorías según los productos actuales
function getDynamicCategories() {
  const baseMap = new Map();
  DEFAULT_CATEGORIES.forEach(c => baseMap.set(c.id, { ...c }));

  // Detectar categorías adicionales que vengan en los productos importados
  PRODUCTS.forEach(p => {
    if (p.category && !baseMap.has(p.category)) {
      const cleanName = p.category.charAt(0).toUpperCase() + p.category.slice(1);
      baseMap.set(p.category, {
        id: p.category,
        name: `📦 ${cleanName}`,
        icon: "bi-tag-fill"
      });
    }
  });

  return Array.from(baseMap.values());
}
