// CalHabit & Across 캘린더 핵심 확장 데이터 모델

export type ViewMode =
  | 'month'
  | 'week'
  | 'day'
  | 'timeline'
  | 'dday'
  | 'todo'
  | 'habit'
  | 'widget'
  | 'theme'
  | 'palette';

export type HabitSectionGroup = 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'CUSTOM';

export type RepeatFrequency =
  | 'NONE'
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY_SOLAR'
  | 'MONTHLY_LUNAR'
  | 'YEARLY_SOLAR'
  | 'YEARLY_LUNAR';

// 카테고리 / 캘린더 폴더
export interface CategoryFolder {
  id: string;
  name: string;
  colorHex: string;
  emoji?: string;
  isDefault?: boolean;
}

// 음력 날짜 정보
export interface LunarDate {
  month: number;
  day: number;
  isLeap: boolean;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SubTaskItem {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface CustomRepeatRule {
  frequency: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY_SOLAR' | 'MONTHLY_LUNAR' | 'YEARLY_SOLAR' | 'YEARLY_LUNAR' | 'CUSTOM';
  interval: number; // N일/N주/N월/N년 마다
  unit?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
  daysOfWeek?: number[]; // [0=일, 1=월, ..., 6=토]
  monthlyType?: 'BY_DATE' | 'BY_DAY_OF_WEEK';
  endType?: 'NEVER' | 'UNTIL_DATE' | 'COUNT';
  endDate?: string; // YYYY-MM-DD
  count?: number;
}

// 일정 및 통합 할일 (ScheduleEvent)
export interface ScheduleEvent {
  id: string;
  title: string;
  isAllDay: boolean;
  startDateTime: string; // ISO 8601 (예: 2026-10-06T14:00:00)
  endDateTime: string;   // ISO 8601 (예: 2026-10-06T15:30:00)
  categoryFolderId: string;
  colorHex: string;
  isTask?: boolean;      // 할일 항목 여부 (일정 ⇄ 할일 통합)
  isCompleted?: boolean; // 할일 완료 여부
  priority?: TaskPriority;
  checklist?: SubTaskItem[];
  reminderMinutes?: number;
  lunarDate?: LunarDate;
  repeatRule?: CustomRepeatRule;
  originalEventId?: string; // 반복 일정 원본 ID
  isRecurringInstance?: boolean; // 반복 확장 인스턴스 여부
  location?: string;
  memo?: string;
  templateId?: string;
}

// 습관 (Habit)
export interface Habit {
  id: string;
  title: string;
  icon: string;
  quote?: string;
  sectionGroup: HabitSectionGroup;
  frequency: {
    type: 'DAILY' | 'WEEKLY_DAYS' | 'INTERVAL';
    targetDays?: number[]; // [0, 1, 2, 3, 4, 5, 6] (0=일 ~ 6=토)
    intervalDays?: number;
  };
  goalCountPerDay: number;
  reminders: string[]; // ['08:00', '20:00']
  colorHex: string;
  isArchived: boolean;
  createdAt: string;
  logs: { [dateString: string]: { completed: boolean; count: number } }; // YYYY-MM-DD
}

// 할일 (TodoItem)
export interface TodoItem {
  id: string;
  title: string;
  isCompleted: boolean;
  categoryFolderId: string;
  colorHex: string;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assignedTimeBlock?: {
    startDateTime: string;
    endDateTime: string;
  };
}

// 날씨 정보 모델
export interface DayWeather {
  tempHigh: number;
  tempLow: number;
  condition: 'sunny' | 'cloudy' | 'partlyCloudy' | 'rainy' | 'snow';
  icon: string;
  summary: string;
}

// [기능 3] Across 테마 설정 인터페이스
export interface ThemeConfig {
  id: string;
  name: string; // 'Light', 'Minions', 'Merry Xmas', 'Release', 'Lavender' 등
  type: 'LIGHT' | 'DARK' | 'CUSTOM';
  backgroundColor: string;
  surfaceColor: string;
  primaryTextColor: string;
  secondaryTextColor: string;
  accentColor: string;
  borderColor: string;
  previewColors: [string, string]; // 미리보기 색상 2개
}

// [기능 3] 카테고리 일괄 팔레트 세트 인터페이스
export interface PaletteSet {
  id: string;
  name: string;
  colors: string[]; // 카테고리들에 순차 적용될 HEX 코드 배열
}

// [기능 2] 템플릿 인터페이스
export interface ScheduleTemplate {
  id: string;
  title: string;
  durationMinutes: number;
  categoryFolderId: string;
  colorHex: string;
  defaultMemo?: string;
}

// [기능 4] 배지 및 앱 아이콘 인터페이스
export interface BadgeSettings {
  mode: 'NONE' | 'TODAY_TASKS' | 'TODAY_EVENTS' | 'COMBINED';
  includeCompleted: boolean;
}

export interface AppIconPreset {
  id: string;
  name: string;
  bgColor: string;
  foldColor: string;
  textColor: string;
}

export interface CloudSyncConfig {
  enabled: boolean;
  provider: 'supabase' | 'firebase';
  syncKey: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  firebaseRtdbUrl?: string;
  lastSyncedAt?: string;
}

// 앱 전체 환경 설정
export interface AppSettings {
  showLunarDates: boolean;
  showWeather: boolean;
  showWeekNumbers: boolean;
  hideCompletedTodos: boolean;
  startDayOfWeek: 0 | 1; // 0=일요일, 1=월요일
  hapticEnabled: boolean;
  soundEnabled: boolean;
  currentThemeId: string;
  theme?: 'light' | 'dark' | 'system';
  activeAppIconId: string;
  badgeSettings: BadgeSettings;
  showSplitViewOnDesktop: boolean;
  cloudSync?: CloudSyncConfig;
}
