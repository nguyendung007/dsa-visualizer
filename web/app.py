from flask import Flask, render_template, request, jsonify
import os
import sys
import json
import tempfile
import shutil
import time
from pathlib import Path
from functools import lru_cache
import hashlib

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max

# Thêm tools folder vào path
sys.path.insert(0, os.path.dirname(__file__))

# Import trực tiếp các tool
try:
    from tools.check_import import main as check_import_main
except ImportError:
    check_import_main = None
    print("Warning: Cannot import check_import")

try:
    from tools.flow_jsx import main as flow_jsx_main
except ImportError:
    flow_jsx_main = None
    print("Warning: Cannot import flow_jsx")

try:
    from tools.folder_structure import main as folder_structure_main
except ImportError:
    folder_structure_main = None
    print("Warning: Cannot import folder_structure")

try:
    from tools.search_string import main as search_string_main
except ImportError:
    search_string_main = None
    print("Warning: Cannot import search_string")

try:
    from tools.state_jsx import main as state_jsx_main
except ImportError:
    state_jsx_main = None
    print("Warning: Cannot import state_jsx")

# Cache kết quả
analysis_cache = {}
cache_times = {}

def get_folder_signature(folder_path):
    """Tạo signature cho folder để cache (nhanh hơn hash)"""
    if not os.path.exists(folder_path):
        return None
    
    # Dùng size và modification time thay vì hash file
    total_size = 0
    file_count = 0
    latest_mtime = 0
    
    try:
        for root, dirs, files in os.walk(folder_path):
            # Bỏ qua node_modules và các thư mục không cần thiết
            dirs[:] = [d for d in dirs if d not in ['node_modules', '__pycache__', '.git', 'dist', 'build']]
            
            for file in files:
                if file.endswith(('.jsx', '.js', '.py', '.json')):
                    file_path = os.path.join(root, file)
                    try:
                        stat = os.stat(file_path)
                        total_size += stat.st_size
                        file_count += 1
                        latest_mtime = max(latest_mtime, stat.st_mtime)
                    except:
                        pass
    except Exception as e:
        print(f"Error getting folder signature: {e}")
        return None
    
    return f"{file_count}_{total_size}_{latest_mtime}"

def run_tool_direct(tool_name, folder_path, search_string=None):
    """Chạy tool trực tiếp (không qua subprocess) - NHANH NHẤT"""
    start_time = time.time()
    
    # Kiểm tra tool có available không
    tool_map = {
        'check_import': check_import_main,
        'flow_jsx': flow_jsx_main,
        'folder_structure': folder_structure_main,
        'search_string': search_string_main,
        'state_jsx': state_jsx_main
    }
    
    tool_func = tool_map.get(tool_name)
    if not tool_func:
        return {
            'error': f'Tool {tool_name} không khả dụng. Vui lòng kiểm tra import.',
            'execution_time': time.time() - start_time
        }
    
    try:
        # Capture output để tránh in ra console
        import io
        from contextlib import redirect_stdout, redirect_stderr
        
        f_stdout = io.StringIO()
        f_stderr = io.StringIO()
        
        # Gọi tool với tham số phù hợp
        with redirect_stdout(f_stdout), redirect_stderr(f_stderr):
            if tool_name == 'search_string' and search_string:
                result = tool_func(folder_path, search_string)
            else:
                result = tool_func(folder_path)
        
        elapsed = time.time() - start_time
        
        # Lấy output nếu có
        stdout_output = f_stdout.getvalue()
        stderr_output = f_stderr.getvalue()
        
        # Xử lý kết quả
        final_result = {}
        
        if isinstance(result, dict):
            final_result = result
        elif isinstance(result, (list, tuple)):
            final_result = {'data': result}
        elif result is not None:
            final_result = {'result': str(result)}
        
        # Thêm metadata
        final_result['execution_time'] = round(elapsed, 2)
        final_result['execution_time_ms'] = round(elapsed * 1000, 0)
        
        if stdout_output and 'stdout' not in final_result:
            final_result['console_output'] = stdout_output[:500]  # Giới hạn
        
        if stderr_output:
            final_result['warnings'] = stderr_output[:500]
        
        return final_result
        
    except TypeError as e:
        # Thử gọi với số lượng tham số khác
        try:
            elapsed = time.time() - start_time
            if 'missing' in str(e) or 'takes' in str(e):
                # Thử gọi không có tham số
                result = tool_func()
                return {
                    'result': result if isinstance(result, (dict, list)) else {'data': result},
                    'execution_time': round(elapsed, 2),
                    'note': 'Tool chạy với tham số mặc định'
                }
        except:
            pass
        
        return {
            'error': f'Lỗi tham số: {str(e)}',
            'execution_time': round(elapsed, 2)
        }
        
    except Exception as e:
        return {
            'error': str(e),
            'execution_time': round(time.time() - start_time, 2)
        }

