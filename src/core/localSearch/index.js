// ─── Local Search Algorithm Index ────────────────────────────────────────────
// Bản đồ nhiệt: grid 2D mảng số thực [0,1] thể hiện "độ cao" (fitness)
// Mục tiêu: tìm ô có giá trị CAO NHẤT (maximization)
// Mỗi thuật toán trả về mảng steps để AnimationEngine phát

function key(r, c) { return `${r},${c}`; }
function parseKey(k) { const [r, c] = k.split(',').map(Number); return { r, c }; }

// 4 láng giềng (không diagonal)
function getNeighbors4(r, c, rows, cols) {
  return [[-1,0],[1,0],[0,-1],[0,1]]
    .map(([dr, dc]) => ({ r: r+dr, c: c+dc }))
    .filter(n => n.r >= 0 && n.r < rows && n.c >= 0 && n.c < cols);
}

// 8 láng giềng (có diagonal)
function getNeighbors8(r, c, rows, cols) {
  const result = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (dr === 0 && dc === 0) continue;
    const nr = r+dr, nc = c+dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) result.push({ r: nr, c: nc });
  }
  return result;
}

// ─── Sinh bản đồ nhiệt ngẫu nhiên (Perlin-like noise bằng interpolation) ─────
export function generateHeatmap(rows, cols, seed = Math.random()) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));

  // Tạo các "peak" ngẫu nhiên rồi smooth bằng Gaussian blur
  const numPeaks = Math.floor(3 + seed * 7);
  const peaks = [];
  let rng = seed;
  const rand = () => { rng = (rng * 9301 + 49297) % 233280; return rng / 233280; };

  for (let i = 0; i < numPeaks; i++) {
    peaks.push({
      r: Math.floor(rand() * rows),
      c: Math.floor(rand() * cols),
      strength: 0.4 + rand() * 0.6,
      sigma: 2 + rand() * 4,
    });
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let val = 0.05 + rand() * 0.1; // background noise
      for (const p of peaks) {
        const d2 = (r - p.r)**2 + (c - p.c)**2;
        val += p.strength * Math.exp(-d2 / (2 * p.sigma**2));
      }
      grid[r][c] = Math.min(1, val);
    }
  }

  // Normalize về [0,1]
  let minV = Infinity, maxV = -Infinity;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (grid[r][c] < minV) minV = grid[r][c];
    if (grid[r][c] > maxV) maxV = grid[r][c];
  }
  const range = maxV - minV || 1;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    grid[r][c] = (grid[r][c] - minV) / range;
  }

  return grid;
}

// ─── Hill Climbing ────────────────────────────────────────────────────────────
// Steepest Ascent: chọn láng giềng tốt nhất, leo lên cho đến khi không còn cải thiện
export function hillClimbing(heatmap, rows, cols, startR, startC) {
  const steps = [];
  let cur = { r: startR, c: startC };
  const visited = new Set();
  visited.add(key(cur.r, cur.c));

  steps.push({
    type: 'init', node: cur,
    value: heatmap[cur.r][cur.c],
    visited: new Set(visited),
    current: key(cur.r, cur.c),
    desc: `Bắt đầu tại (${cur.r},${cur.c}), độ cao = ${heatmap[cur.r][cur.c].toFixed(3)}`,
  });

  let iter = 0;
  while (iter++ < rows * cols) {
    const neighbors = getNeighbors8(cur.r, cur.c, rows, cols);
    let bestNb = null, bestVal = heatmap[cur.r][cur.c];

    // Đánh giá tất cả láng giềng
    const nbInfo = neighbors.map(nb => ({
      node: nb,
      value: heatmap[nb.r][nb.c],
      key: key(nb.r, nb.c),
    }));

    steps.push({
      type: 'evaluate', node: cur,
      value: heatmap[cur.r][cur.c],
      neighbors: nbInfo,
      visited: new Set(visited),
      current: key(cur.r, cur.c),
      desc: `Đang xét ${neighbors.length} láng giềng từ (${cur.r},${cur.c})`,
    });

    for (const nb of nbInfo) {
      if (nb.value > bestVal) { bestVal = nb.value; bestNb = nb.node; }
    }

    if (!bestNb) {
      // Local maximum — dừng
      steps.push({
        type: 'local_max', node: cur,
        value: heatmap[cur.r][cur.c],
        visited: new Set(visited),
        current: key(cur.r, cur.c),
        desc: `🏔 Cực đại cục bộ! (${cur.r},${cur.c}) = ${heatmap[cur.r][cur.c].toFixed(3)}`,
      });
      break;
    }

    // Di chuyển
    steps.push({
      type: 'move', from: cur, to: bestNb,
      fromVal: heatmap[cur.r][cur.c],
      toVal: heatmap[bestNb.r][bestNb.c],
      visited: new Set(visited),
      current: key(bestNb.r, bestNb.c),
      desc: `Di chuyển (${cur.r},${cur.c})→(${bestNb.r},${bestNb.c}): ${heatmap[cur.r][cur.c].toFixed(3)}→${heatmap[bestNb.r][bestNb.c].toFixed(3)}`,
    });

    cur = bestNb;
    visited.add(key(cur.r, cur.c));
  }

  steps.push({
    type: 'done', node: cur,
    value: heatmap[cur.r][cur.c],
    visited: new Set(visited),
    current: key(cur.r, cur.c),
    desc: `✓ Hoàn thành — đỉnh tìm được: (${cur.r},${cur.c}) = ${heatmap[cur.r][cur.c].toFixed(3)}`,
  });

  return steps;
}

