/**
 * Fanáticos del Fútbol — Widget "Encuadre para tarjeta"
 * ------------------------------------------------------------
 * Guarda un string CSS object-position, p.ej. "45% 30%" o "center 20%".
 * Muestra la imagen del campo "imagen" del mismo artículo, permite
 * hacer clic para elegir el punto de interés, y previsualiza en vivo
 * cómo se verá en la card (object-fit: cover + object-position).
 *
 * Uso en config.yml (colección artículos):
 *   - { label: "Imagen", name: "imagen", widget: "image" }
 *   - label: "Encuadre para tarjeta"
 *     name: "imagen_pos"
 *     widget: "focal-point"
 *     required: false
 *     default: "center center"
 *     hint: "Haz clic en la zona importante (cara, balón…). Se usa solo en las cards."
 *
 * Carga en admin/index.html (DESPUÉS de decap-cms.js):
 *   <script src="/admin/focal-point-widget.js"></script>
 */
(function () {
  if (typeof CMS === "undefined" || typeof createClass === "undefined") {
    console.error("[focal-point] CMS no está cargado. Incluye este script después de decap-cms.js");
    return;
  }

  var h = window.h || (window.React && window.React.createElement);
  if (!h) {
    console.error("[focal-point] React.createElement / h no disponible");
    return;
  }

  var CARD_W = 320;
  var CARD_H = 180; // proporción aproximada de .card-media (220px en desktop ~ 16:10)

  var FocalPointControl = createClass({
    getInitialState: function () {
      return { imgNatural: null };
    },

    /** Lee la ruta de imagen del mismo entry (campo "imagen"). */
    getImagePath: function () {
      try {
        var entry = this.props.entry;
        if (entry && entry.getIn) {
          var path = entry.getIn(["data", "imagen"]);
          if (path) return String(path);
        }
      } catch (e) { }
      // Fallback: a veces está en fieldsMetaData
      return null;
    },

    parsePos: function (value) {
      // "45% 30%" | "center center" | "center 20%"
      var v = (value || "center center").trim();
      var parts = v.split(/\s+/);
      if (parts.length < 2) return { x: 50, y: 50 };

      function toPct(token, axis) {
        if (token === "center" || token === "centre") return 50;
        if (token === "left" || token === "top") return 0;
        if (token === "right" || token === "bottom") return 100;
        var m = String(token).match(/^([\d.]+)%$/);
        if (m) return Math.max(0, Math.min(100, parseFloat(m[1])));
        return 50;
      }
      return { x: toPct(parts[0], "x"), y: toPct(parts[1], "y") };
    },

    formatPos: function (x, y) {
      return Math.round(x) + "% " + Math.round(y) + "%";
    },

    handleClick: function (e) {
      var rect = e.currentTarget.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width) * 100;
      var y = ((e.clientY - rect.top) / rect.height) * 100;
      x = Math.max(0, Math.min(100, x));
      y = Math.max(0, Math.min(100, y));
      this.props.onChange(this.formatPos(x, y));
    },

    render: function () {
      var value = this.props.value || "center center";
      var pos = this.parsePos(value);
      var imgPath = this.getImagePath();
      var forID = this.props.forID;
      var classNameWrapper = this.props.classNameWrapper;

      // Resolver URL de la imagen para el admin (rutas relativas del repo)
      var imgSrc = imgPath
        ? (imgPath.indexOf("http") === 0 || imgPath.charAt(0) === "/"
          ? imgPath
          : "/" + imgPath.replace(/^\.\//, ""))
        : null;

      return h(
        "div",
        { className: classNameWrapper, id: forID, style: { maxWidth: 640 } },
        h(
          "p",
          {
            style: {
              margin: "0 0 10px",
              fontSize: 13,
              color: "#666",
              lineHeight: 1.4,
            },
          },
          "Haz clic en el punto importante de la foto (cara, balón, acción…). ",
          "A la derecha verás cómo quedará en la tarjeta de la portada."
        ),

        !imgSrc &&
        h(
          "p",
          {
            style: {
              padding: 16,
              background: "#f5f5f5",
              border: "1px dashed #ccc",
              borderRadius: 6,
              color: "#888",
              fontSize: 13,
            },
          },
          "Sube primero la imagen del artículo (campo «Imagen») para poder encuadrarla."
        ),

        imgSrc &&
        h(
          "div",
          {
            style: {
              display: "flex",
              flexWrap: "wrap",
              gap: 20,
              alignItems: "flex-start",
            },
          },
          // --- Foto completa + marcador ---
          h(
            "div",
            { style: { flex: "1 1 280px", maxWidth: 420 } },
            h(
              "div",
              {
                onClick: this.handleClick,
                title: "Clic para elegir el punto de interés",
                style: {
                  position: "relative",
                  cursor: "crosshair",
                  border: "1px solid #ddd",
                  borderRadius: 6,
                  overflow: "hidden",
                  background: "#111",
                  userSelect: "none",
                },
              },
              h("img", {
                src: imgSrc,
                alt: "Imagen del artículo",
                draggable: false,
                style: {
                  display: "block",
                  width: "100%",
                  height: "auto",
                  pointerEvents: "none",
                },
              }),
              // Cruz / punto
              h("div", {
                style: {
                  position: "absolute",
                  left: pos.x + "%",
                  top: pos.y + "%",
                  width: 18,
                  height: 18,
                  marginLeft: -9,
                  marginTop: -9,
                  borderRadius: "50%",
                  border: "2px solid #fff",
                  background: "rgba(227, 6, 19, 0.85)",
                  boxShadow: "0 0 0 1px rgba(0,0,0,0.35)",
                  pointerEvents: "none",
                },
              })
            ),
            h(
              "p",
              {
                style: {
                  margin: "8px 0 0",
                  fontSize: 12,
                  fontFamily: "monospace",
                  color: "#444",
                },
              },
              "Encuadre: ",
              h("strong", null, value)
            )
          ),

          // --- Preview tipo card ---
          h(
            "div",
            { style: { flex: "0 0 auto" } },
            h(
              "div",
              {
                style: {
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#888",
                  marginBottom: 6,
                },
              },
              "Vista previa de la tarjeta"
            ),
            h(
              "div",
              {
                style: {
                  width: CARD_W,
                  border: "1px solid #e0e0e0",
                  borderRadius: 4,
                  overflow: "hidden",
                  background: "#fff",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                },
              },
              h(
                "div",
                {
                  style: {
                    width: "100%",
                    height: CARD_H,
                    overflow: "hidden",
                    background: "#0d0d0d",
                  },
                },
                h("img", {
                  src: imgSrc,
                  alt: "",
                  style: {
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: value,
                    display: "block",
                  },
                })
              ),
              h(
                "div",
                { style: { padding: "10px 12px" } },
                h(
                  "div",
                  {
                    style: {
                      height: 10,
                      width: "70%",
                      background: "#eee",
                      borderRadius: 2,
                      marginBottom: 6,
                    },
                  },
                  null
                ),
                h(
                  "div",
                  {
                    style: {
                      height: 8,
                      width: "90%",
                      background: "#f3f3f3",
                      borderRadius: 2,
                    },
                  },
                  null
                )
              )
            )
          )
        )
      );
    },
  });

  var FocalPointPreview = createClass({
    render: function () {
      return h(
        "span",
        { style: { fontFamily: "monospace", fontSize: 12 } },
        this.props.value || "center center"
      );
    },
  });

  CMS.registerWidget("focal-point", FocalPointControl, FocalPointPreview);
  console.info('[focal-point] Widget "focal-point" registrado');
})();
