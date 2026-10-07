import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { format, addMonths, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  Columns3,
  Flame,
  CheckSquare,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Plus,
  SlidersHorizontal,
  Sun,
  Moon,
  ListFilter,
} from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const {
    currentMonth,
    setCurrentMonth,
    selectedDate,
    setSelectedDate,
    viewMode,
    setViewMode,
    categories,
    activeCategoryIds,
    toggleCategoryFilter,
    resetCategoryFilter,
    openEventModal,
    openHabitModal,
    settings,
    updateSettings,
    toggleTaskDrawer,
  } = useApp();

  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleTodayClick = () => {
    const now = new Date();
    setCurrentMonth(now);
    setSelectedDate(now);
  };

  const handleQuickAdd = () => {
    if (viewMode === 'habit') {
      openHabitModal();
    } else {
      openEventModal();
    }
  };

  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      updateSettings({ theme: 'light' });
    } else {
      document.documentElement.classList.add('dark');
      updateSettings({ theme: 'dark' });
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 shadow-xs select-none">
      {/* 1행: 로고, 월 피커, 뷰 모드 탭, 액션 버튼 (Full-width 전폭 확장) */}
      <div className="w-full px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* 좌측: 로고 & 월 드롭다운 */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-8 rounded-xl bg-[#5B84B1] flex items-center justify-center text-white font-bold text-sm shadow-xs">
              A
            </div>
            <span className="font-bold text-base tracking-tight hidden sm:inline text-slate-800 dark:text-zinc-100">
              Across
            </span>
          </div>

          {/* 월 피커 컨트롤러 */}
          <div className="flex items-center bg-slate-100 dark:bg-zinc-800 rounded-lg p-0.5 ml-1">
            <button
              onClick={handlePrevMonth}
              aria-label="이전 달"
              className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-colors text-slate-600 dark:text-zinc-300"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
              className="px-2.5 py-1 text-sm font-semibold text-slate-800 dark:text-zinc-100 hover:text-slate-600 transition-colors flex items-center gap-1"
            >
              <span>{format(currentMonth, 'yyyy년 M월', { locale: ko })}</span>
            </button>
            <button
              onClick={handleNextMonth}
              aria-label="다음 달"
              className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-colors text-slate-600 dark:text-zinc-300"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* 오늘 바로가기 버튼 */}
          <button
            onClick={handleTodayClick}
            className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors shadow-2xs"
          >
            오늘
          </button>
        </div>

        {/* 중앙: 뷰 모드 네비게이션 (데스크톱 및 태블릿) */}
        <div className="hidden md:flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('month')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'month'
                ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-2xs'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <CalendarIcon size={14} />
            <span>월간 뷰</span>
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'week'
                ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-2xs'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <Columns3 size={14} />
            <span>주간 뷰</span>
          </button>
          <button
            onClick={() => setViewMode('habit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'habit'
                ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-2xs'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <Flame size={14} />
            <span>습관 루틴</span>
          </button>
          <button
            onClick={() => setViewMode('dday')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'dday'
                ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-2xs'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <CheckSquare size={14} />
            <span>디데이</span>
          </button>
        </div>

        {/* 우측: 도구 버튼들 */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={toggleTaskDrawer}
            title="할일 서랍"
            className="p-2 rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <CheckSquare size={18} />
          </button>

          <button
            onClick={toggleDarkMode}
            title="테마 변경"
            className="p-2 rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Sun size={18} className="hidden dark:block text-slate-300" />
            <Moon size={18} className="block dark:hidden text-slate-600" />
          </button>

          <button
            onClick={onOpenSettings}
            title="설정"
            className="p-2 rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <SlidersHorizontal size={18} />
          </button>

          {/* 추가 버튼 (소프트 다크 슬레이트) */}
          <button
            onClick={handleQuickAdd}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#4B6B88] hover:bg-[#3D566E] text-white rounded-lg text-xs font-semibold shadow-2xs transition-transform active:scale-95"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">일정 추가</span>
          </button>
        </div>
      </div>
    </header>
  );
};
