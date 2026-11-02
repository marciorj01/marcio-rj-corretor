// ==============================================================================
// MRJ CMS - FRONTEND PRINCIPAL COM SUPORTE MULTIMÍDIA E TEMAS DINÂMICOS
// ==============================================================================

let activeFilter = "todos";

/**
 * Converte URLs do YouTube ou Vimeo em links de embed para reprodução em loop contínuo
 */
function getEmbedUrl(rawUrl) {
  if (!rawUrl) return "";
  const trimmed = rawUrl.trim();

  // YouTube
  const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
  if (ytMatch) {
    const videoId = ytMatch[1];
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1`;
  }

  // Vimeo
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/i);
  if (vimeoMatch) {
    const vimeoId = vimeoMatch[1];
    return `https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1&loop=1&background=1&autopause=0`;
  }

  return trimmed;
}

/**
 * Renderização Completa do Site a partir dos Dados Dinâmicos
 */
function renderSiteFromData() {
  const data = typeof getSiteData === "function" ? getSiteData() : DEFAULT_SITE_DATA;

  // 1. Injetar Paleta de Cores e Estilo Visual (Estilo Wix)
  if (typeof applyThemeColors === "function" && data.theme) {
    applyThemeColors(data.theme);
  }

  // 2. Renderizar Capa Multimídia (Hero Section)
  const heroMediaContainer = document.getElementById("hero-media-container");
  if (heroMediaContainer && data.hero) {
    const mediaType = data.hero.mediaType || "image";

    if (mediaType === "video_local" && data.hero.videoUrl) {
      // Vídeo Local MP4/WebM
      const poster = data.hero.videoPoster || data.hero.imageUrl || "";
      heroMediaContainer.innerHTML = `
        <video class="hero-video" autoplay muted loop playsinline poster="${poster}">
          <source src="${data.hero.videoUrl}" type="video/mp4">
        </video>
      `;
    } else if (mediaType === "video_embed" && data.hero.videoEmbed) {
      // Vídeo Embed (YouTube ou Vimeo)
      const embedSrc = getEmbedUrl(data.hero.videoEmbed);
      heroMediaContainer.innerHTML = `
        <div class="hero-embed-wrapper">
          <iframe src="${embedSrc}" allow="autoplay; fullscreen" loading="lazy"></iframe>
        </div>
      `;
    } else {
      // Imagem Estática (Padrão)
      const imgUrl = data.hero.imageUrl || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2200&q=90";
      heroMediaContainer.innerHTML = `
        <div class="hero-image" style="background-image: url('${imgUrl}');"></div>
      `;
    }
  }

  // 3. Renderizar Textos do Hero
  if (data.hero) {
    const heroEyebrow = document.getElementById("hero-eyebrow-text");
    if (heroEyebrow) heroEyebrow.textContent = data.hero.eyebrow || "SELEÇÃO EXCLUSIVA";

    const heroTitle = document.getElementById("hero-title");
    if (heroTitle && data.hero.title) heroTitle.innerHTML = data.hero.title;

    const heroCopy = document.getElementById("hero-copy");
    if (heroCopy && data.hero.copy) heroCopy.textContent = data.hero.copy;

    const heroCtaBtn = document.getElementById("hero-cta-btn");
    if (heroCtaBtn) {
      heroCtaBtn.innerHTML = `${data.hero.ctaText || "Encontre seu novo lar"} <span aria-hidden="true">→</span>`;
      heroCtaBtn.href = data.hero.ctaLink || "#empreendimentos";
    }

    const heroHighlights = document.getElementById("hero-highlights");
    if (heroHighlights && Array.isArray(data.hero.highlights)) {
      heroHighlights.innerHTML = data.hero.highlights.map(h => `
        <span><strong>${h.num}</strong> ${h.text}</span>
      `).join("");
    }
  }

  // 4. Renderizar Contatos e Informações da Marca
  const phoneRaw = data.settings?.phoneRaw || "5541991080293";
  const phoneDisplay = data.settings?.phoneDisplay || "(41) 99108-0293";
  const email = data.settings?.email || "marciorogerio.corretor@gmail.com";
  const brokerName = data.settings?.brokerName || "MARCIO ROGÉRIO";
  const brokerMark = data.settings?.brokerMark || "MR";

  document.querySelectorAll(".wordmark-mark").forEach(el => el.textContent = brokerMark);
  document.querySelectorAll(".wordmark-name").forEach(el => {
    const parts = brokerName.split(" ");
    const first = parts[0] || "MARCIO";
    const rest = parts.slice(1).join(" ") || "ROGÉRIO";
    el.innerHTML = `${first} <strong>${rest}</strong>`;
  });

  const headerCta = document.querySelector(".header-cta");
  if (headerCta) headerCta.href = `https://wa.me/${phoneRaw}`;

  const footerPhone = document.querySelector(".phone-link");
  if (footerPhone) {
    footerPhone.href = `tel:+${phoneRaw}`;
    footerPhone.textContent = phoneDisplay;
  }

  const footerEmail = document.querySelector(".email-link");
  if (footerEmail) {
    footerEmail.href = `mailto:${email}`;
    footerEmail.textContent = email;
  }

  const btnMore = document.getElementById("btn-more-projects");
  if (btnMore) {
    btnMore.href = `https://wa.me/${phoneRaw}?text=${encodeURIComponent("Olá Marcio, quero conhecer outros empreendimentos disponíveis.")}`;
  }

  // 5. Renderizar Empreendimentos (Cards Imobiliários)
  const projectGrid = document.getElementById("projects-container") || document.querySelector(".project-grid");
  if (projectGrid && Array.isArray(data.projects)) {
    projectGrid.innerHTML = data.projects.map(project => {
      let tagClass = "status-tag";
      if (project.status === "obras") tagClass += " status-tag-dark";
      if (project.status === "pronto") tagClass += " status-tag-light";

      const refText = project.ref ? ` · REF: ${project.ref}` : '';
      const waMsg = encodeURIComponent(project.whatsappMessage || `Olá Marcio, quero saber mais sobre o ${project.name} (${project.ref || 'Ref: Site'})`);
      const waLink = `https://wa.me/${phoneRaw}?text=${waMsg}`;

      return `
        <article class="project-card" data-status="${project.status || 'lancamento'}">
          <a class="project-image-link mrj-open-lead-btn" href="#" data-project-id="${project.id}" aria-label="Ver detalhes de ${project.name}">
            <img src="${project.image}" alt="${project.name}" loading="lazy" />
            <span class="${tagClass}">${project.statusLabel || 'Lançamento'}</span>
            ${project.tagNote ? `<span class="image-note">${project.tagNote}</span>` : ''}
          </a>
          <div class="project-info">
            <p class="location"><span aria-hidden="true">⌖</span> ${project.location}${refText}</p>
            <h3>${project.name}</h3>
            <p class="project-description">${project.description || ''}</p>
            <dl class="project-stats">
              <div><dt>Área</dt><dd>${project.area || '-'}</dd></div>
              <div><dt>Suítes</dt><dd>${project.suites || '-'}</dd></div>
              <div><dt>Vagas</dt><dd>${project.vagas || '-'}</dd></div>
            </dl>
            <div class="project-actions">
              <a href="#" class="mrj-open-lead-btn" data-project-id="${project.id}">Conheça o projeto <span aria-hidden="true">→</span></a>
              <button class="favorite-button" type="button" aria-label="Favoritar ${project.name}" aria-pressed="false" data-favorite="${project.id}" data-name="${project.name}">♡</button>
            </div>
          </div>
        </article>
      `;
    }).join("");

    setupFavoriteButtons();
    setupLeadModalTriggers();
    setProjectFilter(activeFilter);
  }

  // 6. Renderizar Artigos / Blog
  const articleGrid = document.getElementById("articles-container") || document.querySelector(".article-grid");
  if (articleGrid && Array.isArray(data.articles)) {
    articleGrid.innerHTML = data.articles.map(art => `
      <article class="article-card">
        <a class="article-image" href="${art.link || '#contato'}" aria-label="Leia sobre ${art.title}">
          <img src="${art.image}" alt="${art.title}" loading="lazy" />
        </a>
        <div class="article-meta">
          <span>${art.category}</span>
          <time datetime="${art.datetime || ''}">${art.date}</time>
        </div>
        <h3><a href="${art.link || '#contato'}">${art.title}</a></h3>
        <p>${art.description}</p>
        <a class="article-link" href="${art.link || '#contato'}">Ler matéria <span aria-hidden="true">→</span></a>
      </article>
    `).join("");
  }
}

// ==============================================================================
// FILTROS & FAVORITOS
// ==============================================================================

const filterButtons = document.querySelectorAll(".filter-button");

function setProjectFilter(filter) {
  activeFilter = filter;
  const projectCards = document.querySelectorAll(".project-card");

  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === filter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  projectCards.forEach((card) => {
    card.hidden = filter !== "todos" && card.dataset.status !== filter;
  });
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => setProjectFilter(button.dataset.filter));
});

