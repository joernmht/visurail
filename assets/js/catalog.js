/* visurail — landing page renderer.
   Reads window.VISURAIL_TAXONOMY (taxonomy.js) and window.VISURAIL_ENTRIES (entries.js). */
(function () {
  const T = window.VISURAIL_TAXONOMY, E = window.VISURAIL_ENTRIES || [];
  const { esc, icon } = window.VR;
  const root = document.body.dataset.root || "./";
  const domainById = Object.fromEntries(T.domains.map((d) => [d.id, d]));
  const ifaceById = Object.fromEntries(T.interfaces.map((d) => [d.id, d]));
  const state = { domain: null, iface: null };

  const stat = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  stat("nEntries", E.length); stat("nDomains", T.domains.length); stat("nIfaces", T.interfaces.length);

  // ---- thumbnails: tiny schematic per viz type, on the dark essay field
  const THUMB = {
    "time-space": '<svg viewBox="0 0 160 90" aria-hidden="true"><g stroke="#2a4a92" stroke-width=".8">' +
      [18, 36, 54, 72].map((y) => `<line x1="12" x2="150" y1="${y}" y2="${y}"/>`).join("") + "</g>" +
      '<path d="M18 18 L48 36 L56 36 L86 54 L92 54 L118 72" fill="none" stroke="#a6b8da" stroke-width="1.5" stroke-dasharray="4 3"/>' +
      '<path d="M18 18 L50 36 L60 36 L80 46 L100 46 L118 54 L126 54 L148 72" fill="none" stroke="#36b8bf" stroke-width="3"/>' +
      '<rect x="95" y="41" width="9" height="9" fill="#ff667e" transform="rotate(45 99.5 45.5)"/></svg>',
    network: '<svg viewBox="0 0 160 90" aria-hidden="true">' +
      '<path d="M20 60 Q45 30 70 60 Q95 30 120 60" fill="none" stroke="#f0922e" stroke-width="2.5"/>' +
      '<path d="M20 60 Q32 48 45 60 Q57 48 70 60 Q82 48 95 60 Q107 48 120 60 Q130 66 140 76 M70 60 Q72 40 82 30 Q86 22 94 16" fill="none" stroke="#36b8bf" stroke-width="2.5"/>' +
      [[20, 60], [45, 60], [70, 60], [95, 60], [120, 60], [140, 76], [82, 30], [94, 16]].map(([x, y]) =>
        `<rect x="${x - 4}" y="${y - 4}" width="8" height="8" fill="#001450" stroke="#fff" stroke-width="2" transform="rotate(45 ${x} ${y})"/>`).join("") + "</svg>",
    map: '<svg viewBox="0 0 160 90" aria-hidden="true">' +
      '<g stroke="#36b8bf" stroke-width="4"><line x1="80" y1="45" x2="50" y2="25"/><line x1="80" y1="45" x2="110" y2="30"/><line x1="80" y1="45" x2="105" y2="66"/><line x1="80" y1="45" x2="55" y2="68"/></g>' +
      '<g fill="none" stroke="#f0922e" stroke-width="1.5"><path d="M80 45 Q40 20 8 14"/><path d="M80 45 Q120 15 152 10"/><path d="M80 45 Q130 60 154 82"/><path d="M80 45 Q30 60 6 84"/></g>' +
      '<rect x="73" y="38" width="14" height="14" fill="#fff" transform="rotate(45 80 45)"/></svg>',
  };

  function card(e, big) {
    const a = document.createElement("a");
    a.className = "entry" + (big ? " big" : "");
    a.href = `${root}viz/${e.slug}/`;
    const dom = domainById[e.domain];
    a.innerHTML =
      `<span class="thumb">${THUMB[e.vizType] || THUMB.network}<span class="play">${icon("play")}</span></span>` +
      '<span class="body">' +
      `<span class="ek">${icon(dom ? dom.icon : "operations")} ${esc(dom ? dom.title : "")}` +
      (e.interfaces || []).map((i) => ` · ${esc(ifaceById[i].title)}`).join("") + "</span>" +
      `<span class="et">${esc(e.vizTitle)}</span>` +
      `<span class="es">${esc(e.teaser)}</span>` +
      `<span class="ea">After ${esc(e.authorsShort)} (${esc(e.year)}) · ${esc(e.license)}</span>` +
      "</span>";
    return a;
  }

  function tile(kind, d, n) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tile" + (kind === "iface" ? " iface" : "") + (n ? "" : " empty");
    b.dataset.kind = kind; b.dataset.id = d.id; b.title = d.desc;
    b.setAttribute("aria-pressed", "false");
    const ic = kind === "iface" ? `${icon("train")}<span class="x">×</span>${icon(d.icon)}` : icon(d.icon);
    b.innerHTML = `<span class="tic">${ic}</span><span class="tt">${esc(d.title)}</span>` +
      `<span class="tn">${n ? n + (n === 1 ? " essay" : " essays") : "open"}</span>`;
    b.addEventListener("click", () => {
      const key = kind === "iface" ? "iface" : "domain";
      state[key] = state[key] === d.id ? null : d.id;
      render();
      document.getElementById("essays").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return b;
  }
  const countDomain = (id) => E.filter((e) => e.domain === id || (e.domains2 || []).includes(id)).length;
  const countIface = (id) => E.filter((e) => (e.interfaces || []).includes(id)).length;
  T.domains.forEach((d) => document.getElementById("domainTiles").appendChild(tile("domain", d, countDomain(d.id))));
  T.interfaces.forEach((d) => document.getElementById("ifaceTiles").appendChild(tile("iface", d, countIface(d.id))));

  const cta = document.getElementById("ctaWatch");
  if (cta && E[0]) cta.href = `${root}viz/${E[0].slug}/`;
  const feat = document.getElementById("featured");
  if (feat && E[0]) feat.appendChild(card(E[0], true));

  function matches(e) {
    if (state.domain && e.domain !== state.domain && !(e.domains2 || []).includes(state.domain)) return false;
    if (state.iface && !(e.interfaces || []).includes(state.iface)) return false;
    return true;
  }
  function render() {
    document.querySelectorAll(".tile").forEach((b) => {
      const on = (b.dataset.kind === "domain" && state.domain === b.dataset.id) || (b.dataset.kind === "iface" && state.iface === b.dataset.id);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    const grid = document.getElementById("grid");
    grid.innerHTML = "";
    const filtered = state.domain || state.iface;
    // the featured essay is already shown above; repeat it only inside a filtered view
    const list = E.filter(matches).filter((e, i) => filtered || e !== E[0]);
    document.getElementById("moreTitle").textContent = filtered ? "Essays" : "More essays";
    list.forEach((e) => grid.appendChild(card(e)));
    if (!list.length) grid.innerHTML = '<div class="empty-msg">Nothing here yet. This cluster is open for contributions: ' +
      `<a href="${root}contribute.html">add an essay</a>.</div>`;
    const parts = [];
    if (state.domain) parts.push(domainById[state.domain].title);
    if (state.iface) parts.push(ifaceById[state.iface].title);
    const af = document.getElementById("activeFilter");
    af.innerHTML = parts.length ? `Showing <b>${esc(parts.join(" + "))}</b> · <button type="button" id="clearF">show all</button>` : "";
    const c = document.getElementById("clearF");
    if (c) c.addEventListener("click", () => { state.domain = state.iface = null; render(); });
  }
  render();
})();
