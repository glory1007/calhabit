import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CategoryReorderBar } from '../layout/CategoryReorderBar';
import { AcrossInlineTimeline } from '../timeline/AcrossInlineTimeline';
import { AcrossTimeline } from '../timeline/AcrossTimeline';
import { QuickContextMenu } from '../modals/QuickContextMenu';
import { formatLunarShort } from '../../utils/lunar';
import { getWeatherForDate } from '../../utils/weather';
import { triggerHapticFeedback } from '../../utils/habitStats';
import { ScheduleEvent } from '../../types';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format,
  parseISO,
  differenceInDays,
  startOfDay,
  endOfDay,
  isBefore,
  isAfter,
} from 'date-fns';
import { Columns, Eye, Check, Clock } from 'lucide-react';
import { getContrastTextColor } from '../../utils/contrastColor';

export const MonthCalendar: React.FC = () => {
  const {
    currentMonth,
    selectedDate,
    setSelectedDate,
    filteredEvents,
    saveEvent,
    toggleEventTaskCompleted,
    assignTodoToSchedule,
    isTimelineOpen,
    setIsTimelineOpen,
    settings,
  } = useApp();

  const [desktopLayout, setDesktopLayout] = useState<'inline' | 'split'>('inline');

  // 퀵 컨텍스트 메뉴 상태
  const [contextEvent, setContextEvent] = useState<ScheduleEvent | null>(null);
  const [contextPos, setContextPos] = useState<{ x: number; y: number } | null>(null);

  // 일정 드래그 앤 드롭 상태 (월간 그리드 간 이동)
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // 월간 달력 날짜 계산
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const weekStartOpt = { weekStartsOn: settings.startDayOfWeek } as const;
  const startDate = startOfWeek(monthStart, weekStartOpt);
  const endDate = endOfWeek(monthEnd, weekStartOpt);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const weekDayLabels =
    settings.startDayOfWeek === 0
      ? ['일', '월', '화', '수', '목', '금', '토']
      : ['월', '화', '수', '목', '금', '토', '일'];

  // 주간 단위 다일(Multi-day) 연속 바 계산 및 탐욕적 행(Row) 패킹
  interface WeekEventSegment {
    event: ScheduleEvent;
    startCol: number;
    endCol: number;
    colSpan: number;
    isFirstWeekOfEvent: boolean;
    isLastWeekOfEvent: boolean;
    row: number;
  }

  const getWeekSegments = (week: Date[]) => {
    const weekStart = startOfDay(week[0]);
    const weekEnd = endOfDay(week[6]);
    const weekStartStr = `${format(week[0], 'yyyy-MM-dd')}T00:00:00`;
    const weekEndStr = `${format(week[6], 'yyyy-MM-dd')}T23:59:59`;

    const weekEvts = filteredEvents.filter(evt => {
      return evt.startDateTime <= weekEndStr && evt.endDateTime >= weekStartStr;
    });

    const prepared = weekEvts.map(evt => {
      const s = parseISO(evt.startDateTime);
      const e = parseISO(evt.endDateTime);
      const sDay = startOfDay(s);
      const eDay = startOfDay(e);

      const isBeforeWeek = isBefore(sDay, weekStart);
      const isAfterWeek = isAfter(eDay, weekEnd);

      const startCol = isBeforeWeek ? 0 : Math.max(0, Math.min(6, differenceInDays(sDay, weekStart)));
      const endCol = isAfterWeek ? 6 : Math.max(0, Math.min(6, differenceInDays(eDay, weekStart)));
      const colSpan = Math.max(1, endCol - startCol + 1);

      return {
        event: evt,
        startCol,
        endCol,
        colSpan,
        isFirstWeekOfEvent: !isBeforeWeek,
        isLastWeekOfEvent: !isAfterWeek,
      };
    });

    // 정렬: 다일 일정 우선(기간 긴 순) -> 빠른 시작일 순 -> startDateTime 순 -> id 순
    prepared.sort((a, b) => {
      if (b.colSpan !== a.colSpan) return b.colSpan - a.colSpan;
      if (a.startCol !== b.startCol) return a.startCol - b.startCol;
      return a.event.startDateTime.localeCompare(b.event.startDateTime) || a.event.id.localeCompare(b.event.id);
    });

    // 탐욕적 행 패킹: 겹치지 않는 가장 낮은 row(행) 할당
    const laneOccupied: boolean[][] = [];
    const packedSegments: WeekEventSegment[] = [];

    for (const item of prepared) {
      let assignedRow = -1;
      for (let r = 0; r < 20; r++) {
        if (!laneOccupied[r]) laneOccupied[r] = Array(7).fill(false);
        let canFit = true;
        for (let c = item.startCol; c <= item.endCol; c++) {
          if (laneOccupied[r][c]) {
            canFit = false;
            break;
          }
        }
        if (canFit) {
          assignedRow = r;
          for (let c = item.startCol; c <= item.endCol; c++) {
            laneOccupied[r][c] = true;
          }
          break;
        }
      }

      packedSegments.push({
        ...item,
        row: assignedRow,
      });
    }

    // [요구사항 1: 유동적 높이 확장] 등록된 일정 개수에 맞춰 주(Week) 행 높이를 자연스럽게 동적 확장
    const maxRow = packedSegments.reduce((max, s) => Math.max(max, s.row), -1);
    const totalRowCount = maxRow + 1;
    // 상단 날짜 영역(28px) + 행당 22px(20px 높이 + 2px 간격) + 하단 여백(6px)
    const neededHeight = 28 + totalRowCount * 22 + 6;
    const dynamicWeekHeight = Math.max(110, neededHeight);

    // 모든 일정이 생략이나 잘림 없이 100% 보이도록 전체 노출
    const visibleSegments = packedSegments;
    const hiddenCounts = Array(7).fill(0);

    return { visibleSegments, hiddenCounts, dynamicWeekHeight };
  };

  // [기능 1] 월간 일정 바 드래그 시작
  const handleEventDragStart = (e: React.DragEvent, evt: ScheduleEvent) => {
    setDraggedEventId(evt.id);
    e.dataTransfer.setData('text/plain', evt.id);
    e.dataTransfer.effectAllowed = 'move';
    if (settings.hapticEnabled) triggerHapticFeedback();
  };

  // 날짜 셀 드롭 핸들러 (다른 날짜 셀로 일정을 놓으면 날짜 즉시 갱신!)
  const handleDayDrop = (e: React.DragEvent, targetDay: Date) => {
    e.preventDefault();
    const rawData = e.dataTransfer.getData('text/plain') || draggedEventId;
    if (!rawData) return;

    // [기능 2-3] 서랍에서 드래그해 온 미배정 항목: 해당 날짜에 일정/할일로 배정
    if (rawData.startsWith('todo:')) {
      const todoId = rawData.replace('todo:', '');
      assignTodoToSchedule(todoId, format(targetDay, 'yyyy-MM-dd'), 9);
      if (settings.hapticEnabled) triggerHapticFeedback();
      setDragOverDate(null);
      setDraggedEventId(null);
      return;
    }

    const targetEvt = filteredEvents.find(ev => ev.id === rawData);
    if (!targetEvt) return;

    const targetDateStr = format(targetDay, 'yyyy-MM-dd');
    const prevStart = parseISO(targetEvt.startDateTime);
    const prevEnd = parseISO(targetEvt.endDateTime);

    const timeDiff = prevEnd.getTime() - prevStart.getTime();
    const startTimeStr = format(prevStart, 'HH:mm:ss');

    const newStartDateTime = `${targetDateStr}T${startTimeStr}`;
    const newEndDateTime = format(new Date(new Date(newStartDateTime).getTime() + timeDiff), "yyyy-MM-dd'T'HH:mm:ss");

    saveEvent({
      ...targetEvt,
      startDateTime: newStartDateTime,
      endDateTime: newEndDateTime,
    });

    if (settings.hapticEnabled) triggerHapticFeedback();
    setDraggedEventId(null);
    setDragOverDate(null);
  };

  // 일정 바 탭 또는 우클릭 시 퀵 컨텍스트 메뉴 표시
  const handleEventClick = (e: React.MouseEvent, evt: ScheduleEvent) => {
    e.stopPropagation();
    setContextEvent(evt);
    setContextPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="w-full h-full flex flex-col flex-1 overflow-hidden select-none bg-white dark:bg-zinc-950">
      {/* 1. 상단 카테고리 칩 바: 드래그 앤 드롭 재정렬 */}
      <div className="shrink-0 flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="flex-1 min-w-0">
          <CategoryReorderBar collapsible={false} />
        </div>

        {/* 대화면 뷰 레이아웃 전환 & 타임라인 수동 토글 버튼 */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 shrink-0 border-l border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-850/50">
          <button
            onClick={() => setIsTimelineOpen(!isTimelineOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border shadow-2xs ${
              isTimelineOpen
                ? 'bg-[#4B6B88] text-white border-transparent'
                : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-700 hover:bg-slate-100'
            }`}
            title={isTimelineOpen ? '24시간 타임라인 접기' : '24시간 타임라인 펼치기'}
          >
            <Clock size={13} />
            <span className="hidden sm:inline">타임라인</span>
            <span className="text-[10px] font-bold opacity-80">{isTimelineOpen ? 'ON' : 'OFF'}</span>
          </button>

          <div className="hidden xl:flex items-center gap-1">
            <button
              onClick={() => setDesktopLayout('inline')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
                desktopLayout === 'inline'
                  ? 'bg-white dark:bg-zinc-700 text-slate-800 dark:text-zinc-100 shadow-2xs border border-slate-200 dark:border-zinc-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Across 인라인 행 확장 뷰"
            >
              <Eye size={13} />
              <span>인라인</span>
            </button>
            <button
              onClick={() => setDesktopLayout('split')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
                desktopLayout === 'split'
                  ? 'bg-white dark:bg-zinc-700 text-slate-800 dark:text-zinc-100 shadow-2xs border border-slate-200 dark:border-zinc-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="좌우 분할 Split 뷰"
            >
              <Columns size={13} />
              <span>분할</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 대화면 전폭 캘린더 메인 컨테이너 (Full-Viewport) */}
      <div className="flex-1 flex overflow-hidden w-full h-full">
        <div
          className={`flex-1 flex flex-col h-full overflow-y-auto scrollbar-none transition-all ${
            desktopLayout === 'split' ? 'xl:w-8/12 xl:border-r border-gray-200 dark:border-zinc-800' : 'w-full'
          }`}
        >
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 text-center shrink-0 sticky top-0 z-10 backdrop-blur-xs">
            {weekDayLabels.map((dayLabel, idx) => {
              const isSunday = (settings.startDayOfWeek === 0 && idx === 0) || (settings.startDayOfWeek === 1 && idx === 6);
              const isSaturday = (settings.startDayOfWeek === 0 && idx === 6) || (settings.startDayOfWeek === 1 && idx === 5);
              return (
                <div
                  key={dayLabel}
                  className={`py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold tracking-wider ${
                    isSunday
                      ? 'text-red-500/90 dark:text-red-400'
                      : isSaturday
                      ? 'text-blue-500/90 dark:text-blue-400'
                      : 'text-gray-500 dark:text-zinc-400'
                  }`}
                >
                  {dayLabel}
                </div>
              );
            })}
          </div>

          {/* 7열 전폭 월간 그리드 (주 단위 연속 바 매트릭스 레이어 구조) */}
          <div className="flex-1 flex flex-col w-full border-b border-gray-200 dark:border-zinc-800 divide-y divide-gray-100 dark:divide-zinc-800/80 overflow-y-auto">
            {weeks.map((week, weekIdx) => {
              const isSelectedInWeek = week.some(day => isSameDay(day, selectedDate));
              const { visibleSegments, hiddenCounts, dynamicWeekHeight } = getWeekSegments(week);

              return (
                <div key={weekIdx} className="w-full flex flex-col shrink-0">
                  {/* 주간 7일 컨테이너: 등록된 일정 수에 맞춰 행 높이가 자연스럽게 늘어남 (최소 120px) */}
                  <div className="relative w-full transition-all" style={{ minHeight: `${dynamicWeekHeight}px` }}>
                    {/* 1. 배경 날짜 셀 그리드 (표준 문서 흐름으로 실제 높이 확보하여 아래 주 밀림 보장) */}
                    <div className="grid grid-cols-7 w-full transition-all" style={{ minHeight: `${dynamicWeekHeight}px` }}>
                      {week.map((day, dayColIdx) => {
                        const dayStr = format(day, 'yyyy-MM-dd');
                        const isCurMonth = isSameMonth(day, currentMonth);
                        const isCurrentDay = isToday(day);
                        const isSelected = isSameDay(day, selectedDate);
                        const isDragTarget = dragOverDate === dayStr;
                        const weather = getWeatherForDate(day);
                        const lunarText = formatLunarShort(day);
                        const isSun = day.getDay() === 0;
                        const isSat = day.getDay() === 6;

                        return (
                          <div
                            key={day.toISOString()}
                            onClick={() => setSelectedDate(day)}
                            onDragOver={e => {
                              e.preventDefault();
                              if (dragOverDate !== dayStr) setDragOverDate(dayStr);
                            }}
                            onDragLeave={() => {
                              if (dragOverDate === dayStr) setDragOverDate(null);
                            }}
                            onDrop={e => handleDayDrop(e, day)}
                            style={{ minHeight: `${dynamicWeekHeight}px` }}
                            className={`p-1 sm:p-1.5 border-r border-gray-100 dark:border-zinc-800/80 last:border-r-0 flex flex-col justify-start transition-all cursor-pointer group ${
                              !isCurMonth
                                ? 'bg-gray-50/40 dark:bg-zinc-950/40 text-gray-400 dark:text-zinc-600'
                                : 'bg-white dark:bg-zinc-900 hover:bg-slate-50/80 dark:hover:bg-zinc-850/50'
                            } ${
                              isSelected
                                ? 'bg-slate-100/70 dark:bg-zinc-800/60 ring-2 ring-slate-400 dark:ring-zinc-500 ring-inset z-0'
                                : ''
                            } ${
                              isDragTarget
                                ? 'bg-slate-200/60 dark:bg-zinc-700/60 ring-2 ring-dashed ring-slate-400'
                                : ''
                            }`}
                          >
                            {/* 상단 양력 + 음력 + 날씨 */}
                            <div className="flex items-center justify-between w-full mb-0.5 shrink-0 px-0.5">
                              <div className="flex items-baseline gap-1 min-w-0">
                                <span
                                  className={`text-xs sm:text-[13px] font-semibold w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-transform tabular-nums shrink-0 ${
                                    isCurrentDay
                                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs font-bold'
                                      : !isCurMonth
                                      ? 'text-gray-300 dark:text-zinc-600 font-normal'
                                      : isSun
                                      ? 'text-red-500'
                                      : isSat
                                      ? 'text-blue-500'
                                      : 'text-zinc-800 dark:text-zinc-100'
                                  }`}
                                >
                                  {format(day, 'd')}
                                </span>

                                {settings.showLunarDates && isCurMonth && (
                                  <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-zinc-500 font-normal tabular-nums leading-none truncate">
                                    {lunarText}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {isSelected && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIsTimelineOpen(!isTimelineOpen);
                                    }}
                                    className={`p-0.5 rounded transition-colors ${
                                      isTimelineOpen
                                        ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300'
                                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200'
                                    }`}
                                    title={isTimelineOpen ? '24시간 타임라인 닫기' : '24시간 타임라인 열기'}
                                  >
                                    <Clock size={11} />
                                  </button>
                                )}

                                {settings.showWeather && isCurMonth && (
                                  <div
                                    className="text-[9px] sm:text-[10px] text-gray-400 dark:text-zinc-500 flex items-center gap-0.5 shrink-0"
                                    title={`${weather.summary} ${weather.tempHigh}°/${weather.tempLow}°`}
                                  >
                                    <span className="text-[10px] sm:text-xs leading-none">{weather.icon}</span>
                                    <span className="hidden sm:inline font-normal">{weather.tempHigh}°</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* 2. 전폭 7열 이벤트 매트릭스 레이어 (다일 일정은 날짜 사이 끊김 없이 완전히 이어진 단일 바로 렌더링!) */}
                    <div
                      className="absolute inset-x-0 top-0 bottom-0 grid grid-cols-7 auto-rows-[20px] sm:auto-rows-[22px] gap-y-0.5 sm:gap-y-1 w-full pt-7 sm:pt-7.5 pb-1 pointer-events-none z-10 transition-all"
                      style={{ minHeight: `${dynamicWeekHeight}px` }}
                    >
                      {visibleSegments.map(item => {
                        const isTimed = !item.event.isAllDay;
                        const timeStr = isTimed && item.isFirstWeekOfEvent ? format(parseISO(item.event.startDateTime), 'HH:mm') : '';
                        const isTask = item.event.isTask;
                        const contrastColor = getContrastTextColor(item.event.colorHex);

                        const containerStyle: React.CSSProperties = {
                          gridColumn: `${item.startCol + 1} / span ${item.colSpan}`,
                          gridRow: item.row + 1,
                        };

                        let containerClasses = `h-[19px] sm:h-[21px] text-[10px] sm:text-[11px] font-medium tracking-tight shadow-2xs truncate cursor-grab active:cursor-grabbing hover:opacity-95 transition-all flex items-center gap-0.5 sm:gap-1 px-1 sm:px-1.5 pointer-events-auto z-10 ${
                          item.isFirstWeekOfEvent ? 'rounded-l-xs sm:rounded-l-sm ml-0.5 sm:ml-1' : 'rounded-l-none ml-0'
                        } ${
                          item.isLastWeekOfEvent ? 'rounded-r-xs sm:rounded-r-sm mr-0.5 sm:mr-1' : 'rounded-r-none mr-0'
                        }`;

                        if (!isTask) {
                          // [규칙 2] 일정: 선택한 색상으로 완전 채움 (Solid Fill) + 명암비 최적화 텍스트
                          containerStyle.backgroundColor = item.event.colorHex;
                          containerStyle.color = contrastColor;
                        } else {
                          // [규칙 2] 할일: 바탕색은 은은한 테두리만 (Outline) + 텍스트 색상
                          containerStyle.backgroundColor = `${item.event.colorHex}18`;
                          containerStyle.borderColor = item.event.colorHex;
                          containerStyle.color = item.event.colorHex;
                          containerClasses += ' border-[1.5px]';
                        }

                        return (
                          <div
                            key={`${item.event.id}-${item.startCol}`}
                            draggable
                            onDragStart={e => handleEventDragStart(e, item.event)}
                            onClick={e => handleEventClick(e, item.event)}
                            className={containerClasses}
                            style={containerStyle}
                            title={`${item.event.title} (드래그하여 날짜 이동, 탭하여 퀵 메뉴)`}
                          >
                            {/* 할일 체크박스 */}
                            {isTask && (
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  toggleEventTaskCompleted(item.event.id);
                                }}
                                className={`w-3 h-3 rounded flex items-center justify-center shrink-0 border transition-colors ${
                                  item.event.isCompleted
                                    ? 'bg-emerald-500 text-white border-emerald-500'
                                    : 'border-current hover:bg-black/10'
                                }`}
                              >
                                {item.event.isCompleted && <Check size={8} strokeWidth={3} />}
                              </button>
                            )}

                            {/* 시작 시간 라벨 (TimeTree 스타일 콤팩트 라벨) */}
                            {timeStr && (
                              <span className="opacity-80 text-[8.5px] sm:text-[9.5px] font-mono shrink-0 font-medium leading-none mr-0.5">
                                {timeStr}
                              </span>
                            )}

                            {/* 일정 제목 */}
                            <span className={`truncate leading-none ${item.event.isCompleted ? 'line-through opacity-70' : ''}`}>
                              {item.event.title}
                            </span>
                          </div>
                        );
                      })}

                      {/* 4행 이상 숨겨진 일정 표시 (+N개) */}
                      {hiddenCounts.map((count, colIdx) => {
                        if (count <= 0) return null;
                        return (
                          <div
                            key={`hidden-${colIdx}`}
                            onClick={() => setSelectedDate(week[colIdx])}
                            className="pointer-events-auto text-[10px] font-bold text-gray-500 hover:text-slate-900 dark:hover:text-zinc-100 pl-2 cursor-pointer flex items-center"
                            style={{
                              gridColumn: `${colIdx + 1} / span 1`,
                              gridRow: 5,
                            }}
                          >
                            +{count}개 더보기
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* [규칙 1-1 긴급 수정]: 선택된 주(Week) 바로 아래에 독립된 한 줄로 렌더링되어 다음 주 셀들이 자연스럽게 아래로 밀려남(Push Down) */}
                  {desktopLayout === 'inline' && isSelectedInWeek && isTimelineOpen && (
                    <div
                      className="w-full px-2 sm:px-4 py-2 bg-slate-50/90 dark:bg-zinc-900 border-t border-b border-slate-200 dark:border-zinc-700 z-20 shadow-inner shrink-0"
                    >
                      <AcrossInlineTimeline date={selectedDate} onClose={() => setIsTimelineOpen(false)} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 대화면 Split-View */}
        {desktopLayout === 'split' && (
          <div className="hidden xl:flex xl:w-4/12 h-full flex-col p-3 overflow-hidden bg-gray-50/50 dark:bg-zinc-950">
            <AcrossTimeline date={selectedDate} />
          </div>
        )}
      </div>

      {/* [기능 2] 퀵 컨텍스트 메뉴 플로팅 팝오버 */}
      <QuickContextMenu
        event={contextEvent}
        position={contextPos}
        onClose={() => {
          setContextEvent(null);
          setContextPos(null);
        }}
      />
    </div>
  );
};
