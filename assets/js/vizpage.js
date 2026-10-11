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
    `Licensed <b>${esc(e.license)}</b>.</div>` +
    `<div class="links">${L.map(([h, t, ic]) => `<a href="${esc(h)}">${icon(ic)} ${esc(t)}</a>`).join("")}</div>` +
    '<p class="note">This essay is an independent, simplified re-implementation of one idea of the paper and is not endorsed by its authors. ' +
    "Read the paper for the real method and results." +
    (e.verify && e.verify.length ? ` Prototype: metadata still to verify (${esc(e.verify.join("; "))}).` : "") + "</p>";
})();
