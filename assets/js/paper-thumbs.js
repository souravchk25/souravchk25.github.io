/* Paper thumbnails drawn on the page (240 x 150, no box): theme 1 (fmab, local, dyn), theme 2 (locality, delay), theme 3 (kata), theme 4 (mal, prox, incl, ince), theme 5 (qns, qrb).
   Each shows a still that stands on its own and plays a short loop while the reader hovers the paper,
   unless the site-wide motion setting is off.
   fmab:  the theme's own run (script.py): edges flicker each round, the lazy walk explores, then
          navigates to the best arm; the bar under it is the two phases, explore then navigate.
   local: sliding-window mixing. Rounds are tiles, well-mixing rounds teal; every window of 5 rounds
          holds at least 2 of them. The graph above is the current round; the learner walks on it.
   dyn:   recurrent reachability. Rounds come in blocks of 4. Each round's graph alone is disconnected (two edges);
          edges seen earlier in the block stay drawn, and when the block ends the union is teal if it is connected.
          Blocks 1 and 3 pass; in block 2 the best arm stays isolated, so its union does not. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var S = {"NODES": [[34, 46], [94, 18], [160, 34], [214, 86], [164, 140], [98, 116], [36, 122]], "CAND": [[0, 1], [1, 2], [2, 3], [0, 6], [6, 5], [5, 4], [4, 3], [1, 5], [2, 4], [0, 5]], "AST": 3, "ONSET": [[0, 4, 8, 9], [0, 3, 6, 8], [1, 5, 9, 3], [2, 7, 4, 0], [6, 1, 9, 4], [5, 2, 3, 7], [4, 8, 0, 1], [4, 2, 9, 7], [5, 7, 3, 1], [8, 5, 0, 9], [8, 2, 3, 7], [6, 4, 1, 9], [2, 5, 0, 3]], "PATH": [0, 1, 2, 3, 4, 5, 6, 5, 4, 4, 4, 3, 3], "SIGMA": 6};
  var C = { learner: '#d97000', best: '#a0124b', ink: '#1c1a17', edge: '#a39c8e', rule: '#e2dacb', card: '#fffdf8', paper: '#fbf8f1',
            bestSoft: '#f8dde6', teal: '#00819b', tealSoft: '#d5ecf0', off: '#cfc6b4' };
  function el(n, a, p) { var e = document.createElementNS(NS, n); for (var q in a) if (a[q] != null) e.setAttribute(q, a[q]); if (p) p.appendChild(e); return e; }
  function star(g, x, y, r, col) {
    var p = []; for (var i = 0; i < 10; i++) { var an = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; p.push((x + rr * Math.cos(an)).toFixed(1) + ',' + (y + rr * Math.sin(an)).toFixed(1)); }
    el('polygon', { points: p.join(' '), fill: col }, g);
  }
  function motionOn() {
    var s = null; try { s = localStorage.getItem('site-motion'); } catch (e) {}
    if (s) return s === 'on';
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function rng(seed) { return function () { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
  function mix(a, b, t) {
    var pa = [1, 3, 5].map(function (i) { return parseInt(a.substr(i, 2), 16); }), pb = [1, 3, 5].map(function (i) { return parseInt(b.substr(i, 2), 16); });
    return '#' + pa.map(function (v, i) { var c = Math.round(v + (pb[i] - v) * t); return (c < 16 ? '0' : '') + c.toString(16); }).join('');
  }
  function node(g, x, y, isB, r) {
    el('circle', { cx: x, cy: y, r: r, fill: isB ? C.bestSoft : C.card, stroke: isB ? C.best : C.ink, 'stroke-width': isB ? 1.8 : 1.2 }, g);
    if (isB) star(g, x, y, r * 0.55, C.best);
  }
  function tok(g) { var t = el('g', { 'class': 'th-tok' }, g); el('circle', { r: 5.4, fill: C.learner, stroke: '#fff', 'stroke-width': 1.6 }, t); return t; }
  function put(t, q) { t.style.transform = 'translate(' + q[0] + 'px,' + q[1] + 'px)'; }

  /* ---------- FMAB ---------- */
  function fmab(svg) {
    var P = S.NODES.map(function (q) { return [q[0] * 0.85 + 14.5, q[1] * 0.85 + 2]; }), LAST = S.PATH.length - 1;
    var eg = el('g', {}, svg), tg = el('g', {}, svg), ng = el('g', {}, svg), top = el('g', {}, svg);
    var edges = S.CAND.map(function (e) { return el('line', { x1: P[e[0]][0], y1: P[e[0]][1], x2: P[e[1]][0], y2: P[e[1]][1] }, eg); });
    P.forEach(function (q, n) { node(ng, q[0], q[1], n === S.AST, 7.5); });
    var t = tok(top);
    var x0 = 30, x1 = 210, xs = x0 + (x1 - x0) * S.SIGMA / LAST, yb = 140;
    el('line', { x1: x0, y1: yb, x2: x1, y2: yb, stroke: C.rule, 'stroke-width': 3, 'stroke-linecap': 'round' }, svg);
    var ex = el('line', { x1: x0, y1: yb, x2: x0, y2: yb, stroke: C.learner, 'stroke-width': 3, 'stroke-linecap': 'round' }, svg);
    var nv = el('line', { x1: xs, y1: yb, x2: xs, y2: yb, stroke: C.best, 'stroke-width': 3, 'stroke-linecap': 'round' }, svg);
    el('line', { x1: xs, y1: yb - 6, x2: xs, y2: yb + 6, stroke: C.ink, 'stroke-width': 1.2 }, svg);
    function frame(r) {
      var at = S.PATH[r], on = S.ONSET[r];
      edges.forEach(function (l, j) {
        var e = S.CAND[j], o = on.indexOf(j) >= 0, door = o && r > S.SIGMA && (e[0] === S.AST || e[1] === S.AST) && (e[0] === at || e[1] === at);
        l.setAttribute('class', 'th-edge ' + (o ? (door ? 'door' : 'on') : 'off'));
      });
      tg.innerHTML = '';
      for (var j = 1; j <= r; j++) { var a = S.PATH[j - 1], b = S.PATH[j]; if (a !== b) el('line', { x1: P[a][0], y1: P[a][1], x2: P[b][0], y2: P[b][1], 'class': 'th-trail' + (j > S.SIGMA ? ' nav' : '') }, tg); }
      put(t, P[at]);
      var xr = x0 + (x1 - x0) * r / LAST;
      ex.setAttribute('x2', Math.min(xr, xs)); nv.setAttribute('x2', Math.max(xr, xs)); nv.style.opacity = r > S.SIGMA ? 1 : 0;
    }
    return { frame: frame, n: LAST + 1, still: 11 };
  }

  /* ---------- Local walks (CDC) ---------- */
  function local(svg) {
    var P = S.NODES.map(function (q) { return [q[0] * 0.78 + 23, q[1] * 0.78 - 4]; });
    var GOODP = [1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0], W = 5, N = GOODP.length;
    var GOOD = [[0, 1, 2, 3, 4, 5, 6, 8], [0, 2, 4, 6, 7, 8, 9, 1], [1, 3, 5, 6, 7, 8, 9, 2]], BAD = [[7], [1, 4], [9], [3], [5, 2], [8], [0]];
    var on = [], gi = 0, bi = 0; GOODP.forEach(function (g) { on.push(g ? GOOD[gi++ % 3] : BAD[bi++ % BAD.length]); });
    /* the learner: a lazy walk that moves along an open edge to the least-visited neighbour (deterministic) */
    var path = [0], seen = { 0: 1 };
    for (var r = 0; r < N; r++) {
      var at = path[path.length - 1], nb = [];
      on[r].forEach(function (j) { var e = S.CAND[j]; if (e[0] === at) nb.push(e[1]); else if (e[1] === at) nb.push(e[0]); });
      nb.sort(function (a, b) { return (seen[a] || 0) - (seen[b] || 0) || a - b; });
      var nx = nb.length && (GOODP[r] || r % 2) ? nb[0] : at; seen[nx] = (seen[nx] || 0) + 1; path.push(nx);
    }
    var eg = el('g', {}, svg), ng = el('g', {}, svg), top = el('g', {}, svg);
    var edges = S.CAND.map(function (e) { return el('line', { x1: P[e[0]][0], y1: P[e[0]][1], x2: P[e[1]][0], y2: P[e[1]][1] }, eg); });
    P.forEach(function (q, n) { node(ng, q[0], q[1], n === S.AST, 7); });
    var t = tok(top);
    var tw = 11, gap = 3.4, tx0 = 120 - (N * tw + (N - 1) * gap) / 2, ty = 128;
    var tiles = GOODP.map(function (g, i) { return el('rect', { x: tx0 + i * (tw + gap), y: ty, width: tw, height: tw, rx: 2.2, 'class': 'th-tile' + (g ? ' good' : '') }, svg); });
    var win = el('rect', { y: ty - 4, height: tw + 8, width: W * tw + (W - 1) * gap + 8, rx: 4.5, 'class': 'th-win' }, svg);
    function frame(r) {
      var at = path[r + 1], o = on[r], good = GOODP[r];
      edges.forEach(function (l, j) { l.setAttribute('class', 'th-edge ' + (o.indexOf(j) >= 0 ? (good ? 'mix' : 'on') : 'off')); });
      put(t, P[at]);
      tiles.forEach(function (tl, i) { tl.classList.toggle('now', i === r); tl.style.opacity = i <= r ? 1 : 0.35; });
      var s = Math.max(0, Math.min(N - W, r - W + 1)); win.setAttribute('x', tx0 + s * (tw + gap) - 4);
    }
    return { frame: frame, n: N, still: 12 };
  }

  /* ---------- Dynamic graphs (workshop): recurrent reachability ---------- */
  function dyn(svg) {
    var P = S.NODES.map(function (q) { return [q[0] * 0.78 + 23, q[1] * 0.78 - 4]; }), A = 4;
    /* 3 blocks of A = 4 rounds; each round has 2 edges, so every single graph is disconnected.
       Blocks 1 and 3: the union over the block is connected. Block 2: a* stays isolated, so its union is not. */
    var ON = [[0, 4], [1, 6], [3, 8], [5, 2],   [0, 7], [9], [4, 1], [3, 8],   [2, 9], [5, 0], [6, 3], [1, 7]], N = ON.length, NB = N / A;
    function connected(edges) {
      var par = [0, 1, 2, 3, 4, 5, 6]; function f(x) { return par[x] === x ? x : (par[x] = f(par[x])); }
      edges.forEach(function (j) { var e = S.CAND[j]; par[f(e[0])] = f(e[1]); });
      return [0, 1, 2, 3, 4, 5, 6].every(function (x) { return f(x) === f(0); });
    }
    var OK = []; for (var k = 0; k < NB; k++) OK.push(connected([].concat.apply([], ON.slice(k * A, k * A + A))));
    /* the learner: moves along this round's edges to its least-visited neighbour */
    var path = [0], seen = { 0: 1 };
    for (var r = 0; r < N; r++) {
      var at = path[path.length - 1], nb = [];
      ON[r].forEach(function (j) { var e = S.CAND[j]; if (e[0] === at) nb.push(e[1]); else if (e[1] === at) nb.push(e[0]); });
      nb.sort(function (a, b) { return (seen[a] || 0) - (seen[b] || 0) || a - b; });
      var nx = nb.length ? nb[0] : at; seen[nx] = (seen[nx] || 0) + 1; path.push(nx);
    }
    var eg = el('g', {}, svg), ng = el('g', {}, svg), top = el('g', {}, svg);
    var edges = S.CAND.map(function (e) { return el('line', { x1: P[e[0]][0], y1: P[e[0]][1], x2: P[e[1]][0], y2: P[e[1]][1] }, eg); });
    P.forEach(function (q, n) { node(ng, q[0], q[1], n === S.AST, 7); });
    var t = tok(top);
    /* rounds as dots, grouped into blocks; a block's bracket turns teal when its union graph is connected */
    var dx = 13, bgap = 14, y = 128, x0 = 120 - ((N - 1) * dx + (NB - 1) * bgap) / 2, X = function (r) { return x0 + r * dx + Math.floor(r / A) * bgap; };
    var dots = [], brk = [];
    for (k = 0; k < NB; k++) brk.push(el('path', { d: 'M' + (X(k * A) - 5) + ' ' + (y + 9) + ' v4 H' + (X(k * A + A - 1) + 5) + ' v-4', 'class': 'th-brk' }, svg));
    for (r = 0; r < N; r++) dots.push(el('circle', { cx: X(r), cy: y, r: 3.6, 'class': 'th-dot' }, svg));
    function frame(r) {
      var k = Math.floor(r / A), s = k * A, uni = {};
      for (var i = s; i < r; i++) ON[i].forEach(function (j) { uni[j] = 1; });
      var end = r === s + A - 1;
      edges.forEach(function (l, j) {
        var now = ON[r].indexOf(j) >= 0;
        l.setAttribute('class', 'th-edge ' + (now ? 'on' : (uni[j] ? (end && OK[k] ? 'mix' : 'uni') : 'off')));
      });
      put(t, P[path[r + 1]]);
      dots.forEach(function (d, i) { d.setAttribute('class', 'th-dot' + (i <= r ? ' past' : '') + (i === r ? ' now' : '')); });
      brk.forEach(function (b, i) { var done = i < k || (i === k && end); b.setAttribute('class', 'th-brk' + (done ? (OK[i] ? ' ok' : ' no') : '')); });
    }
    return { frame: frame, n: N, still: N - 1 };
  }


  /* ---------- Locality in scalable MARL: how far one agent's influence reaches, smooth vs sharp policy ----------
     Same example as the theme figure (7 x 5 grid; H = E^s + E^a Pi(pi), softmax policies with rho(H) = 0.3 and 0.95).
     Node shade = ((I - H)^{-1})_{j<-i} relative to agent i itself, log scale. Still: smooth; on hover it alternates. */
  var LOC = {"pos": [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4]], "edges": [[0, 1], [0, 7], [1, 2], [1, 8], [2, 3], [2, 9], [3, 4], [3, 10], [4, 5], [4, 11], [5, 6], [5, 12], [6, 13], [7, 8], [7, 14], [8, 9], [8, 15], [9, 10], [9, 16], [10, 11], [10, 17], [11, 12], [11, 18], [12, 13], [12, 19], [13, 20], [14, 15], [14, 21], [15, 16], [15, 22], [16, 17], [16, 23], [17, 18], [17, 24], [18, 19], [18, 25], [19, 20], [19, 26], [20, 27], [21, 22], [21, 28], [22, 23], [22, 29], [23, 24], [23, 30], [24, 25], [24, 31], [25, 26], [25, 32], [26, 27], [26, 33], [27, 34], [28, 29], [29, 30], [30, 31], [31, 32], [32, 33], [33, 34]], "src": 17, "smooth": [0.00017531019603686242, 0.0009221461950440769, 0.0036922609757004303, 0.012014315501619703, 0.0036922609757004295, 0.0009221461950440764, 0.00017531019603686236, 0.0006441063146033524, 0.003785910992262284, 0.023150900715459704, 0.07296738751760118, 0.023150900715459694, 0.003785910992262282, 0.000644106314603352, 0.0013948467951776246, 0.012205934966056816, 0.07298890710132859, 1.0444980642518789, 0.07298890710132853, 0.012205934966056809, 0.0013948467951776242, 0.0006441063146033519, 0.0037859109922622823, 0.023150900715459683, 0.07296738751760112, 0.023150900715459673, 0.0037859109922622814, 0.000644106314603352, 0.00017531019603686233, 0.0009221461950440765, 0.0036922609757004286, 0.012014315501619695, 0.0036922609757004286, 0.0009221461950440763, 0.0001753101960368623], "sharp": [0.2580989140341972, 0.5212087326795497, 0.6723824619022156, 0.8419239951599439, 0.6723824619022155, 0.5212087326795498, 0.2580989140341972, 0.4749517299703111, 0.8699273320936562, 1.3662328782652478, 1.3642577788545993, 1.3662328782652475, 0.869927332093656, 0.474951729970311, 0.5271820282473167, 1.1233786198255844, 1.4383131682211365, 2.835220711949801, 1.4383131682211363, 1.1233786198255844, 0.5271820282473167, 0.4749517299703111, 0.8699273320936561, 1.3662328782652478, 1.3642577788545993, 1.366232878265248, 0.8699273320936564, 0.47495172997031104, 0.2580989140341972, 0.5212087326795498, 0.6723824619022155, 0.8419239951599439, 0.6723824619022156, 0.5212087326795498, 0.2580989140341973]};
  function locality(svg) {
    var sp = 30, cx = 120, cy = 73, X = function (u) { return cx + (LOC.pos[u][0] - 3) * sp; }, Y = function (u) { return cy + (LOC.pos[u][1] - 2) * sp; };
    LOC.edges.forEach(function (e) { el('line', { x1: X(e[0]), y1: Y(e[0]), x2: X(e[1]), y2: Y(e[1]), stroke: C.rule, 'stroke-width': 1.6 }, svg); });
    var nodes = LOC.pos.map(function (q, u) { return el('circle', { cx: X(u), cy: Y(u), r: u === LOC.src ? 8.5 : 7.5, stroke: u === LOC.src ? C.ink : C.off, 'stroke-width': u === LOC.src ? 1.8 : 1, 'class': 'th-heat' }, svg); });
    function shade(v, self) { var r = Math.max(v / self, 1e-6), t = Math.max(0, Math.min(1, (Math.log10(r) + 3) / 3)); return t < 0.45 ? mix(C.paper, '#f8dde6', t / 0.45) : mix('#f8dde6', C.best, (t - 0.45) / 0.55); }
    function frame(k) {
      var v = LOC[k === 1 ? 'sharp' : 'smooth'], self = v[LOC.src];
      nodes.forEach(function (c, u) { c.setAttribute('fill', u === LOC.src ? C.best : shade(v[u], self)); });
    }
    return { frame: frame, n: 2, still: 0, step: 1700 };
  }

  /* ---------- Communication delay in networked MARL: the information cone ----------
     Corridor of 13 agents, source at the left end, agent i at column 8 (as in the paper's Figure 1b).
     Rows go back in time (top = now). With T message rounds per step, agent i can use observation (j, s) only if
     d(i, j) <= (t - s + 1) T. The freshest source observation in the cone is k_i = ceil(d(i, R) / T) - 1 steps old.
     Still: T = 2 (k_i = 3); on hover T steps through 1, 2, 3, 4. */
  function delay(svg) {
    var NJ = 13, NA = 8, I = 8, X = function (j) { return 22 + j * 16.3; }, Y = function (a) { return 14 + a * 16.6; };
    var cone = el('path', { 'class': 'th-cone' }, svg), dots = [];
    el('line', { x1: X(I), y1: Y(0) - 8, x2: X(I), y2: Y(NA - 1) + 8, stroke: C.rule, 'stroke-width': 1.2 }, svg);
    for (var a = 0; a < NA; a++) for (var j = 0; j < NJ; j++) dots.push({ a: a, j: j, c: el('circle', { cx: X(j), cy: Y(a), r: 3.3 }, svg) });
    var fresh = el('circle', { r: 5.6, fill: 'none', stroke: C.ink, 'stroke-width': 1.5 }, svg);
    var me = el('circle', { cx: X(I), cy: Y(0), r: 5.4, fill: C.best, stroke: C.ink, 'stroke-width': 1.5 }, svg);
    function frame(k) {
      var T = k + 1, kk = Math.max(0, Math.ceil(I / T) - 1);
      dots.forEach(function (d) {
        var inC = Math.abs(d.j - I) <= (d.a + 1) * T, src = d.j === 0;
        d.c.setAttribute('class', 'th-cd' + (inC ? ' in' : '') + (src ? ' src' : ''));
      });
      var L = [], R = [];
      for (var a = 0; a < NA; a++) { var w = (a + 1) * T; L.push([X(Math.max(0, I - w)) - 6, Y(a)]); R.push([X(Math.min(NJ - 1, I + w)) + 6, Y(a)]); }
      var pts = [[L[0][0], Y(0) - 7], [R[0][0], Y(0) - 7]].concat(R).concat([[R[NA - 1][0], Y(NA - 1) + 7], [L[NA - 1][0], Y(NA - 1) + 7]]).concat(L.slice().reverse());
      cone.setAttribute('d', 'M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L') + ' Z');
      fresh.setAttribute('cx', X(0)); fresh.setAttribute('cy', Y(Math.min(kk, NA - 1)));
    }
    return { frame: frame, n: 4, still: 1, step: 1300 };
  }

  /* ---------- KATA: keys in two dimensions and their lifts on the PSD cone ----------
     Left: T key directions in d = 2 at angles k pi / T (the theme figure's panel b; the key being read is orange).
     Right: the cone of 2 x 2 PSD matrices. With coordinates t = (a + c)/sqrt2, x = (a - c)/sqrt2, y = sqrt2 b it is
     t >= sqrt(x^2 + y^2). A unit key u at angle theta lifts to uu^T = (1/sqrt2)(1, cos 2theta, sin 2theta): a point on the
     rim at height t = 1/sqrt2, at twice the angle, so <uu^T, vv^T> = (1 + cos 2Delta)/2 = cos^2 Delta. Lifted keys are
     rays of the cone (rank one) and sit twice as far apart around it. Still: T = 8; on hover the keys arrive one by one. */
  function kata(svg) {
    var KEY = '#5b2bc4', Q = C.learner, TM = 8;
    var lx = 54, ly = 75, LR = 40;
    el('circle', { cx: lx, cy: ly, r: LR, fill: 'none', stroke: C.rule, 'stroke-width': 1.6 }, svg);
    var cx = 182, cy = 54, rx = 50, ry = 15, ax = cx, ay = 102;   /* a 45 degree cone seen from about 17 degrees above the rim */
    var d = el('defs', {}, svg), gr = el('linearGradient', { id: 'th-kata-g', x1: 0, y1: 0, x2: 0, y2: 1 }, d);
    el('stop', { offset: 0, 'stop-color': KEY, 'stop-opacity': 0.05 }, gr); el('stop', { offset: 1, 'stop-color': KEY, 'stop-opacity': 0.2 }, gr);
    var hy = ay - cy, ty = ry * ry / hy, tx = rx * Math.sqrt(1 - (ty / ry) * (ty / ry));   /* tangent points of the sides */
    el('path', { d: 'M' + ax + ' ' + ay + ' L' + (cx - tx) + ' ' + (cy + ty) + ' A' + rx + ' ' + ry + ' 0 0 0 ' + (cx + tx) + ' ' + (cy + ty) + ' Z', fill: 'url(#th-kata-g)', stroke: 'none' }, svg);
    el('ellipse', { cx: cx, cy: cy, rx: rx, ry: ry, fill: KEY, 'fill-opacity': 0.08, stroke: 'none' }, svg);   /* the slice of unit trace; rank-one matrices form its rim */
    [[-1], [1]].forEach(function (s) { el('line', { x1: ax, y1: ay, x2: cx + s[0] * tx, y2: cy + ty, stroke: KEY, 'stroke-opacity': 0.6, 'stroke-width': 1.3 }, svg); });
    el('ellipse', { cx: cx, cy: cy, rx: rx, ry: ry, fill: 'none', stroke: KEY, 'stroke-opacity': 0.8, 'stroke-width': 1.5 }, svg);
    el('line', { x1: 103, y1: 75, x2: 125, y2: 75, stroke: '#4f4a42', 'stroke-width': 1.3, 'marker-end': 'url(#th-kata-ar)' }, svg);
    var m = el('marker', { id: 'th-kata-ar', viewBox: '0 0 10 10', refX: 8.6, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto', markerUnits: 'userSpaceOnUse' }, d);
    el('path', { d: 'M0 1 L9.4 5 L0 9 Z', fill: '#4f4a42' }, m);
    var keys = [];
    for (var k = 0; k < TM; k++) {
      var col = k ? KEY : Q, g = el('g', { 'class': 'th-kk' }, svg);
      var ln = el('line', { stroke: col, 'stroke-width': k ? 1.6 : 2.2, 'stroke-linecap': 'round' }, g);
      var e1 = el('circle', { r: k ? 3 : 3.8, fill: col }, g), e2 = el('circle', { r: k ? 3 : 3.8, fill: col }, g);
      var ray = el('line', { x1: ax, y1: ay, stroke: col, 'stroke-width': k ? 1.2 : 1.8 }, g);
      var pt = el('circle', { r: k ? 3.6 : 4.4, fill: col, stroke: '#fff', 'stroke-width': 1.2 }, g);
      keys.push({ g: g, ln: ln, e1: e1, e2: e2, ray: ray, pt: pt });
    }
    function frame(i) {
      var T = i + 2;   /* frames 0..6 show T = 2..8 */
      keys.forEach(function (K, k) {
        var th = k * Math.PI / T, dx = LR * Math.cos(th), dy = -LR * Math.sin(th), ph = 5 * Math.PI / 8 + 2 * th;   /* rim angle = twice the key angle (offset only turns the picture) */
        K.ln.setAttribute('x1', lx - dx); K.ln.setAttribute('y1', ly - dy); K.ln.setAttribute('x2', lx + dx); K.ln.setAttribute('y2', ly + dy);
        K.e1.setAttribute('cx', lx + dx); K.e1.setAttribute('cy', ly + dy); K.e2.setAttribute('cx', lx - dx); K.e2.setAttribute('cy', ly - dy);
        var px = cx + rx * Math.cos(ph), py = cy + ry * Math.sin(ph);
        K.ray.setAttribute('x2', px); K.ray.setAttribute('y2', py); K.ray.setAttribute('stroke-opacity', k ? (py > cy ? 0.55 : 0.25) : 0.9); K.pt.setAttribute('cx', px); K.pt.setAttribute('cy', py);
        K.g.style.opacity = k < T ? 1 : 0;
      });
    }
    return { frame: frame, n: TM - 1, still: TM - 2 };
  }

  /* ---------- Theme 4 thumbnails (mal, prox, incl, ince), in their own scope ----------
     mal:  Multi-Agent Lipschitz Bandits. Cells along one reward line (the theme figure's reward); agents probe, the team
           agrees on the top cells, musical chairs seats one agent per cell, then each refines inside its own cell.
           T4D is the same run as _src/figures/cont_model.py (line and split).
     prox: Proximity collisions. Two peaks a little more than rho apart (the paper's Figure 2). Playing the exact points is
           legal (top row); regions big enough to reach both peaks sit too close and can collide (middle); regions kept
           rho + 2r apart miss the second peak (bottom). Hover steps through the three rows.
     incl: Incentivized Lipschitz Bandits. A uniform grid of arms with estimated means; the agent would take the greedy arm
           (outlined), the principal recommends the UCB arm and pays the gap in estimates (teal bracket); the reported reward
           comes back raised by the payment (crimson arrow). A seeded run; hover steps through rounds as the gap shrinks.
     ince: Incentivized exploration, non-stationary. Two arms swap at a breakpoint; a sliding window keeps only recent pulls;
           payments (teal bars) jump after the breakpoint and die down. A seeded run of sliding-window UCB. */
  var T4D = {"line":{"peaks":[[0.3,1.0],[0.37,0.95],[0.78,0.6]],"w":0.1,"floor":0.05,"rho":0.12,"L":10.0},"split":{"cells":[[0.0,0.16666666666666666],[0.16666666666666666,0.3333333333333333],[0.3333333333333333,0.5],[0.5,0.6666666666666666],[0.6666666666666666,0.8333333333333334],[0.8333333333333334,1.0]],"top":[1,2,4],"probe":[{"cell":[5,3,4],"col":[false,false,false]},{"cell":[1,1,5],"col":[true,true,false]},{"cell":[5,0,2],"col":[false,false,false]},{"cell":[4,0,4],"col":[true,false,true]}],"chairs":[{"pick":[4,1,1],"seated":[true,false,false]},{"pick":[4,1,2],"seated":[true,true,true]}],"learn":[{"cell":4,"ivs":[[0.6667,0.8333],[0.75,0.8333],[0.75,0.7917],[0.7708,0.7917]],"peak":0.7799},{"cell":1,"ivs":[[0.1667,0.3333],[0.25,0.3333],[0.2917,0.3333],[0.2917,0.3125]],"peak":0.2999},{"cell":2,"ivs":[[0.3333,0.5],[0.3333,0.4167],[0.3333,0.375],[0.3542,0.375]],"peak":0.3701}]}};
  var T4 = (function () {
  var NS = 'http://www.w3.org/2000/svg';
  var C = { ag: '#d97000', col: '#a0124b', colSoft: '#f8dde6', ink: '#1c1a17', muted: '#4f4a42', rule: '#e2dacb', edge: '#a39c8e', paper: '#fbf8f1', fill: '#e2f0da', green: '#2e7d1f', teal: '#00819b' };
  function el(n, a, p) { var e = document.createElementNS(NS, n); for (var q in a) if (a[q] != null) e.setAttribute(q, a[q]); if (p) p.appendChild(e); return e; }
  function rng(seed) { return function () { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
  function gauss(R) { var u = Math.max(1e-9, R()), v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function dot(g, x, y, r, c) { return el('circle', { cx: x, cy: y, r: r || 4.4, fill: c || C.ag, stroke: '#fff', 'stroke-width': 1.3 }, g); }
  function cross(g, x, y, r) { var q = el('g', { stroke: C.col, 'stroke-width': 2.2, 'stroke-linecap': 'round' }, g); r = r || 4.2; el('line', { x1: x - r, y1: y - r, x2: x + r, y2: y + r }, q); el('line', { x1: x - r, y1: y + r, x2: x + r, y2: y - r }, q); return q; }
  function check(g, x, y) { return el('path', { d: 'M' + (x - 5) + ' ' + y + ' l3.6 3.8 l6.4 -7.6', fill: 'none', stroke: C.green, 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g); }
  function tentLine(g, X, Y, fn, n) {
    var pts = []; for (var i = 0; i <= (n || 240); i++) { var x = i / (n || 240); pts.push(X(x).toFixed(1) + ' ' + Y(fn(x)).toFixed(1)); }
    el('path', { d: 'M' + X(0) + ' ' + Y(0) + ' L' + pts.join(' L') + ' L' + X(1) + ' ' + Y(0) + ' Z', fill: C.fill }, g);
    el('path', { d: 'M' + pts.join(' L'), fill: 'none', stroke: C.ink, 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, g);
    el('line', { x1: X(0), y1: Y(0), x2: X(1), y2: Y(0), stroke: C.muted, 'stroke-width': 1 }, g);
  }

  /* ---------- Multi-Agent Lipschitz Bandits ---------- */
  function mal(svg) {
    var D = T4D;
    var mu = function (x) { var m = D.line.floor; D.line.peaks.forEach(function (p) { m = Math.max(m, p[1] * (1 - Math.abs(x - p[0]) / D.line.w)); }); return m; };
    var S = D.split, K = S.cells.length, X = function (x) { return 12 + x * 216; }, Y = function (v) { return 92 - v * 74; }, ys = 112;
    tentLine(svg, X, Y, mu);
    var cells = []; for (var k = 0; k < K; k++) cells.push(el('rect', { x: X(k / K), y: ys - 8, width: 216 / K, height: 16, fill: 'none', stroke: C.edge, 'stroke-width': 1 }, svg));
    var zoom = el('g', {}, svg), marks = el('g', {}, svg);
    var centre = function (k) { return (S.cells[k][0] + S.cells[k][1]) / 2; };
    function frame(f) {
      marks.innerHTML = ''; zoom.innerHTML = '';
      cells.forEach(function (c, k) { var top = f >= 1 && S.top.indexOf(k) >= 0; c.setAttribute('fill', top ? C.fill : 'none'); c.setAttribute('stroke', top ? C.green : C.edge); });
      if (f === 0) { var p = S.probe[1]; p.cell.forEach(function (k, j) { var x = X(centre(k)) + (p.col[j] ? (j % 2 ? 6 : -6) : 0); if (p.col[j]) cross(marks, x, ys); else dot(marks, x, ys, 4.2); }); }
      else if (f === 2 || f === 3) { var c = S.chairs[f === 2 ? 0 : S.chairs.length - 1]; c.pick.forEach(function (k, j) { var hit = !c.seated[j] && c.pick.filter(function (q) { return q === k; }).length > 1; var x = X(centre(k)) + (hit ? (j % 2 ? 6 : -6) : 0); if (hit) cross(marks, x, ys); else dot(marks, x, ys, 4.2); }); }
      else if (f === 4) S.learn.forEach(function (L) {
        L.ivs.forEach(function (iv, d) { el('rect', { x: X(iv[0]), y: ys + 13 + d * 5, width: Math.max(1.5, (iv[1] - iv[0]) * 216), height: 3.4, fill: C.ag, 'fill-opacity': 0.35 + 0.15 * d }, zoom); });
        dot(marks, X(centre(L.cell)), ys, 4.2); dot(marks, X(L.peak), Y(mu(L.peak)), 4.2);
      });
    }
    return { frame: frame, n: 5, still: 4, step: 950 };
  }

  /* ---------- Proximity collisions: exact points vs regions fixed in advance ---------- */
  function prox(svg) {
    var rho = .3, s = .04, r = .06, p1 = .33, p2 = p1 + rho + s, hw = .035;
    var mu = function (x) { return Math.max(.04, Math.max(1 - Math.abs(x - p1) / hw, .9 * (1 - Math.abs(x - p2) / hw))); };
    var X = function (x) { return 14 + x * 212; }, Y = function (v) { return 58 - v * 44; };
    tentLine(svg, X, Y, mu, 480);
    var ys = [80, 104, 128], rows = [];
    ys.forEach(function (y) { rows.push(el('g', { 'class': 'th-pr' }, svg)); el('line', { x1: X(0), y1: y, x2: X(1), y2: y, stroke: C.rule, 'stroke-width': 1 }, rows[rows.length - 1]); });
    [p1, p2].forEach(function (p) { el('line', { x1: X(p), y1: Y(0), x2: X(p), y2: ys[2] + 8, stroke: C.edge, 'stroke-width': .8, 'stroke-dasharray': '1.5 3' }, svg); });
    /* row 1: the exact points, more than rho apart: legal */
    var g = rows[0];
    el('path', { d: 'M' + X(p1) + ' ' + (ys[0] - 9) + ' v-4 H' + X(p2) + ' v4', fill: 'none', stroke: C.ink, 'stroke-width': 1 }, g);
    dot(g, X(p1), ys[0]); dot(g, X(p2), ys[0]); check(g, X(.9), ys[0]);
    /* row 2: radius-r regions centred on both peaks: centres closer than rho + 2r, so two points in them can collide */
    g = rows[1];
    [p1, p2].forEach(function (c) { el('rect', { x: X(c - r), y: ys[1] - 4, width: 2 * r * 212, height: 8, fill: C.ag, 'fill-opacity': .25 }, g); });
    dot(g, X(p1 + r), ys[1], 3.4); dot(g, X(p2 - r), ys[1], 3.4); cross(g, X(.9), ys[1]);
    el('line', { x1: X(p1 + r), y1: ys[1] + 7, x2: X(p2 - r), y2: ys[1] + 7, stroke: C.col, 'stroke-width': 1.2 }, g);
    /* row 3: regions kept rho + 2r apart: the second misses its peak */
    g = rows[2];
    var c2 = p1 + rho + 2 * r + .01;
    [p1, c2].forEach(function (c) { el('rect', { x: X(c - r), y: ys[2] - 4, width: 2 * r * 212, height: 8, fill: C.ag, 'fill-opacity': .25 }, g); });
    dot(g, X(p1), ys[2], 3.4); dot(g, X(c2 - r), ys[2], 3.4); cross(g, X(.9), ys[2]);
    function frame(f) { rows.forEach(function (q, i) { q.style.opacity = f === 3 || f === i ? 1 : 0.28; }); }
    return { frame: frame, n: 4, still: 3, step: 1300 };
  }

  /* ---------- Incentivized Lipschitz Bandits: recommend, pay the gap, read a raised reward ---------- */
  function incl(svg) {
    var K = 9, mu = function (x) { return .25 + .55 * Math.exp(-Math.pow((x - .62) / .18, 2)); }, arms = [];
    for (var k = 0; k < K; k++) arms.push(mu((k + .5) / K));
    var R = rng(5), n = arms.map(function () { return 0; }), sum = arms.map(function () { return 0; }), snaps = [], keep = [6, 14, 30, 60, 120, 400];
    for (var t = 1; t <= 400; t++) {
      var est = arms.map(function (m, k) { return n[k] ? sum[k] / n[k] : 0; });
      var a, g, ub = -1, gb = -1;
      for (k = 0; k < K; k++) { var u = n[k] ? est[k] + Math.sqrt(2 * Math.log(t) / n[k]) : 9; if (u > ub) { ub = u; a = k; } if (n[k] && est[k] > gb) { gb = est[k]; g = k; } }
      if (g == null) g = a;
      var kap = n[a] ? Math.max(0, est[g] - est[a]) : 0, r = arms[a] + .08 * gauss(R) + .5 * kap;
      if (keep.indexOf(t) >= 0) snaps.push({ est: est.slice(), n: n.slice(), a: a, g: g, kap: kap, r: r });
      n[a]++; sum[a] += r;
    }
    var bw = 216 / K, X = function (k) { return 12 + k * bw; }, Y = function (v) { return 128 - v * 110; };
    var line = []; for (var i = 0; i <= 100; i++) line.push((12 + i / 100 * 216).toFixed(1) + ' ' + Y(mu(i / 100)).toFixed(1));
    el('path', { d: 'M' + line.join(' L'), fill: 'none', stroke: C.ink, 'stroke-width': 1.2, 'stroke-dasharray': '3 2.5', 'stroke-opacity': .6 }, svg);
    el('line', { x1: 12, y1: Y(0), x2: 228, y2: Y(0), stroke: C.muted, 'stroke-width': 1 }, svg);
    var bars = [], dyn = el('g', {}, svg);
    for (k = 0; k < K; k++) bars.push(el('rect', { x: X(k) + 3, width: bw - 6, rx: 1.5, fill: C.fill, stroke: C.green, 'stroke-width': 1, 'class': 'th-bar4' }, svg));
    function frame(f) {
      var s = snaps[f]; dyn.innerHTML = '';
      bars.forEach(function (b, k) { var h = Math.max(1, s.est[k] * 110); b.setAttribute('y', Y(s.est[k] || 0)); b.setAttribute('height', s.n[k] ? h : 1); });
      var xa = X(s.a) + bw / 2, xg = X(s.g) + bw / 2;
      el('rect', { x: X(s.g) + 3, y: Y(s.est[s.g]), width: bw - 6, height: s.est[s.g] * 110, fill: 'none', stroke: C.ink, 'stroke-width': 1.6 }, dyn);
      if (s.a !== s.g && s.kap > 0) {
        var y1 = Y(s.est[s.g]), y2 = Y(s.est[s.a]), xb = Math.min(xa, xg) + Math.abs(xa - xg) / 2;
        el('line', { x1: X(Math.min(s.a, s.g)) + 3, y1: y1, x2: X(Math.max(s.a, s.g)) + bw - 3, y2: y1, stroke: C.ink, 'stroke-width': .8, 'stroke-dasharray': '2 2' }, dyn);
        el('path', { d: 'M' + (xa + 9) + ' ' + y1 + ' h3 V' + y2 + ' h-3', fill: 'none', stroke: C.teal, 'stroke-width': 1.6 }, dyn);
      }
      var yr = Y(Math.min(1.05, s.r)), yt = Y(Math.min(1.05, s.r - .5 * s.kap));
      if (s.kap > .004) el('line', { x1: xa, y1: yt, x2: xa, y2: yr + 4, stroke: C.col, 'stroke-width': 1.4, 'marker-end': 'url(#th-ci-ar)' }, dyn);
      dot(dyn, xa, yr, 4);
    }
    var m = el('marker', { id: 'th-ci-ar', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 5, markerHeight: 5, orient: 'auto', markerUnits: 'userSpaceOnUse' }, el('defs', {}, svg));
    el('path', { d: 'M0 1 L9.4 5 L0 9 Z', fill: C.col }, m);
    return { frame: frame, n: snaps.length, still: 1, step: 1100 };
  }

  /* ---------- Incentivized exploration, non-stationary: a breakpoint, a sliding window, payments ---------- */
  function ince(svg) {
    var T = 300, B = 150, tau = 50, R = rng(9), m = function (k, t) { return t < B ? (k ? .35 : .7) : (k ? .75 : .3); };
    var hist = [], pay = [];
    for (var t = 0; t < T; t++) {
      var lo = Math.max(0, t - tau), n = [0, 0], s = [0, 0];
      for (var i = lo; i < t; i++) { n[hist[i].a]++; s[hist[i].a] += hist[i].r; }
      var est = [0, 1].map(function (k) { return n[k] ? s[k] / n[k] : 0; }), u = [0, 1].map(function (k) { return n[k] ? est[k] + Math.sqrt(.6 * Math.log(Math.min(t + 1, tau)) / n[k]) : 9; });
      var a = u[1] > u[0] ? 1 : 0, g = est[1] > est[0] ? 1 : 0, kap = n[a] && n[g] ? Math.max(0, est[g] - est[a]) : 0;
      var r = m(a, t) + .1 * gauss(R) + .5 * kap; hist.push({ a: a, r: r }); pay.push(kap);
    }
    var X = function (t) { return 14 + t / T * 212; }, Y = function (v) { return 92 - v * 76; };
    el('line', { x1: X(0), y1: Y(0), x2: X(T), y2: Y(0), stroke: C.muted, 'stroke-width': 1 }, svg);
    [0, 1].forEach(function (k) { el('path', { d: 'M' + X(0) + ' ' + Y(m(k, 0)) + ' H' + X(B) + ' V' + Y(m(k, B)) + ' H' + X(T), fill: 'none', stroke: k ? C.green : C.ink, 'stroke-width': 1.8, 'stroke-dasharray': k ? null : '4 2.5' }, svg); });
    el('line', { x1: X(B), y1: Y(0) - 2, x2: X(B), y2: 140, stroke: C.col, 'stroke-width': 1, 'stroke-dasharray': '2 2.5' }, svg);
    var win = el('rect', { y: Y(1) - 2, height: Y(0) - Y(1) + 4, width: tau / T * 212, fill: C.ag, 'fill-opacity': .1, stroke: C.ag, 'stroke-width': 1.2, 'class': 'th-win4' }, svg);
    var pts = el('g', {}, svg), yb = 140, bin = 10;
    for (var b0 = 0; b0 < T; b0 += bin) { var p = 0; for (var j = b0; j < b0 + bin; j++) p += pay[j]; el('rect', { x: X(b0) + .5, y: yb - Math.min(28, p * 14), width: bin / T * 212 - 1, height: Math.min(28, p * 14), fill: C.teal, 'fill-opacity': .75 }, svg); }
    el('line', { x1: X(0), y1: yb, x2: X(T), y2: yb, stroke: C.muted, 'stroke-width': 1 }, svg);
    var stops = [60, 110, 160, 175, 200, 250, 300];
    function frame(f) {
      var te = stops[f]; win.setAttribute('x', X(te - tau)); pts.innerHTML = '';
      for (var t = Math.max(0, te - tau); t < te; t += 3) el('circle', { cx: X(t), cy: Y(Math.max(0, Math.min(1, hist[t].r))), r: 1.6, fill: hist[t].a ? C.green : C.ink, 'fill-opacity': .7 }, pts);
    }
    return { frame: frame, n: stops.length, still: 3, step: 900 };
  }

    return { mal: mal, prox: prox, incl: incl, ince: ince };
  })();

  /* ---------- Theme 5 thumbnails (qns, qrb), in their own scope ----------
     qns: Non-Stationary Quantum Bandits. A drifting mean over a stretch of time, restarted every w rounds; each teal segment is
          the mean at a restart, aging until the next one. Hover steps w from short (many restarts) to long (stale estimates);
          the still is the balanced window.
     qrb: On Regret Bounds of Quantum Bandit Algorithms. Regret against the horizon on a log axis: the classical worst case grows
          like sqrt(T) (grey, dashed); for quantum learners the upper and lower bounds are parallel lines in log T (the teal band,
          Theta(n sigma log T)). Hover steps sigma through 1/4, 1/2, 1: the band's slope grows linearly with sigma. Schematic. */
  var T5 = (function () {
  var NS = 'http://www.w3.org/2000/svg';
  var C = { q: '#0b7285', cl: '#7d7567', ink: '#1c1a17', muted: '#4f4a42', rule: '#e2dacb', paper: '#fbf8f1' };
  function el(n, a, p) { var e = document.createElementNS(NS, n); for (var q in a) if (a[q] != null) e.setAttribute(q, a[q]); if (p) p.appendChild(e); return e; }
  function line(g, pts, a) { a.d = 'M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L'); a.fill = 'none'; return el('path', a, g); }

  function qns(svg) {
    var x0 = 12, w = 216, y0 = 18, h = 104, span = 8, X = function (t) { return x0 + t / span * w; }, Y = function (v) { return y0 + h - (v - .15) / .75 * h; };
    var m = function (t) { return .55 + .28 * Math.sin(2 * Math.PI * t / span * .9 + .4); }, pts = [];
    for (var i = 0; i <= 120; i++) pts.push([X(i / 120 * span), Y(m(i / 120 * span))]);
    el('line', { x1: x0, y1: y0 + h, x2: x0 + w, y2: y0 + h, stroke: C.muted, 'stroke-width': 1 }, svg);
    line(svg, pts, { stroke: C.ink, 'stroke-width': 1.6 });
    var dyn = el('g', {}, svg), WS = [1 / 4, 1 / 2, 1, 2, 4], still = 2;
    function frame(f) {
      var bw = WS[f]; dyn.innerHTML = '';
      for (var a = 0; a < span - 1e-9; a += bw) {
        var e = Math.min(span, a + bw), v = m(a);
        el('line', { x1: X(a), y1: y0 + h + 6, x2: X(a), y2: y0 + h - 2, stroke: C.q, 'stroke-width': 1.2 }, dyn);
        el('rect', { x: X(a) + .7, y: Math.min(Y(v), Y(m(e))), width: Math.max(0, X(e) - X(a) - 1.4), height: Math.abs(Y(v) - Y(m(e))), fill: C.q, 'fill-opacity': .1 }, dyn);
        el('line', { x1: X(a) + .7, y1: Y(v), x2: X(e) - .7, y2: Y(v), stroke: C.q, 'stroke-width': 2.4 }, dyn);
      }
    }
    return { frame: frame, n: WS.length, still: still, step: 1000 };
  }

  function qrb(svg) {
    var x0 = 16, w = 212, y0 = 14, h = 110, lx0 = 2, lx1 = 6, n = 4;
    var X = function (T) { return x0 + (Math.log10(T) - lx0) / (lx1 - lx0) * w; }, Y = function (r) { return y0 + h - r / 2600 * h; };
    el('line', { x1: x0, y1: y0 + h, x2: x0 + w, y2: y0 + h, stroke: C.muted, 'stroke-width': 1 }, svg);
    el('line', { x1: x0, y1: y0, x2: x0, y2: y0 + h, stroke: C.muted, 'stroke-width': 1 }, svg);
    var cl = []; for (var i = 0; i <= 60; i++) { var T = Math.pow(10, lx0 + (lx1 - lx0) * i / 60), r = 1.2 * Math.sqrt(n * T); if (r <= 2600) cl.push([X(T), Y(r)]); }
    line(svg, cl, { stroke: C.cl, 'stroke-width': 2, 'stroke-dasharray': '5 3' });
    var band = el('path', { fill: C.q, 'fill-opacity': .16, 'class': 'th-qb' }, svg), lo = el('path', { fill: 'none', stroke: C.q, 'stroke-width': 1.4, 'class': 'th-qb' }, svg), up = el('path', { fill: 'none', stroke: C.q, 'stroke-width': 2.2, 'class': 'th-qb' }, svg);
    var SIG = [.25, .5, 1], still = 2;
    function frame(f) {
      var s = SIG[f], L = function (T) { return 22 * n * s * Math.log(T); }, U = function (T) { return 22 * n * (s + .35) * Math.log(T); }, a = [], b = [];
      for (var i = 0; i <= 30; i++) { var T = Math.pow(10, lx0 + (lx1 - lx0) * i / 30); a.push([X(T), Y(L(T))]); b.push([X(T), Y(U(T))]); }
      var d = function (p) { return p.map(function (q, i) { return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(' '); };
      lo.setAttribute('d', d(a)); up.setAttribute('d', d(b));
      band.setAttribute('d', d(b) + ' ' + d(a.slice().reverse()).replace(/^M/, 'L') + ' Z');
    }
    return { frame: frame, n: SIG.length, still: still, step: 1100 };
  }

    return { qns: qns, qrb: qrb };
  })();

  var MAKERS = { fmab: fmab, local: local, dyn: dyn, locality: locality, delay: delay, kata: kata, mal: T4.mal, prox: T4.prox, incl: T4.incl, ince: T4.ince, qns: T5.qns, qrb: T5.qrb };
  function init() {
    document.querySelectorAll('svg[data-thumb]').forEach(function (svg) {
      var A = MAKERS[svg.getAttribute('data-thumb')](svg), timer = null, k = 0;
      A.frame(A.still);
      var card = svg.closest('.paper, .card') || svg;
      function play() { if (timer || !motionOn()) return; k = 0; (function tick() { A.frame(k); k = (k + 1) % A.n; timer = setTimeout(tick, A.step || (k ? 620 : 1600)); })(); }
      function stop() { clearTimeout(timer); timer = null; A.frame(A.still); }
      card.addEventListener('mouseenter', play); card.addEventListener('mouseleave', stop);
      card.addEventListener('focusin', play); card.addEventListener('focusout', stop);
      svg.__thumb = { play: play, stop: stop };
    });
  }
  window.THUMBS = { init: init };
})();

THUMBS.init();
