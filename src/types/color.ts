/**
 * Color math and Photoshop blending mode calculation utilities
 */

export interface RGB {
  r: number; // 0 ~ 255
  g: number; // 0 ~ 255
  b: number; // 0 ~ 255
}

export interface LAB {
  l: number; // 0 ~ 100
  a: number; // -128 ~ 127
  b: number; // -128 ~ 127
}

export interface XYZ {
  x: number;
  y: number;
  z: number;
}

/**
 * Convert sRGB [0, 255] to Linear [0, 1]
 */
export function srgbToLinear(val255: number): number {
  const v = Math.max(0, Math.min(255, val255)) / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/**
 * Convert Linear [0, 1] to sRGB [0, 255]
 */
export function linearToSrgb(linearVal: number): number {
  const v = Math.max(0, Math.min(1, linearVal));
  const s = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(255, s * 255)));
}

/**
 * Convert RGB (sRGB D65) to CIE XYZ
 */
export function rgbToXyz(rgb: RGB): XYZ {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);

  // sRGB to XYZ matrix with D65 reference white
  const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
  const y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
  const z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;

  return { x: x * 100, y: y * 100, z: z * 100 };
}

/**
 * Convert CIE XYZ to CIE L*a*b* (Reference White D65: [95.047, 100.0, 108.883])
 */
export function xyzToLab(xyz: XYZ): LAB {
  const refX = 95.047;
  const refY = 100.0;
  const refZ = 108.883;

  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);

  const fx = f(xyz.x / refX);
  const fy = f(xyz.y / refY);
  const fz = f(xyz.z / refZ);

  const l = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);

  return { l, a, b };
}

export function rgbToLab(rgb: RGB): LAB {
  return xyzToLab(rgbToXyz(rgb));
}

/**
 * CIE76 Delta E (Color difference adhering to human perception)
 * Delta E < 1.0: Imperceptible by human eye
 * 1.0 ~ 2.0: Perceptible through close observation
 * 2.0 ~ 10.0: Perceptible at a glance
 * 11.0 ~ 49.0: Colors are more similar than opposite
 * 100+: Exact opposite colors
 */
export function deltaE76(c1: RGB, c2: RGB): number {
  const lab1 = rgbToLab(c1);
  const lab2 = rgbToLab(c2);
  const dl = lab1.l - lab2.l;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  return Math.sqrt(dl * dl + da * da + db * db);
}

/**
 * Euclidean distance in RGB space (0 ~ 441.67)
 */
