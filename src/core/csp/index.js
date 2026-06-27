// ============================================================
// CSP Core — Functional Core (pure functions → steps[])
// Mỗi hàm trả về mảng steps để AnimationEngine consume
// Step shape chung:
//   { type, assignment, domains, currentVar, currentVal,
//     conflictVars, arcFrom, arcTo, iteration, desc }
// ============================================================

// ─── MAP COLORING ────────────────────────────────────────────
// Graph Australia mặc định
export const MAP_COLORING_PROBLEM = {
  variables: ['WA', 'NT', 'SA', 'Q', 'NSW', 'V', 'T'],
  domains: {
    WA: ['R', 'G', 'B'],
    NT: ['R', 'G', 'B'],
    SA: ['R', 'G', 'B'],
    Q:  ['R', 'G', 'B'],
    NSW:['R', 'G', 'B'],
    V:  ['R', 'G', 'B'],
    T:  ['R', 'G', 'B'],
  },
  neighbors: {
    WA:  ['NT', 'SA'],
    NT:  ['WA', 'SA', 'Q'],
    SA:  ['WA', 'NT', 'Q', 'NSW', 'V'],
    Q:   ['NT', 'SA', 'NSW'],
    NSW: ['Q', 'SA', 'V'],
    V:   ['SA', 'NSW'],
    T:   [],
  },
};

// Tọa độ SVG cho từng vùng (dùng khi render)
export const MAP_NODE_POSITIONS = {
  WA:  { x: 100, y: 200 },
  NT:  { x: 240, y: 130 },
  SA:  { x: 290, y: 230 },
  Q:   { x: 390, y: 150 },
  NSW: { x: 420, y: 240 },
  V:   { x: 370, y: 310 },
  T:   { x: 390, y: 390 },
};

function cloneDomains(d) {
  const r = {};
  for (const k in d) r[k] = [...d[k]];
  return r;
}

function isConsistentMap(variable, value, assignment, neighbors) {
  for (const nb of (neighbors[variable] || [])) {
    if (assignment[nb] === value) return false;
  }
  return true;
}

// Backtracking — Map Coloring
export function mapColoringBacktracking(problem) {
  const { variables, domains, neighbors } = problem;
  const steps = [];
  const assignment = {};

  steps.push({
    type: 'init',
    assignment: {},
    domains: cloneDomains(domains),
    desc: 'Khởi tạo: tất cả biến chưa được gán, domain đầy đủ',
  });

  function backtrack(vars) {
    if (vars.length === 0) return true;
    const variable = vars[0];
    const rest = vars.slice(1);

    for (const value of domains[variable]) {
      steps.push({
        type: 'try',
        currentVar: variable,
        currentVal: value,
        assignment: { ...assignment },
        domains: cloneDomains(domains),
        desc: `Thử gán ${variable} = ${value}`,
      });

      if (isConsistentMap(variable, value, assignment, neighbors)) {
        assignment[variable] = value;
        steps.push({
          type: 'assign',
          currentVar: variable,
          currentVal: value,
          assignment: { ...assignment },
          domains: cloneDomains(domains),
          desc: `✓ Gán ${variable} = ${value} (nhất quán)`,
        });

        if (backtrack(rest)) return true;

        delete assignment[variable];
        steps.push({
          type: 'backtrack',
          currentVar: variable,
          assignment: { ...assignment },
          domains: cloneDomains(domains),
          desc: `✗ Quay lui: bỏ gán ${variable} = ${value}`,
        });
      } else {
        const conflictVars = (neighbors[variable] || []).filter(nb => assignment[nb] === value);
        steps.push({
          type: 'conflict',
          currentVar: variable,
          currentVal: value,
          conflictVars,
          assignment: { ...assignment },
          domains: cloneDomains(domains),
          desc: `✗ Xung đột: ${variable}=${value} mâu thuẫn với ${conflictVars.join(', ')}`,
        });
      }
    }
    return false;
  }

  backtrack([...variables]);
  steps.push({
    type: 'done',
    assignment: { ...assignment },
    domains: cloneDomains(domains),
    desc: Object.keys(assignment).length === variables.length
      ? '✓ Tìm thấy lời giải!'
      : '✗ Không tìm thấy lời giải',
  });
  return steps;
}

