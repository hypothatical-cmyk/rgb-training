/**
 * ChromaShift Curriculum & Question Generators
 * 7 Units, 14 Lessons, Dynamic Problem Generation
 */

import {
  C,
  R,
  R5,
  pick,
  shuffle,
  sample,
  RGB,
  css,
  g3,
  CH,
  CHC,
  CHN,
  blend,
  b1,
  mName,
  hsl,
  MODES,
  lum,
} from './blendMath';

export { sample, shuffle };

export interface Option {
  text?: string;
  color?: RGB;
  mono?: boolean;
}

export interface Question {
  type: 'choice' | 'switch';
  prompt: string;
  visual?: (el: HTMLElement) => void;
  options?: Option[];
  answer?: number;
  explain: string;
  retry?: boolean;
  after?: (el: HTMLElement) => void;
  // switch-specific:
  target?: RGB;
  levels?: number[];
  showTarget?: boolean;
  wide?: boolean;
}

export interface LessonRule {
  h: string;
  formula?: string;
  items: string[];
}

export interface Lesson {
  id: string;
  title: string;
  neutral?: RGB;
  rule?: LessonRule;
  gen: () => Question[];
  unit?: Unit;
}

export interface Unit {
  id: string;
  title: string;
  sub: string;
  color: string;
  desc: string;
  lessons: Lesson[];
}

/* Helper functions for question generation */
export function choice(
  prompt: string,
  visual: ((el: HTMLElement) => void) | null,
  correct: Option,
  wrongs: Option[],
  explain: string,
  extra: Partial<Question> = {}
): Question {
  const options = shuffle([correct, ...wrongs]);
  return {
    type: 'choice',
    prompt,
    visual: visual || undefined,
    options,
    answer: options.indexOf(correct),
    explain,
    ...extra,
  };
}

export function numWrongs(correct: number, cands: number[]): number[] {
  const out: number[] = [];
  const ok = (v: number) => Math.abs(v - correct) >= 8 && out.every((o) => Math.abs(o - v) >= 8);
  for (const c of cands) {
    const v = C(c);
    if (ok(v)) out.push(v);
    if (out.length === 3) break;
  }
  let t = 0;
  while (out.length < 3 && t++ < 200) {
    const v = C(correct + pick([-1, 1]) * R(14, 80));
    if (ok(v)) out.push(v);
  }
  return out;
}

export const numQ = (
  prompt: string,
  visual: ((el: HTMLElement) => void) | null,
  correct: number,
  cands: number[],
  explain: string
): Question =>
  choice(
    prompt,
    visual,
    { text: String(correct), mono: true },
    numWrongs(correct, cands).map((v) => ({ text: String(v), mono: true })),
    explain
  );

/* Visual rendering helpers */
export const H = (s: string) => (el: HTMLElement) => {
  el.innerHTML = s;
};

export const chips = (c: RGB): string =>
  c.map((v, i) => `<span class="chip"><i style="background:${CHC[i]}"></i>${CH[i]} ${v}</span>`).join('');

export const sw = (c: RGB, label?: string, show = true): string =>
  `<div class="sw"><div style="background:${css(c)}"></div>${label ? `<span>${label}</span>` : ''}${
    show ? `<b>${c[0] === c[1] && c[1] === c[2] ? c[0] : c.join(' · ')}</b>` : ''
  }</div>`;

export const calcVis = (a: number, b: number, mode: string) =>
  H(
    `${sw(g3(a), '아래 레이어')}<div class="op">${
      mode === 'normal' ? '모드 ?' : mName(mode)
    }<b>→</b></div>${sw(g3(b), '위 레이어')}<div class="op">=<b>?</b></div>`
  );

export const pairVis = (base: RGB, top: RGB, mode?: string) =>
  H(`${sw(base, '아래')}<div class="op">${mode ? mName(mode) : ''}<b>+</b></div>${sw(top, '위')}`);

export const info = (c: RGB, t = '정보 패널 · 회색 카드'): string =>
  `<div class="info"><span class="h">${t}</span><span style="color:var(--r)">R</span><span>${c[0]}</span><span style="color:var(--g)">G</span><span>${c[1]}</span><span style="color:var(--b)">B</span><span>${c[2]}</span></div>`;

export function canvasFrom(
  w: number,
  h: number,
  fn: (x: number, y: number) => RGB,
  label?: string
): HTMLElement {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d')!;
  const im = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = fn(x, y);
      const i = (y * w + x) * 4;
      im.data[i] = c[0];
      im.data[i + 1] = c[1];
      im.data[i + 2] = c[2];
      im.data[i + 3] = 255;
    }
  }
  ctx.putImageData(im, 0, 0);
  const wrap = document.createElement('div');
  wrap.className = 'cv';
  wrap.appendChild(cv);
  if (label) {
    const s = document.createElement('span');
    s.textContent = label;
    wrap.appendChild(s);
  }
  return wrap;
}

/* Mode discrimination canvases */
export const MW = 150;
export const MH = 104;
export const basePx = (x: number, y: number): RGB => hsl((x / MW) * 360, 0.75, 0.86 - (y / MH) * 0.72).map(C) as RGB;
export const stripePx = (col: RGB) => (x: number): RGB =>
  ([[0, 0, 0], [128, 128, 128], [255, 255, 255], col] as RGB[])[Math.min(3, Math.floor((x / MW) * 4))];

export function modeVis(mode: string, col: RGB) {
  return (el: HTMLElement) => {
    el.innerHTML = '';
    const sp = stripePx(col);
    el.append(
      canvasFrom(MW, MH, basePx, '아래'),
      canvasFrom(MW, MH, (x) => sp(x), '위: 검정 · 회색 · 흰색 · 색'),
      canvasFrom(MW, MH, (x, y) => blend(mode, basePx(x, y), sp(x)), '결과')
    );
  };
}

