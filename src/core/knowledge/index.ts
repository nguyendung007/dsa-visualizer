// index.ts
import {
  Frame,
  FrameSlot,
  FrameOperation,
  FrameStep,
  ConceptGraph,
  ConceptOperation,
  SemanticNetwork,
  SemanticOperation,
  SemanticStep
} from './config';

// ─── 1. FRAME SYSTEM ──────────────────────────────────────────────────────────
export function frameOps(operations: FrameOperation[]): FrameStep[] {
  const steps: FrameStep[] = [];
  const frames: Record<string, Frame> = {};
  const inheritanceMap: Record<string, string[]> = {};

  function getInheritanceChain(frameName: string): string[] {
    const chain: string[] = [];
    let current = frameName;
    while (current && frames[current]) {
      chain.push(current);
      current = frames[current].parent || '';
    }
    return chain;
  }

  function getAllSlots(frameName: string): Record<string, FrameSlot> {
    const allSlots: Record<string, FrameSlot> = {};
    const chain = getInheritanceChain(frameName);
    for (const name of chain) {
      if (frames[name] && frames[name].slots) {
        Object.assign(allSlots, frames[name].slots);
      }
    }
    return allSlots;
  }

  for (const op of operations) {
    if (op.type === 'create_frame') {
      frames[op.name] = {
        name: op.name,
        slots: op.slots || {},
        parent: op.parent || null,
        instances: []
      } as any;

      if (op.parent) {
        if (!inheritanceMap[op.parent]) inheritanceMap[op.parent] = [];
        inheritanceMap[op.parent].push(op.name);
      }

      steps.push({
        type: 'create_frame',
        frame: op.name,
        parent: op.parent || 'none',
        slots: { ...op.slots },
        allSlots: getAllSlots(op.name),
        inheritanceChain: getInheritanceChain(op.name),
        frames: JSON.parse(JSON.stringify(frames)),
        desc: `Tạo frame "${op.name}"${op.parent ? ` kế thừa từ "${op.parent}"` : ''}`
      });
    } else if (op.type === 'add_slot') {
      if (frames[op.frame]) {
        frames[op.frame].slots[op.slot] = {
          type: op.slotType || 'any',
          default: op.defaultValue || null,
          value: op.defaultValue || null
        };

        steps.push({
          type: 'add_slot',
          frame: op.frame,
          slot: op.slot,
          slotType: op.slotType || 'any',
          defaultValue: op.defaultValue || null,
          allSlots: getAllSlots(op.frame),
          inheritanceChain: getInheritanceChain(op.frame),
          frames: JSON.parse(JSON.stringify(frames)),
          desc: `Thêm slot "${op.slot}" (${op.slotType || 'any'}) vào frame "${op.frame}"`
        });
      }
    } else if (op.type === 'fill_slot') {
      if (frames[op.frame]) {
        if (!frames[op.frame].instances[op.instance]) {
          frames[op.frame].instances[op.instance] = {};
        }
        frames[op.frame].instances[op.instance][op.slot] = op.value;

        const allSlots = getAllSlots(op.frame);
        const isValid = allSlots[op.slot] !== undefined;

        steps.push({
          type: 'fill_slot',
          frame: op.frame,
          instance: op.instance,
          slot: op.slot,
          value: op.value,
          isValid,
          allSlots: getAllSlots(op.frame),
          instanceData: { ...frames[op.frame].instances[op.instance] },
          frames: JSON.parse(JSON.stringify(frames)),
          desc: isValid
            ? `Điền slot "${op.slot}" = ${op.value} cho instance "${op.instance}" của frame "${op.frame}"`
            : `⚠ Slot "${op.slot}" không tồn tại trong frame "${op.frame}" hoặc frame cha!`
        });
      }
    } else if (op.type === 'inherit') {
      const chain = getInheritanceChain(op.frame);

      for (let i = 0; i < chain.length - 1; i++) {
        const child = chain[i];
        const parent = chain[i + 1];
        const parentSlots = frames[parent] ? { ...frames[parent].slots } : {};

        steps.push({
          type: 'inherit_step',
          from: child,
          to: parent,
          childSlots: frames[child] ? { ...frames[child].slots } : {},
          parentSlots,
          inheritedSlots: parentSlots,
          chain: [...chain],
          frames: JSON.parse(JSON.stringify(frames)),
          desc: `${child} kế thừa từ ${parent}: nhận các slot ${Object.keys(parentSlots).join(', ')}`
        });
      }

      steps.push({
        type: 'inherit_done',
        frame: op.frame,
        chain: getInheritanceChain(op.frame),
        allSlots: getAllSlots(op.frame),
        frames: JSON.parse(JSON.stringify(frames)),
        desc: `✓ Hoàn tất kế thừa cho "${op.frame}": ${getInheritanceChain(op.frame).join(' → ')}`
      });
    } else if (op.type === 'show_slots') {
      const chain = getInheritanceChain(op.frame);
      const allSlots = getAllSlots(op.frame);

      steps.push({
        type: 'show_slots',
        frame: op.frame,
        chain,
        allSlots,
        frameSlots: frames[op.frame] ? { ...frames[op.frame].slots } : {},
        frames: JSON.parse(JSON.stringify(frames)),
        desc: `Tất cả slots của "${op.frame}" (bao gồm kế thừa): ${Object.keys(allSlots).join(', ')}`
      });
    }
  }

  steps.push({
    type: 'done',
    frames: JSON.parse(JSON.stringify(frames)),
    inheritanceMap: { ...inheritanceMap },
    desc: `✓ Đã hoàn tất ${operations.length} thao tác với Frame System`
  });

  return steps;
}

