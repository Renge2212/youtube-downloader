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

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h3" component="h1" gutterBottom color="primary">
          YouTube Downloader
        </Typography>
        <Typography variant="h6" color="text.secondary">
          YouTubeの動画をMP4、MP3、M4A形式でダウンロード
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              label="YouTube URL"
              variant="outlined"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              disabled={loading}
            />

            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <FormControl fullWidth>
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
                sx={{ height: '56px', minWidth: '140px' }}
              >
                {loading ? '処理中...' : 'ダウンロード'}
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {status && (
            <Box mt={2}>
              <Alert 
                severity={
                  status.status === 'completed' ? 'success' :
                  status.status === 'error' ? 'error' : 'info'
                }
              >
                {status.status === 'processing' && (
                  <>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    ダウンロード処理中...
                  </>
                )}
                {status.status === 'completed' && 'ダウンロードが完了しました！'}
                {status.status === 'error' && `エラー: ${status.error}`}
              </Alert>
            </Box>
          )}
        </CardContent>
      </Card>

      <Box mt={4} textAlign="center">
        <Typography variant="body2" color="text.secondary">
          現在選択中のフォーマット: {getFormatIcon()} {getFormatLabel()}
        </Typography>
      </Box>
    </Container>
  );
}

export default App;
