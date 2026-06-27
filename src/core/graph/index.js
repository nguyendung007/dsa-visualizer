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

// A-star.js
export function aStar(graph, start, goal, heuristic = null) {
  const steps = [];
  
  // Lấy danh sách tất cả nodes từ graph
  const nodes = Object.keys(graph);
  
  // Hàm heuristic mặc định (trả về 0 - hoạt động như Dijkstra)
  const defaultHeuristic = (node, goal) => 0;
  const hFunc = heuristic || defaultHeuristic;
  
  // Khởi tạo các cấu trúc dữ liệu
  const gScore = {};
  const fScore = {};
  const cameFrom = {};
  const openSet = new Set();
  const closedSet = new Set();
  
  // Khởi tạo giá trị cho tất cả nodes
  nodes.forEach(n => {
    gScore[n] = Infinity;
    fScore[n] = Infinity;
  });
  
  gScore[start] = 0;
  fScore[start] = hFunc(start, goal);
  openSet.add(start);
  
  // Lưu bước khởi tạo
  steps.push({
    type: 'init',
    start,
    goal,
    openSet: new Set(openSet),
    closedSet: new Set(closedSet),
    gScore: { ...gScore },
    fScore: { ...fScore },
    cameFrom: { ...cameFrom },
    queue: [...openSet],
    stack: []
  });
  
  while (openSet.size > 0) {
    // Tìm node trong openSet có fScore nhỏ nhất
    let current = null;
    let minF = Infinity;
    
    for (const node of openSet) {
      if (fScore[node] < minF) {
        minF = fScore[node];
        current = node;
      }
    }
    
    // Lưu bước xử lý node hiện tại
    steps.push({
      type: 'process',
      node: current,
      openSet: new Set(openSet),
      closedSet: new Set(closedSet),
      gScore: { ...gScore },
      fScore: { ...fScore },
      cameFrom: { ...cameFrom },
      queue: [...openSet],
      stack: [...closedSet]
    });
    
    // Kiểm tra nếu đã đến đích
    if (current === goal) {
      // Xây dựng đường đi
      const path = [];
      let temp = current;
      while (temp) {
        path.unshift(temp);
        temp = cameFrom[temp];
      }
      
      // Lưu bước tìm thấy đích
      steps.push({
        type: 'goal_found',
        current,
        path,
        openSet: new Set(openSet),
        closedSet: new Set(closedSet),
        gScore: { ...gScore },
        fScore: { ...fScore },
        cameFrom: { ...cameFrom },
        queue: [...openSet],
        stack: [...closedSet]
      });
      
      // Lưu bước kết thúc
      steps.push({
        type: 'done',
        path,
        cost: gScore[goal],
        openSet: new Set(openSet),
        closedSet: new Set(closedSet),
        gScore: { ...gScore },
        fScore: { ...fScore },
        cameFrom: { ...cameFrom },
        queue: [],
        stack: []
      });
      
      return steps;
    }
    
    // Di chuyển current từ openSet sang closedSet
    openSet.delete(current);
    closedSet.add(current);
    
    // Duyệt qua các neighbor của current
    for (const edge of (graph[current] || [])) {
      const neighbor = edge.to;
      const weight = edge.weight || 1;
      
      // Lưu bước xét cạnh
      steps.push({
        type: 'relax',
        from: current,
        to: neighbor,
        weight,
        currentG: gScore[neighbor],
        tentativeG: gScore[current] + weight,
        openSet: new Set(openSet),
        closedSet: new Set(closedSet),
        gScore: { ...gScore },
        fScore: { ...fScore },
        queue: [...openSet],
        stack: [...closedSet]
      });
      
      if (closedSet.has(neighbor)) {
        continue;
      }
      
      const tentativeG = gScore[current] + weight;
      
      if (tentativeG < gScore[neighbor]) {
        // Cập nhật đường đi tốt hơn
        cameFrom[neighbor] = current;
        gScore[neighbor] = tentativeG;
        fScore[neighbor] = tentativeG + hFunc(neighbor, goal);
        
        if (!openSet.has(neighbor)) {
          openSet.add(neighbor);
        }
        
        // Lưu bước cập nhật
        steps.push({
          type: 'update',
          node: neighbor,
          from: current,
          gScore: gScore[neighbor],
          fScore: fScore[neighbor],
          openSet: new Set(openSet),
          closedSet: new Set(closedSet),
          gScoreAll: { ...gScore },
          fScoreAll: { ...fScore },
          cameFrom: { ...cameFrom },
          queue: [...openSet],
          stack: [...closedSet]
        });
      }
    }
  }
  
  // Không tìm thấy đường đi
  steps.push({
    type: 'no_path',
    openSet: new Set(openSet),
    closedSet: new Set(closedSet),
    gScore: { ...gScore },
    fScore: { ...fScore },
    cameFrom: { ...cameFrom },
    queue: [],
    stack: [...closedSet]
  });
  
  steps.push({
    type: 'done',
    path: [],
    cost: Infinity,
    openSet: new Set(openSet),
    closedSet: new Set(closedSet),
    gScore: { ...gScore },
    fScore: { ...fScore },
    cameFrom: { ...cameFrom },
    queue: [],
    stack: [...closedSet]
  });
  
  return steps;
}

