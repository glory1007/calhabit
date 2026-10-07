import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';
import { StatusBar, Style } from '@capacitor/status-bar';
import { ScheduleEvent, Habit } from '../types';
import { format, isSameDay, parseISO } from 'date-fns';

/**
 * 런타임 플랫폼 감지
 */
export const isNativeApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

export const getPlatform = (): 'android' | 'ios' | 'web' => {
  return Capacitor.getPlatform() as 'android' | 'ios' | 'web';
};

/**
 * 정밀 네이티브 햅틱 피드백
 */
export const triggerNativeHaptic = async (
  type: 'light' | 'medium' | 'heavy' | 'success' | 'selection' = 'light'
) => {
  try {
    if (isNativeApp()) {
      if (type === 'light') {
        await Haptics.impact({ style: ImpactStyle.Light });
      } else if (type === 'medium') {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } else if (type === 'heavy') {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } else if (type === 'success') {
        await Haptics.notification({ type: NotificationType.Success });
      } else if (type === 'selection') {
        await Haptics.selectionStart();
      }
    } else if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      if (type === 'success') {
        navigator.vibrate([20, 40, 30]);
      } else if (type === 'heavy') {
        navigator.vibrate(35);
      } else if (type === 'medium') {
        navigator.vibrate(20);
      } else {
        navigator.vibrate(12);
      }
    }
  } catch {
    // 햅틱 미지원 기기 무시
  }
};

/**
 * 안드로이드 시스템 상태표시줄(Status Bar) 스타일 동기화
 */
export const syncNativeStatusBar = async (isDarkMode: boolean) => {
  if (!isNativeApp()) return;
  try {
    await StatusBar.setStyle({
      style: isDarkMode ? Style.Dark : Style.Light,
    });
    if (getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({
        color: isDarkMode ? '#09090b' : '#f9fafb',
      });
    }
  } catch {
    // ignore
  }
};

/**
 * 안드로이드 하드웨어 뒤로가기 버튼(Hardware Back Button) 핸들러 등록
 * @param onBackPress 콜백이 true를 반환하면 모달/서랍이 닫힌 것으로 간주하여 앱 종료를 방지함
 */
export const registerHardwareBackButton = (onBackPress: () => boolean) => {
  if (!isNativeApp()) return () => {};

  const listenerPromise = App.addListener('backButton', ({ canGoBack }) => {
    // 1. 모달이나 서랍이 열려있어서 닫았는지 확인
    const handled = onBackPress();
    if (handled) {
      return; // 팝업만 닫고 앱 종료 방지
    }

    // 2. 더 이상 닫을 팝업이 없고 뒤로갈 내역이 없다면 앱 최소화/종료
    if (!canGoBack) {
      App.exitApp();
    } else {
      window.history.back();
    }
  });

  return () => {
    listenerPromise.then(handle => handle.remove()).catch(() => {});
  };
};

/**
 * Android 홈 화면 위젯(AppWidget) 지원을 위한 데이터 브릿지
 * 오늘의 일정과 습관 체크 상태를 네이티브 저장소(SharedPreferences)에 자동 동기화
 */
export const syncWidgetData = async (events: ScheduleEvent[], habits: Habit[]) => {
  try {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    // 오늘의 일정 필터링
    const todayEvents = events.filter(e => {
      try {
        const start = parseISO(e.startDateTime);
        const end = parseISO(e.endDateTime);
        return isSameDay(start, today) || isSameDay(end, today) || (start <= today && end >= today);
      } catch {
        return false;
      }
    }).map(e => ({
      id: e.id,
      title: e.title,
      startDateTime: e.startDateTime,
      endDateTime: e.endDateTime,
      colorHex: e.colorHex,
      isTask: !!e.isTask,
      isCompleted: !!e.isCompleted,
    }));

    // 오늘 습관 현황
    const todayHabits = habits.map(h => ({
      id: h.id,
      title: h.title,
      colorHex: h.colorHex,
      isCompleted: !!h.logs?.[todayStr]?.completed,
    }));

    const widgetPayload = {
      updatedAt: new Date().toISOString(),
      date: todayStr,
      todayEvents,
      todayHabits,
    };

    const payloadJson = JSON.stringify(widgetPayload);

    // 네이티브 Preferences (Android SharedPreferences) 저장
    await Preferences.set({
      key: 'calhabit_widget_data',
      value: payloadJson,
    });
    await Preferences.set({
      key: 'calhabit_widget_today_events',
      value: JSON.stringify(todayEvents),
    });
    await Preferences.set({
      key: 'calhabit_widget_habits',
      value: JSON.stringify(todayHabits),
    });

    // 웹 로컬스토리지 백업
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('calhabit_widget_data', payloadJson);
    }
  } catch (err) {
    console.warn('Widget data bridge sync failed:', err);
  }
};
