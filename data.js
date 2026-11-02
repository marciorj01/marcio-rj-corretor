// Configurações e dados iniciais do site Marcio Rogério Corretor

const DEFAULT_SITE_DATA = {
  settings: {
    brokerName: "MARCIO ROGÉRIO",
    brokerMark: "MR",
    phoneDisplay: "(41) 99108-0293",
    phoneRaw: "5541991080293",
    email: "marciorogerio.corretor@gmail.com",
    experienceYears: "+45",
    adminPasswordHash: "mrj@2025", // Senha inicial padrão
    supabaseUrl: "",
    supabaseKey: "",
    supabaseBucket: "imoveis"
  },
  hero: {
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2200&q=90",
    eyebrow: "SELEÇÃO EXCLUSIVA",
    title: "O lugar ideal para você <em>se sentir em casa.</em>",
    copy: "Descubra empreendimentos que conectam design, qualidade de vida e uma localização privilegiada.",
    ctaText: "Encontre seu novo lar",
    highlights: [
      { num: "+45", text: "anos de experiência" },
      { num: "Curadoria", text: "de alto padrão" },
      { num: "Atendimento", text: "personalizado" }
    ]
  },
  projects: [
    {
      id: "piaui",
      name: "Casa Piauí Higienópolis",
      location: "HIGIENÓPOLIS · SÃO PAULO / SP",
      description: "Exclusividade de torre única com arquitetura contemporânea e generosas varandas integradas.",
      image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=85",
      status: "lancamento",
      statusLabel: "Lançamento",
      tagNote: "✦ Alto padrão",
      area: "168 a 220 m²",
      suites: "3 a 4 Suítes",
      vagas: "2 a 3 Vagas",
      pdfUrl: "",
      whatsappMessage: "Quero saber mais sobre o Casa Piaui Higienopolis"
    },
    {
      id: "havva",
      name: "Havva Higienópolis",
      location: "HIGIENÓPOLIS · SÃO PAULO / SP",
      description: "Um convite ao equilíbrio urbano com lazer suspenso, acabamentos nobres e vista panorâmica.",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=85",
      status: "obras",
      statusLabel: "Em obras",
      tagNote: "✧ Personalizável",
      area: "142 a 186 m²",
      suites: "3 Suítes",
      vagas: "2 Vagas",
      pdfUrl: "",
      whatsappMessage: "Quero saber mais sobre o Havva Higienopolis"
    },
    {
      id: "reserva",
      name: "Reserva Itaim",
      location: "ITAIM BIBI · SÃO PAULO / SP",
      description: "O ápice do requinte corporativo e residencial no centro financeiro e gastronômico da capital.",
      image: "https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=1000&q=85",
      status: "pronto",
      statusLabel: "Pronto para morar",
      tagNote: "◈ Entrega imediata",
      area: "210 a 380 m²",
      suites: "4 Suítes",
      vagas: "3 a 4 Vagas",
      pdfUrl: "",
      whatsappMessage: "Quero saber mais sobre o Reserva Itaim"
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

const STORAGE_KEY = "mrj_site_data_v1";

// Carregar dados salvos ou padrão
function getSiteData() {
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      // Mesclar de forma segura com valores padrão para evitar campos nulos
      return {
        settings: { ...DEFAULT_SITE_DATA.settings, ...(parsed.settings || {}) },
        hero: { ...DEFAULT_SITE_DATA.hero, ...(parsed.hero || {}) },
        projects: Array.isArray(parsed.projects) && parsed.projects.length > 0 ? parsed.projects : DEFAULT_SITE_DATA.projects,
        articles: Array.isArray(parsed.articles) && parsed.articles.length > 0 ? parsed.articles : DEFAULT_SITE_DATA.articles
      };
    }
  } catch (err) {
    console.warn("Erro ao ler dados locais:", err);
  }
  return JSON.parse(JSON.stringify(DEFAULT_SITE_DATA));
}

// Salvar dados
function saveSiteData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error("Erro ao salvar dados localmente:", err);
    return false;
  }
}

// Buscar dados remotos do Supabase (quando configurado)
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
    console.warn("Supabase fetch indisponível ou offline:", err);
  }
  return null;
}

// Salvar Lead (Supabase + Local Backup)
async function submitLead(lead) {
  const currentData = getSiteData();
  const url = currentData.settings?.supabaseUrl;
  const key = currentData.settings?.supabaseKey;

  // 1. Salvar localmente no navegador (sempre garantido)
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

// Buscar Lista de Leads para o Painel Administrativo
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

  // Fallback para leads salvos no navegador
  try {
    return JSON.parse(localStorage.getItem("mrj_leads_backup") || "[]");
  } catch (e) {
    return [];
  }
}
