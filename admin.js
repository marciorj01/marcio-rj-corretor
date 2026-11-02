// ==========================================================================
// MRJ BUILDER - PAINEL ADMINISTRATIVO & MODO ELEMENTOR
// ==========================================================================

(function() {
  let siteData = getSiteData();
  let isVisualModeActive = false;
  let activeEditingProjectId = null;

  // Verificar se o usuário já fez login nesta sessão
  const AUTH_KEY = "mrj_admin_auth_v1";

  function isAuthenticated() {
    return sessionStorage.getItem(AUTH_KEY) === "true" || localStorage.getItem(AUTH_KEY) === "true";
  }

  function setAuthenticated(remember) {
    if (remember) {
      localStorage.setItem(AUTH_KEY, "true");
    }
    sessionStorage.setItem(AUTH_KEY, "true");
  }

  function logout() {
    sessionStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(AUTH_KEY);
    window.location.href = window.location.pathname; // recarrega sem ?painel
  }

  // Notificação Toast
  function showToast(message, isSuccess = true) {
    const existing = document.querySelector(".mrj-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = "mrj-toast";
    toast.style.borderColor = isSuccess ? "#10b981" : "#ef4444";
    toast.innerHTML = `<span>${isSuccess ? "✓" : "⚠"}</span> <div>${message}</div>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(20px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Comprimir imagem para evitar arquivos pesados e lentidão
  function compressImage(file, maxWidth = 1600, quality = 0.85) {
    return new Promise((resolve, reject) => {
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

          // Gera imagem otimizada em JPEG
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  }

  // Renderizar tela de login caso não esteja autenticado
  function renderLoginModal() {
    const overlay = document.createElement("div");
    overlay.className = "mrj-login-overlay";
    overlay.innerHTML = `
      <div class="mrj-login-card">
        <div class="mrj-login-logo">
          <div class="mrj-login-mark">MR</div>
          <span style="font-weight:700; letter-spacing:0.1em; font-size:12px;">MARCIO ROGÉRIO</span>
        </div>
        <h2>Painel do Corretor</h2>
        <p>Área restrita de gestão de imóveis, fotos e conteúdos do site.</p>
        
        <form id="mrj-login-form">
          <div class="mrj-input-group">
            <label for="mrj-pass">Senha de Acesso</label>
            <input type="password" id="mrj-pass" class="mrj-input" placeholder="Digite sua senha..." autocomplete="current-password" autofocus required />
          </div>
          
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:18px; text-align:left;">
            <input type="checkbox" id="mrj-remember" style="accent-color:#b49a70; cursor:pointer;" />
            <label for="mrj-remember" style="font-size:12px; color:#9c9da3; cursor:pointer; margin:0;">Lembrar neste navegador</label>
          </div>

          <button type="submit" class="mrj-btn mrj-btn-gold">Entrar no Painel →</button>
        </form>

        <p class="mrj-login-tip">Senha padrão de primeiro acesso: <strong>mrj@2025</strong></p>
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
        showToast("Bem-vindo ao Painel MRJ Builder!");
      } else {
        passInput.style.borderColor = "#ef4444";
        passInput.value = "";
        passInput.placeholder = "Senha incorreta! Tente novamente.";
        passInput.focus();
      }
    });
  }

  // Renderizar Barra Superior do Elementor
  function initAdminInterface() {
    document.body.classList.add("mrj-admin-active");

    const bar = document.createElement("div");
    bar.className = "mrj-admin-bar";
    bar.innerHTML = `
      <div class="mrj-admin-brand">
        <span class="mrj-badge-builder">MRJ Builder</span>
        <div class="mrj-admin-status">
          <span class="mrj-status-dot"></span>
          <span>Modo Administrador</span>
        </div>
      </div>

      <div class="mrj-admin-actions">
        <button type="button" class="mrj-bar-btn" id="mrj-toggle-visual">
          <span>✏️</span> Modo Visual
        </button>
        <button type="button" class="mrj-bar-btn" id="mrj-btn-new-project">
          <span>➕</span> Novo Imóvel
        </button>
        <button type="button" class="mrj-bar-btn" id="mrj-open-manager">
          <span>⚙️</span> Gerenciar Site
        </button>
        <button type="button" class="mrj-bar-btn mrj-bar-btn-save" id="mrj-btn-save-all">
          <span>💾</span> Salvar Alterações
        </button>
        <button type="button" class="mrj-bar-btn mrj-bar-btn-exit" id="mrj-btn-logout" title="Sair do modo administrador">
          <span>✕</span> Sair
        </button>
      </div>
    `;

    document.body.prepend(bar);

    // Eventos da Barra
    bar.querySelector("#mrj-toggle-visual").addEventListener("click", () => {
      toggleVisualMode();
      const btn = bar.querySelector("#mrj-toggle-visual");
      btn.classList.toggle("active", isVisualModeActive);
    });

    bar.querySelector("#mrj-btn-new-project").addEventListener("click", () => {
      openProjectModal(null);
    });

    bar.querySelector("#mrj-open-manager").addEventListener("click", () => {
      openGeneralModal();
    });

    bar.querySelector("#mrj-btn-save-all").addEventListener("click", () => {
      publishAllChanges();
    });

    bar.querySelector("#mrj-btn-logout").addEventListener("click", () => {
      if (confirm("Deseja sair do painel administrativo?")) {
        logout();
      }
    });

    // Se estiver no modo visual, atualiza botões nos cards
    updateVisualEditButtons();
  }

  // Alternar Modo Visual (Elementor)
  function toggleVisualMode() {
    isVisualModeActive = !isVisualModeActive;
    document.body.classList.toggle("mrj-visual-mode", isVisualModeActive);
    updateVisualEditButtons();
    showToast(isVisualModeActive ? "Modo Visual Ativado! Clique nos botões para editar." : "Modo Visual Desativado.");
  }

  // Atualizar botões de edição inline nos blocos
  function updateVisualEditButtons() {
    document.querySelectorAll(".mrj-inline-edit-btn").forEach(b => b.remove());

    if (!isVisualModeActive) return;

    // Botão de editar Hero
    const hero = document.querySelector(".hero");
    if (hero) {
      const editHeroBtn = document.createElement("button");
      editHeroBtn.className = "mrj-inline-edit-btn";
      editHeroBtn.innerHTML = `✏️ Editar Capa & Textos`;
      editHeroBtn.onclick = () => openGeneralModal("tab-hero");
      hero.appendChild(editHeroBtn);
    }

    // Botão de editar cada imóvel
    document.querySelectorAll(".project-card").forEach((card, index) => {
      const projectId = siteData.projects[index]?.id;
      if (projectId) {
        const editCardBtn = document.createElement("button");
        editCardBtn.className = "mrj-inline-edit-btn";
        editCardBtn.innerHTML = `✏️ Editar Imóvel`;
        editCardBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          openProjectModal(projectId);
        };
        card.appendChild(editCardBtn);
      }
    });

    // Botão de editar artigos
    const editorial = document.querySelector(".editorial-section");
    if (editorial) {
      const editBlogBtn = document.createElement("button");
      editBlogBtn.className = "mrj-inline-edit-btn";
      editBlogBtn.style.top = "20px";
      editBlogBtn.innerHTML = `✏️ Gerenciar Artigos`;
      editBlogBtn.onclick = () => openGeneralModal("tab-articles");
      editorial.appendChild(editBlogBtn);
    }
  }

  // Modal para Adicionar/Editar Imóvel
  function openProjectModal(projectId = null) {
    const isEditing = Boolean(projectId);
    let project = isEditing
      ? siteData.projects.find(p => p.id === projectId)
      : {
          id: "proj-" + Date.now(),
          name: "",
          location: "HIGIENÓPOLIS · SÃO PAULO / SP",
          description: "",
          image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=85",
          status: "lancamento",
          statusLabel: "Lançamento",
          tagNote: "✦ Alto padrão",
          area: "150 a 200 m²",
          suites: "3 Suítes",
          vagas: "2 Vagas",
          whatsappMessage: "Quero conhecer mais sobre este empreendimento"
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
          <form id="mrj-project-form" class="mrj-form-grid">
            <div class="mrj-form-full">
              <label class="eyebrow" style="color:#b49a70; margin-bottom:6px; display:block;">FOTO PRINCIPAL DO IMÓVEL</label>
              <div class="mrj-upload-box" id="mrj-dropzone">
                <input type="file" id="mrj-file-input" accept="image/*" style="display:none;" />
                <img id="mrj-preview-img" src="${project.image}" class="mrj-upload-preview" alt="Preview" />
                <div class="mrj-upload-actions">
                  <button type="button" class="mrj-btn-small" id="mrj-btn-upload">📷 Escolher foto do Computador</button>
                  <button type="button" class="mrj-btn-small" id="mrj-btn-url">🔗 Colar link de Imagem</button>
                </div>
                <input type="hidden" id="mrj-img-val" value="${project.image}" />
              </div>
            </div>

            <div>
              <div class="mrj-input-group">
                <label>Nome do Empreendimento</label>
                <input type="text" id="mrj-proj-name" class="mrj-input" value="${project.name}" placeholder="Ex: Casa Piauí Higienópolis" required />
              </div>
            </div>

            <div>
              <div class="mrj-input-group">
                <label>Localização / Bairro</label>
                <input type="text" id="mrj-proj-loc" class="mrj-input" value="${project.location}" placeholder="Ex: HIGIENÓPOLIS · SÃO PAULO / SP" required />
              </div>
            </div>

            <div>
              <div class="mrj-input-group">
                <label>Status da Obra</label>
                <select id="mrj-proj-status" class="mrj-input">
                  <option value="lancamento" ${project.status === "lancamento" ? "selected" : ""}>Lançamento</option>
                  <option value="obras" ${project.status === "obras" ? "selected" : ""}>Em obras</option>
                  <option value="pronto" ${project.status === "pronto" ? "selected" : ""}>Pronto para morar</option>
                </select>
              </div>
            </div>

            <div>
              <div class="mrj-input-group">
                <label>Selo / Tag de Destaque</label>
                <input type="text" id="mrj-proj-tag" class="mrj-input" value="${project.tagNote}" placeholder="Ex: ✦ Alto padrão" />
              </div>
            </div>

            <div>
              <div class="mrj-input-group">
                <label>Área Privativa</label>
                <input type="text" id="mrj-proj-area" class="mrj-input" value="${project.area}" placeholder="Ex: 168 a 220 m²" />
              </div>
            </div>

            <div>
              <div class="mrj-input-group">
                <label>Suítes / Quartos</label>
                <input type="text" id="mrj-proj-suites" class="mrj-input" value="${project.suites}" placeholder="Ex: 3 a 4 Suítes" />
              </div>
            </div>

            <div>
              <div class="mrj-input-group">
                <label>Vagas de Garagem</label>
                <input type="text" id="mrj-proj-vagas" class="mrj-input" value="${project.vagas}" placeholder="Ex: 2 a 3 Vagas" />
              </div>
            </div>

            <div>
              <div class="mrj-input-group">
                <label>Mensagem para o WhatsApp</label>
                <input type="text" id="mrj-proj-msg" class="mrj-input" value="${project.whatsappMessage || ''}" placeholder="Ex: Quero saber mais sobre o Casa Piauí" />
              </div>
            </div>

            <div class="mrj-form-full">
              <div class="mrj-input-group">
                <label>📄 Link do PDF / Book de Apresentação (Download do Lead)</label>
                <input type="url" id="mrj-proj-pdf" class="mrj-input" value="${project.pdfUrl || ''}" placeholder="Ex: https://meusite.com/books/casa-piaui.pdf ou link do Google Drive/Supabase" />
                <small style="color:#94a3b8; font-size:11px;">Quando o visitante clica em 'Conheça o projeto', ele preenche o formulário de lead e baixa este PDF.</small>
              </div>
            </div>

            <div class="mrj-form-full">
              <div class="mrj-input-group">
                <label>Descrição Resumida</label>
                <textarea id="mrj-proj-desc" class="mrj-input" placeholder="Breve apresentação dos diferenciais do projeto...">${project.description}</textarea>
              </div>
            </div>
          </form>
        </div>

        <div class="mrj-modal-footer">
          <div>
            ${isEditing ? `<button type="button" class="mrj-btn-small mrj-btn-danger" id="mrj-delete-project">🗑 Excluir Imóvel</button>` : ""}
          </div>
          <div style="display:flex; gap:10px;">
            <button type="button" class="mrj-btn mrj-modal-close" style="background:#2a2d38;">Cancelar</button>
            <button type="button" class="mrj-btn mrj-btn-gold" id="mrj-save-project">Salvar Imóvel ✓</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Fechar modal
    overlay.querySelectorAll(".mrj-modal-close").forEach(btn => {
      btn.addEventListener("click", () => overlay.remove());
    });

    // Upload de Imagem
    const fileInput = overlay.querySelector("#mrj-file-input");
    const previewImg = overlay.querySelector("#mrj-preview-img");
    const imgVal = overlay.querySelector("#mrj-img-val");

    overlay.querySelector("#mrj-btn-upload").addEventListener("click", () => {
      fileInput.click();
    });

    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          showToast("Otimizando imagem...");
          const compressed = await compressImage(file);
          previewImg.src = compressed;
          imgVal.value = compressed;
          showToast("Foto carregada com sucesso!");
        } catch (err) {
          alert("Erro ao processar imagem: " + err.message);
        }
      }
    });

    overlay.querySelector("#mrj-btn-url").addEventListener("click", () => {
      const url = prompt("Cole o link direto da imagem (URL da internet):", imgVal.value);
      if (url) {
        previewImg.src = url;
        imgVal.value = url;
      }
    });

    // Salvar Imóvel
    overlay.querySelector("#mrj-save-project").addEventListener("click", () => {
      const name = overlay.querySelector("#mrj-proj-name").value.trim();
      if (!name) {
        alert("Por favor, preencha o nome do empreendimento.");
        return;
      }

      const statusSelect = overlay.querySelector("#mrj-proj-status");
      const status = statusSelect.value;
      const statusLabel = statusSelect.options[statusSelect.selectedIndex].text;

      project.name = name;
      project.location = overlay.querySelector("#mrj-proj-loc").value.trim();
      project.description = overlay.querySelector("#mrj-proj-desc").value.trim();
      project.image = imgVal.value;
      project.status = status;
      project.statusLabel = statusLabel;
      project.tagNote = overlay.querySelector("#mrj-proj-tag").value.trim();
      project.area = overlay.querySelector("#mrj-proj-area").value.trim();
      project.suites = overlay.querySelector("#mrj-proj-suites").value.trim();
      project.vagas = overlay.querySelector("#mrj-proj-vagas").value.trim();
      project.whatsappMessage = overlay.querySelector("#mrj-proj-msg").value.trim() || `Quero saber mais sobre o ${name}`;
      project.pdfUrl = overlay.querySelector("#mrj-proj-pdf") ? overlay.querySelector("#mrj-proj-pdf").value.trim() : "";

      if (!isEditing) {
        siteData.projects.unshift(project);
      }

      saveSiteData(siteData);
      renderSiteFromData();
      updateVisualEditButtons();
      overlay.remove();
      showToast(isEditing ? "Imóvel atualizado!" : "Novo imóvel cadastrado com sucesso!");
    });

    // Excluir Imóvel
    if (isEditing) {
      overlay.querySelector("#mrj-delete-project").addEventListener("click", () => {
        if (confirm(`Tem certeza que deseja remover o imóvel "${project.name}"?`)) {
          siteData.projects = siteData.projects.filter(p => p.id !== projectId);
          saveSiteData(siteData);
          renderSiteFromData();
          updateVisualEditButtons();
          overlay.remove();
          showToast("Imóvel excluído.");
        }
      });
    }
  }

  // Modal Geral (Abas: Imóveis, Hero, Blog, Contatos, Supabase)
  function openGeneralModal(defaultTab = "tab-projects") {
    const overlay = document.createElement("div");
    overlay.className = "mrj-modal-overlay";
    overlay.innerHTML = `
      <div class="mrj-modal">
        <div class="mrj-modal-header">
          <h3>⚙️ Gerenciamento do Site (MRJ Builder)</h3>
          <button type="button" class="mrj-modal-close">✕</button>
        </div>

        <div class="mrj-tabs-bar">
          <button type="button" class="mrj-tab-btn ${defaultTab === 'tab-projects' ? 'active' : ''}" data-target="tab-projects">🏢 Imóveis (${siteData.projects.length})</button>
          <button type="button" class="mrj-tab-btn ${defaultTab === 'tab-leads' ? 'active' : ''}" data-target="tab-leads">📥 Leads Capturados</button>
          <button type="button" class="mrj-tab-btn ${defaultTab === 'tab-hero' ? 'active' : ''}" data-target="tab-hero">🖼️ Capa (Hero)</button>
          <button type="button" class="mrj-tab-btn ${defaultTab === 'tab-articles' ? 'active' : ''}" data-target="tab-articles">📰 Artigos & Blog</button>
          <button type="button" class="mrj-tab-btn ${defaultTab === 'tab-contacts' ? 'active' : ''}" data-target="tab-contacts">📞 Contatos & WhatsApp</button>
          <button type="button" class="mrj-tab-btn ${defaultTab === 'tab-supabase' ? 'active' : ''}" data-target="tab-supabase">⚡ Supabase & Nuvem</button>
          <button type="button" class="mrj-tab-btn ${defaultTab === 'tab-export' ? 'active' : ''}" data-target="tab-export">💾 Backup & Código</button>
        </div>

        <div class="mrj-modal-body">
          <!-- ABA 1: IMÓVEIS -->
          <div class="mrj-tab-content ${defaultTab === 'tab-projects' ? 'active' : ''}" id="tab-projects">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <span style="font-size:13px; color:#94a3b8;">Arraste ou use os botões para editar ou ordenar os imóveis na página.</span>
              <button type="button" class="mrj-btn mrj-btn-gold" id="mrj-tab-add-project" style="width:auto; padding:8px 14px; font-size:11px;">+ Novo Imóvel</button>
            </div>
            <div id="mrj-projects-list">
              ${renderProjectsListHtml()}
            </div>
          </div>

          <!-- ABA: LEADS CAPTURADOS -->
          <div class="mrj-tab-content ${defaultTab === 'tab-leads' ? 'active' : ''}" id="tab-leads">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
              <div>
                <h4 style="margin:0 0 4px; color:#fff; font-size:14px;">Contatos que solicitaram Books / PDFs</h4>
                <span style="font-size:11px; color:#94a3b8;">Sincronizados com a tabela 'leads' no Supabase.</span>
              </div>
              <div style="display:flex; gap:8px;">
                <button type="button" class="mrj-btn-small" id="mrj-btn-refresh-leads">🔄 Atualizar</button>
                <button type="button" class="mrj-btn-small" id="mrj-btn-export-leads" style="background:#10b981; border-color:#10b981; color:#fff;">📊 Baixar Excel/CSV</button>
              </div>
            </div>
            <div id="mrj-leads-table-container">
              <p style="text-align:center; color:#94a3b8; padding:30px;">Carregando contatos...</p>
            </div>
          </div>

          <!-- ABA 2: CAPA (HERO) -->
          <div class="mrj-tab-content ${defaultTab === 'tab-hero' ? 'active' : ''}" id="tab-hero">
            <form id="mrj-hero-form" class="mrj-form-grid">
              <div class="mrj-form-full">
                <label class="eyebrow" style="color:#b49a70;">IMAGEM DE FUNDO DA CAPA (HERO)</label>
                <div class="mrj-upload-box">
                  <input type="file" id="mrj-hero-file" accept="image/*" style="display:none;" />
                  <img id="mrj-hero-preview" src="${siteData.hero.image}" class="mrj-upload-preview" style="height:200px;" alt="Preview Hero" />
                  <div class="mrj-upload-actions">
                    <button type="button" class="mrj-btn-small" id="mrj-hero-upload-btn">📷 Escolher imagem do PC</button>
                    <button type="button" class="mrj-btn-small" id="mrj-hero-url-btn">🔗 Colar link de Imagem</button>
                  </div>
                  <input type="hidden" id="mrj-hero-img-val" value="${siteData.hero.image}" />
                </div>
              </div>

              <div>
                <div class="mrj-input-group">
                  <label>Etiqueta Superior</label>
                  <input type="text" id="mrj-hero-eyebrow" class="mrj-input" value="${siteData.hero.eyebrow}" />
                </div>
              </div>

              <div>
                <div class="mrj-input-group">
                  <label>Texto do Botão CTA</label>
                  <input type="text" id="mrj-hero-cta" class="mrj-input" value="${siteData.hero.ctaText}" />
                </div>
              </div>

              <div class="mrj-form-full">
                <div class="mrj-input-group">
                  <label>Título Principal (suporta &lt;em&gt; para destaque dourado)</label>
                  <input type="text" id="mrj-hero-title" class="mrj-input" value="${siteData.hero.title}" />
                </div>
              </div>

              <div class="mrj-form-full">
                <div class="mrj-input-group">
                  <label>Subtítulo / Texto de Apresentação</label>
                  <textarea id="mrj-hero-copy" class="mrj-input">${siteData.hero.copy}</textarea>
                </div>
              </div>
            </form>
          </div>

          <!-- ABA 3: ARTIGOS & BLOG -->
          <div class="mrj-tab-content ${defaultTab === 'tab-articles' ? 'active' : ''}" id="tab-articles">
            <p style="font-size:13px; color:#94a3b8; margin-top:0;">Edite os 3 artigos em destaque na seção "Leia Helbor".</p>
            <div id="mrj-articles-list">
              ${renderArticlesListHtml()}
            </div>
          </div>

          <!-- ABA 4: CONTATOS -->
          <div class="mrj-tab-content ${defaultTab === 'tab-contacts' ? 'active' : ''}" id="tab-contacts">
            <form id="mrj-contacts-form" class="mrj-form-grid">
              <div>
                <div class="mrj-input-group">
                  <label>Nome do Corretor / Marca</label>
                  <input type="text" id="mrj-conf-name" class="mrj-input" value="${siteData.settings.brokerName}" />
                </div>
              </div>

              <div>
                <div class="mrj-input-group">
                  <label>Sigla da Logo (2 letras)</label>
                  <input type="text" id="mrj-conf-mark" class="mrj-input" value="${siteData.settings.brokerMark}" maxlength="4" />
                </div>
              </div>

              <div>
                <div class="mrj-input-group">
                  <label>WhatsApp / Telefone para Exibição</label>
                  <input type="text" id="mrj-conf-phone-disp" class="mrj-input" value="${siteData.settings.phoneDisplay}" />
                </div>
              </div>

              <div>
                <div class="mrj-input-group">
                  <label>Número do WhatsApp (somente números com DDD)</label>
                  <input type="text" id="mrj-conf-phone-raw" class="mrj-input" value="${siteData.settings.phoneRaw}" placeholder="5541991080293" />
                </div>
              </div>

              <div class="mrj-form-full">
                <div class="mrj-input-group">
                  <label>E-mail de Atendimento</label>
                  <input type="email" id="mrj-conf-email" class="mrj-input" value="${siteData.settings.email}" />
                </div>
              </div>

              <div class="mrj-form-full">
                <div class="mrj-input-group">
                  <label>Senha de Acesso do Painel (?painel)</label>
                  <input type="text" id="mrj-conf-pass" class="mrj-input" value="${siteData.settings.adminPasswordHash || 'mrj@2025'}" />
                  <small style="color:#71737d;">Você pode alterar sua senha a qualquer momento.</small>
                </div>
              </div>
            </form>
          </div>

          <!-- ABA 5: SUPABASE -->
          <div class="mrj-tab-content ${defaultTab === 'tab-supabase' ? 'active' : ''}" id="tab-supabase">
            <div class="mrj-guide-box">
              <strong style="color:#10b981; display:block; margin-bottom:6px;">☁️ Integração com Supabase (Nuvem Gratuita)</strong>
              Ao conectar o Supabase, as fotos e dados que você alterar neste painel ficam salvos instantaneamente na nuvem, funcionando perfeitamente no <strong>Netlify</strong>, <strong>Hostinger</strong> ou <strong>Hostoo</strong> sem precisar de servidor PHP ou MySQL pago.
            </div>

            <div class="mrj-form-grid">
              <div class="mrj-form-full">
                <div class="mrj-input-group">
                  <label>Project URL do Supabase</label>
                  <input type="text" id="mrj-supa-url" class="mrj-input" value="${siteData.settings.supabaseUrl || ''}" placeholder="https://seu-projeto.supabase.co" />
                </div>
              </div>

              <div class="mrj-form-full">
                <div class="mrj-input-group">
                  <label>Project API Key (Anon / Public Key)</label>
                  <input type="text" id="mrj-supa-key" class="mrj-input" value="${siteData.settings.supabaseKey || ''}" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." />
                </div>
              </div>
            </div>

            <p style="font-size:12px; color:#94a3b8; margin-top:16px;">
              💡 <strong>Como ativar no Supabase:</strong> Crie um projeto gratuito em <code>supabase.com</code>, crie a tabela <code>mrj_site_data</code> com o script pronto que deixamos no arquivo <code>supabase-setup.sql</code> na pasta do seu site.
            </p>
          </div>

          <!-- ABA 6: EXPORTAÇÃO & BACKUP -->
          <div class="mrj-tab-content ${defaultTab === 'tab-export' ? 'active' : ''}" id="tab-export">
            <p style="font-size:13px; color:#94a3b8;">Baixe um arquivo <code>index.html</code> atualizado com todas as suas fotos e alterações já embutidas, pronto para subir no Netlify ou em qualquer hospedagem com 1 clique.</p>
            <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:20px;">
              <button type="button" class="mrj-btn mrj-btn-gold" id="mrj-btn-download-html" style="width:auto;">⬇️ Baixar index.html Atualizado</button>
              <button type="button" class="mrj-btn" id="mrj-btn-download-json" style="background:#2a2d38; width:auto;">📋 Baixar Backup dos Dados (JSON)</button>
              <button type="button" class="mrj-btn" id="mrj-btn-restore-default" style="background:#451a1a; color:#fca5a5; width:auto;">↺ Restaurar Dados Originais</button>
            </div>
          </div>
        </div>

        <div class="mrj-modal-footer">
          <span style="font-size:12px; color:#94a3b8;">MRJ Builder v1.0</span>
          <div style="display:flex; gap:10px;">
            <button type="button" class="mrj-btn mrj-modal-close" style="background:#2a2d38;">Fechar</button>
            <button type="button" class="mrj-btn mrj-btn-gold" id="mrj-save-all-general">Salvar Mudanças ✓</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Sistema de Abas
    overlay.querySelectorAll(".mrj-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        overlay.querySelectorAll(".mrj-tab-btn").forEach(b => b.classList.remove("active"));
        overlay.querySelectorAll(".mrj-tab-content").forEach(c => c.classList.remove("active"));

        btn.classList.add("active");
        const target = overlay.querySelector("#" + btn.dataset.target);
        if (target) {
          target.classList.add("active");
          if (btn.dataset.target === "tab-leads") {
            refreshLeadsView();
          }
        }
      });
    });

    async function refreshLeadsView() {
      const container = overlay.querySelector("#mrj-leads-table-container");
      if (!container) return;
      container.innerHTML = `<p style="text-align:center; color:#94a3b8; padding:30px;">Buscando contatos...</p>`;

      const leads = typeof getLeadsList === "function" ? await getLeadsList() : [];
      if (!leads || leads.length === 0) {
        container.innerHTML = `
          <div style="text-align:center; padding:40px 20px; background:#20222a; border-radius:8px;">
            <p style="color:#fff; font-weight:600; margin-bottom:6px;">Nenhum lead capturado ainda</p>
            <p style="color:#94a3b8; font-size:12px; margin:0;">Quando os visitantes clicarem em 'Conheça o projeto' e preencherem o formulário para baixar o PDF, o contato completo aparecerá aqui automaticamente!</p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <table style="width:100%; border-collapse:collapse; font-size:12px; text-align:left;">
          <thead>
            <tr style="border-bottom:1px solid rgba(255,255,255,0.1); color:#b49a70;">
              <th style="padding:10px 8px;">Data/Hora</th>
              <th style="padding:10px 8px;">Nome</th>
              <th style="padding:10px 8px;">WhatsApp</th>
              <th style="padding:10px 8px;">E-mail</th>
              <th style="padding:10px 8px;">Imóvel</th>
              <th style="padding:10px 8px; text-align:right;">Ação</th>
            </tr>
          </thead>
          <tbody>
            ${leads.map(l => {
              const cleanPhone = (l.phone || "").replace(/\D/g, "");
              const zapLink = cleanPhone ? `https://wa.me/55${cleanPhone.replace(/^55/, "")}?text=${encodeURIComponent(`Olá ${l.name}, vi que solicitou o book do ${l.project_name || 'imóvel'} no meu site.`)}` : "#";
              const dateStr = l.created_at ? new Date(l.created_at).toLocaleString('pt-BR') : "-";
              return `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                  <td style="padding:10px 8px; color:#94a3b8; font-size:11px;">${dateStr}</td>
                  <td style="padding:10px 8px; font-weight:600; color:#fff;">${l.name}</td>
                  <td style="padding:10px 8px; color:#e2e8f0;">${l.phone}</td>
                  <td style="padding:10px 8px; color:#94a3b8;">${l.email || '-'}</td>
                  <td style="padding:10px 8px; color:#d6b885;">${l.project_name || '-'}</td>
                  <td style="padding:10px 8px; text-align:right;">
                    ${cleanPhone ? `<a href="${zapLink}" target="_blank" rel="noreferrer" class="mrj-btn-small" style="background:#10b981; border:none; text-decoration:none; display:inline-block; font-size:11px;">Chamar no Zap ↗</a>` : ''}
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      `;
    }

    const refreshLeadsBtn = overlay.querySelector("#mrj-btn-refresh-leads");
    if (refreshLeadsBtn) refreshLeadsBtn.addEventListener("click", refreshLeadsView);

    const exportLeadsBtn = overlay.querySelector("#mrj-btn-export-leads");
    if (exportLeadsBtn) {
      exportLeadsBtn.addEventListener("click", async () => {
        const leads = typeof getLeadsList === "function" ? await getLeadsList() : [];
        if (!leads.length) {
          alert("Não há leads para exportar no momento.");
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
      refreshLeadsView();
    }

    // Fechar modal
    overlay.querySelectorAll(".mrj-modal-close").forEach(btn => {
      btn.addEventListener("click", () => overlay.remove());
    });

    // Novo Imóvel da aba
    const tabAddProjBtn = overlay.querySelector("#mrj-tab-add-project");
    if (tabAddProjBtn) {
      tabAddProjBtn.addEventListener("click", () => {
        overlay.remove();
        openProjectModal(null);
      });
    }

    // Ações dos Imóveis na lista
    setupProjectsListEvents(overlay);

    // Upload de Imagem do Hero
    const heroFileInput = overlay.querySelector("#mrj-hero-file");
    const heroPreviewImg = overlay.querySelector("#mrj-hero-preview");
    const heroImgVal = overlay.querySelector("#mrj-hero-img-val");

    overlay.querySelector("#mrj-hero-upload-btn").addEventListener("click", () => heroFileInput.click());

    heroFileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (file) {
        showToast("Otimizando imagem do banner...");
        const comp = await compressImage(file, 2200, 0.85);
        heroPreviewImg.src = comp;
        heroImgVal.value = comp;
        showToast("Imagem da capa carregada!");
      }
    });

    overlay.querySelector("#mrj-hero-url-btn").addEventListener("click", () => {
      const url = prompt("Cole o link da imagem da capa:", heroImgVal.value);
      if (url) {
        heroPreviewImg.src = url;
        heroImgVal.value = url;
      }
    });

    // Eventos dos artigos
    setupArticlesListEvents(overlay);

    // Baixar HTML
    overlay.querySelector("#mrj-btn-download-html").addEventListener("click", () => {
      downloadStaticHtml();
    });

    // Baixar JSON
    overlay.querySelector("#mrj-btn-download-json").addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(siteData, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "backup-mrj-dados.json";
      a.click();
    });

    // Restaurar originais
    overlay.querySelector("#mrj-btn-restore-default").addEventListener("click", () => {
      if (confirm("Deseja realmente restaurar todos os dados e fotos originais do site?")) {
        localStorage.removeItem(STORAGE_KEY);
        siteData = getSiteData();
        renderSiteFromData();
        overlay.remove();
        showToast("Dados originais restaurados.");
      }
    });

    // Salvar Tudo
    overlay.querySelector("#mrj-save-all-general").addEventListener("click", () => {
      // Atualizar Hero
      siteData.hero.image = heroImgVal.value;
      siteData.hero.eyebrow = overlay.querySelector("#mrj-hero-eyebrow").value.trim();
      siteData.hero.ctaText = overlay.querySelector("#mrj-hero-cta").value.trim();
      siteData.hero.title = overlay.querySelector("#mrj-hero-title").value.trim();
      siteData.hero.copy = overlay.querySelector("#mrj-hero-copy").value.trim();

      // Atualizar Contatos
      siteData.settings.brokerName = overlay.querySelector("#mrj-conf-name").value.trim();
      siteData.settings.brokerMark = overlay.querySelector("#mrj-conf-mark").value.trim();
      siteData.settings.phoneDisplay = overlay.querySelector("#mrj-conf-phone-disp").value.trim();
      siteData.settings.phoneRaw = overlay.querySelector("#mrj-conf-phone-raw").value.trim();
      siteData.settings.email = overlay.querySelector("#mrj-conf-email").value.trim();
      siteData.settings.adminPasswordHash = overlay.querySelector("#mrj-conf-pass").value.trim();

      // Atualizar Supabase
      siteData.settings.supabaseUrl = overlay.querySelector("#mrj-supa-url").value.trim();
      siteData.settings.supabaseKey = overlay.querySelector("#mrj-supa-key").value.trim();

      saveSiteData(siteData);
      renderSiteFromData();
      updateVisualEditButtons();
      overlay.remove();
      showToast("Configurações salvas com sucesso!");
    });
  }

  // HTML da Lista de Imóveis
  function renderProjectsListHtml() {
    if (siteData.projects.length === 0) {
      return `<p style="color:#94a3b8; text-align:center; padding:30px;">Nenhum imóvel cadastrado no momento.</p>`;
    }

    return siteData.projects.map((proj, idx) => `
      <div class="mrj-project-item" data-id="${proj.id}">
        <img src="${proj.image}" class="mrj-project-thumb" alt="${proj.name}" />
        <div class="mrj-project-meta">
          <h4 class="mrj-project-title">${proj.name}</h4>
          <p class="mrj-project-sub">${proj.statusLabel || proj.status} · ${proj.location}</p>
        </div>
        <div class="mrj-item-actions">
          <button type="button" class="mrj-btn-small mrj-proj-up" data-idx="${idx}" title="Subir posição" ${idx === 0 ? 'disabled style="opacity:0.4;"' : ''}>▲</button>
          <button type="button" class="mrj-btn-small mrj-proj-down" data-idx="${idx}" title="Descer posição" ${idx === siteData.projects.length - 1 ? 'disabled style="opacity:0.4;"' : ''}>▼</button>
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
        if (confirm("Deseja remover este imóvel?")) {
          siteData.projects = siteData.projects.filter(p => p.id !== btn.dataset.id);
          saveSiteData(siteData);
          renderSiteFromData();
          container.querySelector("#mrj-projects-list").innerHTML = renderProjectsListHtml();
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
          container.querySelector("#mrj-projects-list").innerHTML = renderProjectsListHtml();
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
          container.querySelector("#mrj-projects-list").innerHTML = renderProjectsListHtml();
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
          <input type="text" class="mrj-input mrj-art-title" data-idx="${idx}" value="${art.title}" style="margin-bottom:6px; font-weight:700;" placeholder="Título do artigo" />
          <textarea class="mrj-input mrj-art-desc" data-idx="${idx}" style="min-height:50px; font-size:12px;" placeholder="Descrição">${art.description}</textarea>
          <div style="display:flex; gap:8px; margin-top:8px;">
            <input type="text" class="mrj-input mrj-art-cat" data-idx="${idx}" value="${art.category}" placeholder="Categoria" style="width:180px; font-size:11px;" />
            <input type="text" class="mrj-input mrj-art-date" data-idx="${idx}" value="${art.date}" placeholder="Data de publicação" style="width:150px; font-size:11px;" />
            <button type="button" class="mrj-btn-small mrj-art-pic-btn" data-idx="${idx}">📷 Trocar Foto</button>
            <input type="file" class="mrj-art-file-input" data-idx="${idx}" accept="image/*" style="display:none;" />
          </div>
        </div>
      </div>
    `).join("");
  }

  function setupArticlesListEvents(container) {
    container.querySelectorAll(".mrj-art-pic-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = btn.dataset.idx;
        container.querySelector(`.mrj-art-file-input[data-idx="${idx}"]`).click();
      });
    });

    container.querySelectorAll(".mrj-art-file-input").forEach(input => {
      input.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        const idx = parseInt(input.dataset.idx, 10);
        if (file) {
          showToast("Otimizando foto do artigo...");
          const comp = await compressImage(file, 1000, 0.85);
          siteData.articles[idx].image = comp;
          saveSiteData(siteData);
          renderSiteFromData();
          container.querySelector("#mrj-articles-list").innerHTML = renderArticlesListHtml();
          setupArticlesListEvents(container);
          showToast("Foto do artigo alterada!");
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

    container.querySelectorAll(".mrj-art-cat").forEach(inp => {
      inp.addEventListener("change", () => {
        siteData.articles[inp.dataset.idx].category = inp.value.trim();
        saveSiteData(siteData);
        renderSiteFromData();
      });
    });

    container.querySelectorAll(".mrj-art-date").forEach(inp => {
      inp.addEventListener("change", () => {
        siteData.articles[inp.dataset.idx].date = inp.value.trim();
        saveSiteData(siteData);
        renderSiteFromData();
      });
    });
  }

  // Salvar no Supabase (se configurado)
  async function publishAllChanges() {
    saveSiteData(siteData);

    if (siteData.settings.supabaseUrl && siteData.settings.supabaseKey) {
      showToast("Sincronizando com o Supabase...");
      try {
        const url = `${siteData.settings.supabaseUrl.replace(/\/$/, '')}/rest/v1/mrj_site_data`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "apikey": siteData.settings.supabaseKey,
            "Authorization": `Bearer ${siteData.settings.supabaseKey}`,
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
          },
          body: JSON.stringify({
            id: 1,
            data: siteData,
            updated_at: new Date().toISOString()
          })
        });

        if (res.ok) {
          showToast("Publicado no Supabase com sucesso!");
        } else {
          const errText = await res.text();
          console.warn("Supabase response:", errText);
          showToast("Salvo localmente! (Aviso do Supabase no console)", false);
        }
      } catch (err) {
        console.error("Erro ao sincronizar com Supabase:", err);
        showToast("Salvo localmente! (Supabase indisponível)", false);
      }
    } else {
      showToast("Alterações salvas com sucesso!");
    }
  }

  // Gerador de Download do index.html Estático
  function downloadStaticHtml() {
    // Clona o documento atual sem os elementos administrativos
    const docClone = document.documentElement.cloneNode(true);

    // Remove barra administrativa, modais, etc.
    docClone.querySelectorAll(".mrj-admin-bar, .mrj-modal-overlay, .mrj-login-overlay, .mrj-toast, .mrj-inline-edit-btn").forEach(el => el.remove());
    docClone.classList.remove("mrj-admin-active", "mrj-visual-mode");

    const htmlContent = "<!doctype html>\n" + docClone.outerHTML;
    const blob = new Blob([htmlContent], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "index.html";
    a.click();
    showToast("Arquivo index.html pronto para publicação baixado!");
  }

  // Inicialização
  if (isAuthenticated()) {
    initAdminInterface();
  } else {
    renderLoginModal();
  }
})();

