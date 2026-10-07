import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { X, Plus, Calendar, Clock, Check, Trash2, ArrowRight, Inbox, MoveDown } from 'lucide-react';

export const TaskDrawer: React.FC = () => {
  const {
    todos,
    toggleTodo,
    addTodo,
    deleteTodo,
    assignTodoToSchedule,
    isTaskDrawerOpen,
    toggleTaskDrawer,
    selectedDate,
    categories,
    settings,
    filteredEvents,
    deleteEvent,
  } = useApp();

  const [newTitle, setNewTitle] = useState('');
  const [selectedCatId, setSelectedCatId] = useState(categories[0]?.id || 'cat-personal');
  const [assignHour, setAssignHour] = useState<number>(14); // 기본 오후 2시
  const [assignTargetTodoId, setAssignTargetTodoId] = useState<string | null>(null);
  const [isDragOverDrawer, setIsDragOverDrawer] = useState(false);

  if (!isTaskDrawerOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addTodo(newTitle.trim(), selectedCatId);
    setNewTitle('');
  };

  const handleAssignClick = (todoId: string) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    assignTodoToSchedule(todoId, dateStr, assignHour);
    setAssignTargetTodoId(null);
  };

  // [기능 2-3] 캘린더/타임라인의 일정을 서랍으로 드롭하여 미배정 항목으로 보관
  const handleDrawerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOverDrawer) setIsDragOverDrawer(true);
  };

  const handleDrawerDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOverDrawer(false);
  };

  const handleDrawerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverDrawer(false);
    const rawData = e.dataTransfer.getData('text/plain');
    if (!rawData) return;

    // 만약 캘린더나 타임라인의 일정이 드롭된 경우
    if (!rawData.startsWith('todo:')) {
      const targetEvt = filteredEvents.find(ev => ev.id === rawData);
      if (targetEvt) {
        deleteEvent(targetEvt.id);
        addTodo(targetEvt.title, targetEvt.categoryFolderId);
      }
    }
  };

  const displayedTodos = settings.hideCompletedTodos
    ? todos.filter(t => !t.isCompleted)
    : todos;

  return (
    // [기능 2-2] 외부 백드롭 영역 클릭 시 자동 닫기 (Click Outside)
    <div
      onClick={toggleTaskDrawer}
      className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={e => e.stopPropagation()}
        onDragOver={handleDrawerDragOver}
        onDragLeave={handleDrawerDragLeave}
        onDrop={handleDrawerDrop}
        className="w-full max-w-md bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col border-l border-gray-200 dark:border-zinc-800 animate-in slide-in-from-right duration-300 cursor-default"
      >
        {/* [기능 2-1] 타이틀 및 라벨 변경: 미배정 일정 & 할일 서랍 */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between bg-gray-50/70 dark:bg-zinc-800/80">
          <div>
            <h3 className="font-bold text-base text-gray-900 dark:text-zinc-100 flex items-center gap-2">
              <Inbox size={18} className="text-emerald-500" />
              <span>미배정 일정 & 할일 서랍</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800/40">
                {todos.filter(t => !t.isCompleted).length}개 미완료
              </span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              일정과 할일을 캘린더나 타임라인으로 끌어다 놓아 배정하세요
            </p>
          </div>
          <button
            onClick={toggleTaskDrawer}
            className="p-1.5 rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors"
            title="서랍 닫기"
          >
            <X size={20} />
          </button>
        </div>

        {/* 캘린더에서 서랍으로 드래그 시 드롭존 안내 */}
        {isDragOverDrawer && (
          <div className="mx-4 my-2 p-3.5 rounded-xl border-2 border-dashed border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-2 text-xs font-bold animate-pulse">
            <MoveDown size={16} />
            <span>이곳에 놓아 미배정 항목으로 보관</span>
          </div>
        )}

        {/* 신규 할일 입력 폼 */}
        <form onSubmit={handleAddSubmit} className="p-4 border-b border-gray-100 dark:border-zinc-800 flex flex-col gap-2.5">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="새로운 할일 입력..."
              className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-zinc-100"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-2xs"
            >
              <Plus size={16} />
              <span>추가</span>
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-gray-400 dark:text-zinc-400 text-[11px] shrink-0">카테고리:</span>
            {categories.map(c => (
              <button
                type="button"
                key={c.id}
                onClick={() => setSelectedCatId(c.id)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all shrink-0 ${
                  selectedCatId === c.id
                    ? 'text-white shadow-2xs'
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'
                }`}
                style={{
                  backgroundColor: selectedCatId === c.id ? c.colorHex : undefined,
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </form>

        {/* 할일 목록 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {displayedTodos.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-zinc-500 text-xs">
              <p>할일이 없습니다.</p>
              <p className="mt-1 text-[11px]">상단에서 새로운 할일을 등록해 보세요.</p>
            </div>
          ) : (
            displayedTodos.map(todo => {
              const isAssigning = assignTargetTodoId === todo.id;

              return (
                <div
                  key={todo.id}
                  draggable={!todo.isCompleted}
                  onDragStart={e => {
                    e.dataTransfer.setData('text/plain', `todo:${todo.id}`);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  className={`p-3 rounded-xl border transition-all ${
                    todo.isCompleted
                      ? 'bg-gray-50/70 dark:bg-zinc-900/50 border-gray-200 dark:border-zinc-800/80 opacity-60'
                      : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 shadow-sm cursor-grab active:cursor-grabbing hover:border-emerald-400'
                  }`}
                  title={!todo.isCompleted ? '캘린더나 타임라인으로 드래그하여 일정으로 배정' : undefined}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {/* 원형 체크박스 (다크 모드 선명도 개선) */}
                      <button
                        onClick={() => toggleTodo(todo.id)}
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                          todo.isCompleted
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-gray-300 dark:border-zinc-500 hover:border-emerald-500'
                        }`}
                      >
                        {todo.isCompleted && <Check size={12} strokeWidth={3} />}
                      </button>

                      <span
                        className={`text-sm truncate ${
                          todo.isCompleted
                            ? 'line-through text-gray-400 dark:text-zinc-500'
                            : 'font-medium text-gray-900 dark:text-slate-100'
                        }`}
                      >
                        {todo.title}
                      </span>
                    </div>

                    {/* 액션 버튼들 */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!todo.isCompleted && (
                        <button
                          onClick={() => setAssignTargetTodoId(isAssigning ? null : todo.id)}
                          className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors"
                          title="선택 날짜의 시간대로 배정"
                        >
                          <Clock size={12} />
                          <span>시간 배정</span>
                        </button>
                      )}

                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="p-1 text-gray-400 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded"
                        title="삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* 시간 배정 인라인 패널 */}
                  {isAssigning && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/60 p-2.5 rounded-lg">
                      <div className="text-xs text-gray-600 dark:text-zinc-300 font-semibold mb-2 flex items-center gap-1">
                        <Calendar size={13} className="text-emerald-500" />
                        <span>{format(selectedDate, 'M월 d일 (EEE)', { locale: ko })}에 배정:</span>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <select
                          value={assignHour}
                          onChange={e => setAssignHour(Number(e.target.value))}
                          className="text-xs px-2 py-1.5 rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>
                              {String(i).padStart(2, '0')}:00 시작
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => handleAssignClick(todo.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold flex items-center gap-1 shadow-2xs"
                        >
                          <span>배정 완료</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-400">
                        배정 시 주간 타임테이블 및 24시간 타임라인에 일정으로 등록됩니다.
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
