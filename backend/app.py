import os
import sys
import atexit
import shutil
from flask import Flask, jsonify
from flask_cors import CORS
from static_server import start_static_server
from core.config import add_log
from api.routes import api_bp, temp_directories

app = Flask(__name__)

# Config CORS with environment
cors_origins = os.environ.get('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173')
CORS(app, origins=cors_origins.split(','))

# Register modular routes
app.register_blueprint(api_bp)

def cleanup_temp_files():
    """Cleanup temporary downloaded files upon exit."""
    for temp_dir in list(temp_directories):
        try:
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
                add_log(f"Deleted temp directory: {temp_dir}")
                temp_directories.remove(temp_dir)
        except Exception as e:
            add_log(f"Failed to delete temp dir: {e}")

atexit.register(cleanup_temp_files)

@app.route('/')
def index():
    """Root path ping / health check for internal readiness."""
    return jsonify({'message': 'YouTube Downloader API is running', 'status': 'ok'})

if __name__ == '__main__':
    is_production = getattr(sys, 'frozen', False)
    
    if is_production:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        frontend_dist = os.path.join(base_dir, 'frontend', 'dist')
        if os.path.exists(frontend_dist):
            start_static_server(frontend_dist, port=5173)
        else:
            print("Warning: Frontend build dist not found")
            print(f"Looked in: {frontend_dist}")
    
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(
        host='127.0.0.1', 
        port=5000, 
        debug=debug_mode,
        threaded=True,
        use_reloader=debug_mode
    )
