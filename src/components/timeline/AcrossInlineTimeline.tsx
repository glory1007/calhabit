import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ScheduleEvent } from '../../types';
import { format, parseISO, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { formatLunarShort } from '../../utils/lunar';
import { getWeatherForDate } from '../../utils/weather';
import { triggerHapticFeedback } from '../../utils/habitStats';
import { QuickContextMenu } from '../modals/QuickContextMenu';
import { Plus, Maximize2, Calendar as CalIcon, Trash2, Check } from 'lucide-react';
import { getContrastTextColor } from '../../utils/contrastColor';

interface AcrossInlineTimelineProps {
  date: Date;
  onClose?: () => void;
}

export const AcrossInlineTimeline: React.FC<AcrossInlineTimelineProps> = ({ date }) => {
  const {
    filteredEvents,
    openEventModal,
    saveEvent,
    deleteEvent,
    toggleEventTaskCompleted,
    assignTodoToSchedule,
    settings,
  } = useApp();

  const timelineTrackRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 컨텍스트 메뉴 상태
  const [contextMenuEvent, setContextMenuEvent] = useState<ScheduleEvent | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);

  // [이미지 5] 드래그 앤 드롭 실시간 상태
  const [draggingEventId, setDraggingEventId] = useState<string | null>(null);
  const [dragPreviewMinutes, setDragPreviewMinutes] = useState<number | null>(null);
  const [isHoveringTrash, setIsHoveringTrash] = useState(false);

  const dragStartXRef = useRef<number>(0);
  const initialStartMinutesRef = useRef<number>(0);
  const eventDurationMinutesRef = useRef<number>(60);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDraggingActiveRef = useRef<boolean>(false);

  // 다일(Multi-day) 일정 교차 필터링 및 24시간 타임라인 클램핑
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayStart = new Date(`${dateStr}T00:00:00`);
  const dayEnd = new Date(`${dateStr}T23:59:59`);
  const dayStartMs = dayStart.getTime();
  const dayEndMs = dayEnd.getTime();

  const dayEvents = filteredEvents.filter(event => {
    const s = parseISO(event.startDateTime).getTime();
    const e = parseISO(event.endDateTime).getTime();
    return s <= dayEndMs && e >= dayStartMs;
  });

  const allDayEvents = dayEvents.filter(e => e.isAllDay);
  const rawTimedEvents = dayEvents.filter(e => !e.isAllDay);

  interface TimedSegment {
    event: ScheduleEvent;
    startMinutes: number;
    endMinutes: number;
    durationMinutes: number;
    isContinuingFromPrev: boolean;
    isContinuingToNext: boolean;
    lane: number;
  }

  const timedSegmentsPre = rawTimedEvents.map(evt => {
    const s = parseISO(evt.startDateTime);
    const e = parseISO(evt.endDateTime);
    const sMs = s.getTime();
    const eMs = e.getTime();

    const isContinuingFromPrev = sMs < dayStartMs;
    const isContinuingToNext = eMs > dayEndMs;

    const clampedStartMs = Math.max(sMs, dayStartMs);
    const clampedEndMs = Math.min(eMs, dayEndMs);

    const startMinutes = Math.floor((clampedStartMs - dayStartMs) / (60 * 1000));
    let endMinutes = Math.ceil((clampedEndMs - dayStartMs) / (60 * 1000));
    if (endMinutes <= startMinutes) {
      endMinutes = Math.min(1440, startMinutes + 30);
    }
    const durationMinutes = Math.max(25, endMinutes - startMinutes);

    return {
      event: evt,
      startMinutes,
      endMinutes,
      durationMinutes,
      isContinuingFromPrev,
      isContinuingToNext,
    };
  });

  // 정렬: 시작 시간 빠른 순, 긴 기간 순, id 순
  timedSegmentsPre.sort((a, b) => a.startMinutes - b.startMinutes || b.durationMinutes - a.durationMinutes || a.event.id.localeCompare(b.event.id));

  // 다중 레인(Lane) 패킹 알고리즘: 같은 시간대에 겹치는 일정들을 서로 다른 수직 행(lane)으로 겹침 없이 배치 (Image 4)
  const lanes: number[] = [];
  const timedSegments: TimedSegment[] = timedSegmentsPre.map(item => {
    let assignedLane = -1;
    for (let l = 0; l < lanes.length; l++) {
      if (lanes[l] <= item.startMinutes) {
        assignedLane = l;
        lanes[l] = item.endMinutes;
        break;
      }
    }
    if (assignedLane === -1) {
      assignedLane = lanes.length;
      lanes.push(item.endMinutes);
    }
    return {
      ...item,
      lane: assignedLane,
    };
  });

  const totalLanes = Math.max(1, lanes.length);
  const trackHeight = Math.max(116, 28 + totalLanes * 38);

  const weather = getWeatherForDate(date);
  const lunarStr = formatLunarShort(date);

  const now = new Date();
  const isSelectedToday = isSameDay(now, date);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentPercent = (currentMinutes / (24 * 60)) * 100;

  // 진입 시 스크롤
  useEffect(() => {
    if (scrollContainerRef.current) {
      if (isSelectedToday) {
        const scrollPos = (currentMinutes / (24 * 60)) * 1440 - 150;
        scrollContainerRef.current.scrollTo({ left: Math.max(0, scrollPos), behavior: 'smooth' });
      } else {
        scrollContainerRef.current.scrollTo({ left: 450, behavior: 'smooth' });
      }
    }
  }, [date, isSelectedToday]);

  const handleSlotClick = (hour: number) => {
    if (isDraggingActiveRef.current) return;
    const datePart = format(date, 'yyyy-MM-dd');
    const startH = String(hour).padStart(2, '0');
    openEventModal(undefined, `${datePart}T${startH}:00:00`);
  };

  const format24Time = (isoString: string) => {
    const d = parseISO(isoString);
    return format(d, 'HH:mm');
  };

  // 15분 단위 스냅 분 계산 포맷 (예: 5:15)
  const formatMinutesToTime = (minutes: number) => {
    const clamped = Math.max(0, Math.min(23 * 60 + 59, minutes));
    const h = Math.floor(clamped / 60);
    const m = clamped % 60;
    return `${h}:${String(m).padStart(2, '0')}`;
  };

  // 롱프레스 & 터치/마우스 드래그 시작 (이미지 5번의 200ms 활성화)
  const startDragEvent = (evt: ScheduleEvent, clientX: number) => {
    const start = parseISO(evt.startDateTime);
    const end = parseISO(evt.endDateTime);
    const startM = start.getHours() * 60 + start.getMinutes();
    const endM = end.getHours() * 60 + end.getMinutes();

    initialStartMinutesRef.current = startM;
    eventDurationMinutesRef.current = Math.max(30, endM - startM);
    dragStartXRef.current = clientX;
    setDraggingEventId(evt.id);
    setDragPreviewMinutes(startM);
    isDraggingActiveRef.current = true;
    if (settings.hapticEnabled) triggerHapticFeedback();
  };

  // 마우스 드래그 처리
  const handleMouseDown = (e: React.MouseEvent, evt: ScheduleEvent) => {
    const startX = e.clientX;
    longPressTimerRef.current = setTimeout(() => {
      startDragEvent(evt, startX);
    }, 180);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingActiveRef.current || !draggingEventId) return;

    const dx = e.clientX - dragStartXRef.current;
    // 1440px = 24시간 = 1440분 -> 1px 당 1분
    const deltaMinutes = Math.round(dx / 15) * 15; // 15분 스냅
    const newStartM = Math.max(0, Math.min(24 * 60 - eventDurationMinutesRef.current, initialStartMinutesRef.current + deltaMinutes));
    setDragPreviewMinutes(newStartM);

    // 우측 끝 휴지통 영역 호버 감지
    if (typeof window !== 'undefined' && e.clientX > window.innerWidth - 80) {
      setIsHoveringTrash(true);
    } else {
      setIsHoveringTrash(false);
    }
  };

  const handleMouseUp = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

    if (isDraggingActiveRef.current && draggingEventId) {
      if (isHoveringTrash) {
        // [이미지 5] 휴지통에 드롭 시 즉시 삭제
        deleteEvent(draggingEventId);
        if (settings.hapticEnabled) triggerHapticFeedback();
      } else if (dragPreviewMinutes !== null && dragPreviewMinutes !== initialStartMinutesRef.current) {
        // 새로운 시간으로 갱신 저장
        const targetEvt = dayEvents.find(e => e.id === draggingEventId);
        if (targetEvt) {
          const datePart = format(date, 'yyyy-MM-dd');
          const startH = String(Math.floor(dragPreviewMinutes / 60)).padStart(2, '0');
          const startM = String(dragPreviewMinutes % 60).padStart(2, '0');
          const endTotalM = dragPreviewMinutes + eventDurationMinutesRef.current;
          const endH = String(Math.floor(endTotalM / 60)).padStart(2, '0');
          const endM = String(endTotalM % 60).padStart(2, '0');

          saveEvent({
            ...targetEvt,
            startDateTime: `${datePart}T${startH}:${startM}:00`,
            endDateTime: `${datePart}T${endH}:${endM}:00`,
          });
          if (settings.hapticEnabled) triggerHapticFeedback();
        }
      }
    }

    setDraggingEventId(null);
    setDragPreviewMinutes(null);
    setIsHoveringTrash(false);
    setTimeout(() => {
      isDraggingActiveRef.current = false;
    }, 100);
  };

  // 모바일 터치 드래그 처리
  const handleTouchStart = (e: React.TouchEvent, evt: ScheduleEvent) => {
    const touch = e.touches[0];
    const startX = touch.clientX;
    longPressTimerRef.current = setTimeout(() => {
      startDragEvent(evt, startX);
    }, 200);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingActiveRef.current || !draggingEventId) {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      return;
    }

    const touch = e.touches[0];
    const dx = touch.clientX - dragStartXRef.current;
    const deltaMinutes = Math.round(dx / 15) * 15; // 15분 단위 스냅
    const newStartM = Math.max(0, Math.min(24 * 60 - eventDurationMinutesRef.current, initialStartMinutesRef.current + deltaMinutes));
    setDragPreviewMinutes(newStartM);

    if (touch.clientX > window.innerWidth - 80) {
      setIsHoveringTrash(true);
    } else {
      setIsHoveringTrash(false);
    }
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  // 일정 블록 클릭 시 컨텍스트 팝오버 메뉴 오픈
  const handleBlockClick = (e: React.MouseEvent, evt: ScheduleEvent) => {
    if (isDraggingActiveRef.current) return;
    e.stopPropagation();
    setContextMenuEvent(evt);
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  // 0시부터 23시까지 24시간 순차 배열
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="my-2 p-3 bg-slate-50/80 dark:bg-zinc-850/90 rounded-2xl border border-slate-200 dark:border-zinc-700/80 shadow-xs transition-all relative select-none"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/80 dark:border-zinc-700/80">
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>{format(date, 'M월 d일 EEEE', { locale: ko })}</span>
          </span>

          {settings.showLunarDates && (
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-normal">
              {lunarStr}
            </span>
          )}

          {settings.showWeather && (
            <span className="text-xs font-medium text-slate-600 dark:text-zinc-300 flex items-center gap-1.5 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-slate-200/70 dark:border-zinc-700">
              <span>{weather.tempHigh}° {weather.tempLow}°</span>
              <span className="text-[11px] text-slate-400">({weather.summary})</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const datePart = format(date, 'yyyy-MM-dd');
              openEventModal(undefined, `${datePart}T14:00:00`);
            }}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-white dark:bg-zinc-800 hover:bg-slate-100 text-slate-700 dark:text-zinc-200 rounded-lg border border-slate-200 dark:border-zinc-700 transition-colors shadow-2xs"
          >
            <Plus size={13} />
            <span>일정 추가</span>
          </button>
          <div className="text-slate-400 hover:text-slate-600 p-1" title="Across 24시간 타임라인">
            <Maximize2 size={15} />
          </div>
        </div>
      </div>

      {/* 종일 일정 바 */}
      {allDayEvents.length > 0 && (
        <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1">
          <span className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 shrink-0">
            종일:
          </span>
          {allDayEvents.map(evt => (
            <div
              key={evt.id}
              onClick={e => handleBlockClick(e, evt)}
              className="px-2.5 py-1 rounded-md text-xs font-semibold text-white shadow-2xs cursor-pointer hover:opacity-90 flex items-center gap-1 shrink-0"
              style={{ backgroundColor: evt.colorHex }}
            >
              <CalIcon size={12} />
              <span>{evt.title}</span>
            </div>
          ))}
        </div>
      )}

      {/* Across 24시간 수평 타임라인 바 & [이미지 5] 드래그 앤 드롭 */}
      <div
        ref={scrollContainerRef}
        className="relative overflow-x-auto scrollbar-thin select-none py-1"
      >
        <div
          ref={timelineTrackRef}
          style={{ height: `${trackHeight}px` }}
          className="relative w-[1440px] bg-white/90 dark:bg-zinc-900/90 rounded-xl border border-slate-200 dark:border-zinc-750 shadow-inner overflow-hidden transition-all duration-200"
        >
          {/* 시간 눈금 그리드 (0시 ~ 23시 24개 슬롯 순차 렌더링) */}
          <div className="absolute inset-0 flex">
            {hours.map(hour => {
              const label = `${hour}시`;
              return (
                <div
                  key={hour}
                  onClick={() => handleSlotClick(hour)}
                  onDragOver={e => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={e => {
                    e.preventDefault();
                    const raw = e.dataTransfer.getData('text/plain');
                    if (raw && raw.startsWith('todo:')) {
                      const todoId = raw.replace('todo:', '');
                      assignTodoToSchedule(todoId, format(date, 'yyyy-MM-dd'), hour, 1);
                      if (settings.hapticEnabled) triggerHapticFeedback();
                    }
                  }}
                  title={`${hour}:00 ~ ${hour + 1}:00 클릭하여 일정 추가 (또는 서랍의 할일을 드롭)`}
                  className="flex-1 border-r border-gray-100 dark:border-zinc-800 relative hover:bg-slate-100/60 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors group"
                >
                  <span className="absolute top-1 left-1.5 text-[10px] font-medium text-gray-400 dark:text-zinc-500 group-hover:text-[#5B84B1]">
                    {label}
                  </span>
                  <div className="hidden group-hover:flex absolute inset-0 items-center justify-center text-[#5B84B1]/40">
                    <Plus size={14} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* [이미지 4] 다중 레인(Lane) 스택 일정 블록 카드 */}
          {timedSegments.map(seg => {
            const isDragging = draggingEventId === seg.event.id;
            const effectiveStartM = isDragging && dragPreviewMinutes !== null ? dragPreviewMinutes : seg.startMinutes;
            const leftPx = (effectiveStartM / (24 * 60)) * 1440;
            // 24시간 비례 너비 계산 (최소 26px 확보하여 터치/클릭 가능)
            const rawWidthPx = (seg.durationMinutes / (24 * 60)) * 1440;
            const widthPx = Math.max(26, rawWidthPx);
            const topPx = 26 + seg.lane * 38;

            // [요구사항 2] 블록 너비별 텍스트 자동 대응 플래그
            const isVeryNarrow = widthPx < 52; // 15~30분 등 아주 좁은 블록: 텍스트 숨김, 컬러 칩 형태
            const isMediumNarrow = widthPx >= 52 && widthPx < 95; // 보통 블록: 폰트 축소 및 말줄임

            const timeRangeText = isDragging
              ? `${formatMinutesToTime(effectiveStartM)} (15분 스냅)`
              : seg.isContinuingFromPrev
              ? `00:00 ~ ${format24Time(seg.event.endDateTime)}`
              : seg.isContinuingToNext
              ? `${format24Time(seg.event.startDateTime)} ~ 24:00`
              : `${format24Time(seg.event.startDateTime)} - ${format24Time(seg.event.endDateTime)}`;

            return (
              <React.Fragment key={`${seg.event.id}-${seg.lane}`}>
                {/* [이미지 5] 드래그 중일 때 원래 자리에 남는 반투명 회색 고스트 박스 */}
                {isDragging && (
                  <div
                    className="absolute bg-gray-300/40 dark:bg-zinc-700/40 border-2 border-dashed border-gray-400 rounded-xl pointer-events-none"
                    style={{
                      left: `${(seg.startMinutes / (24 * 60)) * 1440}px`,
                      width: `${widthPx}px`,
                      top: `${topPx}px`,
                      height: '34px',
                    }}
                  />
                )}

                {/* 드래그 중 시간 안내 플로팅 배지 */}
                {isDragging && (
                  <div
                    className="absolute z-40 bg-zinc-900 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shadow-xl pointer-events-none border border-white/20"
                    style={{
                      left: `${leftPx}px`,
                      top: `${Math.max(2, topPx - 22)}px`,
                    }}
                  >
                    ⏱ {timeRangeText}
                  </div>
                )}

                {/* 실제 블록 (일정: Solid Fill + 고대비 글자 / 할일: Outline 2px + 은은한 배경) */}
                <div
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.setData('text/plain', seg.event.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onMouseDown={e => handleMouseDown(e, seg.event)}
                  onTouchStart={e => handleTouchStart(e, seg.event)}
                  onClick={e => handleBlockClick(e, seg.event)}
                  className={`absolute rounded-xl shadow-md cursor-grab active:cursor-grabbing transition-shadow flex items-center overflow-hidden z-20 text-left ${
                    isVeryNarrow ? 'px-1 justify-center' : 'px-2.5 justify-between gap-1.5'
                  } ${
                    isDragging
                      ? 'scale-105 shadow-2xl ring-2 ring-red-500 border-red-500 opacity-95 z-30'
                      : seg.event.isTask
                      ? 'border-2 hover:ring-2 hover:ring-[#5B84B1]/50'
                      : 'border-white/25 hover:ring-2 hover:ring-[#5B84B1]/50'
                  }`}
                  style={{
                    left: `${leftPx}px`,
                    width: `${widthPx}px`,
                    top: `${topPx}px`,
                    height: '34px',
                    backgroundColor: seg.event.isTask ? `${seg.event.colorHex}18` : seg.event.colorHex,
                    borderColor: seg.event.isTask ? seg.event.colorHex : undefined,
                    color: seg.event.isTask ? seg.event.colorHex : getContrastTextColor(seg.event.colorHex),
                  }}
                  title={`${seg.event.title} (${timeRangeText})${seg.event.location ? ` - ${seg.event.location}` : ''}`}
                >
                  {/* [요구사항 2]: 15~30분 등 아주 좁은 블록은 텍스트를 숨기고 고유 컬러 칩 형태로만 표시 */}
                  {!isVeryNarrow ? (
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      {/* 할일 체크박스 */}
                      {seg.event.isTask && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            toggleEventTaskCompleted(seg.event.id);
                          }}
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border transition-colors ${
                            seg.event.isCompleted
                              ? 'bg-emerald-500 text-white border-emerald-500'
                              : 'border-current hover:bg-black/10'
                          }`}
                          title={seg.event.isCompleted ? '할일 완료됨 (클릭하여 취소)' : '할일 완료 처리'}
                        >
                          {seg.event.isCompleted && <Check size={10} strokeWidth={3} />}
                        </button>
                      )}

                      {/* [요구사항 2 핵심 수정]: 시간 텍스트 완전 제거, 오직 제목만 깔끔하게 표시 */}
                      <span
                        className={`truncate font-bold ${
                          isMediumNarrow ? 'text-[10px] leading-tight' : 'text-xs'
                        } ${seg.event.isCompleted ? 'line-through opacity-70' : ''}`}
                      >
                        {seg.isContinuingFromPrev && <span className="opacity-75 mr-0.5 text-[9px]">↳</span>}
                        {seg.event.title}
                        {seg.isContinuingToNext && <span className="opacity-75 ml-0.5 text-[9px]">→</span>}
                      </span>
                    </div>
                  ) : (
                    // 아주 좁은 블록: 마이크로 인디케이터
                    <div className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                  )}

                  {!isVeryNarrow && !isMediumNarrow && seg.event.location && (
                    <span className="text-[9px] opacity-80 truncate shrink-0 hidden sm:inline">
                      📍 {seg.event.location}
                    </span>
                  )}
                </div>
              </React.Fragment>
            );
          })}

          {/* 현재 시간 빨간선 */}
          {isSelectedToday && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none flex flex-col items-center"
              style={{ left: `${currentPercent}%` }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 -mt-1 shadow-xs" />
            </div>
          )}
        </div>
      </div>

      {/* [이미지 5 핵심 구현]: 드래그 중 화면 우측 끝에 노출되는 붉은색 '휴지통(삭제)' 드롭 타깃 */}
      {draggingEventId && (
        <div
          className={`fixed right-4 bottom-24 z-50 w-16 h-16 rounded-2xl flex flex-col items-center justify-center transition-all shadow-2xl animate-in fade-in zoom-in-90 ${
            isHoveringTrash
              ? 'bg-red-600 text-white scale-110 ring-4 ring-red-300'
              : 'bg-red-500/90 text-white hover:bg-red-600'
          }`}
        >
          <Trash2 size={26} strokeWidth={2.5} className={isHoveringTrash ? 'animate-bounce' : ''} />
          <span className="text-[10px] font-bold mt-0.5">삭제</span>
        </div>
      )}

      {/* 안내 캡션 (Across 미니멀 안내) */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-300 pt-1.5 px-1 font-medium">
        <span>
          <span className="font-bold text-slate-700 dark:text-slate-100">드래그 & 드롭:</span> 일정을 길게 눌러 좌우로 드래그하여 시간을 변경하거나 우측 휴지통에 놓아 삭제할 수 있습니다.
        </span>
        <span className="text-slate-400 dark:text-slate-400">{timedSegments.length}개 시간제 일정</span>
      </div>

      {/* [기능 2] 퀵 컨텍스트 메뉴 팝오버 */}
      <QuickContextMenu
        event={contextMenuEvent}
        position={contextMenuPos}
        onClose={() => {
          setContextMenuEvent(null);
          setContextMenuPos(null);
        }}
      />
    </div>
  );
};
