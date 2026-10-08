import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { ScheduleEvent, Habit, TodoItem, CategoryFolder, AppSettings } from '../types';

export interface SyncPayload {
  events: ScheduleEvent[];
  habits: Habit[];
  todos: TodoItem[];
  categories: CategoryFolder[];
  settings: Partial<AppSettings>;
  isTimelineOpen?: boolean;
  updatedAt: string;
  sourceDeviceId?: string;
}

export interface CloudSyncSettings {
  enabled: boolean;
  provider: 'realtime_channel' | 'supabase' | 'firebase';
  syncKey: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  firebaseRtdbUrl: string;
  lastSyncedAt?: string;
}

export const DEFAULT_MASTER_SYNC_KEY = 'calhabit_master_workspace';
const PERSISTENT_BACKUP_OBJECT_ID = 'ff808181a09d98f701a11a29fb571d38';

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

// 기본 동기화 설정 로드 (100% 무설정 자동 연결 지원)
export function loadSyncConfig(): CloudSyncSettings {
  const saved = localStorage.getItem(STORAGE_KEYS.SYNC_CONFIG);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // 기존에 syncKey가 없거나 enabled=false로 저장되어 있던 경우에도 기본 마스터 룸으로 자동 활성화
      if (!parsed.syncKey || parsed.syncKey.trim() === '') {
        parsed.syncKey = DEFAULT_MASTER_SYNC_KEY;
        parsed.enabled = true;
        parsed.provider = parsed.provider || 'realtime_channel';
        saveSyncConfig(parsed);
      }
      return parsed;
    } catch {
      // fallback
    }
  }

  // URL query params에서 감지 (?syncKey=...&provider=...)
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const urlSyncKey = params.get('syncKey');
    const urlProvider = params.get('provider') as any;
    const urlSupabaseUrl = params.get('sbUrl');
    const urlSupabaseKey = params.get('sbKey');
    const urlFbUrl = params.get('fbUrl');

    if (urlSyncKey) {
      const config: CloudSyncSettings = {
        enabled: true,
        provider: urlProvider || (urlSupabaseUrl ? 'supabase' : 'realtime_channel'),
        syncKey: urlSyncKey.trim(),
        supabaseUrl: urlSupabaseUrl || '',
        supabaseAnonKey: urlSupabaseKey || '',
        firebaseRtdbUrl: urlFbUrl || '',
      };
      saveSyncConfig(config);
      return config;
    }
  }

  // 기본값: 무설정 실시간 마스터 룸 자동 활성화
  const defaultConfig: CloudSyncSettings = {
    enabled: true,
    provider: 'realtime_channel',
    syncKey: DEFAULT_MASTER_SYNC_KEY,
    supabaseUrl: '',
    supabaseAnonKey: '',
    firebaseRtdbUrl: '',
  };
  saveSyncConfig(defaultConfig);
  return defaultConfig;
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

