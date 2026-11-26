"""Influence of one agent on a network of agents, from the paper's bound
(A Unified Framework for Locality in Scalable MARL, L4DC 2026): H^pi = E^s + E^a Pi(pi), and for softmax
policies Pi_{k<-i} <= min(1, L_{k<-i} / (2 tau)). Example: E^s = 0.25 A / d, E^a = 0.5 A / d (a neighbour's state or
action moves your next state), L = A (each policy reads its neighbours' states), d = max degree.
Shade of agent j: N_{j<-i} = sum_t (H^t)_{j<-i} = ((I - H)^{-1})_{j<-i}, the weight with which agent j's reward enters
the bound on how much agent i's state can move the value (delta(h) <= (I - H^T)^{-1} delta(r)).
The animation shows partial sums over the first kappa rounds (t <= kappa).
The site uses the 'square' layout (7 x 5 grid, 4 neighbours); smooth policy rho(H) = 0.3, sharp policy rho(H) = 0.95."""
import numpy as np, json, math

def square():
    W, Hh = 7, 5; n = W * Hh; idx = lambda x, y: y * W + x
    pos = [[(u % W), (u // W)] for u in range(n)]
    E = [[idx(x, y), idx(x + dx, y + dy)] for y in range(Hh) for x in range(W) for dx, dy in ((1, 0), (0, 1)) if x + dx < W and y + dy < Hh]
    return pos, E, idx(3, 2), [abs(u % W - 3) + abs(u // W - 2) for u in range(n)]

def disc(R=4):
    pos, ring, E = [[0.0, 0.0]], [[0]], []
    for k in range(1, R + 1):
        m = 6 * k; ids = []
        for j in range(m):
            th = 2 * math.pi * j / m - math.pi / 2
            ids.append(len(pos)); pos.append([k * math.cos(th), k * math.sin(th)])
        ring.append(ids)
        for j in range(m): E.append([ids[j], ids[(j + 1) % m]])
    for k in range(R):          # link each node on ring k+1 to the nearest one or two nodes on ring k
        for v in ring[k + 1]:
            d = sorted(ring[k], key=lambda u: math.dist(pos[u], pos[v]))
            E.append([d[0], v])
            if len(d) > 1 and math.dist(pos[d[1]], pos[v]) < math.dist(pos[d[0]], pos[v]) * 1.25: E.append([d[1], v])
    E = [list(e) for e in {tuple(sorted(e)) for e in E}]
    hop = [0] + [k for k in range(1, R + 1) for _ in ring[k]]
    return pos, E, 0, hop

def analyse(pos, E, src, hop):
    n = len(pos); A = np.zeros((n, n))
    for u, v in E: A[u, v] = A[v, u] = 1
    d = A.sum(1).max(); es, ea = 0.25, 0.5
    Hof = lambda tau: es * A / d + (ea * A / d) @ np.minimum(1, A / (2 * tau))
    rho = lambda M: max(abs(np.linalg.eigvals(M)))
    def tau_for(t):
        lo, hi = 0.02, 100
        for _ in range(90):
            mid = (lo + hi) / 2
            if rho(Hof(mid)) > t: lo = mid
            else: hi = mid
        return hi
    cases = {}
    for name, target in (('smooth', 0.3), ('sharp', 0.95)):
        tau = tau_for(target); Hm = Hof(tau); e = np.zeros(n); e[src] = 1
        parts, cur, acc = [], e.copy(), np.zeros(n)
        for k in range(13): acc = acc + cur; parts.append(acc.tolist()); cur = Hm @ cur
        full = np.linalg.solve(np.eye(n) - Hm, e)
        rel = [float(max(full[u] for u in range(n) if hop[u] == h) / full[src]) for h in range(max(hop) + 1)]
        cases[name] = {'tau': round(tau, 3), 'rho': round(rho(Hm), 3), 'rowsum': round(float(Hm.sum(1).max()), 3), 'full': full.tolist(), 'parts': parts, 'rel': rel}
        print(f'  {name}: tau {tau:.3f}  rho {rho(Hm):.3f}  max row sum {Hm.sum(1).max():.3f}  max degree {int(d)}  influence by hop (share of self) ' + ' '.join(f'{r:.3f}' for r in rel))
    return {'pos': pos, 'edges': E, 'src': src, 'hop': hop, 'cases': cases}

out = analyse(*square())
json.dump(out, open('marl_model.json', 'w'))   # pasted into assets/js/fig-marl.js as M
