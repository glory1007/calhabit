import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { MonthCalendar } from './components/calendar/MonthCalendar';
import { WeeklyTimetable } from './components/weekly/WeeklyTimetable';
import { HabitDashboard } from './components/habits/HabitDashboard';
import { WidgetGallery } from './components/widgets/WidgetGallery';
import { EventModal } from './components/modals/EventModal';
import { HabitModal } from './components/modals/HabitModal';
import { HabitDetailModal } from './components/modals/HabitDetailModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { ThemePaletteModal } from './components/modals/ThemePaletteModal';
import { TagManagementModal } from './components/modals/TagManagementModal';
import { CloudSyncModal } from './components/modals/CloudSyncModal';
import { DDayView } from './components/dday/DDayView';
import {
  isNativeApp,
  syncNativeStatusBar,
  registerHardwareBackButton,
  syncWidgetData
} from './utils/nativeBridge';

const MainContent: React.FC = () => {
  const {
    viewMode,
    events,
    habits,
    settings,
    isEventModalOpen,
    closeEventModal,
    isHabitModalOpen,
    closeHabitModal,
    activeHabitDetailId,
    closeHabitDetail,
    isTaskDrawerOpen,
    toggleTaskDrawer,
    openEventModal,
    openHabitModal,
    updateSettings,
    isCloudSyncModalOpen,
    setIsCloudSyncModalOpen,
  } = useApp();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(() => {
    return !isNativeApp() && localStorage.getItem('calhabit_hide_install_banner') !== 'true';
  });
  const { isTagModalOpen, setIsTagModalOpen, isTimelineOpen, setIsTimelineOpen } = useApp();

  const handleQuickAdd = () => {
    if (viewMode === 'habit') {
      openHabitModal();
    } else {
      openEventModal();
    }
  };

  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.contains('dark') || settings.theme === 'dark';
    if (isDark) {
      document.documentElement.classList.remove('dark');
      updateSettings({ theme: 'light' });
    } else {
      document.documentElement.classList.add('dark');
      updateSettings({ theme: 'dark' });
    }
  };

  // 1. 안드로이드 하드웨어 뒤로가기 버튼(Hardware Back Button) 처리
  useEffect(() => {
    const unregister = registerHardwareBackButton(() => {
      if (isTagModalOpen) {
        setIsTagModalOpen(false);
        return true;
      }
      if (isEventModalOpen) {
        closeEventModal();
        return true;
      }
      if (isHabitModalOpen) {
        closeHabitModal();
        return true;
      }
      if (activeHabitDetailId) {
        closeHabitDetail();
        return true;
      }
      if (isCloudSyncModalOpen) {
        setIsCloudSyncModalOpen(false);
        return true;
      }
      if (isSettingsOpen) {
        setIsSettingsOpen(false);
        return true;
      }
      if (isThemeModalOpen) {
        setIsThemeModalOpen(false);
        return true;
      }
      if (isTimelineOpen) {
        setIsTimelineOpen(false);
        return true;
      }
      return false;
    });

    return unregister;
  }, [
    isTagModalOpen,
    isCloudSyncModalOpen,
    isTimelineOpen,
    isEventModalOpen,
    isHabitModalOpen,
    activeHabitDetailId,
    isSettingsOpen,
    isThemeModalOpen,
    closeEventModal,
    closeHabitModal,
    closeHabitDetail
  ]);

  // 2. 안드로이드 상태표시줄(Status Bar) 테마 동기화 및 다크모드 클래스 동기화
  useEffect(() => {
    const isDark = settings.theme === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    syncNativeStatusBar(isDark);
  }, [settings.theme]);

  // 3. 홈 화면 위젯(Widget) 지원을 위한 실시간 데이터 브릿지 동기화
  useEffect(() => {
    syncWidgetData(events, habits);
  }, [events, habits]);

  return (
    <div className={`h-screen w-screen overflow-hidden flex flex-col bg-gray-50/50 dark:bg-zinc-950 ${isNativeApp() ? 'pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]' : ''}`}>
      {/* 1. 슬림 상단 헤더 */}
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* 안드로이드 전용 앱 설치 유도 배너 (웹 브라우저 접속 시 노출) */}
      {showInstallBanner && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-3 py-1.5 flex items-center justify-between text-xs shadow-xs z-30 shrink-0">
          <div className="flex items-center gap-2 truncate">
            <span className="text-sm">📲</span>
            <span className="font-medium truncate">스마트폰에 CalHabit 앱을 설치해보세요!</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/CalHabit.apk"
              download="CalHabit.apk"
              className="px-2.5 py-1 bg-white text-emerald-700 font-bold rounded-lg text-[11px] shadow-xs hover:bg-emerald-50 active:scale-95 transition-all"
            >
              APK 다운로드
            </a>
            <button
              onClick={() => {
                setShowInstallBanner(false);
                localStorage.setItem('calhabit_hide_install_banner', 'true');
              }}
              className="text-white/80 hover:text-white p-0.5"
              title="닫기"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 2. 메인 뷰 컨텐츠 영역 (대화면 100vw, 100% Full-Viewport 확장) */}
      <main className="flex-1 w-full overflow-hidden flex flex-col pb-16 md:pb-12">
        {viewMode === 'month' && <MonthCalendar />}
        {viewMode === 'week' && <WeeklyTimetable />}
        {viewMode === 'habit' && (
          <div className="flex-1 w-full overflow-y-auto">
            <HabitDashboard />
          </div>
        )}
        {viewMode === 'dday' && (
          <div className="flex-1 w-full overflow-y-auto">
            <DDayView />
          </div>
        )}
        {viewMode === 'widget' && (
          <div className="flex-1 w-full overflow-y-auto">
            <WidgetGallery />
          </div>
        )}
      </main>

      {/* 모달 레이어 */}
      <EventModal />
      <HabitModal />
      <HabitDetailModal />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <ThemePaletteModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />
      <TagManagementModal />
      <CloudSyncModal
        isOpen={isCloudSyncModalOpen}
        onClose={() => setIsCloudSyncModalOpen(false)}
      />

      {/* 5. Across 멀티 뷰 스위처 도크 (Dock) & 고정 FAB */}
      <BottomNav
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onQuickAdd={handleQuickAdd}
        toggleDarkMode={toggleDarkMode}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
