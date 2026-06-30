export interface FrameSlot {
  type: string;
  default: any;
  value: any;
}

export interface Frame {
  name: string;
  slots: Record<string, FrameSlot>;
  parent: string | null;
  instances: Record<string, Record<string, any>>;
}

export interface CreateFrameOp {
  type: 'create_frame';
  name: string;
  slots?: Record<string, FrameSlot>;
  parent?: string | null;
}

export interface AddSlotOp {
  type: 'add_slot';
  frame: string;
  slot: string;
  slotType?: string;
  defaultValue?: any;
}

export interface FillSlotOp {
  type: 'fill_slot';
  frame: string;
  instance: string;
  slot: string;
  value: any;
}

export interface InheritOp {
  type: 'inherit';
  frame: string;
}

export interface ShowSlotsOp {
  type: 'show_slots';
  frame: string;
}

export type FrameOperation = CreateFrameOp | AddSlotOp | FillSlotOp | InheritOp | ShowSlotsOp;

export interface FrameStep {
  type: string;
  [key: string]: any;
}

export interface ConceptNode {
  id: string;
  label?: string;
}

export interface ConceptEdge {
  from: string;
  to: string;
  label?: string;
}

export interface ConceptGraph {
  nodes: string[];
  edges: ConceptEdge[];
}

export interface AddNodeOp {
  type: 'add_node';
  node: string;
}

export interface AddEdgeOp {
  type: 'add_edge';
  from: string;
  to: string;
  label?: string;
}

export interface TraverseOp {
  type: 'traverse';
  from: string;
  to: string;
  relation?: string;
}

export interface FindAncestorsOp {
  type: 'find_ancestors';
  node: string;
  relation?: string;
}

export interface FindDescendantsOp {
  type: 'find_descendants';
  node: string;
  relation?: string;
}

export type ConceptOperation = AddNodeOp | AddEdgeOp | TraverseOp | FindAncestorsOp | FindDescendantsOp;

export interface SemanticNetwork {
  concepts: string[];
  relations: ConceptEdge[];
  instances: Record<string, any>[];
}

export interface AddConceptOp {
  type: 'add_concept';
  concept: string;
}

export interface AddRelationOp {
  type: 'add_relation';
  from: string;
  to: string;
  label?: string;
}

export interface SpreadOp {
  type: 'spread';
  node: string;
  strength?: number;
  decay?: number;
  maxHops?: number;
}

export type SemanticOperation = AddConceptOp | AddRelationOp | SpreadOp;

export interface SemanticStep {
  type: string;
  [key: string]: any;
}