# Xây dựng phần mềm học môn DSA cho UET- DSA Visualizer

Ứng dụng trực quan hóa thuật toán & cấu trúc dữ liệu, xây dựng bằng React.  
Được xây dựng và phát triển bởi một người bị ám ảnh bởi môn này.

---

# 🚀 Cách chạy dự án (Quick Start)

Mở Terminal tại thư mục bạn muốn lưu dự án và chạy các lệnh sau:

```bash
1. Clone dự án về máy 
git clone https://github.com/nguyendung007/dsa-visualizer.git

2. Cài đặt thư viện và khởi chạy giao diện mô phỏng
npm install && npm run dev
```

## 1. Hỗ trợ các thuật toán

### 🔢 Sorting
| Thuật toán | Mô tả |
|---|---|
| Selection Sort | Chọn phần tử nhỏ nhất đặt vào vị trí đúng |
| Insertion Sort | Chèn từng phần tử vào đúng vị trí |
| Merge Sort | Chia để trị, ghép 2 mảng đã sắp xếp |
| Quick Sort | Chia theo pivot, đệ quy |
| Bubble Sort | So sánh và hoán đổi từng cặp liền kề |
| Heap Sort | Dùng cấu trúc heap nhị phân |
| Counting Sort | Đếm tần suất, dựng mảng kết quả |
| Radix Sort | Sắp xếp theo từng chữ số |
| Shell Sort | Insertion Sort với gap giảm dần (Knuth) |
| Bucket Sort | Phân phối vào bucket, sort từng bucket |

### 🌳 Trees
| Thuật toán | Mô tả |
|---|---|
| BST | Chèn, xóa, tìm kiếm, Floor, Ceil |
| AVL Tree | Tự cân bằng với 4 loại rotation |

### 🔁 Tree Traversal
Inorder · Preorder · Postorder · Level-order · Biểu thức cây

### 🕸️ Graph
| Thuật toán | Loại |
|---|---|
| BFS | Duyệt theo chiều rộng |
| DFS | Duyệt theo chiều sâu |
| Dijkstra | Đường đi ngắn nhất (không âm) |
| Bellman-Ford | Đường đi ngắn nhất (có cạnh âm) |
| Kruskal | Cây khung nhỏ nhất |
| Prim | Cây khung nhỏ nhất |
| Kosaraju | Thành phần liên thông mạnh |
| Topological Sort | Sắp xếp topo |

### 📦 Data Structures
Stack · Queue · Priority Queue · Hash Table

### 🔗 Linked List
Singly · Doubly · Circular — Chèn · Xóa · Đảo ngược

### ⊕ Union-Find
Quick Find · Quick Union · Weighted · Path Compression

### Σ String Algorithms
TST · LSD Radix Sort · MSD Radix Sort · 3-Way String Sort · Suffix Array · KMP · Boyer-Moore · Rabin-Karp

### ⚡ Problems
Two Sum: Brute Force · Two Pointer · Hash Map

### 𝑂 Complexity
Bảng Big-O lý thuyết + tra cứu độ phức tạp toàn bộ thuật toán

---

## 2. Tính năng thêm thuật toán tự định nghĩa *(đang phát triển)*

Người dùng có thể tự viết thuật toán sắp xếp của riêng mình và xem trực quan hóa ngay trên giao diện.

**Cách dùng:**
- Vào trang **Sorting**, bấm nút **＋ Thêm**
- Đặt tên thuật toán
- Viết hàm `mySort(arr)` — chỉ dùng `arr[i]`, `arr[j]` để đọc/ghi trực tiếp

```js
// Ví dụ: Bubble Sort tự viết
function mySort(arr) {
  for (let i = 0; i < arr.length - 1; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        let t = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = t;
      }
    }
  }
}
```

**Lưu ý:**
- Hệ thống tự động sinh bước animation bằng JavaScript `Proxy`
- Hiện tại chỉ hỗ trợ thuật toán dùng **so sánh và swap trực tiếp qua index**
- Không hỗ trợ `arr.splice()`, `arr.sort()`, hoặc mảng tạm trung gian

---

## 3. Tùy chỉnh giao diện (Settings)

Vào **Settings** để cá nhân hóa giao diện:

| Tùy chỉnh | Chi tiết |
|---|---|
| **Phông chữ** | Times New Roman · JetBrains Mono · Georgia · Arial · Courier New |
| **Màu nền** | Đen tuyền · Navy đậm · Xanh đêm · Xám tối · Tuỳ chỉnh (color picker) |
| **Ảnh nền** | Chọn từ thư viện mặc định hoặc tải ảnh từ máy lên |

Cài đặt được **lưu vào localStorage** — giữ nguyên sau khi reload trang.

---

## 4. 🛠️ Công cụ phân tích mã nguồn (Python Tools)

