
/**
 * proxyWrapper.js
 * Nhận một hàm sort thuần túy (arr) => arr,
 * tự động sinh steps[] theo schema của AnimationEngine.
 */


export function wrapWithProxy(userSortFn, inputArr) {
  const steps = [];
  const a = [...inputArr];
  const n = a.length;

  let lastGet = [];   // các index vừa được đọc (comparing)
  let lastSet = [];   // các index vừa được ghi (swapped)

  const proxy = new Proxy(a, {
    get(target, prop) {
      const idx = Number(prop);
      if (!isNaN(idx) && idx >= 0 && idx < n) {
        lastGet.push(idx);
      }
      return target[prop];
    },

    set(target, prop, value) {
      const idx = Number(prop);
      if (!isNaN(idx) && idx >= 0 && idx < n) {
        if (lastGet.length >= 2) {
          steps.push({
            array: [...target],
            comparing: [...new Set(lastGet)],
            swapped: null,
            sorted: [],
          });
          lastGet = [];
        }

        lastSet.push(idx);
        target[prop] = value;

        if (lastSet.length >= 2) {
          steps.push({
            array: [...target],
            comparing: null,
            swapped: [...new Set(lastSet)],
            sorted: [],
          });
          lastSet = [];
        }
      } else {
        target[prop] = value;
      }
      return true;
    },
  });

  try {
    userSortFn(proxy);
  } catch (e) {
    throw new Error('Lỗi trong hàm sort của bạn: ' + e.message);
  }

  steps.push({
    array: [...a],
    comparing: null,
    swapped: null,
    sorted: Array.from({ length: n }, (_, k) => k),
    done: true,
  });

  return steps;
}