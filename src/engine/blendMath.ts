/**
 * ChromaShift Mathematical Blending & Color Engine
 * Standard 8-bit & W3C Comp & Blending Specifications
 */

export const C = (v: number): number => Math.max(0, Math.min(255, Math.round(v)));
export const R = (a: number, b: number): number => a + Math.floor(Math.random() * (b - a + 1));
export const R5 = (a: number, b: number): number => Math.round(R(a, b) / 5) * 5;
export const pick = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
export const shuffle = <T>(a: T[]): T[] => {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};
export const sample = <T>(a: T[], n: number): T[] => shuffle(a).slice(0, n);

export type RGB = [number, number, number];

export const css = (c: RGB): string => `rgb(${c[0]},${c[1]},${c[2]})`;
export const g3 = (v: number): RGB => [v, v, v];

export const CH = ['R', 'G', 'B'] as const;
export const CHC = ['var(--r)', 'var(--g)', 'var(--b)'] as const;
export const CHN = ['Red', 'Green', 'Blue'] as const;

/**
 * Separable blend modes (0..1 channel arithmetic)
 */
export const sep: Record<string, (a: number, b: number) => number> = {
  normal: (_a, b) => b,
  multiply: (a, b) => a * b,
  screen: (a, b) => 1 - (1 - a) * (1 - b),
  darken: Math.min,
  lighten: Math.max,
  colorBurn: (a, b) => (a >= 1 ? 1 : b <= 0 ? 0 : Math.max(0, 1 - (1 - a) / b)),
  linearBurn: (a, b) => Math.max(0, a + b - 1),
  colorDodge: (a, b) => (a <= 0 ? 0 : b >= 1 ? 1 : Math.min(1, a / (1 - b))),
  linearDodge: (a, b) => Math.min(1, a + b),
  overlay: (a, b) => (a <= 0.5 ? 2 * a * b : 1 - 2 * (1 - a) * (1 - b)),
  hardLight: (a, b) => (b <= 0.5 ? 2 * a * b : 1 - 2 * (1 - a) * (1 - b)),
  softLight: (a, b) => {
    if (b <= 0.5) return a - (1 - 2 * b) * a * (1 - a);
    const d = a <= 0.25 ? ((16 * a - 12) * a + 4) * a : Math.sqrt(a);
    return a + (2 * b - 1) * (d - a);
  },
  difference: (a, b) => Math.abs(a - b),
  exclusion: (a, b) => a + b - 2 * a * b,
};

export const lum = (c: RGB): number => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];

export function clipColor(c: RGB): RGB {
  const l = lum(c);
  const n = Math.min(...c);
  const x = Math.max(...c);
  let o = c.slice() as RGB;
  if (n < 0) o = o.map((v) => l + ((v - l) * l) / (l - n)) as RGB;
  if (x > 1) o = o.map((v) => l + ((v - l) * (1 - l)) / (x - l)) as RGB;
  return o;
}

export const setLum = (c: RGB, l: number): RGB => {
  const d = l - lum(c);
  return clipColor(c.map((v) => v + d) as RGB);
};

export function blend(mode: string, base: RGB, top: RGB): RGB {
  const a = base.map((v) => v / 255) as RGB;
  const b = top.map((v) => v / 255) as RGB;
  let o: RGB;
  if (mode === 'color') {
    o = setLum(b, lum(a));
  } else if (mode === 'luminosity') {
    o = setLum(a, lum(b));
  } else {
    const fn = sep[mode] || sep.normal;
    o = a.map((v, i) => fn(v, b[i])) as RGB;
  }
  return o.map((v) => C(v * 255)) as RGB;
}

export const b1 = (mode: string, a: number, b: number): number => blend(mode, g3(a), g3(b))[0];

export interface ModeMeta {
  en: string;
  ko: string;
  neutral: string;
  hint: string;
}

export const MODES: Record<string, ModeMeta> = {
  multiply: {
    en: 'Multiply',
    ko: '곱하기',
    neutral: '흰색',
    hint: '흰 줄 자리는 그대로이고 검은 줄 자리는 새까맣죠. 전체가 어두워지기만 하면 Multiply.',
  },
  screen: {
    en: 'Screen',
    ko: '스크린',
    neutral: '검정',
    hint: '검은 줄 자리는 그대로, 흰 줄 자리는 새하얗습니다. 전체가 밝아지기만 하면 Screen.',
  },
  darken: {
    en: 'Darken',
    ko: '어둡게 하기',
    neutral: '흰색',
    hint: '채널마다 더 어두운 값만 남겨요. 회색 줄 자리에서 밝은 색은 회색으로 눌리고 어두운 색은 그대로 남는 경계가 생깁니다.',
  },
  lighten: {
    en: 'Lighten',
    ko: '밝게 하기',
    neutral: '검정',
    hint: '채널마다 더 밝은 값만 남겨요. 회색 줄 자리에서 어두운 부분이 회색으로 끌어올려진 평평한 경계가 보입니다.',
  },
  overlay: {
    en: 'Overlay',
    ko: '오버레이',
    neutral: '50% 회색',
    hint: '회색 줄 자리가 거의 그대로이고, 검정·흰 줄 자리에선 대비가 세게 걸리면서 아래 밝기의 흔적이 남아요.',
  },
  difference: {
    en: 'Difference',
    ko: '차이',
    neutral: '검정',
    hint: '흰 줄 자리가 반전(보색)되고 검은 줄 자리는 그대로예요. 반전이 보이면 Difference.',
  },
  colorBurn: {
    en: 'Color Burn',
    ko: '색상 번',
    neutral: '흰색',
    hint: 'Multiply보다 대비가 훨씬 세고 어두운 쪽이 빨리 뭉개집니다. 색 줄 자리 채도가 강하게 올라가요.',
  },
  linearDodge: {
    en: 'Linear Dodge (Add)',
    ko: '선형 닷지(추가)',
    neutral: '검정',
    hint: '값을 그냥 더해요. 회색 줄 자리부터 이미 많은 부분이 하얗게 날아갑니다.',
  },
  luminosity: {
    en: 'Luminosity',
    ko: '광도',
    neutral: '없음',
    hint: '결과에 아래 레이어의 색(색조·채도)이 전혀 없고 위 레이어의 밝기만 남아요.',
  },
  color: {
    en: 'Color',
    ko: '색상',
    neutral: '없음',
    hint: '아래 레이어의 밝기 패턴은 남고 색은 위 레이어 것으로 바뀝니다.',
  },
  linearBurn: { en: 'Linear Burn', ko: '선형 번', neutral: '흰색', hint: '' },
  softLight: { en: 'Soft Light', ko: '소프트 라이트', neutral: '50% 회색', hint: '' },
  hardLight: { en: 'Hard Light', ko: '하드 라이트', neutral: '50% 회색', hint: '' },
  colorDodge: { en: 'Color Dodge', ko: '색상 닷지', neutral: '검정', hint: '' },
  exclusion: { en: 'Exclusion', ko: '제외', neutral: '검정', hint: '' },
  normal: { en: 'Normal', ko: '표준', neutral: '없음', hint: '' },
};

export const mName = (m: string): string => MODES[m]?.en || m;

export function hsl(h: number, s: number, l: number): RGB {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}
