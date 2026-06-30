export const KMP = {
  base: 256,   // alphabet size (không dùng trực tiếp trong KMP nhưng giữ nhất quán)
} as const;

export const RABIN_KARP = {
  base: 256,
  mod:  101,
} as const;

export const SUFFIX_ARRAY = {
  separator: '$',   // ký tự sentinel
} as const;

export const LABELS = {
  match:          (pos: number)                     => `✓ Tìm thấy khớp tại vị trí ${pos}!`,
  shiftJ:         (from: number, to: number)        => `Dịch pattern: j từ ${from} → ${to}`,
  shiftAmount:    (amount: number, reason: string)  => `Dịch pattern: ${amount} ký tự (${reason})`,
  align:          (shift: number)                   => `Căn pattern tại vị trí ${shift}`,
  done:           (matches: number[])               => matches.length
    ? `✓ Xong! Tìm thấy ${matches.length} khớp: ${matches.join(', ')}`
    : '✓ Xong! Không tìm thấy',
  init:           (len: number, W: number)          => `Khởi tạo: ${len} từ, W=${W}`,
  passStart:      (algo: string, pass: number | undefined, digit: number) =>
    `${algo.toUpperCase()} Pass ${pass ?? ''}: xử lý ký tự tại vị trí [${digit}]`,
  bucket:         (word: string, char: string, code: number) =>
    `"${word}" → bucket['${char}'] (code=${code})`,
  collected:      (digit: number)                   => `Gom bucket về mảng sau pass [${digit}]`,
  createNode:     (char: string, depth: number)     => `Tạo nút '${char}' tại độ sâu ${depth}`,
  visitNode:      (nodeChar: string, char: string)  => `Thăm nút '${nodeChar}', so sánh với '${char}'`,
  markEnd:        (word: string)                    => `✓ Đánh dấu kết thúc từ "${word}"`,
  found:          (word: string)                    => `✓ Tìm thấy từ "${word}" trong TST`,
  notFound:       (word: string)                    => `✗ Không tìm thấy "${word}"`,
} as const;


export type SearchStep =
  | { type: 'lps';            lps: number[] }
  | { type: 'compare';        ti: number; pi: number; char_t: string; char_p: string; match: boolean }
  | { type: 'match';          pos: number }
  | { type: 'shift';          from?: number; to?: number; amount?: number; reason?: string }
  | { type: 'align';          shift: number }
  | { type: 'bad_char_table'; table: Record<string, number> }
  | { type: 'pattern_hash';   pattern: string; hash: number; base: number }
  | { type: 'window';         pos: number; hash: number; match: boolean }
  | { type: 'hash_collision'; pos: number }
  | { type: 'roll';           removed: string; added: string; newHash: number }
  | { type: 'verify';         ti: number; pi: number; char_t: string; char_p: string }
  | { type: 'done';           matches: number[] }

export type RadixStep =
  | { type: 'init';       arr: string[]; W: number }
  | { type: 'pass_start'; pass?: number; digit: number }
  | { type: 'bucket';     word: string; char: string; code: number }
  | { type: 'collected';  digit: number; arr: string[] }
  | { type: 'done';       arr: string[] }

export type Quick3Step =
  | { type: 'partition'; arr: string[]; lo: number; hi: number; lt: number; i: number; gt: number; d: number; desc: string }
  | { type: 'swap_lt'; arr: string[]; lo: number; hi: number; lt: number; i: number; gt: number; d: number; desc: string }
  | { type: 'swap_gt'; arr: string[]; lo: number; hi: number; lt: number; i: number; gt: number; d: number; desc: string }
  | { type: 'equal'; arr: string[]; lo: number; hi: number; lt: number; i: number; gt: number; d: number; desc: string }
  | { type: 'init'; arr: string[]; desc: string }
  | { type: 'done'; arr: string[]; desc: string }

export type SuffixStep =
  | { type: 'init'; suffixes: Array<{ idx: number; suffix: string }>; text: string; desc: string }
  | { type: 'suffix'; idx: number; suffix: string; pos: number; desc: string }
  | { type: 'compare'; s1: string; s2: string; i1: number; i2: number; desc: string }
  | { type: 'sorted'; suffixes: Array<{ idx: number; suffix: string }>; sa: number[]; desc: string }
  | { type: 'lcp'; i: number; s1: string; s2: string; lcp: number; lcpArr: number[]; desc: string }
  | { type: 'done'; sa: number[]; lcp: number[]; suffixes: Array<{ idx: number; suffix: string }>; desc: string }

export type TSTStep =
  | { type: 'create_node'; char: string; depth: number; word: string }
  | { type: 'compare'; char: string; nodeChar: string; depth: number }
  | { type: 'mark_end'; char: string; word: string }
  | { type: 'visit'; char: string; nodeChar: string; depth: number }
  | { type: 'found'; word: string }
  | { type: 'not_found'; word: string }

export type StringStep = SearchStep | RadixStep | Quick3Step | SuffixStep | TSTStep

export interface TSTNode {
  char:  string;
  left:  TSTNode | null;
  mid:   TSTNode | null;
  right: TSTNode | null;
  isEnd: boolean;
}