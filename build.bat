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
    if errorlevel 1 (
        echo   エラー: 仮想環境の作成に失敗しました
        pause
        exit /b 1
    )
) else (
    echo   仮想環境は既に存在します
)

echo [2/5] Pythonパッケージのインストール...
call venv\Scripts\activate.bat
pip install -r requirements.txt
if errorlevel 1 (
    echo   エラー: パッケージのインストールに失敗しました
    pause
    exit /b 1
)
pip install pyinstaller
if errorlevel 1 (
    echo   エラー: PyInstallerのインストールに失敗しました
    pause
    exit /b 1
)

echo [3/5] フロントエンドのビルド...
cd ..\frontend
echo   npmパッケージをインストール中...
call npm install
if errorlevel 1 (
    echo   エラー: npmパッケージのインストールに失敗しました
    pause
    exit /b 1
)
echo   プロダクションビルドを実行中...
call npm run build
if errorlevel 1 (
    echo   エラー: フロントエンドのビルドに失敗しました
    pause
    exit /b 1
)

echo [4/5] 実行ファイルの作成...
cd ..\backend
echo   既存のビルドファイルをクリーンアップ中...
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist
echo   PyInstallerで実行ファイルをビルド中...
python -m PyInstaller --name="YouTubeDownloader" --onefile --windowed --add-data="../frontend/dist;frontend/dist" --add-data="ffmpeg;ffmpeg" --hidden-import=static_server --hidden-import=ffmpeg --hidden-import=shutil --hidden-import=webview --clean webview_app.py
if errorlevel 1 (
    echo   エラー: 実行ファイルのビルドに失敗しました
    pause
    exit /b 1
)

echo [5/5] 完了！
cd ..
echo.
echo ========================================
echo ビルドが完了しました！
echo Executable: backend\dist\YouTubeDownloader.exe
echo ========================================
echo.
echo 実行ファイルを起動するには以下のコマンドを実行してください:
echo   backend\dist\YouTubeDownloader.exe

pause
