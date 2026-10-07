import { ScheduleEvent, Habit, TodoItem, CategoryFolder } from '../types';
import { format, addDays, subDays } from 'date-fns';

// Across 캘린더 감성의 차분하고 편안한 소프트 톤온톤 카테고리
export const INITIAL_CATEGORIES: CategoryFolder[] = [
  { id: 'cat-personal', name: '개인', colorHex: '#D9777F', isDefault: true },
  { id: 'cat-work', name: '업무', colorHex: '#5B84B1', isDefault: true },
  { id: 'cat-holiday', name: '공휴일', colorHex: '#D27D60', isDefault: true },
  { id: 'cat-health', name: '건강/루틴', colorHex: '#7A9A8B', isDefault: true },
  { id: 'cat-custom', name: '프로젝트', colorHex: '#DDB165', isDefault: false },
];

const today = new Date();
const todayStr = format(today, 'yyyy-MM-dd');
const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');
const tomorrowStr = format(addDays(today, 1), 'yyyy-MM-dd');
const day3Str = format(addDays(today, 3), 'yyyy-MM-dd');

export const INITIAL_EVENTS: ScheduleEvent[] = [
  {
    id: 'evt-1',
    title: '팀 주간 싱크업 회의',
    isAllDay: false,
    startDateTime: `${todayStr}T09:30:00`,
    endDateTime: `${todayStr}T11:00:00`,
    categoryFolderId: 'cat-work',
    colorHex: '#5B84B1',
    location: '회의실 A',
    memo: '주간 스프린트 진행 현황 점검',
  },
  {
    id: 'evt-2',
    title: '점심 약속',
    isAllDay: false,
    startDateTime: `${todayStr}T12:00:00`,
    endDateTime: `${todayStr}T13:00:00`,
    categoryFolderId: 'cat-personal',
    colorHex: '#D4A373',
    location: '센터원 카페',
  },
  {
    id: 'evt-3',
    title: '오후 2:00 - 오후 3:00 [윈도우1차]',
    isAllDay: false,
    startDateTime: `${todayStr}T14:00:00`,
    endDateTime: `${todayStr}T15:30:00`,
    categoryFolderId: 'cat-work',
    colorHex: '#4B6B88',
    location: '온라인 세션',
    memo: '코어 아키텍처 및 타임라인 싱크 점검',
  },
  {
    id: 'evt-4',
    title: '피트니스 운동',
    isAllDay: false,
    startDateTime: `${todayStr}T19:00:00`,
    endDateTime: `${todayStr}T20:15:00`,
    categoryFolderId: 'cat-health',
    colorHex: '#7A9A8B',
    location: '바디랩',
  },
  {
    id: 'evt-5',
    title: '한글날 연휴 기획안 정리',
    isAllDay: true,
    startDateTime: `${todayStr}T00:00:00`,
    endDateTime: `${todayStr}T23:59:59`,
    categoryFolderId: 'cat-holiday',
    colorHex: '#D27D60',
  },
  {
    id: 'evt-6',
    title: '음력 부모님 생신 식사',
    isAllDay: true,
    startDateTime: `${tomorrowStr}T00:00:00`,
    endDateTime: `${tomorrowStr}T23:59:59`,
    categoryFolderId: 'cat-personal',
    colorHex: '#D9777F',
    lunarDate: { month: 8, day: 26, isLeap: false },
    repeatRule: {
      frequency: 'YEARLY_LUNAR',
      interval: 1,
    },
    memo: '음력 8월 26일 매년 반복',
  },
  {
    id: 'evt-7',
    title: '디자인 시스템 리뷰',
    isAllDay: false,
    startDateTime: `${tomorrowStr}T16:00:00`,
    endDateTime: `${tomorrowStr}T17:30:00`,
    categoryFolderId: 'cat-custom',
    colorHex: '#DDB165',
  },
  {
    id: 'evt-8',
    title: '주말 세미나',
    isAllDay: true,
    startDateTime: `${day3Str}T00:00:00`,
    endDateTime: `${day3Str}T23:59:59`,
    categoryFolderId: 'cat-personal',
    colorHex: '#7692A8',
  },
];

const pastLogs: { [key: string]: { completed: boolean; count: number } } = {};
for (let i = 1; i <= 14; i++) {
  const dStr = format(subDays(today, i), 'yyyy-MM-dd');
  if (i !== 3 && i !== 8) {
    pastLogs[dStr] = { completed: true, count: 1 };
  }
}

