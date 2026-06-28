// config.ts
export interface UF {
  id: number[];
  parent: number[];
  rank: number[];
  size: number[];
  count: number;
}

export interface Step {
  type: string;
  p?: number;
  q?: number;
  pid?: number;
  qid?: number;
  id?: number[];
  parent?: number[];
  size?: number[];
  rank?: number[];
  count?: number;
  i?: number;
  from?: number;
  to?: number;
  rp?: number;
  rq?: number;
  sp?: number;
  sq?: number;
  child?: number;
  root?: number;
  path?: number[];
  node?: number;
  old?: number;
  desc?: string;
}

export function createUF(n: number): UF {
  return {
    id: Array.from({ length: n }, (_, i) => i),
    parent: Array.from({ length: n }, (_, i) => i),
    rank: Array(n).fill(0),
    size: Array(n).fill(1),
    count: n,
  };
}