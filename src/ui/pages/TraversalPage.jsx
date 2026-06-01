import { useState, useRef } from 'react';
import { bstInsert, treeToLayout, BSTNode } from '../../core/trees/index.js';
import { inorder, preorder, postorder, levelOrder, parseExpression, exprInfix, exprPrefix, exprPostfix, evalExpr } from '../../core/trees/traversal.js';
import { AnimationEngine } from '../../shell/animation/AnimationEngine.js';
import Controls from '../components/Controls.jsx';
import './TraversalPage.css';

const TRAVERSALS = {
  inorder:    { name: 'Inorder',     color: '#10b981', order: 'Trái → Gốc → Phải' },
  preorder:   { name: 'Preorder',    color: '#58a6ff', order: 'Gốc → Trái → Phải' },
  postorder:  { name: 'Postorder',   color: '#f59e0b', order: 'Trái → Phải → Gốc' },
  levelorder: { name: 'Level Order', color: '#a78bfa', order: 'Từng tầng (BFS)' },
};

const EXPR_MODES = {
  infix:   { name: 'Infix (Trung tố)',   color: '#10b981' },
  prefix:  { name: 'Prefix (Tiền tố)',   color: '#58a6ff' },
  postfix: { name: 'Postfix (Hậu tố)',   color: '#f59e0b' },
};

const W = 640, H = 280;

function buildDefaultTree() {
  const vals = [50, 30, 70, 20, 40, 60, 80];
  let root = null;
  for (const v of vals) {
    const res = bstInsert(root, v, []);
    root = res.root;
  }
  return root;
}

