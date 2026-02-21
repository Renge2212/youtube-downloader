import os
import threading
import tempfile
import yt_dlp
from urllib.parse import urlparse
import re

from core.config import CONFIG, add_log

# Share task state across the application
download_tasks = {}

def validate_youtube_url(url):
    """Validate if the given URL is a supported YouTube URL."""
    if not url or len(url) > CONFIG['MAX_URL_LENGTH']:
        return False
    
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        
        if not any(allowed in domain for allowed in CONFIG['ALLOWED_DOMAINS']):
            return False
            
        youtube_patterns = [
            r'^https?://(www\.)?youtube\.com/watch\?v=',
            r'^https?://youtu\.be/',
            r'^https?://(www\.)?youtube\.com/embed/',
            r'^https?://(www\.)?youtube\.com/shorts/'
        ]
        
        return any(re.match(pattern, url) for pattern in youtube_patterns)
    except Exception:
        return False

class DownloadThread(threading.Thread):
    def __init__(self, url, format_type, task_id, quality=None, temp_directories=None):
        threading.Thread.__init__(self)
        self.url = url
        self.format_type = format_type
        self.task_id = task_id
        self.quality = quality
        self.file_path = None
        self.error = None
        self.temp_directories = temp_directories if temp_directories is not None else set()

    def run(self):
        try:
            add_log(f"Starting download: {self.url} ({self.format_type})")
            
            # Create a temporary directory
            temp_dir = tempfile.mkdtemp()
            self.temp_directories.add(temp_dir)
            add_log(f"Temporary directory created: {temp_dir}")
            
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

            # Setup FFmpeg path (using embedded ffmpeg)
            # Find root backend dir based on this file's path (core/downloader.py -> backend)
            backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            ffmpeg_path = os.path.join(backend_dir, 'ffmpeg', 'ffmpeg.exe')
            
            if os.path.exists(ffmpeg_path):
                ydl_opts['ffmpeg_location'] = ffmpeg_path
                add_log(f"Using FFmpeg at: {ffmpeg_path}")
            else:
                add_log("Warning: FFmpeg not found. The highest quality streams may not merge properly.")

            # Set format options
            if self.format_type == 'mp3':
                ydl_opts.update({'format': 'bestaudio[ext=mp3]/bestaudio'})
                add_log("Downloading as MP3")
            elif self.format_type == 'm4a':
                ydl_opts.update({'format': 'bestaudio[ext=m4a]/bestaudio'})
                add_log("Downloading as M4A")
            elif self.format_type == 'wav':
                ydl_opts.update({'format': 'bestaudio[ext=wav]/bestaudio'})
                add_log("Downloading as WAV")
            elif self.format_type == 'ogg':
                ydl_opts.update({'format': 'bestaudio[ext=ogg]/bestaudio'})
                add_log("Downloading as OGG")
            elif self.format_type == 'flac':
                ydl_opts.update({'format': 'bestaudio[ext=flac]/bestaudio'})
                add_log("Downloading as FLAC")
            elif self.format_type == 'opus':
                ydl_opts.update({'format': 'bestaudio[ext=opus]/bestaudio'})
                add_log("Downloading as Opus")
            else:  # mp4
                if self.quality == 'highest':
                    ydl_opts.update({'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'})
                    add_log("Downloading MP4 in highest quality")
                elif self.quality == 'high':
                    ydl_opts.update({'format': '137+140/22/18'})  # 1080p + AAC / 720p / 360p
                    add_log("Downloading MP4 in high quality")
                elif self.quality == 'medium':
                    ydl_opts.update({'format': '22/18'})  # 720p / 360p
                    add_log("Downloading MP4 in medium quality")
                elif self.quality == 'low':
                    ydl_opts.update({'format': '18'})  # 360p
                    add_log("Downloading MP4 in low quality")
                else:
                    ydl_opts.update({'format': 'best[ext=mp4]/best'})
                    add_log("Downloading MP4 (Auto)")

            add_log("Starting yt-dlp...")
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                result = ydl.download([self.url])
                add_log(f"yt-dlp result code: {result}")

            # Locate the actual downloaded file
            actual_files = [f for f in os.listdir(temp_dir) if f.startswith('download')]
            
            if actual_files:
                actual_file_path = os.path.join(temp_dir, actual_files[0])
                if os.path.exists(actual_file_path) and os.path.getsize(actual_file_path) > 0:
                    self.file_path = actual_file_path
                    size_bytes = os.path.getsize(actual_file_path)
                    add_log(f"Download successful: {actual_file_path} ({size_bytes} bytes)")
                    
                    if self.task_id in download_tasks:
                        download_tasks[self.task_id]['status'] = 'completed'
                        download_tasks[self.task_id]['file_path'] = self.file_path
                else:
                    add_log("Download failed: File is missing or empty")
                    self.error = "File is missing or empty"
                    if self.task_id in download_tasks:
                        download_tasks[self.task_id].update({'status': 'error', 'error': self.error})
            else:
                add_log("Download failed: No output file found")
                self.error = "No output file found"
                if self.task_id in download_tasks:
                    download_tasks[self.task_id].update({'status': 'error', 'error': self.error})

        except Exception as e:
            self.error = str(e)
            if self.task_id in download_tasks:
                download_tasks[self.task_id].update({'status': 'error', 'error': self.error})
            add_log(f"Download error: {e}")
            
            # Clean up on error
            if self.file_path and os.path.exists(self.file_path):
                try:
                    os.unlink(self.file_path)
                except:
                    pass
    
    def progress_hook(self, d):
        """Hook to monitor download progress and update logs."""
        if d['status'] == 'downloading':
            percent = d.get('_percent_str', '')
            speed = d.get('_speed_str', 'N/A')
            
            if speed and speed != 'N/A':
                ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
                clean_speed = ansi_escape.sub('', speed).strip()
            else:
                clean_speed = speed
            
            progress_value = None
            
            if percent and '%' in percent:
                try:
                    cleaned = percent.strip().replace('%', '').strip()
                    if cleaned:
                        progress_value = float(cleaned)
                except (ValueError, TypeError):
                    pass
            
            if progress_value is None:
                downloaded = d.get('downloaded_bytes', 0)
                total = d.get('total_bytes') or d.get('total_bytes_estimate', 0)
                if total > 0:
                    progress_value = (downloaded / total) * 100
            
            if progress_value is None:
                progress_value = 0
            
            download_tasks[self.task_id]['progress'] = progress_value
            download_tasks[self.task_id]['speed'] = clean_speed
            
            add_log(f"Downloading: {progress_value:.1f}% complete, Speed: {clean_speed}")
                
        elif d['status'] == 'finished':
            add_log("Download finished, post-processing...")
            download_tasks[self.task_id]['progress'] = 100.0
            download_tasks[self.task_id]['speed'] = 'Completed'
