import { Position, Step, MazeAlgorithm } from './config';

function getNeighbors(r: number, c: number, maze: number[][], rows: number, cols: number): Position[] {
  const dirs: [number, number][] = [[-1,0],[1,0],[0,-1],[0,1]];
  const result: Position[] = [];
  for (const [dr, dc] of dirs) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && maze[nr][nc] !== 1) {
      result.push({ r: nr, c: nc });
    }
  }
  return result;
}

function key(r: number, c: number): string {
  return `${r},${c}`;
}

function parseKey(k: string): Position {
  const [r,c] = k.split(',').map(Number);
  return {r, c};
}

function reconstructPath(cameFrom: { [key: string]: string }, start: Position, goal: Position): Position[] {
  const path: Position[] = [];
  let cur: string | undefined = key(goal.r, goal.c);
  while (cur) {
    path.unshift(parseKey(cur));
    cur = cameFrom[cur];
  }
  return path;
}

export function mazeBFS(maze: number[][], rows: number, cols: number, start: Position, goal: Position): Step[] {
  const steps: Step[] = [];
  const visited = new Set<string>();
  const cameFrom: { [key: string]: string } = {};
  const queue: Position[] = [start];
  visited.add(key(start.r, start.c));

  steps.push({
    type: 'init',
    node: start,
    visited: new Set(visited),
    queue: [key(start.r, start.c)],
    frontier: new Set([key(start.r, start.c)])
  });

  while (queue.length) {
    const cur = queue.shift()!;
    const curKey = key(cur.r, cur.c);

    if (cur.r === goal.r && cur.c === goal.c) {
      const path = reconstructPath(cameFrom, start, goal);
      steps.push({ type: 'goal_found', node: cur, path: path.map(p => key(p.r, p.c)), visited: new Set(visited), queue: queue.map(n => key(n.r, n.c)), frontier: new Set() });
      steps.push({ type: 'done', path: path.map(p => key(p.r, p.c)), visited: new Set(visited), queue: [], frontier: new Set() });
      return steps;
    }

    steps.push({
      type: 'process',
      node: cur,
      visited: new Set(visited),
      queue: queue.map(n => key(n.r, n.c)),
      frontier: new Set(queue.map(n => key(n.r, n.c)))
    });

    for (const nb of getNeighbors(cur.r, cur.c, maze, rows, cols)) {
      const nbKey = key(nb.r, nb.c);
      if (!visited.has(nbKey)) {
        visited.add(nbKey);
        cameFrom[nbKey] = curKey;
        queue.push(nb);
        steps.push({
          type: 'discover',
          from: cur,
          to: nb,
          visited: new Set(visited),
          queue: queue.map(n => key(n.r, n.c)),
          frontier: new Set(queue.map(n => key(n.r, n.c)))
        });
      }
    }
  }

  steps.push({ type: 'no_path', visited: new Set(visited), queue: [], frontier: new Set() });
  steps.push({ type: 'done', path: [], visited: new Set(visited), queue: [], frontier: new Set() });
  return steps;
}

export function mazeDFS(maze: number[][], rows: number, cols: number, start: Position, goal: Position): Step[] {
  const steps: Step[] = [];
  const visited = new Set<string>();
  const cameFrom: { [key: string]: string } = {};
  const stack: Position[] = [start];

  steps.push({
    type: 'init',
    node: start,
    visited: new Set(visited),
    stack: [key(start.r, start.c)],
    frontier: new Set([key(start.r, start.c)])
  });

  while (stack.length) {
    const cur = stack.pop()!;
    const curKey = key(cur.r, cur.c);

    if (visited.has(curKey)) continue;
    visited.add(curKey);

    steps.push({
      type: 'visit',
      node: cur,
      visited: new Set(visited),
      stack: stack.map(n => key(n.r, n.c)),
      frontier: new Set(stack.map(n => key(n.r, n.c)))
    });

    if (cur.r === goal.r && cur.c === goal.c) {
      const path = reconstructPath(cameFrom, start, goal);
      steps.push({ type: 'goal_found', node: cur, path: path.map(p => key(p.r, p.c)), visited: new Set(visited), stack: [], frontier: new Set() });
      steps.push({ type: 'done', path: path.map(p => key(p.r, p.c)), visited: new Set(visited), stack: [], frontier: new Set() });
      return steps;
    }

    for (const nb of getNeighbors(cur.r, cur.c, maze, rows, cols).reverse()) {
      const nbKey = key(nb.r, nb.c);
      if (!visited.has(nbKey)) {
        cameFrom[nbKey] = curKey;
        stack.push(nb);
        steps.push({
          type: 'push',
          from: cur,
          to: nb,
          visited: new Set(visited),
          stack: stack.map(n => key(n.r, n.c)),
          frontier: new Set(stack.map(n => key(n.r, n.c)))
        });
      }
    }
  }

  steps.push({ type: 'no_path', visited: new Set(visited), stack: [], frontier: new Set() });
  steps.push({ type: 'done', path: [], visited: new Set(visited), stack: [], frontier: new Set() });
  return steps;
}

