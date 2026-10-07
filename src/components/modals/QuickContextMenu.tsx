import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { ScheduleEvent } from '../../types';
import {
  Edit3,
  Calendar,
  Clock,
  Copy,
  BookmarkPlus,
  CheckSquare,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import { format, addDays, parseISO } from 'date-fns';

interface QuickContextMenuProps {
  event: ScheduleEvent | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
}

export const QuickContextMenu: React.FC<QuickContextMenuProps> = ({
  event,
  position,
  onClose,
}) => {
  const {
    openEventModal,
    deleteEvent,
    saveEvent,
    addTodo,
    categories,
  } = useApp();

  const menuRef = useRef<HTMLDivElement>(null);
  const [showCategorySubmenu, setShowCategorySubmenu] = React.useState(false);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('touchstart', handleOutsideClick);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [onClose]);

  if (!event || !position) return null;

  // 화면 경계 체크 및 Auto-Flip (위/아래 방향 자동 전환 및 뷰포트 클램핑)
  const menuWidth = 224;
  const estimatedMenuHeight = 330;
  const bottomSafePadding = 76; // 하단 도크(BottomNav) 및 안전 여백
  const topSafePadding = 16;
  const sideSafePadding = 12;

  let left = position.x;
  let top = position.y;
  let isFlippedLeft = false;

  if (typeof window !== 'undefined') {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // 1. 세로 방향 Auto-Flip (아래쪽 여백 부족 시 위쪽으로 뒤집혀 열림)
    const spaceBelow = windowHeight - position.y - bottomSafePadding;
    const spaceAbove = position.y - topSafePadding;

    if (spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow) {
      // 위로 뒤집기 (Flip-up): 클릭 지점 바로 위로 위치
      top = position.y - estimatedMenuHeight;
    } else {
      // 아래로 열기 (Default): 클릭 지점 바로 아래로 위치
      top = position.y + 6;
    }

    // 뷰포트 세로 경계 클램핑 (상/하 잘림 방지)
    const maxTop = windowHeight - estimatedMenuHeight - bottomSafePadding;
    top = Math.max(topSafePadding, Math.min(top, Math.max(topSafePadding, maxTop)));

    // 2. 가로 방향 경계 보정 (우측 잘림 방지)
    if (left + menuWidth > windowWidth - sideSafePadding) {
      left = Math.max(sideSafePadding, position.x - menuWidth);
      if (left + menuWidth > windowWidth - sideSafePadding) {
        left = Math.max(sideSafePadding, windowWidth - menuWidth - sideSafePadding);
      }
      isFlippedLeft = true;
    }
  }

  // 1. 세부 편집
  const handleEdit = () => {
    openEventModal(event);
    onClose();
  };

  // 2. 카테고리 즉시 변경
  const handleCategoryChange = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    saveEvent({
      ...event,
      categoryFolderId: catId,
      colorHex: cat?.colorHex || event.colorHex,
    });
    onClose();
  };

  // 3. 시간제 ↔ 종일 일정 토글
  const handleToggleAllDay = () => {
    saveEvent({
      ...event,
      isAllDay: !event.isAllDay,
    });
    onClose();
  };

  // 4. 다음 날로 복사
  const handleDuplicate = () => {
    const startDate = parseISO(event.startDateTime);
    const endDate = parseISO(event.endDateTime);
    const nextStart = addDays(startDate, 1);
    const nextEnd = addDays(endDate, 1);

    saveEvent({
      ...event,
      id: undefined, // 신규 생성
      title: `${event.title} (복사본)`,
      startDateTime: format(nextStart, "yyyy-MM-dd'T'HH:mm:ss"),
      endDateTime: format(nextEnd, "yyyy-MM-dd'T'HH:mm:ss"),
    });
    onClose();
  };

  // 5. 템플릿으로 저장
  const handleSaveAsTemplate = () => {
    // 로컬스토리지 템플릿 라이브러리에 저장
    const savedTemplates = JSON.parse(localStorage.getItem('calhabit_templates') || '[]');
    savedTemplates.push({
      id: `tpl-${Date.now()}`,
      title: event.title,
      colorHex: event.colorHex,
      categoryFolderId: event.categoryFolderId,
      defaultMemo: event.memo,
    });
    localStorage.setItem('calhabit_templates', JSON.stringify(savedTemplates));
    alert(`"${event.title}" 일정이 템플릿으로 저장되었습니다!`);
    onClose();
  };

  // 6. 일정 ⇄ 할일(Todo) 양방향 전환
  const handleToggleTaskStatus = () => {
    saveEvent({
      ...event,
      isTask: !event.isTask,
      isCompleted: event.isTask ? false : event.isCompleted,
    });
    onClose();
  };

  // 7. 삭제
  const handleDelete = () => {
    deleteEvent(event.id);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white/95 dark:bg-zinc-800/95 border border-gray-200 dark:border-zinc-700 rounded-2xl shadow-2xl py-1.5 w-[224px] text-xs font-semibold text-gray-700 dark:text-zinc-200 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md overflow-y-auto scrollbar-none"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        maxHeight: 'calc(100vh - 90px)',
      }}
    >
      {/* 상단 일정 이름 미리보기 */}
      <div className="px-3 py-2 border-b border-gray-100 dark:border-zinc-700 flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: event.colorHex }}
        />
        <span className="font-bold truncate text-gray-900 dark:text-zinc-100">
          {event.title}
        </span>
      </div>

      <div className="py-1">
        {/* 1. 편집 */}
        <button
          onClick={handleEdit}
          className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-zinc-700/60 transition-colors text-left"
        >
          <Edit3 size={15} className="text-gray-500 dark:text-zinc-400" />
          <span>편집 (Edit)</span>
        </button>

        {/* 2. 카테고리 변경 */}
        <div className="relative">
          <button
            onClick={() => setShowCategorySubmenu(!showCategorySubmenu)}
            className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-zinc-700/60 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-gray-500 dark:text-zinc-400" />
              <span>카테고리 변경</span>
            </div>
            <ChevronRight size={13} className="text-gray-400" />
          </button>

          {/* 카테고리 서브메뉴 (좌우 반전 대응) */}
          {showCategorySubmenu && (
            <div
              className={`absolute top-0 ${
                isFlippedLeft ? 'right-full mr-1.5' : 'left-full ml-1.5'
              } w-36 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-xl py-1 z-50`}
            >
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className="w-full px-2.5 py-1.5 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-zinc-700 text-left text-[11px]"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: cat.colorHex }}
                  />
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3. 시간 ↔ 종일 전환 */}
        <button
          onClick={handleToggleAllDay}
          className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-zinc-700/60 transition-colors text-left"
        >
          <Clock size={15} className="text-gray-500 dark:text-zinc-400" />
          <span>{event.isAllDay ? '시간 지정 일정으로 전환' : '종일 일정으로 전환'}</span>
        </button>

        {/* 4. 복사 */}
        <button
          onClick={handleDuplicate}
          className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-zinc-700/60 transition-colors text-left"
        >
          <Copy size={15} className="text-gray-500 dark:text-zinc-400" />
          <span>내일로 복사</span>
        </button>

        {/* 5. 템플릿으로 저장 */}
        <button
          onClick={handleSaveAsTemplate}
          className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-zinc-700/60 transition-colors text-left"
        >
          <BookmarkPlus size={15} className="text-gray-500 dark:text-zinc-400" />
          <span>템플릿으로 저장</span>
        </button>

        {/* 6. 일정 ⇄ 할일 양방향 전환 */}
        <button
          onClick={handleToggleTaskStatus}
          className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-zinc-700/60 transition-colors text-left"
        >
          <CheckSquare size={15} className="text-[#5B84B1]" />
          <span>{event.isTask ? '일정으로 변환' : '할일로 변환'}</span>
        </button>
      </div>

      {/* 7. 삭제 */}
      <div className="border-t border-gray-100 dark:border-zinc-700 pt-1 mt-1">
        <button
          onClick={handleDelete}
          className="w-full px-3 py-2 flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 transition-colors text-left"
        >
          <Trash2 size={15} />
          <span>삭제 (Delete)</span>
        </button>
      </div>
    </div>
  );
};
