# YouTube Downloader

YouTubeの動画をMP4、MP3、M4A形式でダウンロードできるツールです。

## 機能

- YouTube動画のURLからダウンロード
- 複数フォーマット対応: MP4 (動画), MP3 (音声), M4A (音声)
- モダンなWebインターフェース

## 技術スタック

### フロントエンド
- Vite
- React
- TypeScript
- Material-UI (MUI)

### バックエンド
- Python Flask
- youtube-dl

## セットアップ

### 前提条件
- Node.js (v16以上)
- Python 3.8以上
- pip

### インストール

```bash
# すべての依存関係をインストール
npm run install:all
```

### 開発サーバーの起動

```bash
# フロントエンドとバックエンドを同時に起動
npm run dev
```

または個別に起動:

```bash
# フロントエンドのみ
npm run dev:frontend

# バックエンドのみ
npm run dev:backend
```

## 使用方法

1. アプリケーションを起動
2. YouTube動画のURLを入力
3. 希望のフォーマットを選択 (MP4, MP3, M4A)
4. ダウンロードボタンをクリック
5. ダウンロードが完了するとファイルが保存されます

## プロジェクト構造

```
.
├── frontend/          # Reactフロントエンド
├── backend/           # Flaskバックエンド
├── package.json       # ルートパッケージ設定
└── README.md          # このファイル
