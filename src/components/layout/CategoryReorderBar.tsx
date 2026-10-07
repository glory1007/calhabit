import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { triggerHapticFeedback } from '../../utils/habitStats';
import { Check, GripVertical, ChevronDown, ChevronUp, Plus } from 'lucide-react';

interface CategoryReorderBarProps {
  collapsible?: boolean;
}

export const CategoryReorderBar: React.FC<CategoryReorderBarProps> = ({ collapsible = true }) => {
  const {
    categories,
    activeCategoryIds,
    toggleCategoryFilter,
    reorderCategories,
    setIsTagModalOpen,
    settings,
  } = useApp();

  const [isExpanded, setIsExpanded] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isLongPressing, setIsLongPressing] = useState<number | null>(null);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDraggingRef = useRef(false);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 마우스 HTML5 드래그 앤 드롭 핸들러
  const handleDragStart = (e: React.DragEvent, index: number) => {
    isDraggingRef.current = true;
    setDraggedIndex(index);
    if (settings.hapticEnabled) triggerHapticFeedback();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      reorderCategories(draggedIndex, targetIndex);
      if (settings.hapticEnabled) triggerHapticFeedback();
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);
  };

  // 모바일 터치 롱프레스 & 드래그 인터랙션
  const handleTouchStart = (index: number, e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    isDraggingRef.current = false;

    longPressTimerRef.current = setTimeout(() => {
      setIsLongPressing(index);
      setDraggedIndex(index);
      isDraggingRef.current = true;
      if (settings.hapticEnabled) triggerHapticFeedback();
    }, 280);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];

    // 롱프레스 전인데 손가락이 많이 움직였다면 롱프레스 취소 (단순 스크롤로 처리)
    if (!isDraggingRef.current && touchStartPosRef.current) {
      const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
      const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);
      if (dx > 8 || dy > 8) {
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        return;
      }
    }

    if (!isDraggingRef.current || draggedIndex === null) return;

    // 현재 터치 위치 아래의 칩 요소 탐색
    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
    const chipEl = targetEl?.closest('[data-category-index]');
    if (chipEl) {
      const hoverIdx = Number(chipEl.getAttribute('data-category-index'));
      if (!isNaN(hoverIdx) && hoverIdx !== draggedIndex) {
        setDragOverIndex(hoverIdx);
      }
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

    if (isDraggingRef.current && draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      reorderCategories(draggedIndex, dragOverIndex);
      if (settings.hapticEnabled) triggerHapticFeedback();
    }

    setIsLongPressing(null);
    setDraggedIndex(null);
    setDragOverIndex(null);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 100);
  };

  // 탭 클릭 핸들러 (드래그 동작이 아닐 때만 필터 토글)
  const handleChipClick = (categoryId: string) => {
    if (isDraggingRef.current) return;
    toggleCategoryFilter(categoryId);
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-3 sm:px-6 py-2 shadow-2xs select-none">
      <div className="flex items-center justify-between gap-3">
        {/* 가로 스크롤 & 드래그 앤 드롭 카테고리 칩 컨테이너 */}
        <div
          ref={containerRef}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-1 py-1"
        >
          {categories.map((cat, idx) => {
            const isChecked = activeCategoryIds.length === 0 || activeCategoryIds.includes(cat.id);
            const isBeingDragged = draggedIndex === idx;
            const isOverTarget = dragOverIndex === idx;
            const isElevated = isBeingDragged || isLongPressing === idx;

            return (
              <div
                key={cat.id}
                data-category-index={idx}
                draggable
                onDragStart={e => handleDragStart(e, idx)}
                onDragOver={e => handleDragOver(e, idx)}
                onDrop={e => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                onTouchStart={e => handleTouchStart(idx, e)}
                onClick={() => handleChipClick(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-grab active:cursor-grabbing border ${
                  isElevated
                    ? 'scale-105 shadow-xl -translate-y-1 opacity-95 ring-2 ring-emerald-500 z-30'
                    : isOverTarget
                    ? 'border-dashed border-2 border-emerald-500 bg-emerald-50/50 scale-95 opacity-80'
                    : 'shadow-2xs hover:scale-[1.02]'
                } ${
                  isChecked
                    ? 'text-white border-transparent'
                    : 'bg-gray-100 dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-500 opacity-60'
                }`}
                style={{
                  backgroundColor: isChecked ? cat.colorHex : undefined,
                  transform: isElevated ? 'scale(1.06) translateY(-2px)' : undefined,
                }}
                title="길게 누르거나 드래그하여 순서 변경, 클릭하여 필터 토글"
              >
                {/* 롱프레스 & 드래그 핸들 그립 아이콘 */}
                <GripVertical
                  size={12}
                  className={`cursor-grab opacity-60 hover:opacity-100 ${isChecked ? 'text-white' : 'text-gray-400'}`}
                />

                {/* 체크박스 박스 */}
                <div
                  className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 ${
                    isChecked ? 'bg-white/25' : 'bg-gray-300 dark:bg-zinc-700'
                  }`}
                >
                  {isChecked && <Check size={11} strokeWidth={3} className="text-white" />}
                </div>

                <span className="truncate max-w-[120px]">{cat.name}</span>
              </div>
            );
          })}

          {/* 태그 추가 & 커스텀 관리 버튼 */}
          <button
            type="button"
            onClick={() => setIsTagModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 transition-colors shrink-0 border border-slate-200 dark:border-zinc-700 shadow-2xs"
            title="태그 추가 및 색상 관리"
          >
            <Plus size={13} />
            <span>태그 관리</span>
          </button>
        </div>

        {/* 접기/펼치기 버튼 (선택적) */}
        {collapsible && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 rounded-lg shrink-0 hidden sm:block"
            title="필터 안내"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>
    </div>
  );
};
