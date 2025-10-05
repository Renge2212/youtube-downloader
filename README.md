# YouTube Downloader

YouTubeの動画をMP4、MP3、M4A、WAV、OGG、FLAC、Opus形式でダウンロードできるWindowsアプリケーションです。

## 機能

- YouTube動画のMP4形式でのダウンロード
- 音声のみのMP3形式での抽出
- 音声のみのM4A形式での抽出
- 音声のみのWAV形式での抽出
- 音声のみのOGG形式での抽出
- 音声のみのFLAC形式での抽出
- 音声のみのOpus形式での抽出
- モダンなWebインターフェース
- リアルタイムのダウンロード進捗表示
- Windowsネイティブアプリケーション（WebView2使用）

## 技術スタック

- **フロントエンド**: Vite + React + TypeScript + Material-UI
- **バックエンド**: Python Flask + yt-dlp
- **GUI**: PyWebView (WebView2)
- **パッケージング**: PyInstaller

## 使用方法

### 開発モードでの実行（推奨）

開発中は実行ファイルを作成せずに手元で実行できます：

```cmd
:: 開発用スクリプトを実行
python dev_start.py
```

詳細は [DEVELOPMENT.md](DEVELOPMENT.md) を参照してください。

### 製品版の実行

1. 実行ファイルを実行:
```cmd
backend\dist\YouTubeDownloader.exe
```

2. 自動的にWebView2ウィンドウが開き、アプリケーションが起動します

## ビルド方法

### フロントエンドのビルド
```cmd
cd frontend
npm run build
```

### Windows用実行ファイルの作成
```cmd
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
pip install pyinstaller
pyinstaller --name="YouTubeDownloader" --onefile --add-data="../frontend/dist;frontend/dist" --hidden-import=static_server --hidden-import=ffmpeg --hidden-import=shutil webview_app.py
```

**注意点**:
- パスの区切り文字は `;` を使用
- 生成される実行ファイルは `YouTubeDownloader.exe` になります
- 管理者権限で実行する必要がある場合があります

## 開発環境セットアップ

### 必要なソフトウェア
1. **Python 3.10+**: https://www.python.org/downloads/
2. **Node.js**: https://nodejs.org/
3. **Git**: https://git-scm.com/

### 初期セットアップ
```cmd
:: バックエンド依存関係のインストール
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

:: フロントエンド依存関係のインストール
cd ..\frontend
npm install
```

## アプリケーション構成

```
project/
├── backend/           # Flaskバックエンド
│   ├── app.py        # メインアプリケーション
│   ├── webview_app.py # WebView2ラッパー
│   ├── static_server.py # 静的ファイルサーバー
│   └── requirements.txt
├── frontend/          # Reactフロントエンド
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── dev_start.py       # 開発用起動スクリプト
└── DEVELOPMENT.md     # 開発モード詳細
```

## 注意事項

- このアプリケーションは教育・研究目的で作成されています
- YouTubeの利用規約に違反しないようにご使用ください
- ダウンロードしたコンテンツの権利は元の作成者に帰属します
- **Windows専用アプリケーション**です（WebView2を使用）

## ライセンス

MIT License
