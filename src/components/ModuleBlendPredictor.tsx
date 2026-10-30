import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle2, XCircle, ArrowRight, BookOpen, Layers } from 'lucide-react';
import { RGB, BlendMode, BLEND_MODES, blendColors, rgbToHex } from '../types/color';

interface ModuleBlendPredictorProps {
  onSuccess: (score: number) => void;
  onFailure: () => void;
  useLinearGamma: boolean;
}

export const ModuleBlendPredictor: React.FC<ModuleBlendPredictorProps> = ({
  onSuccess,
  onFailure,
  useLinearGamma,
}) => {
  const [baseColor, setBaseColor] = useState<RGB>({ r: 40, g: 80, b: 160 });
  const [blendColor, setBlendColor] = useState<RGB>({ r: 160, g: 70, b: 30 });
  const [targetMode, setTargetMode] = useState<BlendMode>('screen');
  const [choices, setChoices] = useState<{ id: string; mode: BlendMode; color: RGB; isCorrect: boolean }[]>([]);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Generate a new prediction quiz
  const generateQuiz = useCallback(() => {
    setSelectedChoiceId(null);
    setShowExplanation(false);

    // Pick two contrasting colors with significant channel interest
    const base: RGB = {
      r: Math.floor(20 + Math.random() * 200),
      g: Math.floor(20 + Math.random() * 200),
      b: Math.floor(20 + Math.random() * 200),
    };
    const blend: RGB = {
      r: Math.floor(20 + Math.random() * 200),
      g: Math.floor(20 + Math.random() * 200),
      b: Math.floor(20 + Math.random() * 200),
    };
    setBaseColor(base);
    setBlendColor(blend);

    // Pick target mode from primary list
    const candidateModes: BlendMode[] = ['linear_dodge', 'screen', 'lighten', 'multiply'];
    const chosenMode = candidateModes[Math.floor(Math.random() * candidateModes.length)];
    setTargetMode(chosenMode);

    // Correct result
    const correctResult = blendColors(base, blend, chosenMode, useLinearGamma);

    // Construct 4 choices (Target mode + 3 other modes or plausible distortions)
    const options: { id: string; mode: BlendMode; color: RGB; isCorrect: boolean }[] = [
      {
        id: `choice_${chosenMode}`,
        mode: chosenMode,
        color: correctResult,
        isCorrect: true,
      },
    ];

    // Add other modes as distractors
    const distractors = candidateModes.filter((m) => m !== chosenMode);
    distractors.forEach((dm) => {
      options.push({
        id: `choice_${dm}`,
        mode: dm,
        color: blendColors(base, blend, dm, useLinearGamma),
        isCorrect: false,
      });
    });

    // Shuffle options
    setChoices(options.sort(() => Math.random() - 0.5));
  }, [useLinearGamma]);

  useEffect(() => {
    generateQuiz();
  }, [generateQuiz]);

  const handleSelect = (choice: { id: string; mode: BlendMode; color: RGB; isCorrect: boolean }) => {
    if (selectedChoiceId !== null) return;
    setSelectedChoiceId(choice.id);
    setShowExplanation(true);

    if (choice.isCorrect) {
      onSuccess(100);
    } else {
      onFailure();
    }
  };

  const currentModeInfo = BLEND_MODES.find((m) => m.id === targetMode);
  const correctColor = blendColors(baseColor, blendColor, targetMode, useLinearGamma);

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      {/* Quiz Card */}
      <div className="bg-[#181a20] border border-[#272d3b] rounded-xl p-6 shadow-lg flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#272d3b] pb-4">
          <div>
            <h3 className="text-sm font-bold text-white mb-0.5">
              블렌드 모드 연산 예측기 (Blend Mode Predictor)
            </h3>
            <p className="text-xs text-slate-400">
              하위 레이어(Base)와 상위 레이어(Blend)의 색상을 보고 지정된 모드로 합성된 결과 색상을 예측하세요.
            </p>
          </div>

          <button
            type="button"
            onClick={generateQuiz}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-[#222733] hover:bg-[#2b3140] transition-colors border border-[#2e3646]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>새 퀴즈 생성</span>
          </button>
        </div>

        {/* Input Layers Formula Visualizer */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
          {/* Layer 1: Base */}
          <div className="md:col-span-2 flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Layer 1 (Base Color)</span>
            </span>
            <div
              className="w-full h-24 rounded-lg border border-white/10 flex flex-col justify-end p-2.5 shadow-inner"
              style={{ backgroundColor: rgbToHex(baseColor) }}
            >
              <div className="bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-white font-mono text-[11px] flex justify-between">
                <span>{rgbToHex(baseColor)}</span>
                <span>R {baseColor.r} · G {baseColor.g} · B {baseColor.b}</span>
              </div>
            </div>
          </div>

          {/* Plus Sign */}
          <div className="md:col-span-1 flex flex-col items-center justify-center text-slate-500 font-bold text-2xl">
            <span>+</span>
          </div>

          {/* Layer 2: Blend */}
          <div className="md:col-span-2 flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-pink-400" />
              <span>Layer 2 (Blend Color)</span>
            </span>
            <div
              className="w-full h-24 rounded-lg border border-white/10 flex flex-col justify-end p-2.5 shadow-inner"
              style={{ backgroundColor: rgbToHex(blendColor) }}
            >
              <div className="bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-white font-mono text-[11px] flex justify-between">
                <span>{rgbToHex(blendColor)}</span>
                <span>R {blendColor.r} · G {blendColor.g} · B {blendColor.b}</span>
              </div>
            </div>
          </div>

          {/* Target Blend Mode Indicator */}
          <div className="md:col-span-2 bg-[#101216] border border-[#2b3140] rounded-lg p-3 flex flex-col justify-center items-center text-center gap-1">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              적용할 블렌딩 모드
            </span>
            <span className="text-base font-extrabold text-blue-400">
              {currentModeInfo?.name}
            </span>
            <span className="text-xs text-slate-400">
              {currentModeInfo?.nameKo}
            </span>
            <span className="text-[10px] text-slate-500 font-mono mt-1">
              {currentModeInfo?.formula}
            </span>
          </div>
        </div>

        {/* 4 Choices Grid */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold text-slate-300">
            합성 결과 색상 패치를 선택하세요:
          </span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {choices.map((choice, idx) => {
              const isSelected = selectedChoiceId === choice.id;
              const isRevealed = selectedChoiceId !== null;

              return (
                <button
                  key={choice.id}
                  type="button"
                  disabled={isRevealed}
                  onClick={() => handleSelect(choice)}
                  className={`relative flex flex-col gap-2 p-3 rounded-xl border transition-all text-left ${
                    isRevealed
                      ? choice.isCorrect
                        ? 'border-emerald-500 bg-emerald-950/20 ring-2 ring-emerald-500/40'
                        : isSelected
                        ? 'border-red-500 bg-red-950/20'
                        : 'border-[#272d3b] bg-[#121419] opacity-40'
                      : 'border-[#272d3b] bg-[#121419] hover:border-slate-500 hover:bg-[#191c24]'
                  }`}
                >
                  <div
                    className="w-full aspect-[4/3] rounded-lg border border-white/10 flex flex-col justify-between p-2 shadow-inner"
                    style={{ backgroundColor: rgbToHex(choice.color) }}
                  >
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-white w-max">
                      옵션 {String.fromCharCode(65 + idx)}
                    </span>
                    {isRevealed && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/80 text-white w-max">
                        {BLEND_MODES.find((m) => m.id === choice.mode)?.name}
                      </span>
                    )}
                  </div>

                  <div className="font-mono text-xs text-slate-300 flex justify-between">
                    <span>{rgbToHex(choice.color)}</span>
                    <span className="text-slate-400">
                      R{choice.color.r} G{choice.color.g} B{choice.color.b}
                    </span>
                  </div>

                  {isRevealed && choice.isCorrect && (
                    <div className="absolute top-2 right-2 p-1 bg-emerald-500 text-white rounded-full shadow-md">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                  {isRevealed && isSelected && !choice.isCorrect && (
                    <div className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full shadow-md">
                      <XCircle className="w-4 h-4" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Mathematical Explanation Drawer */}
        {showExplanation && (
          <div className="bg-[#101216] border border-[#2b3140] rounded-xl p-4 flex flex-col gap-3 text-xs">
            <div className="flex items-center justify-between border-b border-[#242935] pb-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span>수학적 연산 과정 & 포토샵 공식 해설</span>
              </span>
              <button
                type="button"
                onClick={generateQuiz}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-md transition-colors flex items-center gap-1"
              >
                <span>다음 문제 (Space)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-slate-300">
              <p className="leading-relaxed">
                <strong>{currentModeInfo?.name} 공식:</strong> <code className="text-blue-300 font-mono">{currentModeInfo?.formula}</code>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-mono text-[11px] bg-[#161820] p-3 rounded-lg border border-[#242935]">
                <div>
                  <span className="text-red-400 font-bold block">Red 채널 연산</span>
                  A: {baseColor.r}, B: {blendColor.r} ➔ <strong className="text-white">{correctColor.r}</strong>
                </div>
                <div>
                  <span className="text-emerald-400 font-bold block">Green 채널 연산</span>
                  A: {baseColor.g}, B: {blendColor.g} ➔ <strong className="text-white">{correctColor.g}</strong>
                </div>
                <div>
                  <span className="text-blue-400 font-bold block">Blue 채널 연산</span>
                  A: {baseColor.b}, B: {blendColor.b} ➔ <strong className="text-white">{correctColor.b}</strong>
                </div>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {currentModeInfo?.description}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Mode Comparator Drawer: Compare All Modes on Same Base + Blend */}
      <div className="bg-[#181a20] border border-[#272d3b] rounded-xl p-5 shadow-lg flex flex-col gap-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          현재 색상에 대한 주요 블렌딩 모드 일괄 비교 랩 (All Modes Lab)
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {BLEND_MODES.map((mode) => {
            const res = blendColors(baseColor, blendColor, mode.id, useLinearGamma);
            return (
              <div
                key={mode.id}
                className="bg-[#111317] border border-[#262c38] rounded-lg p-2.5 flex flex-col gap-2"
              >
                <div
                  className="w-full h-16 rounded border border-white/10"
                  style={{ backgroundColor: rgbToHex(res) }}
                />
                <div>
                  <span className="text-xs font-bold text-white block truncate">{mode.name}</span>
                  <span className="text-[10px] text-slate-400 block truncate">{mode.nameKo}</span>
                  <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                    {rgbToHex(res)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
