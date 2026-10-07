import React, { useRef, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  parseISO,
  isSameDay,
  isToday,
  addDays,
  subDays,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, Plus, Check } from 'lucide-react';
import { getContrastTextColor } from '../../utils/contrastColor';
import { getWeatherForDate } from '../../utils/weather';

export const WeeklyTimetable: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    filteredEvents,
    openEventModal,
    settings,
    toggleEventTaskCompleted,
  } = useApp();

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 모바일 화면 감지 (640px 미만)
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 선택된 날짜가 속한 주 계산
  const weekStartOpt = { weekStartsOn: settings.startDayOfWeek } as const;
  const startOfSelectedWeek = startOfWeek(selectedDate, weekStartOpt);
  const endOfSelectedWeek = endOfWeek(selectedDate, weekStartOpt);

  const weekDays = eachDayOfInterval({
    start: startOfSelectedWeek,
    end: endOfSelectedWeek,
  });

  // 모바일 3일 뷰 오프셋 (0 ~ 4)
  const selectedDayIdx = weekDays.findIndex(d => isSameDay(d, selectedDate));
  const [mobileOffset, setMobileOffset] = useState(() => {
    const idx = selectedDayIdx >= 0 ? selectedDayIdx : 0;
    return Math.min(4, Math.max(0, idx <= 1 ? 0 : idx <= 3 ? 2 : 4));
  });

  // 선택된 날짜가 바뀔 때 3일 뷰 범위에 없으면 자동 스크롤/포커스
  useEffect(() => {
    if (selectedDayIdx >= 0) {
      if (selectedDayIdx < mobileOffset || selectedDayIdx >= mobileOffset + 3) {
        setMobileOffset(Math.min(4, Math.max(0, selectedDayIdx <= 1 ? 0 : selectedDayIdx <= 3 ? 2 : 4)));
      }
    }
  }, [selectedDate, selectedDayIdx]);

  // 실제 화면에 표시할 요일 목록 (모바일은 3일, PC는 7일)
  const displayedDays = isMobile ? weekDays.slice(mobileOffset, mobileOffset + 3) : weekDays;

  // 현재 시간선 위치 계산
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentMinutesFromMidnight = currentHour * 60 + currentMinute;
  const HOUR_HEIGHT = 60;
  const currentTimeTopPx = (currentMinutesFromMidnight / 60) * HOUR_HEIGHT;

  // 진입 시 현재 시간대 근처로 부드럽게 스크롤
  useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollY = Math.max(0, (currentHour - 2) * HOUR_HEIGHT);
      scrollContainerRef.current.scrollTo({ top: scrollY, behavior: 'smooth' });
    }
  }, []);

  const handlePrevWeek = () => {
    setSelectedDate(subDays(selectedDate, 7));
  };

  const handleNextWeek = () => {
    setSelectedDate(addDays(selectedDate, 7));
  };

  // 모바일 3일 또는 전체 주간 단위 이전/다음 이동
  const handlePrevDays = () => {
    if (isMobile) {
      if (mobileOffset > 0) {
        setMobileOffset(prev => Math.max(0, prev - 3));
      } else {
        setSelectedDate(subDays(selectedDate, 7));
        setMobileOffset(4);
      }
    } else {
      handlePrevWeek();
    }
  };

  const handleNextDays = () => {
    if (isMobile) {
      if (mobileOffset < 4) {
        setMobileOffset(prev => Math.min(4, prev + 3));
      } else {
        setSelectedDate(addDays(selectedDate, 7));
        setMobileOffset(0);
      }
    } else {
      handleNextWeek();
    }
  };

  // 모바일 스와이프 제스처 핸들러
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartXRef.current;
    const dy = e.changedTouches[0].clientY - touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;

    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      if (dx < 0) {
        handleNextDays();
      } else {
        handlePrevDays();
      }
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  // 다일 일정 교차 및 24시간 타임블록 클램핑
  const getEventsForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayStartMs = new Date(`${dateStr}T00:00:00`).getTime();
    const dayEndMs = new Date(`${dateStr}T23:59:59`).getTime();

    const dayEvts = filteredEvents.filter(evt => {
      const s = parseISO(evt.startDateTime).getTime();
      const e = parseISO(evt.endDateTime).getTime();
      return s <= dayEndMs && e >= dayStartMs;
    });

    return {
      allDay: dayEvts.filter(e => e.isAllDay),
      timed: dayEvts.filter(e => !e.isAllDay).map(evt => {
        const s = parseISO(evt.startDateTime).getTime();
        const e = parseISO(evt.endDateTime).getTime();
        const clampedStartMs = Math.max(s, dayStartMs);
        const clampedEndMs = Math.min(e, dayEndMs);
        const startM = Math.floor((clampedStartMs - dayStartMs) / (60 * 1000));
        let endM = Math.ceil((clampedEndMs - dayStartMs) / (60 * 1000));
        if (endM <= startM) endM = Math.min(1440, startM + 30);
        return {
          event: evt,
          startM,
          endM,
          durationM: Math.max(25, endM - startM),
          isContinuingFromPrev: s < dayStartMs,
          isContinuingToNext: e > dayEndMs,
        };
      }),
    };
  };

  const handleEmptySlotClick = (day: Date, hour: number) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const hStr = String(hour).padStart(2, '0');
    openEventModal(undefined, `${dateStr}T${hStr}:00:00`);
  };

  const gridColsClass = isMobile
    ? 'grid-cols-[48px_repeat(3,1fr)]'
    : 'grid-cols-[60px_repeat(7,1fr)] sm:grid-cols-[72px_repeat(7,1fr)]';

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="w-full h-full flex flex-col flex-1 overflow-hidden select-none bg-white dark:bg-zinc-950"
    >
      {/* 1. 상단 주간 네비게이터 바 */}
      <div className="w-full bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-3 sm:px-6 py-2 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center bg-gray-100 dark:bg-zinc-800 rounded-xl p-0.5">
            <button
              onClick={handlePrevDays}
              className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded-lg transition-colors text-gray-600 dark:text-zinc-300"
              title={isMobile ? '이전 3일' : '이전 주'}
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-2 sm:px-3 text-xs sm:text-sm font-bold text-gray-900 dark:text-zinc-100 whitespace-nowrap">
              {isMobile
                ? `${format(displayedDays[0], 'M월 d일')} ~ ${format(displayedDays[displayedDays.length - 1], 'M월 d일')}`
                : `${format(startOfSelectedWeek, 'yyyy년 M월 d일')} ~ ${format(endOfSelectedWeek, 'M월 d일')}`}
            </span>
            <button
              onClick={handleNextDays}
              className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded-lg transition-colors text-gray-600 dark:text-zinc-300"
              title={isMobile ? '다음 3일' : '다음 주'}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedDate(new Date());
              setMobileOffset(0);
            }}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 shadow-2xs whitespace-nowrap"
          >
            오늘
          </button>
        </div>

        {isMobile && (
          <span className="text-[11px] text-gray-400 font-medium">
            좌우 스와이프 탐색
          </span>
        )}
      </div>

      {/* 2. 주간 24시간 풀-스크린 타임테이블 컨테이너 (모바일 3일 / PC 7일 널찍한 분할) */}
      <div className="flex-1 flex flex-col w-full h-full overflow-hidden">
        {/* 상단 1: 요일 및 날짜 헤더 */}
        <div className={`grid ${gridColsClass} border-b border-gray-200 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-900/80 text-center shrink-0`}>
          {/* 시간축 상단 빈칸 */}
          <div className="py-2.5 border-r border-gray-200 dark:border-zinc-800 flex items-center justify-center text-gray-400">
            <Clock size={16} />
          </div>

          {/* 표시 요일 헤더 */}
          {displayedDays.map(day => {
            const isCurDay = isToday(day);
            const isSelected = isSameDay(day, selectedDate);
            const isSun = day.getDay() === 0;
            const isSat = day.getDay() === 6;

            return (
              <div
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`py-2 px-1 border-r border-gray-100 dark:border-zinc-800/80 last:border-r-0 cursor-pointer transition-colors ${
                  isSelected ? 'bg-slate-100/70 dark:bg-zinc-800/60' : 'hover:bg-gray-100/50'
                }`}
              >
                <div
                  className={`text-xs font-bold ${
                    isSun
                      ? 'text-red-500'
                      : isSat
                      ? 'text-blue-500'
                      : 'text-gray-600 dark:text-zinc-400'
                  }`}
                >
                  {format(day, 'EEE', { locale: ko })}
                </div>

                <div className="flex items-center justify-center gap-1.5 mt-0.5">
                  <span
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${
                      isCurDay
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm font-black'
                        : 'text-gray-900 dark:text-zinc-100'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 상단 2: 종일(All-day) 일정 전용 영역 */}
        <div className={`grid ${gridColsClass} border-b border-gray-200 dark:border-zinc-800 bg-gray-50/40 dark:bg-zinc-900/40 min-h-[38px] shrink-0`}>
          <div className="border-r border-gray-200 dark:border-zinc-800 p-1 flex items-center justify-center text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            종일
          </div>

          {displayedDays.map(day => {
            const { allDay } = getEventsForDay(day);
            return (
              <div
                key={day.toISOString()}
                className="p-1 border-r border-gray-100 dark:border-zinc-800/80 last:border-r-0 flex flex-col gap-1 overflow-hidden"
              >
                {allDay.map(evt => (
                  <div
                    key={evt.id}
                    onClick={() => openEventModal(evt)}
                    className="px-2 py-0.5 rounded-md text-[11px] font-semibold text-white truncate cursor-pointer hover:opacity-90 shadow-2xs text-center"
                    style={{ backgroundColor: evt.colorHex }}
                    title={evt.title}
                  >
                    {evt.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* 하단 3: 24시간 세로 타임테이블 스크롤 매트릭스 */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto relative scrollbar-thin select-none"
        >
          <div
            className={`grid ${gridColsClass} relative`}
            style={{ height: `${24 * HOUR_HEIGHT}px` }}
          >
            {/* 좌측 00:00 ~ 23:00 세로 시간축 (고정 스티키) */}
            <div className="border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky left-0 z-10">
              {hours.map(hour => (
                <div
                  key={hour}
                  className="border-b border-gray-100 dark:border-zinc-800/70 text-xs text-gray-400 dark:text-zinc-500 pr-1.5 sm:pr-2 pt-1 text-right flex justify-end items-start font-mono"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                >
                  <span>{String(hour).padStart(2, '0')}:00</span>
                </div>
              ))}
            </div>

            {/* 표시 요일별 24시간 슬롯 매트릭스 */}
            {displayedDays.map(day => {
              const { timed } = getEventsForDay(day);
              const isColToday = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className="border-r border-gray-100 dark:border-zinc-800/80 last:border-r-0 relative bg-white dark:bg-zinc-950"
                >
                  {/* 1시간 간격 그리드 슬롯 (클릭 시 해당 시간 일정 등록) */}
                  {hours.map(hour => (
                    <div
                      key={hour}
                      onClick={() => handleEmptySlotClick(day, hour)}
                      className="border-b border-gray-100 dark:border-zinc-850/60 hover:bg-slate-50/70 dark:hover:bg-zinc-900/60 transition-colors cursor-pointer"
                      style={{ height: `${HOUR_HEIGHT}px` }}
                    />
                  ))}

                  {/* 24시간 타임블록 렌더링 (시간 텍스트 제거, 제목만 깔끔하게 표시) */}
                  {timed.map(item => {
                    const evt = item.event;
                    const topPx = (item.startM / 60) * HOUR_HEIGHT;
                    const heightPx = (item.durationM / 60) * HOUR_HEIGHT;
                    const contrastColor = getContrastTextColor(evt.colorHex);
                    const isTask = evt.isTask;

                    return (
                      <div
                        key={evt.id}
                        onClick={e => {
                          e.stopPropagation();
                          openEventModal(evt);
                        }}
                        className={`absolute left-1 right-1 rounded-xl p-1.5 sm:p-2 shadow-md cursor-pointer hover:brightness-105 transition-all overflow-hidden z-10 flex flex-col justify-between ${
                          isTask ? 'border-2' : 'border border-white/20'
                        }`}
                        style={{
                          top: `${topPx}px`,
                          height: `${Math.max(28, heightPx - 2)}px`,
                          backgroundColor: isTask ? `${evt.colorHex}18` : evt.colorHex,
                          borderColor: isTask ? evt.colorHex : undefined,
                          color: isTask ? evt.colorHex : contrastColor,
                        }}
                        title={`${evt.title}`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5 leading-tight">
                            {isTask && (
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  toggleEventTaskCompleted(evt.id);
                                }}
                                className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border transition-colors ${
                                  evt.isCompleted
                                    ? 'bg-emerald-500 text-white border-emerald-500'
                                    : 'border-current hover:bg-black/10'
                                }`}
                                title={evt.isCompleted ? '할일 완료됨 (클릭하여 취소)' : '할일 완료 처리'}
                              >
                                {evt.isCompleted && <Check size={10} strokeWidth={3} />}
                              </button>
                            )}
                            <div className={`text-xs font-bold truncate ${evt.isCompleted ? 'line-through opacity-70' : ''}`}>
                              {item.isContinuingFromPrev && <span className="opacity-75 mr-0.5 text-[10px]">↳</span>}
                              {evt.title}
                              {item.isContinuingToNext && <span className="opacity-75 ml-0.5 text-[10px]">→</span>}
                            </div>
                          </div>
                        </div>

                        {heightPx > 68 && evt.location && (
                          <div className="text-[10px] opacity-80 truncate">
                            📍 {evt.location}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* 실시간 붉은 현재 시간선 */}
                  {isColToday && (
                    <div
                      className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                      style={{ top: `${currentTimeTopPx}px` }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1 ring-2 ring-white dark:ring-zinc-900 shadow-sm" />
                      <div className="flex-1 h-0.5 bg-red-500 shadow-sm" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
