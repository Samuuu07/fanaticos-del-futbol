#!/usr/bin/env node
/* ============================================================
   FANÁTICOS DEL FÚTBOL — Generador de contenido estático
   ------------------------------------------------------------
   Lee data/articulos.json y data/videos.json y genera:
     - articulos/<id>.html   (uno por artículo, con Open Graph
       reales, diseño idéntico a la web, sin depender de JS
       para pintar el contenido)
     - videos/<id>.html       y tarjetas en index.html y videos.html
     - sitemap.xml            (páginas fijas, artículos y vídeos)

   Se ejecuta automáticamente desde GitHub Actions cada vez que
   cambia uno de los dos JSON. El "id" de cada artículo (campo
   fijo, ya validado por el CMS) es la única fuente de verdad
   para la URL — nunca se recalcula desde el título aquí.
   ============================================================ */

const fs = require("fs");
const { escapeHtml, slugLooksValid } = require("./html");
const { prepararVideos, contenidoVideo, tarjetasVideo, actualizarBloque } = require("./videos");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SITE_URL = "https://samuuu07.github.io/fanaticos-del-futbol";
const ARTICLES_JSON = path.join(ROOT, "data", "articulos.json");
const OUTPUT_DIR = path.join(ROOT, "articulos");
const SITEMAP_PATH = path.join(ROOT, "sitemap.xml");

const REDES = {
  instagram: "https://www.instagram.com/fanaticosdelfutbolll?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
  x: "https://x.com/FannaticosF",
  tiktok: "https://www.tiktok.com/@fanaticosdelfutbolll?_t=8rCnwKtU8vp&_r=1"
};

/* ---------- Markdown seguro (solo negrita, cursiva y títulos) ----------
   Nunca se confía en el texto: primero se escapa TODO como HTML (igual
   que antes), y solo después se buscan los símbolos de formato sobre el
   texto ya escapado. Así, aunque alguien escriba <script> a mano en el
   editor, sale como texto literal, nunca como HTML real. No se soporta
   ningún otro símbolo de markdown (listas, enlaces, imágenes, HTML
   embebido...) — lo que no se reconoce se muestra tal cual, en texto. */
function formatearLineaMarkdown(textoEscapado) {
  return textoEscapado
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>");
}

