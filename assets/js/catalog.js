/* visurail — catalog page renderer.
   Reads window.VISURAIL_TAXONOMY (taxonomy.js) and window.VISURAIL_ENTRIES (entries.js). */
(function () {
  const T = window.VISURAIL_TAXONOMY, E = window.VISURAIL_ENTRIES || [];
  const esc = window.VR.esc;
  const root = document.body.dataset.root || "./";
  const domainById = Object.fromEntries(T.domains.map((d) => [d.id, d]));
  const ifaceById = Object.fromEntries(T.interfaces.map((d) => [d.id, d]));

  const state = { domain: null, iface: null, q: "", method: "" };

  // ---- hero stats
  const stat = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  stat("nEntries", E.length);
  stat("nDomains", T.domains.length);
  stat("nIfaces", T.interfaces.length);

  // ---- tiles
  const countDomain = (id) => E.filter((e) => e.domain === id || (e.domains2 || []).includes(id)).length;
  const countIface = (id) => E.filter((e) => (e.interfaces || []).includes(id)).length;

  function tile(kind, d, n) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tile" + (kind === "iface" ? " iface" : "") + (n ? "" : " empty");
    b.dataset.kind = kind; b.dataset.id = d.id;
    b.setAttribute("aria-pressed", "false");
    const icon = kind === "iface"
      ? `<div class="ic"><img class="bicon" src="${root}assets/icons/train_passenger_head_fast.svg" alt="" aria-hidden="true">` +
        (d.icon ? `<span class="x">×</span><img class="bicon" src="${root}assets/icons/${d.icon}" alt="" aria-hidden="true">` : "") + "</div>"
      : "";
    b.innerHTML = icon + `<span class="tt">${esc(d.title)}</span><span class="td">${esc(d.desc)}</span>` +
      `<span class="tn">${n ? n + (n === 1 ? " visualization" : " visualizations") : "open for contributions"}</span>`;
    b.addEventListener("click", () => {
      const key = kind === "iface" ? "iface" : "domain";
      state[key] = state[key] === d.id ? null : d.id;
      render();
      document.getElementById("catalog").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return b;
  }
  const dt = document.getElementById("domainTiles"), it = document.getElementById("ifaceTiles");
  T.domains.forEach((d) => dt.appendChild(tile("domain", d, countDomain(d.id))));
  T.interfaces.forEach((d) => it.appendChild(tile("iface", d, countIface(d.id))));

  // ---- filters
  const q = document.getElementById("q"), msel = document.getElementById("method");
  T.methods.forEach((m) => msel.insertAdjacentHTML("beforeend", `<option value="${esc(m)}">${esc(m)}</option>`));
  q.addEventListener("input", () => { state.q = q.value.trim().toLowerCase(); render(); });
  msel.addEventListener("change", () => { state.method = msel.value; render(); });

  // ---- thumbnails: tiny schematic per viz type, drawn in theme colours via CSS vars
  const THUMB = {
    "time-space": '<svg viewBox="0 0 160 90" aria-hidden="true"><g stroke="var(--line)" stroke-width=".6">' +
      [15, 35, 55, 75].map((y) => `<line x1="10" x2="150" y1="${y}" y2="${y}"/>`).join("") + "</g>" +
      '<g fill="none" stroke-width="2.2"><path d="M15 15 L55 75" stroke="var(--accent)"/><path d="M45 15 L85 75" stroke="var(--accent)"/>' +
      '<path d="M75 15 L95 45 L108 45 L128 75" stroke="var(--orange)"/><path d="M60 75 L100 15" stroke="var(--logo)"/></g></svg>',
    network: '<svg viewBox="0 0 160 90" aria-hidden="true"><g stroke="var(--line)" stroke-width="1.4">' +
      '<line x1="30" y1="25" x2="62" y2="45"/><line x1="62" y1="45" x2="100" y2="30"/><line x1="100" y1="30" x2="132" y2="50"/>' +
      '<line x1="62" y1="45" x2="70" y2="75"/><line x1="100" y1="30" x2="112" y2="70"/><line x1="30" y1="25" x2="28" y2="62"/><line x1="70" y1="75" x2="112" y2="70"/></g>' +
      '<g><circle cx="30" cy="25" r="6" fill="var(--accent)"/><circle cx="28" cy="62" r="5" fill="var(--accent)"/><circle cx="62" cy="45" r="8" fill="var(--accent)"/>' +
      '<circle cx="100" cy="30" r="7" fill="var(--orange)"/><circle cx="132" cy="50" r="5" fill="var(--orange)"/><circle cx="70" cy="75" r="5" fill="var(--logo)"/><circle cx="112" cy="70" r="6" fill="var(--logo)"/></g></svg>',
    distribution: '<svg viewBox="0 0 160 90" aria-hidden="true"><g fill="var(--accent)">' +
      [8, 22, 40, 52, 44, 30, 20, 13, 9, 6, 4, 3].map((h, i) => `<rect x="${14 + i * 11}" y="${80 - h}" width="8" height="${h}" rx="1"/>`).join("") +
      '</g><line x1="58" x2="58" y1="12" y2="82" stroke="var(--orange)" stroke-width="2" stroke-dasharray="4 3"/></svg>',
    map: '<svg viewBox="0 0 160 90" aria-hidden="true"><path d="M20 70 C50 60 60 30 90 34 S130 20 145 18" fill="none" stroke="var(--accent)" stroke-width="3"/>' +
      '<path d="M30 20 Q80 5 140 40" fill="none" stroke="var(--orange)" stroke-width="1.6" stroke-dasharray="5 4"/>' +
      '<circle cx="20" cy="70" r="5" fill="var(--logo)"/><circle cx="90" cy="34" r="5" fill="var(--logo)"/><circle cx="145" cy="18" r="5" fill="var(--logo)"/></svg>',
  };

  function card(e) {
    const a = document.createElement("a");
    a.className = "entry"; a.href = `${root}viz/${e.slug}/`;
    const dom = domainById[e.domain];
    a.innerHTML =
      `<span class="thumb">${THUMB[e.vizType] || THUMB.network}</span>` +
      '<span class="body">' +
      `<span class="et">${esc(e.vizTitle)}</span>` +
      `<span class="ea">${esc(e.authorsShort)} · ${esc(e.year)} · ${esc(e.venue)}</span>` +
      `<span class="es">${esc(e.teaser)}</span>` +
      '<span class="chips">' +
      (dom ? `<span class="chip dom">${esc(dom.title)}</span>` : "") +
      (e.interfaces || []).map((i) => `<span class="chip ifc">${esc(ifaceById[i].title)}</span>`).join("") +
      `<span class="chip">${esc(e.method)}</span><span class="chip lic">${esc(e.license)}</span>` +
      "</span></span>";
    return a;
  }

  function matches(e) {
    if (state.domain && e.domain !== state.domain && !(e.domains2 || []).includes(state.domain)) return false;
    if (state.iface && !(e.interfaces || []).includes(state.iface)) return false;
    if (state.method && e.method !== state.method) return false;
    if (state.q) {
      const hay = [e.vizTitle, e.title, e.authors, e.teaser, e.venue, (e.keywords || []).join(" ")].join(" ").toLowerCase();
      if (!hay.includes(state.q)) return false;
    }
    return true;
  }

  function render() {
    document.querySelectorAll(".tile").forEach((b) => {
      const on = (b.dataset.kind === "domain" && state.domain === b.dataset.id) || (b.dataset.kind === "iface" && state.iface === b.dataset.id);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    const grid = document.getElementById("grid");
    grid.innerHTML = "";
    const list = E.filter(matches);
    list.forEach((e) => grid.appendChild(card(e)));
    if (!list.length) grid.innerHTML = '<div class="empty-msg">Nothing here yet — this cluster is open for contributions. ' +
      `<a href="${root}contribute.html">Add a visualization</a>.</div>`;
    const af = document.getElementById("activeFilter");
    const parts = [];
    if (state.domain) parts.push(domainById[state.domain].title);
    if (state.iface) parts.push(ifaceById[state.iface].title);
    af.innerHTML = parts.length ? `Showing <b>${esc(parts.join(" + "))}</b> · <button type="button" id="clearF">clear</button>` : "";
    const c = document.getElementById("clearF");
    if (c) c.addEventListener("click", () => { state.domain = state.iface = null; render(); });
  }
  render();
})();
