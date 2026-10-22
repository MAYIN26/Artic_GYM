/* =========================================================
   ARTIC GYM · Lógica del sitio público
   ========================================================= */
(function () {
  "use strict";

  const DEMO_KEY = "articgym-demo-data";
  const DEFAULTS = window.ARTIC_DEFAULT_DATA;

  /* ---------- Utilidades ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (v) => String(v == null ? "" : v)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  // Solo se permiten imágenes locales, subidas o https.
  const safeImg = (url) => {
    const u = String(url || "").trim();
    if (/^(https:\/\/|assets\/|uploads\/|\/uploads\/|data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,)/i.test(u)) return u;
    return "";
  };
  const safeLink = (url) => (/^https:\/\//i.test(String(url || "").trim()) ? String(url).trim() : "#");
  const money = (n) => {
    const num = Number(n);
    if (!isFinite(num)) return "";
    return num.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };
  const handle = (h) => String(h || "").trim().replace(/^@/, "");
  const clone = (o) => JSON.parse(JSON.stringify(o));

  function withDefaults(data) {
    const base = clone(DEFAULTS);
    if (!data || typeof data !== "object") return base;
    const out = Object.assign(base, data);
    out.settings = Object.assign(clone(DEFAULTS.settings), data.settings || {});
    ["facilities", "cafe", "plans", "products"].forEach((k) => {
      if (!Array.isArray(out[k])) out[k] = clone(DEFAULTS[k]);
    });
    if (!Array.isArray(out.settings.hours)) out.settings.hours = clone(DEFAULTS.settings.hours);
    if (!Array.isArray(out.settings.featuredPosts)) out.settings.featuredPosts = [];
    return out;
  }

  /* ---------- Almacenamiento (servidor o modo demostración) ---------- */
  const Store = {
    mode: "demo",
    async load() {
      try {
        const res = await fetch("api/data", { cache: "no-store" });
        const json = res.ok ? await res.json() : null;
        if (json && json.ok) {
          Store.mode = "server";
          return withDefaults(json.data);
        }
      } catch (e) { /* sin servidor: modo demostración */ }
      Store.mode = "demo";
      let saved = null;
      try { saved = JSON.parse(localStorage.getItem(DEMO_KEY) || "null"); } catch (e) { saved = null; }
      return withDefaults(saved);
    }
  };

  /* ---------- WhatsApp ---------- */
  function waUrl(text) {
    const num = String(state.data.settings.whatsapp || "").replace(/\D/g, "");
    return "https://wa.me/" + num + "?text=" + encodeURIComponent(text);
  }
  function openWa(text) {
    window.open(waUrl(text), "_blank", "noopener");
  }

  /* ---------- Render ---------- */
  const state = { data: null, filter: "Todos" };

  const ICONS = { machines: 1, weights: 1, coach: 1, shower: 1, coffee: 1, cookie: 1, shake: 1 };
  const icon = (name, cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${ICONS[name] ? name : "coffee"}"/></svg>`;

  function mediaHtml(src, alt, iconName, tag) {
    const s = safeImg(src);
    return `<div class="media${s ? "" : " is-fallback"}" data-icon="${esc(iconName)}">
      ${s ? `<img src="${esc(s)}" alt="${esc(alt)}" loading="lazy" decoding="async">` : icon(iconName, "ph-ico")}
      ${tag ? `<span class="media-tag">${esc(tag)}</span>` : ""}
    </div>`;
  }

  // Si una foto no carga, se muestra un fondo de marca con ícono en su lugar.
  document.addEventListener("error", (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement)) return;
    const media = img.closest(".media");
    if (!media) return;
    media.classList.add("is-fallback");
    img.insertAdjacentHTML("afterend", icon(media.dataset.icon || "coffee", "ph-ico"));
    img.remove();
  }, true);

  function renderFacilities(d) {
    $("#facility-grid").innerHTML = d.facilities.map((f) => `
      <article class="facility reveal">
        ${mediaHtml(f.image, f.title, f.icon, /^https:\/\/images\.unsplash/.test(f.image || "") ? "Foto de referencia" : "")}
        <div class="facility-body">
          <div class="facility-icon">${icon(f.icon)}</div>
          <div>
            <h3>${esc(f.title)}</h3>
            <p>${esc(f.text)}</p>
          </div>
        </div>
      </article>`).join("");
  }

  function renderCafe(d) {
    $("#cafe-grid").innerHTML = d.cafe.map((cat) => `
      <article class="cafe-card reveal">
        <div class="cafe-card-head">${icon(cat.icon)}<h3>${esc(cat.name)}</h3></div>
        <ul class="menu-list">
          ${(cat.items || []).map((it) => `
            <li class="menu-item">
              <div class="menu-item-top">
                <span class="menu-item-name">${esc(it.name)}</span>
                <span class="menu-item-dots" aria-hidden="true"></span>
                <span class="menu-item-price">$${esc(money(it.price))}</span>
              </div>
              ${it.desc ? `<p class="menu-item-desc">${esc(it.desc)}</p>` : ""}
            </li>`).join("")}
        </ul>
      </article>`).join("");
  }

  function renderPlans(d) {
    $("#plans-grid").innerHTML = d.plans.map((p) => `
      <article class="plan reveal${p.highlight ? " plan--featured" : ""}">
        ${p.badge ? `<span class="plan-badge">${esc(p.badge)}</span>` : ""}
        <h3>${esc(p.name)}</h3>
        <div class="plan-price">
          <span class="cur">$</span><span class="amount">${esc(money(p.price))}</span>
          <span class="per">MXN / ${esc(p.period || "mes")}</span>
        </div>
        <p class="plan-note">${esc(p.note || "")}</p>
        <ul class="plan-features">
          ${(p.features || []).map((f) => `<li><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check"/></svg>${esc(f)}</li>`).join("")}
        </ul>
        <a href="#" class="btn ${p.highlight ? "btn-primary" : "btn-ghost"} js-wa"
           data-wa-msg="${esc(`Hola ARTIC GYM 👋 Me interesa la ${p.name} ($${money(p.price)} MXN). ¿Me dan más información?`)}">Quiero inscribirme</a>
      </article>`).join("");
  }

  function renderShop(d) {
    const cats = ["Todos"].concat([...new Set(d.products.map((p) => p.category).filter(Boolean))]);
    if (!cats.includes(state.filter)) state.filter = "Todos";
    $("#shop-filters").innerHTML = cats.map((c) =>
      `<button type="button" class="chip${c === state.filter ? " is-active" : ""}" role="tab" aria-selected="${c === state.filter}" data-filter="${esc(c)}">${esc(c)}</button>`).join("");

    const list = d.products.filter((p) => state.filter === "Todos" || p.category === state.filter);
    if (!list.length) {
      $("#shop-grid").innerHTML = `<p class="empty-msg">Pronto tendremos productos nuevos en esta categoría.</p>`;
      return;
    }
    $("#shop-grid").innerHTML = list.map((p) => {
      const sizes = Array.isArray(p.sizes) ? p.sizes : [];
      const group = "size-" + esc(p.id);
      return `
      <article class="product reveal${p.soldOut ? " is-soldout" : ""}" data-id="${esc(p.id)}">
        <div class="media" data-icon="weights">
          ${safeImg(p.image) ? `<img src="${esc(safeImg(p.image))}" alt="${esc(p.name)}" loading="lazy" decoding="async">` : icon("weights", "ph-ico")}
          ${p.soldOut ? `<span class="product-badge">Agotado</span>` : ""}
        </div>
        <div class="product-body">
          <div>
            ${p.category ? `<p class="product-cat">${esc(p.category)}</p>` : ""}
            <h3 class="product-name">${esc(p.name)}</h3>
          </div>
          <p class="product-price">$${esc(money(p.price))}<small>MXN</small></p>
          ${sizes.length ? `<fieldset class="sizes">
            <legend>Talla</legend>
            ${sizes.map((s, i) => `<label class="size"><input type="radio" name="${group}" value="${esc(s)}"${i === 0 && sizes.length === 1 ? " checked" : ""}${p.soldOut ? " disabled" : ""}><span>${esc(s)}</span></label>`).join("")}
          </fieldset>` : ""}
          <button type="button" class="btn ${p.soldOut ? "btn-ghost" : "btn-primary"} js-order"${p.soldOut ? " disabled" : ""}>
            ${p.soldOut ? "Agotado" : `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-wa"/></svg> Pedir por WhatsApp`}
          </button>
        </div>
      </article>`;
    }).join("");
  }

  function postEmbed(url) {
    const u = String(url || "").trim();
    let m = u.match(/^https:\/\/(?:www\.)?instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
    if (m) return `<iframe src="https://www.instagram.com/${m[1]}/${m[2]}/embed" height="620" loading="lazy" title="Publicación de Instagram" allowtransparency="true"></iframe>`;
    m = u.match(/^https:\/\/(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/(\d+)/);
    if (m) return `<iframe src="https://www.tiktok.com/embed/v2/${m[1]}" height="740" loading="lazy" title="Video de TikTok" allow="encrypted-media; fullscreen"></iframe>`;
    return "";
  }

  function renderSocial(d) {
    const s = d.settings;
    const ig = handle(s.instagram), tt = handle(s.tiktok);
    const igUrl = "https://www.instagram.com/" + encodeURIComponent(ig) + "/";
    const ttUrl = "https://www.tiktok.com/@" + encodeURIComponent(tt);

    $("#social-follow").innerHTML =
      (ig ? `<a class="btn btn-ig" href="${igUrl}" target="_blank" rel="noopener"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-ig"/></svg> Seguir @${esc(ig)}</a>` : "") +
      (tt ? `<a class="btn btn-tt" href="${ttUrl}" target="_blank" rel="noopener"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-tt"/></svg> Seguir en TikTok</a>` : "");

    const embeds = (s.featuredPosts || []).map(postEmbed).filter(Boolean);
    const feed = $("#social-feed");
    if (embeds.length) {
      feed.className = "social-embeds";
      feed.innerHTML = embeds.map((e) => `<div class="reveal">${e}</div>`).join("");
      return;
    }
    feed.className = "social-feed";
    const tiles = [
      { net: "tt", tall: true, big: "Reto 30 días", t: "Rompe el hielo", d: "Video · TikTok", bg: "linear-gradient(160deg,#1E4FA3,#0c1f44 70%)" },
      { net: "ig", big: ">>>", t: "Técnica de sentadilla", d: "Reel · Instagram", bg: "linear-gradient(135deg,#F7941D,#b85a00)" },
      { net: "ig", t: "Miembro del mes", d: "Post · Instagram", bg: "radial-gradient(circle at 30% 20%,#3a3a3a,#141414)" },
      { net: "tt", tall: true, big: "Día de pierna", t: "Rutina completa", d: "Video · TikTok", bg: "linear-gradient(200deg,#2a2a2a,#111 60%,#F7941D 140%)" },
      { net: "ig", t: "Nuevo drop: Hoodie", d: "Post · Instagram", bg: "linear-gradient(135deg,#1c1c1c,#1E4FA3)" },
      { net: "ig", big: "Shake del día", t: "Artic Café", d: "Historia destacada", bg: "linear-gradient(135deg,#3b2a1a,#1a1a1a)" }
    ];
    feed.innerHTML = tiles.map((t) => {
      const href = t.net === "tt" ? ttUrl : igUrl;
      return `<a class="social-tile reveal${t.tall ? " social-tile--tall" : ""}" style="--tile-bg:${t.bg}" href="${href}" target="_blank" rel="noopener" aria-label="${esc(t.t)} en ${t.net === "tt" ? "TikTok" : "Instagram"}">
        <svg class="net" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${t.net}"/></svg>
        ${t.big ? `<span class="big" aria-hidden="true">${esc(t.big)}</span>` : ""}
        ${t.net === "tt" ? `<span class="play" aria-hidden="true"></span>` : ""}
        <strong>${esc(t.t)}</strong><span>${esc(t.d)}</span>
      </a>`;
    }).join("");
  }

  function todayIndex(hours) {
    // Relaciona el día actual con la fila de horario correspondiente.
    const day = new Date().getDay(); // 0 domingo
    return hours.findIndex((h) => {
      const t = String(h.days || "").toLowerCase();
      if (day === 0) return t.includes("domingo");
      if (day === 6) return t.includes("sábado") || t.includes("sabado");
      return t.includes("lunes") || t.includes("viernes") || t.includes(["", "lunes", "martes", "miércoles", "jueves", "viernes"][day]);
    });
  }

  function renderLocation(d) {
    const s = d.settings;
    const hours = s.hours || [];
    const today = todayIndex(hours);
    $("#hours-list").innerHTML = hours.map((h, i) => {
      const closed = /cerrado/i.test(h.time || "");
      return `<li class="${closed ? "is-closed" : ""}${i === today ? " is-today" : ""}"><span class="day">${esc(h.days)}</span><span class="time">${esc(h.time)}</span></li>`;
    }).join("");
    $("#footer-hours").innerHTML = hours.map((h) => `<li><strong>${esc(h.days)}:</strong> ${esc(h.time)}</li>`).join("");
    $("#address-line").textContent = s.address || "";
    $("#address-note").textContent = s.addressNote || "";
    $("#maps-link").href = safeLink(s.mapsLink);
    const map = $("#map-embed");
    const src = safeLink(s.mapEmbed);
    if (src !== "#" && map.getAttribute("src") !== src) map.src = src;

    const ig = handle(s.instagram), tt = handle(s.tiktok);
    $("#footer-wa").textContent = s.whatsappDisplay || ("+" + String(s.whatsapp || ""));
    const fig = $("#footer-ig"); fig.href = "https://www.instagram.com/" + encodeURIComponent(ig) + "/"; fig.querySelector("span").textContent = "@" + ig;
    const ftt = $("#footer-tt"); ftt.href = "https://www.tiktok.com/@" + encodeURIComponent(tt); ftt.querySelector("span").textContent = "TikTok @" + tt;
    fig.parentElement.hidden = !ig; ftt.parentElement.hidden = !tt;
    const fmap = $("#footer-map"); fmap.href = safeLink(s.mapsLink); fmap.querySelector("span").textContent = [s.address, s.addressNote].filter(Boolean).join(" · ");
  }

  function render(data) {
    state.data = data;
    renderFacilities(data);
    renderCafe(data);
    renderPlans(data);
    renderShop(data);
    renderSocial(data);
    renderLocation(data);
    observeReveals();
  }

  /* ---------- Animaciones al hacer scroll ---------- */
  let io = null;
  function observeReveals() {
    const els = document.querySelectorAll(".reveal:not(.is-visible)");
    if (!("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("is-visible")); return; }
    if (!io) {
      io = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); } });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    }
    els.forEach((el) => io.observe(el));
  }

  /* ---------- Eventos ---------- */
  document.addEventListener("click", (e) => {
    const wa = e.target.closest(".js-wa");
    if (wa) {
      e.preventDefault();
      closeNav();
      openWa(wa.dataset.waMsg || "Hola ARTIC GYM 👋");
      return;
    }
    const order = e.target.closest(".js-order");
    if (order) {
      const card = order.closest(".product");
      const p = state.data.products.find((x) => String(x.id) === card.dataset.id);
      if (!p || p.soldOut) return;
      const sizeInput = card.querySelector(".sizes input:checked");
      const hasSizes = Array.isArray(p.sizes) && p.sizes.length > 0;
      if (hasSizes && !sizeInput) {
        const fs = card.querySelector(".sizes");
        fs.querySelector("legend").textContent = "Elige tu talla 👇";
        fs.querySelector("legend").style.color = "var(--orange)";
        fs.querySelector("input").focus();
        return;
      }
      const size = sizeInput ? sizeInput.value : "";
      const msg = `Hola ARTIC GYM 👋 Quiero pedir:\n\n• ${p.name}${size ? `\n• Talla: ${size}` : ""}\n• Precio: $${money(p.price)} MXN\n\n¿Está disponible?`;
      openWa(msg);
      return;
    }
    const chip = e.target.closest("[data-filter]");
    if (chip) {
      state.filter = chip.dataset.filter;
      renderShop(state.data);
      observeReveals();
    }
  });

  const header = $(".site-header");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 20);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const nav = $("#main-nav"), toggle = $("#nav-toggle");
  function closeNav() { nav.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); toggle.setAttribute("aria-label", "Abrir menú"); }
  toggle.addEventListener("click", () => {
    const open = !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  });
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) closeNav(); });

  $("#year").textContent = new Date().getFullYear();

  /* ---------- Inicio ---------- */
  window.ArticApp = {
    Store, render, withDefaults, esc, safeImg, money, clone, DEMO_KEY,
    ready: Store.load().then(render),
    get data() { return state.data; }
  };
})();
