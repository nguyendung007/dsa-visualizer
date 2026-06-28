// ─── Naive Bayes Config ────────────────────────────────────────────────────

export interface DataRow {
  id: number;
  age: string;
  income: string;
  student: string;
  credit_rating: string;
  buy_computer: string;
}

export interface SampleData {
  age?: string;
  income?: string;
  student?: string;
  credit_rating?: string;
}

export interface LikelihoodDetails {
  feature: string;
  value: string;
  likelihood: number;
}

export interface ClassResult {
  prior: number;
  likelihoods: number[];
  posterior: number;
  details: LikelihoodDetails[];
}

export interface PredictionResult {
  predicted: string | null;
  results: Record<string, ClassResult>;
  features: string[];
}

export interface LikelihoodMatrixValue {
  [className: string]: number;
}

export interface LikelihoodMatrixValueByValue {
  [value: string]: LikelihoodMatrixValue;
}

export interface LikelihoodMatrix {
  [feature: string]: LikelihoodMatrixValueByValue;
}

export interface StepInit {
  type: 'init';
  dataset: DataRow[];
  features: string[];
  classes: string[];
  targetAttr: string;
  totalSamples: number;
  desc: string;
}

export interface StepTargetDistribution {
  type: 'target_distribution';
  targetCounts: Record<string, number>;
  desc: string;
}

export interface StepPrior {
  type: 'prior';
  prior: Record<string, number>;
  desc: string;
}

export interface StepLikelihoodMatrix {
  type: 'likelihood_matrix';
  likelihoodMatrix: LikelihoodMatrix;
  desc: string;
}

export interface StepPredictSample {
  type: 'predict_sample';
  sample: SampleData;
  actualClass: string;
  desc: string;
}

export interface StepCalculateClass {
  type: 'calculate_class';
  class: string;
  prior: number;
  likelihoods: number[];
  details: LikelihoodDetails[];
  posterior: number;
  desc: string;
}

export interface StepPredictionResult {
  type: 'prediction_result';
  predicted: string | null;
  actual: string;
  allResults: Record<string, ClassResult>;
  isCorrect: boolean;
  desc: string;
}

export interface StepDone {
  type: 'done';
  desc: string;
}

export type Step = 
  | StepInit
  | StepTargetDistribution
  | StepPrior
  | StepLikelihoodMatrix
  | StepPredictSample
  | StepCalculateClass
  | StepPredictionResult
  | StepDone;