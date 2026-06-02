import os

def print_tree(directory, indent="", prefix=""):
    """
    In ra cấu trúc cây thư mục
    
    Args:
        directory: Đường dẫn thư mục cần liệt kê
        indent: Khoảng trắng thụt đầu dòng
        prefix: Tiền tố cho dòng hiện tại
    """
    try:
        # Lấy danh sách các mục trong thư mục
        items = os.listdir(directory)
        
        # Phân loại thư mục và file
        dirs = []
        files = []
        
        for item in items:
            # Bỏ qua các file/thư mục ẩn (bắt đầu bằng .) - có thể bỏ nếu muốn
            if item.startswith('.'):
                continue
                
            full_path = os.path.join(directory, item)
            if os.path.isdir(full_path):
                dirs.append(item)
            else:
                files.append(item)
        
        # Sắp xếp để hiển thị
        dirs.sort()
        files.sort()
        
        # Kết hợp thư mục và file (thư mục lên trước)
        all_items = dirs + files
        
        # Duyệt từng mục
        for i, item in enumerate(all_items):
            is_last = (i == len(all_items) - 1)
            full_path = os.path.join(directory, item)
            
            # Xác định ký tự prefix
            if is_last:
                current_prefix = prefix + "└── "
                next_prefix = prefix + "    "
            else:
                current_prefix = prefix + "├── "
                next_prefix = prefix + "│   "
            
            # In ra mục hiện tại
            if os.path.isdir(full_path):
                print(f"{current_prefix}{item}/")
                # Đệ quy vào thư mục con
                print_tree(full_path, indent, next_prefix)
            else:
                print(f"{current_prefix}{item}")
                
    except PermissionError:
        print(f"{indent}{prefix}[Không có quyền truy cập: {directory}]")
    except FileNotFoundError:
        print(f"{indent}{prefix}[Không tìm thấy đường dẫn: {directory}]")
    except Exception as e:
        print(f"{indent}{prefix}[Lỗi: {e}]")

def main():
    # Nhập đường dẫn từ người dùng
    path = input("Nhập đường dẫn thư mục: ").strip()
    
    # Xử lý đường dẫn tương đối
    path = os.path.abspath(path)
    
    # Kiểm tra đường dẫn có tồn tại không
    if not os.path.exists(path):
        print(f"Đường dẫn '{path}' không tồn tại!")
        return
    
    # Kiểm tra có phải là thư mục không
    if not os.path.isdir(path):
        print(f"'{path}' không phải là thư mục!")
        return
    
    # In tiêu đề
    print(f"\nCấu trúc thư mục: {path}")
    print("=" * 60)
    
    # In thư mục gốc
    print(f"{os.path.basename(path)}/")
    
    # Gọi hàm in cấu trúc
    print_tree(path)

if __name__ == "__main__":
    main()