/* visurail — shared page chrome (header, footer, theme toggle).
   Each page sets <body data-root="./" | "../../"> so links resolve from any depth. */
(function () {
  const root = document.body.dataset.root || "./";
  const page = document.body.dataset.page || "";

  // Bildmarke (TUD mark) inline so its fills follow the theme via CSS.
  const MARK = '<svg class="mark" viewBox="211 194 209 210" aria-hidden="true"><path d="M327.066 196 420 196 420 288.489 397.508 310.874 397.508 240.888 397.508 217.685 374.193 217.685 339.21 217.685 315.907 240.876 315.907 240.888 374.193 240.888 374.193 334.077 303.934 404 303.934 311.51 211 311.51 234.885 287.739 327.564 287.739 327.564 345.747 327.576 345.747 350.879 322.556 350.879 287.739 350.879 264.536 327.564 264.536 258.2 264.536Z" fill="#00008C" fill-rule="evenodd"/><path d="M211 194 281 194 257.655 217.345 234.345 217.345 234.345 240.655 211 264Z" fill="#C00000" fill-rule="evenodd"/><path d="M211 334 234.345 334 234.345 380.655 281 380.655 281 404 211 404Z" fill="#C00000" fill-rule="evenodd"/><path d="M420 334 420 404 351 404 373.988 380.679 396.988 380.679 396.988 357.345Z" fill="#C00000" fill-rule="evenodd"/></svg>';

  const nav = [
    ["catalog", "Catalog", "index.html"],
    ["structure", "Structure", "index.html#structure"],
    ["about", "About", "about.html"],
    ["contribute", "Contribute", "contribute.html"],
  ];

  const header = document.createElement("header");
  header.className = "topbar";
  header.innerHTML =
    '<div class="wrap">' +
    `<a class="brand" href="${root}index.html">${MARK}<span class="name">visu<b>rail</b></span></a>` +
    '<nav class="nav" aria-label="Main">' +
    nav.map(([k, t, h]) => `<a href="${root}${h}"${k === page ? ' aria-current="page"' : ""}>${t}</a>`).join("") +
    '<button class="themebtn" type="button" id="themebtn" aria-label="Toggle colour theme">Theme</button>' +
    "</nav></div>";
  document.body.prepend(header);

  const footer = document.createElement("footer");
  footer.className = "site";
  footer.innerHTML =
    '<div class="wrap cols">' +
    "<div><h4>visurail</h4>Interactive visualizations of rail science. A prototype by the " +
    'Chair of Railway Operations, <a href="https://tu-dresden.de/">TU Dresden</a>.</div>' +
    "<div><h4>Inspired by</h4>" +
    '<a href="https://visualtransportationscience.org/">Visual Transportation Science</a> — the original idea of ' +
    "pairing transportation papers with interactive visualizations. visurail applies it to rail only.</div>" +
    "<div><h4>Licences</h4>Site code: Apache-2.0. Each visualization credits its source paper " +
    "(CC BY, or with the authors' permission). TUD logos are trademarks, not covered by Apache-2.0. " +
    `<a href="${root}about.html#licences">Details</a></div>` +
    "</div>";
  document.body.append(footer);

  // theme: dark by default (the TUD Dunkelblau field); light is kept as the alternative
  const KEY = "visurail:theme";
  const apply = (t) => { document.documentElement.dataset.theme = t === "light" ? "light" : "dark"; };
  let cur = "dark";
  try { cur = localStorage.getItem(KEY) === "light" ? "light" : "dark"; } catch (e) {}
  apply(cur);
  const tb = document.getElementById("themebtn");
  const label = () => { tb.textContent = cur === "dark" ? "Light" : "Dark"; tb.setAttribute("aria-label", `Switch to ${cur === "dark" ? "light" : "dark"} theme`); };
  label();
  tb.addEventListener("click", () => {
    cur = cur === "dark" ? "light" : "dark";
    apply(cur); label();
    try { cur === "light" ? localStorage.setItem(KEY, "light") : localStorage.removeItem(KEY); } catch (e) {}
    document.dispatchEvent(new CustomEvent("visurail:theme"));
  });
})();

/* small helpers shared by the viz pages */
window.VR = {
  css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); },
  svg(tag, attrs, parent) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const k in attrs || {}) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  },
  icon(name, cls) {
    const body = (window.CRO_ICONS || {})[name] || "";
    return `<svg class="ic${cls ? " " + cls : ""}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
  },
  esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); },
};

/* <i data-icon="name"></i> → inline CRO icon */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("i[data-icon]").forEach((el) => { el.outerHTML = window.VR.icon(el.dataset.icon); });
});