// ─── 2. CONCEPT GRAPH ────────────────────────────────────────────────────────
export function conceptGraphOps(graph: ConceptGraph, operations: ConceptOperation[]): FrameStep[] {
  const steps: FrameStep[] = [];
  const { nodes = [], edges = [] } = graph;

  const adjList: Record<string, Array<{ to: string; label: string }>> = {};
  const reverseAdj: Record<string, Array<{ from: string; label: string }>> = {};
  nodes.forEach(n => {
    adjList[n] = [];
    reverseAdj[n] = [];
  });
  edges.forEach(e => {
    adjList[e.from].push({ to: e.to, label: e.label || 'is-a' });
    reverseAdj[e.to].push({ from: e.from, label: e.label || 'is-a' });
  });

  function findPath(from: string, to: string, relation: string | null = null): string[] | null {
    const visited = new Set<string>();
    const queue: string[][] = [[from]];
    while (queue.length > 0) {
      const path = queue.shift()!;
      const node = path[path.length - 1];
      if (node === to) return path;
      if (!visited.has(node)) {
        visited.add(node);
        const neighbors = adjList[node] || [];
        for (const neighbor of neighbors) {
          if (relation && neighbor.label !== relation) continue;
          if (!visited.has(neighbor.to)) {
            queue.push([...path, neighbor.to]);
          }
        }
      }
    }
    return null;
  }

  function findAncestors(node: string, relation: string = 'is-a'): string[] {
    const ancestors: string[] = [];
    const queue = [node];
    const visited = new Set<string>();
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const neighbors = adjList[current] || [];
      for (const neighbor of neighbors) {
        if (neighbor.label === relation && !visited.has(neighbor.to)) {
          ancestors.push(neighbor.to);
          queue.push(neighbor.to);
        }
      }
    }
    return ancestors;
  }

  function findDescendants(node: string, relation: string = 'is-a'): string[] {
    const descendants: string[] = [];
    const queue = [node];
    const visited = new Set<string>();
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      const children = reverseAdj[current] || [];
      for (const child of children) {
        if (child.label === relation && !visited.has(child.from)) {
          descendants.push(child.from);
          queue.push(child.from);
        }
      }
    }
    return descendants;
  }

  for (const op of operations) {
    if (op.type === 'add_node') {
      if (!nodes.includes(op.node)) {
        nodes.push(op.node);
        adjList[op.node] = [];
        reverseAdj[op.node] = [];

        steps.push({
          type: 'add_node',
          node: op.node,
          nodes: [...nodes],
          edges: [...edges],
          desc: `Thêm concept "${op.node}" vào đồ thị`
        });
      }
    } else if (op.type === 'add_edge') {
      const edge = { from: op.from, to: op.to, label: op.label || 'is-a' };
      if (!edges.some(e => e.from === op.from && e.to === op.to)) {
        edges.push(edge);
        if (!adjList[op.from]) adjList[op.from] = [];
        adjList[op.from].push({ to: op.to, label: op.label || 'is-a' });
        if (!reverseAdj[op.to]) reverseAdj[op.to] = [];
        reverseAdj[op.to].push({ from: op.from, label: op.label || 'is-a' });

        steps.push({
          type: 'add_edge',
          from: op.from,
          to: op.to,
          label: op.label || 'is-a',
          nodes: [...nodes],
          edges: [...edges],
          desc: `Thêm quan hệ "${op.label || 'is-a'}" giữa "${op.from}" và "${op.to}"`
        });
      }
    } else if (op.type === 'traverse') {
      const path = findPath(op.from, op.to, op.relation);
      if (path) {
        for (let i = 0; i < path.length - 1; i++) {
          steps.push({
            type: 'traverse_step',
            from: path[i],
            to: path[i + 1],
            path: [...path],
            currentStep: i,
            totalSteps: path.length - 1,
            nodes: [...nodes],
            edges: [...edges],
            desc: `Bước ${i + 1}: ${path[i]} → ${path[i + 1]}`
          });
        }

        steps.push({
          type: 'traverse_done',
          from: op.from,
          to: op.to,
          path,
          nodes: [...nodes],
          edges: [...edges],
          desc: `✓ Tìm thấy đường đi từ "${op.from}" đến "${op.to}": ${path.join(' → ')}`
        });
      } else {
        steps.push({
          type: 'traverse_fail',
          from: op.from,
          to: op.to,
          relation: op.relation || 'any',
          nodes: [...nodes],
          edges: [...edges],
          desc: `✗ Không tìm thấy đường đi từ "${op.from}" đến "${op.to}" với quan hệ "${op.relation || 'any'}"`
        });
      }
    } else if (op.type === 'find_ancestors') {
      const ancestors = findAncestors(op.node, op.relation || 'is-a');
      if (ancestors.length > 0) {
        for (let i = 0; i < ancestors.length; i++) {
          steps.push({
            type: 'ancestor_step',
            node: op.node,
            ancestors: ancestors.slice(0, i + 1),
            nodes: [...nodes],
            edges: [...edges],
            desc: `Tìm thấy ${ancestors[i]} là ancestor của ${op.node}`
          });
        }

        steps.push({
          type: 'ancestors_found',
          node: op.node,
          ancestors,
          nodes: [...nodes],
          edges: [...edges],
          desc: `✓ Các ancestor của "${op.node}" (${op.relation || 'is-a'}): ${ancestors.join(', ')}`
        });
      } else {
        steps.push({
          type: 'ancestors_none',
          node: op.node,
          nodes: [...nodes],
          edges: [...edges],
          desc: `✗ Không tìm thấy ancestor nào của "${op.node}"`
        });
      }
    } else if (op.type === 'find_descendants') {
      const descendants = findDescendants(op.node, op.relation || 'is-a');
      if (descendants.length > 0) {
        steps.push({
          type: 'descendants_found',
          node: op.node,
          descendants,
          nodes: [...nodes],
          edges: [...edges],
          desc: `✓ Các descendant của "${op.node}" (${op.relation || 'is-a'}): ${descendants.join(', ')}`
        });
      } else {
        steps.push({
          type: 'descendants_none',
          node: op.node,
          nodes: [...nodes],
          edges: [...edges],
          desc: `✗ Không tìm thấy descendant nào của "${op.node}"`
        });
      }
    }
  }

  steps.push({
    type: 'done',
    nodes: [...nodes],
    edges: [...edges],
    desc: `✓ Đã hoàn tất với Concept Graph (${nodes.length} nodes, ${edges.length} edges)`
  });

  return steps;
}

