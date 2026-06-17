import os
import re
import json
import sys
from pathlib import Path
from collections import defaultdict

def get_jsx_files(directory):
    """Lấy tất cả các file .jsx và .js trong thư mục"""
    jsx_files = []
    for root, dirs, files in os.walk(directory):
        # Bỏ qua các thư mục không cần thiết
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['node_modules', 'dist', 'build', '__pycache__']]
        
        for file in files:
            if file.endswith(('.jsx', '.js')):
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, directory)
                jsx_files.append(rel_path)
    
    return jsx_files

def extract_usestate_states(content, file_path):
    """Trích xuất tất cả useState declarations"""
    states = []
    
    pattern1 = r'const\s+\[(\w+),\s*(\w+)\]\s*=\s*useState\(([^)]*)\)'
    matches = re.finditer(pattern1, content)
    for match in matches:
        state_name = match.group(1)
        setter_name = match.group(2)
        initial_value = match.group(3).strip()
        
        states.append({
            'name': state_name,
            'setter': setter_name,
            'type': 'useState',
            'initial_value': initial_value[:100] if len(initial_value) > 100 else initial_value,
            'scope': 'local'
        })
    
    pattern2 = r'\[(\w+),\s*(\w+)\]\s*=\s*useState\(([^)]*)\)'
    matches = re.finditer(pattern2, content)
    for match in matches:
        state_name = match.group(1)
        setter_name = match.group(2)
        initial_value = match.group(3).strip()
        
        if not any(s['name'] == state_name for s in states):
            states.append({
                'name': state_name,
                'setter': setter_name,
                'type': 'useState',
                'initial_value': initial_value[:100] if len(initial_value) > 100 else initial_value,
                'scope': 'local'
            })
    
    return states

def extract_usereducer_states(content, file_path):
    """Trích xuất tất cả useReducer declarations"""
    states = []
    
    pattern = r'const\s+\[(\w+),\s*(\w+)\]\s*=\s*useReducer\(([^,]+),\s*([^)]+)\)'
    matches = re.finditer(pattern, content)
    for match in matches:
        state_name = match.group(1)
        dispatch_name = match.group(2)
        reducer_name = match.group(3).strip()
        initial_value = match.group(4).strip()
        
        states.append({
            'name': state_name,
            'setter': dispatch_name,
            'type': 'useReducer',
            'reducer': reducer_name,
            'initial_value': initial_value[:100] if len(initial_value) > 100 else initial_value,
            'scope': 'local'
        })
    
    return states

def extract_context_states(content, file_path):
    """Trích xuất các context being used (useContext)"""
    contexts = []
    
    pattern1 = r'const\s+(\w+)\s*=\s*useContext\((\w+)\)'
    matches = re.finditer(pattern1, content)
    for match in matches:
        var_name = match.group(1)
        context_name = match.group(2)
        
        contexts.append({
            'variable': var_name,
            'context': context_name,
            'type': 'useContext'
        })
    
    pattern2 = r'const\s*\{\s*([^}]+)\s*\}\s*=\s*useContext\((\w+)\)'
    matches = re.finditer(pattern2, content)
    for match in matches:
        destructured_vars = [v.strip() for v in match.group(1).split(',')]
        context_name = match.group(2)
        
        for var in destructured_vars:
            contexts.append({
                'variable': var,
                'context': context_name,
                'type': 'useContext',
                'destructured': True
            })
    
    return contexts

def extract_useref_states(content, file_path):
    """Trích xuất tất cả useRef declarations"""
    refs = []
    
    pattern = r'const\s+(\w+)\s*=\s*useRef\(([^)]*)\)'
    matches = re.finditer(pattern, content)
    for match in matches:
        ref_name = match.group(1)
        initial_value = match.group(2).strip()
        
        refs.append({
            'name': ref_name,
            'type': 'useRef',
            'initial_value': initial_value if initial_value else 'null'
        })
    
    return refs

def extract_usememo_states(content, file_path):
    """Trích xuất tất cả useMemo declarations"""
    memos = []
    
    pattern = r'const\s+(\w+)\s*=\s*useMemo\(\(\)\s*=>\s*([^,]+),\s*\[([^\]]*)\]\)'
    matches = re.finditer(pattern, content)
    for match in matches:
        memo_name = match.group(1)
        computation = match.group(2).strip()[:100]
        dependencies = match.group(3).strip()
        
        memos.append({
            'name': memo_name,
            'type': 'useMemo',
            'dependencies': dependencies if dependencies else '[]',
            'computation_preview': computation
        })
    
    return memos

def extract_usecallback_states(content, file_path):
    """Trích xuất tất cả useCallback declarations"""
    callbacks = []
    
    pattern = r'const\s+(\w+)\s*=\s*useCallback\(\([^)]*\)\s*=>\s*([^,]+),\s*\[([^\]]*)\]\)'
    matches = re.finditer(pattern, content)
    for match in matches:
        callback_name = match.group(1)
        dependencies = match.group(3).strip()
        
        callbacks.append({
            'name': callback_name,
            'type': 'useCallback',
            'dependencies': dependencies if dependencies else '[]'
        })
    
    return callbacks

