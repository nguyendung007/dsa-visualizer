// config.ts
export interface AlgorithmConfig {
  // Hill Climbing không có config đặc biệt
}

export interface SimulatedAnnealingConfig {
  T0?: number;
  alpha?: number;
  minT?: number;
  maxIter?: number;
  seed?: number;
}

export interface GeneticAlgorithmConfig {
  popSize?: number;
  generations?: number;
  mutationRate?: number;
  seed?: number;
}