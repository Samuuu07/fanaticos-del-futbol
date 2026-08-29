/* ============================================================
   FANÁTICOS DEL FÚTBOL — Carga de datos
   Lee data/articulos.json y data/programas.json (editados desde
   /admin con Decap CMS) y reconstruye ARTICULOS / PROGRAMAS con
   el mismo formato que usaba el resto del sitio.
   ============================================================ */

const REDES = {
  instagram: "https://www.instagram.com/fanaticosdelfutbolll?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
  x: "https://x.com/FannaticosF",
  tiktok: "https://www.tiktok.com/@fanaticosdelfutbolll?_t=8rCnwKtU8vp&_r=1"
};

window.ARTICULOS = [];
window.PROGRAMAS = [];

function slugify(text) {
  return text
    .toString()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function cargarDatos() {
  const [resA, resP] = await Promise.all([
    fetch("data/articulos.json", { cache: "no-store" }),
    fetch("data/programas.json", { cache: "no-store" })
  ]);
  if (!resA.ok) throw new Error("No se ha podido leer data/articulos.json");
  if (!resP.ok) throw new Error("No se ha podido leer data/programas.json");

  const dataA = await resA.json();
  const dataP = await resP.json();

  const usados = new Set();
  window.ARTICULOS = (dataA.articulos || []).map(a => {
    let id = slugify(a.titulo || "articulo");
    let base = id, n = 2;
    while (usados.has(id)) { id = `${base}-${n++}`; }
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

  window.PROGRAMAS = (dataP.programas || []).map(p => ({
    titulo: p.titulo,
    fecha: p.fecha,
    imagen: p.imagen || "img/logofanaticossinfondo.png",
    link: p.link
  }));

  document.dispatchEvent(new Event("datosListos"));
}

cargarDatos().catch(err => {
  console.error("Error cargando contenido:", err);
  document.dispatchEvent(new Event("datosListos"));
});