import React from 'react';
import { X, Award, CheckCircle2, Flame, BarChart3, Clock, RotateCcw, ArrowRight } from 'lucide-react';
import { UserProgressData, CURRICULUM_STEPS } from '../types/curriculum';

interface ProgressReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: UserProgressData;
  streak: number;
  xp: number;
  onResetProgress: () => void;
}

export const ProgressReportModal: React.FC<ProgressReportModalProps> = ({
  isOpen,
  onClose,
  progress,
  streak,
  xp,
  onResetProgress,
}) => {
  if (!isOpen) return null;

  const totalAttempted = progress.totalQuestionsSolved;
  const totalSuccess = progress.totalCorrect;
  const overallAccuracy = totalAttempted > 0 ? Math.round((totalSuccess / totalAttempted) * 100) : 0;
  const completedCount = progress.completedSteps.length;
  const curriculumPercentage = Math.round((completedCount / CURRICULUM_STEPS.length) * 100);

  // Determine Title based on XP & completed steps
  let rankTitle = '채널 견습생 (Color Apprentice)';
  let rankBadgeColor = 'bg-slate-800 text-slate-300 border-slate-700';

  if (completedCount >= 6 || xp >= 1500) {
    rankTitle = '포토샵 컬러 마스터 (Photoshop Master Colorist)';
    rankBadgeColor = 'bg-purple-950 text-purple-200 border-purple-500/50';
  } else if (completedCount >= 4 || xp >= 800) {
    rankTitle = '블렌드 아키텍트 (Blend Mode Architect)';
    rankBadgeColor = 'bg-blue-950 text-blue-200 border-blue-500/50';
  } else if (completedCount >= 2 || xp >= 300) {
    rankTitle = '보색 중화 어드바이저 (Neutral Specialist)';
    rankBadgeColor = 'bg-emerald-950 text-emerald-200 border-emerald-500/50';
  }

  // Calculate per-module success rates
  const getModuleRate = (mod: keyof UserProgressData['moduleAttempts']) => {
    const attempts = progress.moduleAttempts[mod];
    const successes = progress.moduleSuccesses[mod];
    if (!attempts) return 0;
    return Math.round((successes / attempts) * 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#181a20] border border-[#2e3544] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#282e3c] sticky top-0 bg-[#181a20]/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-base font-bold text-white">
                학습 진도 & 컬러 마스터리 리포트 (Progress Analytics)
              </h2>
              <p className="text-xs text-slate-400">
                디지털 색채 가산혼합 및 포토샵 채널 보정 훈련 종합 분석
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#252b38] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Report Body */}
        <div className="p-6 space-y-6">
          {/* Top Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-[#121419] p-3.5 rounded-xl border border-[#262c38] flex flex-col justify-between">
              <span className="text-[11px] text-slate-400 font-medium">커리큘럼 진척도</span>
              <div className="my-1">
                <span className="text-xl font-black text-white font-mono">
                  {completedCount} <span className="text-xs text-slate-500 font-normal">/ {CURRICULUM_STEPS.length}단계</span>
                </span>
              </div>
              <div className="w-full bg-[#1e232e] h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all"
                  style={{ width: `${curriculumPercentage}%` }}
                />
              </div>
            </div>

            <div className="bg-[#121419] p-3.5 rounded-xl border border-[#262c38] flex flex-col justify-between">
              <span className="text-[11px] text-slate-400 font-medium">종합 정답률</span>
              <div className="my-1">
                <span className="text-xl font-black text-emerald-400 font-mono">
                  {overallAccuracy}%
                </span>
                <span className="text-xs text-slate-500 ml-1 font-mono">({totalSuccess}/{totalAttempted})</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">인간 지각 일치 기준</span>
            </div>

            <div className="bg-[#121419] p-3.5 rounded-xl border border-[#262c38] flex flex-col justify-between">
              <span className="text-[11px] text-slate-400 font-medium">연속 정답 (Streak)</span>
              <div className="my-1 flex items-center gap-1.5">
                <Flame className="w-5 h-5 text-amber-500" />
                <span className="text-xl font-black text-white font-mono">{streak}회</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">콤보 보너스 활성화</span>
            </div>

            <div className="bg-[#121419] p-3.5 rounded-xl border border-[#262c38] flex flex-col justify-between">
              <span className="text-[11px] text-slate-400 font-medium">누적 획득 경험치</span>
              <div className="my-1 flex items-center gap-1.5">
                <Award className="w-5 h-5 text-purple-400" />
                <span className="text-xl font-black text-purple-300 font-mono">{xp.toLocaleString()} XP</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">스킬 레벨 반영</span>
            </div>
          </div>

          {/* Colorist Title Badge Banner */}
          <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${rankBadgeColor}`}>
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-slate-300 block">현재 획득 칭호</span>
                <span className="text-sm font-bold text-white tracking-wide">{rankTitle}</span>
              </div>
            </div>
            <div className="text-xs font-mono text-slate-300">
              {completedCount === 6
                ? '모든 커리큘럼 단계를 완벽히 수료했습니다! 🏆'
                : `마스터 달성까지 ${6 - completedCount}개 단계 남음`}
            </div>
          </div>

          {/* Module-by-Module Mastery Analysis */}
          <div className="bg-[#121419] p-4 rounded-xl border border-[#262c38] space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              영역별 컬러 마스터리 분석 (Domain Competencies)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Sculptor */}
              <div className="bg-[#191c25] p-3 rounded-lg border border-[#282f3d]">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-200">1. 가산혼합 인지력 (채널 조각)</span>
                  <span className="font-mono text-blue-400 font-bold">{getModuleRate('sculptor')}%</span>
                </div>
                <div className="w-full bg-[#101216] h-1.5 rounded-full overflow-hidden mb-1.5">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${getModuleRate('sculptor')}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between font-mono">
                  <span>시도: {progress.moduleAttempts.sculptor}회</span>
                  <span>적중: {progress.moduleSuccesses.sculptor}회</span>
                </div>
              </div>

              {/* Neutralizer */}
              <div className="bg-[#191c25] p-3 rounded-lg border border-[#282f3d]">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-200">2. 커브 캐스트 중화력 (보색 밸런스)</span>
                  <span className="font-mono text-emerald-400 font-bold">{getModuleRate('neutralizer')}%</span>
                </div>
                <div className="w-full bg-[#101216] h-1.5 rounded-full overflow-hidden mb-1.5">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${getModuleRate('neutralizer')}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between font-mono">
                  <span>시도: {progress.moduleAttempts.neutralizer}회</span>
                  <span>적중: {progress.moduleSuccesses.neutralizer}회</span>
                </div>
              </div>

              {/* Blends */}
              <div className="bg-[#191c25] p-3 rounded-lg border border-[#282f3d]">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-200">3. 블렌드 모드 연산 예측력</span>
                  <span className="font-mono text-pink-400 font-bold">{getModuleRate('blends')}%</span>
                </div>
                <div className="w-full bg-[#101216] h-1.5 rounded-full overflow-hidden mb-1.5">
                  <div
                    className="bg-pink-500 h-full rounded-full"
                    style={{ width: `${getModuleRate('blends')}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between font-mono">
                  <span>시도: {progress.moduleAttempts.blends}회</span>
                  <span>적중: {progress.moduleSuccesses.blends}회</span>
                </div>
              </div>

              {/* Decoder */}
              <div className="bg-[#191c25] p-3 rounded-lg border border-[#282f3d]">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-200">4. 합성 포렌식 역추론력</span>
                  <span className="font-mono text-purple-400 font-bold">{getModuleRate('decoder')}%</span>
                </div>
                <div className="w-full bg-[#101216] h-1.5 rounded-full overflow-hidden mb-1.5">
                  <div
                    className="bg-purple-500 h-full rounded-full"
                    style={{ width: `${getModuleRate('decoder')}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between font-mono">
                  <span>시도: {progress.moduleAttempts.decoder}회</span>
                  <span>적중: {progress.moduleSuccesses.decoder}회</span>
                </div>
              </div>
            </div>
          </div>

          {/* Curriculum 6-Step Checklist */}
          <div className="bg-[#121419] p-4 rounded-xl border border-[#262c38] space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              6단계 커리큘럼 완료 현황 (Curriculum Stages)
            </h3>
            <div className="space-y-2">
              {CURRICULUM_STEPS.map((s) => {
                const done = progress.completedSteps.includes(s.stepNumber);
                return (
                  <div
                    key={s.id}
                    className={`p-3 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                      done
                        ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                        : 'bg-[#181a22] border-[#262c38] text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                          done ? 'bg-emerald-600 text-white' : 'bg-[#222733] text-slate-500'
                        }`}
                      >
                        {done ? <CheckCircle2 className="w-4 h-4" /> : s.stepNumber}
                      </div>
                      <div>
                        <span className="font-bold text-white block">{s.title}</span>
                        <span className="text-[11px] text-slate-400">{s.clearCriteria.description}</span>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                        done ? 'bg-emerald-900/60 text-emerald-300' : 'bg-[#101217] text-slate-500'
                      }`}
                    >
                      {done ? '수료 완료' : '미완료'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity Timeline */}
          {progress.recentHistory.length > 0 && (
            <div className="bg-[#121419] p-4 rounded-xl border border-[#262c38] space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>최근 훈련 기록 (Recent Activity)</span>
              </h3>
              <div className="divide-y divide-[#222633] text-xs font-mono">
                {progress.recentHistory.slice(0, 6).map((item) => (
                  <div key={item.id} className="py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.success ? 'bg-emerald-400' : 'bg-red-400'
                        }`}
                      />
                      <span className="font-semibold text-slate-200 font-sans">{item.moduleNameKo}</span>
                      <span className="text-slate-500 text-[11px]">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400">{item.metricLabel}: {item.metricValue}</span>
                      <span className={item.success ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                        +{item.score} XP
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#282e3c] bg-[#14161b] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (confirm('모든 학습 진도 및 기록을 초기화하시겠습니까?')) {
                onResetProgress();
                onClose();
              }
            }}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-950/20 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>진도 초기화</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-md"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
