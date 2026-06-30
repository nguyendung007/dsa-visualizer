
import {
  type DPAlgorithm,
  type DPStep,
  type DPResult,
  type FibonacciStep,
  type FibonacciResult,
  type CoinChangeStep,
  type CoinChangeResult,
  type KnapsackItem,
  type KnapsackStep,
  type KnapsackResult,
  type LCSStep,
  type LCSResult,
  type RodCuttingStep,
  type RodCuttingResult,
  DP_ALGOS
} from './config.js';


/**
 * Fibonacci sử dụng Memoization (Top-Down)
 */
export function fibonacciMemo(n: number): FibonacciResult {
  const memo: number[] = new Array(n + 1).fill(-1);
  const steps: FibonacciStep[] = [];

  function fib(k: number): number {
    if (k <= 1) {
      memo[k] = k;
      steps.push({
        type: 'memo_base',
        n: k,
        fib: k,
        memo: [...memo],
        message: `Base case: F(${k}) = ${k}`
      });
      return k;
    }

    if (memo[k] !== -1) {
      steps.push({
        type: 'memo_hit',
        n: k,
        fib: memo[k],
        memo: [...memo],
        message: `✅ Memo hit: F(${k}) = ${memo[k]}`
      });
      return memo[k];
    }

    steps.push({
      type: 'memo_compute',
      n: k,
      fib: -1,
      memo: [...memo],
      message: `🔄 Tính F(${k}) = F(${k-1}) + F(${k-2})`
    });

    const result = fib(k - 1) + fib(k - 2);
    memo[k] = result;

    steps.push({
      type: 'memo_store',
      n: k,
      fib: result,
      memo: [...memo],
      message: `📝 F(${k}) = ${result} (đã lưu vào memo)`
    });

    return result;
  }

  const value = fib(n);

  steps.push({
    type: 'memo_done',
    n: n,
    fib: value,
    memo: [...memo],
    message: `🎯 F(${n}) = ${value}`
  });

  const tab: number[] = new Array(n + 1);
  tab[0] = 0;
  if (n >= 1) tab[1] = 1;
  for (let i = 2; i <= n; i++) {
    tab[i] = tab[i - 1] + tab[i - 2];
  }

  return {
    value,
    steps: steps as FibonacciStep[],
    memo,
    tabulation: tab
  };
}

/**
 * Fibonacci sử dụng Tabulation (Bottom-Up)
 */
export function fibonacciTab(n: number): FibonacciResult {
  const steps: FibonacciStep[] = [];
  const memo: number[] = new Array(n + 1);

  memo[0] = 0;
  steps.push({
    type: 'tab_init',
    n: 0,
    fib: 0,
    memo: [...memo],
    message: `Khởi tạo F(0) = 0`
  });

  if (n >= 1) {
    memo[1] = 1;
    steps.push({
      type: 'tab_init',
      n: 1,
      fib: 1,
      memo: [...memo],
      message: `Khởi tạo F(1) = 1`
    });
  }

  for (let i = 2; i <= n; i++) {
    memo[i] = memo[i - 1] + memo[i - 2];
    steps.push({
      type: 'tab_step',
      n: i,
      fib: memo[i],
      memo: [...memo],
      message: `F(${i}) = F(${i-1}) + F(${i-2}) = ${memo[i-1]} + ${memo[i-2]} = ${memo[i]}`
    });
  }

  steps.push({
    type: 'tab_done',
    n: n,
    fib: memo[n],
    memo: [...memo],
    message: `🎯 F(${n}) = ${memo[n]}`
  });

  return {
    value: memo[n],
    steps: steps as FibonacciStep[],
    memo,
    tabulation: memo
  };
}


/**
 * Coin Change - Số cách (Number of ways)
 */
