
export interface StackOperation {
  type: 'push' | 'pop' | 'peek';
  val?: any;
}

export interface QueueOperation {
  type: 'enqueue' | 'dequeue' | 'peek';
  val?: any;
}

export interface PriorityQueueOperation {
  type: 'insert' | 'extractMin' | 'peek';
  val?: any;
  priority?: number;
}

export interface HashTableOperation {
  type: 'insert' | 'search' | 'delete';
  key: string;
  val?: any;
}

export interface StackStep {
  stack: any[];
  op: string;
  val: any;
  top: number;
  highlight?: number;
  action?: string;
  error?: string;
}

export interface QueueStep {
  queue: any[];
  op: string;
  val: any;
  front: number;
  rear: number;
  highlight?: number;
  action?: string;
  error?: string;
}

export interface PriorityQueueStep {
  heap: Array<{ val: any; priority: number }>;
  op: string;
  val?: any;
  priority?: number;
  highlight?: number;
  swap?: [number, number];
  error?: string;
}

export interface HashTableStep {
  table: any[];
  op: string;
  key?: string;
  val?: any;
  idx?: number;
  baseIdx?: number;
  probeMode?: string;
  formula?: string;
  probeCount?: number;
  probing?: number;
  updated?: boolean;
  reusedTombstone?: boolean;
  error?: string;
}

export type Step = StackStep | QueueStep | PriorityQueueStep | HashTableStep;

export type HashFunction = (key: string) => number;

export type StackOpsFunction = (operations: StackOperation[]) => StackStep[];
export type QueueOpsFunction = (operations: QueueOperation[]) => QueueStep[];
export type PriorityQueueOpsFunction = (operations: PriorityQueueOperation[]) => PriorityQueueStep[];
export type HashTableOpsFunction = (
  operations: HashTableOperation[],
  tableSize?: number,
  hashFormula?: string,
  probeMode?: string
) => HashTableStep[];