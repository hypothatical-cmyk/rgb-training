import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle2, XCircle, ArrowRight, Search, ShieldCheck } from 'lucide-react';
import { RGB, BlendMode, BLEND_MODES, blendColors, rgbToHex } from '../types/color';

interface ModuleBlendDecoderProps {
  onSuccess: (score: number) => void;
  onFailure: () => void;
  useLinearGamma: boolean;
}

export const ModuleBlendDecoder: React.FC<ModuleBlendDecoderProps> = ({
  onSuccess,
  onFailure,
  useLinearGamma,
}) => {
  const [baseColor, setBaseColor] = useState<RGB>({ r: 90, g: 140, b: 180 });
  const [blendColor, setBlendColor] = useState<RGB>({ r: 170, g: 120, b: 90 });
  const [secretMode, setSecretMode] = useState<BlendMode>('screen');
  const [resultColor, setResultColor] = useState<RGB>({ r: 200, g: 190, b: 205 });
  const [selectedGuess, setSelectedGuess] = useState<BlendMode | null>(null);
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    explanation: string;
  } | null>(null);

  // Generate a new mystery problem
  const generateMystery = useCallback(() => {
    setSelectedGuess(null);
    setFeedback(null);

    // Pick two colors where modes diverge clearly
    const base: RGB = {
      r: Math.floor(40 + Math.random() * 180),
      g: Math.floor(40 + Math.random() * 180),
      b: Math.floor(40 + Math.random() * 180),
    };
    const blend: RGB = {
      r: Math.floor(60 + Math.random() * 160),
      g: Math.floor(60 + Math.random() * 160),
      b: Math.floor(60 + Math.random() * 160),
    };

    // Candidates: Screen, Linear Dodge (Add), Lighten, Multiply
    const modesList: BlendMode[] = ['screen', 'linear_dodge', 'lighten', 'multiply'];
    const chosen = modesList[Math.floor(Math.random() * modesList.length)];

    setBaseColor(base);
    setBlendColor(blend);
    setSecretMode(chosen);
    setResultColor(blendColors(base, blend, chosen, useLinearGamma));
  }, [useLinearGamma]);

  useEffect(() => {
    generateMystery();
  }, [generateMystery]);

  const handleGuess = (mode: BlendMode) => {
    if (selectedGuess !== null) return;
    setSelectedGuess(mode);

    const isCorrect = mode === secretMode;

    // Forensic clue explanation
    let clue = '';
    const rSum = baseColor.r + blendColor.r;
    const gSum = baseColor.g + blendColor.g;
    const bSum = baseColor.b + blendColor.b;
    const hasClipping = rSum >= 255 || gSum >= 255 || bSum >= 255;

    if (secretMode === 'linear_dodge') {
      clue = `[단서] 단순 합계가 255에 도달하여 화이트 클리핑이 발생했습니다 (합계 R:${rSum}, G:${gSum}, B:${bSum}). Screen과 달리 상한선 감산 항이 없어 가장 밝은 Add 모드입니다.`;
    } else if (secretMode === 'screen') {
      clue = `[단서] 두 레이어가 합쳐져 밝아졌으나 255 클리핑 없이 계조가 부드럽게 유지되었습니다. 255 - ((255-A)(255-B))/255 역연산이 적용된 Screen 모드입니다.`;
    } else if (secretMode === 'lighten') {
      clue = `[단서] 각 채널의 결과값이 Base나 Blend 중 더 큰 값과 정확히 일치합니다 (R:${resultColor.r}, G:${resultColor.g}, B:${resultColor.b}). 산술 덧셈을 하지 않고 max(A, B)를 취하는 Lighten 모드입니다.`;
    } else if (secretMode === 'multiply') {
      clue = `[단서] 결과값이 Base와 Blend보다 확실하게 어두워졌습니다 ((A × B) / 255). 유일한 감산 계열인 Multiply 모드입니다.`;
    }

    setFeedback({
      correct: isCorrect,
      explanation: clue,
    });

    if (isCorrect) {
      onSuccess(120);
    } else {
      onFailure();
    }
  };

  const secretInfo = BLEND_MODES.find((m) => m.id === secretMode);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="bg-[#181a20] border border-[#272d3b] rounded-xl p-6 shadow-lg flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#272d3b] pb-4">
          <div>
            <h3 className="text-sm font-bold text-white mb-0.5">
              역추적 블렌드 디코더 (Blend Mode Decoder)
            </h3>
            <p className="text-xs text-slate-400">
              하위 레이어(Base)와 상위 레이어(Blend), 그리고 최종 합성물(Result)을 보고 적용된 모드를 리버스 엔지니어링하세요.
            </p>
          </div>

          <button
            type="button"
            onClick={generateMystery}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-[#222733] hover:bg-[#2b3140] transition-colors border border-[#2e3646]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>새 추리 문제</span>
          </button>
        </div>

        {/* 3 Swatches (Base, Blend, and Mystery Result) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Base Layer */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-400">1. Base Layer</span>
            <div
              className="w-full aspect-[4/3] rounded-lg border border-white/10 flex flex-col justify-between p-3 shadow-inner"
              style={{ backgroundColor: rgbToHex(baseColor) }}
            >
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/60 text-white w-max">
                BASE LAYER
              </span>
              <div className="bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-white font-mono text-xs">
                R {baseColor.r} · G {baseColor.g} · B {baseColor.b}
              </div>
            </div>
          </div>

          {/* Blend Layer */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-400">2. Blend Layer</span>
            <div
              className="w-full aspect-[4/3] rounded-lg border border-white/10 flex flex-col justify-between p-3 shadow-inner"
              style={{ backgroundColor: rgbToHex(blendColor) }}
            >
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/60 text-white w-max">
                BLEND SOURCE
              </span>
              <div className="bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-white font-mono text-xs">
                R {blendColor.r} · G {blendColor.g} · B {blendColor.b}
              </div>
            </div>
          </div>

          {/* Result Swatch */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-purple-400 flex items-center gap-1">
              <Search className="w-3.5 h-3.5" />
              <span>3. Final Result (추리 대상)</span>
            </span>
            <div
              className="w-full aspect-[4/3] rounded-lg border-2 border-purple-500/50 flex flex-col justify-between p-3 shadow-inner relative"
              style={{ backgroundColor: rgbToHex(resultColor) }}
            >
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950/80 text-purple-200 border border-purple-500/40 w-max">
                SYNTHESIZED RESULT
              </span>
              <div className="bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-white font-mono text-xs">
                R {resultColor.r} · G {resultColor.g} · B {resultColor.b}
              </div>
            </div>
          </div>
        </div>

        {/* Detective Clues Bar */}
        <div className="bg-[#111317] p-3 rounded-lg border border-[#252b38] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <span className="text-slate-400">채널 합산 분석:</span>
          <span>Red 단순합: {baseColor.r + blendColor.r} (결과: {resultColor.r})</span>
          <span>Green 단순합: {baseColor.g + blendColor.g} (결과: {resultColor.g})</span>
          <span>Blue 단순합: {baseColor.b + blendColor.b} (결과: {resultColor.b})</span>
        </div>

        {/* Guess Mode Selection Buttons */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold text-slate-300">
            어떤 블렌딩 모드가 적용되었을까요?
          </span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'screen', name: 'Screen', desc: '부드러운 가산 발광' },
              { id: 'linear_dodge', name: 'Linear Dodge (Add)', desc: '단순 물리 가산 (클리핑)' },
              { id: 'lighten', name: 'Lighten', desc: '채널별 최댓값 선택' },
              { id: 'multiply', name: 'Multiply', desc: '감산곱 (어두워짐)' },
            ].map((item) => {
              const isSelected = selectedGuess === item.id;
              const isRevealed = selectedGuess !== null;
              const isThisCorrect = item.id === secretMode;

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={isRevealed}
                  onClick={() => handleGuess(item.id as BlendMode)}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                    isRevealed
                      ? isThisCorrect
                        ? 'border-emerald-500 bg-emerald-950/30 ring-2 ring-emerald-500/50'
                        : isSelected
                        ? 'border-red-500 bg-red-950/30'
                        : 'border-[#272d3b] bg-[#121419] opacity-40'
                      : 'border-[#272d3b] bg-[#121419] hover:border-slate-500 hover:bg-[#191c24]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">{item.name}</span>
                    {isRevealed && isThisCorrect && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                    {isRevealed && isSelected && !isThisCorrect && (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">{item.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback Clue Explanation */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border text-xs leading-relaxed transition-all ${
              feedback.correct
                ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
                : 'bg-red-950/40 border-red-600/50 text-red-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm flex items-center gap-1.5 font-sans">
                {feedback.correct ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>정답입니다! 완벽한 역추론 성공 (+120 XP)</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span>오답입니다! 정답은 [{secretInfo?.name}] 모드였습니다.</span>
                  </>
                )}
              </span>
              <button
                type="button"
                onClick={generateMystery}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-md transition-colors flex items-center gap-1"
              >
                <span>다음 추리 문제</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-slate-300 font-sans mt-1">{feedback.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
};
