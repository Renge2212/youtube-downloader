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
  CircularProgress
} from '@mui/material';
import { Download, MusicNote, VideoLibrary } from '@mui/icons-material';

interface DownloadStatus {
  status: 'processing' | 'completed' | 'error';
  format: string;
  url: string;
  error?: string;
}

function App() {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState('mp4');
  const [, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<DownloadStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [logIntervalId, setLogIntervalId] = useState<number | null>(null);

  const handleDownload = async () => {
    if (!url) {
      setError('YouTubeのURLを入力してください');
      return;
    }

    setLoading(true);
    setError('');
    setStatus(null);

    try {
      const response = await fetch('http://localhost:5000/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, format }),
      });

      if (!response.ok) {
        throw new Error('ダウンロードリクエストに失敗しました');
      }

      const data = await response.json();
      setTaskId(data.task_id);
      checkStatus(data.task_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
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
        setError(statusData.error || 'ダウンロード中にエラーが発生しました');
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ステータス確認中にエラーが発生しました');
      setLoading(false);
    }
  };

  const getFormatIcon = () => {
    switch (format) {
      case 'mp3':
        return <MusicNote sx={{ mr: 1 }} />;
      case 'm4a':
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
      default:
        return format;
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch('http://localhost:5000/logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('ログの取得に失敗しました:', err);
    }
  };

  const toggleLogs = () => {
    if (!showLogs) {
      fetchLogs();
      // ログ表示中は定期的に更新
      const intervalId = window.setInterval(fetchLogs, 200);
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

  return (
    <Container maxWidth="sm" sx={{ py: 3, px: 2 }}>
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
                </Select>
              </FormControl>

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

          {/* エラーメッセージ */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mt: 2, 
                borderRadius: 1,
                '& .MuiAlert-message': {
                  fontSize: '0.875rem'
                }
              }}
            >
              {error}
            </Alert>
          )}

          {/* ステータス表示 */}
          {status && (
            <Box mt={2}>
              <Alert 
                severity={
                  status.status === 'completed' ? 'success' :
                  status.status === 'error' ? 'error' : 'info'
                }
                sx={{ 
                  borderRadius: 1,
                  '& .MuiAlert-message': {
                    fontSize: '0.875rem'
                  }
                }}
              >
                {status.status === 'processing' && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    ダウンロード処理中...
                  </Box>
                )}
                {status.status === 'completed' && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    ✅ ダウンロードが完了しました！
                  </Box>
                )}
                {status.status === 'error' && `❌ エラー: ${status.error}`}
              </Alert>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* フッター情報 */}
      <Box mt={3} textAlign="center">
        <Typography variant="caption" color="text.secondary">
          現在の選択: {getFormatIcon()} {getFormatLabel()}
        </Typography>
        
        {/* ログ表示トグルボタン */}
        <Box mt={2}>
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
    </Container>
  );
}

export default App;