// Hàm heuristic Manhattan (có thể import riêng nếu cần)
export function heuristicManhattan(goal) {
  return function(node) {
    const [nx, ny] = node.split(',').map(Number);
    const [gx, gy] = goal.split(',').map(Number);
    return Math.abs(nx - gx) + Math.abs(ny - gy);
  };
}

// Hàm heuristic Euclidean (có thể import riêng nếu cần)
export function heuristicEuclidean(goal) {
  return function(node) {
    const [nx, ny] = node.split(',').map(Number);
    const [gx, gy] = goal.split(',').map(Number);
    return Math.sqrt(Math.pow(nx - gx, 2) + Math.pow(ny - gy, 2));
  };
}

// Thêm vào cuối file index.js, sau hàm aStar

export function bestFirstSearch(graph, start, goal, heuristic = null) {
  const steps = [];
  
  // Lấy danh sách tất cả nodes từ graph
  const nodes = Object.keys(graph);
  
  // Hàm heuristic mặc định (trả về 0)
  const defaultHeuristic = (node, goal) => 0;
  const hFunc = heuristic || defaultHeuristic;
  
  // Khởi tạo các cấu trúc dữ liệu
  const cameFrom = {};
  const openSet = new Set();
  const closedSet = new Set();
  const fScore = {}; // Chỉ lưu f-score (heuristic)
  
  // Khởi tạo giá trị cho tất cả nodes
  nodes.forEach(n => {
    fScore[n] = Infinity;
  });
  
  fScore[start] = hFunc(start, goal);
  openSet.add(start);
  
  // Lưu bước khởi tạo
  steps.push({
    type: 'init',
    start,
    goal,
    openSet: new Set(openSet),
    closedSet: new Set(closedSet),
    fScore: { ...fScore },
    cameFrom: { ...cameFrom },
    queue: [...openSet],
    stack: []
  });
  
  while (openSet.size > 0) {
    // Tìm node trong openSet có fScore nhỏ nhất (heuristic tốt nhất)
    let current = null;
    let minF = Infinity;
    
    for (const node of openSet) {
      if (fScore[node] < minF) {
        minF = fScore[node];
        current = node;
      }
    }
    
    // Lưu bước xử lý node hiện tại
    steps.push({
      type: 'process',
      node: current,
      openSet: new Set(openSet),
      closedSet: new Set(closedSet),
      fScore: { ...fScore },
      cameFrom: { ...cameFrom },
      queue: [...openSet],
      stack: [...closedSet]
    });
    
    // Kiểm tra nếu đã đến đích
    if (current === goal) {
      // Xây dựng đường đi
      const path = [];
      let temp = current;
      while (temp) {
        path.unshift(temp);
        temp = cameFrom[temp];
      }
      
      steps.push({
        type: 'goal_found',
        current,
        path,
        openSet: new Set(openSet),
        closedSet: new Set(closedSet),
        fScore: { ...fScore },
        cameFrom: { ...cameFrom },
        queue: [...openSet],
        stack: [...closedSet]
      });
      
      steps.push({
        type: 'done',
        path,
        cost: path.length - 1,
        openSet: new Set(openSet),
        closedSet: new Set(closedSet),
        fScore: { ...fScore },
        cameFrom: { ...cameFrom },
        queue: [],
        stack: []
      });
      
      return steps;
    }
    
    // Di chuyển current từ openSet sang closedSet
    openSet.delete(current);
    closedSet.add(current);
    
    // Duyệt qua các neighbor của current
    for (const edge of (graph[current] || [])) {
      const neighbor = edge.to;
      const weight = edge.weight || 1;
      
      if (closedSet.has(neighbor)) {
        continue;
      }
      
      if (!openSet.has(neighbor)) {
        cameFrom[neighbor] = current;
        fScore[neighbor] = hFunc(neighbor, goal);
        openSet.add(neighbor);
        
        steps.push({
          type: 'discover',
          node: neighbor,
          from: current,
          fScore: fScore[neighbor],
          openSet: new Set(openSet),
          closedSet: new Set(closedSet),
          fScoreAll: { ...fScore },
          cameFrom: { ...cameFrom },
          queue: [...openSet],
          stack: [...closedSet]
        });
      }
    }
  }
  
  // Không tìm thấy đường đi
  steps.push({
    type: 'no_path',
    openSet: new Set(openSet),
    closedSet: new Set(closedSet),
    fScore: { ...fScore },
    cameFrom: { ...cameFrom },
    queue: [],
    stack: [...closedSet]
  });
  
  steps.push({
    type: 'done',
    path: [],
    cost: Infinity,
    openSet: new Set(openSet),
    closedSet: new Set(closedSet),
    fScore: { ...fScore },
    cameFrom: { ...cameFrom },
    queue: [],
    stack: [...closedSet]
  });
  
  return steps;
}

