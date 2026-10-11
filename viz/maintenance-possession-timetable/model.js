/* Toy train timetable adjustment problem (TTAP): one periodic corridor timetable, a set of possessions
   (closed open-track sections, closed platforms), and an exact search for the alternative timetable that
   minimises  w_cancel · cancelled lines + w_delay · arrival delay  using short-turning (preprocessing),
   delaying (never earlier), reordering (implicit) and cancelling.
   Idea after Van Aken, Bešinović & Goverde (2017), Transportation Research Part B 98: 224–238; independent code.
   Simplifications: every train piece is shifted as a whole (the paper retimes each event); times in minutes;
   a plain depth-first branch-and-bound instead of a MILP solver. */
(function () {
  const T = 60;                  // cycle time [min]
  const H = 2;                   // minimum headway, same direction, same section [min]
  const W_CANCEL = 100000;       // as in the paper: one cancelled line ≫ one second of delay
  const W_DELAY = 1;             // per second of arrival delay

  // stations: km, platform tracks, can a train turn here (crossover + platform)?
  const S = [
    { n: "Amsel", km: 0, plat: 4, turn: true },
    { n: "Bree", km: 14, plat: 2, turn: false },
    { n: "Calden", km: 27, plat: 3, turn: true },
    { n: "Dorn", km: 41, plat: 2, turn: true },
    { n: "Elm", km: 55, plat: 4, turn: true },
  ];
  // running minutes per section (Amsel–Bree, Bree–Calden, Calden–Dorn, Dorn–Elm), dwell 1 min at stops
  const RUN = { IC: [7, 6, 7, 7], R: [9, 8, 9, 9] };
  const STOPS = { IC: [0, 2, 4], R: [0, 1, 2, 3, 4] };
  // symmetric timetable: both directions meet at Calden at :15/:45 (IC) and :08/:38 (R)
  // train lines: type, direction (+1 east Amsel→Elm, −1 west), departure minute at origin
  const LINES = [
    { id: "IC 1", type: "IC", dir: 1, t0: 2 }, { id: "IC 2", type: "IC", dir: 1, t0: 32 },
    { id: "R 1", type: "R", dir: 1, t0: 20 }, { id: "R 2", type: "R", dir: 1, t0: 50 },
    { id: "IC 3", type: "IC", dir: -1, t0: 1 }, { id: "IC 4", type: "IC", dir: -1, t0: 31 },
    { id: "R 3", type: "R", dir: -1, t0: 19 }, { id: "R 4", type: "R", dir: -1, t0: 49 },
  ];

  const mod = (t) => ((t % T) + T) % T;

  // original timetable: one event row per station on the route {st, arr, dep, stop}
  function original() {
    return LINES.map((L) => {
      const order = L.dir > 0 ? [0, 1, 2, 3, 4] : [4, 3, 2, 1, 0];
      const ev = []; let t = L.t0;
      order.forEach((st, k) => {
        const stop = STOPS[L.type].includes(st);
        const first = k === 0, last = k === order.length - 1;
        const arr = first ? null : t;
        if (!first && stop && !last) t += 1;
        const dep = last ? null : t;
        ev.push({ st, arr, dep, stop });
        if (!last) t += RUN[L.type][Math.min(st, order[k + 1])];
      });
      return { ...L, ev };
    });
  }

  /* Preprocessing: short-turning. A line that runs over a closed section is split; each part ends at the
     last station before the closure where trains can turn (and starts at the first one after it). A part
     that is left with fewer than two stations is cancelled. Turning where the train did not stop costs
     braking (+0.5 min on arrival) or accelerating (+1 min on departure), as in the paper (+30 s / +60 s). */
  function shortTurn(lines, closed) {
    const pieces = [], cut = [];
    lines.forEach((L) => {
      const segs = []; let cur = [L.ev[0]];
      for (let k = 1; k < L.ev.length; k++) {
        const a = L.ev[k - 1].st, b = L.ev[k].st;
        if (closed.has(Math.min(a, b))) { segs.push(cur); cur = [L.ev[k]]; } else cur.push(L.ev[k]);
      }
      segs.push(cur);
      if (segs.length === 1) { pieces.push({ id: L.id, line: L, type: L.type, dir: L.dir, ev: L.ev, part: "" }); return; }
      segs.forEach((seg, si) => {
        let a = 0, b = seg.length - 1;
        if (si > 0) while (a <= b && !S[seg[a].st].turn) a++;            // new origin: first turn station
        if (si < segs.length - 1) while (b >= a && !S[seg[b].st].turn) b--; // new terminus: last turn station
        const kept = a <= b ? seg.slice(a, b + 1) : [];
        if (kept.length < 2) { cut.push({ id: L.id, line: L, ev: seg }); return; }
        const ev = kept.map((e) => ({ ...e }));
        const o = ev[0], d = ev[ev.length - 1];
        if (si > 0) { o.dep = o.stop ? o.dep : o.arr + 1; o.arr = null; o.turned = true; o.stop = true; }
        if (si < segs.length - 1) { d.arr = d.stop ? d.arr : d.arr + 0.5; d.dep = null; d.turned = true; d.stop = true; }
        pieces.push({ id: L.id + (segs.length > 1 ? "abc"[si] : ""), line: L, type: L.type, dir: L.dir, ev, part: si });
      });
    });
    return { pieces, cut };
  }

  /* half-minute slots a train blocks a station track: stop [arr, dep], origin/terminus 1 min, run-through
     0.5 min, each plus BUF for the route to clear before the next train may use that track */
  const BUF = 1;
  function occ(e, d) {
    let a, b;
    if (e.arr === null) { a = e.dep - 1; b = e.dep; }
    else if (e.dep === null) { a = e.arr; b = e.arr + 1; }
    else if (e.stop) { a = e.arr; b = e.dep; }
    else { a = e.arr; b = e.arr + 0.5; }
    return [Math.round((a + d) * 2), Math.round((b + BUF + d) * 2)];
  }

  /* Exact search. Every piece gets a delay d ∈ {0 … dmax} minutes or is cancelled. Constraints: platform
     tracks per station (count of trains present ≤ tracks), headway H between same-direction trains on a
     section, no overtaking on open track. Periodic: if `wrap` is off, no event may be pushed past minute 60
     (the paper needs an extra binary per event to allow that). */
  function solve({ closed = new Set(), plat = S.map((s) => s.plat), dmax = 8, wrap = true } = {}) {
    const t0 = performance.now();
    const { pieces, cut } = shortTurn(original(), closed);
    const SL = 2 * T, cnt = S.map(() => new Int8Array(SL));
    const secs = new Map(); // "sec:dir" → [{dep, arr}] of placed pieces
    const opts = pieces.map((p) => {
      const arrN = p.ev.filter((e) => e.arr !== null).length;
      const list = [];
      for (let d = 0; d <= dmax; d++) {
        if (!wrap && p.ev.some((e) => [e.arr, e.dep].some((t) => t !== null && mod(t) + d >= T))) continue;
        list.push({ d, cost: W_DELAY * 60 * d * arrN });
      }
      return list;
    });
    const occOf = (p, d) => p.ev.map((e) => [e.st, ...occ(e, d)]);
    const runsOf = (p, d) => p.ev.slice(1).map((e, k) => ({ key: Math.min(p.ev[k].st, e.st) + ":" + p.dir, dep: p.ev[k].dep + d, arr: e.arr + d }));
    const cap = (st) => plat[st];
    function fits(p, d) {
      for (const [st, a, b] of occOf(p, d)) for (let s = a; s < b; s++) if (cnt[st][((s % SL) + SL) % SL] + 1 > cap(st)) return false;
      for (const r of runsOf(p, d)) for (const q of secs.get(r.key) || []) {
        const dd = mod(r.dep - q.dep), da = mod(r.arr - q.arr);
        if (dd < H || dd > T - H || da < H || da > T - H) return false; // headway at both ends
        if ((dd < T / 2) !== (da < T / 2)) return false;                // overtaking on the section
      }
      return true;
    }
    function place(p, d, sign) {
      for (const [st, a, b] of occOf(p, d)) for (let s = a; s < b; s++) cnt[st][((s % SL) + SL) % SL] += sign;
      for (const r of runsOf(p, d)) {
        if (!secs.has(r.key)) secs.set(r.key, []);
        const L = secs.get(r.key);
        if (sign > 0) L.push({ dep: r.dep, arr: r.arr, p }); else L.splice(L.findIndex((q) => q.p === p), 1);
      }
    }
    // most constrained first: pieces through stations that lost platforms, then the rest
    const order = pieces.map((p, i) => i).sort((i, j) => opts[i].length - opts[j].length ||
      pieces[j].ev.reduce((s, e) => s + (plat[e.st] < S[e.st].plat ? 1 : 0), 0) - pieces[i].ev.reduce((s, e) => s + (plat[e.st] < S[e.st].plat ? 1 : 0), 0));
    let best = Infinity, bestSol = null, nodes = 0, stopped = false;
    const sol = new Array(pieces.length);
    (function dfs(k, cost) {
      if (cost >= best) return;
      if (++nodes > 100000) { stopped = true; return; }
      if (k === order.length) { best = cost; bestSol = sol.slice(); return; }
      const i = order[k], p = pieces[i];
      for (const o of opts[i]) {
        if (cost + o.cost >= best || stopped) break;
        if (!fits(p, o.d)) continue;
        place(p, o.d, 1); sol[i] = o.d; dfs(k + 1, cost + o.cost); place(p, o.d, -1);
      }
      if (!stopped && cost + W_CANCEL < best) { sol[i] = null; dfs(k + 1, cost + W_CANCEL); }
    })(0, 0);
    const res = pieces.map((p, i) => ({ ...p, d: bestSol ? bestSol[i] : null, cancelled: !bestSol || bestSol[i] === null }));
    const kept = res.filter((p) => !p.cancelled);
    const delayMin = kept.reduce((s, p) => s + p.d * p.ev.filter((e) => e.arr !== null).length, 0);
    return {
      pieces: res, cut, cost: best, nodes, stopped, ms: performance.now() - t0,
      cancelled: res.filter((p) => p.cancelled).length, delayMin,
      shortTurned: new Set(res.filter((p) => p.part !== "").map((p) => p.line.id)).size,
    };
  }

  // trains present at a station over the hour (half-minute resolution), for a solution
  function presence(R, st, plat) {
    const c = new Array(2 * T).fill(0);
    R.pieces.filter((p) => !p.cancelled).forEach((p) => p.ev.forEach((e) => {
      if (e.st !== st) return;
      const [a, b] = occ(e, p.d);
      for (let s = a; s < b; s++) c[((s % (2 * T)) + 2 * T) % (2 * T)]++;
    }));
    return c;
  }

  window.TTAP = { T, H, W_CANCEL, S, LINES, original, shortTurn, solve, presence, mod };
})();
