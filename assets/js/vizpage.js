/* visurail — common head of a visualization page: breadcrumbs, title, citation, links.
   The page sets <body data-slug="…">; metadata comes from entries.js (single source). */
(function () {
  const esc = window.VR.esc;
  const root = document.body.dataset.root || "../../";
  const e = (window.VISURAIL_ENTRIES || []).find((x) => x.slug === document.body.dataset.slug);
  const T = window.VISURAIL_TAXONOMY;
  if (!e) return;
  const dom = T.domains.find((d) => d.id === e.domain);
  const ifs = (e.interfaces || []).map((i) => T.interfaces.find((d) => d.id === i));
  document.title = `${e.vizTitle} — visurail`;

  const head = document.getElementById("vhead");
  head.innerHTML =
    `<div class="crumbs"><a href="${root}index.html">Catalog</a> › ${esc(dom ? dom.title : "")}` +
    ifs.map((i) => ` · ${esc(i.title)}`).join("") + "</div>" +
    `<h1>${esc(e.vizTitle)}</h1>` +
    `<div class="authors">Based on: <i>${esc(e.title)}</i></div>`;

  const cite = document.getElementById("vcite");
  const doi = e.doi ? ` doi:<a href="https://doi.org/${esc(e.doi)}">${esc(e.doi)}</a>` : ` <a href="${esc(e.url)}">${esc(e.url)}</a>`;
  cite.className = "cite";
  cite.innerHTML =
    `<b>Source.</b> ${esc(e.authors)} (${esc(e.year)}). ${esc(e.title)}. <i>${esc(e.venue)}</i>.${doi} ` +
    `Licensed <b>${esc(e.license)}</b>. This page is an independent, simplified re-implementation of one idea of the paper; ` +
    "it is not endorsed by the authors. Read the paper for the real method and results." +
    (e.verify && e.verify.length ? `<br><span class="note">Prototype — metadata still to verify: ${esc(e.verify.join("; "))}.</span>` : "");

  const links = document.getElementById("vlinks");
  if (links) {
    const L = [[e.url, "Paper"]];
    if (e.preprint) L.push([e.preprint, "Preprint"]);
    if (e.code) L.push([e.code.url, `Authors' code (${e.code.license})`]);
    if (e.data && e.data.url) L.push([e.data.url, e.data.name]);
    links.innerHTML = L.map(([h, t]) => `<a href="${esc(h)}">${esc(t)} ↗</a>`).join("");
  }
})();
