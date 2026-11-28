/* Site behaviour: map tabs, the flickering graph, figures, the random fact, the news window,
   and the first-screen fit. Settings come from data-* attributes on <html> (see _config.yml). */
var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
function seeded(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

/* ---------- tabs: one panel at a time, chosen from the map ---------- */
var tiles = Array.prototype.slice.call(document.querySelectorAll('.tile'));
var panels = document.getElementById('panels');
function show(id, scroll) {
  tiles.forEach(function (t) { t.setAttribute('aria-selected', t.getAttribute('aria-controls') === id ? 'true' : 'false'); });
  document.querySelectorAll('.panel').forEach(function (p) { p.classList.toggle('on', p.id === id); });
  if (window.moveWalker) moveWalker(tiles.findIndex(function (t) { return t.getAttribute('aria-controls') === id; }));
  if (scroll) document.getElementById(id).scrollIntoView({ behavior: 'smooth', block: 'start' });
}
tiles.forEach(function (t) { t.addEventListener('click', function () { var id = t.getAttribute('aria-controls'); history.replaceState(null, '', '#' + id); show(id, false); }); });
function route(hash, scroll) {
  var id = hash.replace('#', ''); if (!id) return;
  var target = document.getElementById(id); if (!target) return;
  var panel = target.closest('.panel'); if (!panel) return;
  show(panel.id, false);
  if (scroll) setTimeout(function () { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30);
}
document.querySelectorAll('a[href^="#"]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); history.replaceState(null, '', a.getAttribute('href')); route(a.getAttribute('href'), true); }); });
if (location.hash) route(location.hash, true);
document.getElementById('show-all').addEventListener('click', function () {
  var all = panels.classList.toggle('all'); this.textContent = all ? 'Show one at a time' : 'Show all sections';
});

/* ---------- the map graph: a node above each tile, edges flicker ----------
   The learner obeys the model: it only moves along an edge that is on
   right now. To reach another section it walks a shortest path through
   the current graph, one hop at a time, and waits if no path exists. */
(function () {
  var svg = document.getElementById('map-graph'), lines = [], E = [], on = [], pos = [], walker, cur = 0, goal = 0, waitEl = null, busy = false;
  var sub = ['\u2081','\u2082','\u2083','\u2084','\u2085','\u2086','\u2087','\u2088'];
  function build() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var box = svg.getBoundingClientRect(); if (!box.width) return;
    var mode = document.documentElement.getAttribute('data-graph') || 'lattice';
    var H = box.height, low = H - 18, top = mode === 'medium' ? 22 : 24; /* the strip above stays free for the waiting note; the halo stays clear of the tiles */
    var sec = tiles.map(function (tl) { var r = tl.getBoundingClientRect(); return r.left - box.left + r.width / 2; }), n = sec.length;
    E = [];
    if (mode === 'lattice') {
      /* one node above each tile, and a row of smaller relay nodes between them: a triangular strip */
      pos = sec.map(function (x) { return [x, low]; });
      for (var j = 0; j + 1 < n; j++) pos.push([(sec[j] + sec[j + 1]) / 2, top]);
      for (var i = 0; i + 1 < n; i++) E.push([i, i + 1]);
      for (var j2 = 0; j2 + 1 < n; j2++) { var r = n + j2; E.push([r, j2]); E.push([r, j2 + 1]); if (j2 + 2 < n) E.push([r, r + 1]); }
    } else {
      pos = sec.map(function (x, i) { return [x, i % 2 ? top : low]; });
      for (var i2 = 0; i2 < n; i2++) { if (i2 + 1 < n) E.push([i2, i2 + 1]); if (i2 + 2 < n) E.push([i2, i2 + 2]); }
    }
    if (on.length !== E.length) on = E.map(function () { return Math.random() < 0.55; });
    if (cur >= pos.length) cur = goal < n ? goal : 0;
    lines = E.map(function (e, k) { return el('line', { x1: pos[e[0]][0], y1: pos[e[0]][1], x2: pos[e[1]][0], y2: pos[e[1]][1], 'class': 'edge' + (on[k] ? '' : ' off') }, svg); });
    for (var t = 0; t < n; t++) el('line', { x1: pos[t][0], y1: pos[t][1] + 6, x2: pos[t][0], y2: H, 'class': 'tick' }, svg);
    for (var q = n; q < pos.length; q++) el('circle', { cx: pos[q][0], cy: pos[q][1], r: 3.5, 'class': 'node relay' }, svg);
    for (var m = 0; m < n; m++) {
      el('circle', { cx: pos[m][0], cy: pos[m][1], r: 5, 'class': 'node' }, svg);
      var lb = mode === 'lattice' ? el('text', { x: pos[m][0] + 6, y: pos[m][1] + 13, 'class': 'lbl' }, svg) : el('text', { x: pos[m][0] + 7, y: pos[m][1] - 7, 'class': 'lbl' }, svg);
      lb.textContent = 'a' + sub[m];
    }
    waitEl = el('text', { x: box.width, y: 9, 'text-anchor': 'end', 'class': 'wait' }, svg);
    walker = el('g', { 'class': 'walker' }, svg); el('circle', { r: 9, 'class': 'halo' }, walker); el('circle', { r: 6 }, walker);
    place(cur);
  }
  function place(i) { walker.style.transform = 'translate(' + pos[i][0] + 'px,' + pos[i][1] + 'px)'; }
  function nbrs(u) { var n = []; E.forEach(function (e, k) { if (on[k]) { if (e[0] === u) n.push([e[1], k]); else if (e[1] === u) n.push([e[0], k]); } }); return n; }
  function path(a, b) {
    var prev = {}; prev[a] = null; var q = [a];
    while (q.length) { var u = q.shift(); if (u === b) break; nbrs(u).forEach(function (vk) { if (!(vk[0] in prev)) { prev[vk[0]] = [u, vk[1]]; q.push(vk[0]); } }); }
    if (!(b in prev)) return null;
    var steps = []; for (var v = b; prev[v]; v = prev[v][0]) steps.unshift([v, prev[v][1]]); return steps;
  }
  function walk() {
    if (busy || cur === goal || !walker) return;
    if (document.documentElement.getAttribute('data-walk') === 'jump') { cur = goal; place(cur); return; }
    var steps = path(cur, goal);
    if (!steps) { waitEl.textContent = 'no path yet, waiting for an edge to switch on'; return; }
    waitEl.textContent = ''; busy = true;
    (function hop(j) {
      if (j >= steps.length) { busy = false; return; }
      var s2 = steps[j], ln = lines[s2[1]]; ln.classList.add('trail');
      cur = s2[0]; place(cur);
      setTimeout(function () { ln.classList.remove('trail'); hop(j + 1); }, still ? 0 : 330);
    })(0);
  }
  window.moveWalker = function (i) { if (i < 0) return; goal = i; walk(); };
  window.rebuildMap = build;
  build(); window.addEventListener('resize', build);
  setInterval(function () {
    if (still) { walk(); return; }
    if (!busy) for (var k = 0; k < E.length; k++) { if (on[k] && Math.random() < 0.3) on[k] = false; else if (!on[k] && Math.random() < 0.25) on[k] = true; if (lines[k]) lines[k].setAttribute('class', 'edge' + (on[k] ? '' : ' off')); }
    walk();
  }, 1100);
})();

/* pulse peaks scale with distance, so far agents barely flicker */
document.querySelectorAll('.fd').forEach(function (c) { var o = parseFloat(getComputedStyle(c).getPropertyValue('--o')) || parseFloat(c.getAttribute('opacity')) || 1; c.style.setProperty('--p', Math.min(1, o * 1.6 + 0.15).toFixed(2)); });

/* ---------- play figures once as they come into view ---------- */
if (!still) {
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) {
    if (e.isIntersecting) { var t = e.target.closest('.paper, .theme-fig') || e.target; t.classList.add('playing'); io.unobserve(e.target); setTimeout(function () { t.classList.remove('playing'); }, 7000); }
  }); }, { threshold: 0.6 });
  document.querySelectorAll('.anim').forEach(function (s) { io.observe(s); });
}

