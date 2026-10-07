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
} from 'lucide-react';

interface BottomNavProps {
  onOpenThemeModal: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenThemeModal }) => {
  const { viewMode, setViewMode } = useApp();

  // Across 시그니처 뷰 스위처 항목들 (할일 탭은 캘린더 내부 통합으로 독립 탭 제거)
  const navItems: { mode: ViewMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'month', label: '월간', icon: <Calendar size={19} /> },
    { mode: 'week', label: '주간', icon: <Columns3 size={19} /> },
    { mode: 'habit', label: '습관', icon: <Flame size={19} /> },
    { mode: 'dday', label: '디데이', icon: <Hourglass size={19} /> },
    { mode: 'widget', label: '위젯', icon: <LayoutGrid size={19} /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-zinc-800 px-2 sm:px-6 py-1 flex items-center justify-between select-none shadow-lg">
      {/* 좌측: 뷰 스위처 아이콘 목록 */}
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none py-0.5">
        {navItems.map(item => {
          const isActive = viewMode === item.mode;

          return (
            <button
              key={item.mode}
              onClick={() => setViewMode(item.mode)}
              className={`flex flex-col items-center justify-center px-2.5 sm:px-3 py-1 rounded-xl transition-all ${
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

      {/* 우측: 테마 & 팔레트 모달 퀵 열기 버튼 */}
      <div className="flex items-center gap-2 pr-2 sm:pr-4 shrink-0">
        <button
          onClick={onOpenThemeModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 text-gray-700 dark:text-zinc-200 text-xs font-bold transition-colors"
          title="테마 및 일괄 팔레트 변경"
        >
          <Palette size={15} className="text-pink-500" />
          <span className="hidden sm:inline">테마 / 팔레트</span>
        </button>
      </div>
    </nav>
  );
};
