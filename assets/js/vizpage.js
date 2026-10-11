/* visurail — frame of a visual-essay page: title block and references.
   The page sets <body data-slug="…">; metadata comes from entries.js (single source). */
(function () {
  const { esc, icon } = window.VR;
  const root = document.body.dataset.root || "../../";
  const e = (window.VISURAIL_ENTRIES || []).find((x) => x.slug === document.body.dataset.slug);
  const T = window.VISURAIL_TAXONOMY;
  if (!e) return;
  const dom = T.domains.find((d) => d.id === e.domain);
  const ifs = (e.interfaces || []).map((i) => T.interfaces.find((d) => d.id === i));
  document.title = `${e.vizTitle} — visurail`;

  const head = document.getElementById("vhead");
  head.className = "ehead";
  head.innerHTML =
    `<div class="crumbs"><a href="${root}index.html">${icon("arrow-left")} All essays</a></div>` +
    `<div class="kicker">${icon(dom ? dom.icon : "operations")} Visual essay · ${esc(dom ? dom.title : "")}` +
    ifs.map((i) => ` · ${esc(i.title)}`).join("") + "</div>" +
    `<h1>${esc(e.vizTitle)}</h1>`;

  const cite = document.getElementById("vcite");
  const doi = e.doi ? ` doi:<a href="https://doi.org/${esc(e.doi)}">${esc(e.doi)}</a>` : ` <a href="${esc(e.url)}">${esc(e.url)}</a>`;
  const L = [[e.url, "Paper", "paper"]];
  if (e.preprint) L.push([e.preprint, "Preprint", "paper"]);
  if (e.code) L.push([e.code.url, `Authors' code (${e.code.license})`, "code"]);
  if (e.data && e.data.url) L.push([e.data.url, e.data.name, "data"]);
  cite.innerHTML =
    '<h2>Research reference</h2>' +
    `<div class="cite"><b>${esc(e.authors)}</b> (${esc(e.year)}). ${esc(e.title)}. <i>${esc(e.venue)}</i>.${doi} ` +
    (e.licenseNote ? `${esc(e.licenseNote)}</div>` : `Licensed <b>${esc(e.license)}</b>.</div>`) +
    `<div class="links">${L.map(([h, t, ic]) => `<a href="${esc(h)}">${icon(ic)} ${esc(t)}</a>`).join("")}</div>` +
    '<p class="note">This essay is an independent, simplified re-implementation of one idea of the paper and is not endorsed by its authors. ' +
    "Read the paper for the real method and results." +
    (e.verify && e.verify.length ? ` Prototype: metadata still to verify (${esc(e.verify.join("; "))}).` : "") + "</p>";
})();

/* Film first: each essay page opens on its recorded film (scripts/record_films.js); "Step through"
   switches to the interactive essay, which is also the presentation. Portrait phones get the
   9:16 film, everything else 16:9. */
(function () {
  const essay = document.getElementById("essay");
  if (!essay || /[?&]film/.test(location.search)) return;
  const { icon } = window.VR;
  const mq = window.matchMedia("(max-width: 700px) and (orientation: portrait)");
  const modes = document.createElement("div");
  modes.className = "modes";
  modes.setAttribute("role", "tablist");
  modes.innerHTML =
    `<button type="button" role="tab" data-mode="film">${icon("play")} Watch the film</button>` +
    `<button type="button" role="tab" data-mode="steps">${icon("layers")} Step through &amp; present</button>`;
  const box = document.createElement("div");
  box.className = "filmbox";
  const v = document.createElement("video");
  v.controls = true; v.playsInline = true; v.preload = "metadata"; v.muted = true;
  v.setAttribute("aria-label", "Film of this visual essay");
  box.appendChild(v);
  essay.before(modes, box);

  let fmt = "";
  function pick() {
    const f = mq.matches ? "9x16" : "16x9";
    if (f === fmt || (!v.paused && fmt)) return;
    fmt = f; box.dataset.fmt = f;
    v.poster = `film-${f}.jpg`;
    v.innerHTML = `<source src="film-${f}.webm" type="video/webm"><source src="film-${f}.mp4" type="video/mp4">`;
    v.querySelector("source:last-child").addEventListener("error", () => { modes.hidden = true; mode("steps"); });
    v.load();
  }
  function mode(m) {
    modes.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", b.dataset.mode === m ? "true" : "false"));
    box.hidden = m !== "film"; essay.hidden = m === "film";
    if (m !== "film") v.pause();
  }
  modes.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) mode(b.dataset.mode); });
  mq.addEventListener("change", pick);
  pick();
  mode(/#step-|[?&]present/.test(location.href) ? "steps" : "film");
})();
