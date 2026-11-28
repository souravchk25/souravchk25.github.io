#!/usr/bin/env python3
"""Regenerate the colour themes (Science and Tufte) from the site's own colours.

Run from the site folder after changing or adding colours in the CSS, the figure scripts or the drawings:
    python3 _tools/make-themes.py

It writes two things:
  assets/css/themes.css   every rule in assets/css/site.css and assets/css/figures.css that has a hex colour,
                          restated for html[data-theme="science"] and html[data-theme="tufte"] with the colour mapped
  assets/js/theme.js      the MAPS table (each hex colour in the site and its Science and Tufte versions) and the
                          ENG palettes, which theme.js uses for colours the figure scripts blend on the fly

The warm palette is the one written in the CSS; it is never changed. Python 3, no packages needed.

How a colour is mapped (the same rules the mockups used):
  - the named surfaces and inks (paper, card, tint, rule, edge, ink, muted) and the theme colours map exactly;
  - other neutrals keep their lightness and take the theme's grey;
  - every other colour is tied to the nearest theme colour and keeps its place between that colour and
    white or black, so a pale fill stays a pale fill and a dark outline stays dark;
  - the Best Paper gold and the comic's skin, hair and clothes are kept as they are.
"""
import json, math, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
HEX = re.compile(r'#[0-9a-fA-F]{6}\b')

