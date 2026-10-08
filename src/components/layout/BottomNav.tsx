import React from 'react';
import { useApp } from '../../context/AppContext';
import { ViewMode } from '../../types';
import {
  Calendar,
  Columns3,
  Flame,
  LayoutGrid,
  Palette,
  Hourglass,
  Plus,
  Sun,
  Moon,
  SlidersHorizontal,
  Cloud,
} from 'lucide-react';

interface BottomNavProps {
  onOpenThemeModal: () => void;
  onOpenSettings?: () => void;
  onQuickAdd?: () => void;
  toggleDarkMode?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  onOpenThemeModal,
  onOpenSettings,
  onQuickAdd,
  toggleDarkMode,
}) => {
  const { viewMode, setViewMode, setIsCloudSyncModalOpen, syncConfig } = useApp();

  // Across 시그니처 뷰 스위처 항목들
  const navItems: { mode: ViewMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'month', label: '월간', icon: <Calendar size={18} /> },
    { mode: 'week', label: '주간', icon: <Columns3 size={18} /> },
    { mode: 'habit', label: '습관', icon: <Flame size={18} /> },
    { mode: 'dday', label: '디데이', icon: <Hourglass size={18} /> },
    { mode: 'widget', label: '위젯', icon: <LayoutGrid size={18} /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-zinc-800 px-2 sm:px-6 pt-1 pb-[calc(env(safe-area-inset-bottom,0px)+0.25rem)] flex items-center justify-between select-none shadow-lg">
      <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
        {/* 모바일 화면 전용: 좌측 하단 주요 액션 버튼 (일정 추가, 테마 토글, 클라우드 동기화, 설정) */}
        <div className="flex sm:hidden items-center gap-0.5 shrink-0 pr-1 mr-1 border-r border-gray-200 dark:border-zinc-800">
          {onQuickAdd && (
            <button
              onClick={onQuickAdd}
              className="w-8 h-8 rounded-xl bg-[#2196F3] active:bg-[#1E88E5] text-white flex items-center justify-center shadow-xs transition-transform active:scale-95 shrink-0"
              title="일정 추가"
            >
              <Plus size={18} strokeWidth={2.5} />
            </button>
          )}

          {toggleDarkMode && (
            <button
              onClick={toggleDarkMode}
              className="w-8 h-8 rounded-xl text-slate-600 dark:text-zinc-300 active:bg-slate-100 dark:active:bg-zinc-800 flex items-center justify-center transition-colors shrink-0"
              title="테마 변경"
            >
              <Sun size={16} className="hidden dark:block text-slate-300" />
              <Moon size={16} className="block dark:hidden text-slate-600" />
            </button>
          )}

          <button
            onClick={() => setIsCloudSyncModalOpen(true)}
            className="w-8 h-8 rounded-xl text-slate-600 dark:text-zinc-300 active:bg-slate-100 dark:active:bg-zinc-800 flex items-center justify-center transition-colors shrink-0 relative"
            title="실시간 클라우드 동기화"
          >
            <Cloud size={16} className={syncConfig?.enabled ? 'text-blue-500' : ''} />
            {syncConfig?.enabled && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-zinc-900" />
            )}
          </button>

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="w-8 h-8 rounded-xl text-slate-600 dark:text-zinc-300 active:bg-slate-100 dark:active:bg-zinc-800 flex items-center justify-center transition-colors shrink-0"
              title="설정"
            >
              <SlidersHorizontal size={16} />
            </button>
          )}
        </div>

        {/* 뷰 스위처 아이콘 목록 */}
        <div className="flex items-center gap-0.5 sm:gap-2 overflow-x-auto scrollbar-none py-0.5 flex-1">
          {navItems.map(item => {
            const isActive = viewMode === item.mode;

            return (
              <button
                key={item.mode}
                onClick={() => setViewMode(item.mode)}
                className={`flex flex-col items-center justify-center px-2 sm:px-3 py-1 rounded-xl transition-all shrink-0 ${
                  isActive
                    ? 'text-[#5B84B1] dark:text-[#8AA8CD] font-bold bg-[#5B84B1]/10 dark:bg-[#5B84B1]/20 scale-105 shadow-2xs'
                    : 'text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'
                }`}
                title={item.label}
              >
                {item.icon}
                <span className="text-[10px] sm:text-[11px] mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 우측: 테마 & 팔레트 모달 퀵 열기 버튼 */}
      <div className="flex items-center gap-2 pr-1 sm:pr-4 shrink-0">
        <button
          onClick={onOpenThemeModal}
          className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 text-gray-700 dark:text-zinc-200 text-xs font-bold transition-colors"
          title="테마 및 일괄 팔레트 변경"
        >
          <Palette size={15} className="text-pink-500" />
          <span className="hidden sm:inline">테마 / 팔레트</span>
        </button>
      </div>
    </nav>
  );
};
