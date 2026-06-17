import os
import json
import sys
from pathlib import Path

def get_all_files(directory):
    """Lấy tất cả các file trong thư mục và thư mục con (không phân biệt định dạng)"""
    all_files = []
    for root, dirs, files in os.walk(directory):
        # Bỏ qua các thư mục ẩn và system folders
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['node_modules', 'venv', 'env', '__pycache__', 'dist', 'build']]
        
        for file in files:
            # Bỏ qua các file ẩn và file system
            if not file.startswith('.'):
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, directory)
                all_files.append(rel_path)
    
    return sorted(all_files)

def extract_imports_from_file(file_path):
    """Trích xuất tất cả các dòng import từ file (dạng raw)"""
    imports = []
    
    # Các pattern import phổ biến theo từng loại file
    import_patterns = {
        'keywords': ['import', 'from', 'require', 'include', '#include', 'using'],
        'extensions': ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.hpp', '.go', '.rs', '.php', '.rb']
    }
    
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
            lines = file.readlines()
        
        for line_num, line in enumerate(lines, 1):
            line_stripped = line.strip()
            if not line_stripped:
                continue
            
            # Kiểm tra nếu dòng có chứa từ khóa import
            line_lower = line_stripped.lower()
            is_import_line = False
            
            for keyword in import_patterns['keywords']:
                if keyword in line_lower:
                    is_import_line = True
                    break
            
            if is_import_line:
                # Thay vì thêm dict, thêm trực tiếp nội dung string
                imports.append(line_stripped)
    
    except Exception as e:
        # Không in ra lỗi để tránh làm hỏng output JSON
        pass
    
    return imports

def build_hierarchy_structure(directory, all_files):
    """Xây dựng cấu trúc phân cấp dict theo folder"""
    structure = {}
    
    for rel_path in all_files:
        full_path = os.path.join(directory, rel_path)
        
        # Tách đường dẫn thành các phần
        parts = Path(rel_path).parts
        current_level = structure
        
        # Đi sâu vào cấu trúc folder
        for i, part in enumerate(parts[:-1]):  # Tất cả các folder trừ file cuối
            if part not in current_level:
                current_level[part] = {}
            current_level = current_level[part]
        
        # Thêm file vào folder hiện tại
        file_name = parts[-1]
        imports = extract_imports_from_file(full_path)
        
        current_level[file_name] = {
            'name': file_name,
            'path': rel_path,
            'imports': imports
        }
    
    return structure

def convert_to_serializable(obj):
    """Chuyển đối tượng thành dạng serializable cho JSON"""
    if isinstance(obj, dict):
        return {k: convert_to_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_to_serializable(item) for item in obj]
    elif isinstance(obj, (str, int, float, bool)) or obj is None:
        return obj
    else:
        return str(obj)

def print_preview(structure, level=0, max_items=3, use_emoji=True):
    """In preview cấu trúc để xem trước"""
    indent = "  " * level
    
    # Thay thế emoji nếu không dùng được
    if not use_emoji:
        replacements = {
            '📄': '[FILE]',
            '📁': '[DIR]',
            '🔍': '[ANALYZER]',
            '✅': '[OK]',
            '❌': '[ERROR]',
            '⚠️': '[WARN]',
            '✨': '[DONE]',
            '📊': '[STATS]',
            '🔗': '[LINK]',
            '💾': '[SAVE]'
        }
    else:
        replacements = {}
    
    def format_text(text):
        for emoji, replacement in replacements.items():
            text = text.replace(emoji, replacement)
        return text
    
    for i, (key, value) in enumerate(structure.items()):
        if i >= max_items and level == 0:
            print(format_text(f"{indent}  ... và {len(structure) - max_items} mục khác"))
            break
            
        if isinstance(value, dict) and 'name' in value:
            # Đây là file
            import_count = len(value.get('imports', []))
            print(format_text(f"{indent}📄 {key} ({import_count} imports)"))
            if import_count > 0 and level < 1:
                for imp in value['imports'][:2]:
                    print(format_text(f"{indent}  └─ {imp[:80]}"))
                if import_count > 2:
                    print(format_text(f"{indent}  └─ ... và {import_count - 2} imports khác"))
        else:
            # Đây là folder
            print(format_text(f"{indent}📁 {key}/"))
            print_preview(value, level + 1, max_items, use_emoji)