// ─── 3. SEMANTIC NETWORK ────────────────────────────────────────────────────
export function semanticNetOps(network: SemanticNetwork, operations: SemanticOperation[]): SemanticStep[] {
  const steps: SemanticStep[] = [];
  const { concepts = [], relations = [], instances = [] } = network;
  const activation: Record<string, number> = {};
  concepts.forEach(c => activation[c] = 0);

  function spreadActivation(
    node: string,
    initialStrength: number = 1.0,
    decay: number = 0.5,
    maxHops: number = 3
  ): Array<{ node: string; strength: number; activationStateAtStep: Record<string, number> }> {
    const localActivation: Record<string, number> = {};
    concepts.forEach(c => localActivation[c] = 0);

    const visited = new Set<string>();
    const queue: Array<{ node: string; strength: number; hops: number }> = [{ node, strength: initialStrength, hops: 0 }];
    const result: Array<{ node: string; strength: number; activationStateAtStep: Record<string, number> }> = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current.node) || current.hops > maxHops) continue;
      visited.add(current.node);

      localActivation[current.node] = current.strength;
      const activationSnapshot = { ...localActivation };

      result.push({
        node: current.node,
        strength: current.strength,
        activationStateAtStep: activationSnapshot
      });

      const neighbors: Array<{ to: string; label: string }> = [];
      relations.forEach(r => {
        if (r.from === current.node) neighbors.push({ to: r.to, label: r.label || 'relates' });
        if (r.to === current.node) neighbors.push({ to: r.from, label: r.label || 'relates' });
      });

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.to)) {
          queue.push({
            node: neighbor.to,
            strength: current.strength * decay,
            hops: current.hops + 1
          });
        }
      }
    }
    return result;
  }

  for (const op of operations) {
    if (op.type === 'add_concept') {
      if (!concepts.includes(op.concept)) {
        concepts.push(op.concept);
        activation[op.concept] = 0;

        steps.push({
          type: 'add_concept',
          concept: op.concept,
          concepts: [...concepts],
          relations: [...relations],
          instances: [...instances],
          activation: { ...activation },
          desc: `Thêm concept "${op.concept}" vào mạng ngữ nghĩa`
        });
      }
    } else if (op.type === 'add_relation') {
      const relation = { from: op.from, to: op.to, label: op.label || 'relates' };
      if (!relations.some(r => r.from === op.from && r.to === op.to && r.label === relation.label)) {
        relations.push(relation);
        steps.push({
          type: 'add_relation',
          from: op.from,
          to: op.to,
          label: relation.label,
          concepts: [...concepts],
          relations: [...relations],
          instances: [...instances],
          activation: { ...activation },
          desc: `Thêm quan hệ "${relation.label}" giữa "${op.from}" và "${op.to}"`
        });
      }
    } else if (op.type === 'spread') {
      const startNode = op.node;
      const initialStrength = op.strength || 1.0;
      const decay = op.decay || 0.5;
      const maxHops = op.maxHops || 3;

      concepts.forEach(c => activation[c] = 0);
      const spreadResult = spreadActivation(startNode, initialStrength, decay, maxHops);

      for (let i = 0; i < spreadResult.length; i++) {
        const result = spreadResult[i];
        activation[result.node] = result.strength;

        steps.push({
          type: 'spread_step',
          node: result.node,
          strength: result.strength,
          activated: spreadResult.slice(0, i + 1).map(r => r.node),
          concepts: [...concepts],
          relations: [...relations],
          instances: [...instances],
          activation: result.activationStateAtStep,
          desc: `Lan truyền đến "${result.node}" với độ mạnh ${result.strength.toFixed(2)}`
        });
      }

      steps.push({
        type: 'spread_done',
        startNode,
        activated: spreadResult.map(r => ({ node: r.node, strength: r.strength })),
        concepts: [...concepts],
        relations: [...relations],
        instances: [...instances],
        activation: { ...activation },
        desc: `✓ Hoàn tất lan truyền từ "${startNode}": ${spreadResult.length} nodes được kích hoạt`
      });
    }
  }

  steps.push({
    type: 'done',
    concepts: [...concepts],
    relations: [...relations],
    instances: [...instances],
    activation: { ...activation },
    desc: `✓ Đã hoàn tất`
  });

  return steps;
}

export default { frameOps, conceptGraphOps, semanticNetOps };