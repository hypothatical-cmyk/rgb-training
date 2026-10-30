import { RGB } from '../types/color';

export interface ColorScenario {
  id: string;
  name: string;
  category: 'portrait' | 'landscape' | 'interior' | 'night' | 'creative';
  description: string;
  castColor: RGB; // The unneutralized casted color (around middle gray)
  targetColor: RGB; // Target neutral gray
  targetPureColor?: RGB; // For sculptor mode target
  tips: string;
}

export const CURATED_PRESETS: ColorScenario[] = [
  {
    id: 'sunset_portrait',
    name: '일몰 인물 웜 캐스트 (Warm Sunset Cast)',
    category: 'portrait',
    description: '황혼의 붉은 노을빛이 강하게 들어와 피부톤 섀도우가 지나치게 붉고 누렇게 뜹니다.',
    castColor: { r: 172, g: 130, b: 96 }, // Red & Green (Yellow) dominant
    targetColor: { r: 128, g: 128, b: 128 },
    targetPureColor: { r: 215, g: 110, b: 45 },
    tips: 'Red를 낮추거나, 부족한 Blue 채널 곡선을 올려주어 옐로우/오렌지 기운을 중화하세요.',
  },
  {
    id: 'shade_cool',
    name: '그늘진 야외 쿨 섀도우 (Shade Blue/Cyan Cast)',
    category: 'landscape',
    description: '맑은 날 그늘 아래에서 직사광선 없이 하늘 반사광만 받아 푸른빛과 청록빛이 돕니다.',
    castColor: { r: 104, g: 132, b: 175 }, // Blue & Green dominant
    targetColor: { r: 128, g: 128, b: 128 },
    targetPureColor: { r: 45, g: 130, b: 210 },
    tips: 'Blue 채널을 내리거나, Red 곡선을 위로 끌어올려 따뜻한 톤으로 밸런스를 맞추세요.',
  },
  {
    id: 'fluorescent_interior',
    name: '실내 노후 형광등 그린 틴트 (Fluorescent Green Cast)',
    category: 'interior',
    description: '사무실이나 지하 공간의 형광등 스펙트럼 불균형으로 인해 전반적으로 탁한 녹색이 감돕니다.',
    castColor: { r: 118, g: 164, b: 122 }, // High Green
    targetColor: { r: 128, g: 128, b: 128 },
    targetPureColor: { r: 60, g: 195, b: 85 },
    tips: 'Green 곡선 중앙을 아래로 당겨 Magenta 성분(R+B)을 상대적으로 회복시키세요.',
  },
  {
    id: 'tungsten_lamp',
    name: '텅스텐 백열전구 옐로우 틴트 (Tungsten Lamp Yellow)',
    category: 'interior',
    description: '카페나 레스토랑의 3000K 전구색 조명으로 인해 벽과 피사체가 노랗게 덮여 있습니다.',
    castColor: { r: 184, g: 158, b: 92 }, // High R + High G
    targetColor: { r: 128, g: 128, b: 128 },
    targetPureColor: { r: 220, g: 185, b: 35 },
    tips: 'Yellow의 보색은 Blue입니다. Blue 채널을 올리거나 Red/Green을 고르게 억제하세요.',
  },
  {
    id: 'neon_cyber_magenta',
    name: '도심 야경 네온 마젠타 (City Neon Magenta)',
    category: 'night',
    description: '화려한 쇼윈도 마젠타 네온사인 반사광으로 인해 암부 디테일에 자홍색이 낍니다.',
    castColor: { r: 168, g: 105, b: 160 }, // High R + High B
    targetColor: { r: 128, g: 128, b: 128 },
    targetPureColor: { r: 210, g: 45, b: 190 },
    tips: '마젠타의 보색은 Green입니다. Green 채널을 올리거나 R과 B를 동시에 감쇄시키세요.',
  },
  {
    id: 'misty_dawn_teal',
    name: '안개 낀 호수 새벽 틸 (Misty Dawn Teal)',
    category: 'landscape',
    description: '새벽 수증기와 호수 물빛의 산란으로 서늘한 청록색 톤이 짙게 배어 있습니다.',
    castColor: { r: 95, g: 152, b: 162 }, // G + B (Cyan/Teal)
    targetColor: { r: 128, g: 128, b: 128 },
    targetPureColor: { r: 30, g: 175, b: 195 },
    tips: 'Cyan의 보색은 Red입니다. Red 곡선을 들어올려 생기를 불어넣으세요.',
  },
  {
    id: 'vintage_faded_red',
    name: '빛바랜 레트로 인화지 레드 (Vintage Faded Red)',
    category: 'creative',
    description: '오래된 필름 사진의 시안 염료 퇴색으로 붉은빛이 부유하는 빈티지 룩입니다.',
    castColor: { r: 178, g: 122, b: 118 }, // High Red
    targetColor: { r: 128, g: 128, b: 128 },
    targetPureColor: { r: 220, g: 75, b: 65 },
    tips: 'Red 채널 곡선을 끌어내리거나 Cyan 성분인 Green과 Blue를 동일 비율로 끌어올립니다.',
  },
  {
    id: 'studio_strobe_overblue',
    name: '스튜디오 스트로브 차가운 하이라이트 (Cold Strobe)',
    category: 'portrait',
    description: '지나치게 높은 색온도의 플래시 동조로 인해 밝은 영역에 파란 기운이 서립니다.',
    castColor: { r: 118, g: 124, b: 172 }, // High Blue
    targetColor: { r: 128, g: 128, b: 128 },
    targetPureColor: { r: 40, g: 65, b: 225 },
    tips: 'Blue 채널을 내리거나 Yellow(R+G)를 보충해 주면 자연스러운 피부톤으로 복귀합니다.',
  },
];

