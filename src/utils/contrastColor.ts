/**
 * WCAG YIQ 명도 계산 공식을 사용하여 배경색(HEX)에 가장 적합한 고대비 글자색(#FFFFFF 또는 #111827)을 반환합니다.
 */
export function getContrastTextColor(hexColor: string): string {
  if (!hexColor || !hexColor.startsWith('#')) return '#FFFFFF';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  // YIQ 명도 공식 (가독성 임계치: 140)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 140 ? '#111827' : '#FFFFFF';
}
