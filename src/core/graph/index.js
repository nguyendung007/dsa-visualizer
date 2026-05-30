export function bfs(graph, start) {
  const steps = [], visited = new Set(), queue = [start];
  visited.add(start);
  steps.push({ type: 'visit', node: start, queue: [start], stack: [], visited: new Set(visited) });
  while (queue.length) {
    const node = queue.shift();
    steps.push({ type: 'process', node, queue: [...queue], stack: [], visited: new Set(visited) });
    for (const neighbor of (graph[node] || [])) {
      if (!visited.has(neighbor.to)) {
        visited.add(neighbor.to);
        queue.push(neighbor.to);
        steps.push({ type: 'discover', from: node, to: neighbor.to, queue: [...queue], stack: [], visited: new Set(visited) });
      }
    }
  }
  steps.push({ type: 'done', visited: new Set(visited), queue: [], stack: [] });
  return steps;
}

export function dfs(graph, start) {
  const steps = [], visited = new Set(), stack = [start];
  while (stack.length) {
    const node = stack.pop();
    if (visited.has(node)) continue;
    visited.add(node);
    steps.push({ type: 'visit', node, stack: [...stack], queue: [], visited: new Set(visited) });
    for (const neighbor of (graph[node] || []).slice().reverse()) {
      if (!visited.has(neighbor.to)) {
        stack.push(neighbor.to);
        steps.push({ type: 'push', from: node, to: neighbor.to, stack: [...stack], queue: [] });
      }
    }
  }
  steps.push({ type: 'done', visited: new Set(visited), stack: [], queue: [] });
  return steps;
}

export function dijkstra(graph, start) {
  const steps = [];
  const dist = {}, prev = {}, visited = new Set();
  for (const node in graph) dist[node] = Infinity;
  dist[start] = 0;

  // Priority queue as sorted array of [node, dist]
  const pq = [[start, 0]];
  steps.push({ type: 'init', dist: {...dist}, current: start, pq: [...pq] });

  while (pq.length) {
    pq.sort((a, b) => a[1] - b[1]);
    const [u, ud] = pq.shift();
    if (visited.has(u)) continue;
    visited.add(u);
    steps.push({ type: 'visit', node: u, dist: {...dist}, visited: new Set(visited), pq: [...pq] });

    for (const edge of (graph[u] || [])) {
      const alt = dist[u] + edge.weight;
      steps.push({ type: 'relax', from: u, to: edge.to, current: dist[edge.to], candidate: alt, pq: [...pq] });
      if (alt < dist[edge.to]) {
        dist[edge.to] = alt;
        prev[edge.to] = u;
        pq.push([edge.to, alt]);
        steps.push({ type: 'update', node: edge.to, dist: alt, dist_all: {...dist}, pq: [...pq] });
      }
    }
  }
  steps.push({ type: 'done', dist: {...dist}, prev, pq: [] });
  return steps;
}

export function kruskal(nodes, edges) {
  const steps = [];
  const sorted = [...edges].sort((a, b) => a.weight - b.weight);
  const parent = {};
  nodes.forEach(n => parent[n] = n);

  function find(x) { return parent[x] === x ? x : (parent[x] = find(parent[x])); }
  function union(x, y) { parent[find(x)] = find(y); }

  const mst = [];
  for (const edge of sorted) {
    steps.push({ type: 'consider', edge, mst: [...mst], queue: [], stack: [] });
    if (find(edge.from) !== find(edge.to)) {
      union(edge.from, edge.to);
      mst.push(edge);
      steps.push({ type: 'add', edge, mst: [...mst], queue: [], stack: [] });
    } else {
      steps.push({ type: 'skip', edge, reason: 'cycle', mst: [...mst], queue: [], stack: [] });
    }
  }
  steps.push({ type: 'done', mst, queue: [], stack: [] });
  return steps;
}