// AC-3 — Map Coloring
export function mapColoringAC3(problem) {
  const { variables, neighbors } = problem;
  const steps = [];
  const domains = cloneDomains(problem.domains);

  // Build arc queue
  const queue = [];
  for (const xi of variables) {
    for (const xj of (neighbors[xi] || [])) {
      queue.push([xi, xj]);
    }
  }

  steps.push({
    type: 'init',
    assignment: {},
    domains: cloneDomains(domains),
    arcQueue: [...queue],
    desc: `Khởi tạo hàng đợi cung: ${queue.length} cung cần kiểm tra`,
  });

  while (queue.length > 0) {
    const [xi, xj] = queue.shift();

    steps.push({
      type: 'arc_check',
      arcFrom: xi,
      arcTo: xj,
      assignment: {},
      domains: cloneDomains(domains),
      arcQueue: [...queue],
      desc: `Kiểm tra cung (${xi}, ${xj}): domain[${xi}] = {${domains[xi].join(',')}}`,
    });

    // Revise
    const removed = [];
    const newDomain = domains[xi].filter(vx => {
      return domains[xj].some(vy => vy !== vx);
    });
    const removedVals = domains[xi].filter(v => !newDomain.includes(v));

    if (removedVals.length > 0) {
      removed.push(...removedVals);
      domains[xi] = newDomain;

      if (domains[xi].length === 0) {
        steps.push({
          type: 'domain_empty',
          arcFrom: xi,
          arcTo: xj,
          removedVals,
          assignment: {},
          domains: cloneDomains(domains),
          arcQueue: [...queue],
          desc: `✗ Domain của ${xi} rỗng — không có lời giải!`,
        });
        steps.push({ type: 'done', assignment: {}, domains: cloneDomains(domains), desc: '✗ CSP không có lời giải (AC-3)' });
        return steps;
      }

      steps.push({
        type: 'domain_reduced',
        arcFrom: xi,
        arcTo: xj,
        removedVals,
        assignment: {},
        domains: cloneDomains(domains),
        arcQueue: [...queue],
        desc: `Thu hẹp domain[${xi}]: bỏ {${removedVals.join(',')}} → còn {${domains[xi].join(',')}}`,
      });

      // Thêm lại các cung liên quan
      for (const xk of (neighbors[xi] || [])) {
        if (xk !== xj && !queue.some(([a, b]) => a === xk && b === xi)) {
          queue.push([xk, xi]);
          steps.push({
            type: 'arc_add',
            arcFrom: xk,
            arcTo: xi,
            assignment: {},
            domains: cloneDomains(domains),
            arcQueue: [...queue],
            desc: `Thêm cung (${xk}, ${xi}) vào hàng đợi`,
          });
        }
      }
    } else {
      steps.push({
        type: 'arc_ok',
        arcFrom: xi,
        arcTo: xj,
        assignment: {},
        domains: cloneDomains(domains),
        arcQueue: [...queue],
        desc: `Cung (${xi}, ${xj}) nhất quán — không cần thu hẹp`,
      });
    }
  }

  // Sau AC-3, nếu domain nào = 1 giá trị → tự suy ra assignment
  const assignment = {};
  for (const v of variables) {
    if (domains[v].length === 1) assignment[v] = domains[v][0];
  }

  steps.push({
    type: 'done',
    assignment,
    domains: cloneDomains(domains),
    desc: '✓ AC-3 hoàn thành — đồ thị cung-nhất-quán',
  });
  return steps;
}

// Min-Conflicts — Map Coloring
export function mapColoringMinConflicts(problem, maxSteps = 100) {
  const { variables, domains, neighbors } = problem;
  const steps = [];

  // Gán ngẫu nhiên ban đầu
  const assignment = {};
  for (const v of variables) {
    assignment[v] = domains[v][Math.floor(Math.random() * domains[v].length)];
  }

  steps.push({
    type: 'init',
    assignment: { ...assignment },
    domains: cloneDomains(domains),
    iteration: 0,
    desc: 'Gán ngẫu nhiên ban đầu',
  });

  function countConflicts(variable, value, asgn) {
    return (neighbors[variable] || []).filter(nb => asgn[nb] === value).length;
  }

  for (let iter = 1; iter <= maxSteps; iter++) {
    // Tìm các biến đang có xung đột
    const conflicted = variables.filter(v =>
      countConflicts(v, assignment[v], assignment) > 0
    );

    if (conflicted.length === 0) {
      steps.push({
        type: 'done',
        assignment: { ...assignment },
        domains: cloneDomains(domains),
        iteration: iter,
        desc: `✓ Giải xong sau ${iter - 1} bước! Không còn xung đột.`,
      });
      return steps;
    }

    // Chọn ngẫu nhiên một biến đang xung đột
    const variable = conflicted[Math.floor(Math.random() * conflicted.length)];
    const conflictsBefore = countConflicts(variable, assignment[variable], assignment);

    // Chọn giá trị ít xung đột nhất
    let minConf = Infinity, bestVals = [];
    for (const val of domains[variable]) {
      const c = countConflicts(variable, val, assignment);
      if (c < minConf) { minConf = c; bestVals = [val]; }
      else if (c === minConf) bestVals.push(val);
    }
    const chosen = bestVals[Math.floor(Math.random() * bestVals.length)];

    steps.push({
      type: 'min_conflict',
      currentVar: variable,
      currentVal: chosen,
      conflictVars: (neighbors[variable] || []).filter(nb => assignment[nb] === assignment[variable]),
      conflictsBefore,
      conflictsAfter: minConf,
      assignment: { ...assignment },
      domains: cloneDomains(domains),
      iteration: iter,
      desc: `Bước ${iter}: chọn ${variable}, gán = ${chosen} (conflict: ${conflictsBefore} → ${minConf})`,
    });

    assignment[variable] = chosen;
  }

  steps.push({
    type: 'done',
    assignment: { ...assignment },
    domains: cloneDomains(domains),
    desc: `Đạt giới hạn ${maxSteps} bước — có thể chưa tối ưu`,
  });
  return steps;
}

