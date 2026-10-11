/* visurail — visual essay engine.
   A page is a sequence of steps on one 16:9 stage. Step 1 must be the simplest possible picture;
   every further step adds one idea. The same page is the presentation: "Present" goes fullscreen,
   ← → / PageUp PageDown / Space step through (works with presentation clickers), Esc leaves.

   VR.essay({
     mount: element,
     steps: [{ kicker?, title, text, draw(stage, api) }],   // draw redraws the whole scene
   })
   api.layer(name)   → <g> (cleared each step)
   api.enter(from)   → "enter" if this is step `from` reached by stepping forward (CSS fades it in)
   api.W, api.H      → stage size: 1600 × 900 (landscape) or 900 × 1120 (portrait)
   api.portrait      → true on phones held upright: draw the mobile layout
   Mobile first: on a portrait phone the stage is portrait and every essay draws a layout
   for it; desktop, tablets, landscape phones and projectors get the 16:9 layout.
   Touch: swipe left/right to step, tap the stage for the next step.
*/
(function () {
  const { svg, esc } = window.VR;

  window.VR.essay = function ({ mount, steps, onStep }) {
    // ?layout=portrait|landscape forces a layout (used when recording the films)
    const force = (/[?&]layout=(portrait|landscape)/.exec(location.search) || [])[1];
    const mq = window.matchMedia("(max-width: 700px) and (orientation: portrait)");
    let W = 1600, H = 900, portrait = false;
    mount.classList.add("essay");
    mount.innerHTML =
      '<div class="stage-wrap"><div class="stage" role="img"></div>' +
      '<div class="cap"><div class="kick"></div><h2 class="ct"></h2><p class="cx"></p></div></div>' +
      '<div class="ebar">' +
      `<button type="button" class="ebtn prev" aria-label="Previous step">${VR.icon("arrow-left")}</button>` +
      '<div class="dots" role="tablist"></div>' +
      `<button type="button" class="ebtn next" aria-label="Next step">${VR.icon("arrow-right")}</button>` +
      `<button type="button" class="ebtn present" aria-label="Present fullscreen">${VR.icon("present")}<span>Present</span></button>` +
      "</div>";
    const stageEl = mount.querySelector(".stage");
    const stage = svg("svg", { preserveAspectRatio: "xMidYMid meet" }, stageEl);
    function layout() {
      portrait = force ? force === "portrait" : mq.matches;
      [W, H] = portrait ? [900, 1120] : [1600, 900];
      stage.setAttribute("viewBox", `0 0 ${W} ${H}`);
      mount.classList.toggle("portrait", portrait);
    }
    layout();
    const dots = mount.querySelector(".dots");
    steps.forEach((s, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.setAttribute("role", "tab"); b.setAttribute("aria-label", `Step ${i + 1}: ${s.title}`);
      b.addEventListener("click", () => go(i));
      dots.appendChild(b);
    });

    let cur = -1, prev = -1;
    function go(i) {
      i = Math.max(0, Math.min(steps.length - 1, i));
      prev = cur; cur = i;
      stage.innerHTML = "";
      const layers = {};
      const api = {
        W, H, portrait, step: i, forward: i > prev,
        layer(name) { return layers[name] || (layers[name] = svg("g", { class: "ly-" + name }, stage)); },
        // class for elements that first appear at step `from`: they animate in when stepping forward
        enter(from) { return from === i && i > prev ? "enter" : ""; },
      };
      steps[i].draw(stage, api);
      const s = steps[i];
      mount.querySelector(".kick").textContent = s.kicker || `${i + 1} / ${steps.length}`;
      mount.querySelector(".ct").textContent = s.title;
      mount.querySelector(".cx").innerHTML = s.text;
      [...dots.children].forEach((d, k) => d.setAttribute("aria-selected", k === i ? "true" : "false"));
      mount.querySelector(".prev").disabled = i === 0;
      mount.querySelector(".next").disabled = i === steps.length - 1;
      try { history.replaceState(null, "", "#step-" + (i + 1)); } catch (e) {}
      if (onStep) onStep(i);
    }

    mount.querySelector(".prev").addEventListener("click", () => go(cur - 1));
    mount.querySelector(".next").addEventListener("click", () => go(cur + 1));
    stageEl.addEventListener("click", () => { if (!swiped) go(cur + 1); swiped = false; });
    // swipe left/right on touch screens
    let x0 = null, y0 = null, swiped = false;
    stageEl.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    stageEl.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 40 && Math.abs(dx) > 1.5 * Math.abs(dy)) { swiped = true; go(cur + (dx < 0 ? 1 : -1)); }
      x0 = null;
    }, { passive: true });
    mount.querySelector(".present").addEventListener("click", () => toggle());

    function toggle(on) {
      const want = on === undefined ? !mount.classList.contains("presenting") : on;
      mount.classList.toggle("presenting", want);
      document.documentElement.classList.toggle("is-presenting", want);
      if (want && mount.requestFullscreen) mount.requestFullscreen().catch(() => {});
      if (!want && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    }
    document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement) toggle(false); });

    document.addEventListener("keydown", (e) => {
      if (e.target.closest("input,select,textarea")) return;
      const r = mount.getBoundingClientRect();
      const active = mount.classList.contains("presenting") || (r.top < innerHeight * 0.6 && r.bottom > innerHeight * 0.4);
      if (!active) return;
      if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); go(cur + 1); }
      else if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); go(cur - 1); }
      else if (e.key === "f" || e.key === "F") toggle();
      else if (e.key === "Escape") toggle(false);
    });

    const m = /#step-(\d+)/.exec(location.hash);
    go(m ? +m[1] - 1 : 0);
    if (/[?&]present/.test(location.search)) toggle(true);
    if (/[?&]film/.test(location.search)) film();

    /* Film mode (?film): the essay as a timeline — title card, every step, end card.
       window.__film.seek(t) renders the exact frame at t seconds (all SVG/SMIL and CSS animations
       paused and set to that time), so scripts/record_films.js can capture smooth, frame-exact video.
       Without a recorder the page plays the timeline itself in real time. */
    function film() {
      document.documentElement.classList.add("filming");
      mount.classList.add("presenting", "film");
      const e = (window.VISURAIL_ENTRIES || []).find((x) => x.slug === document.body.dataset.slug) || {};
      const card = document.createElement("div");
      card.className = "film-card";
      mount.querySelector(".stage-wrap").appendChild(card);
      const intro = `<div class="fk">visurail · visual essay</div><div class="ft">${esc(e.vizTitle || "")}</div>` +
        `<div class="fs">After ${esc(e.authorsShort || "")} (${esc(e.year || "")}), ${esc(e.venue || "")} · ${esc(e.license || "")}</div>`;
      const outro = `<div class="fk">Read the paper</div><div class="ft sm">${esc(e.title || "")}</div>` +
        `<div class="fs">${esc(e.authors || "")} (${esc(e.year || "")}). ${esc(e.venue || "")}. ` +
        `${e.doi ? "doi:" + esc(e.doi) : esc(e.url || "")} · ${esc(e.license || "")}</div>` +
        `<div class="fs">Simplified, independent re-telling of one idea of the paper.</div><div class="fu">visurail.de</div>`;
      const hold = (st) => Math.max(4.5, 2.2 + (st.title.length + st.text.replace(/<[^>]+>/g, "").length) * 0.045);
      // timeline: [start, end, kind, step]
      const T = []; let t = 0;
      T.push([t, t += 3.4, "intro", 0]);
      steps.forEach((st, i) => T.push([t, t += hold(st) + (i === 0 ? 0.4 : 0), "step", i]));
      T.push([t, t += 4.6, "outro", steps.length - 1]);
      const total = t, FADE = 0.45;
      let shownStep = -1, shownCard = "";
      function seek(tt) {
        tt = Math.max(0, Math.min(total - 1e-3, tt));
        const seg = T.find((x) => tt >= x[0] && tt < x[1]) || T[T.length - 1];
        const [s0, s1, kind, i] = seg;
        if (i !== shownStep) { go(i); shownStep = i; stage.pauseAnimations(); }
        const local = tt - (kind === "step" ? s0 : kind === "intro" ? s1 : T[T.length - 2][0]);
        // the step's own animations: SMIL movers and CSS enter/draw transitions, both paused at `local`
        stage.setCurrentTime(Math.max(0, local));
        mount.querySelectorAll(".stage *").forEach((el) => el.getAnimations().forEach((a) => { a.pause(); a.currentTime = Math.max(0, local) * 1000; }));
        // cards fade in/out
        let op = 0, html = "";
        if (kind === "intro") { html = intro; op = tt > s1 - FADE ? (s1 - tt) / FADE : 1; }
        else if (kind === "outro") { html = outro; op = Math.min(1, (tt - s0) / FADE); }
        else if (i === 0 && tt < s0 + FADE) { html = intro; op = 0; }
        if (html !== shownCard) { card.innerHTML = html; shownCard = html; }
        card.style.opacity = op.toFixed(3);
      }
      card.style.transition = "none";
      window.__film = { total, seek, manual: false, done: false };
      seek(0);
      // play in real time unless a recorder takes over (sets manual = true)
      const t0 = performance.now();
      const tick = () => {
        if (window.__film.manual) return;
        const tt = (performance.now() - t0) / 1000;
        seek(tt);
        if (tt < total) requestAnimationFrame(tick); else window.__film.done = true;
      };
      requestAnimationFrame(tick);
    }
    const redraw = () => { const i = cur; cur = -2; prev = -2; go(i); };
    document.addEventListener("visurail:theme", redraw);
    mq.addEventListener("change", () => { layout(); redraw(); });
    return { go, redraw, get step() { return cur; } };
  };

  /* ---- drawing helpers shared by essays -------------------------------------- */
  // a train glyph (45° nose) that moves along a path via SMIL; dir=-1 flips it
  window.VR.mover = function (parent, d, { dur = 8, begin = 0, color = "var(--st-acc)", w = 46, h = 16, repeat = "indefinite", fill = "freeze" } = {}) {
    const g = svg("g", {}, parent);
    svg("path", { d: `M${-w / 2} ${-h / 2} H${w / 2 - h / 2} L${w / 2} 0 L${w / 2 - h / 2} ${h / 2} H${-w / 2} Z`, fill: color }, g);
    const a = svg("animateMotion", { path: d, dur: dur + "s", begin: begin + "s", repeatCount: repeat, rotate: "auto", fill }, g);
    return { g, a };
  };
  window.VR.text = function (parent, x, y, str, attrs = {}) {
    const t = svg("text", { x, y, ...attrs }, parent); t.textContent = str; return t;
  };
})();
