import { ActiveModule } from '../components/Header';

export interface CurriculumStep {
  stepNumber: number;
  id: string;
  title: string;
  subTitle: string;
  moduleId: ActiveModule;
  theory: {
    summary: string;
    photoshopApplication: string;
    coreRule: string;
    colorAnalogy: string;
  };
  clearCriteria: {
    description: string;
    targetModule: ActiveModule;
    threshold: number; // e.g. Delta E <= 5.0 or channel delta <= 4
  };
}

export const CURRICULUM_STEPS: CurriculumStep[] = [
  {
    stepNumber: 1,
    id: 'step_1_primaries',
    title: '1단계: 빛의 1차색과 2차 가산혼합 기초',
    subTitle: 'Red, Green, Blue 조합으로 Yellow, Cyan, Magenta 만들기',
    moduleId: 'sculptor',
    theory: {
      summary: '모니터의 빛은 더할수록 밝아집니다. Red와 Green이 만나면 Yellow가 되고, Green과 Blue는 Cyan, Red와 Blue는 Magenta를 형성합니다.',
      photoshopApplication: 'Photoshop Curves에서 Red 곡선과 Green 곡선을 동시에 올리면 전체 톤에 깨끗한 옐로우 틴트가 생성됩니다.',
      coreRule: 'R + G = Yellow (255,255,0) | G + B = Cyan (0,255,255) | R + B = Magenta (255,0,255)',
      colorAnalogy: '물감과 달리 빛은 섞을수록 밝아져 R+G+B 모두 255가 되면 순백색(White)이 됩니다.',
    },
    clearCriteria: {
      description: '채널 조각가에서 색차 ΔE ≤ 8.0 달성하기',
      targetModule: 'sculptor',
      threshold: 8.0,
    },
  },
  {
    stepNumber: 2,
    id: 'step_2_complementary',
    title: '2단계: 보색 관계와 1축 컬러 캐스트 중화',
    subTitle: 'Cyan-Red, Magenta-Green, Yellow-Blue의 상관관계',
    moduleId: 'neutralizer',
    theory: {
      summary: '중립 회색의 절대 조건은 R = G = B 입니다. 특정 색조가 튈 때는 마주보는 보색 채널을 조작하여 중화합니다.',
      photoshopApplication: 'Color Balance(Ctrl+B) 및 Curves 개별 채널에서 Red의 반대는 Cyan, Green의 반대는 Magenta, Blue의 반대는 Yellow입니다.',
      coreRule: 'Red 왜곡 ➔ Red 내림 or Cyan(G+B) 올림 | Yellow 왜곡 ➔ Blue 올림 or R+G 내림',
      colorAnalogy: '시안(Cyan)은 사실 Green과 Blue 빛의 합이므로, Red를 낮추는 것은 Cyan을 올리는 것과 광학적으로 동일합니다.',
    },
    clearCriteria: {
      description: '커브 캐스트 중화에서 채널 불균형 편차 Δ ≤ 6 달성하기',
      targetModule: 'neutralizer',
      threshold: 6,
    },
  },
  {
    stepNumber: 3,
    id: 'step_3_curves_mastery',
    title: '3단계: 포토샵 커브(Curves) 미드톤 실무 보정',
    subTitle: '실제 촬영 환경(일몰, 그늘, 형광등)의 복합 왜곡 해결',
    moduleId: 'neutralizer',
    theory: {
      summary: '실무 사진은 섀도우·미드톤에 2개 이상의 채널 왜곡이 복합적으로 얽힙니다. 커브 좌표계의 128 미드톤 앵커 포인트를 상하로 이동해 채널별 출력을 맞춥니다.',
      photoshopApplication: 'Photoshop Curves(Ctrl+M)에서 회색 스포이드를 찍거나, 개별 채널(R, G, B)의 128 지점을 각각 중화 목표치로 재배치합니다.',
      coreRule: '불균형 편차 Max(|R-G|, |G-B|, |B-R|) ≤ 4 유지 ➔ 완벽한 18% 뉴트럴 그레이 달성',
      colorAnalogy: '노후 형광등 조명은 Green이 과다하므로 Green 채널을 끌어내려 피부톤의 마젠타 생기를 살려냅니다.',
    },
    clearCriteria: {
      description: '커브 캐스트 중화에서 완벽한 중립 회색(편차 Δ ≤ 4) 달성하기',
      targetModule: 'neutralizer',
      threshold: 4,
    },
  },
  {
    stepNumber: 4,
    id: 'step_4_blends_screen_add',
    title: '4단계: 블렌드 모드 연산 - Add vs Screen 발광 비교',
    subTitle: '단순 물리 가산(Add)과 클리핑 방지 발광(Screen)의 차이',
    moduleId: 'blends',
    theory: {
      summary: 'Linear Dodge(Add)는 A + B로 값을 더해 255를 빠르게 초과(화이트홀 클리핑)합니다. 반면 Screen은 255 - ((255-A)(255-B))/255 공식으로 부드럽게 밝아집니다.',
      photoshopApplication: '불꽃·레이저·스파크 같은 강력한 하이라이트는 Linear Dodge(Add), 안개·부드러운 빛·텍스처 중첩은 Screen 모드를 씁니다.',
      coreRule: 'Add: C = min(255, A + B) | Screen: C = 255 - ((255 - A) × (255 - B)) / 255',
      colorAnalogy: 'Screen은 두 장의 슬라이드를 겹쳐 영사하는 것과 같아 어떤 경우에도 255 이상으로 타지 않고 계조를 보존합니다.',
    },
    clearCriteria: {
      description: '블렌드 모드 예측 퀴즈 1회 이상 정답 맞히기',
      targetModule: 'blends',
      threshold: 1,
    },
  },
  {
    stepNumber: 5,
    id: 'step_5_lighten_decoder',
    title: '5단계: Lighten / Multiply 모드 및 리버스 엔지니어링',
    subTitle: '최댓값 선택(Lighten)과 합성 결과 분석 역추적',
    moduleId: 'decoder',
    theory: {
      summary: 'Lighten 모드는 덧셈을 하지 않고 max(A, B)로 각 채널 중 더 큰 값만 취합니다. Multiply는 (A×B)/255로 색이 겹칠수록 어두워지는 감산혼합입니다.',
      photoshopApplication: '별 궤적 사진 합성(Star trails)은 Lighten 모드의 대표적 활용처입니다. 레퍼런스 이미지를 분석할 때 클리핑 여부와 밝기 변화로 적용 모드를 파악합니다.',
      coreRule: 'Lighten: C = max(A, B) | Multiply: C = (A × B) / 255',
      colorAnalogy: '결과 채널이 상위 레이어보다 무조건 어두워졌다면 Multiply, 클리핑 없이 채널별 최댓값만 유지되었다면 Lighten 모드입니다.',
    },
    clearCriteria: {
      description: '블렌드 디코더 추리 문제 1회 이상 정답 맞히기',
      targetModule: 'decoder',
      threshold: 1,
    },
  },
  {
    stepNumber: 6,
    id: 'step_6_gamma_science',
    title: '6단계: sRGB 감마(2.2) vs 선형(Gamma 1.0) 컬러 사이언스',
    subTitle: '혼합 경계면의 어둡고 탁한 띠(Dirty Dark Band) 제거하기',
    moduleId: 'sculptor',
    theory: {
      summary: 'sRGB는 인간 지각에 맞춘 비선형(감마 2.2) 값입니다. 이를 단순 덧셈하면 물리적 광량보다 30% 어두워져 Red와 Green의 경계에 칙칙한 검붉은 띠가 생깁니다.',
      photoshopApplication: 'Photoshop Edit > Color Settings > More Options > [Blend RGB Colors Using Gamma 1.0] 옵션을 켜면 선형 광량 공간에서 깨끗하게 발광 블렌딩됩니다.',
      coreRule: '선형화 V_lin = (V/255)^2.2 ➔ 선형 가산 ➔ 디스플레이 재인코딩 V_out = (V_lin)^(1/2.2) × 255',
      colorAnalogy: '실제 현실의 빛은 선형(Gamma 1.0)으로 중첩되므로 감마 1.0 모드를 켜면 에너지 보존 법칙이 지켜져 투명하고 환한 옐로우/시안이 나옵니다.',
    },
    clearCriteria: {
      description: '감마 1.0 선형 모드를 켜고 채널 조각가에서 ΔE ≤ 5.0 달성하기',
      targetModule: 'sculptor',
      threshold: 5.0,
    },
  },
];

export interface UserProgressData {
  completedSteps: number[]; // e.g. [1, 2]
  totalQuestionsSolved: number;
  totalCorrect: number;
  moduleAttempts: {
    sculptor: number;
    neutralizer: number;
    blends: number;
    decoder: number;
  };
  moduleSuccesses: {
    sculptor: number;
    neutralizer: number;
    blends: number;
    decoder: number;
  };
  recentHistory: {
    id: string;
    timestamp: number;
    moduleId: ActiveModule;
    moduleNameKo: string;
    score: number;
    metricLabel: string;
    metricValue: string;
    success: boolean;
  }[];
}

export const INITIAL_USER_PROGRESS: UserProgressData = {
  completedSteps: [],
  totalQuestionsSolved: 0,
  totalCorrect: 0,
  moduleAttempts: { sculptor: 0, neutralizer: 0, blends: 0, decoder: 0 },
  moduleSuccesses: { sculptor: 0, neutralizer: 0, blends: 0, decoder: 0 },
  recentHistory: [],
};