const filterNavBtn = document.querySelector("[data-filter-nav]");
if (filterNavBtn) {
  filterNavBtn.addEventListener("click", () => {
    setProjectFilter("lancamento");
  });
}

function setupFavoriteButtons() {
  document.querySelectorAll(".favorite-button").forEach((button) => {
    const key = `favorite-${button.dataset.favorite}`;
    const isFavorite = localStorage.getItem(key) === "true";

    button.setAttribute("aria-pressed", String(isFavorite));
    button.textContent = isFavorite ? "♥" : "♡";

    button.onclick = (e) => {
      e.preventDefault();
      const nextValue = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", String(nextValue));
      button.textContent = nextValue ? "♥" : "♡";
      localStorage.setItem(key, String(nextValue));
    };
  });
}

// ==============================================================================
// MODAL DE CAPTURA DE LEADS (DOWNLOAD DO BOOK / PDF)
// ==============================================================================

function setupLeadModalTriggers() {
  document.querySelectorAll(".mrj-open-lead-btn").forEach((link) => {
    link.onclick = (e) => {
      e.preventDefault();
      openLeadModal(link.dataset.projectId);
    };
  });
}

function openLeadModal(projectId) {
  const data = typeof getSiteData === "function" ? getSiteData() : DEFAULT_SITE_DATA;
  const project = data.projects.find((p) => p.id === projectId) || data.projects[0];
  const phoneRaw = data.settings?.phoneRaw || "5541991080293";

  const overlay = document.createElement("div");
  overlay.className = "mrj-lead-overlay";
  overlay.innerHTML = `
    <div class="mrj-lead-modal">
      <div class="mrj-lead-header">
        <button type="button" class="mrj-lead-close" aria-label="Fechar">✕</button>
        <span style="font-size:9px; color:#b49a70; font-weight:700; letter-spacing:0.12em; text-transform:uppercase;">APRESENTAÇÃO EXCLUSIVA</span>
        <h3>${project.name}</h3>
        <p>Preencha os dados abaixo para receber o book digital com plantas, diferenciais e valores.</p>
      </div>

      <div class="mrj-lead-body" id="mrj-lead-body-content">
        <form id="mrj-lead-form">
          <div class="mrj-lead-group">
            <label for="mrj-lead-name">Seu Nome Completo *</label>
            <input type="text" id="mrj-lead-name" class="mrj-lead-input" placeholder="Ex: João da Silva" required />
          </div>

          <div class="mrj-lead-group">
            <label for="mrj-lead-phone">WhatsApp com DDD *</label>
            <input type="tel" id="mrj-lead-phone" class="mrj-lead-input" placeholder="(11) 99999-9999" required />
          </div>

          <div class="mrj-lead-group">
            <label for="mrj-lead-email">E-mail para envio do Book</label>
            <input type="email" id="mrj-lead-email" class="mrj-lead-input" placeholder="seuemail@exemplo.com" />
          </div>

          <button type="submit" class="mrj-lead-submit" id="mrj-lead-submit-btn">
            <span>Acessar Book em PDF</span> <span>📥</span>
          </button>

          <div class="mrj-lead-security">
            <span>🔒</span> <span>Seus dados estão protegidos. Atendimento exclusivo e discreto.</span>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector(".mrj-lead-close").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  const form = overlay.querySelector("#mrj-lead-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = overlay.querySelector("#mrj-lead-submit-btn");
    btn.disabled = true;
    btn.innerHTML = `<span>Processando solicitação...</span>`;

    const name = overlay.querySelector("#mrj-lead-name").value.trim();
    const phone = overlay.querySelector("#mrj-lead-phone").value.trim();
    const email = overlay.querySelector("#mrj-lead-email").value.trim();

    const lead = {
      name,
      phone,
      email,
      project_id: project.id,
      project_name: project.name,
      created_at: new Date().toISOString()
    };

    if (typeof submitLead === "function") {
      await submitLead(lead);
    }

    if (project.pdfUrl) {
      window.open(project.pdfUrl, "_blank");
    }

    const bodyContent = overlay.querySelector("#mrj-lead-body-content");
    const zapMsg = encodeURIComponent(`Olá Marcio Rogério! Sou ${name}, acabei de solicitar o Book do ${project.name} no site e gostaria de mais detalhes.`);
    const zapDirect = `https://wa.me/${phoneRaw}?text=${zapMsg}`;

    bodyContent.innerHTML = `
      <div class="mrj-lead-success">
        <div style="font-size:36px; margin-bottom:8px; color:#10b981;">✓</div>
        <h4>Solicitação Recebida com Sucesso!</h4>
        <p style="margin-bottom:20px;">Obrigado, <strong>${name}</strong>. ${project.pdfUrl ? "O material foi aberto em nova aba." : "Nossa equipe já preparou a apresentação completa para você."}</p>
        
        <a href="${zapDirect}" target="_blank" rel="noreferrer" class="button button-gold" style="width:100%; box-sizing:border-box;">
          Conversar Agora no WhatsApp ↗
        </a>
      </div>
    `;
  });
}

