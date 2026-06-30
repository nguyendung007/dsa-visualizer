
export const MAP_COLORING_PROBLEM = {
  variables: ['WA', 'NT', 'SA', 'Q', 'NSW', 'V', 'T'],
  domains: {
    WA: ['R', 'G', 'B'],
    NT: ['R', 'G', 'B'],
    SA: ['R', 'G', 'B'],
    Q:  ['R', 'G', 'B'],
    NSW: ['R', 'G', 'B'],
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

export const MAP_NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  WA:  { x: 100, y: 200 },
  NT:  { x: 240, y: 130 },
  SA:  { x: 290, y: 230 },
  Q:   { x: 390, y: 150 },
  NSW: { x: 420, y: 240 },
  V:   { x: 370, y: 310 },
  T:   { x: 390, y: 390 },
};

export const SUDOKU_EASY: number[][] = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

export const SCHEDULING_PROBLEM = {
  courses: ['Toán', 'Lý', 'Hóa', 'Văn', 'Anh', 'GDTC'],
  rooms:   ['P101', 'P102', 'P103'],
  slots:   ['Sáng T2', 'Chiều T2', 'Sáng T3', 'Chiều T3'],
  conflicts: [
    ['Toán', 'Lý'], ['Toán', 'Hóa'], ['Lý', 'Hóa'],
    ['Văn', 'Anh'], ['Toán', 'Văn'], ['Lý', 'Anh'],
  ],
};