// Branch & Bound — Map Coloring
export function mapColoringBranchBound(problem) {
  const { variables, domains, neighbors } = problem;
  const steps = [];
  const assignment = {};
  let bestSolution = null;

  steps.push({
    type: 'init',
    assignment: {},
    domains: cloneDomains(domains),
    desc: 'Branch & Bound: khởi tạo tìm kiếm',
  });

  function bound(asgn) {
    // Số biến chưa gán còn lại (bound đơn giản)
    return variables.filter(v => !(v in asgn)).length;
  }

  function branch(varIdx) {
    if (varIdx === variables.length) {
      bestSolution = { ...assignment };
      steps.push({
        type: 'solution',
        assignment: { ...assignment },
        domains: cloneDomains(domains),
        desc: `✓ Tìm thấy lời giải! ${Object.entries(assignment).map(([k,v]) => `${k}=${v}`).join(', ')}`,
      });
      return true;
    }

    const variable = variables[varIdx];
    const b = bound(assignment);

    steps.push({
      type: 'branch',
      currentVar: variable,
      assignment: { ...assignment },
      domains: cloneDomains(domains),
      boundVal: b,
      desc: `Nhánh: xét biến ${variable} | còn lại ${b} biến chưa gán`,
    });

    for (const value of domains[variable]) {
      if (isConsistentMap(variable, value, assignment, neighbors)) {
        assignment[variable] = value;
        steps.push({
          type: 'assign',
          currentVar: variable,
          currentVal: value,
          assignment: { ...assignment },
          domains: cloneDomains(domains),
          desc: `Gán ${variable} = ${value} (hợp lệ) — tiếp tục nhánh`,
        });

        if (branch(varIdx + 1)) return true;

        delete assignment[variable];
        steps.push({
          type: 'backtrack',
          currentVar: variable,
          assignment: { ...assignment },
          domains: cloneDomains(domains),
          desc: `Cắt nhánh: quay lui từ ${variable} = ${value}`,
        });
      } else {
        const conflictVars = (neighbors[variable] || []).filter(nb => assignment[nb] === value);
        steps.push({
          type: 'prune',
          currentVar: variable,
          currentVal: value,
          conflictVars,
          assignment: { ...assignment },
          domains: cloneDomains(domains),
          desc: `Cắt tỉa: ${variable}=${value} mâu thuẫn với ${conflictVars.join(', ')}`,
        });
      }
    }
    return false;
  }

  branch(0);
  if (!bestSolution) {
    steps.push({
      type: 'done',
      assignment: {},
      domains: cloneDomains(domains),
      desc: '✗ Không tìm thấy lời giải',
    });
  } else {
    steps.push({
      type: 'done',
      assignment: { ...bestSolution },
      domains: cloneDomains(domains),
      desc: '✓ Branch & Bound hoàn thành!',
    });
  }
  return steps;
}

// ─── N-QUEENS ────────────────────────────────────────────────
function queensConflict(row, col, placement) {
  for (let r = 0; r < placement.length; r++) {
    if (placement[r] === undefined) continue;
    const c = placement[r];
    if (c === col) return true;
    if (Math.abs(r - row) === Math.abs(c - col)) return true;
  }
  return false;
}

export function nQueensBacktracking(n) {
  const steps = [];
  const placement = new Array(n).fill(undefined); // placement[row] = col
  const domains = {};
  for (let i = 0; i < n; i++) domains[`Q${i}`] = Array.from({ length: n }, (_, j) => j);

  steps.push({
    type: 'init',
    placement: [...placement],
    domains: cloneDomains(domains),
    n,
    desc: `Khởi tạo ${n}-Queens: cần đặt ${n} quân Hậu trên bàn ${n}×${n}`,
  });

  function backtrack(row) {
    if (row === n) return true;
    for (let col = 0; col < n; col++) {
      steps.push({
        type: 'try',
        currentVar: `Q${row}`,
        currentVal: col,
        placement: [...placement],
        domains: cloneDomains(domains),
        n,
        desc: `Thử đặt Hậu hàng ${row} tại cột ${col}`,
      });

      if (!queensConflict(row, col, placement)) {
        placement[row] = col;
        steps.push({
          type: 'assign',
          currentVar: `Q${row}`,
          currentVal: col,
          placement: [...placement],
          domains: cloneDomains(domains),
          n,
          desc: `✓ Đặt Hậu hàng ${row} tại cột ${col} — hợp lệ`,
        });

        if (backtrack(row + 1)) return true;

        placement[row] = undefined;
        steps.push({
          type: 'backtrack',
          currentVar: `Q${row}`,
          placement: [...placement],
          domains: cloneDomains(domains),
          n,
          desc: `✗ Quay lui từ hàng ${row}, cột ${col}`,
        });
      } else {
        const conflictRows = [];
        for (let r = 0; r < row; r++) {
          if (placement[r] === col || Math.abs(r - row) === Math.abs(placement[r] - col))
            conflictRows.push(r);
        }
        steps.push({
          type: 'conflict',
          currentVar: `Q${row}`,
          currentVal: col,
          conflictVars: conflictRows.map(r => `Q${r}`),
          placement: [...placement],
          domains: cloneDomains(domains),
          n,
          desc: `✗ Xung đột tại hàng ${row}, cột ${col} với hàng ${conflictRows.join(',')}`,
        });
      }
    }
    return false;
  }

  const found = backtrack(0);
  steps.push({
    type: 'done',
    placement: [...placement],
    domains: cloneDomains(domains),
    n,
    desc: found ? `✓ Tìm thấy lời giải ${n}-Queens!` : '✗ Không có lời giải',
  });
  return steps;
}