export function mazeDijkstra(maze: number[][], rows: number, cols: number, start: Position, goal: Position): Step[] {
  const steps: Step[] = [];
  const dist: { [key: string]: number } = {};
  const cameFrom: { [key: string]: string } = {};
  const visited = new Set<string>();

  function edgeWeight(r: number, c: number): number {
    return maze[r][c] === 2 ? 3 : 1;
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dist[key(r,c)] = Infinity;
    }
  }
  const startKey = key(start.r, start.c);
  dist[startKey] = 0;

  let pq: [number, Position][] = [[0, start]];

  steps.push({
    type: 'init',
    node: start,
    dist: {...dist},
    visited: new Set(visited),
    pq: [[0, key(start.r, start.c)]],
    frontier: new Set([startKey])
  });

  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0]);
    const [curDist, cur] = pq.shift()!;
    const curKey = key(cur.r, cur.c);

    if (visited.has(curKey)) continue;
    visited.add(curKey);

    steps.push({
      type: 'visit',
      node: cur,
      dist: {...dist},
      visited: new Set(visited),
      pq: pq.map(([d,n]) => [d, key(n.r, n.c)]),
      frontier: new Set(pq.map(([,n]) => key(n.r, n.c)))
    });

    if (cur.r === goal.r && cur.c === goal.c) {
      const path = reconstructPath(cameFrom, start, goal);
      steps.push({ type: 'goal_found', node: cur, path: path.map(p => key(p.r, p.c)), dist: {...dist}, visited: new Set(visited), pq: [], frontier: new Set() });
      steps.push({ type: 'done', path: path.map(p => key(p.r, p.c)), dist: {...dist}, visited: new Set(visited), pq: [], frontier: new Set() });
      return steps;
    }

    for (const nb of getNeighbors(cur.r, cur.c, maze, rows, cols)) {
      const nbKey = key(nb.r, nb.c);
      const alt = dist[curKey] + edgeWeight(nb.r, nb.c);

      steps.push({
        type: 'relax',
        from: cur,
        to: nb,
        current: dist[nbKey],
        candidate: alt,
        dist: {...dist},
        visited: new Set(visited),
        pq: pq.map(([d,n]) => [d, key(n.r, n.c)]),
        frontier: new Set(pq.map(([,n]) => key(n.r, n.c)))
      });

      if (alt < dist[nbKey]) {
        dist[nbKey] = alt;
        cameFrom[nbKey] = curKey;
        pq.push([alt, nb]);
        steps.push({
          type: 'update',
          node: nb,
          newDist: alt,
          dist: {...dist},
          visited: new Set(visited),
          pq: pq.map(([d,n]) => [d, key(n.r, n.c)]),
          frontier: new Set(pq.map(([,n]) => key(n.r, n.c)))
        });
      }
    }
  }

  steps.push({ type: 'no_path', dist: {...dist}, visited: new Set(visited), pq: [], frontier: new Set() });
  steps.push({ type: 'done', path: [], dist: {...dist}, visited: new Set(visited), pq: [], frontier: new Set() });
  return steps;
}

