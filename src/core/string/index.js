// ─── Ternary Search Tree (TST) ───────────────────────────────────────────────
export class TSTNode {
  constructor(c) { this.c = c; this.left = null; this.mid = null; this.right = null; this.isEnd = false; }
}

export function tstInsert(root, word, steps = []) {
  function ins(node, w, d) {
    const c = w[d];
    if (!node) {
      node = new TSTNode(c);
      steps.push({ type: 'create_node', char: c, depth: d, word });
    }
    steps.push({ type: 'compare', char: c, nodeChar: node.c, depth: d });
    if (c < node.c) node.left = ins(node.left, w, d);
    else if (c > node.c) node.right = ins(node.right, w, d);
    else if (d < w.length - 1) node.mid = ins(node.mid, w, d + 1);
    else { node.isEnd = true; steps.push({ type: 'mark_end', char: c, word }); }
    return node;
  }
  if (!word.length) return { root, steps };
  return { root: ins(root, word, 0), steps };
}

export function tstSearch(root, word, steps = []) {
  function search(node, w, d) {
    if (!node) { steps.push({ type: 'not_found', word }); return false; }
    const c = w[d];
    steps.push({ type: 'visit', char: c, nodeChar: node.c, depth: d });
    if (c < node.c) return search(node.left, w, d);
    if (c > node.c) return search(node.right, w, d);
    if (d === w.length - 1) {
      const found = node.isEnd;
      steps.push({ type: found ? 'found' : 'not_found', word });
      return found;
    }
    return search(node.mid, w, d + 1);
  }
  const found = search(root, word, 0);
  return { found, steps };
}

export function tstToLayout(root) {
  if (!root) return { nodes: [], edges: [] };
  const nodes = [], edges = [];
  let id = 0;
  function traverse(node, x, y, parentX, parentY, dir) {
    if (!node) return;
    const nodeId = id++;
    nodes.push({ id: nodeId, char: node.c, x, y, isEnd: node.isEnd });
    if (parentX !== null) edges.push({ from: { x: parentX, y: parentY }, to: { x, y }, dir });
    const spread = 180 / (y / 60 + 1);
    traverse(node.left, x - spread, y + 60, x, y, 'L');
    traverse(node.mid, x, y + 60, x, y, 'M');
    traverse(node.right, x + spread, y + 60, x, y, 'R');
  }
  traverse(root, 300, 40, null, null, null);
  return { nodes, edges };
}

// ─── LSD Radix Sort ──────────────────────────────────────────────────────────
export function lsdRadixSort(arr) {
  const steps = [];
  if (!arr.length) return steps;
  const W = Math.max(...arr.map(s => s.length));
  let a = arr.map(s => s.padStart(W, ' '));
  steps.push({ type: 'init', arr: [...a], pass: 0, W });

  for (let d = W - 1; d >= 0; d--) {
    const buckets = Array.from({ length: 256 }, () => []);
    steps.push({ type: 'pass_start', arr: [...a], digit: d, pass: W - d });
    for (const s of a) {
      const ch = s.charCodeAt(d);
      buckets[ch].push(s);
      steps.push({ type: 'bucket', arr: [...a], digit: d, char: s[d], code: ch, word: s });
    }
    a = buckets.flat();
    steps.push({ type: 'collected', arr: [...a], digit: d });
  }
  steps.push({ type: 'done', arr: a.map(s => s.trimStart()) });
  return steps;
}

// ─── MSD Radix Sort ──────────────────────────────────────────────────────────
export function msdRadixSort(arr) {
  const steps = [];
  if (!arr.length) return steps;
  const W = Math.max(...arr.map(s => s.length));
  let a = arr.map(s => s.padEnd(W, '\0'));
  steps.push({ type: 'init', arr: arr.map(s => s), pass: 0, W });

  function sort(a, lo, hi, d) {
    if (hi <= lo || d >= W) return;
    const buckets = Array.from({ length: 257 }, () => []);
    steps.push({ type: 'pass_start', arr: a.map(s => s.trimEnd('\0').replace(/\0/g, '')), digit: d, lo, hi });
    for (let i = lo; i <= hi; i++) {
      const ch = d < a[i].length ? a[i].charCodeAt(d) + 1 : 0;
      buckets[ch].push(a[i]);
    }
    let idx = lo;
    for (let b = 0; b < 257; b++) {
      for (const s of buckets[b]) a[idx++] = s;
      if (buckets[b].length > 1 && b > 0) {
        const start = idx - buckets[b].length;
        sort(a, start, idx - 1, d + 1);
      }
    }
    steps.push({ type: 'collected', arr: a.map(s => s.trimEnd('\0').replace(/\0/g, '')), digit: d });
  }

  sort(a, 0, a.length - 1, 0);
  steps.push({ type: 'done', arr: a.map(s => s.trimEnd('\0').replace(/\0/g, '')) });
  return steps;
}