/* ---------- research rail: mark the theme in view ---------- */
(function () {
  var links = {}; document.querySelectorAll('.rail > a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
  var obs = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { Object.values(links).forEach(function (a) { a.classList.remove('active'); }); links[e.target.id].classList.add('active'); } }); }, { rootMargin: '-25% 0px -65% 0px' });
  Object.keys(links).forEach(function (id) { obs.observe(document.getElementById(id)); });
})();

/* ---------- random fact: the list comes from _data/facts.yml ----------
   The slot sizes itself to the longest fact, so the page never jumps when the die is rolled.
   A fact with a sketch: field shows that drawing (from _includes/art/fact-sketches.html) beside it. */
(function () {
  var data = document.getElementById('facts-data'), f = document.getElementById('fact');
  if (!data || !f) return;
  var raw = JSON.parse(data.textContent);
  var facts = raw.map(function (x) { return x.text + (x.source ? ' <small>(' + x.source + ')</small>' : ''); });
  var i = 0, box = document.getElementById('fact-box'), btn = document.getElementById('next-fact');
  var use = document.getElementById('fact-sk-use'), sk = use ? use.parentNode : null;
  function sketch(k) {
    if (!sk) return;
    if (raw[k].sketch) { use.setAttribute('href', '#s-' + raw[k].sketch); sk.style.visibility = 'visible'; }
    else sk.style.visibility = 'hidden';
  }
  function fit() {
    var w = box.clientWidth - (sk ? sk.getBoundingClientRect().width + 10 : 0);
    var probe = box.cloneNode(false); probe.removeAttribute('id'); probe.style.cssText = 'position:absolute;visibility:hidden;min-height:0;display:block;width:' + w + 'px';
    box.parentNode.appendChild(probe); var h = 0;
    facts.forEach(function (x) { probe.innerHTML = x; h = Math.max(h, probe.offsetHeight); });
    probe.remove(); box.style.minHeight = Math.max(h, sk ? 44 : 0) + 'px';
  }
  btn.addEventListener('click', function () {
    var j = i; while (facts.length > 1 && j === i) j = Math.floor(Math.random() * facts.length); i = j;
    btn.classList.remove('rolling'); void btn.offsetWidth; btn.classList.add('rolling');
    f.classList.add('swap'); setTimeout(function () { f.innerHTML = facts[i]; sketch(i); f.classList.remove('swap'); }, still ? 0 : 180);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit); fit();
  window.addEventListener('resize', fit);
})();

/* ---------- news window: fade the bottom edge until the end is reached ---------- */
(function () {
  var sc = document.querySelector('.news-scroll'); if (!sc) return; var win = sc.parentNode;
  function edge() { win.classList.toggle('end', sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 2); if (sc.scrollTop > 8) win.parentNode.classList.add('moved'); }
  sc.addEventListener('scroll', edge); edge();
})();

/* ---------- first screen: spread the extra room so the rule under the map sits at the bottom ----------
   With a short window nothing is added. Two passes, because the room is shared out unevenly. */
(function () {
  var root = document.documentElement, MAX = 24, MIN = -3; /* a short window gives back a few pixels so the tiles still show */
  function ruleY() { return document.querySelector('.panels').getBoundingClientRect().top + window.scrollY; }
  function report() { var w = document.getElementById('winsize'); if (w) w.textContent = 'Your window: ' + window.innerWidth + ' x ' + window.innerHeight + '. Line under the map at ' + Math.round(ruleY()) + 'px.'; }
  function fit() {
    root.style.setProperty('--air', '0px');
    if (window.innerWidth >= 960 && root.getAttribute('data-air') !== 'off') {
      var y0 = ruleY(), free = window.innerHeight - 10 - y0;
      root.style.setProperty('--air', '10px'); var slope = (ruleY() - y0) / 10 || 5;
      var a = Math.max(MIN, Math.min(MAX, free / slope));
      root.style.setProperty('--air', a.toFixed(1) + 'px');
    }
    if (window.rebuildMap) rebuildMap();
    report();
  }
  window.fitFirstScreen = fit;
  var tmr; window.addEventListener('resize', function () { clearTimeout(tmr); tmr = setTimeout(fit, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit); window.addEventListener('load', fit); fit();
})();
