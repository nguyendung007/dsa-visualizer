export function stackOps(operations) {
  const steps = [], stack = [];
  for (const op of operations) {
    if (op.type === 'push') {
      stack.push(op.val);
      steps.push({ stack: [...stack], op: 'push', val: op.val, top: stack.length - 1, highlight: stack.length - 1, action: 'entering' });
    } else if (op.type === 'pop') {
      if (stack.length === 0) {
        steps.push({ stack: [...stack], op: 'pop', val: null, top: -1, error: 'Stack rỗng!' });
        continue;
      }
      const val = stack[stack.length - 1];
      steps.push({ stack: [...stack], op: 'pop', val, top: stack.length - 1, highlight: stack.length - 1, action: 'leaving' });
      stack.pop();
      steps.push({ stack: [...stack], op: 'pop_done', val, top: stack.length - 1 });
    } else if (op.type === 'peek') {
      if (stack.length === 0) {
        steps.push({ stack: [...stack], op: 'peek', val: null, top: -1, error: 'Stack rỗng!' });
        continue;
      }
      steps.push({ stack: [...stack], op: 'peek', val: stack[stack.length - 1], top: stack.length - 1, highlight: stack.length - 1 });
    }
  }
  return steps;
}

export function queueOps(operations) {
  const steps = [], queue = [];
  for (const op of operations) {
    if (op.type === 'enqueue') {
      queue.push(op.val);
      steps.push({ queue: [...queue], op: 'enqueue', val: op.val, front: 0, rear: queue.length - 1, highlight: queue.length - 1, action: 'entering' });
    } else if (op.type === 'dequeue') {
      if (queue.length === 0) {
        steps.push({ queue: [...queue], op: 'dequeue', val: null, front: 0, rear: -1, error: 'Queue rỗng!' });
        continue;
      }
      const val = queue[0];
      steps.push({ queue: [...queue], op: 'dequeue', val, front: 0, rear: queue.length - 1, highlight: 0, action: 'leaving' });
      queue.shift();
      steps.push({ queue: [...queue], op: 'dequeue_done', val, front: 0, rear: queue.length - 1 });
    } else if (op.type === 'peek') {
      if (queue.length === 0) {
        steps.push({ queue: [...queue], op: 'peek', val: null, front: 0, rear: -1, error: 'Queue rỗng!' });
        continue;
      }
      steps.push({ queue: [...queue], op: 'peek', val: queue[0], front: 0, rear: queue.length - 1, highlight: 0 });
    }
  }
  return steps;
}

export function priorityQueueOps(operations) {
  // Min-heap based priority queue
  const steps = [];
  let heap = []; // array of {val, priority}

  function heapifyUp(arr, i) {
    const actions = [];
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (arr[parent].priority <= arr[i].priority) break;
      actions.push({ swap: [i, parent] });
      [arr[i], arr[parent]] = [arr[parent], arr[i]];
      i = parent;
    }
    return actions;
  }

  function heapifyDown(arr, i) {
    const actions = [];
    const n = arr.length;
    while (true) {
      let min = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && arr[l].priority < arr[min].priority) min = l;
      if (r < n && arr[r].priority < arr[min].priority) min = r;
      if (min === i) break;
      actions.push({ swap: [i, min] });
      [arr[i], arr[min]] = [arr[min], arr[i]];
      i = min;
    }
    return actions;
  }

  for (const op of operations) {
    if (op.type === 'insert') {
      heap.push({ val: op.val, priority: op.priority ?? op.val });
      const idx = heap.length - 1;
      steps.push({ heap: heap.map(x => ({...x})), op: 'insert', val: op.val, priority: op.priority ?? op.val, highlight: idx });
      const swaps = heapifyUp(heap, idx);
      for (const s of swaps) {
        steps.push({ heap: heap.map(x => ({...x})), op: 'heapify_up', swap: s.swap, highlight: s.swap[1] });
      }
      steps.push({ heap: heap.map(x => ({...x})), op: 'insert_done', val: op.val });
    } else if (op.type === 'extractMin') {
      if (heap.length === 0) {
        steps.push({ heap: [], op: 'extractMin', val: null, error: 'PQ rỗng!' });
        continue;
      }
      const min = heap[0];
      steps.push({ heap: heap.map(x => ({...x})), op: 'extractMin', val: min.val, priority: min.priority, highlight: 0 });
      heap[0] = heap[heap.length - 1];
      heap.pop();
      if (heap.length > 0) {
        const swaps = heapifyDown(heap, 0);
        for (const s of swaps) {
          steps.push({ heap: heap.map(x => ({...x})), op: 'heapify_down', swap: s.swap, highlight: s.swap[1] });
        }
      }
      steps.push({ heap: heap.map(x => ({...x})), op: 'extract_done', val: min.val });
    } else if (op.type === 'peek') {
      steps.push({ heap: heap.map(x => ({...x})), op: 'peek', val: heap[0]?.val, priority: heap[0]?.priority, highlight: 0 });
    }
  }
  return steps;
}

