from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import yt_dlp
import os
import tempfile
import threading
import sys
import webbrowser
from static_server import start_static_server

app = Flask(__name__)
CORS(app)

# ダウンロード中のタスクを管理
download_tasks = {}

# ログを保存するためのリスト
log_messages = []
max_log_messages = 100  # 保持する最大ログ数

def add_log(message):
    """ログを追加"""
    import time
    timestamp = time.strftime("%H:%M:%S")
    log_message = f"[{timestamp}] {message}"
    log_messages.append(log_message)
    # 最大数を超えた古いログを削除
    if len(log_messages) > max_log_messages:
        log_messages.pop(0)
    print(log_message)  # コンソールにも出力

class DownloadThread(threading.Thread):
    def __init__(self, url, format_type, task_id, quality=None):
        threading.Thread.__init__(self)
        self.url = url
        self.format_type = format_type
        self.task_id = task_id
        self.quality = quality
        self.file_path = None
        self.error = None

    def run(self):
        try:
            add_log(f"ダウンロード開始: {self.url} ({self.format_type})")
            
            # 一時ディレクトリを作成
            temp_dir = tempfile.mkdtemp()
            add_log(f"一時ディレクトリ作成: {temp_dir}")
            
            # 出力ファイルパスを設定（拡張子なし）
            base_filename = os.path.join(temp_dir, 'download')
            self.file_path = base_filename

            ydl_opts = {
                'outtmpl': base_filename + '.%(ext)s',
                'quiet': True,
                'no_warnings': False,
                'ignoreerrors': True,
                'extract_flat': False,
                'progress_hooks': [self.progress_hook],
            }

            # FFmpegパスを設定（組み込みffmpegを使用）
            ffmpeg_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ffmpeg', 'ffmpeg.exe')
            if os.path.exists(ffmpeg_path):
                ydl_opts['ffmpeg_location'] = ffmpeg_path
                add_log(f"FFmpegを使用: {ffmpeg_path}")
            else:
                add_log("警告: FFmpegが見つかりません。最高画質での結合ができません")

            # フォーマットに応じたオプションを設定
            if self.format_type == 'mp3':
                ydl_opts.update({
                    'format': 'bestaudio[ext=mp3]/bestaudio',
                })
                add_log("MP3形式でダウンロード")
            elif self.format_type == 'm4a':
                ydl_opts.update({
                    'format': 'bestaudio[ext=m4a]/bestaudio',
                })
                add_log("M4A形式でダウンロード")
            elif self.format_type == 'wav':
                ydl_opts.update({
                    'format': 'bestaudio[ext=wav]/bestaudio',
                })
                add_log("WAV形式でダウンロード")
            elif self.format_type == 'ogg':
                ydl_opts.update({
                    'format': 'bestaudio[ext=ogg]/bestaudio',
                })
                add_log("OGG形式でダウンロード")
            elif self.format_type == 'flac':
                ydl_opts.update({
                    'format': 'bestaudio[ext=flac]/bestaudio',
                })
                add_log("FLAC形式でダウンロード")
            elif self.format_type == 'opus':
                ydl_opts.update({
                    'format': 'bestaudio[ext=opus]/bestaudio',
                })
                add_log("Opus形式でダウンロード")
            else:  # mp4
                # 画質に応じたフォーマット設定
                if self.quality == 'highest':
                    ydl_opts.update({
                        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
                    })
                    add_log("MP4形式で最高画質でダウンロード")
                elif self.quality == 'high':
                    ydl_opts.update({
                        'format': '137+140/22/18',  # 1080p + AAC / 720p / 360p
                    })
                    add_log("MP4形式で高画質でダウンロード")
                elif self.quality == 'medium':
                    ydl_opts.update({
                        'format': '22/18',  # 720p / 360p
                    })
                    add_log("MP4形式で中画質でダウンロード")
                elif self.quality == 'low':
                    ydl_opts.update({
                        'format': '18',  # 360p
                    })
                    add_log("MP4形式で低画質でダウンロード")
                else:
                    # デフォルト（従来の動作）
                    ydl_opts.update({
                        'format': 'best[ext=mp4]/best',
                    })
                    add_log("MP4形式でダウンロード（自動選択）")

            add_log("yt-dlpでダウンロード開始")
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                # ダウンロード実行
                result = ydl.download([self.url])
                add_log(f"yt-dlpダウンロード結果: {result}")

            # 実際のファイルパスを探す（yt-dlpが拡張子を追加する）
            actual_files = [f for f in os.listdir(temp_dir) if f.startswith('download')]
            
            if actual_files:
                actual_file_path = os.path.join(temp_dir, actual_files[0])
                # ファイルが実際に存在し、サイズが0バイト以上か確認
                if os.path.exists(actual_file_path) and os.path.getsize(actual_file_path) > 0:
                    self.file_path = actual_file_path
                    add_log(f"ダウンロード成功: {actual_file_path} ({os.path.getsize(actual_file_path)} bytes)")
                    
                    # ダウンロード完了をマーク
                    download_tasks[self.task_id]['status'] = 'completed'
                    download_tasks[self.task_id]['file_path'] = self.file_path
                    add_log("ダウンロードタスク完了")
                else:
                    # ファイルが存在しないか空ファイルの場合
                    add_log("ダウンロード失敗: ファイルが存在しないか空です")
                    self.error = "ダウンロードに失敗しました（空ファイル）"
                    download_tasks[self.task_id]['status'] = 'error'
                    download_tasks[self.task_id]['error'] = self.error
            else:
                # ファイルが見つからない場合
                add_log("ダウンロード失敗: 出力ファイルが見つかりません")
                self.error = "ダウンロードに失敗しました（ファイル未生成）"
                download_tasks[self.task_id]['status'] = 'error'
                download_tasks[self.task_id]['error'] = self.error

        except Exception as e:
            self.error = str(e)
            download_tasks[self.task_id]['status'] = 'error'
            download_tasks[self.task_id]['error'] = str(e)
            add_log(f"ダウンロードエラー: {e}")
            
            # エラー時に一時ファイルを削除
            if self.file_path and os.path.exists(self.file_path):
                os.unlink(self.file_path)
    
    def progress_hook(self, d):
        """ダウンロード進捗をログに記録"""
        if d['status'] == 'downloading':
            # 進捗情報を取得（複数の方法を試す）
            percent = d.get('_percent_str', '')
            speed = d.get('_speed_str', 'N/A')
            
            # ANSIエスケープシーケンスを除去（速度表示のクリーンアップ）
            import re
            if speed and speed != 'N/A':
                # ANSIエスケープシーケンスを除去
                ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
                clean_speed = ansi_escape.sub('', speed).strip()
            else:
                clean_speed = speed
            
            # 進捗率をより確実に取得する方法
            progress_value = None
            
            # 方法1: _percent_strから直接数値を抽出
            if percent and '%' in percent:
                try:
                    # 余分なスペースと%を削除
                    cleaned = percent.strip().replace('%', '').strip()
                    if cleaned:
                        progress_value = float(cleaned)
                except (ValueError, TypeError):
                    progress_value = None
            
            # 方法2: ダウンロード済みサイズと総サイズから計算
            if progress_value is None:
                downloaded = d.get('downloaded_bytes', 0)
                total = d.get('total_bytes') or d.get('total_bytes_estimate', 0)
                if total > 0:
                    progress_value = (downloaded / total) * 100
            
            # 方法3: 進捗情報が利用できない場合はデフォルト値
            if progress_value is None:
                progress_value = 0
            
            # 進捗情報を保存
            download_tasks[self.task_id]['progress'] = progress_value
            download_tasks[self.task_id]['speed'] = clean_speed
            
            add_log(f"ダウンロード中: {progress_value:.1f}%完了, 速度: {clean_speed}")
                
        elif d['status'] == 'finished':
            add_log("ダウンロード完了、後処理中")
            # 完了時に進捗を100%に設定
            download_tasks[self.task_id]['progress'] = 100.0
            download_tasks[self.task_id]['speed'] = '完了'