export function bellmanFord(graph, nodes, start) {
  const steps = [];
  const dist = {}, prev = {};
  nodes.forEach(n => { dist[n] = Infinity; prev[n] = null; });
  dist[start] = 0;
  steps.push({ type: 'init', dist: {...dist}, iteration: 0, pq: [] });

  const allEdges = [];
  for (const u in graph) {
    for (const edge of (graph[u] || [])) {
      allEdges.push({ from: u, to: edge.to, weight: edge.weight });
    }
  }

  for (let i = 0; i < nodes.length - 1; i++) {
    let updated = false;
    for (const edge of allEdges) {
      steps.push({ type: 'relax', from: edge.from, to: edge.to, current: dist[edge.to], candidate: dist[edge.from] + edge.weight, iteration: i + 1, dist: {...dist}, pq: [] });
      if (dist[edge.from] !== Infinity && dist[edge.from] + edge.weight < dist[edge.to]) {
        dist[edge.to] = dist[edge.from] + edge.weight;
        prev[edge.to] = edge.from;
        updated = true;
        steps.push({ type: 'update', node: edge.to, dist: dist[edge.to], dist_all: {...dist}, iteration: i + 1, pq: [] });
      }
    }
    if (!updated) break;
  }

  // Check for negative cycles
  let hasNegCycle = false;
  for (const edge of allEdges) {
    if (dist[edge.from] !== Infinity && dist[edge.from] + edge.weight < dist[edge.to]) {
      hasNegCycle = true;
      steps.push({ type: 'negativeCycle', from: edge.from, to: edge.to, pq: [] });
      break;
    }
  }

  steps.push({ type: 'done', dist: {...dist}, prev, hasNegCycle, pq: [] });
  return steps;
}

export function prim(graph, nodes, start) {
  const steps = [];
  const inMST = new Set();
  const mst = [];
  // Priority queue entries: [cost, from, to]
  let pq = [];

  inMST.add(start);
  for (const edge of (graph[start] || [])) {
    pq.push([edge.weight, start, edge.to]);
  }
  steps.push({
    type: 'init', node: start, inMST: new Set(inMST),
    pq: [...pq], mst: [], desc: `Bắt đầu từ ${start}, thêm các cạnh kề vào PQ`
  });

  while (pq.length && inMST.size < nodes.length) {
    pq.sort((a, b) => a[0] - b[0]);
    const [cost, from, to] = pq.shift();

    steps.push({
      type: 'consider', from, to, cost,
      inMST: new Set(inMST), pq: [...pq], mst: [...mst],
      desc: `Xét cạnh ${from}→${to} (w=${cost})`
    });

    if (inMST.has(to)) {
      steps.push({
        type: 'skip', from, to, cost,
        inMST: new Set(inMST), pq: [...pq], mst: [...mst],
        desc: `Bỏ qua ${from}→${to}: ${to} đã trong MST`
      });
      continue;
    }

    inMST.add(to);
    mst.push({ from, to, weight: cost });
    steps.push({
      type: 'add', from, to, cost,
      inMST: new Set(inMST), pq: [...pq], mst: [...mst],
      desc: `✓ Thêm cạnh ${from}→${to} (w=${cost}) vào MST`
    });

    for (const edge of (graph[to] || [])) {
      if (!inMST.has(edge.to)) {
        pq.push([edge.weight, to, edge.to]);
        steps.push({
          type: 'enqueue', from: to, to: edge.to, cost: edge.weight,
          inMST: new Set(inMST), pq: [...pq], mst: [...mst],
          desc: `Thêm cạnh ${to}→${edge.to} (w=${edge.weight}) vào PQ`
        });
      }
    }
  }

  steps.push({
    type: 'done', inMST: new Set(inMST), mst: [...mst], pq: [],
    desc: `✓ MST hoàn thành! ${mst.length} cạnh, tổng = ${mst.reduce((s,e)=>s+e.weight,0)}`
  });
  return steps;
}

// ─── Kosaraju-Sharir (Strongly Connected Components) ─────────────────────────
export function kosaraju(graph, nodes) {
  const steps = [];
  const visited = new Set();
  const finishOrder = [];

  // Build reverse graph
  const rev = {};
  nodes.forEach(n => rev[n] = []);
  for (const u in graph) {
    for (const e of (graph[u] || [])) {
      if (!rev[e.to]) rev[e.to] = [];
      rev[e.to].push({ to: u, weight: e.weight });
    }
  }

  // Phase 1: DFS on original graph, record finish order
  steps.push({ type: 'phase', phase: 1, desc: 'Pha 1: DFS trên đồ thị gốc, ghi thứ tự kết thúc' });
  function dfs1(u) {
    visited.add(u);
    steps.push({ type: 'visit1', node: u, visited: new Set(visited), finishOrder: [...finishOrder], desc: `Thăm ${u}` });
    for (const e of (graph[u] || [])) {
      if (!visited.has(e.to)) {
        steps.push({ type: 'edge1', from: u, to: e.to, desc: `Đi theo cạnh ${u}→${e.to}` });
        dfs1(e.to);
      }
    }
    finishOrder.push(u);
    steps.push({ type: 'finish', node: u, finishOrder: [...finishOrder], desc: `Kết thúc ${u}, finish order: [${finishOrder.join(',')}]` });
  }
  for (const n of nodes) { if (!visited.has(n)) dfs1(n); }

  // Phase 2: DFS on reversed graph in reverse finish order
  steps.push({ type: 'phase', phase: 2, desc: 'Pha 2: DFS trên đồ thị đảo ngược theo thứ tự finish' });
  const visited2 = new Set();
  const sccs = [];
  function dfs2(u, scc) {
    visited2.add(u);
    scc.push(u);
    steps.push({ type: 'visit2', node: u, scc: [...scc], sccs: sccs.map(s => [...s]), visited2: new Set(visited2), desc: `SCC ${sccs.length+1}: thăm ${u}` });
    for (const e of (rev[u] || [])) {
      if (!visited2.has(e.to)) dfs2(e.to, scc);
    }
  }
  for (let i = finishOrder.length - 1; i >= 0; i--) {
    const n = finishOrder[i];
    if (!visited2.has(n)) {
      const scc = [];
      dfs2(n, scc);
      sccs.push(scc);
      steps.push({ type: 'scc_found', scc: [...scc], sccs: sccs.map(s => [...s]), desc: `✓ SCC ${sccs.length}: {${scc.join(',')}}` });
    }
  }
  steps.push({ type: 'done', sccs, desc: `✓ Tìm thấy ${sccs.length} SCC` });
  return steps;
}