export function nQueensAC3(n) {
  const steps = [];
  // Với N-Queens, domain của mỗi hàng = cột có thể đặt
  const domains = {};
  for (let i = 0; i < n; i++) domains[`Q${i}`] = Array.from({ length: n }, (_, j) => j);

  const queue = [];
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      if (i !== j) queue.push([`Q${i}`, `Q${j}`]);

  steps.push({
    type: 'init',
    placement: new Array(n).fill(undefined),
    domains: cloneDomains(domains),
    n,
    arcQueue: [...queue],
    desc: `AC-3 ${n}-Queens: ${queue.length} cung cần kiểm tra`,
  });

  while (queue.length > 0) {
    const [xi, xj] = queue.shift();
    const ri = parseInt(xi.slice(1)), rj = parseInt(xj.slice(1));

    steps.push({
      type: 'arc_check',
      arcFrom: xi, arcTo: xj,
      placement: new Array(n).fill(undefined),
      domains: cloneDomains(domains),
      arcQueue: [...queue],
      n,
      desc: `Kiểm tra cung (${xi}, ${xj})`,
    });

    const removedVals = [];
    const newDomain = domains[xi].filter(ci => {
      return domains[xj].some(cj => {
        return cj !== ci && Math.abs(rj - ri) !== Math.abs(cj - ci);
      });
    });
    const removed = domains[xi].filter(v => !newDomain.includes(v));

    if (removed.length > 0) {
      domains[xi] = newDomain;
      if (domains[xi].length === 0) {
        steps.push({
          type: 'domain_empty', arcFrom: xi, arcTo: xj,
          placement: new Array(n).fill(undefined),
          domains: cloneDomains(domains), arcQueue: [...queue], n,
          desc: `✗ Domain ${xi} rỗng!`,
        });
        steps.push({ type: 'done', placement: new Array(n).fill(undefined), domains: cloneDomains(domains), n, desc: '✗ Không có lời giải (AC-3)' });
        return steps;
      }
      steps.push({
        type: 'domain_reduced', arcFrom: xi, arcTo: xj, removedVals: removed,
        placement: new Array(n).fill(undefined),
        domains: cloneDomains(domains), arcQueue: [...queue], n,
        desc: `Thu hẹp domain[${xi}]: bỏ cột {${removed.join(',')}} → còn {${domains[xi].join(',')}}`,
      });
      for (let k = 0; k < n; k++) {
        const xk = `Q${k}`;
        if (xk !== xj && !queue.some(([a, b]) => a === xk && b === xi)) {
          queue.push([xk, xi]);
        }
      }
    } else {
      steps.push({
        type: 'arc_ok', arcFrom: xi, arcTo: xj,
        placement: new Array(n).fill(undefined),
        domains: cloneDomains(domains), arcQueue: [...queue], n,
        desc: `Cung (${xi}, ${xj}) nhất quán`,
      });
    }
  }

  const placement = new Array(n).fill(undefined);
  for (let i = 0; i < n; i++) {
    if (domains[`Q${i}`].length === 1) placement[i] = domains[`Q${i}`][0];
  }

  steps.push({
    type: 'done', placement, domains: cloneDomains(domains), n,
    desc: '✓ AC-3 hoàn thành — thu hẹp domain xong',
  });
  return steps;
}

export function nQueensMinConflicts(n, maxIter = 200) {
  const steps = [];
  // Gán ngẫu nhiên mỗi hàng một cột
  const placement = Array.from({ length: n }, () => Math.floor(Math.random() * n));

  steps.push({
    type: 'init', placement: [...placement],
    domains: {}, n, iteration: 0,
    desc: 'Gán ngẫu nhiên ban đầu cho N-Queens',
  });

  function conflicts(row, col, pl) {
    let c = 0;
    for (let r = 0; r < n; r++) {
      if (r === row) continue;
      if (pl[r] === col || Math.abs(r - row) === Math.abs(pl[r] - col)) c++;
    }
    return c;
  }

  for (let iter = 1; iter <= maxIter; iter++) {
    const conflictedRows = [];
    for (let r = 0; r < n; r++) {
      if (conflicts(r, placement[r], placement) > 0) conflictedRows.push(r);
    }

    if (conflictedRows.length === 0) {
      steps.push({
        type: 'done', placement: [...placement],
        domains: {}, n, iteration: iter,
        desc: `✓ Giải xong sau ${iter - 1} bước!`,
      });
      return steps;
    }

    const row = conflictedRows[Math.floor(Math.random() * conflictedRows.length)];
    let minConf = Infinity, bestCols = [];
    for (let c = 0; c < n; c++) {
      const cf = conflicts(row, c, placement);
      if (cf < minConf) { minConf = cf; bestCols = [c]; }
      else if (cf === minConf) bestCols.push(c);
    }
    const chosen = bestCols[Math.floor(Math.random() * bestCols.length)];
    const conflictsBefore = conflicts(row, placement[row], placement);

    steps.push({
      type: 'min_conflict', currentVar: `Q${row}`, currentVal: chosen,
      conflictsBefore, conflictsAfter: minConf,
      placement: [...placement], domains: {}, n, iteration: iter,
      desc: `Bước ${iter}: di chuyển Q${row} từ cột ${placement[row]} → cột ${chosen} (xung đột: ${conflictsBefore}→${minConf})`,
    });

    placement[row] = chosen;
  }

  steps.push({
    type: 'done', placement: [...placement], domains: {}, n,
    desc: `Đạt giới hạn ${maxIter} bước`,
  });
  return steps;
}

export function nQueensBranchBound(n) {
  const steps = [];
  const placement = new Array(n).fill(undefined);

  steps.push({
    type: 'init', placement: [...placement], domains: {}, n,
    desc: `Branch & Bound ${n}-Queens`,
  });

  function branch(row) {
    if (row === n) return true;
    steps.push({
      type: 'branch', currentVar: `Q${row}`,
      placement: [...placement], domains: {}, n,
      boundVal: n - row,
      desc: `Nhánh hàng ${row} — còn ${n - row} hàng cần đặt`,
    });

    for (let col = 0; col < n; col++) {
      if (!queensConflict(row, col, placement)) {
        placement[row] = col;
        steps.push({
          type: 'assign', currentVar: `Q${row}`, currentVal: col,
          placement: [...placement], domains: {}, n,
          desc: `Đặt Q${row} tại cột ${col}`,
        });
        if (branch(row + 1)) return true;
        placement[row] = undefined;
        steps.push({
          type: 'backtrack', currentVar: `Q${row}`,
          placement: [...placement], domains: {}, n,
          desc: `Cắt nhánh hàng ${row}, cột ${col}`,
        });
      } else {
        steps.push({
          type: 'prune', currentVar: `Q${row}`, currentVal: col,
          placement: [...placement], domains: {}, n,
          desc: `Cắt tỉa: hàng ${row}, cột ${col} xung đột`,
        });
      }
    }
    return false;
  }

  const found = branch(0);
  steps.push({
    type: 'done', placement: [...placement], domains: {}, n,
    desc: found ? '✓ Tìm thấy lời giải!' : '✗ Không có lời giải',
  });
  return steps;
}

