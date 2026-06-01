## Xây dựng phần mềm học môn DSA cho UET bằng React,thiết kế theo kiểu FP như kiến thức đã học trong Bài tập lớn PPLLT 

Cấu trúc thư mục dự án 
============================================================
'''text
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
│   │   └── index.js
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
│   ├── layouts/
│   │   ├── MainLayout.css
│   │   └── MainLayout.jsx
│   └── pages/
│       ├── ComplexityPage.css
│       ├── ComplexityPage.jsx
│       ├── GraphPage.css
│       ├── GraphPage.jsx
│       ├── LinkedListPage.css
│       ├── LinkedListPage.jsx
│       ├── ProblemsPage.css
│       ├── ProblemsPage.jsx
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
'''

