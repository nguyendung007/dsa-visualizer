export interface LLNode {
  id: number;
  val: any;
  next: number | null;
  prev: number | null;
}

export interface LLBuildResult {
  head: number | null;
  nodes: LLNode[];
}

export interface LLSnapshot {
  nodes: LLNode[];
  type: string;
}

export interface LLOperationStep {
  nodes: LLNode[];
  type: string;
  op: string;
  highlight?: number;
  head?: number;
  desc: string;
}

export interface LLInsertResult {
  nodes: LLNode[];
  steps: LLOperationStep[];
}

export type LinkedListType = 'singly' | 'doubly' | 'circular';

export interface LLInsertHeadParams {
  nodes: LLNode[];
  val: any;
  type: LinkedListType;
}

export interface LLInsertTailParams {
  nodes: LLNode[];
  val: any;
  type: LinkedListType;
}

export interface LLInsertAtParams {
  nodes: LLNode[];
  val: any;
  pos: number;
  type: LinkedListType;
}

export interface LLDeleteParams {
  nodes: LLNode[];
  val: any;
  type: LinkedListType;
  pos?: number | null;
}

export interface LLSearchParams {
  nodes: LLNode[];
  val: any;
  type: LinkedListType;
  startPos?: number;
}

export interface LLReverseParams {
  nodes: LLNode[];
  type: LinkedListType;
}