// ─── Simulated Annealing ──────────────────────────────────────────────────────
// Chấp nhận nước đi xấu hơn theo xác suất e^(ΔE/T), T giảm dần theo lịch làm lạnh
export function simulatedAnnealing(heatmap, rows, cols, startR, startC, {
  T0 = 1.0,
  alpha = 0.95,
  minT = 0.001,
  maxIter = 500,
  seed = 0.42,
} = {}) {
  const steps = [];
  let rng = seed;
  const rand = () => { rng = (rng * 9301 + 49297) % 233280; return rng / 233280; };
  const randInt = (n) => Math.floor(rand() * n);

  let cur = { r: startR, c: startC };
  let T = T0;
  let bestNode = cur;
  let bestVal = heatmap[cur.r][cur.c];
  const visited = new Set([key(cur.r, cur.c)]);
  const path = [key(cur.r, cur.c)]; // trail của hành trình

  steps.push({
    type: 'init', node: cur, T,
    value: heatmap[cur.r][cur.c],
    visited: new Set(visited), path: [...path],
    bestNode, bestVal,
    desc: `SA khởi động — T₀=${T0}, α=${alpha}. Vị trí: (${cur.r},${cur.c})`,
  });

  let iter = 0;
  while (T > minT && iter < maxIter) {
    iter++;
    const neighbors = getNeighbors8(cur.r, cur.c, rows, cols);
    const nb = neighbors[randInt(neighbors.length)];
    const deltaE = heatmap[nb.r][nb.c] - heatmap[cur.r][cur.c];
    const prob = deltaE > 0 ? 1 : Math.exp(deltaE / T);
    const accepted = rand() < prob;

    steps.push({
      type: 'try', node: cur, candidate: nb, T, iter,
      curVal: heatmap[cur.r][cur.c],
      candidateVal: heatmap[nb.r][nb.c],
      deltaE, prob, accepted,
      visited: new Set(visited), path: [...path],
      bestNode, bestVal,
      desc: accepted
        ? (deltaE > 0
            ? `✓ Chấp nhận cải thiện: Δ=${deltaE.toFixed(3)}`
            : `⚡ Chấp nhận tệ hơn với P=${prob.toFixed(3)} (T=${T.toFixed(3)})`)
        : `✗ Từ chối nước đi: Δ=${deltaE.toFixed(3)}, P=${prob.toFixed(3)}`,
    });

    if (accepted) {
      cur = nb;
      visited.add(key(cur.r, cur.c));
      path.push(key(cur.r, cur.c));
      if (heatmap[cur.r][cur.c] > bestVal) {
        bestVal = heatmap[cur.r][cur.c];
        bestNode = { ...cur };
      }
    }

    // Giảm nhiệt độ (cooling schedule)
    if (iter % 10 === 0) {
      T *= alpha;
      steps.push({
        type: 'cool', T, iter,
        node: cur, value: heatmap[cur.r][cur.c],
        visited: new Set(visited), path: [...path],
        bestNode, bestVal,
        desc: `🌡 Làm lạnh: T = ${T.toFixed(4)} (iter ${iter})`,
      });
    }
  }

  steps.push({
    type: 'done', node: bestNode, T,
    value: heatmap[bestNode.r][bestNode.c],
    visited: new Set(visited), path: [...path],
    bestNode, bestVal,
    desc: `✓ SA xong — Best: (${bestNode.r},${bestNode.c}) = ${bestVal.toFixed(3)}, T cuối=${T.toFixed(4)}`,
  });

  return steps;
}

