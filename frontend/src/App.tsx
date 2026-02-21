import { useState } from 'react';
import {
  Container,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Snackbar,
  LinearProgress
} from '@mui/material';
import { Download, MusicNote, VideoLibrary } from '@mui/icons-material';

interface DownloadStatus {
  status: 'processing' | 'completed' | 'error';
  format: string;
  url: string;
  error?: string;
  progress?: number;
  speed?: string;
}

function App() {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState('mp4');
  const [quality, setQuality] = useState('auto');
  const [status, setStatus] = useState<DownloadStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [logIntervalId, setLogIntervalId] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as 'success' | 'error' | 'warning' | 'info' });

  const handleDownload = async () => {
    if (!url) {
      showSnackbar('YouTubeのURLを入力してください', 'warning');
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch('http://localhost:5000/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, format, quality }),
      });

      if (!response.ok) {
        throw new Error('ダウンロードリクエストに失敗しました');
      }

      const data = await response.json();
      checkStatus(data.task_id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'エラーが発生しました';
      showSnackbar(errorMessage, 'error');
      setLoading(false);
    }
  };

  const checkStatus = async (taskId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/status/${taskId}`);
      if (!response.ok) {
        throw new Error('ステータスの取得に失敗しました');
      }

      const statusData: DownloadStatus = await response.json();
      setStatus(statusData);

      if (statusData.status === 'processing') {
        // まだ処理中の場合は1秒後に再チェック
        setTimeout(() => checkStatus(taskId), 1000);
      } else if (statusData.status === 'completed') {
        // ダウンロード完了したらファイルをダウンロード
        window.open(`http://localhost:5000/download/${taskId}`, '_blank');
        setLoading(false);
      } else if (statusData.status === 'error') {
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ステータス確認中にエラーが発生しました';
      showSnackbar(errorMessage, 'error');
      setLoading(false);
    }
  };

  const getFormatIcon = () => {
    switch (format) {
      case 'mp3':
      case 'm4a':
      case 'wav':
      case 'ogg':
      case 'flac':
      case 'opus':
        return <MusicNote sx={{ mr: 1 }} />;
      default:
        return <VideoLibrary sx={{ mr: 1 }} />;
    }
  };

  const getFormatLabel = () => {
    switch (format) {
      case 'mp4':
        return 'MP4 動画';
      case 'mp3':
        return 'MP3 音声';
      case 'm4a':
        return 'M4A 音声';
      case 'wav':
        return 'WAV 音声';
      case 'ogg':
        return 'OGG 音声';
      case 'flac':
        return 'FLAC 音声';
      case 'opus':
        return 'Opus 音声';
      default:
        return format;
    }
  };

  const getQualityLabel = () => {
    switch (quality) {
      case 'auto':
        return '自動選択';
      case 'highest':
        return '最高画質';
      case 'high':
        return '高画質';
      case 'medium':
        return '中画質';
      case 'low':
        return '低画質';
      default:
        return quality;
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch('http://localhost:5000/logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        
        // ログ更新後に自動スクロール
        setTimeout(() => {
          const logContainer = document.querySelector('[data-log-container]');
          if (logContainer) {
            logContainer.scrollTop = logContainer.scrollHeight;
          }
        }, 0);
      }
    } catch (err) {
      console.error('ログの取得に失敗しました:', err);
    }
  };

  const toggleLogs = () => {
    if (!showLogs) {
      fetchLogs();
      // ログ表示中は定期的に更新
      const intervalId = window.setInterval(fetchLogs, 500);
      setLogIntervalId(intervalId);
    } else {
      // ログ非表示時にインターバルをクリア
      if (logIntervalId !== null) {
        window.clearInterval(logIntervalId);
        setLogIntervalId(null);
      }
    }
    setShowLogs(!showLogs);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };


  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', py: 2, px: 2, overflow: 'hidden' }}>
      <Container maxWidth="sm" sx={{ width: '100%', overflow: 'hidden' }}>
      {/* ヘッダー */}
      <Box textAlign="center" mb={3}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          color="primary"
          fontWeight="bold"
          sx={{ 
            background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
            backgroundClip: 'text',
            textFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          YouTube Downloader
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
          YouTube動画を簡単にダウンロード
        </Typography>
      </Box>

      {/* メインカード */}
      <Card 
        elevation={3} 
        sx={{ 
          borderRadius: 2,
          background: 'linear-gradient(145deg, #ffffff, #f8f9fa)',
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* URL入力フィールド */}
            <TextField
              fullWidth
              label="YouTube URL"
              variant="outlined"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              disabled={loading}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                }
              }}
            />

            {/* フォーマット選択とダウンロードボタン */}
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'flex-end' }
            }}>
              <FormControl 
                fullWidth 
                size="small"
                sx={{ 
                  minWidth: { sm: 120 },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                  }
                }}
              >
                <InputLabel>フォーマット</InputLabel>
                  <Select
                    value={format}
                    label="フォーマット"
                    onChange={(e) => setFormat(e.target.value)}
                    disabled={loading}
                  >
                    <MenuItem value="mp4">MP4 動画</MenuItem>
                    <MenuItem value="mp3">MP3 音声</MenuItem>
                    <MenuItem value="m4a">M4A 音声</MenuItem>
                    <MenuItem value="wav">WAV 音声</MenuItem>
                    <MenuItem value="ogg">OGG 音声</MenuItem>
                    <MenuItem value="flac">FLAC 音声</MenuItem>
                    <MenuItem value="opus">Opus 音声</MenuItem>
                  </Select>
              </FormControl>

              {/* 画質選択（MP4形式のみ表示） */}
              {format === 'mp4' && (
                <FormControl 
                  fullWidth 
                  size="small"
                  sx={{ 
                    minWidth: { sm: 120 },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                    }
                  }}
                >
                  <InputLabel>画質</InputLabel>
                  <Select
                    value={quality}
                    label="画質"
                    onChange={(e) => setQuality(e.target.value)}
                    disabled={loading}
                  >
                    <MenuItem value="auto">自動選択</MenuItem>
                    <MenuItem value="highest">最高画質</MenuItem>
                    <MenuItem value="high">高画質 (1080p)</MenuItem>
                    <MenuItem value="medium">中画質 (720p)</MenuItem>
                    <MenuItem value="low">低画質 (360p)</MenuItem>
                  </Select>
                </FormControl>
              )}

              <Button
                variant="contained"
                size="large"
                onClick={handleDownload}
                disabled={loading || !url}
                startIcon={loading ? <CircularProgress size={20} /> : <Download />}
                sx={{ 
                  minWidth: '140px',
                  borderRadius: 1,
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1565c0, #1e88e5)',
                    transform: 'translateY(-1px)',
                    boxShadow: 3
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                {loading ? '処理中...' : 'ダウンロード'}
              </Button>
            </Box>
          </Box>

          {/* ステータス表示 */}
          {status && (
            <Box mt={2}>
              {status.status === 'processing' && (
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      ダウンロード中...
                    </Typography>
                  </Box>
                  {status.progress !== undefined && (
                    <Box sx={{ width: '100%', mb: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={status.progress} 
                        sx={{ 
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'rgba(0, 0, 0, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            background: 'linear-gradient(45deg, #1976d2, #42a5f5)'
                          }
                        }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {Math.round(status.progress)}% 完了
                        </Typography>
                        {status.speed && (
                          <Typography variant="caption" color="text.secondary">
                            速度: {status.speed}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
              {status.status === 'completed' && (
                <Alert 
                  severity="success"
                  sx={{ 
                    borderRadius: 1,
                    '& .MuiAlert-message': {
                      fontSize: '0.875rem'
                    }
                  }}
                >
                  ダウンロードが完了しました！
                </Alert>
              )}
              {status.status === 'error' && (
                <Alert 
                  severity="error"
                  sx={{ 
                    borderRadius: 1,
                    '& .MuiAlert-message': {
                      fontSize: '0.875rem'
                    }
                  }}
                >
                  {status.error}
                </Alert>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* フッター情報 */}
      <Box mt={3} textAlign="center">
        <Typography variant="caption" color="text.secondary">
          現在の選択: {getFormatIcon()} {getFormatLabel()}{format === 'mp4' && ` (${getQualityLabel()})`}
        </Typography>
        
        {/* ログ表示トグルボタン */}
        <Box mt={2} sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={toggleLogs}
            sx={{ 
              fontSize: '0.75rem',
              borderRadius: 1
            }}
          >
            {showLogs ? 'ログを隠す' : '開発者ログを表示'}
          </Button>
        </Box>
      </Box>


      {/* ログ表示セクション */}
      {showLogs && (
        <Card 
          elevation={2} 
          sx={{ 
            mt: 2,
            borderRadius: 1,
            maxHeight: 300,
            overflow: 'auto'
          }}
        >
          <CardContent sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem' }}>
              バックエンドログ
            </Typography>
            <Box 
              data-log-container
              sx={{ 
                backgroundColor: '#f5f5f5', 
                p: 1, 
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                maxHeight: 200,
                overflow: 'auto'
              }}
            >
              {logs.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  ログがありません
                </Typography>
              ) : (
                logs.map((log, index) => (
                  <Typography key={index} variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {log}
                  </Typography>
                ))
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* スナックバー通知 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Container>
    </Box>
  );
}

export default App;