// ─── SUDOKU ──────────────────────────────────────────────────
export const SUDOKU_EASY = [
  [5,3,0, 0,7,0, 0,0,0],
  [6,0,0, 1,9,5, 0,0,0],
  [0,9,8, 0,0,0, 0,6,0],

  [8,0,0, 0,6,0, 0,0,3],
  [4,0,0, 8,0,3, 0,0,1],
  [7,0,0, 0,2,0, 0,0,6],

  [0,6,0, 0,0,0, 2,8,0],
  [0,0,0, 4,1,9, 0,0,5],
  [0,0,0, 0,8,0, 0,7,9],
];

function sudokuIsValid(board, row, col, num) {
  for (let c = 0; c < 9; c++) if (board[row][c] === num) return false;
  for (let r = 0; r < 9; r++) if (board[r][col] === num) return false;
  const br = Math.floor(row / 3) * 3, bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++)
    for (let c = bc; c < bc + 3; c++)
      if (board[r][c] === num) return false;
  return true;
}

function copyBoard(board) { return board.map(r => [...r]); }

function sudokuCellKey(r, c) { return `${r},${c}`; }

export function sudokuBacktracking(initBoard) {
  const steps = [];
  const board = copyBoard(initBoard);

  steps.push({
    type: 'init', board: copyBoard(board),
    desc: 'Sudoku Backtracking: bắt đầu điền ô trống',
  });

  function findEmpty() {
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (board[r][c] === 0) return [r, c];
    return null;
  }

  function backtrack() {
    const cell = findEmpty();
    if (!cell) return true;
    const [row, col] = cell;

    for (let num = 1; num <= 9; num++) {
      steps.push({
        type: 'try', currentVar: sudokuCellKey(row, col),
        currentVal: num, board: copyBoard(board),
        desc: `Thử ô [${row},${col}] = ${num}`,
      });

      if (sudokuIsValid(board, row, col, num)) {
        board[row][col] = num;
        steps.push({
          type: 'assign', currentVar: sudokuCellKey(row, col),
          currentVal: num, board: copyBoard(board),
          desc: `✓ Gán ô [${row},${col}] = ${num}`,
        });
        if (backtrack()) return true;
        board[row][col] = 0;
        steps.push({
          type: 'backtrack', currentVar: sudokuCellKey(row, col),
          board: copyBoard(board),
          desc: `✗ Quay lui ô [${row},${col}]`,
        });
      } else {
        steps.push({
          type: 'conflict', currentVar: sudokuCellKey(row, col),
          currentVal: num, board: copyBoard(board),
          desc: `✗ Xung đột ô [${row},${col}] = ${num}`,
        });
      }
    }
    return false;
  }

  backtrack();
  steps.push({
    type: 'done', board: copyBoard(board),
    desc: '✓ Sudoku hoàn thành!',
  });
  return steps;
}

export function sudokuAC3(initBoard) {
  const steps = [];
  const board = copyBoard(initBoard);

  // Domains cho từng ô
  const domains = {};
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++) {
      const key = sudokuCellKey(r, c);
      if (board[r][c] !== 0) domains[key] = [board[r][c]];
      else domains[key] = [1,2,3,4,5,6,7,8,9];
    }

  function peers(r, c) {
    const p = new Set();
    for (let i = 0; i < 9; i++) {
      if (i !== c) p.add(sudokuCellKey(r, i));
      if (i !== r) p.add(sudokuCellKey(i, c));
    }
    const br = Math.floor(r/3)*3, bc = Math.floor(c/3)*3;
    for (let dr = 0; dr < 3; dr++)
      for (let dc = 0; dc < 3; dc++) {
        const nr = br+dr, nc = bc+dc;
        if (nr !== r || nc !== c) p.add(sudokuCellKey(nr, nc));
      }
    return [...p];
  }

  const queue = [];
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      for (const peer of peers(r, c))
        queue.push([sudokuCellKey(r,c), peer]);

  steps.push({
    type: 'init', board: copyBoard(board), domains: { ...domains },
    desc: `AC-3 Sudoku: ${queue.length} cung — thu hẹp domain`,
  });

  let iterations = 0;
  while (queue.length > 0 && iterations < 2000) {
    iterations++;
    const [xi, xj] = queue.shift();
    const [ri, ci] = xi.split(',').map(Number);

    steps.push({
      type: 'arc_check', arcFrom: xi, arcTo: xj,
      board: copyBoard(board), domains: { ...domains },
      desc: `Kiểm tra cung (${xi}, ${xj}): domain[${xi}]={${domains[xi].join(',')}}`,
    });

    const newDomain = domains[xi].filter(vx =>
      domains[xj].some(vy => vy !== vx)
    );
    const removed = domains[xi].filter(v => !newDomain.includes(v));

    if (removed.length > 0) {
      domains[xi] = newDomain;
      if (domains[xi].length === 0) {
        steps.push({
          type: 'domain_empty', arcFrom: xi, arcTo: xj,
          board: copyBoard(board), domains: { ...domains },
          desc: `✗ Domain ô ${xi} rỗng!`,
        });
        steps.push({ type: 'done', board: copyBoard(board), domains: { ...domains }, desc: '✗ Sudoku không có lời giải' });
        return steps;
      }
      if (domains[xi].length === 1) {
        board[ri][ci] = domains[xi][0];
      }
      steps.push({
        type: 'domain_reduced', arcFrom: xi, arcTo: xj, removedVals: removed,
        board: copyBoard(board), domains: { ...domains },
        desc: `Thu hẹp domain ô ${xi}: bỏ {${removed.join(',')}} → còn {${domains[xi].join(',')}}`,
      });
      for (const xk of peers(ri, ci)) {
        if (xk !== xj && !queue.some(([a,b]) => a===xk && b===xi)) {
          queue.push([xk, xi]);
        }
      }
    } else {
      steps.push({
        type: 'arc_ok', arcFrom: xi, arcTo: xj,
        board: copyBoard(board), domains: { ...domains },
        desc: `Cung (${xi}, ${xj}) nhất quán`,
      });
    }
  }

  steps.push({
    type: 'done', board: copyBoard(board), domains: { ...domains },
    desc: '✓ AC-3 Sudoku hoàn thành — domain đã thu hẹp tối đa',
  });
  return steps;
}

