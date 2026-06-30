import {
  Graph,
  Edge,
  BFSStep,
  DFSStep,
  DijkstraStep,
  KruskalStep,
  BellmanFordStep,
  PrimStep,
  KosarajuStep,
  TopoStep,
  AStarStep,
  BestFirstStep,
  BeamStep,
  TabuStep
} from "./config";

export function bfs(graph: Graph, start: string): BFSStep[] {
  const steps: BFSStep[] = [];
  const visited = new Set<string>();
  const queue: string[] = [start];
  
  visited.add(start);
  steps.push({ type: 'visit', node: start, queue: [start], stack: [], visited: new Set(visited) });
  
  while (queue.length) {
    const node = queue.shift()!;
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

export function dfs(graph: Graph, start: string): DFSStep[] {
  const steps: DFSStep[] = [];
  const visited = new Set<string>();
  const stack: string[] = [start];
  
  while (stack.length) {
    const node = stack.pop()!;
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

export function dijkstra(graph: Graph, start: string): DijkstraStep[] {
  const steps: DijkstraStep[] = [];
  const dist: { [key: string]: number } = {};
  const prev: { [key: string]: string } = {};
  const visited = new Set<string>();
  
  for (const node in graph) dist[node] = Infinity;
  dist[start] = 0;

  const pq: [string, number][] = [[start, 0]];
  steps.push({ type: 'init', dist: { ...dist }, current: start, pq: [...pq] });

  while (pq.length) {
    pq.sort((a, b) => a[1] - b[1]);
    const [u, ud] = pq.shift()!;
    if (visited.has(u)) continue;
    visited.add(u);
    steps.push({ type: 'visit', node: u, dist: { ...dist }, visited: new Set(visited), pq: [...pq] });

    for (const edge of (graph[u] || [])) {
      const edgeWeight = edge.weight || 0;
      const alt = dist[u] + edgeWeight;
      steps.push({ type: 'relax', from: u, to: edge.to, current: dist[edge.to], candidate: alt, pq: [...pq] });
      
      if (alt < dist[edge.to]) {
        dist[edge.to] = alt;
        prev[edge.to] = u;
        pq.push([edge.to, alt]);
        steps.push({ type: 'update', node: edge.to, dist: alt, dist_all: { ...dist }, pq: [...pq] });
      }
    }
  }
  steps.push({ type: 'done', dist: { ...dist }, prev, pq: [] });
  return steps;
}

export function kruskal(nodes: string[], edges: Edge[]): KruskalStep[] {
  const steps: KruskalStep[] = [];
  const sorted = [...edges].sort((a, b) => a.weight - b.weight);
  const parent: { [key: string]: string } = {};
  nodes.forEach(n => parent[n] = n);

  function find(x: string): string { 
    return parent[x] === x ? x : (parent[x] = find(parent[x])); 
  }
  function union(x: string, y: string) { 
    parent[find(x)] = find(y); 
  }

  const mst: Edge[] = [];
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

export function bellmanFord(graph: Graph, nodes: string[], start: string): BellmanFordStep[] {
  const steps: BellmanFordStep[] = [];
  const dist: { [key: string]: number } = {};
  const prev: { [key: string]: string | null } = {};
  
  nodes.forEach(n => { dist[n] = Infinity; prev[n] = null; });
  dist[start] = 0;
  steps.push({ type: 'init', dist: { ...dist }, iteration: 0, pq: [] });

  const allEdges: Edge[] = [];
  for (const u in graph) {
    for (const edge of (graph[u] || [])) {
      allEdges.push({ from: u, to: edge.to, weight: edge.weight || 0 });
    }
  }

  for (let i = 0; i < nodes.length - 1; i++) {
    let updated = false;
    for (const edge of allEdges) {
      steps.push({ 
        type: 'relax', 
        from: edge.from, 
        to: edge.to, 
        current: dist[edge.to], 
        candidate: dist[edge.from] + edge.weight, 
        iteration: i + 1, 
        dist: { ...dist }, 
        pq: [] 
      });
      
      if (dist[edge.from] !== Infinity && dist[edge.from] + edge.weight < dist[edge.to]) {
        dist[edge.to] = dist[edge.from] + edge.weight;
        prev[edge.to] = edge.from;
        updated = true;
        steps.push({ type: 'update', node: edge.to, dist: { ...dist }, dist_all: { ...dist }, iteration: i + 1, pq: [] });
      }
    }
    if (!updated) break;
  }

  let hasNegCycle = false;
  for (const edge of allEdges) {
    if (dist[edge.from] !== Infinity && dist[edge.from] + edge.weight < dist[edge.to]) {
      hasNegCycle = true;
      steps.push({ type: 'negativeCycle', from: edge.from, to: edge.to, dist: { ...dist }, pq: [] });
      break;
    }
  }

  steps.push({ type: 'done', dist: { ...dist }, prev, hasNegCycle, pq: [] });
  return steps;
}

export function prim(graph: Graph, nodes: string[], start: string): PrimStep[] {
  const steps: PrimStep[] = [];
  const inMST = new Set<string>();
  const mst: Edge[] = [];
  let pq: [number, string, string][] = [];

  inMST.add(start);
  for (const edge of (graph[start] || [])) {
    pq.push([edge.weight || 0, start, edge.to]);
  }
  steps.push({
    type: 'init', node: start, inMST: new Set(inMST),
    pq: [...pq], mst: [], desc: `Bắt đầu từ ${start}, thêm các cạnh kề vào PQ`
  });

  while (pq.length && inMST.size < nodes.length) {
    pq.sort((a, b) => a[0] - b[0]);
    const [cost, from, to] = pq.shift()!;

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
        pq.push([edge.weight || 0, to, edge.to]);
        steps.push({
          type: 'enqueue', from: to, to: edge.to, cost: edge.weight || 0,
          inMST: new Set(inMST), pq: [...pq], mst: [...mst],
          desc: `Thêm cạnh ${to}→${edge.to} (w=${edge.weight || 0}) vào PQ`
        });
      }
    }
  }

  steps.push({
    type: 'done', inMST: new Set(inMST), mst: [...mst], pq: [],
    desc: `✓ MST hoàn thành! ${mst.length} cạnh, tổng = ${mst.reduce((s, e) => s + e.weight, 0)}`
  });
  return steps;
}

export function kosaraju(graph: Graph, nodes: string[]): KosarajuStep[] {
  const steps: KosarajuStep[] = [];
  const visited = new Set<string>();
  const finishOrder: string[] = [];

  const rev: Graph = {};
  nodes.forEach(n => rev[n] = []);
  for (const u in graph) {
    for (const e of (graph[u] || [])) {
      if (!rev[e.to]) rev[e.to] = [];
      rev[e.to].push({ to: u, weight: e.weight });
    }
  }

  steps.push({ type: 'phase', phase: 1, desc: 'Pha 1: DFS trên đồ thị gốc, ghi thứ tự kết thúc' });
  function dfs1(u: string) {
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

  steps.push({ type: 'phase', phase: 2, desc: 'Pha 2: DFS trên đồ thị đảo ngược theo thứ tự finish' });
  const visited2 = new Set<string>();
  const sccs: string[][] = [];
  function dfs2(u: string, scc: string[]) {
    visited2.add(u);
    scc.push(u);
    steps.push({ type: 'visit2', node: u, scc: [...scc], sccs: sccs.map(s => [...s]), visited2: new Set(visited2), desc: `SCC ${sccs.length + 1}: thăm ${u}` });
    for (const e of (rev[u] || [])) {
      if (!visited2.has(e.to)) dfs2(e.to, scc);
    }
  }
  for (let i = finishOrder.length - 1; i >= 0; i--) {
    const n = finishOrder[i];
    if (!visited2.has(n)) {
      const scc: string[] = [];
      dfs2(n, scc);
      sccs.push(scc);
      steps.push({ type: 'scc_found', scc: [...scc], sccs: sccs.map(s => [...s]), desc: `✓ SCC ${sccs.length}: {${scc.join(',')}}` });
    }
  }
  steps.push({ type: 'done', sccs, desc: `✓ Tìm thấy ${sccs.length} SCC` });
  return steps;
}

export function topoSortDFS(graph: Graph, nodes: string[]): TopoStep[] {
  const steps: TopoStep[] = [];
  const visited = new Set<string>(), stack: string[] = [], temp = new Set<string>();
  let hasCycle = false;

  steps.push({ type: 'init', desc: 'Topo Sort (DFS): thăm tất cả nút, đẩy vào stack khi kết thúc' });

  function dfsLocal(u: string) {
    if (temp.has(u)) { hasCycle = true; steps.push({ type: 'cycle', node: u, desc: `⚠ Phát hiện chu trình tại ${u}` }); return; }
    if (visited.has(u)) return;
    temp.add(u);
    steps.push({ type: 'visit', node: u, temp: new Set(temp), visited: new Set(visited), stack: [...stack], desc: `Thăm ${u} (đánh dấu tạm)` });
    for (const e of (graph[u] || [])) {
      steps.push({ type: 'edge', from: u, to: e.to, desc: `Đi theo ${u}→${e.to}` });
      dfsLocal(e.to);
    }
    temp.delete(u);
    visited.add(u);
    stack.unshift(u);
    steps.push({ type: 'finish', node: u, stack: [...stack], desc: `Kết thúc ${u} → đẩy vào stack đầu` });
  }

  for (const n of nodes) { if (!visited.has(n)) dfsLocal(n); }
  steps.push({ type: 'done', order: [...stack], hasCycle, desc: hasCycle ? '⚠ Đồ thị có chu trình!' : `✓ Thứ tự: ${stack.join(' → ')}` });
  return steps;
}

export function topoSortKahn(graph: Graph, nodes: string[]): TopoStep[] {
  const steps: TopoStep[] = [];
  const inDegree: { [key: string]: number } = {};
  nodes.forEach(n => inDegree[n] = 0);
  for (const u in graph) {
    for (const e of (graph[u] || [])) {
      inDegree[e.to] = (inDegree[e.to] || 0) + 1;
    }
  }

  steps.push({ type: 'indegree', inDegree: { ...inDegree }, desc: `In-degree: ${nodes.map(n => `${n}=${inDegree[n]}`).join(', ')}` });

  const queue = nodes.filter(n => inDegree[n] === 0);
  const order: string[] = [];
  steps.push({ type: 'init_queue', queue: [...queue], desc: `Queue khởi đầu (in-degree=0): [${queue.join(',')}]` });

  while (queue.length) {
    const u = queue.shift()!;
    order.push(u);
    steps.push({ type: 'process', node: u, order: [...order], queue: [...queue], inDegree: { ...inDegree }, desc: `Lấy ${u} ra, thêm vào kết quả` });
    for (const e of (graph[u] || [])) {
      inDegree[e.to]--;
      steps.push({ type: 'reduce', from: u, to: e.to, inDegree: { ...inDegree }, desc: `Giảm in-degree[${e.to}]: ${inDegree[e.to] + 1}→${inDegree[e.to]}` });
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

export function aStar(graph: Graph, start: string, goal: string, heuristic: ((node: string, goal: string) => number) | null = null): AStarStep[] {
  const steps: AStarStep[] = [];
  const nodes = Object.keys(graph);
  const defaultHeuristic = (node: string, goal: string) => 0;
  const hFunc = heuristic || defaultHeuristic;
  
  const gScore: { [key: string]: number } = {};
  const fScore: { [key: string]: number } = {};
  const cameFrom: { [key: string]: string } = {};
  const openSet = new Set<string>();
  const closedSet = new Set<string>();
  
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
    openSet: new Set(openSet),
    closedSet: new Set(closedSet),
    gScore: { ...gScore },
    fScore: { ...fScore },
    cameFrom: { ...cameFrom },
    queue: [...openSet],
    stack: []
  });
  
  while (openSet.size > 0) {
    let current: string | null = null;
    let minF = Infinity;
    
    for (const node of openSet) {
      if (fScore[node] < minF) {
        minF = fScore[node];
        current = node;
      }
    }
    
    if (!current) break;
    
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
    
    if (current === goal) {
      const path: string[] = [];
      let temp: string | undefined = current;
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
        cameFrom: { ...cameFrom },
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
        cameFrom: { ...cameFrom },
        queue: [],
        stack: []
      });
      
      return steps;
    }
    
    openSet.delete(current);
    closedSet.add(current);
    
    for (const edge of (graph[current] || [])) {
      const neighbor = edge.to;
      const weight = edge.weight || 1;
      
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
      
      if (closedSet.has(neighbor)) continue;
      
      const tentativeG = gScore[current] + weight;
      
      if (tentativeG < gScore[neighbor]) {
        cameFrom[neighbor] = current;
        gScore[neighbor] = tentativeG;
        fScore[neighbor] = tentativeG + hFunc(neighbor, goal);
        
        if (!openSet.has(neighbor)) {
          openSet.add(neighbor);
        }
        
        steps.push({
          type: 'update',
          node: neighbor,
          from: current,
          gScore: { ...gScore },
          fScore: { ...fScore },
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

export function heuristicManhattan(goal: string) {
  return function(node: string) {
    const [nx, ny] = node.split(',').map(Number);
    const [gx, gy] = goal.split(',').map(Number);
    return Math.abs(nx - gx) + Math.abs(ny - gy);
  };
}

export function heuristicEuclidean(goal: string) {
  return function(node: string) {
    const [nx, ny] = node.split(',').map(Number);
    const [gx, gy] = goal.split(',').map(Number);
    return Math.sqrt(Math.pow(nx - gx, 2) + Math.pow(ny - gy, 2));
  };
}

export function bestFirstSearch(graph: Graph, start: string, goal: string, heuristic: ((node: string, goal: string) => number) | null = null): BestFirstStep[] {
  const steps: BestFirstStep[] = [];
  const nodes = Object.keys(graph);
  const defaultHeuristic = (node: string, goal: string) => 0;
  const hFunc = heuristic || defaultHeuristic;
  
  const cameFrom: { [key: string]: string } = {};
  const openSet = new Set<string>();
  const closedSet = new Set<string>();
  const fScore: { [key: string]: number } = {};
  
  nodes.forEach(n => { fScore[n] = Infinity; });
  fScore[start] = hFunc(start, goal);
  openSet.add(start);
  
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
    let current: string | null = null;
    let minF = Infinity;
    
    for (const node of openSet) {
      if (fScore[node] < minF) {
        minF = fScore[node];
        current = node;
      }
    }
    
    if (!current) break;
    
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
    
    if (current === goal) {
      const path: string[] = [];
      let temp: string | undefined = current;
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
    
    openSet.delete(current);
    closedSet.add(current);
    
    for (const edge of (graph[current] || [])) {
      const neighbor = edge.to;
      if (closedSet.has(neighbor)) continue;
      
      if (!openSet.has(neighbor)) {
        cameFrom[neighbor] = current;
        fScore[neighbor] = hFunc(neighbor, goal);
        openSet.add(neighbor);
        
        steps.push({
          type: 'discover',
          node: neighbor,
          from: current,
          fScore: { ...fScore },
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

export function beamSearch(graph: Graph, start: string, goal: string, beamWidth = 3, heuristic: ((node: string, goal: string) => number) | null = null): BeamStep[] {
  const steps: BeamStep[] = [];
  const nodes = Object.keys(graph);
  const defaultHeuristic = (node: string, goal: string) => 0;
  const hFunc = heuristic || defaultHeuristic;
  
  const cameFrom: { [key: string]: string } = {};
  const gScore: { [key: string]: number } = {};
  const fScore: { [key: string]: number } = {};
  const openSet = new Set<string>();
  const closedSet = new Set<string>();
  
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
    const beam = Array.from(openSet)
      .sort((a, b) => fScore[a] - fScore[b])
      .slice(0, beamWidth);
    
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
        const path: string[] = [];
        let temp: string | undefined = current;
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
          
          steps.push({
            type: 'update',
            node: neighbor,
            from: current,
            gScore: { ...gScore },
            fScore: { ...fScore },
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
    
    const allCandidates = Array.from(openSet)
      .filter(n => !closedSet.has(n))
      .sort((a, b) => fScore[a] - fScore[b])
      .slice(0, beamWidth * 2);
    
    openSet.clear();
    allCandidates.forEach(n => openSet.add(n));
    
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

export function tabuSearch(graph: Graph, start: string, goal: string, maxIterations = 100, tabuSize = 10, heuristic: ((node: string, goal: string) => number) | null = null): TabuStep[] {
  const steps: TabuStep[] = [];
  const nodes = Object.keys(graph);
  const defaultHeuristic = (node: string, goal: string) => 0;
  const hFunc = heuristic || defaultHeuristic;
  
  let currentPath: string[] = [start];
  let currentCost = 0;
  let bestPath: string[] = [start];
  let bestCost = Infinity;
  
  const tabuList: string[] = [];
  const visitedSet = new Set<string>([start]);
  
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
  
  const neighbors: { [key: string]: string[] } = {};
  nodes.forEach(n => {
    neighbors[n] = graph[n]?.map(e => e.to) || [];
  });
  
  const calculatePathCost = (path: string[]) => {
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
    
    const candidates = (neighbors[currentNode] || [])
      .filter(n => !visitedSet.has(n) && !tabuList.includes(n))
      .sort((a, b) => hFunc(a, goal) - hFunc(b, goal));
    
    if (candidates.length === 0) {
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
      const nextNode = candidates[0];
      const newCost = calculatePathCost([...currentPath, nextNode]);
      
      currentPath.push(nextNode);
      currentCost = newCost;
      visitedSet.add(nextNode);
      
      tabuList.push(nextNode);
      if (tabuList.length > tabuSize) {
        tabuList.shift();
      }
      
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