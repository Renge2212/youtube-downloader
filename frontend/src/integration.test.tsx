import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import App from './App'

// グローバル fetch をモック
vi.stubGlobal('fetch', vi.fn())

// 統合テスト - アプリケーション全体の動作をテスト
describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('completes full download flow successfully', async () => {
    // モックの設定
    const mockFetch = vi.mocked(fetch)
    
    // ダウンロード開始レスポンス
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ task_id: 'test-task-id', status: 'processing' })
    } as any)
    
    // ステータスチェックレスポンス（進行中）
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        status: 'processing', 
        format: 'mp4', 
        url: 'https://www.youtube.com/watch?v=test',
        progress: 25.0,
        speed: '500 KB/s'
      })
    } as any)
    
    // ステータスチェックレスポンス（進行中）
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        status: 'processing', 
        format: 'mp4', 
        url: 'https://www.youtube.com/watch?v=test',
        progress: 75.0,
        speed: '1.2 MB/s'
      })
    } as any)
    
    // ステータスチェックレスポンス（完了）
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        status: 'completed', 
        format: 'mp4', 
        url: 'https://www.youtube.com/watch?v=test'
      })
    } as any)
    
    // window.openをモック
    const mockWindowOpen = vi.fn()
    window.open = mockWindowOpen
    
    render(<App />)
    
    // 1. URLを入力
    const urlInput = screen.getByPlaceholderText(/https:\/\/www\.youtube\.com\/watch\?v=\.\.\./i)
    await userEvent.type(urlInput, 'https://www.youtube.com/watch?v=test')
    
    // 2. フォーマットをMP3に変更
    const formatSelect = screen.getByLabelText(/フォーマット/i)
    await userEvent.click(formatSelect)
    const mp3Option = screen.getByRole('option', { name: /MP3 音声/i })
    await userEvent.click(mp3Option)
    
    // 3. ダウンロードボタンをクリック
    const downloadButton = screen.getByRole('button', { name: /ダウンロード/i })
    await userEvent.click(downloadButton)
    
    // 4. 処理中の表示を確認
    expect(screen.getByText(/処理中.../i)).toBeInTheDocument()
    
    // 5. 進捗表示を確認
    await waitFor(() => {
      expect(screen.getByText(/25% 完了/i)).toBeInTheDocument()
    })
    
    // 6. 完了メッセージを確認
    await waitFor(() => {
      expect(screen.getByText(/ダウンロードが完了しました！/i)).toBeInTheDocument()
    })
    
    // 7. ファイルダウンロードがトリガーされることを確認
    expect(mockWindowOpen).toHaveBeenCalledWith(
      'http://localhost:5000/download/test-task-id',
      '_blank'
    )
  })

  it('handles error flow from API failure', async () => {
    // モックの設定
    const mockFetch = vi.mocked(global.fetch)
    
    // ダウンロード開始でエラー
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    
    render(<App />)
    
    const urlInput = screen.getByPlaceholderText(/https:\/\/www\.youtube\.com\/watch\?v=\.\.\./i)
    const downloadButton = screen.getByRole('button', { name: /ダウンロード/i })
    
    await userEvent.type(urlInput, 'https://www.youtube.com/watch?v=test')
    await userEvent.click(downloadButton)
    
    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument()
    })
  })

  it('handles format and quality selection workflow', async () => {
    render(<App />)
    
    // 1. デフォルトでMP4と画質選択が表示される
    expect(screen.getByLabelText(/フォーマット/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/画質/i)).toBeInTheDocument()
    
    // 2. フォーマットをMP3に変更
    const formatSelect = screen.getByLabelText(/フォーマット/i)
    await userEvent.click(formatSelect)
    const mp3Option = screen.getByRole('option', { name: /MP3 音声/i })
    await userEvent.click(mp3Option)
    
    // 3. 画質選択が非表示になる
    expect(screen.queryByLabelText(/画質/i)).not.toBeInTheDocument()
    
    // 4. フォーマットをMP4に戻す
    await userEvent.click(formatSelect)
    const mp4Option = screen.getByRole('option', { name: /MP4 動画/i })
    await userEvent.click(mp4Option)
    
    // 5. 画質選択が再表示される
    expect(screen.getByLabelText(/画質/i)).toBeInTheDocument()
    
    // 6. 画質を変更
    const qualitySelect = screen.getByLabelText(/画質/i)
    await userEvent.click(qualitySelect)
    const highQualityOption = screen.getByRole('option', { name: /高画質/i })
    await userEvent.click(highQualityOption)
    
    // 7. 選択がUIに反映されることを確認
    expect(screen.getByText(/高画質/i)).toBeInTheDocument()
  })

  it('manages log display and updates', async () => {
    // モックの設定
    const mockFetch = vi.mocked(global.fetch)
    
    // ログ取得レスポンス
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ 
        logs: [
          '[00:00:00] アプリケーション起動',
          '[00:00:01] ダウンロードリクエスト受信',
          '[00:00:02] ダウンロード完了'
        ] 
      })
    })
    
    render(<App />)
    
    // 1. ログ表示ボタンをクリック
    const logButton = screen.getByRole('button', { name: /開発者ログを表示/i })
    await userEvent.click(logButton)
    
    // 2. ログが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText(/バックエンドログ/i)).toBeInTheDocument()
      expect(screen.getByText(/アプリケーション起動/i)).toBeInTheDocument()
      expect(screen.getByText(/ダウンロードリクエスト受信/i)).toBeInTheDocument()
      expect(screen.getByText(/ダウンロード完了/i)).toBeInTheDocument()
    })
    
    // 3. ログを非表示
    await userEvent.click(logButton)
    
    // 4. ログが非表示になることを確認
    await waitFor(() => {
      expect(screen.queryByText(/バックエンドログ/i)).not.toBeInTheDocument()
    })
  })

  it('handles multiple consecutive downloads', async () => {
    // モックの設定
    const mockFetch = vi.mocked(global.fetch)
    
    // 最初のダウンロード
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ task_id: 'first-task', status: 'processing' })
    })
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        status: 'completed', 
        format: 'mp4', 
        url: 'https://www.youtube.com/watch?v=first'
      })
    })
    
    // 2回目のダウンロード
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ task_id: 'second-task', status: 'processing' })
    })
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        status: 'completed', 
        format: 'mp3', 
        url: 'https://www.youtube.com/watch?v=second'
      })
    })
    
    // window.openをモック
    const mockWindowOpen = vi.fn()
    window.open = mockWindowOpen
    
    render(<App />)
    
    const urlInput = screen.getByPlaceholderText(/https:\/\/www\.youtube\.com\/watch\?v=\.\.\./i)
    const downloadButton = screen.getByRole('button', { name: /ダウンロード/i })
    
    // 1回目のダウンロード
    await userEvent.clear(urlInput)
    await userEvent.type(urlInput, 'https://www.youtube.com/watch?v=first')
    await userEvent.click(downloadButton)
    
    // 1回目の完了を待つ
    await waitFor(() => {
      expect(screen.getByText(/ダウンロードが完了しました！/i)).toBeInTheDocument()
    })
    
    // 2回目のダウンロード
    await userEvent.clear(urlInput)
    await userEvent.type(urlInput, 'https://www.youtube.com/watch?v=second')
    
    // フォーマットをMP3に変更
    const formatSelect = screen.getByLabelText(/フォーマット/i)
    await userEvent.click(formatSelect)
    const mp3Option = screen.getByRole('option', { name: /MP3 音声/i })
    await userEvent.click(mp3Option)
    
    await userEvent.click(downloadButton)
    
    // 2回目の完了を待つ
    await waitFor(() => {
      expect(screen.getByText(/ダウンロードが完了しました！/i)).toBeInTheDocument()
    })
    
    // 2回のダウンロードがトリガーされたことを確認
    expect(mockWindowOpen).toHaveBeenCalledTimes(2)
  })

  it('validates user input and shows appropriate feedback', async () => {
    render(<App />)
    
    const downloadButton = screen.getByRole('button', { name: /ダウンロード/i })
    
    // 1. URLなしでダウンロードを試みる
    await userEvent.click(downloadButton)
    
    // 2. エラーメッセージが表示される
    await waitFor(() => {
      expect(screen.getByText(/YouTubeのURLを入力してください/i)).toBeInTheDocument()
    })
    
    // 3. 不正なURLを入力
    const urlInput = screen.getByPlaceholderText(/https:\/\/www\.youtube\.com\/watch\?v=\.\.\./i)
    await userEvent.type(urlInput, 'invalid-url')
    
    // 4. ダウンロードボタンが有効になる
    expect(downloadButton).toBeEnabled()
    
    // 5. 再度ダウンロードを試みる（API呼び出しはしない）
    await userEvent.click(downloadButton)
  })
})
