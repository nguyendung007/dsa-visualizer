// config.ts
export interface Position {
  r: number;
  c: number;
}

export interface Step {
  type: string;
  node?: Position;
  path?: string[];
  visited?: Set<string>;
  queue?: string[];
  stack?: string[];
  frontier?: Set<string>;
  from?: Position;
  to?: Position;
  dist?: { [key: string]: number };
  pq?: [number, string][];
  current?: number;
  candidate?: number;
  openSet?: Set<string>;
  closedSet?: Set<string>;
  gScore?: { [key: string]: number };
  fScore?: { [key: string]: number };
  gScoreAll?: { [key: string]: number };
  fScoreAll?: { [key: string]: number };
  cost?: number;
  beamWidth?: number;
  beam?: string[][];
  iteration?: number;
  currentPath?: string[];
  currentCost?: number;
  bestPath?: string[];
  bestCost?: number;
  tabuList?: string[];
  iterations?: number;
  tentativeG?: number;
  currentG?: number;
  weight?: number;
  newDist?: number;
  goal?: Position;
  start?: Position;
  [key: string]: any;
}

export type MazeAlgorithm = (
  maze: number[][],
  rows: number,
  cols: number,
  start: Position,
  goal: Position,
  ...args: any[]
) => Step[];