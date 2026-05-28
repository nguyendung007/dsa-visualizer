export class BSTNode {
  constructor(val) { this.val = val; this.left = null; this.right = null; this.h = 1; }
}

export function bstInsert(root, val, steps = []) {
  if (!root) {
    const node = new BSTNode(val);
    steps.push({ type: 'insert', node: val, path: [] });
    return { root: node, steps };
  }
  const path = [];
  function ins(node, val) {
    path.push(node.val);
    steps.push({ type: 'compare', comparing: node.val, val, path: [...path] });
    if (val < node.val) {
      if (!node.left) { node.left = new BSTNode(val); steps.push({ type: 'placed', val, parent: node.val, side: 'left', path: [...path] }); }
      else ins(node.left, val);
    } else {
      if (!node.right) { node.right = new BSTNode(val); steps.push({ type: 'placed', val, parent: node.val, side: 'right', path: [...path] }); }
      else ins(node.right, val);
    }
  }
  ins(root, val);
  return { root, steps };
}

export function bstDelete(root, val, steps = []) {
  function minVal(node) { while (node.left) node = node.left; return node.val; }
  function del(node, val) {
    if (!node) return null;
    steps.push({ type: 'searching', val: node.val, target: val });
    if (val < node.val) { node.left = del(node.left, val); }
    else if (val > node.val) { node.right = del(node.right, val); }
    else {
      steps.push({ type: 'found', val: node.val });
      if (!node.left) return node.right;
      if (!node.right) return node.left;
      const min = minVal(node.right);
      steps.push({ type: 'successor', successor: min });
      node.val = min;
      node.right = del(node.right, min);
    }
    return node;
  }
  const newRoot = del(root, val);
  steps.push({ type: 'done' });
  return { root: newRoot, steps };
}

export function treeToLayout(root, W = 640) {
  if (!root) return { nodes: [], edges: [] };
  const nodes = [], edges = [];
  function traverse(node, x, y, level, xMin, xMax) {
    if (!node) return;
    const mx = (xMin + xMax) / 2;
    nodes.push({ val: node.val, x: mx, y, h: node.h });
    if (node.left) {
      edges.push({ from: { x: mx, y }, to: { x: (xMin + mx) / 2, y: y + 70 } });
      traverse(node.left, mx, y + 70, level + 1, xMin, mx);
    }
    if (node.right) {
      edges.push({ from: { x: mx, y }, to: { x: (mx + xMax) / 2, y: y + 70 } });
      traverse(node.right, mx, y + 70, level + 1, mx, xMax);
    }
  }
  traverse(root, 0, 40, 0, 0, W);
  return { nodes, edges };
}

export function avlInsert(root, val, steps = []) {
  function height(n) { return n ? n.h : 0; }
  function bf(n) { return n ? height(n.left) - height(n.right) : 0; }
  function upd(n) { if (n) n.h = 1 + Math.max(height(n.left), height(n.right)); }

  function rotR(y) {
    let x = y.left, T2 = x.right;
    // Capture layout BEFORE rotation for animation
    steps.push({ type: 'pre_rotate', direction: 'right', pivot: x.val, node: y.val, snapshot: JSON.parse(JSON.stringify(y)) });
    x.right = y; y.left = T2;
    upd(y); upd(x);
    steps.push({ type: 'rotate', direction: 'right', node: y.val, pivot: x.val });
    return x;
  }

  function rotL(x) {
    let y = x.right, T2 = y.left;
    steps.push({ type: 'pre_rotate', direction: 'left', pivot: y.val, node: x.val, snapshot: JSON.parse(JSON.stringify(x)) });
    y.left = x; x.right = T2;
    upd(x); upd(y);
    steps.push({ type: 'rotate', direction: 'left', node: x.val, pivot: y.val });
    return y;
  }

  function ins(node, val) {
    if (!node) { const n = new BSTNode(val); n.h = 1; steps.push({ type: 'placed', val }); return n; }
    steps.push({ type: 'compare', comparing: node.val, val });
    if (val < node.val) node.left = ins(node.left, val);
    else node.right = ins(node.right, val);
    upd(node);
    const b = bf(node);
    steps.push({ type: 'balance_check', node: node.val, bf: b });
    if (b > 1 && val < node.left.val) return rotR(node);
    if (b < -1 && val > node.right.val) return rotL(node);
    if (b > 1 && val > node.left.val) { node.left = rotL(node.left); return rotR(node); }
    if (b < -1 && val < node.right.val) { node.right = rotR(node.right); return rotL(node); }
    return node;
  }
  return { root: ins(root, val), steps };
}

// ─── BST Floor & Ceil ────────────────────────────────────────────────────────
export function bstFloor(root, key, steps = []) {
  let floor = null;
  function search(node) {
    if (!node) return;
    steps.push({ type: 'visit', node: node.val, key, floor, desc: `Xét ${node.val}: ${node.val <= key ? `${node.val} ≤ ${key}, cập nhật floor` : `${node.val} > ${key}, đi trái`}` });
    if (node.val === key) {
      floor = node.val;
      steps.push({ type: 'exact', node: node.val, floor, desc: `Tìm thấy đúng ${key}! floor = ${key}` });
      return;
    }
    if (node.val > key) { search(node.left); }
    else {
      floor = node.val;
      steps.push({ type: 'update', node: node.val, floor, desc: `floor cập nhật = ${node.val}, tiếp tục tìm lớn hơn ở phải` });
      search(node.right);
    }
  }
  search(root);
  steps.push({ type: 'done', floor, key, desc: floor !== null ? `✓ Floor(${key}) = ${floor}` : `✗ Không có floor cho ${key}` });
  return { floor, steps };
}

export function bstCeil(root, key, steps = []) {
  let ceil = null;
  function search(node) {
    if (!node) return;
    steps.push({ type: 'visit', node: node.val, key, ceil, desc: `Xét ${node.val}: ${node.val >= key ? `${node.val} ≥ ${key}, cập nhật ceil` : `${node.val} < ${key}, đi phải`}` });
    if (node.val === key) {
      ceil = node.val;
      steps.push({ type: 'exact', node: node.val, ceil, desc: `Tìm thấy đúng ${key}! ceil = ${key}` });
      return;
    }
    if (node.val < key) { search(node.right); }
    else {
      ceil = node.val;
      steps.push({ type: 'update', node: node.val, ceil, desc: `ceil cập nhật = ${node.val}, tiếp tục tìm nhỏ hơn ở trái` });
      search(node.left);
    }
  }
  search(root);
  steps.push({ type: 'done', ceil, key, desc: ceil !== null ? `✓ Ceil(${key}) = ${ceil}` : `✗ Không có ceil cho ${key}` });
  return { ceil, steps };
}
