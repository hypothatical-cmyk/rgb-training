import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, ArrowRight, BookOpen, Undo2 } from 'lucide-react';
import { RGB, deltaE76, rgbToHex, describeRgbCast } from '../types/color';
import { CURATED_PRESETS, generateRandomCast, ColorScenario } from '../utils/presets';
import {
  CurvesEditor,
  CurvesState,
  INITIAL_CURVES_STATE,
  applyCurvesToRgb,
  CurveChannel,
} from './CurvesEditor';

interface ModuleCurvesNeutralizerProps {
  onSuccess: (score: number) => void;
  onFailure: () => void;
}

export const ModuleCurvesNeutralizer: React.FC<ModuleCurvesNeutralizerProps> = ({
  onSuccess,
  onFailure,
}) => {
  const [sourceMode, setSourceMode] = useState<'curated' | 'random'>('curated');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(CURATED_PRESETS[0].id);
  const [castColor, setCastColor] = useState<RGB>(CURATED_PRESETS[0].castColor);
  const [activePreset, setActivePreset] = useState<ColorScenario | null>(CURATED_PRESETS[0]);
  const [curves, setCurves] = useState<CurvesState>(INITIAL_CURVES_STATE);
  const [activeChannel, setActiveChannel] = useState<CurveChannel>('red');
  const [evaluation, setEvaluation] = useState<{
    submitted: boolean;
    channelDelta: number;
    deltaEToNeutral: number;
    verdict: 'perfect' | 'acceptable' | 'fail';
  } | null>(null);

  // Initialize or change problem
  const loadProblem = useCallback(() => {
    setCurves(INITIAL_CURVES_STATE);
    setEvaluation(null);

    if (sourceMode === 'curated') {
      const preset = CURATED_PRESETS.find((p) => p.id === selectedPresetId) || CURATED_PRESETS[0];
      setActivePreset(preset);
      setCastColor(preset.castColor);
      // Auto-set active channel to the most biased channel
      const { r, g, b } = preset.castColor;
      if (Math.abs(r - 128) >= Math.abs(g - 128) && Math.abs(r - 128) >= Math.abs(b - 128)) {
        setActiveChannel('red');
      } else if (Math.abs(g - 128) >= Math.abs(b - 128)) {
        setActiveChannel('green');
      } else {
        setActiveChannel('blue');
      }
    } else {
      setActivePreset(null);
      const randCast = generateRandomCast(128, 50);
      setCastColor(randCast);
      setActiveChannel('red');
    }
  }, [sourceMode, selectedPresetId]);

  useEffect(() => {
    loadProblem();
  }, [loadProblem]);

  // Current color resulting from Curves
  const neutralizedColor = applyCurvesToRgb(castColor, curves);

  // Channel balance calculation: max difference between any two channels
  const rDiff = Math.abs(neutralizedColor.r - neutralizedColor.g);
  const gDiff = Math.abs(neutralizedColor.g - neutralizedColor.b);
  const bDiff = Math.abs(neutralizedColor.b - neutralizedColor.r);
  const maxChannelSpread = Math.max(rDiff, gDiff, bDiff);

  // Delta E to ideal 18% neutral gray (128, 128, 128)
  const dEToNeutral = deltaE76(neutralizedColor, { r: 128, g: 128, b: 128 });

  const handleNeutralCheck = () => {
    let verdict: 'perfect' | 'acceptable' | 'fail' = 'fail';
    let score = 0;

    if (maxChannelSpread <= 4) {
      verdict = 'perfect';
      score = 150;
    } else if (maxChannelSpread <= 9) {
      verdict = 'acceptable';
      score = 90;
    } else {
      verdict = 'fail';
      score = 25;
    }

    setEvaluation({
      submitted: true,
      channelDelta: maxChannelSpread,
      deltaEToNeutral: Number(dEToNeutral.toFixed(1)),
      verdict,
    });

    if (verdict === 'perfect' || verdict === 'acceptable') {
      onSuccess(score);
    } else {
      onFailure();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto">
      {/* Left Column: Visual Before & After Swatches & Diagnosis */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {/* Source Mode Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#181a20] p-3 rounded-xl border border-[#272d3b]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">시나리오:</span>
            <div className="inline-flex rounded-lg bg-[#111216] p-0.5 border border-[#272d3b]">
              <button
                type="button"
                onClick={() => setSourceMode('curated')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  sourceMode === 'curated'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                실무 큐레이션
              </button>
              <button
                type="button"
                onClick={() => setSourceMode('random')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  sourceMode === 'random'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                무작위 캐스트
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={loadProblem}
            className="flex items-center gap-1 text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-[#222733] hover:bg-[#2b3140] transition-colors border border-[#2e3646]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>새 캐스트</span>
          </button>
        </div>

        {sourceMode === 'curated' && (
          <div className="bg-[#181a20] border border-[#272d3b] rounded-xl p-3 flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400">실무 왜곡 프리셋 선택:</label>
            <select
              value={selectedPresetId}
              onChange={(e) => setSelectedPresetId(e.target.value)}
              className="bg-[#111317] text-xs text-slate-200 border border-[#2d3444] rounded-lg px-2.5 py-2 focus:outline-none focus:border-emerald-500 font-medium"
            >
              {CURATED_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {activePreset && (
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {activePreset.description}
              </p>
            )}
          </div>
        )}

        {/* Visual Swatch Comparison */}
        <div className="bg-[#181a20] border border-[#272d3b] rounded-xl p-5 shadow-lg flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>캐스트 왜곡 (Before) ➔ 커브 보정 (After)</span>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {/* Before Cast Patch */}
            <div className="flex flex-col gap-1.5">
              <div
                className="w-full aspect-[4/3] rounded-lg border border-white/10 flex flex-col justify-between p-3 shadow-inner"
                style={{ backgroundColor: rgbToHex(castColor) }}
              >
                <span className="text-[10px] font-black tracking-wider px-2 py-0.5 rounded bg-black/60 text-white w-max">
                  BEFORE (CAST)
                </span>
                <div className="bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-white font-mono text-[11px]">
                  R {castColor.r} · G {castColor.g} · B {castColor.b}
                </div>
              </div>
              <span className="text-[11px] text-red-400 font-mono">
                {describeRgbCast(castColor)}
              </span>
            </div>

            {/* After Curves Patch */}
            <div className="flex flex-col gap-1.5">
              <div
                className="w-full aspect-[4/3] rounded-lg border border-white/10 flex flex-col justify-between p-3 shadow-inner transition-colors"
                style={{ backgroundColor: rgbToHex(neutralizedColor) }}
              >
                <span className="text-[10px] font-black tracking-wider px-2 py-0.5 rounded bg-black/60 text-white w-max">
                  AFTER (CURVES)
                </span>
                <div className="bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-white font-mono text-[11px]">
                  R {neutralizedColor.r} · G {neutralizedColor.g} · B {neutralizedColor.b}
                </div>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono">
                {describeRgbCast(neutralizedColor)}
              </span>
            </div>
          </div>

          {/* Real-time Balance Meter */}
          <div className="bg-[#111317] p-3 rounded-lg border border-[#252b38] flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">채널 불균형 편차:</span>
              <span className="font-mono font-bold text-amber-400">
                Δ {maxChannelSpread} {maxChannelSpread <= 4 ? '(중립 회색 근접!)' : '(왜곡 잔존)'}
              </span>
            </div>
            <div className="w-full bg-[#1b1f28] h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  maxChannelSpread <= 4
                    ? 'bg-emerald-500'
                    : maxChannelSpread <= 10
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.max(5, Math.min(100, 100 - maxChannelSpread * 1.5))}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>목표: R=G=B (편차 ≤ 4)</span>
              <span>CIE76 ΔE: {dEToNeutral.toFixed(1)}</span>
            </div>
          </div>

          {/* Evaluation Banner */}
          {evaluation && (
            <div
              className={`p-3.5 rounded-lg border text-xs font-mono transition-all ${
                evaluation.verdict === 'perfect'
                  ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
                  : evaluation.verdict === 'acceptable'
                  ? 'bg-blue-950/40 border-blue-600/50 text-blue-200'
                  : 'bg-red-950/40 border-red-600/50 text-red-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold flex items-center gap-1.5 font-sans">
                  {evaluation.verdict === 'perfect' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>PERFECT! 완벽한 중립 회색 복원!</span>
                    </>
                  ) : evaluation.verdict === 'acceptable' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-blue-400" />
                      <span>ACCEPTABLE! 실무 허용치 내 복원 완료</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span>FAIL! 채널 간 편차가 여전히 큽니다</span>
                    </>
                  )}
                </span>
                <span>편차 Δ {evaluation.channelDelta}</span>
              </div>
              <div className="text-[11px] text-slate-300 font-sans mt-1">
                {activePreset?.tips ||
                  '가장 높은 채널 곡선을 내리거나, 보색 관계의 두 채널을 동시에 올려 균형을 맞추세요.'}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={handleNeutralCheck}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <span>중립 회색 판정 (Submit)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurves(INITIAL_CURVES_STATE)}
                className="flex-1 py-1.5 text-xs text-slate-400 hover:text-white bg-[#111317] hover:bg-[#1a1e26] border border-[#282f3d] rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>커브 초기화</span>
              </button>
              <button
                type="button"
                onClick={loadProblem}
                className="flex-1 py-1.5 text-xs text-slate-400 hover:text-white bg-[#111317] hover:bg-[#1a1e26] border border-[#282f3d] rounded-lg transition-colors"
              >
                다음 문제
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Authentic Photoshop Curves Graph Editor */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-bold text-white mb-1">
            Photoshop Curves 채널 곡선 인터페이스
          </h3>
          <p className="text-xs text-slate-400">
            Red, Green, Blue 채널을 선택하고 곡선의 중앙 앵커 포인트를 드래그하여 캐스트를 중화하세요.
          </p>
        </div>

        <CurvesEditor
          curves={curves}
          onChange={setCurves}
          activeChannel={activeChannel}
          onActiveChannelChange={setActiveChannel}
          referenceCast={castColor}
        />

        {/* Photoshop Practical Theory Breakdown */}
        <div className="bg-[#181a20] border border-[#272d3b] rounded-xl p-4 text-xs text-slate-300 flex items-start gap-3">
          <BookOpen className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <span className="font-semibold text-white">커브 조작과 포토샵 보색 관계 원리</span>
            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-400 pt-1">
              <div className="bg-[#111317] p-2 rounded border border-[#242933]">
                <strong className="text-red-400 block mb-0.5">Red 채널</strong>
                ▲ Red 증가 (+적색)<br />
                ▼ Cyan 증가 (+청록)
              </div>
              <div className="bg-[#111317] p-2 rounded border border-[#242933]">
                <strong className="text-emerald-400 block mb-0.5">Green 채널</strong>
                ▲ Green 증가 (+녹색)<br />
                ▼ Magenta 증가 (+자홍)
              </div>
              <div className="bg-[#111317] p-2 rounded border border-[#242933]">
                <strong className="text-blue-400 block mb-0.5">Blue 채널</strong>
                ▲ Blue 증가 (+청색)<br />
                ▼ Yellow 증가 (+황색)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
