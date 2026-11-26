"""Data for Figure 4 (theme "Continuous, multi-agent, and incentivized bandits") and the Multi-Agent Lipschitz Bandits thumbnail.

Every collision drawn in the figure is computed here from the rule it illustrates:
  cell rule      agents whose points fall in the same cell collide   (Multi-Agent Lipschitz Bandits, AISTATS 2026)
  distance rule  agents whose points are at most rho apart collide   (Decentralized Lipschitz Bandits with Proximity Collisions)
Writes cont_model.json: field, sensors, radios, line, rules and pairs are pasted into assets/js/fig-cont.js as D;
line and split are pasted into assets/js/paper-thumbs.js as T4D.
"""
import json, math
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

out = {}

# ---------- a: the sensor scene (2D signal field, distance rule) ----------
def field(x, y):
    g = lambda cx, cy, s, h: h * np.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * s * s))
    return g(.27, .66, .13, .92) + g(.72, .33, .11, .78) + g(.78, .80, .085, .52) + .06
xs = np.linspace(0, 1, 241); X, Y = np.meshgrid(xs, xs); Z = field(X, Y)
levels = [.15, .3, .45, .6, .75, .9, 1.2]
cs = plt.contourf(X, Y, Z, levels=levels)
bands = []
for i, segs in enumerate(cs.allsegs):
    paths = []
    for seg in segs:
        if len(seg) < 3: continue
        step = max(1, len(seg) // 90)
        pts = seg[::step]
        paths.append('M' + ' L'.join('%.3f %.3f' % (p[0], 1 - p[1]) for p in pts) + ' Z')
    bands.append(paths)
plt.close('all')
out['field'] = {'levels': levels, 'bands': bands}

RHO_A = .17
# sensor positions over six rounds (they drift toward the strong parts of the field); round 6 is the still frame
R = [
    [(.12, .18), (.45, .12), (.50, .55), (.15, .88), (.86, .58)],
    [(.18, .30), (.55, .20), (.42, .62), (.20, .80), (.84, .70)],
    [(.22, .45), (.63, .28), (.36, .66), (.24, .74), (.80, .78)],
    [(.25, .56), (.68, .31), (.31, .65), (.26, .70), (.79, .80)],
    [(.27, .63), (.71, .33), (.44, .66), (.30, .64), (.78, .80)],
    [(.24, .66), (.72, .33), (.50, .62), (.32, .58), (.78, .80)],
]
def collided(P, rho):
    c = [False] * len(P)
    for i in range(len(P)):
        for j in range(len(P)):
            if i != j and math.dist(P[i], P[j]) <= rho: c[i] = True
    return c
rounds = []
for P in R:
    c = collided(P, RHO_A)
    rounds.append({'pos': P, 'col': c, 'val': [0 if c[k] else round(float(field(*P[k])), 3) for k in range(len(P))]})
assert rounds[-1]['col'] == [True, False, False, True, False], rounds[-1]['col']   # still frame: sensors 1 and 4 collide
assert any(any(r['col']) for r in rounds[:-1]) and not all(any(r['col']) for r in rounds)
out['sensors'] = {'rho': RHO_A, 'rounds': rounds}

# radio scene: channel quality along a frequency band, radios too close in frequency collide
def quality(f): return .08 + .85 * np.exp(-(f - .28) ** 2 / (2 * .07 ** 2)) + .6 * np.exp(-(f - .66) ** 2 / (2 * .09 ** 2))
RHO_R = .10
FR = [[.08, .40, .52, .80, .93], [.15, .36, .58, .74, .90], [.21, .31, .62, .70, .86], [.25, .30, .65, .68, .84], [.27, .33, .66, .59, .82], [.26, .36, .67, .55, .80]]
rr = []
for F in FR:
    c = [any(i != j and abs(F[i] - F[j]) <= RHO_R for j in range(len(F))) for i in range(len(F))]
    rr.append({'pos': F, 'col': c})
out['radios'] = {'rho': RHO_R, 'q': [[round(f, 3), round(float(quality(f)), 4)] for f in np.linspace(0, 1, 121)], 'rounds': rr}

# ---------- the line: one Lipschitz reward, three peaks ----------
PEAKS = [(.30, 1.0), (.37, .95), (.78, .60)]   # a, b, c (narrow: a and b are well inside rho of each other)
W, FLOOR, RHO = .10, .05, .12
def mu(x): return max(FLOOR, max(h * (1 - abs(x - p) / W) for p, h in PEAKS))
L = max(h / W for _, h in PEAKS)
out['line'] = {'peaks': PEAKS, 'w': W, 'floor': FLOOR, 'rho': RHO, 'L': round(L, 3)}
# panel b: four agents; the two rules catch different pairs
K = 6
cell = lambda x: min(K - 1, int(x * K))
AG = [.27, .37, .69, .82]
col_cell = [any(i != j and cell(AG[i]) == cell(AG[j]) for j in range(4)) for i in range(4)]
col_dist = [any(i != j and abs(AG[i] - AG[j]) <= RHO for j in range(4)) for i in range(4)]
assert col_cell == [False, False, True, True] and col_dist == [True, True, False, False]
out['rules'] = {'K': K, 'agents': AG, 'mu': [round(mu(x), 3) for x in AG], 'colCell': col_cell, 'colDist': col_dist}
# panel c: two agents, distance rule; the best legal pair is a + c
pa, pb, pc = [p for p, _ in PEAKS]
assert abs(pa - pb) <= RHO < abs(pb - pc) and abs(pa - pc) > RHO
pairs = [('a', 'b', 0.0), ('b', 'c', .95 + .6), ('a', 'c', 1.0 + .6)]
assert max(pairs, key=lambda q: q[2])[:2] == ('a', 'c')
# no legal pair of points anywhere beats a + c (check on a fine grid)
g = np.linspace(0, 1, 2001); m = np.array([mu(x) for x in g]); best = 0
for i in range(0, len(g), 4):
    far = np.abs(g - g[i]) > RHO
    best = max(best, m[i] + m[far].max())
assert abs(best - 1.6) < 1e-9, best
out['pairs'] = pairs

# ---------- the cell rule, coordinate once then learn alone (the Multi-Agent Lipschitz Bandits thumbnail) ----------
rng = np.random.default_rng(7)
N2 = 3
cells = [(k / K, (k + 1) / K) for k in range(K)]
centre = [(a + b) / 2 for a, b in cells]
sup = [max(mu(x) for x in np.linspace(a, b, 400)) for a, b in cells]
probe = []
for t in range(4):
    while True:
        pick = rng.integers(0, K, N2).tolist()
        if t != 1 or len(set(pick)) < N2: break      # keep one probe round with a collision visible
    c = [pick.count(pick[j]) > 1 for j in range(N2)]
    probe.append({'cell': pick, 'col': c})
assert any(any(p['col']) for p in probe)
top = sorted(range(K), key=lambda k: -sup[k])[:N2]
assert sorted(top) == [1, 2, 4], (top, sup)
# centre vs maximum: the cell holding the highest peak has a dull centre (the reason for the peek)
assert mu(centre[1]) < .7 and sup[1] > .99, (mu(centre[1]), sup[1])
peek = {k: [round(cells[k][0] + (i + .5) * (1 / K) / 6, 4) for i in range(6)] for k in [1, 2, 4, 5]}
# musical chairs on the agreed cells: round 1 has a collision, everyone is seated after round 2
targets = sorted(top)
for seed in range(200):      # first seed whose first round has a collision and that seats everyone within 3 rounds
    crng = np.random.default_rng(seed); seat = [None] * N2; chairs = []
    for t in range(3):
        pick = [seat[j] if seat[j] is not None else int(crng.choice(targets)) for j in range(N2)]
        free = [j for j in range(N2) if seat[j] is None]
        for j in free:
            if pick.count(pick[j]) == 1: seat[j] = pick[j]
        chairs.append({'pick': pick, 'seated': [s is not None for s in seat]})
        if all(s is not None for s in seat): break
    if len(chairs) >= 2 and not all(chairs[0]['seated']) and all(chairs[-1]['seated']): break
assert len(chairs) >= 2 and not all(chairs[0]['seated']) and all(chairs[-1]['seated'])
# learn alone: each agent refines its own cell toward the cell's maximum (zooming-like halving)
learn = []
for j in range(N2):
    a, b = cells[seat[j]]; xm = max(np.linspace(a, b, 400), key=mu); ivs = []
    lo, hi = a, b
    for d in range(4):
        mid = (lo + hi) / 2
        ivs.append([round(lo, 4), round(hi, 4)])
        if xm < mid: hi = mid
        else: lo = mid
    learn.append({'cell': seat[j], 'ivs': ivs, 'peak': round(float(xm), 4)})
out['split'] = {'cells': cells, 'sup': [round(s, 3) for s in sup], 'probe': probe, 'top': targets, 'peek': peek, 'chairs': chairs, 'learn': learn}

json.dump(out, open('cont_model.json', 'w'))
print('ok', {k: len(json.dumps(v)) for k, v in out.items()})
