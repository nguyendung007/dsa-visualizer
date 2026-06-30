export interface AlgorithmConfig {
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