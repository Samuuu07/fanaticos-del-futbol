/* ============================================================
   FANÁTICOS DEL FÚTBOL — Carga de datos
   Lee data/articulos.json y data/programas.json (editados desde
   /admin con Decap CMS) y reconstruye ARTICULOS / PROGRAMAS con
   el mismo formato que usaba el resto del sitio.

   - El id de cada artículo viene fijo del JSON (campo "id"),
     nunca se recalcula desde el título: así un artículo ya
     publicado no cambia de URL si se edita el título después,
     y publicar dos artículos con títulos parecidos no puede
     "robarle" la URL a uno ya publicado.
   - articulos.json y programas.json se cargan y parsean de
     forma independiente: si uno de los dos está roto, el otro
     sigue funcionando en vez de tirar todo el sitio a la vez.
   ============================================================ */

const REDES = {
  instagram: "https://www.instagram.com/fanaticosdelfutbolll?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
  x: "https://x.com/FannaticosF",
  tiktok: "https://www.tiktok.com/@fanaticosdelfutbolll?_t=8rCnwKtU8vp&_r=1"
};

// null = todavía no se sabe / falló la carga (distinto de "cargado pero vacío": [])
window.ARTICULOS = null;
window.PROGRAMAS = null;
window.ARTICULOS_ERROR = false;
window.PROGRAMAS_ERROR = false;

function slugifyFallback(text) {
  // Solo se usa si un artículo llegara sin id (dato viejo o error humano al
  // publicar): mejor mostrar algo navegable que romper la tarjeta.
  return text
    .toString()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function cargarArticulos() {
  try {
    const res = await fetch("data/articulos.json", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();

    const usados = new Set();
    window.ARTICULOS = (data.articulos || []).map(a => {
      let id = (a.id && a.id.trim()) ? slugifyFallback(a.id) : slugifyFallback(a.titulo || "articulo");
      let base = id, n = 2;
      while (usados.has(id)) { id = `${base}-${n++}`; } // red de seguridad si dos ids coinciden
      usados.add(id);

      const parrafos = (a.contenido || "")
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(Boolean);

      let resumen = parrafos[0] || "";
      if (resumen.length > 160) resumen = resumen.slice(0, 157).trim() + "...";

      return {
        id,
        titulo: a.titulo,
        fecha: a.fecha,
        imagen: a.imagen,
        resumen,
        categoria: a.categoria,
        autor: a.autor || "Manuel Cavia",
        parrafos
      };
    });
  } catch (err) {
    console.error("Error cargando data/articulos.json:", err);
    window.ARTICULOS = null;
    window.ARTICULOS_ERROR = true;
  } finally {
    document.dispatchEvent(new Event("articulosListos"));
  }
}

async function cargarProgramas() {
  try {
    const res = await fetch("data/programas.json", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();

    window.PROGRAMAS = (data.programas || []).map(p => ({
      titulo: p.titulo,
      fecha: p.fecha,
      imagen: p.imagen || "img/logofanaticossinfondo.png",
      link: p.link
    }));
  } catch (err) {
    console.error("Error cargando data/programas.json:", err);
    window.PROGRAMAS = null;
    window.PROGRAMAS_ERROR = true;
  } finally {
    document.dispatchEvent(new Event("programasListos"));
  }
}

Promise.allSettled([cargarArticulos(), cargarProgramas()]).then(() => {
  document.dispatchEvent(new Event("datosListos"));
});