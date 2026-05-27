export function selectionSort(arr) {
  const steps = [];
  const a = [...arr];
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      steps.push({ array: [...a], comparing: [minIdx, j], sorted: Array.from({length: i}, (_,k)=>k), minIdx });
      if (a[j] < a[minIdx]) minIdx = j;
    }
    if (minIdx !== i) {
      [a[i], a[minIdx]] = [a[minIdx], a[i]];
      steps.push({ array: [...a], swapped: [i, minIdx], sorted: Array.from({length: i+1}, (_,k)=>k) });
    }
  }
  steps.push({ array: [...a], sorted: Array.from({length: n}, (_,k)=>k), done: true });
  return steps;
}

export function insertionSort(arr) {
  const steps = [];
  const a = [...arr];
  const n = a.length;
  for (let i = 1; i < n; i++) {
    let key = a[i];
    let j = i - 1;
    steps.push({ array: [...a], key: i, comparing: [i], sorted: Array.from({length: i}, (_,k)=>k) });
    while (j >= 0 && a[j] > key) {
      steps.push({ array: [...a], comparing: [j, j+1], key: j+1, sorted: [] });
      a[j + 1] = a[j];
      j--;
      steps.push({ array: [...a], swapped: [j+1, j+2], key: j+1, sorted: [] });
    }
    a[j + 1] = key;
    steps.push({ array: [...a], placed: j+1, sorted: Array.from({length: i+1}, (_,k)=>k) });
  }
  steps.push({ array: [...a], sorted: Array.from({length: a.length}, (_,k)=>k), done: true });
  return steps;
}

export function mergeSort(arr) {
  const steps = [];
  const a = [...arr];

  function merge(a, l, m, r) {
    const left = a.slice(l, m+1);
    const right = a.slice(m+1, r+1);
    let i = 0, j = 0, k = l;
    while (i < left.length && j < right.length) {
      steps.push({ array: [...a], comparing: [l+i, m+1+j], merging: [l, r], pivot: null });
      if (left[i] <= right[j]) { a[k++] = left[i++]; }
      else { a[k++] = right[j++]; }
      steps.push({ array: [...a], placed: k-1, merging: [l, r] });
    }
    while (i < left.length) { a[k++] = left[i++]; steps.push({ array: [...a], merging: [l, r] }); }
    while (j < right.length) { a[k++] = right[j++]; steps.push({ array: [...a], merging: [l, r] }); }
  }

  function ms(a, l, r) {
    if (l >= r) return;
    const m = Math.floor((l + r) / 2);
    steps.push({ array: [...a], dividing: [l, m, r] });
    ms(a, l, m);
    ms(a, m+1, r);
    merge(a, l, m, r);
  }

  ms(a, 0, a.length - 1);
  steps.push({ array: [...a], sorted: Array.from({length: a.length}, (_,k)=>k), done: true });
  return steps;
}

export function quickSort(arr) {
  const steps = [];
  const a = [...arr];

  function partition(a, low, high) {
    const pivot = a[high];
    let i = low - 1;
    steps.push({ array: [...a], pivot: high, range: [low, high] });
    for (let j = low; j < high; j++) {
      steps.push({ array: [...a], comparing: [j, high], pivot: high, range: [low, high], i });
      if (a[j] <= pivot) {
        i++;
        [a[i], a[j]] = [a[j], a[i]];
        steps.push({ array: [...a], swapped: [i, j], pivot: high, range: [low, high] });
      }
    }
    [a[i+1], a[high]] = [a[high], a[i+1]];
    steps.push({ array: [...a], pivotPlaced: i+1, range: [low, high] });
    return i + 1;
  }

  function qs(a, low, high) {
    if (low >= high) return;
    const pi = partition(a, low, high);
    qs(a, low, pi - 1);
    qs(a, pi + 1, high);
  }

  qs(a, 0, a.length - 1);
  steps.push({ array: [...a], sorted: Array.from({length: a.length}, (_,k)=>k), done: true });
  return steps;
}

export function bubbleSort(arr) {
  const steps = [];
  const a = [...arr];
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      steps.push({ array: [...a], comparing: [j, j+1], sorted: Array.from({length: i}, (_,k)=>n-1-k) });
      if (a[j] > a[j+1]) {
        [a[j], a[j+1]] = [a[j+1], a[j]];
        steps.push({ array: [...a], swapped: [j, j+1], sorted: Array.from({length: i}, (_,k)=>n-1-k) });
      }
    }
  }
  steps.push({ array: [...a], sorted: Array.from({length: n}, (_,k)=>k), done: true });
  return steps;
}

