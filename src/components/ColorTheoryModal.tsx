import React from 'react';
import { X, BookOpen, Layers, Sparkles, Sliders } from 'lucide-react';
import { BLEND_MODES } from '../types/color';

interface ColorTheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ColorTheoryModal: React.FC<ColorTheoryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#181a20] border border-[#2e3544] rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#282e3c] sticky top-0 bg-[#181a20]/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">
              Photoshop 디지털 색채 이론 & 수학적 공식 가이드
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#252b38] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-xs leading-relaxed">
          {/* Section 1: RGB Additive Mixing */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-red-400" />
              <span>1. 빛의 가산혼합 기본 원리 (Light Emissive Primaries)</span>
            </h3>
            <p className="text-slate-400">
              디스플레이 화면은 빛을 쏘아 방출하는 가산혼합 방식입니다. 물감(감산혼합)과 달리 빛은 더할수록 밝아지며, 세 채널이 모두 255가 되면 순백색(White)이 됩니다.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-[11px]">
              <div className="bg-[#111317] p-2.5 rounded-lg border border-[#252b38]">
                <strong className="text-yellow-400 block mb-0.5">Red + Green = Yellow</strong>
                (255, 255, 0)
              </div>
              <div className="bg-[#111317] p-2.5 rounded-lg border border-[#252b38]">
                <strong className="text-cyan-400 block mb-0.5">Green + Blue = Cyan</strong>
                (0, 255, 255)
              </div>
              <div className="bg-[#111317] p-2.5 rounded-lg border border-[#252b38]">
                <strong className="text-pink-400 block mb-0.5">Red + Blue = Magenta</strong>
                (255, 0, 255)
              </div>
              <div className="bg-[#111317] p-2.5 rounded-lg border border-[#252b38]">
                <strong className="text-white block mb-0.5">R + G + B = White</strong>
                (255, 255, 255)
              </div>
            </div>
          </div>

          {/* Section 2: Complementary Pairs & Neutral Gray */}
          <div className="space-y-3 border-t border-[#252b38] pt-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>2. 보색 관계와 중립 회색(Neutral Tone) 복원 원리</span>
            </h3>
            <p className="text-slate-400">
              디지털 8비트 RGB에서 중립 회색의 절대 조건은 <strong className="text-white">R = G = B</strong> 입니다. 특정 색조(Color Cast)를 빼려면 보색 채널을 상대적으로 증가시키거나, 해당 채널을 억제해야 합니다.
            </p>
            <div className="grid grid-cols-3 gap-3 font-mono text-[11px]">
              <div className="bg-[#111317] p-3 rounded-lg border border-red-900/30">
                <span className="text-red-400 font-bold block mb-1">Cyan ↔ Red</span>
                Cyan = Green + Blue<br />
                Red 캐스트 중화 ➔ G와 B를 올리거나 Red를 내림
              </div>
              <div className="bg-[#111317] p-3 rounded-lg border border-green-900/30">
                <span className="text-emerald-400 font-bold block mb-1">Magenta ↔ Green</span>
                Magenta = Red + Blue<br />
                Green 캐스트 중화 ➔ R과 B를 올리거나 Green을 내림
              </div>
              <div className="bg-[#111317] p-3 rounded-lg border border-blue-900/30">
                <span className="text-blue-400 font-bold block mb-1">Yellow ↔ Blue</span>
                Yellow = Red + Green<br />
                Yellow 캐스트 중화 ➔ Blue를 올리거나 R과 G를 내림
              </div>
            </div>
          </div>

          {/* Section 3: Photoshop Blending Modes Formulas */}
          <div className="space-y-3 border-t border-[#252b38] pt-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>3. 포토샵 블렌딩 모드 8비트 수학 공식</span>
            </h3>
            <div className="space-y-2">
              {BLEND_MODES.map((m) => (
                <div key={m.id} className="bg-[#111317] p-3 rounded-lg border border-[#252b38]">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-white text-xs">
                      {m.name} ({m.nameKo})
                    </span>
                    <code className="text-blue-300 font-mono text-[11px] bg-[#1a1e28] px-2 py-0.5 rounded">
                      {m.formula}
                    </code>
                  </div>
                  <p className="text-slate-400 text-[11px]">{m.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Gamma 1.0 vs sRGB Gamma 2.2 */}
          <div className="space-y-3 border-t border-[#252b38] pt-5">
            <h3 className="text-sm font-bold text-white">
              4. sRGB 감마(2.2) vs 선형(Gamma 1.0) 혼합의 차이
            </h3>
            <p className="text-slate-400 leading-relaxed">
              인간의 시각 특성상 sRGB는 비선형 지수 함수($V \approx L^{1/2.2}$)로 저장됩니다. 
              이를 단순 덧셈($A+B$)하면 물리적 광량보다 약 30% 어두워져, 
              <strong>Red와 Green의 경계면이 탁한 검붉은 띠(Dirty Dark Band)</strong>로 나타납니다.
            </p>
            <div className="bg-[#111317] p-3.5 rounded-lg border border-[#252b38] text-slate-300">
              <strong className="text-amber-400 block mb-1">Photoshop 설정 위치:</strong>
              <code>Edit &gt; Color Settings &gt; More Options &gt; Blend RGB Colors Using Gamma 1.0</code>
              <p className="text-slate-400 mt-1 text-[11px]">
                이 옵션을 켜면 인코딩된 RGB를 선형 광량($L = (V/255)^{2.2}$)으로 변환하여 물리적으로 가산한 후 재인코딩하므로, 
                경계면의 옐로우와 시안이 맑고 투명하게 에너지를 보존하며 빛납니다.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#282e3c] bg-[#14161b] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
