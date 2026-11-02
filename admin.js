// ==============================================================================
// MRJ CMS - PAINEL ADMINISTRATIVO MODULAR ESTILO WIX (LIVE CUSTOMIZER)
// ==============================================================================

(function() {
  let siteData = getSiteData();
  let isVisualModeActive = false;
  const AUTH_KEY = "mrj_admin_auth_v2";

  function isAuthenticated() {
    return sessionStorage.getItem(AUTH_KEY) === "true" || localStorage.getItem(AUTH_KEY) === "true";
  }

  function setAuthenticated(remember) {
    if (remember) localStorage.setItem(AUTH_KEY, "true");
    sessionStorage.setItem(AUTH_KEY, "true");
  }

  function logout() {
    sessionStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(AUTH_KEY);
    // Se existir logout.php (em servidor PHP), redireciona para lá
    fetch("logout.php").finally(() => {
      window.location.href = window.location.pathname;
    });
  }

  function showToast(message, isSuccess = true) {
    const existing = document.querySelector(".mrj-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = "mrj-toast";
    toast.style.borderColor = isSuccess ? "var(--admin-success, #10b981)" : "var(--admin-danger, #ef4444)";
    toast.innerHTML = `<span>${isSuccess ? "✓" : "⚠"}</span> <div>${message}</div>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(20px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Upload seguro para o servidor (salvar.php ou Supabase Storage)
  async function uploadMediaFile(file) {
    // 1. Tenta enviar para salvar.php (se houver PHP no servidor)
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("salvar.php", {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.url) {
          return json.url;
        }
      }
    } catch (e) {
      // Ignora e tenta Supabase
    }

    // 2. Se falhar ou estiver no Netlify, envia para Supabase Storage
    const supUrl = siteData.settings?.supabaseUrl;
    const supKey = siteData.settings?.supabaseKey;
    if (supUrl && supKey) {
      const isVideo = file.type.startsWith("video/");
      const isPdf = file.type === "application/pdf";
      const bucket = isPdf ? "documentos" : (isVideo ? "videos" : "imoveis");

      const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const endpoint = `${supUrl.replace(/\/$/, '')}/storage/v1/object/${bucket}/${safeName}`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "apikey": supKey,
          "Authorization": `Bearer ${supKey}`,
          "Content-Type": file.type
        },
        body: file
      });

      if (res.ok) {
        return `${supUrl.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${safeName}`;
      }
    }

    // 3. Fallback: DataURL para imagens
    if (file.type.startsWith("image/")) {
      return await compressImage(file, 1800, 0.85);
    }

    throw new Error("Não foi possível realizar o upload. Verifique as credenciais do Supabase ou o servidor PHP.");
  }

  // Compressão e preservação de transparência no navegador
  function compressImage(file, maxWidth = 1600, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const isTransparentFormat = file.type === "image/png" || file.type === "image/svg+xml" || file.type === "image/webp";

      // Para imagens com transparência (como logomarcas PNG ou SVG) até 3MB, mantém o arquivo original intacto
      if (isTransparentFormat && file.size < 3 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // NUNCA converte PNG para JPEG para não criar fundo preto
          if (isTransparentFormat) {
            resolve(canvas.toDataURL("image/png"));
          } else {
            resolve(canvas.toDataURL("image/jpeg", quality));
          }
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  }

  // Modal de Login
  function renderLoginModal() {
    const overlay = document.createElement("div");
    overlay.className = "mrj-modal-overlay";
    overlay.innerHTML = `
      <div class="mrj-modal" style="max-width: 420px; text-align: center; padding: 36px 30px;">
        <div style="width: 44px; height: 44px; margin: 0 auto 16px; display: grid; place-items: center; border: 1px solid var(--admin-gold); color: var(--admin-gold); font: 700 15px Georgia, serif;">MR</div>
        <h2 style="font-family:'Manrope',sans-serif; font-size:20px; font-weight:700; margin-bottom:8px; color:#fff;">Painel do Corretor</h2>
        <p style="color:#94a3b8; font-size:13px; margin-bottom:24px;">Área restrita de gestão visual e imobiliária (MRJ CMS).</p>

        <form id="mrj-login-form">
          <div class="mrj-input-group">
            <label for="mrj-pass" style="color:var(--admin-gold);">Senha Master</label>
            <input type="password" id="mrj-pass" class="mrj-input" placeholder="Digite sua senha..." autocomplete="current-password" autofocus required />
          </div>

          <div style="display:flex; align-items:center; gap:8px; margin-bottom:20px; text-align:left;">
            <input type="checkbox" id="mrj-remember" style="accent-color:var(--admin-gold); cursor:pointer;" />
            <label for="mrj-remember" style="font-size:12px; color:#94a3b8; cursor:pointer; margin:0;">Lembrar neste navegador</label>
          </div>

          <button type="submit" class="mrj-btn mrj-btn-gold" style="width:100%;">Entrar no Painel →</button>
        </form>

        <p style="font-size:11px; color:#64748b; margin-top:20px;">Senha padrão: <strong>mrj@2025</strong></p>
      </div>
    `;

    document.body.appendChild(overlay);

    const form = overlay.querySelector("#mrj-login-form");
    const passInput = overlay.querySelector("#mrj-pass");
    const rememberCheckbox = overlay.querySelector("#mrj-remember");

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const entered = passInput.value.trim();
      const currentPass = siteData.settings.adminPasswordHash || "mrj@2025";

      if (entered === currentPass) {
        setAuthenticated(rememberCheckbox.checked);
        overlay.remove();
        initAdminInterface();
        showToast("Bem-vindo ao Painel MRJ CMS Builder!");
      } else {
        passInput.style.borderColor = "#ef4444";
        passInput.value = "";
        passInput.placeholder = "Senha incorreta! Tente novamente.";
        passInput.focus();
      }
    });
  }

  // Inicializa a Toolbar do Elementor / Wix
  function initAdminInterface() {
    if (document.body.classList.contains("mrj-admin-standalone")) {
      openGeneralModal("tab-theme");
      return;
    }

    document.body.classList.add("mrj-admin-active");

    const bar = document.createElement("div");
    bar.className = "mrj-admin-bar";
    bar.innerHTML = `
      <div class="mrj-admin-brand">
        <span class="mrj-badge-builder">MRJ CMS</span>
        <div class="mrj-admin-status">
          <span class="mrj-status-dot"></span>
          <span>Modo Visual Ativo</span>
        </div>
      </div>

      <div class="mrj-admin-actions">
        <button type="button" class="mrj-bar-btn" id="mrj-bar-branding">
          <span>🏷️</span> Logo & Menu
        </button>
        <button type="button" class="mrj-bar-btn" id="mrj-bar-theme">
          <span>🎨</span> Cores & Tema
        </button>
        <button type="button" class="mrj-bar-btn" id="mrj-bar-hero">
          <span>🎬</span> Vídeo & Capa
        </button>
        <button type="button" class="mrj-bar-btn" id="mrj-bar-new-proj">
          <span>➕</span> Novo Imóvel
        </button>
        <button type="button" class="mrj-bar-btn" id="mrj-bar-manage">
          <span>⚙️</span> Painel Completo
        </button>
        <button type="button" class="mrj-bar-btn mrj-bar-btn-save" id="mrj-bar-save">
          <span>💾</span> Publicar
        </button>
        <button type="button" class="mrj-bar-btn mrj-bar-btn-exit" id="mrj-bar-logout" title="Sair do modo administrador">
          <span>✕</span> Sair
        </button>
      </div>
    `;

    document.body.prepend(bar);

    bar.querySelector("#mrj-bar-branding").addEventListener("click", () => openGeneralModal("tab-branding"));
    bar.querySelector("#mrj-bar-theme").addEventListener("click", () => openGeneralModal("tab-theme"));
    bar.querySelector("#mrj-bar-hero").addEventListener("click", () => openGeneralModal("tab-hero"));
    bar.querySelector("#mrj-bar-new-proj").addEventListener("click", () => openProjectModal(null));
    bar.querySelector("#mrj-bar-manage").addEventListener("click", () => openGeneralModal("tab-projects"));
    bar.querySelector("#mrj-bar-save").addEventListener("click", () => publishAllChanges());
    bar.querySelector("#mrj-bar-logout").addEventListener("click", () => {
      if (confirm("Deseja sair do painel de administração?")) {
        logout();
      }
    });
  }

  // Modal Geral de Controle (Wix Customizer)
  function openGeneralModal(defaultTab = "tab-projects") {
    const existing = document.querySelector(".mrj-modal-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.className = "mrj-modal-overlay";
    overlay.innerHTML = `
      <div class="mrj-modal">
        <div class="mrj-modal-header">
          <h3>⚙️ MRJ CMS Builder — Personalizador Visual</h3>
          <button type="button" class="mrj-modal-close">✕</button>
        </div>

        <div class="mrj-tabs-bar">
          <button type="button" class="mrj-tab-btn ${defaultTab === 'tab-branding' ? 'active' : ''}" data-target="tab-branding">🏷️ Logomarca & Menu</button>
          <button type="button" class="mrj-tab-btn ${defaultTab === 'tab-theme' ? 'active' : ''}" data-target="tab-theme">🎨 Cores & Design</button>
          <button type="button" class="mrj-tab-btn ${defaultTab === 'tab-hero' ? 'active' : ''}" data-target="tab-hero">🎬 Capa Multimídia (Vídeo/Foto)</button>
          <button type="button" class="mrj-tab-btn ${defaultTab === 'tab-projects' ? 'active' : ''}" data-target="tab-projects">🏢 Imóveis (${siteData.projects.length})</button>
          <button type="button" class="mrj-tab-btn ${defaultTab === 'tab-leads' ? 'active' : ''}" data-target="tab-leads">📥 Leads Capturados</button>
          <button type="button" class="mrj-tab-btn ${defaultTab === 'tab-articles' ? 'active' : ''}" data-target="tab-articles">📰 Blog & Notícias</button>
          <button type="button" class="mrj-tab-btn ${defaultTab === 'tab-contacts' ? 'active' : ''}" data-target="tab-contacts">📞 Contatos & WhatsApp</button>
          <button type="button" class="mrj-tab-btn ${defaultTab === 'tab-cloud' ? 'active' : ''}" data-target="tab-cloud">⚡ Servidor & Nuvem</button>
        </div>

        <div class="mrj-modal-body">
          <!-- ABA 0: LOGOMARCA & MENU DE NAVEGAÇÃO -->
          <div class="mrj-tab-content ${defaultTab === 'tab-branding' ? 'active' : ''}" id="tab-branding">
            <h4 style="margin:0 0 6px; color:#fff; font-size:14px;">Personalização da Logomarca</h4>
            <p style="font-size:13px; color:#94a3b8; margin-top:0;">Escolha se deseja exibir a imagem da sua logomarca ou seu nome/sigla estilizado.</p>

            <div class="mrj-form-grid" style="margin-bottom:20px;">
              <div class="mrj-form-full">
                <label style="display:block; margin-bottom:10px; font-weight:600; font-size:12px; color:#e2e8f0;">Formato do Logotipo:</label>
                <div style="display:flex; gap:24px;">
                  <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                    <input type="radio" name="logo-type-radio" value="text" ${siteData.settings.logoType !== 'image' ? 'checked' : ''} />
                    <span>Texto / Nome do Corretor</span>
                  </label>
                  <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                    <input type="radio" name="logo-type-radio" value="image" ${siteData.settings.logoType === 'image' ? 'checked' : ''} />
                    <span>Imagem da Minha Logomarca</span>
                  </label>
                </div>
              </div>

              <!-- Opção Imagem -->
              <div class="mrj-form-full" id="box-logo-image" style="display:${siteData.settings.logoType === 'image' ? 'block' : 'none'};">
                <div class="mrj-input-group">
                  <label>Enviar Imagem da Logo (PNG, SVG, WebP ou JPG)</label>
                  <div style="display:flex; gap:10px; align-items:center;">
                    <input type="file" id="file-logo-upload" accept="image/*" style="display:none;" />
                    <button type="button" class="mrj-btn mrj-btn-gold" id="btn-trigger-logo-upload" style="width:auto;">📁 Escolher Imagem</button>
                    <input type="text" id="val-logo-image-url" class="mrj-input" placeholder="Ou cole a URL da imagem..." value="${siteData.settings.logoImage || ''}" style="flex:1;" />
                  </div>
                  <div class="mrj-input-group" style="margin-top:14px;">
                    <label style="display:flex; justify-content:space-between; align-items:center;">
                      <span>Tamanho / Altura da Logomarca no Topo:</span>
                      <strong id="val-logo-height-disp" style="color:var(--admin-gold); font-size:13px;">${siteData.settings.logoHeight || 52}px</strong>
                    </label>
                    <input type="range" id="val-logo-height" min="32" max="80" step="2" value="${siteData.settings.logoHeight || 52}" style="width:100%; cursor:pointer;" />
                    <span style="font-size:11px; color:#94a3b8; display:block; margin-top:4px;">💡 Ajuste o tamanho da sua logo para ficar grande e nítida no cabeçalho (recomendado: 50px a 68px).</span>
                  </div>
                  <div id="logo-preview-box" style="margin-top:12px; padding:16px; background:#0f1115; border-radius:6px; display:${siteData.settings.logoImage ? 'block' : 'none'}; text-align:center;">
                    <span style="font-size:11px; color:#94a3b8; display:block; margin-bottom:8px;">Pré-visualização:</span>
                    <img id="logo-preview-img" src="${siteData.settings.logoImage || ''}" style="max-height:${siteData.settings.logoHeight || 52}px; max-width:280px; object-fit:contain; background:transparent;" />
                  </div>
                </div>
              </div>

              <!-- Opção Texto -->
              <div class="mrj-form-full" id="box-logo-text" style="display:${siteData.settings.logoType !== 'image' ? 'block' : 'none'};">
                <div class="mrj-form-grid">
                  <div>
                    <div class="mrj-input-group">
                      <label>Sigla do Selo (Ex: MR, JS)</label>
                      <input type="text" id="val-broker-mark" class="mrj-input" value="${siteData.settings.brokerMark || 'MR'}" maxlength="4" />
                    </div>
                  </div>
                  <div>
                    <div class="mrj-input-group">
                      <label>Nome do Corretor / Imobiliária</label>
                      <input type="text" id="val-broker-name" class="mrj-input" value="${siteData.settings.brokerName || 'MARCIO ROGÉRIO'}" placeholder="MARCIO ROGÉRIO" />
                    </div>
                  </div>
                  <div class="mrj-form-full">
                    <div class="mrj-input-group">
                      <label>Registro Profissional / CRECI</label>
                      <input type="text" id="val-broker-creci" class="mrj-input" value="${siteData.settings.creci || ''}" placeholder="Ex: CRECI 12345-F / PR" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <hr style="border:none; border-top:1px solid #334155; margin:24px 0;" />

            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:10px;">
              <div>
                <h4 style="margin:0 0 4px; color:#fff; font-size:14px;">Barra de Menu de Navegação</h4>
                <p style="font-size:12px; color:#94a3b8; margin:0;">Adicione, altere ou exclua qualquer link do menu com facilidade.</p>
              </div>
              <button type="button" class="mrj-btn-small" id="btn-add-menu-link" style="background:var(--admin-gold); border-color:var(--admin-gold); color:#fff; width:auto; font-weight:700;">➕ Adicionar Link no Menu</button>
            </div>

            <!-- Sugestões de Atalhos Rápidos -->
            <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px; align-items:center;">
              <span style="font-size:11px; color:#64748b;">Atalhos rápidos:</span>
              <button type="button" class="btn-preset-menu mrj-btn-small" data-label="Início" data-url="#inicio" style="padding:3px 8px; font-size:10px;">+ Início</button>
              <button type="button" class="btn-preset-menu mrj-btn-small" data-label="Empreendimentos" data-url="#empreendimentos" style="padding:3px 8px; font-size:10px;">+ Empreendimentos</button>
              <button type="button" class="btn-preset-menu mrj-btn-small" data-label="Conteúdos" data-url="#conteudos" style="padding:3px 8px; font-size:10px;">+ Conteúdos</button>
              <button type="button" class="btn-preset-menu mrj-btn-small" data-label="Contato" data-url="#contato" style="padding:3px 8px; font-size:10px;">+ Contato</button>
              <button type="button" class="btn-preset-menu mrj-btn-small" data-label="WhatsApp" data-url="https://wa.me/${siteData.settings.phoneRaw}" style="padding:3px 8px; font-size:10px;">+ WhatsApp</button>
            </div>

            <div id="admin-menu-links-list" style="display:flex; flex-direction:column; gap:8px; margin-bottom:20px;">
              <!-- Itens do menu gerados dinamicamente -->
            </div>

            <hr style="border:none; border-top:1px solid #334155; margin:24px 0;" />

            <h4 style="margin:0 0 6px; color:#fff; font-size:14px;">Botão de Destaque no Canto Direito</h4>
            <p style="font-size:12px; color:#94a3b8; margin-top:0;">Você pode remover esse botão da direita para o menu ficar 100% limpo, ou personalizá-lo.</p>

            <div style="background:#14151a; border:1px solid #282b36; border-radius:6px; padding:14px; margin-bottom:10px;">
              <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-weight:600; font-size:13px; color:#fff;">
                <input type="checkbox" id="chk-show-header-cta" ${siteData.settings.showHeaderCta ? 'checked' : ''} style="width:18px; height:18px; cursor:pointer;" />
                <span>Exibir botão de destaque no canto direito ("Fale comigo")</span>
              </label>
              <div id="box-header-cta-text" style="display:${siteData.settings.showHeaderCta ? 'block' : 'none'}; margin-top:12px;">
                <div class="mrj-input-group">
                  <label>Texto do Botão</label>
                  <input type="text" id="val-header-cta-text" class="mrj-input" value="${siteData.settings.headerCtaText || 'Fale comigo'}" placeholder="Ex: Fale comigo, Agendar Visita..." />
                </div>
              </div>
            </div>
          </div>

          <!-- ABA 1: CORES & DESIGN (ESTILO WIX) -->
          <div class="mrj-tab-content ${defaultTab === 'tab-theme' ? 'active' : ''}" id="tab-theme">
            <p style="font-size:13px; color:#94a3b8; margin-top:0;">Altere as cores principais com pré-visualização instantânea no site.</p>
            
            <div class="mrj-form-grid">
              <div class="mrj-input-group">
                <label>Cor Primária (Destaques, Botões e Selos)</label>
                <div class="mrj-color-row">
                  <input type="color" class="mrj-color-picker" id="color-primary" value="${siteData.theme?.primaryColor || '#b49a70'}" />
                  <input type="text" class="mrj-color-hex" id="hex-primary" value="${siteData.theme?.primaryColor || '#b49a70'}" />
                </div>
              </div>

              <div class="mrj-input-group">
                <label>Cor Primária Hover (Passar o Mouse)</label>
                <div class="mrj-color-row">
                  <input type="color" class="mrj-color-picker" id="color-primary-hover" value="${siteData.theme?.primaryHover || '#9c8058'}" />
                  <input type="text" class="mrj-color-hex" id="hex-primary-hover" value="${siteData.theme?.primaryHover || '#9c8058'}" />
                </div>
              </div>

              <div class="mrj-input-group">
                <label>Cor do Cabeçalho / Navbar</label>
                <div class="mrj-color-row">
                  <input type="color" class="mrj-color-picker" id="color-header" value="${siteData.theme?.headerBg || '#ffffff'}" />
                  <input type="text" class="mrj-color-hex" id="hex-header" value="${siteData.theme?.headerBg || '#ffffff'}" />
                </div>
              </div>

              <div class="mrj-input-group">
                <label>Cor do Rodapé (Footer)</label>
                <div class="mrj-color-row">
                  <input type="color" class="mrj-color-picker" id="color-footer" value="${siteData.theme?.footerBg || '#f5eee6'}" />
                  <input type="text" class="mrj-color-hex" id="hex-footer" value="${siteData.theme?.footerBg || '#f5eee6'}" />
                </div>
              </div>

              <div class="mrj-input-group">
                <label>Cor dos Textos Principais</label>
                <div class="mrj-color-row">
                  <input type="color" class="mrj-color-picker" id="color-text-pri" value="${siteData.theme?.textPrimary || '#202126'}" />
                  <input type="text" class="mrj-color-hex" id="hex-text-pri" value="${siteData.theme?.textPrimary || '#202126'}" />
                </div>
              </div>

              <div class="mrj-input-group">
                <label>Cor dos Textos Secundários / Apoio</label>
                <div class="mrj-color-row">
                  <input type="color" class="mrj-color-picker" id="color-text-sec" value="${siteData.theme?.textSecondary || '#73716d'}" />
                  <input type="text" class="mrj-color-hex" id="hex-text-sec" value="${siteData.theme?.textSecondary || '#73716d'}" />
                </div>
              </div>

              <div class="mrj-form-full">
                <div class="mrj-input-group">
                  <label>Opacidade da Máscara Escura da Capa (Hero Overlay)</label>
                  <div class="mrj-slider-row">
                    <input type="range" class="mrj-slider" id="slider-hero-opacity" min="0" max="1" step="0.05" value="${siteData.theme?.heroOverlayOpacity !== undefined ? siteData.theme.heroOverlayOpacity : 0.45}" />
                    <span class="mrj-slider-value" id="val-hero-opacity">${Math.round((siteData.theme?.heroOverlayOpacity !== undefined ? siteData.theme.heroOverlayOpacity : 0.45) * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ABA 2: CAPA MULTIMÍDIA (VÍDEO / FOTO) -->
          <div class="mrj-tab-content ${defaultTab === 'tab-hero' ? 'active' : ''}" id="tab-hero">
            <div class="mrj-input-group">
              <label>Formato da Mídia Principal</label>
              <div class="mrj-media-type-selector">
                <div class="mrj-media-radio-card ${(!siteData.hero.mediaType || siteData.hero.mediaType === 'image') ? 'active' : ''}" data-type="image">
                  <span class="mrj-media-icon">🖼️</span>
                  <span class="mrj-media-label">Foto de Alta Resolução</span>
                  <span class="mrj-media-sub">JPG, PNG ou WebP</span>
                </div>
                <div class="mrj-media-radio-card ${siteData.hero.mediaType === 'video_local' ? 'active' : ''}" data-type="video_local">
                  <span class="mrj-media-icon">🎬</span>
                  <span class="mrj-media-label">Vídeo em Loop (Arquivo)</span>
                  <span class="mrj-media-sub">Upload de MP4 / WebM</span>
                </div>
                <div class="mrj-media-radio-card ${siteData.hero.mediaType === 'video_embed' ? 'active' : ''}" data-type="video_embed">
                  <span class="mrj-media-icon">📺</span>
                  <span class="mrj-media-label">Vídeo YouTube / Vimeo</span>
                  <span class="mrj-media-sub">Link de vídeo online</span>
                </div>
              </div>
            </div>

            <!-- Bloco 1: Imagem -->
            <div id="hero-block-image" style="display:${(!siteData.hero.mediaType || siteData.hero.mediaType === 'image') ? 'block' : 'none'};">
              <div class="mrj-upload-box">
                <input type="file" id="hero-img-file" accept="image/*" style="display:none;" />
                <img id="hero-img-preview" src="${siteData.hero.imageUrl}" class="mrj-upload-preview" alt="Preview Capa" />
                <div style="display:flex; gap:8px; justify-content:center; margin-top:12px;">
                  <button type="button" class="mrj-btn-small" id="btn-upload-hero-img">📷 Enviar Imagem do PC</button>
                  <button type="button" class="mrj-btn-small" id="btn-url-hero-img">🔗 Colar Link de Imagem</button>
                </div>
                <input type="hidden" id="val-hero-image" value="${siteData.hero.imageUrl}" />
              </div>
            </div>

            <!-- Bloco 2: Vídeo Local MP4 -->
            <div id="hero-block-video-local" style="display:${siteData.hero.mediaType === 'video_local' ? 'block' : 'none'};">
              <div class="mrj-input-group">
                <label>Arquivo de Vídeo MP4 (Reprodução Automática em Loop)</label>
                <div style="display:flex; gap:8px;">
                  <input type="text" id="val-hero-video-url" class="mrj-input" value="${siteData.hero.videoUrl || ''}" placeholder="URL do vídeo MP4 ou envie ao lado →" />
                  <input type="file" id="hero-video-file" accept="video/mp4,video/webm" style="display:none;" />
                  <button type="button" class="mrj-btn-small" id="btn-upload-hero-video" style="white-space:nowrap;">📁 Subir Vídeo MP4</button>
                </div>
                <small style="color:#94a3b8; font-size:11px;">Recomendado: MP4 sem áudio ou silencioso para reprodução em loop contínuo.</small>
              </div>

              <div class="mrj-input-group" style="margin-top:14px;">
                <label>Imagem de Pôster (Fallback para celulares ou carregamento lento)</label>
                <div style="display:flex; gap:8px;">
                  <input type="text" id="val-hero-video-poster" class="mrj-input" value="${siteData.hero.videoPoster || ''}" placeholder="URL da foto estática de capa" />
                  <input type="file" id="hero-poster-file" accept="image/*" style="display:none;" />
                  <button type="button" class="mrj-btn-small" id="btn-upload-hero-poster" style="white-space:nowrap;">📷 Subir Pôster</button>
                </div>
              </div>
            </div>

            <!-- Bloco 3: Vídeo Embed YouTube / Vimeo -->
            <div id="hero-block-video-embed" style="display:${siteData.hero.mediaType === 'video_embed' ? 'block' : 'none'};">
              <div class="mrj-input-group">
                <label>Link do Vídeo no YouTube ou Vimeo</label>
                <input type="url" id="val-hero-video-embed" class="mrj-input" value="${siteData.hero.videoEmbed || ''}" placeholder="Ex: https://www.youtube.com/watch?v=XXXXX ou https://vimeo.com/XXXXX" />
                <small style="color:#94a3b8; font-size:11px;">O vídeo será exibido em tela cheia na proporção 16:9, sem botões de controle para manter a elegância do site.</small>
              </div>
            </div>

            <hr style="border:none; border-top:1px solid var(--admin-border); margin:24px 0;" />

            <!-- Textos do Hero -->
            <div class="mrj-form-grid">
              <div>
                <div class="mrj-input-group">
                  <label>Etiqueta Superior</label>
                  <input type="text" id="val-hero-eyebrow" class="mrj-input" value="${siteData.hero.eyebrow || 'SELEÇÃO EXCLUSIVA'}" />
                </div>
              </div>

              <div>
                <div class="mrj-input-group">
                  <label>Texto do Botão CTA</label>
                  <input type="text" id="val-hero-cta" class="mrj-input" value="${siteData.hero.ctaText || 'Encontre seu novo lar'}" />
                </div>
              </div>

              <div class="mrj-form-full">
                <div class="mrj-input-group">
                  <label>Título Principal (use &lt;em&gt; para destaque dourado)</label>
                  <input type="text" id="val-hero-title" class="mrj-input" value="${siteData.hero.title || ''}" />
                </div>
              </div>

              <div class="mrj-form-full">
                <div class="mrj-input-group">
                  <label>Subtítulo Persuasivo</label>
                  <textarea id="val-hero-copy" class="mrj-input">${siteData.hero.copy || ''}</textarea>
                </div>
              </div>
            </div>
          </div>

          <!-- ABA 3: IMÓVEIS -->
          <div class="mrj-tab-content ${defaultTab === 'tab-projects' ? 'active' : ''}" id="tab-projects">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <span style="font-size:13px; color:#94a3b8;">Gerencie a ordem e os dados dos seus empreendimentos.</span>
              <button type="button" class="mrj-btn mrj-btn-gold" id="btn-new-project-tab" style="width:auto; padding:8px 14px; font-size:11px;">+ Novo Imóvel</button>
            </div>
            <div id="admin-projects-list">
              ${renderProjectsListHtml()}
            </div>
          </div>

          <!-- ABA 4: LEADS CAPTURADOS -->
          <div class="mrj-tab-content ${defaultTab === 'tab-leads' ? 'active' : ''}" id="tab-leads">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
              <div>
                <h4 style="margin:0 0 4px; color:#fff; font-size:14px;">Contatos que solicitaram Books / PDFs</h4>
                <span style="font-size:11px; color:#94a3b8;">Registrados automaticamente quando clicam em 'Conheça o projeto'.</span>
              </div>
              <div style="display:flex; gap:8px;">
                <button type="button" class="mrj-btn-small" id="btn-refresh-leads">🔄 Atualizar</button>
                <button type="button" class="mrj-btn-small" id="btn-export-leads" style="background:var(--admin-success); border-color:var(--admin-success);">📊 Baixar Excel/CSV</button>
              </div>
            </div>
            <div id="admin-leads-container">
              <p style="text-align:center; color:#94a3b8; padding:30px;">Carregando contatos...</p>
            </div>
          </div>

          <!-- ABA 5: ARTIGOS & BLOG -->
          <div class="mrj-tab-content ${defaultTab === 'tab-articles' ? 'active' : ''}" id="tab-articles">
            <p style="font-size:13px; color:#94a3b8; margin-top:0;">Edite as matérias em destaque na seção 'Leia Helbor'.</p>
            <div id="admin-articles-list">
              ${renderArticlesListHtml()}
            </div>
          </div>

          <!-- ABA 6: CONTATOS -->
          <div class="mrj-tab-content ${defaultTab === 'tab-contacts' ? 'active' : ''}" id="tab-contacts">
            <div class="mrj-form-grid">
              <div>
                <div class="mrj-input-group">
                  <label>Nome do Corretor / Marca</label>
                  <input type="text" id="val-conf-name" class="mrj-input" value="${siteData.settings.brokerName}" />
                </div>
              </div>
              <div>
                <div class="mrj-input-group">
                  <label>Sigla da Logo (2 letras)</label>
                  <input type="text" id="val-conf-mark" class="mrj-input" value="${siteData.settings.brokerMark}" maxlength="4" />
                </div>
              </div>
              <div>
                <div class="mrj-input-group">
                  <label>WhatsApp / Telefone para Exibição</label>
                  <input type="text" id="val-conf-phone-disp" class="mrj-input" value="${siteData.settings.phoneDisplay}" />
                </div>
              </div>
              <div>
                <div class="mrj-input-group">
                  <label>Número do WhatsApp (com DDD, apenas dígitos)</label>
                  <input type="text" id="val-conf-phone-raw" class="mrj-input" value="${siteData.settings.phoneRaw}" />
                </div>
              </div>
              <div class="mrj-form-full">
                <div class="mrj-input-group">
                  <label>E-mail de Atendimento</label>
                  <input type="email" id="val-conf-email" class="mrj-input" value="${siteData.settings.email}" />
                </div>
              </div>
              <div class="mrj-form-full">
                <div class="mrj-input-group">
                  <label>Senha Master de Acesso (?painel)</label>
                  <input type="text" id="val-conf-pass" class="mrj-input" value="${siteData.settings.adminPasswordHash || 'mrj@2025'}" />
                </div>
              </div>
            </div>
          </div>

          <!-- ABA 7: SERVIDOR & NUVEM -->
          <div class="mrj-tab-content ${defaultTab === 'tab-cloud' ? 'active' : ''}" id="tab-cloud">
            <p style="font-size:13px; color:#94a3b8;">Conecte o Supabase ou configure seu servidor para sincronização em tempo real.</p>
            <div class="mrj-form-grid">
              <div class="mrj-form-full">
                <div class="mrj-input-group">
                  <label>Project URL do Supabase</label>
                  <input type="text" id="val-supa-url" class="mrj-input" value="${siteData.settings.supabaseUrl || ''}" placeholder="https://seu-projeto.supabase.co" />
                </div>
              </div>
              <div class="mrj-form-full">
                <div class="mrj-input-group">
                  <label>Project API Key (Anon / Public)</label>
                  <input type="text" id="val-supa-key" class="mrj-input" value="${siteData.settings.supabaseKey || ''}" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." />
                </div>
              </div>
            </div>
            <div style="display:flex; gap:12px; margin-top:20px; flex-wrap:wrap;">
              <button type="button" class="mrj-btn mrj-btn-gold" id="btn-export-html" style="width:auto;">⬇️ Baixar index.html Pronto</button>
              <button type="button" class="mrj-btn" id="btn-export-backup" style="background:#282b36; width:auto;">📋 Baixar Backup JSON</button>
            </div>
          </div>
        </div>

        <div class="mrj-modal-footer">
          <span style="font-size:12px; color:#94a3b8;">MRJ CMS v2.0 • Wix Customizer</span>
          <div style="display:flex; gap:10px;">
            <button type="button" class="mrj-btn mrj-modal-close" style="background:#282b36;">Fechar</button>
            <button type="button" class="mrj-btn mrj-btn-gold" id="btn-save-all-modal">Salvar & Publicar ✓</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Navegação de Abas
    overlay.querySelectorAll(".mrj-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        overlay.querySelectorAll(".mrj-tab-btn").forEach(b => b.classList.remove("active"));
        overlay.querySelectorAll(".mrj-tab-content").forEach(c => c.classList.remove("active"));
        btn.classList.add("active");
        const target = overlay.querySelector("#" + btn.dataset.target);
        if (target) {
          target.classList.add("active");
          if (btn.dataset.target === "tab-leads") refreshLeadsTable(overlay);
        }
      });
    });

    overlay.querySelectorAll(".mrj-modal-close").forEach(btn => {
      btn.addEventListener("click", () => overlay.remove());
    });

    // ========================================================================
    // EVENTOS DE LOGOMARCA & MENU DE NAVEGAÇÃO
    // ========================================================================
    const radioLogoTypes = overlay.querySelectorAll("input[name='logo-type-radio']");
    const boxLogoImg = overlay.querySelector("#box-logo-image");
    const boxLogoTxt = overlay.querySelector("#box-logo-text");
    const fileLogoUpload = overlay.querySelector("#file-logo-upload");
    const btnTriggerLogo = overlay.querySelector("#btn-trigger-logo-upload");
    const valLogoUrl = overlay.querySelector("#val-logo-image-url");
    const logoPrevBox = overlay.querySelector("#logo-preview-box");
    const logoPrevImg = overlay.querySelector("#logo-preview-img");

    radioLogoTypes.forEach(r => {
      r.addEventListener("change", (e) => {
        const isImg = e.target.value === "image";
        if (boxLogoImg) boxLogoImg.style.display = isImg ? "block" : "none";
        if (boxLogoTxt) boxLogoTxt.style.display = isImg ? "none" : "block";
      });
    });

    if (btnTriggerLogo && fileLogoUpload) {
      btnTriggerLogo.addEventListener("click", () => fileLogoUpload.click());
      fileLogoUpload.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (file) {
          showToast("Enviando imagem da logomarca...");
          try {
            const url = await uploadMediaFile(file);
            valLogoUrl.value = url;
            if (logoPrevImg) logoPrevImg.src = url;
            if (logoPrevBox) logoPrevBox.style.display = "block";
            showToast("Logomarca carregada com sucesso!");
          } catch (err) {
            alert("Erro ao enviar imagem: " + err.message);
          }
        }
      });
    }

    if (valLogoUrl) {
      valLogoUrl.addEventListener("input", (e) => {
        const url = e.target.value.trim();
        if (url) {
          if (logoPrevImg) logoPrevImg.src = url;
          if (logoPrevBox) logoPrevBox.style.display = "block";
        } else {
          if (logoPrevBox) logoPrevBox.style.display = "none";
        }
      });
    }

    // Slider de Altura da Logomarca (Tempo Real)
    const sliderLogoHeight = overlay.querySelector("#val-logo-height");
    const dispLogoHeight = overlay.querySelector("#val-logo-height-disp");
    if (sliderLogoHeight) {
      sliderLogoHeight.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        if (dispLogoHeight) dispLogoHeight.textContent = val + "px";
        if (logoPrevImg) logoPrevImg.style.maxHeight = val + "px";
        siteData.settings.logoHeight = val;
        renderSiteFromData();
      });
    }

    // Sincronização automática entre o campo de Nome da Logo e o campo de Nome dos Contatos
    const valBrokerName = overlay.querySelector("#val-broker-name");
    const valConfName = overlay.querySelector("#val-conf-name");
    if (valBrokerName && valConfName) {
      valBrokerName.addEventListener("input", (e) => {
        valConfName.value = e.target.value;
      });
      valConfName.addEventListener("input", (e) => {
        valBrokerName.value = e.target.value;
      });
    }

    // Gerenciador da Lista de Links do Menu
    function renderMenuRows() {
      const listEl = overlay.querySelector("#admin-menu-links-list");
      if (!listEl) return;
      if (!Array.isArray(siteData.settings.menuLinks)) {
        siteData.settings.menuLinks = [
          { label: "Início", url: "#inicio" },
          { label: "Empreendimentos", url: "#empreendimentos" },
          { label: "Conteúdos", url: "#conteudos" },
          { label: "Contato", url: "#contato" }
        ];
      }

      if (siteData.settings.menuLinks.length === 0) {
        listEl.innerHTML = `
          <div style="padding:16px; background:#14151a; border:1px dashed #334155; border-radius:6px; text-align:center; color:#94a3b8; font-size:12px;">
            Nenhum botão no menu no momento. Clique nos botões acima para adicionar!
          </div>
        `;
        return;
      }

      listEl.innerHTML = siteData.settings.menuLinks.map((item, idx) => `
        <div class="mrj-menu-row" data-idx="${idx}" style="background:#14151a; border:1px solid #282b36; border-radius:6px; padding:10px 12px; display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
          <span style="font-size:11px; font-weight:700; color:var(--admin-gold); min-width:20px;">#${idx + 1}</span>
          <div style="flex:1; min-width:140px;">
            <input type="text" class="mrj-input mrj-menu-label" data-idx="${idx}" value="${item.label || ''}" placeholder="Texto do Menu (Ex: Início)" style="font-size:12px; padding:8px 10px;" />
          </div>
          <div style="flex:1.2; min-width:160px;">
            <input type="text" class="mrj-input mrj-menu-url" data-idx="${idx}" value="${item.url || ''}" placeholder="Link / Destino (#inicio, link)" style="font-size:12px; padding:8px 10px;" />
          </div>
          <button type="button" class="mrj-btn-small mrj-menu-del" data-idx="${idx}" style="background:#ef4444; border-color:#ef4444; padding:7px 12px; width:auto; font-size:11px; white-space:nowrap; cursor:pointer;" title="Excluir este botão">🗑️ Excluir</button>
        </div>
      `).join("");

      listEl.querySelectorAll(".mrj-menu-label").forEach(inp => {
        inp.addEventListener("input", (e) => {
          const idx = parseInt(e.target.dataset.idx, 10);
          if (siteData.settings.menuLinks[idx]) siteData.settings.menuLinks[idx].label = e.target.value;
        });
      });

      listEl.querySelectorAll(".mrj-menu-url").forEach(inp => {
        inp.addEventListener("input", (e) => {
          const idx = parseInt(e.target.dataset.idx, 10);
          if (siteData.settings.menuLinks[idx]) siteData.settings.menuLinks[idx].url = e.target.value;
        });
      });

      listEl.querySelectorAll(".mrj-menu-del").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const idx = parseInt(btn.dataset.idx, 10);
          siteData.settings.menuLinks.splice(idx, 1);
          renderMenuRows();
        });
      });
    }

    renderMenuRows();

    const btnAddMenuLink = overlay.querySelector("#btn-add-menu-link");
    if (btnAddMenuLink) {
      btnAddMenuLink.addEventListener("click", () => {
        if (!Array.isArray(siteData.settings.menuLinks)) siteData.settings.menuLinks = [];
        siteData.settings.menuLinks.push({ label: "Novo Link", url: "#" });
        renderMenuRows();
      });
    }

    overlay.querySelectorAll(".btn-preset-menu").forEach(btn => {
      btn.addEventListener("click", () => {
        const lbl = btn.dataset.label;
        const url = btn.dataset.url;
        if (!Array.isArray(siteData.settings.menuLinks)) siteData.settings.menuLinks = [];
        siteData.settings.menuLinks.push({ label: lbl, url: url });
        renderMenuRows();
      });
    });

    const chkHeaderCta = overlay.querySelector("#chk-show-header-cta");
    const boxHeaderCtaText = overlay.querySelector("#box-header-cta-text");
    if (chkHeaderCta && boxHeaderCtaText) {
      chkHeaderCta.addEventListener("change", (e) => {
        boxHeaderCtaText.style.display = e.target.checked ? "block" : "none";
      });
    }

    // ========================================================================
    // EVENTOS DO SISTEMA DE CORES (LIVE PREVIEW WIX)
    // ========================================================================
    function bindColorSync(pickerId, hexId, key) {
      const picker = overlay.querySelector("#" + pickerId);
      const hex = overlay.querySelector("#" + hexId);
      if (picker && hex) {
        picker.addEventListener("input", (e) => {
          hex.value = e.target.value.toUpperCase();
          if (!siteData.theme) siteData.theme = {};
          siteData.theme[key] = e.target.value;
          applyThemeColors(siteData.theme);
        });
        hex.addEventListener("input", (e) => {
          if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
            picker.value = e.target.value;
            if (!siteData.theme) siteData.theme = {};
            siteData.theme[key] = e.target.value;
            applyThemeColors(siteData.theme);
          }
        });
      }
    }

    bindColorSync("color-primary", "hex-primary", "primaryColor");
    bindColorSync("color-primary-hover", "hex-primary-hover", "primaryHover");
    bindColorSync("color-header", "hex-header", "headerBg");
    bindColorSync("color-footer", "hex-footer", "footerBg");
    bindColorSync("color-text-pri", "hex-text-pri", "textPrimary");
    bindColorSync("color-text-sec", "hex-text-sec", "textSecondary");

    // Slider de Opacidade
    const slider = overlay.querySelector("#slider-hero-opacity");
    const sliderVal = overlay.querySelector("#val-hero-opacity");
    if (slider && sliderVal) {
      slider.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        sliderVal.textContent = Math.round(val * 100) + "%";
        if (!siteData.theme) siteData.theme = {};
        siteData.theme.heroOverlayOpacity = val;
        applyThemeColors(siteData.theme);
      });
    }

    // ========================================================================
    // EVENTOS DA CAPA MULTIMÍDIA
    // ========================================================================
    overlay.querySelectorAll(".mrj-media-radio-card").forEach(card => {
      card.addEventListener("click", () => {
        overlay.querySelectorAll(".mrj-media-radio-card").forEach(c => c.classList.remove("active"));
        card.classList.add("active");
        const type = card.dataset.type;
        siteData.hero.mediaType = type;

        overlay.querySelector("#hero-block-image").style.display = type === "image" ? "block" : "none";
        overlay.querySelector("#hero-block-video-local").style.display = type === "video_local" ? "block" : "none";
        overlay.querySelector("#hero-block-video-embed").style.display = type === "video_embed" ? "block" : "none";

        renderSiteFromData();
      });
    });

    // Upload de Imagem do Hero
    const heroImgFile = overlay.querySelector("#hero-img-file");
    const heroImgPrev = overlay.querySelector("#hero-img-preview");
    const valHeroImg = overlay.querySelector("#val-hero-image");

    overlay.querySelector("#btn-upload-hero-img").addEventListener("click", () => heroImgFile.click());
    heroImgFile.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (file) {
        showToast("Processando imagem da capa...");
        try {
          const url = await uploadMediaFile(file);
          heroImgPrev.src = url;
          valHeroImg.value = url;
          siteData.hero.imageUrl = url;
          renderSiteFromData();
          showToast("Imagem da capa carregada com sucesso!");
        } catch (err) {
          alert("Erro no upload: " + err.message);
        }
      }
    });

    overlay.querySelector("#btn-url-hero-img").addEventListener("click", () => {
      const url = prompt("Cole a URL da imagem da capa:", valHeroImg.value);
      if (url) {
        heroImgPrev.src = url;
        valHeroImg.value = url;
        siteData.hero.imageUrl = url;
        renderSiteFromData();
      }
    });

    // Upload de Vídeo MP4
    const heroVideoFile = overlay.querySelector("#hero-video-file");
    const valHeroVideoUrl = overlay.querySelector("#val-hero-video-url");
    overlay.querySelector("#btn-upload-hero-video").addEventListener("click", () => heroVideoFile.click());
    heroVideoFile.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (file) {
        showToast("Fazendo upload do vídeo da capa...");
        try {
          const url = await uploadMediaFile(file);
          valHeroVideoUrl.value = url;
          siteData.hero.videoUrl = url;
          renderSiteFromData();
          showToast("Vídeo da capa carregado com sucesso!");
        } catch (err) {
          alert("Erro no upload do vídeo: " + err.message);
        }
      }
    });

    // Upload de Pôster do Vídeo
    const heroPosterFile = overlay.querySelector("#hero-poster-file");
    const valHeroPoster = overlay.querySelector("#val-hero-video-poster");
    overlay.querySelector("#btn-upload-hero-poster").addEventListener("click", () => heroPosterFile.click());
    heroPosterFile.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (file) {
        showToast("Carregando pôster de vídeo...");
        try {
          const url = await uploadMediaFile(file);
          valHeroPoster.value = url;
          siteData.hero.videoPoster = url;
          renderSiteFromData();
          showToast("Pôster salvo com sucesso!");
        } catch (err) {
          alert("Erro: " + err.message);
        }
      }
    });

    // ========================================================================
    // EVENTOS DE IMÓVEIS & LEADS
    // ========================================================================
    const newProjBtn = overlay.querySelector("#btn-new-project-tab");
    if (newProjBtn) {
      newProjBtn.addEventListener("click", () => {
        overlay.remove();
        openProjectModal(null);
      });
    }

    setupProjectsListEvents(overlay);
    setupArticlesListEvents(overlay);

    const refreshLeadsBtn = overlay.querySelector("#btn-refresh-leads");
    if (refreshLeadsBtn) refreshLeadsBtn.addEventListener("click", () => refreshLeadsTable(overlay));

    const exportLeadsBtn = overlay.querySelector("#btn-export-leads");
    if (exportLeadsBtn) {
      exportLeadsBtn.addEventListener("click", async () => {
        const leads = typeof getLeadsList === "function" ? await getLeadsList() : [];
        if (!leads.length) {
          alert("Nenhum lead encontrado para exportação.");
          return;
        }
        let csv = "Data,Nome,Telefone,Email,Imovel\n";
        leads.forEach(l => {
          csv += `"${l.created_at || ''}","${l.name || ''}","${l.phone || ''}","${l.email || ''}","${l.project_name || ''}"\n`;
        });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `leads-mrj-${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
      });
    }

    if (defaultTab === "tab-leads") {
      refreshLeadsTable(overlay);
    }

    // Exportação de Código / Backup
    overlay.querySelector("#btn-export-html").addEventListener("click", () => downloadStaticHtml());
    overlay.querySelector("#btn-export-backup").addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(siteData, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "mrj-site-backup.json";
      a.click();
    });

    // ========================================================================
    // SALVAR TUDO (BOTÃO PRINCIPAL)
    // ========================================================================
    overlay.querySelector("#btn-save-all-modal").addEventListener("click", () => {
      // Atualiza textos do Hero
      siteData.hero.eyebrow = overlay.querySelector("#val-hero-eyebrow").value.trim();
      siteData.hero.ctaText = overlay.querySelector("#val-hero-cta").value.trim();
      siteData.hero.title = overlay.querySelector("#val-hero-title").value.trim();
      siteData.hero.copy = overlay.querySelector("#val-hero-copy").value.trim();
      siteData.hero.videoUrl = overlay.querySelector("#val-hero-video-url") ? overlay.querySelector("#val-hero-video-url").value.trim() : "";
      siteData.hero.videoPoster = overlay.querySelector("#val-hero-video-poster") ? overlay.querySelector("#val-hero-video-poster").value.trim() : "";
      siteData.hero.videoEmbed = overlay.querySelector("#val-hero-video-embed") ? overlay.querySelector("#val-hero-video-embed").value.trim() : "";

      // Atualiza Logomarca e Identidade
      const selLogoRadio = overlay.querySelector("input[name='logo-type-radio']:checked");
      siteData.settings.logoType = selLogoRadio ? selLogoRadio.value : "text";
      siteData.settings.logoImage = overlay.querySelector("#val-logo-image-url") ? overlay.querySelector("#val-logo-image-url").value.trim() : "";
      
      const sliderHeightInp = overlay.querySelector("#val-logo-height");
      if (sliderHeightInp) {
        siteData.settings.logoHeight = parseInt(sliderHeightInp.value, 10) || 52;
      }

      const brokerMarkInp = overlay.querySelector("#val-broker-mark");
      if (brokerMarkInp && brokerMarkInp.value.trim()) {
        siteData.settings.brokerMark = brokerMarkInp.value.trim();
      }

      const brokerNameInp = overlay.querySelector("#val-broker-name") || overlay.querySelector("#val-conf-name");
      if (brokerNameInp && brokerNameInp.value.trim()) {
        siteData.settings.brokerName = brokerNameInp.value.trim();
      }

      const brokerCreciInp = overlay.querySelector("#val-broker-creci");
      if (brokerCreciInp) {
        siteData.settings.creci = brokerCreciInp.value.trim();
      }

      const chkHeaderCta = overlay.querySelector("#chk-show-header-cta");
      siteData.settings.showHeaderCta = chkHeaderCta ? chkHeaderCta.checked : false;

      const headerCtaInp = overlay.querySelector("#val-header-cta-text");
      if (headerCtaInp) {
        siteData.settings.headerCtaText = headerCtaInp.value.trim();
      }

      // Salva os links do menu lendo diretamente cada linha do DOM
      const menuRows = overlay.querySelectorAll(".mrj-menu-row");
      const updatedMenuLinks = [];
      menuRows.forEach(row => {
        const lblInp = row.querySelector(".mrj-menu-label");
        const urlInp = row.querySelector(".mrj-menu-url");
        if (lblInp && lblInp.value.trim()) {
          updatedMenuLinks.push({
            label: lblInp.value.trim(),
            url: urlInp ? urlInp.value.trim() : "#"
          });
        }
      });
      if (updatedMenuLinks.length > 0 || menuRows.length === 0) {
        siteData.settings.menuLinks = updatedMenuLinks;
      }

      // Atualiza Contatos (SEM sobrescrever o brokerName)
      siteData.settings.phoneDisplay = overlay.querySelector("#val-conf-phone-disp").value.trim();
      siteData.settings.phoneRaw = overlay.querySelector("#val-conf-phone-raw").value.trim();
      siteData.settings.email = overlay.querySelector("#val-conf-email").value.trim();
      siteData.settings.adminPasswordHash = overlay.querySelector("#val-conf-pass").value.trim();

      // Atualiza Supabase
      siteData.settings.supabaseUrl = overlay.querySelector("#val-supa-url").value.trim();
      siteData.settings.supabaseKey = overlay.querySelector("#val-supa-key").value.trim();

      saveSiteData(siteData);
      renderSiteFromData();
      publishAllChanges();
      overlay.remove();
    });
  }

  // Atualiza Tabela de Leads
  async function refreshLeadsTable(container) {
    const tableContainer = container.querySelector("#admin-leads-container");
    if (!tableContainer) return;

    tableContainer.innerHTML = `<p style="text-align:center; color:#94a3b8; padding:30px;">Carregando contatos...</p>`;
    const leads = typeof getLeadsList === "function" ? await getLeadsList() : [];

    if (!leads || leads.length === 0) {
      tableContainer.innerHTML = `
        <div style="text-align:center; padding:36px; background:#14151a; border-radius:8px;">
          <p style="color:#fff; font-weight:600; margin-bottom:6px;">Nenhum lead capturado ainda</p>
          <p style="color:#94a3b8; font-size:12px; margin:0;">Quando um cliente clicar em 'Conheça o projeto' e baixar o PDF, o contato aparecerá aqui na hora!</p>
        </div>
      `;
      return;
    }

    tableContainer.innerHTML = `
      <div class="mrj-table-wrapper">
        <table class="mrj-table">
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Nome</th>
              <th>WhatsApp</th>
              <th>E-mail</th>
              <th>Imóvel</th>
              <th style="text-align:right;">Ação</th>
            </tr>
          </thead>
          <tbody>
            ${leads.map(l => {
              const cleanPhone = (l.phone || "").replace(/\D/g, "");
              const zapLink = cleanPhone ? `https://wa.me/55${cleanPhone.replace(/^55/, "")}?text=${encodeURIComponent(`Olá ${l.name}, vi que solicitou a apresentação do ${l.project_name || 'imóvel'} no meu site.`)}` : "#";
              const dateStr = l.created_at ? new Date(l.created_at).toLocaleString('pt-BR') : "-";
              return `
                <tr>
                  <td style="color:#94a3b8; font-size:11px;">${dateStr}</td>
                  <td style="font-weight:700; color:#fff;">${l.name}</td>
                  <td>${l.phone}</td>
                  <td style="color:#94a3b8;">${l.email || '-'}</td>
                  <td style="color:var(--admin-gold); font-weight:600;">${l.project_name || '-'}</td>
                  <td style="text-align:right;">
                    ${cleanPhone ? `<a href="${zapLink}" target="_blank" rel="noreferrer" class="mrj-btn-small" style="background:var(--admin-success); border:none; text-decoration:none;">Chamar no Zap ↗</a>` : ''}
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  // Modal de Adicionar / Editar Imóvel
  function openProjectModal(projectId = null) {
    const isEditing = Boolean(projectId);
    let project = isEditing
      ? siteData.projects.find(p => p.id === projectId)
      : {
          id: "proj-" + Date.now(),
          ref: "MR-" + Math.floor(1000 + Math.random() * 9000),
          name: "",
          location: "HIGIENÓPOLIS · SÃO PAULO / SP",
          price: "Consulte valores",
          description: "",
          image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=85",
          status: "lancamento",
          statusLabel: "Lançamento",
          tagNote: "✦ Alto padrão",
          area: "150 a 200 m²",
          bedrooms: "3",
          suites: "3 Suítes",
          vagas: "2 Vagas",
          pdfUrl: "",
          whatsappMessage: "Olá Marcio, quero saber mais sobre este empreendimento"
        };

    if (!project) return;

    const overlay = document.createElement("div");
    overlay.className = "mrj-modal-overlay";
    overlay.innerHTML = `
      <div class="mrj-modal">
        <div class="mrj-modal-header">
          <h3>${isEditing ? "✏️ Editar Empreendimento" : "➕ Novo Empreendimento"}</h3>
          <button type="button" class="mrj-modal-close">✕</button>
        </div>

        <div class="mrj-modal-body">
          <form id="form-project" class="mrj-form-grid">
            <div class="mrj-form-full">
              <label class="eyebrow" style="color:var(--admin-gold);">FOTO PRINCIPAL DO IMÓVEL</label>
              <div class="mrj-upload-box">
                <input type="file" id="proj-file-input" accept="image/*" style="display:none;" />
                <img id="proj-img-preview" src="${project.image}" class="mrj-upload-preview" alt="Preview" />
                <div style="display:flex; gap:8px; justify-content:center; margin-top:12px;">
                  <button type="button" class="mrj-btn-small" id="btn-upload-proj-img">📷 Enviar Imagem do PC</button>
                  <button type="button" class="mrj-btn-small" id="btn-url-proj-img">🔗 Colar Link</button>
                </div>
                <input type="hidden" id="val-proj-image" value="${project.image}" />
              </div>
            </div>

            <div>
              <div class="mrj-input-group">
                <label>Nome do Empreendimento</label>
                <input type="text" id="val-proj-name" class="mrj-input" value="${project.name}" placeholder="Ex: Casa Piauí Higienópolis" required />
              </div>
            </div>

            <div>
              <div class="mrj-input-group">
                <label>Código de Referência</label>
                <input type="text" id="val-proj-ref" class="mrj-input" value="${project.ref || 'MR-0101'}" placeholder="Ex: MR-0101" />
              </div>
            </div>

            <div>
              <div class="mrj-input-group">
                <label>Localização / Bairro</label>
                <input type="text" id="val-proj-loc" class="mrj-input" value="${project.location}" placeholder="Ex: HIGIENÓPOLIS · SÃO PAULO / SP" required />
              </div>
            </div>

            <div>
              <div class="mrj-input-group">
                <label>Preço / Valor</label>
                <input type="text" id="val-proj-price" class="mrj-input" value="${project.price || 'Consulte valores'}" placeholder="Ex: Consulte valores ou R$ 2.450.000" />
              </div>
            </div>

            <div>
              <div class="mrj-input-group">
                <label>Status do Imóvel</label>
                <select id="val-proj-status" class="mrj-input">
                  <option value="lancamento" ${project.status === "lancamento" ? "selected" : ""}>Lançamento</option>
                  <option value="obras" ${project.status === "obras" ? "selected" : ""}>Em obras</option>
                  <option value="pronto" ${project.status === "pronto" ? "selected" : ""}>Pronto para morar</option>
                  <option value="vendido" ${project.status === "vendido" ? "selected" : ""}>100% Vendido</option>
                </select>
              </div>
            </div>

            <div>
              <div class="mrj-input-group">
                <label>Selo / Tag de Destaque</label>
                <input type="text" id="val-proj-tag" class="mrj-input" value="${project.tagNote || ''}" placeholder="Ex: ✦ Alto padrão" />
              </div>
            </div>

            <div>
              <div class="mrj-input-group">
                <label>Área Privativa</label>
                <input type="text" id="val-proj-area" class="mrj-input" value="${project.area || ''}" placeholder="Ex: 168 a 220 m²" />
              </div>
            </div>

            <div>
              <div class="mrj-input-group">
                <label>Quartos / Dormitórios</label>
                <input type="text" id="val-proj-bedrooms" class="mrj-input" value="${project.bedrooms || ''}" placeholder="Ex: 3 a 4" />
              </div>
            </div>

            <div>
              <div class="mrj-input-group">
                <label>Suítes</label>
                <input type="text" id="val-proj-suites" class="mrj-input" value="${project.suites || ''}" placeholder="Ex: 3 a 4 Suítes" />
              </div>
            </div>

            <div>
              <div class="mrj-input-group">
                <label>Vagas de Garagem</label>
                <input type="text" id="val-proj-vagas" class="mrj-input" value="${project.vagas || ''}" placeholder="Ex: 2 a 3 Vagas" />
              </div>
            </div>

            <div class="mrj-form-full">
              <div class="mrj-input-group">
                <label>📄 Arquivo PDF / Book de Apresentação (Download do Lead)</label>
                <div style="display:flex; gap:8px;">
                  <input type="text" id="val-proj-pdf" class="mrj-input" value="${project.pdfUrl || ''}" placeholder="Link do PDF ou clique para subir →" />
                  <input type="file" id="proj-pdf-file" accept="application/pdf" style="display:none;" />
                  <button type="button" class="mrj-btn-small" id="btn-upload-proj-pdf" style="white-space:nowrap;">📁 Subir PDF</button>
                </div>
              </div>
            </div>

            <div class="mrj-form-full">
              <div class="mrj-input-group">
                <label>🕶️ Link ou PDF do Tour Virtual 360° (Interativo)</label>
                <div style="display:flex; gap:8px;">
                  <input type="text" id="val-proj-tour" class="mrj-input" value="${project.tourUrl || ''}" placeholder="Link do Tour 360° (Matterport/YouTube) ou link do PDF" />
                  <input type="file" id="proj-tour-file" accept="application/pdf" style="display:none;" />
                  <button type="button" class="mrj-btn-small" id="btn-upload-proj-tour" style="white-space:nowrap;">📁 Subir PDF do Tour</button>
                </div>
                <span style="font-size:11px; color:#94a3b8; display:block; margin-top:4px;">Se preenchido, um selo e botão especial "🕶️ Tour Virtual 360°" serão exibidos no card do imóvel.</span>
              </div>
            </div>

            <div class="mrj-form-full">
              <div class="mrj-input-group">
                <label>Mensagem Personalizada do WhatsApp</label>
                <input type="text" id="val-proj-msg" class="mrj-input" value="${project.whatsappMessage || ''}" placeholder="Ex: Olá Marcio, quero saber mais sobre o Casa Piauí" />
              </div>
            </div>

            <div class="mrj-form-full">
              <div class="mrj-input-group">
                <label>Descrição Resumida</label>
                <textarea id="val-proj-desc" class="mrj-input">${project.description || ''}</textarea>
              </div>
            </div>
          </form>
        </div>

        <div class="mrj-modal-footer">
          <div>
            ${isEditing ? `<button type="button" class="mrj-btn-small mrj-btn-danger" id="btn-del-project">🗑 Excluir Imóvel</button>` : ''}
          </div>
          <div style="display:flex; gap:10px;">
            <button type="button" class="mrj-btn mrj-modal-close" style="background:#282b36;">Cancelar</button>
            <button type="button" class="mrj-btn mrj-btn-gold" id="btn-save-project">Salvar Imóvel ✓</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelectorAll(".mrj-modal-close").forEach(btn => btn.addEventListener("click", () => overlay.remove()));

    // Upload de Imagem do Imóvel
    const fileInput = overlay.querySelector("#proj-file-input");
    const previewImg = overlay.querySelector("#proj-img-preview");
    const valImg = overlay.querySelector("#val-proj-image");

    overlay.querySelector("#btn-upload-proj-img").addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (file) {
        showToast("Processando imagem do imóvel...");
        try {
          const url = await uploadMediaFile(file);
          previewImg.src = url;
          valImg.value = url;
          showToast("Imagem carregada!");
        } catch (err) {
          alert("Erro: " + err.message);
        }
      }
    });

    overlay.querySelector("#btn-url-proj-img").addEventListener("click", () => {
      const url = prompt("Cole a URL da foto:", valImg.value);
      if (url) {
        previewImg.src = url;
        valImg.value = url;
      }
    });

    // Upload de PDF
    const pdfFileInput = overlay.querySelector("#proj-pdf-file");
    const pdfInput = overlay.querySelector("#val-proj-pdf");
    overlay.querySelector("#btn-upload-proj-pdf").addEventListener("click", () => pdfFileInput.click());
    pdfFileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (file) {
        showToast("Enviando arquivo PDF...");
        try {
          const url = await uploadMediaFile(file);
          pdfInput.value = url;
          showToast("PDF salvo com sucesso!");
        } catch (err) {
          alert("Erro: " + err.message);
        }
      }
    });

    // Upload de Tour Virtual PDF
    const tourFileInput = overlay.querySelector("#proj-tour-file");
    const tourInput = overlay.querySelector("#val-proj-tour");
    if (tourFileInput && tourInput) {
      overlay.querySelector("#btn-upload-proj-tour").addEventListener("click", () => tourFileInput.click());
      tourFileInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (file) {
          showToast("Enviando PDF do Tour Virtual...");
          try {
            const url = await uploadMediaFile(file);
            tourInput.value = url;
            showToast("Tour Virtual PDF salvo com sucesso!");
          } catch (err) {
            alert("Erro: " + err.message);
          }
        }
      });
    }

    // Salvar
    overlay.querySelector("#btn-save-project").addEventListener("click", () => {
      const name = overlay.querySelector("#val-proj-name").value.trim();
      if (!name) {
        alert("Preencha o nome do empreendimento.");
        return;
      }

      const statusSelect = overlay.querySelector("#val-proj-status");
      project.name = name;
      project.ref = overlay.querySelector("#val-proj-ref").value.trim();
      project.location = overlay.querySelector("#val-proj-loc").value.trim();
      project.price = overlay.querySelector("#val-proj-price").value.trim();
      project.status = statusSelect.value;
      project.statusLabel = statusSelect.options[statusSelect.selectedIndex].text;
      project.tagNote = overlay.querySelector("#val-proj-tag").value.trim();
      project.area = overlay.querySelector("#val-proj-area").value.trim();
      project.bedrooms = overlay.querySelector("#val-proj-bedrooms").value.trim();
      project.suites = overlay.querySelector("#val-proj-suites").value.trim();
      project.vagas = overlay.querySelector("#val-proj-vagas").value.trim();
      project.pdfUrl = overlay.querySelector("#val-proj-pdf").value.trim();
      project.tourUrl = overlay.querySelector("#val-proj-tour") ? overlay.querySelector("#val-proj-tour").value.trim() : "";
      project.whatsappMessage = overlay.querySelector("#val-proj-msg").value.trim() || `Olá Marcio, quero saber mais sobre o ${name}`;
      project.description = overlay.querySelector("#val-proj-desc").value.trim();
      project.image = valImg.value;

      if (!isEditing) {
        siteData.projects.unshift(project);
      }

      saveSiteData(siteData);
      renderSiteFromData();
      publishAllChanges();
      overlay.remove();
      showToast(isEditing ? "Imóvel atualizado!" : "Novo imóvel cadastrado com sucesso!");
    });

    if (isEditing) {
      overlay.querySelector("#btn-del-project").addEventListener("click", () => {
        if (confirm(`Remover o imóvel "${project.name}"?`)) {
          siteData.projects = siteData.projects.filter(p => p.id !== projectId);
          saveSiteData(siteData);
          renderSiteFromData();
          publishAllChanges();
          overlay.remove();
          showToast("Imóvel excluído.");
        }
      });
    }
  }

  // HTML da Lista de Imóveis
  function renderProjectsListHtml() {
    if (siteData.projects.length === 0) {
      return `<p style="color:#94a3b8; text-align:center; padding:30px;">Nenhum imóvel cadastrado.</p>`;
    }

    return siteData.projects.map((proj, idx) => `
      <div class="mrj-project-item">
        <img src="${proj.image}" class="mrj-project-thumb" alt="${proj.name}" />
        <div class="mrj-project-meta">
          <h4 class="mrj-project-title">${proj.name}</h4>
          <p class="mrj-project-sub">${proj.statusLabel || proj.status} · ${proj.location} ${proj.ref ? `(${proj.ref})` : ''}</p>
        </div>
        <div class="mrj-item-actions">
          <button type="button" class="mrj-btn-small mrj-proj-up" data-idx="${idx}" ${idx === 0 ? 'disabled style="opacity:0.4;"' : ''}>▲</button>
          <button type="button" class="mrj-btn-small mrj-proj-down" data-idx="${idx}" ${idx === siteData.projects.length - 1 ? 'disabled style="opacity:0.4;"' : ''}>▼</button>
          <button type="button" class="mrj-btn-small mrj-proj-edit" data-id="${proj.id}">✏️ Editar</button>
          <button type="button" class="mrj-btn-small mrj-btn-danger mrj-proj-del" data-id="${proj.id}">🗑</button>
        </div>
      </div>
    `).join("");
  }

  function setupProjectsListEvents(container) {
    container.querySelectorAll(".mrj-proj-edit").forEach(btn => {
      btn.addEventListener("click", () => {
        container.remove();
        openProjectModal(btn.dataset.id);
      });
    });

    container.querySelectorAll(".mrj-proj-del").forEach(btn => {
      btn.addEventListener("click", () => {
        if (confirm("Remover este imóvel?")) {
          siteData.projects = siteData.projects.filter(p => p.id !== btn.dataset.id);
          saveSiteData(siteData);
          renderSiteFromData();
          publishAllChanges();
          container.querySelector("#admin-projects-list").innerHTML = renderProjectsListHtml();
          setupProjectsListEvents(container);
          showToast("Imóvel removido.");
        }
      });
    });

    container.querySelectorAll(".mrj-proj-up").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.idx, 10);
        if (idx > 0) {
          const item = siteData.projects.splice(idx, 1)[0];
          siteData.projects.splice(idx - 1, 0, item);
          saveSiteData(siteData);
          renderSiteFromData();
          container.querySelector("#admin-projects-list").innerHTML = renderProjectsListHtml();
          setupProjectsListEvents(container);
        }
      });
    });

    container.querySelectorAll(".mrj-proj-down").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.idx, 10);
        if (idx < siteData.projects.length - 1) {
          const item = siteData.projects.splice(idx, 1)[0];
          siteData.projects.splice(idx + 1, 0, item);
          saveSiteData(siteData);
          renderSiteFromData();
          container.querySelector("#admin-projects-list").innerHTML = renderProjectsListHtml();
          setupProjectsListEvents(container);
        }
      });
    });
  }

  // HTML da Lista de Artigos
  function renderArticlesListHtml() {
    return siteData.articles.map((art, idx) => `
      <div class="mrj-project-item" style="align-items:flex-start;">
        <img src="${art.image}" class="mrj-project-thumb" style="width:100px; height:75px;" alt="${art.title}" />
        <div class="mrj-project-meta">
          <input type="text" class="mrj-input mrj-art-title" data-idx="${idx}" value="${art.title}" style="margin-bottom:6px; font-weight:700;" placeholder="Título" />
          <textarea class="mrj-input mrj-art-desc" data-idx="${idx}" style="min-height:50px; font-size:12px;" placeholder="Descrição">${art.description}</textarea>
          <div style="display:flex; gap:8px; margin-top:8px;">
            <input type="text" class="mrj-input mrj-art-cat" data-idx="${idx}" value="${art.category}" placeholder="Categoria" style="width:180px; font-size:11px;" />
            <input type="text" class="mrj-input mrj-art-date" data-idx="${idx}" value="${art.date}" placeholder="Data" style="width:150px; font-size:11px;" />
            <button type="button" class="mrj-btn-small mrj-art-pic-btn" data-idx="${idx}">📷 Foto</button>
            <input type="file" class="mrj-art-file-input" data-idx="${idx}" accept="image/*" style="display:none;" />
          </div>
        </div>
      </div>
    `).join("");
  }

  function setupArticlesListEvents(container) {
    container.querySelectorAll(".mrj-art-pic-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        container.querySelector(`.mrj-art-file-input[data-idx="${btn.dataset.idx}"]`).click();
      });
    });

    container.querySelectorAll(".mrj-art-file-input").forEach(input => {
      input.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        const idx = parseInt(input.dataset.idx, 10);
        if (file) {
          showToast("Processando foto do artigo...");
          try {
            const url = await uploadMediaFile(file);
            siteData.articles[idx].image = url;
            saveSiteData(siteData);
            renderSiteFromData();
            container.querySelector("#admin-articles-list").innerHTML = renderArticlesListHtml();
            setupArticlesListEvents(container);
            showToast("Foto do artigo alterada!");
          } catch (err) {
            alert("Erro: " + err.message);
          }
        }
      });
    });

    container.querySelectorAll(".mrj-art-title").forEach(inp => {
      inp.addEventListener("change", () => {
        siteData.articles[inp.dataset.idx].title = inp.value.trim();
        saveSiteData(siteData);
        renderSiteFromData();
      });
    });

    container.querySelectorAll(".mrj-art-desc").forEach(inp => {
      inp.addEventListener("change", () => {
        siteData.articles[inp.dataset.idx].description = inp.value.trim();
        saveSiteData(siteData);
        renderSiteFromData();
      });
    });
  }

  // Publicar Alterações (salvar.php + Supabase)
  async function publishAllChanges() {
    saveSiteData(siteData);

    // 1. Enviar para salvar.php (se houver PHP no servidor)
    try {
      await fetch("salvar.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_all",
          config: {
            theme: siteData.theme,
            hero: siteData.hero,
            settings: siteData.settings,
            articles: siteData.articles
          },
          imoveis: siteData.projects
        })
      });
    } catch (e) {
      // Ignora erro em ambientes sem PHP (Netlify)
    }

    // 2. Sincronizar com Supabase
    const supUrl = siteData.settings?.supabaseUrl;
    const supKey = siteData.settings?.supabaseKey;

    if (supUrl && supKey) {
      showToast("Publicando na nuvem do Supabase...");
      try {
        const baseEndpoint = `${supUrl.replace(/\/$/, '')}/rest/v1/mrj_site_data`;

        let res = await fetch(`${baseEndpoint}?id=eq.1`, {
          method: "PATCH",
          headers: {
            "apikey": supKey,
            "Authorization": `Bearer ${supKey}`,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
          },
          body: JSON.stringify({
            data: siteData,
            updated_at: new Date().toISOString()
          })
        });

        let updated = false;
        if (res.ok) {
          const rows = await res.json();
          if (rows && rows.length > 0) updated = true;
        }

        if (!updated) {
          res = await fetch(`${baseEndpoint}?on_conflict=id`, {
            method: "POST",
            headers: {
              "apikey": supKey,
              "Authorization": `Bearer ${supKey}`,
              "Content-Type": "application/json",
              "Prefer": "resolution=merge-duplicates"
            },
            body: JSON.stringify({
              id: 1,
              data: siteData,
              updated_at: new Date().toISOString()
            })
          });
          if (res.ok) updated = true;
        }

        if (updated) {
          showToast("✓ Site publicado e sincronizado com sucesso!");
        } else {
          showToast("Aviso: Salvo localmente. Verifique permissões do Supabase.", false);
        }
      } catch (err) {
        showToast("Salvo localmente! (Supabase offline)", false);
      }
    } else {
      showToast("Salvo com sucesso!");
    }
  }

  // Download do index.html Estático
  function downloadStaticHtml() {
    const docClone = document.documentElement.cloneNode(true);
    docClone.querySelectorAll(".mrj-admin-bar, .mrj-modal-overlay, .mrj-login-overlay, .mrj-toast").forEach(el => el.remove());
    docClone.classList.remove("mrj-admin-active");

    const htmlContent = "<!doctype html>\n" + docClone.outerHTML;
    const blob = new Blob([htmlContent], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "index.html";
    a.click();
    showToast("Arquivo index.html pronto baixado!");
  }

  // Inicialização
  if (isAuthenticated()) {
    initAdminInterface();
  } else {
    renderLoginModal();
  }
})();
