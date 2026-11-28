/* Colour themes: warm (the default, the colours written in the CSS and the figure scripts), Science and Tufte.
   Loaded in <head> without defer, so the theme is set before the page is drawn.

   How it works:
   - html[data-theme] picks the CSS overrides in assets/css/themes.css (page colours, boxes, text).
   - SVG colours (drawings, figures, thumbnails, the comic) are written as hex in markup and in the figure
     scripts. This file rewrites them: every fill, stroke, stop-color, flood-color, color and style value
     that holds a hex colour is mapped to the theme, whether it is in the page markup or set later by a
     script through setAttribute. The original is kept in data-c-<attribute>, so switching back is exact.
   - Colours the scripts blend on the fly (mix(a, b, t)) are not in the table below; they go through
     the same palette engine that made the table (neutrals keep their lightness, chromatic colours keep
     their place between their base colour and white or black).
   - The choice is kept in localStorage ('site-theme'); the switch is the row of dots beside the hands.

   MAPS (a table of the site's own colours) and ENG (the palettes) are written by _tools/make-themes.py.
   Run it again after adding colours to the CSS or the figures: python3 _tools/make-themes.py */
(function () {
  var KEY = 'site-theme', NAMES = ['warm', 'science', 'tufte'];
  var MAPS = {"science":{"#002bd6":"#3b4992","#00819b":"#009090","#00936f":"#008b45","#0b7285":"#008280","#1c1a17":"#111111","#1f3d8f":"#3b4992","#2b5f9e":"#4f66a2","#2e7d1f":"#008b45","#3b2a10":"#2d2444","#3d3934":"#3a3a3a","#3f9b54":"#36a56a","#4a4540":"#464646","#4f4a42":"#4a4a4a","#5b2bc4":"#631879","#5c6b7a":"#696969","#5f584d":"#595959","#6fa65f":"#63b177","#7d6a5a":"#6e6e6e","#7d7466":"#757575","#7d7567":"#767676","#8a5a2b":"#5f559b","#8a8274":"#838383","#a0124b":"#a20056","#a39c8e":"#9aa1a9","#a69d8e":"#9e9e9e","#a8d09a":"#a0d7ab","#b35d00":"#c50900","#b9b0a1":"#b1b1b1","#c0632f":"#bb0021","#c4066b":"#a20056","#cfc6b4":"#c7c7c7","#d33c2f":"#ee0000","#d5ecf0":"#e7e7e7","#d6ccb9":"#cdcdcd","#d8eef2":"#e9e9e9","#d97000":"#ee0000","#d9cfe9":"#d4d4d4","#e2dacb":"#e1e4e8","#e2f0da":"#ebebeb","#e3e9fb":"#e9e9e9","#e4a13b":"#b29aff","#e6ddcc":"#dedede","#e7dccb":"#dddddd","#e9e1fa":"#e6e6e6","#e9e2d4":"#e3e3e3","#eef2f1":"#f8f8f8","#efe6d4":"#e7e7e7","#efe7d7":"#e8e8e8","#f0c48c":"#ccc0ff","#f2e6d8":"#e8e8e8","#f2ebdf":"#ececec","#f3ecdf":"#f3f4f6","#f5efe5":"#f0f0f0","#f8dde6":"#e5e5e5","#fbecd8":"#eeeeee","#fbf6ec":"#fdfdfd","#fbf8f1":"#ffffff","#fcebd3":"#ededed","#fffdf8":"#ffffff"},"tufte":{"#002bd6":"#1f4e79","#00819b":"#307a82","#00936f":"#3f6e3a","#0b7285":"#2c6a70","#1c1a17":"#111111","#1f3d8f":"#24406e","#2b5f9e":"#3e5c82","#2e7d1f":"#3f6e3a","#3b2a10":"#332b1b","#3d3934":"#3a3a36","#3f9b54":"#5b8c5e","#4a4540":"#474642","#4f4a42":"#4a4a44","#5b2bc4":"#53477f","#5c6b7a":"#6b6a5e","#5f584d":"#5a5952","#6fa65f":"#769a70","#7d6a5a":"#716f61","#7d7466":"#77766c","#7d7567":"#78766d","#8a5a2b":"#76603f","#8a8274":"#85837a","#a0124b":"#8c2a3c","#a39c8e":"#a2a296","#a69d8e":"#a09f95","#a8d09a":"#acc8a7","#b35d00":"#954322","#b9b0a1":"#b3b2a8","#c0632f":"#a33a2a","#c4066b":"#8c2a3c","#cfc6b4":"#c9c7bc","#d33c2f":"#a33a2a","#d5ecf0":"#e9e7dc","#d6ccb9":"#cfcec1","#d8eef2":"#ebeadf","#d97000":"#b5512b","#d9cfe9":"#d7d5c5","#e2dacb":"#e2e2d6","#e2f0da":"#edebdd","#e3e9fb":"#eceadf","#e4a13b":"#caaa6d","#e6ddcc":"#e0ded3","#e7dccb":"#e0ded3","#e9e1fa":"#e9e6d7","#e9e2d4":"#e4e3da","#eef2f1":"#f7f7f5","#efe6d4":"#e9e7dc","#efe7d7":"#eae8de","#f0c48c":"#dec9a3","#f2e6d8":"#eae8de","#f2ebdf":"#edece4","#f3ecdf":"#f4f4ea","#f5efe5":"#f1f0e9","#f8dde6":"#e8e6d8","#fbecd8":"#f1efe1","#fbf6ec":"#fefdf6","#fbf8f1":"#fffff8","#fcebd3":"#f1eede","#fffdf8":"#fffffb"}};  /* filled by _tools/make-themes.py */
  var ENG = {"src":{"surf":{"paper":"#fbf8f1","card":"#fffdf8","tint":"#f3ecdf","rule":"#e2dacb","edge":"#a39c8e","ink":"#1c1a17","muted":"#4f4a42"},"bases":{"t1":"#d97000","t2":"#a0124b","t3":"#2e7d1f","t4":"#5b2bc4","t5":"#0b7285","t6":"#8a5a2b","accent":"#c0632f","link":"#002bd6","navy":"#1f3d8f","say":"#00936f","fun":"#c4066b","red":"#d33c2f","award":"#a0124c"}},"gold":["#ffe39a","#6e3d00"],"protect":["#ebc3a0","#efc5a4","#6b3d27","#e4687a","#1a1613","#1d140f","#24262c","#2f3438","#5a4e46","#132a66"],"themes":{"science":{"surf":{"paper":"#ffffff","card":"#ffffff","tint":"#f3f4f6","rule":"#e1e4e8","edge":"#9aa1a9","ink":"#111111","muted":"#4a4a4a"},"bases":{"t1":"#ee0000","t2":"#a20056","t3":"#008b45","t4":"#631879","t5":"#008280","t6":"#5f559b","accent":"#bb0021","link":"#3b4992","navy":"#3b4992","say":"#008b45","fun":"#a20056","red":"#ee0000","award":"#bb0021"},"neutral":[0,0.0]},"tufte":{"surf":{"paper":"#fffff8","card":"#fffffb","tint":"#f4f4ea","rule":"#e2e2d6","edge":"#a2a296","ink":"#111111","muted":"#4a4a44"},"bases":{"t1":"#b5512b","t2":"#8c2a3c","t3":"#3f6e3a","t4":"#53477f","t5":"#2c6a70","t6":"#76603f","accent":"#a33a2a","link":"#1f4e79","navy":"#24406e","say":"#3f6e3a","fun":"#8c2a3c","red":"#a33a2a","award":"#8c2a3c"},"neutral":[100,0.6]}}};   /* filled by _tools/make-themes.py */
  var root = document.documentElement, theme = 'warm';
  try { var saved = localStorage.getItem(KEY); if (NAMES.indexOf(saved) >= 0) theme = saved; } catch (e) {}
  root.setAttribute('data-theme', theme);

  /* ---------- the palette engine (a port of palettes.py) ---------- */
  function lin(c) { return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function gam(c) { return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; }
  function oklch(h) {
    var r = lin(parseInt(h.substr(1, 2), 16) / 255), g = lin(parseInt(h.substr(3, 2), 16) / 255), b = lin(parseInt(h.substr(5, 2), 16) / 255);
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b),
        m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b),
        s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    var L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
        A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
        B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
    return [L, Math.sqrt(A * A + B * B), ((Math.atan2(B, A) * 180 / Math.PI) + 360) % 360];
  }
  function conv(L, C, H) {
    var a = C * Math.cos(H * Math.PI / 180), b = C * Math.sin(H * Math.PI / 180);
    var l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3), m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3), s = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3);
    return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
  }
  function inGamut(v) { return v.every(function (x) { return x >= -1e-4 && x <= 1.0001; }); }
  function hex(v) { return '#' + v.map(function (x) { var c = Math.round(Math.max(0, Math.min(1, gam(Math.max(0, Math.min(1, x))))) * 255); return (c < 16 ? '0' : '') + c.toString(16); }).join(''); }
  function fromOklch(L, C, H) {
    var v = conv(L, C, H); if (inGamut(v)) return hex(v);
    var lo = 0, hi = C; for (var k = 0; k < 30; k++) { var mid = (lo + hi) / 2; if (inGamut(conv(L, mid, H))) lo = mid; else hi = mid; }
    return hex(conv(L, lo, H));
  }
  var SRC = {}; ['surf', 'bases'].forEach(function (g) { for (var k in ENG.src[g]) SRC[k] = oklch(ENG.src[g][k]); });
  function nearest(c) {
    var best = null, bd = 9;
    for (var k in ENG.src.bases) {
      var b = SRC[k], dh = Math.min(Math.abs(c[2] - b[2]), 360 - Math.abs(c[2] - b[2])) / 180;
      var d = dh * 2 + Math.abs(Math.log((c[1] + 0.02) / (b[1] + 0.02))) * 0.25;
      if (d < bd) { best = k; bd = d; }
    }
    return best;
  }
  var cache = {};
  function compute(h, th) {
    var P = ENG.themes[th];
    if (ENG.gold.indexOf(h) >= 0 || ENG.protect.indexOf(h) >= 0) return h;
    for (var g in { surf: 1, bases: 1 }) for (var k in ENG.src[g]) if (ENG.src[g][k] === h) return P[g][k];
    var c = oklch(h), L = c[0], C = c[1], H = c[2];
    if (C < 0.045) {
      if (L > 0.955) {
        var Lp = SRC.paper[0], Lt = oklch(P.surf.paper)[0], t = L >= Lp ? (L - Lp) / (1 - Lp) : (L - Lp) / Lp;
        L = Lt + t * (t >= 0 ? 1 - Lt : Lt);
      }
      return fromOklch(L, C * P.neutral[1], P.neutral[0]);
    }
    var k2 = nearest(c), b = SRC[k2], tg = oklch(P.bases[k2]), L2;
    L2 = L >= b[0] ? tg[0] + (L - b[0]) / (1 - b[0]) * (1 - tg[0]) : tg[0] - (b[0] - L) / b[0] * tg[0];
    var C2 = b[1] > 1e-6 ? C * tg[1] / b[1] : C, H2 = tg[2] + (((H - b[2] + 540) % 360) - 180) * 0.5;
    return fromOklch(L2, C2, H2);
  }
  function mapHex(h, th) {
    h = h.toLowerCase();
    var m = MAPS[th]; if (m[h]) return m[h];
    var key = th + h; if (!(key in cache)) cache[key] = compute(h, th);
    return cache[key];
  }
  function rgbHex(r, g, b) { return '#' + [r, g, b].map(function (x) { x = Math.round(+x); return (x < 16 ? '0' : '') + x.toString(16); }).join(''); }
  var HEXRX = /#[0-9a-fA-F]{6}\b/g, RGBRX = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g, HAS = /#[0-9a-fA-F]{6}\b|rgb\(/;
  function mapStr(s, th) {
    if (th === 'warm') return s;
    return s.replace(HEXRX, function (h) { return mapHex(h, th); })
            .replace(RGBRX, function (_, r, g, b) { return mapHex(rgbHex(r, g, b), th); });
  }

  /* ---------- rewriting SVG and inline colours ---------- */
  var ATTR = { fill: 1, stroke: 1, 'stop-color': 1, 'flood-color': 1, color: 1, style: 1 };
  var LIST = ['fill', 'stroke', 'stop-color', 'flood-color', 'color', 'style'];
  var SEL = '[fill],[stroke],[stop-color],[flood-color],[color],[style]';
  var set = Element.prototype.setAttribute;

  /* style values: map only the declarations that held a colour originally, so a later el.style.opacity = ... survives */
  function styleDecls(s) {
    var o = {}; s.split(';').forEach(function (d) { var i = d.indexOf(':'); if (i > 0 && HAS.test(d)) o[d.slice(0, i).trim().toLowerCase()] = d.slice(i + 1).trim(); });
    return o;
  }
  function plain(s) { return s.split(';').filter(function (d) { return d.trim() && !HAS.test(d); }).map(function (d) { return d.replace(/\s+/g, ''); }).sort().join(';'); }
  function styleFor(cur, orig, th) {
    if (th === 'warm' && plain(cur) === plain(orig)) return orig;
    var o = styleDecls(orig), seen = {};
    var out = cur.split(';').map(function (d) {
      var i = d.indexOf(':'); if (i < 0) return d;
      var p = d.slice(0, i).trim(), k = p.toLowerCase();
      if (!(k in o)) return d;
      seen[k] = 1; return p + ': ' + mapStr(o[k], th);
    }).filter(function (d) { return d.trim(); });
    for (var k in o) if (!seen[k]) out.push(k + ': ' + mapStr(o[k], th));
    return out.join('; ');
  }

  Element.prototype.setAttribute = function (n, v) {
    if (ATTR[n] === 1 && typeof v === 'string') {
      if (theme !== 'warm' && HAS.test(v)) {
        set.call(this, 'data-c-' + n, v);
        this.__th = theme;
        return set.call(this, n, n === 'style' ? styleFor(v, v, theme) : mapStr(v, theme));
      }
      if (this.hasAttribute('data-c-' + n)) this.removeAttribute('data-c-' + n);
    }
    return set.call(this, n, v);
  };

  function fix(e, th) {
    for (var i = 0; i < LIST.length; i++) {
      var a = LIST[i], cur = e.getAttribute(a); if (cur == null) continue;
      var o = e.getAttribute('data-c-' + a);
      if (o == null) {
        if (th === 'warm' || !HAS.test(cur)) continue;
        o = cur; set.call(e, 'data-c-' + a, cur);
      }
      set.call(e, a, a === 'style' ? styleFor(cur, o, th) : mapStr(o, th));
    }
    e.__th = th;
  }
  function pass(node, th) {
    if (!node || node.nodeType !== 1) return;
    if (node.matches(SEL)) fix(node, th);
    var all = node.querySelectorAll(SEL);
    for (var i = 0; i < all.length; i++) fix(all[i], th);
  }

  /* markup added while the page loads, and later by scripts through innerHTML or MathJax, gets the theme too */
  new MutationObserver(function (recs) {
    if (theme === 'warm') return;
    for (var i = 0; i < recs.length; i++) {
      var add = recs[i].addedNodes;
      for (var j = 0; j < add.length; j++) { var n = add[j]; if (n.nodeType === 1 && n.__th !== theme) pass(n, theme); }
    }
  }).observe(root, { childList: true, subtree: true });

  /* ---------- the switch ---------- */
  function mark() {
    var bs = document.querySelectorAll('[data-theme-pick]');
    for (var i = 0; i < bs.length; i++) bs[i].setAttribute('aria-pressed', bs[i].getAttribute('data-theme-pick') === theme ? 'true' : 'false');
  }
  function apply(th) {
    if (NAMES.indexOf(th) < 0 || th === theme) return;
    theme = th; root.setAttribute('data-theme', th);
    try { localStorage.setItem(KEY, th); } catch (e) {}
    pass(document.body, th); mark();
    try { document.dispatchEvent(new CustomEvent('themechange', { detail: th })); } catch (e) {}
  }
  window.siteTheme = { get: function () { return theme; }, set: apply, map: function (h) { return mapStr(h, theme); } };
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('[data-theme-pick]');
    if (b) apply(b.getAttribute('data-theme-pick'));
  });
  document.addEventListener('DOMContentLoaded', function () {
    if (theme !== 'warm') pass(document.body, theme);
    mark();
    if (window.MathJax && MathJax.startup && MathJax.startup.promise) MathJax.startup.promise.then(function () { if (theme !== 'warm') pass(document.body, theme); });
  });
})();
