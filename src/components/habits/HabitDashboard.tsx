import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Habit, HabitSectionGroup } from '../../types';
import { calculateHabitStats } from '../../utils/habitStats';
import {
  format,
  subDays,
  addDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Sun,
  Sunset,
  Moon,
  Sparkles,
  Check,
  Flame,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Plus,
  Archive,
  RotateCcw,
} from 'lucide-react';

export const HabitDashboard: React.FC = () => {
  const {
    habits,
    toggleHabitCheck,
    openHabitModal,
    openHabitDetail,
    selectedDate,
    setSelectedDate,
    settings,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  // 아코디언 접기/펼치기 상태
  const [collapsedSections, setCollapsedSections] = useState<{ [key in HabitSectionGroup]?: boolean }>({
    MORNING: false,
    AFTERNOON: false,
    NIGHT: false,
    CUSTOM: false,
  });

  const toggleSection = (section: HabitSectionGroup) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // 상단 주간 날짜 스트립 (선택 날짜 기준 7일)
  const weekStartOpt = { weekStartsOn: settings.startDayOfWeek } as const;
  const startOfSelectedWeek = startOfWeek(selectedDate, weekStartOpt);
  const endOfSelectedWeek = endOfWeek(selectedDate, weekStartOpt);
  const weekDays = eachDayOfInterval({
    start: startOfSelectedWeek,
    end: endOfSelectedWeek,
  });

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  // 필터링: 활성 / 보관
  const currentHabits = habits.filter(h =>
    activeTab === 'active' ? !h.isArchived : h.isArchived
  );

  // 섹션별 분류 (Across 뮤트 팔레트 기반)
  const sections: {
    key: HabitSectionGroup;
    title: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    { key: 'MORNING', title: '아침 루틴', icon: <Sun size={17} className="text-[#DDB165]" />, color: 'amber' },
    { key: 'AFTERNOON', title: '오후 루틴', icon: <Sunset size={17} className="text-[#D27D60]" />, color: 'orange' },
    { key: 'NIGHT', title: '밤 & 취침 전', icon: <Moon size={17} className="text-[#7D79A3]" />, color: 'indigo' },
    { key: 'CUSTOM', title: '기타 & 자율 루틴', icon: <Sparkles size={17} className="text-[#5B84B1]" />, color: 'slate' },
  ];

  // 특정 날짜의 전체 습관 달성률 계산 (상단 스트립용)
  const getDayHabitCompletion = (day: Date) => {
    const dStr = format(day, 'yyyy-MM-dd');
    const activeHabits = habits.filter(h => !h.isArchived);
    if (activeHabits.length === 0) return 0;
    const completedCount = activeHabits.filter(h => h.logs[dStr]?.completed).length;
    return Math.round((completedCount / activeHabits.length) * 100);
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-4">
      {/* 1. 상단 주간 날짜 스트립 (TickTick 습관 캘린더 스트립) */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-3 shadow-xs">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-bold text-gray-700 dark:text-zinc-200 flex items-center gap-1.5">
            <Flame size={15} className="text-[#D27D60]" />
            <span>주간 달성 스트립</span>
          </span>
          <span className="text-[11px] text-gray-500 dark:text-zinc-400">
            {format(selectedDate, 'yyyy년 M월 d일 (EEE)', { locale: ko })}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center select-none">
          {weekDays.map(day => {
            const isCur = isToday(day);
            const isSelected = isSameDay(day, selectedDate);
            const rate = getDayHabitCompletion(day);

            return (
              <div
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`p-2 rounded-xl cursor-pointer transition-all flex flex-col items-center gap-1 ${
                  isSelected
                    ? 'bg-[#5B84B1] text-white shadow-sm ring-2 ring-[#5B84B1]/40 ring-offset-1 dark:ring-offset-zinc-900'
                    : 'bg-gray-50 dark:bg-zinc-800/60 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300'
                }`}
              >
                <span className={`text-[11px] font-semibold ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                  {format(day, 'EEE', { locale: ko })}
                </span>
                <span className={`text-sm font-bold ${isCur && !isSelected ? 'text-[#5B84B1] dark:text-[#8AA8CD]' : ''}`}>
                  {format(day, 'd')}
                </span>

                {/* 달성 인디케이터 도트 */}
                <div className="flex items-center gap-0.5 mt-0.5">
                  <div
                    className={`w-2 h-2 rounded-full transition-all ${
                      rate === 100
                        ? isSelected ? 'bg-amber-200' : 'bg-[#7A9A8B]'
                        : rate > 0
                        ? isSelected ? 'bg-white/80' : 'bg-[#5B84B1]/70'
                        : isSelected ? 'bg-white/20' : 'bg-gray-300 dark:bg-zinc-700'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. 탭 선택 바 (진행 중 / 보관됨) & 신규 습관 추가 버튼 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center bg-gray-100 dark:bg-zinc-850 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'active'
                ? 'bg-white dark:bg-zinc-700 text-[#5B84B1] dark:text-[#8AA8CD] shadow-xs'
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900'
            }`}
          >
            진행 중 ({habits.filter(h => !h.isArchived).length})
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              activeTab === 'archived'
                ? 'bg-white dark:bg-zinc-700 text-[#5B84B1] dark:text-[#8AA8CD] shadow-xs'
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900'
            }`}
          >
            <Archive size={13} />
            <span>보관함 ({habits.filter(h => h.isArchived).length})</span>
          </button>
        </div>

        <button
          onClick={() => openHabitModal()}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#5B84B1] hover:bg-[#4B6B88] text-white rounded-xl text-xs font-semibold shadow-xs transition-transform active:scale-95"
        >
          <Plus size={15} />
          <span>새 습관 만들기</span>
        </button>
      </div>

      {/* 3. 시간대별 섹션 아코디언 및 습관 카드 목록 */}
      <div className="space-y-4">
        {sections.map(sec => {
          const sectionHabits = currentHabits.filter(h => h.sectionGroup === sec.key);
          const isCollapsed = collapsedSections[sec.key];

          if (sectionHabits.length === 0 && activeTab === 'archived') return null;

          return (
            <div
              key={sec.key}
              className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs"
            >
              {/* 섹션 아코디언 헤더 */}
              <button
                onClick={() => toggleSection(sec.key)}
                className="w-full px-4 py-3 bg-gray-50/70 dark:bg-zinc-850/60 flex items-center justify-between hover:bg-gray-100/60 dark:hover:bg-zinc-800/60 transition-colors"
              >
                <div className="flex items-center gap-2 font-bold text-sm text-gray-800 dark:text-zinc-200">
                  {sec.icon}
                  <span>{sec.title}</span>
                  <span className="text-xs font-normal text-gray-400">
                    ({sectionHabits.length})
                  </span>
                </div>
                {isCollapsed ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronUp size={18} className="text-gray-400" />}
              </button>

              {/* 습관 카드 그리드 */}
              {!isCollapsed && (
                <div className="p-3 sm:p-4 divide-y divide-gray-100 dark:divide-zinc-800/80">
                  {sectionHabits.length === 0 ? (
                    <div className="py-6 text-center text-gray-400 dark:text-zinc-500 text-xs">
                      이 시간대에 등록된 습관이 없습니다.
                    </div>
                  ) : (
                    sectionHabits.map(habit => {
                      const isCompleted = habit.logs[selectedDateStr]?.completed || false;
                      const stats = calculateHabitStats(habit, selectedDate);

                      return (
                        <div
                          key={habit.id}
                          className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group"
                        >
                          {/* 좌측: 아이콘, 습관명, 연속 달성 일수, 명언 */}
                          <div
                            onClick={() => openHabitDetail(habit.id)}
                            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                          >
                            {/* 습관 전용 모노그램 아이콘 배지 (Across 모던 타이포그래피 스타일) */}
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs transition-transform group-hover:scale-105"
                              style={{
                                backgroundColor: `${habit.colorHex}22`,
                                color: habit.colorHex,
                              }}
                            >
                              <span>{habit.icon}</span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-zinc-100 truncate group-hover:text-[#5B84B1] dark:group-hover:text-[#8AA8CD] transition-colors">
                                  {habit.title}
                                </h4>
                                {/* 연속 달성 뱃지 */}
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D27D60]/12 text-[#D27D60] shrink-0">
                                  <Flame size={11} className="fill-[#D27D60] text-[#D27D60]" />
                                  <span>{stats.currentStreak}일 연속</span>
                                </span>
                              </div>

                              {/* 인용구(Quote) 또는 알림 */}
                              <div className="text-xs text-gray-400 dark:text-zinc-500 truncate mt-0.5 flex items-center gap-2">
                                {habit.quote && (
                                  <span className="italic truncate font-serif">"{habit.quote}"</span>
                                )}
                                <span className="text-[11px] shrink-0 font-medium text-gray-500 dark:text-zinc-400">
                                  총 {stats.totalCompletedDays}회 달성
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 우측: 상세 통계 버튼 및 원터치 체크인 원형 버튼 */}
                          <div className="flex items-center gap-2.5 shrink-0">
                            {/* 통계 열기 */}
                            <button
                              onClick={() => openHabitDetail(habit.id)}
                              className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                              title="통계 및 잔디밭 보기"
                            >
                              <BarChart2 size={18} />
                            </button>

                            {/* 원터치 체크인 원형 버튼 (TickTick 스펙 시그니처 인터랙션) */}
                            <button
                              onClick={() => toggleHabitCheck(habit.id, selectedDateStr)}
                              aria-label={isCompleted ? '습관 완료 취소' : '습관 완료 체크'}
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-xs ${
                                isCompleted
                                  ? 'bg-[#5B84B1] text-white animate-check-pop ring-2 ring-[#5B84B1]/40'
                                  : 'border-2 border-gray-300 dark:border-zinc-700 hover:border-[#5B84B1] dark:hover:border-[#8AA8CD] hover:bg-[#5B84B1]/10'
                              }`}
                              style={{
                                backgroundColor: isCompleted ? habit.colorHex : undefined,
                                borderColor: isCompleted ? habit.colorHex : undefined,
                              }}
                            >
                              {isCompleted ? (
                                <Check size={20} strokeWidth={3} />
                              ) : (
                                <span className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-zinc-700" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
