// ==============================================================================
// MRJ CMS - DADOS PADRÃO E SINCRONIZADOR HÍBRIDO (LOCAL / PHP / SUPABASE)
// ==============================================================================

const DEFAULT_SITE_DATA = {
  theme: {
    primaryColor: "#b49a70",
    primaryHover: "#9c8058",
    headerBg: "rgba(255, 255, 255, 0.96)",
    footerBg: "#f5eee6",
    textPrimary: "#202126",
    textSecondary: "#73716d",
    heroOverlayOpacity: 0.45
  },
  settings: {
    logoType: "text", // "text" | "image"
    logoImage: "",
    brokerName: "MARCIO ROGÉRIO",
    brokerMark: "MR",
    brokerSubtitle: "Corretor de Imóveis",
    headerCtaText: "Fale comigo",
    menuLinks: [
      { label: "Início", url: "#inicio" },
      { label: "Empreendimentos", url: "#empreendimentos" },
      { label: "Conteúdos", url: "#conteudos" },
      { label: "Contato", url: "#contato" }
    ],
    phoneDisplay: "(41) 99108-0293",
    phoneRaw: "5541991080293",
    email: "marciorogerio.corretor@gmail.com",
    creci: "12345-F",
    experienceYears: "+45",
    adminPasswordHash: "mrj@2025",
    supabaseUrl: "https://wcopjkuhncdzxsriwzgy.supabase.co",
    supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indjb3Bqa3VobmNkenhzcml3emd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2MzUyNjksImV4cCI6MjEwOTIxMTI2OX0.zpKHHp2StajYdQR0iksN3sX5WnYyHmCb7r6Y3jScGaU"
  },
  hero: {
    mediaType: "image", // "image" | "video_local" | "video_embed"
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2200&q=90",
    videoUrl: "",
    videoPoster: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2200&q=90",
    videoEmbed: "",
    eyebrow: "SELEÇÃO EXCLUSIVA",
    title: "O lugar ideal para você <em>se sentir em casa.</em>",
    copy: "Descubra empreendimentos que conectam design, qualidade de vida e uma localização privilegiada nos melhores bairros de São Paulo.",
    ctaText: "Encontre seu novo lar",
    ctaLink: "#empreendimentos",
    highlights: [
      { num: "+45", text: "anos de experiência" },
      { num: "Curadoria", text: "de alto padrão" },
      { num: "Atendimento", text: "personalizado" }
    ]
  },
  projects: [
    {
      id: "piaui",
      ref: "MR-0101",
      name: "Casa Piauí Higienópolis",
      location: "HIGIENÓPOLIS · SÃO PAULO / SP",
      price: "Consulte valores",
      description: "Exclusividade de torre única com arquitetura contemporânea e generosas varandas integradas.",
      image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=85",
      status: "lancamento",
      statusLabel: "Lançamento",
      tagNote: "✦ Alto padrão",
      area: "168 a 220 m²",
      bedrooms: "3 a 4",
      suites: "3 a 4 Suítes",
      vagas: "2 a 3 Vagas",
      pdfUrl: "",
      whatsappMessage: "Olá Marcio, quero saber mais sobre o Casa Piauí Higienópolis (Ref: MR-0101)"
    },
    {
      id: "havva",
      ref: "MR-0102",
      name: "Havva Higienópolis",
      location: "HIGIENÓPOLIS · SÃO PAULO / SP",
      price: "Consulte valores",
      description: "Um convite ao equilíbrio urbano com lazer suspenso, acabamentos nobres e vista panorâmica.",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=85",
      status: "obras",
      statusLabel: "Em obras",
      tagNote: "✧ Personalizável",
      area: "142 a 186 m²",
      bedrooms: "3",
      suites: "3 Suítes",
      vagas: "2 Vagas",
      pdfUrl: "",
      whatsappMessage: "Olá Marcio, quero saber mais sobre o Havva Higienópolis (Ref: MR-0102)"
    },
    {
      id: "reserva",
      ref: "MR-0103",
      name: "Reserva Itaim",
      location: "ITAIM BIBI · SÃO PAULO / SP",
      price: "Consulte valores",
      description: "O ápice do requinte corporativo e residencial no centro financeiro e gastronômico da capital.",
      image: "https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=1000&q=85",
      status: "pronto",
      statusLabel: "Pronto para morar",
      tagNote: "◈ Entrega imediata",
      area: "210 a 380 m²",
      bedrooms: "4",
      suites: "4 Suítes",
      vagas: "3 a 4 Vagas",
      pdfUrl: "",
      whatsappMessage: "Olá Marcio, quero saber mais sobre o Reserva Itaim (Ref: MR-0103)"
    }
  ],
  articles: [
    {
      id: "art-1",
      category: "Decoração & design",
      date: "12 outubro, 2024",
      datetime: "2024-10-12",
      title: "Como integrar ambientes sociais e varandas com harmonia estética",
      description: "Descubra soluções arquitetônicas sofisticadas para ampliar a convivência e trazer mais luz natural para dentro de casa.",
      image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=85",
      link: "#contato"
    },
    {
      id: "art-2",
      category: "Tendências urbanas",
      date: "28 setembro, 2024",
      datetime: "2024-09-28",
      title: "Higienópolis e Itaim: os bairros que redefinem o luxo discreto",
      description: "Uma análise aprofundada sobre a liquidez imobiliária, segurança e a rica oferta cultural dos endereços mais desejados.",
      image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1000&q=85",
      link: "#contato"
    },
    {
      id: "art-3",
      category: "Arquitetura & ESG",
      date: "15 setembro, 2024",
      datetime: "2024-09-15",
      title: "Eficiência energética e biofilia no desenvolvimento imobiliário",
      description: "Como as certificações ambientais e o paisagismo nativo valorizam o metro quadrado e preservam o futuro das cidades.",
      image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1000&q=85",
      link: "#contato"
    }
  ]
};