# ---------------------------------------------------------------- colour maths (OKLCH)
def lin(c): return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
def gam(c): return 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055
def rgb(h): h = h.lstrip('#'); return [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
def tohex(v): return '#' + ''.join('%02x' % max(0, min(255, round(c * 255))) for c in v)

def oklch(h):
    r, g, b = [lin(c) for c in rgb(h)]
    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l, m, s = [math.copysign(abs(x) ** (1 / 3), x) for x in (l, m, s)]
    L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s
    a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s
    bb = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
    return L, math.hypot(a, bb), math.degrees(math.atan2(bb, a)) % 360

def from_oklch(L, C, H):
    def conv(C):
        a, b = C * math.cos(math.radians(H)), C * math.sin(math.radians(H))
        l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
        m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
        s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
        return (4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
                -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
                -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)
    ok = lambda v: all(-1e-4 <= x <= 1.0001 for x in v)
    v = conv(C)
    if not ok(v):
        lo, hi = 0.0, C
        for _ in range(30):
            mid = (lo + hi) / 2
            lo, hi = (mid, hi) if ok(conv(mid)) else (lo, mid)
        v = conv(lo)
    return tohex([gam(max(0, min(1, x))) for x in v])

def rel_lum(h):
    r, g, b = [lin(c) for c in rgb(h)]
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def contrast(a, b):
    x, y = sorted([rel_lum(a), rel_lum(b)], reverse=True)
    return (x + 0.05) / (y + 0.05)

# ---------------------------------------------------------------- the palettes
# warm: the colours the CSS is written in
SURF = dict(paper='#fbf8f1', card='#fffdf8', tint='#f3ecdf', rule='#e2dacb', edge='#a39c8e', ink='#1c1a17', muted='#4f4a42')
BASES = dict(t1='#d97000', t2='#a0124b', t3='#2e7d1f', t4='#5b2bc4', t5='#0b7285', t6='#8a5a2b',
             accent='#c0632f', link='#002bd6', navy='#1f3d8f', say='#00936f', fun='#c4066b', red='#d33c2f', award='#a0124c')
GOLD = ['#ffe39a', '#6e3d00']   # the Best Paper highlight, the same in every theme
PROTECT = ['#ebc3a0', '#efc5a4', '#6b3d27', '#e4687a', '#1a1613', '#1d140f', '#24262c', '#2f3438', '#5a4e46', '#132a66']  # comic skin, hair, clothes
TEXT_ROLES = {'t1', 't2', 't3', 't4', 't5', 't6', 'accent', 'link', 'navy', 'say', 'fun', 'red', 'award'}

def readable(h, paper, need=3.0):
    """Darken a colour until it reads as text on the paper (the site sets text in theme colours)."""
    L, C, H = oklch(h)
    while contrast(h, paper) < need and L > 0.2:
        L -= 0.01
        h = from_oklch(L, C, H)
    return h

def palette(surf, bases, neutral):
    return dict(surf=surf, bases={k: readable(v, surf['paper']) if k in TEXT_ROLES else v for k, v in bases.items()}, neutral=neutral)

THEMES = {
    # the ggsci "aaas" palette, modelled on Science figures; white paper, pure greys
    'science': palette(dict(paper='#ffffff', card='#ffffff', tint='#f3f4f6', rule='#e1e4e8', edge='#9aa1a9', ink='#111111', muted='#4a4a4a'),
                       dict(t1='#ee0000', t2='#a20056', t3='#008b45', t4='#631879', t5='#008280', t6='#5f559b',
                            accent='#bb0021', link='#3b4992', navy='#3b4992', say='#008b45', fun='#a20056', red='#ee0000', award='#bb0021'), (0, 0.0)),
    # Tufte CSS paper and ink, every hue toned down
    'tufte': palette(dict(paper='#fffff8', card='#fffffb', tint='#f4f4ea', rule='#e2e2d6', edge='#a2a296', ink='#111111', muted='#4a4a44'),
                     dict(t1='#b5512b', t2='#8c2a3c', t3='#3f6e3a', t4='#53477f', t5='#2c6a70', t6='#76603f',
                          accent='#a33a2a', link='#1f4e79', navy='#24406e', say='#3f6e3a', fun='#8c2a3c', red='#a33a2a', award='#8c2a3c'), (100, 0.6)),
}

def nearest_base(c):
    best, bd = None, 9
    for k, b in BASES.items():
        Lb, Cb, Hb = oklch(b)
        dh = min(abs(c[2] - Hb), 360 - abs(c[2] - Hb)) / 180
        d = dh * 2.0 + abs(math.log((c[1] + 0.02) / (Cb + 0.02))) * 0.25
        if d < bd:
            best, bd = k, d
    return best

def map_colour(h, P):
    for k, v in SURF.items():
        if v == h:
            return P['surf'][k]
    for k, v in BASES.items():
        if v == h:
            return P['bases'][k]
    if h in GOLD or h in PROTECT:
        return h
    L, C, H = oklch(h)
    nh, nk = P['neutral']
    if C < 0.045:
        if L > 0.955:   # near-paper surfaces keep their place between the paper and white
            Lp, Lt = oklch(SURF['paper'])[0], oklch(P['surf']['paper'])[0]
            t = (L - Lp) / (1 - Lp) if L >= Lp else (L - Lp) / Lp
            L = Lt + t * ((1 - Lt) if t >= 0 else Lt)
        return from_oklch(L, C * nk, nh)
    k = nearest_base((L, C, H))
    Lb, Cb, Hb = oklch(BASES[k])
    Lt, Ct, Ht = oklch(P['bases'][k])
    L2 = Lt + (L - Lb) / (1 - Lb) * (1 - Lt) if L >= Lb else Lt - (Lb - L) / Lb * Lt
    C2 = C * (Ct / Cb) if Cb > 1e-6 else C
    H2 = Ht + (((H - Hb + 540) % 360) - 180) * 0.5
    return from_oklch(L2, C2, H2)

# ---------------------------------------------------------------- the site's colours
SKIP_DIRS = {'_site', '.git', 'vendor', 'node_modules', '.jekyll-cache', '.sass-cache', 'images', 'files', '_tools'}
SKIP_FILES = {'themes.css', 'theme.js', 'art.css'}

def site_colours():
    cols = set()
    for root, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for f in files:
            if f in SKIP_FILES or not f.endswith(('.html', '.js', '.css', '.md', '.yml', '.svg')):
                continue
            try:
                cols |= {h.lower() for h in HEX.findall(open(os.path.join(root, f), encoding='utf-8').read())}
            except UnicodeDecodeError:
                pass
    return sorted(cols)

# ---------------------------------------------------------------- themes.css
def css_overrides(css, name, P):
    """Rules with a hex colour, restated for one theme. The theme sits inside :where(), so an override has the
    specificity of the rule it replaces and wins only because themes.css loads later; the cascade between the
    original rules is kept. :root becomes html[data-theme=...], which outranks :root."""
    T = '[data-theme="%s"]' % name

    def scope(s):
        if s == ':root':
            return 'html' + T
        if re.match(r'html\b', s):
            return 'html:where(%s)%s' % (T, s[4:])
        return ':where(html%s) %s' % (T, s)

    def scan(text):
        res, pos = [], 0
        while True:
            o = text.find('{', pos)
            if o < 0:
                return res
            sel, depth, j = text[pos:o].strip(), 1, o + 1
            while depth and j < len(text):
                depth += {'{': 1, '}': -1}.get(text[j], 0)
                j += 1
            body = text[o + 1:j - 1]
            if sel.startswith(('@media', '@supports')):
                inner = scan(body)
                if inner:
                    res.append(sel + ' {\n' + '\n'.join('  ' + r for r in inner) + '\n}')
            elif not sel.startswith('@'):
                decls = []
                for d in body.split(';'):
                    if ':' in d and HEX.search(d):
                        prop, val = [x.strip() for x in d.split(':', 1)]
                        val = P['bases']['award'] if prop == '--award' else HEX.sub(lambda m: map_colour(m.group(0).lower(), P), val)
                        decls.append('%s: %s' % (prop, val))
                if decls:
                    res.append(', '.join(scope(x.strip()) for x in sel.split(',')) + ' { ' + '; '.join(decls) + '; }')
            pos = j
    return scan(re.sub(r'/\*.*?\*/', '', css, flags=re.S))

def main():
    css_dir, js = os.path.join(ROOT, 'assets', 'css'), os.path.join(ROOT, 'assets', 'js', 'theme.js')
    out = ['/* Colour themes, written by _tools/make-themes.py from site.css and figures.css. Do not edit by hand:',
           '   change the colour in site.css or figures.css and run python3 _tools/make-themes.py again.',
           '   The warm theme is the CSS as written; colours inside SVG are rewritten by assets/js/theme.js. */', '']
    for name, P in THEMES.items():
        for f in ('site.css', 'figures.css'):
            path = os.path.join(css_dir, f)
            if os.path.exists(path):
                out.append('/* ---- %s: from %s ---- */' % (name, f))
                out += css_overrides(open(path, encoding='utf-8').read(), name, P)
                out.append('')
    open(os.path.join(css_dir, 'themes.css'), 'w', encoding='utf-8').write('\n'.join(out))

    cols = site_colours()
    maps = {name: {h: m for h in cols for m in [map_colour(h, P)] if m != h} for name, P in THEMES.items()}
    eng = dict(src=dict(surf=SURF, bases=BASES), gold=GOLD, protect=PROTECT,
               themes={name: dict(surf=P['surf'], bases=P['bases'], neutral=list(P['neutral'])) for name, P in THEMES.items()})
    s = open(js, encoding='utf-8').read()
    s, n1 = re.subn(r'(?m)^  var MAPS = .*?;  /\* filled by _tools/make-themes.py \*/$',
                    lambda m: '  var MAPS = ' + json.dumps(maps, separators=(',', ':')) + ';  /* filled by _tools/make-themes.py */', s)
    s, n2 = re.subn(r'(?m)^  var ENG = .*?;   /\* filled by _tools/make-themes.py \*/$',
                    lambda m: '  var ENG = ' + json.dumps(eng, separators=(',', ':')) + ';   /* filled by _tools/make-themes.py */', s)
    if n1 != 1 or n2 != 1:
        sys.exit('theme.js: could not find the MAPS and ENG lines')
    open(js, 'w', encoding='utf-8').write(s)
    print('themes.css: %d rules per theme; theme.js: %d colors' % (sum(1 for x in out if x.startswith((':where', 'html'))) // len(THEMES), len(cols)))

if __name__ == '__main__':
    main()
