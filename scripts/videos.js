const { escapeHtml, slugLooksValid } = require("./html");

const { resolverOrigen } = require("../js/origen-video");

function prepararVideos(data) {
  const ids = new Set();
  const videos = (data.videos || []).map(video => {
    if (!slugLooksValid(video.id) || ids.has(video.id)) {
      throw new Error("Identificador de vídeo inválido o repetido: " + video.id);
    }
    ids.add(video.id);

    const origenData = resolverOrigen(video);

    const imagen = String(video.imagen || "").replace(/^\/?(img\/)/, "$1");
    if (!imagen.startsWith("img/") || imagen.split("/").includes("..")) {
      throw new Error("Selecciona una miniatura de la biblioteca para " + video.id);
    }

    const [day, month, year] = String(video.fecha).split("/");
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(video.fecha)) {
      throw new Error("Revisa la fecha de " + video.id);
    }

    // Formato: si el usuario lo pone a mano tiene prioridad; si no, usamos el detectado
    const formato =
      video.formato === "vertical" || video.formato === "horizontal"
        ? video.formato
        : origenData.formatoDetectado || "horizontal";

    return {
      ...video,
      imagen,
      fechaISO: [year, month, day].join("-"),
      formato,
      ...origenData
    };
  });
  return videos.sort((a, b) => b.fechaISO.localeCompare(a.fechaISO));
}

function tarjeta(video) {
  const pos = /^(?:center|left|right|\d{1,3}%)(?: (?:center|top|bottom|\d{1,3}%))?$/.test(
    video.imagen_pos
  )
    ? video.imagen_pos
    : "center center";
  return `<a class="card video-card" href="videos/${video.id}.html">
          <div class="card-media">
            <img src="${escapeHtml(video.imagen)}" loading="lazy" alt="" style="--card-focus:${pos}">
            <span class="video-play" aria-hidden="true"></span>
          </div>
          <div class="card-body">
            <div class="video-meta"><span>${escapeHtml(video.tipo)}</span> <time datetime="${video.fechaISO}">${escapeHtml(video.fecha)}</time></div>
            <h3>${escapeHtml(video.titulo)}</h3>
          </div>
        </a>`;
}

function tarjetasVideo(videos, portada) {
  if (!videos.length) return portada ? "" : '<p class="empty-state">Todavía no hay vídeos publicados.</p>';
  const cards = `<div class="grid video-grid">${videos.map(tarjeta).join("\n        ")}</div>`;
  if (!portada) return '<h2 class="archive-heading">Todos los vídeos</h2>\n        ' + cards;
  return `<section class="section home-videos" aria-labelledby="videos-portada">
      <div class="wrap">
        <div class="section-head">
          <h2 id="videos-portada">Vídeos y entrevistas</h2>
          <a class="section-link" href="videos.html">Ver todos los vídeos</a>
        </div>
        ${cards}
      </div>
    </section>`;
}

function actualizarBloque(html, contenido) {
  const inicio = "<!-- videos:inicio -->";
  const fin = "<!-- videos:fin -->";
  const start = html.indexOf(inicio);
  const end = html.indexOf(fin);
  if (start < 0 || end < start) throw new Error("Faltan los marcadores de la sección de vídeos.");
  const indent = html.slice(html.lastIndexOf("\n", start) + 1, start);
  return (
    html.slice(0, start + inicio.length) +
    "\n" +
    (contenido ? indent + contenido + "\n" : "") +
    indent +
    html.slice(end)
  );
}

/**
 * Genera el HTML del reproductor según el origen del vídeo.
 */
function htmlReproductor(video) {
  const titulo = escapeHtml(video.titulo);
  const vertical = video.formato === "vertical";
  const clase = `video-player${vertical ? " video-vertical" : ""}`;

  switch (video.origen) {
    case "archivo": {
      const src = escapeHtml(video.enlaceExterno);
      const poster = video.imagen ? ` poster="../${escapeHtml(video.imagen)}"` : "";
      return `<div class="${clase}${video.formato === "original" ? " video-original" : ""}">
            <video src="${src}" controls playsinline preload="metadata"${poster} title="${titulo}">
              Tu navegador no soporta la reproducción de vídeo.
            </video>
          </div>`;
    }

    case "youtube":
      return `<div class="${clase}">
            <iframe src="https://www.youtube-nocookie.com/embed/${video.youtubeId}" title="${titulo}"
              referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe>
          </div>`;

    case "instagram":
      // El embed oficial ajusta su altura al Reel y a los controles de la publicación.
      return `<div class="${clase} video-instagram">
            <blockquote class="instagram-media" data-instgrm-permalink="${escapeHtml(video.instagramPermalink)}" data-instgrm-version="14">
              <a href="${escapeHtml(video.instagramPermalink)}" aria-label="Ver en Instagram: ${titulo}">
                <img src="../${escapeHtml(video.imagen)}" alt="">
              </a>
            </blockquote>
          </div>
          <script async src="https://www.instagram.com/embed.js"></script>`;

    case "tiktok":
      return `<div class="${clase}">
            <iframe src="https://www.tiktok.com/player/v1/${video.tiktokId}" title="${titulo}"
              referrerpolicy="strict-origin-when-cross-origin" allow="fullscreen" allowfullscreen></iframe>
          </div>`;

    default:
      return `<p class="empty-state">No se puede reproducir este vídeo.</p>`;
  }
}

function contenidoVideo(video, articulo) {
  const titulo = escapeHtml(video.titulo);
  const enlace =
    video.enlaceExterno && video.etiquetaExterna
      ? `<a class="section-link" href="${escapeHtml(video.enlaceExterno)}" target="_blank" rel="noopener">${escapeHtml(video.etiquetaExterna)}</a>`
      : "";

  return `<article class="article-layout video-story">
          <header class="article-header">
            <a class="back-link" href="../videos.html">Volver a vídeos y entrevistas</a>
            <span class="eyebrow">${escapeHtml(video.tipo)}</span>
            <h1>${titulo}</h1>
            <div class="article-meta"><time datetime="${video.fechaISO}">${escapeHtml(video.fecha)}</time>
              ${video.persona ? `<span>Con <strong>${escapeHtml(video.persona)}</strong></span>` : ""}
            </div>
          </header>
          ${htmlReproductor(video)}
          ${enlace}
          ${video.descripcion ? `<p class="video-description">${escapeHtml(video.descripcion)}</p>` : ""}
          ${video.transcripcion ? `<details class="video-transcript"><summary>Leer la transcripción</summary><p>${escapeHtml(video.transcripcion)}</p></details>` : ""}
          ${articulo ? `<p class="video-related">Artículo relacionado · <a class="section-link" href="../articulos/${articulo.id}.html">${escapeHtml(articulo.titulo)}</a></p>` : ""}
        </article>`;
}

module.exports = { prepararVideos, contenidoVideo, tarjetasVideo, actualizarBloque };