// ─── Genetic Algorithm ────────────────────────────────────────────────────────
// Dân số là tập hợp các vị trí (r,c). Fitness = heatmap[r][c].
// Mỗi thế hệ: Selection (tournament) → Crossover → Mutation
export function geneticAlgorithm(heatmap, rows, cols, {
  popSize = 20,
  generations = 40,
  mutationRate = 0.15,
  seed = 0.7,
} = {}) {
  const steps = [];
  let rng = seed;
  const rand = () => { rng = (rng * 9301 + 49297) % 233280; return rng / 233280; };
  const randInt = (n) => Math.floor(rand() * n);

  // Khởi tạo dân số ngẫu nhiên
  let population = Array.from({ length: popSize }, () => ({
    r: randInt(rows), c: randInt(cols),
  }));

  const fitness = (ind) => heatmap[ind.r][ind.c];
  let bestEver = { ...population[0] };
  let bestEverVal = fitness(bestEver);

  steps.push({
    type: 'init',
    population: population.map(ind => ({ ...ind, fitness: fitness(ind) })),
    generation: 0, bestEver, bestEverVal,
    desc: `GA khởi tạo — ${popSize} cá thể, ${generations} thế hệ`,
  });

  for (let gen = 1; gen <= generations; gen++) {
    // ── Tournament Selection ──
    const select = () => {
      const a = population[randInt(popSize)];
      const b = population[randInt(popSize)];
      return fitness(a) >= fitness(b) ? a : b;
    };

    // ── Crossover (BLX - blend crossover cho grid 2D) ──
    const crossover = (p1, p2) => ({
      r: Math.round((p1.r + p2.r) / 2 + (rand() - 0.5) * 2) | 0,
      c: Math.round((p1.c + p2.c) / 2 + (rand() - 0.5) * 2) | 0,
    });

    // ── Mutation: random neighbor ──
    const mutate = (ind) => {
      if (rand() < mutationRate) {
        const nb = getNeighbors8(ind.r, ind.c, rows, cols);
        return nb[randInt(nb.length)];
      }
      return ind;
    };

    // Clamp về grid
    const clamp = (ind) => ({
      r: Math.max(0, Math.min(rows - 1, ind.r)),
      c: Math.max(0, Math.min(cols - 1, ind.c)),
    });

    // Sinh thế hệ mới (elitism: giữ 1 cá thể tốt nhất)
    const sorted = [...population].sort((a, b) => fitness(b) - fitness(a));
    const elite = sorted[0];

    const newPop = [elite];
    for (let i = 1; i < popSize; i++) {
      const p1 = select(), p2 = select();
      let child = crossover(p1, p2);
      child = clamp(child);
      child = mutate(child);
      child = clamp(child);
      newPop.push(child);
    }

    population = newPop;

    // Cập nhật best
    const genBest = [...population].sort((a, b) => fitness(b) - fitness(a))[0];
    const genBestVal = fitness(genBest);
    if (genBestVal > bestEverVal) {
      bestEver = { ...genBest };
      bestEverVal = genBestVal;
    }

    const avgFitness = population.reduce((s, ind) => s + fitness(ind), 0) / popSize;

    steps.push({
      type: gen % 5 === 0 || gen === generations ? 'generation_key' : 'generation',
      generation: gen, generations,
      population: population.map(ind => ({ ...ind, fitness: fitness(ind) })),
      genBest, genBestVal, avgFitness,
      bestEver, bestEverVal,
      desc: `Thế hệ ${gen}/${generations} — Best: ${genBestVal.toFixed(3)}, Avg: ${avgFitness.toFixed(3)}`,
    });
  }

  steps.push({
    type: 'done',
    population: population.map(ind => ({ ...ind, fitness: fitness(ind) })),
    generation: generations,
    bestEver, bestEverVal,
    desc: `✓ GA xong — Best toàn cục: (${bestEver.r},${bestEver.c}) = ${bestEverVal.toFixed(3)}`,
  });

  return steps;
}