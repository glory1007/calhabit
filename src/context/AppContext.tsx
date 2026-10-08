import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ScheduleEvent,
  Habit,
  TodoItem,
  CategoryFolder,
  ViewMode,
  AppSettings,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_EVENTS,
  INITIAL_HABITS,
  INITIAL_TODOS,
} from '../data/mockData';
import { format, isSameDay, parseISO, subMonths, addMonths } from 'date-fns';
import { expandRecurringEvents } from '../utils/recurrence';
import { triggerHapticFeedback, playCompletionSound } from '../utils/habitStats';
import confetti from 'canvas-confetti';
import {
  CloudSyncSettings,
  loadSyncConfig,
  saveSyncConfig,
  pushToCloud,
  pullFromCloud,
  subscribeToRealtimeSync,
  SyncPayload,
  DEFAULT_MASTER_SYNC_KEY,
} from '../services/cloudSync';

interface AppContextType {
  // 상태
  events: ScheduleEvent[];
  habits: Habit[];
  todos: TodoItem[];
  categories: CategoryFolder[];
  selectedDate: Date;
  currentMonth: Date;
  viewMode: ViewMode;
  activeCategoryIds: string[]; // 필터링용 활성 카테고리 ID 목록 (비어있으면 전체)
  settings: AppSettings;

  // 모달 제어 상태
  isEventModalOpen: boolean;
  editingEvent: ScheduleEvent | null;
  presetStartTime: string | null;
  isHabitModalOpen: boolean;
  editingHabit: Habit | null;
  activeHabitDetailId: string | null;
  isTaskDrawerOpen: boolean;
  isTimelineOpen: boolean;
  setIsTimelineOpen: (open: boolean) => void;
  toggleTimeline: () => void;
  isTagModalOpen: boolean;
  setIsTagModalOpen: (open: boolean) => void;
  isCloudSyncModalOpen: boolean;
  setIsCloudSyncModalOpen: (open: boolean) => void;

  // 클라우드 실시간 동기화 상태 및 핸들러
  syncConfig: CloudSyncSettings;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  syncError: string | null;
  lastSyncedAt: string | null;
  handleManualPush: () => Promise<{ success: boolean; error?: string }>;
  handleManualPull: () => Promise<{ success: boolean; error?: string }>;
  handleUpdateSyncConfig: (config: CloudSyncSettings) => void;

  // 상태 변경 함수
  setSelectedDate: (date: Date) => void;
  setCurrentMonth: (date: Date) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleCategoryFilter: (categoryId: string) => void;
  resetCategoryFilter: () => void;
  reorderCategories: (sourceIndex: number, destIndex: number) => void;
  addCategory: (name: string, colorHex: string, emoji?: string) => void;
  updateCategory: (id: string, name: string, colorHex: string, emoji?: string) => void;
  deleteCategory: (id: string) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;

  // 이벤트 관련 액션
  openEventModal: (event?: ScheduleEvent, presetStartIso?: string, defaultIsTask?: boolean) => void;
  defaultIsTaskModal: boolean;
  closeEventModal: () => void;
  saveEvent: (event: Omit<ScheduleEvent, 'id'> & { id?: string }) => void;
  deleteEvent: (id: string) => void;
  toggleEventTaskCompleted: (eventId: string) => void;
  convertEventToTask: (eventId: string) => void;
  convertTaskToEvent: (eventId: string) => void;

  // 습관 관련 액션
  openHabitModal: (habit?: Habit) => void;
  closeHabitModal: () => void;
  openHabitDetail: (habitId: string) => void;
  closeHabitDetail: () => void;
  saveHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'logs'> & { id?: string }) => void;
  deleteHabit: (id: string) => void;
  toggleHabitCheck: (habitId: string, dateStr?: string) => void;

  // 할일 관련 액션
  toggleTodo: (todoId: string) => void;
  addTodo: (title: string, categoryId?: string, dueDate?: string) => void;
  deleteTodo: (todoId: string) => void;
  assignTodoToSchedule: (todoId: string, dateStr: string, startHour: number, durationHours?: number) => void;
  toggleTaskDrawer: () => void;

  // 필터링된 이벤트
  filteredEvents: ScheduleEvent[];
  getEventsForDate: (date: Date) => ScheduleEvent[];
}

