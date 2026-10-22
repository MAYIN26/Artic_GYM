/* =========================================================
   ARTIC GYM · Panel de administración
   Permite editar tienda, café, membresías, instalaciones y datos
   de contacto sin tocar código.
   ========================================================= */
(function () {
  "use strict";

  const App = window.ArticApp;
  const { esc, clone } = App;
  const TOKEN_KEY = "articgym-admin-token";
  // Contraseña solo para el modo demostración (sitio abierto sin servidor).
  // En el servidor real la contraseña se define con la variable ADMIN_PASSWORD.
  const DEMO_PASSWORD = "artic2026";

  const ui = { root: null, draft: null, tab: "products", dirty: false, token: null, busy: false };

  /* ---------- Rutas tipo "products.0.name" ---------- */
  function getPath(obj, path) {
    return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
  }
  function setPath(obj, path, value) {
    const keys = path.split(".");
    const last = keys.pop();
    const target = keys.reduce((o, k) => o[k], obj);
    target[last] = value;
  }
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  /* ---------- Estructura del modal ---------- */
  function build() {
    const el = document.createElement("div");
    el.className = "admin";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "Panel de administración");
    el.innerHTML = `
      <div class="admin-backdrop" data-act="close"></div>
      <div class="admin-panel">
        <header class="admin-top">
          <div class="admin-title"><img src="assets/img/logo.svg" alt="" width="32" height="32"><span>Panel <b>ARTIC GYM</b></span></div>
          <button type="button" class="admin-x" data-act="close" aria-label="Cerrar panel">✕</button>
        </header>
        <div class="admin-body"></div>
      </div>`;
    document.body.appendChild(el);
    el.addEventListener("click", onClick);
    el.addEventListener("input", onInput);
    el.addEventListener("change", onChange);
    el.addEventListener("submit", onSubmit);
    el.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    return el;
  }

  async function open() {
    await App.ready;
    if (!ui.root) ui.root = build();
    try { ui.token = sessionStorage.getItem(TOKEN_KEY); } catch (e) { ui.token = null; }
    ui.root.classList.add("is-open");
    document.body.style.overflow = "hidden";
    if (ui.token || (App.Store.mode === "demo" && ui.demoAuthed)) startEditing();
    else renderLogin();
  }

  function close() {
    if (ui.dirty && !confirm("Tienes cambios sin guardar. ¿Salir de todos modos?")) return;
    ui.dirty = false;
    ui.root.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  /* ---------- Login ---------- */
  function renderLogin(msg) {
    body().innerHTML = `
      <form class="admin-login" data-form="login">
        <img src="assets/img/logo.svg" alt="" width="64" height="64">
        <h2>Acceso de administrador</h2>
        <p>Ingresa la contraseña para editar el catálogo, el café y los precios.</p>
        <label class="field"><span>Contraseña</span>
          <input type="password" name="password" autocomplete="current-password" required autofocus>
        </label>
        ${msg ? `<p class="admin-error">${esc(msg)}</p>` : ""}
        <button class="btn btn-primary" type="submit">Entrar</button>
        ${App.Store.mode === "demo" ? `<p class="admin-hint">Modo demostración · contraseña: <code>${DEMO_PASSWORD}</code></p>` : ""}
      </form>`;
    const input = body().querySelector("input");
    setTimeout(() => input && input.focus(), 50);
  }

  async function login(password) {
    if (App.Store.mode === "demo") {
      if (password !== DEMO_PASSWORD) return renderLogin("Contraseña incorrecta.");
      ui.demoAuthed = true;
      return startEditing();
    }
    try {
      const res = await fetch("api/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.token) return renderLogin(json.error || "Contraseña incorrecta.");
      ui.token = json.token;
      try { sessionStorage.setItem(TOKEN_KEY, ui.token); } catch (e) { /* sin sessionStorage */ }
      startEditing();
    } catch (e) {
      renderLogin("No se pudo conectar con el servidor.");
    }
  }

  function logout() {
    if (ui.dirty && !confirm("Tienes cambios sin guardar. ¿Cerrar sesión de todos modos?")) return;
    ui.token = null; ui.demoAuthed = false; ui.dirty = false;
    try { sessionStorage.removeItem(TOKEN_KEY); } catch (e) { /* nada */ }
    renderLogin();
  }

  /* ---------- Editor ---------- */
  const TABS = [
    ["products", "Tienda"],
    ["cafe", "Café"],
    ["plans", "Membresías"],
    ["facilities", "Instalaciones"],
    ["settings", "Contacto y redes"]
  ];

  function startEditing() {
    ui.draft = clone(App.data);
    ui.dirty = false;
    renderEditor();
  }

  function body() { return ui.root.querySelector(".admin-body"); }

  function renderEditor() {
    const demo = App.Store.mode === "demo";
    body().innerHTML = `
      ${demo ? `<div class="admin-banner">Modo demostración: los cambios se guardan solo en este navegador. Con el servidor publicado (ver README) se guardan para todos los visitantes.</div>` : ""}
      <nav class="admin-tabs" role="tablist">
        ${TABS.map(([k, label]) => `<button type="button" role="tab" class="admin-tab${ui.tab === k ? " is-active" : ""}" aria-selected="${ui.tab === k}" data-tab="${k}">${label}</button>`).join("")}
      </nav>
      <div class="admin-content">${renderTab()}</div>
      <footer class="admin-bar">
        <span class="admin-status" id="admin-status">${ui.dirty ? "Cambios sin guardar" : "Todo guardado"}</span>
        <div class="admin-bar-actions">
          <button type="button" class="btn btn-sm btn-ghost" data-act="logout">Cerrar sesión</button>
          <button type="button" class="btn btn-sm btn-ghost" data-act="discard"${ui.dirty ? "" : " disabled"}>Descartar</button>
          <button type="button" class="btn btn-sm btn-primary" data-act="save"${ui.dirty ? "" : " disabled"}>Guardar y publicar</button>
        </div>
      </footer>`;
  }

  function rerenderContent() {
    const content = body().querySelector(".admin-content");
    const scroll = content.scrollTop;
    content.innerHTML = renderTab();
    content.scrollTop = scroll;
  }

  function markDirty() {
    ui.dirty = true;
    const st = body().querySelector("#admin-status");
    if (st) { st.textContent = "Cambios sin guardar"; st.className = "admin-status is-dirty"; }
    body().querySelectorAll('[data-act="save"],[data-act="discard"]').forEach((b) => (b.disabled = false));
  }

  /* ---------- Campos reutilizables ---------- */
  function field(label, path, opts = {}) {
    const v = getPath(ui.draft, path);
    const type = opts.type || "text";
    let val = v;
    if (type === "list") val = (v || []).join(", ");
    if (type === "lines") val = (v || []).join("\n");
    const attrs = `data-bind="${esc(path)}" data-type="${type}"${opts.placeholder ? ` placeholder="${esc(opts.placeholder)}"` : ""}`;
    let input;
    if (type === "lines" || type === "textarea") input = `<textarea rows="${opts.rows || 3}" ${attrs}>${esc(val)}</textarea>`;
    else if (type === "number") input = `<div class="money"><span>$</span><input type="number" inputmode="decimal" min="0" step="1" value="${esc(val)}" ${attrs}></div>`;
    else input = `<input type="text" value="${esc(val)}" ${attrs}>`;
    return `<label class="field${opts.wide ? " field--wide" : ""}"><span>${esc(label)}${opts.help ? ` <small>${esc(opts.help)}</small>` : ""}</span>${input}</label>`;
  }

  function toggle(label, path) {
    const v = !!getPath(ui.draft, path);
    return `<label class="switch"><input type="checkbox" data-bind="${esc(path)}" data-type="bool"${v ? " checked" : ""}><span class="switch-ui"></span><span>${esc(label)}</span></label>`;
  }

  function imageField(path, alt) {
    const v = getPath(ui.draft, path) || "";
    const src = App.safeImg(v);
    return `
      <div class="img-field">
        <div class="img-preview">${src ? `<img src="${esc(src)}" alt="${esc(alt || "")}">` : `<span>Sin foto</span>`}</div>
        <div class="img-actions">
          <label class="btn btn-sm btn-blue file-btn">Cambiar foto
            <input type="file" accept="image/*" data-img="${esc(path)}">
          </label>
          <span class="img-note">JPG o PNG. Se ajusta automáticamente.</span>
        </div>
      </div>`;
  }

  function moveBtns(listPath, i, len) {
    return `<div class="row-tools">
      <button type="button" class="icon-btn" title="Subir" aria-label="Subir" data-act="move" data-list="${listPath}" data-i="${i}" data-dir="-1"${i === 0 ? " disabled" : ""}>↑</button>
      <button type="button" class="icon-btn" title="Bajar" aria-label="Bajar" data-act="move" data-list="${listPath}" data-i="${i}" data-dir="1"${i === len - 1 ? " disabled" : ""}>↓</button>
      <button type="button" class="icon-btn icon-btn--danger" title="Eliminar" aria-label="Eliminar" data-act="remove" data-list="${listPath}" data-i="${i}">🗑</button>
    </div>`;
  }

  /* ---------- Pestañas ---------- */
  function renderTab() {
    const d = ui.draft;
    switch (ui.tab) {
      case "products":
        return `
          <div class="admin-section-head">
            <div><h3>Catálogo de ropa</h3><p>Edita productos, fotos, tallas y disponibilidad.</p></div>
            <button type="button" class="btn btn-sm btn-primary" data-act="add-product">+ Agregar producto</button>
          </div>
          ${d.products.length ? "" : `<p class="admin-empty">No hay productos. Agrega el primero.</p>`}
          ${d.products.map((p, i) => `
            <div class="admin-card${p.soldOut ? " is-soldout" : ""}">
              ${moveBtns("products", i, d.products.length)}
              ${imageField(`products.${i}.image`, p.name)}
              <div class="admin-fields">
                ${field("Nombre", `products.${i}.name`, { wide: true })}
                ${field("Precio (MXN)", `products.${i}.price`, { type: "number" })}
                ${field("Categoría", `products.${i}.category`, { placeholder: "Playeras, Sudaderas…" })}
                ${field("Tallas", `products.${i}.sizes`, { type: "list", wide: true, help: "separadas por coma", placeholder: "CH, M, G, XG" })}
                ${toggle("Agotado", `products.${i}.soldOut`)}
              </div>
            </div>`).join("")}`;

      case "cafe":
        return `
          <div class="admin-section-head">
            <div><h3>Menú del café</h3><p>Edita productos y precios de cada categoría.</p></div>
          </div>
          ${d.cafe.map((cat, ci) => `
            <div class="admin-card admin-card--stack">
              <div class="admin-fields">${field("Categoría", `cafe.${ci}.name`, { wide: true })}</div>
              <div class="admin-sublist">
                ${(cat.items || []).map((it, ii) => `
                  <div class="admin-subrow">
                    ${field("Producto", `cafe.${ci}.items.${ii}.name`)}
                    ${field("Precio", `cafe.${ci}.items.${ii}.price`, { type: "number" })}
                    ${field("Descripción", `cafe.${ci}.items.${ii}.desc`, { wide: true })}
                    ${moveBtns(`cafe.${ci}.items`, ii, cat.items.length)}
                  </div>`).join("")}
              </div>
              <button type="button" class="btn btn-sm btn-ghost" data-act="add-cafe-item" data-ci="${ci}">+ Agregar a ${esc(cat.name)}</button>
            </div>`).join("")}`;

      case "plans":
        return `
          <div class="admin-section-head">
            <div><h3>Membresías</h3><p>Precios y beneficios. "Destacar" resalta la tarjeta en naranja.</p></div>
            <button type="button" class="btn btn-sm btn-primary" data-act="add-plan">+ Agregar membresía</button>
          </div>
          ${d.plans.map((p, i) => `
            <div class="admin-card admin-card--stack">
              ${moveBtns("plans", i, d.plans.length)}
              <div class="admin-fields">
                ${field("Nombre", `plans.${i}.name`, { wide: true })}
                ${field("Precio (MXN)", `plans.${i}.price`, { type: "number" })}
                ${field("Periodo", `plans.${i}.period`, { placeholder: "mes" })}
                ${field("Etiqueta", `plans.${i}.badge`, { help: "opcional", placeholder: "Precio estudiante" })}
                ${field("Nota", `plans.${i}.note`, { help: "opcional", placeholder: "Presentando credencial vigente" })}
                ${field("Beneficios", `plans.${i}.features`, { type: "lines", wide: true, rows: 4, help: "uno por línea" })}
                ${toggle("Destacar esta tarjeta", `plans.${i}.highlight`)}
              </div>
            </div>`).join("")}`;

      case "facilities":
        return `
          <div class="admin-section-head">
            <div><h3>Instalaciones</h3><p>Sube aquí las fotos reales del gym.</p></div>
          </div>
          ${d.facilities.map((f, i) => `
            <div class="admin-card">
              ${imageField(`facilities.${i}.image`, f.title)}
              <div class="admin-fields">
                ${field("Título", `facilities.${i}.title`, { wide: true })}
                ${field("Descripción", `facilities.${i}.text`, { type: "textarea", wide: true })}
              </div>
            </div>`).join("")}`;

      case "settings":
        return `
          <div class="admin-section-head"><div><h3>Contacto y redes</h3><p>Estos datos se usan en todos los botones del sitio.</p></div></div>
          <div class="admin-card admin-card--stack">
            <div class="admin-fields">
              ${field("WhatsApp (para los enlaces)", "settings.whatsapp", { help: "52 + 10 dígitos, sin espacios", placeholder: "5218112345678" })}
              ${field("WhatsApp (como se muestra)", "settings.whatsappDisplay", { placeholder: "+52 81 1234 5678" })}
              ${field("Instagram", "settings.instagram", { help: "usuario sin @" })}
              ${field("TikTok", "settings.tiktok", { help: "usuario sin @" })}
              ${field("Publicaciones destacadas", "settings.featuredPosts", { type: "lines", wide: true, rows: 4, help: "un enlace por línea de un post/reel de Instagram o video de TikTok", placeholder: "https://www.instagram.com/p/…\nhttps://www.tiktok.com/@artic_gym/video/…" })}
            </div>
          </div>
          <div class="admin-card admin-card--stack">
            <div class="admin-fields">
              ${field("Dirección", "settings.address", { wide: true })}
              ${field("Referencia", "settings.addressNote", { wide: true })}
              ${field("Enlace \"Cómo llegar\"", "settings.mapsLink", { wide: true })}
              ${field("Mapa incrustado (URL)", "settings.mapEmbed", { wide: true, help: "Google Maps › Compartir › Insertar mapa › copiar el src" })}
            </div>
          </div>
          <div class="admin-card admin-card--stack">
            <h4>Horario</h4>
            <div class="admin-sublist">
              ${d.settings.hours.map((h, i) => `
                <div class="admin-subrow">
                  ${field("Días", `settings.hours.${i}.days`)}
                  ${field("Horario", `settings.hours.${i}.time`)}
                  ${moveBtns("settings.hours", i, d.settings.hours.length)}
                </div>`).join("")}
            </div>
            <button type="button" class="btn btn-sm btn-ghost" data-act="add-hour">+ Agregar fila</button>
          </div>
          <div class="admin-danger">
            <p>¿Quieres volver al contenido original de la propuesta?</p>
            <button type="button" class="btn btn-sm btn-ghost" data-act="reset">Restaurar contenido original</button>
          </div>`;
    }
    return "";
  }

  /* ---------- Eventos ---------- */
  function onSubmit(e) {
    const form = e.target.closest("[data-form=login]");
    if (!form) return;
    e.preventDefault();
    login(form.password.value);
  }

  function onInput(e) {
    const el = e.target;
    if (!el.dataset.bind || el.dataset.type === "bool") return;
    let v = el.value;
    switch (el.dataset.type) {
      case "number": v = el.value === "" ? 0 : Math.max(0, Number(el.value)); break;
      case "list": v = el.value.split(",").map((s) => s.trim()).filter(Boolean); break;
      case "lines": v = el.value.split("\n").map((s) => s.trim()).filter(Boolean); break;
    }
    setPath(ui.draft, el.dataset.bind, v);
    markDirty();
  }

  function onChange(e) {
    const el = e.target;
    if (el.dataset.bind && el.dataset.type === "bool") {
      setPath(ui.draft, el.dataset.bind, el.checked);
      // Solo una membresía destacada a la vez.
      const m = el.dataset.bind.match(/^plans\.(\d+)\.highlight$/);
      if (m && el.checked) ui.draft.plans.forEach((p, i) => { if (i !== +m[1]) p.highlight = false; });
      markDirty();
      rerenderContent();
      return;
    }
    if (el.dataset.img && el.files && el.files[0]) handleImage(el.dataset.img, el.files[0]);
  }

  function onClick(e) {
    const tab = e.target.closest("[data-tab]");
    if (tab) { ui.tab = tab.dataset.tab; renderEditor(); return; }
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const d = ui.draft;
    switch (btn.dataset.act) {
      case "close": close(); return;
      case "logout": logout(); return;
      case "save": save(); return;
      case "discard":
        if (confirm("¿Descartar todos los cambios sin guardar?")) startEditing();
        return;
      case "reset":
        if (!confirm("Esto reemplaza todo el contenido por el de la propuesta original. ¿Continuar?")) return;
        ui.draft = App.withDefaults(null);
        ui.dirty = true;
        renderEditor();
        return;
      case "add-product":
        d.products.unshift({ id: uid("pr"), name: "Producto nuevo", category: "Playeras", price: 0, sizes: ["CH", "M", "G"], image: "", soldOut: false });
        break;
      case "add-plan":
        d.plans.push({ id: uid("p"), name: "Nueva membresía", price: 0, period: "mes", badge: "", highlight: false, note: "", features: ["Entrenamiento personalizado incluido"] });
        break;
      case "add-cafe-item":
        d.cafe[+btn.dataset.ci].items.push({ id: uid("ci"), name: "Nuevo producto", desc: "", price: 0 });
        break;
      case "add-hour":
        d.settings.hours.push({ days: "", time: "" });
        break;
      case "remove": {
        const list = getPath(d, btn.dataset.list);
        const item = list[+btn.dataset.i];
        const name = item && (item.name || item.days) ? `"${item.name || item.days}"` : "este elemento";
        if (!confirm(`¿Eliminar ${name}?`)) return;
        list.splice(+btn.dataset.i, 1);
        break;
      }
      case "move": {
        const list = getPath(d, btn.dataset.list);
        const i = +btn.dataset.i, j = i + +btn.dataset.dir;
        if (j < 0 || j >= list.length) return;
        [list[i], list[j]] = [list[j], list[i]];
        break;
      }
      default: return;
    }
    markDirty();
    rerenderContent();
  }

  /* ---------- Imágenes ---------- */
  function resizeImage(file, max = 1200) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("Imagen no válida"));
        img.onload = () => {
          const scale = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * scale);
          c.height = Math.round(img.height * scale);
          const ctx = c.getContext("2d");
          ctx.fillStyle = "#1a1a1a";
          ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL("image/jpeg", 0.85));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleImage(path, file) {
    setStatus("Subiendo foto…");
    try {
      const demo = App.Store.mode === "demo";
      const dataUrl = await resizeImage(file, demo ? 800 : 1200);
      let url = dataUrl;
      if (!demo) {
        const res = await fetch("api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + ui.token },
          body: JSON.stringify({ image: dataUrl })
        });
        const json = await res.json().catch(() => ({}));
        if (res.status === 401) return sessionExpired();
        if (!res.ok || !json.url) throw new Error(json.error || "Error al subir");
        url = json.url;
      }
      setPath(ui.draft, path, url);
      markDirty();
      rerenderContent();
      setStatus("Foto lista · recuerda guardar");
    } catch (err) {
      setStatus("No se pudo subir la foto: " + err.message, true);
    }
  }

  /* ---------- Guardar ---------- */
  function setStatus(text, isError) {
    const st = body().querySelector("#admin-status");
    if (st) { st.textContent = text; st.className = "admin-status" + (isError ? " is-error" : ui.dirty ? " is-dirty" : ""); }
  }

  function sessionExpired() {
    ui.token = null;
    try { sessionStorage.removeItem(TOKEN_KEY); } catch (e) { /* nada */ }
    setStatus("Tu sesión expiró. Copia tus cambios y vuelve a entrar.", true);
    alert("Tu sesión expiró. Vuelve a iniciar sesión para guardar.");
    ui.dirty = false;
    renderLogin();
  }

  async function save() {
    if (ui.busy) return;
    ui.busy = true;
    setStatus("Guardando…");
    const data = ui.draft;
    data.version = (Number(data.version) || 1);
    try {
      if (App.Store.mode === "demo") {
        try {
          localStorage.setItem(App.DEMO_KEY, JSON.stringify(data));
        } catch (err) {
          throw new Error("el navegador no tiene espacio suficiente (usa fotos más ligeras)");
        }
      } else {
        const res = await fetch("api/data", {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + ui.token },
          body: JSON.stringify({ data })
        });
        const json = await res.json().catch(() => ({}));
        if (res.status === 401) { ui.busy = false; return sessionExpired(); }
        if (!res.ok) throw new Error(json.error || "error del servidor");
      }
      App.render(clone(data));
      ui.dirty = false;
      renderEditor();
      setStatus("✓ Guardado y publicado");
    } catch (err) {
      setStatus("No se pudo guardar: " + err.message, true);
    } finally {
      ui.busy = false;
    }
  }

  window.addEventListener("beforeunload", (e) => {
    if (ui.dirty) { e.preventDefault(); e.returnValue = ""; }
  });

  document.getElementById("admin-open").addEventListener("click", open);
  if (location.hash === "#admin") open();
})();
