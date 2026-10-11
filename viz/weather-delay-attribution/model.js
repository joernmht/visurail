/* Toy single-train delay model: snow adds running/dwell time, incidents add dwell,
   running-time supplements are recovered when late. Splits delay into own vs inherited.
   Idea after FI-TW (Pozzobon Borin et al., arXiv:2601.16592, CC BY 4.0); independent code. */
(function () {
  // toy line: km position, scheduled pure running minutes to next, dwell, exposure to snow (0..1)
  const S = [
    { n: "Aava", km: 0, run: 14, dw: 0, ex: 0.4 },
    { n: "Borea", km: 22, run: 11, dw: 1, ex: 0.7 },
    { n: "Corvi", km: 39, run: 16, dw: 2, ex: 1.0 },
    { n: "Dyyni", km: 63, run: 9, dw: 1, ex: 0.5 },
    { n: "Ervi", km: 76, run: 13, dw: 2, ex: 0.9 },
    { n: "Fjelli", km: 95, run: 12, dw: 1, ex: 0.6 },
    { n: "Gruva", km: 113, run: 15, dw: 2, ex: 1.0 },
    { n: "Halla", km: 135, run: 0, dw: 0, ex: 0.3 },
  ];
  function simulate(state) {
    // scheduled: run * (1 + slack%) + dwell; actual: run * (1 + snow effect) + dwell + snow dwell + incident,
    // recovering the scheduled supplement only when late.
    const out = []; let tS = 0, tA = 0;
    for (let i = 0; i < S.length; i++) {
      const s = S[i];
      let ownArr = 0;
      if (i > 0) {
        const p = S[i - 1];
        const plannedRun = p.run * (1 + state.slack / 100);
        // fastest possible run in today's weather; a late train uses it (eats the supplement),
        // a punctual one runs to schedule.
        const snowRun = p.run * (1 + 0.025 * state.snow * p.ex);
        const late = tA - tS;
        const actualRun = Math.max(snowRun, plannedRun - Math.max(0, late));
        tS += plannedRun; tA += actualRun;
      }
      const arrS = tS, arrA = tA;
      const dwS = s.dw, dwA = s.dw + (s.dw ? 0.25 * state.snow * s.ex : 0) + (state.inc.has(i) ? 8 : 0);
      tS += dwS; tA += dwA;
      out.push({ ...s, arrS, arrA, depS: tS, depA: tA });
    }
    // delay accounting at each station (departure delay)
    out.forEach((o, i) => {
      o.delay = o.depA - o.depS;
      o.inherited = i === 0 ? 0 : Math.max(0, out[i - 1].delay);
      o.own = o.delay - o.inherited; // can be negative = recovery
    });
    return out;
  }

  window.DELAY = { S, simulate };
})();