export default function TraversalPage() {
  const [mode, setMode] = useState('tree'); // 'tree' | 'expr'
  const [traversal, setTraversal] = useState('inorder');
  const [exprMode, setExprMode] = useState('infix');
  const [root, setRoot] = useState(buildDefaultTree);
  const [insertVal, setInsertVal] = useState('');
  const [exprInput, setExprInput] = useState('(3 + 4) * (2 - 1)');
  const [exprRoot, setExprRoot] = useState(null);
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [curStep, setCurStep] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(500);
  const [resultArr, setResultArr] = useState([]);
  const engineRef = useRef(null);

  function runAnim(s) {
    engineRef.current?.pause();
    setSteps(s); setStepIdx(0); setCurStep(s[0] || null); setResultArr([]);
    const eng = new AnimationEngine({
      steps: s, speed,
      onStep: (step, idx) => {
        setCurStep(step); setStepIdx(idx + 1);
        if (step.result) setResultArr([...step.result]);
      },
      onDone: () => setPlaying(false),
    });
    engineRef.current = eng;
    eng.play(); setPlaying(true);
  }

  function runTraversal() {
    if (!root) return;
    let s;
    if (traversal === 'inorder') s = inorder(root);
    else if (traversal === 'preorder') s = preorder(root);
    else if (traversal === 'postorder') s = postorder(root);
    else s = levelOrder(root);
    runAnim(s);
  }

  function runExpr() {
    const tree = parseExpression(exprInput);
    if (!tree) return;
    setExprRoot(tree);
    const s = [];
    if (exprMode === 'infix') exprInfix(tree, s);
    else if (exprMode === 'prefix') exprPrefix(tree, s);
    else exprPostfix(tree, s);
    runAnim(s);
  }

  function handleInsert() {
    const v = parseInt(insertVal);
    if (isNaN(v)) return;
    setInsertVal('');
    const res = bstInsert(root ? JSON.parse(JSON.stringify(root)) : null, v, []);
    setRoot(res.root);
    setSteps([]); setCurStep(null); setResultArr([]);
  }

  function resetTree() {
    setRoot(buildDefaultTree());
    setSteps([]); setCurStep(null); setResultArr([]);
  }

  // Build layout
  const layout = treeToLayout(mode === 'tree' ? root : null, W);
  const exprLayout = mode === 'expr' && exprRoot ? buildExprLayout(exprRoot, W) : { nodes: [], edges: [] };
  const displayLayout = mode === 'tree' ? layout : exprLayout;

  const visitedNode = curStep?.node;
  const level = curStep?.level;
  const queueNodes = curStep?.queue || [];

  function nodeColor(val) {
    if (visitedNode === val && curStep?.type === 'visit') return '#f59e0b';
    if (resultArr.includes(val)) return TRAVERSALS[traversal]?.color || EXPR_MODES[exprMode]?.color || '#10b981';
    if (visitedNode === val) return '#1d4ed8';
    return '#1e3a5f';
  }

  function stepDesc(s) {
    if (!s) return mode === 'tree' ? 'Nhấn ▶ để duyệt cây' : 'Nhấn ▶ để duyệt biểu thức';
    return s.desc || '';
  }

  const doneResult = steps.find(s => s?.type === 'done');

  return (
    <div className="page">
      <div className="page-header">
        <h1>Tree Traversal & Expressions</h1>
        <p>Inorder / Preorder / Postorder / Level-order — Biểu thức Trung tố / Tiền tố / Hậu tố</p>
      </div>

      <div className="algo-tabs">
        <button className={`algo-tab ${mode === 'tree' ? 'active' : ''}`}
          style={{ '--tab-color': '#10b981' }} onClick={() => { setMode('tree'); setSteps([]); setCurStep(null); setResultArr([]); }}>
          🌳 Duyệt cây
        </button>
        <button className={`algo-tab ${mode === 'expr' ? 'active' : ''}`}
          style={{ '--tab-color': '#58a6ff' }} onClick={() => { setMode('expr'); setSteps([]); setCurStep(null); setResultArr([]); }}>
          ƒ Biểu thức
        </button>
      </div>

      {mode === 'tree' && (
        <div className="trav-tab-row">
          {Object.entries(TRAVERSALS).map(([k, v]) => (
            <button key={k} className={`trav-btn ${traversal === k ? 'active' : ''}`}
              style={{ '--tv-color': v.color }}
              onClick={() => { setTraversal(k); setSteps([]); setCurStep(null); setResultArr([]); }}>
              {v.name}
              <span className="trav-order">{v.order}</span>
            </button>
          ))}
        </div>
      )}

      {mode === 'expr' && (
        <div className="trav-tab-row">
          {Object.entries(EXPR_MODES).map(([k, v]) => (
            <button key={k} className={`trav-btn ${exprMode === k ? 'active' : ''}`}
              style={{ '--tv-color': v.color }}
              onClick={() => { setExprMode(k); setSteps([]); setCurStep(null); setResultArr([]); }}>
              {v.name}
            </button>
          ))}
        </div>
      )}

      <div className="trav-workspace">
        <div className="trav-main">
          <div className="step-desc">
            <span className="step-badge">Bước {stepIdx}/{steps.length}</span>
            <span className="step-text">{stepDesc(curStep)}</span>
          </div>

          {/* Tree SVG */}
          <svg width="100%" viewBox={`0 0 ${W} ${mode === 'tree' ? H : 300}`} className="tree-svg">
            {displayLayout.edges.map((e, i) => (
              <line key={i} x1={e.from.x} y1={e.from.y + 20} x2={e.to.x} y2={e.to.y - 20}
                stroke="#1e3a5f" strokeWidth="1.5" />
            ))}
            {displayLayout.nodes.map((n, i) => {
              const col = nodeColor(n.val);
              const isOp = mode === 'expr' && ['+','-','*','/'].includes(String(n.val));
              return (
                <g key={i}>
                  <circle cx={n.x} cy={n.y} r={isOp ? 18 : 20}
                    fill={col} stroke="#0a0e1a" strokeWidth="2"
                    style={{ transition: 'fill 0.3s' }} />
                  <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central"
                    fill="white" fontSize={isOp ? 15 : 12} fontWeight="700" fontFamily="monospace">
                    {n.val}
                  </text>
                </g>
              );
            })}
            {displayLayout.nodes.length === 0 && (
              <text x={W/2} y={H/2} textAnchor="middle" fill="#1e3a5f" fontSize="14">Chưa có dữ liệu</text>
            )}
          </svg>

          {/* Result array */}
          <div className="trav-result-section">
            <div className="trav-result-label">
              {mode === 'tree' ? `${TRAVERSALS[traversal]?.name} Result:` : `${EXPR_MODES[exprMode]?.name.split('(')[0]} Result:`}
              {doneResult && <span className="trav-done-tag">✓ Hoàn thành</span>}
            </div>
            <div className="trav-result-arr">
              {resultArr.length === 0 && <span className="trav-empty">Chưa có kết quả</span>}
              {resultArr.map((v, i) => (
                <div key={i} className={`trav-res-cell ${i === resultArr.length - 1 ? 'latest' : ''}`}
                  style={{ '--res-color': mode === 'tree' ? TRAVERSALS[traversal]?.color : EXPR_MODES[exprMode]?.color }}>
                  {v}
                </div>
              ))}
            </div>
            {doneResult && mode === 'expr' && (
              <div className="expr-eval">
                = <b style={{ color: '#10b981', fontSize: 16 }}>{evalExpr(exprRoot)}</b>
              </div>
            )}
          </div>

          {/* Level-order queue display */}
          {mode === 'tree' && traversal === 'levelorder' && queueNodes.length > 0 && (
            <div className="level-queue">
              <span className="lq-label">Queue:</span>
              {queueNodes.map((v, i) => (
                <div key={i} className="lq-cell">{v}</div>
              ))}
              {curStep?.level !== undefined && (
                <span className="lq-level">Tầng {curStep.level}</span>
              )}
            </div>
          )}

          {/* Expr: show token path */}
          {mode === 'expr' && curStep?.expr && (
            <div className="expr-path">
              {curStep.expr.map((t, i) => (
                <span key={i} className={`expr-token ${i === curStep.expr.length - 1 ? 'latest-token' : ''}`}>{t}</span>
              ))}
            </div>
          )}
        </div>

        <div className="trav-sidebar">
          {mode === 'tree' && (
            <>
              <div className="ctrl-section">
                <h3>Chỉnh sửa cây</h3>
                <div className="input-pair">
                  <input className="arr-input" placeholder="Giá trị..." value={insertVal}
                    onChange={e => setInsertVal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleInsert()} type="number" />
                  <button className="btn-generate" onClick={handleInsert}>Chèn</button>
                </div>
                <button className="btn-random" style={{ width: '100%', marginTop: 8 }} onClick={resetTree}>
                  ⚄ Cây mặc định (50,30,70...)
                </button>
              </div>
              <div className="ctrl-section">
                <h3>Duyệt cây</h3>
                <button className="btn-generate" style={{ width: '100%' }} onClick={runTraversal}>
                  ▶ Duyệt {TRAVERSALS[traversal]?.name}
                </button>
              </div>
              <div className="ctrl-section">
                <h3>Thứ tự duyệt</h3>
                <div style={{ fontSize: 11, color: '#4a6b8a', lineHeight: 1.8 }}>
                  <div><b style={{ color: '#10b981' }}>Inorder</b>: L → Root → R</div>
                  <div style={{ color: '#4a6b8a', fontSize: 10 }}>Với BST → tăng dần</div>
                  <div style={{ marginTop: 4 }}><b style={{ color: '#58a6ff' }}>Preorder</b>: Root → L → R</div>
                  <div style={{ color: '#4a6b8a', fontSize: 10 }}>Dùng copy cây, serialize</div>
                  <div style={{ marginTop: 4 }}><b style={{ color: '#f59e0b' }}>Postorder</b>: L → R → Root</div>
                  <div style={{ color: '#4a6b8a', fontSize: 10 }}>Dùng xóa cây, tính giá trị</div>
                  <div style={{ marginTop: 4 }}><b style={{ color: '#a78bfa' }}>Level-order</b>: BFS</div>
                  <div style={{ color: '#4a6b8a', fontSize: 10 }}>Dùng queue, duyệt từng tầng</div>
                </div>
              </div>
            </>
          )}

          {mode === 'expr' && (
            <>
              <div className="ctrl-section">
                <h3>Biểu thức</h3>
                <input className="arr-input" value={exprInput}
                  onChange={e => setExprInput(e.target.value)}
                  style={{ width: '100%', marginBottom: 8 }}
                  placeholder="(3 + 4) * (2 - 1)" />
                <button className="btn-generate" style={{ width: '100%' }} onClick={runExpr}>
                  ▶ Duyệt {EXPR_MODES[exprMode]?.name.split('(')[0]}
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                  {['(3 + 4) * 2', '(1 + 2) * (3 + 4)', '5 * (3 - 1) + 2'].map(e => (
                    <button key={e} className="btn-random" style={{ fontSize: 10 }}
                      onClick={() => setExprInput(e)}>{e}</button>
                  ))}
                </div>
              </div>
              <div className="ctrl-section">
                <h3>Giải thích</h3>
                <div style={{ fontSize: 11, color: '#4a6b8a', lineHeight: 1.8 }}>
                  <div><b style={{ color: '#10b981' }}>Infix</b>: a + b (trung tố)</div>
                  <div style={{ fontSize: 10 }}>Dùng dấu ngoặc, con người đọc được</div>
                  <div style={{ marginTop: 4 }}><b style={{ color: '#58a6ff' }}>Prefix</b>: + a b (tiền tố)</div>
                  <div style={{ fontSize: 10 }}>LISP, máy tính Ba Lan</div>
                  <div style={{ marginTop: 4 }}><b style={{ color: '#f59e0b' }}>Postfix</b>: a b + (hậu tố)</div>
                  <div style={{ fontSize: 10 }}>Stack-based evaluation, RPN</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Controls
        playing={playing}
        onPlay={() => { setPlaying(true); engineRef.current?.play(); }}
        onPause={() => { setPlaying(false); engineRef.current?.pause(); }}
        onReset={() => { setPlaying(false); engineRef.current?.reset(); setStepIdx(0); setCurStep(steps[0]); setResultArr(steps[0]?.result || []); }}
        onStep={() => engineRef.current?.stepForward()}
        onStepBack={() => engineRef.current?.stepBack()}
        speed={speed} onSpeedChange={s => { setSpeed(s); engineRef.current?.setSpeed(s); }}
        step={stepIdx} total={steps.length}
      />
    </div>
  );
}

// Build expression tree layout
function buildExprLayout(root, W = 640) {
  if (!root) return { nodes: [], edges: [] };
  const nodes = [], edges = [];
  function traverse(node, x, y, xMin, xMax) {
    if (!node) return;
    const mx = (xMin + xMax) / 2;
    nodes.push({ val: node.val, x: mx, y });
    if (node.left) {
      edges.push({ from: { x: mx, y }, to: { x: (xMin+mx)/2, y: y+70 } });
      traverse(node.left, mx, y+70, xMin, mx);
    }
    if (node.right) {
      edges.push({ from: { x: mx, y }, to: { x: (mx+xMax)/2, y: y+70 } });
      traverse(node.right, mx, y+70, mx, xMax);
    }
  }
  traverse(root, 0, 40, 0, W);
  return { nodes, edges };
}
