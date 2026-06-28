// ─── Naive Bayes Index ────────────────────────────────────────────────────

import { DataRow, SampleData, PredictionResult, Step, LikelihoodMatrix, LikelihoodDetails, ClassResult } from './config';

// Sample dataset: mua máy tính (giống Decision Tree để so sánh)
export function generateDataset(size: number = 14): DataRow[] {
  const ages = ['<=30', '31-40', '>40'];
  const incomes = ['high', 'medium', 'low'];
  const students = ['yes', 'no'];
  const creditRatings = ['fair', 'excellent'];
  
  // Tạo dữ liệu có phân phối hợp lý
  const data: DataRow[] = [];
  for (let i = 0; i < size; i++) {
    // Tạo dữ liệu có xu hướng (không hoàn toàn ngẫu nhiên)
    const age = ages[Math.floor(Math.random() * ages.length)];
    const income = incomes[Math.floor(Math.random() * incomes.length)];
    const student = students[Math.floor(Math.random() * students.length)];
    const credit = creditRatings[Math.floor(Math.random() * creditRatings.length)];
    
    // Quyết định mua máy tính dựa trên một số quy tắc đơn giản
    let buy: string = 'no';
    if (student === 'yes' && (income === 'medium' || income === 'high')) {
      buy = 'yes';
    } else if (credit === 'excellent' && age !== '>40') {
      buy = 'yes';
    } else if (income === 'high' && credit === 'excellent') {
      buy = 'yes';
    } else if (Math.random() < 0.3) { // Thêm nhiễu
      buy = 'yes';
    }
    
    data.push({
      id: i + 1,
      age,
      income,
      student,
      credit_rating: credit,
      buy_computer: buy
    });
  }
  return data;
}

// Hàm tính xác suất prior
function calculatePrior(data: DataRow[], targetAttr: string = 'buy_computer'): Record<string, number> {
  const counts: Record<string, number> = {};
  data.forEach(row => {
    const val = row[targetAttr as keyof DataRow] as string;
    counts[val] = (counts[val] || 0) + 1;
  });
  
  const total = data.length;
  const prior: Record<string, number> = {};
  for (const key in counts) {
    prior[key] = counts[key] / total;
  }
  return prior;
}

// Hàm tính likelihood P(feature_value | class)
function calculateLikelihood(
  data: DataRow[], 
  feature: string, 
  featureValue: string, 
  classValue: string, 
  targetAttr: string = 'buy_computer'
): number {
  // Đếm số mẫu thuộc class
  const classCount = data.filter(row => row[targetAttr as keyof DataRow] === classValue).length;
  if (classCount === 0) return 0;
  
  // Đếm số mẫu có feature = featureValue và thuộc class
  const featureClassCount = data.filter(
    row => row[targetAttr as keyof DataRow] === classValue && row[feature as keyof DataRow] === featureValue
  ).length;
  
  return featureClassCount / classCount;
}

// Hàm tính xác suất hậu nghiệm P(class | features)
function calculatePosterior(prior: number, likelihoods: number[]): number {
  let posterior = prior;
  for (const l of likelihoods) {
    posterior *= l;
  }
  return posterior;
}

// Hàm dự đoán cho 1 sample
export function predictNaive(
  data: DataRow[], 
  sample: SampleData, 
  targetAttr: string = 'buy_computer'
): PredictionResult {
  const classes = [...new Set(data.map(row => row[targetAttr as keyof DataRow] as string))];
  const features = Object.keys(sample).filter(key => key !== targetAttr);
  
  const results: Record<string, ClassResult> = {};
  
  for (const cls of classes) {
    // Tính prior
    const prior = calculatePrior(data, targetAttr)[cls] || 0;
    
    // Tính likelihood cho từng feature
    const likelihoods: number[] = [];
    const details: LikelihoodDetails[] = [];
    for (const feature of features) {
      const value = sample[feature as keyof SampleData] as string;
      const likelihood = calculateLikelihood(data, feature, value, cls, targetAttr);
      likelihoods.push(likelihood);
      details.push({
        feature,
        value,
        likelihood
      });
    }
    
    // Tính posterior
    const posterior = calculatePosterior(prior, likelihoods);
    results[cls] = {
      prior,
      likelihoods,
      posterior,
      details
    };
  }
  
  // Tìm class có posterior lớn nhất
  let predicted: string | null = null;
  let maxPosterior = -Infinity;
  for (const cls in results) {
    if (results[cls].posterior > maxPosterior) {
      maxPosterior = results[cls].posterior;
      predicted = cls;
    }
  }
  
  return {
    predicted,
    results,
    features
  };
}

