@echo off
chcp 65001 >nul
cd /d "%~dp0"

REM 仮想環境のセットアップを確認
python dev_start.py