// 1. 클라우드로 업로드 (Push: 0.1~0.3초 내 전송)
export async function pushToCloud(
  payload: Omit<SyncPayload, 'updatedAt' | 'sourceDeviceId'>,
  config: CloudSyncSettings
): Promise<{ success: boolean; error?: string }> {
  if (!config.enabled) {
    return { success: false, error: '동기화가 비활성화되어 있습니다.' };
  }

  const syncKey = config.syncKey?.trim() || DEFAULT_MASTER_SYNC_KEY;

  const fullPayload: SyncPayload = {
    ...payload,
    updatedAt: new Date().toISOString(),
    sourceDeviceId: getDeviceId(),
  };

  try {
    if (config.provider === 'supabase' && config.supabaseUrl && config.supabaseAnonKey) {
      const client = getSupabase(config.supabaseUrl, config.supabaseAnonKey);
      if (!client) {
        return { success: false, error: 'Supabase URL 또는 API Key가 올바르지 않습니다.' };
      }

      const { error } = await client.from('calendars').upsert({
        id: syncKey,
        data: fullPayload,
        updated_at: fullPayload.updatedAt,
      });

      if (error) return { success: false, error: error.message };
    } else if (config.provider === 'firebase' && config.firebaseRtdbUrl) {
      const base = config.firebaseRtdbUrl.trim().replace(/\/$/, '');
      const url = `${base}/calendars/${encodeURIComponent(syncKey)}.json`;

      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: syncKey,
          data: fullPayload,
          updated_at: fullPayload.updatedAt,
        }),
      });

      if (!res.ok) return { success: false, error: `Firebase HTTP Error: ${res.status}` };
    } else {
      // 기본 Zero-Config 실시간 채널 전송
      const bodyStr = JSON.stringify(fullPayload);

      // (1) ntfy 초고속 실시간 Pub/Sub 발송 (< 150ms 수신)
      await fetch(`https://ntfy.sh/${encodeURIComponent(syncKey)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Title': 'CalHabit Sync',
        },
        body: bodyStr,
      });

      // (2) 영구 스냅샷 백업 저장 (비동기 병렬)
      if (syncKey === DEFAULT_MASTER_SYNC_KEY) {
        fetch(`https://api.restful-api.dev/objects/${PERSISTENT_BACKUP_OBJECT_ID}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: DEFAULT_MASTER_SYNC_KEY,
            data: fullPayload,
          }),
        }).catch(() => {});
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
  if (!config.enabled) {
    return { success: false, error: '동기화가 비활성화되어 있습니다.' };
  }

  const syncKey = config.syncKey?.trim() || DEFAULT_MASTER_SYNC_KEY;

  try {
    if (config.provider === 'supabase' && config.supabaseUrl && config.supabaseAnonKey) {
      const client = getSupabase(config.supabaseUrl, config.supabaseAnonKey);
      if (!client) return { success: false, error: 'Supabase 설정 누락' };

      const { data, error } = await client
        .from('calendars')
        .select('data, updated_at')
        .eq('id', syncKey)
        .maybeSingle();

      if (error) return { success: false, error: error.message };
      if (!data || !data.data) {
        return { success: false, error: '저장된 캘린더 데이터가 없습니다.' };
      }

      return { success: true, data: data.data as SyncPayload };
    } else if (config.provider === 'firebase' && config.firebaseRtdbUrl) {
      const base = config.firebaseRtdbUrl.trim().replace(/\/$/, '');
      const url = `${base}/calendars/${encodeURIComponent(syncKey)}.json`;

      const res = await fetch(url);
      if (!res.ok) return { success: false, error: `Firebase HTTP Error: ${res.status}` };

      const json = await res.json();
      if (!json || !json.data) {
        return { success: false, error: '저장된 데이터가 없습니다.' };
      }

      return { success: true, data: json.data as SyncPayload };
    } else {
      // 기본 Zero-Config 실시간 채널에서 수신
      let ntfyPayload: SyncPayload | null = null;
      let backupPayload: SyncPayload | null = null;

      // 1) ntfy 최근 캐시 메시지 확인
      try {
        const pollRes = await fetch(`https://ntfy.sh/${encodeURIComponent(syncKey)}/json?poll=1`);
        if (pollRes.ok) {
          const text = await pollRes.text();
          const lines = text.trim().split('\n').filter(Boolean);
          if (lines.length > 0) {
            const lastMsg = JSON.parse(lines[lines.length - 1]);
            if (lastMsg.attachment && lastMsg.attachment.url) {
              const attachRes = await fetch(lastMsg.attachment.url);
              ntfyPayload = await attachRes.json();
            } else if (lastMsg.message) {
              ntfyPayload = JSON.parse(lastMsg.message);
            }
          }
        }
      } catch (e) {
        console.warn('ntfy poll failed:', e);
      }

      // 2) 영구 스냅샷 백업 확인
      if (syncKey === DEFAULT_MASTER_SYNC_KEY) {
        try {
          const backupRes = await fetch(`https://api.restful-api.dev/objects/${PERSISTENT_BACKUP_OBJECT_ID}`);
          if (backupRes.ok) {
            const backupJson = await backupRes.json();
            if (backupJson && backupJson.data && backupJson.data.events) {
              backupPayload = backupJson.data as SyncPayload;
            }
          }
        } catch (e) {
          console.warn('backup pull failed:', e);
        }
      }

      // 두 소스 중 최신 데이터 선택
      let bestPayload: SyncPayload | null = null;
      if (ntfyPayload && backupPayload) {
        const ntfyTime = new Date(ntfyPayload.updatedAt || 0).getTime();
        const backupTime = new Date(backupPayload.updatedAt || 0).getTime();
        bestPayload = ntfyTime >= backupTime ? ntfyPayload : backupPayload;
      } else {
        bestPayload = ntfyPayload || backupPayload;
      }

      if (bestPayload) {
        return { success: true, data: bestPayload };
      }

      return { success: false, error: '동기화된 클라우드 데이터가 아직 없습니다.' };
    }
  } catch (err: any) {
    return { success: false, error: err.message || '데이터를 가져오지 못했습니다.' };
  }
}

