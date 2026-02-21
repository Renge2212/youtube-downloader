@echo off
echo ========================================
echo YouTube Downloader テスト実行
echo ========================================

echo.
echo 1. フロントエンドテストを実行中...
cd frontend
call npm test -- --run
if %errorlevel% neq 0 (
    echo フロントエンドテストが失敗しました
    exit /b 1
)

echo.
echo 2. バックエンドテストを実行中...
cd ..\backend
python -m pytest test_app.py -v
if %errorlevel% neq 0 (
    echo バックエンドテストが失敗しました
    exit /b 1
)

echo.
echo ========================================
echo すべてのテストが成功しました！
echo ========================================
