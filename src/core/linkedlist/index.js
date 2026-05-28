// ─── Linked List Core ─────────────────────────────────────────────────────────

export function llBuild(arr, type = 'singly') {
  // Returns {head, nodes[{val,next,prev}]}
  if (!arr.length) return { head: null, nodes: [] };
  const nodes = arr.map((v, i) => ({ id: i, val: v, next: null, prev: null }));
  for (let i = 0; i < nodes.length - 1; i++) nodes[i].next = i + 1;
  if (type === 'doubly') {
    for (let i = 1; i < nodes.length; i++) nodes[i].prev = i - 1;
  }
  if (type === 'circular') {
    nodes[nodes.length - 1].next = 0;
  }
  return { head: 0, nodes };
}

function snapshot(nodes, type) {
  return { nodes: nodes.map(n => ({ ...n })), type };
}

export function llInsertHead(nodes, val, type) {
  const steps = [];
  const a = nodes.map(n => ({ ...n }));
  const newNode = { id: a.length, val, next: a.length > 0 ? 0 : null, prev: null };
  steps.push({ ...snapshot(a, type), op: 'new_node', highlight: newNode.id, desc: `Tạo node mới val=${val}` });

  if (a.length > 0) {
    newNode.next = 0;
    if (type === 'doubly') a[0] = { ...a[0], prev: a.length };
    if (type === 'circular') newNode.next = 0;
    steps.push({ ...snapshot([newNode, ...a].map((n, i) => ({ ...n, id: i })), type), op: 'link', highlight: a.length, desc: `newNode.next → head (${a[0]?.val})` });
  }
  if (type === 'circular' && a.length > 0) {
    a[a.length - 1] = { ...a[a.length - 1], next: a.length };
  }
  const result = [newNode, ...a].map((n, i) => ({ ...n, id: i, next: n.next !== null ? (n.next + 1 <= a.length ? n.next + 1 : null) : null }));
  // Simplify: rebuild properly
  const finalNodes = [{ id: 0, val, next: a.length > 0 ? 1 : null, prev: null }, ...a.map((n, i) => ({
    ...n, id: i + 1,
    next: n.next !== null ? n.next + 1 : (type === 'circular' && i === a.length - 1 ? 0 : null),
    prev: type === 'doubly' ? (i === 0 ? 0 : n.prev !== null ? n.prev + 1 : null) : null,
  }))];
  steps.push({ ...snapshot(finalNodes, type), op: 'done', head: 0, desc: `✓ Chèn ${val} vào đầu danh sách` });
  return { nodes: finalNodes, steps };
}

export function llInsertTail(nodes, val, type) {
  const steps = [];
  const a = nodes.map(n => ({ ...n }));
  const newId = a.length;
  const newNode = { id: newId, val, next: type === 'circular' ? 0 : null, prev: type === 'doubly' && a.length > 0 ? a.length - 1 : null };

  steps.push({ ...snapshot(a, type), op: 'traverse', desc: `Duyệt đến cuối danh sách để chèn ${val}` });
  if (a.length > 0) {
    steps.push({ ...snapshot(a, type), op: 'found_tail', highlight: a.length - 1, desc: `Tìm thấy tail: node ${a[a.length - 1].val}` });
    a[a.length - 1] = { ...a[a.length - 1], next: newId };
  }
  const finalNodes = [...a, newNode];
  steps.push({ ...snapshot(finalNodes, type), op: 'done', highlight: newId, desc: `✓ Chèn ${val} vào cuối` });
  return { nodes: finalNodes, steps };
}

export function llInsertAt(nodes, val, pos, type) {
  const steps = [];
  const a = nodes.map(n => ({ ...n }));
  if (pos <= 0) return llInsertHead(a, val, type);
  if (pos >= a.length) return llInsertTail(a, val, type);

  steps.push({ ...snapshot(a, type), op: 'init', desc: `Chèn ${val} tại vị trí ${pos}` });
  let cur = 0;
  for (let i = 0; i < pos - 1; i++) {
    steps.push({ ...snapshot(a, type), op: 'traverse', highlight: cur, desc: `Duyệt: tại node[${cur}]=${a[cur].val}` });
    cur = a[cur].next;
  }
  const newId = a.length;
  const nextId = a[cur].next;
  const newNode = { id: newId, val, next: nextId, prev: type === 'doubly' ? cur : null };
  a[cur] = { ...a[cur], next: newId };
  if (type === 'doubly' && nextId !== null) a[nextId] = { ...a[nextId], prev: newId };
  const finalNodes = [...a, newNode];
  steps.push({ ...snapshot(finalNodes, type), op: 'done', highlight: newId, desc: `✓ Chèn ${val} tại [${pos}]` });
  return { nodes: finalNodes, steps };
}

