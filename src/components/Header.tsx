import React from 'react';
import { Download, Flame, Award, Sliders, Layers, Sparkles, HelpCircle, BarChart3, GraduationCap } from 'lucide-react';
import { downloadStandaloneHtml } from '../utils/singleHtmlExport';

export type ActiveModule = 'sculptor' | 'neutralizer' | 'blends' | 'decoder';

interface HeaderProps {
  activeModule: ActiveModule;
  onSelectModule: (module: ActiveModule) => void;
  streak: number;
  xp: number;
  linearGamma: boolean;
  onToggleGamma: () => void;
  onOpenHelp: () => void;
  onOpenReport: () => void;
  completedStepsCount: number;
  totalStepsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeModule,
  onSelectModule,
  streak,
  xp,
  linearGamma,
  onToggleGamma,
  onOpenHelp,
  onOpenReport,
  completedStepsCount,
  totalStepsCount,
}) => {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-[#242933] bg-[#14161b] sticky top-0 z-30">
      {/* Zone 1: Brand Wordmark (Zero-Pill, Single line) */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 via-green-500 to-blue-500 flex items-center justify-center p-0.5 shadow-md">
          <div className="w-full h-full bg-[#14161b] rounded-[6px] flex items-center justify-center">
            <span className="text-xs font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-green-300 to-blue-400">
              RGB
            </span>
          </div>
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
            ChromaShift Lab
          </span>
          <span className="hidden sm:inline-block text-xs text-slate-400 ml-2">
            Photoshop 가산혼합 단계별 훈련
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Links / Sandbox Tabs */}
      <nav className="flex items-center gap-1.5 p-1 bg-[#0c0e12] rounded-lg border border-[#242933]">
        <button
          type="button"
          onClick={() => onSelectModule('sculptor')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
            activeModule === 'sculptor'
              ? 'bg-[#222733] text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-red-400" />
          <span>1. 채널 조각가</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectModule('neutralizer')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
            activeModule === 'neutralizer'
              ? 'bg-[#222733] text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-green-400" />
          <span>2. 커브 캐스트 중화</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectModule('blends')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
            activeModule === 'blends'
              ? 'bg-[#222733] text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>3. 블렌드 모드 예측</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectModule('decoder')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
            activeModule === 'decoder'
              ? 'bg-[#222733] text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-purple-400" />
          <span>4. 블렌드 디코더</span>
        </button>
      </nav>

      {/* Zone 3: Stats & Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Streak & XP */}
        <div className="hidden lg:flex items-center gap-3 text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1 text-amber-400">
            <Flame className="w-3.5 h-3.5" />
            <strong className="text-white">{streak}</strong>
          </span>
          <span className="text-slate-600">|</span>
          <span>{xp.toLocaleString()} XP</span>
        </div>

        {/* Learning Progress Report Button */}
        <button
          type="button"
          onClick={onOpenReport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-[#1f2430] hover:bg-[#282f3f] border border-[#2e3748] rounded-md transition-colors shadow-sm"
          title="학습 진도 리포트 & 도메인 마스터리 열기"
        >
          <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
          <span>진도 리포트</span>
          <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-600/40">
            {completedStepsCount}/{totalStepsCount}
          </span>
        </button>

        {/* Gamma 1.0 Switch */}
        <button
          type="button"
          onClick={onToggleGamma}
          title="Photoshop의 'Blend RGB Colors Using Gamma 1.0' 옵션 토글"
          className={`px-2.5 py-1 text-[11px] font-mono rounded-md border transition-all ${
            linearGamma
              ? 'bg-blue-950/60 text-blue-300 border-blue-700/60'
              : 'bg-[#181a20] text-slate-400 border-[#2a2f3b] hover:text-slate-200'
          }`}
        >
          {linearGamma ? 'Gamma 1.0' : 'Gamma 2.2'}
        </button>

        {/* Color Theory Help */}
        <button
          type="button"
          onClick={onOpenHelp}
          className="p-1.5 text-slate-400 hover:text-white rounded-md bg-[#181a20] border border-[#2a2f3b] hover:border-slate-500 transition-colors"
          title="포토샵 색채 이론 및 공식 가이드"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Download Standalone Single HTML */}
        <button
          type="button"
          onClick={downloadStandaloneHtml}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md shadow-sm transition-colors whitespace-nowrap"
          title="외부 의존성 없는 100% 오프라인 단일 HTML 파일로 내려받기"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">단일 HTML</span>
        </button>
      </div>
    </header>
  );
};
