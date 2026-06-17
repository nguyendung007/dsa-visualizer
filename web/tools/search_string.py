import os
import sys
import json
from pathlib import Path

def search_keyword_in_files(directory, keyword):
    """
    Tìm kiếm từ khóa trong tất cả các file của thư mục (bao gồm thư mục con)

    Args:
        directory (str): Đường dẫn thư mục cần tìm
        keyword (str): Từ khóa cần tìm

    Returns:
        dict: Kết quả tìm kiếm
    """
    found_files = []
    errors = []

    # Kiểm tra đường dẫn có tồn tại không
    if not os.path.exists(directory):
        return {
            'success': False,
            'error': f"Đường dẫn '{directory}' không tồn tại!",
            'found_files': [],
            'keyword': keyword
        }

    # Kiểm tra có phải thư mục không
    if not os.path.isdir(directory):
        return {
            'success': False,
            'error': f"'{directory}' không phải là thư mục!",
            'found_files': [],
            'keyword': keyword
        }

    # Duyệt qua tất cả các file và thư mục con
    for root, dirs, files in os.walk(directory):
        # Bỏ qua các thư mục không cần thiết
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['node_modules', 'dist', 'build', '__pycache__']]
        
        for file in files:
            if file.startswith('.'):
                continue
                
            file_path = os.path.join(root, file)
            rel_path = os.path.relpath(file_path, directory)

            try:
                # Thử đọc file với encoding utf-8
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if keyword in content:
                        # Tìm dòng chứa keyword
                        lines_with_keyword = []
                        for line_num, line in enumerate(content.split('\n'), 1):
                            if keyword in line:
                                lines_with_keyword.append({
                                    'line_number': line_num,
                                    'content': line.strip()[:200]  # Giới hạn độ dài
                                })
                        
                        found_files.append({
                            'file_path': file_path,
                            'relative_path': rel_path,
                            'file_name': file,
                            'matches': lines_with_keyword,
                            'match_count': len(lines_with_keyword)
                        })

            except UnicodeDecodeError:
                # Nếu lỗi encoding, thử với encoding latin-1
                try:
                    with open(file_path, 'r', encoding='latin-1') as f:
                        content = f.read()
                        if keyword in content:
                            lines_with_keyword = []
                            for line_num, line in enumerate(content.split('\n'), 1):
                                if keyword in line:
                                    lines_with_keyword.append({
                                        'line_number': line_num,
                                        'content': line.strip()[:200]
                                    })
                            
                            found_files.append({
                                'file_path': file_path,
                                'relative_path': rel_path,
                                'file_name': file,
                                'matches': lines_with_keyword,
                                'match_count': len(lines_with_keyword)
                            })
                except Exception as e:
                    errors.append({
                        'file': rel_path,
                        'error': str(e)
                    })

            except Exception as e:
                errors.append({
                    'file': rel_path,
                    'error': str(e)
                })

    # Tạo kết quả
    result = {
        'success': True,
        'keyword': keyword,
        'directory': directory,
        'total_matches': len(found_files),
        'found_files': found_files,
        'errors': errors if errors else None
    }
    
    return result

def analyze(folder_path, search_string):
    """
    Hàm phân tích chính - TRẢ VỀ KẾT QUẢ (dùng cho import)
    Alias cho search_keyword_in_files
    """
    return search_keyword_in_files(folder_path, search_string)

def main(folder_path=None, search_string=None):
    """
    Hàm main có thể nhận tham số folder_path và search_string
    - Nếu có tham số: tìm kiếm trực tiếp
    - Nếu không: hỏi người dùng nhập
    """
    is_command_line = len(sys.argv) > 2 or folder_path is None or search_string is None
    
    if folder_path is None and search_string is None:
        if len(sys.argv) > 2:
            folder_path = sys.argv[1]
            search_string = sys.argv[2]
        else:
            print("=" * 60)
            print("CHUONG TRINH TIM KIEM TU KHOA TRONG FILE")
            print("=" * 60)
            
            folder_path = input("\nNhap duong dan thu muc: ").strip()
            search_string = input("Nhap chuoi can tim: ").strip()
            
            if not folder_path or not search_string:
                print("Loi: Duong dan hoac tu khoa khong duoc de trong!")
                return {'success': False, 'error': 'Empty input'}
    
    # Tìm kiếm
    result = search_keyword_in_files(folder_path, search_string)
    
    if is_command_line:
        print(f"\nTim kiem tu khoa '{result['keyword']}' trong: {result['directory']}")
        print("-" * 60)
        
        if result['total_matches'] > 0:
            print(f"\nTim thay {result['total_matches']} file chua tu khoa '{result['keyword']}':\n")
            for i, file_info in enumerate(result['found_files'], 1):
                print(f"{i}. {file_info['relative_path']} ({file_info['match_count']} matches)")
                # Hiển thị 2 dòng match đầu tiên
                for match in file_info['matches'][:2]:
                    print(f"   Line {match['line_number']}: {match['content'][:100]}")
                if len(file_info['matches']) > 2:
                    print(f"   ... va {len(file_info['matches']) - 2} dong khac")
                print()
        else:
            print(f"\nKhong tim thay file nao chua tu khoa '{result['keyword']}'")
        
        # Lưu kết quả
        output_file = f"search_results_{Path(folder_path).name}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print(f"\nDa luu ket qua chi tiet vao file: {output_file}")
    
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