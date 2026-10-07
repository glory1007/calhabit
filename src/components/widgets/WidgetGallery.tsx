import React from 'react';
import { useApp } from '../../context/AppContext';
import { format, parseISO, isSameDay, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, Clock, Check, Flame, Sparkles } from 'lucide-react';

export const WidgetGallery: React.FC = () => {
  const {
    filteredEvents,
    habits,
    toggleHabitCheck,
    selectedDate,
    openEventModal,
  } = useApp();

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // 오늘 일정들
  const todayEvents = filteredEvents.filter(e => {
    const d = parseISO(e.startDateTime);
    return isSameDay(d, today);
  });

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-5 space-y-6">
      {/* 위젯 가이드 설명 (Across 스타일) */}
      <div className="bg-[#5B84B1]/10 border border-[#5B84B1]/20 rounded-2xl p-4">
        <h3 className="font-bold text-sm text-gray-900 dark:text-zinc-100 flex items-center gap-1.5">
          <Sparkles size={16} className="text-[#5B84B1]" />
          <span>모바일 홈 화면 위젯 시뮬레이터 (iOS 17+ / Android AppWidget)</span>
        </h3>
        <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">
          실제 스마트폰 홈 화면에서 앱을 열지 않고도 일정 확인 및 습관 원터치 체크인이 가능한 인터랙티브 위젯들입니다. 아래 위젯의 버튼을 눌러 실시간 상호작용을 테스트해 보세요.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 위젯 1: 인터랙티브 습관 체크인 위젯 (iOS 17+ Interactive Widget) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-zinc-400 px-1">
            <span>습관 체크인 위젯 (Interactive)</span>
            <span className="text-[10px] bg-[#5B84B1]/15 text-[#5B84B1] dark:text-[#8AA8CD] px-1.5 py-0.5 rounded font-medium">
              원터치 체크
            </span>
          </div>

          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-3xl p-4 shadow-md aspect-square flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-xs text-gray-800 dark:text-zinc-200">
                <Flame size={14} className="text-[#D27D60]" />
                <span>오늘의 습관</span>
              </div>
              <span className="text-[10px] text-gray-400">
                {format(today, 'M/d (EEE)', { locale: ko })}
              </span>
            </div>

            {/* 습관 4개 리스트 & 위젯 상에서 바로 원터치 체크 */}
            <div className="space-y-2 my-auto">
              {habits.slice(0, 4).map(habit => {
                const isDone = habit.logs[todayStr]?.completed || false;
                return (
                  <div
                    key={habit.id}
                    className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] shrink-0" style={{ backgroundColor: `${habit.colorHex}22`, color: habit.colorHex }}>{habit.icon}</span>
                      <span className={`text-xs truncate ${isDone ? 'line-through text-gray-400' : 'font-medium text-gray-800 dark:text-zinc-200'}`}>
                        {habit.title}
                      </span>
                    </div>

                    {/* 인터랙티브 체크 버튼 */}
                    <button
                      onClick={() => toggleHabitCheck(habit.id, todayStr)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 ${
                        isDone
                          ? 'bg-[#5B84B1] text-white shadow-xs'
                          : 'border border-gray-300 dark:border-zinc-600 hover:border-[#5B84B1]'
                      }`}
                      style={{
                        backgroundColor: isDone ? habit.colorHex : undefined,
                      }}
                    >
                      {isDone ? <Check size={14} strokeWidth={3} /> : null}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="text-[10px] text-gray-400 text-center pt-2 border-t border-gray-100 dark:border-zinc-800">
              위젯 터치 시 백그라운드 실시간 동기화
            </div>
          </div>
        </div>

        {/* 위젯 2: 주간/오늘 타임블록 위젯 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-zinc-400 px-1">
            <span>주간/오늘 타임블록 위젯</span>
            <span className="text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-600 px-1.5 py-0.5 rounded">
              TickTick형
            </span>
          </div>

          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-3xl p-4 shadow-md aspect-square flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-xs text-gray-800 dark:text-zinc-200">
                <Clock size={14} className="text-blue-500" />
                <span>오늘 타임테이블</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                {todayEvents.length}개 일정
              </span>
            </div>

            <div className="space-y-2 my-auto overflow-hidden">
              {todayEvents.length === 0 ? (
                <div className="text-center text-gray-400 text-xs py-4">
                  오늘 남은 일정이 없습니다
                </div>
              ) : (
                todayEvents.slice(0, 3).map(evt => {
                  const start = parseISO(evt.startDateTime);
                  return (
                    <div
                      key={evt.id}
                      onClick={() => openEventModal(evt)}
                      className="p-2 rounded-xl text-white shadow-2xs cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-between text-xs"
                      style={{ backgroundColor: evt.colorHex }}
                    >
                      <span className="font-semibold truncate">{evt.title}</span>
                      <span className="text-[10px] opacity-90 shrink-0 ml-1">
                        {evt.isAllDay ? '종일' : format(start, 'HH:mm')}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="text-[10px] text-gray-400 text-center pt-2 border-t border-gray-100 dark:border-zinc-800">
              탭하여 캘린더에서 바로 일정 수정
            </div>
          </div>
        </div>

        {/* 위젯 3: TimeTree 스타일 월간 미니 위젯 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-zinc-400 px-1">
            <span>TimeTree 월간 미니 캘린더 위젯</span>
            <span className="text-[10px] bg-purple-100 dark:bg-purple-950/60 text-purple-600 px-1.5 py-0.5 rounded">
              월간 뷰
            </span>
          </div>

          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-3xl p-4 shadow-md aspect-square flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-xs text-gray-800 dark:text-zinc-200">
                <Calendar size={14} className="text-purple-500" />
                <span>{format(today, 'yyyy년 M월')}</span>
              </div>
              <span className="w-5 h-5 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[10px] font-bold flex items-center justify-center">
                {format(today, 'd')}
              </span>
            </div>

            {/* 미니 캘린더 도트 그리드 */}
            <div className="my-auto text-center">
              <div className="grid grid-cols-7 gap-1 text-[9px] text-gray-400 mb-1">
                <span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-[10px]">
                {Array.from({ length: 28 }, (_, i) => {
                  const dayNum = i + 1;
                  const isCurrent = dayNum === today.getDate();
                  const hasDot = dayNum % 3 === 0;

                  return (
                    <div
                      key={i}
                      className={`h-6 rounded-md flex flex-col items-center justify-center ${
                        isCurrent
                          ? 'bg-purple-600 text-white font-bold'
                          : 'text-gray-700 dark:text-zinc-300'
                      }`}
                    >
                      <span>{dayNum}</span>
                      {hasDot && !isCurrent && (
                        <span className="w-1 h-1 rounded-full bg-purple-400 -mt-0.5" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-[10px] text-gray-400 text-center pt-2 border-t border-gray-100 dark:border-zinc-800">
              광고 없는 깨끗한 TimeTree 스타일
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
