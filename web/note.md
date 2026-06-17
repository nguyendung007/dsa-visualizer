# Cài đặt Flask

pip install flask

# Chạy ứng dụng

python app.py

# Tên môi trường thường đặt là 'venv' hoặc '.venv'

python -m venv venv

tools/folder_structure.py

# Tại vì môi trường ảo nó là của Linux : .\venv\bin\Activate.ps1

python -m pip install --upgrade pip

D:\Project\dsa-visualizer-v2\src

## Chạy được rồi,flask khá dễ dùng 

Bây dựa vào bảng đó sẽ biết được những gì :

1. Đầu tiên là 1 component quản lý bao nhiêu state : 
Ví dụ : D:\Project\dsa-visualizer-v2\src\ui\pages\algo\SortingPage.jsx
    "GraphPage.jsx": [
      {
        "file": "GraphPage.jsx",
        "file_name": "GraphPage.jsx",
        "initial_value": "\u0027bfs\u0027",
        "name": "algo",
        "setter": "setAlgo",
        "state_type": "useState"
      }, => để tạo nút chuyển thuật toán,đọc code là hiểu 
      {
        "file": "GraphPage.jsx",
        "file_name": "GraphPage.jsx",
        "initial_value": "defaultGraph",
        "name": "graph",
        "setter": "setGraph",
        "state_type": "useState"
      }, => Để  vẽ đồ thị 
      {
        "file": "GraphPage.jsx",
        "file_name": "GraphPage.jsx",
        "initial_value": "\u0027A\u0027",
        "name": "start",
        "setter": "setStart",
        "state_type": "useState"
      },
      {
        "file": "GraphPage.jsx",
        "file_name": "GraphPage.jsx",
        "initial_value": "[]",
        "name": "steps",
        "setter": "setSteps",
        "state_type": "useState"
      },
      {
        "file": "GraphPage.jsx",
        "file_name": "GraphPage.jsx",
        "initial_value": "0",
        "name": "stepIdx",
        "setter": "setStepIdx",
        "state_type": "useState"
      },
      {
        "file": "GraphPage.jsx",
        "file_name": "GraphPage.jsx",
        "initial_value": "null",
        "name": "curStep",
        "setter": "setCurStep",
        "state_type": "useState"
      },
      {
        "file": "GraphPage.jsx",
        "file_name": "GraphPage.jsx",
        "initial_value": "false",
        "name": "playing",
        "setter": "setPlaying",
        "state_type": "useState"
      },
      {
        "file": "GraphPage.jsx",
        "file_name": "GraphPage.jsx",
        "initial_value": "400",
        "name": "speed",
        "setter": "setSpeed",
        "state_type": "useState"
      },
      {
        "file": "GraphPage.jsx",
        "file_name": "GraphPage.jsx",
        "initial_value": "null",
        "name": "addMode",
        "setter": "setAddMode",
        "state_type": "useState"
      },
      {
        "file": "GraphPage.jsx",
        "file_name": "GraphPage.jsx",
        "initial_value": "null",
        "name": "pending",
        "setter": "setPending",
        "state_type": "useState"
      },
      {
        "file": "GraphPage.jsx",
        "file_name": "GraphPage.jsx",
        "initial_value": "1",
        "name": "newEdgeWeight",
        "setter": "setNewEdgeWeight",
        "state_type": "useState"
      },
      {
        "file": "GraphPage.jsx",
        "file_name": "GraphPage.jsx",
        "initial_value": "null",
        "name": "dragging",
        "setter": "setDragging",
        "state_type": "useState"
      },
      {
        "file": "GraphPage.jsx",
        "file_name": "GraphPage.jsx",
        "initial_value": "null",
        "name": "svgRef",
        "state_type": "useRef"
      },
      {
        "file": "GraphPage.jsx",
        "file_name": "GraphPage.jsx",
        "initial_value": "null",
        "name": "engineRef",
        "state_type": "useRef"
      }
    ],