@app.route('/')
def index():
    """Trang chủ"""
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    """Xử lý phân tích - Dùng import trực tiếp (NHANH)"""
    try:
        # Lấy thông tin từ form
        tool_name = request.form.get('tool')
        input_type = request.form.get('input_type')
        folder_path = request.form.get('folder_path', '').strip()
        search_string_value = request.form.get('search_string', '')
        
        # Xử lý upload file nếu có
        temp_dir = None
        if input_type == 'upload':
            if 'file' not in request.files:
                return render_template('result.html', error="Không có file được upload")
            
            file = request.files['file']
            if file.filename == '':
                return render_template('result.html', error="Chưa chọn file")
            
            # Tạo thư mục tạm
            temp_dir = tempfile.mkdtemp()
            filepath = os.path.join(temp_dir, file.filename)
            file.save(filepath)
            
            # Nếu là file zip thì giải nén
            if file.filename.endswith('.zip'):
                import zipfile
                with zipfile.ZipFile(filepath, 'r') as zip_ref:
                    zip_ref.extractall(temp_dir)
                folder_path = temp_dir
            else:
                folder_path = temp_dir
        
        # Kiểm tra đường dẫn
        if not folder_path or not os.path.exists(folder_path):
            return render_template('result.html', error="Đường dẫn không hợp lệ")
        
        # Kiểm tra tool có tồn tại không
        if tool_name not in ['check_import', 'flow_jsx', 'folder_structure', 'search_string', 'state_jsx']:
            return render_template('result.html', error=f"Tool {tool_name} không hợp lệ")
        
        # Tạo cache key
        folder_signature = get_folder_signature(folder_path)
        cache_key = f"{tool_name}_{folder_signature}_{search_string_value}"
        
        # Kiểm tra cache
        use_cache = request.form.get('use_cache', 'true') == 'true'
        result = None
        
        if use_cache and cache_key in analysis_cache:
            result = analysis_cache[cache_key]
            result['from_cache'] = True
            result['cached_at'] = cache_times.get(cache_key, 'Unknown')
        else:
            # Chạy tool trực tiếp
            result = run_tool_direct(tool_name, folder_path, search_string_value)
            
            # Lưu vào cache nếu không có lỗi
            if 'error' not in result:
                analysis_cache[cache_key] = result
                cache_times[cache_key] = time.strftime('%Y-%m-%d %H:%M:%S')
        
        # Dọn dẹp thư mục tạm
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
        
        # Thêm thông tin tool
        result['tool_name'] = tool_name
        result['folder_path'] = folder_path
        
        return render_template('result.html', 
                             result=result, 
                             tool_name=tool_name,
                             folder_path=folder_path)
    
    except Exception as e:
        import traceback
        return render_template('result.html', error=f"Lỗi: {str(e)}\n{traceback.format_exc()}")

@app.route('/clear_cache', methods=['POST'])
def clear_cache():
    """Xóa cache"""
    analysis_cache.clear()
    cache_times.clear()
    return jsonify({'status': 'success', 'message': 'Đã xóa cache'})

@app.route('/api/tools', methods=['GET'])
def list_tools():
    """API trả về danh sách các tool có sẵn"""
    tools_status = []
    
    # Kiểm tra tool nào có sẵn
    tool_available = {
        'check_import': check_import_main is not None,
        'flow_jsx': flow_jsx_main is not None,
        'folder_structure': folder_structure_main is not None,
        'search_string': search_string_main is not None,
        'state_jsx': state_jsx_main is not None
    }
    
    tools = [
        {'id': 'check_import', 'name': '🔍 Check Import', 'description': 'Phân tích imports trong file', 'available': tool_available['check_import']},
        {'id': 'flow_jsx', 'name': '🔄 Flow JSX', 'description': 'Phân tích luồng dữ liệu trong JSX', 'available': tool_available['flow_jsx']},
        {'id': 'folder_structure', 'name': '📁 Folder Structure', 'description': 'Hiển thị cấu trúc thư mục', 'available': tool_available['folder_structure']},
        {'id': 'search_string', 'name': '🔎 Search String', 'description': 'Tìm kiếm chuỗi trong code', 'available': tool_available['search_string']},
        {'id': 'state_jsx', 'name': '📊 State JSX', 'description': 'Phân tích state management', 'available': tool_available['state_jsx']}
    ]
    
    return jsonify(tools)

@app.route('/api/analyze', methods=['POST'])
def analyze_api():
    """API endpoint cho phân tích (trả về JSON)"""
    data = request.get_json()
    folder_path = data.get('path', '')
    tool_name = data.get('tool', 'state_jsx')
    search_string = data.get('search_string', '')
    
    if not folder_path or not os.path.exists(folder_path):
        return jsonify({'error': 'Đường dẫn không hợp lệ'}), 400
    
    result = run_tool_direct(tool_name, folder_path, search_string)
    return jsonify(result)

@app.route('/cache_stats')
def cache_stats():
    """Xem thống kê cache"""
    return jsonify({
        'cache_size': len(analysis_cache),
        'cache_keys': list(analysis_cache.keys()),
        'cache_times': cache_times
    })

if __name__ == '__main__':
    # Kiểm tra các tool đã import thành công chưa
    print("="*60)
    print("🚀 Code Analyzer Web App đang khởi động...")
    print("="*60)
    
    # Kiểm tra tool availability
    tools_status = {
        'check_import': check_import_main is not None,
        'flow_jsx': flow_jsx_main is not None,
        'folder_structure': folder_structure_main is not None,
        'search_string': search_string_main is not None,
        'state_jsx': state_jsx_main is not None
    }
    
    print("\n📦 Tool status:")
    for tool_name, available in tools_status.items():
        status = "✅" if available else "❌"
        print(f"   {status} {tool_name}")
    
    if not any(tools_status.values()):
        print("\n⚠️ WARNING: Không có tool nào được import thành công!")
        print("   Vui lòng kiểm tra các file trong thư mục tools/")
    
    print("\n" + "="*60)
    print("📱 Truy cập: http://localhost:5000")
    print("💡 Tip: Sử dụng cache để tăng tốc phân tích lần sau")
    print("="*60)
    
    app.run(debug=True, host='0.0.0.0', port=5000, threaded=True)