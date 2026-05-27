// ─── Union-Find / Disjoint Set ────────────────────────────────────────────────

export function createUF(n) {
  return {
    id:     Array.from({ length: n }, (_, i) => i), // Quick Find: component id
    parent: Array.from({ length: n }, (_, i) => i), // Quick Union
    rank:   Array(n).fill(0),
    size:   Array(n).fill(1),
    count:  n,
  };
}

// ─── Quick Find ──────────────────────────────────────────────────────────────
export function qfFind(uf, p) { return uf.id[p]; }
export function qfUnion(uf, p, q, steps = []) {
  const pid = qfFind(uf, p), qid = qfFind(uf, q);
  steps.push({ type: 'find', p, q, pid, qid, id: [...uf.id],
    desc: `Find(${p})=${pid}, Find(${q})=${qid}` });
  if (pid === qid) {
    steps.push({ type: 'same', p, q, id: [...uf.id], desc: `${p} và ${q} đã cùng nhóm` });
    return steps;
  }
  const idCopy = [...uf.id];
  for (let i = 0; i < uf.id.length; i++) {
    if (uf.id[i] === pid) {
      uf.id[i] = qid;
      steps.push({ type: 'update_id', i, from: pid, to: qid, id: [...uf.id],
        desc: `id[${i}]: ${pid} → ${qid}` });
    }
  }
  uf.count--;
  steps.push({ type: 'union_done', p, q, id: [...uf.id], count: uf.count,
    desc: `Union(${p},${q}) hoàn thành. Còn ${uf.count} nhóm` });
  return steps;
}

// ─── Quick Union ─────────────────────────────────────────────────────────────
export function quRoot(parent, p, steps, tracePath = false) {
  const path = [];
  while (parent[p] !== p) { path.push(p); p = parent[p]; }
  if (tracePath && steps) steps.push({ type: 'trace_root', path: [...path, p], root: p, parent: [...parent],
    desc: `Tìm root(${path[0]??p}): đường đi ${[...path,p].join('→')}` });
  return p;
}

export function quUnion(uf, p, q, steps = []) {
  const rp = quRoot(uf.parent, p, steps, true);
  const rq = quRoot(uf.parent, q, steps, true);
  if (rp === rq) {
    steps.push({ type: 'same', p, q, parent: [...uf.parent], desc: `${p} và ${q} đã cùng cây` });
    return steps;
  }
  uf.parent[rp] = rq;
  uf.count--;
  steps.push({ type: 'union_done', p, q, rp, rq, parent: [...uf.parent], count: uf.count,
    desc: `parent[${rp}] = ${rq}. Còn ${uf.count} nhóm` });
  return steps;
}

// ─── Weighted Quick Union ────────────────────────────────────────────────────
export function wquUnion(uf, p, q, steps = []) {
  const rp = quRoot(uf.parent, p, steps, true);
  const rq = quRoot(uf.parent, q, steps, true);
  if (rp === rq) {
    steps.push({ type: 'same', p, q, parent: [...uf.parent], size: [...uf.size], desc: `${p} và ${q} đã cùng cây` });
    return steps;
  }
  steps.push({ type: 'weight_check', rp, rq, sp: uf.size[rp], sq: uf.size[rq], parent: [...uf.parent], size: [...uf.size],
    desc: `size[${rp}]=${uf.size[rp]} vs size[${rq}]=${uf.size[rq]}: gắn cây nhỏ vào cây lớn` });
  if (uf.size[rp] < uf.size[rq]) {
    uf.parent[rp] = rq; uf.size[rq] += uf.size[rp];
    steps.push({ type: 'union_done', p, q, child: rp, root: rq, parent: [...uf.parent], size: [...uf.size], count: uf.count,
      desc: `parent[${rp}]=${rq} (${rp} cây con). size[${rq}]=${uf.size[rq]}` });
  } else {
    uf.parent[rq] = rp; uf.size[rp] += uf.size[rq];
    steps.push({ type: 'union_done', p, q, child: rq, root: rp, parent: [...uf.parent], size: [...uf.size], count: uf.count,
      desc: `parent[${rq}]=${rp} (${rq} cây con). size[${rp}]=${uf.size[rp]}` });
  }
  uf.count--;
  return steps;
}

// ─── Path Compression ────────────────────────────────────────────────────────
export function pcFind(parent, p, steps = []) {
  const orig = p;
  const path = [];
  while (parent[p] !== p) { path.push(p); p = parent[p]; }
  const root = p;
  steps.push({ type: 'pre_compress', path: [...path, root], root, parent: [...parent],
    desc: `Root(${orig}) = ${root}, đường đi: ${[...path,root].join('→')}` });
  // Path compression: halving
  for (const node of path) {
    if (parent[node] !== root) {
      const old = parent[node];
      parent[node] = root;
      steps.push({ type: 'compress', node, from: old, to: root, parent: [...parent],
        desc: `Nén: parent[${node}]: ${old} → ${root}` });
    }
  }
  return root;
}

export function pcUnion(uf, p, q, steps = []) {
  const rp = pcFind(uf.parent, p, steps);
  const rq = pcFind(uf.parent, q, steps);
  if (rp === rq) {
    steps.push({ type: 'same', p, q, parent: [...uf.parent], desc: `${p} và ${q} đã cùng cây` });
    return steps;
  }
  if (uf.size[rp] < uf.size[rq]) { uf.parent[rp] = rq; uf.size[rq] += uf.size[rp]; }
  else { uf.parent[rq] = rp; uf.size[rp] += uf.size[rq]; }
  uf.count--;
  steps.push({ type: 'union_done', p, q, parent: [...uf.parent], size: [...uf.size], count: uf.count,
    desc: `Union(${p},${q}) với path compression. Còn ${uf.count} nhóm` });
  return steps;
}