/* Color cast scene canvas */
export const SW = 230;
export const SH = 144;
export function scenePx(x: number, y: number): RGB {
  if (x > 78 && x < 152 && y > 54 && y < 112) {
    if (x < 83 || x > 147 || y < 59 || y > 107) return [240, 240, 240];
    return [128, 128, 128];
  }
  if (x > 160 && x < 186 && y > 70 && y < 96) return [235, 235, 235];
  if (x > 44 && x < 70 && y > 70 && y < 96) return [22, 22, 22];
  if (y < SH * 0.55) {
    const t = y / (SH * 0.55);
    return [110 + t * 95, 160 + t * 65, 225 + t * 20];
  }
  const t = (y - SH * 0.55) / (SH * 0.45);
  return [150 - t * 60, 138 - t * 58, 118 - t * 52];
}

export const sceneEl = (card: RGB, label?: string): HTMLElement => {
  const k = card.map((v) => v / 128);
  return canvasFrom(SW, SH, (x, y) => scenePx(x, y).map((v, i) => C(v * k[i])) as RGB, label);
};

export const sceneVis = (card: RGB) => (el: HTMLElement) => {
  el.innerHTML = '';
  el.append(sceneEl(card, '가운데 = 원래 중립 회색이어야 할 카드'));
  el.insertAdjacentHTML('beforeend', info(card));
};

/* Color primitives & Cast dictionaries */
export const PRIM: { c: RGB; n: string }[] = [
  { c: [0, 0, 0], n: '검정' },
  { c: [255, 0, 0], n: '빨강' },
  { c: [0, 255, 0], n: '초록' },
  { c: [0, 0, 255], n: '파랑' },
  { c: [255, 255, 0], n: '노랑' },
  { c: [0, 255, 255], n: '시안' },
  { c: [255, 0, 255], n: '마젠타' },
  { c: [255, 255, 255], n: '흰색' },
];

export const LIGHT = ['빨강', '초록', '파랑'] as const;
export const onText = (c: RGB): string => {
  const on = c.map((v, i) => (v ? LIGHT[i] : null)).filter(Boolean);
  return on.length ? on.join(' + ') + ' 빛' : '켜진 빛 없음';
};

export const CASTS: Record<string, { ko: string; v: RGB }> = {
  red: { ko: '붉은 기', v: [1, 0, 0] },
  green: { ko: '초록 기', v: [0, 1, 0] },
  blue: { ko: '파란 기', v: [0, 0, 1] },
  cyan: { ko: '시안(청록) 기', v: [-1, 0, 0] },
  magenta: { ko: '마젠타(자주) 기', v: [0, -1, 0] },
  yellow: { ko: '노란 기', v: [0, 0, -1] },
};

export const CAST_KEYS = Object.keys(CASTS);

export const FIX: Record<string, string> = {
  red: 'Red 커브 내리기',
  cyan: 'Red 커브 올리기',
  green: 'Green 커브 내리기',
  magenta: 'Green 커브 올리기',
  blue: 'Blue 커브 내리기',
  yellow: 'Blue 커브 올리기',
};

export const SHIFT: Record<string, string> = {
  'Red 올리기': 'red',
  'Red 내리기': 'cyan',
  'Green 올리기': 'green',
  'Green 내리기': 'magenta',
  'Blue 올리기': 'blue',
  'Blue 내리기': 'yellow',
};

export const COMP: Record<string, string> = {
  red: 'cyan',
  green: 'magenta',
  blue: 'yellow',
  cyan: 'red',
  magenta: 'green',
  yellow: 'blue',
};

export const castCol: Record<string, RGB> = {
  red: [255, 0, 0],
  green: [0, 255, 0],
  blue: [0, 0, 255],
  cyan: [0, 255, 255],
  magenta: [255, 0, 255],
  yellow: [255, 255, 0],
};

export const castName: Record<string, string> = {
  red: '빨강',
  green: '초록',
  blue: '파랑',
  cyan: '시안',
  magenta: '마젠타',
  yellow: '노랑',
};

export function castVals(k: string, n = 128, d = R(16, 30)): RGB {
  const v = CASTS[k].v;
  const s = v.reduce((a, b) => a + b, 0);
  const side = Math.round(d / 3);
  return v.map((x) => (x ? n + x * d : n - s * side)) as RGB;
}

export const chanOf = (k: string): number => CASTS[k].v.findIndex((x) => x !== 0);

export function castExplain(k: string, c: RGB): string {
  const i = chanOf(k);
  const hi = CASTS[k].v[i] > 0;
  return hi
    ? `${CH[i]}만 혼자 높아요 (${c[i]}). 한 채널이 튀면 그 채널 색이 끼어 있는 것 → <b>${CASTS[k].ko}</b>.`
    : `${CH[i]}만 혼자 낮아요 (${c[i]}). 한 채널이 모자라면 그 채널의 <b>반대색</b>이 보임 → ${CHN[i]}의 반대 = <b>${castName[k]}</b>.`;
}

/* 9 Standard Practical Scenarios */
export interface Scenario {
  q: string;
  a: string;
  w: string[];
  e: string;
}

