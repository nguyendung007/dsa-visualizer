import {
  KMP, RABIN_KARP, SUFFIX_ARRAY, LABELS,
  type SearchStep, type RadixStep, type Quick3Step,
  type SuffixStep, type TSTStep, type TSTNode,
} from './config.js';

export function tstInsert(
  root: TSTNode | null,
  word: string,
  steps: TSTStep[] = [],
): { root: TSTNode; steps: TSTStep[] } {
  function insert(node: TSTNode | null, w: string, d: number): TSTNode {
    const c = w[d];
    if (!node) {
      node = { char: c, left: null, mid: null, right: null, isEnd: false };
      steps.push({ type: 'create_node', char: c, depth: d, word });
    }
    steps.push({ type: 'compare', char: c, nodeChar: node.char, depth: d });
    if (c < node.char) {
      node.left = insert(node.left, w, d);
    } else if (c > node.char) {
      node.right = insert(node.right, w, d);
    } else if (d < w.length - 1) {
      node.mid = insert(node.mid, w, d + 1);
    } else {
      node.isEnd = true;
      steps.push({ type: 'mark_end', char: c, word });
    }
    return node;
  }
  if (!word.length) return { root: root || null as any, steps };
  return { root: insert(root, word, 0), steps };
}

export function tstSearch(
  root: TSTNode | null,
  word: string,
  steps: TSTStep[] = [],
): { found: boolean; steps: TSTStep[] } {
  function search(node: TSTNode | null, w: string, d: number): boolean {
    if (!node) {
      steps.push({ type: 'not_found', word });
      return false;
    }
    const c = w[d];
    steps.push({ type: 'visit', char: c, nodeChar: node.char, depth: d });
    if (c < node.char) return search(node.left, w, d);
    if (c > node.char) return search(node.right, w, d);
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

export function tstToLayout(root: TSTNode | null): { nodes: any[]; edges: any[] } {
  if (!root) return { nodes: [], edges: [] };
  const nodes: any[] = [], edges: any[] = [];
  let id = 0;
  function traverse(node: TSTNode | null, x: number, y: number, parentX: number | null, parentY: number | null, dir: string | null) {
    if (!node) return;
    const nodeId = id++;
    nodes.push({ id: nodeId, char: node.char, x, y, isEnd: node.isEnd });
    if (parentX !== null) edges.push({ from: { x: parentX, y: parentY }, to: { x, y }, dir });
    const spread = 180 / (y / 60 + 1);
    traverse(node.left, x - spread, y + 60, x, y, 'L');
    traverse(node.mid, x, y + 60, x, y, 'M');
    traverse(node.right, x + spread, y + 60, x, y, 'R');
  }
  traverse(root, 300, 40, null, null, null);
  return { nodes, edges };
}

export function lsdRadixSort(arr: string[]): RadixStep[] {
  const steps: RadixStep[] = [];
  if (!arr.length) return steps;
  const W = Math.max(...arr.map(s => s.length));
  let a = arr.map(s => s.padStart(W, ' '));
  steps.push({ type: 'init', arr: [...a], W });

  for (let d = W - 1; d >= 0; d--) {
    const buckets: string[][] = Array.from({ length: 256 }, () => []);
    steps.push({ type: 'pass_start', digit: d });
    for (const s of a) {
      const ch = s.charCodeAt(d);
      buckets[ch].push(s);
      steps.push({ type: 'bucket', word: s, char: s[d], code: ch });
    }
    a = buckets.flat();
    steps.push({ type: 'collected', digit: d, arr: [...a] });
  }
  steps.push({ type: 'done', arr: a.map(s => s.trimStart()) });
  return steps;
}

export function msdRadixSort(arr: string[]): RadixStep[] {
  const steps: RadixStep[] = [];
  if (!arr.length) return steps;
  const W = Math.max(...arr.map(s => s.length));
  let a = arr.map(s => s.padEnd(W, '\0'));
  steps.push({ type: 'init', arr: arr.map(s => s), W });

  function sort(a: string[], lo: number, hi: number, d: number): void {
    if (hi <= lo || d >= W) return;
    const buckets: string[][] = Array.from({ length: 257 }, () => []);
    steps.push({ type: 'pass_start', digit: d });
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
    steps.push({ type: 'collected', digit: d, arr: a.map(s => s.replace(/\0/g, '')) });
  }

  sort(a, 0, a.length - 1, 0);
  steps.push({ type: 'done', arr: a.map(s => s.replace(/\0/g, '')) });
  return steps;
}

export function buildKMPTable(pattern: string): number[] {
  const lps = Array(pattern.length).fill(0);
  let len = 0, i = 1;
  while (i < pattern.length) {
    if (pattern[i] === pattern[len]) { lps[i++] = ++len; }
    else if (len) { len = lps[len - 1]; }
    else { lps[i++] = 0; }
  }
  return lps;
}

export function kmpSearch(text: string, pattern: string): SearchStep[] {
  const steps: SearchStep[] = [];
  const lps = buildKMPTable(pattern);
  steps.push({ type: 'lps', lps: [...lps] });
  let i = 0, j = 0;
  const matches: number[] = [];
  while (i < text.length) {
    steps.push({ type: 'compare', ti: i, pi: j, char_t: text[i], char_p: pattern[j], match: text[i] === pattern[j] });
    if (text[i] === pattern[j]) {
      i++; j++;
      if (j === pattern.length) {
        const pos = i - j;
        matches.push(pos);
        steps.push({ type: 'match', pos });
        j = lps[j - 1];
      }
    } else {
      if (j) {
        const from = j;
        j = lps[j - 1];
        steps.push({ type: 'shift', from, to: j });
      } else i++;
    }
  }
  steps.push({ type: 'done', matches });
  return steps;
}

export function boyerMoore(text: string, pattern: string): SearchStep[] {
  const steps: SearchStep[] = [];
  const m = pattern.length, n = text.length;

  const bad: Record<string, number> = {};
  for (let i = 0; i < m; i++) bad[pattern[i]] = i;
  steps.push({ type: 'bad_char_table', table: { ...bad } });

  const matches: number[] = [];
  let s = 0;
  while (s <= n - m) {
    let j = m - 1;
    steps.push({ type: 'align', shift: s });
    while (j >= 0 && pattern[j] === text[s + j]) {
      steps.push({ type: 'compare', ti: s + j, pi: j, char_t: text[s + j], char_p: pattern[j], match: true });
      j--;
    }
    if (j < 0) {
      matches.push(s);
      steps.push({ type: 'match', pos: s });
      s += (s + m < n) ? m - (bad[text[s + m]] ?? -1) : 1;
    } else {
      steps.push({ type: 'compare', ti: s + j, pi: j, char_t: text[s + j], char_p: pattern[j], match: false });
      const shift = Math.max(1, j - (bad[text[s + j]] ?? -1));
      steps.push({ type: 'shift', amount: shift, reason: `bad char '${text[s + j]}'` });
      s += shift;
    }
  }
  steps.push({ type: 'done', matches });
  return steps;
}


function modPow(base: number, exp: number, mod: number): bigint {
  let result = 1n;
  let b = BigInt(base);
  const M = BigInt(mod);
  let e = BigInt(exp);
  b = b % M;
  while (e > 0n) {
    if (e % 2n === 1n) result = result * b % M;
    e = e / 2n;
    b = b * b % M;
  }
  return result;
}

function modInverse(a: number, mod: number): bigint {
  return modPow(a, mod - 2, mod);
}

export function rabinKarp(
  text: string,
  pattern: string,
  base: number = 31,
  mod: number = 1e9 + 9
): SearchStep[] {
  const steps: SearchStep[] = [];
  const m = pattern.length, n = text.length;
  const matches: number[] = [];

  const B = BigInt(base);
  const M = BigInt(Math.round(mod)); // 1e9+9 = 1000000009
  const invB = modInverse(base, Math.round(mod)); // nghịch đảo của base mod M

  let patHash = 0n, pow = 1n;
  for (let i = 0; i < m; i++) {
    patHash = (patHash + BigInt(pattern.charCodeAt(i)) * pow) % M;
    if (i < m - 1) pow = pow * B % M;
  }
  steps.push({ type: 'pattern_hash', pattern, hash: Number(patHash), base });

  let winHash = 0n, p = 1n;
  for (let i = 0; i < m && i < n; i++) {
    winHash = (winHash + BigInt(text.charCodeAt(i)) * p) % M;
    if (i < m - 1) p = p * B % M;
  }

  for (let i = 0; i <= n - m; i++) {
    steps.push({ type: 'window', pos: i, hash: Number(winHash), match: winHash === patHash });

    if (winHash === patHash) {
      let ok = true;
      for (let k = 0; k < m; k++) {
        const charMatch = text[i + k] === pattern[k];
        steps.push({ type: 'verify', ti: i + k, pi: k, char_t: text[i + k], char_p: pattern[k] });
        if (!charMatch) { ok = false; break; }
      }
      if (ok) { matches.push(i); steps.push({ type: 'match', pos: i }); }
      else steps.push({ type: 'hash_collision', pos: i });
    }

    if (i < n - m) {
      winHash = (winHash - BigInt(text.charCodeAt(i)) % M + M) % M;
      winHash = winHash * invB % M;
      winHash = (winHash + BigInt(text.charCodeAt(i + m)) * pow) % M;

      steps.push({ type: 'roll', removed: text[i], added: text[i + m], newHash: Number(winHash) });
    }
  }

  steps.push({ type: 'done', matches });
  return steps;
}

export function radixQuick3Way(arr: string[]): Quick3Step[] {
  const steps: Quick3Step[] = [];
  const a = [...arr];
  steps.push({ type: 'init', arr: [...a], desc: `3-Way Radix Quicksort: ${a.length} chuỗi` });

  function sort(a: string[], lo: number, hi: number, d: number): void {
    if (hi <= lo) return;
    const pivot = d < a[lo].length ? a[lo].charCodeAt(d) : -1;
    let lt = lo, gt = hi, i = lo + 1;
    steps.push({
      type: 'partition',
      arr: [...a],
      lo,
      hi,
      lt,
      i,
      gt,
      d,
      desc: `Partition [${lo}..${hi}] d=${d}, pivot='${pivot === -1 ? 'ε' : String.fromCharCode(pivot)}'`
    });
    while (i <= gt) {
      const t = d < a[i].length ? a[i].charCodeAt(d) : -1;
      if (t < pivot) {
        [a[lt], a[i]] = [a[i], a[lt]];
        steps.push({
          type: 'swap_lt',
          arr: [...a],
          lo,
          hi,
          lt,
          i,
          gt,
          d,
          desc: `a[${i}] < pivot → swap với lt=${lt}`
        });
        lt++;
        i++;
      } else if (t > pivot) {
        [a[i], a[gt]] = [a[gt], a[i]];
        steps.push({
          type: 'swap_gt',
          arr: [...a],
          lo,
          hi,
          lt,
          i,
          gt,
          d,
          desc: `a[${i}] > pivot → swap với gt=${gt}`
        });
        gt--;
      } else {
        steps.push({
          type: 'equal',
          arr: [...a],
          lo,
          hi,
          lt,
          i,
          gt,
          d,
          desc: `a[${i}] = pivot`
        });
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

export function buildSuffixArray(text: string): SuffixStep[] {
  const steps: SuffixStep[] = [];
  const n = text.length;
  const suffixes = Array.from({ length: n }, (_, i) => ({ idx: i, suffix: text.slice(i) }));
  steps.push({
    type: 'init',
    suffixes: suffixes.map(s => ({ ...s })),
    text,
    desc: `Tạo ${n} hậu tố từ "${text}"`
  });

  suffixes.forEach((s, i) => {
    steps.push({
      type: 'suffix',
      idx: s.idx,
      suffix: s.suffix,
      pos: i,
      desc: `Hậu tố[${s.idx}] = "${s.suffix}"`
    });
  });

  suffixes.sort((a, b) => {
    steps.push({
      type: 'compare',
      s1: a.suffix,
      s2: b.suffix,
      i1: a.idx,
      i2: b.idx,
      desc: `So sánh "${a.suffix}" vs "${b.suffix}"`
    });
    return a.suffix < b.suffix ? -1 : a.suffix > b.suffix ? 1 : 0;
  });

  const sa = suffixes.map(s => s.idx);
  steps.push({
    type: 'sorted',
    suffixes: suffixes.map(s => ({ ...s })),
    sa,
    desc: `Suffix Array: [${sa.join(', ')}]`
  });

  const lcpArr = Array(n).fill(0);
  for (let i = 1; i < n; i++) {
    let l = 0;
    const s1 = suffixes[i - 1].suffix, s2 = suffixes[i].suffix;
    while (l < s1.length && l < s2.length && s1[l] === s2[l]) l++;
    lcpArr[i] = l;
    steps.push({
      type: 'lcp',
      i,
      s1,
      s2,
      lcp: l,
      lcpArr: [...lcpArr],
      desc: `LCP[${i}] = ${l} ("${s1}" vs "${s2}")`
    });
  }

  steps.push({
    type: 'done',
    sa,
    lcp: lcpArr,
    suffixes: suffixes.map(s => ({ ...s })),
    desc: `SA=[${sa}], LCP=[${lcpArr}]`
  });
  return steps;
}