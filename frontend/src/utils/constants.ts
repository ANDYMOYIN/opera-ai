export const API_BASE = '/api';
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
export const WS_BASE = `${wsProtocol}//${window.location.host}/ws`;

export const CATEGORY_COLORS: Record<string, string> = {
  '人物': '#e74c3c',
  '剧目': '#d4a843',
  '唱腔': '#2d8b6e',
  '动作': '#f39c12',
  '乐器': '#9b59b6',
  '行当': '#1abc9c',
};

export const CATEGORY_COLORS_3D: Record<string, string> = {
  '人物': '#ff6b6b',
  '剧目': '#ffd700',
  '唱腔': '#2ecc71',
  '动作': '#f39c12',
  '乐器': '#a29bfe',
  '行当': '#00d2d3',
};
