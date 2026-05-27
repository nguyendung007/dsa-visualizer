// ─── Two Sum ─────────────────────────────────────────────────────────────────
export function twoSumBruteForce(arr, target) {
  const steps = [];
  steps.push({ type: 'init', array: [...arr], target, desc: `Tìm 2 số có tổng = ${target} (Brute Force O(n²))` });
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      const sum = arr[i] + arr[j];
      steps.push({ type: 'compare', i, j, sum, target, array: [...arr],
        desc: `arr[${i}]=${arr[i]} + arr[${j}]=${arr[j]} = ${sum} ${sum === target ? '= ' : '≠ '} ${target}` });
      if (sum === target) {
        steps.push({ type: 'found', i, j, array: [...arr], desc: `✓ Tìm thấy! [${i}, ${j}] → ${arr[i]} + ${arr[j]} = ${target}` });
        return steps;
      }
    }
  }
  steps.push({ type: 'not_found', array: [...arr], desc: '✗ Không tìm thấy cặp nào' });
  return steps;
}

export function twoSumTwoPointer(arr, target) {
  const steps = [];
  const indexed = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const sorted = indexed.map(x => x.v);
  steps.push({ type: 'sort', array: [...sorted], original: [...arr], target,
    desc: `Sắp xếp mảng: [${sorted.join(', ')}] (Two Pointer O(n log n))` });
  let lo = 0, hi = sorted.length - 1;
  while (lo < hi) {
    const sum = sorted[lo] + sorted[hi];
    steps.push({ type: 'compare', lo, hi, sum, target, array: [...sorted],
      desc: `arr[${lo}]=${sorted[lo]} + arr[${hi}]=${sorted[hi]} = ${sum} ${sum < target ? '< ' : sum > target ? '> ' : '= '}${target}` });
    if (sum === target) {
      steps.push({ type: 'found', lo, hi, array: [...sorted],
        originalI: indexed[lo].i, originalJ: indexed[hi].i,
        desc: `✓ Tìm thấy! ${sorted[lo]} + ${sorted[hi]} = ${target}` });
      return steps;
    } else if (sum < target) {
      steps.push({ type: 'move_lo', lo, hi, array: [...sorted], desc: `Tổng < target → tăng lo: ${lo} → ${lo+1}` });
      lo++;
    } else {
      steps.push({ type: 'move_hi', lo, hi, array: [...sorted], desc: `Tổng > target → giảm hi: ${hi} → ${hi-1}` });
      hi--;
    }
  }
  steps.push({ type: 'not_found', array: [...sorted], desc: '✗ Không tìm thấy cặp nào' });
  return steps;
}

export function twoSumHashMap(arr, target) {
  const steps = [];
  const map = {};
  steps.push({ type: 'init', array: [...arr], target, map: {}, desc: `Dùng HashMap lưu {value: index} (Hash Map O(n))` });
  for (let i = 0; i < arr.length; i++) {
    const complement = target - arr[i];
    steps.push({ type: 'check', i, val: arr[i], complement, map: {...map}, array: [...arr],
      desc: `Xét arr[${i}]=${arr[i]}, tìm complement=${target}-${arr[i]}=${complement} trong map` });
    if (map[complement] !== undefined) {
      steps.push({ type: 'found', i, j: map[complement], array: [...arr], map: {...map},
        desc: `✓ Tìm thấy! map[${complement}]=${map[complement]}, [${map[complement]}, ${i}]` });
      return steps;
    }
    map[arr[i]] = i;
    steps.push({ type: 'store', i, val: arr[i], map: {...map}, array: [...arr],
      desc: `Lưu map[${arr[i]}] = ${i}` });
  }
  steps.push({ type: 'not_found', array: [...arr], map: {...map}, desc: '✗ Không tìm thấy cặp nào' });
  return steps;
}