// Thêm sau bestFirstSearch

// ─── Beam Search ────────────────────────────────────────────────────────────
export function beamSearch(graph, start, goal, beamWidth = 3, heuristic = null) {
  const steps = [];
  
  const nodes = Object.keys(graph);
  const defaultHeuristic = (node, goal) => 0;
  const hFunc = heuristic || defaultHeuristic;
  
  // Khởi tạo
  const cameFrom = {};
  const gScore = {};
  const fScore = {};
  const openSet = new Set();
  const closedSet = new Set();
  
  nodes.forEach(n => {
    gScore[n] = Infinity;
    fScore[n] = Infinity;
  });
  
  gScore[start] = 0;
  fScore[start] = hFunc(start, goal);
  openSet.add(start);
  
  steps.push({
    type: 'init',
    start,
    goal,
    beamWidth,
    openSet: new Set(openSet),
    closedSet: new Set(closedSet),
    gScore: { ...gScore },
    fScore: { ...fScore },
    cameFrom: { ...cameFrom },
    queue: [...openSet],
    stack: []
  });
  
  while (openSet.size > 0) {
    // Chọn beam tốt nhất từ openSet
    const beam = Array.from(openSet)
      .sort((a, b) => fScore[a] - fScore[b])
      .slice(0, beamWidth);
    
    const nextOpenSet = new Set();
    
    for (const current of beam) {
      steps.push({
        type: 'process',
        node: current,
        beam: [...beam],
        openSet: new Set(openSet),
        closedSet: new Set(closedSet),
        gScore: { ...gScore },
        fScore: { ...fScore },
        queue: [...openSet],
        stack: [...closedSet]
      });
      
      if (current === goal) {
        const path = [];
        let temp = current;
        while (temp) {
          path.unshift(temp);
          temp = cameFrom[temp];
        }
        
        steps.push({
          type: 'goal_found',
          current,
          path,
          openSet: new Set(openSet),
          closedSet: new Set(closedSet),
          gScore: { ...gScore },
          fScore: { ...fScore },
          queue: [...openSet],
          stack: [...closedSet]
        });
        
        steps.push({
          type: 'done',
          path,
          cost: gScore[goal],
          openSet: new Set(openSet),
          closedSet: new Set(closedSet),
          gScore: { ...gScore },
          fScore: { ...fScore },
          queue: [],
          stack: []
        });
        
        return steps;
      }
      
      closedSet.add(current);
      
      for (const edge of (graph[current] || [])) {
        const neighbor = edge.to;
        const weight = edge.weight || 1;
        
        if (closedSet.has(neighbor)) continue;
        
        const tentativeG = gScore[current] + weight;
        
        if (tentativeG < gScore[neighbor]) {
          cameFrom[neighbor] = current;
          gScore[neighbor] = tentativeG;
          fScore[neighbor] = tentativeG + hFunc(neighbor, goal);
          
          if (!openSet.has(neighbor)) {
            openSet.add(neighbor);
          }
          
          nextOpenSet.add(neighbor);
          
          steps.push({
            type: 'update',
            node: neighbor,
            from: current,
            gScore: gScore[neighbor],
            fScore: fScore[neighbor],
            openSet: new Set(openSet),
            closedSet: new Set(closedSet),
            gScoreAll: { ...gScore },
            fScoreAll: { ...fScore },
            cameFrom: { ...cameFrom },
            queue: [...openSet],
            stack: [...closedSet]
          });
        }
      }
    }
    
    // Cập nhật openSet cho vòng lặp tiếp theo
    // Giữ lại các node tốt nhất dựa trên fScore
    const allCandidates = Array.from(openSet)
      .filter(n => !closedSet.has(n))
      .sort((a, b) => fScore[a] - fScore[b])
      .slice(0, beamWidth * 2); // Lấy nhiều hơn beamWidth để có đa dạng
    
    openSet.clear();
    allCandidates.forEach(n => openSet.add(n));
    
    // Nếu không còn node nào trong openSet sau khi lọc
    if (openSet.size === 0 && !closedSet.has(goal)) {
      steps.push({
        type: 'no_path',
        openSet: new Set(openSet),
        closedSet: new Set(closedSet),
        gScore: { ...gScore },
        fScore: { ...fScore },
        queue: [],
        stack: [...closedSet]
      });
      
      steps.push({
        type: 'done',
        path: [],
        cost: Infinity,
        openSet: new Set(openSet),
        closedSet: new Set(closedSet),
        gScore: { ...gScore },
        fScore: { ...fScore },
        queue: [],
        stack: [...closedSet]
      });
      
      return steps;
    }
  }
  
  // Không tìm thấy đường đi
  steps.push({
    type: 'no_path',
    openSet: new Set(openSet),
    closedSet: new Set(closedSet),
    gScore: { ...gScore },
    fScore: { ...fScore },
    queue: [],
    stack: [...closedSet]
  });
  
  steps.push({
    type: 'done',
    path: [],
    cost: Infinity,
    openSet: new Set(openSet),
    closedSet: new Set(closedSet),
    gScore: { ...gScore },
    fScore: { ...fScore },
    queue: [],
    stack: [...closedSet]
  });
  
  return steps;
}