export function heapSort(arr) {
  const steps = [];
  const a = [...arr];
  const n = a.length;

  function heapify(a, n, i) {
    let largest = i, l = 2*i+1, r = 2*i+2;
    steps.push({ array: [...a], comparing: [i, l < n ? l : i], heapify: i });
    if (l < n && a[l] > a[largest]) largest = l;
    if (r < n && a[r] > a[largest]) largest = r;
    if (largest !== i) {
      [a[i], a[largest]] = [a[largest], a[i]];
      steps.push({ array: [...a], swapped: [i, largest] });
      heapify(a, n, largest);
    }
  }

  for (let i = Math.floor(n/2) - 1; i >= 0; i--) heapify(a, n, i);
  for (let i = n - 1; i > 0; i--) {
    [a[0], a[i]] = [a[i], a[0]];
    steps.push({ array: [...a], swapped: [0, i], sorted: Array.from({length: n-i}, (_,k)=>i+k) });
    heapify(a, i, 0);
  }
  steps.push({ array: [...a], sorted: Array.from({length: n}, (_,k)=>k), done: true });
  return steps;
}

export function countingSort(arr) {
  const steps = [];
  const a = [...arr];
  const max = Math.max(...a);
  const min = Math.min(...a);
  const range = max - min + 1;
  const count = Array(range).fill(0);

  steps.push({ array: [...a], phase: 'init', count: [...count], min, max, desc: `Khởi tạo mảng count[${range}] = 0, min=${min}, max=${max}` });

  // Phase 1: Count
  for (let i = 0; i < a.length; i++) {
    count[a[i] - min]++;
    steps.push({ array: [...a], phase: 'count', countIdx: a[i] - min, inputIdx: i,
      count: [...count], min, max, highlight: [i],
      desc: `count[${a[i]}-${min}] = count[${a[i]-min}]++ → ${count[a[i]-min]}` });
  }

  // Phase 2: Prefix sum
  const prefixCount = [...count];
  for (let i = 1; i < range; i++) {
    prefixCount[i] += prefixCount[i - 1];
    steps.push({ array: [...a], phase: 'prefix', prefixIdx: i, count: [...prefixCount], min, max,
      desc: `prefix[${i}] = ${prefixCount[i-1]-count[i]} + ${count[i]} = ${prefixCount[i]}` });
  }

  // Phase 3: Build output
  const output = Array(a.length).fill(0);
  for (let i = a.length - 1; i >= 0; i--) {
    const pos = prefixCount[a[i] - min] - 1;
    output[pos] = a[i];
    prefixCount[a[i] - min]--;
    steps.push({ array: [...output], phase: 'output', inputIdx: i, outputIdx: pos,
      count: [...prefixCount], min, max, placing: pos,
      desc: `Đặt a[${i}]=${a[i]} vào output[${pos}]` });
  }

  steps.push({ array: [...output], phase: 'done', sorted: output.map((_, i) => i),
    count: Array(range).fill(0), min, max, done: true, desc: 'Hoàn thành!' });
  return steps;
}

export function radixSort(arr) {
  const steps = [];
  const a = [...arr];
  const max = Math.max(...a);
  const digits = Math.floor(Math.log10(max)) + 1;

  steps.push({
    array: [...a], phase: 'init', digit: 0, digits,
    desc: `Radix Sort: max=${max}, cần ${digits} lượt (theo từng chữ số)`
  });

  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
    const digitPos = Math.floor(Math.log10(exp)) + 1;
    const buckets = Array.from({ length: 10 }, () => []);

    // Phân phối vào bucket theo chữ số tại vị trí exp
    for (let i = 0; i < a.length; i++) {
      const d = Math.floor(a[i] / exp) % 10;
      buckets[d].push(a[i]);
      steps.push({
        array: [...a], phase: 'distribute', highlight: [i],
        digit: digitPos, buckets: buckets.map(b => [...b]),
        val: a[i], bucket: d, exp,
        desc: `Chữ số hàng ${exp}: ${a[i]} → bucket[${d}]`
      });
    }

    // Gom bucket trở lại mảng
    let idx = 0;
    for (let b = 0; b < 10; b++) {
      for (const val of buckets[b]) {
        a[idx++] = val;
        steps.push({
          array: [...a], phase: 'collect', placing: idx - 1,
          digit: digitPos, buckets: buckets.map(bk => [...bk]),
          bucket: b, exp,
          desc: `Gom bucket[${b}]: đặt ${val} vào vị trí [${idx-1}]`
        });
      }
    }

    steps.push({
      array: [...a], phase: 'pass_done', digit: digitPos,
      buckets: Array.from({ length: 10 }, () => []), exp,
      desc: `Lượt ${digitPos}/${digits} (hàng ${exp}) hoàn thành: [${a.join(', ')}]`
    });
  }

  steps.push({
    array: [...a], phase: 'done',
    sorted: a.map((_, i) => i), done: true,
    desc: 'Radix Sort hoàn thành!'
  });
  return steps;
}