@app.route('/download', methods=['POST'])
def download_video():
    try:
        add_log("ダウンロードリクエストを受信")
        
        if not request.is_json:
            add_log("リクエストがJSON形式ではありません")
            return jsonify({'error': 'Content-Type must be application/json'}), 400
        
        data = request.get_json()
        if not data:
            add_log("JSONデータの解析に失敗")
            return jsonify({'error': 'Invalid JSON data'}), 400
        
        add_log(f"受信データ: {data}")
        
        url = data.get('url')
        format_type = data.get('format', 'mp4')
        quality = data.get('quality')

        if not url:
            add_log("URLが指定されていません")
            return jsonify({'error': 'URL is required'}), 400

        if format_type not in ['mp4', 'mp3', 'm4a', 'wav', 'ogg', 'flac', 'opus']:
            add_log(f"無効なフォーマット: {format_type}")
            return jsonify({'error': 'Invalid format. Choose from mp4, mp3, m4a, wav, ogg, flac, opus'}), 400

        # タスクIDを生成
        import uuid
        task_id = str(uuid.uuid4())
        add_log(f"タスクID生成: {task_id}")

        # ダウンロードタスクを開始
        download_tasks[task_id] = {
            'status': 'processing',
            'format': format_type,
            'url': url
        }

        # 別スレッドでダウンロードを開始
        thread = DownloadThread(url, format_type, task_id, quality)
        thread.start()

        add_log(f"ダウンロードタスク開始: {task_id}")
        return jsonify({'task_id': task_id, 'status': 'processing'})
        
    except Exception as e:
        add_log(f"ダウンロードリクエスト処理エラー: {e}")
        return jsonify({'error': f'Internal server error: {e}'}), 500

