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

def clean_handler_name(handler):
    """Làm sạch tên handler, loại bỏ code thừa"""
    if not handler:
        return None
    
    # Loại bỏ khoảng trắng thừa
    handler = handler.strip()
    
    # Nếu là arrow function ngắn, chỉ lấy tên function
    if '=>' in handler and '(' in handler:
        # Ví dụ: () => setAlgo(k) -> setAlgo
        match = re.search(r'=>\s*(\w+)\(', handler)
        if match:
            return match.group(1)
    
    # Nếu là tên function đơn giản
    if re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', handler):
        return handler
    
    # Nếu là handleXXX
    match = re.search(r'handle([A-Z][a-zA-Z0-9_]*)', handler)
    if match:
        return f"handle{match.group(1)}"
    
    # Nếu là onXXX
    match = re.search(r'on([A-Z][a-zA-Z0-9_]*)', handler)
    if match:
        return f"on{match.group(1)}"
    
    # Trả về phiên bản rút gọn
    if len(handler) > 50:
        return handler[:50] + "..."
    return handler

def extract_buttons_from_file(content, file_path):
    """Trích xuất tất cả các nút và handler từ một file"""
    buttons = []
    seen_handlers = set()
    
    # Pattern cho các loại nút và sự kiện
    patterns = [
        (r'<Button[^>]*onClick\s*=\s*\{([^}]+)\}[^>]*>', 'button', 'Button'),
        (r'<button[^>]*onClick\s*=\s*\{([^}]+)\}[^>]*>', 'button', 'button'),
        (r'onClick\s*=\s*\{([^}]+)\}', 'event', 'onClick'),
        (r'onSubmit\s*=\s*\{([^}]+)\}', 'event', 'onSubmit'),
        (r'onChange\s*=\s*\{([^}]+)\}', 'event', 'onChange'),
        (r'onKey(?:Press|Down|Up)\s*=\s*\{([^}]+)\}', 'event', 'onKey'),
        (r'onMouse(?:Enter|Leave|Over|Out)\s*=\s*\{([^}]+)\}', 'event', 'onMouse'),
    ]
    
    for pattern, btn_type, event_type in patterns:
        matches = re.finditer(pattern, content, re.MULTILINE | re.IGNORECASE)
        for match in matches:
            handler_raw = match.group(1).strip()
            handler_clean = clean_handler_name(handler_raw)
            
            if handler_clean and handler_clean not in seen_handlers:
                seen_handlers.add(handler_clean)
                
                button_text = ""
                if btn_type == 'button':
                    full_match = match.group(0)
                    text_match = re.search(r'>(.*?)<', full_match)
                    if text_match:
                        button_text = text_match.group(1).strip()
                        if len(button_text) > 30:
                            button_text = button_text[:30] + "..."
                
                buttons.append({
                    'handler': handler_clean,
                    'original_handler': handler_raw[:100] if len(handler_raw) > 100 else handler_raw,
                    'event_type': event_type,
                    'element_type': btn_type,
                    'button_text': button_text if button_text else None
                })
    
    # Loại bỏ trùng lặp
    unique_buttons = []
    seen = set()
    for btn in buttons:
        if btn['handler'] not in seen:
            seen.add(btn['handler'])
            unique_buttons.append(btn)
    
    return unique_buttons

def extract_functions_from_file(content, file_path):
    """Trích xuất tất cả các function definitions từ file"""
    functions = []
    seen_functions = set()
    
    patterns = [
        (r'const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*{', 'arrow'),
        (r'const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*{', 'arrow'),
        (r'function\s+(\w+)\s*\([^)]*\)\s*{', 'function'),
        (r'async\s+function\s+(\w+)\s*\([^)]*\)\s*{', 'async_function'),
        (r'const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*\(', 'arrow_implicit'),
        (r'useCallback\s*\(\s*\([^)]*\)\s*=>\s*{', 'usecallback'),
    ]
    
    for pattern, func_type in patterns:
        matches = re.findall(pattern, content)
        for match in matches:
            if isinstance(match, tuple):
                match = match[0]
            if match and match not in seen_functions:
                seen_functions.add(match)
                functions.append({
                    'name': match,
                    'type': func_type
                })
    
    return functions

def map_buttons_to_functions(buttons, functions):
    """Mapping buttons đến functions"""
    function_names = {f['name'] for f in functions}
    
    for button in buttons:
        handler = button['handler']
        button['maps_to_function'] = handler in function_names
        button['called_functions'] = []
        
        if handler in function_names:
            button['called_functions'].append(handler)
        else:
            for func_name in function_names:
                if func_name in button.get('original_handler', ''):
                    button['called_functions'].append(func_name)
        
        button['called_functions'] = list(set(button['called_functions']))

