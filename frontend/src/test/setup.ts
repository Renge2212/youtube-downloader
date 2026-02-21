import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Material-UIアイコンのモックを設定
vi.mock('@mui/icons-material', () => ({
  MusicNote: () => '🎵',
  VideoLibrary: () => '🎬',
  Download: () => '⬇️',
}))

// 各テストの後にクリーンアップ
afterEach(() => {
  cleanup()
})