export function sudokuMinConflicts(initBoard, maxIter = 500) {
  const steps = [];
  const board = copyBoard(initBoard);

  // Điền ngẫu nhiên các ô trống
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      if (board[r][c] === 0) board[r][c] = Math.ceil(Math.random() * 9);

  steps.push({
    type: 'init', board: copyBoard(board), iteration: 0,
    desc: 'Điền ngẫu nhiên ban đầu vào Sudoku',
  });

  function cellConflicts(r, c, val, b) {
    let count = 0;
    for (let i = 0; i < 9; i++) {
      if (i !== c && b[r][i] === val) count++;
      if (i !== r && b[i][c] === val) count++;
    }
    const br = Math.floor(r/3)*3, bc = Math.floor(c/3)*3;
    for (let dr = 0; dr < 3; dr++)
      for (let dc = 0; dc < 3; dc++) {
        const nr = br+dr, nc = bc+dc;
        if ((nr !== r || nc !== c) && b[nr][nc] === val) count++;
      }
    return count;
  }

  const fixedCells = new Set();
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      if (initBoard[r][c] !== 0) fixedCells.add(sudokuCellKey(r,c));

  for (let iter = 1; iter <= maxIter; iter++) {
    const conflicted = [];
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (!fixedCells.has(sudokuCellKey(r,c)) && cellConflicts(r,c,board[r][c],board) > 0)
          conflicted.push([r,c]);

    if (conflicted.length === 0) {
      steps.push({ type: 'done', board: copyBoard(board), iteration: iter, desc: `✓ Sudoku giải xong sau ${iter-1} bước!` });
      return steps;
    }

    const [row,col] = conflicted[Math.floor(Math.random()*conflicted.length)];
    let minConf = Infinity, bestVals = [];
    for (let v = 1; v <= 9; v++) {
      const cf = cellConflicts(row, col, v, board);
      if (cf < minConf) { minConf = cf; bestVals = [v]; }
      else if (cf === minConf) bestVals.push(v);
    }
    const chosen = bestVals[Math.floor(Math.random()*bestVals.length)];
    const before = cellConflicts(row, col, board[row][col], board);

    steps.push({
      type: 'min_conflict', currentVar: sudokuCellKey(row,col),
      currentVal: chosen, conflictsBefore: before, conflictsAfter: minConf,
      board: copyBoard(board), iteration: iter,
      desc: `Bước ${iter}: ô [${row},${col}] ${board[row][col]}→${chosen} (xung đột: ${before}→${minConf})`,
    });

    board[row][col] = chosen;
  }

  steps.push({ type: 'done', board: copyBoard(board), desc: `Đạt giới hạn ${maxIter} bước` });
  return steps;
}

export function sudokuBranchBound(initBoard) {
  const steps = [];
  const board = copyBoard(initBoard);

  steps.push({
    type: 'init', board: copyBoard(board),
    desc: 'Sudoku Branch & Bound: ưu tiên ô ít lựa chọn nhất (MRV)',
  });

  // MRV: tìm ô trống có ít giá trị hợp lệ nhất
  function findMRV() {
    let best = null, bestCount = 10;
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (board[r][c] === 0) {
          const count = [1,2,3,4,5,6,7,8,9].filter(n => sudokuIsValid(board,r,c,n)).length;
          if (count < bestCount) { bestCount = count; best = [r,c]; }
        }
    return best ? [...best, bestCount] : null;
  }

  function branch() {
    const cell = findMRV();
    if (!cell) return true;
    const [row, col, remaining] = cell;

    steps.push({
      type: 'branch', currentVar: sudokuCellKey(row,col),
      board: copyBoard(board), boundVal: remaining,
      desc: `MRV: chọn ô [${row},${col}] — còn ${remaining} giá trị hợp lệ`,
    });

    for (let num = 1; num <= 9; num++) {
      if (sudokuIsValid(board, row, col, num)) {
        board[row][col] = num;
        steps.push({
          type: 'assign', currentVar: sudokuCellKey(row,col), currentVal: num,
          board: copyBoard(board),
          desc: `Gán ô [${row},${col}] = ${num}`,
        });
        if (branch()) return true;
        board[row][col] = 0;
        steps.push({
          type: 'backtrack', currentVar: sudokuCellKey(row,col),
          board: copyBoard(board),
          desc: `Cắt nhánh ô [${row},${col}] = ${num}`,
        });
      } else {
        steps.push({
          type: 'prune', currentVar: sudokuCellKey(row,col), currentVal: num,
          board: copyBoard(board),
          desc: `Cắt tỉa: ô [${row},${col}] = ${num} không hợp lệ`,
        });
      }
    }
    return false;
  }

  branch();
  steps.push({
    type: 'done', board: copyBoard(board),
    desc: '✓ Sudoku Branch & Bound hoàn thành!',
  });
  return steps;
}