export function mazeAStar(maze: number[][], rows: number, cols: number, start: Position, goal: Position, heuristicType: string = 'manhattan'): Step[] {
  const steps: Step[] = [];

  function heuristic(r: number, c: number): number {
    const dr = Math.abs(r - goal.r);
    const dc = Math.abs(c - goal.c);
    if (heuristicType === 'euclidean') return Math.sqrt(dr*dr + dc*dc);
    return dr + dc; // manhattan
  }

  const gScore: { [key: string]: number } = {};
  const fScore: { [key: string]: number } = {};
  const cameFrom: { [key: string]: string } = {};
  const openSet = new Set<string>();
  const closedSet = new Set<string>();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      gScore[key(r,c)] = Infinity;
      fScore[key(r,c)] = Infinity;
    }
  }

  const startKey = key(start.r, start.c);
  gScore[startKey] = 0;
  fScore[startKey] = heuristic(start.r, start.c);
  openSet.add(startKey);

  steps.push({
    type: 'init',
    node: start,
    goal,
    openSet: new Set(openSet),
    closedSet: new Set(closedSet),
    gScore: {...gScore},
    fScore: {...fScore},
    frontier: new Set(openSet)
  });

  while (openSet.size > 0) {
    let current: string | null = null;
    let minF = Infinity;
    for (const k of openSet) {
      if (fScore[k] < minF) {
        minF = fScore[k];
        current = k;
      }
    }

    const curPos = parseKey(current!);

    steps.push({
      type: 'process',
      node: curPos,
      openSet: new Set(openSet),
      closedSet: new Set(closedSet),
      gScore: {...gScore},
      fScore: {...fScore},
      frontier: new Set(openSet)
    });

    if (curPos.r === goal.r && curPos.c === goal.c) {
      const path = reconstructPath(cameFrom, start, goal);
      steps.push({ type: 'goal_found', node: curPos, path: path.map(p => key(p.r, p.c)), openSet: new Set(openSet), closedSet: new Set(closedSet), gScore: {...gScore}, fScore: {...fScore}, frontier: new Set() });
      steps.push({ type: 'done', path: path.map(p => key(p.r, p.c)), cost: gScore[current!], openSet: new Set(), closedSet: new Set(closedSet), gScore: {...gScore}, fScore: {...fScore}, frontier: new Set() });
      return steps;
    }

    openSet.delete(current!);
    closedSet.add(current!);

    for (const nb of getNeighbors(curPos.r, curPos.c, maze, rows, cols)) {
      const nbKey = key(nb.r, nb.c);
      if (closedSet.has(nbKey)) continue;

      const tentativeG = gScore[current!] + 1;

      steps.push({
        type: 'relax',
        from: curPos,
        to: nb,
        weight: 1,
        tentativeG,
        currentG: gScore[nbKey],
        openSet: new Set(openSet),
        closedSet: new Set(closedSet),
        gScore: {...gScore},
        fScore: {...fScore},
        frontier: new Set(openSet)
      });

      if (tentativeG < gScore[nbKey]) {
        cameFrom[nbKey] = current!;
        gScore[nbKey] = tentativeG;
        fScore[nbKey] = tentativeG + heuristic(nb.r, nb.c);
        openSet.add(nbKey);

        steps.push({
          type: 'update',
          node: nb,
          from: curPos,
          gScore: { ...gScore },
          fScore: { ...fScore },
          openSet: new Set(openSet),
          closedSet: new Set(closedSet),
          gScoreAll: {...gScore},
          fScoreAll: {...fScore},
          frontier: new Set(openSet)
        });
      }
    }
  }

  steps.push({ type: 'no_path', openSet: new Set(), closedSet: new Set(closedSet), gScore: {...gScore}, fScore: {...fScore}, frontier: new Set() });
  steps.push({ type: 'done', path: [], cost: Infinity, openSet: new Set(), closedSet: new Set(closedSet), gScore: {...gScore}, fScore: {...fScore}, frontier: new Set() });
  return steps;
}

export function generateMaze(rows: number, cols: number): number[][] {
  const R = rows % 2 === 0 ? rows + 1 : rows;
  const C = cols % 2 === 0 ? cols + 1 : cols;

  const maze: number[][] = Array.from({ length: R }, () => Array(C).fill(1));

  const visited = new Set<string>();

  function carve(r: number, c: number): void {
    visited.add(key(r, c));
    maze[r][c] = 0;

    const dirs: [number, number][] = [[-2, 0], [2, 0], [0, -2], [0, 2]];
dirs.sort(() => Math.random() - 0.5);
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr > 0 && nr < R - 1 && nc > 0 && nc < C - 1 && !visited.has(key(nr, nc))) {
        maze[r + dr/2][c + dc/2] = 0;
        carve(nr, nc);
      }
    }
  }

  carve(1, 1);

  maze[1][1] = 0;
  maze[R-2][C-2] = 0;

  return maze;
}