function bloqueMarkdownAHtml(bloque) {
  const texto = bloque.trim();
  const h2 = texto.match(/^##\s+(.+)$/);
  if (h2) return `<h2 class="article-heading">${formatearLineaMarkdown(escapeHtml(h2[1].trim()))}</h2>`;
  const h3 = texto.match(/^###\s+(.+)$/);
  if (h3) return `<h3 class="article-subheading">${formatearLineaMarkdown(escapeHtml(h3[1].trim()))}</h3>`;
  return `<p>${formatearLineaMarkdown(escapeHtml(texto))}</p>`;
}

/* Quita los símbolos de markdown para usar el texto en resúmenes/meta
   (donde no se quiere ver **esto** literal, solo "esto"). */
function markdownATextoPlano(texto) {
  return String(texto || "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .trim();
}

function absoluteUrl(relativePath) {
  if (!relativePath) return SITE_URL + "/";
  return `${SITE_URL}/${String(relativePath).replace(/^\/+/, "")}`;
}


/* ---------- Cargar y validar datos ---------- */
if (!fs.existsSync(ARTICLES_JSON)) {
  console.error(`No existe ${ARTICLES_JSON}, no se genera nada.`);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(ARTICLES_JSON, "utf8"));
const articulosOriginal = Array.isArray(raw.articulos) ? raw.articulos : [];

const usados = new Set();
const articulos = [];
articulosOriginal.forEach((a, idx) => {
  if (!slugLooksValid(a.id)) {
    console.warn(`⚠️  Artículo #${idx} ("${a.titulo || "sin título"}") no tiene un "id" válido — se omite. Corrige el id desde /admin.`);
    return;
  }
  if (usados.has(a.id)) {
    console.warn(`⚠️  Id duplicado "${a.id}" (artículo "${a.titulo}") — se omite el duplicado, revísalo desde /admin.`);
    return;
  }
  usados.add(a.id);
  articulos.push(a);
});

/* ---------- Preparar cada artículo (mismo cálculo que js/data.js) ---------- */
const preparados = articulos.map(a => {
  const parrafos = (a.contenido || "")
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);

  // El resumen usa el primer bloque que NO sea un título (## / ###),
  // con el markdown quitado, para que no aparezcan símbolos sueltos
  // en las tarjetas ni en la descripción para redes sociales.
  const primerParrafo = parrafos.find(p => !/^#{2,3}\s+/.test(p)) || parrafos[0] || "";
  let resumen = markdownATextoPlano(primerParrafo);
  if (resumen.length > 160) resumen = resumen.slice(0, 157).trim() + "...";

  // "mayusculas" = comportamiento actual (CSS text-transform: uppercase)
  // "normal"    = se muestra tal como se escribió en el CMS
  const caja = (a.caja === "normal") ? "normal" : "mayusculas";

  return {
    id: a.id,
    titulo: a.titulo || "",
    fecha: a.fecha || "",
    imagen: a.imagen || "img/logofanaticossinfondo.png",
    imagenIzquierda: a.imagen_lado === "izquierda",
    categoria: a.categoria || "",
    autor: a.autor || "Manuel Cavia",
    resumen,
    parrafos,
    caja
  };
});

/* ---------- Plantilla HTML de un artículo ---------- */
function socialIconsHTML() {
  const ICONS = {
    instagram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>`,
    x: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.6 8.7L23.3 22h-6.9l-5.4-6.6L4.8 22H1.7l8.1-9.3L1 2h7l4.9 6z"/></svg>`,
    tiktok: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 3c.5 2.4 2 4 4.6 4.2V10c-1.6 0-3.1-.5-4.4-1.4v6.6a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v2.7a2.9 2.9 0 1 0 2 2.8V3H14z"/></svg>`
  };
  return `
        <a href="${escapeHtml(REDES.instagram)}" target="_blank" rel="noopener" aria-label="Instagram">${ICONS.instagram}</a>
        <a href="${escapeHtml(REDES.x)}" target="_blank" rel="noopener" aria-label="X">${ICONS.x}</a>
        <a href="${escapeHtml(REDES.tiktok)}" target="_blank" rel="noopener" aria-label="TikTok">${ICONS.tiktok}</a>`;
}

function articuloHTML(art, prev, next) {
  const canonical = absoluteUrl(`articulos/${art.id}.html`);
  const imagenAbs = absoluteUrl(art.imagen);
  const tituloEsc = escapeHtml(art.titulo);
  const resumenEsc = escapeHtml(art.resumen);
  // Clase en <body> para controlar mayúsculas/minúsculas del título y lead
  const bodyCaseClass = art.caja === "normal" ? "article-case-normal" : "article-case-upper";

  const parrafosHTML = art.parrafos.length
    ? art.parrafos.map(bloqueMarkdownAHtml).join("\n              ")
    : `<p>${resumenEsc}</p>`;

  const navHTML = `
            <nav class="article-nav" aria-label="Artículos anterior y siguiente">
              ${prev ? `
                <a href="${escapeHtml(prev.id)}.html" class="article-nav-card prev">
                  <span class="article-nav-label">&larr; Artículo anterior</span>
                  <span class="article-nav-title">${escapeHtml(prev.titulo)}</span>
                </a>
              ` : ""}
              ${next ? `
                <a href="${escapeHtml(next.id)}.html" class="article-nav-card next">
                  <span class="article-nav-label">Siguiente artículo &rarr;</span>
                  <span class="article-nav-title">${escapeHtml(next.titulo)}</span>
                </a>
              ` : ""}
            </nav>`;

  const contenido = `<article class="article-layout">
            <header class="article-header">
                <a class="back-link" href="../articulos.html">&larr; Volver a todos los artículos</a>
                <span class="eyebrow">${escapeHtml(art.categoria)}</span>
                <h1>${tituloEsc}</h1>
                <div class="article-meta">
                    <span>Por <strong>${escapeHtml(art.autor)}</strong></span>
                    <span>•</span>
                    <span>${escapeHtml(art.fecha)}</span>
                </div>
            </header>

            <div class="article-content">
              <figure class="article-featured-media${art.imagenIzquierda ? " article-featured-media--left" : ""}">
                <img src="../${escapeHtml(art.imagen)}" alt="${tituloEsc}">
              </figure>
              ${parrafosHTML}
            </div>
            ${navHTML}
        </article>`;
  return paginaDetalle({ canonical, imagenAbs, tituloEsc, resumenEsc, bodyClass: bodyCaseClass, contenido });
}

function paginaDetalle({ canonical, imagenAbs, tituloEsc, resumenEsc, bodyClass, contenido, esVideo = false }) {
  return `<!doctype html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${tituloEsc} — Fanáticos del Fútbol</title>
    <meta name="description" content="${resumenEsc}">
    <link rel="canonical" href="${canonical}">

    <meta property="og:type" content="${esVideo ? "video.other" : "article"}">
    <meta property="og:site_name" content="Fanáticos del Fútbol">
    <meta property="og:title" content="${tituloEsc}">
    <meta property="og:description" content="${resumenEsc}">
    <meta property="og:image" content="${escapeHtml(imagenAbs)}">
    <meta property="og:url" content="${canonical}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${tituloEsc}">
    <meta name="twitter:description" content="${resumenEsc}">
    <meta name="twitter:image" content="${escapeHtml(imagenAbs)}">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet">
    <link rel="stylesheet" href="../css/styles.css">
    <link rel="icon" type="image/png" href="../img/logofanaticossinfondo.png">
    <script data-goatcounter="https://fanaticosdelfutbol.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
</head>

<body class="${bodyClass}">

    <a class="skip-link" href="#article-main">Saltar al contenido</a>
    <header class="site-header">
        <div class="wrap">
            <a class="brand" href="../" aria-label="Fanáticos del Fútbol — Inicio">
                <img src="../img/logofanaticossinfondo.png" srcset="../img/fanaticos-marca.webp 1x" width="52" height="52" alt="Logo Fanáticos del Fútbol">
                <span class="brand-name">Fanáticos del fútbol<span>.</span></span>
            </a>
            <nav class="main-nav" id="menu-principal" aria-label="Navegación principal">
                <a href="../">Inicio</a>
                <a href="../articulos.html"${esVideo ? "" : ' aria-current="page"'}>Artículos</a>
                <a href="../programas.html">Programas</a>
                <a href="../videos.html"${esVideo ? ' aria-current="page"' : ""}>Vídeos y entrevistas</a>
                <a href="../index.html#quienes-somos">Quiénes somos</a>
                <div class="header-social">${socialIconsHTML()}
                </div>
            </nav>
            <button type="button" aria-controls="menu-principal" class="nav-toggle" aria-label="Abrir menú" aria-expanded="false"></button>
        </div>
    </header>

    <main id="article-main">
        ${contenido}
    </main>

    <footer class="site-footer">
        <div class="wrap">
            <div class="footer-top">
                <div class="footer-col">
                    <div class="footer-brand">
                        <img src="../img/logofanaticossinfondo.png" srcset="../img/fanaticos-marca.webp 1x" width="52" height="52" alt="Logo Fanáticos del Fútbol">
                        <span class="brand-name">Fanáticos del Fútbol</span>
                    </div>
                    <p>Periodismo deportivo sobre el Burgos CF. Artículos, opinión y radio, hechos por un aficionado para aficionados.</p>
                    <div class="footer-social">${socialIconsHTML()}
                    </div>
                </div>
                <div class="footer-col">
                    <h4>Navegación</h4>
                    <ul>
                        <li><a href="../">Inicio</a></li>
                        <li><a href="../articulos.html">Artículos</a></li>
                        <li><a href="../programas.html">Programas</a></li>
                        <li><a href="../videos.html">Vídeos y entrevistas</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                  <h4>Vive! Radio</h4>
                  <p>Cada martes en directo, de 23 a 00, con nuestro propio programa, Fanáticos del BCF.</p>
                </div>
            </div>
            <div class="footer-bottom">
                <span class="footer-credits">
                    Desarrollado por <a href="https://www.instagram.com/_saamuuu._/" target="_blank" rel="noopener">Samuel Antón</a>
                </span>
                <span>© <span data-year></span> Fanáticos del Fútbol</span>
                <span>Hecho con pasión blanquinegra</span>
            </div>
        </div>
    </footer>

    <script src="../js/main.js"></script>
</body>

</html>
`;
}

/* ---------- Generar los HTML ---------- */
const videos = prepararVideos(JSON.parse(fs.readFileSync(path.join(ROOT, "data", "videos.json"), "utf8")));
const archivoVideos = tarjetasVideo(videos, false);
const portadaVideos = tarjetasVideo(videos.slice(0, 3), true);
const paginasConVideos = [
  [path.join(ROOT, "videos.html"), archivoVideos],
  [path.join(ROOT, "index.html"), portadaVideos]
].map(([archivo, bloque]) => [archivo, actualizarBloque(fs.readFileSync(archivo, "utf8"), bloque)]);

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Limpiar HTML de artículos que ya no existen (evita basura acumulada)
const idsActuales = new Set(preparados.map(a => a.id));
if (fs.existsSync(OUTPUT_DIR)) {
  fs.readdirSync(OUTPUT_DIR).forEach(file => {
    if (!file.endsWith(".html")) return;
    const id = file.replace(/\.html$/, "");
    if (!idsActuales.has(id)) {
      fs.unlinkSync(path.join(OUTPUT_DIR, file));
      console.log(`🗑️  Eliminado articulos/${file} (ya no existe en articulos.json)`);
    }
  });
}

preparados.forEach((art, i) => {
  const prev = i > 0 ? preparados[i - 1] : null;
  const next = i < preparados.length - 1 ? preparados[i + 1] : null;
  const html = articuloHTML(art, prev, next);
  fs.writeFileSync(path.join(OUTPUT_DIR, `${art.id}.html`), html, "utf8");
});
console.log(`✅ Generados ${preparados.length} artículos en /articulos`);

/* ---------- Páginas de vídeo y colecciones ---------- */
const carpetaVideos = path.join(ROOT, "videos");
fs.mkdirSync(carpetaVideos, { recursive: true });
const archivosVideos = new Set();
for (const video of videos) {
  const archivo = video.id + ".html";
  archivosVideos.add(archivo);
  const html = paginaDetalle({
    canonical: absoluteUrl("videos/" + archivo),
    imagenAbs: absoluteUrl(video.imagen),
    tituloEsc: escapeHtml(video.titulo),
    resumenEsc: escapeHtml(video.descripcion || video.titulo),
    bodyClass: "video-detail",
    contenido: contenidoVideo(video, preparados.find(art => art.id === video.articulo)),
    esVideo: true
  });
  fs.writeFileSync(path.join(carpetaVideos, archivo), html, "utf8");
}
for (const file of fs.readdirSync(carpetaVideos)) {
  if (file.endsWith(".html") && !archivosVideos.has(file)) fs.unlinkSync(path.join(carpetaVideos, file));
}
for (const [archivo, html] of paginasConVideos) {
  fs.writeFileSync(archivo, html, "utf8");
}

/* ---------- Generar sitemap.xml ---------- */
function urlEntry(loc, changefreq, priority) {
  return `  <url>
    <loc>${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

const entradas = [
  urlEntry(`${SITE_URL}/`, "weekly", "1.0"),
  urlEntry(`${SITE_URL}/articulos.html`, "weekly", "0.8"),
  urlEntry(`${SITE_URL}/programas.html`, "weekly", "0.7"),
  urlEntry(`${SITE_URL}/videos.html`, "weekly", "0.7"),
  ...videos.map(v => urlEntry(absoluteUrl(`videos/${v.id}.html`), "monthly", "0.6")),
  ...preparados.map(a => urlEntry(absoluteUrl(`articulos/${a.id}.html`), "monthly", "0.6"))
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

${entradas.join("\n\n")}

</urlset>
`;

fs.writeFileSync(SITEMAP_PATH, sitemap, "utf8");
console.log(`✅ sitemap.xml regenerado con ${entradas.length} URLs`);
