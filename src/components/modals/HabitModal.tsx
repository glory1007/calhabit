import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Habit, HabitSectionGroup } from '../../types';
import { COLOR_PALETTE } from '../../utils/colorPalette';
import { X, Sparkles, Trash2, Check } from 'lucide-react';

// 습관 템플릿 프리셋 갤러리 (Across 모던 팔레트 기반)
interface HabitPreset {
  category: string;
  title: string;
  icon: string;
  quote: string;
  section: HabitSectionGroup;
  colorHex: string;
}

const HABIT_PRESETS: HabitPreset[] = [
  { category: '건강', title: '아침 미온수 500ml', icon: 'W', quote: '상쾌한 하루를 깨우는 첫 습관', section: 'MORNING', colorHex: '#5B84B1' },
  { category: '건강', title: '비타민 및 영양제 복용', icon: 'V', quote: '내 몸을 위한 작은 영양 투자', section: 'MORNING', colorHex: '#DDB165' },
  { category: '운동', title: '모닝 스트레칭 15분', icon: 'S', quote: '굳은 몸을 유연하게 풀어주기', section: 'MORNING', colorHex: '#7A9A8B' },
  { category: '운동', title: '러닝 또는 1만보 걷기', icon: 'R', quote: '매일 땀 흘리며 스트레스 해소', section: 'AFTERNOON', colorHex: '#D27D60' },
  { category: '자기계발', title: '기술 서적 / 아티클 독서', icon: 'B', quote: '새로운 지식으로 성장하기', section: 'AFTERNOON', colorHex: '#7D79A3' },
  { category: '자기계발', title: '1일 1커밋 또는 개발 공부', icon: 'C', quote: '꾸준한 코딩이 실력을 만든다', section: 'AFTERNOON', colorHex: '#5B84B1' },
  { category: '마음/정리', title: '하루 감사 일기 3줄 쓰기', icon: 'J', quote: '오늘 하루 감사했던 순간들', section: 'NIGHT', colorHex: '#A28876' },
  { category: '마음/정리', title: '수면 30분 전 스마트폰 끄기', icon: 'N', quote: '깊은 숙면으로 내일 충전', section: 'NIGHT', colorHex: '#64748B' },
  { category: '운동', title: '플랭크 2분 & 코어 운동', icon: 'P', quote: '단단한 코어가 단단한 체력을 만든다', section: 'AFTERNOON', colorHex: '#D9777F' },
  { category: '마음/정리', title: '호흡 명상 10분', icon: 'M', quote: '복잡한 마음을 비우고 평온 찾기', section: 'MORNING', colorHex: '#6A939E' },
];

const HABIT_ICONS = [
  'W', 'S', 'V', 'R', 'B', 'C', 'J', 'N', 'P', 'M',
  'T', 'D', 'H', 'E', 'L', 'F', 'G', 'A', 'K', 'Q'
];

