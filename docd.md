# SAC Paper Reading Companion
## "Scalable Reinforcement Learning for Multi-Agent Networked Systems"
### Qu, Wierman, Li (2019/2021)

---

## How to Use This Document

Read this alongside the paper. For each section, this companion tells you what the section is doing, what mathematical machinery is being used, what notational things to watch out for, and how it connects to what comes before and after.

**Suggested reading order:** Skim Sections 1-2.1 for context (15 min), then go deep on Sections 2.3, 3, 4. That is where all the math lives.

---

## Section 2.1 — The Model (Pages 4-7)

### What It Is Doing
Setting up the networked MDP. $n$ agents on graph $G$. Each agent $i$ has local state $s_i \in S_i$, local action $a_i \in A_i$. The key structural assumption is equation (1): the next state of agent $i$ only depends on its immediate neighbors $N_i$ and its own action. This is the locality assumption that makes everything tractable.

### Key Objects to Fix in Your Mind
- $N_i$: 1-hop neighborhood of $i$ (includes $i$ itself)
- $N_i^\kappa$: $\kappa$-hop neighborhood of $i$ — all agents within graph distance $\kappa$
- $N_i^{\kappa,-} = \mathcal{N} \setminus N_i^\kappa$: agents OUTSIDE the $\kappa$-hop neighborhood
- $f(\kappa) = \sup_i |N_i^\kappa|$: size of the largest $\kappa$-hop neighborhood in the network
- $\zeta^{\theta_i}_i(a_i|s_i)$: localized policy for agent $i$ — only depends on its OWN state $s_i$
- $\zeta^\theta(a|s) = \prod_{i=1}^n \zeta^{\theta_i}_i(a_i|s_i)$: joint policy — product structure because agents act independently
- $J(\theta)$: discounted global reward objective, equation (2)

### Notational Warning
The paper uses $z = (s,a)$ and $Z = S \times A$ as shorthand for state-action pairs throughout the proofs. When you see $z_{N_i^\kappa}$ it means $(s_{N_i^\kappa}, a_{N_i^\kappa})$ — the local state-action pair in the $\kappa$-hop neighborhood. This compact notation appears heavily in Section 4.

---

## Section 2.3 — Background RL (Page 7)

### What It Is Doing
Two things: defining the Q-function and stating the policy gradient theorem (Lemma 1).

### The Q-Function Decomposition
Equation (7) writes $Q^\theta(s,a) = \frac{1}{n}\sum_i Q^\theta_i(s,a)$ where $Q^\theta_i$ is the Q-function for agent $i$'s individual reward $r_i$. This decomposition is crucial — the algorithm works on each $Q^\theta_i$ separately. Both $Q^\theta$ and $Q^\theta_i$ depend on the FULL global state-action pair $(s,a)$ — this is why they are intractable.

### Lemma 1 — Policy Gradient Theorem
This is equation (8). The gradient of $J(\theta)$ equals an expectation of $Q^\theta(s,a) \cdot \nabla\log\zeta^\theta(a|s)$ over the discounted state visitation distribution $\pi^\theta$.

**Key identity used in proofs:** Since the joint policy factorizes as $\zeta^\theta(a|s) = \prod_i \zeta^{\theta_i}_i(a_i|s_i)$, we have:
$$\nabla_{\theta_i}\log\zeta^\theta(a|s) = \nabla_{\theta_i}\log\zeta^{\theta_i}_i(a_i|s_i)$$
All other agents' policies do not depend on $\theta_i$, so they drop out of the gradient. This is used repeatedly in proofs.

---

## Section 3.1 — Exponential Decay Property (Pages 8-9)

### What It Is Doing
This is the paper's core technical contribution. It establishes that $Q^\theta_i(s,a)$ barely depends on agents far from $i$ in the network.

### Definition 1 — The EDP
If you change the state-action pairs of agents OUTSIDE the $\kappa$-hop neighborhood of $i$ while keeping inside the same, $Q^\theta_i$ changes by at most $c\rho^{\kappa+1}$. The effect of far-away agents decays exponentially in their graph distance.