// ─── KMP (Knuth-Morris-Pratt) ─────────────────────────────────────────────────
export function buildKMPTable(pattern) {
  const lps = Array(pattern.length).fill(0);
  let len = 0, i = 1;
  while (i < pattern.length) {
    if (pattern[i] === pattern[len]) { lps[i++] = ++len; }
    else if (len) { len = lps[len - 1]; }
    else { lps[i++] = 0; }
  }
  return lps;
}

export function kmpSearch(text, pattern) {
  const steps = [];
  const lps = buildKMPTable(pattern);
  steps.push({ type: 'lps', lps: [...lps], pattern });
  let i = 0, j = 0;
  const matches = [];
  while (i < text.length) {
    steps.push({ type: 'compare', ti: i, pi: j, char_t: text[i], char_p: pattern[j] });
    if (text[i] === pattern[j]) {
      i++; j++;
      if (j === pattern.length) {
        const pos = i - j;
        matches.push(pos);
        steps.push({ type: 'match', pos, ti: i - 1, pi: j - 1 });
        j = lps[j - 1];
      }
    } else {
      if (j) { steps.push({ type: 'shift', from: j, to: lps[j - 1] }); j = lps[j - 1]; }
      else i++;
    }
  }
  steps.push({ type: 'done', matches });
  return steps;
}

// ─── Boyer-Moore ──────────────────────────────────────────────────────────────
export function boyerMoore(text, pattern) {
  const steps = [];
  const m = pattern.length, n = text.length;

  // Bad character table
  const bad = {};
  for (let i = 0; i < m; i++) bad[pattern[i]] = i;
  steps.push({ type: 'bad_char_table', table: {...bad}, pattern });

  const matches = [];
  let s = 0;
  while (s <= n - m) {
    let j = m - 1;
    steps.push({ type: 'align', shift: s });
    while (j >= 0 && pattern[j] === text[s + j]) {
      steps.push({ type: 'compare', ti: s + j, pi: j, match: true });
      j--;
    }
    if (j < 0) {
      matches.push(s);
      steps.push({ type: 'match', pos: s });
      s += (s + m < n) ? m - (bad[text[s + m]] ?? -1) : 1;
    } else {
      steps.push({ type: 'compare', ti: s + j, pi: j, match: false, badChar: text[s + j] });
      const shift = Math.max(1, j - (bad[text[s + j]] ?? -1));
      steps.push({ type: 'shift', amount: shift, reason: `bad char '${text[s+j]}'` });
      s += shift;
    }
  }
  steps.push({ type: 'done', matches });
  return steps;
}

// ─── Rabin-Karp ───────────────────────────────────────────────────────────────
export function rabinKarp(text, pattern, base = 31, mod = 1e9 + 9) {
  const steps = [];
  const m = pattern.length, n = text.length;
  const matches = [];

  // Compute pattern hash
  let patHash = 0, pow = 1;
  for (let i = 0; i < m; i++) {
    patHash = (patHash + pattern.charCodeAt(i) * pow) % mod;
    if (i < m - 1) pow = (pow * base) % mod;
  }
  steps.push({ type: 'pattern_hash', hash: patHash, pattern, base, mod });

  // Rolling hash
  let winHash = 0, p = 1;
  for (let i = 0; i < m && i < n; i++) {
    winHash = (winHash + text.charCodeAt(i) * p) % mod;
    if (i < m - 1) p = (p * base) % mod;
  }

  for (let i = 0; i <= n - m; i++) {
    steps.push({ type: 'window', pos: i, hash: winHash, match: winHash === patHash });
    if (winHash === patHash) {
      // Verify
      let ok = true;
      for (let k = 0; k < m; k++) {
        steps.push({ type: 'verify', ti: i + k, pi: k, char_t: text[i+k], char_p: pattern[k] });
        if (text[i + k] !== pattern[k]) { ok = false; break; }
      }
      if (ok) { matches.push(i); steps.push({ type: 'match', pos: i }); }
      else steps.push({ type: 'hash_collision', pos: i });
    }
    if (i < n - m) {
      winHash = (winHash - text.charCodeAt(i) + mod) % mod;
      winHash = (winHash * (mod - Math.round((mod + 1) / base))) % mod; // divide by base
      winHash = (winHash + text.charCodeAt(i + m) * p) % mod;
      // simpler rolling: just recompute for clarity in visualization
      winHash = 0; let pp = 1;
      for (let k = 0; k < m; k++) {
        winHash = (winHash + text.charCodeAt(i + 1 + k) * pp) % mod;
        if (k < m - 1) pp = (pp * base) % mod;
      }
    }
  }
  steps.push({ type: 'done', matches });
  return steps;
}