def analyze_states(folder_path):
    """
    Hàm phân tích state chính - TRẢ VỀ KẾT QUẢ (dùng cho import)
    """
    # Kiểm tra đường dẫn
    if not os.path.exists(folder_path) or not os.path.isdir(folder_path):
        return {
            'success': False,
            'error': f'Đường dẫn không hợp lệ: {folder_path}'
        }
    
    # Tìm JSX files
    jsx_files = get_jsx_files(folder_path)
    
    if not jsx_files:
        return {
            'success': False,
            'error': 'Không tìm thấy file JSX/JS nào',
            'total_files': 0
        }
    
    # Thu thập tất cả states
    all_states = []
    
    for rel_path in jsx_files:
        full_path = os.path.join(folder_path, rel_path)
        
        try:
            with open(full_path, 'r', encoding='utf-8', errors='ignore') as file:
                content = file.read()
            
            usestate_states = extract_usestate_states(content, rel_path)
            usereducer_states = extract_usereducer_states(content, rel_path)
            context_states = extract_context_states(content, rel_path)
            useref_states = extract_useref_states(content, rel_path)
            usememo_states = extract_usememo_states(content, rel_path)
            usecallback_states = extract_usecallback_states(content, rel_path)
            
            for state in usestate_states:
                all_states.append({
                    'file': rel_path,
                    'file_name': os.path.basename(rel_path),
                    'state_type': 'useState',
                    'name': state['name'],
                    'setter': state['setter'],
                    'initial_value': state['initial_value']
                })
            
            for state in usereducer_states:
                all_states.append({
                    'file': rel_path,
                    'file_name': os.path.basename(rel_path),
                    'state_type': 'useReducer',
                    'name': state['name'],
                    'setter': state['setter'],
                    'reducer': state['reducer'],
                    'initial_value': state['initial_value']
                })
            
            for ref in useref_states:
                all_states.append({
                    'file': rel_path,
                    'file_name': os.path.basename(rel_path),
                    'state_type': 'useRef',
                    'name': ref['name'],
                    'initial_value': ref['initial_value']
                })
            
            for memo in usememo_states:
                all_states.append({
                    'file': rel_path,
                    'file_name': os.path.basename(rel_path),
                    'state_type': 'useMemo',
                    'name': memo['name'],
                    'dependencies': memo['dependencies'],
                    'computation': memo['computation_preview']
                })
            
            for callback in usecallback_states:
                all_states.append({
                    'file': rel_path,
                    'file_name': os.path.basename(rel_path),
                    'state_type': 'useCallback',
                    'name': callback['name'],
                    'dependencies': callback['dependencies']
                })
            
            for ctx in context_states:
                all_states.append({
                    'file': rel_path,
                    'file_name': os.path.basename(rel_path),
                    'state_type': 'useContext',
                    'variable': ctx['variable'],
                    'context': ctx['context']
                })
        
        except Exception as e:
            pass  # Bỏ qua lỗi để không làm hỏng output
    
    # Thống kê
    stats = defaultdict(int)
    for state in all_states:
        stats[state['state_type']] += 1
    
    # Tổ chức theo file
    states_by_file = defaultdict(list)
    for state in all_states:
        states_by_file[state['file']].append(state)
    
    # Chuẩn bị kết quả
    result = {
        'success': True,
        'folder_path': folder_path,
        'folder_name': os.path.basename(os.path.normpath(folder_path)),
        'summary': {
            'total_files_analyzed': len(states_by_file),
            'total_files_scanned': len(jsx_files),
            'total_states_found': len(all_states),
            'breakdown_by_type': dict(stats)
        },
        'states_by_file': dict(states_by_file)
    }
    
    return result

# Hàm alias cho dễ dùng
def analyze(folder_path):
    """Alias cho analyze_states"""
    return analyze_states(folder_path)

def main(folder_path=None):
    """
    Hàm main có thể nhận tham số folder_path
    - Nếu có tham số: phân tích folder đó
    - Nếu không: hỏi người dùng nhập đường dẫn
    """
    is_command_line = len(sys.argv) > 1 or folder_path is None
    
    if folder_path is None:
        if len(sys.argv) > 1:
            folder_path = sys.argv[1]
        else:
            print("=" * 70)
            print("REACT STATE ANALYZER - Phan tich State Management")
            print("=" * 70)
            
            while True:
                folder_path = input("\nNhap duong dan den thu muc chua JSX files: ").strip()
                folder_path = folder_path.strip('"').strip("'")
                
                if os.path.exists(folder_path) and os.path.isdir(folder_path):
                    break
                else:
                    print("Duong dan khong hop le!")
    
    # Phân tích
    result = analyze_states(folder_path)
    
    if is_command_line:
        if result['success']:
            print(f"\nFolder: {result['folder_path']}")
            print(f"Tong so file JSX/JS: {result['summary']['total_files_scanned']}")
            print(f"So file co state: {result['summary']['total_files_analyzed']}")
            print(f"Tong so states: {result['summary']['total_states_found']}")
            
            print(f"\nPhan bo theo loai:")
            for state_type, count in result['summary']['breakdown_by_type'].items():
                print(f"   - {state_type}: {count}")
            
            # Lưu kết quả
            output_file = f"react_states_{result['folder_name']}.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(result, f, ensure_ascii=False, indent=2)
            
            print(f"\nDa luu ket qua chi tiet vao file: {output_file}")
        else:
            print(f"\nLoi: {result.get('error', 'Unknown error')}")
    
    return result

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nDa huy chuong trinh!")
    except Exception as e:
        print(f"\nLoi: {e}")
        import traceback
        traceback.print_exc()