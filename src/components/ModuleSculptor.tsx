import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, ArrowRight, BookOpen } from 'lucide-react';
import { RGB, deltaE76, rgbEuclideanDistance, rgbToHex, describeRgbCast } from '../types/color';
import { CURATED_PRESETS, generateRandomTargetColor } from '../utils/presets';

interface ModuleSculptorProps {
  onSuccess: (score: number) => void;
  onFailure: () => void;
}

export const ModuleSculptor: React.FC<ModuleSculptorProps> = ({ onSuccess, onFailure }) => {
  const [sourceMode, setSourceMode] = useState<'curated' | 'random'>('curated');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(CURATED_PRESETS[0].id);
  const [targetColor, setTargetColor] = useState<RGB>(CURATED_PRESETS[0].targetPureColor || { r: 215, g: 110, b: 45 });
  const [userColor, setUserColor] = useState<RGB>({ r: 128, g: 128, b: 128 });
  const [evaluation, setEvaluation] = useState<{
    submitted: boolean;
    deltaE: number;
    distance: number;
    score: number;
    verdict: 'perfect' | 'good' | 'pass' | 'fail';
  } | null>(null);

  // Setup problem
  const loadProblem = useCallback(() => {
    setEvaluation(null);
    setUserColor({ r: 128, g: 128, b: 128 });

    if (sourceMode === 'curated') {
      const preset = CURATED_PRESETS.find((p) => p.id === selectedPresetId) || CURATED_PRESETS[0];
      setTargetColor(preset.targetPureColor || preset.castColor);
    } else {
      setTargetColor(generateRandomTargetColor(3));
    }
  }, [sourceMode, selectedPresetId]);

  useEffect(() => {
    loadProblem();
  }, [loadProblem]);

  const handleSliderChange = (channel: 'r' | 'g' | 'b', val: number) => {
    setUserColor((prev) => ({
      ...prev,
      [channel]: Math.max(0, Math.min(255, val)),
    }));
  };

  const nudgeChannel = (channel: 'r' | 'g' | 'b', amount: number) => {
    setUserColor((prev) => ({
      ...prev,
      [channel]: Math.max(0, Math.min(255, prev[channel] + amount)),
    }));
  };

  const handleSubmit = () => {
    const dE = deltaE76(targetColor, userColor);
    const dist = rgbEuclideanDistance(targetColor, userColor);

    let verdict: 'perfect' | 'good' | 'pass' | 'fail' = 'fail';
    let baseScore = 0;

    if (dE <= 2.5) {
      verdict = 'perfect';
      baseScore = 150;
    } else if (dE <= 6.0) {
      verdict = 'good';
      baseScore = 100;
    } else if (dE <= 12.0) {
      verdict = 'pass';
      baseScore = 60;
    } else {
      verdict = 'fail';
      baseScore = 20;
    }

    setEvaluation({
      submitted: true,
      deltaE: Number(dE.toFixed(1)),
      distance: Number(dist.toFixed(1)),
      score: baseScore,
      verdict,
    });

    if (verdict === 'perfect' || verdict === 'good') {
      onSuccess(baseScore);
    } else {
      onFailure();
    }
  };

  // Additive component calculations
  const yellowComponent = Math.min(userColor.r, userColor.g);
  const cyanComponent = Math.min(userColor.g, userColor.b);
  const magentaComponent = Math.min(userColor.r, userColor.b);

  const activePreset = CURATED_PRESETS.find((p) => p.id === selectedPresetId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto">
      {/* Left Column: Visual Color Comparison & Theory Guidance */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        {/* Source Mode Toggle (Curated vs Random) */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#181a20] p-3 rounded-xl border border-[#272d3b]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">출제 방식:</span>
            <div className="inline-flex rounded-lg bg-[#111216] p-0.5 border border-[#272d3b]">
              <button
                type="button"
                onClick={() => setSourceMode('curated')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  sourceMode === 'curated'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                실무 큐레이션 프리셋
              </button>
              <button
                type="button"
                onClick={() => setSourceMode('random')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  sourceMode === 'random'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                완전 무작위 난수
              </button>
            </div>
          </div>

          {sourceMode === 'curated' && (
            <select
              value={selectedPresetId}
              onChange={(e) => setSelectedPresetId(e.target.value)}
              className="bg-[#121419] text-xs text-slate-200 border border-[#2d3444] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            >
              {CURATED_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={loadProblem}
            className="flex items-center gap-1 text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-[#222733] hover:bg-[#2b3140] transition-colors border border-[#2e3646]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>새 문제</span>
          </button>
        </div>

        {/* Big Swatches Comparison */}
        <div className="bg-[#181a20] border border-[#272d3b] rounded-xl p-5 shadow-lg flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              색상 비교 (Target vs User)
            </span>
            <span className="text-xs text-slate-400 font-mono">
              인간 지각 색차 공식: CIE76 ΔE
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Target Swatch */}
            <div className="flex flex-col gap-2">
              <div
                className="w-full aspect-[4/3] rounded-lg border border-white/10 flex flex-col justify-between p-3.5 shadow-inner transition-colors"
                style={{ backgroundColor: rgbToHex(targetColor) }}
              >
                <span className="text-[11px] font-black tracking-wider px-2 py-0.5 rounded bg-black/60 text-white w-max backdrop-blur-sm">
                  TARGET COLOR
                </span>
                <div className="bg-black/70 backdrop-blur-sm px-2.5 py-1.5 rounded text-white font-mono text-xs flex justify-between">
                  <span>{evaluation?.submitted ? rgbToHex(targetColor) : '???'}</span>
                  <span>
                    {evaluation?.submitted
                      ? `R ${targetColor.r} G ${targetColor.g} B ${targetColor.b}`
                      : 'R ??? G ??? B ???'}
                  </span>
                </div>
              </div>
              <div className="text-xs text-slate-400 truncate">
                {sourceMode === 'curated' && activePreset ? activePreset.description : '무작위 타깃 색상'}
              </div>
            </div>

            {/* User Swatch */}
            <div className="flex flex-col gap-2">
              <div
                className="w-full aspect-[4/3] rounded-lg border border-white/10 flex flex-col justify-between p-3.5 shadow-inner transition-colors"
                style={{ backgroundColor: rgbToHex(userColor) }}
              >
                <span className="text-[11px] font-black tracking-wider px-2 py-0.5 rounded bg-black/60 text-white w-max backdrop-blur-sm">
                  YOUR COLOR
                </span>
                <div className="bg-black/70 backdrop-blur-sm px-2.5 py-1.5 rounded text-white font-mono text-xs flex justify-between">
                  <span>{rgbToHex(userColor)}</span>
                  <span>{`R ${userColor.r} G ${userColor.g} B ${userColor.b}`}</span>
                </div>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                현재 분석: {describeRgbCast(userColor)}
              </div>
            </div>
          </div>

          {/* Additive Color Composition Guidance Bars */}
          <div className="bg-[#111317] p-3.5 rounded-lg border border-[#252b38] flex flex-col gap-2.5">
            <span className="text-xs font-semibold text-slate-300">
              실시간 빛의 가산혼합 성분 분석:
            </span>
            <div className="grid grid-cols-3 gap-3 text-xs font-mono">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-yellow-400">
                  <span>Yellow (R+G)</span>
                  <span>{yellowComponent}</span>
                </div>
                <div className="w-full bg-[#1c202a] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-yellow-400 h-full rounded-full transition-all"
                    style={{ width: `${(yellowComponent / 255) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-cyan-400">
                  <span>Cyan (G+B)</span>
                  <span>{cyanComponent}</span>
                </div>
                <div className="w-full bg-[#1c202a] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-400 h-full rounded-full transition-all"
                    style={{ width: `${(cyanComponent / 255) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-pink-400">
                  <span>Magenta (R+B)</span>
                  <span>{magentaComponent}</span>
                </div>
                <div className="w-full bg-[#1c202a] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-pink-400 h-full rounded-full transition-all"
                    style={{ width: `${(magentaComponent / 255) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submission Feedback Result Banner */}
          {evaluation && (
            <div
              className={`p-4 rounded-lg border transition-all ${
                evaluation.verdict === 'perfect'
                  ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
                  : evaluation.verdict === 'good'
                  ? 'bg-blue-950/40 border-blue-600/50 text-blue-200'
                  : evaluation.verdict === 'pass'
                  ? 'bg-amber-950/40 border-amber-600/50 text-amber-200'
                  : 'bg-red-950/40 border-red-600/50 text-red-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm flex items-center gap-1.5">
                  {evaluation.verdict === 'perfect' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>PERFECT! 인간 지각 일치 (JND 한계 이하)</span>
                    </>
                  ) : evaluation.verdict === 'good' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-blue-400" />
                      <span>GOOD! 전문가 수준의 뛰어난 일치</span>
                    </>
                  ) : evaluation.verdict === 'pass' ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>PASS (허용 오차 근접)</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span>FAIL (색조 차이 큼)</span>
                    </>
                  )}
                </span>
                <span className="font-mono text-xs">
                  CIE76 ΔE: <strong>{evaluation.deltaE}</strong> | +{evaluation.score} XP
                </span>
              </div>

              <div className="text-xs space-y-1 font-mono text-slate-300">
                <div>
                  채널별 오차: Red ({userColor.r - targetColor.r >= 0 ? `+${userColor.r - targetColor.r}` : userColor.r - targetColor.r}), Green ({userColor.g - targetColor.g >= 0 ? `+${userColor.g - targetColor.g}` : userColor.g - targetColor.g}), Blue ({userColor.b - targetColor.b >= 0 ? `+${userColor.b - targetColor.b}` : userColor.b - targetColor.b})
                </div>
                {targetColor.r > userColor.r && (
                  <div className="text-red-300 font-sans">
                    💡 Red가 부족하여 Cyan(녹+청) 기운이 돕니다. Red를 더 올리세요.
                  </div>
                )}
                {targetColor.g > userColor.g && (
                  <div className="text-green-300 font-sans">
                    💡 Green이 부족하여 Magenta(적+청) 기운이 돕니다. Green을 더 올리세요.
                  </div>
                )}
                {targetColor.b > userColor.b && (
                  <div className="text-blue-300 font-sans">
                    💡 Blue가 부족하여 Yellow(적+녹) 기운이 돕니다. Blue를 더 올리세요.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Precision Sliders and Controls */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="bg-[#181a20] border border-[#272d3b] rounded-xl p-5 shadow-lg flex flex-col gap-5">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">
              RGB 채널 조각 패널
            </h3>
            <p className="text-xs text-slate-400">
              빛의 3원색을 더해 목표 색상을 만드세요. (단축키: 1/2/3 채널, 방향키 미세조정)
            </p>
          </div>

          {/* Red Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-red-400 flex items-center gap-1">
                <span>[1] RED (적색광)</span>
              </span>
              <div className="flex items-center gap-1 font-mono">
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={userColor.r}
                  onChange={(e) => handleSliderChange('r', Number(e.target.value))}
                  className="w-14 bg-[#111317] border border-[#2d3340] rounded px-1.5 py-0.5 text-center text-red-300 text-xs focus:outline-none focus:border-red-500"
                />
                <span className="text-slate-500">/ 255</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="255"
                value={userColor.r}
                onChange={(e) => handleSliderChange('r', Number(e.target.value))}
                className="flex-1 h-2 bg-[#101216] rounded-lg appearance-none cursor-pointer accent-red-500"
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => nudgeChannel('r', -10)}
                  className="px-1.5 py-0.5 text-[10px] bg-[#222733] hover:bg-[#2c3342] text-slate-300 rounded font-mono"
                >
                  -10
                </button>
                <button
                  type="button"
                  onClick={() => nudgeChannel('r', -1)}
                  className="px-1.5 py-0.5 text-[10px] bg-[#222733] hover:bg-[#2c3342] text-slate-300 rounded font-mono"
                >
                  -1
                </button>
                <button
                  type="button"
                  onClick={() => nudgeChannel('r', 1)}
                  className="px-1.5 py-0.5 text-[10px] bg-[#222733] hover:bg-[#2c3342] text-slate-300 rounded font-mono"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => nudgeChannel('r', 10)}
                  className="px-1.5 py-0.5 text-[10px] bg-[#222733] hover:bg-[#2c3342] text-slate-300 rounded font-mono"
                >
                  +10
                </button>
              </div>
            </div>
          </div>

          {/* Green Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <span>[2] GREEN (녹색광)</span>
              </span>
              <div className="flex items-center gap-1 font-mono">
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={userColor.g}
                  onChange={(e) => handleSliderChange('g', Number(e.target.value))}
                  className="w-14 bg-[#111317] border border-[#2d3340] rounded px-1.5 py-0.5 text-center text-emerald-300 text-xs focus:outline-none focus:border-emerald-500"
                />
                <span className="text-slate-500">/ 255</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="255"
                value={userColor.g}
                onChange={(e) => handleSliderChange('g', Number(e.target.value))}
                className="flex-1 h-2 bg-[#101216] rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => nudgeChannel('g', -10)}
                  className="px-1.5 py-0.5 text-[10px] bg-[#222733] hover:bg-[#2c3342] text-slate-300 rounded font-mono"
                >
                  -10
                </button>
                <button
                  type="button"
                  onClick={() => nudgeChannel('g', -1)}
                  className="px-1.5 py-0.5 text-[10px] bg-[#222733] hover:bg-[#2c3342] text-slate-300 rounded font-mono"
                >
                  -1
                </button>
                <button
                  type="button"
                  onClick={() => nudgeChannel('g', 1)}
                  className="px-1.5 py-0.5 text-[10px] bg-[#222733] hover:bg-[#2c3342] text-slate-300 rounded font-mono"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => nudgeChannel('g', 10)}
                  className="px-1.5 py-0.5 text-[10px] bg-[#222733] hover:bg-[#2c3342] text-slate-300 rounded font-mono"
                >
                  +10
                </button>
              </div>
            </div>
          </div>

          {/* Blue Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-blue-400 flex items-center gap-1">
                <span>[3] BLUE (청색광)</span>
              </span>
              <div className="flex items-center gap-1 font-mono">
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={userColor.b}
                  onChange={(e) => handleSliderChange('b', Number(e.target.value))}
                  className="w-14 bg-[#111317] border border-[#2d3340] rounded px-1.5 py-0.5 text-center text-blue-300 text-xs focus:outline-none focus:border-blue-500"
                />
                <span className="text-slate-500">/ 255</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="255"
                value={userColor.b}
                onChange={(e) => handleSliderChange('b', Number(e.target.value))}
                className="flex-1 h-2 bg-[#101216] rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => nudgeChannel('b', -10)}
                  className="px-1.5 py-0.5 text-[10px] bg-[#222733] hover:bg-[#2c3342] text-slate-300 rounded font-mono"
                >
                  -10
                </button>
                <button
                  type="button"
                  onClick={() => nudgeChannel('b', -1)}
                  className="px-1.5 py-0.5 text-[10px] bg-[#222733] hover:bg-[#2c3342] text-slate-300 rounded font-mono"
                >
                  -1
                </button>
                <button
                  type="button"
                  onClick={() => nudgeChannel('b', 1)}
                  className="px-1.5 py-0.5 text-[10px] bg-[#222733] hover:bg-[#2c3342] text-slate-300 rounded font-mono"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => nudgeChannel('b', 10)}
                  className="px-1.5 py-0.5 text-[10px] bg-[#222733] hover:bg-[#2c3342] text-slate-300 rounded font-mono"
                >
                  +10
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <span>판정 및 제출 (Enter)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUserColor({ r: 128, g: 128, b: 128 })}
                className="flex-1 py-1.5 text-xs text-slate-400 hover:text-white bg-[#111317] hover:bg-[#1a1e26] border border-[#282f3d] rounded-lg transition-colors"
              >
                128 회색 리셋
              </button>
              <button
                type="button"
                onClick={loadProblem}
                className="flex-1 py-1.5 text-xs text-slate-400 hover:text-white bg-[#111317] hover:bg-[#1a1e26] border border-[#282f3d] rounded-lg transition-colors"
              >
                다음 문제 (Space)
              </button>
            </div>
          </div>
        </div>

        {/* Photoshop Pro Tip */}
        <div className="bg-[#14171d] border border-[#242935] rounded-xl p-4 text-xs text-slate-300 flex items-start gap-2.5">
          <BookOpen className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-white">Photoshop 실무 조작 팁</span>
            <p className="text-slate-400 leading-relaxed">
              Curves 패널에서 <strong className="text-slate-200">R 곡선과 G 곡선을 함께 올리면 Yellow</strong> 틴트가 생성되고,
              <strong className="text-slate-200"> G와 B를 올리면 Cyan</strong>, 
              <strong className="text-slate-200"> R과 B를 올리면 Magenta</strong> 틴트가 입혀집니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