def analyze_folder(folder_path):
    """Hàm phân tích chính - TRẢ VỀ KẾT QUẢ (dùng cho import)"""
    # Kiểm tra đường dẫn
    if not os.path.exists(folder_path) or not os.path.isdir(folder_path):
        return {
            'error': f'Đường dẫn không hợp lệ: {folder_path}',
            'success': False
        }
    
    # Lấy tất cả các file
    all_files = get_all_files(folder_path)
    
    if not all_files:
        return {
            'error': 'Không tìm thấy file nào trong thư mục',
            'success': False,
            'total_files': 0
        }
    
    # Xây dựng cấu trúc phân cấp
    structure = build_hierarchy_structure(folder_path, all_files)
    
    # Thống kê
    total_imports = 0
    files_with_imports = 0
    
    def count_imports(obj):
        nonlocal total_imports, files_with_imports
        if isinstance(obj, dict):
            if 'imports' in obj:
                if obj['imports']:
                    files_with_imports += 1
                    total_imports += len(obj['imports'])
            for value in obj.values():
                count_imports(value)
    
    count_imports(structure)
    
    # Chuẩn bị kết quả
    result = {
        'success': True,
        'folder_path': folder_path,
        'folder_name': os.path.basename(os.path.normpath(folder_path)),
        'total_files': len(all_files),
        'files_with_imports': files_with_imports,
        'total_imports': total_imports,
        'structure': convert_to_serializable(structure),
        'all_files': all_files
    }
    
    return result

def save_result_to_file(result, output_file=None):
    """Lưu kết quả ra file JSON"""
    if output_file is None:
        folder_name = result.get('folder_name', 'unknown')
        output_file = f"import_analysis_{folder_name}.json"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    return output_file

def print_result_summary(result, use_emoji=False):
    """In tóm tắt kết quả"""
    if not result.get('success', False):
        print(f"Lỗi: {result.get('error', 'Unknown error')}")
        return
    
    # Thay thế emoji nếu cần
    if not use_emoji:
        replacements = {
            '🔍': '[ANALYZER]',
            '📁': '[FOLDER]',
            '📄': '[FILE]',
            '📊': '[STATS]',
            '🔗': '[LINK]',
            '✅': '[OK]',
            '💾': '[SAVE]',
            '✨': '[DONE]'
        }
        for emoji, replacement in replacements.items():
            for key in ['folder_name', 'folder_path']:
                if key in result and isinstance(result[key], str):
                    result[key] = result[key].replace(emoji, replacement)
    
    print("=" * 60)
    print("FILE IMPORT ANALYZER - Phân tích imports trong tất cả các file")
    print("=" * 60)
    print(f"\nFolder: {result['folder_path']}")
    print(f"Tổng số file: {result['total_files']}")
    print(f"Số file có chứa import: {result['files_with_imports']}")
    print(f"Tổng số dòng import: {result['total_imports']}")
    
    # Hiển thị preview
    if result.get('structure'):
        print("\n" + "=" * 60)
        print("PREVIEW KET QUA:")
        print("=" * 60)
        print_preview(result['structure'], use_emoji=use_emoji)

def main(folder_path=None):
    """
    Hàm main có thể nhận tham số folder_path
    - Nếu có tham số: phân tích folder đó
    - Nếu không: hỏi người dùng nhập đường dẫn
    - Trả về kết quả dạng dict
    """
    # Kiểm tra xem có đang chạy từ command line không
    is_command_line = len(sys.argv) > 1 or folder_path is None
    
    # Xác định folder_path
    if folder_path is None:
        if len(sys.argv) > 1:
            folder_path = sys.argv[1]
        else:
            # Chạy tương tác
            print("=" * 60)
            print("FILE IMPORT ANALYZER - Phan tich imports trong tat ca cac file")
            print("=" * 60)
            
            while True:
                folder_path = input("\nNhap duong dan den thu muc can phan tich: ").strip()
                folder_path = folder_path.strip('"').strip("'")
                
                if os.path.exists(folder_path) and os.path.isdir(folder_path):
                    break
                else:
                    print("Duong dan khong hop le hoac khong phai la thu muc. Vui long nhap lai!")
    
    # Phân tích folder
    result = analyze_folder(folder_path)
    
    # Nếu chạy từ command line, in ra kết quả
    if is_command_line:
        if result['success']:
            # Lưu file
            output_file = save_result_to_file(result)
            print(f"\nDa luu ket qua vao file: {output_file}")
            
            # In preview
            print_result_summary(result, use_emoji=False)
            
            print(f"\nKet qua chi tiet da duoc luu trong file: {output_file}")
            print("\nHoan tat!")
        else:
            print(f"\nLoi: {result.get('error', 'Unknown error')}")
    
    return result

# Hàm alias cho dễ dùng
def analyze(folder_path):
    """Alias cho analyze_folder - tiện cho import"""
    return analyze_folder(folder_path)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nDa huy chuong trinh!")
    except Exception as e:
        print(f"\nLoi khong mong muon: {e}")
        import traceback
        traceback.print_exc()