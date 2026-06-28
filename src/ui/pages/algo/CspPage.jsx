import { useState, useRef } from 'react';
import { AnimationEngine } from '../../../shell/animation/AnimationEngine.js';
import Controls from '../../components/Controls.jsx';
import { useProgress } from '../../../context/ProgressContext.jsx';
import {
  // Map Coloring
  MAP_COLORING_PROBLEM, MAP_NODE_POSITIONS,
  mapColoringBacktracking, mapColoringAC3, mapColoringMinConflicts, mapColoringBranchBound,
  // N-Queens
  nQueensBacktracking, nQueensAC3, nQueensMinConflicts, nQueensBranchBound,
  // Sudoku
  SUDOKU_EASY,
  sudokuBacktracking, sudokuAC3, sudokuMinConflicts, sudokuBranchBound,
  // Scheduling
  SCHEDULING_PROBLEM,
  schedulingBacktracking, schedulingAC3, schedulingMinConflicts, schedulingBranchBound,
} from '../../../core/csp/index.ts';
import './CspPage.css';

// ─── Config ───────────────────────────────────────────────────
const PROBLEMS = {
  mapColoring: { name: 'Tô màu bản đồ', icon: '🗺️', color: '#10b981' },
  nQueens:     { name: 'N-Queens',       icon: '♛',  color: '#f59e0b' },
  sudoku:      { name: 'Sudoku',         icon: '🔢', color: '#58a6ff' },
  scheduling:  { name: 'Lập lịch thi',  icon: '📅', color: '#a78bfa' },
};

const ALGOS = {
  backtracking:   { name: 'Backtracking',     color: '#f59e0b', short: 'BT' },
  ac3:            { name: 'AC-3',             color: '#58a6ff', short: 'AC3' },
  minConflicts:   { name: 'Min-Conflicts',    color: '#10b981', short: 'MC' },
  branchBound:    { name: 'Branch&Bound',   color: '#a78bfa', short: 'BB' },
};

const COLOR_MAP = { R: '#ef4444', G: '#22c55e', B: '#3b82f6' };
const COLOR_NAMES = { R: 'Đỏ', G: 'Xanh lá', B: 'Xanh dương' };

// ─── Solver dispatcher ────────────────────────────────────────
function runSolver(problem, algo, nQueensN, sudokuBoard) {
  if (problem === 'mapColoring') {
    if (algo === 'backtracking') return mapColoringBacktracking(MAP_COLORING_PROBLEM);
    if (algo === 'ac3')          return mapColoringAC3(MAP_COLORING_PROBLEM);
    if (algo === 'minConflicts') return mapColoringMinConflicts(MAP_COLORING_PROBLEM);
    if (algo === 'branchBound')  return mapColoringBranchBound(MAP_COLORING_PROBLEM);
  }
  if (problem === 'nQueens') {
    if (algo === 'backtracking') return nQueensBacktracking(nQueensN);
    if (algo === 'ac3')          return nQueensAC3(nQueensN);
    if (algo === 'minConflicts') return nQueensMinConflicts(nQueensN);
    if (algo === 'branchBound')  return nQueensBranchBound(nQueensN);
  }
  if (problem === 'sudoku') {
    if (algo === 'backtracking') return sudokuBacktracking(sudokuBoard);
    if (algo === 'ac3')          return sudokuAC3(sudokuBoard);
    if (algo === 'minConflicts') return sudokuMinConflicts(sudokuBoard);
    if (algo === 'branchBound')  return sudokuBranchBound(sudokuBoard);
  }
  if (problem === 'scheduling') {
    if (algo === 'backtracking') return schedulingBacktracking(SCHEDULING_PROBLEM);
    if (algo === 'ac3')          return schedulingAC3(SCHEDULING_PROBLEM);
    if (algo === 'minConflicts') return schedulingMinConflicts(SCHEDULING_PROBLEM);
    if (algo === 'branchBound')  return schedulingBranchBound(SCHEDULING_PROBLEM);
  }
  return [];
}

// ─── Render helpers ───────────────────────────────────────────