// ─── 3-Way Radix Quicksort (Bentley-Sedgewick) ───────────────────────────────
export function radixQuick3Way(arr) {
  const steps = [];
  const a = [...arr];
  steps.push({ type: 'init', arr: [...a], desc: `3-Way Radix Quicksort: ${a.length} chuỗi` });

  function sort(a, lo, hi, d) {
    if (hi <= lo) return;
    const pivot = d < a[lo].length ? a[lo].charCodeAt(d) : -1;
    let lt = lo, gt = hi, i = lo + 1;
    steps.push({ type: 'partition', arr: [...a], lo, hi, d, pivotChar: pivot === -1 ? 'ε' : String.fromCharCode(pivot), desc: `Partition [${lo}..${hi}] d=${d}, pivot='${pivot === -1 ? 'ε' : String.fromCharCode(pivot)}'` });
    while (i <= gt) {
      const t = d < a[i].length ? a[i].charCodeAt(d) : -1;
      if (t < pivot) {
        [a[lt], a[i]] = [a[i], a[lt]];
        steps.push({ type: 'swap_lt', arr: [...a], lo, hi, lt, i, gt, d, desc: `a[${i}] < pivot → swap với lt=${lt}` });
        lt++; i++;
      } else if (t > pivot) {
        [a[i], a[gt]] = [a[gt], a[i]];
        steps.push({ type: 'swap_gt', arr: [...a], lo, hi, lt, i, gt, d, desc: `a[${i}] > pivot → swap với gt=${gt}` });
        gt--;
      } else {
        steps.push({ type: 'equal', arr: [...a], lo, hi, lt, i, gt, d, desc: `a[${i}] = pivot` });
        i++;
      }
    }
    sort(a, lo, lt - 1, d);
    if (pivot >= 0) sort(a, lt, gt, d + 1);
    sort(a, gt + 1, hi, d);
  }

  sort(a, 0, a.length - 1, 0);
  steps.push({ type: 'done', arr: [...a], desc: `✓ Hoàn thành: ${a.join(', ')}` });
  return steps;
}

// ─── Suffix Array ─────────────────────────────────────────────────────────────
export function buildSuffixArray(text) {
  const steps = [];
  const n = text.length;
  const suffixes = Array.from({ length: n }, (_, i) => ({ idx: i, suffix: text.slice(i) }));
  steps.push({ type: 'init', suffixes: suffixes.map(s => ({ ...s })), text, desc: `Tạo ${n} hậu tố từ "${text}"` });

  // Show all suffixes
  suffixes.forEach((s, i) => {
    steps.push({ type: 'suffix', idx: s.idx, suffix: s.suffix, pos: i, desc: `Hậu tố[${s.idx}] = "${s.suffix}"` });
  });

  // Sort with steps
  suffixes.sort((a, b) => {
    steps.push({ type: 'compare', s1: a.suffix, s2: b.suffix, i1: a.idx, i2: b.idx, desc: `So sánh "${a.suffix}" vs "${b.suffix}"` });
    return a.suffix < b.suffix ? -1 : a.suffix > b.suffix ? 1 : 0;
  });

  const sa = suffixes.map(s => s.idx);
  steps.push({ type: 'sorted', suffixes: suffixes.map(s => ({ ...s })), sa, desc: `Suffix Array: [${sa.join(', ')}]` });

  // Build LCP array
  const lcp = Array(n).fill(0);
  for (let i = 1; i < n; i++) {
    let l = 0;
    const s1 = suffixes[i - 1].suffix, s2 = suffixes[i].suffix;
    while (l < s1.length && l < s2.length && s1[l] === s2[l]) l++;
    lcp[i] = l;
    steps.push({ type: 'lcp', i, s1, s2, lcp: l, lcpArr: [...lcp], desc: `LCP[${i}] = ${l} ("${s1}" vs "${s2}")` });
  }

  steps.push({ type: 'done', sa, lcp, suffixes: suffixes.map(s => ({ ...s })), desc: `SA=[${sa}], LCP=[${lcp}]` });
  return steps;
}