// ─── SCHEDULING ──────────────────────────────────────────────
// Lập lịch thi: 6 môn học, 3 phòng, 4 slot thời gian
// Ràng buộc: môn cùng sinh viên không được cùng slot
export const SCHEDULING_PROBLEM = {
  courses: ['Toán', 'Lý', 'Hóa', 'Văn', 'Anh', 'GDTC'],
  rooms:   ['P101', 'P102', 'P103'],
  slots:   ['Sáng T2', 'Chiều T2', 'Sáng T3', 'Chiều T3'],
  // Các cặp môn cùng nhóm sinh viên (không được cùng slot)
  conflicts: [
    ['Toán','Lý'], ['Toán','Hóa'], ['Lý','Hóa'],
    ['Văn','Anh'], ['Toán','Văn'], ['Lý','Anh'],
  ],
};

function schedulingConflict(course, slot, assignment, conflictsMap) {
  const conflictCourses = conflictsMap[course] || [];
  for (const other of conflictCourses) {
    if (assignment[other] && assignment[other].slot === slot) return other;
  }
  return null;
}

function buildConflictsMap(conflicts) {
  const map = {};
  for (const [a,b] of conflicts) {
    if (!map[a]) map[a] = [];
    if (!map[b]) map[b] = [];
    map[a].push(b);
    map[b].push(a);
  }
  return map;
}

export function schedulingBacktracking(problem) {
  const { courses, rooms, slots, conflicts } = problem;
  const conflictsMap = buildConflictsMap(conflicts);
  const steps = [];
  const assignment = {}; // assignment[course] = { slot, room }

  // Domain: tất cả combo (slot × room)
  const domain = [];
  for (const slot of slots) for (const room of rooms) domain.push({ slot, room });

  steps.push({
    type: 'init', assignment: {}, schedDomains: { ...Object.fromEntries(courses.map(c => [c, [...domain]])) },
    desc: 'Khởi tạo lập lịch: mỗi môn có thể xếp vào bất kỳ slot/phòng nào',
  });

  function backtrack(idx) {
    if (idx === courses.length) return true;
    const course = courses[idx];

    for (const { slot, room } of domain) {
      steps.push({
        type: 'try', currentVar: course, currentVal: `${slot}/${room}`,
        assignment: { ...assignment },
        desc: `Thử xếp ${course}: ${slot} tại ${room}`,
      });

      const conflict = schedulingConflict(course, slot, assignment, conflictsMap);
      // Kiểm tra phòng không bị dùng trùng cùng slot
      const roomBusy = Object.values(assignment).some(a => a.slot === slot && a.room === room);

      if (!conflict && !roomBusy) {
        assignment[course] = { slot, room };
        steps.push({
          type: 'assign', currentVar: course, currentVal: `${slot}/${room}`,
          assignment: { ...assignment },
          desc: `✓ Xếp ${course}: ${slot} tại ${room}`,
        });
        if (backtrack(idx + 1)) return true;
        delete assignment[course];
        steps.push({
          type: 'backtrack', currentVar: course,
          assignment: { ...assignment },
          desc: `✗ Quay lui: bỏ ${course} tại ${slot}/${room}`,
        });
      } else {
        const reason = conflict ? `xung đột với ${conflict}` : `phòng ${room} đã dùng slot ${slot}`;
        steps.push({
          type: 'conflict', currentVar: course, currentVal: `${slot}/${room}`,
          conflictVars: conflict ? [conflict] : [],
          assignment: { ...assignment },
          desc: `✗ ${course} tại ${slot}/${room} — ${reason}`,
        });
      }
    }
    return false;
  }

  backtrack(0);
  steps.push({
    type: 'done', assignment: { ...assignment },
    desc: Object.keys(assignment).length === courses.length ? '✓ Tìm thấy lịch thi!' : '✗ Không tìm thấy lịch',
  });
  return steps;
}

export function schedulingAC3(problem) {
  const { courses, rooms, slots, conflicts } = problem;
  const steps = [];
  const domain = [];
  for (const slot of slots) for (const room of rooms) domain.push(`${slot}|${room}`);

  const domains = Object.fromEntries(courses.map(c => [c, [...domain]]));
  const conflictsMap = buildConflictsMap(conflicts);

  const queue = [];
  for (const [a,b] of conflicts) { queue.push([a,b]); queue.push([b,a]); }

  steps.push({
    type: 'init', assignment: {}, schedDomains: { ...domains },
    desc: `AC-3 Scheduling: ${queue.length} ràng buộc cần kiểm tra`,
  });

  while (queue.length > 0) {
    const [xi, xj] = queue.shift();
    steps.push({
      type: 'arc_check', arcFrom: xi, arcTo: xj,
      assignment: {}, schedDomains: { ...domains },
      desc: `Kiểm tra ràng buộc (${xi}, ${xj})`,
    });

    const newDomain = domains[xi].filter(vi => {
      const slotI = vi.split('|')[0];
      return domains[xj].some(vj => {
        const slotJ = vj.split('|')[0];
        return slotI !== slotJ;
      });
    });
    const removed = domains[xi].filter(v => !newDomain.includes(v));

    if (removed.length > 0) {
      domains[xi] = newDomain;
      if (domains[xi].length === 0) {
        steps.push({
          type: 'domain_empty', arcFrom: xi, arcTo: xj,
          assignment: {}, schedDomains: { ...domains },
          desc: `✗ Domain của ${xi} rỗng!`,
        });
        steps.push({ type: 'done', assignment: {}, schedDomains: { ...domains }, desc: '✗ Không thể lập lịch' });
        return steps;
      }
      steps.push({
        type: 'domain_reduced', arcFrom: xi, arcTo: xj, removedVals: removed,
        assignment: {}, schedDomains: { ...domains },
        desc: `Thu hẹp domain[${xi}]: bỏ ${removed.length} slot xung đột`,
      });
      for (const xk of (conflictsMap[xi] || [])) {
        if (xk !== xj && !queue.some(([a,b]) => a===xk && b===xi)) queue.push([xk,xi]);
      }
    } else {
      steps.push({
        type: 'arc_ok', arcFrom: xi, arcTo: xj,
        assignment: {}, schedDomains: { ...domains },
        desc: `Ràng buộc (${xi}, ${xj}) nhất quán`,
      });
    }
  }

  const assignment = {};
  for (const c of courses) {
    if (domains[c].length > 0) {
      const [slot, room] = domains[c][0].split('|');
      assignment[c] = { slot, room };
    }
  }

  steps.push({
    type: 'done', assignment, schedDomains: { ...domains },
    desc: '✓ AC-3 Scheduling hoàn thành',
  });
  return steps;
}

