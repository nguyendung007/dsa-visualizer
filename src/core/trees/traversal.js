// ─── Tree Traversal (Inorder, Preorder, Postorder, Level-order) ──────────────
export function inorder(root) {
  const steps = [], result = [];
  function dfs(node) {
    if (!node) return;
    steps.push({ type: 'go_left', node: node.val, desc: `→ Đi trái từ ${node.val}` });
    dfs(node.left);
    result.push(node.val);
    steps.push({ type: 'visit', node: node.val, result: [...result], desc: `THĂM ${node.val}` });
    steps.push({ type: 'go_right', node: node.val, desc: `→ Đi phải từ ${node.val}` });
    dfs(node.right);
    steps.push({ type: 'back', node: node.val, desc: `↑ Quay lại từ ${node.val}` });
  }
  dfs(root);
  steps.push({ type: 'done', result: [...result], desc: `Inorder: [${result.join(', ')}]` });
  return steps;
}

export function preorder(root) {
  const steps = [], result = [];
  function dfs(node) {
    if (!node) return;
    result.push(node.val);
    steps.push({ type: 'visit', node: node.val, result: [...result], desc: `THĂM ${node.val}` });
    steps.push({ type: 'go_left', node: node.val, desc: `→ Đi trái từ ${node.val}` });
    dfs(node.left);
    steps.push({ type: 'go_right', node: node.val, desc: `→ Đi phải từ ${node.val}` });
    dfs(node.right);
    steps.push({ type: 'back', node: node.val, desc: `↑ Quay lại từ ${node.val}` });
  }
  dfs(root);
  steps.push({ type: 'done', result: [...result], desc: `Preorder: [${result.join(', ')}]` });
  return steps;
}

export function postorder(root) {
  const steps = [], result = [];
  function dfs(node) {
    if (!node) return;
    steps.push({ type: 'go_left', node: node.val, desc: `→ Đi trái từ ${node.val}` });
    dfs(node.left);
    steps.push({ type: 'go_right', node: node.val, desc: `→ Đi phải từ ${node.val}` });
    dfs(node.right);
    result.push(node.val);
    steps.push({ type: 'visit', node: node.val, result: [...result], desc: `THĂM ${node.val}` });
    steps.push({ type: 'back', node: node.val, desc: `↑ Quay lại từ ${node.val}` });
  }
  dfs(root);
  steps.push({ type: 'done', result: [...result], desc: `Postorder: [${result.join(', ')}]` });
  return steps;
}

export function levelOrder(root) {
  const steps = [], result = [];
  if (!root) return steps;
  const queue = [root];
  let level = 0;
  while (queue.length) {
    const len = queue.length;
    const levelVals = [];
    steps.push({ type: 'level_start', level, queue: queue.map(n=>n.val), desc: `Bắt đầu tầng ${level}` });
    for (let i = 0; i < len; i++) {
      const node = queue.shift();
      levelVals.push(node.val);
      result.push(node.val);
      steps.push({ type: 'visit', node: node.val, level, result: [...result], desc: `THĂM ${node.val} (tầng ${level})` });
      if (node.left) { queue.push(node.left); steps.push({ type: 'enqueue', node: node.left.val, parent: node.val, desc: `Enqueue ${node.left.val}` }); }
      if (node.right) { queue.push(node.right); steps.push({ type: 'enqueue', node: node.right.val, parent: node.val, desc: `Enqueue ${node.right.val}` }); }
    }
    steps.push({ type: 'level_done', level, levelVals, desc: `Tầng ${level}: [${levelVals.join(', ')}]` });
    level++;
  }
  steps.push({ type: 'done', result: [...result], desc: `Level-order: [${result.join(', ')}]` });
  return steps;
}

// ─── Expression Tree Traversal (Infix / Prefix / Postfix) ────────────────────
export function parseExpression(expr) {
  // Build expression tree from infix expression
  const ops = { '+': 1, '-': 1, '*': 2, '/': 2 };
  const tokens = expr.match(/(\d+(?:\.\d+)?|[+\-*/()])/g) || [];

  function buildNode(val, left = null, right = null) {
    return { val, left, right };
  }

  let pos = 0;
  function parseExpr(minPrec = 0) {
    let left = parsePrimary();
    while (pos < tokens.length && ops[tokens[pos]] >= minPrec) {
      const op = tokens[pos++];
      const right = parseExpr(ops[op] + 1);
      left = buildNode(op, left, right);
    }
    return left;
  }

  function parsePrimary() {
    const tok = tokens[pos++];
    if (tok === '(') {
      const node = parseExpr(0);
      pos++; // consume ')'
      return node;
    }
    return buildNode(tok);
  }

  try { return parseExpr(0); } catch { return null; }
}

export function exprInfix(root, steps = []) {
  const parts = [];
  function dfs(node) {
    if (!node) return;
    const isOp = ['+','-','*','/'].includes(node.val);
    if (isOp) { parts.push('('); steps.push({ type: 'open_paren', desc: `(` }); }
    dfs(node.left);
    parts.push(node.val);
    steps.push({ type: 'visit', node: node.val, expr: [...parts], desc: `→ "${node.val}"` });
    dfs(node.right);
    if (isOp) { parts.push(')'); steps.push({ type: 'close_paren', desc: `)` }); }
  }
  dfs(root);
  steps.push({ type: 'done', expr: [...parts], result: parts.join(' '), desc: `Infix: ${parts.join(' ')}` });
  return steps;
}

export function exprPrefix(root, steps = []) {
  const parts = [];
  function dfs(node) {
    if (!node) return;
    parts.push(node.val);
    steps.push({ type: 'visit', node: node.val, expr: [...parts], desc: `→ "${node.val}"` });
    dfs(node.left);
    dfs(node.right);
  }
  dfs(root);
  steps.push({ type: 'done', expr: [...parts], result: parts.join(' '), desc: `Prefix: ${parts.join(' ')}` });
  return steps;
}

export function exprPostfix(root, steps = []) {
  const parts = [];
  function dfs(node) {
    if (!node) return;
    dfs(node.left);
    dfs(node.right);
    parts.push(node.val);
    steps.push({ type: 'visit', node: node.val, expr: [...parts], desc: `→ "${node.val}"` });
  }
  dfs(root);
  steps.push({ type: 'done', expr: [...parts], result: parts.join(' '), desc: `Postfix: ${parts.join(' ')}` });
  return steps;
}

export function evalExpr(root) {
  if (!root) return 0;
  const l = evalExpr(root.left);
  const r = evalExpr(root.right);
  if (root.val === '+') return l + r;
  if (root.val === '-') return l - r;
  if (root.val === '*') return l * r;
  if (root.val === '/') return r !== 0 ? l / r : NaN;
  return parseFloat(root.val);
}
