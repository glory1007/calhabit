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
      {/* 1행: 월 피커, 뷰 모드 탭, 액션 버튼 (Full-width 전폭 확장) */}
      <div className="w-full px-2.5 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* 좌측: 월 네비게이션 & 오늘 버튼 (무조건 가로 1열 단일 행 정렬, 줄바꿈 완전 차단) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0">
          {/* 월 피커 컨트롤러 */}
          <div className="flex items-center bg-slate-100/90 dark:bg-zinc-800/90 rounded-lg p-0.5 shrink-0 whitespace-nowrap">
            <button
              onClick={handlePrevMonth}
              aria-label="이전 달"
              className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-colors text-slate-600 dark:text-zinc-300 active:scale-95 shrink-0"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
              className="px-2 py-0.5 text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors flex items-center gap-1 tracking-tight shrink-0 whitespace-nowrap select-none"
            >
              <span>{format(currentMonth, 'yyyy년 M월', { locale: ko })}</span>
            </button>
            <button
              onClick={handleNextMonth}
              aria-label="다음 달"
              className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-colors text-slate-600 dark:text-zinc-300 active:scale-95 shrink-0"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* 오늘 바로가기 버튼 */}
          <button
            onClick={handleTodayClick}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-300/80 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors shadow-2xs shrink-0 whitespace-nowrap active:scale-95"
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

        {/* 우측: 도구 버튼들 (모바일 뷰포트에서도 여유롭게 수평 배치) */}
        <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0">
          <button
            onClick={toggleDarkMode}
            title="테마 변경"
            className="p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
          >
            <Sun size={17} className="hidden dark:block text-slate-300" />
            <Moon size={17} className="block dark:hidden text-slate-600" />
          </button>

          <button
            onClick={onOpenSettings}
            title="설정"
            className="p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
          >
            <SlidersHorizontal size={17} />
          </button>

          {/* 추가 버튼 (모바일: 콤팩트 정사각형 아이콘, 데스크톱: + 일정 추가) */}
          <button
            onClick={handleQuickAdd}
            className="flex items-center justify-center gap-1 p-1.5 sm:px-3 sm:py-1.5 bg-[#4B6B88] hover:bg-[#3D566E] text-white rounded-lg text-xs font-semibold shadow-2xs transition-transform active:scale-95 shrink-0 ml-0.5"
            title="일정 추가"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">일정 추가</span>
          </button>
        </div>
      </div>
    </header>
  );
};
