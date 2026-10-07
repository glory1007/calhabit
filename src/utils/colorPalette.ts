// Across 캘린더 감성의 차분하고 세련된 소프트 뮤트 & 톤온톤 팔레트 32종
export interface ColorOption {
  id: string;
  name: string;
  hex: string;
}

export const COLOR_PALETTE: ColorOption[] = [
  // 소프트 로즈 & 코랄 (차분한 핑크/말린 장미)
  { id: 'rose-dust', name: '더스티 로즈', hex: '#D9777F' },
  { id: 'rose-soft', name: '소프트 코랄', hex: '#E28A7A' },
  { id: 'terracotta', name: '테라코타', hex: '#D27D60' },
  { id: 'peach-blush', name: '피치 블러시', hex: '#EAA988' },

  // 소프트 앰버 & 샌드 (따뜻한 옐로우/베이지)
  { id: 'warm-sand', name: '웜 샌드', hex: '#DDB165' },
  { id: 'soft-honey', name: '소프트 머스타드', hex: '#D4A373' },
  { id: 'pale-almond', name: '아몬드 크림', hex: '#C9A27E' },
  { id: 'clay', name: '어스 클레이', hex: '#B8826B' },

  // 세이지 & 뮤트 그린 (자연스러운 잎사귀/올리브)
  { id: 'sage-green', name: '세이지 그린', hex: '#7A9A8B' },
  { id: 'olive-mute', name: '뮤트 올리브', hex: '#8C9A6A' },
  { id: 'forest-soft', name: '소프트 포레스트', hex: '#5E8271' },
  { id: 'mint-dust', name: '더스티 민트', hex: '#7EB5A6' },
  { id: 'moss', name: '모스 그린', hex: '#6F8572' },
  { id: 'eucalyptus', name: '유칼립투스', hex: '#87A8A4' },

  // 슬레이트 & 소프트 블루 (Across 시그니처 잔잔한 블루)
  { id: 'across-blue', name: '어크로스 블루', hex: '#5B84B1' },
  { id: 'dusty-sky', name: '더스티 스카이', hex: '#7692A8' },
  { id: 'fog-blue', name: '포그 블루', hex: '#8EA4B8' },
  { id: 'deep-slate', name: '슬레이트 블루', hex: '#4B6B88' },
  { id: 'soft-navy', name: '소프트 인디고', hex: '#4A5B78' },
  { id: 'steel-blue', name: '스틸 틸', hex: '#588B8B' },

  // 라벤더 & 모브 (은은한 보라/자두)
  { id: 'dusty-mauve', name: '더스티 모브', hex: '#9E768F' },
  { id: 'lavender-mute', name: '뮤트 라벤더', hex: '#9B8AA9' },
  { id: 'plum-soft', name: '소프트 플럼', hex: '#85586F' },
  { id: 'iris', name: '소프트 아이리스', hex: '#7C7BA5' },
  { id: 'heather', name: '헤더 퍼플', hex: '#B09398' },

  // 어스 브라운 & 토프 & 그레이 (단정하고 편안한 뉴트럴)
  { id: 'warm-taupe', name: '웜 토프', hex: '#938274' },
  { id: 'mocha-dust', name: '더스티 모카', hex: '#7D6B60' },
  { id: 'soft-charcoal', name: '소프트 차콜', hex: '#545E68' },
  { id: 'slate-gray', name: '슬레이트 그레이', hex: '#6C7A89' },
  { id: 'pebble', name: '페블 스톤', hex: '#8A8D91' },
  { id: 'cool-gray', name: '뮤트 쿨그레이', hex: '#78828A' },
  { id: 'espresso-mute', name: '딥 에스프레소', hex: '#4E443F' },
];

export function getColorByHex(hex: string): ColorOption {
  const found = COLOR_PALETTE.find(c => c.hex.toLowerCase() === hex.toLowerCase());
  return found || { id: 'custom', name: '커스텀', hex };
}
