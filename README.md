# YouTube Downloader

YouTubeの動画をMP4、MP3、M4A形式でダウンロードできるアプリケーションです。

## 機能

- YouTube動画のMP4形式でのダウンロード
- 音声のみのMP3形式での抽出
- 音声のみのM4A形式での抽出
- モダンなWebインターフェース
- リアルタイムのダウンロード進捗表示

## 技術スタック

- **フロントエンド**: Vite + React + TypeScript + Material-UI
- **バックエンド**: Python Flask + yt-dlp
- **パッケージング**: PyInstaller

## 使用方法

### 開発モード

1. バックエンドサーバーを起動:
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

2. フロントエンドサーバーを起動:
```bash
cd frontend
npm install
npm run dev
```

3. ブラウザで http://localhost:5173 にアクセス

### 製品版の実行 (Linux/macOS)

1. 実行ファイルを実行:
```bash
./backend/dist/YouTubeDownloader
```

2. 自動的にブラウザが開き、アプリケーションが起動します

### 製品版の実行 (Windows)

1. 実行ファイルを実行:
```cmd
backend\dist\YouTubeDownloader.exe
```

2. 自動的にブラウザが開き、アプリケーションが起動します

## ビルド方法

### フロントエンドのビルド
```bash
cd frontend
npm run build
```

### Linux用実行ファイルの作成
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install pyinstaller
pyinstaller --name="YouTubeDownloader" --onefile --add-data="../frontend/dist:frontend/dist" --hidden-import=static_server app.py
```

### Windows用実行ファイルの作成
Windows環境で以下のコマンドを実行:
```cmd
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
pip install pyinstaller
pyinstaller --name="YouTubeDownloader" --onefile --add-data="../frontend/dist;frontend/dist" --hidden-import=static_server app.py
```

**Windows用の注意点**:
- パスの区切り文字は `:` ではなく `;` を使用
- 生成される実行ファイルは `YouTubeDownloader.exe` になります
- 管理者権限で実行する必要がある場合があります

## 注意事項

- このアプリケーションは教育・研究目的で作成されています
- YouTubeの利用規約に違反しないようにご使用ください
- ダウンロードしたコンテンツの権利は元の作成者に帰属します

## ライセンス

MIT License
