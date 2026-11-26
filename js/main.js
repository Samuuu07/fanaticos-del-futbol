/* ============================================================
   FANÁTICOS DEL FÚTBOL — Lógica compartida
   ============================================================ */

/* ---------- Escapar HTML (todo lo que viene del CMS es texto, no marcado) ---------- */
function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ---------- Iconos SVG reutilizables ---------- */
const ICONS = {
  news: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h4v4H7zM14 9h3m-3 4h3M7 16h10"/></svg>`,
  headphones: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="12" width="4.5" height="8" rx="2"/><rect x="16.5" y="12" width="4.5" height="8" rx="2"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2.4"/></svg>`,
  play: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>`,
  x: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.6 8.7L23.3 22h-6.9l-5.4-6.6L4.8 22H1.7l8.1-9.3L1 2h7l4.9 6z"/></svg>`,
  tiktok: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 3c.5 2.4 2 4 4.6 4.2V10c-1.6 0-3.1-.5-4.4-1.4v6.6a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v2.7a2.9 2.9 0 1 0 2 2.8V3H14z"/></svg>`,
  external: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/></svg>`
};

/* ---------- Menú móvil ---------- */
function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (!toggle || !nav) return;
  const setOpen = (isOpen) => {
    nav.classList.toggle("open", isOpen);
    toggle.innerHTML = isOpen ? ICONS.close : ICONS.menu;
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
  };
  const header = toggle.closest("header");
  header.classList.add("interactive");
  toggle.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("open")) {
      setOpen(false);
      toggle.focus();
    }
  });
  document.addEventListener("pointerdown", (event) => {
    if (nav.classList.contains("open") && !header.contains(event.target)) setOpen(false);
  });
  header.addEventListener("focusout", (event) => {
    if (event.relatedTarget && !header.contains(event.relatedTarget)) setOpen(false);
  });
  window.matchMedia("(max-width: 55rem)").addEventListener("change", () => setOpen(false));
}

/* ---------- Revelado al hacer scroll ---------- */
function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;
  if (!("IntersectionObserver" in window)) {
    items.forEach(el => el.classList.add("in-view"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  items.forEach(el => io.observe(el));
}

/* ---------- Año en el footer ---------- */
function initFooterYear() {
  const el = document.querySelector("[data-year]");
  if (el) el.textContent = new Date().getFullYear();
}

/* ---------- Ticker de cifras (hero de inicio) ---------- */
function renderTicker() {
  const el = document.querySelector("[data-ticker]");
  if (!el) return;
  if (window.ARTICULOS_ERROR || window.PROGRAMAS_ERROR) {
    el.innerHTML = `<div class="ticker-item"><div class="ticker-label" style="color:#ff9d9d;">No se ha podido cargar el contenido. Recarga la página en un momento.</div></div>`;
    return;
  }
  const ARTICULOS = window.ARTICULOS || [];
  const PROGRAMAS = window.PROGRAMAS || [];
  el.innerHTML = `
    <div class="ticker-item">
      <div class="ticker-num">${String(ARTICULOS.length).padStart(2, "0")}</div>
      <div class="ticker-label">Artículos publicados</div>
    </div>
    <div class="ticker-item">
      <div class="ticker-num">${String(PROGRAMAS.length).padStart(2, "0")}</div>
      <div class="ticker-label">Programas</div>
    </div>
    <div class="ticker-item">
      <div class="ticker-num">Martes</div>
      <div class="ticker-label">En directo cada semana</div>
    </div>
    <div class="ticker-item">
      <div class="ticker-num">Burgos <span>CF</span></div>
      <div class="ticker-label">Nuestra pasión, blanquinegra</div>
    </div>
  `;
}

/* ---------- Tarjeta de artículo ---------- */
function articleCardHTML(a) {
  const position = value => CSS.supports("object-position", value) ? escapeHtml(value) : "center center";
  const regular = position(a.imagen_pos);
  const featured = a.imagen_pos_destacada ? position(a.imagen_pos_destacada) : regular;
  return `
    <a class="card reveal" href="articulos/${escapeHtml(a.id)}.html">
      <div class="card-media">
        <img src="${escapeHtml(a.imagen)}" alt="${escapeHtml(a.titulo)}" loading="lazy" style="--card-focus:${regular}; --featured-focus:${featured}">
        <span class="card-tag">${escapeHtml(a.categoria)}</span>
      </div>
      <div class="card-body">
        <span class="card-date">${escapeHtml(a.fecha)}</span>
        <h3>${escapeHtml(a.titulo)}</h3>
        <p class="card-excerpt">${escapeHtml(a.resumen)}</p>
        <span class="card-more">Leer artículo</span>
      </div>
    </a>
  `;
}

/* ---------- Fila de programa ---------- */
function programRowHTML(p) {
  const platform = /^https:\/\/open\.spotify\.com\//i.test(p.link) ? " en Spotify" : "";
  return `
    <div class="program-row reveal">
    <div class="program-thumb"><img src="${escapeHtml(p.imagen)}" alt="${escapeHtml(p.titulo)}" loading="lazy" style="object-position:${escapeHtml(p.imagen_pos || 'center 20%')}"></div>
    <div class="program-date">${escapeHtml(p.fecha)}</div>
    <h3 class="program-title">${escapeHtml(p.titulo)}</h3>
    <a class="program-listen" href="${escapeHtml(p.link)}" target="_blank" rel="noopener" title="Escuchar${platform} (se abre en una pestaña nueva)">${ICONS.play}<span>Escuchar<span class="platform">${platform}</span></span><span class="sr-only"> ${escapeHtml(p.titulo)} (enlace externo, se abre en una pestaña nueva)</span></a>
    </div>
  `;
}

/* ---------- Render de grids en cada página ---------- */
function renderArticlesGrid(selector, limit) {
  const el = document.querySelector(selector);
  if (!el) return;
  if (window.ARTICULOS_ERROR) {
    el.innerHTML = `<p class="empty-state">No se han podido cargar los artículos. Vuelve a intentarlo en unos minutos.</p>`;
    return;
  }
  const ARTICULOS = window.ARTICULOS || [];
  const items = limit ? ARTICULOS.slice(0, limit) : ARTICULOS;
  el.innerHTML = items.length ? items.map(articleCardHTML).join("") : `<p class="empty-state">Todavía no hay artículos publicados.</p>`;
}

function renderProgramsList(selector, limit) {
  const el = document.querySelector(selector);
  if (!el) return;
  if (window.PROGRAMAS_ERROR) {
    el.innerHTML = `<p class="empty-state">No se han podido cargar los programas. Vuelve a intentarlo en unos minutos.</p>`;
    return;
  }
  const PROGRAMAS = window.PROGRAMAS || [];
  const items = limit ? PROGRAMAS.slice(0, limit) : PROGRAMAS;
  el.innerHTML = items.length ? items.map(programRowHTML).join("") : `<p class="empty-state">Todavía no hay programas publicados.</p>`;
}

function initArticleFilters() {
  const toolbar = document.querySelector("[data-archive-tools]");
  const articles = window.ARTICULOS || [];
  if (!toolbar || !articles.length) return;

  const search = toolbar.querySelector("[data-search]");
  const categories = toolbar.querySelector("[data-categories]");
  const status = document.querySelector("[data-results]");
  const cards = document.querySelectorAll("#archivo .card");
  const normalize = (text) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const searchable = articles.map(a => normalize([a.titulo, a.autor, a.categoria, ...a.parrafos].join(" ")));
  let active = "";

  function update() {
    const term = normalize(search.value.trim());
    let count = 0;
    articles.forEach((article, i) => {
      const visible = (!active || article.categoria === active) && searchable[i].includes(term);
      cards[i].hidden = !visible;
      if (visible) count++;
    });
    status.textContent = count ? `${count} ${count === 1 ? "artículo" : "artículos"}`
      : "Ningún artículo coincide. Prueba con otra búsqueda o categoría.";
  }

  const values = [...new Set(articles.map(a => a.categoria).filter(Boolean))];
  for (const category of ["", ...values.sort((a, b) => a.localeCompare(b, "es"))]) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = category || "Todas";
    button.setAttribute("aria-pressed", String(category === active));
    button.setAttribute("aria-controls", "archivo");
    button.addEventListener("click", () => {
      active = category;
      for (const item of categories.children) item.setAttribute("aria-pressed", String(item === button));
      update();
    });
    categories.append(button);
  }
  search.addEventListener("input", update);
  toolbar.hidden = false;
  update();
}

/* ---------- Inyectar iconos estáticos (header/footer social) ---------- */
function injectStaticIcons() {
  document.querySelectorAll("[data-icon]").forEach(el => {
    const name = el.getAttribute("data-icon");
    if (ICONS[name]) el.innerHTML = ICONS[name];
  });
  const toggle = document.querySelector(".nav-toggle");
  if (toggle) toggle.innerHTML = ICONS.menu;
}

/* ---------- Init general ---------- */
document.addEventListener("DOMContentLoaded", () => {
  injectStaticIcons();
  document.querySelectorAll("[data-social]").forEach(link => {
    if (typeof REDES !== "undefined" && REDES[link.dataset.social]) link.href = REDES[link.dataset.social];
  });
  initNav();
  initFooterYear();
});

document.addEventListener("datosListos", () => {
  renderTicker();
  renderArticlesGrid("[data-articles-grid]", document.body.dataset.articlesLimit ? Number(document.body.dataset.articlesLimit) : null);
  renderProgramsList("[data-programs-list]", document.body.dataset.programsLimit ? Number(document.body.dataset.programsLimit) : null);
  initArticleFilters();
  initReveal();
});