// ─── Topological Sort — DFS (Kahn) ────────────────────────────────────────────
export function topoSortDFS(graph, nodes) {
  const steps = [];
  const visited = new Set(), stack = [], temp = new Set();
  let hasCycle = false;

  steps.push({ type: 'init', desc: 'Topo Sort (DFS): thăm tất cả nút, đẩy vào stack khi kết thúc' });

  function dfs(u) {
    if (temp.has(u)) { hasCycle = true; steps.push({ type: 'cycle', node: u, desc: `⚠ Phát hiện chu trình tại ${u}` }); return; }
    if (visited.has(u)) return;
    temp.add(u);
    steps.push({ type: 'visit', node: u, temp: new Set(temp), visited: new Set(visited), stack: [...stack], desc: `Thăm ${u} (đánh dấu tạm)` });
    for (const e of (graph[u] || [])) {
      steps.push({ type: 'edge', from: u, to: e.to, desc: `Đi theo ${u}→${e.to}` });
      dfs(e.to);
    }
    temp.delete(u);
    visited.add(u);
    stack.unshift(u);
    steps.push({ type: 'finish', node: u, stack: [...stack], desc: `Kết thúc ${u} → đẩy vào stack đầu` });
  }

  for (const n of nodes) { if (!visited.has(n)) dfs(n); }
  steps.push({ type: 'done', order: [...stack], hasCycle, desc: hasCycle ? '⚠ Đồ thị có chu trình!' : `✓ Thứ tự: ${stack.join(' → ')}` });
  return steps;
}

export function topoSortKahn(graph, nodes) {
  const steps = [];
  const inDegree = {};
  nodes.forEach(n => inDegree[n] = 0);
  for (const u in graph) {
    for (const e of (graph[u] || [])) {
      inDegree[e.to] = (inDegree[e.to] || 0) + 1;
    }
  }

  steps.push({ type: 'indegree', inDegree: { ...inDegree }, desc: `In-degree: ${nodes.map(n => `${n}=${inDegree[n]}`).join(', ')}` });

  const queue = nodes.filter(n => inDegree[n] === 0);
  const order = [];
  steps.push({ type: 'init_queue', queue: [...queue], desc: `Queue khởi đầu (in-degree=0): [${queue.join(',')}]` });

  while (queue.length) {
    const u = queue.shift();
    order.push(u);
    steps.push({ type: 'process', node: u, order: [...order], queue: [...queue], inDegree: { ...inDegree }, desc: `Lấy ${u} ra, thêm vào kết quả` });
    for (const e of (graph[u] || [])) {
      inDegree[e.to]--;
      steps.push({ type: 'reduce', from: u, to: e.to, inDegree: { ...inDegree }, desc: `Giảm in-degree[${e.to}]: ${inDegree[e.to]+1}→${inDegree[e.to]}` });
      if (inDegree[e.to] === 0) {
        queue.push(e.to);
        steps.push({ type: 'enqueue', node: e.to, queue: [...queue], desc: `in-degree[${e.to}]=0 → thêm vào queue` });
      }
    }
  }

  const hasCycle = order.length < nodes.length;
  steps.push({ type: 'done', order, hasCycle, desc: hasCycle ? '⚠ Đồ thị có chu trình!' : `✓ Thứ tự: ${order.join(' → ')}` });
  return steps;
}
