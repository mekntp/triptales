import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  Save,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Download,
  Upload,
  Shield,
  Globe,
  Lock,
  User as UserIcon,
  Mail,
  LogOut,
  Map,
  CloudDownload,
  AlertCircle,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  resetSupabaseClient,
  getSupabaseClient,
  getCurrentUser,
  signInWithOtp,
  signOut,
} from '../lib/supabase';
import { useLanguage } from '../i18n/LanguageContext';
import type { Language } from '../i18n/translations';
import type { Trip, SyncStatus } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trips: Trip[];
  activeTripId: string;
  onSelectTrip: (tripId: string) => void;
  onResetAllData: () => void;
  onExportBackup: () => void;
  onImportBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSyncToSupabase: () => Promise<void>;
  onRestoreFromSupabase: () => Promise<void>;
  isSyncing: boolean;
  isRestoring?: boolean;
  syncStatus?: SyncStatus;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  trips,
  activeTripId,
  onSelectTrip,
  onResetAllData,
  onExportBackup,
  onImportBackup,
  onSyncToSupabase,
  onRestoreFromSupabase,
  isSyncing,
  isRestoring = false,
  syncStatus = 'local_only',
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [config, setConfig] = useState(getStoredSupabaseConfig());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMsg, setAuthMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (isOpen) {
      getCurrentUser().then(setCurrentUser);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    saveSupabaseConfig(config);
    resetSupabaseClient();
    setSavedSuccess(true);
    getCurrentUser().then(setCurrentUser);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setAuthLoading(true);
    setAuthMsg(null);
    try {
      const { error } = await signInWithOtp(emailInput.trim());
      if (error) {
        setAuthMsg({ text: error.message, type: 'error' });
      } else {
        setAuthMsg({ text: t('magicLinkSent'), type: 'success' });
        setEmailInput('');
      }
    } catch (err) {
      setAuthMsg({ text: (err as Error).message, type: 'error' });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    setAuthLoading(true);
    await signOut();
    setCurrentUser(null);
    setAuthLoading(false);
  };

  const isConnected = !!getSupabaseClient();

  const LANGUAGES: { code: Language; label: string; flag: string }[] = [
    { code: 'th', label: 'ไทย', flag: '🇹🇭' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-800 text-base">{t('settingsTitle')}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 text-xs">
          {/* Trip Selector (Multi-Trip support) */}
          {trips.length > 1 && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-950">
                <Map className="w-4 h-4 text-amber-600" />
                <span>{t('switchTrip')}:</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {trips.map((trip) => {
                  const tripTitle =
                    language === 'en' && trip.nameEn
                      ? trip.nameEn
                      : language === 'zh' && trip.nameZh
                      ? trip.nameZh
                      : trip.name;
                  const isSelected = trip.id === activeTripId;

                  return (
                    <button
                      key={trip.id}
                      onClick={() => onSelectTrip(trip.id)}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-500 text-white border-amber-600 font-bold shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 font-medium'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="truncate text-xs">{tripTitle}</div>
                        <div className={`text-[10px] truncate ${isSelected ? 'text-amber-100' : 'text-slate-400'}`}>
                          {trip.subtitle}
                        </div>
                      </div>
                      {isSelected && (
                        <span className="shrink-0 text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                          ✓ {t('currentTrip')}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Language Selector */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Globe className="w-4 h-4 text-amber-600" />
              <span>Language / ภาษา / 语言:</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    language === lang.code
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs scale-102'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Offline-Ready Storage Notice */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-start gap-2.5 text-emerald-900">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{t('offlineFirstTitle')}</p>
              <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
                {t('offlineFirstDesc')}
              </p>
            </div>
          </div>

          {/* Supabase Cloud & Row Level Security (RLS) Section */}
          <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                <span>{t('authSection')}</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  currentUser
                    ? 'bg-emerald-100 text-emerald-700'
                    : syncStatus === 'synced'
                    ? 'bg-emerald-100 text-emerald-700'
                    : syncStatus === 'syncing'
                    ? 'bg-blue-100 text-blue-700'
                    : syncStatus === 'error'
                    ? 'bg-rose-100 text-rose-700'
                    : isConnected
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {currentUser
                  ? '✓ RLS Protected'
                  : syncStatus === 'synced'
                  ? '✓ Cloud Synced'
                  : syncStatus === 'syncing'
                  ? 'Syncing...'
                  : syncStatus === 'error'
                  ? 'Sync Error'
                  : isConnected
                  ? t('connected')
                  : t('localOnly')}
              </span>
            </div>

            {/* Auth User Info or Magic Link Login */}
            {currentUser ? (
              <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 text-slate-700">
                  <UserIcon className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold truncate">{currentUser.email || currentUser.id}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-emerald-700 font-medium">
                    🛡️ Private Cloud Sync Active
                  </span>
                  <button
                    onClick={handleSignOut}
                    disabled={authLoading}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>{t('signOut')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200">
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {t('guestModeDesc')}
                </p>
                {isConnected && (
                  <form onSubmit={handleSendMagicLink} className="space-y-2 pt-1">
                    <div className="flex gap-1.5">
                      <div className="relative flex-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="email"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder="parent@example.com"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={authLoading}
                        className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer transition-all disabled:opacity-50"
                      >
                        {authLoading ? '...' : t('sendMagicLink')}
                      </button>
                    </div>
                    {authMsg && (
                      <div
                        className={`text-[10px] font-semibold flex items-center gap-1 ${
                          authMsg.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {authMsg.type === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        <span>{authMsg.text}</span>
                      </div>
                    )}
                  </form>
                )}
              </div>
            )}

            {/* Cloud Sync & Restore Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={onSyncToSupabase}
                disabled={isSyncing || isRestoring}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                  isSyncing
                    ? 'bg-amber-300 text-amber-800 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? t('syncing') : t('syncToCloud')}</span>
              </button>

              <button
                onClick={async () => {
                  if (window.confirm(t('restoreConfirm'))) {
                    await onRestoreFromSupabase();
                  }
                }}
                disabled={isSyncing || isRestoring}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                  isRestoring
                    ? 'bg-blue-200 text-blue-800 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                }`}
              >
                <CloudDownload className={`w-3.5 h-3.5 ${isRestoring ? 'animate-bounce' : ''}`} />
                <span>{isRestoring ? 'Restoring...' : t('restoreFromCloud')}</span>
              </button>
            </div>

            {/* Config inputs (collapsible or available) */}
            <details className="pt-1">
              <summary className="text-[11px] text-slate-500 font-semibold cursor-pointer hover:text-slate-700">
                ⚙️ Supabase API Keys & URL
              </summary>
              <div className="space-y-2 mt-2 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1 text-[11px]">
                    Supabase Project URL:
                  </label>
                  <input
                    type="text"
                    value={config.url}
                    onChange={(e) => setConfig({ ...config, url: e.target.value })}
                    placeholder="https://your-project.supabase.co"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1 text-[11px]">
                    Supabase Anon Key:
                  </label>
                  <input
                    type="password"
                    value={config.anonKey}
                    onChange={(e) => setConfig({ ...config, anonKey: e.target.value })}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <button
                  onClick={handleSaveConfig}
                  className="w-full py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{t('saveSettings')}</span>
                </button>
              </div>
            </details>

            {savedSuccess && (
              <div className="text-emerald-600 text-xs flex items-center gap-1 font-semibold justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" /> {t('settingsSaved')}
              </div>
            )}
          </div>

          {/* Backup / Export Section */}
          <div className="space-y-2 pt-1">
            <span className="font-bold text-slate-700 block">{t('backupTitle')}</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onExportBackup}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t('exportBackup')}</span>
              </button>

              <label className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all text-center">
                <Upload className="w-3.5 h-3.5" />
                <span>{t('importBackup')}</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={onImportBackup}
                />
              </label>
            </div>
          </div>

          {/* GitHub Repo Link */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <span className="font-bold text-slate-700 block">🔗 {t('githubRepo')}:</span>
            <a
              href="https://github.com/mekntp/triptales"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
            >
              <span className="font-semibold text-slate-800">🐙 GitHub Repo</span>
              <span className="text-slate-400 text-[10px]">mekntp/triptales</span>
            </a>
          </div>

          {/* Reset All Progress Section */}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                if (window.confirm(t('resetConfirm'))) {
                  onResetAllData();
                }
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('resetTitle')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
