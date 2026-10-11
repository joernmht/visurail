/* Toy timetable + the three network spaces (stations / stops / changes) and a small
   modularity clustering. Shared by the essay and the explorer on this page.
   Idea after Lamanna, Prisma & Medeossi (2025), PLOS ONE (CC BY 4.0); independent code. */
(function () {
  // ---- toy infrastructure: positions (0..100 × 0..60) and running minutes per physical link
  const ST = {
    A: { n: "Westport", x: 4, y: 40 }, B: { n: "Brook", x: 16, y: 40 }, C: { n: "Cliff", x: 28, y: 40 },
    D: { n: "Dalby", x: 42, y: 40 }, E: { n: "Elm", x: 56, y: 40 }, F: { n: "Fjord", x: 70, y: 40 },
    G: { n: "Gatehaven", x: 84, y: 40 }, H: { n: "Heath", x: 46, y: 25 }, I: { n: "Ivy", x: 52, y: 13 },
    J: { n: "Juniper", x: 60, y: 3 }, K: { n: "Kettle", x: 90, y: 52 }, L: { n: "Lakeside", x: 97, y: 60 },
  };
  const RUN = { AB: 9, BC: 8, CD: 10, DE: 9, EF: 11, FG: 10, DH: 8, HI: 9, IJ: 10, GK: 7, KL: 8 };
  const run = (a, b) => RUN[a + b] || RUN[b + a];

  // trains: path through the physical network, stop flags ('*' = runs through), trains/day, express factor
  const TRAINS = [
    { id: "R1", path: "ABCDEFG", pass: "", f: 16, k: 1 },
    { id: "R2", path: "DHIJ", pass: "", f: 12, k: 1 },
    { id: "R3", path: "GKL", pass: "", f: 12, k: 1 },
    { id: "IC1", path: "ABCDEFG", pass: "BCEF", f: 8, k: 0.8 },
    { id: "IC2", path: "ABCDHIJ", pass: "BCHI", f: 6, k: 0.8 },
    { id: "RE", path: "JIHDEFG", pass: "IEF", f: 8, k: 0.85 },
  ];
  const DWELL = 2;

  // ---- build the three spaces
  function build(space) {
    const E = {};
    const add = (a, b, f, t) => {
      const key = a < b ? a + b : b + a;
      (E[key] = E[key] || { a: key[0], b: key[1], f: 0, tsum: 0 }).f += f;
      E[key].tsum += f * t; // frequency-weighted mean travel time
    };
    for (const tr of TRAINS) {
      const p = tr.path.split("");
      const stops = p.filter((s) => !tr.pass.includes(s));
      // cumulative time at each station along the path
      const tAt = { [p[0]]: 0 };
      for (let i = 1; i < p.length; i++) tAt[p[i]] = tAt[p[i - 1]] + run(p[i - 1], p[i]) * tr.k + (tr.pass.includes(p[i - 1]) || i === 1 ? 0 : DWELL);
      if (space === "stations") for (let i = 1; i < p.length; i++) add(p[i - 1], p[i], tr.f, tAt[p[i]] - tAt[p[i - 1]]);
      if (space === "stops") for (let i = 1; i < stops.length; i++) add(stops[i - 1], stops[i], tr.f, tAt[stops[i]] - tAt[stops[i - 1]]);
      if (space === "changes") for (let i = 0; i < stops.length; i++) for (let j = i + 1; j < stops.length; j++) add(stops[i], stops[j], tr.f, tAt[stops[j]] - tAt[stops[i]]);
    }
    return Object.values(E).map((e) => ({ ...e, t: e.tsum / e.f }));
  }

  // ---- clustering: greedy modularity, local moves until stable (stand-in for Infomap)
  function communities(nodes, edges, wkey) {
    const w = (e) => (wkey === "freq" ? e.f : 1 / e.t);
    const adj = {}; nodes.forEach((n) => (adj[n] = {}));
    let m2 = 0;
    edges.forEach((e) => { const x = w(e); adj[e.a][e.b] = x; adj[e.b][e.a] = x; m2 += 2 * x; });
    const k = {}; nodes.forEach((n) => (k[n] = Object.values(adj[n]).reduce((s, v) => s + v, 0)));
    const c = {}; nodes.forEach((n, i) => (c[n] = i));
    const tot = {}; nodes.forEach((n) => (tot[c[n]] = k[n]));
    for (let pass = 0, moved = true; moved && pass < 50; pass++) {
      moved = false;
      for (const n of nodes) {
        const old = c[n]; tot[old] -= k[n];
        const links = {};
        for (const [nb, x] of Object.entries(adj[n])) links[c[nb]] = (links[c[nb]] || 0) + x;
        let best = old, bestGain = (links[old] || 0) - (tot[old] * k[n]) / m2;
        for (const [cc, x] of Object.entries(links)) {
          const g = x - (tot[cc] * k[n]) / m2;
          if (g > bestGain + 1e-12) { bestGain = g; best = +cc; }
        }
        c[n] = best; tot[best] = (tot[best] || 0) + k[n];
        if (best !== old) moved = true;
      }
    }
    // modularity Q
    let Q = 0;
    for (const a of nodes) for (const b of nodes) if (c[a] === c[b]) Q += (adj[a][b] || 0) - (k[a] * k[b]) / m2;
    // relabel 0..n by first appearance in west→east order
    const order = {}; let next = 0;
    nodes.slice().sort((a, b) => ST[a].x - ST[b].x).forEach((n) => { if (!(c[n] in order)) order[c[n]] = next++; });
    nodes.forEach((n) => (c[n] = order[c[n]]));
    return { c, Q: Q / m2, n: next };
  }

  window.TTNET = { ST, RUN, TRAINS, run, build, communities };
})();
