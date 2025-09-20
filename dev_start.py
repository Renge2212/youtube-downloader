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

# 仮想環境のPythonパスを追加（WebView用）
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
venv_dir = os.path.join(backend_dir, 'venv')
venv_site_packages = os.path.join(venv_dir, 'Lib', 'site-packages')

if os.path.exists(venv_site_packages):
    sys.path.insert(0, venv_site_packages)

# Pythonのパスを追加してモジュールをインポート可能に
sys.path.insert(0, backend_dir)

def run_frontend_dev():
    """フロントエンド開発サーバーを起動"""
    print("🚀 フロントエンド開発サーバーを起動中...")
    frontend_dir = os.path.join(os.path.dirname(__file__), 'frontend')
    try:
        # 開発サーバーを起動（バックグラウンドで実行）
        process = subprocess.Popen(['npm.cmd', 'run', 'dev'], 
                                 cwd=frontend_dir, 
                                 stdout=subprocess.PIPE,
                                 stderr=subprocess.PIPE,
                                 text=True,
                                 shell=True)
        
        # ポート番号を検出するための待機
        time.sleep(5)
        return process
        
    except FileNotFoundError:
        print("❌ npmが見つかりません。Node.jsがインストールされているか確認してください")
        return None
    except Exception as e:
        print(f"❌ フロントエンドサーバー起動エラー: {e}")
        return None

def run_flask_dev():
    """Flask開発サーバーを起動（仮想環境内のPythonを使用）"""
    print("🔧 Flask開発サーバーを起動中...")
    backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
    venv_python = os.path.join(backend_dir, 'venv', 'Scripts', 'python.exe')
    
    try:
        # 仮想環境内のPythonを使用してFlaskサーバーを起動
        subprocess.run([venv_python, 'app.py'], 
                      cwd=backend_dir, check=True, shell=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Flaskサーバー起動エラー: {e}")
    except FileNotFoundError:
        print("❌ 仮想環境のPythonが見つかりません。セットアップを確認してください")

def run_static_server():
    """静的ファイルサーバーを起動（本番モード用）"""
    print("📁 静的ファイルサーバーを起動中...")
    frontend_dist = os.path.join(os.path.dirname(__file__), 'frontend', 'dist')
    backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
    venv_python = os.path.join(backend_dir, 'venv', 'Scripts', 'python.exe')
    
    if os.path.exists(frontend_dist):
        try:
            # 仮想環境内のPythonを使用して静的サーバーを起動
            subprocess.run([venv_python, '-c', 
                          f'from static_server import start_static_server; start_static_server(r"{frontend_dist}", port=5173)'],
                         cwd=backend_dir, check=True, shell=True)
        except subprocess.CalledProcessError as e:
            print(f"❌ 静的サーバー起動エラー: {e}")
        except FileNotFoundError:
            print("❌ 仮想環境のPythonが見つかりません。セットアップを確認してください")
    else:
        print("⚠️  フロントエンドのビルドファイルが見つかりません。先に npm run build を実行してください")

def run_webview(port=5173):
    """WebView2アプリを起動"""
    print("🌐 WebView2アプリを起動中...")
    try:
        import webview
        
        # 動的にポートを指定してフロントエンド開発サーバーを使用
        window = webview.create_window(
            'YouTube Downloader (開発モード)',
            f'http://localhost:{port}',  # Vite開発サーバー
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
        
        # WebView終了後にクリーンな状態で終了
        print("\n✅ WebViewアプリケーションが終了しました")
        
    except ImportError:
        print("❌ webviewモジュールが見つかりません。pip install pywebview を実行してください")
    except Exception as e:
        print(f"❌ WebView2起動エラー: {e}")
    finally:
        # ターミナル状態をリセットするためにプロセスを終了
        import sys
        sys.exit(0)

def setup_virtualenv():
    """仮想環境のセットアップを確認"""
    backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
    venv_dir = os.path.join(backend_dir, 'venv')
    
    # 仮想環境が存在するか確認
    if not os.path.exists(venv_dir):
        print("⚠️  仮想環境が見つかりません。セットアップを実行します...")
        try:
            subprocess.run([sys.executable, '-m', 'venv', 'venv'], 
                         cwd=backend_dir, check=True, shell=True)
            print("✅ 仮想環境を作成しました")
        except subprocess.CalledProcessError as e:
            print(f"❌ 仮想環境作成エラー: {e}")
            return False
    
    # 必要なパッケージをインストール
    try:
        pip_cmd = os.path.join(venv_dir, 'Scripts', 'pip.exe')
        subprocess.run([pip_cmd, 'install', '-r', 'requirements.txt'], 
                      cwd=backend_dir, check=True, shell=True)
        print("✅ 必要なパッケージをインストールしました")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ パッケージインストールエラー: {e}")
        return False

if __name__ == '__main__':
    print("🎯 YouTube Downloader 開発モード起動")
    print("=" * 50)
    
    # 仮想環境のセットアップを確認
    if not setup_virtualenv():
        print("❌ 仮想環境のセットアップに失敗しました")
        sys.exit(1)
    
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
