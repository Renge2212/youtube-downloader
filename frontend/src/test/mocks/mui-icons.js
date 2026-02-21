// Material-UIアイコンのモック
// 実際のアイコンコンポーネントの代わりにダミーのspan要素を返す

// よく使われるアイコンを個別にモック
const MusicNote = () => '🎵';
const VideoLibrary = () => '🎬';
const Download = () => '⬇️';

// 個別のアイコンをエクスポート
export { MusicNote, VideoLibrary, Download };

// デフォルトエクスポートとして、要求されたアイコンを返す関数を提供
export default {
  MusicNote,
  VideoLibrary,
  Download,
};