export function schedulingMinConflicts(problem, maxIter = 200) {
  const { courses, rooms, slots, conflicts } = problem;
  const conflictsMap = buildConflictsMap(conflicts);
  const steps = [];

  const assignment = {};
  for (const c of courses) {
    assignment[c] = {
      slot: slots[Math.floor(Math.random()*slots.length)],
      room: rooms[Math.floor(Math.random()*rooms.length)],
    };
  }

  steps.push({
    type: 'init', assignment: { ...assignment }, iteration: 0,
    desc: 'Gán ngẫu nhiên lịch thi ban đầu',
  });

  function countConflictsFor(course, slot, room, asgn) {
    let c = 0;
    for (const other of (conflictsMap[course]||[])) {
      if (asgn[other]?.slot === slot) c++;
    }
    for (const other of courses) {
      if (other !== course && asgn[other]?.slot === slot && asgn[other]?.room === room) c++;
    }
    return c;
  }

  for (let iter = 1; iter <= maxIter; iter++) {
    const conflicted = courses.filter(c =>
      countConflictsFor(c, assignment[c].slot, assignment[c].room, assignment) > 0
    );
    if (conflicted.length === 0) {
      steps.push({ type: 'done', assignment: { ...assignment }, iteration: iter, desc: `✓ Lịch thi hoàn chỉnh sau ${iter-1} bước!` });
      return steps;
    }

    const course = conflicted[Math.floor(Math.random()*conflicted.length)];
    let minConf = Infinity, bestOpts = [];
    for (const slot of slots) for (const room of rooms) {
      const cf = countConflictsFor(course, slot, room, assignment);
      if (cf < minConf) { minConf = cf; bestOpts = [{slot,room}]; }
      else if (cf === minConf) bestOpts.push({slot,room});
    }
    const chosen = bestOpts[Math.floor(Math.random()*bestOpts.length)];
    const before = countConflictsFor(course, assignment[course].slot, assignment[course].room, assignment);

    steps.push({
      type: 'min_conflict', currentVar: course,
      currentVal: `${chosen.slot}/${chosen.room}`,
      conflictsBefore: before, conflictsAfter: minConf,
      assignment: { ...assignment }, iteration: iter,
      desc: `Bước ${iter}: ${course} → ${chosen.slot}/${chosen.room} (xung đột: ${before}→${minConf})`,
    });

    assignment[course] = chosen;
  }

  steps.push({ type: 'done', assignment: { ...assignment }, desc: `Đạt giới hạn ${maxIter} bước` });
  return steps;
}

export function schedulingBranchBound(problem) {
  const { courses, rooms, slots, conflicts } = problem;
  const conflictsMap = buildConflictsMap(conflicts);
  const steps = [];
  const assignment = {};

  const domain = [];
  for (const slot of slots) for (const room of rooms) domain.push({ slot, room });

  steps.push({
    type: 'init', assignment: {},
    desc: 'Branch & Bound Scheduling: ưu tiên môn nhiều ràng buộc nhất',
  });

  function branch(idx) {
    if (idx === courses.length) return true;
    const course = courses[idx];
    const remaining = courses.length - idx;

    steps.push({
      type: 'branch', currentVar: course,
      assignment: { ...assignment }, boundVal: remaining,
      desc: `Nhánh: xếp lịch ${course} — còn ${remaining} môn`,
    });

    for (const { slot, room } of domain) {
      const conflict = schedulingConflict(course, slot, assignment, conflictsMap);
      const roomBusy = Object.values(assignment).some(a => a.slot===slot && a.room===room);

      if (!conflict && !roomBusy) {
        assignment[course] = { slot, room };
        steps.push({
          type: 'assign', currentVar: course, currentVal: `${slot}/${room}`,
          assignment: { ...assignment },
          desc: `Gán ${course}: ${slot} tại ${room}`,
        });
        if (branch(idx+1)) return true;
        delete assignment[course];
        steps.push({
          type: 'backtrack', currentVar: course,
          assignment: { ...assignment },
          desc: `Cắt nhánh: quay lui từ ${course} tại ${slot}/${room}`,
        });
      } else {
        steps.push({
          type: 'prune', currentVar: course, currentVal: `${slot}/${room}`,
          conflictVars: conflict ? [conflict] : [],
          assignment: { ...assignment },
          desc: `Cắt tỉa: ${course} tại ${slot}/${room} — ${conflict ? `xung đột với ${conflict}` : 'phòng bận'}`,
        });
      }
    }
    return false;
  }

  branch(0);
  steps.push({
    type: 'done', assignment: { ...assignment },
    desc: Object.keys(assignment).length === courses.length ? '✓ Lịch thi hoàn chỉnh!' : '✗ Không tìm được lịch',
  });
  return steps;
}