export function hashTableOps(operations, tableSize = 11, hashFormula = 'default', probeMode = 'chaining') {
  const table = probeMode === 'chaining'
    ? Array(tableSize).fill(null).map(() => [])
    : Array(tableSize).fill(null);
  const steps = [];

  function buildHashFn(formula) {
    try {
      // formula is a JS expression using variables: key (string), size (table size)
      // eslint-disable-next-line no-new-func
      return new Function('key', 'size', `
        let h = 0;
        const k = String(key);
        ${formula};
        return ((h % size) + size) % size;
      `);
    } catch {
      return null;
    }
  }

  let hashFn;
  if (hashFormula === 'default') {
    hashFn = (key) => {
      let h = 0;
      for (const c of String(key)) h = (h * 31 + c.charCodeAt(0)) % tableSize;
      return h;
    };
  } else if (hashFormula === 'sum') {
    hashFn = (key) => {
      let h = 0;
      for (const c of String(key)) h += c.charCodeAt(0);
      return h % tableSize;
    };
  } else if (hashFormula === 'djb2') {
    hashFn = (key) => {
      let h = 5381;
      for (const c of String(key)) h = ((h << 5) + h) + c.charCodeAt(0);
      return ((h >>> 0) % tableSize);
    };
  } else if (typeof hashFormula === 'string') {
    hashFn = buildHashFn(hashFormula) || ((key) => {
      let h = 0;
      for (const c of String(key)) h = (h * 31 + c.charCodeAt(0)) % tableSize;
      return h;
    });
  }

  for (const op of operations) {
    if (op.type === 'insert') {
      const baseIdx = hashFn(op.key);
      steps.push({ table: probeMode === 'chaining' ? table.map(b => [...b]) : [...table], op: 'hash', key: op.key, idx: baseIdx, formula: `hash("${op.key}") = ${baseIdx}`, probeMode });

      if (probeMode === 'chaining') {
        table[baseIdx].push({ key: op.key, val: op.val });
        steps.push({ table: table.map(b => [...b]), op: 'insert', key: op.key, val: op.val, idx: baseIdx, probeMode });
      } else {
        // Linear probing
        let idx = baseIdx;
        let probeCount = 0;
        while (table[idx] !== null && table[idx] !== undefined && probeCount < tableSize) {
          steps.push({ table: [...table], op: 'probe_linear', key: op.key, idx, baseIdx, probeCount, probeMode });
          idx = (idx + 1) % tableSize;
          probeCount++;
        }
        if (probeCount < tableSize) {
          table[idx] = { key: op.key, val: op.val };
          steps.push({ table: [...table], op: 'insert', key: op.key, val: op.val, idx, baseIdx, probeMode });
        } else {
          steps.push({ table: [...table], op: 'table_full', key: op.key, probeMode });
        }
      }
    } else if (op.type === 'search') {
      const baseIdx = hashFn(op.key);
      steps.push({ table: probeMode === 'chaining' ? table.map(b => [...b]) : [...table], op: 'hash', key: op.key, idx: baseIdx, probeMode });

      if (probeMode === 'chaining') {
        const bucket = table[baseIdx];
        let found = null;
        for (let i = 0; i < bucket.length; i++) {
          steps.push({ table: table.map(b => [...b]), op: 'probe', idx: baseIdx, probing: i, key: op.key, probeMode });
          if (bucket[i].key === op.key) { found = bucket[i].val; break; }
        }
        steps.push({ table: table.map(b => [...b]), op: found !== null ? 'found' : 'notfound', key: op.key, val: found, idx: baseIdx, probeMode });
      } else {
        let idx = baseIdx;
        let found = null, probeCount = 0;
        while (table[idx] !== null && probeCount < tableSize) {
          steps.push({ table: [...table], op: 'probe_linear', idx, key: op.key, probeCount, probeMode });
          if (table[idx]?.key === op.key) { found = table[idx].val; break; }
          idx = (idx + 1) % tableSize;
          probeCount++;
        }
        steps.push({ table: [...table], op: found !== null ? 'found' : 'notfound', key: op.key, val: found, idx, probeMode });
      }
    } else if (op.type === 'delete') {
      const baseIdx = hashFn(op.key);
      if (probeMode === 'chaining') {
        const bucket = table[baseIdx];
        const i = bucket.findIndex(x => x.key === op.key);
        if (i !== -1) {
          steps.push({ table: table.map(b => [...b]), op: 'delete', key: op.key, idx: baseIdx, probeMode });
          bucket.splice(i, 1);
          steps.push({ table: table.map(b => [...b]), op: 'delete_done', key: op.key, idx: baseIdx, probeMode });
        } else {
          steps.push({ table: table.map(b => [...b]), op: 'notfound', key: op.key, idx: baseIdx, probeMode });
        }
      } else {
        let idx = baseIdx, probeCount = 0;
        while (table[idx] !== null && probeCount < tableSize) {
          if (table[idx]?.key === op.key) {
            steps.push({ table: [...table], op: 'delete', key: op.key, idx, probeMode });
            table[idx] = undefined; // tombstone
            steps.push({ table: [...table], op: 'delete_done', key: op.key, idx, probeMode });
            break;
          }
          idx = (idx + 1) % tableSize;
          probeCount++;
        }
      }
    }
  }
  return steps;
}
