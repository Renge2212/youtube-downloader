from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import yt_dlp
import os
import tempfile
import threading

app = Flask(__name__)
CORS(app)

# ダウンロード中のタスクを管理
download_tasks = {}

class DownloadThread(threading.Thread):
    def __init__(self, url, format_type, task_id):
        threading.Thread.__init__(self)
        self.url = url
        self.format_type = format_type
        self.task_id = task_id
        self.file_path = None
        self.error = None

    def run(self):
        try:
            # 一時ディレクトリを作成
            temp_dir = tempfile.mkdtemp()
            
            # 出力ファイルパスを設定（拡張子なし）
            base_filename = os.path.join(temp_dir, 'download')
            self.file_path = base_filename

            ydl_opts = {
                'outtmpl': base_filename + '.%(ext)s',
                'quiet': True,
                'no_warnings': False,
                'ignoreerrors': True,
                'extract_flat': False,
            }

            # フォーマットに応じたオプションを設定
            if self.format_type == 'mp3':
                ydl_opts.update({
                    'format': 'bestaudio/best',
                    'postprocessors': [{
                        'key': 'FFmpegExtractAudio',
                        'preferredcodec': 'mp3',
                        'preferredquality': '192',
                    }],
                })
            elif self.format_type == 'm4a':
                ydl_opts.update({
                    'format': 'bestaudio[ext=m4a]/bestaudio',
                    'postprocessors': [{
                        'key': 'FFmpegExtractAudio',
                        'preferredcodec': 'm4a',
                    }],
                })
            else:  # mp4
                ydl_opts.update({
                    'format': 'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4] / bv*+ba/b',
                })

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([self.url])

            # 実際のファイルパスを探す（yt-dlpが拡張子を追加する）
            actual_files = [f for f in os.listdir(temp_dir) if f.startswith('download')]
            if actual_files:
                actual_file_path = os.path.join(temp_dir, actual_files[0])
                self.file_path = actual_file_path

            # ダウンロード完了をマーク
            download_tasks[self.task_id]['status'] = 'completed'
            download_tasks[self.task_id]['file_path'] = self.file_path

        except Exception as e:
            self.error = str(e)
            download_tasks[self.task_id]['status'] = 'error'
            download_tasks[self.task_id]['error'] = str(e)
            
            # エラー時に一時ファイルを削除
            if self.file_path and os.path.exists(self.file_path):
                os.unlink(self.file_path)

@app.route('/download', methods=['POST'])
def download_video():
    data = request.json
    url = data.get('url')
    format_type = data.get('format', 'mp4')

    if not url:
        return jsonify({'error': 'URL is required'}), 400

    if format_type not in ['mp4', 'mp3', 'm4a']:
        return jsonify({'error': 'Invalid format. Choose from mp4, mp3, m4a'}), 400

    # タスクIDを生成
    import uuid
    task_id = str(uuid.uuid4())

    # ダウンロードタスクを開始
    download_tasks[task_id] = {
        'status': 'processing',
        'format': format_type,
        'url': url
    }

    # 別スレッドでダウンロードを開始
    thread = DownloadThread(url, format_type, task_id)
    thread.start()

    return jsonify({'task_id': task_id, 'status': 'processing'})

@app.route('/status/<task_id>', methods=['GET'])
def check_status(task_id):
    if task_id not in download_tasks:
        return jsonify({'error': 'Task not found'}), 404

    task = download_tasks[task_id]
    return jsonify({
        'status': task['status'],
        'format': task['format'],
        'url': task['url'],
        'error': task.get('error')
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

if __name__ == '__main__':
    app.run(debug=True, port=5000)