export const SCEN: Scenario[] = [
  {
    q: '흰 종이에 스캔한 선화를 채색 레이어 위에 올렸다. 흰 바탕은 사라지고 선만 남기려면?',
    a: 'multiply',
    w: ['screen', 'overlay', 'difference'],
    e: 'Multiply에서 흰색(255)은 ×1이라 사라지고, 검은 선은 ×0이라 그대로 남아요.',
  },
  {
    q: '검은 배경에 촬영된 불꽃 소스를 사진에 합성. 검은 부분만 없애려면?',
    a: 'screen',
    w: ['multiply', 'darken', 'color'],
    e: 'Screen의 중립색은 검정. 검은 배경은 사라지고 밝은 불꽃만 더해져요.',
  },
  {
    q: '두 장의 사진을 픽셀 단위로 정확히 겹쳐 맞추고 싶다. 확인용으로 위 레이어를?',
    a: 'difference',
    w: ['overlay', 'multiply', 'luminosity'],
    e: 'Difference는 같은 값끼리 0(검정)이 돼요. 화면이 새까매질수록 정렬이 맞은 것.',
  },
  {
    q: '50% 회색(128)으로 채운 레이어에 흰/검 브러시로 닷지·번을 하려 한다. 이 레이어의 모드는?',
    a: 'overlay',
    w: ['multiply', 'screen', 'normal'],
    e: 'Overlay의 중립색은 50% 회색. 회색 부분은 투명, 흰 붓질은 밝게, 검은 붓질은 어둡게.',
  },
  {
    q: '흑백 사진을 채색한다. 위 레이어에 칠한 색이 아래의 명암을 유지한 채 입혀지려면?',
    a: 'color',
    w: ['luminosity', 'multiply', 'screen'],
    e: 'Color는 아래의 밝기(광도)는 지키고 위의 색조·채도만 가져와요.',
  },
  {
    q: '샤프닝 레이어 때문에 경계에 색 테두리가 생긴다. 밝기에만 샤프닝이 걸리게 하려면?',
    a: 'luminosity',
    w: ['color', 'overlay', 'difference'],
    e: 'Luminosity는 위 레이어의 밝기만 쓰고 색은 아래 것을 유지해요. 색 번짐 없이 디테일만 남습니다.',
  },
  {
    q: '강한 빛 번짐 효과. 하이라이트가 하얗게 날아가도 상관없고 최대한 밝게 더하고 싶다.',
    a: 'linearDodge',
    w: ['screen', 'lighten', 'softLight'],
    e: 'Linear Dodge(Add)는 값을 그대로 더해요. Screen보다 세서 쉽게 255로 날아갑니다.',
  },
  {
    q: '두 이미지를 겹쳐 각 채널마다 더 어두운 값만 남기고 싶다.',
    a: 'darken',
    w: ['multiply', 'linearBurn', 'difference'],
    e: 'Darken = 채널별 min(아래, 위). Multiply는 둘을 곱해서 둘 다보다 어두워질 수 있어요.',
  },
  {
    q: '종이 질감 사진을 올려 톤을 아주 은은하게만 입히고 싶다 (대비가 세지면 안 됨).',
    a: 'softLight',
    w: ['hardLight', 'colorBurn', 'linearDodge'],
    e: 'Soft Light는 Overlay 계열 중 가장 약하게 작용해요. 은은한 질감·톤에 적합.',
  },
];

export const scenQ = (s: Scenario): Question =>
  choice(
    s.q,
    null,
    { text: mName(s.a) },
    s.w.map((m) => ({ text: mName(m) })),
    s.e
  );

