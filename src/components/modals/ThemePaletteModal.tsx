import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { THEME_PRESETS, PALETTE_SETS, APP_ICON_PRESETS } from '../../utils/themePresets';
import { X, Check, Palette, Sparkles, Smartphone, CheckCheck } from 'lucide-react';

interface ThemePaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'theme' | 'palette' | 'icon';
}

export const ThemePaletteModal: React.FC<ThemePaletteModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'theme',
}) => {
  const {
    settings,
    updateSettings,
    categories,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'theme' | 'palette' | 'icon'>(initialTab);
  const [selectedPaletteId, setSelectedPaletteId] = useState<string>('palette_pastel');
  const [secondaryPaletteId, setSecondaryPaletteId] = useState<string | null>(null);

  if (!isOpen) return null;

  // 테마 적용
  const handleSelectTheme = (themeId: string) => {
    updateSettings({ currentThemeId: themeId });
    const theme = THEME_PRESETS.find(t => t.id === themeId);
    if (!theme) return;

    if (theme.type === 'DARK') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // CSS 변수 전역 주입
    document.documentElement.style.setProperty('--app-bg', theme.backgroundColor);
    document.documentElement.style.setProperty('--app-surface', theme.surfaceColor);
    document.documentElement.style.setProperty('--app-text', theme.primaryTextColor);
    document.documentElement.style.setProperty('--app-accent', theme.accentColor);
    document.documentElement.style.setProperty('--app-border', theme.borderColor);
  };

  // 팔레트 일괄 적용 (카테고리 전체 색상을 해당 팔레트 팩으로 순차 재배색)
  const handleApplyPalette = () => {
    const pal1 = PALETTE_SETS.find(p => p.id === selectedPaletteId);
    const pal2 = PALETTE_SETS.find(p => p.id === secondaryPaletteId);

    const colors = pal2
      ? [...(pal1?.colors || []), ...(pal2?.colors || [])]
      : pal1?.colors || [];

    // 로컬스토리지 카테고리 일괄 갱신
    const updatedCategories = categories.map((cat, idx) => ({
      ...cat,
      colorHex: colors[idx % colors.length] || cat.colorHex,
    }));

    localStorage.setItem('calhabit_categories_v1', JSON.stringify(updatedCategories));
    // 강제 동기화를 위해 리로드 또는 상태 반영
    window.location.reload();
  };

  // 팔레트 탭 클릭 시 1차/2차 블렌드 선택
  const handlePaletteClick = (palId: string) => {
    if (selectedPaletteId === palId) {
      // 이미 선택된 걸 다시 누르면 해제 또는 단일화
      setSecondaryPaletteId(null);
    } else if (!secondaryPaletteId) {
      setSecondaryPaletteId(palId);
    } else {
      setSelectedPaletteId(palId);
      setSecondaryPaletteId(null);
    }
  };

  // 미리보기용 카테고리 색상
  const activePal1 = PALETTE_SETS.find(p => p.id === selectedPaletteId);
  const activePal2 = PALETTE_SETS.find(p => p.id === secondaryPaletteId);
  const previewPaletteColors = activePal2
    ? [...(activePal1?.colors || []), ...(activePal2?.colors || [])]
    : activePal1?.colors || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* 헤더 & 3대 탭 네비게이션 */}
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gray-50/70 dark:bg-zinc-850/60">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab('theme')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'theme'
                  ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 dark:text-zinc-400'
              }`}
            >
              <Sparkles size={14} />
              <span>테마 라이브러리</span>
            </button>
            <button
              onClick={() => setActiveTab('palette')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'palette'
                  ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 dark:text-zinc-400'
              }`}
            >
              <Palette size={14} />
              <span>일괄 팔레트 팩</span>
            </button>
            <button
              onClick={() => setActiveTab('icon')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'icon'
                  ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 dark:text-zinc-400'
              }`}
            >
              <Smartphone size={14} />
              <span>앱 아이콘 & 배지</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 탭 1: Across 13종 테마 선택 (이미지 1번 완벽 재현) */}
        {activeTab === 'theme' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-2 flex-1">
            <div className="text-xs text-gray-500 dark:text-zinc-400 mb-2 font-medium">
              선택한 테마가 앱의 배경, 헤더, 캘린더 전체에 즉시 전역 적용됩니다.
            </div>

            <div className="divide-y divide-gray-100 dark:divide-zinc-800 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-850">
              {THEME_PRESETS.map(theme => {
                const isSelected = (settings.currentThemeId || 'light') === theme.id;

                return (
                  <div
                    key={theme.id}
                    onClick={() => handleSelectTheme(theme.id)}
                    className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20'
                        : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-800 dark:text-zinc-200'}`}>
                        {theme.name}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                          적용 중
                        </span>
                      )}
                    </div>

                    {/* [이미지 1] 우측 2색 테마 인디케이터 바 */}
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center -space-x-1">
                        <span
                          className="w-4 h-4 rounded-full border border-black/10 shadow-2xs z-10"
                          style={{ backgroundColor: theme.previewColors[0] }}
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                          style={{ backgroundColor: theme.previewColors[1] }}
                        />
                      </div>
                      {isSelected && <Check size={16} className="text-emerald-600 ml-1" strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 탭 2: Across 일괄 컬러 팔레트 팩 (이미지 2번 완벽 재현) */}
        {activeTab === 'palette' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
            <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-3 text-xs text-emerald-800 dark:text-emerald-300">
              <p className="font-bold">팔레트는 최대 2개까지 선택하여 블렌드할 수 있습니다.</p>
              <p className="text-[11px] opacity-90 mt-0.5">
                원하는 팔레트 팩을 선택하면 전체 카테고리 색상이 톤온톤으로 일괄 재배색됩니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* 좌측: 팔레트 팩 목록 */}
              <div className="md:col-span-6 space-y-2">
                <span className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                  팔레트 프리셋 선택
                </span>

                <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                  {PALETTE_SETS.map(pal => {
                    const isPal1 = selectedPaletteId === pal.id;
                    const isPal2 = secondaryPaletteId === pal.id;
                    const isSelected = isPal1 || isPal2;

                    return (
                      <div
                        key={pal.id}
                        onClick={() => handlePaletteClick(pal.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs'
                            : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 bg-white dark:bg-zinc-850'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-gray-800 dark:text-zinc-200">
                            {pal.name}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                              <Check size={11} strokeWidth={3} />
                              {isPal1 ? '메인' : '블렌드'}
                            </span>
                          )}
                        </div>

                        {/* 8색 바 */}
                        <div className="flex gap-1 h-3.5 rounded-md overflow-hidden">
                          {pal.colors.map((c, i) => (
                            <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 우측: 현재 카테고리 일괄 적용 실시간 미리보기 (이미지 2번 오른쪽과 일치) */}
              <div className="md:col-span-6 space-y-2">
                <span className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                  카테고리 일괄 적용 미리보기
                </span>

                <div className="border border-gray-200 dark:border-zinc-800 rounded-2xl p-3 bg-gray-50/50 dark:bg-zinc-850/50 space-y-1.5 max-h-[320px] overflow-y-auto">
                  {categories.map((cat, idx) => {
                    const previewColor =
                      previewPaletteColors[idx % previewPaletteColors.length] || cat.colorHex;

                    return (
                      <div
                        key={cat.id}
                        className="p-2 rounded-xl text-white font-bold text-xs flex items-center justify-between shadow-2xs transition-all"
                        style={{ backgroundColor: previewColor }}
                      >
                        <span>{cat.name}</span>
                        <span className="text-[10px] opacity-80 font-mono">{previewColor}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 일괄 적용 실행 버튼 */}
            <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-zinc-800">
              <button
                onClick={handleApplyPalette}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-transform active:scale-95"
              >
                <CheckCheck size={16} />
                <span>선택한 팔레트로 전체 일괄 동기화</span>
              </button>
            </div>
          </div>
        )}

        {/* 탭 3: Across 앱 아이콘 & 배지 (이미지 3번 완벽 재현) */}
        {activeTab === 'icon' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
            {/* 스마트 배지 설정 (이미지 3 상단과 일치) */}
            <div className="bg-gray-50 dark:bg-zinc-850 border border-gray-200 dark:border-zinc-800 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-800 dark:text-zinc-200">
                    스마트 앱 배지 카운트
                  </div>
                  <div className="text-[11px] text-gray-400">
                    홈 화면 앱 아이콘 우측 상단 붉은 숫자에 표시할 항목
                  </div>
                </div>

                <select
                  value={settings.badgeSettings?.mode || 'COMBINED'}
                  onChange={e =>
                    updateSettings({
                      badgeSettings: {
                        ...(settings.badgeSettings || { includeCompleted: false }),
                        mode: e.target.value as any,
                      },
                    })
                  }
                  className="px-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 font-semibold focus:outline-none"
                >
                  <option value="NONE">배지 표시 안 함</option>
                  <option value="TODAY_TASKS">오늘 남은 할일 수</option>
                  <option value="TODAY_EVENTS">오늘 남은 일정 수</option>
                  <option value="COMBINED">캘린더 & 리마인더 리스트 통합</option>
                </select>
              </div>
            </div>

            {/* 20종 앱 아이콘 프리셋 그리드 (이미지 3번 '31' 타일 디자인) */}
            <div>
              <div className="text-xs font-bold text-gray-800 dark:text-zinc-200 mb-2">
                앱 아이콘 커스텀 (20종 테마 컬러 타일)
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 max-h-[300px] overflow-y-auto p-2 bg-gray-50/50 dark:bg-zinc-850/50 rounded-2xl border border-gray-200 dark:border-zinc-800">
                {APP_ICON_PRESETS.map(iconItem => {
                  const isCurrentIcon = (settings.activeAppIconId || 'icon-default') === iconItem.id;

                  return (
                    <div
                      key={iconItem.id}
                      onClick={() => updateSettings({ activeAppIconId: iconItem.id })}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl cursor-pointer transition-all ${
                        isCurrentIcon
                          ? 'ring-2 ring-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 scale-105'
                          : 'hover:bg-white dark:hover:bg-zinc-800 hover:scale-102'
                      }`}
                    >
                      {/* Across 시그니처 31번 앱 아이콘 모양 */}
                      <div
                        className="w-13 h-13 rounded-2xl shadow-md border border-black/10 relative overflow-hidden flex items-center justify-center font-black text-xl select-none"
                        style={{
                          backgroundColor: iconItem.bgColor,
                          color: iconItem.textColor,
                        }}
                      >
                        {/* 우측 상단 모서리 접힘 컬러 포인트 */}
                        <div
                          className="absolute -top-3 -right-3 w-8 h-8 rotate-45 shadow-2xs"
                          style={{ backgroundColor: iconItem.foldColor }}
                        />
                        <span className="z-10 tracking-tighter">31</span>
                      </div>

                      <span className="text-[10px] text-gray-500 dark:text-zinc-400 font-medium text-center truncate max-w-full">
                        {iconItem.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
