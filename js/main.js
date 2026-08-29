/* ============================================================
   FANÁTICOS DEL FÚTBOL — Lógica compartida
   ============================================================ */

/* ---------- Iconos SVG reutilizables ---------- */
const ICONS = {
  arrow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  play: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>`,
  x: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.6 8.7L23.3 22h-6.9l-5.4-6.6L4.8 22H1.7l8.1-9.3L1 2h7l4.9 6z"/></svg>`,
  tiktok: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 3c.5 2.4 2 4 4.6 4.2V10c-1.6 0-3.1-.5-4.4-1.4v6.6a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v2.7a2.9 2.9 0 1 0 2 2.8V3H14z"/></svg>`
};

/* ---------- Menú móvil ---------- */
function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    document.body.classList.toggle("nav-open", isOpen);
    toggle.innerHTML = isOpen ? ICONS.close : ICONS.menu;
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
  nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
    nav.classList.remove("open");
    document.body.classList.remove("nav-open");
    toggle.innerHTML = ICONS.menu;
    toggle.setAttribute("aria-expanded", "false");
  }));
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
  if (!el || typeof ARTICULOS === "undefined") return;
  el.innerHTML = `
    <div class="ticker-item">
      <div class="ticker-num">${String(ARTICULOS.length).padStart(2, "0")}</div>
      <div class="ticker-label">Artículos publicados</div>
    </div>
    <div class="ticker-item">
      <div class="ticker-num">${String(PROGRAMAS.length).padStart(2, "0")}</div>
      <div class="ticker-label">Programas en Radio Marca</div>
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
function articleCardHTML(a, index) {
  return `
    <a class="card reveal" href="articulo.html?id=${a.id}" style="transition-delay:${(index % 3) * 80}ms">
      <div class="card-media">
        <img src="${a.imagen}" alt="${a.titulo}" loading="lazy">
        <span class="card-tag">${a.categoria}</span>
      </div>
      <div class="card-body">
        <h3>${a.titulo}</h3>
        <p class="card-excerpt">${a.resumen}</p>
        <span class="card-more">Leer artículo ${ICONS.arrow}</span>
      </div>
    </a>
  `;
}

/* ---------- Fila de programa ---------- */
function programRowHTML(p, index) {
  return `
    <div class="program-row reveal" style="transition-delay:${(index % 6) * 60}ms">
      <div class="program-thumb"><img src="${p.imagen}" alt="${p.titulo}" loading="lazy"></div>
      <div class="program-date">${p.fecha}</div>
      <div class="program-title">${p.titulo}</div>
      <a class="program-listen" href="${p.link}" target="_blank" rel="noopener">Escuchar ${ICONS.play}</a>
    </div>
  `;
}

/* ---------- Render de grids en cada página ---------- */
function renderArticlesGrid(selector, limit) {
  const el = document.querySelector(selector);
  if (!el || typeof ARTICULOS === "undefined") return;
  const items = limit ? ARTICULOS.slice(0, limit) : ARTICULOS;
  el.innerHTML = items.map(articleCardHTML).join("");
}

function renderProgramsList(selector, limit) {
  const el = document.querySelector(selector);
  if (!el || typeof PROGRAMAS === "undefined") return;
  const items = limit ? PROGRAMAS.slice(0, limit) : PROGRAMAS;
  el.innerHTML = items.map(programRowHTML).join("");
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
  initNav();
  initFooterYear();
  renderTicker();
  renderArticlesGrid("[data-articles-grid]", document.body.dataset.articlesLimit ? Number(document.body.dataset.articlesLimit) : null);
  renderProgramsList("[data-programs-list]", document.body.dataset.programsLimit ? Number(document.body.dataset.programsLimit) : null);
  initReveal();
});