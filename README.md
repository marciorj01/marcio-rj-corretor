# Marcio Rogério - Corretor de Imóveis (Alto Padrão)

Site institucional de alto padrão para o corretor **Marcio Rogério**, especializado em empreendimentos selecionados em São Paulo (Higienópolis, Itaim Bibi, Helbor e região).

---

## 🚀 Tecnologias

- **Frontend**: HTML5 Semântico, CSS3 Moderno (Custom Properties, Flexbox, Grid), JavaScript Vanilla (ES6+)
- **Painel Administrativo Embutido**: MRJ Builder com Modo Visual ("Elementor Próprio")
- **Backend / Nuvem**: Supabase (Database & Storage)
- **Hospedagem & Deploy**: Netlify (com suporte a landing pages extras) / Hostinger / Hostoo

---

## 🔒 Painel Administrativo Oculto

Para acessar o painel de gerenciamento de imóveis e fotos:

1. Acesse: `https://seusite.com.br/?painel`
2. Digite a senha master configurada.
3. Recursos disponíveis:
   - Adicionar, editar, reordenar e excluir empreendimentos.
   - Upload de fotos com compressão automática.
   - Alteração do banner principal (Hero) e contatos.
   - Modo de Edição Visual Direta.
   - Sincronização em tempo real com o Supabase.
   - Backup e download do `index.html` estático.

---

## 📦 Estrutura de Arquivos

```text
├── index.html           # Página principal do site
├── styles.css           # Estilos visuais do site institucional
├── script.js            # Lógica reativa, filtros e carregamento sob demanda
├── data.js              # Estrutura de dados e sincronizador
├── admin.css            # Estilos exclusivos do Painel MRJ Builder
├── admin.js             # Lógica do painel administrativo e modo Elementor
├── supabase-setup.sql   # Script SQL para criar banco no Supabase
└── salvar.php           # Script opcional para hospedagens PHP (Hostinger/Hostoo)
```

