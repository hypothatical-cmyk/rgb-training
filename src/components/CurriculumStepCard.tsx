import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, ChevronDown, ChevronUp, Sparkles, BookOpen, Target } from 'lucide-react';
import { CurriculumStep, CURRICULUM_STEPS } from '../types/curriculum';

interface CurriculumStepCardProps {
  currentStepIndex: number;
  completedSteps: number[];
  onSelectStep: (stepIndex: number) => void;
  isCurriculumMode: boolean;
  onToggleCurriculumMode: () => void;
}

export const CurriculumStepCard: React.FC<CurriculumStepCardProps> = ({
  currentStepIndex,
  completedSteps,
  onSelectStep,
  isCurriculumMode,
  onToggleCurriculumMode,
}) => {
  const [isTheoryExpanded, setIsTheoryExpanded] = useState(true);
  const step = CURRICULUM_STEPS[currentStepIndex] || CURRICULUM_STEPS[0];
  const isCompleted = completedSteps.includes(step.stepNumber);

  return (
    <div className="bg-[#161820] border border-[#272d3b] rounded-xl overflow-hidden shadow-lg transition-all mb-6">
      {/* Top Banner: Step Navigator */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#1a1d26] border-b border-[#252b38]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-400 font-mono text-xs font-bold flex items-center justify-center border border-blue-500/40">
              {step.stepNumber}
            </span>
            <span className="text-xs font-mono text-slate-400">
              / {CURRICULUM_STEPS.length} 단계
            </span>
          </div>

          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{step.title}</span>
              {isCompleted && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-600/50">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>완료됨</span>
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">{step.subTitle}</p>
          </div>
        </div>

        {/* Step Navigation Buttons & Mode Selector */}
        <div className="flex items-center gap-2">
          {/* Previous Step */}
          <button
            type="button"
            disabled={currentStepIndex === 0}
            onClick={() => onSelectStep(currentStepIndex - 1)}
            className="p-1.5 rounded-lg bg-[#222733] hover:bg-[#2b3140] text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="이전 단계"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Quick Step Indicators */}
          <div className="hidden sm:flex items-center gap-1">
            {CURRICULUM_STEPS.map((s, idx) => {
              const active = idx === currentStepIndex;
              const done = completedSteps.includes(s.stepNumber);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelectStep(idx)}
                  className={`w-6 h-6 rounded-md text-[11px] font-mono font-bold transition-all ${
                    active
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400/50'
                      : done
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/60 hover:bg-emerald-900/60'
                      : 'bg-[#101217] text-slate-500 hover:text-slate-300 border border-[#252a36]'
                  }`}
                  title={`${s.stepNumber}단계: ${s.title}`}
                >
                  {s.stepNumber}
                </button>
              );
            })}
          </div>

          {/* Next Step */}
          <button
            type="button"
            disabled={currentStepIndex === CURRICULUM_STEPS.length - 1}
            onClick={() => onSelectStep(currentStepIndex + 1)}
            className="p-1.5 rounded-lg bg-[#222733] hover:bg-[#2b3140] text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="다음 단계"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Collapse/Expand Theory Card */}
          <button
            type="button"
            onClick={() => setIsTheoryExpanded((prev) => !prev)}
            className="flex items-center gap-1 text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-[#222733] hover:bg-[#2b3140] border border-[#2a3040] transition-colors ml-1"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>이론 브리핑</span>
            {isTheoryExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Bite-sized Theory Explanation Deck (Collapsible) */}
      {isTheoryExpanded && (
        <div className="p-4 bg-[#14161e] grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Card 1: Core Concept */}
          <div className="bg-[#191c25] p-3 rounded-lg border border-[#282f3d] flex flex-col justify-between gap-2">
            <div>
              <span className="font-bold text-white flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span>핵심 원리 브리핑</span>
              </span>
              <p className="text-slate-300 leading-relaxed">{step.theory.summary}</p>
            </div>
            <div className="text-[11px] text-slate-400 bg-[#101216] p-2 rounded border border-[#222631]">
              {step.theory.colorAnalogy}
            </div>
          </div>

          {/* Card 2: Photoshop Application & Formula */}
          <div className="bg-[#191c25] p-3 rounded-lg border border-[#282f3d] flex flex-col justify-between gap-2">
            <div>
              <span className="font-bold text-white flex items-center gap-1.5 mb-1">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <span>포토샵 실무 워크플로</span>
              </span>
              <p className="text-slate-300 leading-relaxed">{step.theory.photoshopApplication}</p>
            </div>
            <div className="font-mono text-[11px] text-blue-300 bg-[#101216] p-2 rounded border border-[#222631]">
              {step.theory.coreRule}
            </div>
          </div>

          {/* Card 3: Clear Challenge Goal */}
          <div className="bg-[#191c25] p-3 rounded-lg border border-[#282f3d] flex flex-col justify-between gap-2">
            <div>
              <span className="font-bold text-white flex items-center gap-1.5 mb-1">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                <span>단계 완료 미션 (연습문제)</span>
              </span>
              <p className="text-slate-300 leading-relaxed font-medium">
                {step.clearCriteria.description}
              </p>
            </div>
            <div className="flex items-center justify-between bg-[#101216] p-2 rounded border border-[#222631]">
              <span className="text-slate-400 text-[11px]">미션 상태:</span>
              <span
                className={`font-semibold font-mono text-[11px] ${
                  isCompleted ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {isCompleted ? '달성 완료 (Mastered)' : '도전 진행 중 (In Progress)'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