export const HabitModal: React.FC = () => {
  const { isHabitModalOpen, closeHabitModal, editingHabit, saveHabit, deleteHabit } = useApp();

  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('W');
  const [quote, setQuote] = useState('');
  const [sectionGroup, setSectionGroup] = useState<HabitSectionGroup>('MORNING');
  const [colorHex, setColorHex] = useState('#5B84B1');
  const [reminderTime, setReminderTime] = useState('08:00');
  const [frequencyType, setFrequencyType] = useState<'DAILY' | 'WEEKLY_DAYS'>('DAILY');
  const [targetDays, setTargetDays] = useState<number[]>([1, 2, 3, 4, 5]); // 월~금 기본

  useEffect(() => {
    if (!isHabitModalOpen) return;

    if (editingHabit) {
      setTitle(editingHabit.title);
      setIcon(editingHabit.icon);
      setQuote(editingHabit.quote || '');
      setSectionGroup(editingHabit.sectionGroup);
      setColorHex(editingHabit.colorHex);
      setReminderTime(editingHabit.reminders[0] || '08:00');
      setFrequencyType(editingHabit.frequency.type === 'WEEKLY_DAYS' ? 'WEEKLY_DAYS' : 'DAILY');
      setTargetDays(editingHabit.frequency.targetDays || [1, 2, 3, 4, 5]);
    } else {
      setTitle('');
      setIcon('W');
      setQuote('');
      setSectionGroup('MORNING');
      setColorHex('#5B84B1');
      setReminderTime('08:00');
      setFrequencyType('DAILY');
      setTargetDays([1, 2, 3, 4, 5]);
    }
  }, [isHabitModalOpen, editingHabit]);

  if (!isHabitModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    saveHabit({
      id: editingHabit?.id,
      title: title.trim(),
      icon,
      quote: quote.trim() || undefined,
      sectionGroup,
      frequency: {
        type: frequencyType,
        targetDays: frequencyType === 'WEEKLY_DAYS' ? targetDays : undefined,
      },
      goalCountPerDay: 1,
      reminders: [reminderTime],
      colorHex,
      isArchived: editingHabit?.isArchived || false,
    });
  };

  const handleApplyPreset = (p: HabitPreset) => {
    setTitle(p.title);
    setIcon(p.icon);
    setQuote(p.quote);
    setSectionGroup(p.section);
    setColorHex(p.colorHex);
  };

  const toggleDay = (dayIdx: number) => {
    setTargetDays(prev =>
      prev.includes(dayIdx) ? prev.filter(d => d !== dayIdx) : [...prev, dayIdx].sort()
    );
  };

  const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* 헤더 */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100">
            {editingHabit ? '습관 수정하기' : '새로운 습관 만들기'}
          </h3>
          <button
            onClick={closeHabitModal}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* 프리셋 갤러리 */}
          {!editingHabit && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1">
                <Sparkles size={13} className="text-amber-500" />
                <span>추천 습관 프리셋 갤러리</span>
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {HABIT_PRESETS.map((p, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => handleApplyPreset(p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-750 bg-gray-50 dark:bg-zinc-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-500 transition-colors shrink-0 text-left"
                  >
                    <span className="text-base">{p.icon}</span>
                    <div>
                      <div className="text-xs font-bold text-gray-800 dark:text-zinc-100">
                        {p.title}
                      </div>
                      <div className="text-[10px] text-gray-400">{p.category}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 아이콘 선택 & 습관 이름 */}
          <div className="flex items-center gap-3">
            <div
              className="w-13 h-13 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-sm border border-black/10"
              style={{ backgroundColor: colorHex }}
            >
              <span>{icon}</span>
            </div>
            <div className="flex-1">
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="습관 이름 (예: 하루 2L 물 마시기)"
                className="w-full px-3.5 py-2.5 text-base font-semibold rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* 아이콘 그리드 선택기 */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-zinc-400 mb-1">
              아이콘 선택
            </label>
            <div className="grid grid-cols-10 gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-gray-50 dark:bg-zinc-850 rounded-xl border border-gray-200 dark:border-zinc-750 text-center">
              {HABIT_ICONS.map((ic, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setIcon(ic)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-base hover:bg-white dark:hover:bg-zinc-700 transition-colors ${
                    icon === ic ? 'bg-white dark:bg-zinc-700 ring-2 ring-emerald-500' : ''
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* 동기부여 인용구 (Quote) */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-zinc-400 mb-1">
              동기부여 명언 또는 각오 (Quote)
            </label>
            <input
              type="text"
              value={quote}
              onChange={e => setQuote(e.target.value)}
              placeholder="예: 작은 습관이 모여 위대한 변화를 만든다"
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none"
            />
          </div>

          {/* 시간대 섹션 그룹핑 (아침 / 오후 / 밤 / 기타) */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-zinc-400 mb-1">
              시간대 그룹
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: 'MORNING', label: '아침' },
                { key: 'AFTERNOON', label: '오후' },
                { key: 'NIGHT', label: '저녁/밤' },
                { key: 'CUSTOM', label: '자율' },
              ].map(sec => (
                <button
                  type="button"
                  key={sec.key}
                  onClick={() => setSectionGroup(sec.key as HabitSectionGroup)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    sectionGroup === sec.key
                      ? 'border-[#5B84B1] bg-[#5B84B1]/10 text-[#5B84B1] dark:text-[#8AA8CD] shadow-2xs'
                      : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>
          </div>

          {/* 반복 주기 & 요일 토글 */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-zinc-400 mb-1">
              반복 빈도
            </label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setFrequencyType('DAILY')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  frequencyType === 'DAILY'
                    ? 'border-[#5B84B1] bg-[#5B84B1]/10 text-[#5B84B1] dark:text-[#8AA8CD]'
                    : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400'
                }`}
              >
                매일 반복
              </button>
              <button
                type="button"
                onClick={() => setFrequencyType('WEEKLY_DAYS')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  frequencyType === 'WEEKLY_DAYS'
                    ? 'border-[#5B84B1] bg-[#5B84B1]/10 text-[#5B84B1] dark:text-[#8AA8CD]'
                    : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400'
                }`}
              >
                특정 요일 선택
              </button>
            </div>

            {frequencyType === 'WEEKLY_DAYS' && (
              <div className="flex justify-between gap-1 p-2 bg-gray-50 dark:bg-zinc-850 rounded-xl border border-gray-200 dark:border-zinc-700">
                {dayLabels.map((lbl, idx) => {
                  const isChecked = targetDays.includes(idx);
                  return (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => toggleDay(idx)}
                      className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                        isChecked
                          ? 'bg-[#5B84B1] text-white shadow-xs'
                          : 'bg-white dark:bg-zinc-800 text-gray-400 border border-gray-200 dark:border-zinc-700'
                      }`}
                    >
                      {lbl}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 알림 시간 & 색상 선택 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 dark:text-zinc-400 mb-1">
                알림 시간
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={e => setReminderTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-500 dark:text-zinc-400 mb-1">
                대표 색상
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-gray-50 dark:bg-zinc-850 rounded-xl border border-gray-200 dark:border-zinc-700">
                {COLOR_PALETTE.slice(0, 10).map(c => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setColorHex(c.hex)}
                    className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center transition-transform ${
                      colorHex === c.hex ? 'scale-110 ring-2 ring-zinc-900 dark:ring-white' : ''
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {colorHex === c.hex && <Check size={12} className="text-white" strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 푸터 액션 */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-zinc-800">
            {editingHabit ? (
              <button
                type="button"
                onClick={() => deleteHabit(editingHabit.id)}
                className="px-3 py-2 text-[#D9777F] hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Trash2 size={15} />
                <span>삭제</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeHabitModal}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-[#5B84B1] hover:bg-[#4B6B88] text-white rounded-xl shadow-xs transition-colors"
              >
                저장하기
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
