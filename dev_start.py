#!/usr/bin/env python3
"""
開発用起動スクリプト
実行ファイルを作成せずに手元でアプリを起動します
"""

import subprocess
import sys
import os
import time
import threading

# Pythonのパスを追加してモジュールをインポート可能に
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app import app as flask_app
from static_server import start_static_server

def run_frontend_dev():
    """フロントエンド開発サーバーを起動"""
    print("🚀 フロントエンド開発サーバーを起動中...")
    frontend_dir = os.path.join(os.path.dirname(__file__), 'frontend')
    try:
        subprocess.run(['npm.cmd', 'run', 'dev'], 
                      cwd=frontend_dir, check=True, shell=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ フロントエンドサーバー起動エラー: {e}")
    except FileNotFoundError:
        print("❌ npmが見つかりません。Node.jsがインストールされているか確認してください")

def run_flask_dev():
    """Flask開発サーバーを起動"""
    print("🔧 Flask開発サーバーを起動中...")
    try:
        flask_app.run(
            host='127.0.0.1',
            port=5000,
            debug=True,
            use_reloader=False
        )
    except Exception as e:
        print(f"❌ Flaskサーバー起動エラー: {e}")

def run_static_server():
    """静的ファイルサーバーを起動（本番モード用）"""
    print("📁 静的ファイルサーバーを起動中...")
    frontend_dist = os.path.join(os.path.dirname(__file__), 'frontend', 'dist')
    if os.path.exists(frontend_dist):
        start_static_server(frontend_dist, port=5173)
    else:
        print("⚠️  フロントエンドのビルドファイルが見つかりません。先に npm run build を実行してください")

def run_webview():
    """WebView2アプリを起動"""
    print("🌐 WebView2アプリを起動中...")
    try:
        import webview
        # 開発モードではフロントエンド開発サーバーを使用
        window = webview.create_window(
            'YouTube Downloader (開発モード)',
            'http://localhost:5173',  # Vite開発サーバー
            width=1000,
            height=700,
            resizable=True,
            text_select=True,
            min_size=(800, 600)
        )
        webview.start(
            gui='edgechromium',
            debug=True  # 開発者ツールを有効化
        )
    except ImportError:
        print("❌ webviewモジュールが見つかりません。pip install pywebview を実行してください")
    except Exception as e:
        print(f"❌ WebView2起動エラー: {e}")

if __name__ == '__main__':
    print("🎯 YouTube Downloader 開発モード起動")
    print("=" * 50)
    
    # 起動モード選択
    mode = input("起動モードを選択してください:\n1. フロントエンド開発 + Flask + WebView2\n2. 静的ファイル + Flask + WebView2\n選択 (1/2): ").strip()
    
    if mode == "1":
        # モード1: フロントエンド開発サーバー使用
        print("\n📍 開発モード: フロントエンドホットリロード有効")
        
        # フロントエンド開発サーバーを別スレッドで起動
        frontend_thread = threading.Thread(target=run_frontend_dev, daemon=True)
        frontend_thread.start()
        
        # Flaskサーバーを別スレッドで起動
        flask_thread = threading.Thread(target=run_flask_dev, daemon=True)
        flask_thread.start()
        
        # サーバー起動待機
        time.sleep(3)
        
        # WebView2を起動
        run_webview()
        
    elif mode == "2":
        # モード2: 静的ファイル使用
        print("\n📍 本番モード: ビルド済み静的ファイル使用")
        
        # 静的ファイルサーバーを別スレッドで起動
        static_thread = threading.Thread(target=run_static_server, daemon=True)
        static_thread.start()
        
        # Flaskサーバーを別スレッドで起動
        flask_thread = threading.Thread(target=run_flask_dev, daemon=True)
        flask_thread.start()
        
        # サーバー起動待機
        time.sleep(2)
        
        # WebView2を起動
        run_webview()
        
    else:
        print("❌ 無効な選択です。1 または 2 を入力してください")