export function mazeBeamSearch(maze: number[][], rows: number, cols: number, start: Position, goal: Position, beamWidth: number = 3, heuristicType: string = 'manhattan'): Step[] {
  const steps: Step[] = [];

  function heuristic(r: number, c: number): number {
    const dr = Math.abs(r - goal.r);
    const dc = Math.abs(c - goal.c);
    if (heuristicType === 'euclidean') return Math.sqrt(dr*dr + dc*dc);
    return dr + dc; // manhattan
  }

  let beam: { path: Position[], cost: number, f: number }[] = [{ 
    path: [{ r: start.r, c: start.c }], 
    cost: 0, 
    f: heuristic(start.r, start.c) 
  }];

  const visited = new Set<string>();
  const cameFrom: { [key: string]: string } = {};

  steps.push({
    type: 'init',
    node: start,
    beamWidth,
    beam: beam.map(b => b.path.map(p => key(p.r, p.c))),
    visited: new Set(visited),
    frontier: new Set([key(start.r, start.c)])
  });

  let iteration = 0;
  const maxIterations = rows * cols;

  while (beam.length > 0 && iteration < maxIterations) {
    const newBeam: { path: Position[], cost: number, f: number }[] = [];
    const currentFrontier = new Set<string>();

    for (const { path, cost } of beam) {
      const current = path[path.length - 1];
      const currentKey = key(current.r, current.c);

      steps.push({
        type: 'process',
        node: current,
        beam: beam.map(b => b.path.map(p => key(p.r, p.c))),
        path: path.map(p => key(p.r, p.c)),
        visited: new Set(visited),
        frontier: new Set(beam.flatMap(b => b.path.map(p => key(p.r, p.c))))
      });

      if (current.r === goal.r && current.c === goal.c) {
        steps.push({
          type: 'goal_found',
          node: current,
          path: path.map(p => key(p.r, p.c)),
          beam: beam.map(b => b.path.map(p => key(p.r, p.c))),
          visited: new Set(visited)
        });

        steps.push({
          type: 'done',
          path: path.map(p => key(p.r, p.c)),
          cost: cost,
          visited: new Set(visited)
        });

        return steps;
      }

      visited.add(currentKey);

      const neighbors = getNeighbors(current.r, current.c, maze, rows, cols);
      for (const nb of neighbors) {
        const nbKey = key(nb.r, nb.c);
        
        if (path.some(p => p.r === nb.r && p.c === nb.c)) continue;

        const newPath = [...path, nb];
        const newCost = cost + 1; // Mỗi bước cost = 1
        const newF = newCost + heuristic(nb.r, nb.c);

        newBeam.push({
          path: newPath,
          cost: newCost,
          f: newF
        });

        cameFrom[nbKey] = currentKey;
        currentFrontier.add(nbKey);

        steps.push({
          type: 'expand',
          from: current,
          to: nb,
          path: newPath.map(p => key(p.r, p.c)),
          cost: newCost,
          f: newF,
          beam: newBeam.map(b => b.path.map(p => key(p.r, p.c))),
          visited: new Set(visited),
          frontier: new Set([...currentFrontier])
        });
      }
    }

    beam = newBeam
      .sort((a, b) => a.f - b.f)
      .slice(0, beamWidth);

    if (beam.length === 0) {
      steps.push({
        type: 'no_path',
        visited: new Set(visited),
        beam: [],
        frontier: new Set()
      });

      steps.push({
        type: 'done',
        path: [],
        cost: Infinity,
        visited: new Set(visited),
        beam: []
      });

      return steps;
    }

    steps.push({
      type: 'prune',
      beam: beam.map(b => b.path.map(p => key(p.r, p.c))),
      visited: new Set(visited),
      frontier: new Set(beam.flatMap(b => b.path.map(p => key(p.r, p.c))))
    });

    iteration++;
  }

  steps.push({
    type: 'no_path',
    visited: new Set(visited),
    beam: beam.map(b => b.path.map(p => key(p.r, p.c))),
    frontier: new Set()
  });

  steps.push({
    type: 'done',
    path: [],
    cost: Infinity,
    visited: new Set(visited),
    beam: []
  });

  return steps;
}