export const INITIAL_HABITS: Habit[] = [
  {
    id: 'habit-1',
    title: '기상 직후 물 500ml 마시기',
    icon: 'W',
    quote: '상쾌한 하루를 여는 첫 루틴',
    sectionGroup: 'MORNING',
    frequency: { type: 'DAILY' },
    goalCountPerDay: 1,
    reminders: ['07:00'],
    colorHex: '#5B84B1',
    isArchived: false,
    createdAt: format(subDays(today, 30), 'yyyy-MM-dd'),
    logs: { ...pastLogs, [yesterdayStr]: { completed: true, count: 1 } },
  },
  {
    id: 'habit-2',
    title: '스트레칭 15분',
    icon: 'S',
    quote: '굳은 몸을 유연하게 풀어주기',
    sectionGroup: 'MORNING',
    frequency: { type: 'DAILY' },
    goalCountPerDay: 1,
    reminders: ['07:30'],
    colorHex: '#7A9A8B',
    isArchived: false,
    createdAt: format(subDays(today, 20), 'yyyy-MM-dd'),
    logs: { ...pastLogs, [yesterdayStr]: { completed: true, count: 1 } },
  },
  {
    id: 'habit-3',
    title: '비타민 및 영양제 복용',
    icon: 'V',
    quote: '건강을 위한 작은 루틴',
    sectionGroup: 'MORNING',
    frequency: { type: 'DAILY' },
    goalCountPerDay: 1,
    reminders: ['08:30'],
    colorHex: '#DDB165',
    isArchived: false,
    createdAt: format(subDays(today, 25), 'yyyy-MM-dd'),
    logs: { ...pastLogs, [todayStr]: { completed: true, count: 1 } },
  },
  {
    id: 'habit-4',
    title: '아티클 및 도서 30분 독서',
    icon: 'R',
    quote: '매일 꾸준한 시야 확장',
    sectionGroup: 'AFTERNOON',
    frequency: { type: 'DAILY' },
    goalCountPerDay: 1,
    reminders: ['13:30'],
    colorHex: '#9B8AA9',
    isArchived: false,
    createdAt: format(subDays(today, 15), 'yyyy-MM-dd'),
    logs: { ...pastLogs },
  },
  {
    id: 'habit-5',
    title: '1일 1커밋 및 코드 리뷰',
    icon: 'C',
    quote: '꾸준한 기록이 곧 실력',
    sectionGroup: 'AFTERNOON',
    frequency: { type: 'WEEKLY_DAYS', targetDays: [1, 2, 3, 4, 5] },
    goalCountPerDay: 1,
    reminders: ['17:00'],
    colorHex: '#4B6B88',
    isArchived: false,
    createdAt: format(subDays(today, 40), 'yyyy-MM-dd'),
    logs: { ...pastLogs, [yesterdayStr]: { completed: true, count: 1 } },
  },
  {
    id: 'habit-6',
    title: '하루 감사 일기 3줄 작성',
    icon: 'D',
    quote: '오늘 하루 감사했던 순간',
    sectionGroup: 'NIGHT',
    frequency: { type: 'DAILY' },
    goalCountPerDay: 1,
    reminders: ['22:30'],
    colorHex: '#D9777F',
    isArchived: false,
    createdAt: format(subDays(today, 30), 'yyyy-MM-dd'),
    logs: { ...pastLogs },
  },
];

export const INITIAL_TODOS: TodoItem[] = [
  {
    id: 'todo-1',
    title: 'Across 캘린더 인라인 타임라인 드래그 검토',
    isCompleted: true,
    categoryFolderId: 'cat-work',
    colorHex: '#5B84B1',
    priority: 'HIGH',
    dueDate: todayStr,
  },
  {
    id: 'todo-2',
    title: '월간 뷰 톤온톤 팔레트 색감 튜닝',
    isCompleted: false,
    categoryFolderId: 'cat-work',
    colorHex: '#4B6B88',
    priority: 'HIGH',
    dueDate: todayStr,
  },
  {
    id: 'todo-3',
    title: '주간 타임테이블 종일 일정 바 확인',
    isCompleted: false,
    categoryFolderId: 'cat-health',
    colorHex: '#7A9A8B',
    priority: 'MEDIUM',
    dueDate: tomorrowStr,
  },
  {
    id: 'todo-4',
    title: '정기 검진 일정 확인',
    isCompleted: false,
    categoryFolderId: 'cat-personal',
    colorHex: '#D9777F',
    priority: 'LOW',
  },
];
