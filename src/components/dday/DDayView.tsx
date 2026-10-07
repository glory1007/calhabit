import React from 'react';
import { useApp } from '../../context/AppContext';
import { differenceInCalendarDays, parseISO, format } from 'date-fns';
import { Hourglass, Calendar, Plus } from 'lucide-react';

export const DDayView: React.FC = () => {
  const { filteredEvents, openEventModal } = useApp();

  const today = new Date();

  // 날짜순으로 정렬
  const eventsWithDday = filteredEvents.map(evt => {
    const eventDate = parseISO(evt.startDateTime);
    const diffDays = differenceInCalendarDays(eventDate, today);
    return {
      event: evt,
      diffDays,
      dateFormatted: format(eventDate, 'yyyy.MM.dd (EEE)'),
    };
  }).sort((a, b) => a.diffDays - b.diffDays);

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-4">
      {/* 헤더 안내 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-1.5">
            <Hourglass size={18} className="text-cyan-500" />
            <span>디데이 (D-Day) 카운트다운 뷰</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            등록된 주요 일정과 기념일까지 남은 날짜를 실시간 카운트합니다.
          </p>
        </div>

        <button
          onClick={() => openEventModal()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-xs"
        >
          <Plus size={14} />
          <span>기념일 추가</span>
        </button>
      </div>

      {/* D-Day 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {eventsWithDday.map(({ event, diffDays, dateFormatted }) => {
          let badgeText = '';
          if (diffDays === 0) badgeText = 'D-DAY';
          else if (diffDays > 0) badgeText = `D-${diffDays}`;
          else badgeText = `D+${Math.abs(diffDays)}`;

          return (
            <div
              key={event.id}
              onClick={() => openEventModal(event)}
              className="p-4 rounded-2xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-sm hover:border-cyan-500 dark:hover:border-cyan-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              style={{ borderLeftWidth: '5px', borderLeftColor: event.colorHex }}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-black text-white shadow-2xs ${
                      diffDays === 0
                        ? 'bg-red-500 animate-pulse'
                        : diffDays > 0 && diffDays <= 7
                        ? 'bg-orange-500'
                        : 'bg-zinc-800 dark:bg-zinc-700'
                    }`}
                  >
                    {badgeText}
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium flex items-center gap-1">
                    <Calendar size={12} />
                    {dateFormatted}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">
                  {event.title}
                </h4>
              </div>

              {event.location && (
                <div className="text-[11px] text-gray-600 dark:text-slate-300 mt-3 truncate flex items-center gap-1">
                  <span>📍</span>
                  <span>{event.location}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
