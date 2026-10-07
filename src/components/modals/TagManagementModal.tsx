import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { COLOR_PALETTE } from '../../utils/colorPalette';
import { PRESET_EMOJIS, getCategoryEmoji } from '../../utils/categoryEmoji';
import { X, Plus, Trash2, Edit2, Check, Tag } from 'lucide-react';
import { getContrastTextColor } from '../../utils/contrastColor';

export const TagManagementModal: React.FC = () => {
  const {
    categories,
    isTagModalOpen,
    setIsTagModalOpen,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useApp();

  const [newTagName, setNewTagName] = useState('');
  const [newTagEmoji, setNewTagEmoji] = useState('👤');
  const [newTagColor, setNewTagColor] = useState(COLOR_PALETTE[0].hex);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('👤');
  const [editColor, setEditColor] = useState('');

  if (!isTagModalOpen) return null;

  const handleStartEdit = (cat: { id: string; name: string; colorHex: string; emoji?: string }) => {
    setEditingTagId(cat.id);
    setEditName(cat.name);
    setEditEmoji(getCategoryEmoji(cat));
    setEditColor(cat.colorHex);
  };

  const handleSaveEdit = (id: string) => {
    updateCategory(id, editName.trim() || editEmoji, editColor, editEmoji);
    setEditingTagId(null);
  };

  const handleAddNewTag = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = newTagName.trim() || newTagEmoji;
    addCategory(finalName, newTagColor, newTagEmoji);
    setNewTagName('');
    setNewTagColor(COLOR_PALETTE[(categories.length + 1) % COLOR_PALETTE.length].hex);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* 모달 상단 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-200">
              <Tag size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-zinc-100">태그(Tag) 관리</h2>
              <p className="text-[11px] text-gray-400 dark:text-zinc-500">태그 이름 및 고유 색상 설정</p>
            </div>
          </div>
          <button
            onClick={() => setIsTagModalOpen(false)}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 모달 본문 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* 1. 신규 태그 추가 폼 */}
          <form onSubmit={handleAddNewTag} className="p-3.5 bg-slate-50 dark:bg-zinc-850 rounded-2xl border border-slate-200/70 dark:border-zinc-750 space-y-3">
            <span className="text-xs font-bold text-gray-700 dark:text-zinc-300 block">새 태그 추가</span>
            
            {/* 이모지 및 태그 이름/메모 입력 */}
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={newTagEmoji}
                onChange={e => setNewTagEmoji(e.target.value)}
                maxLength={4}
                placeholder="이모지"
                className="w-12 text-center py-2 text-base rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#5B84B1]"
                title="이모지를 직접 입력하거나 아래에서 선택하세요 (Win + . 지원)"
              />
              <input
                type="text"
                placeholder="태그 메모/이름 (예: 독서, 운동)"
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                className="flex-1 px-3 py-2 text-xs font-medium rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#5B84B1]"
              />
              <button
                type="submit"
                disabled={!newTagName.trim() && !newTagEmoji.trim()}
                className="px-3.5 py-2 bg-[#4B6B88] hover:bg-[#3D566E] disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-all shrink-0"
              >
                <Plus size={14} />
                <span>추가</span>
              </button>
            </div>

            {/* 추천 이모지 빠른 선택 */}
            <div>
              <span className="text-[10px] text-gray-400 dark:text-zinc-500 block mb-1">추천 이모지:</span>
              <div className="flex gap-1 overflow-x-auto scrollbar-none py-0.5">
                {PRESET_EMOJIS.map(em => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setNewTagEmoji(em)}
                    className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-transform shrink-0 ${
                      newTagEmoji === em ? 'scale-110 bg-slate-200 dark:bg-zinc-700 ring-2 ring-blue-500' : 'hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            {/* 신규 색상 선택기 */}
            <div>
              <span className="text-[10px] text-gray-400 dark:text-zinc-500 block mb-1.5">대표 컬러 선택 (TimeTree 10색):</span>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 p-1.5 bg-white dark:bg-zinc-800 rounded-xl border border-gray-200/60 dark:border-zinc-700">
                {COLOR_PALETTE.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setNewTagColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-6 h-6 rounded-md transition-transform flex items-center justify-center ${
                      newTagColor.toLowerCase() === c.hex.toLowerCase() ? 'scale-110 ring-2 ring-zinc-900 dark:ring-white shadow-xs' : 'hover:scale-105'
                    }`}
                    title={c.name}
                  >
                    {newTagColor.toLowerCase() === c.hex.toLowerCase() && (
                      <Check size={12} strokeWidth={3} className="text-white drop-shadow-xs" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </form>

          {/* 2. 등록된 태그 목록 및 편집 */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-700 dark:text-zinc-300 block">
              등록된 태그 목록 ({categories.length})
            </span>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {categories.map(cat => {
                const isEditing = editingTagId === cat.id;

                if (isEditing) {
                  return (
                    <div
                      key={cat.id}
                      className="p-3 bg-white dark:bg-zinc-800 rounded-2xl border-2 border-[#5B84B1] shadow-md space-y-2.5 animate-in fade-in"
                    >
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={editEmoji}
                          onChange={e => setEditEmoji(e.target.value)}
                          maxLength={4}
                          className="w-10 text-center py-1.5 text-base rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100"
                          title="이모지 수정"
                        />
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          placeholder="태그 메모"
                          className="flex-1 px-2.5 py-1.5 text-xs font-bold rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(cat.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs"
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTagId(null)}
                          className="px-2 py-1.5 text-gray-400 hover:text-gray-600 text-xs"
                        >
                          취소
                        </button>
                      </div>

                      {/* 이모지 추천 */}
                      <div className="flex gap-1 overflow-x-auto scrollbar-none py-0.5">
                        {PRESET_EMOJIS.map(em => (
                          <button
                            key={em}
                            type="button"
                            onClick={() => setEditEmoji(em)}
                            className={`w-6 h-6 rounded text-xs flex items-center justify-center transition-transform shrink-0 ${
                              editEmoji === em ? 'scale-110 bg-slate-200 dark:bg-zinc-600 ring-2 ring-blue-500' : 'hover:bg-slate-100 dark:hover:bg-zinc-750'
                            }`}
                          >
                            {em}
                          </button>
                        ))}
                      </div>

                      {/* 팔레트 */}
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 p-1.5 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-200/60 dark:border-zinc-700">
                        {COLOR_PALETTE.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setEditColor(c.hex)}
                            style={{ backgroundColor: c.hex }}
                            className={`w-6 h-6 rounded-md transition-transform flex items-center justify-center ${
                              editColor.toLowerCase() === c.hex.toLowerCase() ? 'scale-110 ring-2 ring-zinc-900 dark:ring-white shadow-xs' : 'hover:scale-105'
                            }`}
                            title={c.name}
                          >
                            {editColor.toLowerCase() === c.hex.toLowerCase() && (
                              <Check size={12} strokeWidth={3} className="text-white drop-shadow-xs" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-200/60 dark:border-zinc-750 hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base leading-none shrink-0">
                        {getCategoryEmoji(cat)}
                      </span>
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: cat.colorHex }}
                      />
                      <span className="text-xs font-bold text-gray-900 dark:text-zinc-100 truncate">
                        {cat.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(cat)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-white dark:hover:bg-zinc-700 transition-colors"
                        title="태그 및 색상 편집"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (categories.length <= 1) {
                            alert('최소 1개 이상의 태그는 유지되어야 합니다.');
                            return;
                          }
                          if (confirm(`'${cat.name}' 태그를 삭제하시겠습니까?`)) {
                            deleteCategory(cat.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title="태그 삭제"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 모달 하단 닫기 버튼 */}
        <div className="p-3 bg-gray-50 dark:bg-zinc-850 border-t border-gray-100 dark:border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={() => setIsTagModalOpen(false)}
            className="px-4 py-2 bg-slate-200 dark:bg-zinc-700 hover:bg-slate-300 dark:hover:bg-zinc-600 text-slate-800 dark:text-zinc-100 text-xs font-bold rounded-xl transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