export function coinChangeWays(coins: number[], amount: number): CoinChangeResult {
  const dp: number[] = new Array(amount + 1).fill(0);
  dp[0] = 1;
  const steps: CoinChangeStep[] = [];

  steps.push({
    type: 'init',
    amount: 0,
    coin: 0,
    ways: 0,
    dp: [...dp],
    message: `Khởi tạo: dp[0] = 1 (1 cách để tạo tổng 0)`
  });

  for (let i = 0; i < coins.length; i++) {
    const coin = coins[i];
    steps.push({
      type: 'coin_start',
      amount: 0,
      coin,
      ways: 0,
      dp: [...dp],
      message: `🪙 Xét coin ${coin}`
    });

    for (let a = coin; a <= amount; a++) {
      const prev = dp[a - coin];
      dp[a] += prev;
      steps.push({
        type: 'update',
        amount: a,
        coin,
        ways: dp[a],
        dp: [...dp],
        message: `dp[${a}] += dp[${a - coin}] = ${prev} → dp[${a}] = ${dp[a]}`
      });
    }
  }

  const result = dp[amount];
  steps.push({
    type: 'done',
    amount,
    coin: 0,
    ways: result,
    dp: [...dp],
    message: `🎯 Số cách tạo ${amount}: ${result}`
  });

  return {
    ways: result,
    minCoins: coinChangeMinCoins(coins, amount),
    coinsUsed: [],
    steps: steps as CoinChangeStep[],
    dp
  };
}

/**
 * Coin Change - Số coin tối thiểu (Minimum coins)
 */
export function coinChangeMinCoins(coins: number[], amount: number): number {
  const dp: number[] = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;

  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (i >= coin && dp[i - coin] !== Infinity) {
        dp[i] = Math.min(dp[i], dp[i - coin] + 1);
      }
    }
  }

  return dp[amount] === Infinity ? -1 : dp[amount];
}

/**
 * Coin Change - Truy vết để tìm coins đã dùng
 */
export function coinChangeTrace(coins: number[], amount: number): number[] {
  const dp: number[] = new Array(amount + 1).fill(Infinity);
  const trace: number[] = new Array(amount + 1).fill(-1);
  dp[0] = 0;

  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (i >= coin && dp[i - coin] !== Infinity) {
        if (dp[i - coin] + 1 < dp[i]) {
          dp[i] = dp[i - coin] + 1;
          trace[i] = coin;
        }
      }
    }
  }

  if (dp[amount] === Infinity) return [];

  const result: number[] = [];
  let remaining = amount;
  while (remaining > 0) {
    const coin = trace[remaining];
    result.push(coin);
    remaining -= coin;
  }

  return result;
}


/**
 * 0/1 Knapsack - Tìm giá trị tối đa
 */
export function knapsack01(
  items: KnapsackItem[],
  capacity: number
): KnapsackResult {
  const n = items.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(capacity + 1).fill(0)
  );
  const steps: KnapsackStep[] = [];

  steps.push({
    type: 'init',
    item: items[0] || { id: 0, weight: 0, value: 0 },
    capacity,
    include: false,
    dp: dp.map(row => [...row]),
    selected: [],
    message: `Khởi tạo bảng DP (${n+1} x ${capacity+1})`
  });

  for (let i = 1; i <= n; i++) {
    const item = items[i - 1];
    for (let w = 0; w <= capacity; w++) {
      if (item.weight <= w) {
        const include = item.value + dp[i - 1][w - item.weight];
        const exclude = dp[i - 1][w];
        dp[i][w] = Math.max(include, exclude);

        steps.push({
          type: 'compute',
          item,
          capacity: w,
          include: include > exclude,
          dp: dp.map(row => [...row]),
          selected: [],
          message: `Item ${item.id} (w=${item.weight}, v=${item.value}): max(${include}, ${exclude}) = ${dp[i][w]}`
        });
      } else {
        dp[i][w] = dp[i - 1][w];
        steps.push({
          type: 'skip',
          item,
          capacity: w,
          include: false,
          dp: dp.map(row => [...row]),
          selected: [],
          message: `Item ${item.id} quá nặng (${item.weight} > ${w}), giữ nguyên ${dp[i][w]}`
        });
      }
    }
  }

  const selected: KnapsackItem[] = [];
  let w = capacity;
  for (let i = n; i > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      selected.push(items[i - 1]);
      w -= items[i - 1].weight;
    }
  }

  const totalWeight = selected.reduce((sum, item) => sum + item.weight, 0);

  steps.push({
    type: 'trace',
    item: items[0],
    capacity,
    include: true,
    dp: dp.map(row => [...row]),
    selected: selected.map(item => item.id),
    message: `✅ Chọn các item: [${selected.map(i => i.id).join(', ')}], tổng weight = ${totalWeight}, total value = ${dp[n][capacity]}`
  });

  return {
    maxValue: dp[n][capacity],
    selectedItems: selected,
    totalWeight,
    steps: steps as KnapsackStep[],
    dp
  };
}