Để hỗ trợ cho những ai muốn viết lại mã nguồn, ở đây có đính kèm 1 tệp web phân tích mã nguồn viết bằng Python, giúp bạn dễ dàng hiểu cấu trúc và mở rộng ứng dụng.

### 📦 Các tool hiện có

| Tool | Chức năng |
|------|-----------|
| **folder_structure.py** | Xuất cây thư mục & thống kê số lượng file/folder |
| **search_string.py** | Tìm kiếm từ khóa trong toàn bộ file |
| **check_import.py** | Phân tích tất cả các dòng import/require |
| **state_jsx.py** | Phân tích React Hooks (useState, useContext, useMemo...) |
| **flow_jsx.py** | Map Button → Function, phát hiện handler không được gọi |

### 🚀 Cách sử dụng

```bash
# Phân tích cấu trúc thư mục
python folder_structure.py /path/to/dsa-visualizer

# Tìm kiếm từ khóa (VD: tìm tất cả useState)
python search_string.py /path/to/dsa-visualizer "useState"

# Phân tích imports
python check_import.py /path/to/dsa-visualizer

# Phân tích React states
python state_jsx.py /path/to/dsa-visualizer

# Phân tích UI flow
python flow_jsx.py /path/to/dsa-visualizer
```

### 💻 Sử dụng như module

```python
from state_jsx import analyze as analyze_states
from flow_jsx import analyze as analyze_flow

result = analyze_states("./src")  # Trả về dict JSON
print(result['summary']['total_states_found'])
```

### ✨ Tính năng

- ✅ Mỗi tool có API thống nhất: `analyze(folder_path)`
- ✅ Xuất kết quả JSON để tích hợp với hệ thống khác
- ✅ Tự động bỏ qua `node_modules`, `.git`, `dist`, `build`, `__pycache__`
- ✅ Xử lý lỗi encoding, không crash khi gặp file lỗi
- ✅ Có thể chạy độc lập từ command line hoặc import vào project khác

---

**💡 Gợi ý:** Bạn có thể dễ dàng thêm tool mới bằng cách tạo file Python với hàm `analyze(folder_path)` trả về dict.

## Cấu trúc thư mục dự án

```text
src/
├── api/  
│   ├── auth.js
│   ├── client.js
│   └── progress.js
├── assets/
│   ├── bg1.png
│   ├── bg2.png
│   └── bg3.png
├── context/
│   ├── AuthContext.jsx
│   └── ProgressContext.jsx
├── core/
│   ├── dataStructures/
│   │   └── index.js
│   ├── graph/
│   │   └── index.js
│   ├── linkedlist/
│   │   └── index.js
│   ├── problems/
│   │   └── index.js
│   ├── sorting/
│   │   ├── index.js
│   │   └── proxyWrapper.js
│   ├── string/
│   │   └── index.js
│   ├── trees/
│   │   ├── index.js
│   │   └── traversal.js
│   └── unionfind/
│       └── index.js
├── shell/
│   └── animation/
│       └── AnimationEngine.js
├── ui/
│   ├── components/
│   │   ├── Controls.css
│   │   ├── Controls.jsx
│   │   ├── GlobalUIEffects.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── SplitScreenTransition.jsx
│   │   └── Toast.jsx
│   ├── custom/
│   │   ├── CustomSorting.css
│   │   └── CustomSorting.jsx
│   ├── layouts/
│   │   ├── MainLayout.css
│   │   └── MainLayout.jsx
│   ├── pages/
│   │   ├── algo/
│   │   │   ├── GraphPage.css
│   │   │   ├── GraphPage.jsx
│   │   │   ├── LinkedListPage.css
│   │   │   ├── LinkedListPage.jsx
│   │   │   ├── ProblemsPage.css
│   │   │   ├── ProblemsPage.jsx
│   │   │   ├── SortingPage.css
│   │   │   ├── SortingPage.jsx
│   │   │   ├── StringPage.css
│   │   │   ├── StringPage.jsx
│   │   │   ├── StructuresPage.css
│   │   │   ├── StructuresPage.jsx
│   │   │   ├── TraversalPage.css
│   │   │   ├── TraversalPage.jsx
│   │   │   ├── TreePage.css
│   │   │   ├── TreePage.jsx
│   │   │   ├── UnionFindPage.css
│   │   │   └── UnionFindPage.jsx
│   │   └── system/
│   │       ├── ComplexityPage.css
│   │       ├── ComplexityPage.jsx
│   │       ├── LoginPage.css
│   │       ├── LoginPage.jsx
│   │       ├── ProgressPage.css
│   │       ├── ProgressPage.jsx
│   │       ├── SettingsPage.css
│   │       └── SettingsPage.jsx
│   └── styles/
│       └── global.css
├── App.jsx
└── main.jsx
```


## Cuối cùng : Đừng tạch môn này nhé mọi người :((((