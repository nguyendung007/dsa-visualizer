// config.ts
// config.ts
export interface GraphNode {
  to: string;
  weight?: number;
}

export interface Graph {
  [key: string]: GraphNode[];
}

export interface Edge {
  from: string;
  to: string;
  weight: number;
}

export interface Step {
  type: string;
  [key: string]: any; // Giúp linh hoạt lưu trữ các thuộc tính log bổ sung
}

export interface BFSStep extends Step {
  node?: string;
  queue: string[];
  stack: string[];
  visited?: Set<string>;
  from?: string;
  to?: string;
}

export interface DFSStep extends Step {
  node?: string;
  stack: string[];
  queue: string[];
  visited?: Set<string>;
  from?: string;
  to?: string;
}

export interface DijkstraStep extends Step {
  node?: string;
  dist?: { [key: string]: number } | number; // Hỗ trợ cả object dist_all và số dist lẻ
  dist_all?: { [key: string]: number };
  visited?: Set<string>;
  pq: [string, number][];
  from?: string;
  to?: string;
  current?: string | number; // current trong dijkstra là tên nút (string)
  candidate?: number;
  prev?: { [key: string]: string };
}

export interface KruskalStep extends Step {
  edge?: Edge;
  mst: Edge[];
  queue: any[];
  stack: any[];
  reason?: string;
}

export interface BellmanFordStep extends Step {
  dist: { [key: string]: number };
  dist_all?: { [key: string]: number }; // Thêm dist_all vào đây
  prev?: { [key: string]: string | null };
  iteration?: number;
  from?: string;
  to?: string;
  current?: number;
  candidate?: number;
  node?: string;
  pq: any[];
  hasNegCycle?: boolean;
}

export interface PrimStep extends Step {
  node?: string;
  inMST: Set<string>;
  pq: [number, string, string][];
  mst: Edge[];
  desc?: string;
  from?: string;
  to?: string;
  cost?: number;
}

export interface KosarajuStep extends Step {
  phase?: number;
  desc?: string;
  node?: string;
  visited?: Set<string>;
  visited2?: Set<string>;
  finishOrder?: string[];
  scc?: string[];
  sccs?: string[][];
  from?: string;
  to?: string;
}

export interface TopoStep extends Step {
  desc?: string;
  node?: string;
  temp?: Set<string>;
  visited?: Set<string>;
  stack?: string[];
  from?: string;
  to?: string;
  order?: string[];
  hasCycle?: boolean;
  inDegree?: { [key: string]: number }; // Đảm bảo trường này tồn tại
  queue?: string[];
}

// Giữ nguyên các phần dưới của config.ts (AStarStep, BestFirstStep, BeamStep, TabuStep...)

// A* Search
export interface AStarStep extends Step {
  start?: string;
  goal?: string;
  node?: string;
  from?: string;
  to?: string;
  path?: string[];
  cost?: number;
  openSet?: Set<string>;
  closedSet?: Set<string>;
  gScore?: { [key: string]: number };
  fScore?: { [key: string]: number };
  gScoreAll?: { [key: string]: number };
  fScoreAll?: { [key: string]: number };
  cameFrom?: { [key: string]: string };
  queue: any[];
  stack: any[];
  currentG?: number;
  tentativeG?: number;
  weight?: number;
}

// Best First Search
export interface BestFirstStep extends Step {
  start?: string;
  goal?: string;
  node?: string;
  from?: string;
  to?: string;
  path?: string[];
  cost?: number;
  openSet?: Set<string>;
  closedSet?: Set<string>;
  fScore?: { [key: string]: number };
  fScoreAll?: { [key: string]: number };
  cameFrom?: { [key: string]: string };
  queue: any[];
  stack: any[];
}

// Beam Search
export interface BeamStep extends Step {
  start?: string;
  goal?: string;
  node?: string;
  from?: string;
  to?: string;
  path?: string[];
  cost?: number;
  beamWidth?: number;
  beam?: string[];
  openSet?: Set<string>;
  closedSet?: Set<string>;
  gScore?: { [key: string]: number };
  gScoreAll?: { [key: string]: number };
  fScore?: { [key: string]: number };
  fScoreAll?: { [key: string]: number };
  cameFrom?: { [key: string]: string };
  queue: any[];
  stack: any[];
}

// Tabu Search
export interface TabuStep extends Step {
  start?: string;
  goal?: string;
  node?: string;
  from?: string;
  maxIterations?: number;
  tabuSize?: number;
  currentPath?: string[];
  currentCost?: number;
  bestPath?: string[];
  bestCost?: number;
  tabuList?: string[];
  visited?: Set<string>;
  iteration?: number;
  foundGoal?: boolean;
  gScore?: { [key: string]: number };
  fScore?: { [key: string]: number };
  queue: any[];
  stack: any[];
}