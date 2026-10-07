import { ScheduleEvent } from '../types';
import {
  parseISO,
  format,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  isBefore,
  isAfter,
  startOfDay,
  endOfDay,
  getDay,
} from 'date-fns';

/**
 * 주어진 날짜 범위 [rangeStart, rangeEnd] 내에서 반복 일정을 전개(Expansion)하여
 * 가상 일정 인스턴스 배열을 반환합니다.
 */
export function expandRecurringEvents(
  events: ScheduleEvent[],
  rangeStart: Date,
  rangeEnd: Date
): ScheduleEvent[] {
  const result: ScheduleEvent[] = [];
  const rangeStartMs = startOfDay(rangeStart).getTime();
  const rangeEndMs = endOfDay(rangeEnd).getTime();

  for (const event of events) {
    const rule = event.repeatRule;

    // 반복 규칙이 없는 단일 일정
    if (!rule || rule.frequency === 'NONE') {
      const s = parseISO(event.startDateTime).getTime();
      const e = parseISO(event.endDateTime).getTime();
      if (s <= rangeEndMs && e >= rangeStartMs) {
        result.push(event);
      }
      continue;
    }

    // 반복 일정 전개
    const baseStart = parseISO(event.startDateTime);
    const baseEnd = parseISO(event.endDateTime);
    const durationMs = baseEnd.getTime() - baseStart.getTime();

    const freq = rule.frequency;
    const interval = Math.max(1, rule.interval || 1);
    const unit = rule.unit || (
      freq === 'DAILY' ? 'DAY' :
      freq === 'WEEKLY' ? 'WEEK' :
      freq === 'MONTHLY_SOLAR' ? 'MONTH' :
      freq === 'YEARLY_SOLAR' ? 'YEAR' : 'DAY'
    );

    let maxOccurrences = rule.endType === 'COUNT' ? (rule.count || 100) : 365;
    let occurrencesGenerated = 0;

    let untilDateMs = Infinity;
    if (rule.endType === 'UNTIL_DATE' && rule.endDate) {
      untilDateMs = endOfDay(parseISO(`${rule.endDate}T23:59:59`)).getTime();
    }

    if (unit === 'WEEK' && rule.daysOfWeek && rule.daysOfWeek.length > 0) {
      // 주간 다중 요일 반복 (예: 매주 월, 수, 금)
      let currentWeekAnchor = startOfDay(baseStart);
      const selectedDays = [...rule.daysOfWeek].sort((a, b) => a - b);

      while (currentWeekAnchor.getTime() <= rangeEndMs && occurrencesGenerated < maxOccurrences) {
        for (const targetDayOfWeek of selectedDays) {
          const currentDayOfWeek = getDay(currentWeekAnchor);
          const diffDays = targetDayOfWeek - currentDayOfWeek;
          const occurrenceDate = addDays(currentWeekAnchor, diffDays);

          if (isBefore(occurrenceDate, startOfDay(baseStart))) continue;
          if (occurrenceDate.getTime() > untilDateMs) break;

          const occStartStr = `${format(occurrenceDate, 'yyyy-MM-dd')}T${format(baseStart, 'HH:mm:ss')}`;
          const occStartMs = parseISO(occStartStr).getTime();
          const occEndMs = occStartMs + durationMs;

          if (occStartMs <= rangeEndMs && occEndMs >= rangeStartMs) {
            result.push({
              ...event,
              id: `${event.id}_occ_${format(occurrenceDate, 'yyyy-MM-dd')}`,
              originalEventId: event.id,
              isRecurringInstance: true,
              startDateTime: occStartStr,
              endDateTime: format(new Date(occEndMs), "yyyy-MM-dd'T'HH:mm:ss"),
            });
          }

          occurrencesGenerated++;
          if (occurrencesGenerated >= maxOccurrences) break;
        }

        currentWeekAnchor = addWeeks(currentWeekAnchor, interval);
      }
    } else {
      // 일 / 주 / 월 / 년 단순 인터벌 반복
      let currentStart = baseStart;

      while (currentStart.getTime() <= rangeEndMs && occurrencesGenerated < maxOccurrences) {
        if (currentStart.getTime() > untilDateMs) break;

        const occStartMs = currentStart.getTime();
        const occEndMs = occStartMs + durationMs;

        if (occStartMs <= rangeEndMs && occEndMs >= rangeStartMs) {
          result.push({
            ...event,
            id: occurrencesGenerated === 0 ? event.id : `${event.id}_occ_${format(currentStart, 'yyyy-MM-dd')}`,
            originalEventId: event.id,
            isRecurringInstance: occurrencesGenerated > 0,
            startDateTime: format(currentStart, "yyyy-MM-dd'T'HH:mm:ss"),
            endDateTime: format(new Date(occEndMs), "yyyy-MM-dd'T'HH:mm:ss"),
          });
        }

        occurrencesGenerated++;

        // 다음 발생 일자 계산
        if (unit === 'DAY') {
          currentStart = addDays(currentStart, interval);
        } else if (unit === 'WEEK') {
          currentStart = addWeeks(currentStart, interval);
        } else if (unit === 'MONTH') {
          currentStart = addMonths(currentStart, interval);
        } else if (unit === 'YEAR') {
          currentStart = addYears(currentStart, interval);
        } else {
          currentStart = addDays(currentStart, 1);
        }
      }
    }
  }

  // 시작일 순 정렬
  return result.sort((a, b) => a.startDateTime.localeCompare(b.startDateTime) || a.id.localeCompare(b.id));
}
