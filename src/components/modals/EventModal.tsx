import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ScheduleEvent, RepeatFrequency, TaskPriority, SubTaskItem, CustomRepeatRule } from '../../types';
import { COLOR_PALETTE } from '../../utils/colorPalette';
import { format, parseISO, addHours, addDays } from 'date-fns';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  AlignLeft,
  Sparkles,
  Trash2,
  Check,
  CheckSquare,
  Plus,
  ArrowUp,
  ArrowDown,
  Repeat,
  AlertCircle,
  Flag,
} from 'lucide-react';

const HOURS_24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES_60 = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const PRESET_MINUTES = ['00', '15', '30', '45'];

const DAYS_OF_WEEK = [
  { label: '일', value: 0 },
  { label: '월', value: 1 },
  { label: '화', value: 2 },
  { label: '수', value: 3 },
  { label: '목', value: 4 },
  { label: '금', value: 5 },
  { label: '토', value: 6 },
];

export const EventModal: React.FC = () => {
  const {
    isEventModalOpen,
    closeEventModal,
    editingEvent,
    presetStartTime,
    defaultIsTaskModal,
    saveEvent,
    deleteEvent,
    categories,
    selectedDate,
  } = useApp();

  const [title, setTitle] = useState('');
  const [isTask, setIsTask] = useState(false);
  const [isAllDay, setIsAllDay] = useState(false);
  const [startDateStr, setStartDateStr] = useState('');
  const [startTimeStr, setStartTimeStr] = useState('09:00');
  const [endDateStr, setEndDateStr] = useState('');
  const [endTimeStr, setEndTimeStr] = useState('10:00');
  const [categoryFolderId, setCategoryFolderId] = useState('');
  const [colorHex, setColorHex] = useState('#5B84B1');
  const [location, setLocation] = useState('');
  const [memo, setMemo] = useState('');

  // 할일 전용 상태
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [checklist, setChecklist] = useState<SubTaskItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');

  // 반복 주기 상태
  const [repeatFrequency, setRepeatFrequency] = useState<string>('NONE');
  const [customInterval, setCustomInterval] = useState(1);
  const [customUnit, setCustomUnit] = useState<'DAY' | 'WEEK' | 'MONTH' | 'YEAR'>('WEEK');
  const [customDaysOfWeek, setCustomDaysOfWeek] = useState<number[]>([1]);
  const [customMonthlyType, setCustomMonthlyType] = useState<'BY_DATE' | 'BY_DAY_OF_WEEK'>('BY_DATE');
  const [customEndType, setCustomEndType] = useState<'NEVER' | 'UNTIL_DATE' | 'COUNT'>('NEVER');
  const [customEndDate, setCustomEndDate] = useState('');
  const [customCount, setCustomCount] = useState(10);

  // 모달 오픈 시 초기값 설정
  useEffect(() => {
    if (!isEventModalOpen) return;

    if (editingEvent) {
      setTitle(editingEvent.title);
      setIsTask(editingEvent.isTask || false);
      setIsAllDay(editingEvent.isAllDay);
      const start = parseISO(editingEvent.startDateTime);
      const end = parseISO(editingEvent.endDateTime);
      setStartDateStr(format(start, 'yyyy-MM-dd'));
      setStartTimeStr(format(start, 'HH:mm'));
      setEndDateStr(format(end, 'yyyy-MM-dd'));
      setEndTimeStr(format(end, 'HH:mm'));
      setCategoryFolderId(editingEvent.categoryFolderId);
      setColorHex(editingEvent.colorHex);
      setLocation(editingEvent.location || '');
      setMemo(editingEvent.memo || '');
      setPriority(editingEvent.priority || 'medium');
      setChecklist(editingEvent.checklist || []);

      const rule = editingEvent.repeatRule;
      if (rule) {
        setRepeatFrequency(rule.frequency);
        if (rule.interval) setCustomInterval(rule.interval);
        if (rule.unit) setCustomUnit(rule.unit);
        if (rule.daysOfWeek) setCustomDaysOfWeek(rule.daysOfWeek);
        if (rule.monthlyType) setCustomMonthlyType(rule.monthlyType);
        if (rule.endType) setCustomEndType(rule.endType);
        if (rule.endDate) setCustomEndDate(rule.endDate);
        if (rule.count) setCustomCount(rule.count);
      } else {
        setRepeatFrequency('NONE');
      }
    } else {
      // 신규 생성
      const defaultDate = presetStartTime
        ? parseISO(presetStartTime)
        : selectedDate;
      const defaultDateStr = format(defaultDate, 'yyyy-MM-dd');
      const defaultStartH = presetStartTime ? format(defaultDate, 'HH:mm') : '09:00';
      const defaultEnd = addHours(parseISO(`${defaultDateStr}T${defaultStartH}:00`), 1);

      setTitle('');
      setIsTask(defaultIsTaskModal);
      setIsAllDay(false);
      setStartDateStr(defaultDateStr);
      setStartTimeStr(defaultStartH);
      setEndDateStr(defaultDateStr);
      setEndTimeStr(format(defaultEnd, 'HH:mm'));
      setCategoryFolderId(categories[0]?.id || 'cat-personal');
      setColorHex(categories[0]?.colorHex || '#5B84B1');
      setLocation('');
      setMemo('');
      setPriority('medium');
      setChecklist([]);
      setNewChecklistText('');
      setRepeatFrequency('NONE');
      setCustomInterval(1);
      setCustomUnit('WEEK');
      setCustomDaysOfWeek([defaultDate.getDay()]);
      setCustomMonthlyType('BY_DATE');
      setCustomEndType('NEVER');
      setCustomEndDate(format(addDays(defaultDate, 30), 'yyyy-MM-dd'));
      setCustomCount(10);
    }
  }, [isEventModalOpen, editingEvent, presetStartTime, defaultIsTaskModal, selectedDate, categories]);

  if (!isEventModalOpen) return null;

  // 24시간 피커 시간/분 분할
  const [startH, startM] = (startTimeStr || '09:00').split(':');
  const [endH, endM] = (endTimeStr || '10:00').split(':');

  const handleStartHourChange = (newH: string) => {
    const currentM = startM || '00';
    setStartTimeStr(`${newH}:${currentM}`);
    const nextHNum = (parseInt(newH, 10) + 1) % 24;
    const nextHStr = String(nextHNum).padStart(2, '0');
    setEndTimeStr(`${nextHStr}:${currentM}`);
    if (parseInt(newH, 10) === 23) {
      const nextDay = addDays(parseISO(startDateStr), 1);
      setEndDateStr(format(nextDay, 'yyyy-MM-dd'));
    }
  };

  const handleStartMinuteChange = (newM: string) => {
    const currentH = startH || '09';
    setStartTimeStr(`${currentH}:${newM}`);
    setEndTimeStr(`${endH || '10'}:${newM}`);
  };

  // 체크리스트 핸들러
  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setChecklist(prev => [
      ...prev,
      {
        id: `chk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: newChecklistText.trim(),
        isCompleted: false,
      },
    ]);
    setNewChecklistText('');
  };

  const handleToggleChecklistItem = (id: string) => {
    setChecklist(prev =>
      prev.map(item => (item.id === id ? { ...item, isCompleted: !item.isCompleted } : item))
    );
  };

  const handleDeleteChecklistItem = (id: string) => {
    setChecklist(prev => prev.filter(item => item.id !== id));
  };

  const handleMoveChecklistItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= checklist.length) return;
    const updated = [...checklist];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setChecklist(updated);
  };

  const toggleDayOfWeek = (dayVal: number) => {
    setCustomDaysOfWeek(prev =>
      prev.includes(dayVal) ? prev.filter(d => d !== dayVal) : [...prev, dayVal]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const startDateTime = isAllDay
      ? `${startDateStr}T00:00:00`
      : `${startDateStr}T${startTimeStr}:00`;

    const endDateTime = isAllDay
      ? `${endDateStr}T23:59:59`
      : `${endDateStr}T${endTimeStr}:00`;

    // 반복 규칙 빌드
    let repeatRule: CustomRepeatRule | undefined = undefined;
    if (repeatFrequency === 'CUSTOM') {
      repeatRule = {
        frequency: 'CUSTOM',
        interval: customInterval,
        unit: customUnit,
        daysOfWeek: customUnit === 'WEEK' ? customDaysOfWeek : undefined,
        monthlyType: customUnit === 'MONTH' ? customMonthlyType : undefined,
        endType: customEndType,
        endDate: customEndType === 'UNTIL_DATE' ? customEndDate : undefined,
        count: customEndType === 'COUNT' ? customCount : undefined,
      };
    } else if (repeatFrequency !== 'NONE') {
      repeatRule = {
        frequency: repeatFrequency as any,
        interval: 1,
        unit: repeatFrequency === 'DAILY' ? 'DAY' : repeatFrequency === 'WEEKLY' ? 'WEEK' : repeatFrequency === 'MONTHLY_SOLAR' ? 'MONTH' : 'YEAR',
        endType: 'NEVER',
      };
    }

    const newEventData: Omit<ScheduleEvent, 'id'> & { id?: string } = {
      id: editingEvent?.id,
      title: title.trim(),
      isTask,
      isCompleted: editingEvent?.isCompleted || false,
      priority: isTask ? priority : undefined,
      checklist: isTask && checklist.length > 0 ? checklist : undefined,
      isAllDay,
      startDateTime,
      endDateTime,
      categoryFolderId,
      colorHex,
      location: location.trim() || undefined,
      memo: memo.trim() || undefined,
      repeatRule,
    };

    saveEvent(newEventData);
  };

  const applyTemplate = (tplTitle: string, tplColor: string, isAllDayTpl: boolean) => {
    setTitle(tplTitle);
    setColorHex(tplColor);
    setIsAllDay(isAllDayTpl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* [요구사항 3] 최상단 액션 고정 헤더 (Sticky Top Action Header) */}
        <div className="px-4 sm:px-5 py-3 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900 shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-2 min-w-0">
            {/* 수정 모드일 때 좌측 상단 원스톱 삭제 버튼 */}
            {editingEvent && (
              <button
                type="button"
                onClick={() => deleteEvent(editingEvent.id)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors mr-1"
                title="일정 삭제"
              >
                <Trash2 size={15} />
                <span className="hidden sm:inline">삭제</span>
              </button>
            )}

            <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100 truncate">
              {editingEvent ? (isTask ? '할일 수정' : '일정 수정') : (isTask ? '새 할일 추가' : '새 일정 만들기')}
            </h3>
          </div>

          {/* 우측 상단: 취소 + 원터치 저장/만들기 버튼 (스크롤과 무관하게 상단 항상 고정) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={closeEventModal}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5"
              style={{ backgroundColor: colorHex }}
            >
              <Check size={14} strokeWidth={2.8} />
              <span>{editingEvent ? '저장하기' : isTask ? '할일 만들기' : '일정 만들기'}</span>
            </button>
          </div>
        </div>

        {/* 바디 폼 컨텐츠 (스크롤 영역) */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 scrollbar-thin">
          {/* 1. 일정 vs 할일 모드 토글 */}
          <div className="flex p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl">
            <button
              type="button"
              onClick={() => setIsTask(false)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                !isTask
                  ? 'bg-white dark:bg-zinc-700 text-[#5B84B1] dark:text-[#8AA8CD] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400'
              }`}
            >
              <Calendar size={13} />
              <span>일정 (Event)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsTask(true)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                isTask
                  ? 'bg-white dark:bg-zinc-700 text-[#5B84B1] dark:text-[#8AA8CD] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400'
              }`}
            >
              <CheckSquare size={13} />
              <span>할일 (To-Do)</span>
            </button>
          </div>

          {/* 템플릿 퀵 버튼 */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-gray-400 text-[11px] shrink-0 flex items-center gap-1">
              <Sparkles size={12} className="text-[#DDB165]" />
              템플릿:
            </span>
            <button
              type="button"
              onClick={() => applyTemplate('팀 주간 회의', '#5B84B1', false)}
              className="px-2.5 py-1 rounded-lg bg-[#5B84B1]/10 text-[#5B84B1] dark:text-[#8AA8CD] hover:bg-[#5B84B1]/20 text-[11px] font-medium shrink-0 transition-colors"
            >
              팀 회의
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('음력 제사 / 생신', '#D9777F', true)}
              className="px-2.5 py-1 rounded-lg bg-[#D9777F]/10 text-[#D9777F] hover:bg-[#D9777F]/20 text-[11px] font-medium shrink-0 transition-colors"
            >
              음력 기념일
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('운동 / 피트니스', '#7A9A8B', false)}
              className="px-2.5 py-1 rounded-lg bg-[#7A9A8B]/10 text-[#7A9A8B] hover:bg-[#7A9A8B]/20 text-[11px] font-medium shrink-0 transition-colors"
            >
              운동 / 루틴
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('개인 용무', '#DDB165', false)}
              className="px-2.5 py-1 rounded-lg bg-[#DDB165]/10 text-[#DDB165] hover:bg-[#DDB165]/20 text-[11px] font-medium shrink-0 transition-colors"
            >
              개인 용무
            </button>
          </div>

          {/* 제목 입력창 */}
          <div>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={isTask ? '할일 이름을 입력하세요 (예: 프로젝트 기획서 초안 작성)' : '일정 제목을 입력하세요'}
              className="w-full px-3.5 py-2.5 text-base font-semibold rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#5B84B1] placeholder-gray-400"
            />
          </div>

          {/* 할일 전용 섹션: 우선순위 & 세부 체크리스트 서브태스크 */}
          {isTask && (
            <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-200/80 dark:border-zinc-700 space-y-3">
              {/* 우선순위 태그 선택기 */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-zinc-400 mb-1.5 flex items-center gap-1">
                  <Flag size={12} />
                  <span>우선순위 (Priority)</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(
                    [
                      { key: 'low', label: '낮음', color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800' },
                      { key: 'medium', label: '보통', color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800' },
                      { key: 'high', label: '높음', color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800' },
                      { key: 'urgent', label: '긴급', color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-800' },
                    ] as const
                  ).map(item => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setPriority(item.key)}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        priority === item.key
                          ? `${item.color} ring-2 ring-[#5B84B1] shadow-2xs`
                          : 'bg-white dark:bg-zinc-800 text-gray-500 border-gray-200 dark:border-zinc-700 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 하위 체크리스트 목록 & 순서 변경 */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-zinc-400 mb-1.5 flex items-center justify-between">
                  <span>세부 체크리스트 ({checklist.length})</span>
                  <span className="text-[10px] text-gray-400">순서 조정 및 완료 체크</span>
                </label>

                {checklist.length > 0 && (
                  <div className="space-y-1.5 mb-2 max-h-40 overflow-y-auto scrollbar-thin">
                    {checklist.map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 p-1.5 bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-2xs text-xs"
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleChecklistItem(item.id)}
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                            item.isCompleted
                              ? 'bg-emerald-500 text-white border-emerald-500'
                              : 'border-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          {item.isCompleted && <Check size={11} strokeWidth={3} />}
                        </button>
                        <span className={`flex-1 truncate ${item.isCompleted ? 'line-through text-gray-400' : 'text-gray-900 dark:text-zinc-100'}`}>
                          {item.title}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleMoveChecklistItem(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                            title="위로 이동"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveChecklistItem(idx, 'down')}
                            disabled={idx === checklist.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                            title="아래로 이동"
                          >
                            <ArrowDown size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteChecklistItem(item.id)}
                            className="p-1 text-red-400 hover:text-red-600"
                            title="삭제"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 세부 항목 추가 인풋 */}
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newChecklistText}
                    onChange={e => setNewChecklistText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddChecklistItem();
                      }
                    }}
                    placeholder="+ 세부 항목 추가 (Enter 입력)"
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#5B84B1]"
                  />
                  <button
                    type="button"
                    onClick={handleAddChecklistItem}
                    className="px-3 py-1.5 bg-[#5B84B1] hover:bg-[#4d729a] text-white text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors"
                  >
                    <Plus size={13} />
                    <span>추가</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 종일 토글 */}
          <div className="flex items-center justify-between py-1 border-y border-gray-100 dark:border-zinc-800/80">
            <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
              {isTask ? '기한만 지정 (종일)' : '하루 종일 (All-day)'}
            </span>
            <button
              type="button"
              onClick={() => setIsAllDay(!isAllDay)}
              className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                isAllDay ? 'bg-[#5B84B1] justify-end' : 'bg-gray-300 dark:bg-zinc-700 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
            </button>
          </div>

          {/* 3. 시작 일시 (00시~23시 & 00분~59분 풀레인지 1분 단위 피커) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 dark:text-zinc-400 mb-1">
                {isTask ? '시작 / 등록 날짜' : '시작 날짜'}
              </label>
              <input
                type="date"
                value={startDateStr}
                onChange={e => setStartDateStr(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>
            {!isAllDay && (
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-zinc-400 mb-1">
                  시작 시간 (24시간 · 0~59분)
                </label>
                <div className="grid grid-cols-2 gap-1">
                  <select
                    value={startH || '09'}
                    onChange={e => handleStartHourChange(e.target.value)}
                    className="w-full px-2 py-2 text-xs font-semibold rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#5B84B1]"
                  >
                    {HOURS_24.map(h => (
                      <option key={h} value={h}>{h}시</option>
                    ))}
                  </select>
                  <select
                    value={startM || '00'}
                    onChange={e => handleStartMinuteChange(e.target.value)}
                    className="w-full px-2 py-2 text-xs font-semibold rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#5B84B1]"
                  >
                    {MINUTES_60.map(m => (
                      <option key={m} value={m}>{m}분</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 종료 일시 (00시~23시 & 00분~59분 풀레인지 피커) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 dark:text-zinc-400 mb-1">
                {isTask ? '마감 기한 날짜' : '종료 날짜'}
              </label>
              <input
                type="date"
                value={endDateStr}
                onChange={e => setEndDateStr(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>
            {!isAllDay && (
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-zinc-400 mb-1">
                  {isTask ? '마감 시간' : '종료 시간 (24시간 · 0~59분)'}
                </label>
                <div className="grid grid-cols-2 gap-1">
                  <select
                    value={endH || '10'}
                    onChange={e => setEndTimeStr(`${e.target.value}:${endM || '00'}`)}
                    className="w-full px-2 py-2 text-xs font-semibold rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#5B84B1]"
                  >
                    {HOURS_24.map(h => (
                      <option key={h} value={h}>{h}시</option>
                    ))}
                  </select>
                  <select
                    value={endM || '00'}
                    onChange={e => setEndTimeStr(`${endH || '10'}:${e.target.value}`)}
                    className="w-full px-2 py-2 text-xs font-semibold rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#5B84B1]"
                  >
                    {MINUTES_60.map(m => (
                      <option key={m} value={m}>{m}분</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 4. TimeTree 스타일 맞춤형 [사용자화] 반복 주기 엔진 */}
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-zinc-400 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Repeat size={12} />
                <span>반복 설정</span>
              </span>
              {repeatFrequency === 'CUSTOM' && (
                <span className="text-[10px] text-[#5B84B1] font-bold">TimeTree 사용자화 모드 활성</span>
              )}
            </label>
            <select
              value={repeatFrequency}
              onChange={e => setRepeatFrequency(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none font-medium"
            >
              <option value="NONE">반복 없음</option>
              <option value="DAILY">매일 반복</option>
              <option value="WEEKLY">매주 반복</option>
              <option value="MONTHLY_SOLAR">매월 같은 날 (양력)</option>
              <option value="YEARLY_SOLAR">매년 같은 날 (양력 기념일)</option>
              <option value="CUSTOM">★ [사용자화] 상세 설정...</option>
            </select>

            {/* 사용자화 상세 패널 */}
            {repeatFrequency === 'CUSTOM' && (
              <div className="p-3 bg-slate-50 dark:bg-zinc-850 rounded-2xl border border-slate-200 dark:border-zinc-700 space-y-3 text-xs animate-in fade-in">
                {/* 1. 반복 간격 (Interval) */}
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700 dark:text-zinc-300">반복 간격:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={customInterval}
                      onChange={e => setCustomInterval(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-16 px-2 py-1 text-center font-bold rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                    />
                    <select
                      value={customUnit}
                      onChange={e => setCustomUnit(e.target.value as any)}
                      className="px-2 py-1 font-semibold rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                    >
                      <option value="DAY">일 마다</option>
                      <option value="WEEK">주 마다</option>
                      <option value="MONTH">개월 마다</option>
                      <option value="YEAR">년 마다</option>
                    </select>
                  </div>
                </div>

                {/* 2. 주간 요일 다중 선택기 */}
                {customUnit === 'WEEK' && (
                  <div>
                    <span className="block font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                      반복할 요일:
                    </span>
                    <div className="grid grid-cols-7 gap-1">
                      {DAYS_OF_WEEK.map(d => {
                        const isSelected = customDaysOfWeek.includes(d.value);
                        return (
                          <button
                            key={d.value}
                            type="button"
                            onClick={() => toggleDayOfWeek(d.value)}
                            className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-[#5B84B1] text-white shadow-2xs'
                                : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 hover:bg-slate-100'
                            }`}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. 매월 반복 방식 */}
                {customUnit === 'MONTH' && (
                  <div className="space-y-1">
                    <span className="block font-semibold text-gray-700 dark:text-zinc-300">
                      매월 반복 기준:
                    </span>
                    <div className="flex gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="monthlyType"
                          checked={customMonthlyType === 'BY_DATE'}
                          onChange={() => setCustomMonthlyType('BY_DATE')}
                          className="accent-[#5B84B1]"
                        />
                        <span>특정 일자 (매월 같은 날)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="monthlyType"
                          checked={customMonthlyType === 'BY_DAY_OF_WEEK'}
                          onChange={() => setCustomMonthlyType('BY_DAY_OF_WEEK')}
                          className="accent-[#5B84B1]"
                        />
                        <span>요일 순번 (매월 N번째 요일)</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* 4. 종료 조건 */}
                <div className="space-y-1.5 pt-1 border-t border-gray-200 dark:border-zinc-750">
                  <span className="block font-semibold text-gray-700 dark:text-zinc-300">
                    반복 종료 조건:
                  </span>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="endType"
                        checked={customEndType === 'NEVER'}
                        onChange={() => setCustomEndType('NEVER')}
                        className="accent-[#5B84B1]"
                      />
                      <span>종료일 없음 (영원히 계속)</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer shrink-0">
                        <input
                          type="radio"
                          name="endType"
                          checked={customEndType === 'UNTIL_DATE'}
                          onChange={() => setCustomEndType('UNTIL_DATE')}
                          className="accent-[#5B84B1]"
                        />
                        <span>특정 날짜까지:</span>
                      </label>
                      <input
                        type="date"
                        disabled={customEndType !== 'UNTIL_DATE'}
                        value={customEndDate}
                        onChange={e => setCustomEndDate(e.target.value)}
                        className="px-2 py-1 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer shrink-0">
                        <input
                          type="radio"
                          name="endType"
                          checked={customEndType === 'COUNT'}
                          onChange={() => setCustomEndType('COUNT')}
                          className="accent-[#5B84B1]"
                        />
                        <span>횟수 제한:</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={999}
                        disabled={customEndType !== 'COUNT'}
                        value={customCount}
                        onChange={e => setCustomCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-16 px-2 py-1 text-center font-bold text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40"
                      />
                      <span className="text-gray-500">회 반복 후 종료</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 카테고리 선택 */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-zinc-400 mb-1">
              카테고리 폴더
            </label>
            <select
              value={categoryFolderId}
              onChange={e => {
                setCategoryFolderId(e.target.value);
                const found = categories.find(c => c.id === e.target.value);
                if (found) setColorHex(found.colorHex);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Across 스타일 32종 커스텀 컬러 팔레트 그리드 */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-zinc-400 mb-1.5 flex items-center justify-between">
              <span>색상 팔레트</span>
              <span className="font-mono text-[10px] text-gray-400">{colorHex}</span>
            </label>
            <div className="grid grid-cols-8 gap-2 p-2.5 bg-gray-50 dark:bg-zinc-850 rounded-2xl border border-gray-200/80 dark:border-zinc-750 max-h-36 overflow-y-auto scrollbar-thin">
              {COLOR_PALETTE.map(c => {
                const isSelected = colorHex.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColorHex(c.hex)}
                    title={c.name}
                    className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                      isSelected ? 'scale-110 ring-2 ring-offset-2 ring-slate-800 dark:ring-white z-10' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {isSelected && <Check size={14} className="text-white drop-shadow-sm" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 장소 & 메모 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-750 bg-white dark:bg-zinc-800">
              <MapPin size={15} className="text-gray-400 shrink-0" />
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="위치 / 장소 추가"
                className="w-full text-xs bg-transparent focus:outline-none text-gray-900 dark:text-zinc-100 placeholder-gray-400"
              />
            </div>
            <div className="flex items-start gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-750 bg-white dark:bg-zinc-800">
              <AlignLeft size={15} className="text-gray-400 shrink-0 mt-0.5" />
              <textarea
                value={memo}
                onChange={e => setMemo(e.target.value)}
                placeholder="메모를 입력하세요"
                rows={2}
                className="w-full text-xs bg-transparent focus:outline-none text-gray-900 dark:text-zinc-100 placeholder-gray-400 resize-none"
              />
            </div>
          </div>

          {/* 풋터 버튼 */}
          <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-zinc-800">
            {editingEvent ? (
              <button
                type="button"
                onClick={() => deleteEvent(editingEvent.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              >
                <Trash2 size={14} />
                <span>삭제</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeEventModal}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-90 transition-opacity"
                style={{ backgroundColor: colorHex }}
              >
                {editingEvent ? '저장하기' : isTask ? '할일 등록' : '일정 등록'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