@app.route('/status/<task_id>', methods=['GET'])
def check_status(task_id):
    if task_id not in download_tasks:
        return jsonify({'error': 'Task not found'}), 404

    task = download_tasks[task_id]
    return jsonify({
        'status': task['status'],
        'format': task['format'],
        'url': task['url'],
        'error': task.get('error'),
        'progress': task.get('progress'),
        'speed': task.get('speed')
    })

@app.route('/download/<task_id>', methods=['GET'])
def get_download(task_id):
    if task_id not in download_tasks:
        return jsonify({'error': 'Task not found'}), 404

    task = download_tasks[task_id]
    if task['status'] != 'completed':
        return jsonify({'error': 'Download not completed yet'}), 400

    file_path = task['file_path']
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404

    # ファイル名を取得
    filename = f"download.{task['format']}"

    return send_file(file_path, as_attachment=True, download_name=filename)

@app.route('/')
def index():
    """ルートパスへのアクセス確認用"""
    return jsonify({'message': 'YouTube Downloader API is running', 'status': 'ok'})

@app.route('/logs', methods=['GET'])
def get_logs():
    """ログを取得"""
    return jsonify({'logs': log_messages})

@app.route('/update-yt-dlp', methods=['POST'])
def update_yt_dlp():
    """yt-dlpをアップデート（開発モードのみ）"""
    try:
        add_log("yt-dlpアップデートリクエストを受信")
        
        # 仮想環境のpipを使用してyt-dlpをアップデート
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        venv_pip = os.path.join(backend_dir, 'venv', 'Scripts', 'pip.exe')
        
        if not os.path.exists(venv_pip):
            add_log("エラー: 仮想環境のpipが見つかりません")
            return jsonify({'error': '仮想環境が見つかりません。開発モードで実行してください'}), 400
        
        add_log("yt-dlpのアップデートを開始します...")
        
        # アップデート実行
        import subprocess
        result = subprocess.run(
            [venv_pip, 'install', '-U', 'yt-dlp'],
            capture_output=True,
            text=True,
            cwd=backend_dir
        )
        
        if result.returncode == 0:
            add_log("yt-dlpのアップデートが成功しました")
            # 新しいバージョン情報を取得
            version_result = subprocess.run(
                [venv_pip, 'show', 'yt-dlp'],
                capture_output=True,
                text=True,
                cwd=backend_dir
            )
            
            version_info = {}
            for line in version_result.stdout.split('\n'):
                if 'Version:' in line:
                    version_info['version'] = line.split('Version:')[1].strip()
                if 'Location:' in line:
                    version_info['location'] = line.split('Location:')[1].strip()
            
            return jsonify({
                'success': True,
                'message': 'yt-dlpが正常にアップデートされました',
                'version': version_info.get('version', '不明'),
                'location': version_info.get('location', '不明')
            })
        else:
            add_log(f"yt-dlpアップデートエラー: {result.stderr}")
            return jsonify({
                'success': False,
                'error': f'アップデートに失敗しました: {result.stderr}'
            }), 500
            
    except Exception as e:
        add_log(f"yt-dlpアップデート処理エラー: {e}")
        return jsonify({'error': f'内部サーバーエラー: {e}'}), 500

if __name__ == '__main__':
    # 製品版モードかどうかをチェック
    is_production = getattr(sys, 'frozen', False)
    
    if is_production:
        # 製品版: 静的ファイルサーバーを起動
        # PyInstallerでビルドされた場合、実行ファイルと同じディレクトリにfrontend/distが配置される
        base_dir = os.path.dirname(os.path.abspath(__file__))
        frontend_dist = os.path.join(base_dir, 'frontend', 'dist')
        if os.path.exists(frontend_dist):
            start_static_server(frontend_dist, port=5173)
        else:
            print("警告: フロントエンドのビルドファイルが見つかりません")
            print(f"探しているパス: {frontend_dist}")
    
    # メインのFlaskアプリを起動
    # 製品版ではデバッグモードを無効化、開発時は環境変数で制御可能
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(
        host='127.0.0.1',  # ローカルホストのみでリッスン
        port=5000, 
        debug=debug_mode,
        threaded=True,
        use_reloader=debug_mode  # デバッグ時のみリローダーを有効
    )
