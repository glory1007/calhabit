import React, { useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ScheduleEvent } from '../../types';
import { format, parseISO, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { formatLunarShort } from '../../utils/lunar';
import { getWeatherForDate } from '../../utils/weather';
import { Clock, Plus, MapPin, AlignLeft, Calendar as CalIcon } from 'lucide-react';

interface AcrossTimelineProps {
  date: Date;
  isInlineView?: boolean;
}

export const AcrossTimeline: React.FC<AcrossTimelineProps> = ({ date, isInlineView = false }) => {
  const {
    filteredEvents,
    openEventModal,
    settings,
  } = useApp();

  const timelineScrollRef = useRef<HTMLDivElement>(null);

  // 선택한 날짜의 이벤트 필터링 (다일 일정 교차 포함)
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayStartMs = new Date(`${dateStr}T00:00:00`).getTime();
  const dayEndMs = new Date(`${dateStr}T23:59:59`).getTime();

  const dayEvents = filteredEvents.filter(event => {
    const s = parseISO(event.startDateTime).getTime();
    const e = parseISO(event.endDateTime).getTime();
    return s <= dayEndMs && e >= dayStartMs;
  });

  const allDayEvents = dayEvents.filter(e => e.isAllDay);
  const timedEvents = dayEvents.filter(e => !e.isAllDay);

  const weather = getWeatherForDate(date);
  const lunarStr = formatLunarShort(date);

  // 현재 시간 인디케이터 위치 계산 (0~24h)
  const now = new Date();
  const isSelectedToday = isSameDay(now, date);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentPercent = (currentMinutes / (24 * 60)) * 100;

  // 오늘인 경우 현재 시간 위치로 자동 스크롤
  useEffect(() => {
    if (isSelectedToday && timelineScrollRef.current) {
      const scrollPos = (currentMinutes / (24 * 60)) * timelineScrollRef.current.scrollWidth - 100;
      timelineScrollRef.current.scrollTo({ left: Math.max(0, scrollPos), behavior: 'smooth' });
    }
  }, [date, isSelectedToday]);

  // 빈 시간대 클릭 시 프리셋 시간으로 일정 추가
  const handleSlotClick = (hour: number) => {
    const datePart = format(date, 'yyyy-MM-dd');
    const startH = String(hour).padStart(2, '0');
    const presetIso = `${datePart}T${startH}:00:00`;
    openEventModal(undefined, presetIso);
  };

  // 24시간 포맷터 (HH:mm)
  const formatTimeRange = (startIso: string, endIso: string) => {
    const start = parseISO(startIso);
    const end = parseISO(endIso);
    return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
  };

  // 0~24 시간대 배열
  const hours = Array.from({ length: 25 }, (_, i) => i);

  return (
    <div className={`bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col ${isInlineView ? 'mt-3' : 'h-full'}`}>
      {/* 헤더: 날짜, 음력, 날씨 요약 */}
      <div className="px-4 py-3 bg-gray-50/80 dark:bg-zinc-800/60 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
            {format(date, 'd')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-gray-900 dark:text-zinc-100">
                {format(date, 'M월 d일 (EEE)', { locale: ko })}
              </span>
              {settings.showLunarDates && (
                <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded">
                  음력 {lunarStr}
                </span>
              )}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5">
              <span>24시간 타임라인</span>
              {settings.showWeather && (
                <span className="flex items-center gap-1 font-medium text-gray-600 dark:text-zinc-300">
                  <span>{weather.icon}</span>
                  <span>{weather.tempHigh}° / {weather.tempLow}°</span>
                  <span className="text-gray-400">({weather.summary})</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 일정 추가 버튼 */}
        <button
          onClick={() => {
            const datePart = format(date, 'yyyy-MM-dd');
            openEventModal(undefined, `${datePart}T09:00:00`);
          }}
          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg transition-colors"
        >
          <Plus size={14} />
          <span>일정 추가</span>
        </button>
      </div>

      {/* 종일(All-day) 일정 바 영역 */}
      {allDayEvents.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/40 dark:bg-zinc-850/40 flex flex-wrap gap-1.5 items-center">
          <span className="text-[11px] font-semibold text-gray-400 dark:text-zinc-500 mr-1">
            종일
          </span>
          {allDayEvents.map(evt => (
            <div
              key={evt.id}
              onClick={() => openEventModal(evt)}
              className="cursor-pointer text-xs font-medium px-2.5 py-1 rounded-md text-white shadow-2xs hover:opacity-90 transition-opacity flex items-center gap-1"
              style={{ backgroundColor: evt.colorHex }}
            >
              <CalIcon size={12} />
              <span>{evt.title}</span>
            </div>
          ))}
        </div>
      )}

      {/* 24시간 가로 스크롤 타임라인 바 (Across 핵심 시그니처 뷰) */}
      <div className="p-3 border-b border-gray-100 dark:border-zinc-800">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400 mb-1.5 font-medium">
          <span className="flex items-center gap-1">
            <Clock size={13} className="text-emerald-500" />
            24시간 타임라인 바 (터치하여 시간별 일정 확인 및 추가)
          </span>
          <span className="text-[11px] text-gray-400">00:00 ~ 24:00</span>
        </div>

        <div
          ref={timelineScrollRef}
          className="relative overflow-x-auto scrollbar-thin pb-2 pt-1 select-none"
        >
          {/* 가로 타임라인 트랙 (폭 1200px 확보하여 24시간을 여유있게 배치) */}
          <div className="relative w-[1200px] h-20 bg-gray-100 dark:bg-zinc-800/80 rounded-xl border border-gray-200 dark:border-zinc-700/80 overflow-hidden">
            {/* 1시간 단위 눈금선 & 라벨 */}
            <div className="absolute inset-0 flex">
              {hours.map(hour => (
                <div
                  key={hour}
                  onClick={() => handleSlotClick(hour)}
                  className="flex-1 border-r border-gray-200 dark:border-zinc-700/60 relative hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 cursor-pointer transition-colors group"
                >
                  {/* 시간 텍스트 라벨 */}
                  <span className="absolute top-1 left-1 text-[10px] text-gray-400 dark:text-zinc-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    {hour}시
                  </span>

                  {/* 호버 시 + 가이드 */}
                  <div className="hidden group-hover:flex absolute inset-0 items-center justify-center text-emerald-600/40 dark:text-emerald-400/40">
                    <Plus size={14} />
                  </div>
                </div>
              ))}
            </div>

            {/* 일정 블록 렌더링 (가로 위치 및 폭 계산) */}
            {timedEvents.map(evt => {
              const start = parseISO(evt.startDateTime);
              const end = parseISO(evt.endDateTime);
              const startMinutes = start.getHours() * 60 + start.getMinutes();
              const endMinutes = end.getHours() * 60 + end.getMinutes();
              const durationMinutes = Math.max(30, endMinutes - startMinutes);

              const leftPercent = (startMinutes / (24 * 60)) * 100;
              const widthPercent = (durationMinutes / (24 * 60)) * 100;

              return (
                <div
                  key={evt.id}
                  onClick={e => {
                    e.stopPropagation();
                    openEventModal(evt);
                  }}
                  className="absolute top-6 bottom-1.5 rounded-lg px-2 py-0.5 text-white shadow-md cursor-pointer hover:brightness-110 transition-all flex items-center justify-center overflow-hidden z-10"
                  style={{
                    left: `${leftPercent}%`,
                    width: `${Math.max(2.5, widthPercent)}%`,
                    backgroundColor: evt.colorHex,
                  }}
                  title={`${evt.title} (${formatTimeRange(evt.startDateTime, evt.endDateTime)})`}
                >
                  {widthPercent >= 3.5 ? (
                    <span className="text-[11px] font-bold truncate leading-tight w-full text-right pr-1">
                      {evt.title}
                    </span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
                  )}
                </div>
              );
            })}

            {/* 현재 시간 빨간선 (오늘인 경우) */}
            {isSelectedToday && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none flex flex-col items-center"
                style={{ left: `${currentPercent}%` }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 -mt-1 shadow-sm" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 하단: 해당 날짜의 시간대별 일정 리스트 카드 */}
      <div className="p-4 flex-1 overflow-y-auto max-h-[360px] space-y-2.5">
        <div className="text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1 flex items-center justify-between">
          <span>일정 목록 ({dayEvents.length}개)</span>
          <span className="text-[11px] text-gray-400">카드를 탭하여 상세 수정</span>
        </div>

        {dayEvents.length === 0 ? (
          <div className="py-8 text-center text-gray-400 dark:text-zinc-500 text-xs">
            <p>등록된 일정이 없습니다.</p>
            <p className="mt-1 text-[11px]">위 타임라인 바의 빈 시간을 탭하여 일정을 바로 추가해 보세요.</p>
          </div>
        ) : (
          dayEvents.map(evt => {
            return (
              <div
                key={evt.id}
                onClick={() => openEventModal(evt)}
                className="p-3 rounded-xl border border-gray-100 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-850 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-start justify-between gap-3 group"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* 컬러 바 */}
                  <div
                    className="w-1.5 self-stretch rounded-full shrink-0"
                    style={{ backgroundColor: evt.colorHex }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {evt.title}
                      </h4>
                      {evt.repeatRule && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 shrink-0">
                          반복
                        </span>
                      )}
                    </div>

                    {/* 시간대 */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400 mt-1">
                      <Clock size={12} className="shrink-0" />
                      <span>
                        {evt.isAllDay
                          ? '종일 일정'
                          : formatTimeRange(evt.startDateTime, evt.endDateTime)}
                      </span>
                    </div>

                    {/* 위치 또는 메모 */}
                    {evt.location && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-zinc-500 mt-0.5 truncate">
                        <MapPin size={12} className="shrink-0" />
                        <span className="truncate">{evt.location}</span>
                      </div>
                    )}
                    {evt.memo && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-zinc-500 mt-0.5 truncate">
                        <AlignLeft size={12} className="shrink-0" />
                        <span className="truncate">{evt.memo}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className="px-2 py-1 rounded-md text-[11px] font-semibold text-white shrink-0 shadow-2xs"
                  style={{ backgroundColor: evt.colorHex }}
                >
                  {evt.isAllDay ? '종일' : format(parseISO(evt.startDateTime), 'HH:mm')}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
