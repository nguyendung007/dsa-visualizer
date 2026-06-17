import os
import json
import sys
from pathlib import Path

def get_tree_structure(directory, prefix="", is_root=True):
    """
    Lấy cấu trúc cây thư mục dưới dạng nested dictionary
    
    Args:
        directory: Đường dẫn thư mục cần liệt kê
        prefix: Khoảng trắng thụt đầu dòng
        is_root: Có phải là thư mục gốc không
    
    Returns:
        dict: Cấu trúc thư mục dạng nested
    """
    try:
        items = os.listdir(directory)
        
        # Phân loại và sắp xếp
        dirs = []
        files = []
        
        for item in items:
            if item.startswith('.'):
                continue
                
            full_path = os.path.join(directory, item)
            if os.path.isdir(full_path):
                dirs.append(item)
            else:
                files.append(item)
        
        dirs.sort()
        files.sort()
        
        # Xây dựng cấu trúc
        structure = {}
        
        for dir_name in dirs:
            full_path = os.path.join(directory, dir_name)
            structure[dir_name] = {
                'type': 'directory',
                'path': full_path,
                'children': get_tree_structure(full_path, prefix + "    ", is_root=False)
            }
        
        for file_name in files:
            full_path = os.path.join(directory, file_name)
            file_stat = os.stat(full_path)
            structure[file_name] = {
                'type': 'file',
                'path': full_path,
                'size': file_stat.st_size,
                'extension': os.path.splitext(file_name)[1]
            }
        
        return structure
        
    except PermissionError:
        return {'error': 'Permission denied'}
    except Exception as e:
        return {'error': str(e)}

def print_tree(directory, indent="", prefix=""):
    """
    In ra cấu trúc cây thư mục (dạng text)
    """
    try:
        items = os.listdir(directory)
        
        dirs = []
        files = []
        
        for item in items:
            if item.startswith('.'):
                continue
                
            full_path = os.path.join(directory, item)
            if os.path.isdir(full_path):
                dirs.append(item)
            else:
                files.append(item)
        
        dirs.sort()
        files.sort()
        
        all_items = dirs + files
        
        for i, item in enumerate(all_items):
            is_last = (i == len(all_items) - 1)
            full_path = os.path.join(directory, item)
            
            if is_last:
                current_prefix = prefix + "└── "
                next_prefix = prefix + "    "
            else:
                current_prefix = prefix + "├── "
                next_prefix = prefix + "│   "
            
            if os.path.isdir(full_path):
                print(f"{current_prefix}{item}/")
                print_tree(full_path, indent, next_prefix)
            else:
                print(f"{current_prefix}{item}")
                
    except PermissionError:
        print(f"{indent}{prefix}[Permission denied: {directory}]")
    except Exception as e:
        print(f"{indent}{prefix}[Error: {e}]")

def analyze_folder_structure(folder_path):
    """
    Hàm phân tích chính - TRẢ VỀ KẾT QUẢ (dùng cho import)
    """
    # Kiểm tra đường dẫn
    if not os.path.exists(folder_path):
        return {
            'success': False,
            'error': f'Đường dẫn không tồn tại: {folder_path}'
        }
    
    if not os.path.isdir(folder_path):
        return {
            'success': False,
            'error': f'Không phải là thư mục: {folder_path}'
        }
    
    # Đếm tổng số file và thư mục
    total_files = 0
    total_dirs = 0
    
    for root, dirs, files in os.walk(folder_path):
        # Bỏ qua thư mục ẩn
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        total_dirs += len(dirs)
        total_files += len([f for f in files if not f.startswith('.')])
    
    # Lấy cấu trúc
    structure = get_tree_structure(folder_path)
    
    # Tạo text tree
    import io
    from contextlib import redirect_stdout
    
    f = io.StringIO()
    with redirect_stdout(f):
        print(f"{os.path.basename(folder_path)}/")
        print_tree(folder_path)
    tree_text = f.getvalue()
    
    result = {
        'success': True,
        'folder_path': folder_path,
        'folder_name': os.path.basename(os.path.normpath(folder_path)),
        'absolute_path': os.path.abspath(folder_path),
        'statistics': {
            'total_directories': total_dirs,
            'total_files': total_files,
            'total_items': total_dirs + total_files
        },
        'structure': structure,
        'tree_text': tree_text
    }
    
    return result

# Hàm alias cho dễ dùng
def analyze(folder_path):
    """Alias cho analyze_folder_structure"""
    return analyze_folder_structure(folder_path)

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
            path = input("Nhap duong dan thu muc: ").strip()
            folder_path = os.path.abspath(path)
    else:
        folder_path = os.path.abspath(folder_path)
    
    # Kiểm tra đường dẫn
    if not os.path.exists(folder_path):
        print(f"Duong dan '{folder_path}' khong ton tai!")
        return {'success': False, 'error': 'Path not found'}
    
    if not os.path.isdir(folder_path):
        print(f"'{folder_path}' khong phai la thu muc!")
        return {'success': False, 'error': 'Not a directory'}
    
    # Phân tích
    result = analyze_folder_structure(folder_path)
    
    if is_command_line:
        print(f"\nCau truc thu muc: {result['folder_path']}")
        print("=" * 60)
        print(result['tree_text'])
        print("\n" + "=" * 60)
        print(f"Thong ke:")
        print(f"  - So thu muc: {result['statistics']['total_directories']}")
        print(f"  - So file: {result['statistics']['total_files']}")
        print(f"  - Tong so muc: {result['statistics']['total_items']}")
        
        # Lưu kết quả ra file JSON
        output_file = f"folder_structure_{result['folder_name']}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print(f"\nDa luu ket qua chi tiet vao file: {output_file}")
    
    return result

if __name__ == "__main__":
    main()