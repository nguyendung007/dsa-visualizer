
export interface DataSample {
  id?: number;
  age: string;
  income: string;
  student: string;
  credit_rating: string;
  buy_computer: string;
  [key: string]: any; // Cho phép thêm các thuộc tính khác
}

export interface DecisionTreeNode {
  type: 'node' | 'leaf';
  feature?: string;
  value?: string;
  branches?: Record<string, DecisionTreeNode>;
  depth?: number;
}

export interface LeafNode extends DecisionTreeNode {
  type: 'leaf';
  value: string;
  depth?: number;
}

export interface InternalNode extends DecisionTreeNode {
  type: 'node';
  feature: string;
  branches: Record<string, DecisionTreeNode>;
  depth?: number;
}

export interface DecisionStep {
  type: string;
  desc?: string;
  depth?: number;
  dataSize?: number;
  uniqueTargets?: string[];
  isPure?: boolean;
  value?: string;
  entropy?: number;
  bestFeature?: string;
  bestGain?: number;
  gains?: Record<string, number>;
  feature?: string;
  values?: string[];
  subsetSize?: number;
  targetCounts?: Record<string, number>;
  dataset?: DataSample[];
  features?: string[];
  targetAttr?: string;
  totalSamples?: number;
  tree?: DecisionTreeNode;
}

export interface DatasetOptions {
  size?: number;
  seed?: number;
}

export type PredictFunction = (tree: DecisionTreeNode, sample: DataSample) => string;