## Xây dựng phần mềm học môn DSA cho UET bằng React, thiết kế theo kiểu FP như kiến thức đã học trong Bài tập lớn PPLLT

### Cấu trúc thư mục dự án

```text
src/
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
│   │   └── Controls.jsx
│   ├── custom/
│   │   ├── CustomGraph.css
│   │   ├── CustomGraph.jsx
│   │   ├── CustomSorting.css
│   │   └── CustomSorting.jsx
│   ├── layouts/
│   │   ├── MainLayout.css
│   │   └── MainLayout.jsx
│   └── pages/
│       ├── ComplexityPage.css
│       ├── ComplexityPage.jsx
│       ├── GraphPage.css
│       ├── GraphPage.jsx
│       ├── Landingpage.css
│       ├── Landingpage.jsx
│       ├── LinkedListPage.css
│       ├── LinkedListPage.jsx
│       ├── ProblemsPage.css
│       ├── ProblemsPage.jsx
│       ├── SettingsPage.css
│       ├── SettingsPage.jsx
│       ├── SortingPage.css
│       ├── SortingPage.jsx
│       ├── StringPage.css
│       ├── StringPage.jsx
│       ├── StructuresPage.css
│       ├── StructuresPage.jsx
│       ├── TraversalPage.css
│       ├── TraversalPage.jsx
│       ├── TreePage.css
│       ├── TreePage.jsx
│       ├── UnionFindPage.css
│       └── UnionFindPage.jsx
├── {core/
│   └── {sorting,graph,trees,dataStructures,disjointSet,hashing,string},shell/
│       └── {animation},ui/
│           └── {pages,components,layouts}}/
├── App.jsx
└── main.jsx
```
### Mô tả

```text
1. core lưu giữ các file index là các thuật toán gốc bao gồm với việc ghi lại trạng thái,cụ thể trong từng file index.js

2. Tất cả các page chạy thuật toán đều tham chiếu đến AnimationEngine và mỗi page tạo ra 1 instance mới mỗi khi chạy thuật toán 

3. Project đang phát triển tính năng tự tạo thuật toán để hiểu hơn về độ phức tạp

```