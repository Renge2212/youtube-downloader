@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo YouTube Downloader 実行ファイルビルドスクリプト
echo ========================================
echo.

echo [1/5] バックエンド仮想環境のセットアップ...
cd backend
if not exist venv (
    echo   仮想環境を作成中...
    python -m venv venv
) else (
    echo   仮想環境は既に存在します
)

echo [2/5] Pythonパッケージのインストール...
venv\Scripts\pip.exe install -r requirements.txt
venv\Scripts\pip.exe install pyinstaller

echo [3/5] フロントエンドのビルド...
cd ..\frontend
echo   npmパッケージをインストール中...
call npm install >nul 2>&1
echo   プロダクションビルドを実行中...
call npm run build >nul 2>&1

echo [4/5] 実行ファイルの作成...
cd ..\backend
echo   既存のビルドファイルをクリーンアップ中...
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist
echo   PyInstallerで実行ファイルをビルド中...
venv\Scripts\python.exe -m PyInstaller --name="YouTubeDownloader" --onefile --windowed --add-data="../frontend/dist;frontend/dist" --add-data="ffmpeg;ffmpeg" --hidden-import=static_server --hidden-import=ffmpeg --hidden-import=shutil --clean webview_app.py

echo [5/5] 完了！
cd ..
echo.
echo ========================================
echo ビルドが完了しました！
echo 実行ファイル: backend\dist\YouTubeDownloader.exe
echo ========================================
echo.
echo 実行ファイルを起動するには以下のコマンドを実行してください:
echo   backend\dist\YouTubeDownloader.exe
