import os
import uuid
from flask import Blueprint, request, jsonify, send_file
from core.config import add_log, get_logs
from core.downloader import validate_youtube_url, DownloadThread, download_tasks

api_bp = Blueprint('api', __name__)
temp_directories = set()

@api_bp.route('/download', methods=['POST'])
def download_video():
    try:
        add_log("Received download request")
        
        if not request.is_json:
            add_log("Request is not in JSON format")
            return jsonify({'error': 'Content-Type must be application/json'}), 400
        
        data = request.get_json()
        if not data:
            add_log("Failed to parse JSON data")
            return jsonify({'error': 'Invalid JSON data'}), 400
        
        add_log(f"Received data: {data}")
        
        url = data.get('url')
        format_type = data.get('format', 'mp4')
        quality = data.get('quality')

        if not url:
            add_log("URL is not specified")
            return jsonify({'error': 'URL is required'}), 400

        if format_type not in ['mp4', 'mp3', 'm4a', 'wav', 'ogg', 'flac', 'opus']:
            add_log(f"Invalid format: {format_type}")
            return jsonify({'error': 'Invalid format. Choose from mp4, mp3, m4a, wav, ogg, flac, opus'}), 400

        if not validate_youtube_url(url):
            add_log(f"Invalid YouTube URL: {url}")
            return jsonify({'error': 'Invalid YouTube URL'}), 400

        task_id = str(uuid.uuid4())
        add_log(f"Generated Task ID: {task_id}")

        download_tasks[task_id] = {
            'status': 'processing',
            'format': format_type,
            'url': url
        }

        thread = DownloadThread(url, format_type, task_id, quality, temp_directories)
        thread.start()

        add_log(f"Download task started: {task_id}")
        return jsonify({'task_id': task_id, 'status': 'processing'})
        
    except Exception as e:
        add_log(f"Download request processing error: {e}")
        return jsonify({'error': f'Internal server error: {e}'}), 500

@api_bp.route('/status/<task_id>', methods=['GET'])
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

@api_bp.route('/download/<task_id>', methods=['GET'])
def get_download(task_id):
    if task_id not in download_tasks:
        return jsonify({'error': 'Task not found'}), 404

    task = download_tasks[task_id]
    if task['status'] != 'completed':
        return jsonify({'error': 'Download not completed yet'}), 400

    file_path = task['file_path']
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404

    filename = f"download.{task['format']}"
    return send_file(file_path, as_attachment=True, download_name=filename)

@api_bp.route('/logs', methods=['GET'])
def fetch_logs():
    return jsonify({'logs': get_logs()})

@api_bp.route('/update-yt-dlp', methods=['POST'])
def update_yt_dlp():
    """
    Deprecated: Packages are now managed by GitHub Dependabot.
    Returns a success response for frontend compatibility.
    """
    add_log("yt-dlp update requested from frontend. In the new architecture, dependency management is automated via GitHub bots. The built executable ships with a bundled version that requires a re-release to update.")
    return jsonify({
        'success': True,
        'message': "アプリの依存関係はGitHubによって自動管理されています。新しいビルドには常に最新版が含まれます。",
        'version': 'Managed by GitHub',
        'location': 'Bundled'
    })
