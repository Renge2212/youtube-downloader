import webview
import threading
import time
import sys
import os
from app import app as flask_app

def run_flask():
    """Flaskアプリを実行する関数"""
    # 製品版モードかどうかをチェック
    is_production = getattr(sys, 'frozen', False)
    
    if is_production:
        # 製品版: 静的ファイルサーバーを起動
        # PyInstallerでビルドされた場合、実行ファイルと同じディレクトリにfrontend/distが配置される
        base_dir = os.path.dirname(os.path.abspath(__file__))
        frontend_dist = os.path.join(base_dir, 'frontend', 'dist')
        if os.path.exists(frontend_dist):
            from static_server import start_static_server
            start_static_server(frontend_dist, port=5173)
        else:
            print("警告: フロントエンドのビルドファイルが見つかりません")
            print(f"探しているパス: {frontend_dist}")
    
    # Flaskアプリを起動（デバッグモードはオフ）
    flask_app.run(
        host='127.0.0.1', 
        port=5000, 
        debug=False,
        threaded=True,
        use_reloader=False
    )

if __name__ == '__main__':
    # Flaskを別スレッドで起動
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()
    
    # Flaskが起動するまで少し待つ
    time.sleep(2)
    
    # WebView2ウィンドウを作成
    window = webview.create_window(
        'YouTube Downloader',
        'http://127.0.0.1:5173',  # フロントエンドの静的サーバー
        width=600,
        height=900,
        resizable=True,
        text_select=True,
        min_size=(900, 600)
    )
    
    # WebView2を起動
    webview.start(
        gui='edgechromium',  # WebView2を使用
        debug=False
    )