// 3. 실시간 구독 리스너 (WebSockets 기반 < 0.2초 즉시 동기화)
let activeSupabaseChannel: RealtimeChannel | null = null;
let activeWs: WebSocket | null = null;
let reconnectTimer: any = null;

export function subscribeToRealtimeSync(
  config: CloudSyncSettings,
  onRemoteChange: (payload: SyncPayload) => void,
  onSyncRequest?: () => SyncPayload | null
): () => void {
  if (!config.enabled) {
    return () => {};
  }

  const syncKey = config.syncKey?.trim() || DEFAULT_MASTER_SYNC_KEY;

  // 1) Supabase Realtime인 경우
  if (config.provider === 'supabase' && config.supabaseUrl && config.supabaseAnonKey) {
    const client = getSupabase(config.supabaseUrl, config.supabaseAnonKey);
    if (!client) return () => {};

    if (activeSupabaseChannel) {
      client.removeChannel(activeSupabaseChannel);
      activeSupabaseChannel = null;
    }

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
            if (remoteData.sourceDeviceId !== getDeviceId()) {
              onRemoteChange(remoteData);
            }
          }
        }
      )
      .subscribe();

    activeSupabaseChannel = channel;

    return () => {
      if (activeSupabaseChannel && client) {
        client.removeChannel(activeSupabaseChannel);
        activeSupabaseChannel = null;
      }
    };
  }

  // 2) 기본 Zero-Config 웹소켓 실시간 연결 (ntfy.sh WebSocket)
  let isClosedIntentionally = false;

  const connectWebSocket = () => {
    if (isClosedIntentionally) return;

    if (activeWs) {
      try {
        activeWs.close();
      } catch {}
      activeWs = null;
    }

    try {
      const wsUrl = `wss://ntfy.sh/${encodeURIComponent(syncKey)}/ws`;
      const ws = new WebSocket(wsUrl);
      activeWs = ws;

      ws.onopen = () => {
        // 새 기기가 들어왔을 때, 이미 켜져 있는 다른 기기에게 최신 상태 요청
        fetch(`https://ntfy.sh/${encodeURIComponent(syncKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'SYNC_REQUEST',
            requesterDeviceId: getDeviceId(),
          }),
        }).catch(() => {});
      };

      ws.onmessage = async (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'message') {
            let payload: any = null;

            if (data.attachment && data.attachment.url) {
              const res = await fetch(data.attachment.url);
              payload = await res.json();
            } else if (data.message) {
              payload = JSON.parse(data.message);
            }

            if (!payload) return;

            // 다른 기기에서 상태 요청이 왔고 내가 최신 데이터를 가진 경우 응답 전송
            if (payload.type === 'SYNC_REQUEST' && payload.requesterDeviceId !== getDeviceId()) {
              if (onSyncRequest) {
                const currentData = onSyncRequest();
                if (currentData) {
                  fetch(`https://ntfy.sh/${encodeURIComponent(syncKey)}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      ...currentData,
                      sourceDeviceId: getDeviceId(),
                    }),
                  }).catch(() => {});
                }
              }
              return;
            }

            // 일반 동기화 페이로드 수신
            if (payload.events && Array.isArray(payload.events)) {
              if (payload.sourceDeviceId !== getDeviceId()) {
                onRemoteChange(payload as SyncPayload);
              }
            }
          }
        } catch (err) {
          console.warn('Realtime message processing failed:', err);
        }
      };

      ws.onerror = () => {
        // 웹소켓 에러 시 자동 재연결
      };

      ws.onclose = () => {
        if (!isClosedIntentionally) {
          clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(() => {
            connectWebSocket();
          }, 2000);
        }
      };
    } catch (e) {
      console.warn('WebSocket init error:', e);
    }
  };

  connectWebSocket();

  return () => {
    isClosedIntentionally = true;
    clearTimeout(reconnectTimer);
    if (activeWs) {
      try {
        activeWs.close();
      } catch {}
      activeWs = null;
    }
  };
}
