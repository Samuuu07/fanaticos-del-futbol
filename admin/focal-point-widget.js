/* Cada control guarda su propio object-position. La imagen sigue siendo un único campo de Decap. */
(function () {
  const h = window.h || window.React?.createElement;
  if (!window.CMS || !window.createClass || !h) return;

  function percent(token) {
    if (token === "top" || token === "left") return 0;
    if (token === "bottom" || token === "right") return 100;
    return token?.endsWith("%") ? Math.min(100, Math.max(0, parseFloat(token))) : 50;
  }

  const Control = createClass({
    getInitialState() {
      return { image: "", inherited: "center center" };
    },

    componentDidMount() {
      // Decap da un ID único a cada campo, incluso con varios elementos de la lista abiertos.
      // El ancestro común más cercano reúne la imagen y los controles de este elemento.
      let scope = document.getElementById(this.props.forID)?.parentElement;
      while (scope && !scope.querySelector('label[for^="imagen-field-"]')) scope = scope.parentElement;
      if (!scope || scope.querySelectorAll('label[for^="imagen-field-"]').length !== 1) return;
      this.scope = scope;
      this.syncImage();
      this.observer = new MutationObserver(this.syncImage);
      this.observer.observe(scope, { childList: true, subtree: true, attributes: true, attributeFilter: ["src", "data-position"] });
    },

    componentWillUnmount() {
      this.observer?.disconnect();
    },

    syncImage() {
      const label = this.scope.querySelector('label[for^="imagen-field-"]');
      const control = label?.closest("[aria-label]");
      const image = control?.querySelector("img")?.src || "";
      const regular = this.scope.querySelector('[data-focal-field="imagen_pos"]');
      const inherited = regular?.dataset.position || "center center";
      if (image !== this.state.image || inherited !== this.state.inherited) this.setState({ image, inherited });
    },

    setPoint(x, y) {
      const clamp = n => Math.round(Math.max(0, Math.min(100, n)));
      this.props.onChange(`${clamp(x)}% ${clamp(y)}%`);
    },

    render() {
      const { field, forID, value, classNameWrapper } = this.props;
      const name = field.get("name");
      const featured = name === "imagen_pos_destacada";
      const position = value || (featured ? this.state.inherited : "center center");
      const [x, y] = position.split(/\s+/).map(percent);
      const ratio = field.get("preview_ratio") || "16 / 9";
      const image = this.state.image;
      return h("div", { id: forID, className: classNameWrapper, "data-focal-field": name, "data-position": position },
        image ? h("div", { className: "crop-editor" },
          h("div", null,
            h("p", null, "Elige el punto de interés"),
            h("div", { className: "crop-source", onClick: event => {
              const r = event.currentTarget.getBoundingClientRect();
              this.setPoint((event.clientX - r.left) * 100 / r.width, (event.clientY - r.top) * 100 / r.height);
            } },
              h("img", { src: image, alt: "Imagen completa", draggable: false }),
              h("span", { className: "crop-marker", style: { left: x + "%", top: y + "%" } })
            ),
            ...["Horizontal", "Vertical"].map((label, i) => h("label", { key: label, className: "crop-axis" },
              label, h("input", { type: "range", min: 0, max: 100, value: i ? y : x,
                onChange: e => i ? this.setPoint(x, e.target.value) : this.setPoint(e.target.value, y) })
            ))
          ),
          h("div", null,
            h("p", null, "Vista previa · " + ratio.replace(" / ", ":")),
            h("img", { className: "crop-preview", src: image, alt: "Recorte de la miniatura",
              style: { aspectRatio: ratio, objectPosition: position } }),
            featured && h("label", { className: "crop-inherit" },
              h("input", { type: "checkbox", checked: !value,
                onChange: e => this.props.onChange(e.target.checked ? "" : this.state.inherited) }),
              " Usar el punto de las tarjetas"
            )
          )
        ) : h("p", null, "Selecciona una imagen para ver y ajustar este recorte.")
      );
    }
  });
  CMS.registerWidget("focal-point", Control, ({ value }) => h("span", null, value || "Predeterminado"));
})();