// ─── Tabu Search ────────────────────────────────────────────────────────────
export function tabuSearch(graph, start, goal, maxIterations = 100, tabuSize = 10, heuristic = null) {
  const steps = [];
  
  const nodes = Object.keys(graph);
  const defaultHeuristic = (node, goal) => 0;
  const hFunc = heuristic || defaultHeuristic;
  
  // Khởi tạo giải pháp ban đầu (tìm đường đi đơn giản)
  let currentPath = [start];
  let currentCost = 0;
  let bestPath = [start];
  let bestCost = Infinity;
  
  const tabuList = [];
  const visitedSet = new Set([start]);
  
  steps.push({
    type: 'init',
    start,
    goal,
    maxIterations,
    tabuSize,
    currentPath: [...currentPath],
    currentCost,
    bestPath: [...bestPath],
    bestCost,
    tabuList: [...tabuList],
    visited: new Set(visitedSet),
    gScore: { [start]: 0 },
    fScore: { [start]: hFunc(start, goal) },
    queue: [],
    stack: []
  });
  
  // Xây dựng danh sách hàng xóm cho mỗi node
  const neighbors = {};
  nodes.forEach(n => {
    neighbors[n] = graph[n]?.map(e => e.to) || [];
  });
  
  // Hàm tính chi phí của đường đi
  const calculatePathCost = (path) => {
    let cost = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const edge = graph[path[i]]?.find(e => e.to === path[i + 1]);
      if (edge) {
        cost += edge.weight || 1;
      } else {
        return Infinity;
      }
    }
    return cost;
  };
  
  let iteration = 0;
  let foundGoal = false;
  
  while (iteration < maxIterations && !foundGoal && currentPath.length > 0) {
    const currentNode = currentPath[currentPath.length - 1];
    
    // Nếu đã đến goal
    if (currentNode === goal) {
      foundGoal = true;
      const totalCost = calculatePathCost(currentPath);
      if (totalCost < bestCost) {
        bestPath = [...currentPath];
        bestCost = totalCost;
      }
      
      steps.push({
        type: 'goal_found',
        currentPath: [...currentPath],
        bestPath: [...bestPath],
        bestCost,
        iteration,
        tabuList: [...tabuList],
        visited: new Set(visitedSet),
        queue: [],
        stack: []
      });
      break;
    }
    
    // Lấy các hàng xóm chưa thăm hoặc không trong tabu
    const candidates = (neighbors[currentNode] || [])
      .filter(n => !visitedSet.has(n) && !tabuList.includes(n))
      .sort((a, b) => hFunc(a, goal) - hFunc(b, goal));
    
    if (candidates.length === 0) {
      // Nếu không có lựa chọn nào, quay lui một bước (tìm đường mới)
      if (currentPath.length > 1) {
        const backNode = currentPath[currentPath.length - 2];
        const backCost = calculatePathCost(currentPath.slice(0, -1));
        currentPath = currentPath.slice(0, -1);
        currentCost = backCost;
        
        steps.push({
          type: 'backtrack',
          node: backNode,
          currentPath: [...currentPath],
          currentCost,
          iteration: iteration + 1,
          tabuList: [...tabuList],
          visited: new Set(visitedSet),
          queue: [],
          stack: []
        });
      } else {
        break;
      }
    } else {
      // Chọn candidate tốt nhất
      const nextNode = candidates[0];
      const newCost = calculatePathCost([...currentPath, nextNode]);
      
      // Cập nhật
      currentPath.push(nextNode);
      currentCost = newCost;
      visitedSet.add(nextNode);
      
      // Cập nhật tabu
      tabuList.push(nextNode);
      if (tabuList.length > tabuSize) {
        tabuList.shift();
      }
      
      // Cập nhật giải pháp tốt nhất
      if (newCost < bestCost && nextNode === goal) {
        bestPath = [...currentPath];
        bestCost = newCost;
      }
      
      steps.push({
        type: 'explore',
        node: nextNode,
        from: currentNode,
        currentPath: [...currentPath],
        currentCost,
        bestPath: [...bestPath],
        bestCost,
        iteration: iteration + 1,
        tabuList: [...tabuList],
        visited: new Set(visitedSet),
        gScore: { ...Object.fromEntries(currentPath.map((n, i) => [n, i])) },
        fScore: { ...Object.fromEntries(currentPath.map((n, i) => [n, i + hFunc(n, goal)])) },
        queue: [...currentPath],
        stack: [...tabuList]
      });
    }
    
    iteration++;
  }
  
  // Kết thúc
  steps.push({
    type: 'done',
    path: bestPath,
    cost: bestCost,
    iterations: iteration,
    foundGoal,
    currentPath: [...currentPath],
    currentCost,
    bestPath: [...bestPath],
    bestCost,
    tabuList: [...tabuList],
    visited: new Set(visitedSet),
    queue: [],
    stack: [...tabuList]
  });
  
  return steps;
}