/* 7 Units, 14 Lessons Definition */
export const UNITS: Unit[] = [
  {
    id: 'u1',
    title: '빛의 덧셈',
    sub: '가산혼합 RGB',
    color: '#d94a4a',
    desc: 'R·G·B 세 개의 빛을 섞어 색을 만든다',
    lessons: [
      {
        id: 'l1',
        title: '세 채널 켜고 끄기',
        rule: {
          h: 'RGB는 물감이 아니라 빛이다',
          items: [
            '각 채널은 0(꺼짐)부터 255(완전히 켜짐)까지의 빛의 양.',
            '빛은 더할수록 밝아진다. 빨강+초록 = <b>노랑</b>, 초록+파랑 = <b>시안</b>, 빨강+파랑 = <b>마젠타</b>.',
            '셋 다 켜면 흰색, 셋 다 끄면 검정.',
          ],
        },
        gen() {
          const qs: Question[] = [];
          sample(PRIM, 3).forEach((p) =>
            qs.push(
              choice(
                '이 값은 어떤 색일까?',
                H(chips(p.c)),
                { color: p.c, text: p.n },
                sample(
                  PRIM.filter((o) => o !== p),
                  3
                ).map((o) => ({ color: o.c, text: o.n })),
                `${onText(p.c)} → <b>${p.n}</b>. 빛은 더할수록 밝아져요.`
              )
            )
          );
          sample(
            PRIM.filter((p) => p.n !== '검정'),
            3
          ).forEach((p) =>
            qs.push({
              type: 'switch',
              prompt: `${p.n}을 만들어 보세요`,
              target: p.c,
              levels: [0, 255],
              explain: `${p.n} = ${onText(p.c)}.`,
            })
          );
          return shuffle(qs);
        },
      },
      {
        id: 'l2',
        title: '중간값과 치우침',
        rule: {
          h: '세 값이 같으면 회색',
          items: [
            'R = G = B 이면 어떤 숫자든 <b>무채색</b>(검정~회색~흰색).',
            '128은 "반쯤 켜진 빛". 255,128,0 = 빨강 가득 + 초록 반 = <b>주황</b>.',
            '한 채널만 튀면 그 색 기운, 한 채널만 모자라면 그 <b>반대색</b> 기운이 생긴다.',
          ],
        },
        gen() {
          const T: { c: RGB; n: string }[] = [
            { c: [255, 128, 0], n: '주황' },
            { c: [255, 128, 128], n: '분홍' },
            { c: [128, 0, 255], n: '보라' },
            { c: [128, 128, 128], n: '중간 회색' },
            { c: [0, 128, 255], n: '하늘색' },
            { c: [128, 0, 0], n: '어두운 빨강' },
            { c: [255, 255, 128], n: '연노랑' },
            { c: [128, 255, 0], n: '연두' },
          ];
          const desc = (c: RGB) =>
            c.map((v, i) => `${CH[i]} ${v === 255 ? '가득' : v === 128 ? '반' : '끔'}`).join(', ');
          const qs: Question[] = sample(T, 3).map((t) => ({
            type: 'switch',
            prompt: `${t.n}을 만들어 보세요`,
            showTarget: true,
            target: t.c,
            levels: [0, 128, 255],
            explain: `${t.n} = ${desc(t.c)}.`,
          }));
          sample(CAST_KEYS, 3).forEach((k) => {
            const c = castVals(k, R(110, 170));
            qs.push(
              choice(
                '이 회색은 어느 쪽으로 치우쳐 있을까?',
                H(chips(c)),
                { text: CASTS[k].ko },
                sample(
                  CAST_KEYS.filter((o) => o !== k),
                  3
                ).map((o) => ({ text: CASTS[o].ko })),
                castExplain(k, c)
              )
            );
          });
          const v = R(60, 200);
          qs.push(
            choice(
              '이 값은 어떤 색일까?',
              H(chips(g3(v))),
              { text: '치우침 없는 회색' },
              sample(CAST_KEYS, 3).map((o) => ({ text: CASTS[o].ko })),
              `세 값이 모두 ${v}로 같아요 → 무채색 회색.`
            )
          );
          return shuffle(qs);
        },
      },
      {
        id: 'l3',
        title: '반대색(보색) 짝',
        rule: {
          h: '채널 하나를 내리면 반대색이 나온다',
          items: [
            '빨강 ↔ <b>시안</b>, 초록 ↔ <b>마젠타</b>, 파랑 ↔ <b>노랑</b>.',
            '이유: 흰색(255,255,255)에서 Blue를 빼면 R+G만 남는다 = 노랑.',
            '그래서 노란 기를 빼려면 Blue를 <b>올리면</b> 된다.',
          ],
        },
        gen() {
          const qs: Question[] = [];
          sample(Object.keys(SHIFT), 2).forEach((a) => {
            const k = SHIFT[a];
            qs.push(
              choice(
                `커브에서 <b>${a}</b>. 이미지 전체는 어느 쪽으로 기울까?`,
                null,
                { text: CASTS[k].ko },
                sample(
                  CAST_KEYS.filter((o) => o !== k),
                  3
                ).map((o) => ({ text: CASTS[o].ko })),
                `${a.split(' ')[0]} 채널을 ${
                  a.includes('올') ? '올리면 그 색이 늘어나요' : '내리면 그 반대색이 드러나요'
                } → <b>${CASTS[k].ko}</b>.`
              )
            );
          });
          sample(CAST_KEYS, 2).forEach((k) =>
            qs.push(
              choice(
                `사진에 <b>${CASTS[k].ko}</b>가 돈다. 채널 하나만 만진다면?`,
                null,
                { text: FIX[k] },
                sample(
                  Object.values(FIX).filter((f) => f !== FIX[k]),
                  3
                ).map((t) => ({ text: t })),
                `${CASTS[k].ko}의 반대 방향으로 움직여요 → <b>${FIX[k]}</b>.`
              )
            )
          );
          sample(CAST_KEYS, 2).forEach((k) => {
            const o = COMP[k];
            qs.push(
              choice(
                `<b>${castName[k]}</b>의 반대색은?`,
                H(sw(castCol[k], castName[k], false)),
                { color: castCol[o], text: castName[o] },
                sample(
                  CAST_KEYS.filter((x) => x !== o && x !== k),
                  3
                ).map((x) => ({ color: castCol[x], text: castName[x] })),
                `${castName[k]} + ${castName[o]} = 흰색. 세 채널을 꽉 채우는 짝이 반대색이에요.`
              )
            );
          });
          return shuffle(qs);
        },
      },
    ],
  },
  {
    id: 'u2',
    title: '채널로 색 보정',
    sub: '커브와 정보 패널',
    color: '#d9a13a',
    desc: '눈 대신 숫자로 캐스트를 읽고 고친다',
    lessons: [
      {
        id: 'l4',
        title: '캐스트 읽기',
        rule: {
          h: '회색이어야 할 곳의 숫자를 본다',
          items: [
            '모니터와 눈은 금방 적응한다. 판단은 <b>정보 패널 숫자</b>로.',
            '원래 무채색이어야 할 곳(회색 카드, 흰 벽, 아스팔트)에 스포이드를 찍는다.',
            '가장 튀는 채널 하나를 찾으면 캐스트가 보인다.',
          ],
        },
        gen() {
          const qs: Question[] = sample(CAST_KEYS, 4).map((k) => {
            const c = castVals(k);
            return choice(
              '이 사진에는 어떤 캐스트가 있을까?',
              sceneVis(c),
              { text: CASTS[k].ko },
              sample(
                CAST_KEYS.filter((o) => o !== k),
                3
              ).map((o) => ({ text: CASTS[o].ko })),
              castExplain(k, c)
            );
          });
          qs.push(
            choice(
              '캐스트를 판단할 때 스포이드를 어디에 찍어야 할까?',
              null,
              { text: '원래 회색·흰색이어야 할 곳' },
              [{ text: '채도가 가장 높은 곳' }, { text: '가장 넓은 영역(하늘 등)' }, { text: '사진의 정중앙' }],
              '원래 R=G=B여야 하는 곳이라야 어긋난 만큼이 곧 캐스트예요. 하늘처럼 원래 색이 있는 곳은 기준이 될 수 없어요.'
            )
          );
          return shuffle(qs);
        },
      },
      {
        id: 'l5',
        title: '커브로 중립 맞추기',
        rule: {
          h: '튀는 채널을 나머지 둘에 맞춘다',
          items: [
            '회색 카드가 R 150 · G 128 · B 128 이면 Red 커브에서 입력 150을 <b>출력 128</b>로.',
            '모자란 채널이면 반대로 올린다.',
            '목표는 R = G = B. 숫자가 같아지면 끝.',
          ],
        },
        gen() {
          const qs: Question[] = sample(CAST_KEYS, 3).map((k) => {
            const c = castVals(k);
            return choice(
              '이 사진을 바로잡는 가장 직접적인 방법은?',
              sceneVis(c),
              { text: FIX[k] },
              sample(
                Object.values(FIX).filter((f) => f !== FIX[k]),
                3
              ).map((t) => ({ text: t })),
              castExplain(k, c) + ` 그래서 <b>${FIX[k]}</b>.`,
              {
                after: (el) => {
                  el.append(sceneEl(c, '전'), sceneEl([128, 128, 128], '후'));
                },
              }
            );
          });
          sample(CAST_KEYS, 3).forEach((k) => {
            const n = R(100, 160);
            const c = castVals(k, n);
            const i = chanOf(k);
            const tgt = c[(i + 1) % 3];
            qs.push(
              numQ(
                `회색 카드를 중립으로 만들려면 <b>${CHN[i]}</b> 커브에서 입력 ${c[i]}을 출력 몇으로?`,
                H(info(c)),
                tgt,
                [c[i], 2 * tgt - c[i], n, Math.round((c[0] + c[1] + c[2]) / 3)],
                `나머지 두 채널이 ${tgt}로 같아요. ${CH[i]}도 ${tgt}로 맞추면 R=G=B.`
              )
            );
          });
          return shuffle(qs);
        },
      },
    ],
  },
  {
    id: 'u3',
    title: '어둡게 그룹',
    sub: 'Multiply · Darken · Burn',
    color: '#9c6bd6',
    desc: '흰색이 사라지는 모드들',
    lessons: [
      {
        id: 'l6',
        title: 'Multiply',
        neutral: [255, 255, 255],
        rule: {
          h: 'Multiply = 두 값을 곱한다',
          formula: '결과 = 아래 × 위 ÷ 255',
          items: [
            '0~1로 보면 그냥 곱셈. 1(흰색)을 곱하면 그대로, 0(검정)을 곱하면 0.',
            '1보다 작은 수끼리 곱하니까 결과는 <b>항상 둘 중 어두운 쪽 이하</b>.',
            '채널별로 따로 계산한다.',
          ],
        },
        gen() {
          const qs: Question[] = [];
          for (let i = 0; i < 3; i++) {
            const a = R5(80, 250);
            const b = R5(60, 240);
            const r = b1('multiply', a, b);
            qs.push(
              numQ(
                'Multiply 결과는?',
                calcVis(a, b, 'multiply'),
                r,
                [Math.min(a, b), b1('linearBurn', a, b), b1('screen', a, b), (a + b) / 2],
                `<span class="formula">${a} × ${b} ÷ 255 ≈ ${r}</span><br>둘 중 어두운 ${Math.min(
                  a,
                  b
                )}보다도 어두워졌죠.`
              )
            );
          }
          qs.push(
            choice(
              'Multiply 레이어에서 칠해도 아무 변화가 없는 색은?',
              null,
              { color: [255, 255, 255], text: '흰색' },
              [
                { color: [0, 0, 0], text: '검정' },
                { color: [128, 128, 128], text: '50% 회색' },
                { color: [255, 0, 0], text: '빨강' },
              ],
              '흰색은 255 ÷ 255 = 1. 1을 곱하면 그대로라 흰색이 Multiply의 중립색이에요.'
            )
          );
          const base: RGB = [R5(150, 240), R5(120, 220), R5(60, 200)];
          const top: RGB = [R5(80, 200), R5(140, 240), R5(160, 250)];
          const m = blend('multiply', base, top);
          qs.push(
            choice(
              'Multiply 결과로 맞는 색은?',
              pairVis(base, top, 'multiply'),
              { color: m, text: m.join(' · ') },
              (() => {
                const seen = [String(m)];
                const o: Option[] = [];
                for (const x of shuffle([
                  'screen',
                  'lighten',
                  'normal',
                  'darken',
                  'overlay',
                  'linearBurn',
                  'difference',
                ])) {
                  const c = blend(x, base, top);
                  if (!seen.includes(String(c))) {
                    seen.push(String(c));
                    o.push({ color: c, text: c.join(' · ') });
                  }
                  if (o.length === 3) break;
                }
                return o;
              })(),
              `채널마다 곱하기: ${m
                .map((v, i) => `${CH[i]} ${base[i]}×${top[i]}÷255≈${v}`)
                .join(', ')}. 세 채널 모두 원래보다 어두워요.`
            )
          );
          qs.push(scenQ(SCEN[0]));
          return shuffle(qs);
        },
      },
      {
        id: 'l7',
        title: 'Darken · Burn',
        neutral: [255, 255, 255],
        rule: {
          h: '같은 "어둡게"도 계산이 다르다',
          formula: 'Darken = min(아래, 위)   Linear Burn = 아래 + 위 − 255',
          items: [
            '<b>Darken</b>: 채널별로 더 어두운 값을 고른다. 채널마다 따로 고르니 <b>두 색 어디에도 없던 색</b>이 나올 수 있다.',
            '<b>Linear Burn</b>: 더하고 255를 뺀다. Multiply보다 어둡다.',
            '<b>Color Burn</b>: 위가 어두울수록 대비를 세게 올리며 어둡게.',
          ],
        },
        gen() {
          const qs: Question[] = [];
          const base: RGB = [R5(170, 240), R5(30, 90), R5(90, 160)];
          const top: RGB = [R5(60, 130), R5(150, 230), R5(40, 110)];
          const d = blend('darken', base, top);
          qs.push(
            choice(
              'Darken 결과로 맞는 색은?',
              pairVis(base, top, 'darken'),
              { color: d, text: d.join(' · ') },
              [
                { color: base, text: base.join(' · ') + ' (아래 그대로)' },
                { color: top, text: top.join(' · ') + ' (위 그대로)' },
                ((c) => ({ color: c, text: c.join(' · ') }))(blend('multiply', base, top)),
              ],
              `채널마다 작은 값을 골라요: ${d
                .map((v, i) => `${CH[i]} min(${base[i]}, ${top[i]}) = ${v}`)
                .join(', ')}. 어느 레이어와도 다른 새 색이죠.`
            )
          );
          for (let i = 0; i < 2; i++) {
            const a = R5(150, 250);
            const b = R5(130, 240);
            const r = b1('linearBurn', a, b);
            qs.push(
              numQ(
                'Linear Burn 결과는?',
                calcVis(a, b, 'linearBurn'),
                r,
                [b1('multiply', a, b), Math.min(a, b), a + b - 200],
                `<span class="formula">${a} + ${b} − 255 = ${r}</span>`
              )
            );
          }
          {
            const a = R5(70, 240);
            const b = R5(70, 240);
            const r = b1('darken', a, b);
            qs.push(
              numQ(
                'Darken 결과는?',
                calcVis(a, b, 'darken'),
                r,
                [b1('multiply', a, b), Math.max(a, b), (a + b) / 2],
                `더 어두운 값을 그대로 고를 뿐: min(${a}, ${b}) = ${r}.`
              )
            );
          }
          {
            let a = 0;
            let b = 0;
            let vals: [string, number][] = [];
            let t = 0;
            do {
              a = R5(120, 230);
              b = R5(120, 230);
              vals = ['darken', 'multiply', 'linearBurn', 'colorBurn'].map((m) => [m, b1(m, a, b)]);
              vals.sort((x, y) => x[1] - y[1]);
              t++;
            } while (vals[1][1] - vals[0][1] < 6 && t < 50);
            qs.push(
              choice(
                `아래 ${a}, 위 ${b}일 때 <b>가장 어두운</b> 결과를 내는 모드는?`,
                calcVis(a, b, 'normal'),
                { text: mName(vals[0][0]) },
                vals.slice(1).map((v) => ({ text: mName(v[0]) })),
                '계산해 보면: ' + vals.map((v) => `${mName(v[0])} ${v[1]}`).join(', ') + '.'
              )
            );
          }
          qs.push(scenQ(SCEN[7]));
          return shuffle(qs);
        },
      },
    ],
  },
  {
    id: 'u4',
    title: '밝게 그룹',
    sub: 'Screen · Lighten · Dodge',
    color: '#3fa6c9',
    desc: '검정이 사라지는 모드들',
    lessons: [
      {
        id: 'l8',
        title: 'Screen',
        neutral: [0, 0, 0],
        rule: {
          h: 'Screen = 뒤집어서 곱하고 다시 뒤집기',
          formula: '결과 = 255 − (255−아래)(255−위) ÷ 255',
          items: [
            'Multiply의 거울. 두 슬라이드 필름을 겹쳐 비추는 것과 같다.',
            '검정(0)은 중립: 검정을 올려도 변화 없음.',
            '결과는 <b>항상 둘 중 밝은 쪽 이상</b>.',
          ],
        },
        gen() {
          const qs: Question[] = [];
          for (let i = 0; i < 3; i++) {
            const a = R5(30, 200);
            const b = R5(40, 210);
            const r = b1('screen', a, b);
            qs.push(
              numQ(
                'Screen 결과는?',
                calcVis(a, b, 'screen'),
                r,
                [Math.max(a, b), Math.min(255, a + b), b1('multiply', a, b), (a + b) / 2],
                `<span class="formula">255 − (${255 - a} × ${255 - b} ÷ 255) ≈ ${r}</span><br>밝은 쪽 ${Math.max(
                  a,
                  b
                )}보다 더 밝아졌어요.`
              )
            );
          }
          qs.push(
            choice(
              'Screen 레이어에서 칠해도 아무 변화가 없는 색은?',
              null,
              { color: [0, 0, 0], text: '검정' },
              [
                { color: [255, 255, 255], text: '흰색' },
                { color: [128, 128, 128], text: '50% 회색' },
                { color: [0, 0, 255], text: '파랑' },
              ],
              '뒤집으면 검정은 1(흰색)이 되고, 1을 곱하니 변화가 없어요.'
            )
          );
          qs.push(
            choice(
              'Screen 결과는 두 값 중 밝은 쪽과 비교하면?',
              null,
              { text: '같거나 더 밝다' },
              [{ text: '항상 더 어둡다' }, { text: '정확히 중간' }, { text: '경우에 따라 어두워질 수도 있다' }],
              'Screen은 절대 어두워지지 않아요. 그래서 밝게 그룹.'
            )
          );
          qs.push(scenQ(SCEN[1]));
          return shuffle(qs);
        },
      },
      {
        id: 'l9',
        title: 'Lighten · Dodge',
        neutral: [0, 0, 0],
        rule: {
          h: '밝게 하는 방식도 세 가지',
          formula: 'Lighten = max(아래, 위)   Linear Dodge = 아래 + 위',
          items: [
            '<b>Lighten</b>: 채널별로 더 밝은 값을 고른다.',
            '<b>Linear Dodge (Add)</b>: 그냥 더한다. 255를 넘으면 하얗게 날아간다.',
            '<b>Color Dodge</b>: 위가 밝을수록 아래를 강하게 밝힌다. 대비가 크다.',
          ],
        },
        gen() {
          const qs: Question[] = [];
          for (let i = 0; i < 2; i++) {
            const a = R5(40, 170);
            const b = R5(30, 150);
            const r = b1('linearDodge', a, b);
            qs.push(
              numQ(
                'Linear Dodge (Add) 결과는?',
                calcVis(a, b, 'linearDodge'),
                r,
                [b1('screen', a, b), Math.max(a, b), a + b - 40],
                `<span class="formula">${a} + ${b} = ${a + b}${a + b > 255 ? ' → 255에서 잘림' : ''}</span>`
              )
            );
          }
          {
            const a = R5(40, 220);
            const b = R5(40, 220);
            const r = b1('lighten', a, b);
            qs.push(
              numQ(
                'Lighten 결과는?',
                calcVis(a, b, 'lighten'),
                r,
                [b1('screen', a, b), Math.min(a, b), (a + b) / 2],
                `max(${a}, ${b}) = ${r}.`
              )
            );
          }
          {
            let a = 0;
            let b = 0;
            let vals: [string, number][] = [];
            let t = 0;
            do {
              a = R5(40, 150);
              b = R5(40, 150);
              vals = ['lighten', 'screen', 'linearDodge', 'colorDodge'].map((m) => [m, b1(m, a, b)]);
              vals.sort((x, y) => y[1] - x[1]);
              t++;
            } while (vals[0][1] - vals[1][1] < 6 && t < 50);
            qs.push(
              choice(
                `아래 ${a}, 위 ${b}일 때 <b>가장 밝은</b> 결과를 내는 모드는?`,
                calcVis(a, b, 'normal'),
                { text: mName(vals[0][0]) },
                vals.slice(1).map((v) => ({ text: mName(v[0]) })),
                '계산해 보면: ' + vals.map((v) => `${mName(v[0])} ${v[1]}`).join(', ') + '.'
              )
            );
          }
          qs.push(scenQ(SCEN[6]));
          qs.push(
            choice(
              'Screen과 Linear Dodge(Add) 중 하이라이트가 더 쉽게 하얗게 날아가는 쪽은?',
              null,
              { text: 'Linear Dodge (Add)' },
              [{ text: 'Screen' }, { text: '둘이 똑같다' }, { text: 'Lighten' }],
              'Add는 단순 덧셈이라 128+128만 돼도 255. Screen은 같은 조건에서 192 정도에 머물러요.'
            )
          );
          return shuffle(qs);
        },
      },
    ],
  },
  {
    id: 'u5',
    title: '대비 그룹',
    sub: 'Overlay · Soft · Hard Light',
    color: '#4fae6a',
    desc: '50% 회색이 사라지는 모드들',
    lessons: [
      {
        id: 'l10',
        title: 'Overlay 계열',
        neutral: [128, 128, 128],
        rule: {
          h: '아래가 어두우면 Multiply, 밝으면 Screen',
          formula:
            '아래 < 128 :  2 × 아래 × 위 ÷ 255\n아래 ≥ 128 :  255 − 2(255−아래)(255−위) ÷ 255',
          items: [
            'Overlay는 <b>아래 레이어</b> 밝기로 곱하기/스크린을 고른다. 그래서 대비가 커진다.',
            '<b>Hard Light</b>는 같은 식을 <b>위 레이어</b> 기준으로. (레이어 순서를 바꾼 Overlay)',
            '<b>Soft Light</b>는 같은 방향이지만 훨씬 약하다. 중립색은 셋 다 50% 회색.',
          ],
        },
        gen() {
          const qs: Question[] = [];
          for (let i = 0; i < 3; i++) {
            const a = i === 0 ? R5(30, 115) : R5(140, 230);
            const b = R5(40, 220);
            const r = b1('overlay', a, b);
            const lo = a < 128;
            qs.push(
              numQ(
                'Overlay 결과는?',
                calcVis(a, b, 'overlay'),
                r,
                [b1('multiply', a, b), b1('screen', a, b), b1('hardLight', a, b), b1('softLight', a, b)],
                `아래 ${a}는 128${
                  lo ? '보다 어두움 → 곱하기 쪽' : ' 이상 → 스크린 쪽'
                }.<br><span class="formula">${
                  lo
                    ? `2 × ${a} × ${b} ÷ 255 ≈ ${r}`
                    : `255 − 2 × ${255 - a} × ${255 - b} ÷ 255 ≈ ${r}`
                }</span>`
              )
            );
          }
          qs.push(
            choice(
              'Overlay 레이어에서 아무 변화가 없는 색은?',
              null,
              { color: [128, 128, 128], text: '50% 회색' },
              [
                { color: [255, 255, 255], text: '흰색' },
                { color: [0, 0, 0], text: '검정' },
                { color: [255, 128, 0], text: '주황' },
              ],
              '128을 넣으면 2 × a × 128 ÷ 255 ≈ a. 그대로예요.'
            )
          );
          qs.push(
            choice(
              'Overlay와 Hard Light의 차이는?',
              null,
              { text: '곱하기/스크린을 고르는 기준이 아래냐 위냐' },
              [
                { text: 'Hard Light가 항상 더 어둡다' },
                { text: '중립색이 다르다' },
                { text: 'Hard Light는 채널을 따로 계산하지 않는다' },
              ],
              '식은 같고 기준만 달라요. Overlay = 아래 밝기 기준, Hard Light = 위 밝기 기준.'
            )
          );
          qs.push(
            choice(
              '50% 회색 Overlay 레이어에 흰 브러시로 칠하면 그 부분은?',
              null,
              { text: '밝아진다 (닷지)' },
              [{ text: '어두워진다 (번)' }, { text: '아무 변화 없다' }, { text: '색이 반전된다' }],
              '128보다 밝은 위 값은 아래를 밝게 밀어요. 검은 브러시는 반대로 번.'
            )
          );
          qs.push(scenQ(SCEN[3]));
          return shuffle(qs);
        },
      },
    ],
  },
  {
    id: 'u6',
    title: '비교와 성분',
    sub: 'Difference · Color · Luminosity',
    color: '#c9579a',
    desc: '빼기, 그리고 색과 밝기 분리',
    lessons: [
      {
        id: 'l11',
        title: 'Difference',
        neutral: [0, 0, 0],
        rule: {
          h: 'Difference = 두 값의 차이',
          formula: '결과 = | 아래 − 위 |',
          items: [
            '같은 값이면 0(검정). 정렬 확인에 쓴다.',
            '검정은 중립, <b>흰색은 반전</b>(255 − 아래).',
            'Exclusion은 비슷하지만 중간 톤에서 대비가 낮다.',
          ],
        },
        gen() {
          const qs: Question[] = [];
          for (let i = 0; i < 3; i++) {
            const a = R5(20, 240);
            const b = R5(20, 240);
            const r = b1('difference', a, b);
            qs.push(
              numQ(
                'Difference 결과는?',
                calcVis(a, b, 'difference'),
                r,
                [255 - r, Math.min(a, b), b1('exclusion', a, b), (a + b) / 2],
                `<span class="formula">| ${a} − ${b} | = ${r}</span>`
              )
            );
          }
          const c: RGB = [R5(30, 220), R5(30, 220), R5(30, 220)];
          const inv: RGB = c.map((v) => 255 - v) as RGB;
          qs.push(
            choice(
              '흰색 레이어를 Difference로 올리면 결과는?',
              H(sw(c, '아래') + '<div class="op">Difference<b>+</b></div>' + sw([255, 255, 255], '위')),
              { color: inv, text: inv.join(' · ') + ' (반전)' },
              [
                { color: c, text: c.join(' · ') + ' (그대로)' },
                { color: [0, 0, 0], text: '검정' },
                { color: [255, 255, 255], text: '흰색' },
              ],
              '|아래 − 255| = 255 − 아래. 채널마다 뒤집히니 반전(보색)이에요.'
            )
          );
          qs.push(
            choice(
              '똑같은 레이어 두 장을 Difference로 겹치면?',
              null,
              { color: [0, 0, 0], text: '완전히 검정' },
              [
                { color: [255, 255, 255], text: '완전히 흰색' },
                { color: [128, 128, 128], text: '50% 회색' },
                { text: '원본 그대로' },
              ],
              '모든 픽셀에서 차이가 0 → 검정.'
            )
          );
          qs.push(scenQ(SCEN[2]));
          return shuffle(qs);
        },
      },
      {
        id: 'l12',
        title: 'Color · Luminosity',
        rule: {
          h: '색과 밝기를 나눠서 가져온다',
          formula: '광도 ≈ 0.30 R + 0.59 G + 0.11 B',
          items: [
            '<b>Color</b>: 아래의 밝기 + 위의 색조·채도.',
            '<b>Luminosity</b>: 아래의 색조·채도 + 위의 밝기.',
            '눈은 초록에 가장 민감하고 파랑에 가장 둔하다. 그래서 순수 파랑은 생각보다 어둡다.',
          ],
        },
        gen() {
          const qs: Question[] = [];
          const P: { c: RGB; n: string }[] = [
            { c: [255, 0, 0], n: '빨강' },
            { c: [0, 255, 0], n: '초록' },
            { c: [0, 0, 255], n: '파랑' },
            { c: [255, 255, 0], n: '노랑' },
            { c: [0, 255, 255], n: '시안' },
            { c: [255, 0, 255], n: '마젠타' },
          ];
          for (const dir of ['밝게', '어둡게']) {
            let s: { c: RGB; n: string; l: number }[] = [];
            let t = 0;
            do {
              s = sample(P, 4).map((p) => ({ ...p, l: Math.round(lum(p.c)) }));
              s.sort((a, b) => (dir === '밝게' ? b.l - a.l : a.l - b.l));
              t++;
            } while (Math.abs(s[0].l - s[1].l) < 15 && t < 50);
            qs.push(
              choice(
                `그레이스케일로 바꾸면 가장 <b>${dir}</b> 남는 색은?`,
                null,
                { color: s[0].c, text: s[0].n },
                s.slice(1).map((p) => ({ color: p.c, text: p.n })),
                '광도로 계산: ' + s.map((p) => `${p.n} ${p.l}`).join(', ') + '.'
              )
            );
          }
          {
            const base = hsl(R(0, 359), 0.7, 0.35).map(C) as RGB;
            const top = hsl(R(0, 359), 0.85, 0.6).map(C) as RGB;
            const col = blend('color', base, top);
            const lu = blend('luminosity', base, top);
            qs.push(
              choice(
                'Color 모드 결과는 어느 쪽?',
                pairVis(base, top, 'color'),
                { color: col, text: 'A' },
                [
                  { color: lu, text: 'B' },
                  { color: blend('multiply', base, top), text: 'C' },
                  { color: blend('screen', base, top), text: 'D' },
                ],
                `Color는 아래의 밝기(광도 ${Math.round(lum(base))})를 지키면서 위의 색을 입혀요. 결과 광도 ≈ ${Math.round(
                  lum(col)
                )}.`
              )
            );
          }
          qs.push(scenQ(SCEN[4]));
          qs.push(scenQ(SCEN[5]));
          return shuffle(qs);
        },
      },
    ],
  },
  {
    id: 'u7',
    title: '실전',
    sub: '보고 판단하기',
    color: '#7f8cff',
    desc: '결과를 보고 모드를 역추적한다',
    lessons: [
      {
        id: 'l13',
        title: '모드 맞히기',
        rule: {
          h: '중립색 줄부터 본다',
          items: [
            '위 레이어는 검정 · 50% 회색 · 흰색 · 색, 네 줄.',
            '어느 줄 자리가 <b>그대로</b>인지 찾으면 중립색이 보이고, 중립색이 그룹을 알려준다.',
            '흰 줄 자리 그대로 → 어둡게 그룹, 검은 줄 그대로 → 밝게 그룹, 회색 줄 그대로 → 대비 그룹.',
          ],
        },
        gen() {
          const pool = [
            'multiply',
            'screen',
            'overlay',
            'darken',
            'lighten',
            'difference',
            'colorBurn',
            'linearDodge',
            'luminosity',
          ];
          const cols: RGB[] = [
            [230, 120, 40],
            [40, 140, 220],
            [200, 60, 170],
            [60, 190, 90],
          ];
          return sample(pool, 6).map((m) =>
            choice(
              '이 결과를 만든 블렌딩 모드는?',
              modeVis(m, pick(cols)),
              { text: mName(m) },
              sample(
                pool.filter((x) => x !== m),
                3
              ).map((x) => ({ text: mName(x) })),
              MODES[m].hint + (MODES[m].neutral !== '없음' ? ` (중립색: ${MODES[m].neutral})` : ''),
              { wide: true }
            )
          );
        },
      },
      {
        id: 'l14',
        title: '상황에 맞는 모드',
        rule: {
          h: '목적 → 중립색 → 모드',
          items: [
            '무엇을 <b>없애고</b> 싶은지 먼저 생각한다. 흰색이면 어둡게 그룹, 검정이면 밝게 그룹, 회색이면 대비 그룹.',
            '그 다음 세기를 고른다. 은은하게(Soft Light) ~ 강하게(Linear Dodge).',
          ],
        },
        gen() {
          return sample(SCEN, 6).map(scenQ);
        },
      },
    ],
  },
];

export const ALL: (Lesson & { unit: Unit })[] = UNITS.flatMap((u) =>
  u.lessons.map((l) => ({ ...l, unit: u }))
);

/* State & Storage Management */
export const STORAGE_KEY = 'chromashift-lessons-v1';

export interface AppState {
  done: Record<string, boolean>;
  xp: number;
  streak: number;
  last: string | null;
  dayXp: number;
  day: string | null;
}

export const todayStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

export function loadStoredState(): AppState {
  const initial: AppState = { done: {}, xp: 0, streak: 0, last: null, dayXp: 0, day: null };
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (s) return Object.assign(initial, s);
  } catch {
    // fallback gracefully
  }
  return initial;
}

export function saveState(s: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

export function getStreakNow(s: AppState): number {
  if (!s.last) return 0;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yd = `${y.getFullYear()}-${y.getMonth() + 1}-${y.getDate()}`;
  return s.last === todayStr() || s.last === yd ? s.streak : 0;
}

export const GOAL_XP = 30;
export const getDayXp = (s: AppState): number => (s.day === todayStr() ? s.dayXp : 0);