def analyze_ui_flow(folder_path):
    """
    Hàm phân tích chính - TRẢ VỀ KẾT QUẢ (dùng cho import)
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
    
    # Xây dựng phân tích
    analysis = {
        'summary': {
            'total_files': len(jsx_files),
            'total_buttons': 0,
            'total_functions': 0,
            'files_with_buttons': 0
        },
        'files': {}
    }
    
    for rel_path in jsx_files:
        full_path = os.path.join(folder_path, rel_path)
        
        try:
            with open(full_path, 'r', encoding='utf-8', errors='ignore') as file:
                content = file.read()
            
            buttons = extract_buttons_from_file(content, rel_path)
            functions = extract_functions_from_file(content, rel_path)
            map_buttons_to_functions(buttons, functions)
            
            file_data = {
                'file_path': rel_path,
                'file_name': os.path.basename(rel_path),
                'total_buttons': len(buttons),
                'total_functions': len(functions),
                'buttons': buttons,
                'functions': functions
            }
            
            if buttons or functions:
                analysis['files'][rel_path] = file_data
                analysis['summary']['total_buttons'] += len(buttons)
                analysis['summary']['total_functions'] += len(functions)
                if buttons:
                    analysis['summary']['files_with_buttons'] += 1
        
        except Exception as e:
            pass  # Bỏ qua lỗi để không làm hỏng output
    
    # Tính mapping statistics
    mapped_count = 0
    unmapped_count = 0
    
    for file_data in analysis['files'].values():
        for button in file_data['buttons']:
            if button['maps_to_function'] or button['called_functions']:
                mapped_count += 1
            else:
                unmapped_count += 1
    
    # Chuẩn bị kết quả
    result = {
        'success': True,
        'folder_path': folder_path,
        'folder_name': os.path.basename(os.path.normpath(folder_path)),
        'summary': analysis['summary'],
        'statistics': {
            'total_buttons': analysis['summary']['total_buttons'],
            'total_functions': analysis['summary']['total_functions'],
            'mapped_buttons': mapped_count,
            'unmapped_buttons': unmapped_count,
            'mapping_percentage': (mapped_count / max(analysis['summary']['total_buttons'], 1)) * 100
        },
        'files': analysis['files'],
        'button_function_mapping': []
    }
    
    # Tạo mapping đơn giản
    for file_path, file_data in analysis['files'].items():
        for button in file_data['buttons']:
            if button['called_functions']:
                result['button_function_mapping'].append({
                    'file': file_path,
                    'file_name': file_data['file_name'],
                    'button': button['handler'],
                    'button_text': button.get('button_text'),
                    'calls': button['called_functions'],
                    'event': button['event_type']
                })
    
    return result

# Hàm alias cho dễ dùng
def analyze(folder_path):
    """Alias cho analyze_ui_flow"""
    return analyze_ui_flow(folder_path)

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
            print("JSX UI ANALYZER - Button to Function Mapping")
            print("=" * 70)
            
            while True:
                folder_path = input("\nNhap duong dan den thu muc chua JSX files: ").strip()
                folder_path = folder_path.strip('"').strip("'")
                
                if os.path.exists(folder_path) and os.path.isdir(folder_path):
                    break
                else:
                    print("Duong dan khong hop le!")
    
    # Phân tích
    result = analyze_ui_flow(folder_path)
    
    if is_command_line:
        if result['success']:
            # Lưu file
            output_file = f"flow_jsx_results_of_{result['folder_name']}.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(result, f, ensure_ascii=False, indent=2)
            
            # In kết quả
            print(f"\nFolder: {result['folder_path']}")
            print(f"Tong so file: {result['summary']['total_files']}")
            print(f"Tong so buttons: {result['summary']['total_buttons']}")
            print(f"Tong so functions: {result['summary']['total_functions']}")
            print(f"Files co buttons: {result['summary']['files_with_buttons']}")
            print(f"\nMapping statistics:")
            print(f"   Mapped buttons: {result['statistics']['mapped_buttons']} ({result['statistics']['mapping_percentage']:.1f}%)")
            print(f"   Unmapped buttons: {result['statistics']['unmapped_buttons']}")
            print(f"\nDa luu ket qua vao file: {output_file}")
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