export const SORTING_ALGORITHMS = {
  SELECTION: 'selectionSort',
  INSERTION: 'insertionSort',
  MERGE: 'mergeSort',
  QUICK: 'quickSort',
  BUBBLE: 'bubbleSort',
  HEAP: 'heapSort',
  COUNTING: 'countingSort',
  RADIX: 'radixSort',
  SHELL: 'shellSort',
  BUCKET: 'bucketSort'
} as const;

export type SortingAlgorithm = typeof SORTING_ALGORITHMS[keyof typeof SORTING_ALGORITHMS];