export function llDelete(nodes, val, type) {
  const steps = [];
  const a = nodes.map(n => ({ ...n }));
  steps.push({ ...snapshot(a, type), op: 'search', desc: `Tìm node có val=${val}` });

  let prev = null, cur = 0;
  while (cur !== null) {
    steps.push({ ...snapshot(a, type), op: 'check', highlight: cur, desc: `Kiểm tra node[${cur}]=${a[cur].val}` });
    if (a[cur].val === val) {
      steps.push({ ...snapshot(a, type), op: 'found', highlight: cur, desc: `✓ Tìm thấy ${val} tại [${cur}]` });
      const nextId = a[cur].next;
      if (prev !== null) {
        a[prev] = { ...a[prev], next: nextId };
        if (type === 'doubly' && nextId !== null) a[nextId] = { ...a[nextId], prev: prev };
      } else {
        // deleting head
      }
      const finalNodes = a.filter((_, i) => i !== cur).map((n, i) => ({
        ...n, id: i,
        next: n.next === cur ? null : n.next !== null && n.next > cur ? n.next - 1 : n.next,
        prev: n.prev === cur ? null : n.prev !== null && n.prev > cur ? n.prev - 1 : n.prev,
      }));
      steps.push({ ...snapshot(finalNodes, type), op: 'done', desc: `✓ Đã xóa node val=${val}` });
      return { nodes: finalNodes, steps };
    }
    const nextCur = a[cur].next;
    if (type === 'circular' && nextCur === 0 && cur !== 0) break;
    prev = cur; cur = nextCur;
  }
  steps.push({ ...snapshot(a, type), op: 'not_found', desc: `✗ Không tìm thấy val=${val}` });
  return { nodes: a, steps };
}

export function llSearch(nodes, val, type) {
  const steps = [];
  steps.push({ nodes: nodes.map(n => ({ ...n })), type, op: 'init', desc: `Tìm kiếm val=${val}` });
  let cur = 0, visited = 0;
  while (cur !== null && visited < nodes.length + 1) {
    steps.push({ nodes: nodes.map(n => ({ ...n })), type, op: 'check', highlight: cur, desc: `Kiểm tra node[${cur}]=${nodes[cur]?.val}` });
    if (nodes[cur]?.val === val) {
      steps.push({ nodes: nodes.map(n => ({ ...n })), type, op: 'found', highlight: cur, desc: `✓ Tìm thấy ${val} tại vị trí [${cur}]` });
      return steps;
    }
    const next = nodes[cur]?.next;
    if (type === 'circular' && next === 0 && cur !== 0) break;
    cur = next; visited++;
  }
  steps.push({ nodes: nodes.map(n => ({ ...n })), type, op: 'not_found', desc: `✗ Không tìm thấy ${val}` });
  return steps;
}

export function llReverse(nodes, type) {
  const steps = [];
  const a = nodes.map(n => ({ ...n }));
  steps.push({ ...snapshot(a, type), op: 'init', desc: 'Đảo ngược danh sách liên kết' });

  if (type === 'singly') {
    let prev = null, cur = 0;
    while (cur !== null) {
      const next = a[cur].next;
      steps.push({ ...snapshot(a, type), op: 'reverse_ptr', highlight: cur, desc: `Node ${a[cur].val}: next=${next} → prev=${prev}` });
      a[cur] = { ...a[cur], next: prev };
      prev = cur; cur = next;
      steps.push({ ...snapshot(a, type), op: 'move', highlight: prev, desc: `Chuyển: prev=${prev !== null ? a[prev]?.val : 'null'}` });
    }
    steps.push({ ...snapshot(a, type), op: 'done', head: a.length - 1, desc: '✓ Đảo ngược hoàn thành' });
  }
  return { nodes: a, steps };
}
