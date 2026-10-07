import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateHabitStats } from '../../utils/habitStats';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { ko } from 'date-fns/locale';
import { X, Flame, Award, Calendar, Share2, Archive, RotateCcw, Edit2, Check } from 'lucide-react';

export const HabitDetailModal: React.FC = () => {
  const {
    habits,
    activeHabitDetailId,
    closeHabitDetail,
    openHabitModal,
    saveHabit,
    selectedDate,
  } = useApp();

  const [isCopiedShare, setIsCopiedShare] = useState(false);

  if (!activeHabitDetailId) return null;

  const habit = habits.find(h => h.id === activeHabitDetailId);
  if (!habit) return null;

  const stats = calculateHabitStats(habit, selectedDate);

  // 최근 84일(12주) 잔디 히트맵 데이터 생성
  const today = new Date();
  const days84 = eachDayOfInterval({
    start: subDays(today, 83),
    end: today,
  });

  const handleToggleArchive = () => {
    saveHabit({
      ...habit,
      isArchived: !habit.isArchived,
    });
    closeHabitDetail();
  };

  const handleShareCard = () => {
    setIsCopiedShare(true);
    setTimeout(() => setIsCopiedShare(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* 상단 액션바 */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                closeHabitDetail();
                openHabitModal(habit);
              }}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 text-gray-700 dark:text-zinc-200 flex items-center gap-1 transition-colors"
            >
              <Edit2 size={13} />
              <span>수정</span>
            </button>
            <button
              onClick={handleToggleArchive}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 text-gray-700 dark:text-zinc-200 flex items-center gap-1 transition-colors"
            >
              {habit.isArchived ? <RotateCcw size={13} /> : <Archive size={13} />}
              <span>{habit.isArchived ? '복원하기' : '보관하기'}</span>
            </button>
          </div>

          <button
            onClick={closeHabitDetail}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 상세 본문 */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* 공유 가능한 프리미엄 성취 카드 (Image Card Preview) */}
          <div
            className="rounded-3xl p-5 text-white shadow-lg relative overflow-hidden flex flex-col justify-between"
            style={{
              background: `linear-gradient(135deg, ${habit.colorHex}, #1e293b)`,
            }}
          >
            {/* 카드 배경 장식 */}
            <div className="absolute right-3 -bottom-4 text-8xl opacity-15 pointer-events-none select-none">
              {habit.icon}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-wider font-semibold opacity-85">
                  CalHabit Milestone Card
                </span>
                <span className="text-2xl">{habit.icon}</span>
              </div>
              <h3 className="text-xl font-bold mb-1">{habit.title}</h3>
              {habit.quote && (
                <p className="text-xs opacity-90 italic">"{habit.quote}"</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-white/20 text-center">
              <div>
                <div className="text-[10px] opacity-80">현재 연속 달성</div>
                <div className="text-lg font-extrabold flex items-center justify-center gap-1 mt-0.5">
                  <Flame size={16} className="fill-white" />
                  <span>{stats.currentStreak}일</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] opacity-80">최장 연속 기록</div>
                <div className="text-lg font-extrabold flex items-center justify-center gap-1 mt-0.5">
                  <Award size={16} />
                  <span>{stats.longestStreak}일</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] opacity-80">총 달성 일수</div>
                <div className="text-lg font-extrabold flex items-center justify-center gap-1 mt-0.5">
                  <Calendar size={16} />
                  <span>{stats.totalCompletedDays}일</span>
                </div>
              </div>
            </div>
          </div>

          {/* 카드 공유 버튼 */}
          <div className="flex justify-end">
            <button
              onClick={handleShareCard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-200 transition-colors shadow-2xs"
            >
              {isCopiedShare ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
              <span>{isCopiedShare ? '기록 카드 복사 완료!' : '성취 카드 공유하기'}</span>
            </button>
          </div>

          {/* 통계 지표 박스 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-850 border border-gray-100 dark:border-zinc-800">
              <span className="text-[11px] font-semibold text-gray-500 dark:text-zinc-400">
                최근 30일 달성률
              </span>
              <div className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mt-1">
                {stats.completionRate30Days}%
              </div>
              <div className="w-full bg-gray-200 dark:bg-zinc-700 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${stats.completionRate30Days}%`,
                    backgroundColor: habit.colorHex,
                  }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-850 border border-gray-100 dark:border-zinc-800">
              <span className="text-[11px] font-semibold text-gray-500 dark:text-zinc-400">
                알림 시간 및 그룹
              </span>
              <div className="text-base font-bold text-gray-900 dark:text-zinc-100 mt-1">
                {habit.reminders[0] || '알림 없음'}
              </div>
              <div className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                소속: {habit.sectionGroup === 'MORNING' ? '아침' : habit.sectionGroup === 'AFTERNOON' ? '오후' : '밤'}
              </div>
            </div>
          </div>

          {/* 달성 히트맵 로그 (최근 12주) */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-850 border border-gray-100 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-1.5">
                <span>습관 달성 히트맵 (최근 12주)</span>
              </span>
              <span className="text-[10px] text-gray-400">색상 = 완료</span>
            </div>

            {/* 히트맵 그리드 (12열 x 7행) */}
            <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-1">
              {days84.map(day => {
                const dStr = format(day, 'yyyy-MM-dd');
                const isDone = habit.logs[dStr]?.completed || false;

                return (
                  <div
                    key={dStr}
                    title={`${dStr}: ${isDone ? '완료' : '미완료'}`}
                    className={`w-3.5 h-3.5 rounded-xs transition-colors ${
                      isDone
                        ? 'shadow-2xs'
                        : 'bg-gray-200 dark:bg-zinc-700/60'
                    }`}
                    style={{
                      backgroundColor: isDone ? habit.colorHex : undefined,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
