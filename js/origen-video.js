/**
 * Detecta el origen del vídeo y extrae los datos necesarios.
 * Soporta:
 *   - archivo local  → campo "archivo" (ej: "videos/entrevista.mp4")
 *   - YouTube        → url de youtube.com / youtu.be / shorts
 *   - Instagram Reel → url de instagram.com/reel/ o /p/
 *   - TikTok         → url de tiktok.com/@user/video/ID
 *
 * El formato (vertical / horizontal) se detecta automáticamente:
 *   - Instagram y TikTok → siempre vertical
 *   - YouTube Shorts     → vertical
 *   - YouTube normal     → horizontal
 *   - Archivo local      → proporciones originales
 * Si el usuario pone "formato" a mano, ese valor tiene prioridad.
 */
function resolverOrigen(video) {
  // 1. Archivo original subido al repositorio
  if (video.archivo) {
    const archivo = String(video.archivo).replace(/^\/+/, "");
    const segmentosInvalidos = archivo.split("/").some(segmento => !segmento || segmento === "." || segmento === "..");
    if (!/^(videos|media|img)\//.test(archivo) || segmentosInvalidos || archivo.includes("\\")) {
      throw new Error(
        `Ruta de archivo no válida en el vídeo "${video.id}". Usa "videos/nombre.mp4" o "media/nombre.mp4".`
      );
    }
    if (!/\.(mp4|webm|ogg|mov)$/i.test(archivo)) {
      throw new Error(
        `Formato de vídeo no soportado en "${video.id}". Usa mp4, webm, ogg o mov.`
      );
    }
    return {
      origen: "archivo",
      archivo,
      enlaceExterno: "../" + archivo.split("/").map(encodeURIComponent).join("/"),
      etiquetaExterna: "Abrir archivo original",
      formatoDetectado: "original"
    };
  }

  if (!video.url || typeof video.url !== "string") {
    throw new Error(
      `El vídeo "${video.id}" necesita un campo "url" (YouTube / Instagram / TikTok) o "archivo" (vídeo original).`
    );
  }

  let source;
  try {
    source = new URL(video.url.trim());
  } catch {
    throw new Error(`URL inválida en el vídeo "${video.id}": ${video.url}`);
  }

  if (source.protocol !== "https:" || source.username || source.password || source.port) {
    throw new Error(`La URL del vídeo "${video.id}" debe usar https.`);
  }

  const host = source.hostname.replace(/^www\./, "");
  const path = source.pathname;
  const segments = path.split("/").filter(Boolean);

  // 2. YouTube
  if (host === "youtu.be" || host === "youtube.com" || host === "m.youtube.com") {
    let youtubeId;
    let esShort = false;

    if (host === "youtu.be") {
      youtubeId = segments[0];
    } else {
      if (segments[0] === "shorts") {
        youtubeId = segments[1];
        esShort = true;
      } else if (segments[0] === "watch") {
        youtubeId = source.searchParams.get("v");
      } else if (["embed", "live"].includes(segments[0])) {
        youtubeId = segments[1];
      }
    }

    if (typeof youtubeId !== "string" || !/^[\w-]{11}$/.test(youtubeId)) {
      throw new Error(`Revisa el enlace de YouTube del vídeo "${video.id}".`);
    }

    return {
      origen: "youtube",
      youtubeId,
      enlaceExterno: `https://www.youtube.com/watch?v=${youtubeId}`,
      etiquetaExterna: "Ver en YouTube",
      formatoDetectado: esShort ? "vertical" : "horizontal"
    };
  }

  // 3. Instagram (Reel o post) → casi siempre vertical
  if (host === "instagram.com") {
    const tipo = segments[0];
    const code = segments[1];
    if (!["reel", "p", "tv"].includes(tipo) || !code || !/^[A-Za-z0-9_-]+$/.test(code)) {
      throw new Error(
        `Enlace de Instagram no válido en "${video.id}". Usa un enlace de Reel o publicación (ej: https://www.instagram.com/reel/XXXX/).`
      );
    }
    const permalink = `https://www.instagram.com/${tipo}/${code}/`;
    return {
      origen: "instagram",
      instagramPermalink: permalink,
      enlaceExterno: permalink,
      etiquetaExterna: "Ver en Instagram",
      formatoDetectado: "vertical"
    };
  }

  // 4. TikTok → siempre vertical
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
    let videoId = null;
    const videoIdx = segments.indexOf("video");
    if (videoIdx >= 0 && segments[videoIdx + 1]) {
      videoId = segments[videoIdx + 1];
    }
    if (!videoId && segments[0] === "v" && segments[1]) {
      videoId = segments[1];
    }
    if (!videoId) {
      videoId = source.searchParams.get("item_id") || source.searchParams.get("video_id");
    }
    if (!videoId || !/^\d+$/.test(videoId)) {
      throw new Error(
        `Enlace de TikTok no válido en "${video.id}". Usa el enlace completo del vídeo (ej: https://www.tiktok.com/@usuario/video/1234567890).`
      );
    }
    const permalink = source.href;
    return {
      origen: "tiktok",
      tiktokId: videoId,
      tiktokPermalink: permalink,
      enlaceExterno: permalink,
      etiquetaExterna: "Ver en TikTok",
      formatoDetectado: "vertical"
    };
  }

  throw new Error(
    `Origen no soportado en el vídeo "${video.id}". ` +
    `Usa un archivo local ("archivo"), YouTube, Instagram Reel o TikTok.`
  );
}

// El editor y el generador validan exactamente los mismos valores.
if (typeof module !== "undefined" && module.exports) module.exports = { resolverOrigen };
