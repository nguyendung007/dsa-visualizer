// ─── Decision Tree Index ────────────────────────────────────────────────────

// Sample dataset: mua máy tính
export function generateDataset(size = 14) {
  const ages = ['<=30', '31-40', '>40'];
  const incomes = ['high', 'medium', 'low'];
  const students = ['yes', 'no'];
  const creditRatings = ['fair', 'excellent'];
  
  const data = [];
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

// Hàm tính Entropy
function calculateEntropy(data, targetAttr = 'buy_computer') {
  const counts = {};
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

// Hàm tính Information Gain
function calculateGain(data, attr, targetAttr = 'buy_computer') {
  const totalEntropy = calculateEntropy(data, targetAttr);
  
  const attrValues = {};
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

// Hàm tìm feature tốt nhất để split
function findBestFeature(data, features, targetAttr = 'buy_computer') {
  let bestFeature = null;
  let bestGain = -Infinity;
  const gains = {};
  
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

// Hàm xây dựng cây quyết định với các bước
export function buildDecisionTree(data, features, targetAttr = 'buy_computer', steps = [], depth = 0) {
  // Kiểm tra điều kiện dừng
  const targetValues = data.map(row => row[targetAttr]);
  const uniqueTargets = [...new Set(targetValues)];
  
  // Step: Kiểm tra điều kiện dừng
  steps.push({
    type: 'check_stop',
    depth,
    dataSize: data.length,
    uniqueTargets,
    isPure: uniqueTargets.length === 1,
    desc: `Kiểm tra dừng: có ${uniqueTargets.length} giá trị đích khác nhau`
  });
  
  // Nếu tất cả cùng 1 lớp -> lá
  if (uniqueTargets.length === 1) {
    steps.push({
      type: 'leaf',
      depth,
      value: uniqueTargets[0],
      desc: `Tạo lá: ${uniqueTargets[0]}`
    });
    return { type: 'leaf', value: uniqueTargets[0], depth };
  }
  
  // Nếu hết feature -> lá với giá trị phổ biến nhất
  if (features.length === 0) {
    const mostCommon = targetValues.sort((a,b) => 
      targetValues.filter(v => v === a).length - targetValues.filter(v => v === b).length
    ).pop();
    steps.push({
      type: 'leaf',
      depth,
      value: mostCommon,
      desc: `Hết feature, tạo lá: ${mostCommon}`
    });
    return { type: 'leaf', value: mostCommon, depth };
  }
  
  // Step: Tính toán
  const entropy = calculateEntropy(data, targetAttr);
  steps.push({
    type: 'calculate_entropy',
    depth,
    entropy,
    desc: `Tính Entropy: ${entropy.toFixed(3)}`
  });
  
  // Tìm feature tốt nhất
  const { bestFeature, bestGain, gains } = findBestFeature(data, features, targetAttr);
  
  // Step: Information Gain
  steps.push({
    type: 'calculate_gain',
    depth,
    bestFeature,
    bestGain,
    gains,
    desc: `Feature tốt nhất: "${bestFeature}" (Gain=${bestGain.toFixed(3)})`
  });
  
  // Split data
  const remainingFeatures = features.filter(f => f !== bestFeature);
  const branches = {};
  const uniqueValues = [...new Set(data.map(row => row[bestFeature]))];
  
  // Step: Split
  steps.push({
    type: 'split',
    depth,
    feature: bestFeature,
    values: uniqueValues,
    desc: `Split theo "${bestFeature}" thành ${uniqueValues.length} nhánh`
  });
  
  const tree = {
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

// Export chính
export function decisionTreeID3(dataset, targetAttr = 'buy_computer') {
  const steps = [];
  const features = ['age', 'income', 'student', 'credit_rating'];
  
  // Step 0: Init
  steps.push({
    type: 'init',
    dataset: dataset.map(row => ({ ...row })),
    features: [...features],
    targetAttr,
    totalSamples: dataset.length,
    desc: `Khởi tạo với ${dataset.length} mẫu, ${features.length} features`
  });
  
  // Hiển thị phân phối target
  const targetCounts = {};
  dataset.forEach(row => {
    const val = row[targetAttr];
    targetCounts[val] = (targetCounts[val] || 0) + 1;
  });
  steps.push({
    type: 'target_distribution',
    targetCounts,
    desc: `Phân phối đích: ${Object.entries(targetCounts).map(([k,v]) => `${k}: ${v}`).join(', ')}`
  });
  
  // Xây dựng cây
  const tree = buildDecisionTree(dataset, features, targetAttr, steps);
  
  // Final step
  steps.push({
    type: 'done',
    tree,
    desc: `✓ Cây quyết định hoàn chỉnh!`
  });
  
  return steps;
}

// ─── Utils ──────────────────────────────────────────────────────────────────
export function predict(tree, sample) {
  if (tree.type === 'leaf') return tree.value;
  
  const value = sample[tree.feature];
  if (tree.branches[value]) {
    return predict(tree.branches[value], sample);
  }
  
  // Fallback: chọn nhánh đầu tiên
  const firstKey = Object.keys(tree.branches)[0];
  return predict(tree.branches[firstKey], sample);
}