### Why It Is True — Lemma 2(a)
Physical argument: for a far-away agent $j$ at graph distance $d$ from $i$ to affect $r_i(s_i(t), a_i(t))$, its influence must propagate $d$ hops through the network, taking at least $d$ time steps. Each time step introduces a $\gamma$ discount.

**Proof structure:** Distributions $\pi_{t,i}$ and $\pi'_{t,i}$ (starting from different outside-neighborhood values) are IDENTICAL for $t \leq \kappa$ because the influence has not propagated yet. The local MDP transition structure (equation 1) ensures that agent $i$'s state at time $t$ only depends on initial conditions within its $t$-hop neighborhood. The sum therefore only starts from $t = \kappa+1$:
$$|Q^\pi_i(s,a) - Q^\pi_i(s',a')| \leq \sum_{t=\kappa+1}^\infty \gamma^t \bar{r} \cdot \text{TV}(\pi_{t,i},\pi'_{t,i}) \leq \sum_{t=\kappa+1}^\infty \gamma^t \bar{r} = \frac{\bar{r}}{1-\gamma}\gamma^{\kappa+1}$$

### Lemma 2(b) — Mixing Improves the Rate
If TV distance decays as $\mu^t$ (mixing rate), then $\text{TV}(\pi_{t,i},\pi'_{t,i}) \leq 2c_0\mu^t$ and the decay rate improves to $\rho = \gamma\mu < \gamma$. Faster mixing equals faster spatial decay.

### Lemma 3 — EDP Implies Truncated Q Is Good
**(a)** The truncated Q-function $\hat{Q}^\theta_i(s_{N_i^\kappa}, a_{N_i^\kappa})$ (equation 9) approximates $Q^\theta_i(s,a)$ with error at most $c\rho^{\kappa+1}$ uniformly over all $(s,a)$.

**(b)** Using this truncated Q in the policy gradient (equation 11) approximates the true $\nabla_{\theta_i}J(\theta)$ with error at most $\frac{cL_i}{1-\gamma}\rho^{\kappa+1}$.

**The $(1-\gamma)$ factor in (b):** Comes from the expectation over the state visitation distribution $d^\pi$. This is the first place the $(1-\gamma)$ denominator appears. Every subsequent $(1-\gamma)$ in the paper traces back here or to the approximate fixed point argument.

**Proof structure for (b):** For $j \in N_i^{\kappa,-}$ (agents outside $\kappa$-hop neighborhood of $i$), the term $\mathbb{E}[\nabla_{\theta_i}\log\zeta^{\theta_i}_i(a_i|s_i) \cdot \hat{Q}^\theta_j(s_{N_j^\kappa}, a_{N_j^\kappa})] = 0$. Why? Because $\hat{Q}^\theta_j$ does not depend on $a_i$ when $i \notin N_j^\kappa$, and $\sum_{a_i}\nabla_{\theta_i}\zeta^{\theta_i}_i(a_i|s_i) = \nabla_{\theta_i}1 = 0$. This is the same zero-sum argument used in the baseline trick.

---

## Section 3.2 — Algorithm 1 (SAC) Line by Line (Page 10)

### Overall Structure
Two nested loops. The outer loop (index $m$) runs $M$ times — actor updates. The inner loop (index $t$) runs $T$ times per outer iteration — critic updates. This is the two-timescale separation made explicit: critic converges before actor updates.

### Line 2 — Initialization of Each Outer Iteration
Sample initial state $s(0) \sim \pi_0$, take action from current policy $\theta(m)$. The policy is now FROZEN for the entire inner loop.

### Lines 6-8 — The Critic Update
This is a TD(0) update operating on the TRUNCATED state-action space $S_{N_i^\kappa} \times A_{N_i^\kappa}$ instead of the full space.

The update:
$$\hat{Q}^t_i(z_{N_i^\kappa}(t-1)) = (1-\alpha_{t-1})\hat{Q}^{t-1}_i(z_{N_i^\kappa}(t-1)) + \alpha_{t-1}[r_i(t-1) + \gamma\hat{Q}^{t-1}_i(z_{N_i^\kappa}(t))]$$

Only the entry for the visited local state-action pair is updated. All others stay the same (line 8).

**Step size:** $\alpha_t = h/(t+t_0)$ satisfies Robbins-Monro conditions (sum diverges, sum of squares converges). This is the FAST timescale.

**Key question for proof:** What fixed point does this converge to? Not $Q^\pi_i$ but $\hat{Q}^*_i$ (the truncated Bellman operator's fixed point). The gap is $c\rho^{\kappa+1}/(1-\gamma)$ by Lemma 6.

### Lines 10-11 — The Actor Gradient Estimate
$$\hat{g}_i(m) = \sum_{t=0}^T \gamma^t \frac{1}{n}\sum_{j\in N_i^\kappa}\hat{Q}^T_j(z_{N_j^\kappa}(t))\nabla_{\theta_i}\log\zeta^{\theta_i}_i(a_i(t)|s_i(t))$$

Three approximations compared to the ideal policy gradient:
1. Uses $\hat{Q}^T_j$ instead of true $Q^\theta_j$ — introduces error $e_1$
2. Uses only $\kappa$-hop neighbors instead of all agents — introduces error $e_3$
3. Uses a finite sampled trajectory instead of the expectation — introduces error $e_2$

### Line 12 — The Actor Update
$$\theta_i(m+1) = \theta_i(m) + \eta_m\hat{g}_i(m)$$

Step size $\eta_m = \eta/\sqrt{m+1}$ is the SLOW timescale. Does NOT satisfy RM2 intentionally — gives optimal $O(1/\sqrt{M})$ non-convex convergence rate.

---

## Section 3.3 — The Main Result (Theorem 4)

$$\frac{\sum_{m=0}^{M-1}\eta_m\|\nabla J(\theta(m))\|^2}{\sum_{m=0}^{M-1}\eta_m} \leq \underbrace{\frac{2\bar{r}}{\eta(1-\gamma)\sqrt{M+1}}}_{\to 0} + \underbrace{O\!\left(\sqrt{\frac{\log M}{M}}\right)}_{\to 0} + \underbrace{\frac{12L^2c\bar{r}}{(1-\gamma)^5}\rho^{\kappa+1}}_{\text{permanent bias floor}}$$

**Reading this:** Left side is the weighted average of squared gradient norms. First two terms vanish as $M\to\infty$. Last term is permanent — only reducible by increasing $\kappa$.

**The $(1-\gamma)^5$ denominator:** Each power comes from a separate bounding step — Q-function bound, approximate fixed point, policy gradient theorem, gradient bound propagation (times two). Count them in the proof.

**Condition (12) on $T$:** Choose $T$ large enough that the critic transient error is below the truncation bias floor. Running the critic longer after this point does not help.

---

## Section 4 — The Full Proof Pipeline

### Three-Layer Structure

**Layer 1 — Critic Analysis (Theorem 5, Section 4.1)**
Shows $\hat{Q}^T_i$ after $T$ TD steps is close to $Q^\pi_i$. Uses: TD as stochastic approximation (SA framework), Azuma-Hoeffding for shifted MDS noise, contraction operator for the truncated Bellman operator, approximate fixed point bound.

**Layer 2 — Error Decomposition (Section 4.2 setup)**
Writes $\hat{g}(m) = \nabla J(\theta(m)) + e_1(m) + e_2(m) + e_3(m)$. Bounds $e_1$ using Theorem 5, bounds $e_2$ using Azuma-Hoeffding (standard MDS this time), bounds $e_3$ using EDP directly.

**Layer 3 — Actor Analysis (Section 4.2 main)**
Uses descent lemma plus telescope sum to convert the gradient norm bound into equation (13).

---

## Section 4.1 — Proof of Theorem 5 (Critic Convergence)

### What Theorem 5 Says
$$\sup_z|Q^{\pi_{\theta(m)}}_i(z) - \hat{Q}^T_i(z_{N_i^\kappa})| \leq \frac{C_a}{\sqrt{T+t_0}} + \frac{C'_a}{T+t_0} + \frac{2c\rho^{\kappa+1}}{(1-\gamma)^2}$$
First two terms go to zero as $T\to\infty$. Last term is the permanent truncation bias floor.

### Step 1 — Rewrite TD Update in Linear Form (Equation 17)
$$\hat{Q}^t_i = \hat{Q}^{t-1}_i + \alpha_{t-1}[A_{z(t-1),z(t)}\hat{Q}^{t-1}_i + b_{z(t-1)}]$$
where $A_{z,z'} = e_{z_{N_i^\kappa}}[\gamma e^\top_{z'_{N_i^\kappa}} - e^\top_{z_{N_i^\kappa}}]$ and $b_z = e_{z_{N_i^\kappa}}r_i(z_i)$.

**Notation note:** $e_{z_{N_i^\kappa}}$ is the indicator vector in $\mathbb{R}^{Z_{N_i^\kappa}}$ — zeros everywhere except a 1 at position $z_{N_i^\kappa}$. Just bookkeeping to write TD as a matrix equation.

### Step 1 Continued — Split Into Expected Value Plus Noise (Equation 18)
$$\hat{Q}^t_i = \hat{Q}^{t-1}_i + \alpha_{t-1}[\bar{A}_{t-1}\hat{Q}^{t-1}_i + \bar{b}_{t-1}] + \alpha_{t-1}\epsilon_{t-1} + \alpha_{t-1}\phi_{t-1}$$

where $\bar{A}_{t-1} = \mathbb{E}[A_{t-1}|\mathcal{F}_{t-\tau}]$ and $\bar{b}_{t-1} = \mathbb{E}[b_{t-1}|\mathcal{F}_{t-\tau}]$.

**What $\epsilon_{t-1}$ is:** $(A_{t-1}-\bar{A}_{t-1})\hat{Q}^{t-\tau}_i + b_{t-1}-\bar{b}_{t-1}$. A $\tau$-shifted MDS — $\mathbb{E}[\epsilon_{t-1}|\mathcal{F}_{t-\tau}] = 0$ because $\hat{Q}^{t-\tau}_i$ is $\mathcal{F}_{t-\tau}$-measurable and the deviation $A_{t-1}-\bar{A}_{t-1}$ has zero conditional mean by definition.

**What $\phi_{t-1}$ is:** $(A_{t-1}-\bar{A}_{t-1})(\hat{Q}^{t-1}_i - \hat{Q}^{t-\tau}_i)$. A secondary noise term from the movement of $\hat{Q}$ over the last $\tau$ steps. Bounded deterministically since $\hat{Q}$ does not move much per step.

**Why $\tau$ shift:** The Markov chain needs $\tau$ steps to mix from any starting state. Conditioning on $\mathcal{F}_{t-\tau}$ (information from $\tau$ steps ago) gives zero conditional mean because the chain has mixed since then. Conditioning on $\mathcal{F}_{t-1}$ (one step ago) does not give zero mean because the chain has not mixed yet.

### Lemma 6 — The Expected Update Is a Contraction Toward an Approximate Fixed Point
The expected update term $\bar{A}_{t-1}\hat{Q}^{t-1}_i + \bar{b}_{t-1}$ equals $-D_{t-1}\hat{Q}^{t-1}_i + D_{t-1}g_{t-1}(\hat{Q}^{t-1}_i)$ where:

- $D_{t-1}$ is diagonal with entries equal to marginal visit probabilities of $z_{N_i^\kappa}$ under $d_{t-1}$. Lower bounded by $\sigma I$ from Assumption 3. This is the "restoring force" that drives convergence.
- $g_{t-1}$ is a $\gamma$-contraction in $\|\cdot\|_\infty$. This follows from the Bellman operator being a contraction composed with non-expansive projection operators.
- Fixed point $\hat{Q}^{*,t-1}_i$ of $g_{t-1}$ satisfies $\sup_z|\hat{Q}^{*,t-1}_i(z_{N_i^\kappa}) - Q^*_i(z)| \leq c\rho^{\kappa+1}/(1-\gamma)$ — the approximate fixed point bound. This is the contraction operator analysis applied: proxy fixed point differs from true fixed point by $\epsilon/(1-\gamma)$ where $\epsilon = c\rho^{\kappa+1}$ is the EDP bound.

**Lemma 17** (in Appendix C.1) proves Lemma 6 by explicitly constructing $g^d = \Pi^d \mathcal{T}^\pi \Phi$ where $\Pi^d$ is a projection onto the truncated space weighted by distribution $d$, and $\Phi$ maps truncated functions back to the full space. The contraction follows because $\Pi^d$, $\Phi$ are non-expansive and $\mathcal{T}^\pi$ is a $\gamma$-contraction.

### Lemma 7 — The Error Recursion
Unrolling equation (20) gives:
$$\xi_t \leq \tilde{\beta}_{\tau-1,t}\xi_\tau + \gamma\sup_{z_{N_i^\kappa}}\sum_{k=\tau}^{t-1}b_{k,t}(z_{N_i^\kappa})\xi_k + \frac{2c\rho^{\kappa+1}}{1-\gamma} + \|\sum_{k}\alpha_k\tilde{B}_{k,t}\epsilon_k\|_\infty + \|\sum_{k}\alpha_k\tilde{B}_{k,t}\phi_k\|_\infty$$

**Reading this recursion:**
- $\tilde{\beta}_{\tau-1,t}\xi_\tau$: initialization error decaying geometrically to zero
- $\gamma\sum b_{k,t}\xi_k$: contraction squeezing past errors (weighted sum with $\sum b_{k,t} \leq 1$)
- $2c\rho^{\kappa+1}/(1-\gamma)$: permanent truncation bias floor from approximate fixed point
- Last two terms: noise from $\epsilon_k$ (stochastic) and $\phi_k$ (deterministic) sequences

**Notation:** $b_{k,t}(z_{N_i^\kappa}) = \alpha_k\bar{d}_k(z_{N_i^\kappa})\prod_{\ell=k+1}^{t-1}(1-\alpha_\ell\bar{d}_\ell(z_{N_i^\kappa}))$ is the $z_{N_i^\kappa}$-th diagonal entry of $B_{k,t}$. The scalars $\beta_{k,t}$ and $\tilde{\beta}_{k,t}$ are upper bounds on the matrix entries.

### Step 2 — Bounding the Noise (Lemmas 8-11)

**Lemma 8:** Uniform bounds. $\|\hat{Q}^t_i\|_\infty \leq \bar{r}/(1-\gamma)$, $\|\epsilon_t\|_\infty \leq \bar{\ell} = 4\bar{r}/(1-\gamma)+2\bar{r}$, $\|\phi_t\|_\infty \leq 2\bar{\ell}\sum_{k=t-\tau+1}^{t-1}\alpha_k$.

**Lemma 9:** Properties of scalar weights $\beta_{k,t}$. Key: $\sum_k\beta^2_{k,t} \leq \frac{2h}{\sigma(t+t_0)}$ — squared weights sum to $O(1/t)$.

**Lemma 10:** Bounds the main stochastic noise $\|\sum_k\alpha_k\tilde{B}_{k,t}\epsilon_k\|_\infty$. Method: Azuma-Hoeffding for $\tau$-shifted MDS (Lemma 18 — split into $\tau$ interleaved subsequences, each a genuine MDS, apply Azuma-Hoeffding to each, union bound over $\tau$ subsequences) applied to each entry of $z_{N_i^\kappa}$, then another union bound over all $(SA)^{f(\kappa)}$ entries. The $f(\kappa)\log SA$ inside $C_a$ comes from this second union bound.

**Lemma 11:** Bounds $\phi_k$ noise deterministically. Uses Lemma 8(c) and Lemma 9(c). Result: $\leq C_\phi/(t+t_0)$.

### Step 3 — Induction to Get Theorem 5
Uses Lemma 12 (shows $\sum_{k=\tau}^{t-1}b_{k,t}(z_{N_i^\kappa})\frac{1}{(k+t_0)^\omega} \leq \frac{1}{\sqrt{\gamma}(t+t_0)^\omega}$ — the contraction squeezes the weighted sum) and mathematical induction on $t$ to show the total error matches Theorem 5's bound. The inductive step: assume bound holds for $k < t$, substitute into Lemma 7, apply Lemmas 10-12, verify the constants $C_a$ and $C'_a$ are large enough to close the induction.

---

## Section 4.2 — Proof of Theorem 4 (Actor Convergence)

### The Three Error Terms — Defined Precisely
$$e_1(m) = \hat{g}(m) - g(m) \quad \leftarrow \hat{Q}^{m,T} \neq Q^\pi \text{ (critic not converged)}$$
$$e_2(m) = g(m) - h(m) \quad \leftarrow \text{one trajectory instead of expectation (stochastic noise)}$$
$$e_3(m) = h(m) - \nabla J(\theta(m)) \quad \leftarrow \kappa\text{-hop truncation instead of full gradient}$$

where $g(m)$ uses the true $Q^\pi$ on the sampled trajectory, and $h(m)$ uses the true $Q^\pi$ but takes the full expectation.

### Bounding Each Error

**Lemma 14 — $e_1$ bound:** Theorem 5 gives $\sup_{m,i}\sup_z|Q^{\theta(m)}_i(z)-\hat{Q}^{m,T}_i(z_{N_i^\kappa})| \leq 4c\rho^{\kappa+1}/(1-\gamma)^2$ with high probability when $T$ satisfies condition (12). Multiply by gradient bound $L_i$: $\|e_1(m)\| \leq 4cL\rho^{\kappa+1}/(1-\gamma)^3$.

**Lemma 15 — $e_2$ bound:** $e_2(m)$ is a STANDARD MDS (no shift needed) because the trajectory in outer iteration $m$ is sampled fresh from $\pi_0$, independent of $\theta(m-1)$. So $\mathbb{E}[g(m)|\mathcal{G}_{m-1}] = h(m)$ and $\mathbb{E}[e_2(m)|\mathcal{G}_{m-1}] = 0$. Standard Azuma-Hoeffding applies to $\sum_m\eta_m\langle\nabla J(\theta(m)), e_2(m)\rangle$.

**Lemma 16 — $e_3$ bound:** Uses Lemma 3(b) directly. Same zero-sum argument for agents outside $N_i^\kappa$. $\|e_3(m)\| \leq 2Lc\rho^{\kappa+1}/(1-\gamma)$ almost surely.

### The Descent Lemma — Applied to the Actor
From $L_0$-smoothness of $\nabla J$ (Assumption 4), derived via fundamental theorem of calculus and Cauchy-Schwarz:
$$J(\theta(m+1)) \geq J(\theta(m)) + \eta_m\langle\nabla J(\theta(m)), \hat{g}(m)\rangle - \frac{L_0\eta_m^2}{2}\|\hat{g}(m)\|^2$$

Substitute $\hat{g}(m) = \nabla J + e_1 + e_2 + e_3$:
$$\langle\nabla J, \hat{g}\rangle = \|\nabla J\|^2 + \langle\nabla J, e_2\rangle + \langle\nabla J, e_1+e_3\rangle \geq \|\nabla J\|^2 + \langle\nabla J, e_2\rangle - \|\nabla J\|(\|e_1\|+\|e_3\|)$$

With $\eta_m \leq 1/(4L_0)$, the condition $\eta_m - 2L_0\eta_m^2 \geq \eta_m/2$ holds, giving:
$$J(\theta(m+1)) \geq J(\theta(m)) + \frac{\eta_m}{2}\|\nabla J(\theta(m))\|^2 + \eta_m\langle\nabla J, e_2\rangle - \eta_m\|\nabla J\|(\|e_1\|+\|e_3\|) - \frac{L_0\eta_m^2}{2}\|\hat{g}\|^2$$

### Telescope Sum
Sum from $m=0$ to $M-1$. Left side telescopes: $\sum_m[J(\theta(m+1))-J(\theta(m))] = J(\theta(M))-J(\theta(0)) \leq \bar{r}/(1-\gamma)$.

Rearrange to isolate $\sum_m\eta_m\|\nabla J\|^2$ on the left. Divide by $\sum_m\eta_m \geq \eta\sqrt{M}$.

Apply Lemmas 13, 14, 15, 16 to bound each error term. Result is equation (13) — Theorem 4.

---

## Key Constants — Where They Come From

| Constant | Origin |
|---|---|
| $C_a = \frac{6\bar{\ell}}{1-\sqrt{\gamma}}\sqrt{\frac{\tau h}{\sigma}}[\log\frac{2\tau T^2}{\delta} + f(\kappa)\log SA]$ | Azuma-Hoeffding on shifted MDS $\epsilon_k$ + union bound over $(SA)^{f(\kappa)}$ entries |
| $C'_a = \frac{2}{1-\sqrt{\gamma}}\max(\frac{16\bar{\ell}h\tau}{\sigma}, \frac{2\bar{r}}{1-\gamma}(\tau+t_0))$ | Deterministic bound on $\phi_k$ sequence |
| $c\rho^{\kappa+1}/(1-\gamma)$ | EDP bound + approximate fixed point amplification |
| $2c\rho^{\kappa+1}/(1-\gamma)^2$ | Above times extra $1/(1-\gamma)$ from Bellman fixed point analysis |
| $12L^2c\bar{r}\rho^{\kappa+1}/(1-\gamma)^5$ | Critic error times gradient bound times trajectory sum — five separate $1/(1-\gamma)$ factors |

---

## Notational Confusions to Watch For

1. **$Q^*_i$ vs $Q^{\pi_\theta}_i$:** In Section 4.1 the outer iteration index $m$ is suppressed. $Q^*_i$ means $Q^{\pi_{\theta(m)}}_i$ for the fixed policy of the current outer iteration.

2. **$\hat{Q}^{*,t-1}_i$ vs $\hat{Q}^{t-1}_i$:** Star means fixed point of $g_{t-1}$ — the best the truncated TD can achieve. Without star means the current iterate of TD.

3. **$d_{t-1}$ vs $\pi^\theta$:** $d_{t-1}$ is the distribution of $z(t-1)$ conditioned on $\mathcal{F}_{t-\tau}$ — random and time-varying, used in critic analysis. $\pi^\theta$ is the stationary distribution under policy $\theta$ — used in actor analysis.

4. **$B_{k,t}$ vs $\tilde{B}_{k,t}$:** $B_{k,t}$ includes the $D_k$ factor; $\tilde{B}_{k,t}$ does not. Scalars $\beta_{k,t}$ and $\tilde{\beta}_{k,t}$ are upper bounds on corresponding matrix entries.

5. **$f(\kappa)$:** Always means $\sup_i|N_i^\kappa|$ — the largest $\kappa$-hop neighborhood. Appears in the union bound for Lemma 10 because you bound over $(SA)^{f(\kappa)}$ local state-action pairs.

6. **$\bar{\ell} = 4\bar{r}/(1-\gamma) + 2\bar{r}$:** A constant bounding $\|\epsilon_t\|_\infty$ and $\|\phi_t\|_\infty$ (Lemma 8). Appears inside $C_a$ and $C'_a$.

7. **$\mathcal{G}_{m-1}$ vs $\mathcal{F}_{t-\tau}$:** $\mathcal{G}_{m-1}$ is the filtration for the outer loop (actor) — information from first $m-1$ outer iterations. $\mathcal{F}_{t-\tau}$ is the filtration for the inner loop (critic) — information from $\tau$ steps ago within the current inner loop.

---

## Reading Checklist

- [ ] Section 2.1: Fix the graph model and local transition structure
- [ ] Section 2.3: Verify Lemma 1 and Q-function decomposition equation (7)
- [ ] Definition 1: State EDP in your own words before reading the proof
- [ ] Lemma 2 proof (Appendix A): Follow the TV distance argument step by step
- [ ] Lemma 3 proof (Appendix B): Follow the zero-sum argument for outside-neighborhood agents
- [ ] Algorithm 1: Trace each line back to its conceptual role (two-timescale, truncated TD, approximate gradient)
- [ ] Theorem 5 statement: Identify the three terms and their origins before reading proof
- [ ] Lemma 6 statement: Recognize as the approximate fixed point result from Tool 3
- [ ] Lemma 7: Read the recursion as contraction plus noise plus bias floor
- [ ] Lemma 10: Identify the shifted MDS structure and the two union bound steps
- [ ] Theorem 4 statement: Read equation (13) term by term before reading proof
- [ ] Section 4.2 setup: Verify three error definitions match three approximations in Algorithm 1
- [ ] Lemmas 14, 15, 16: Check each against its corresponding tool
- [ ] Final assembly (pages 21-22): Follow the telescope sum to equation (13)
EOF