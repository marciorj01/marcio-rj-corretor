// ==========================================================================
// RENDERIZAÇÃO PRINCIPAL DO SITE & CONTROLES
// ==========================================================================

let activeFilter = "todos";

// Função para renderizar o site completo com os dados atuais
function renderSiteFromData() {
  const data = typeof getSiteData === "function" ? getSiteData() : DEFAULT_SITE_DATA;

  // 1. Renderizar Hero
  const heroSection = document.querySelector(".hero");
  if (heroSection) {
    const heroImage = heroSection.querySelector(".hero-image");
    if (heroImage && data.hero?.image) {
      heroImage.style.backgroundImage = `url("${data.hero.image}")`;
    }

    const heroEyebrow = heroSection.querySelector(".eyebrow-light");
    if (heroEyebrow && data.hero?.eyebrow) {
      heroEyebrow.innerHTML = `<span class="eyebrow-line"></span> ${data.hero.eyebrow}`;
    }

    const heroTitle = heroSection.querySelector("#hero-title");
    if (heroTitle && data.hero?.title) {
      heroTitle.innerHTML = data.hero.title;
    }

    const heroCopy = heroSection.querySelector(".hero-copy");
    if (heroCopy && data.hero?.copy) {
      heroCopy.textContent = data.hero.copy;
    }

    const heroCta = heroSection.querySelector(".hero-content .button-gold");
    if (heroCta && data.hero?.ctaText) {
      heroCta.innerHTML = `${data.hero.ctaText} <span aria-hidden="true">→</span>`;
    }
  }

  // 2. Renderizar Contatos e Links de WhatsApp
  const phoneRaw = data.settings?.phoneRaw || "5541991080293";
  const phoneDisplay = data.settings?.phoneDisplay || "(41) 99108-0293";
  const email = data.settings?.email || "marciorogerio.corretor@gmail.com";
  const brokerName = data.settings?.brokerName || "MARCIO ROGÉRIO";
  const brokerMark = data.settings?.brokerMark || "MR";

  // Cabeçalho e Marca
  document.querySelectorAll(".wordmark-mark").forEach(el => el.textContent = brokerMark);
  document.querySelectorAll(".wordmark-name").forEach(el => {
    el.innerHTML = `${brokerName.replace(' ', ' <strong>')}</strong>`;
  });

  // Botão CTA do cabeçalho
  const headerCta = document.querySelector(".header-cta");
  if (headerCta) {
    headerCta.href = `https://wa.me/${phoneRaw}`;
  }

  // Rodapé
  const footerPhone = document.querySelector(".phone-link");
  if (footerPhone) {
    footerPhone.href = `tel:+${phoneRaw}`;
    footerPhone.textContent = phoneDisplay;
  }

  const footerEmail = document.querySelector(".footer-contact a[href^='mailto:']");
  if (footerEmail) {
    footerEmail.href = `mailto:${email}`;
    footerEmail.textContent = email;
  }

  // 3. Renderizar Empreendimentos
  const projectGrid = document.querySelector(".project-grid");
  if (projectGrid && Array.isArray(data.projects)) {
    projectGrid.innerHTML = data.projects.map(project => {
      let tagClass = "status-tag";
      if (project.status === "obras") tagClass += " status-tag-dark";
      if (project.status === "pronto") tagClass += " status-tag-light";

      const waMsg = encodeURIComponent(project.whatsappMessage || `Quero saber mais sobre o ${project.name}`);
      const waLink = `https://wa.me/${phoneRaw}?text=${waMsg}`;

      return `
        <article class="project-card" data-status="${project.status || 'lancamento'}">
          <a class="project-image-link" href="${waLink}" target="_blank" rel="noreferrer" aria-label="Saiba mais sobre ${project.name}">
            <img src="${project.image}" alt="${project.name}" loading="lazy" />
            <span class="${tagClass}">${project.statusLabel || 'Lançamento'}</span>
            ${project.tagNote ? `<span class="image-note">${project.tagNote}</span>` : ''}
          </a>
          <div class="project-info">
            <p class="location"><span aria-hidden="true">⌖</span> ${project.location}</p>
            <h3>${project.name}</h3>
            <p class="project-description">${project.description || ''}</p>
            <dl class="project-stats">
              <div><dt>Área</dt><dd>${project.area || '-'}</dd></div>
              <div><dt>Suítes</dt><dd>${project.suites || '-'}</dd></div>
              <div><dt>Vagas</dt><dd>${project.vagas || '-'}</dd></div>
            </dl>
            <div class="project-actions">
              <a href="${waLink}" class="mrj-open-lead-btn" data-project-id="${project.id}">Conheça o projeto <span aria-hidden="true">→</span></a>
              <button class="favorite-button" type="button" aria-label="Adicionar ${project.name} aos favoritos" aria-pressed="false" data-favorite="${project.id}" data-name="${project.name}">♡</button>
            </div>
          </div>
        </article>
      `;
    }).join("");

    // Reconectar eventos de favoritos e aplicar filtro ativo
    setupFavoriteButtons();
    setupLeadModalTriggers();
    setProjectFilter(activeFilter);
  }

  // 4. Renderizar Artigos
  const articleGrid = document.querySelector(".article-grid");
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

// ==========================================================================
// FILTROS & FAVORITOS
// ==========================================================================

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
    if (isFavorite) {
      button.setAttribute("aria-label", `Remover ${button.dataset.name} dos favoritos`);
    }

    button.onclick = (e) => {
      e.preventDefault();
      const nextValue = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", String(nextValue));
      button.textContent = nextValue ? "♥" : "♡";
      button.setAttribute(
        "aria-label",
        `${nextValue ? "Remover" : "Adicionar"} ${button.dataset.name} ${nextValue ? "dos" : "aos"} favoritos`,
      );
      localStorage.setItem(key, String(nextValue));
    };
  });
}