// Menu Mobile
const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".primary-navigation");

if (menuToggle && navigation) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") !== "true";
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    navigation.classList.toggle("is-open", isOpen);
  });

  navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menuToggle.setAttribute("aria-expanded", "false");
      navigation.classList.remove("is-open");
    });
  });
}

// ==============================================================================
// INICIALIZAÇÃO & CARREGAMENTO DINÂMICO DO PAINEL
// ==============================================================================

document.addEventListener("DOMContentLoaded", async () => {
  renderSiteFromData();

  // Sincronizar com Supabase em segundo plano
  const currentData = typeof getSiteData === "function" ? getSiteData() : null;
  if (currentData && currentData.settings?.supabaseUrl && currentData.settings?.supabaseKey && typeof fetchSupabaseData === "function") {
    const remote = await fetchSupabaseData(currentData.settings.supabaseUrl, currentData.settings.supabaseKey);
    if (remote && (remote.projects || remote.hero || remote.theme)) {
      saveSiteData(remote);
      renderSiteFromData();
    }
  }

  // Detecção de acesso ao painel via ?painel ou ?admin
  const searchParams = new URLSearchParams(window.location.search);
  const isPainelRequested = searchParams.has("painel") || searchParams.has("admin");

  if (isPainelRequested) {
    const adminCss = document.createElement("link");
    adminCss.rel = "stylesheet";
    adminCss.href = "admin.css";
    document.head.appendChild(adminCss);

    const adminScript = document.createElement("script");
    adminScript.src = "admin.js";
    document.body.appendChild(adminScript);
  }
});