const STORAGE_KEY = "mrj_site_data_v2";

/**
 * Aplica a paleta de cores no :root dinamicamente (Estilo Wix Customizer)
 */
function applyThemeColors(theme) {
  if (!theme) return;
  const styleEl = document.getElementById("mrj-dynamic-theme") || document.createElement("style");
  styleEl.id = "mrj-dynamic-theme";

  const primary = theme.primaryColor || "#b49a70";
  const hover = theme.primaryHover || "#9c8058";
  const header = theme.headerBg || "rgba(255, 255, 255, 0.96)";
  const footer = theme.footerBg || "#f5eee6";
  const textPrimary = theme.textPrimary || "#202126";
  const textSecondary = theme.textSecondary || "#73716d";
  const opacity = theme.heroOverlayOpacity !== undefined ? theme.heroOverlayOpacity : 0.45;

  styleEl.innerHTML = `
    :root {
      --primary-color: ${primary} !important;
      --primary-hover: ${hover} !important;
      --gold: ${primary} !important;
      --gold-dark: ${hover} !important;
      --header-bg: ${header} !important;
      --footer-bg: ${footer} !important;
      --cream: ${footer} !important;
      --text-primary: ${textPrimary} !important;
      --text-secondary: ${textSecondary} !important;
      --ink: ${textPrimary} !important;
      --muted: ${textSecondary} !important;
      --hero-overlay-opacity: ${opacity} !important;
    }
  `;

  if (!document.getElementById("mrj-dynamic-theme")) {
    document.head.appendChild(styleEl);
  }
}

/**
 * Carrega os dados do site (Cache local com mescla segura)
 */
function getSiteData() {
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      return {
        theme: { ...DEFAULT_SITE_DATA.theme, ...(parsed.theme || {}) },
        settings: { ...DEFAULT_SITE_DATA.settings, ...(parsed.settings || {}) },
        hero: { ...DEFAULT_SITE_DATA.hero, ...(parsed.hero || {}) },
        projects: Array.isArray(parsed.projects) && parsed.projects.length > 0 ? parsed.projects : DEFAULT_SITE_DATA.projects,
        articles: Array.isArray(parsed.articles) && parsed.articles.length > 0 ? parsed.articles : DEFAULT_SITE_DATA.articles
      };
    }
  } catch (err) {
    console.warn("Erro ao ler cache local:", err);
  }
  return JSON.parse(JSON.stringify(DEFAULT_SITE_DATA));
}

/**
 * Salva dados no cache local
 */
function saveSiteData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (data.theme) {
      applyThemeColors(data.theme);
    }
    return true;
  } catch (err) {
    console.error("Erro ao salvar localmente:", err);
    return false;
  }
}

/**
 * Sincroniza dados com o Supabase
 */
async function fetchSupabaseData(url, key) {
  if (!url || !key) return null;
  try {
    const endpoint = `${url.replace(/\/$/, '')}/rest/v1/mrj_site_data?id=eq.1&select=data`;
    const res = await fetch(endpoint, {
      headers: {
        "apikey": key,
        "Authorization": `Bearer ${key}`
      }
    });
    if (res.ok) {
      const rows = await res.json();
      if (rows && rows.length > 0 && rows[0].data && Object.keys(rows[0].data).length > 0) {
        return rows[0].data;
      }
    }
  } catch (err) {
    console.warn("Supabase indisponível no momento:", err);
  }
  return null;
}

/**
 * Envia Lead capturado para o Supabase e backup local
 */
async function submitLead(lead) {
  const currentData = getSiteData();
  const url = currentData.settings?.supabaseUrl;
  const key = currentData.settings?.supabaseKey;

  // 1. Salvar no cache local
  try {
    const localLeads = JSON.parse(localStorage.getItem("mrj_leads_backup") || "[]");
    localLeads.unshift({ ...lead, id: Date.now(), created_at: new Date().toISOString() });
    localStorage.setItem("mrj_leads_backup", JSON.stringify(localLeads));
  } catch (e) {
    console.warn("Erro ao salvar lead local:", e);
  }

  // 2. Salvar no Supabase
  if (url && key) {
    try {
      const endpoint = `${url.replace(/\/$/, '')}/rest/v1/leads`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "apikey": key,
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify(lead)
      });
      return res.ok;
    } catch (err) {
      console.warn("Falha ao enviar lead para Supabase:", err);
    }
  }
  return true;
}

/**
 * Busca lista de leads para o painel administrativo
 */
async function getLeadsList() {
  const currentData = getSiteData();
  const url = currentData.settings?.supabaseUrl;
  const key = currentData.settings?.supabaseKey;

  if (url && key) {
    try {
      const endpoint = `${url.replace(/\/$/, '')}/rest/v1/leads?select=*&order=created_at.desc`;
      const res = await fetch(endpoint, {
        headers: {
          "apikey": key,
          "Authorization": `Bearer ${key}`
        }
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn("Erro ao buscar leads do Supabase:", err);
    }
  }

  try {
    return JSON.parse(localStorage.getItem("mrj_leads_backup") || "[]");
  } catch (e) {
    return [];
  }
}
