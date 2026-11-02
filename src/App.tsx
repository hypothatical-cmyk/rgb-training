import React, { useState, useEffect, useRef } from 'react';
import {
  ALL,
  UNITS,
  Lesson,
  Unit,
  Question,
  AppState,
  loadStoredState,
  saveState,
  getStreakNow,
  getDayXp,
  GOAL_XP,
  todayStr,
  sample,
  shuffle,
} from './engine/curriculum';
import { css, CH, CHC } from './engine/blendMath';

interface ActiveLessonState {
  lesson: Lesson & { unit?: Unit };
  queue: Question[];
  total: number;
  solved: number;
  first: number;
  wrong: number;
  showRule: boolean;
}

export default function App() {
  const [appState, setAppState] = useState<AppState>(loadStoredState);
  const [view, setView] = useState<'home' | 'lesson' | 'done'>('home');
  const [activeLesson, setActiveLesson] = useState<ActiveLessonState | null>(null);

  // Question interaction state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [switchValues, setSwitchValues] = useState<[number, number, number]>([0, 0, 0]);
  const [evaluated, setEvaluated] = useState<{ ok: boolean; ansText: string } | null>(null);

  const visualRef = useRef<HTMLDivElement | null>(null);
  const afterRef = useRef<HTMLDivElement | null>(null);
  const currentNodeRef = useRef<HTMLDivElement | null>(null);

  // Sync state to localStorage safely
  const updateState = (updater: (prev: AppState) => AppState) => {
    setAppState((prev) => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  };

  // Scroll to current lesson on home load
  useEffect(() => {
    if (view === 'home') {
      setTimeout(() => {
        if (currentNodeRef.current) {
          currentNodeRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }, 100);
    }
  }, [view]);

  // Current lesson index in the linear path
  const currentLessonIndex = ALL.findIndex((l) => !appState.done[l.id]);

  // Start a lesson
  const startLesson = (lesson: Lesson & { unit?: Unit }, customQuestions?: Question[]) => {
    const queue = customQuestions || lesson.gen();
    setActiveLesson({
      lesson,
      queue,
      total: queue.length,
      solved: 0,
      first: 0,
      wrong: 0,
      showRule: !customQuestions && !!lesson.rule,
    });
    setSelectedOption(null);
    setSwitchValues([0, 0, 0]);
    setEvaluated(null);
    setView('lesson');
    window.scrollTo(0, 0);
  };

  // Start Quick Practice (빠른 복습)
  const startQuickPractice = () => {
    const pool = ALL.filter((l) => appState.done[l.id]);
    if (pool.length === 0) return;
    const qs = shuffle(pool.flatMap((l) => sample(l.gen(), 2))).slice(0, 8);
    startLesson(
      {
        id: 'practice',
        title: '빠른 복습',
        unit: { id: 'u0', title: '빠른 복습', sub: '복습', color: '#4ea4ff', desc: '완료한 레슨 복습', lessons: [] },
        gen: () => qs,
      },
      qs
    );
  };

  // Current active question
  const currentQ = activeLesson && activeLesson.queue.length > 0 ? activeLesson.queue[0] : null;

  // Render visual canvas whenever question changes
  useEffect(() => {
    if (view === 'lesson' && !activeLesson?.showRule && currentQ && visualRef.current) {
      visualRef.current.innerHTML = '';
      if (currentQ.visual) {
        currentQ.visual(visualRef.current);
      }
    }
  }, [view, activeLesson?.showRule, currentQ]);

  // Render after-visual (e.g. before/after scene comparison) inside feedback sheet
  useEffect(() => {
    if (evaluated && currentQ?.after && afterRef.current) {
      afterRef.current.innerHTML = '';
      currentQ.after(afterRef.current);
    }
  }, [evaluated, currentQ]);

  // Check Answer Handler
  const handleCheck = () => {
    if (!currentQ || !activeLesson || evaluated) return;

    if (currentQ.type === 'choice') {
      if (selectedOption === null) return;
      const ok = selectedOption === currentQ.answer;
      const opt = currentQ.options![currentQ.answer!];
      const ansText = opt.text || (opt.color ? opt.color.join(' · ') : '');
      gradeAnswer(ok, ansText);
    } else if (currentQ.type === 'switch') {
      const ok = switchValues.every((v, i) => v === currentQ.target![i]);
      const ansText = currentQ.target!.join(' · ');
      gradeAnswer(ok, ansText);
    }
  };

  const gradeAnswer = (ok: boolean, ansText: string) => {
    if (!currentQ || !activeLesson) return;
    setEvaluated({ ok, ansText });
    // Note: Do NOT slice or mutate the queue yet so currentQ remains displayed with feedback
  };

  // Continue to Next Question or Finish
  const handleContinue = () => {
    if (!activeLesson || !currentQ || !evaluated) return;

    const ok = evaluated.ok;
    const isRetry = !!currentQ.retry;
    const newSolved = ok ? activeLesson.solved + 1 : activeLesson.solved;
    const newFirst = ok && !isRetry ? activeLesson.first + 1 : activeLesson.first;
    const newWrong = !ok ? activeLesson.wrong + 1 : activeLesson.wrong;

    const remainingQueue = ok
      ? activeLesson.queue.slice(1)
      : [...activeLesson.queue.slice(1), { ...currentQ, retry: true }];

    setSelectedOption(null);
    setSwitchValues([0, 0, 0]);
    setEvaluated(null);

    if (remainingQueue.length === 0) {
      finishLesson(newFirst, newWrong);
    } else {
      setActiveLesson((prev) =>
        prev
          ? {
              ...prev,
              solved: newSolved,
              first: newFirst,
              wrong: newWrong,
              queue: remainingQueue,
            }
          : null
      );
    }
  };

  // Finish Lesson
  const finishLesson = (finalFirst?: number, finalWrong?: number) => {
    if (!activeLesson) return;
    const firstCount = finalFirst !== undefined ? finalFirst : activeLesson.first;
    const wrongCount = finalWrong !== undefined ? finalWrong : activeLesson.wrong;
    const gained = 10 + firstCount * 2;
    const today = todayStr();

    updateState((prev) => {
      const nextDone = activeLesson.lesson.id !== 'practice' ? { ...prev.done, [activeLesson.lesson.id]: true } : prev.done;
      const nextXp = prev.xp + gained;
      const nextDayXp = (prev.day === today ? prev.dayXp : 0) + gained;
      const curStreak = getStreakNow(prev);
      const nextStreak = prev.last !== today ? curStreak + 1 : curStreak;

      return {
        ...prev,
        done: nextDone,
        xp: nextXp,
        dayXp: nextDayXp,
        day: today,
        streak: nextStreak,
        last: today,
      };
    });

    setActiveLesson((prev) =>
      prev
        ? {
            ...prev,
            first: firstCount,
            wrong: wrongCount,
            queue: [],
          }
        : null
    );

    setView('done');
  };

  // Keyboard accessibility
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (view !== 'lesson' && view !== 'done') return;

      if (view === 'done') {
        if (e.key === 'Enter') {
          e.preventDefault();
          setView('home');
        }
        return;
      }

      if (activeLesson?.showRule) {
        if (e.key === 'Enter') {
          e.preventDefault();
          setActiveLesson((prev) => (prev ? { ...prev, showRule: false } : null));
        }
        return;
      }

      if (evaluated) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleContinue();
        }
        return;
      }

      if (currentQ?.type === 'choice' && currentQ.options) {
        if (e.key >= '1' && e.key <= String(currentQ.options.length)) {
          setSelectedOption(Number(e.key) - 1);
        } else if (e.key === 'Enter' && selectedOption !== null) {
          e.preventDefault();
          handleCheck();
        }
      } else if (currentQ?.type === 'switch') {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleCheck();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [view, activeLesson?.showRule, evaluated, selectedOption, switchValues, currentQ]);

  // Icons
  const IconDone = (
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
  const IconPlay = (
    <svg viewBox="0 0 24 24" fill="#fff">
      <path d="M8 5.5v13l10.5-6.5z" />
    </svg>
  );
  const IconLock = (
    <svg viewBox="0 0 24 24" fill="#7a7a7a">
      <path d="M7 10V8a5 5 0 0110 0v2h1a1 1 0 011 1v9a1 1 0 01-1 1H6a1 1 0 01-1-1v-9a1 1 0 011-1zm2 0h6V8a3 3 0 00-6 0z" />
    </svg>
  );

  const streakVal = getStreakNow(appState);
  const dayXpVal = getDayXp(appState);
  const anyDone = Object.keys(appState.done).length > 0;

  // Render Top Header
  const renderTopBar = () => (
    <div className="top">
      <div className="brand">
        <i>
          <b style={{ background: 'var(--r)' }} />
          <b style={{ background: 'var(--g)' }} />
          <b style={{ background: 'var(--b)' }} />
        </i>
        ChromaShift
      </div>
      <span className="stat" title="연속 학습일">
        <span className={`flame ${streakVal ? '' : 'off'}`} />
        {streakVal}
      </span>
      <span className="stat" title="총 XP">
        <span className="gem" />
        {appState.xp}
      </span>
    </div>
  );

  // -------------------------
  // 1. VIEW: LESSON
  // -------------------------
  if (view === 'lesson' && activeLesson) {
    // 1-A. 규칙 카드 (Rule Card)
    if (activeLesson.showRule && activeLesson.lesson.rule) {
      const r = activeLesson.lesson.rule;
      return (
        <div className="app">
          <div className="lesson">
            <div className="lhead">
              <button
                type="button"
                className="x"
                aria-label="레슨 나가기"
                onClick={() => setView('home')}
              >
                ×
              </button>
              <div className="prog">
                <span style={{ width: `${(activeLesson.solved / activeLesson.total) * 100}%` }} />
              </div>
            </div>

            <div className="qbody">
              <span className="tag">새 규칙</span>
              <div className="rule">
                <h3>{r.h}</h3>
                {r.formula && (
                  <span className="formula" style={{ whiteSpace: 'pre-wrap' }}>
                    {r.formula}
                  </span>
                )}
                <ul>
                  {r.items.map((item, idx) => (
                    <li key={idx} dangerouslySetInnerHTML={{ __html: item }} />
                  ))}
                </ul>
                {activeLesson.lesson.neutral && (
                  <div className="neutral">
                    <i style={{ background: css(activeLesson.lesson.neutral) }} />
                    중립색 (칠해도 변화 없는 색)
                  </div>
                )}
              </div>
            </div>

            <div className="dock">
              <button
                type="button"
                className="cta"
                onClick={() => setActiveLesson((prev) => (prev ? { ...prev, showRule: false } : null))}
              >
                알겠어요, 풀어볼게요
              </button>
            </div>
          </div>
        </div>
      );
    }

    // 1-B. 문제 화면 (Active Question)
    if (currentQ) {
      const isChoice = currentQ.type === 'choice';
      const isSwitch = currentQ.type === 'switch';
      const isChecked = evaluated !== null;
      const displayedSolved = evaluated?.ok ? activeLesson.solved + 1 : activeLesson.solved;

      return (
        <div className="app">
          <div className="lesson">
            <div className="lhead">
              <button
                type="button"
                className="x"
                aria-label="레슨 나가기"
                onClick={() => setView('home')}
              >
                ×
              </button>
              <div className="prog">
                <span style={{ width: `${Math.min(100, (displayedSolved / activeLesson.total) * 100)}%` }} />
              </div>
            </div>

            <div className="qbody">
              <span className="tag">{activeLesson.lesson.title}</span>
              {currentQ.retry && <span className="retry">다시 풀기</span>}
              <div className="prompt" dangerouslySetInnerHTML={{ __html: currentQ.prompt }} />

              {/* Visual Canvas/Swatches Container */}
              {currentQ.visual && <div className="visual" ref={visualRef} />}

              {/* Question Type: Choice */}
              {isChoice && currentQ.options && (
                <div
                  className={`opts ${
                    currentQ.options.some((o) => o.color) || currentQ.options.every((o) => o.mono)
                      ? 'grid'
                      : ''
                  }`}
                >
                  {currentQ.options.map((opt, idx) => {
                    const isSel = selectedOption === idx;
                    const isRight = isChecked && idx === currentQ.answer;
                    const isWrong = isChecked && isSel && idx !== currentQ.answer;

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={isChecked}
                        className={`opt ${isSel ? 'sel' : ''} ${isRight ? 'right' : ''} ${
                          isWrong ? 'wrong' : ''
                        }`}
                        onClick={() => setSelectedOption(idx)}
                      >
                        <span className="k">{idx + 1}</span>
                        {opt.color && <span className="s" style={{ background: css(opt.color) }} />}
                        <span className={opt.mono ? 'mono' : ''}>{opt.text || ''}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Question Type: Switch */}
              {isSwitch && currentQ.target && currentQ.levels && (
                <div>
                  <div className="visual" style={{ marginBottom: 14 }}>
                    <div className="sw">
                      <div style={{ background: css(currentQ.target) }} />
                      <span>목표</span>
                    </div>
                    <div className="op">
                      <b>→</b>
                    </div>
                    <div className="sw">
                      <div style={{ background: css(switchValues) }} />
                      <span>내가 만든 색</span>
                      <b>{switchValues.join(' · ')}</b>
                    </div>
                  </div>

                  <div className="mixer">
                    {[0, 1, 2].map((chIdx) => (
                      <div key={chIdx} className="mix-row">
                        <b style={{ color: CHC[chIdx] }}>{CH[chIdx]}</b>
                        <div className="lv" style={{ ['--cc' as string]: CHC[chIdx] }}>
                          {currentQ.levels!.map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              disabled={isChecked}
                              className={switchValues[chIdx] === lvl ? 'on' : ''}
                              onClick={() => {
                                const next = [...switchValues] as [number, number, number];
                                next[chIdx] = lvl;
                                setSwitchValues(next);
                              }}
                            >
                              {currentQ.levels!.length === 2
                                ? lvl
                                  ? '켜기 255'
                                  : '끄기 0'
                                : lvl}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Bottom Dock */}
            <div className="dock">
              {evaluated ? (
                <div className={`fb ${evaluated.ok ? 'ok' : 'bad'}`}>
                  <h3>
                    {evaluated.ok
                      ? ['정확해요', '맞아요', '계산 그대로예요'][Math.floor(Math.random() * 3)]
                      : '다시 생각해 봐요'}
                  </h3>
                  {!evaluated.ok && (
                    <p>
                      정답: <span className="ans">{evaluated.ansText}</span>
                    </p>
                  )}
                  <p dangerouslySetInnerHTML={{ __html: currentQ.explain }} />
                  {currentQ.after && <div className="after" ref={afterRef} />}
                  <button
                    type="button"
                    className={`cta ${evaluated.ok ? 'ok' : 'bad'}`}
                    onClick={handleContinue}
                  >
                    계속
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="cta"
                  disabled={isChoice ? selectedOption === null : false}
                  onClick={handleCheck}
                >
                  확인
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }
  }

  // -------------------------
  // 2. VIEW: DONE
  // -------------------------
  if (view === 'done' && activeLesson) {
    const gained = 10 + activeLesson.first * 2;
    const acc = Math.round((activeLesson.first / activeLesson.total) * 100);

    return (
      <div className="app">
        {renderTopBar()}
        <div className="done-screen">
          <div className="rgbburst">
            <span />
            <span />
            <span />
          </div>

          <h2>{activeLesson.lesson.title} 완료</h2>

          <div className="tiles">
            <div className="tile" style={{ borderColor: 'var(--accent)' }}>
              <small>획득 XP</small>
              <b>+{gained}</b>
            </div>
            <div className="tile" style={{ borderColor: 'var(--ok)' }}>
              <small>첫 시도 정답률</small>
              <b>{acc}%</b>
            </div>
            <div className="tile" style={{ borderColor: '#ff9b3d' }}>
              <small>연속 학습</small>
              <b>{appState.streak}일</b>
            </div>
          </div>

          {activeLesson.wrong > 0 && (
            <p style={{ color: 'var(--muted)', margin: 0 }}>
              틀렸던 {activeLesson.wrong}문제는 다시 풀어서 넘어왔어요.
            </p>
          )}

          <button
            type="button"
            className="cta"
            style={{ maxWidth: 360 }}
            onClick={() => setView('home')}
          >
            계속하기
          </button>

          {activeLesson.lesson.id !== 'practice' && (
            <button
              type="button"
              className="practice"
              onClick={() => startLesson(activeLesson.lesson)}
            >
              같은 레슨 새 문제로 다시
            </button>
          )}
        </div>
      </div>
    );
  }

  // -------------------------
  // 3. DEFAULT / FALLBACK: HOME
  // -------------------------
  let globalIdx = 0;
  return (
    <div className="app">
      {renderTopBar()}

      {/* 오늘의 목표 카드 */}
      <div className="goal">
        <div>
          <b>오늘의 목표</b>{' '}
          <small className="mono">
            {Math.min(dayXpVal, GOAL_XP)} / {GOAL_XP} XP
          </small>
        </div>
        <button
          type="button"
          className="practice"
          disabled={!anyDone}
          onClick={startQuickPractice}
        >
          빠른 복습
        </button>
        <div className="bar">
          <span style={{ width: `${Math.min(100, (dayXpVal / GOAL_XP) * 100)}%` }} />
        </div>
      </div>

      {/* 7개 유닛 및 지그재그 레슨 패스 */}
      {UNITS.map((unit, uIdx) => (
        <section key={unit.id} className="unit" style={{ ['--uc' as string]: unit.color }}>
          <div className="unit-head">
            <small>UNIT {uIdx + 1} · {unit.sub}</small>
            <h2>{unit.title}</h2>
            <p>{unit.desc}</p>
          </div>

          <div className="path">
            {unit.lessons.map((lesson) => {
              const i = globalIdx++;
              const isDone = !!appState.done[lesson.id];
              const isCurrent = i === currentLessonIndex;
              const isLocked = !isDone && !isCurrent;
              const status = isDone ? 'done' : isCurrent ? 'current' : 'locked';
              const xOffset = Math.round(Math.sin(i * 1.25) * 70);

              return (
                <div
                  key={lesson.id}
                  ref={isCurrent ? currentNodeRef : null}
                  className={`node-wrap ${status}`}
                  style={{ transform: `translateX(${xOffset}px)` }}
                >
                  {isCurrent && <span className="bubble">시작</span>}
                  <button
                    type="button"
                    className={`node ${status}`}
                    aria-label={lesson.title}
                    aria-disabled={isLocked}
                    onClick={() => {
                      if (isLocked) return;
                      startLesson({ ...lesson, unit });
                    }}
                  >
                    {isDone ? IconDone : isCurrent ? IconPlay : IconLock}
                  </button>
                  <span className="node-label">{lesson.title}</span>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <p className="foot">
        한 레슨 약 2분 · 틀린 문제는 레슨 끝에 다시 나와요<br />
        문제는 매번 새로 만들어져서 반복해도 같은 숫자가 안 나와요
      </p>
    </div>
  );
}