/**
 * LCS - Tìm chuỗi con chung dài nhất
 */
export function longestCommonSubsequence(str1: string, str2: string): LCSResult {
  const n = str1.length;
  const m = str2.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(0)
  );
  const steps: LCSStep[] = [];

  steps.push({
    type: 'init',
    char1: '',
    char2: '',
    dp: dp.map(row => [...row]),
    match: false,
    direction: 'none',
    message: `Khởi tạo bảng DP ${n+1}x${m+1} cho "${str1}" và "${str2}"`
  });

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
        steps.push({
          type: 'match',
          char1: str1[i - 1],
          char2: str2[j - 1],
          dp: dp.map(row => [...row]),
          match: true,
          direction: 'diag',
          message: `✨ Match! '${str1[i-1]}' = '${str2[j-1]}' → dp[${i}][${j}] = ${dp[i][j]}`
        });
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        const dir = dp[i - 1][j] >= dp[i][j - 1] ? 'up' : 'left';
        steps.push({
          type: 'compare',
          char1: str1[i - 1],
          char2: str2[j - 1],
          dp: dp.map(row => [...row]),
          match: false,
          direction: dir,
          message: `'${str1[i-1]}' vs '${str2[j-1]}' → max(${dp[i-1][j]}, ${dp[i][j-1]}) = ${dp[i][j]} (${dir})`
        });
      }
    }
  }

  let lcs = '';
  let i = n,
    j = m;
  while (i > 0 && j > 0) {
    if (str1[i - 1] === str2[j - 1]) {
      lcs = str1[i - 1] + lcs;
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  steps.push({
    type: 'done',
    char1: '',
    char2: '',
    dp: dp.map(row => [...row]),
    match: false,
    direction: 'none',
    message: `🎯 LCS = "${lcs}" (độ dài ${lcs.length})`
  });

  return {
    lcs,
    length: lcs.length,
    steps: steps as LCSStep[],
    dp
  };
}


/**
 * Rod Cutting - Tối đa doanh thu khi cắt thanh sắt
 */
export function rodCutting(length: number, prices: number[]): RodCuttingResult {
  const dp: number[] = new Array(length + 1).fill(0);
  const bestCut: number[] = new Array(length + 1).fill(0);
  const steps: RodCuttingStep[] = [];

  steps.push({
    type: 'init',
    length: 0,
    cut: 0,
    revenue: 0,
    dp: [...dp],
    bestCut: [...bestCut],
    message: `Khởi tạo: thanh sắt dài ${length}, giá: [${prices.join(', ')}]`
  });

  for (let i = 1; i <= length; i++) {
    let maxRevenue = -Infinity;
    let best = -1;

    for (let j = 1; j <= i && j <= prices.length; j++) {
      const revenue = prices[j - 1] + dp[i - j];
      steps.push({
        type: 'try_cut',
        length: i,
        cut: j,
        revenue,
        dp: [...dp],
        bestCut: [...bestCut],
        message: `Cắt đoạn ${j}: ${prices[j-1]} + dp[${i-j}] = ${prices[j-1]} + ${dp[i-j]} = ${revenue}`
      });

      if (revenue > maxRevenue) {
        maxRevenue = revenue;
        best = j;
      }
    }

    dp[i] = maxRevenue;
    bestCut[i] = best;

    steps.push({
      type: 'best_cut',
      length: i,
      cut: best,
      revenue: maxRevenue,
      dp: [...dp],
      bestCut: [...bestCut],
      message: `✅ Độ dài ${i}: cắt ${best}, doanh thu = ${maxRevenue}`
    });
  }

  const cuts: number[] = [];
  let remaining = length;
  while (remaining > 0) {
    const cut = bestCut[remaining];
    cuts.push(cut);
    remaining -= cut;
  }

  steps.push({
    type: 'done',
    length,
    cut: 0,
    revenue: dp[length],
    dp: [...dp],
    bestCut: [...bestCut],
    message: `🎯 Doanh thu tối đa: ${dp[length]}, cách cắt: [${cuts.join(' + ')}] = ${length}`
  });

  return {
    maxRevenue: dp[length],
    cuts,
    steps: steps as RodCuttingStep[],
    dp,
    bestCut
  };
}


type AlgorithmFn<T> = (...args: any[]) => T;

const ALGORITHMS = {
  fibonacci: {
    memo: fibonacciMemo,
    tab: fibonacciTab
  },
  coinChange: {
    ways: coinChangeWays,
    minCoins: coinChangeMinCoins,
    trace: coinChangeTrace
  },
  knapsack: {
    solve: knapsack01
  },
  lcs: {
    solve: longestCommonSubsequence
  },
  rodCutting: {
    solve: rodCutting
  }
} as const;

export function getSteps(
  algo: DPAlgorithm,
  params: any
): DPResult {
  switch (algo) {
    case 'fibonacci': {
      const n = params.n || 10;
      const result = fibonacciTab(n);
      return {
        steps: result.steps,
        result: result.value,
        dpTable: result.tabulation,
        trace: result.memo
      };
    }
    case 'coinChange': {
      const coins = params.coins || [1, 2, 5];
      const amount = params.amount || 11;
      const result = coinChangeWays(coins, amount);
      const minCoins = coinChangeMinCoins(coins, amount);
      const trace = coinChangeTrace(coins, amount);
      return {
        steps: result.steps,
        result: {
          ways: result.ways,
          minCoins,
          coinsUsed: trace
        },
        dpTable: result.dp,
        trace
      };
    }
    case 'knapsack': {
      const items: KnapsackItem[] = params.items || [
        { id: 1, weight: 2, value: 3 },
        { id: 2, weight: 3, value: 4 },
        { id: 3, weight: 4, value: 5 }
      ];
      const capacity = params.capacity || 5;
      const result = knapsack01(items, capacity);
      return {
        steps: result.steps,
        result: {
          maxValue: result.maxValue,
          selectedItems: result.selectedItems,
          totalWeight: result.totalWeight
        },
        dpTable: result.dp,
        trace: result.selectedItems.map(i => i.id)
      };
    }
    case 'lcs': {
      const str1 = params.str1 || 'ABCBDAB';
      const str2 = params.str2 || 'BDCAB';
      const result = longestCommonSubsequence(str1, str2);
      return {
        steps: result.steps,
        result: {
          lcs: result.lcs,
          length: result.length
        },
        dpTable: result.dp,
        trace: result.lcs.split('')
      };
    }
    case 'rodCutting': {
      const length = params.length || 8;
      const prices = params.prices || [1, 5, 8, 9, 10, 17, 17, 20];
      const result = rodCutting(length, prices);
      return {
        steps: result.steps,
        result: {
          maxRevenue: result.maxRevenue,
          cuts: result.cuts
        },
        dpTable: result.dp,
        trace: result.bestCut
      };
    }
    default:
      throw new Error(`Unknown algorithm: ${algo}`);
  }
}

export {
  DP_ALGOS
};

export default {
  DP_ALGOS,
  fibonacciMemo,
  fibonacciTab,
  coinChangeWays,
  coinChangeMinCoins,
  coinChangeTrace,
  knapsack01,
  longestCommonSubsequence,
  rodCutting
};