// ==========================================================================
// MODAL DE CAPTURA DE LEADS (DOWNLOAD DO BOOK / PDF)
// ==========================================================================

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

  // Fechar modal
  overlay.querySelector(".mrj-lead-close").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  // Enviar Lead
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

    // Se houver PDF cadastrado, abre em nova aba
    if (project.pdfUrl) {
      window.open(project.pdfUrl, "_blank");
    }

    // Tela de sucesso
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
    menuToggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
    navigation.classList.toggle("is-open", isOpen);
  });

  navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Abrir menu");
      navigation.classList.remove("is-open");
    });
  });
}

// ==========================================================================
// DETECÇÃO DO PAINEL OCULTO (?painel ou ?admin)
// ==========================================================================

document.addEventListener("DOMContentLoaded", async () => {
  // Renderizar o site inicialmente com dados locais
  renderSiteFromData();

  // Sincronizar com Supabase em segundo plano se configurado
  const currentData = typeof getSiteData === "function" ? getSiteData() : null;
  if (currentData && currentData.settings?.supabaseUrl && currentData.settings?.supabaseKey && typeof fetchSupabaseData === "function") {
    const remote = await fetchSupabaseData(currentData.settings.supabaseUrl, currentData.settings.supabaseKey);
    if (remote && remote.projects) {
      saveSiteData(remote);
      renderSiteFromData();
    }
  }

  // Se a URL contiver '?painel' ou '?admin', carregar dinamicamente o painel administrativo
  const searchParams = new URLSearchParams(window.location.search);
  const isPainelRequested = searchParams.has("painel") || searchParams.has("admin");

  if (isPainelRequested) {
    // Carregar CSS do Admin
    const adminCss = document.createElement("link");
    adminCss.rel = "stylesheet";
    adminCss.href = "admin.css";
    document.head.appendChild(adminCss);

    // Carregar JS do Admin
    const adminScript = document.createElement("script");
    adminScript.src = "admin.js";
    document.body.appendChild(adminScript);
  }
});
