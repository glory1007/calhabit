import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { format, parseISO, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CheckSquare, Calendar, Plus, Trash2, Check, Clock, Tag } from 'lucide-react';

export const TodoFeedView: React.FC = () => {
  const {
    todos,
    toggleTodo,
    addTodo,
    deleteTodo,
    filteredEvents,
    openEventModal,
    categories,
    selectedDate,
    setSelectedDate,
  } = useApp();

  const [newTitle, setNewTitle] = useState('');
  const [selectedCatId, setSelectedCatId] = useState(categories[0]?.id || 'cat-personal');
  const [subTab, setSubTab] = useState<'timeline' | 'todos'>('timeline');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addTodo(newTitle.trim(), selectedCatId);
    setNewTitle('');
  };

  // 날짜별로 일정 그룹핑 (TimeTree 피드 스타일)
  const sortedEvents = [...filteredEvents].sort((a, b) =>
    a.startDateTime.localeCompare(b.startDateTime)
  );

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 space-y-4">
      {/* 상단 서브 탭: 타임라인 피드 vs 체크리스트 할일 */}
      <div className="flex items-center justify-between">
        <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl">
          <button
            onClick={() => setSubTab('timeline')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subTab === 'timeline'
                ? 'bg-white dark:bg-zinc-700 text-[#5B84B1] dark:text-[#8AA8CD] shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            타임라인 피드
          </button>
          <button
            onClick={() => setSubTab('todos')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subTab === 'todos'
                ? 'bg-white dark:bg-zinc-700 text-[#5B84B1] dark:text-[#8AA8CD] shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            체크리스트 할일 ({todos.filter(t => !t.isCompleted).length})
          </button>
        </div>

        {subTab === 'todos' && (
          <span className="text-xs text-gray-400">
            총 {todos.length}개 할일
          </span>
        )}
      </div>

      {subTab === 'timeline' ? (
        /* 타임라인 피드 뷰 (TimeTree 피드) */
        <div className="space-y-3">
          {sortedEvents.map(evt => {
            const start = parseISO(evt.startDateTime);
            const isTodayEvt = isSameDay(start, new Date());

            return (
              <div
                key={evt.id}
                onClick={() => openEventModal(evt)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-zinc-900 hover:border-[#5B84B1] shadow-2xs flex items-start gap-3 ${
                  isTodayEvt
                    ? 'border-[#5B84B1]/40 dark:border-[#5B84B1]/50'
                    : 'border-gray-200 dark:border-zinc-800'
                }`}
              >
                <div
                  className="w-1.5 self-stretch rounded-full shrink-0"
                  style={{ backgroundColor: evt.colorHex }}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-zinc-100 truncate">
                      {evt.title}
                    </h4>
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold text-white shrink-0"
                      style={{ backgroundColor: evt.colorHex }}
                    >
                      {evt.isAllDay ? '종일' : format(start, 'HH:mm')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                    <Calendar size={12} />
                    <span>{format(start, 'yyyy년 M월 d일 (EEE)', { locale: ko })}</span>
                    {!evt.isAllDay && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{format(start, 'a h:mm', { locale: ko })}</span>
                      </span>
                    )}
                  </div>

                  {evt.memo && (
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2 bg-gray-50 dark:bg-zinc-800/60 p-2 rounded-lg">
                      {evt.memo}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 체크리스트 할일 뷰 */
        <div className="space-y-3">
          {/* 입력 폼 */}
          <form
            onSubmit={handleAddSubmit}
            className="p-3.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xs flex flex-col gap-2"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="새로운 할일 또는 메모를 추가하세요..."
                className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#5B84B1]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#5B84B1] hover:bg-[#4B6B88] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs"
              >
                <Plus size={15} />
                <span>추가</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-gray-400 text-[11px] shrink-0">카테고리:</span>
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

          {/* 목록 */}
          <div className="space-y-2">
            {todos.map(todo => (
              <div
                key={todo.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  todo.isCompleted
                    ? 'bg-gray-50/70 dark:bg-zinc-900/40 border-gray-200 dark:border-zinc-800 opacity-60'
                    : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                      todo.isCompleted
                        ? 'bg-[#7A9A8B] border-[#7A9A8B] text-white'
                        : 'border-gray-300 hover:border-[#5B84B1]'
                    }`}
                  >
                    {todo.isCompleted && <Check size={12} strokeWidth={3} />}
                  </button>
                  <span
                    className={`text-sm truncate ${
                      todo.isCompleted
                        ? 'line-through text-gray-400'
                        : 'font-medium text-gray-800 dark:text-zinc-100'
                    }`}
                  >
                    {todo.title}
                  </span>
                </div>

                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="p-1.5 text-gray-400 hover:text-[#D9777F] transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
