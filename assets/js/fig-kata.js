/* Figure 3 for the theme "Large language models (LLMs)": KATA, Kernelized Linear Attention (Ghriss, Chakraborty).
   a one fixed-size memory (softmax KV cache vs the linear-attention state S_t = S_{t-1} + psi(k_t) v_t^T),
   b recall as packing (T key directions in d = 2 at angles k pi / T; closest pair overlaps cos(pi / T); Welch bound),
   c squaring the overlaps (rank-one PSD lift psi(u) = uu^T and the paper's Theorem 4 curves for p = 8).
   Curves: pSNR_Lin = p/(T - p), pSNR_PSD = p^2 (T - 1)/(T - p)^2 (distractors at the Welch floor);
   signal equals crosstalk at T = 2p (linear) and at the larger root of T^2 - (p^2 + 2p)T + 2p^2 = 0 (PSD), 16 and 78.4 for p = 8.
   Animation: keys T = 1..8 arrive in step across a and b; the still is T = 8. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var C = { key: '#5b2bc4', keySoft: '#e9e1fa', q: '#d97000', ink: '#1c1a17', muted: '#4f4a42', rule: '#e2dacb', lin: '#7d7567', card: '#fffdf8', paper: '#fbf8f1', val: '#f2ebdf' };
  var P8 = 8, TMAX = 8, STEP_MS = 900, HOLD_MS = 2600;
  var root, svg, labBox, VW, H, compact, timer = null, labels = [], F = {};
  function el(n, a, p) { var e = document.createElementNS(NS, n); for (var q in a) if (a[q] != null) e.setAttribute(q, a[q]); if (p) p.appendChild(e); return e; }
  function opt(n) { return root.getAttribute('data-' + n); }   /* switch on the <figure>: data-math (on|off) */
  function math() { return opt('math') !== 'off'; }
  function lab(x, y, html, cls, an, w, id) { labels.push({ x: x, y: y, html: html, cls: cls || '', an: an || 'c', w: w, id: id }); }
  function motionOn() { var s = null; try { s = localStorage.getItem('site-motion'); } catch (e) {} if (s) return s === 'on'; return !window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function setMotion(on) { try { localStorage.setItem('site-motion', on ? 'on' : 'off'); } catch (e) {} }
  function mix(a, b, t) {
    var pa = [1, 3, 5].map(function (i) { return parseInt(a.substr(i, 2), 16); }), pb = [1, 3, 5].map(function (i) { return parseInt(b.substr(i, 2), 16); });
    return '#' + pa.map(function (v, i) { var c = Math.round(v + (pb[i] - v) * t); return (c < 16 ? '0' : '') + c.toString(16); }).join('');
  }
  function rng(seed) { return function () { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296 - 0.5; }; }
  function defs() {
    var d = el('defs', {}, svg);
    var m = el('marker', { id: 'fk-ar', viewBox: '0 0 10 10', refX: 8.6, refY: 5, markerWidth: 6.4, markerHeight: 6.4, orient: 'auto', markerUnits: 'userSpaceOnUse' }, d);
    el('path', { d: 'M0 1 L9.4 5 L0 9 Z', fill: C.muted }, m);
  }
  function panels(spec) {
    var out = [], y = 0, mw = Math.max.apply(null, spec.map(function (p) { return p.w; })); VW = compact ? Math.max(380, mw + 24) : 760; H = 0;
    spec.forEach(function (p, i) {
      var x0 = compact ? Math.round((VW - p.w) / 2) : p.x0, y0 = compact ? y : 0;
      var g = el('g', { transform: 'translate(' + x0 + ',' + y0 + ')' }, svg);
      if (!compact && i > 0) el('line', { x1: -11, y1: 14, x2: -11, y2: p.h - 10, stroke: C.rule, 'stroke-width': 1 }, g);
      out.push({ g: g, X: function (v) { return x0 + v; }, Y: function (v) { return y0 + v; }, w: p.w, h: p.h });
      lab(x0 + 2, y0 + 16, '<b class="fk-letter">' + p.key + '</b>' + p.title, 'fk-title', 'l');
      lab(x0 + 2, y0 + 38, p.sub, 'fk-sub', 'l');
      if (compact) y += (p.hc || p.h) + 18; else H = Math.max(H, p.h);
    });
    if (compact) H = y - 18;
    return out;
  }

  /* ---------- a: one fixed-size memory ---------- */
  function memory(P) {
    var g = P.g, R = rng(11), K = [], V = [];
    for (var t = 0; t < TMAX; t++) { var k = [], v = []; for (var i = 0; i < 6; i++) { k.push(R()); v.push(R()); } K.push(k); V.push(v); }
    lab(P.X(2), P.Y(62), 'softmax: keeps every key and value', 'fk-key b', 'l');
    var cache = [];
    for (t = 0; t < TMAX; t++) {
      var x = 22 + t * 23, cg = el('g', { 'class': 'fk-col' }, g);
      el('rect', { x: x, y: 74, width: 19, height: 13, rx: 2.5, fill: C.keySoft, stroke: C.key, 'stroke-width': 1 }, cg);
      el('rect', { x: x, y: 90, width: 19, height: 13, rx: 2.5, fill: C.val, stroke: C.lin, 'stroke-width': 1 }, cg);
      cache.push(cg);
    }
    lab(P.X(11), P.Y(80.5), '$k$', 'fk-mini', 'c'); lab(P.X(11), P.Y(96.5), '$v$', 'fk-mini', 'c');
    lab(P.X(2), P.Y(120), 'grows with every token', 'fk-key', 'l');
    lab(P.X(2), P.Y(146), 'linear attention: one state of fixed size', 'fk-key b', 'l');
    /* the state S_t = sum psi(k_i) v_i^T, shaded by |entry| (feature map: the 6 raw coordinates here) */
    var cells = [], sx = 96, sy = 160, cs = 13;
    for (var r = 0; r < 6; r++) for (var c = 0; c < 6; c++) cells.push(el('rect', { x: sx + c * (cs + 1.5), y: sy + r * (cs + 1.5), width: cs, height: cs, rx: 2, stroke: '#d9cfe9', 'stroke-width': 0.8 }, g));
    el('rect', { x: 14, y: 182, width: 19, height: 13, rx: 2.5, fill: C.keySoft, stroke: C.key, 'stroke-width': 1 }, g);
    el('rect', { x: 36, y: 182, width: 19, height: 13, rx: 2.5, fill: C.val, stroke: C.lin, 'stroke-width': 1 }, g);
    el('line', { x1: 60, y1: 188.5, x2: 90, y2: 188.5, stroke: C.muted, 'stroke-width': 1.4, 'marker-end': 'url(#fk-ar)' }, g);
    lab(P.X(36), P.Y(210), 'new pair', 'fk-key', 'c');
    lab(P.X(141), P.Y(258), 'same size after 8 tokens or 8,000', 'fk-key', 'c');
    if (math()) lab(P.X(110), P.Y(282), '$S_t = S_{t-1} + \\psi(k_t)\\, v_t^\\top$', 'fk-math', 'c');
    F.mem = function (T) {
      cache.forEach(function (cg, i) { cg.style.opacity = i < T ? 1 : 0; });
      var S = [], mx = 1e-9;
      for (var r = 0; r < 6; r++) for (var c = 0; c < 6; c++) { var s = 0; for (var t = 0; t < T; t++) s += K[t][r] * V[t][c]; S.push(s); mx = Math.max(mx, Math.abs(s)); }
      cells.forEach(function (rc, i) { rc.setAttribute('fill', mix(C.card, C.key, Math.min(1, Math.abs(S[i]) / 0.9) * 0.85)); });
    };
  }

  /* ---------- b: recall as packing (T directions in two dimensions) ---------- */
  function packing(P, cx, cy, R, yLab) {
    var g = el('g', {}, P.g);
    el('circle', { cx: cx, cy: cy, r: R, fill: 'none', stroke: C.rule, 'stroke-width': 1.4 }, g);
    var lines = [], dots = [];
    for (var k = 0; k < TMAX; k++) {
      lines.push(el('line', { stroke: k ? C.key : C.q, 'stroke-width': k ? 1.6 : 2.4, 'stroke-linecap': 'round', 'class': 'fk-dir' }, g));
      dots.push([el('circle', { r: k ? 3.6 : 4.6, fill: k ? C.key : C.q, 'class': 'fk-dir' }, g), el('circle', { r: k ? 3.6 : 4.6, fill: k ? C.key : C.q, 'class': 'fk-dir' }, g)]);
    }
    var arc = el('path', { fill: 'none', stroke: C.ink, 'stroke-width': 1, 'class': 'fk-dir' }, g);
    var ids = [];
    for (var T = 2; T <= TMAX; T++) {
      var id = 'fk-T' + T + '-' + Math.round(cx); ids.push(id);
      var mu = Math.cos(Math.PI / T);
      lab(P.X(cx), P.Y(yLab), (math() ? '$T = ' + T + '$ keys in $d = 2$' : T + ' keys in 2 dimensions') + ': closest pair overlaps ' + mu.toFixed(2), 'fk-key fk-T', 'c', null, id);
    }
    F.pack = F.pack || [];
    F.pack.push(function (T) {
      T = Math.max(2, T);
      for (var k = 0; k < TMAX; k++) {
        var on = k < T, a = -Math.PI / 2 + Math.PI / 2 + k * Math.PI / T, dx = Math.cos(a) * R, dy = -Math.sin(a) * R;
        lines[k].setAttribute('x1', cx - dx); lines[k].setAttribute('y1', cy - dy); lines[k].setAttribute('x2', cx + dx); lines[k].setAttribute('y2', cy + dy);
        dots[k][0].setAttribute('cx', cx + dx); dots[k][0].setAttribute('cy', cy + dy); dots[k][1].setAttribute('cx', cx - dx); dots[k][1].setAttribute('cy', cy - dy);
        lines[k].style.opacity = dots[k][0].style.opacity = dots[k][1].style.opacity = on ? 1 : 0;
      }
      var a0 = 0, a1 = Math.PI / T, rr = R * 0.42;
      arc.setAttribute('d', 'M' + (cx + rr * Math.cos(a0)) + ' ' + (cy - rr * Math.sin(a0)) + ' A' + rr + ' ' + rr + ' 0 0 0 ' + (cx + rr * Math.cos(a1)) + ' ' + (cy - rr * Math.sin(a1)));
      ids.forEach(function (id, j) { var d = document.getElementById(id); if (d) d.style.opacity = j + 2 === T ? 1 : 0; });
    });
  }
  function welch(P, cx, y) {
    if (math()) {
      lab(P.X(cx), P.Y(y), '$\\mu^2 \\ge \\dfrac{T - d}{d\\,(T - 1)}$', 'fk-math', 'c');
      lab(P.X(cx), P.Y(y + 30), 'Welch bound: with more keys than dimensions, some pair must overlap', 'fk-say', 'ct', P.w - 10);
    } else lab(P.X(cx), P.Y(y), 'With more keys than dimensions, some pair must overlap, and every overlap leaks into the answer.', 'fk-say', 'ct', P.w - 10);
  }

  /* ---------- c: squaring the overlaps ---------- */
  function lift(P, x, y) {
    var g = el('g', { transform: 'translate(' + x + ',' + y + ')' }, P.g), u = [0.62, -0.35, 0.5, -0.49], cs = 11;
    u.forEach(function (v, i) { el('rect', { x: 0, y: i * (cs + 1.5), width: cs, height: cs, rx: 2, fill: mix(C.card, C.lin, Math.abs(v) * 1.2), stroke: '#cfc6b4', 'stroke-width': 0.8 }, g); });
    el('line', { x1: 18, y1: 2 * (cs + 1.5) - 1, x2: 44, y2: 2 * (cs + 1.5) - 1, stroke: C.muted, 'stroke-width': 1.4, 'marker-end': 'url(#fk-ar)' }, g);
    for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) el('rect', { x: 52 + c * (cs + 1.5), y: r * (cs + 1.5), width: cs, height: cs, rx: 2, fill: mix(C.card, C.key, Math.min(1, Math.abs(u[r] * u[c]) * 2.6)), stroke: '#d9cfe9', 'stroke-width': 0.8 }, g);
    lab(P.X(x + 5.5), P.Y(y + 58), '$u$', 'fk-mini', 'c'); lab(P.X(x + 77), P.Y(y + 58), '$uu^\\top$', 'fk-mini', 'c');
    lab(P.X(x + 31), P.Y(y + 12), '$\\psi$', 'fk-mini', 'c');
  }
  function curves(P, x0, y0, w, h, fs) {
    var g = el('g', {}, P.g), Tm = 8.5, TM = 128, ly0 = -1, ly1 = 2;
    var X = function (T) { return x0 + (T - 8) / (TM - 8) * w; }, Y = function (v) { return y0 + h - (Math.log10(Math.max(v, 1e-3)) - ly0) / (ly1 - ly0) * h; };
    el('line', { x1: x0, y1: y0 + h, x2: x0 + w, y2: y0 + h, stroke: C.muted, 'stroke-width': 1 }, g);
    el('line', { x1: x0, y1: y0, x2: x0, y2: y0 + h, stroke: C.muted, 'stroke-width': 1 }, g);
    [0.1, 1, 10, 100].forEach(function (v) { el('line', { x1: x0 - 3, y1: Y(v), x2: x0, y2: Y(v), stroke: C.muted, 'stroke-width': 1 }, g); lab(P.X(x0 - 5), P.Y(Y(v)), String(v), 'fk-tick', 'r'); });
    el('line', { x1: x0, y1: Y(1), x2: x0 + w, y2: Y(1), stroke: C.ink, 'stroke-opacity': 0.5, 'stroke-width': 1, 'stroke-dasharray': '3 3' }, g);
    var p = P8, lin = [], psd = [];
    for (var T = Tm; T <= TM; T += 0.5) { lin.push([X(T), Y(p / (T - p))]); psd.push([X(T), Y(p * p * (T - 1) / ((T - p) * (T - p)))]); }
    var clip = el('clipPath', { id: 'fk-clip' + Math.round(x0) }, g); el('rect', { x: x0, y: y0 - 2, width: w, height: h + 2 }, clip);
    var cg = el('g', { 'clip-path': 'url(#fk-clip' + Math.round(x0) + ')' }, g);
    var path = function (pts) { return 'M' + pts.map(function (q) { return q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(' L'); };
    el('path', { d: path(lin), fill: 'none', stroke: C.lin, 'stroke-width': 2, 'stroke-dasharray': '5 3' }, cg);
    el('path', { d: path(psd), fill: 'none', stroke: C.key, 'stroke-width': 2.4 }, cg);
    var tPsd = ((p * p + 2 * p) + Math.sqrt(Math.pow(p * p + 2 * p, 2) - 8 * p * p)) / 2;
    /* the two thresholds: dotted drop lines to the T axis, where the tick numbers sit */
    [[2 * p, C.lin], [tPsd, C.key]].forEach(function (q) { el('line', { x1: X(q[0]), y1: Y(1), x2: X(q[0]), y2: y0 + h, stroke: q[1], 'stroke-width': 1.2, 'stroke-dasharray': '1.5 2.5' }, g); });
    [[2 * p, C.lin], [tPsd, C.key]].forEach(function (q) { el('circle', { cx: X(q[0]), cy: Y(1), r: 3.4, fill: q[1], stroke: '#fff', 'stroke-width': 1.2 }, g); });
    [[2 * p, 'fk-tick b'], [tPsd, 'fk-tick b'], [128, 'fk-tick']].forEach(function (q) { el('line', { x1: X(q[0]), y1: y0 + h, x2: X(q[0]), y2: y0 + h + 3, stroke: C.muted, 'stroke-width': 1 }, g); lab(P.X(X(q[0])), P.Y(y0 + h + 11), String(Math.round(q[0])), q[1], 'c'); });
    /* direct labels: "linear" above its curve where it runs between 0.1 and 1, "PSD" under its curve at the right end */
    var lin1 = function (T) { return p / (T - p); }, psd1 = function (T) { return p * p * (T - 1) / ((T - p) * (T - p)); };
    lab(P.X(X(62)), P.Y(Y(lin1(62)) - 15), 'linear', 'fk-note lin', 'c');
    lab(P.X(X(112)), P.Y(Y(psd1(112)) + 14), 'PSD', 'fk-note key', 'c');
    lab(P.X(x0 + w / 2), P.Y(y0 + h + 25), 'keys stored, $T$', 'fk-key', 'c');
    lab(P.X(x0 - (compact ? 38 : 26)), P.Y(y0 + h / 2), 'signal / crosstalk', 'fk-key vert', 'c');
    return tPsd;
  }

  /* ---------- the figure ---------- */
  function buildOne() {
    var P = panels([
      { key: 'a', x0: 0, w: 222, h: 346, hc: 300, title: 'One fixed-size memory', sub: 'what a linear-attention model keeps' },
      { key: 'b', x0: 244, w: 250, h: 346, hc: 318, title: 'Recall as packing', sub: 'keys are directions; overlaps leak' },
      { key: 'c', x0: 516, w: 244, h: 346, title: 'Squaring the overlaps', sub: 'the rank-one PSD feature map' }]);
    memory(P[0]);
    packing(P[1], 125, 136, 70, 222); welch(P[1], 125, 254);
    lift(P[2], 56, 54);
    if (math()) lab(P[2].X(122), P[2].Y(136), '$\\langle uu^\\top\\!, vv^\\top\\rangle = (u^\\top v)^2$', 'fk-math sm', 'c');
    lab(P[2].X(122), P[2].Y(math() ? 156 : 136), 'an overlap of 0.3 becomes 0.09', 'fk-say', 'c');
    curves(P[2], 44, 184, 186, 108);
    lab(P[2].X(122), P[2].Y(338), '$p = 8$; idealized, distractors at the Welch floor', 'fk-tick it', 'c');
  }
  function frame(T) { if (F.mem) F.mem(T); (F.pack || []).forEach(function (f) { f(T); }); }
  function build() {
    labels = []; svg.innerHTML = ''; defs(); F = {};
    compact = root.clientWidth < 560;
    buildOne();
    svg.setAttribute('viewBox', '0 0 ' + VW + ' ' + H);
    labBox.innerHTML = '';
    labels.forEach(function (L) {
      var d = document.createElement('div'); d.className = 'fk-lab an-' + L.an + ' ' + L.cls; d.innerHTML = L.html; if (L.id) d.id = L.id;
      d.style.left = (L.x / VW * 100) + '%'; d.style.top = (L.y / H * 100) + '%';
      if (L.w) { d.style.width = (L.w / VW * 100) + '%'; d.classList.add('wrapl'); }
      labBox.appendChild(d);
    });
    if (window.MathJax && MathJax.typesetPromise) { if (MathJax.typesetClear) MathJax.typesetClear([root]); MathJax.typesetPromise([root]).catch(function () {}); }
  }
  function stop() { clearTimeout(timer); timer = null; }
  function play() { stop(); var T = 1; (function tick() { frame(T); T++; timer = setTimeout(T > TMAX ? function () { T = 1; tick(); } : tick, T > TMAX ? HOLD_MS : STEP_MS); })(); }
  function syncButton(on) {
    var b = document.getElementById('fk-motion'); if (!b) return;
    b.setAttribute('aria-pressed', on ? 'false' : 'true');
    b.innerHTML = on ? '<svg viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="1.5" width="2.6" height="9" rx="0.8"/><rect x="7.4" y="1.5" width="2.6" height="9" rx="0.8"/></svg>Pause animation'
                     : '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5 L10.5 6 L3 10.5 Z"/></svg>Play animation';
  }
  function render() { stop(); build(); var on = motionOn(); syncButton(on); if (on) play(); else frame(TMAX); }
  window.FIGK = {
    render: render,
    init: function () {
      root = document.getElementById('fig3'); if (!root) return; svg = document.getElementById('fk-svg'); labBox = document.getElementById('fk-labels');
      document.getElementById('fk-motion').addEventListener('click', function () { var on = !motionOn(); setMotion(on); syncButton(on); if (on) play(); else { stop(); frame(TMAX); } });
      var w = 0; function check() { var cw = root.clientWidth; if (cw > 0 && Math.abs(cw - w) > 40) { w = cw; render(); } }
      if (window.ResizeObserver) new ResizeObserver(check).observe(root); else window.addEventListener('resize', check);
      check();
    }
  };
})();


FIGK.init();
