

export type DPAlgorithm = 'fibonacci' | 'coinChange' | 'knapsack' | 'lcs' | 'rodCutting';

export interface DPConfig {
  name: string;
  desc: string;
  complexity: string;
  color: string;
  example: string;
}

export interface DPStep {
  type: string;
  index?: number;
  i?: number;
  j?: number;
  value?: number | string;
  message?: string;
  dp?: number[] | number[][];
  selected?: number[];
  path?: number[];
  data?: any;
}

export interface DPResult {
  steps: DPStep[];
  result: any;
  dpTable: number[] | number[][];
  trace: any[];
  executionTime?: number;
}


export interface FibonacciStep extends DPStep {
  n: number;
  fib: number;
  memo: number[];
}

export interface FibonacciResult {
  value: number;
  steps: FibonacciStep[];
  memo: number[];
  tabulation: number[];
}


export interface CoinChangeStep extends DPStep {
  amount: number;
  coin: number;
  ways: number;
  dp: number[];
}

export interface CoinChangeResult {
  ways: number;
  minCoins: number;
  coinsUsed: number[];
  steps: CoinChangeStep[];
  dp: number[];
}


export interface KnapsackItem {
  id: number;
  weight: number;
  value: number;
}

export interface KnapsackStep extends DPStep {
  item: KnapsackItem;
  capacity: number;
  include: boolean;
  dp: number[][];
  selected: number[];
}

export interface KnapsackResult {
  maxValue: number;
  selectedItems: KnapsackItem[];
  totalWeight: number;
  steps: KnapsackStep[];
  dp: number[][];
}


export interface LCSStep extends DPStep {
  char1: string;
  char2: string;
  dp: number[][];
  match: boolean;
  direction: 'up' | 'left' | 'diag' | 'none';
}

export interface LCSResult {
  lcs: string;
  length: number;
  steps: LCSStep[];
  dp: number[][];
}


export interface RodCuttingStep extends DPStep {
  length: number;
  cut: number;
  revenue: number;
  dp: number[];
  bestCut: number[];
}

export interface RodCuttingResult {
  maxRevenue: number;
  cuts: number[];
  steps: RodCuttingStep[];
  dp: number[];
  bestCut: number[];
}


export const DP_ALGOS: Record<DPAlgorithm, DPConfig> = {
  fibonacci: {
    name: 'Fibonacci',
    desc: 'F(n) = F(n-1) + F(n-2) với F(0) = 0, F(1) = 1',
    complexity: 'O(n) time, O(n) space',
    color: '#58a6ff',
    example: 'Tính F(10) = 55'
  },
  coinChange: {
    name: 'Coin Change',
    desc: 'Tìm số cách hoặc số coin tối thiểu để đạt tổng amount',
    complexity: 'O(amount * n) time, O(amount) space',
    color: '#10b981',
    example: 'Coins: [1,2,5], amount = 11 → 3 coins (5+5+1)'
  },
  knapsack: {
    name: '0/1 Knapsack',
    desc: 'Chọn items tối đa giá trị với giới hạn trọng lượng',
    complexity: 'O(n * W) time, O(W) space',
    color: '#f59e0b',
    example: 'Items: (w=2,v=3), (w=3,v=4), (w=4,v=5), W=5 → max=7'
  },
  lcs: {
    name: 'LCS',
    desc: 'Tìm chuỗi con chung dài nhất giữa 2 chuỗi',
    complexity: 'O(n * m) time, O(n * m) space',
    color: '#a78bfa',
    example: '"ABCBDAB" và "BDCAB" → "BCAB" (dài 4)'
  },
  rodCutting: {
    name: 'Rod Cutting',
    desc: 'Cắt thanh sắt để tối đa doanh thu',
    complexity: 'O(n²) time, O(n) space',
    color: '#f97316',
    example: 'Length=4, prices: [1,5,8,9] → max=10 (2+2)'
  }
};