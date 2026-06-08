//file này phục vụ việc tự tạo thuật toán 
//nhận hàm sort thuần túy của người dùng, wrap mảng bằng Proxy để theo dõi mọi thao tác get/set, 
// tự động sinh ra steps[] theo đúng schema hiện tại { array, comparing, swapped, sorted, done }.

/**
 * proxyWrapper.js
 * Nhận một hàm sort thuần túy (arr) => arr,
 * tự động sinh steps[] theo schema của AnimationEngine.
 */

// Hạn chế : chỉ áp dụng được với các phép so sánh dựa trên loop + swap,như merge,radix,.. 
//thì cần thêm cơ chế khác 

export function wrapWithProxy(userSortFn, inputArr) {
  const steps = [];
  const a = [...inputArr];
  const n = a.length;

  // Theo dõi các lần truy cập và hoán đổi
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
        // Ghi nhận bước comparing trước khi ghi
        if (lastGet.length >= 2) {
          steps.push({
            array: [...target],
            comparing: [...new Set(lastGet)],
            swapped: null,
            sorted: [],
          });
          lastGet = [];
        }

        // Ghi nhận bước swapped
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

  // Bước cuối — toàn bộ mảng đã sorted
  steps.push({
    array: [...a],
    comparing: null,
    swapped: null,
    sorted: Array.from({ length: n }, (_, k) => k),
    done: true,
  });

  return steps;
}