// Map Coloring SVG
function MapColoringCanvas({ step }) {
  const prob = MAP_COLORING_PROBLEM;
  const pos  = MAP_NODE_POSITIONS;
  const assignment = step?.assignment || {};
  const domains = step?.domains || {};
  const currentVar = step?.currentVar;
  const conflictVars = step?.conflictVars || [];
  const arcFrom = step?.arcFrom, arcTo = step?.arcTo;
  const removedVals = step?.removedVals || [];
  const stepType = step?.type;

  function nodeColor(v) {
    if (assignment[v]) return COLOR_MAP[assignment[v]] || '#58a6ff';
    if (v === currentVar) return '#f59e0b';
    if (conflictVars.includes(v)) return '#ef4444';
    if (removedVals.length > 0 && domains[v] && domains[v].length < 3) return '#7c3aed';
    return '#132135';
  }

  function nodeStroke(v) {
    if (v === currentVar || conflictVars.includes(v)) return 3;
    if (removedVals.length > 0 && domains[v] && domains[v].length < 3) return 2.5;
    return 1.5;
  }

  function nodeStrokeColor(v) {
    if (v === currentVar) return '#f59e0b';
    if (conflictVars.includes(v)) return '#ef4444';
    if (removedVals.length > 0 && domains[v] && domains[v].length < 3) return '#7c3aed';
    return '#2d4a6a';
  }

  function edgeColor(a, b) {
    if ((arcFrom === a && arcTo === b) || (arcFrom === b && arcTo === a)) return '#f59e0b';
    if (
      (currentVar === a && conflictVars.includes(b)) ||
      (currentVar === b && conflictVars.includes(a))
    ) return '#ef4444';
    return '#1e3a5f';
  }

  function edgeStroke(a, b) {
    if ((arcFrom === a && arcTo === b) || (arcFrom === b && arcTo === a)) return 3;
    return 1.5;
  }

  const edges = [];
  for (const v of prob.variables) {
    for (const nb of (prob.neighbors[v] || [])) {
      if (v < nb) edges.push([v, nb]);
    }
  }

  // Hiển thị domain đã thu hẹp cho AC-3
  const showDomains = stepType === 'domain_reduced' || stepType === 'arc_check' || stepType === 'done';

  return (
    <svg viewBox="0 0 520 430" className="csp-map-svg">
      {edges.map(([a, b], i) => (
        <line key={i}
          x1={pos[a].x} y1={pos[a].y} x2={pos[b].x} y2={pos[b].y}
          stroke={edgeColor(a, b)} strokeWidth={edgeStroke(a, b)} />
      ))}
      {prob.variables.map(v => (
        <g key={v}>
          <circle cx={pos[v].x} cy={pos[v].y} r={28}
            fill={nodeColor(v)}
            stroke={nodeStrokeColor(v)}
            strokeWidth={nodeStroke(v)} />
          <text x={pos[v].x} y={pos[v].y - 6} textAnchor="middle"
            dominantBaseline="central" fill="white" fontSize="12" fontWeight="700">
            {v}
          </text>
          {assignment[v] && (
            <text x={pos[v].x} y={pos[v].y + 10} textAnchor="middle"
              fill="white" fontSize="10" opacity="0.85">
              {COLOR_NAMES[assignment[v]]}
            </text>
          )}
          {/* Hiển thị domain đã thu hẹp */}
          {showDomains && domains[v] && domains[v].length > 0 && domains[v].length < 3 && (
            <text x={pos[v].x} y={pos[v].y + 42} textAnchor="middle"
              fill="#a78bfa" fontSize="8" opacity="0.8">
              {domains[v].map(d => COLOR_NAMES[d]).join(', ')}
            </text>
          )}
          {/* Hiển thị domain rỗng */}
          {domains[v] && domains[v].length === 0 && (
            <text x={pos[v].x} y={pos[v].y + 42} textAnchor="middle"
              fill="#ef4444" fontSize="8" fontWeight="700">
              ∅
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

// N-Queens Grid
function NQueensCanvas({ step, n }) {
  const placement = step?.placement || new Array(n).fill(undefined);
  const domains = step?.domains || {};
  const currentVar = step?.currentVar;
  const currentRow = currentVar ? parseInt(currentVar.slice(1)) : -1;
  const currentVal = step?.currentVal;
  const conflictVars = step?.conflictVars || [];
  const conflictRows = conflictVars.map(v => parseInt(v.slice(1)));
  const removedVals = step?.removedVals || [];
  const stepType = step?.type;

  const cellSize = Math.min(48, Math.floor(340 / n));
  const boardSize = cellSize * n;
  const offsetX = (380 - boardSize) / 2;
  const offsetY = (340 - boardSize) / 2;

  // Kiểm tra xem có đang hiển thị domain không
  const showDomains = stepType === 'domain_reduced' || stepType === 'arc_check' || stepType === 'done';

  function cellFill(row, col) {
    const isLight = (row + col) % 2 === 0;
    const base = isLight ? '#1e3a5f' : '#0d1f35';

    if (placement[row] !== undefined && placement[row] === col) {
      if (conflictRows.includes(row)) return '#ef4444';
      if (stepType === 'done' || stepType === 'solution') return '#10b981';
      return '#f59e0b';
    }
    if (row === currentRow && col === currentVal) {
      if (stepType === 'conflict') return '#ef444455';
      return '#f59e0b55';
    }
    // Highlight attack lines of current placement
    if (placement[row] !== undefined && row === currentRow) {
      return isLight ? '#f59e0b22' : '#f59e0b11';
    }
    return base;
  }

  // Kiểm tra xem cột có bị loại bỏ khỏi domain không
  function isColumnRemoved(row, col) {
    const key = `Q${row}`;
    const domain = domains[key];
    if (!domain) return false;
    // Nếu domain đã thu hẹp và cột không có trong domain
    return domain.length > 0 && domain.length < n && !domain.includes(col);
  }

  return (
    <svg viewBox={`0 0 380 340`} className="csp-queens-svg">
      {Array.from({ length: n }, (_, row) =>
        Array.from({ length: n }, (_, col) => {
          const isRemoved = isColumnRemoved(row, col);
          return (
            <rect key={`${row}-${col}`}
              x={offsetX + col * cellSize} y={offsetY + row * cellSize}
              width={cellSize} height={cellSize}
              fill={cellFill(row, col)}
              stroke={isRemoved ? '#7c3aed44' : '#0d1117'}
              strokeWidth={isRemoved ? 2 : 1}
              rx="1"
              opacity={isRemoved ? 0.5 : 1}
            />
          );
        })
      )}
      {/* Hiển thị dấu X trên các cột đã bị loại bỏ */}
      {showDomains && Object.keys(domains).length > 0 && (
        Array.from({ length: n }, (_, row) => {
          const key = `Q${row}`;
          const domain = domains[key];
          if (!domain || domain.length === n) return null;
          return Array.from({ length: n }, (_, col) => {
            if (!domain.includes(col) && domain.length > 0) {
              const x = offsetX + col * cellSize + cellSize / 2;
              const y = offsetY + row * cellSize + cellSize / 2;
              return (
                <text key={`removed-${row}-${col}`} x={x} y={y}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={cellSize * 0.4} fill="#7c3aed" opacity="0.6">
                  ✗
                </text>
              );
            }
            return null;
          });
        })
      )}
      {Array.from({ length: n }, (_, row) => {
        if (placement[row] === undefined) return null;
        const col = placement[row];
        const cx = offsetX + col * cellSize + cellSize / 2;
        const cy = offsetY + row * cellSize + cellSize / 2;
        const isConflict = conflictRows.includes(row);
        const isDone = stepType === 'done' || stepType === 'solution';
        return (
          <text key={row} x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
            fontSize={cellSize * 0.6}
            fill={isConflict ? '#fca5a5' : isDone ? '#86efac' : '#fde68a'}>
            ♛
          </text>
        );
      })}
      {/* Thử đặt hiện tại */}
      {currentRow >= 0 && currentVal !== undefined && placement[currentRow] === undefined && (
        <text
          x={offsetX + currentVal * cellSize + cellSize / 2}
          y={offsetY + currentRow * cellSize + cellSize / 2}
          textAnchor="middle" dominantBaseline="central"
          fontSize={cellSize * 0.55} fill="#f59e0b88" opacity="0.7">
          ♛
        </text>
      )}
      {/* Hiển thị domain bên trái bảng */}
      {showDomains && Object.keys(domains).length > 0 && (
        Array.from({ length: n }, (_, row) => {
          const key = `Q${row}`;
          const domain = domains[key];
          if (!domain || domain.length === n) return null;
          return (
            <text key={`domain-${row}`}
              x={offsetX - 30}
              y={offsetY + row * cellSize + cellSize / 2}
              textAnchor="end" dominantBaseline="central"
              fill="#a78bfa" fontSize="8" opacity="0.8">
              {domain.join(',')}
            </text>
          );
        })
      )}
      {/* Row/col labels */}
      {Array.from({ length: n }, (_, i) => (
        <text key={`r${i}`} x={offsetX - 12} y={offsetY + i * cellSize + cellSize / 2}
          textAnchor="middle" dominantBaseline="central"
          fill="#4a6b8a" fontSize="10">{i}</text>
      ))}
      {Array.from({ length: n }, (_, i) => (
        <text key={`c${i}`} x={offsetX + i * cellSize + cellSize / 2} y={offsetY - 10}
          textAnchor="middle" dominantBaseline="central"
          fill="#4a6b8a" fontSize="10">{i}</text>
      ))}
    </svg>
  );
}

// Sudoku Grid
function SudokuCanvas({ step, initBoard }) {
  const board = step?.board || initBoard;
  const domains = step?.domains || {};
  const currentVar = step?.currentVar;
  const currentVal = step?.currentVal;
  const stepType = step?.type;
  const removedVals = step?.removedVals || [];

  const CELL = 36;
  const PAD = 20;

  function cellColor(r, c) {
    const key = `${r},${c}`;
    if (key === currentVar) {
      if (stepType === 'conflict') return '#ef444433';
      if (stepType === 'assign' || stepType === 'solution') return '#10b98133';
      return '#f59e0b33';
    }
    // Hiển thị domain đã thu hẹp
    if (domains[key] && domains[key].length === 0) return '#7f1d1d33';
    if (domains[key] && domains[key].length < 9 && domains[key].length > 0) return '#7c3aed11';
    return 'transparent';
  }

  function textColor(r, c, val) {
    if (val === 0) return 'transparent';
    if (initBoard[r][c] !== 0) return '#58a6ff';
    const key = `${r},${c}`;
    if (key === currentVar) {
      if (stepType === 'conflict') return '#f87171';
      if (stepType === 'assign') return '#34d399';
      return '#fde68a';
    }
    if (stepType === 'done') return '#34d399';
    return '#e2e8f0';
  }

  // Hiển thị domain bên dưới ô
  function renderDomain(r, c) {
    const key = `${r},${c}`;
    const domain = domains[key];
    if (!domain) return null;
    if (domain.length === 9) return null; // Domain đầy đủ, không cần hiển thị
    if (domain.length === 0) {
      // Domain rỗng
      const x = PAD + c * CELL + CELL / 2;
      const y = PAD + r * CELL + CELL - 4;
      return (
        <text key={`domain-${r}-${c}`} x={x} y={y}
          textAnchor="middle" dominantBaseline="bottom"
          fontSize="8" fill="#ef4444" fontWeight="700">
          ∅
        </text>
      );
    }
    // Domain đã thu hẹp
    const x = PAD + c * CELL + CELL / 2;
    const y = PAD + r * CELL + CELL - 4;
    return (
      <text key={`domain-${r}-${c}`} x={x} y={y}
        textAnchor="middle" dominantBaseline="bottom"
        fontSize="7" fill="#a78bfa" opacity="0.7">
        {domain.join('')}
      </text>
    );
  }

  return (
    <svg viewBox="0 0 360 360" className="csp-sudoku-svg">
      {/* Background */}
      <rect x={PAD} y={PAD} width={CELL*9} height={CELL*9} fill="#0d1117" rx="4" />
      {/* Cells */}
      {Array.from({ length: 9 }, (_, r) =>
        Array.from({ length: 9 }, (_, c) => {
          const val = board[r][c];
          const x = PAD + c * CELL, y = PAD + r * CELL;
          return (
            <g key={`${r}-${c}`}>
              <rect x={x} y={y} width={CELL} height={CELL}
                fill={cellColor(r, c)} stroke="#1e2d3d" strokeWidth="0.5" />
              {val !== 0 && (
                <text x={x + CELL/2} y={y + CELL/2 + 1}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize="14" fontWeight={initBoard[r][c] !== 0 ? '700' : '400'}
                  fill={textColor(r, c, val)}>
                  {val}
                </text>
              )}
              {renderDomain(r, c)}
            </g>
          );
        })
      )}
      {/* 3x3 block borders */}
      {[0,1,2].map(br =>
        [0,1,2].map(bc => (
          <rect key={`${br}-${bc}`}
            x={PAD + bc*3*CELL} y={PAD + br*3*CELL}
            width={CELL*3} height={CELL*3}
            fill="none" stroke="#2d4a6a" strokeWidth="2" />
        ))
      )}
      {/* Outer border */}
      <rect x={PAD} y={PAD} width={CELL*9} height={CELL*9}
        fill="none" stroke="#3d5a7a" strokeWidth="2.5" rx="4" />
    </svg>
  );
}

// Scheduling Table
function SchedulingCanvas({ step, problem }) {
  const { courses, rooms, slots } = problem;
  const assignment = step?.assignment || {};
  const currentVar = step?.currentVar;
  const conflictVars = step?.conflictVars || [];
  const domains = step?.schedDomains || {};
  const stepType = step?.type;

  const SLOT_W = 100, ROOM_H = 36, HEAD_W = 72, HEAD_H = 36;
  const W = HEAD_W + slots.length * SLOT_W;
  const H = HEAD_H + rooms.length * ROOM_H + 20;

  // Build grid với thông tin đầy đủ
  const grid = {};
  for (const slot of slots) {
    grid[slot] = {};
    for (const room of rooms) {
      grid[slot][room] = {
        courses: [],
        hasConflict: false
      };
    }
  }

  // Điền assignment
  for (const [course, { slot, room }] of Object.entries(assignment)) {
    if (grid[slot] && grid[slot][room]) {
      grid[slot][room].courses.push(course);
    }
  }

  // Đánh dấu xung đột dựa trên conflictVars từ step
  for (const slot of slots) {
    for (const room of rooms) {
      const cs = grid[slot][room].courses;
      grid[slot][room].hasConflict = cs.some(c => conflictVars && conflictVars.includes(c));
    }
  }

  // Kiểm tra domain đã thu hẹp
  function hasReducedDomain(course) {
    const domain = domains[course];
    if (!domain) return false;
    const totalOptions = slots.length * rooms.length;
    return domain.length > 0 && domain.length < totalOptions;
  }

  function getDomainDisplay(course) {
    const domain = domains[course];
    if (!domain) return '';
    return domain.map(d => d.replace('|', '/')).join(', ');
  }

  function cellBg(slot, room) {
    const { courses, hasConflict } = grid[slot][room];
    
    if (hasConflict) return '#7f1d1d44';
    
    if (courses.length === 1) {
      const c = courses[0];
      if (c === currentVar) return '#f59e0b33';
      return '#10b98122';
    }
    
    if (courses.length > 1) return '#7f1d1d22';
    
    // Kiểm tra domain của các môn chưa xếp
    for (const course of courses) {
      if (!assignment[course]) {
        const domain = domains[course];
        if (domain && !domain.includes(`${slot}|${room}`)) {
          return '#7c3aed11';
        }
      }
    }
    
    return '#0a0e1a';
  }

  function courseColor(c) {
    if (c === currentVar) return '#fde68a';
    if (conflictVars && conflictVars.includes(c)) return '#f87171';
    if (hasReducedDomain(c)) return '#a78bfa';
    return '#34d399';
  }

  // Lấy các môn chưa xếp và domain của chúng
  const unscheduled = courses.filter(c => !assignment[c]);

  return (
    <div className="csp-schedule-wrapper">
      <svg viewBox={`0 0 ${W} ${H}`} className="csp-schedule-svg">
        {/* Header — slots */}
        {slots.map((slot, si) => (
          <g key={slot}>
            <rect x={HEAD_W + si*SLOT_W} y={0} width={SLOT_W} height={HEAD_H}
              fill="#0d1f35" stroke="#1e3a5f" strokeWidth="1" />
            <text x={HEAD_W + si*SLOT_W + SLOT_W/2} y={HEAD_H/2}
              textAnchor="middle" dominantBaseline="central"
              fill="#58a6ff" fontSize="10" fontWeight="700">
              {slot}
            </text>
          </g>
        ))}
        {/* Header — rooms */}
        {rooms.map((room, ri) => (
          <g key={room}>
            <rect x={0} y={HEAD_H + ri*ROOM_H} width={HEAD_W} height={ROOM_H}
              fill="#0d1f35" stroke="#1e3a5f" strokeWidth="1" />
            <text x={HEAD_W/2} y={HEAD_H + ri*ROOM_H + ROOM_H/2}
              textAnchor="middle" dominantBaseline="central"
              fill="#a78bfa" fontSize="10" fontWeight="700">
              {room}
            </text>
          </g>
        ))}
        {/* Cells */}
        {slots.map((slot, si) =>
          rooms.map((room, ri) => {
            const { courses: cs } = grid[slot][room];
            return (
              <g key={`${slot}-${room}`}>
                <rect x={HEAD_W + si*SLOT_W} y={HEAD_H + ri*ROOM_H}
                  width={SLOT_W} height={ROOM_H}
                  fill={cellBg(slot, room)} stroke="#1e2d3d" strokeWidth="0.5" />
                {cs.map((c, i) => (
                  <text key={c}
                    x={HEAD_W + si*SLOT_W + SLOT_W/2}
                    y={HEAD_H + ri*ROOM_H + ROOM_H/2 + (i - (cs.length-1)/2)*13}
                    textAnchor="middle" dominantBaseline="central"
                    fill={courseColor(c)} fontSize="10" fontWeight="600">
                    {c}
                  </text>
                ))}
              </g>
            );
          })
        )}
      </svg>

      {/* Danh sách môn chưa xếp với domain */}
      <div className="csp-unscheduled">
        <div style={{ fontSize: 10, color: '#4a6b8a', marginBottom: 4 }}>
          Môn chưa xếp:
        </div>
        {unscheduled.map(c => {
          const domain = domains[c];
          const isCurrent = c === currentVar;
          return (
            <div key={c} className="csp-course-item">
              <span className={`csp-course-badge ${isCurrent ? 'active' : ''}`}>
                {c}
              </span>
              {stepType === 'domain_reduced' && domain && domain.length > 0 && (
                <span className="csp-course-domain">
                  [{domain.map(d => d.split('|')[0]).join(', ')}]
                </span>
              )}
              {domain && domain.length === 0 && (
                <span className="csp-course-domain" style={{ color: '#ef4444' }}>
                  [∅]
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Info Sidebar ─────────────────────────────────────────────
function CspInfoPanel({ step, problem, algo, nQueensN }) {
  if (!step) return (
    <div className="csp-info-panel">
      <div className="ds-title">Trạng thái</div>
      <div className="ds-empty">Nhấn ▶ để chạy thuật toán</div>
    </div>
  );

  const assignment = step.assignment || {};
  const assigned = Object.keys(assignment).length;

  let totalVars = 0;
  if (problem === 'mapColoring') totalVars = MAP_COLORING_PROBLEM.variables.length;
  if (problem === 'nQueens')     totalVars = nQueensN;
  if (problem === 'sudoku')      totalVars = 81;
  if (problem === 'scheduling')  totalVars = SCHEDULING_PROBLEM.courses.length;

  // Kiểm tra domain đã thu hẹp
  const domains = step.domains || step.schedDomains || {};
  const hasDomains = Object.keys(domains).length > 0;

  return (
    <div className="csp-info-panel">
      <div className="ds-title">Trạng thái</div>

      {step.currentVar && (
        <div className="csp-info-row">
          <span className="csp-info-label">Biến đang xét</span>
          <span className="csp-info-val highlight-yellow">{step.currentVar}</span>
        </div>
      )}
      {step.currentVal !== undefined && (
        <div className="csp-info-row">
          <span className="csp-info-label">Giá trị thử</span>
          <span className="csp-info-val highlight-blue">{String(step.currentVal)}</span>
        </div>
      )}
      {step.arcFrom && (
        <div className="csp-info-row">
          <span className="csp-info-label">Cung xét</span>
          <span className="csp-info-val highlight-yellow">({step.arcFrom}, {step.arcTo})</span>
        </div>
      )}
      {step.removedVals && step.removedVals.length > 0 && (
        <div className="csp-info-row">
          <span className="csp-info-label">Đã loại bỏ</span>
          <span className="csp-info-val highlight-purple">{step.removedVals.join(', ')}</span>
        </div>
      )}
      {step.conflictVars?.length > 0 && (
        <div className="csp-info-row">
          <span className="csp-info-label">Xung đột</span>
          <span className="csp-info-val highlight-red">{step.conflictVars.join(', ')}</span>
        </div>
      )}
      {step.iteration !== undefined && (
        <div className="csp-info-row">
          <span className="csp-info-label">Bước lặp</span>
          <span className="csp-info-val">{step.iteration}</span>
        </div>
      )}
      {step.boundVal !== undefined && (
        <div className="csp-info-row">
          <span className="csp-info-label">Bound</span>
          <span className="csp-info-val highlight-purple">{step.boundVal}</span>
        </div>
      )}
      {step.conflictsBefore !== undefined && (
        <div className="csp-info-row">
          <span className="csp-info-label">Xung đột</span>
          <span className="csp-info-val">
            <span className="highlight-red">{step.conflictsBefore}</span>
            {' → '}
            <span className="highlight-green">{step.conflictsAfter}</span>
          </span>
        </div>
      )}
      {problem !== 'sudoku' && (
        <div className="csp-info-row">
          <span className="csp-info-label">Đã gán</span>
          <span className="csp-info-val">{assigned} / {totalVars}</span>
        </div>
      )}

      {/* Hiển thị số domain đã thu hẹp */}
      {hasDomains && algo === 'ac3' && (
        <div className="csp-info-row">
          <span className="csp-info-label">Domain thu hẹp</span>
          <span className="csp-info-val highlight-purple">
            {Object.values(domains).filter(d => d.length > 0 && d.length < (problem === 'sudoku' ? 9 : totalVars)).length} biến
          </span>
        </div>
      )}

      {/* Assignment hiện tại */}
      {problem === 'mapColoring' && assigned > 0 && (
        <div className="csp-assignment-list">
          <div className="ds-title" style={{ marginTop: 8 }}>Assignment</div>
          {Object.entries(assignment).map(([v, c]) => (
            <div key={v} className="csp-assign-row">
              <span className="csp-assign-var">{v}</span>
              <span className="csp-assign-eq">=</span>
              <span className="csp-assign-dot" style={{ background: COLOR_MAP[c] }} />
              <span className="csp-assign-val">{COLOR_NAMES[c] || c}</span>
            </div>
          ))}
        </div>
      )}

      {problem === 'scheduling' && assigned > 0 && (
        <div className="csp-assignment-list">
          <div className="ds-title" style={{ marginTop: 8 }}>Lịch đã xếp</div>
          {Object.entries(assignment).map(([c, { slot, room }]) => (
            <div key={c} className="csp-assign-row">
              <span className="csp-assign-var">{c}</span>
              <span className="csp-assign-val" style={{ fontSize: 10 }}>{slot} / {room}</span>
            </div>
          ))}
        </div>
      )}

      {/* Arc queue size for AC-3 */}
      {algo === 'ac3' && step.arcQueue && (
        <div className="csp-info-row">
          <span className="csp-info-label">Queue cung</span>
          <span className="csp-info-val">{step.arcQueue.length} cung</span>
        </div>
      )}
    </div>
  );
}

// ─── Algo Description ─────────────────────────────────────────
function AlgoDesc({ algo }) {
  const descs = {
    backtracking: <>
      <b style={{ color: '#f59e0b' }}>Backtracking</b> thử từng giá trị cho mỗi biến.<br />
      Nếu vi phạm ràng buộc → <b style={{ color: '#ef4444' }}>quay lui</b> thử giá trị khác.<br />
      Hoàn chỉnh nhưng có thể chậm với không gian lớn.
    </>,
    ac3: <>
      <b style={{ color: '#58a6ff' }}>AC-3</b> duy trì nhất quán cung.<br />
      Thu hẹp domain trước khi tìm kiếm.<br />
      Mỗi cung <b style={{ color: '#58a6ff' }}>(Xi, Xj)</b> được kiểm tra:<br />
      loại bỏ giá trị trong domain[Xi] không có support trong domain[Xj].<br />
      <span style={{ color: '#a78bfa' }}>📌 Domain thu hẹp hiển thị với màu tím</span>
    </>,
    minConflicts: <>
      <b style={{ color: '#10b981' }}>Min-Conflicts</b> bắt đầu từ gán ngẫu nhiên.<br />
      Mỗi bước chọn biến có <b style={{ color: '#ef4444' }}>xung đột</b> và gán lại<br />
      giá trị có <b style={{ color: '#10b981' }}>ít xung đột nhất</b>.<br />
      Phù hợp bài toán lớn, không đảm bảo tối ưu.
    </>,
    branchBound: <>
      <b style={{ color: '#a78bfa' }}>Branch & Bound</b> kết hợp backtracking<br />
      với <b style={{ color: '#a78bfa' }}>cắt tỉa sớm</b> (pruning).<br />
      Cắt bỏ nhánh ngay khi phát hiện vi phạm,<br />
      hiệu quả hơn backtracking thuần túy.
    </>,
  };
  return (
    <div className="ctrl-section">
      <div style={{ fontSize: 11, color: '#4a6b8a', lineHeight: 1.8 }}>
        {descs[algo]}
      </div>
    </div>
  );
}

// ─── Chú thích màu ───────────────────────────────────────────
function Legend({ problem }) {
  const items = [
    { color: '#f59e0b', label: 'Đang xét' },
    { color: '#10b981', label: 'Đã gán / Hợp lệ' },
    { color: '#ef4444', label: 'Xung đột' },
    { color: '#a78bfa', label: 'Quay lui / Cắt tỉa' },
    { color: '#7c3aed', label: 'Domain thu hẹp (AC-3)' },
    { color: '#132135', label: 'Chưa gán' },
  ];
  return (
    <div className="csp-legend">
      {items.map(({ color, label }) => (
        <div key={label} className="csp-legend-item">
          <span className="csp-legend-dot" style={{ background: color }} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function CspPage() {
  const [problem, setProblem]   = useState('mapColoring');
  const [algo, setAlgo]         = useState('backtracking');
  const [steps, setSteps]       = useState([]);
  const [stepIdx, setStepIdx]   = useState(0);
  const [curStep, setCurStep]   = useState(null);
  const [playing, setPlaying]   = useState(false);
  const [speed, setSpeed]       = useState(400);
  const [nQueensN, setNQueensN] = useState(6);
  const [sudokuBoard]           = useState(() => SUDOKU_EASY.map(r => [...r]));
  const engineRef               = useRef(null);
  const { saveProgress }        = useProgress();

  function runAlgo() {
    engineRef.current?.pause();
    const s = runSolver(problem, algo, nQueensN, sudokuBoard);
    if (!s || s.length === 0) return;

    setSteps(s); setStepIdx(0); setCurStep(null);
    const eng = new AnimationEngine({
      steps: s, speed,
      onStep: (step, idx) => { setCurStep(step); setStepIdx(idx + 1); },
      onDone: () => setPlaying(false),
    });
    engineRef.current = eng;
    eng.play(); setPlaying(true);
    saveProgress('csp', `${PROBLEMS[problem].name} — ${ALGOS[algo].name}`);
  }

  function resetAll() {
    engineRef.current?.pause();
    setSteps([]); setStepIdx(0); setCurStep(null); setPlaying(false);
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Constraint Satisfaction Problems</h1>
        <p>Tô màu bản đồ, N-Queens, Sudoku, Lập lịch thi — 4 thuật toán CSP từng bước</p>
      </div>

      {/* Algo tabs */}
      <div className="algo-tabs">
        {Object.entries(ALGOS).map(([k, v]) => (
          <button key={k}
            className={`algo-tab ${algo === k ? 'active' : ''}`}
            style={{ '--tab-color': v.color }}
            onClick={() => { setAlgo(k); resetAll(); }}>
            {v.name}
          </button>
        ))}
      </div>

      <div className="csp-workspace">
        {/* Left: problem selector */}
        <div className="csp-problem-sidebar">
          <div className="ctrl-section">
            <h3>Bài toán</h3>
            <div className="csp-problem-btns">
              {Object.entries(PROBLEMS).map(([k, v]) => (
                <button key={k}
                  className={`csp-problem-btn ${problem === k ? 'active' : ''}`}
                  style={{ '--p-color': v.color }}
                  onClick={() => { setProblem(k); resetAll(); }}>
                  <span className="csp-problem-icon">{v.icon}</span>
                  <span className="csp-problem-name">{v.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tham số theo bài toán */}
          {problem === 'nQueens' && (
            <div className="ctrl-section">
              <h3>Tham số</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#4a6b8a' }}>N =</span>
                <input type="number" min="4" max="10" value={nQueensN}
                  onChange={e => { setNQueensN(Math.min(10, Math.max(4, parseInt(e.target.value)||6))); resetAll(); }}
                  className="arr-input" style={{ width: 60 }} />
              </div>
              <div style={{ fontSize: 10, color: '#4a6b8a', marginTop: 4 }}>
                Khuyến nghị N ≤ 8 để xem rõ animation
              </div>
            </div>
          )}

          <div className="ctrl-section">
            <h3>Chạy</h3>
            <button className="btn-generate" style={{ width: '100%' }} onClick={runAlgo}>
              ▶ Chạy 
            </button>
            <button className="mode-btn danger" style={{ width: '100%', marginTop: 6 }} onClick={resetAll}>
              ↺ Reset
            </button>
          </div>

          <AlgoDesc algo={algo} />
          <Legend problem={problem} />
        </div>

        {/* Center: canvas */}
        <div className="csp-main">
          <div className="step-desc">
            <span className="step-badge">Bước {stepIdx}/{steps.length}</span>
            <span className="step-text">{curStep?.desc || 'Nhấn ▶ để chạy thuật toán'}</span>
          </div>

          <div className="csp-canvas-area">
            {problem === 'mapColoring' && <MapColoringCanvas step={curStep} />}
            {problem === 'nQueens'     && <NQueensCanvas step={curStep} n={nQueensN} />}
            {problem === 'sudoku'      && <SudokuCanvas step={curStep} initBoard={sudokuBoard} />}
            {problem === 'scheduling'  && <SchedulingCanvas step={curStep} problem={SCHEDULING_PROBLEM} />}
          </div>
        </div>

        {/* Right: info */}
        <div className="csp-info-sidebar">
          <CspInfoPanel
            step={curStep}
            problem={problem}
            algo={algo}
            nQueensN={nQueensN}
          />

          <div className="ctrl-section">
            <h3>Thông tin</h3>
            <div style={{ fontSize: 12, color: '#8b9eb5', lineHeight: 1.8 }}>
              <div>Bài toán: <b style={{ color: PROBLEMS[problem].color }}>{PROBLEMS[problem].name}</b></div>
              <div>Thuật toán: <b style={{ color: ALGOS[algo].color }}>{ALGOS[algo].name}</b></div>
              <div>Tổng bước: {steps.length}</div>
              {problem === 'nQueens' && <div>Kích thước: {nQueensN}×{nQueensN}</div>}
              {problem === 'sudoku' && <div>Kích thước: 9×9</div>}
              {problem === 'scheduling' && (
                <>
                  <div>Số môn: {SCHEDULING_PROBLEM.courses.length}</div>
                  <div>Số phòng: {SCHEDULING_PROBLEM.rooms.length}</div>
                  <div>Số slot: {SCHEDULING_PROBLEM.slots.length}</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Controls
        playing={playing}
        onPlay={() => { setPlaying(true); engineRef.current?.play(); }}
        onPause={() => { setPlaying(false); engineRef.current?.pause(); }}
        onReset={() => { setPlaying(false); engineRef.current?.reset(); setStepIdx(0); setCurStep(steps[0]); }}
        onStep={() => engineRef.current?.stepForward()}
        onStepBack={() => engineRef.current?.stepBack()}
        speed={speed} onSpeedChange={s => { setSpeed(s); engineRef.current?.setSpeed(s); }}
        step={stepIdx} total={steps.length}
      />
    </div>
  );
}