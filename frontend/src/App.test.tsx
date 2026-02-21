import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'

// グローバル fetch をモック
vi.stubGlobal('fetch', vi.fn())

// 軽量なテスト - 動的インポートを使用してファイルオープン数を削減
describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders basic UI elements', async () => {
    // 動的インポートでAppコンポーネントを読み込み
    const { default: App } = await import('./App')
    render(<App />)
    
    // 基本的なUI要素が表示されていることを確認
    expect(screen.getByText(/YouTube Downloader/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/https:\/\/www\.youtube\.com\/watch\?v=\.\.\./i)).toBeInTheDocument()
  })

  it('has download button', async () => {
    const { default: App } = await import('./App')
    render(<App />)
    
    const downloadButton = screen.getByRole('button', { name: /ダウンロード/i })
    expect(downloadButton).toBeInTheDocument()
  })

  it('shows current format selection', async () => {
    const { default: App } = await import('./App')
    render(<App />)
    
    const formatInfo = screen.getByText(/現在の選択:/i)
    expect(formatInfo).toBeInTheDocument()
  })

  it('disables download button when URL is empty', async () => {
    const { default: App } = await import('./App')
    render(<App />)
    
    const downloadButton = screen.getByRole('button', { name: /ダウンロード/i })
    expect(downloadButton).toBeDisabled()
  })

  it('enables download button when URL is provided', async () => {
    const { default: App } = await import('./App')
    render(<App />)
    
    const urlInput = screen.getByPlaceholderText(/https:\/\/www\.youtube\.com\/watch\?v=\.\.\./i)
    const downloadButton = screen.getByRole('button', { name: /ダウンロード/i })
    
    await userEvent.type(urlInput, 'https://www.youtube.com/watch?v=test')
    
    expect(downloadButton).toBeEnabled()
  })

  it('shows quality selector only for MP4 format', async () => {
    const { default: App } = await import('./App')
    render(<App />)
    
    // デフォルトはMP4なので画質選択が表示される
    expect(screen.getByText(/画質/i)).toBeInTheDocument()
    
    // フォーマットをMP3に変更
    const formatSelect = screen.getByRole('combobox', { name: /フォーマット/i })
    await userEvent.click(formatSelect)
    const mp3Option = screen.getByRole('option', { name: /MP3 音声/i })
    await userEvent.click(mp3Option)
    
    // 画質選択が非表示になる
    await waitFor(() => {
      expect(screen.queryByText(/画質/i)).not.toBeInTheDocument()
    })
  })

  it('handles download button click with successful API response', async () => {
    const { default: App } = await import('./App')
    
    // モックの設定
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ task_id: 'test-task-id', status: 'processing' })
    })
    
    render(<App />)
    
    const urlInput = screen.getByPlaceholderText(/https:\/\/www\.youtube\.com\/watch\?v=\.\.\./i)
    const downloadButton = screen.getByRole('button', { name: /ダウンロード/i })
    
    await userEvent.type(urlInput, 'https://www.youtube.com/watch?v=test')
    await userEvent.click(downloadButton)
    
    // ダウンロードリクエストが送信されたことを確認
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:5000/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        url: 'https://www.youtube.com/watch?v=test', 
        format: 'mp4', 
        quality: 'auto' 
      }),
    })
  })

  it('handles download button click with API error', async () => {
    const { default: App } = await import('./App')
    
    // モックの設定
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    })
    
    render(<App />)
    
    const urlInput = screen.getByPlaceholderText(/https:\/\/www\.youtube\.com\/watch\?v=\.\.\./i)
    const downloadButton = screen.getByRole('button', { name: /ダウンロード/i })
    
    await userEvent.type(urlInput, 'https://www.youtube.com/watch?v=test')
    await userEvent.click(downloadButton)
    
    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText(/ダウンロードリクエストに失敗しました/i)).toBeInTheDocument()
    })
  })

  it('shows progress indicator during download', async () => {
    const { default: App } = await import('./App')
    
    // モックの設定
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ task_id: 'test-task-id', status: 'processing' })
    })
    
    render(<App />)
    
    const urlInput = screen.getByPlaceholderText(/https:\/\/www\.youtube\.com\/watch\?v=\.\.\./i)
    const downloadButton = screen.getByRole('button', { name: /ダウンロード/i })
    
    await userEvent.type(urlInput, 'https://www.youtube.com/watch?v=test')
    await userEvent.click(downloadButton)
    
    // 処理中の表示が現れることを確認
    expect(screen.getByText(/処理中.../i)).toBeInTheDocument()
  })

  it('toggles log display when log button is clicked', async () => {
    const { default: App } = await import('./App')
    
    // モックの設定
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ logs: ['[00:00:00] Test log message'] })
    })
    
    render(<App />)
    
    const logButton = screen.getByRole('button', { name: /開発者ログを表示/i })
    
    // ログを表示
    await userEvent.click(logButton)
    
    // ログが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText(/バックエンドログ/i)).toBeInTheDocument()
      expect(screen.getByText(/Test log message/i)).toBeInTheDocument()
    })
    
    // ログを非表示
    await userEvent.click(logButton)
    
    // ログが非表示になることを確認
    await waitFor(() => {
      expect(screen.queryByText(/バックエンドログ/i)).not.toBeInTheDocument()
    })
  })

  it('displays error message when download fails', async () => {
    const { default: App } = await import('./App')
    
    // モックの設定
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
    
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

  it('updates format selection when format is changed', async () => {
    const { default: App } = await import('./App')
    render(<App />)
    
    const formatSelect = screen.getByLabelText(/フォーマット/i)
    await userEvent.click(formatSelect)
    
    const mp3Option = screen.getByRole('option', { name: /MP3 音声/i })
    await userEvent.click(mp3Option)
    
    // フォーマット選択が更新されることを確認
    expect(screen.getByText(/MP3 音声/i)).toBeInTheDocument()
  })

  it('updates quality selection when quality is changed', async () => {
    const { default: App } = await import('./App')
    render(<App />)
    
    const qualitySelect = screen.getByLabelText(/画質/i)
    await userEvent.click(qualitySelect)
    
    const highQualityOption = screen.getByRole('option', { name: /高画質/i })
    await userEvent.click(highQualityOption)
    
    // 画質選択が更新されることを確認
    expect(screen.getByText(/高画質/i)).toBeInTheDocument()
  })

  it('shows snackbar notification for empty URL', async () => {
    const { default: App } = await import('./App')
    render(<App />)
    
    const downloadButton = screen.getByRole('button', { name: /ダウンロード/i })
    await userEvent.click(downloadButton)
    
    // スナックバー通知が表示されることを確認
    await waitFor(() => {
      expect(screen.getByText(/YouTubeのURLを入力してください/i)).toBeInTheDocument()
    })
  })

  it('handles status checking during download process', async () => {
    const { default: App } = await import('./App')
    
    // モックの設定
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
    
    // ダウンロード開始レスポンス
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ task_id: 'test-task-id', status: 'processing' })
    })
    
    // ステータスチェックレスポンス
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        status: 'processing', 
        format: 'mp4', 
        url: 'https://www.youtube.com/watch?v=test',
        progress: 50.0,
        speed: '1.2 MB/s'
      })
    })
    
    render(<App />)
    
    const urlInput = screen.getByPlaceholderText(/https:\/\/www\.youtube\.com\/watch\?v=\.\.\./i)
    const downloadButton = screen.getByRole('button', { name: /ダウンロード/i })
    
    await userEvent.type(urlInput, 'https://www.youtube.com/watch?v=test')
    await userEvent.click(downloadButton)
    
    // 進捗情報が表示されることを確認
    await waitFor(() => {
      expect(screen.getByText(/50% 完了/i)).toBeInTheDocument()
      expect(screen.getByText(/速度: 1.2 MB\/s/i)).toBeInTheDocument()
    })
  })

  it('handles successful download completion', async () => {
    const { default: App } = await import('./App')
    
    // モックの設定
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
    
    // ダウンロード開始レスポンス
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ task_id: 'test-task-id', status: 'processing' })
    })
    
    // ステータスチェックレスポンス（完了）
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        status: 'completed', 
        format: 'mp4', 
        url: 'https://www.youtube.com/watch?v=test'
      })
    })
    
    // window.openをモック
    const mockWindowOpen = vi.fn()
    window.open = mockWindowOpen
    
    render(<App />)
    
    const urlInput = screen.getByPlaceholderText(/https:\/\/www\.youtube\.com\/watch\?v=\.\.\./i)
    const downloadButton = screen.getByRole('button', { name: /ダウンロード/i })
    
    await userEvent.type(urlInput, 'https://www.youtube.com/watch?v=test')
    await userEvent.click(downloadButton)
    
    // ダウンロード完了メッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText(/ダウンロードが完了しました！/i)).toBeInTheDocument()
    })
    
    // ファイルダウンロードがトリガーされることを確認
    expect(mockWindowOpen).toHaveBeenCalledWith(
      'http://localhost:5000/download/test-task-id',
      '_blank'
    )
  })
})
