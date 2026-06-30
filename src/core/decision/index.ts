import {
  DataSample,
  DecisionTreeNode,
  LeafNode,
  InternalNode,
  DecisionStep,
  DatasetOptions,
  PredictFunction
} from './config';

export * from './config';


export function generateDataset(size: number = 14): DataSample[] {
  const ages = ['<=30', '31-40', '>40'];
  const incomes = ['high', 'medium', 'low'];
  const students = ['yes', 'no'];
  const creditRatings = ['fair', 'excellent'];
  
  const data: DataSample[] = [];
  for (let i = 0; i < size; i++) {
    data.push({
      id: i + 1,
      age: ages[Math.floor(Math.random() * ages.length)],
      income: incomes[Math.floor(Math.random() * incomes.length)],
      student: students[Math.floor(Math.random() * students.length)],
      credit_rating: creditRatings[Math.floor(Math.random() * creditRatings.length)],
      buy_computer: Math.random() > 0.4 ? 'yes' : 'no'
    });
  }
  return data;
}


function calculateEntropy(data: DataSample[], targetAttr: string = 'buy_computer'): number {
  const counts: Record<string, number> = {};
  data.forEach(row => {
    const val = row[targetAttr];
    counts[val] = (counts[val] || 0) + 1;
  });
  
  const total = data.length;
  let entropy = 0;
  for (const key in counts) {
    const p = counts[key] / total;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

function calculateGain(data: DataSample[], attr: string, targetAttr: string = 'buy_computer'): number {
  const totalEntropy = calculateEntropy(data, targetAttr);
  
  const attrValues: Record<string, DataSample[]> = {};
  data.forEach(row => {
    const val = row[attr];
    if (!attrValues[val]) attrValues[val] = [];
    attrValues[val].push(row);
  });
  
  let weightedEntropy = 0;
  for (const val in attrValues) {
    const subset = attrValues[val];
    const weight = subset.length / data.length;
    weightedEntropy += weight * calculateEntropy(subset, targetAttr);
  }
  
  return totalEntropy - weightedEntropy;
}

function findBestFeature(
  data: DataSample[],
  features: string[],
  targetAttr: string = 'buy_computer'
): { bestFeature: string | null; bestGain: number; gains: Record<string, number> } {
  let bestFeature: string | null = null;
  let bestGain = -Infinity;
  const gains: Record<string, number> = {};
  
  for (const feature of features) {
    const gain = calculateGain(data, feature, targetAttr);
    gains[feature] = gain;
    if (gain > bestGain) {
      bestGain = gain;
      bestFeature = feature;
    }
  }
  
  return { bestFeature, bestGain, gains };
}

export function buildDecisionTree(
  data: DataSample[],
  features: string[],
  targetAttr: string = 'buy_computer',
  steps: DecisionStep[] = [],
  depth: number = 0
): DecisionTreeNode {
  const targetValues = data.map(row => row[targetAttr]);
  const uniqueTargets = [...new Set(targetValues)];
  
  steps.push({
    type: 'check_stop',
    depth,
    dataSize: data.length,
    uniqueTargets,
    isPure: uniqueTargets.length === 1,
    desc: `Kiểm tra dừng: có ${uniqueTargets.length} giá trị đích khác nhau`
  });
  
  if (uniqueTargets.length === 1) {
    steps.push({
      type: 'leaf',
      depth,
      value: uniqueTargets[0],
      desc: `Tạo lá: ${uniqueTargets[0]}`
    });
    return { type: 'leaf', value: uniqueTargets[0], depth };
  }
  
  if (features.length === 0) {
    const mostCommon = targetValues.sort((a, b) => 
      targetValues.filter(v => v === a).length - targetValues.filter(v => v === b).length
    ).pop() || 'no';
    steps.push({
      type: 'leaf',
      depth,
      value: mostCommon,
      desc: `Hết feature, tạo lá: ${mostCommon}`
    });
    return { type: 'leaf', value: mostCommon, depth };
  }
  
  const entropy = calculateEntropy(data, targetAttr);
  steps.push({
    type: 'calculate_entropy',
    depth,
    entropy,
    desc: `Tính Entropy: ${entropy.toFixed(3)}`
  });
  
  const { bestFeature, bestGain, gains } = findBestFeature(data, features, targetAttr);
  
  steps.push({
    type: 'calculate_gain',
    depth,
    bestFeature: bestFeature || undefined,
    bestGain,
    gains,
    desc: `Feature tốt nhất: "${bestFeature}" (Gain=${bestGain.toFixed(3)})`
  });
  
  if (!bestFeature) {
    const mostCommon = targetValues.sort((a, b) => 
      targetValues.filter(v => v === a).length - targetValues.filter(v => v === b).length
    ).pop() || 'no';
    steps.push({
      type: 'leaf',
      depth,
      value: mostCommon,
      desc: `Không tìm được feature, tạo lá: ${mostCommon}`
    });
    return { type: 'leaf', value: mostCommon, depth };
  }
  
  const remainingFeatures = features.filter(f => f !== bestFeature);
  const uniqueValues = [...new Set(data.map(row => row[bestFeature]))];
  
  steps.push({
    type: 'split',
    depth,
    feature: bestFeature,
    values: uniqueValues,
    desc: `Split theo "${bestFeature}" thành ${uniqueValues.length} nhánh`
  });
  
  const tree: InternalNode = {
    type: 'node',
    feature: bestFeature,
    branches: {},
    depth
  };
  
  for (const value of uniqueValues) {
    const subset = data.filter(row => row[bestFeature] === value);
    steps.push({
      type: 'branch',
      depth: depth + 1,
      feature: bestFeature,
      value,
      subsetSize: subset.length,
      desc: `Nhánh "${value}" (${subset.length} mẫu)`
    });
    
    const child = buildDecisionTree(
      subset, 
      remainingFeatures, 
      targetAttr, 
      steps, 
      depth + 1
    );
    tree.branches[value] = child;
  }
  
  return tree;
}


export function decisionTreeID3(
  dataset: DataSample[],
  targetAttr: string = 'buy_computer'
): DecisionStep[] {
  const steps: DecisionStep[] = [];
  const features = ['age', 'income', 'student', 'credit_rating'];
  
  steps.push({
    type: 'init',
    dataset: dataset.map(row => ({ ...row })),
    features: [...features],
    targetAttr,
    totalSamples: dataset.length,
    desc: `Khởi tạo với ${dataset.length} mẫu, ${features.length} features`
  });
  
  const targetCounts: Record<string, number> = {};
  dataset.forEach(row => {
    const val = row[targetAttr];
    targetCounts[val] = (targetCounts[val] || 0) + 1;
  });
  steps.push({
    type: 'target_distribution',
    targetCounts,
    desc: `Phân phối đích: ${Object.entries(targetCounts).map(([k, v]) => `${k}: ${v}`).join(', ')}`
  });
  
  const tree = buildDecisionTree(dataset, features, targetAttr, steps);
  
  steps.push({
    type: 'done',
    tree,
    desc: `✓ Cây quyết định hoàn chỉnh!`
  });
  
  return steps;
}


export function predict(tree: DecisionTreeNode, sample: DataSample): string {
  if (tree.type === 'leaf') {
    return tree.value || 'unknown';
  }
  
  const internalTree = tree as InternalNode;
  const value = sample[internalTree.feature || ''];
  
  if (value !== undefined && internalTree.branches && internalTree.branches[value]) {
    return predict(internalTree.branches[value], sample);
  }
  
  if (internalTree.branches) {
    const firstKey = Object.keys(internalTree.branches)[0];
    if (firstKey) {
      return predict(internalTree.branches[firstKey], sample);
    }
  }
  
  return 'unknown';
}


export { calculateEntropy, calculateGain, findBestFeature };