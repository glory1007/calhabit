import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { MonthCalendar } from './components/calendar/MonthCalendar';
import { WeeklyTimetable } from './components/weekly/WeeklyTimetable';
import { HabitDashboard } from './components/habits/HabitDashboard';
import { WidgetGallery } from './components/widgets/WidgetGallery';
import { TaskDrawer } from './components/drawer/TaskDrawer';
import { EventModal } from './components/modals/EventModal';
import { HabitModal } from './components/modals/HabitModal';
import { HabitDetailModal } from './components/modals/HabitDetailModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { ThemePaletteModal } from './components/modals/ThemePaletteModal';
import { DDayView } from './components/dday/DDayView';

const MainContent: React.FC = () => {
  const { viewMode } = useApp();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-gray-50/50 dark:bg-zinc-950">
      {/* 1. 슬림 상단 헤더 */}
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />

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

      {/* 3. 미배정 할일 우측 서랍 */}
      <TaskDrawer />

      {/* 4. 모달 레이어 */}
      <EventModal />
      <HabitModal />
      <HabitDetailModal />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <ThemePaletteModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />

      {/* 5. Across 멀티 뷰 스위처 도크 (Dock) & 고정 FAB */}
      <BottomNav onOpenThemeModal={() => setIsThemeModalOpen(true)} />
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
