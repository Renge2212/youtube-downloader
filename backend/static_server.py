import os
import threading
from flask import Flask, send_from_directory

def create_static_server(static_dir, port=5173):
    """静的ファイルを提供するサーバーを作成"""
    app = Flask(__name__)
    
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_static(path):
        if path == '' or not os.path.exists(os.path.join(static_dir, path)):
            path = 'index.html'
        return send_from_directory(static_dir, path)
    
    def run_server():
        app.run(host='127.0.0.1', port=port, debug=False, threaded=True)
    
    return run_server

def start_static_server(static_dir, port=5173):
    """静的ファイルサーバーをバックグラウンドで起動"""
    server_thread = threading.Thread(target=create_static_server(static_dir, port))
    server_thread.daemon = True
    server_thread.start()
    return server_thread
