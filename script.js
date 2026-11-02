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
              <a href="${waLink}" target="_blank" rel="noreferrer">Conheça o projeto <span aria-hidden="true">→</span></a>
              <button class="favorite-button" type="button" aria-label="Adicionar ${project.name} aos favoritos" aria-pressed="false" data-favorite="${project.id}" data-name="${project.name}">♡</button>
            </div>
          </div>
        </article>
      `;
    }).join("");

    // Reconectar eventos de favoritos e aplicar filtro ativo
    setupFavoriteButtons();
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
