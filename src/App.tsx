import React, { useState, useEffect } from 'react';
import { Header, ActiveModule } from './components/Header';
import { ModuleSculptor } from './components/ModuleSculptor';
import { ModuleCurvesNeutralizer } from './components/ModuleCurvesNeutralizer';
import { ModuleBlendPredictor } from './components/ModuleBlendPredictor';
import { ModuleBlendDecoder } from './components/ModuleBlendDecoder';
import { ColorTheoryModal } from './components/ColorTheoryModal';
import { CurriculumStepCard } from './components/CurriculumStepCard';
import { ProgressReportModal } from './components/ProgressReportModal';
import {
  CurriculumStep,
  CURRICULUM_STEPS,
  UserProgressData,
  INITIAL_USER_PROGRESS,
} from './types/curriculum';
import { downloadStandaloneHtml } from './utils/singleHtmlExport';

export default function App() {
  const [activeModule, setActiveModule] = useState<ActiveModule>('sculptor');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isCurriculumMode, setIsCurriculumMode] = useState<boolean>(true);

  // Persistent progress data
  const [progress, setProgress] = useState<UserProgressData>(() => {
    try {
      const saved = localStorage.getItem('chromashift_user_progress');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_USER_PROGRESS;
  });

  const [streak, setStreak] = useState<number>(() => {
    return parseInt(localStorage.getItem('chromashift_streak') || '0', 10);
  });
  const [xp, setXp] = useState<number>(() => {
    return parseInt(localStorage.getItem('chromashift_xp') || '0', 10);
  });
  const [linearGamma, setLinearGamma] = useState<boolean>(() => {
    return localStorage.getItem('chromashift_gamma_1_0') === 'true';
  });

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('chromashift_user_progress', JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    localStorage.setItem('chromashift_streak', streak.toString());
  }, [streak]);

  useEffect(() => {
    localStorage.setItem('chromashift_xp', xp.toString());
  }, [xp]);

  useEffect(() => {
    localStorage.setItem('chromashift_gamma_1_0', linearGamma ? 'true' : 'false');
  }, [linearGamma]);

  // Subtle web audio sound synthesizer
  const playSound = (type: 'success' | 'fail' | 'level_clear') => {
    try {
      const audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'level_clear') {
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        osc.frequency.exponentialRampToValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
        osc.frequency.exponentialRampToValueAtTime(1046.5, audioCtx.currentTime + 0.3); // C6
        gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.55);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.55);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, audioCtx.currentTime + 0.18); // G5
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } else {
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(160, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      }
    } catch {
      // AudioContext policy
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2800);
  };

  // Handle module completion event
  const recordAttempt = (
    mod: ActiveModule,
    moduleNameKo: string,
    success: boolean,
    score: number,
    metricLabel: string,
    metricValue: string
  ) => {
    setProgress((prev) => {
      const attempts = { ...prev.moduleAttempts, [mod]: prev.moduleAttempts[mod] + 1 };
      const successes = { ...prev.moduleSuccesses, [mod]: prev.moduleSuccesses[mod] + (success ? 1 : 0) };

      // Check step completion
      const currentStep = CURRICULUM_STEPS[currentStepIndex];
      let newlyCompleted = [...prev.completedSteps];

      if (success && currentStep && currentStep.moduleId === mod) {
        if (!newlyCompleted.includes(currentStep.stepNumber)) {
          newlyCompleted.push(currentStep.stepNumber);
          playSound('level_clear');
          showToast(`축하합니다! ${currentStep.title} 완료! 🏆`);
        }
      }

      const newHistoryItem = {
        id: `act_${Date.now()}_${Math.random()}`,
        timestamp: Date.now(),
        moduleId: mod,
        moduleNameKo,
        score,
        metricLabel,
        metricValue,
        success,
      };

      return {
        ...prev,
        completedSteps: newlyCompleted,
        totalQuestionsSolved: prev.totalQuestionsSolved + 1,
        totalCorrect: prev.totalCorrect + (success ? 1 : 0),
        moduleAttempts: attempts,
        moduleSuccesses: successes,
        recentHistory: [newHistoryItem, ...prev.recentHistory].slice(0, 20),
      };
    });
  };

  const handleModuleSuccess = (mod: ActiveModule, moduleNameKo: string, score: number, metricValue = '성공') => {
    playSound('success');
    setStreak((prev) => prev + 1);
    setXp((prev) => prev + score);
    recordAttempt(mod, moduleNameKo, true, score, '지표', metricValue);
    showToast(`+${score} XP 획득! 정답입니다! 🎉`);
  };

  const handleModuleFailure = (mod: ActiveModule, moduleNameKo: string, metricValue = '오차 초과') => {
    playSound('fail');
    setStreak(0);
    recordAttempt(mod, moduleNameKo, false, 0, '오차', metricValue);
    showToast('아쉽습니다. 이론 브리핑과 채널 오차를 확인해 보세요.');
  };

  const handleSelectStep = (stepIdx: number) => {
    setCurrentStepIndex(stepIdx);
    const targetStep = CURRICULUM_STEPS[stepIdx];
    if (targetStep) {
      setActiveModule(targetStep.moduleId);
    }
  };

  const handleResetProgress = () => {
    setProgress(INITIAL_USER_PROGRESS);
    setStreak(0);
    setXp(0);
    localStorage.removeItem('chromashift_user_progress');
    localStorage.removeItem('chromashift_streak');
    localStorage.removeItem('chromashift_xp');
    showToast('모든 학습 진도 및 기록이 초기화되었습니다.');
  };

  return (
    <div className="min-h-screen bg-[#111317] text-slate-200 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        activeModule={activeModule}
        onSelectModule={(mod) => {
          setActiveModule(mod);
          // Sync step if current step's module does not match
          const matchingStepIdx = CURRICULUM_STEPS.findIndex((s) => s.moduleId === mod);
          if (matchingStepIdx !== -1) setCurrentStepIndex(matchingStepIdx);
        }}
        streak={streak}
        xp={xp}
        linearGamma={linearGamma}
        onToggleGamma={() => setLinearGamma((prev) => !prev)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        completedStepsCount={progress.completedSteps.length}
        totalStepsCount={CURRICULUM_STEPS.length}
      />

      {/* Main Sandbox Stage */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
        {/* Step-by-Step Curriculum Card with Bite-Sized Theory */}
        <CurriculumStepCard
          currentStepIndex={currentStepIndex}
          completedSteps={progress.completedSteps}
          onSelectStep={handleSelectStep}
          isCurriculumMode={isCurriculumMode}
          onToggleCurriculumMode={() => setIsCurriculumMode((prev) => !prev)}
        />

        {/* Module 1: Channel Sculptor */}
        {activeModule === 'sculptor' && (
          <ModuleSculptor
            onSuccess={(score) => handleModuleSuccess('sculptor', '채널 조각가', score, 'ΔE 합격')}
            onFailure={() => handleModuleFailure('sculptor', '채널 조각가', 'ΔE 초과')}
          />
        )}

        {/* Module 2: Curves Cast Neutralizer */}
        {activeModule === 'neutralizer' && (
          <ModuleCurvesNeutralizer
            onSuccess={(score) => handleModuleSuccess('neutralizer', '커브 캐스트 중화', score, '중립 성공')}
            onFailure={() => handleModuleFailure('neutralizer', '커브 캐스트 중화', '불균형 잔존')}
          />
        )}

        {/* Module 3: Blend Mode Predictor */}
        {activeModule === 'blends' && (
          <ModuleBlendPredictor
            onSuccess={(score) => handleModuleSuccess('blends', '블렌드 모드 예측', score, '정답')}
            onFailure={() => handleModuleFailure('blends', '블렌드 모드 예측', '오답')}
            useLinearGamma={linearGamma}
          />
        )}

        {/* Module 4: Blend Mode Decoder */}
        {activeModule === 'decoder' && (
          <ModuleBlendDecoder
            onSuccess={(score) => handleModuleSuccess('decoder', '블렌드 디코더', score, '추리 적중')}
            onFailure={() => handleModuleFailure('decoder', '블렌드 디코더', '추리 실패')}
            useLinearGamma={linearGamma}
          />
        )}
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1e232d] text-white px-4 py-2.5 rounded-xl border border-blue-500/50 shadow-2xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Learning Progress Report Modal */}
      <ProgressReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        progress={progress}
        streak={streak}
        xp={xp}
        onResetProgress={handleResetProgress}
      />

      {/* Educational Color Theory Reference Modal */}
      <ColorTheoryModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Quiet Footer */}
      <footer className="border-t border-[#202530] bg-[#0e1014] px-6 py-4 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span>ChromaShift Lab · Photoshop 가산혼합 & 단계별 채널 보정 훈련</span>
          <span className="hidden sm:inline text-slate-600 mx-2">|</span>
          <span className="hidden sm:inline">완전 오프라인 동작 지원</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setIsReportOpen(true)}
            className="text-emerald-400 hover:text-emerald-300 hover:underline"
          >
            학습진도 리포트 열기
          </button>
          <button
            type="button"
            onClick={downloadStandaloneHtml}
            className="text-blue-400 hover:text-blue-300 hover:underline"
          >
            오프라인 단일 HTML 파일 받기 (.html)
          </button>
        </div>
      </footer>
    </div>
  );
}