export function rgbEuclideanDistance(c1: RGB, c2: RGB): number {
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

export type BlendMode = 'normal' | 'screen' | 'linear_dodge' | 'lighten' | 'multiply' | 'color_dodge';

export interface BlendModeInfo {
  id: BlendMode;
  name: string;
  nameKo: string;
  formula: string;
  description: string;
}

export const BLEND_MODES: BlendModeInfo[] = [
  {
    id: 'linear_dodge',
    name: 'Linear Dodge (Add)',
    nameKo: '선형 닷지 (추가)',
    formula: 'C = min(255, A + B)',
    description: '빛의 단순 물리적 가산. 값이 빠르게 255에 도달하여 화이트 클리핑 발생.',
  },
  {
    id: 'screen',
    name: 'Screen',
    nameKo: '스크린',
    formula: 'C = 255 - ((255 - A) × (255 - B)) / 255',
    description: '슬라이드 영사기 중첩. 반전 곱셈 후 재반전으로 클리핑 없이 부드럽게 발광.',
  },
  {
    id: 'lighten',
    name: 'Lighten',
    nameKo: '밝게 하기',
    formula: 'C = max(A, B)',
    description: '각 RGB 채널별로 두 레이어 중 더 큰(밝은) 값을 그대로 선택.',
  },
  {
    id: 'multiply',
    name: 'Multiply',
    nameKo: '곱하기',
    formula: 'C = (A × B) / 255',
    description: '감산혼합 모사. 흰색(255)은 무시되고 색이 겹칠수록 어두워짐.',
  },
  {
    id: 'color_dodge',
    name: 'Color Dodge',
    nameKo: '색상 닷지',
    formula: 'C = min(255, (A × 255) / (255 - B))',
    description: '하위 레이어의 대비를 급격히 높이며 상위 레이어의 밝기로 강렬하게 발광.',
  },
];

/**
 * Execute Photoshop 8-bit blend mode calculation on single channel
 */
export function blendChannel(a: number, b: number, mode: BlendMode): number {
  switch (mode) {
    case 'linear_dodge': // Add
      return Math.min(255, a + b);
    case 'screen':
      return Math.round(255 - ((255 - a) * (255 - b)) / 255);
    case 'lighten':
      return Math.max(a, b);
    case 'multiply':
      return Math.round((a * b) / 255);
    case 'color_dodge':
      if (b === 255) return 255;
      return Math.min(255, Math.round((a * 255) / (255 - b)));
    case 'normal':
    default:
      return b;
  }
}

/**
 * Blend two RGB colors under standard sRGB or Linear Gamma 1.0
 */
export function blendColors(base: RGB, blend: RGB, mode: BlendMode, useLinearGamma = false): RGB {
  if (!useLinearGamma) {
    return {
      r: blendChannel(base.r, blend.r, mode),
      g: blendChannel(base.g, blend.g, mode),
      b: blendChannel(base.b, blend.b, mode),
    };
  }

  // Linear Gamma 1.0 (Photoshop: "Blend RGB Colors Using Gamma 1.0")
  const linBaseR = srgbToLinear(base.r);
  const linBaseG = srgbToLinear(base.g);
  const linBaseB = srgbToLinear(base.b);

  const linBlendR = srgbToLinear(blend.r);
  const linBlendG = srgbToLinear(blend.g);
  const linBlendB = srgbToLinear(blend.b);

  const blendLinChannel = (a: number, b: number) => {
    switch (mode) {
      case 'linear_dodge':
        return Math.min(1.0, a + b);
      case 'screen':
        return 1.0 - (1.0 - a) * (1.0 - b);
      case 'lighten':
        return Math.max(a, b);
      case 'multiply':
        return a * b;
      case 'color_dodge':
        return b >= 1.0 ? 1.0 : Math.min(1.0, a / (1.0 - b));
      default:
        return b;
    }
  };

  return {
    r: linearToSrgb(blendLinChannel(linBaseR, linBlendR)),
    g: linearToSrgb(blendLinChannel(linBaseG, linBlendG)),
    b: linearToSrgb(blendLinChannel(linBaseB, linBlendB)),
  };
}

/**
 * Format RGB to CSS hex string
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Human-readable color temperature or hue descriptor
 */
export function describeRgbCast(rgb: RGB): string {
  const { r, g, b } = rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  if (diff <= 6) return '중립 회색 (Neutral Gray)';
  if (r > g && r > b) {
    if (g > b + 15) return '오렌지/웜 틴트 (Warm Orange Cast)';
    if (b > g + 15) return '마젠타/퍼플 틴트 (Magenta Cast)';
    return '레드 캐스트 (Red Cast)';
  }
  if (g > r && g > b) {
    if (r > b + 15) return '라임/옐로우 그린 틴트 (Yellow-Green Cast)';
    if (b > r + 15) return '시안/틸 틴트 (Cyan/Teal Cast)';
    return '그린 캐스트 (Green Cast)';
  }
  if (b > r && b > g) {
    if (r > g + 15) return '바이올렛/마젠타 틴트 (Violet Cast)';
    if (g > r + 15) return '쿨 블루/시안 틴트 (Cool Blue/Cyan Cast)';
    return '블루 쿨 캐스트 (Cool Blue Cast)';
  }
  if (r > b && g > b) return '옐로우 캐스트 (Yellow Cast: R+G)';
  if (g > r && b > r) return '시안 캐스트 (Cyan Cast: G+B)';
  if (r > g && b > g) return '마젠타 캐스트 (Magenta Cast: R+B)';
  return '복합 왜곡 (Complex Mixed Cast)';
}