const DEFAULT_SETTINGS: AppSettings = {
  showLunarDates: true,
  showWeather: true,
  showWeekNumbers: true,
  hideCompletedTodos: false,
  startDayOfWeek: 0,
  hapticEnabled: true,
  soundEnabled: true,
  theme: 'light',
  currentThemeId: 'light',
  activeAppIconId: 'icon-default',
  badgeSettings: { mode: 'COMBINED', includeCompleted: false },
  showSplitViewOnDesktop: true,
};

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  EVENTS: 'calhabit_events_v1',
  HABITS: 'calhabit_habits_v1',
  TODOS: 'calhabit_todos_v1',
  CATEGORIES: 'calhabit_categories_v1',
  SETTINGS: 'calhabit_settings_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 로컬 스토리지 초기화
  const [events, setEvents] = useState<ScheduleEvent[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EVENTS);
    return saved ? JSON.parse(saved) : INITIAL_EVENTS;
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HABITS);
    return saved ? JSON.parse(saved) : INITIAL_HABITS;
  });

  const [todos, setTodos] = useState<TodoItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TODOS);
    return saved ? JSON.parse(saved) : INITIAL_TODOS;
  });

  const [categories, setCategories] = useState<CategoryFolder[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    const parsed: CategoryFolder[] = saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    return parsed.map(c => {
      if (c.emoji) return c;
      if (c.name.includes('개인')) return { ...c, emoji: '👤' };
      if (c.name.includes('업무')) return { ...c, emoji: '💼' };
      if (c.name.includes('공휴일')) return { ...c, emoji: '🏖️' };
      if (c.name.includes('건강')) return { ...c, emoji: '🏃' };
      if (c.name.includes('프로젝트')) return { ...c, emoji: '💡' };
      return { ...c, emoji: '🏷️' };
    });
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  // 뷰 & 날짜 상태
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [activeCategoryIds, setActiveCategoryIds] = useState<string[]>([]);

  // 모달 상태
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [presetStartTime, setPresetStartTime] = useState<string | null>(null);
  const [defaultIsTaskModal, setDefaultIsTaskModal] = useState<boolean>(false);

  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [activeHabitDetailId, setActiveHabitDetailId] = useState<string | null>(null);

  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const toggleTimeline = () => setIsTimelineOpen(prev => !prev);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState(false);

  // 클라우드 동기화 설정 및 상태
  const [syncConfig, setSyncConfig] = useState<CloudSyncSettings>(() => loadSyncConfig());
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => loadSyncConfig().lastSyncedAt || null);

  const isRemoteUpdatingRef = React.useRef(false);
  const autoPushTimeoutRef = React.useRef<any>(null);

  const applyRemotePayload = (data: SyncPayload) => {
    isRemoteUpdatingRef.current = true;
    if (data.events && Array.isArray(data.events)) setEvents(data.events);
    if (data.habits && Array.isArray(data.habits)) setHabits(data.habits);
    if (data.todos && Array.isArray(data.todos)) setTodos(data.todos);
    if (data.categories && Array.isArray(data.categories)) setCategories(data.categories);
    if (data.settings) {
      setSettings(prev => ({ ...prev, ...data.settings }));
      if (data.settings.theme) {
        document.documentElement.classList.toggle('dark', data.settings.theme === 'dark');
      }
    }
    if (typeof data.isTimelineOpen === 'boolean') {
      setIsTimelineOpen(data.isTimelineOpen);
    }
    setLastSyncedAt(data.updatedAt || new Date().toISOString());
    setSyncStatus('synced');
    setSyncError(null);
    setTimeout(() => {
      isRemoteUpdatingRef.current = false;
    }, 800);
  };

  const handleUpdateSyncConfig = (config: CloudSyncSettings) => {
    setSyncConfig(config);
    saveSyncConfig(config);
  };

  const handleManualPush = async (): Promise<{ success: boolean; error?: string }> => {
    setSyncStatus('syncing');
    setSyncError(null);
    const res = await pushToCloud(
      {
        events,
        habits,
        todos,
        categories,
        settings,
        isTimelineOpen,
      },
      syncConfig
    );
    if (res.success) {
      setSyncStatus('synced');
      setLastSyncedAt(new Date().toISOString());
    } else {
      setSyncStatus('error');
      setSyncError(res.error || '업로드 실패');
    }
    return res;
  };

  const handleManualPull = async (): Promise<{ success: boolean; error?: string }> => {
    setSyncStatus('syncing');
    setSyncError(null);
    const res = await pullFromCloud(syncConfig);
    if (res.success && res.data) {
      applyRemotePayload(res.data);
      return { success: true };
    } else {
      setSyncStatus('error');
      setSyncError(res.error || '가져오기 실패');
      return { success: false, error: res.error };
    }
  };

  // 1. 초기 로드 시 클라우드 데이터 가져오기 & Realtime 구독 (WebSockets 초고속 동기화)
  useEffect(() => {
    if (!syncConfig.enabled) return;

    handleManualPull();

    const unsubscribe = subscribeToRealtimeSync(
      syncConfig,
      payload => {
        applyRemotePayload(payload);
      },
      () => ({
        events,
        habits,
        todos,
        categories,
        settings,
        isTimelineOpen,
        updatedAt: new Date().toISOString(),
      })
    );

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleManualPull();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [syncConfig.enabled, syncConfig.syncKey, syncConfig.provider]);

  // 2. 데이터 변경 시 자동 업로드 (Debounced Push: 300ms 초고속 반영)
  useEffect(() => {
    if (!syncConfig.enabled || isRemoteUpdatingRef.current) return;

    if (autoPushTimeoutRef.current) clearTimeout(autoPushTimeoutRef.current);
    autoPushTimeoutRef.current = setTimeout(() => {
      handleManualPush();
    }, 300);

    return () => {
      if (autoPushTimeoutRef.current) clearTimeout(autoPushTimeoutRef.current);
    };
  }, [events, habits, todos, categories, settings, isTimelineOpen]);

  // 3. 테마(다크/라이트) 즉시 html 태그 반영
  useEffect(() => {
    const isDark = settings.theme === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // 로컬 스토리지 동기화
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // 카테고리 필터 토글
  const toggleCategoryFilter = (categoryId: string) => {
    setActiveCategoryIds(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const resetCategoryFilter = () => {
    setActiveCategoryIds([]);
  };

  // 카테고리 순서 드래그 앤 드롭 재정렬
  const reorderCategories = (sourceIndex: number, destIndex: number) => {
    if (sourceIndex === destIndex) return;
    setCategories(prev => {
      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(destIndex, 0, moved);
      return next;
    });
  };

  // 태그 신규 추가
  const addCategory = (name: string, colorHex: string, emoji?: string) => {
    const newCat: CategoryFolder = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim() || '새 태그',
      colorHex,
      emoji: emoji || '🏷️',
    };
    setCategories(prev => [...prev, newCat]);
    if (settings.hapticEnabled) triggerHapticFeedback();
  };

  // 태그 수정 (색상 변경 시 해당 태그의 모든 일정/할일 색상도 실시간 일괄 동기화!)
  const updateCategory = (id: string, name: string, colorHex: string, emoji?: string) => {
    setCategories(prev =>
      prev.map(c =>
        c.id === id
          ? {
              ...c,
              name: name.trim(),
              colorHex,
              ...(emoji !== undefined ? { emoji } : {}),
            }
          : c
      )
    );
    setEvents(prev => prev.map(e => e.categoryFolderId === id ? { ...e, colorHex } : e));
    setTodos(prev => prev.map(t => t.categoryFolderId === id ? { ...t, colorHex } : t));
    if (settings.hapticEnabled) triggerHapticFeedback();
  };

  // 태그 삭제
  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    setActiveCategoryIds(prev => prev.filter(catId => catId !== id));
    if (settings.hapticEnabled) triggerHapticFeedback();
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // 필터링된 이벤트 & 반복 일정 전개 (Recurrence Expansion)
  const rangeStart = subMonths(currentMonth, 6);
  const rangeEnd = addMonths(currentMonth, 12);

  const baseEvents = events.filter(event => {
    if (activeCategoryIds.length === 0) return true;
    return activeCategoryIds.includes(event.categoryFolderId);
  });

  const filteredEvents = expandRecurringEvents(baseEvents, rangeStart, rangeEnd);

  const getEventsForDate = (date: Date): ScheduleEvent[] => {
    return filteredEvents.filter(event => {
      const eventStart = parseISO(event.startDateTime);
      return isSameDay(eventStart, date);
    });
  };

  // 이벤트 모달 제어
  const openEventModal = (event?: ScheduleEvent, presetStartIso?: string, defaultIsTask?: boolean) => {
    // 반복 인스턴스인 경우 원본 마스터 이벤트 조회
    const targetEvent = event?.isRecurringInstance && event.originalEventId
      ? events.find(e => e.id === event.originalEventId) || event
      : event;
    setEditingEvent(targetEvent || null);
    setPresetStartTime(presetStartIso || null);
    setDefaultIsTaskModal(defaultIsTask ?? false);
    setIsEventModalOpen(true);
  };

  const closeEventModal = () => {
    setIsEventModalOpen(false);
    setEditingEvent(null);
    setPresetStartTime(null);
    setDefaultIsTaskModal(false);
  };

  const saveEvent = (eventData: Omit<ScheduleEvent, 'id'> & { id?: string }) => {
    const targetId = eventData.id?.includes('_occ_')
      ? eventData.id.split('_occ_')[0]
      : eventData.id;

    if (targetId) {
      // 수정
      setEvents(prev => prev.map(e => (e.id === targetId ? ({ ...eventData, id: targetId } as ScheduleEvent) : e)));
    } else {
      // 신규
      const newEvent: ScheduleEvent = {
        ...eventData,
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      };
      setEvents(prev => [...prev, newEvent]);
    }
    closeEventModal();
  };

  const deleteEvent = (id: string) => {
    const targetId = id.includes('_occ_') ? id.split('_occ_')[0] : id;
    setEvents(prev => prev.filter(e => e.id !== targetId && e.id !== id));
    closeEventModal();
  };

  // 일정 내 할일 완료 체크 토글
  const toggleEventTaskCompleted = (eventId: string) => {
    const targetId = eventId.includes('_occ_') ? eventId.split('_occ_')[0] : eventId;
    setEvents(prev =>
      prev.map(e => {
        if (e.id !== targetId && e.id !== eventId) return e;
        const nextCompleted = !e.isCompleted;
        if (nextCompleted && settings.hapticEnabled) triggerHapticFeedback();
        return { ...e, isCompleted: nextCompleted };
      })
    );
  };

  // 일정 ⇄ 할일 양방향 변환
  const convertEventToTask = (eventId: string) => {
    setEvents(prev =>
      prev.map(e => (e.id === eventId ? { ...e, isTask: true, isCompleted: false } : e))
    );
  };

  const convertTaskToEvent = (eventId: string) => {
    setEvents(prev =>
      prev.map(e => (e.id === eventId ? { ...e, isTask: false } : e))
    );
  };

  // 습관 모달 제어
  const openHabitModal = (habit?: Habit) => {
    setEditingHabit(habit || null);
    setIsHabitModalOpen(true);
  };

  const closeHabitModal = () => {
    setIsHabitModalOpen(false);
    setEditingHabit(null);
  };

  const openHabitDetail = (habitId: string) => {
    setActiveHabitDetailId(habitId);
  };

  const closeHabitDetail = () => {
    setActiveHabitDetailId(null);
  };

  const saveHabit = (habitData: Omit<Habit, 'id' | 'createdAt' | 'logs'> & { id?: string }) => {
    if (habitData.id) {
      setHabits(prev =>
        prev.map(h =>
          h.id === habitData.id
            ? { ...h, ...habitData }
            : h
        )
      );
    } else {
      const newHabit: Habit = {
        ...habitData,
        id: `habit-${Date.now()}`,
        createdAt: format(new Date(), 'yyyy-MM-dd'),
        logs: {},
      };
      setHabits(prev => [...prev, newHabit]);
    }
    closeHabitModal();
  };

  const deleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    closeHabitModal();
    if (activeHabitDetailId === id) {
      setActiveHabitDetailId(null);
    }
  };

  // 원터치 습관 체크인
  const toggleHabitCheck = (habitId: string, dateStr?: string) => {
    const targetDateStr = dateStr || format(selectedDate, 'yyyy-MM-dd');

    setHabits(prev =>
      prev.map(habit => {
        if (habit.id !== habitId) return habit;

        const currentLog = habit.logs[targetDateStr] || { completed: false, count: 0 };
        const newCompleted = !currentLog.completed;
        const newCount = newCompleted ? 1 : 0;

        // 완료 시 햅틱, 사운드, Confetti
        if (newCompleted) {
          if (settings.hapticEnabled) triggerHapticFeedback();
          if (settings.soundEnabled) playCompletionSound();

          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.8 },
            colors: [habit.colorHex, '#22c55e', '#3b82f6', '#f59e0b'],
          });
        }

        return {
          ...habit,
          logs: {
            ...habit.logs,
            [targetDateStr]: { completed: newCompleted, count: newCount },
          },
        };
      })
    );
  };

  // 할일 관련 액션
  const toggleTodo = (todoId: string) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === todoId ? { ...todo, isCompleted: !todo.isCompleted } : todo
      )
    );
  };

  const addTodo = (title: string, categoryId?: string, dueDate?: string) => {
    const targetCategory = categoryId || categories[0]?.id || 'cat-personal';
    const catObj = categories.find(c => c.id === targetCategory);

    const newTodo: TodoItem = {
      id: `todo-${Date.now()}`,
      title,
      isCompleted: false,
      categoryFolderId: targetCategory,
      colorHex: catObj?.colorHex || '#3b82f6',
      dueDate: dueDate || format(selectedDate, 'yyyy-MM-dd'),
      priority: 'MEDIUM',
    };
    setTodos(prev => [newTodo, ...prev]);
  };

  const deleteTodo = (todoId: string) => {
    setTodos(prev => prev.filter(t => t.id !== todoId));
  };

  // 미배정 할일을 타임테이블의 특정 시간대로 배정 -> 일정으로 변환/연동
  const assignTodoToSchedule = (
    todoId: string,
    dateStr: string,
    startHour: number,
    durationHours: number = 1
  ) => {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;

    const startH = String(startHour).padStart(2, '0');
    const endH = String(Math.min(23, startHour + durationHours)).padStart(2, '0');

    const startDateTime = `${dateStr}T${startH}:00:00`;
    const endDateTime = `${dateStr}T${endH}:00:00`;

    // 1) 할일 상태에 배정된 시간 기록
    setTodos(prev =>
      prev.map(t =>
        t.id === todoId
          ? {
              ...t,
              assignedTimeBlock: { startDateTime, endDateTime },
              dueDate: dateStr,
            }
          : t
      )
    );

    // 2) 캘린더 일정으로 신규 등록하여 양방향 동기화
    const newEvent: ScheduleEvent = {
      id: `evt-todo-${todoId}`,
      title: `[할일] ${todo.title}`,
      isAllDay: false,
      startDateTime,
      endDateTime,
      categoryFolderId: todo.categoryFolderId,
      colorHex: todo.colorHex,
      memo: '미배정 할일 서랍에서 타임블록으로 배정됨',
    };

    setEvents(prev => [...prev.filter(e => e.id !== newEvent.id), newEvent]);
  };

  const toggleTaskDrawer = () => {
    setIsTaskDrawerOpen(prev => !prev);
  };

  return (
    <AppContext.Provider
      value={{
        events,
        habits,
        todos,
        categories,
        selectedDate,
        currentMonth,
        viewMode,
        activeCategoryIds,
        settings,
        isEventModalOpen,
        editingEvent,
        presetStartTime,
        defaultIsTaskModal,
        isHabitModalOpen,
        editingHabit,
        activeHabitDetailId,
        isTaskDrawerOpen,
        isTimelineOpen,
        setIsTimelineOpen,
        toggleTimeline,
        isTagModalOpen,
        setIsTagModalOpen,
        setSelectedDate,
        setCurrentMonth,
        setViewMode,
        toggleCategoryFilter,
        resetCategoryFilter,
        reorderCategories,
        addCategory,
        updateCategory,
        deleteCategory,
        updateSettings,
        openEventModal,
        closeEventModal,
        saveEvent,
        deleteEvent,
        toggleEventTaskCompleted,
        convertEventToTask,
        convertTaskToEvent,
        openHabitModal,
        closeHabitModal,
        openHabitDetail,
        closeHabitDetail,
        saveHabit,
        deleteHabit,
        toggleHabitCheck,
        toggleTodo,
        addTodo,
        deleteTodo,
        assignTodoToSchedule,
        toggleTaskDrawer,
        isCloudSyncModalOpen,
        setIsCloudSyncModalOpen,
        syncConfig,
        syncStatus,
        syncError,
        lastSyncedAt,
        handleManualPush,
        handleManualPull,
        handleUpdateSyncConfig,
        filteredEvents,
        getEventsForDate,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
