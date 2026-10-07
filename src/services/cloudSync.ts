import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { ScheduleEvent, Habit, TodoItem, CategoryFolder, AppSettings } from '../types';

export interface SyncPayload {
  events: ScheduleEvent[];
  habits: Habit[];
  todos: TodoItem[];
  categories: CategoryFolder[];
  settings: Partial<AppSettings>;
  updatedAt: string;
  sourceDeviceId?: string;
}

export interface CloudSyncSettings {
  enabled: boolean;
  provider: 'supabase' | 'firebase';
  syncKey: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  firebaseRtdbUrl: string;
  lastSyncedAt?: string;
}

const STORAGE_KEYS = {
  SYNC_CONFIG: 'calhabit_cloud_sync_config_v1',
  DEVICE_ID: 'calhabit_device_id_v1',
};

// 고유 디바이스 ID (자신의 변경사항으로 인한 불필요한 루프 방지)
export function getDeviceId(): string {
  let id = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, id);
  }
  return id;
}

// 기본 동기화 설정 로드
export function loadSyncConfig(): CloudSyncSettings {
  const saved = localStorage.getItem(STORAGE_KEYS.SYNC_CONFIG);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }

  // URL query params에서 자동 감지 (?syncKey=...&supabaseUrl=...)
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const urlSyncKey = params.get('syncKey');
    const urlProvider = params.get('provider') as 'supabase' | 'firebase' | null;
    const urlSupabaseUrl = params.get('sbUrl');
    const urlSupabaseKey = params.get('sbKey');
    const urlFbUrl = params.get('fbUrl');

    if (urlSyncKey) {
      const config: CloudSyncSettings = {
        enabled: true,
        provider: urlProvider || (urlSupabaseUrl ? 'supabase' : 'firebase'),
        syncKey: urlSyncKey,
        supabaseUrl: urlSupabaseUrl || '',
        supabaseAnonKey: urlSupabaseKey || '',
        firebaseRtdbUrl: urlFbUrl || '',
      };
      saveSyncConfig(config);
      return config;
    }
  }

  return {
    enabled: false,
    provider: 'supabase',
    syncKey: '',
    supabaseUrl: '',
    supabaseAnonKey: '',
    firebaseRtdbUrl: '',
  };
}

export function saveSyncConfig(config: CloudSyncSettings) {
  localStorage.setItem(STORAGE_KEYS.SYNC_CONFIG, JSON.stringify(config));
}

// 고유 랜덤 동기화 키 생성 (예: cal-7k9m2p)
export function generateRandomSyncKey(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let result = 'cal-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

let supabaseClient: SupabaseClient | null = null;
let cachedSbUrl = '';
let cachedSbKey = '';

function getSupabase(url: string, key: string): SupabaseClient | null {
  if (!url || !key) return null;
  if (!supabaseClient || cachedSbUrl !== url || cachedSbKey !== key) {
    try {
      supabaseClient = createClient(url, key, {
        auth: { persistSession: false },
      });
      cachedSbUrl = url;
      cachedSbKey = key;
    } catch (e) {
      console.error('Supabase client init failed', e);
      return null;
    }
  }
  return supabaseClient;
}

// 1. 클라우드로 업로드 (Push)
export async function pushToCloud(
  payload: Omit<SyncPayload, 'updatedAt' | 'sourceDeviceId'>,
  config: CloudSyncSettings
): Promise<{ success: boolean; error?: string }> {
  if (!config.enabled || !config.syncKey.trim()) {
    return { success: false, error: '동기화가 비활성화되어 있거나 동기화 키가 없습니다.' };
  }

  const fullPayload: SyncPayload = {
    ...payload,
    updatedAt: new Date().toISOString(),
    sourceDeviceId: getDeviceId(),
  };

  try {
    if (config.provider === 'supabase') {
      const client = getSupabase(config.supabaseUrl, config.supabaseAnonKey);
      if (!client) {
        return { success: false, error: 'Supabase URL 또는 API Key가 올바르지 않습니다.' };
      }

      const { error } = await client.from('calendars').upsert({
        id: config.syncKey.trim(),
        data: fullPayload,
        updated_at: fullPayload.updatedAt,
      });

      if (error) {
        return { success: false, error: error.message };
      }
    } else if (config.provider === 'firebase') {
      if (!config.firebaseRtdbUrl.trim()) {
        return { success: false, error: 'Firebase Realtime DB URL이 입력되지 않았습니다.' };
      }

      const base = config.firebaseRtdbUrl.trim().replace(/\/$/, '');
      const url = `${base}/calendars/${encodeURIComponent(config.syncKey.trim())}.json`;

      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: config.syncKey.trim(),
          data: fullPayload,
          updated_at: fullPayload.updatedAt,
        }),
      });

      if (!res.ok) {
        return { success: false, error: `Firebase HTTP Error: ${res.status}` };
      }
    }

    config.lastSyncedAt = fullPayload.updatedAt;
    saveSyncConfig(config);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || '네트워크 오류가 발생했습니다.' };
  }
}