// Hàm chính: Naive Bayes với từng bước
export function naiveBayes(dataset: DataRow[], targetAttr: string = 'buy_computer'): Step[] {
  const steps: Step[] = [];
  const features = ['age', 'income', 'student', 'credit_rating'];
  const classes = [...new Set(dataset.map(row => row[targetAttr as keyof DataRow] as string))];
  
  // Step 0: Init
  steps.push({
    type: 'init',
    dataset: dataset.map(row => ({ ...row })),
    features: [...features],
    classes: [...classes],
    targetAttr,
    totalSamples: dataset.length,
    desc: `Khởi tạo với ${dataset.length} mẫu, ${features.length} features, ${classes.length} classes`
  });
  
  // Step 1: Hiển thị phân phối target
  const targetCounts: Record<string, number> = {};
  dataset.forEach(row => {
    const val = row[targetAttr as keyof DataRow] as string;
    targetCounts[val] = (targetCounts[val] || 0) + 1;
  });
  
  steps.push({
    type: 'target_distribution',
    targetCounts,
    desc: `Phân phối đích: ${Object.entries(targetCounts).map(([k,v]) => `${k}: ${v}`).join(', ')}`
  });
  
  // Step 2: Tính Prior cho từng class
  const prior = calculatePrior(dataset, targetAttr);
  steps.push({
    type: 'prior',
    prior,
    desc: `Prior probabilities: ${Object.entries(prior).map(([k,v]) => `P(${k}) = ${v.toFixed(3)}`).join(', ')}`
  });
  
  // Step 3: Tính Likelihood cho từng feature và class
  const likelihoodMatrix: LikelihoodMatrix = {};
  for (const feature of features) {
    likelihoodMatrix[feature] = {};
    const uniqueValues = [...new Set(dataset.map(row => row[feature as keyof DataRow] as string))];
    for (const value of uniqueValues) {
      likelihoodMatrix[feature][value] = {};
      for (const cls of classes) {
        const l = calculateLikelihood(dataset, feature, value, cls, targetAttr);
        likelihoodMatrix[feature][value][cls] = l;
      }
    }
  }
  
  steps.push({
    type: 'likelihood_matrix',
    likelihoodMatrix,
    desc: '✅ Đã tính ma trận Likelihood cho tất cả features và classes'
  });
  
  // Step 4: Chọn sample để dự đoán (lấy sample đầu tiên làm ví dụ)
  const sampleIndex = Math.floor(Math.random() * Math.min(dataset.length, 5));
  const sample = dataset[sampleIndex];
  const sampleData: SampleData = { ...sample };
  delete (sampleData as any)[targetAttr];
  delete (sampleData as any).id;
  
  steps.push({
    type: 'predict_sample',
    sample: sampleData,
    actualClass: sample[targetAttr as keyof DataRow] as string,
    desc: `🎯 Dự đoán cho sample: ${Object.entries(sampleData).map(([k,v]) => `${k}=${v}`).join(', ')}`
  });
  
  // Step 5: Tính toán chi tiết cho sample
  const prediction = predictNaive(dataset, sampleData, targetAttr);
  
  // Thêm từng bước tính toán cho sample
  for (const cls of classes) {
    const result = prediction.results[cls];
    const priorStr = result.prior.toFixed(4);
    const likelihoodStr = result.likelihoods.map(l => l.toFixed(4)).join(' × ');
    const posteriorStr = result.posterior.toFixed(6);
    
    steps.push({
      type: 'calculate_class',
      class: cls,
      prior: result.prior,
      likelihoods: result.likelihoods,
      details: result.details,
      posterior: result.posterior,
      desc: `📊 Class "${cls}": P(${cls}) = ${priorStr}, P(features|${cls}) = ${likelihoodStr}, P(${cls}|features) = ${posteriorStr}`
    });
  }
  
  // Step 6: Kết quả dự đoán
  steps.push({
    type: 'prediction_result',
    predicted: prediction.predicted,
    actual: sample[targetAttr as keyof DataRow] as string,
    allResults: prediction.results,
    isCorrect: prediction.predicted === sample[targetAttr as keyof DataRow],
    desc: `✅ Dự đoán: "${prediction.predicted}" (${prediction.predicted === sample[targetAttr as keyof DataRow] ? '✓ Đúng' : '✗ Sai'})`
  });
  
  // Step 7: Done
  steps.push({
    type: 'done',
    desc: '✅ Naive Bayes hoàn tất!'
  });
  
  return steps;
}

// Hàm dự đoán cho một sample bất kỳ (có thể gọi từ UI)
export function predictSample(
  dataset: DataRow[], 
  sample: SampleData, 
  targetAttr: string = 'buy_computer'
): PredictionResult {
  return predictNaive(dataset, sample, targetAttr);
}