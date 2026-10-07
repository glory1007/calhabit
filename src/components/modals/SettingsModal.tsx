import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Moon, Volume2, Smartphone, Calendar, CloudSun, RotateCcw, Cloud } from 'lucide-react';
import { INITIAL_EVENTS, INITIAL_HABITS, INITIAL_TODOS, INITIAL_CATEGORIES } from '../../data/mockData';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, syncConfig, setIsCloudSyncModalOpen } = useApp();

  if (!isOpen) return null;

  const handleResetData = () => {
    if (window.confirm('모든 일정과 습관 데이터를 기본 상태로 초기화하시겠습니까?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100">
            설정
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 바디 */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* 음력 일자 표시 토글 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-[#DDB165]" />
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                  음력 일자 표시 (한국 천문)
                </div>
                <div className="text-[11px] text-gray-400">
                  캘린더 날짜 셀에 음력 월/일(예: 8/26)을 표시합니다
                </div>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ showLunarDates: !settings.showLunarDates })}
              className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                settings.showLunarDates ? 'bg-[#5B84B1] justify-end' : 'bg-gray-300 dark:bg-zinc-700 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
            </button>
          </div>

          {/* 완료된 할일 숨기기 */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                완료된 할일 숨기기
              </div>
              <div className="text-[11px] text-gray-400">
                체크 완료된 할일을 목록에서 감춥니다
              </div>
            </div>
            <button
              onClick={() => updateSettings({ hideCompletedTodos: !settings.hideCompletedTodos })}
              className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                settings.hideCompletedTodos ? 'bg-[#5B84B1] justify-end' : 'bg-gray-300 dark:bg-zinc-700 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
            </button>
          </div>

          {/* 주 시작 요일 */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
              주 시작 요일
            </span>
            <div className="flex bg-gray-100 dark:bg-zinc-800 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => updateSettings({ startDayOfWeek: 0 })}
                className={`px-3 py-1 rounded-md transition-colors ${
                  settings.startDayOfWeek === 0
                    ? 'bg-white dark:bg-zinc-700 text-[#5B84B1] dark:text-[#8AA8CD] shadow-2xs'
                    : 'text-gray-500'
                }`}
              >
                일요일 시작
              </button>
              <button
                onClick={() => updateSettings({ startDayOfWeek: 1 })}
                className={`px-3 py-1 rounded-md transition-colors ${
                  settings.startDayOfWeek === 1
                    ? 'bg-white dark:bg-zinc-700 text-[#5B84B1] dark:text-[#8AA8CD] shadow-2xs'
                    : 'text-gray-500'
                }`}
              >
                월요일 시작
              </button>
            </div>
          </div>

          {/* 햅틱 & 사운드 피드백 토글 */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Volume2 size={16} className="text-[#2ECC71]" />
              <span className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                습관 달성 완료 사운드 & 햅틱
              </span>
            </div>
            <button
              onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled, hapticEnabled: !settings.hapticEnabled })}
              className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                settings.soundEnabled ? 'bg-[#2196F3] justify-end' : 'bg-gray-300 dark:bg-zinc-700 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
            </button>
          </div>

          {/* 클라우드 실시간 동기화 설정 */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Cloud size={18} className="text-blue-500" />
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                  실시간 클라우드 동기화
                </div>
                <div className="text-[11px] text-gray-500 dark:text-zinc-400">
                  {syncConfig?.enabled ? `동기화 키: ${syncConfig.syncKey}` : '모바일 ↔ 노트북 실시간 연동'}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                setIsCloudSyncModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#2196F3] hover:bg-[#1E88E5] text-white text-xs font-bold transition-all shadow-xs"
            >
              {syncConfig?.enabled ? '동기화 관리' : '연동 설정'}
            </button>
          </div>

          {/* 데이터 초기화 */}
          <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center">
            <span className="text-xs text-gray-500">샘플 데이터 복원</span>
            <button
              onClick={handleResetData}
              className="px-3 py-1.5 rounded-xl border border-rose-200 text-[#E53935] hover:bg-rose-50 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <RotateCcw size={13} />
              <span>데이터 초기화</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