export function mazeTabuSearch(maze: number[][], rows: number, cols: number, start: Position, goal: Position, maxIterations: number = 100, tabuSize: number = 10, heuristicType: string = 'manhattan'): Step[] {
  const steps: Step[] = [];

  function heuristic(r: number, c: number): number {
    const dr = Math.abs(r - goal.r);
    const dc = Math.abs(c - goal.c);
    if (heuristicType === 'euclidean') return Math.sqrt(dr*dr + dc*dc);
    return dr + dc;
  }

  function generateRandomPath(): Position[] {
    const path: Position[] = [{ r: start.r, c: start.c }];
    let current = { r: start.r, c: start.c };
    const visitedSet = new Set<string>([key(current.r, current.c)]);
    
    while ((current.r !== goal.r || current.c !== goal.c) && path.length < rows * cols) {
      const neighbors = getNeighbors(current.r, current.c, maze, rows, cols);
      const unvisited = neighbors.filter(n => !visitedSet.has(key(n.r, n.c)));
      
      if (unvisited.length === 0) break;
      
      const next = unvisited[Math.floor(Math.random() * unvisited.length)];
      path.push(next);
      visitedSet.add(key(next.r, next.c));
      current = next;
    }
    
    return path;
  }

  function calculateCost(path: Position[]): number {
    return path.length - 1; // Mỗi bước cost = 1
  }

  function getNeighborSolutions(path: Position[]): Position[][] {
    const neighbors: Position[][] = [];
    for (let i = 1; i < path.length - 2; i++) {
      for (let j = i + 1; j < path.length - 1; j++) {
        const newPath = [...path];
        [newPath[i], newPath[j]] = [newPath[j], newPath[i]];
        
        let valid = true;
        for (let k = 0; k < newPath.length - 1; k++) {
          const from = newPath[k];
          const to = newPath[k + 1];
          const neighbors = getNeighbors(from.r, from.c, maze, rows, cols);
          if (!neighbors.some(n => n.r === to.r && n.c === to.c)) {
            valid = false;
            break;
          }
        }
        
        if (valid) {
          neighbors.push(newPath);
        }
      }
    }
    return neighbors;
  }

  let currentPath = generateRandomPath();
  let currentCost = calculateCost(currentPath);
  let bestPath = [...currentPath];
  let bestCost = currentCost;

  const tabuList: string[] = [];
  tabuList.push(currentPath.map(p => key(p.r, p.c)).join('|'));

  const visitedSet = new Set<string>();
  currentPath.forEach(p => visitedSet.add(key(p.r, p.c)));

  steps.push({
    type: 'init',
    start,
    goal,
    currentPath: currentPath.map(p => key(p.r, p.c)),
    currentCost,
    bestPath: bestPath.map(p => key(p.r, p.c)),
    bestCost,
    tabuList: [...tabuList],
    visited: new Set(visitedSet),
    frontier: new Set([key(start.r, start.c)])
  });

  let iteration = 0;

  while (iteration < maxIterations && currentPath.length > 0) {
    const neighbors = getNeighborSolutions(currentPath);
    
    if (neighbors.length === 0) break;

    const candidateNeighbors = neighbors.filter(
      p => !tabuList.includes(p.map(n => key(n.r, n.c)).join('|'))
    );

    let bestNeighbor: Position[] | null = null;
    let bestNeighborCost = Infinity;

    if (candidateNeighbors.length === 0) {
      for (const n of neighbors) {
        const cost = calculateCost(n);
        if (cost < bestNeighborCost) {
          bestNeighborCost = cost;
          bestNeighbor = n;
        }
      }
    } else {
      for (const n of candidateNeighbors) {
        const cost = calculateCost(n);
        if (cost < bestNeighborCost) {
          bestNeighborCost = cost;
          bestNeighbor = n;
        }
      }
    }

    if (!bestNeighbor) break;

    currentPath = bestNeighbor;
    currentCost = bestNeighborCost;

    tabuList.push(currentPath.map(p => key(p.r, p.c)).join('|'));
    if (tabuList.length > tabuSize) {
      tabuList.shift();
    }

    currentPath.forEach(p => visitedSet.add(key(p.r, p.c)));

    if (currentCost < bestCost) {
      bestPath = [...currentPath];
      bestCost = currentCost;
    }

    steps.push({
      type: 'explore',
      iteration: iteration + 1,
      node: currentPath[currentPath.length - 1],
      currentPath: currentPath.map(p => key(p.r, p.c)),
      currentCost,
      bestPath: bestPath.map(p => key(p.r, p.c)),
      bestCost,
      tabuList: [...tabuList],
      visited: new Set(visitedSet),
      frontier: new Set(currentPath.map(p => key(p.r, p.c))),
      path: currentPath.map(p => key(p.r, p.c))
    });

    const last = currentPath[currentPath.length - 1];
    if (last.r === goal.r && last.c === goal.c) {
      steps.push({
        type: 'goal_found',
        path: currentPath.map(p => key(p.r, p.c)),
        cost: currentCost,
        visited: new Set(visitedSet),
        bestPath: bestPath.map(p => key(p.r, p.c)),
        bestCost
      });
      
      steps.push({
        type: 'done',
        path: bestPath.map(p => key(p.r, p.c)),
        cost: bestCost,
        visited: new Set(visitedSet),
        frontier: new Set()
      });
      
      return steps;
    }

    iteration++;
  }

  steps.push({
    type: 'done',
    path: bestPath.map(p => key(p.r, p.c)),
    cost: bestCost,
    iterations: iteration,
    visited: new Set(visitedSet),
    frontier: new Set()
  });

  return steps;
}