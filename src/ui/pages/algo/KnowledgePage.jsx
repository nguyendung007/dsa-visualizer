import { useState, useRef } from 'react';
import { frameOps, conceptGraphOps, semanticNetOps } from '../../../core/knowledge/index.ts';
import { AnimationEngine } from '../../../shell/animation/AnimationEngine.js';
import Controls from '../../components/Controls.jsx';
import { useProgress } from '../../../context/ProgressContext.jsx';
import './KnowledgePage.css';

const TAB_NAMES = {
  frame: 'Frame System',
  concept: 'Concept Graph',
  semantic: 'Semantic Network'
};

const TAB_COLORS = {
  frame: '#8b5cf6',
  concept: '#10b981',
  semantic: '#f59e0b'
};

// Hàm khởi tạo dữ liệu mặc định cho từng tab
function defaultFrameData() {
  return {
    frames: [],
    operations: []
  };
}

function defaultConceptData() {
  return {
    nodes: [],
    edges: [],
    operations: []
  };
}

function defaultSemanticData() {
  return {
    concepts: [],
    relations: [],
    instances: [],
    operations: []
  };
}

export default function KnowledgePage() {
  const [tab, setTab] = useState('frame');
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [curStep, setCurStep] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(500);
  
  // State cho Frame System
  const [frameData, setFrameData] = useState(defaultFrameData);
  const [newFrameName, setNewFrameName] = useState('');
  const [newFrameParent, setNewFrameParent] = useState('');
  const [newSlotName, setNewSlotName] = useState('');
  const [newSlotType, setNewSlotType] = useState('string');
  const [newInstanceName, setNewInstanceName] = useState('');
  const [fillSlotFrame, setFillSlotFrame] = useState('');
  const [fillSlotInstance, setFillSlotInstance] = useState('');
  const [fillSlotName, setFillSlotName] = useState('');
  const [fillSlotValue, setFillSlotValue] = useState('');

  // State cho Concept Graph
  const [conceptData, setConceptData] = useState(defaultConceptData);
  const [newConcept, setNewConcept] = useState('');
  const [newEdgeFrom, setNewEdgeFrom] = useState('');
  const [newEdgeTo, setNewEdgeTo] = useState('');
  const [newEdgeLabel, setNewEdgeLabel] = useState('is-a');
  const [traverseFrom, setTraverseFrom] = useState('');
  const [traverseTo, setTraverseTo] = useState('');

  // State cho Semantic Network
  const [semanticData, setSemanticData] = useState(defaultSemanticData);
  const [newSemanticConcept, setNewSemanticConcept] = useState('');
  const [newRelationFrom, setNewRelationFrom] = useState('');
  const [newRelationTo, setNewRelationTo] = useState('');
  const [newRelationLabel, setNewRelationLabel] = useState('relates');
  const [newInstance, setNewInstance] = useState('');
  const [newInstanceConcept, setNewInstanceConcept] = useState('');
  const [spreadNode, setSpreadNode] = useState('');
  const [queryConcept, setQueryConcept] = useState('');

  const engineRef = useRef(null);
  const { saveProgress } = useProgress();

  // ─── RUN OPERATIONS ──────────────────────────────────────────────────────────
  function runOps(opList, opLabel, graphNodes, graphEdges, semanticNetwork) {
    engineRef.current?.pause();
    let s;
    
    if (tab === 'frame') {
      s = frameOps(opList);
    } else if (tab === 'concept') {
      const graph = { 
        nodes: graphNodes || conceptData.nodes, 
        edges: graphEdges || conceptData.edges 
      };
      s = conceptGraphOps(graph, opList);
    } else if (tab === 'semantic') {
      const network = semanticNetwork || {
        concepts: semanticData.concepts,
        relations: semanticData.relations,
        instances: semanticData.instances
      };
      s = semanticNetOps(network, opList);
    }

    setSteps(s);
    setStepIdx(0);
    setCurStep(s[0] || null);
    
    const eng = new AnimationEngine({
      steps: s, 
      speed,
      onStep: (step, idx) => { 
        setCurStep(step); 
        setStepIdx(idx + 1); 
      },
      onDone: () => {
        setPlaying(false);
        saveProgress('knowledge', `${TAB_NAMES[tab]}${opLabel ? ' - ' + opLabel : ''}`);
      },
    });
    engineRef.current = eng;
    return eng;
  }

  // ─── FRAME OPERATIONS ──────────────────────────────────────────────────────
  function addFrame() {
    if (!newFrameName) return;
    const ops = [...frameData.operations, { 
      type: 'create_frame', 
      name: newFrameName, 
      parent: newFrameParent || null,
      slots: {}
    }];
    const newFrames = [...frameData.frames, { 
      name: newFrameName, 
      parent: newFrameParent || null,
      slots: {}
    }];
    setFrameData({ ...frameData, frames: newFrames, operations: ops });
    const eng = runOps(ops, `Create Frame "${newFrameName}"`);
    eng.play();
    setPlaying(true);
    setNewFrameName('');
    setNewFrameParent('');
  }

  function addSlot() {
    if (!newSlotName || !fillSlotFrame) return;
    const ops = [...frameData.operations, {
      type: 'add_slot',
      frame: fillSlotFrame,
      slot: newSlotName,
      slotType: newSlotType
    }];
    const updatedFrames = frameData.frames.map(f => 
      f.name === fillSlotFrame 
        ? { ...f, slots: { ...f.slots, [newSlotName]: { type: newSlotType, default: null } } }
        : f
    );
    setFrameData({ ...frameData, frames: updatedFrames, operations: ops });
    const eng = runOps(ops, `Add Slot "${newSlotName}" to "${fillSlotFrame}"`);
    eng.play();
    setPlaying(true);
    setNewSlotName('');
    setNewSlotType('string');
  }

  function fillSlot() {
    if (!fillSlotFrame || !fillSlotInstance || !fillSlotName) return;
    const ops = [...frameData.operations, {
      type: 'fill_slot',
      frame: fillSlotFrame,
      instance: fillSlotInstance,
      slot: fillSlotName,
      value: fillSlotValue
    }];
    // Cập nhật instances trong frames
    const updatedFrames = frameData.frames.map(f => {
      if (f.name === fillSlotFrame) {
        const instances = { ...f.instances };
        if (!instances[fillSlotInstance]) instances[fillSlotInstance] = {};
        instances[fillSlotInstance][fillSlotName] = fillSlotValue;
        return { ...f, instances };
      }
      return f;
    });
    setFrameData({ ...frameData, frames: updatedFrames, operations: ops });
    const eng = runOps(ops, `Fill "${fillSlotName}" = "${fillSlotValue}"`);
    eng.play();
    setPlaying(true);
    setFillSlotInstance('');
    setFillSlotName('');
    setFillSlotValue('');
    setFillSlotFrame('');
  }

  function showInheritance() {
    if (!fillSlotFrame) return;
    const ops = [...frameData.operations, {
      type: 'inherit',
      frame: fillSlotFrame
    }];
    setFrameData({ ...frameData, operations: ops });
    const eng = runOps(ops, `Show inheritance of "${fillSlotFrame}"`);
    eng.play();
    setPlaying(true);
  }

  function resetFrame() {
    setFrameData(defaultFrameData());
    setSteps([]);
    setCurStep(null);
    setStepIdx(0);
    engineRef.current?.pause();
    setNewFrameName('');
    setNewFrameParent('');
    setNewSlotName('');
    setNewSlotType('string');
    setNewInstanceName('');
    setFillSlotFrame('');
    setFillSlotInstance('');
    setFillSlotName('');
    setFillSlotValue('');
  }

  // ─── CONCEPT GRAPH OPERATIONS ──────────────────────────────────────────────
  function addConcept() {
    if (!newConcept) return;
    const ops = [...conceptData.operations, { type: 'add_node', node: newConcept }];
    const newNodes = [...conceptData.nodes, newConcept];
    setConceptData({ ...conceptData, nodes: newNodes, operations: ops });
    const eng = runOps(ops, `Add Concept "${newConcept}"`, newNodes, conceptData.edges);
    eng.play();
    setPlaying(true);
    setNewConcept('');
  }

  function addConceptEdge() {
    if (!newEdgeFrom || !newEdgeTo) return;
    const ops = [...conceptData.operations, { 
      type: 'add_edge', 
      from: newEdgeFrom, 
      to: newEdgeTo, 
      label: newEdgeLabel 
    }];
    const newEdges = [...conceptData.edges, { from: newEdgeFrom, to: newEdgeTo, label: newEdgeLabel }];
    setConceptData({ ...conceptData, edges: newEdges, operations: ops });
    const eng = runOps(ops, `Add Relation "${newEdgeFrom} → ${newEdgeTo}"`, conceptData.nodes, newEdges);
    eng.play();
    setPlaying(true);
    setNewEdgeFrom('');
    setNewEdgeTo('');
  }

  function traverseConcept() {
    if (!traverseFrom || !traverseTo) return;
    const ops = [...conceptData.operations, { 
      type: 'traverse', 
      from: traverseFrom, 
      to: traverseTo 
    }];
    setConceptData({ ...conceptData, operations: ops });
    const eng = runOps(ops, `Traverse "${traverseFrom}" → "${traverseTo}"`, conceptData.nodes, conceptData.edges);
    eng.play();
    setPlaying(true);
  }

  function findAncestors() {
    if (!traverseFrom) return;
    const ops = [...conceptData.operations, { 
      type: 'find_ancestors', 
      node: traverseFrom 
    }];
    setConceptData({ ...conceptData, operations: ops });
    const eng = runOps(ops, `Find ancestors of "${traverseFrom}"`, conceptData.nodes, conceptData.edges);
    eng.play();
    setPlaying(true);
  }

  function resetConcept() {
    setConceptData(defaultConceptData());
    setSteps([]);
    setCurStep(null);
    setStepIdx(0);
    engineRef.current?.pause();
    setNewConcept('');
    setNewEdgeFrom('');
    setNewEdgeTo('');
    setNewEdgeLabel('is-a');
    setTraverseFrom('');
    setTraverseTo('');
  }

  // ─── SEMANTIC NETWORK OPERATIONS ────────────────────────────────────────────
  function addSemanticConcept() {
    if (!newSemanticConcept) return;
    const ops = [...semanticData.operations, { 
      type: 'add_concept', 
      concept: newSemanticConcept 
    }];
    const newConcepts = [...semanticData.concepts, newSemanticConcept];
    setSemanticData({ ...semanticData, concepts: newConcepts, operations: ops });
    const eng = runOps(ops, `Add Concept "${newSemanticConcept}"`, null, null, {
      concepts: newConcepts,
      relations: semanticData.relations,
      instances: semanticData.instances
    });
    eng.play();
    setPlaying(true);
    setNewSemanticConcept('');
  }

  function addSemanticRelation() {
    if (!newRelationFrom || !newRelationTo) return;
    const ops = [...semanticData.operations, { 
      type: 'add_relation', 
      from: newRelationFrom, 
      to: newRelationTo, 
      label: newRelationLabel 
    }];
    const newRelations = [...semanticData.relations, { 
      from: newRelationFrom, 
      to: newRelationTo, 
      label: newRelationLabel 
    }];
    setSemanticData({ ...semanticData, relations: newRelations, operations: ops });
    const eng = runOps(ops, `Add Relation "${newRelationFrom} → ${newRelationTo}"`, null, null, {
      concepts: semanticData.concepts,
      relations: newRelations,
      instances: semanticData.instances
    });
    eng.play();
    setPlaying(true);
    setNewRelationFrom('');
    setNewRelationTo('');
  }

  function addSemanticInstance() {
    if (!newInstance || !newInstanceConcept) return;
    const ops = [...semanticData.operations, { 
      type: 'add_instance', 
      name: newInstance, 
      concept: newInstanceConcept,
      properties: {}
    }];
    const newInstances = [...semanticData.instances, { 
      name: newInstance, 
      concept: newInstanceConcept,
      properties: {}
    }];
    setSemanticData({ ...semanticData, instances: newInstances, operations: ops });
    const eng = runOps(ops, `Add Instance "${newInstance}" of "${newInstanceConcept}"`, null, null, {
      concepts: semanticData.concepts,
      relations: semanticData.relations,
      instances: newInstances
    });
    eng.play();
    setPlaying(true);
    setNewInstance('');
    setNewInstanceConcept('');
  }

  function spreadActivation() {
    if (!spreadNode) return;
    const ops = [...semanticData.operations, { 
      type: 'spread', 
      node: spreadNode,
      strength: 1.0,
      decay: 0.5,
      maxHops: 3
    }];
    setSemanticData({ ...semanticData, operations: ops });
    const eng = runOps(ops, `Spread from "${spreadNode}"`, null, null, {
      concepts: semanticData.concepts,
      relations: semanticData.relations,
      instances: semanticData.instances
    });
    eng.play();
    setPlaying(true);
  }

  function queryInstances() {
    if (!queryConcept) return;
    const ops = [...semanticData.operations, { 
      type: 'query', 
      concept: queryConcept 
    }];
    setSemanticData({ ...semanticData, operations: ops });
    const eng = runOps(ops, `Query instances of "${queryConcept}"`, null, null, {
      concepts: semanticData.concepts,
      relations: semanticData.relations,
      instances: semanticData.instances
    });
    eng.play();
    setPlaying(true);
  }

  function resetSemantic() {
    setSemanticData(defaultSemanticData());
    setSteps([]);
    setCurStep(null);
    setStepIdx(0);
    engineRef.current?.pause();
    setNewSemanticConcept('');
    setNewRelationFrom('');
    setNewRelationTo('');
    setNewRelationLabel('relates');
    setNewInstance('');
    setNewInstanceConcept('');
    setSpreadNode('');
    setQueryConcept('');
  }

  // ─── UI HELPERS ──────────────────────────────────────────────────────────────
  function stepDesc(s) {
    if (!s) {
      if (tab === 'frame') return 'Tạo Frame, thêm Slot, hoặc điền Instance';
      if (tab === 'concept') return 'Thêm Concept hoặc quan hệ, tìm đường đi';
      return 'Thêm Concept, Relation, Instance, hoặc lan truyền';
    }
    
    if (s.type === 'create_frame') return s.desc || `Tạo frame "${s.frame}"`;
    if (s.type === 'add_slot') return s.desc || `Thêm slot "${s.slot}" vào "${s.frame}"`;
    if (s.type === 'fill_slot') return s.desc || `Điền slot "${s.slot}" = ${s.value}`;
    if (s.type === 'inherit_step') return s.desc || `${s.from} → ${s.to}`;
    if (s.type === 'inherit_done') return s.desc || `✓ Hoàn tất kế thừa`;
    if (s.type === 'show_slots') return s.desc || `Slots: ${Object.keys(s.allSlots || {}).join(', ')}`;
    
    if (s.type === 'add_node') return s.desc || `Thêm concept "${s.node}"`;
    if (s.type === 'add_edge') return s.desc || `Thêm quan hệ "${s.label}" giữa "${s.from}" và "${s.to}"`;
    if (s.type === 'traverse_step') return s.desc || `${s.from} → ${s.to}`;
    if (s.type === 'traverse_done') return s.desc || `✓ Tìm thấy đường đi`;
    if (s.type === 'traverse_fail') return s.desc || `✗ Không tìm thấy đường đi`;
    if (s.type === 'ancestor_step') return s.desc || `Tìm thấy ${s.ancestor}`;
    if (s.type === 'ancestors_found') return s.desc || `✓ ${s.ancestors?.join(', ')}`;
    
    if (s.type === 'add_concept') return s.desc || `Thêm concept "${s.concept}"`;
    if (s.type === 'add_relation') return s.desc || `Thêm quan hệ "${s.label}"`;
    if (s.type === 'add_instance') return s.desc || `Thêm instance "${s.instance || s.name}"`;
    if (s.type === 'spread_step') return s.desc || `Lan truyền đến "${s.node}" (${s.strength?.toFixed(2)})`;
    if (s.type === 'spread_done') return s.desc || `✓ Hoàn tất lan truyền`;
    if (s.type === 'infer_step') return s.desc || `${s.from} ${s.label || s.relation || '→'} ${s.to}`;
    if (s.type === 'query') return s.desc || `Truy vấn: ${s.instances?.length} instances`;
    
    if (s.type === 'done') return s.desc || '✓ Hoàn thành!';
    return s.desc || '';
  }

  function getCurrentData() {
    if (tab === 'frame') return frameData;
    if (tab === 'concept') return conceptData;
    return semanticData;
  }

  // ─── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="page">
      <div className="page-header">
        <h1>Knowledge Models</h1>
        <p>Frame System, Concept Graph, Semantic Network — trực quan hóa các mô hình tri thức</p>
      </div>

      <div className="algo-tabs">
        {Object.entries(TAB_NAMES).map(([k, n]) => (
          <button key={k} className={`algo-tab ${tab === k ? 'active' : ''}`}
            style={{ '--tab-color': TAB_COLORS[k] }}
            onClick={() => { 
              setTab(k); 
              setSteps([]); 
              setCurStep(null); 
              setStepIdx(0); 
              setPlaying(false);
              engineRef.current?.pause();
              // Reset all input fields when switching tabs
              setNewFrameName('');
              setNewFrameParent('');
              setNewSlotName('');
              setNewSlotType('string');
              setNewInstanceName('');
              setFillSlotFrame('');
              setFillSlotInstance('');
              setFillSlotName('');
              setFillSlotValue('');
              setNewConcept('');
              setNewEdgeFrom('');
              setNewEdgeTo('');
              setNewEdgeLabel('is-a');
              setTraverseFrom('');
              setTraverseTo('');
              setNewSemanticConcept('');
              setNewRelationFrom('');
              setNewRelationTo('');
              setNewRelationLabel('relates');
              setNewInstance('');
              setNewInstanceConcept('');
              setSpreadNode('');
              setQueryConcept('');
            }}>
            {n}
          </button>
        ))}
      </div>

      <div className="knowledge-workspace">
        <div className="knowledge-main">
          <div className="step-desc">
            <span className="step-badge">Bước {stepIdx}/{steps.length}</span>
            <span className="step-text">{stepDesc(curStep)}</span>
          </div>

          {/* ─── FRAME SYSTEM VISUALIZATION ─── */}
          {tab === 'frame' && (
            <div className="frame-viz">
              {curStep?.frames && Object.keys(curStep.frames).length > 0 ? (
                <div className="frame-container">
                  {Object.entries(curStep.frames).map(([name, frame]) => (
                    <div key={name} className="frame-box">
                      <div className="frame-header">
                        <span className="frame-name">{name}</span>
                        {frame.parent && <span className="frame-parent">← {frame.parent}</span>}
                      </div>
                      <div className="frame-slots">
                        {Object.entries(frame.slots || {}).map(([slotName, slot]) => (
                          <div key={slotName} className="frame-slot">
                            <span className="slot-name">{slotName}</span>
                            <span className="slot-type">({slot.type || 'any'})</span>
                            {slot.value !== undefined && slot.value !== null && 
                              <span className="slot-value">= {slot.value}</span>
                            }
                          </div>
                        ))}
                        {Object.keys(frame.slots || {}).length === 0 && 
                          <div className="frame-empty">No slots</div>
                        }
                      </div>
                      {frame.instances && Object.keys(frame.instances).length > 0 && (
                        <div className="frame-instances">
                          <div className="instances-title">Instances:</div>
                          {Object.entries(frame.instances).map(([inst, data]) => (
                            <div key={inst} className="instance-item">
                              <span className="instance-name">{inst}</span>
                              <span className="instance-data">
                                {Object.entries(data).map(([k, v]) => `${k}=${v}`).join(', ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {curStep.chain && curStep.chain.length > 0 && (
                        <div className="frame-chain">
                          Chain: {curStep.chain.join(' → ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">Chưa có Frame nào. Hãy tạo Frame bên phải!</div>
              )}
            </div>
          )}

          {/* ─── CONCEPT GRAPH VISUALIZATION ─── */}
          {tab === 'concept' && (
            <div className="concept-viz">
              {curStep?.nodes && curStep.nodes.length > 0 ? (
                <svg width="100%" height="400" viewBox="0 0 600 400" className="concept-svg">
                  {/* Vẽ edges */}
                  {(curStep.edges || []).map((edge, i) => {
                    const fromIdx = curStep.nodes.indexOf(edge.from);
                    const toIdx = curStep.nodes.indexOf(edge.to);
                    if (fromIdx === -1 || toIdx === -1) return null;
                    const angleFrom = (fromIdx / curStep.nodes.length) * 2 * Math.PI - Math.PI / 2;
                    const angleTo = (toIdx / curStep.nodes.length) * 2 * Math.PI - Math.PI / 2;
                    const cx = 300, cy = 200, r = 150;
                    const x1 = cx + r * Math.cos(angleFrom);
                    const y1 = cy + r * Math.sin(angleFrom);
                    const x2 = cx + r * Math.cos(angleTo);
                    const y2 = cy + r * Math.sin(angleTo);
                    
                    const isHighlighted = curStep.from === edge.from && curStep.to === edge.to;
                    const isPath = curStep.path && 
                      curStep.path.some((node, idx) => 
                        node === edge.from && curStep.path[idx + 1] === edge.to
                      );
                    
                    return (
                      <g key={i}>
                        <line 
                          x1={x1} y1={y1} x2={x2} y2={y2}
                          stroke={isPath ? '#10b981' : isHighlighted ? '#f59e0b' : '#1e3a5f'}
                          strokeWidth={isPath ? 4 : isHighlighted ? 3 : 2}
                          strokeDasharray={isHighlighted ? '4' : '0'}
                        />
                        {edge.label && (
                          <text 
                            x={(x1 + x2) / 2} 
                            y={(y1 + y2) / 2 - 8}
                            textAnchor="middle"
                            fill="#4a6b8a"
                            fontSize="10"
                            fontFamily="monospace"
                          >
                            {edge.label}
                          </text>
                        )}
                      </g>
                    );
                  })}
                  {/* Vẽ nodes */}
                  {(curStep.nodes || []).map((node, i) => {
                    const angle = (i / curStep.nodes.length) * 2 * Math.PI - Math.PI / 2;
                    const cx = 300, cy = 200, r = 150;
                    const x = cx + r * Math.cos(angle);
                    const y = cy + r * Math.sin(angle);
                    
                    const isActive = curStep.node === node;
                    const isPath = curStep.path && curStep.path.includes(node);
                    const isAncestor = curStep.ancestors && curStep.ancestors.includes(node); 
                    
                    let fill = '#1d4ed8';
                    if (isPath) fill = '#10b981';
                    else if (isActive) fill = '#f59e0b';
                    else if (isAncestor) fill = '#8b5cf6';
                    
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y} r={25} fill={fill} stroke="#fff" strokeWidth="2" />
                        <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fill="white" fontSize="12" fontWeight="700">
                          {node}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              ) : (
                <div className="empty-state">Chưa có Concept nào. Hãy thêm Concept bên phải!</div>
              )}
            </div>
          )}

          {/* ─── SEMANTIC NETWORK VISUALIZATION ─── */}
          {tab === 'semantic' && (
            <div className="semantic-viz">
              {curStep?.concepts && curStep.concepts.length > 0 ? (
                <div className="semantic-container">
                  <svg width="100%" height="400" viewBox="0 0 600 400" className="semantic-svg">
                    {/* Vẽ relations */}
                    {(curStep.relations || []).map((rel, i) => {
                      const fromIdx = curStep.concepts.indexOf(rel.from);
                      const toIdx = curStep.concepts.indexOf(rel.to);
                      if (fromIdx === -1 || toIdx === -1) return null;
                      
                      const angleFrom = (fromIdx / curStep.concepts.length) * 2 * Math.PI - Math.PI / 2;
                      const angleTo = (toIdx / curStep.concepts.length) * 2 * Math.PI - Math.PI / 2;
                      const cx = 300, cy = 200, r = 140;
                      const x1 = cx + r * Math.cos(angleFrom);
                      const y1 = cy + r * Math.sin(angleFrom);
                      const x2 = cx + r * Math.cos(angleTo);
                      const y2 = cy + r * Math.sin(angleTo);
                      
                      const isActive = curStep.from === rel.from && curStep.to === rel.to;
                      const activation1 = curStep.activation?.[rel.from] || 0;
                      const activation2 = curStep.activation?.[rel.to] || 0;
                      const isActivated = activation1 > 0 || activation2 > 0;
                      
                      let strokeColor = '#1e3a5f';
                      if (isActive) strokeColor = '#f59e0b';
                      else if (isActivated) strokeColor = '#f472b6';
                      
                      return (
                        <g key={i}>
                          <line 
                            x1={x1} y1={y1} x2={x2} y2={y2}
                            stroke={strokeColor}
                            strokeWidth={isActive ? 3 : isActivated ? 2.5 : 1.5}
                          />
                          <text 
                            x={(x1 + x2) / 2} 
                            y={(y1 + y2) / 2 - 10}
                            textAnchor="middle"
                            fill="#4a6b8a"
                            fontSize="9"
                            fontFamily="monospace"
                          >
                            {rel.label}
                          </text>
                        </g>
                      );
                    })}
                    {/* Vẽ concepts */}
                    {(curStep.concepts || []).map((concept, i) => {
                      const angle = (i / curStep.concepts.length) * 2 * Math.PI - Math.PI / 2;
                      const cx = 300, cy = 200, r = 140;
                      const x = cx + r * Math.cos(angle);
                      const y = cy + r * Math.sin(angle);
                      
                      const activation = curStep.activation?.[concept] || 0;
                      const isActive = curStep.node === concept;
                      const isSpread = activation > 0;
                      
                      let fill = '#1d4ed8';
                      let size = 25;
                      if (isSpread) {
                        fill = '#f472b6';
                        size = 25 + activation * 10;
                      }
                      if (isActive) fill = '#f59e0b';
                      
                      return (
                        <g key={i}>
                          <circle cx={x} cy={y} r={size} fill={fill} stroke="#fff" strokeWidth="2" />
                          <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fill="white" fontSize="12" fontWeight="700">
                            {concept}
                          </text>
                          {activation > 0 && (
                            <text x={x} y={y + size + 12} textAnchor="middle" fill="#f472b6" fontSize="9">
                              {activation.toFixed(2)}
                            </text>
                          )}
                        </g>
                      );
                    })}
                    {/* Vẽ instances */}
                    {(curStep.instances || []).map((inst, i) => {
                      const angle = (i / Math.max(curStep.instances.length, 1)) * 2 * Math.PI - Math.PI / 2;
                      const cx = 300, cy = 200, r = 190;
                      const x = cx + r * Math.cos(angle + 0.3);
                      const y = cy + r * Math.sin(angle + 0.3);
                      
                      return (
                        <g key={`inst-${i}`}>
                          <circle cx={x} cy={y} r={14} fill="#6b7280" stroke="#fff" strokeWidth="1.5" />
                          <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fill="white" fontSize="8" fontWeight="600">
                            {inst.name}
                          </text>
                          <text x={x} y={y + 18} textAnchor="middle" fill="#4a6b8a" fontSize="7">
                            {inst.concept}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              ) : (
                <div className="empty-state">Chưa có Concept nào. Hãy thêm Concept bên phải!</div>
              )}
            </div>
          )}
        </div>

        {/* ─── KNOWLEDGE SIDEBAR CONTROL ─── */}
        <div className="knowledge-sidebar">
          
          {/* 1. ĐIỀU KHIỂN THEO TAB FRAME SYSTEM */}
          {tab === 'frame' && (
            <>
              <div className="ctrl-section">
                <h3>Quản lý Frame</h3>
                <input 
                  type="text" placeholder="Tên Frame mới..." className="arr-input" style={{ width: '100%', marginBottom: 6 }}
                  value={newFrameName} onChange={e => setNewFrameName(e.target.value)}
                />
                <input 
                  type="text" placeholder="Tên Frame cha (tùy chọn)..." className="arr-input" style={{ width: '100%', marginBottom: 6 }}
                  value={newFrameParent} onChange={e => setNewFrameParent(e.target.value)}
                />
                <button className="btn-generate" style={{ width: '100%' }} onClick={addFrame}>+ Tạo Frame</button>
              </div>

              <div className="ctrl-section">
                <h3>Thêm thuộc tính (Slot)</h3>
                <input 
                  type="text" placeholder="Tên Frame mục tiêu..." className="arr-input" style={{ width: '100%', marginBottom: 6 }}
                  value={fillSlotFrame} onChange={e => setFillSlotFrame(e.target.value)}
                />
                <input 
                  type="text" placeholder="Tên thuộc tính (Slot)..." className="arr-input" style={{ width: '100%', marginBottom: 6 }}
                  value={newSlotName} onChange={e => setNewSlotName(e.target.value)}
                />
                <select className="arr-input" style={{ width: '100%', marginBottom: 6 }} value={newSlotType} onChange={e => setNewSlotType(e.target.value)}>
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                </select>
                <button className="btn-generate" style={{ width: '100%', marginBottom: 6 }} onClick={addSlot}>+ Thêm Slot</button>
                <button className="mode-btn" style={{ width: '100%' }} onClick={showInheritance}>Xem kế thừa</button>
              </div>

              <div className="ctrl-section">
                <h3>Điền dữ liệu thuộc tính</h3>
                <input 
                  type="text" placeholder="Tên Instance..." className="arr-input" style={{ width: '100%', marginBottom: 6 }}
                  value={fillSlotInstance} onChange={e => setFillSlotInstance(e.target.value)}
                />
                <input 
                  type="text" placeholder="Tên thuộc tính cần điền..." className="arr-input" style={{ width: '100%', marginBottom: 6 }}
                  value={fillSlotName} onChange={e => setFillSlotName(e.target.value)}
                />
                <input 
                  type="text" placeholder="Giá trị..." className="arr-input" style={{ width: '100%', marginBottom: 6 }}
                  value={fillSlotValue} onChange={e => setFillSlotValue(e.target.value)}
                />
                <button className="btn-generate" style={{ width: '100%', backgroundColor: '#8b5cf6' }} onClick={fillSlot}>Điền thuộc tính</button>
              </div>

              <div className="ctrl-section">
                <button className="mode-btn danger" style={{ width: '100%' }} onClick={resetFrame}>Reset Frame System</button>
              </div>
            </>
          )}

          {/* 2. ĐIỀU KHIỂN THEO TAB CONCEPT GRAPH */}
          {tab === 'concept' && (
            <>
              <div className="ctrl-section">
                <h3>Thêm Concept (Nút)</h3>
                <input 
                  type="text" placeholder="Tên Concept (VD: Động Vật)..." className="arr-input" style={{ width: '100%', marginBottom: 6 }}
                  value={newConcept} onChange={e => setNewConcept(e.target.value)}
                />
                <button className="btn-generate" style={{ width: '100%' }} onClick={addConcept}>+ Thêm Concept</button>
              </div>

              <div className="ctrl-section">
                <h3>Thêm Quan Hệ (Cạnh)</h3>
                <input 
                  type="text" placeholder="Từ Concept..." className="arr-input" style={{ width: '100%', marginBottom: 6 }}
                  value={newEdgeFrom} onChange={e => setNewEdgeFrom(e.target.value)}
                />
                <input 
                  type="text" placeholder="Đến Concept..." className="arr-input" style={{ width: '100%', marginBottom: 6 }}
                  value={newEdgeTo} onChange={e => setNewEdgeTo(e.target.value)}
                />
                <input 
                  type="text" placeholder="Nhãn quan hệ (is-a, part-of)..." className="arr-input" style={{ width: '100%', marginBottom: 6 }}
                  value={newEdgeLabel} onChange={e => setNewEdgeLabel(e.target.value)}
                />
                <button className="btn-generate" style={{ width: '100%' }} onClick={addConceptEdge}>+ Thêm Quan Hệ</button>
              </div>

              <div className="ctrl-section">
                <h3>Truy vấn đồ thị</h3>
                <input 
                  type="text" placeholder="Bắt đầu từ..." className="arr-input" style={{ width: '100%', marginBottom: 6 }}
                  value={traverseFrom} onChange={e => setTraverseFrom(e.target.value)}
                />
                <input 
                  type="text" placeholder="Đích đến..." className="arr-input" style={{ width: '100%', marginBottom: 6 }}
                  value={traverseTo} onChange={e => setTraverseTo(e.target.value)}
                />
                <button className="mode-btn" style={{ width: '100%', marginBottom: 6 }} onClick={traverseConcept}>Tìm đường đi</button>
                <button className="mode-btn" style={{ width: '100%' }} onClick={findAncestors}>Tìm cha/tổ tiên</button>
              </div>

              <div className="ctrl-section">
                <button className="mode-btn danger" style={{ width: '100%' }} onClick={resetConcept}>Reset Concept Graph</button>
              </div>
            </>
          )}

          {/* 3. ĐIỀU KHIỂN THEO TAB SEMANTIC NETWORK */}
          {tab === 'semantic' && (
            <>
              <div className="ctrl-section">
                <h3>Thêm Concept</h3>
                <input 
                  type="text" placeholder="Tên lớp tri thức..." className="arr-input" style={{ width: '100%', marginBottom: 6 }}
                  value={newSemanticConcept} onChange={e => setNewSemanticConcept(e.target.value)}
                />
                <button className="btn-generate" style={{ width: '100%' }} onClick={addSemanticConcept}>+ Thêm Lớp</button>
              </div>

              <div className="ctrl-section">
                <h3>Thêm Quan Hệ</h3>
                <input 
                  type="text" placeholder="Từ..." className="arr-input" style={{ width: '100%', marginBottom: 6 }}
                  value={newRelationFrom} onChange={e => setNewRelationFrom(e.target.value)}
                />
                <input 
                  type="text" placeholder="Đến..." className="arr-input" style={{ width: '100%', marginBottom: 6 }}
                  value={newRelationTo} onChange={e => setNewRelationTo(e.target.value)}
                />
                <input 
                  type="text" placeholder="Mối quan hệ..." className="arr-input" style={{ width: '100%', marginBottom: 6 }}
                  value={newRelationLabel} onChange={e => setNewRelationLabel(e.target.value)}
                />
                <button className="btn-generate" style={{ width: '100%' }} onClick={addSemanticRelation}>+ Thêm Liên Kết</button>
              </div>

              <div className="ctrl-section">
                <h3>Thêm Thực Thể (Instance)</h3>
                <input 
                  type="text" placeholder="Tên thực thể cụ thể..." className="arr-input" style={{ width: '100%', marginBottom: 6 }}
                  value={newInstance} onChange={e => setNewInstance(e.target.value)}
                />
                <input 
                  type="text" placeholder="Thuộc về Concept nào..." className="arr-input" style={{ width: '100%', marginBottom: 6 }}
                  value={newInstanceConcept} onChange={e => setNewInstanceConcept(e.target.value)}
                />
                <button className="btn-generate" style={{ width: '100%' }} onClick={addSemanticInstance}>+ Thêm Instance</button>
              </div>

              <div className="ctrl-section">
                <h3>Thuật toán Lan Truyền kích hoạt</h3>
                <input 
                  type="text" placeholder="Nút kích hoạt nguồn..." className="arr-input" style={{ width: '100%', marginBottom: 6 }}
                  value={spreadNode} onChange={e => setSpreadNode(e.target.value)}
                />
                <button className="btn-generate" style={{ width: '100%', backgroundColor: '#f59e0b' }} onClick={spreadActivation}>▶ Kích Hoạt Lan Truyền</button>
              </div>

              <div className="ctrl-section">
                <h3>Truy vấn Thực Thể</h3>
                <input 
                  type="text" placeholder="Nhập tên lớp cần truy vấn..." className="arr-input" style={{ width: '100%', marginBottom: 6 }}
                  value={queryConcept} onChange={e => setQueryConcept(e.target.value)}
                />
                <button className="mode-btn" style={{ width: '100%' }} onClick={queryInstances}>Lọc Instance</button>
              </div>

              <div className="ctrl-section">
                <button className="mode-btn danger" style={{ width: '100%' }} onClick={resetSemantic}>Reset Semantic Network</button>
              </div>
            </>
          )}

        </div>
      </div>

      <Controls
        playing={playing}
        onPlay={() => { setPlaying(true); engineRef.current?.play(); }}
        onPause={() => { setPlaying(false); engineRef.current?.pause(); }}
        onReset={() => { 
          setPlaying(false); 
          engineRef.current?.reset(); 
          setStepIdx(0); 
          if (steps.length > 0) {
            setCurStep(steps[0]);
          } else {
            setCurStep(null);
          }
        }}
        onStep={() => engineRef.current?.stepForward()}
        onStepBack={() => engineRef.current?.stepBack()}
        speed={speed} onSpeedChange={s => { setSpeed(s); engineRef.current?.setSpeed(s); }}
        step={stepIdx} total={steps.length}
      />
    </div>
  );
}