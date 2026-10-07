// TimeTree 공식 10대 대표 컬러 테마 (3, 4번 이미지 기준)
export interface ColorOption {
  id: string;
  name: string;
  hex: string;
}

export const TIMETREE_COLORS: ColorOption[] = [
  { id: 'emerald-green', name: '에메랄드 그린', hex: '#2ECC71' },
  { id: 'modern-cyan', name: '모던 사이언', hex: '#00BCD4' },
  { id: 'deep-sky-blue', name: '딥 스카이블루', hex: '#2196F3' },
  { id: 'pastel-brown', name: '파스텔 브라운', hex: '#8D6E63' },
  { id: 'midnight-black', name: '미드나잇 블랙', hex: '#263238' },
  { id: 'apple-red', name: '애플 레드', hex: '#E53935' },
  { id: 'french-rose', name: '프렌치 로즈', hex: '#E91E63' },
  { id: 'coral-pink', name: '코랄 핑크', hex: '#FF7043' },
  { id: 'bright-orange', name: '브라이트 오렌지', hex: '#FFA000' },
  { id: 'soft-violet', name: '소프트 바이올렛', hex: '#9C27B0' },
];

export const COLOR_PALETTE: ColorOption[] = TIMETREE_COLORS;

export function getColorByHex(hex: string): ColorOption {
  const found = COLOR_PALETTE.find(c => c.hex.toLowerCase() === hex.toLowerCase());
  return found || { id: 'custom', name: '커스텀', hex };
}