/**
 * Generate a random RGB color with controlled difficulty tier
 */
export function generateRandomTargetColor(level = 1): RGB {
  if (level === 1) {
    // Pure primaries or pure secondaries with near extreme values
    const options: RGB[] = [
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 0, b: 255 },
      { r: 255, g: 255, b: 0 }, // Yellow
      { r: 0, g: 255, b: 255 }, // Cyan
      { r: 255, g: 0, b: 255 }, // Magenta
      { r: 255, g: 128, b: 0 }, // Orange
      { r: 0, g: 255, b: 128 }, // Spring green
      { r: 128, g: 0, b: 255 }, // Violet
    ];
    return options[Math.floor(Math.random() * options.length)];
  }

  if (level === 2) {
    // Stepped values (multiples of 32 or 64)
    const step = () => Math.floor(Math.random() * 5) * 64;
    return {
      r: Math.min(255, step()),
      g: Math.min(255, step()),
      b: Math.min(255, step()),
    };
  }

  // Level 3: Completely random RGB
  return {
    r: Math.floor(Math.random() * 256),
    g: Math.floor(Math.random() * 256),
    b: Math.floor(Math.random() * 256),
  };
}

/**
 * Generate a randomized casted gray color
 */
export function generateRandomCast(baseBrightness = 128, intensity = 40): RGB {
  const channelBias = ['red', 'green', 'blue', 'yellow', 'cyan', 'magenta'][Math.floor(Math.random() * 6)];
  let r = baseBrightness;
  let g = baseBrightness;
  let b = baseBrightness;
  const delta = Math.floor(25 + Math.random() * intensity);

  switch (channelBias) {
    case 'red':
      r += delta;
      break;
    case 'green':
      g += delta;
      break;
    case 'blue':
      b += delta;
      break;
    case 'yellow':
      r += Math.round(delta * 0.9);
      g += Math.round(delta * 0.9);
      break;
    case 'cyan':
      g += Math.round(delta * 0.9);
      b += Math.round(delta * 0.9);
      break;
    case 'magenta':
      r += Math.round(delta * 0.9);
      b += Math.round(delta * 0.9);
      break;
  }

  return {
    r: Math.max(20, Math.min(235, r)),
    g: Math.max(20, Math.min(235, g)),
    b: Math.max(20, Math.min(235, b)),
  };
}
