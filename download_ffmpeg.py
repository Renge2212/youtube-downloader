import os
import requests
import zipfile
import shutil
import sys

def download_ffmpeg():
    """FFmpegをダウンロードして展開する"""
    ffmpeg_url = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
    ffmpeg_dir = os.path.join("backend", "ffmpeg")
    temp_zip = os.path.join("backend", "ffmpeg.zip")
    
    # ディレクトリ作成
    os.makedirs(ffmpeg_dir, exist_ok=True)
    
    print("FFmpegをダウンロード中...")
    
    try:
        # FFmpegをダウンロード
        response = requests.get(ffmpeg_url, stream=True)
        response.raise_for_status()
        
        with open(temp_zip, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        print("FFmpegを展開中...")
        
        # ZIPファイルを展開
        with zipfile.ZipFile(temp_zip, 'r') as zip_ref:
            zip_ref.extractall(ffmpeg_dir)
        
        # binディレクトリから実行ファイルを移動
        extracted_dir = os.path.join(ffmpeg_dir, "ffmpeg-master-latest-win64-gpl", "bin")
        if os.path.exists(extracted_dir):
            for file in os.listdir(extracted_dir):
                if file.endswith(".exe"):
                    shutil.move(os.path.join(extracted_dir, file), 
                               os.path.join(ffmpeg_dir, file))
            
            # 一時ディレクトリを削除
            shutil.rmtree(os.path.join(ffmpeg_dir, "ffmpeg-master-latest-win64-gpl"))
        
        # 一時ZIPファイルを削除
        os.remove(temp_zip)
        
        print("FFmpegのダウンロードと展開が完了しました")
        return True
        
    except Exception as e:
        print(f"FFmpegのダウンロードに失敗しました: {e}")
        # クリーンアップ
        if os.path.exists(temp_zip):
            os.remove(temp_zip)
        return False

if __name__ == "__main__":
    download_ffmpeg()
