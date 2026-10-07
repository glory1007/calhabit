import { Habit } from '../types';
import { format, subDays, parseISO, isSameDay } from 'date-fns';

export interface HabitSummaryStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletedDays: number;
  completionRate30Days: number;
}

export function calculateHabitStats(habit: Habit, referenceDate: Date = new Date()): HabitSummaryStats {
  const refDateStr = format(referenceDate, 'yyyy-MM-dd');
  const logs = habit.logs || {};

  // 총 달성 일수
  const completedDates = Object.entries(logs)
    .filter(([_, log]) => log.completed)
    .map(([dateStr]) => dateStr)
    .sort();

  const totalCompletedDays = completedDates.length;

  // 연속 달성(Streak) 계산
  let currentStreak = 0;
  let checkDate = new Date(referenceDate);

  // 오늘 완료되었는지 확인
  const todayStr = format(checkDate, 'yyyy-MM-dd');
  const isTodayCompleted = logs[todayStr]?.completed;

  if (isTodayCompleted) {
    currentStreak++;
    checkDate = subDays(checkDate, 1);
  } else {
    // 오늘 미완료라면 어제 완료되었는지 확인 (오늘 아직 안한 상태일 수 있으므로)
    const yesterday = subDays(checkDate, 1);
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
    if (logs[yesterdayStr]?.completed) {
      checkDate = yesterday;
    } else {
      checkDate = null as any;
    }
  }

  while (checkDate) {
    const dStr = format(checkDate, 'yyyy-MM-dd');
    if (logs[dStr]?.completed) {
      if (dStr !== todayStr) {
        currentStreak++;
      }
      checkDate = subDays(checkDate, 1);
    } else {
      break;
    }
  }

  // 최장 연속 달성 (Longest Streak)
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dStr of completedDates) {
    const curDate = parseISO(dStr);
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diff = Math.round((curDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        tempStreak++;
      } else if (diff > 1) {
        tempStreak = 1;
      }
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
    prevDate = curDate;
  }
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  // 최근 30일 달성률
  let completedCountLast30 = 0;
  for (let i = 0; i < 30; i++) {
    const d = subDays(referenceDate, i);
    const dStr = format(d, 'yyyy-MM-dd');
    if (logs[dStr]?.completed) {
      completedCountLast30++;
    }
  }
  const completionRate30Days = Math.round((completedCountLast30 / 30) * 100);

  return {
    currentStreak,
    longestStreak,
    totalCompletedDays,
    completionRate30Days,
  };
}

// 햅틱 및 쾌감 효과음 피드백 유틸리티
export function triggerHapticFeedback() {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([15, 30, 20]);
    } catch (_) {
      // ignore
    }
  }
}

export function playCompletionSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // 청량한 차임 사운드 (두 개의 톤 상승)
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(659.25, now + 0.05); // E5
    osc2.frequency.exponentialRampToValueAtTime(1046.5, now + 0.2); // C6

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.05);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  } catch (_) {
    // ignore
  }
}
