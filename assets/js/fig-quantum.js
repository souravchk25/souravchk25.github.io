/* Figure 5 for the theme "Quantum bandits".
   Built on Non-Stationary Quantum Bandits under a Variation Budget (Hu, Chakraborty, Chen; under review). Rewards are classical;
   the learner can call a per-arm oracle O_k|0> = sum_y sqrt(P_k(y)) |y> coherently, and quantum mean estimation reaches accuracy
   eps with about sigma/eps queries instead of sigma^2/eps^2 samples. Under drift a coherent estimate cannot be forgotten sample by
   sample, so the algorithm restarts a stationary quantum routine every w rounds; balancing relearning T K / w against drift V_T w
   gives the coherence window w* ~ sqrt(K T / V_T) and dynamic regret ~ sqrt(K V_T T), against the classical (K V_T)^{1/3} T^{2/3}.
   a rewards that drift (a seeded sliding-window UCB run, T = 400, window 80), b quantum access (oracle, measurement, calls against
   accuracy at sigma = 1/2), c the coherence window (restart blocks over a stretch of 8 w*, and the bound terms against w for
   T = 10^6, K = 8, V_T = 100 with constants set to 1; the animation steps w from one eighth of w* to 8 w*). */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var C = { q: '#0b7285', qSoft: '#d8eef2', cl: '#7d7567', ag: '#d97000', ink: '#1c1a17', muted: '#4f4a42', rule: '#e2dacb', edge: '#a39c8e', paper: '#fbf8f1', soft: '#f2ebdf' };
  var STEP_MS = 900, HOLD_MS = 2400;
  var root, svg, labBox, VW, H, compact, timer = null, labels = [], F = [], NF = 1;
  function el(n, a, p) { var e = document.createElementNS(NS, n); for (var q in a) if (a[q] != null) e.setAttribute(q, a[q]); if (p) p.appendChild(e); return e; }
  function opt(n) { return root.getAttribute('data-' + n); }   /* switch on the <figure>: data-math (on|off) */
  function math() { return opt('math') !== 'off'; }
  function lab(x, y, html, cls, an, w, id) { labels.push({ x: x, y: y, html: html, cls: cls || '', an: an || 'c', w: w, id: id }); }
  function moveLab(id, x, y) { var d = document.getElementById(id); if (!d) return; d.style.left = (x / VW * 100) + '%'; d.style.top = (y / H * 100) + '%'; }
  function setLab(id, html) { var d = document.getElementById(id); if (d && d.__h !== html) { d.__h = html; d.innerHTML = html; } }
  function motionOn() { var s = null; try { s = localStorage.getItem('site-motion'); } catch (e) {} if (s) return s === 'on'; return !window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function setMotion(on) { try { localStorage.setItem('site-motion', on ? 'on' : 'off'); } catch (e) {} }
  function panels(spec) {
    var out = [], y = 0, mw = Math.max.apply(null, spec.map(function (p) { return p.w; })); VW = compact ? Math.max(380, mw + 24) : 760; H = 0;
    spec.forEach(function (p, i) {
      var x0 = compact ? Math.round((VW - p.w) / 2) : p.x0, y0 = compact ? y : 0;
      var g = el('g', { transform: 'translate(' + x0 + ',' + y0 + ')' }, svg);
      if (!compact && i > 0) el('line', { x1: -11, y1: 14, x2: -11, y2: p.h - 10, stroke: C.rule, 'stroke-width': 1 }, g);
      out.push({ g: g, X: function (v) { return x0 + v; }, Y: function (v) { return y0 + v; }, w: p.w, h: p.h });
      lab(x0 + 2, y0 + 16, '<b class="fq-letter">' + p.key + '</b>' + p.title, 'fq-title', 'l');
      lab(x0 + 2, y0 + 38, p.sub, 'fq-sub', 'l');
      if (compact) y += (p.hc || p.h) + 18; else H = Math.max(H, p.h);
    });
    if (compact) H = y - 18;
    return out;
  }
  function path(g, pts, a) { a = a || {}; a.d = 'M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L'); a.fill = a.fill || 'none'; return el('path', a, g); }

  /* ---------- the drifting environment and a seeded sliding-window UCB run ---------- */
  var T = 400, TAU = 80;
  function mu(k, t) { return k ? .52 - .2 * Math.sin(2 * Math.PI * (t / T) * 1.15 + .7) : .52 + .2 * Math.sin(2 * Math.PI * t / T + .25); }
  var VT = 0; for (var t0 = 0; t0 < T - 1; t0++) VT += Math.max(Math.abs(mu(0, t0 + 1) - mu(0, t0)), Math.abs(mu(1, t0 + 1) - mu(1, t0)));
  var RUN = (function () {
    var s = 11, R = function () { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }, pulls = [];
    for (var t = 0; t < T; t++) {
      var n = [0, 0], m = [0, 0];
      pulls.forEach(function (p) { if (p.t >= t - TAU) { n[p.k]++; m[p.k] += p.r; } });
      var u = [0, 1].map(function (k) { return n[k] ? m[k] / n[k] + Math.sqrt(.5 * Math.log(Math.min(t + 1, TAU)) / n[k]) : 9; });
      var k = u[1] > u[0] ? 1 : 0; pulls.push({ t: t, k: k, r: R() < mu(k, t) ? 1 : 0 });
    }
    return pulls;
  })();
  function drift(P, x0, y0, w, h, opts) {
    var g = P.g, X = function (t) { return x0 + t / T * w; }, Y = function (v) { return y0 + h - (v - .2) / .65 * h; };
    el('line', { x1: X(0), y1: y0 + h, x2: X(T), y2: y0 + h, stroke: C.muted, 'stroke-width': 1 }, g);
    [0, 1].forEach(function (k) {
      var pts = []; for (var t = 0; t <= T; t += 4) pts.push([X(t), Y(mu(k, t))]);
      path(g, pts, { stroke: C.ink, 'stroke-width': k ? 1.5 : 1.7, 'stroke-dasharray': k ? '1.5 2.6' : null, 'stroke-linecap': 'round' });
    });
    lab(P.X(X(T) + 3), P.Y(Y(mu(0, T))), 'arm 1', 'fq-tick', 'l');
    lab(P.X(X(T) + 3), P.Y(Y(mu(1, T))), 'arm 2', 'fq-tick', 'l');
    lab(P.X(X(T)), P.Y(y0 + h + 10), 'time', 'fq-tick', 'r');
    return { X: X, Y: Y };
  }
  function slidingWindow(P, x0, y0, w, h, key) {
    var g = P.g, d = drift(P, x0, y0, w, h), X = d.X, Y = d.Y;
    var win = el('rect', { y: y0 - 4, height: h + 8, width: TAU / T * w, 'class': 'fq-win' }, g);
    var dots = RUN.filter(function (p) { return p.t % 5 === 0; }).map(function (p) { return { p: p, c: el('circle', { cx: X(p.t), cy: Y(mu(p.k, p.t)), r: 2.6, 'class': 'fq-dot' }, g) }; });
    var stops = [80, 120, 160, 200, 240, 280, 320, 360, 400], still = 6;
    F.push(function (f, isStill) {
      var te = stops[isStill ? still : Math.min(f, stops.length - 1)];
      win.setAttribute('x', X(te - TAU));
      dots.forEach(function (o) { var t = o.p.t, s = t > te ? 'fq-dot future' : t >= te - TAU ? 'fq-dot in' : 'fq-dot old'; if (o.c.__s !== s) { o.c.__s = s; o.c.setAttribute('class', s); } });
    });
    NF = Math.max(NF, stops.length);
    return d;
  }

  /* ---------- a: rewards that drift ---------- */
  function panelDrift(P) {
    slidingWindow(P, 8, 58, 186, 102, 'a');
    lab(P.X(8 + 40 / 400 * 186 * 2), P.Y(67), 'last $\\tau$ rounds', 'fq-tick', 'c', null, 'fq-wlab');
    if (math()) lab(P.X(111), P.Y(190), '$\\sum_t \\max_k |\\mu_{k,t+1} - \\mu_{k,t}| \\le V_T$', 'fq-math sm', 'c');
    else lab(P.X(111), P.Y(190), 'the means may move by $V_T$ in total', 'fq-say', 'c');
    lab(P.X(111), P.Y(210), 'A classical learner forgets old samples one at a time: each pull is its own number.', 'fq-say', 'ct', 214);
    F.push(function (f, still) { var stops = [80, 120, 160, 200, 240, 280, 320, 360, 400], te = stops[still ? 6 : Math.min(f, 8)]; moveLab('fq-wlab', P.X(8 + (te - 40) / 400 * 186), P.Y(67)); });
  }

  /* ---------- b: quantum access to a reward ---------- */
  function panelAccess(P) {
    var g = P.g, yw = 76;
    el('line', { x1: 34, y1: yw, x2: 214, y2: yw, stroke: C.ink, 'stroke-width': 1.2 }, g);
    lab(P.X(30), P.Y(yw), '$|0\\rangle$', 'fq-mini', 'r');
    el('rect', { x: 50, y: yw - 12, width: 30, height: 24, fill: C.paper, stroke: C.q, 'stroke-width': 1.6 }, g);
    lab(P.X(65), P.Y(yw), '$O_k$', 'fq-mini', 'c');
    lab(P.X(130), P.Y(yw - 16), '$\\sum_y \\sqrt{P_k(y)}\\,|y\\rangle$', 'fq-mini', 'c');
    el('rect', { x: 186, y: yw - 11, width: 26, height: 22, fill: C.paper, stroke: C.ink, 'stroke-width': 1.3 }, g);
    el('path', { d: 'M190 ' + (yw + 5) + ' A9 9 0 0 1 208 ' + (yw + 5), fill: 'none', stroke: C.ink, 'stroke-width': 1.1 }, g);
    el('line', { x1: 199, y1: yw + 6, x2: 206, y2: yw - 6, stroke: C.ink, 'stroke-width': 1.1 }, g);
    lab(P.X(199), P.Y(yw + 18), 'measure: one sample', 'fq-tick', 'c');
    /* the query count against the target accuracy */
    var x0 = 46, y0 = 118, w = 180, h = 78, lx0 = Math.log10(.3), lx1 = Math.log10(.003), ly0 = 0, ly1 = 5, s = .5;
    var X = function (e) { return x0 + (Math.log10(e) - lx0) / (lx1 - lx0) * w; }, Y = function (n) { return y0 + h - (Math.log10(n) - ly0) / (ly1 - ly0) * h; };
    el('line', { x1: x0, y1: y0 + h, x2: x0 + w, y2: y0 + h, stroke: C.muted, 'stroke-width': 1 }, g);
    el('line', { x1: x0, y1: y0, x2: x0, y2: y0 + h, stroke: C.muted, 'stroke-width': 1 }, g);
    [1, 100, 10000].forEach(function (n) { el('line', { x1: x0 - 3, y1: Y(n), x2: x0, y2: Y(n), stroke: C.muted }, g); lab(P.X(x0 - 5), P.Y(Y(n)), n >= 10000 ? '10<sup>4</sup>' : String(n), 'fq-tick', 'r'); });
    [.1, .01].forEach(function (e) { el('line', { x1: X(e), y1: y0 + h, x2: X(e), y2: y0 + h + 3, stroke: C.muted }, g); lab(P.X(X(e)), P.Y(y0 + h + 11), String(e), 'fq-tick', 'c'); });
    lab(P.X(x0 + w), P.Y(y0 + h + 24), 'target accuracy $\\varepsilon$', 'fq-key', 'r');
    lab(P.X(x0 + 2), P.Y(y0 - 9), 'calls needed', 'fq-key', 'l');
    var cl = [], qu = [];
    for (var i = 0; i <= 40; i++) { var e = Math.pow(10, lx0 + (lx1 - lx0) * i / 40); cl.push([X(e), Y(Math.max(1, s * s / (e * e)))]); qu.push([X(e), Y(Math.max(1, s / e))]); }
    path(g, cl, { stroke: C.cl, 'stroke-width': 2, 'stroke-dasharray': '5 3' });
    path(g, qu, { stroke: C.q, 'stroke-width': 2.2 });
    lab(P.X(X(.022)), P.Y(Y(2600)), 'classical $\\sigma^2/\\varepsilon^2$', 'fq-note cl', 'r');
    lab(P.X(X(.009)), P.Y(Y(s / .009) + 13), 'quantum $\\sigma/\\varepsilon$', 'fq-note q', 'c');
    lab(P.X(122), P.Y(236), 'Coherence buys accuracy, not free queries.', 'fq-say', 'ct', 232);
  }

  /* ---------- the bound terms against the block length w (constants 1) ---------- */
  var BT = 1e6, BK = 8, BV = 100, WQ = Math.sqrt(BK * BT / BV);
  var rq = function (w) { return BT * BK / w + BV * w; }, rc = function (w) { return BT * Math.sqrt(BK / w) + BV * w; };
  var WC = Math.pow(BT * Math.sqrt(BK) / (2 * BV), 2 / 3);
  var WS = [WQ / 8, WQ / 4, WQ / 2, WQ, WQ * 2, WQ * 4, WQ * 8], WSTILL = 3;
  function tradeoff(P, x0, y0, w, h, big) {
    var g = P.g, lx0 = Math.log10(WQ / 16), lx1 = Math.log10(WQ * 16), ly0 = Math.log10(3e4), ly1 = Math.log10(1.2e6);
    var X = function (v) { return x0 + (Math.log10(v) - lx0) / (lx1 - lx0) * w; }, Y = function (v) { return y0 + h - (Math.log10(v) - ly0) / (ly1 - ly0) * h; };
    el('line', { x1: x0, y1: y0 + h, x2: x0 + w, y2: y0 + h, stroke: C.muted, 'stroke-width': 1 }, g);
    el('line', { x1: x0, y1: y0, x2: x0, y2: y0 + h, stroke: C.muted, 'stroke-width': 1 }, g);
    var q = [], c = [], relearn = [], dr = [];
    for (var i = 0; i <= 60; i++) { var v = Math.pow(10, lx0 + (lx1 - lx0) * i / 60); q.push([X(v), Y(rq(v))]); c.push([X(v), Y(rc(v))]); if (BT * BK / v <= 1.2e6) relearn.push([X(v), Y(BT * BK / v)]); if (BV * v >= 3e4) dr.push([X(v), Y(BV * v)]); }
    var clipId = 'fq-clip' + Math.round(x0);
    el('rect', { x: x0, y: y0, width: w, height: h }, el('clipPath', { id: clipId }, g));
    var cg = el('g', { 'clip-path': 'url(#' + clipId + ')' }, g);
    path(cg, relearn, { stroke: C.q, 'stroke-width': 1, 'stroke-dasharray': '1.5 2.5' });
    path(cg, dr, { stroke: C.ink, 'stroke-width': 1, 'stroke-dasharray': '1.5 2.5' });
    path(cg, c, { stroke: C.cl, 'stroke-width': 2, 'stroke-dasharray': '5 3' });
    path(cg, q, { stroke: C.q, 'stroke-width': 2.3 });
    [[WQ, rq(WQ), C.q], [WC, rc(WC), C.cl]].forEach(function (m) { el('line', { x1: X(m[0]), y1: Y(m[1]), x2: X(m[0]), y2: y0 + h, stroke: m[2], 'stroke-width': 1.1, 'stroke-dasharray': '1.5 2.5' }, g); el('circle', { cx: X(m[0]), cy: Y(m[1]), r: 3.6, fill: m[2], stroke: '#fff', 'stroke-width': 1.2 }, g); });
    lab(P.X(X(WQ)), P.Y(y0 + h + 11), '$w^\\star$', 'fq-mini', 'c');
    lab(P.X(x0 + w), P.Y(y0 + h + (big ? 26 : 24)), 'block length $w$ (log scale)', 'fq-key', 'r');
    lab(P.X(x0 + 2), P.Y(y0 - 9), 'regret bound', 'fq-key', 'l');
    lab(P.X(X(WQ * 4)), P.Y(Y(rc(WQ * 4)) - 14), 'classical', 'fq-note cl', 'c');
    lab(P.X(X(WQ / 3.4)), P.Y(Y(rq(WQ / 3.4)) + 14), 'quantum', 'fq-note q', 'r');
    if (big) {
      lab(P.X(X(BT * BK / 4.2e4) - 6), P.Y(Y(4.2e4)), math() ? 'relearning $TK/w$' : 'relearning', 'fq-tick', 'r');
      lab(P.X(X(4.2e4 / BV) + 6), P.Y(Y(4.2e4)), math() ? 'drift $V_T\\,w$' : 'drift', 'fq-tick', 'l');
    }
    var mk = el('circle', { r: 5, fill: 'none', stroke: C.ag, 'stroke-width': 1.8, 'class': 'fq-mk' }, g);
    return { X: X, Y: Y, mark: function (v) { mk.setAttribute('cx', X(v)); mk.setAttribute('cy', Y(rq(v))); } };
  }
  /* blocks over a stretch of 8 w* rounds: the estimate made at each restart (teal) against the drifting mean */
  function blocks(P, x0, y0, w, h, cur) {
    var g = P.g, span = 8 * WQ, X = function (t) { return x0 + t / span * w; }, m = function (t) { return .55 + .3 * Math.sin(2 * Math.PI * t / span * .9 + .4); };
    var Y = function (v) { return y0 + h - (v - .2) / .7 * h; }, pts = [];
    for (var i = 0; i <= 120; i++) { var t = i / 120 * span; pts.push([X(t), Y(m(t))]); }
    el('line', { x1: x0, y1: y0 + h, x2: x0 + w, y2: y0 + h, stroke: C.muted, 'stroke-width': 1 }, g);
    path(g, pts, { stroke: C.ink, 'stroke-width': 1.5 });
    var dyn = el('g', {}, g);
    return function (bw) {
      dyn.innerHTML = '';
      for (var b = 0; b * bw < span - 1e-9; b++) {
        var a = b * bw, e = Math.min(span, a + bw), v = m(a);
        el('line', { x1: X(a), y1: y0 - 2, x2: X(a), y2: y0 + h, stroke: C.q, 'stroke-width': .9, 'stroke-opacity': .55 }, dyn);
        el('line', { x1: X(a) + .6, y1: Y(v), x2: X(e) - .6, y2: Y(v), stroke: C.q, 'stroke-width': 2.2 }, dyn);
        el('rect', { x: X(a), y: Math.min(Y(v), Y(m(e))), width: Math.max(0, X(e) - X(a)), height: Math.abs(Y(v) - Y(m(e))), fill: C.q, 'fill-opacity': .0 }, dyn);
      }
    };
  }

  /* ---------- c: the coherence window ---------- */
  function panelWindow(P) {
    var drawBlocks = blocks(P, 10, 54, 224, 40);
    lab(P.X(10), P.Y(105), 'restart every $w$ rounds', 'fq-tick', 'l');
    var tr = tradeoff(P, 44, 136, 186, 84, false);
    lab(P.X(122), P.Y(251), math() ? 'minimum $\\sqrt{K V_T T}$, against $(K V_T)^{1/3} T^{2/3}$' : 'the quantum minimum is lower and earlier', 'fq-say', 'ct', 240);
    lab(P.X(234), P.Y(105), '', 'fq-tick', 'r', null, 'fq-wv');
    F.push(function (f, still) {
      var i = still ? WSTILL : Math.min(f, WS.length - 1);
      drawBlocks(WS[i]); tr.mark(WS[i]);
      setLab('fq-wv', ['$w = w^\\star/8$', '$w = w^\\star/4$', '$w = w^\\star/2$', '$w = w^\\star$', '$w = 2w^\\star$', '$w = 4w^\\star$', '$w = 8w^\\star$'][i]);
      if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([document.getElementById('fq-wv')]).catch(function () {});
    });
    NF = Math.max(NF, WS.length);
  }

  function buildOne() {
    var P = panels([
      { key: 'a', x0: 0, w: 222, h: 272, hc: 258, title: 'Rewards that drift', sub: 'the best arm changes over time' },
      { key: 'b', x0: 244, w: 250, h: 272, hc: 262, title: 'Quantum access to a reward', sub: 'coherent queries buy accuracy' },
      { key: 'c', x0: 516, w: 244, h: 272, hc: 302, title: 'The coherence window', sub: 'restart before drift spoils the estimate' }]);
    panelDrift(P[0]); panelAccess(P[1]); panelWindow(P[2]);
  }
  function frame(k, still) { F.forEach(function (f) { f(k, still); }); }
  function build() {
    labels = []; svg.innerHTML = ''; F = []; NF = 1;
    compact = root.clientWidth < 560;
    buildOne();
    svg.setAttribute('viewBox', '0 0 ' + VW + ' ' + H);
    labBox.innerHTML = '';
    labels.forEach(function (L) {
      var e = document.createElement('div'); e.className = 'fq-lab an-' + L.an + ' ' + L.cls; e.innerHTML = L.html; if (L.id) e.id = L.id;
      e.style.left = (L.x / VW * 100) + '%'; e.style.top = (L.y / H * 100) + '%';
      if (L.w) { e.style.width = (L.w / VW * 100) + '%'; e.classList.add('wrapl'); }
      labBox.appendChild(e);
    });
    if (window.MathJax && MathJax.typesetPromise) { if (MathJax.typesetClear) MathJax.typesetClear([root]); MathJax.typesetPromise([root]).catch(function () {}); }
  }
  function stop() { clearTimeout(timer); timer = null; }
  function play() { stop(); var k = 0; (function tick() { frame(k, false); k++; timer = setTimeout(k >= NF ? function () { k = 0; tick(); } : tick, k >= NF ? HOLD_MS : STEP_MS); })(); }
  function syncButton(on) {
    var b = document.getElementById('fq-motion'); if (!b) return;
    b.setAttribute('aria-pressed', on ? 'false' : 'true');
    b.innerHTML = on ? '<svg viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="1.5" width="2.6" height="9" rx="0.8"/><rect x="7.4" y="1.5" width="2.6" height="9" rx="0.8"/></svg>Pause animation'
                     : '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5 L10.5 6 L3 10.5 Z"/></svg>Play animation';
  }
  function render() { stop(); build(); var on = motionOn(); syncButton(on); if (on) play(); else frame(99, true); }
  window.FIGQ = {
    render: render, VT: VT,
    init: function () {
      root = document.getElementById('fig5'); if (!root) return; svg = document.getElementById('fq-svg'); labBox = document.getElementById('fq-labels');
      document.getElementById('fq-motion').addEventListener('click', function () { var on = !motionOn(); setMotion(on); syncButton(on); if (on) play(); else { stop(); frame(99, true); } });
      var w = 0; function check() { var cw = root.clientWidth; if (cw > 0 && Math.abs(cw - w) > 40) { w = cw; render(); } }
      if (window.ResizeObserver) new ResizeObserver(check).observe(root); else window.addEventListener('resize', check);
      check();
    }
  };
})();


FIGQ.init();