// ─── Shell Sort ──────────────────────────────────────────────────────────────
export function shellSort(arr) {
  const steps = [];
  const a = [...arr];
  const n = a.length;
  // Knuth sequence: 1, 4, 13, 40, ...
  let gap = 1;
  while (gap < Math.floor(n / 3)) gap = gap * 3 + 1;

  while (gap >= 1) {
    steps.push({ array: [...a], phase: 'gap', gap, desc: `Gap = ${gap}` });
    for (let i = gap; i < n; i++) {
      const key = a[i];
      let j = i;
      steps.push({ array: [...a], phase: 'pick', highlight: [i], gap, desc: `Chọn a[${i}]=${key}, gap=${gap}` });
      while (j >= gap && a[j - gap] > key) {
        steps.push({ array: [...a], comparing: [j - gap, j], gap, phase: 'compare', desc: `So sánh a[${j-gap}]=${a[j-gap]} > ${key}` });
        a[j] = a[j - gap];
        j -= gap;
        steps.push({ array: [...a], swapped: [j, j + gap], gap, phase: 'shift', desc: `Dịch a[${j}]=${a[j+gap]} sang phải` });
      }
      a[j] = key;
      steps.push({ array: [...a], placed: j, gap, phase: 'place', desc: `Đặt ${key} vào [${j}]` });
    }
    gap = Math.floor(gap / 3);
  }
  steps.push({ array: [...a], done: true, sorted: a.map((_, i) => i), desc: 'Shell Sort hoàn thành!' });
  return steps;
}

// ─── Bucket Sort ─────────────────────────────────────────────────────────────
export function bucketSort(arr) {
  const steps = [];
  const a = [...arr];
  const n = a.length;
  const max = Math.max(...a), min = Math.min(...a);
  const range = max - min + 1;
  const bucketCount = Math.max(1, Math.floor(Math.sqrt(n)));
  const size = Math.ceil(range / bucketCount);

  const buckets = Array.from({ length: bucketCount }, () => []);
  steps.push({ array: [...a], buckets: buckets.map(b => [...b]), phase: 'init', bucketCount, size, min, max, desc: `Tạo ${bucketCount} bucket, mỗi bucket span ${size}` });

  // Distribute
  for (let i = 0; i < n; i++) {
    const bi = Math.min(Math.floor((a[i] - min) / size), bucketCount - 1);
    buckets[bi].push(a[i]);
    steps.push({ array: [...a], buckets: buckets.map(b => [...b]), phase: 'distribute', highlight: [i], bucket: bi, val: a[i], desc: `a[${i}]=${a[i]} → bucket[${bi}]` });
  }

  // Sort each bucket (insertion sort)
  for (let b = 0; b < bucketCount; b++) {
    const bk = buckets[b];
    for (let i = 1; i < bk.length; i++) {
      const key = bk[i]; let j = i - 1;
      while (j >= 0 && bk[j] > key) { bk[j + 1] = bk[j]; j--; }
      bk[j + 1] = key;
    }
    if (bk.length > 1) steps.push({ array: [...a], buckets: buckets.map(b2 => [...b2]), phase: 'sort_bucket', bucket: b, desc: `Sắp xếp bucket[${b}]: [${bk.join(', ')}]` });
  }

  // Collect
  let idx = 0;
  for (let b = 0; b < bucketCount; b++) {
    for (const val of buckets[b]) {
      a[idx++] = val;
      steps.push({ array: [...a], buckets: buckets.map(b2 => [...b2]), phase: 'collect', placing: idx - 1, bucket: b, desc: `Gom bucket[${b}]: đặt ${val} → [${idx-1}]` });
    }
  }

  steps.push({ array: [...a], done: true, sorted: a.map((_, i) => i), desc: 'Bucket Sort hoàn thành!' });
  return steps;
}
