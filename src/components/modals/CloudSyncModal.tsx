import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CloudSyncSettings,
  saveSyncConfig,
  generateRandomSyncKey,
} from '../../services/cloudSync';
import {
  Cloud,
  CloudCheck,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Laptop,
  Database,
  X,
  Sparkles,
  Info,
} from 'lucide-react';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ isOpen, onClose }) => {
  const {
    syncConfig,
    syncStatus,
    syncError,
    lastSyncedAt,
    handleManualPush,
    handleManualPull,
    handleUpdateSyncConfig,
  } = useApp();

  const [provider, setProvider] = useState<'supabase' | 'firebase'>(syncConfig.provider || 'supabase');
  const [syncKey, setSyncKey] = useState<string>(syncConfig.syncKey || '');
  const [supabaseUrl, setSupabaseUrl] = useState<string>(syncConfig.supabaseUrl || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>(syncConfig.supabaseAnonKey || '');
  const [firebaseRtdbUrl, setFirebaseRtdbUrl] = useState<string>(syncConfig.firebaseRtdbUrl || '');

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // 모바일 접속용 Magic Link 생성
  const generateShareUrl = () => {
    if (typeof window === 'undefined') return '';
    const base = window.location.origin;
    const params = new URLSearchParams();
    if (syncKey.trim()) params.set('syncKey', syncKey.trim());
    params.set('provider', provider);
    if (provider === 'supabase') {
      if (supabaseUrl.trim()) params.set('sbUrl', supabaseUrl.trim());
      if (supabaseAnonKey.trim()) params.set('sbKey', supabaseAnonKey.trim());
    } else {
      if (firebaseRtdbUrl.trim()) params.set('fbUrl', firebaseRtdbUrl.trim());
    }
    return `${base}/?${params.toString()}`;
  };

  const handleCopyShareLink = () => {
    const url = generateShareUrl();
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyKey = () => {
    if (!syncKey.trim()) return;
    navigator.clipboard.writeText(syncKey.trim());
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopySql = () => {
    const sql = `-- Supabase SQL Editor에서 실행할 테이블 생성 쿼리
create table if not exists calendars (
  id text primary key,
  data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 실시간 Realtime 동기화 활성화
alter publication supabase_realtime add table calendars;`;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleGenerateKey = () => {
    const newKey = generateRandomSyncKey();
    setSyncKey(newKey);
  };

  // 설정 저장 및 즉시 동기화
  const handleSaveAndConnect = async () => {
    if (!syncKey.trim()) {
      setMessage('동기화 키를 입력하거나 자동 생성해 주세요.');
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    const newConfig: CloudSyncSettings = {
      enabled: true,
      provider,
      syncKey: syncKey.trim(),
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
      firebaseRtdbUrl: firebaseRtdbUrl.trim(),
    };

    handleUpdateSyncConfig(newConfig);

    // 즉시 클라우드로 업로드 시도
    const res = await handleManualPush();
    setIsProcessing(false);

    if (res.success) {
      setMessage('✅ 클라우드 데이터 동기화 연결 완료! 모바일에서도 동일한 키로 접속하세요.');
    } else {
      setMessage(`⚠️ 연결 오류: ${res.error || '설정값을 확인해 주세요.'}`);
    }
  };

  const handlePullClick = async () => {
    setIsProcessing(true);
    setMessage(null);
    const res = await handleManualPull();
    setIsProcessing(false);
    if (res.success) {
      setMessage('✅ 클라우드에서 최신 데이터를 성공적으로 불러왔습니다.');
    } else {
      setMessage(`⚠️ 불러오기 실패: ${res.error}`);
    }
  };

  const handlePushClick = async () => {
    setIsProcessing(true);
    setMessage(null);
    const res = await handleManualPush();
    setIsProcessing(false);
    if (res.success) {
      setMessage('✅ 현재 캘린더 데이터를 클라우드에 성공적으로 업로드했습니다.');
    } else {
      setMessage(`⚠️ 업로드 실패: ${res.error}`);
    }
  };

  const handleDisconnect = () => {
    const disabledConfig: CloudSyncSettings = {
      ...syncConfig,
      enabled: false,
    };
    handleUpdateSyncConfig(disabledConfig);
    setMessage('클라우드 동기화 연결이 해제되었습니다 (로컬 데이터는 유지됨).');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-800 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-zinc-800 shrink-0 bg-slate-50/50 dark:bg-zinc-850/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Cloud size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-zinc-100">
                실시간 클라우드 동기화 (Cloud Sync)
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                모바일(스마트폰)과 노트북 웹 간 실시간 양방향 데이터 연동
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 바디 컨텐츠 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* 1. 현재 동기화 상태 바 */}
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200/80 dark:border-zinc-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="relative flex h-3 w-3 shrink-0">
                {syncConfig.enabled && syncStatus === 'synced' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    !syncConfig.enabled
                      ? 'bg-gray-400'
                      : syncStatus === 'syncing'
                      ? 'bg-amber-400 animate-pulse'
                      : syncStatus === 'synced'
                      ? 'bg-emerald-500'
                      : 'bg-red-500'
                  }`}
                />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-bold text-gray-800 dark:text-zinc-200 truncate">
                  {!syncConfig.enabled
                    ? '동기화 미연결 (로컬 전용 모드)'
                    : syncStatus === 'syncing'
                    ? '동기화 데이터 전송 중...'
                    : syncStatus === 'synced'
                    ? '실시간 클라우드 동기화 활성'
                    : '동기화 오류'}
                </div>
                <div className="text-[10px] text-gray-500 dark:text-zinc-400 truncate">
                  {lastSyncedAt
                    ? `최근 동기화: ${new Date(lastSyncedAt).toLocaleTimeString()}`
                    : '아직 동기화된 내역이 없습니다.'}
                </div>
              </div>
            </div>

            {syncConfig.enabled && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handlePullClick}
                  disabled={isProcessing}
                  className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-white dark:bg-zinc-750 border border-gray-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 transition-colors shadow-2xs"
                  title="클라우드에서 최신 데이터 가져오기"
                >
                  가져오기
                </button>
                <button
                  type="button"
                  onClick={handlePushClick}
                  disabled={isProcessing}
                  className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-[#2196F3] text-white hover:bg-[#1E88E5] transition-colors shadow-2xs"
                  title="현재 데이터를 클라우드로 즉시 업로드"
                >
                  내보내기
                </button>
              </div>
            )}
          </div>

          {message && (
            <div className="p-3 text-xs rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 leading-relaxed animate-in fade-in">
              {message}
            </div>
          )}

          {/* 2. 고유 동기화 키 (Sync Key / Calendar ID) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300">
              고유 캘린더 동기화 키 (Calendar Key)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={syncKey}
                onChange={e => setSyncKey(e.target.value)}
                placeholder="예: glory1007 또는 cal-9x4k2m"
                className="flex-1 px-3 py-2 text-xs font-mono font-bold rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#2196F3]"
              />
              <button
                type="button"
                onClick={handleGenerateKey}
                className="px-2.5 py-2 text-xs font-semibold rounded-xl border border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 transition-colors shrink-0"
                title="랜덤 고유 키 생성"
              >
                <Sparkles size={13} className="inline mr-1 text-amber-500" />
                자동생성
              </button>
              <button
                type="button"
                onClick={handleCopyKey}
                className="px-2.5 py-2 text-xs font-semibold rounded-xl border border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 transition-colors shrink-0"
                title="키 복사"
              >
                {copiedKey ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </button>
            </div>
            <p className="text-[11px] text-gray-400">
              💡 모바일 스마트폰과 노트북 웹에서 <strong>동일한 키</strong>를 사용하면 서로 실시간 동기화됩니다.
            </p>
          </div>

          {/* 3. 모바일 원클릭 즉시 연동 공유 링크 (Magic Link) */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-zinc-850 dark:to-zinc-800 border border-blue-100 dark:border-zinc-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                <Smartphone size={14} />
                <span>모바일 원클릭 즉시 연동 링크</span>
              </span>
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all active:scale-95 shadow-xs"
              >
                {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedLink ? '복사 완료!' : '링크 복사'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
              복사한 링크를 카카오톡 또는 본인에게 보내 스마트폰에서 열면, <strong>별도 입력 없이 스마트폰 앱/웹이 즉시 동기화 모드로 연결</strong>됩니다.
            </p>
          </div>

          {/* 4. 클라우드 DB 제공자 선택 (Supabase / Firebase) */}
          <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-zinc-800">
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300">
              클라우드 데이터베이스 설정 (무료 티어)
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProvider('supabase')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  provider === 'supabase'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                    : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300'
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <Database size={13} className="text-emerald-500" />
                  <span>Supabase (권장)</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">PostgreSQL Realtime 실시간 동기화</div>
              </button>

              <button
                type="button"
                onClick={() => setProvider('firebase')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  provider === 'firebase'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20'
                    : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300'
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <Database size={13} className="text-amber-500" />
                  <span>Firebase RTDB</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">간편 Realtime Database REST</div>
              </button>
            </div>

            {provider === 'supabase' ? (
              <div className="space-y-2.5 p-3 rounded-2xl bg-gray-50/70 dark:bg-zinc-850/60 border border-gray-200 dark:border-zinc-750">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-zinc-400 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={e => setSupabaseUrl(e.target.value)}
                    placeholder="https://xxxxxxxx.supabase.co"
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-zinc-400 mb-1">
                    Supabase Anon Public API Key
                  </label>
                  <input
                    type="password"
                    value={supabaseAnonKey}
                    onChange={e => setSupabaseAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-gray-400">
                    Supabase 대시보드에서 1초 만에 테이블 생성하기:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                  >
                    {copiedSql ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedSql ? 'SQL 복사됨' : '테이블 SQL 복사'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 p-3 rounded-2xl bg-gray-50/70 dark:bg-zinc-850/60 border border-gray-200 dark:border-zinc-750">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-zinc-400 mb-1">
                    Firebase Realtime Database URL
                  </label>
                  <input
                    type="text"
                    value={firebaseRtdbUrl}
                    onChange={e => setFirebaseRtdbUrl(e.target.value)}
                    placeholder="https://your-app-default-rtdb.firebaseio.com"
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <p className="text-[10px] text-gray-400">
                  Firebase 콘솔에서 Realtime Database 생성 후 URL을 입력하시면 별도 테이블 없이 바로 동기화됩니다.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 푸터 버튼 */}
        <div className="p-3.5 sm:p-4 border-t border-gray-100 dark:border-zinc-800 shrink-0 flex items-center justify-between gap-2 bg-slate-50/50 dark:bg-zinc-850/50">
          {syncConfig.enabled ? (
            <button
              type="button"
              onClick={handleDisconnect}
              className="px-3 py-2 text-xs font-semibold rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              연결 해제
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={handleSaveAndConnect}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[#2196F3] hover:bg-[#1E88E5] text-white shadow-xs transition-transform active:scale-95 flex items-center gap-1.5"
            >
              {isProcessing && <RefreshCw size={13} className="animate-spin" />}
              <span>설정 저장 & 동기화 연결</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
