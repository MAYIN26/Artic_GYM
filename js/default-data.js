/*
 * Contenido inicial del sitio ARTIC GYM.
 * Todo lo que está aquí se puede editar desde el Panel de Administración
 * (botón "Admin" en el pie de página). Estos valores solo se usan mientras
 * nadie haya guardado cambios desde el panel.
 */
window.ARTIC_DEFAULT_DATA = {
  version: 1,

  settings: {
    // [PENDIENTE] Número real de WhatsApp en formato internacional, solo dígitos (52 + 10 dígitos).
    whatsapp: "5210000000000",
    whatsappDisplay: "+52 (000) 000 0000",
    instagram: "artic_gym",
    // [PENDIENTE] Confirmar cuenta de TikTok.
    tiktok: "artic_gym",
    address: "Revilla de Camargo 424, planta alta",
    addressNote: "Detrás de Plaza Escala",
    mapsLink: "https://maps.app.goo.gl/HfJ3CwrYQWHjzC1G6",
    // Dirección usada para el mapa incrustado. Se puede reemplazar por el
    // enlace "Insertar un mapa" de Google Maps desde el panel.
    mapEmbed: "https://www.google.com/maps?q=Revilla+de+Camargo+424&z=16&output=embed",
    hours: [
      { days: "Lunes a viernes", time: "6:00 am – 10:00 pm" },
      { days: "Sábado", time: "7:00 am – 2:00 pm" },
      { days: "Domingo", time: "Cerrado" }
    ],
    // Enlaces a publicaciones o videos para mostrar en la sección de redes.
    // Acepta URLs de Instagram (post o reel) y de TikTok (video).
    featuredPosts: []
  },

  facilities: [
    {
      id: "f1",
      icon: "machines",
      title: "Área de máquinas",
      text: "Equipo de selectorizado y placas para trabajar cada grupo muscular con técnica y seguridad.",
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=70"
    },
    {
      id: "f2",
      icon: "weights",
      title: "Peso libre",
      text: "Mancuernas, barras olímpicas, discos y racks para que construyas fuerza real.",
      image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=70"
    },
    {
      id: "f3",
      icon: "coach",
      title: "Coach personalizado",
      text: "Un coach te acompaña en cada sesión: rutina, técnica y seguimiento de tu progreso.",
      image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=900&q=70"
    },
    {
      id: "f4",
      icon: "shower",
      title: "Regaderas",
      text: "Regaderas limpias y vestidores para que salgas directo a tu día.",
      image: "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=900&q=70"
    },
    {
      id: "f5",
      icon: "coffee",
      title: "Café",
      text: "Recupérate con un shake de proteína, una galleta fit o un buen café antes de irte.",
      image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=70"
    }
  ],

  // [PENDIENTE] Precios del café son de muestra.
  cafe: [
    {
      id: "c1",
      name: "Galletas proteicas",
      icon: "cookie",
      items: [
        { id: "c1a", name: "Chocochip proteica", desc: "15 g de proteína, sin azúcar añadida", price: 45 },
        { id: "c1b", name: "Avena y crema de cacahuate", desc: "Ideal antes de entrenar", price: 45 },
        { id: "c1c", name: "Doble chocolate", desc: "Con whey y cacao al 70%", price: 50 }
      ]
    },
    {
      id: "c2",
      name: "Shakes y smoothies",
      icon: "shake",
      items: [
        { id: "c2a", name: "Shake de proteína", desc: "Vainilla, chocolate o fresa · 25 g de proteína", price: 75 },
        { id: "c2b", name: "Smoothie verde", desc: "Espinaca, piña, plátano y proteína", price: 85 },
        { id: "c2c", name: "Smoothie Artic", desc: "Frutos rojos, avena, yogurt griego y whey", price: 89 }
      ]
    },
    {
      id: "c3",
      name: "Cafés",
      icon: "coffee",
      items: [
        { id: "c3a", name: "Americano", desc: "Caliente o frío", price: 35 },
        { id: "c3b", name: "Latte", desc: "Leche entera, deslactosada o de almendra", price: 50 },
        { id: "c3c", name: "Protein coffee", desc: "Cold brew con proteína de vainilla", price: 70 }
      ]
    }
  ],

  plans: [
    {
      id: "p1",
      name: "Mensualidad general",
      price: 499,
      period: "mes",
      badge: "",
      highlight: false,
      note: "",
      features: [
        "Acceso a todas las áreas",
        "Entrenamiento personalizado incluido",
        "Rutina y seguimiento con coach",
        "Regaderas y vestidores"
      ]
    },
    {
      id: "p2",
      name: "Mensualidad estudiante",
      price: 449,
      period: "mes",
      badge: "Precio estudiante",
      highlight: true,
      note: "Presentando credencial vigente",
      features: [
        "Acceso a todas las áreas",
        "Entrenamiento personalizado incluido",
        "Rutina y seguimiento con coach",
        "Regaderas y vestidores"
      ]
    }
  ],

  products: [
    {
      id: "pr1",
      name: "Playera Oversize Artic",
      category: "Playeras",
      price: 349,
      sizes: ["CH", "M", "G", "XG"],
      image: "assets/products/playera-negra.svg",
      soldOut: false
    },
    {
      id: "pr2",
      name: "Playera Dry-Fit Fuego",
      category: "Playeras",
      price: 329,
      sizes: ["CH", "M", "G"],
      image: "assets/products/playera-naranja.svg",
      soldOut: false
    },
    {
      id: "pr3",
      name: "Hoodie Rompe el Hielo",
      category: "Sudaderas",
      price: 749,
      sizes: ["CH", "M", "G", "XG"],
      image: "assets/products/hoodie.svg",
      soldOut: false
    },
    {
      id: "pr4",
      name: "Short Training Artic",
      category: "Shorts",
      price: 399,
      sizes: ["CH", "M", "G"],
      image: "assets/products/short.svg",
      soldOut: false
    },
    {
      id: "pr5",
      name: "Gorra Snapback Bear",
      category: "Gorras",
      price: 299,
      sizes: ["Unitalla"],
      image: "assets/products/gorra.svg",
      soldOut: false
    },
    {
      id: "pr6",
      name: "Hoodie Ice Blue",
      category: "Sudaderas",
      price: 749,
      sizes: ["M", "G"],
      image: "assets/products/hoodie-azul.svg",
      soldOut: true
    }
  ]
};
