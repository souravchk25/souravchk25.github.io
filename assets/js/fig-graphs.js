/* Figure 1 for the theme "Bandits with changing arm availability".
   a: the usual bandit (complete graph). b: arms come and go, round by round (availability table).
   c: the highlighted row as that round's graph G_t. One checked run (script.py): every move uses an
   edge that is open in that round, every arm is visited before the commit, and after it the learner
   waits two rounds at arm 5 while the edge to the best arm is closed. Straight edges throughout. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var S = {"NODES": [[34, 46], [94, 18], [160, 34], [214, 86], [164, 140], [98, 116], [36, 122]], "CAND": [[0, 1], [1, 2], [2, 3], [0, 6], [6, 5], [5, 4], [4, 3], [1, 5], [2, 4], [0, 5]], "AST": 3, "ONSET": [[0, 4, 8, 9], [0, 3, 6, 8], [1, 5, 9, 3], [2, 7, 4, 0], [6, 1, 9, 4], [5, 2, 3, 7], [4, 8, 0, 1], [4, 2, 9, 7], [5, 7, 3, 1], [8, 5, 0, 9], [8, 2, 3, 7], [6, 4, 1, 9], [2, 5, 0, 3]], "PATH": [0, 1, 2, 3, 4, 5, 6, 5, 4, 4, 4, 3, 3], "SIGMA": 6};
  var NODES = S.NODES, CAND = S.CAND, AST = S.AST, ONSET = S.ONSET, PATH = S.PATH, SIGMA = S.SIGMA, LAST = PATH.length - 1;
  var MU = [0.38, 0.52, 0.3, 0.9, 0.46, 0.6, 0.42];
  var C = { learner: '#d97000', best: '#a0124b', ink: '#1c1a17', muted: '#4f4a42', edge: '#a39c8e', rule: '#e2dacb',
            bestSoft: '#f8dde6', learnSoft: '#fcebd3', card: '#fffdf8', paper: '#fbf8f1', bar: '#8a8274', track: '#e9e2d4' };
  var STILL_R = 10;                            /* the round shown when paused: the learner is waiting */
  var ROWS = [7, 8, 9, 10, 11];                /* concept two: the rounds in the availability table */
  var STEP_MS = 1150, MOVE_AT = 520, HOLD_MS = 2600;

  var root, svg, labBox, VW, H, compact, timer = null, playing = false, labels = [], F = {};
  function el(n, a, p) { var e = document.createElementNS(NS, n); for (var q in a) if (a[q] != null) e.setAttribute(q, a[q]); if (p) p.appendChild(e); return e; }
  function opt(n) { return root ? root.getAttribute('data-' + n) : null; }   /* switches on the <figure>: data-math, data-bars */
  function lab(x, y, html, cls, an, w) { labels.push({ x: x, y: y, html: html, cls: cls || '', an: an || 'c', w: w }); }
  function motionOn() {
    var s = null; try { s = localStorage.getItem('site-motion'); } catch (e) {}
    if (s) return s === 'on';
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function setMotion(on) { try { localStorage.setItem('site-motion', on ? 'on' : 'off'); } catch (e) {} }

  /* geometry helpers */
  function curveD(a, b, bend) {
    var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    var cx = mx - dy / L * bend * L, cy = my + dx / L * bend * L;
    return { d: 'M' + a[0] + ' ' + a[1] + ' Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + b[0] + ' ' + b[1],
             mid: [0.25 * a[0] + 0.5 * cx + 0.25 * b[0], 0.25 * a[1] + 0.5 * cy + 0.25 * b[1]], ang: Math.atan2(dy, dx) * 180 / Math.PI };
  }
  function bendOf(j) { return 0; }
  function edgeIndex(u, v) { for (var j = 0; j < CAND.length; j++) if ((CAND[j][0] === u && CAND[j][1] === v) || (CAND[j][0] === v && CAND[j][1] === u)) return j; return -1; }
  function openAt(r, a) { var s = [a]; ONSET[r].forEach(function (j) { var e = CAND[j]; if (e[0] === a) s.push(e[1]); else if (e[1] === a) s.push(e[0]); }); return s; }
  function star(g, x, y, r, col) {
    var p = []; for (var i = 0; i < 10; i++) { var an = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; p.push((x + rr * Math.cos(an)).toFixed(1) + ',' + (y + rr * Math.sin(an)).toFixed(1)); }
    return el('polygon', { points: p.join(' '), fill: col }, g);
  }

  function defs() {
    var d = el('defs', {}, svg);
    var sh = el('filter', { id: 'fg-shadow', x: '-50%', y: '-50%', width: '200%', height: '200%' }, d);
    el('feDropShadow', { dx: 0, dy: 1.1, stdDeviation: 1.3, 'flood-color': '#3b2a10', 'flood-opacity': 0.2 }, sh);
    var gl = el('filter', { id: 'fg-glow', x: '-100%', y: '-100%', width: '300%', height: '300%' }, d);
    el('feGaussianBlur', { stdDeviation: 3 }, gl);
    var fg = el('radialGradient', { id: 'fg-fadeg', cx: '50%', cy: '50%', r: '50%' }, d);
    el('stop', { offset: '62%', 'stop-color': '#fff' }, fg); el('stop', { offset: '100%', 'stop-color': '#000' }, fg);
    var mk = el('mask', { id: 'fg-fade', maskContentUnits: 'objectBoundingBox' }, d);
    el('rect', { width: 1, height: 1, fill: 'url(#fg-fadeg)' }, mk);
    var st = el('pattern', { id: 'fg-stripes', width: 4, height: 4, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, d);
    el('rect', { width: 4, height: 4, fill: C.card }, st); el('rect', { width: 2, height: 4, fill: '#7d7567' }, st);
  }

  /* ---------- shared pieces: arms with reward bars, the learner ---------- */
  function addBar(g, n) {
    var under = opt('bars') === 'under', b = {};
    var x = under ? -9 : 13.5, y = under ? 13.5 : -9, w = under ? 18 : 4.8, h = under ? 4.8 : 18;
    b.track = el('rect', { x: x, y: y, width: w, height: h, rx: 2.4, fill: C.track, stroke: C.paper, 'stroke-width': 1.6, 'paint-order': 'stroke', 'class': 'fg-btrack' }, g);
    var f = MU[n];
    b.fill = el('rect', under ? { x: x, y: y, width: w * f, height: h, rx: 2.4 } : { x: x, y: y + h * (1 - f), width: w, height: h * f, rx: 2.4 }, g);
    b.fill.setAttribute('fill', n === AST ? C.best : C.bar); b.fill.setAttribute('class', 'fg-bfill');
    return b;
  }
  function arm(parent, n, q, o) {
    var isB = n === AST, g = el('g', { transform: 'translate(' + q[0] + ',' + q[1] + ')' }, parent), A = { g: g };
    A.halo = el('circle', { r: 15, fill: C.learnSoft, 'class': 'fg-halo' }, g); A.halo.style.opacity = 0;
    el('circle', { r: 10, fill: isB ? C.bestSoft : C.card, stroke: isB ? C.best : C.ink, 'stroke-width': isB ? 1.9 : 1.15, filter: 'url(#fg-shadow)' }, g);
    if (isB) star(g, 0, 0, 5.4, C.best);
    else { var t = el('text', { x: 0, y: 0.5, 'class': 'fg-num' }, g); t.textContent = n + 1; }
    if (o.bars) A.bar = addBar(g, n);
    return A;
  }
  function setArm(A, visited, known) {
    if (A.bar) { A.bar.fill.style.opacity = visited ? 1 : 0; A.bar.track.style.opacity = visited ? 1 : 0.55; }
  }
  function token(parent, at) {
    var t = el('g', { 'class': 'fg-tok' }, parent);
    el('circle', { r: 10.5, fill: C.learner, 'fill-opacity': 0.3, filter: 'url(#fg-glow)' }, t);
    el('circle', { r: 6.6, fill: C.learner, stroke: '#fff', 'stroke-width': 1.8 }, t);
    place(t, NODES[at]); return t;
  }
  function place(t, q, instant) { if (instant) t.style.transition = 'none'; t.style.transform = 'translate(' + q[0] + 'px,' + q[1] + 'px)'; if (instant) { void t.getBoundingClientRect(); t.style.transition = ''; } }

  /* a graph on the shared layout. o.complete draws all 21 pairs (the usual bandit) */
  function graph(parent, x, y, s, o) {
    var G = { o: o }; G.root = el('g', { transform: 'translate(' + x + ',' + y + ') scale(' + s + ')' }, parent);
    G.edgesG = el('g', {}, G.root); G.trailG = el('g', {}, G.root); G.armsG = el('g', {}, G.root); G.top = el('g', {}, G.root);
    if (o.complete) {
      for (var u = 0; u < 7; u++) for (var v = u + 1; v < 7; v++) el('path', { d: 'M' + NODES[u][0] + ' ' + NODES[u][1] + ' L' + NODES[v][0] + ' ' + NODES[v][1], 'class': 'fg-edge kn' }, G.edgesG);
    } else {
      G.edges = CAND.map(function (e, j) { return el('path', { d: curveD(NODES[e[0]], NODES[e[1]], bendOf(j)).d, 'class': 'fg-edge' }, G.edgesG); });
    }
    G.arms = NODES.map(function (q, n) { return arm(G.armsG, n, q, o); });
    if (o.token != null) G.tok = token(G.top, o.token);
    return G;
  }
  /* draw round r of a graph: the learner stands at PATH[r-1] and sees this round's open edges */
  function graphRound(G, r, moved) {
    var at = PATH[r - 1], now = moved ? PATH[r] : at, known = r > SIGMA, on = ONSET[r];
    G.edges.forEach(function (p, j) {
      var e = CAND[j], open = on.indexOf(j) >= 0, mine = !moved && (e[0] === at || e[1] === at), door = mine && known && (e[0] === AST || e[1] === AST);
      p.setAttribute('class', 'fg-edge ' + (open ? (door ? 'door' : (mine ? 'local' : 'on')) : (door ? 'shut' : 'ghost')));
    });
    var opn = openAt(r, at);
    G.arms.forEach(function (A, n) {
      var seen = PATH.slice(0, moved ? r + 1 : r).indexOf(n) >= 0;
      setArm(A, seen, known);
      A.halo.style.opacity = (!moved && opn.indexOf(n) >= 0 && n !== at) ? 1 : 0;
    });
    trail(G.trailG, moved ? r : r - 1);
    if (G.tok) place(G.tok, NODES[now]);
  }
  function trail(g, upto) {
    g.innerHTML = '';
    for (var j = 1; j <= upto; j++) {
      var a = PATH[j - 1], b = PATH[j]; if (a === b) continue;
      var ei = edgeIndex(a, b), c = curveD(NODES[CAND[ei][0]], NODES[CAND[ei][1]], bendOf(ei));
      el('path', { d: c.d, 'class': 'fg-trail' + (j > SIGMA ? ' nav' : '') }, g);
    }
  }

  /* ---------- panel frames ---------- */
  function panels(spec) {
    var out = [], y = 0;
    VW = compact ? 380 : 760; H = 0;
    spec.forEach(function (p, i) {
      var x0 = compact ? Math.round((380 - p.w) / 2) : p.x0, y0 = compact ? y : 0;
      var g = el('g', { transform: 'translate(' + x0 + ',' + y0 + ')' }, svg);
      if (!compact && i > 0) el('line', { x1: -11, y1: 14, x2: -11, y2: p.h - 10, stroke: C.rule, 'stroke-width': 1 }, g);
      out.push({ g: g, X: function (v) { return x0 + v; }, Y: function (v) { return y0 + v; }, w: p.w });
      lab(x0 + 2, y0 + 16, '<b class="fg-letter">' + p.key + '</b>' + p.title, 'fg-title', 'l');
      lab(x0 + 2, y0 + 38, p.sub, 'fg-sub', 'l');
      if (compact) y += p.h + 18; else H = Math.max(H, p.h);
    });
    if (compact) H = y - 18;
    return out;
  }
  function bottom(P, x, w, math, text) {
    var m = opt('math') === 'on';
    if (m) lab(P.X(x), P.Y(234), math, 'fg-math', 'c');
    lab(P.X(x), P.Y(m ? 270 : 246), text, 'fg-say2', 'c', w);
  }
  /* ---------- the figure ---------- */
  function buildFig() {
    var P = panels([
      { key: 'a', x0: 0, w: 206, h: HP(), title: 'The usual bandit', sub: 'pull any arm, any round' },
      { key: 'b', x0: 228, w: 276, h: HP(), title: 'Arms come and go', sub: 'rows are rounds, the line is the learner' },
      { key: 'c', x0: 532, w: 228, h: HP(), title: 'Written as a graph', sub: 'the highlighted row, as that round\'s graph' }]);
    var K = graph(P[0].g, -6, 72, 0.92, { bars: true, complete: true });
    K.arms.forEach(function (A) { setArm(A, true, true); });
    bottom(P[0], 98, 196, '$L_t(a) = \\mathcal{A}$', 'Every arm is open in every round: a complete graph that never changes.');

    /* b: the availability table */
    var T = F.table = { g: el('g', {}, P[1].g) }, cx = function (n) { return 52 + n * 29; }, ry = function (i) { return 98 + i * 28; };
    T.band = el('rect', { x: 28, y: 0, width: 214, height: 26, rx: 7, 'class': 'fg-band' }, T.g);
    for (var n = 0; n < 7; n++) {
      if (n === AST) { var hg = el('g', { transform: 'translate(' + cx(n) + ',72)' }, T.g); star(hg, 0, 0, 6, C.best); }
      else lab(P[1].X(cx(n)), P[1].Y(72), String(n + 1), 'fg-colh', 'c');
    }
    el('line', { x1: 34, y1: 84, x2: 240, y2: 84, stroke: C.rule, 'stroke-width': 1 }, T.g);
    lab(P[1].X(2), P[1].Y(72), 'arm', 'fg-key', 'l');
    T.wl = el('g', {}, T.g); T.cells = []; T.toks = [];
    ROWS.forEach(function (r, i) {
      var at = PATH[r - 1], opn = openAt(r, at), row = [];
      lab(P[1].X(14), P[1].Y(ry(i)), i ? '$t{+}' + i + '$' : '$t$', 'fg-rowh', 'c');
      for (var n = 0; n < 7; n++) {
        var isO = opn.indexOf(n) >= 0, g = el('g', { transform: 'translate(' + cx(n) + ',' + ry(i) + ')' }, T.g);
        if (isO) el('circle', { r: 9, fill: n === AST ? C.bestSoft : C.learnSoft, stroke: n === AST ? C.best : C.learner, 'stroke-width': 1.3 }, g);
        else el('circle', { r: 8, 'class': 'fg-shutcell' + (n === AST ? ' best' : '') }, g);
        row.push(g);
      }
      T.cells.push(row);
      var tk = el('g', { transform: 'translate(' + cx(PATH[r]) + ',' + ry(i) + ')', 'class': 'fg-ttok' }, T.g);
      el('circle', { r: 5.4, fill: C.learner, stroke: '#fff', 'stroke-width': 1.5 }, tk);
      T.toks.push(tk);
      if (opn.indexOf(AST) < 0 && at === 4) lab(P[1].X(248), P[1].Y(ry(i)), 'waits', 'fg-note fg-or', 'l');
      if (PATH[r] === AST && at !== AST) lab(P[1].X(248), P[1].Y(ry(i)), 'steps on', 'fg-note fg-best', 'l');
    });
    /* the learner's line through the table: each row's choice sets the next row's options */
    T.segs = [];
    ROWS.forEach(function (r, i) {
      if (!i) return;
      var a = PATH[ROWS[i - 1]], b = PATH[r];
      T.segs.push(el('path', { d: 'M' + cx(a) + ' ' + ry(i - 1) + ' L' + cx(b) + ' ' + ry(i), 'class': 'fg-trail nav' }, T.wl));
    });
    bottom(P[1], 140, 250, '$a_t \\in L_t(a_{t-1})$', 'Filled arms are open. Which ones are open depends on the arm pulled last.');
    F.rowY = ry;

    /* c: one row of the table, drawn as this round's graph */
    F.g2 = graph(P[2].g, -22, 72, 1, { bars: true, token: PATH[0] });
    bottom(P[2], 102, 222, '$L_t(a) = N_t(a) \\cup \\{a\\}$', 'The open arms are the neighbors of the last pull in this round\'s graph $G_t$.');
  }
  function frameFig(r, moved) {
    var T = F.table, i = ROWS.indexOf(r);
    if (i < 0) { i = ROWS.indexOf(STILL_R); r = STILL_R; }
    T.band.setAttribute('y', F.rowY(i) - 13);
    var all = !playing;
    T.toks.forEach(function (t, k) { t.style.opacity = (all || k < i || (k === i && moved)) ? 1 : 0; });
    T.segs.forEach(function (s, k) { s.style.opacity = (all || k + 1 < i || (k + 1 === i && moved)) ? 1 : 0; });
    T.cells.forEach(function (row, k) { row.forEach(function (c) { c.style.opacity = (all || k <= i) ? 1 : 0.28; }); });
    graphRound(F.g2, r, moved);
  }

  /* ---------- build, play ---------- */
  function HP() { return opt('math') === 'on' ? 300 : 276; }
  function build() {
    labels = []; svg.innerHTML = ''; defs(); F = {};
    compact = root.clientWidth < 560;
    buildFig();
    svg.setAttribute('viewBox', '0 0 ' + VW + ' ' + H);
    labBox.innerHTML = '';
    labels.forEach(function (L) {
      var d = document.createElement('div'); d.className = 'fg-lab an-' + L.an + ' ' + L.cls; d.innerHTML = L.html;
      d.style.left = (L.x / VW * 100) + '%'; d.style.top = (L.y / H * 100) + '%';
      if (L.w) { d.style.width = (L.w / VW * 100) + '%'; d.classList.add('wrapl'); }
      labBox.appendChild(d);
    });
    if (window.MathJax && MathJax.typesetPromise) { if (MathJax.typesetClear) MathJax.typesetClear([root]); MathJax.typesetPromise([root]).catch(function () {}); }
  }
  function frame(r, moved) { frameFig(r, moved); }
  function still() { frame(STILL_R, false); }
  function stop() { clearTimeout(timer); timer = null; playing = false; }
  function play() {
    stop(); playing = true;
    var seq = ROWS.slice(), i = 0;
    function step() {
      if (i >= seq.length) { timer = setTimeout(function () { i = 0; step(); }, HOLD_MS); return; }
      var r = seq[i++]; frame(r, false);
      timer = setTimeout(function () { frame(r, true); timer = setTimeout(step, STEP_MS - MOVE_AT); }, MOVE_AT);
    }
    step();
  }
  function syncButton(on) {
    var b = document.getElementById('fg-motion'); if (!b) return;
    b.setAttribute('aria-pressed', on ? 'false' : 'true');
    b.innerHTML = on ? '<svg viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="1.5" width="2.6" height="9" rx="0.8"/><rect x="7.4" y="1.5" width="2.6" height="9" rx="0.8"/></svg>Pause animation'
                     : '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5 L10.5 6 L3 10.5 Z"/></svg>Play animation';
  }
  function render() { stop(); build(); var on = motionOn(); syncButton(on); if (on) play(); else still(); }

  window.FIG_GRAPHS = {
    render: render,
    typesetAll: function () { if (root && window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([root]); },
    init: function () {
      root = document.getElementById('fig1'); if (!root) return;
      svg = document.getElementById('fg-svg'); labBox = document.getElementById('fg-labels');
      document.getElementById('fg-motion').addEventListener('click', function () { var on = !motionOn(); setMotion(on); syncButton(on); if (on) play(); else { stop(); still(); } });
      /* the Research panel can be hidden at load (width 0): draw once it has a width, redraw on big width changes */
      var w = 0;
      function check() { var cw = root.clientWidth; if (cw > 0 && Math.abs(cw - w) > 40) { w = cw; render(); } }
      if (window.ResizeObserver) new ResizeObserver(check).observe(root); else window.addEventListener('resize', check);
      check();
    }
  };
})();

FIG_GRAPHS.init();