// 2. 클라우드에서 최신 데이터 수신 (Pull)
export async function pullFromCloud(
  config: CloudSyncSettings
): Promise<{ success: boolean; data?: SyncPayload; error?: string }> {
  if (!config.enabled || !config.syncKey.trim()) {
    return { success: false, error: '동기화가 설정되지 않았습니다.' };
  }

  try {
    if (config.provider === 'supabase') {
      const client = getSupabase(config.supabaseUrl, config.supabaseAnonKey);
      if (!client) return { success: false, error: 'Supabase 설정 누락' };

      const { data, error } = await client
        .from('calendars')
        .select('data, updated_at')
        .eq('id', config.syncKey.trim())
        .maybeSingle();

      if (error) return { success: false, error: error.message };
      if (!data || !data.data) {
        return { success: false, error: '해당 키에 저장된 캘린더 데이터가 없습니다.' };
      }

      return { success: true, data: data.data as SyncPayload };
    } else if (config.provider === 'firebase') {
      const base = config.firebaseRtdbUrl.trim().replace(/\/$/, '');
      const url = `${base}/calendars/${encodeURIComponent(config.syncKey.trim())}.json`;

      const res = await fetch(url);
      if (!res.ok) return { success: false, error: `Firebase HTTP Error: ${res.status}` };

      const json = await res.json();
      if (!json || !json.data) {
        return { success: false, error: '해당 키에 저장된 데이터가 없습니다.' };
      }

      return { success: true, data: json.data as SyncPayload };
    }

    return { success: false, error: '지원하지 않는 프로바이더입니다.' };
  } catch (err: any) {
    return { success: false, error: err.message || '데이터를 가져오지 못했습니다.' };
  }
}

// 3. Supabase Realtime 채널 실시간 구독
let activeChannel: RealtimeChannel | null = null;

export function subscribeToSupabaseRealtime(
  config: CloudSyncSettings,
  onRemoteChange: (payload: SyncPayload) => void
): () => void {
  if (
    !config.enabled ||
    config.provider !== 'supabase' ||
    !config.supabaseUrl ||
    !config.supabaseAnonKey ||
    !config.syncKey.trim()
  ) {
    return () => {};
  }

  const client = getSupabase(config.supabaseUrl, config.supabaseAnonKey);
  if (!client) return () => {};

  if (activeChannel) {
    client.removeChannel(activeChannel);
    activeChannel = null;
  }

  const syncKey = config.syncKey.trim();
  const channel = client
    .channel(`cal-sync-${syncKey}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'calendars',
        filter: `id=eq.${syncKey}`,
      },
      payload => {
        const row = payload.new as any;
        if (row && row.data) {
          const remoteData = row.data as SyncPayload;
          // 자신이 방금 업로드한 변경사항은 무시하여 불필요한 루프 방지
          if (remoteData.sourceDeviceId !== getDeviceId()) {
            onRemoteChange(remoteData);
          }
        }
      }
    )
    .subscribe();

  activeChannel = channel;

  return () => {
    if (activeChannel && client) {
      client.removeChannel(activeChannel);
      activeChannel = null;
    }
  };
}
