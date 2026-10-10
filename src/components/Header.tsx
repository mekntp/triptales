import React from 'react';
import {
  MapPin,
  Camera,
  BookOpen,
  Trophy,
  Settings,
  Globe,
  Cloud,
  Check,
  RefreshCw,
  AlertCircle,
  Map,
  Compass,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import type { Language } from '../i18n/translations';
import type { SyncStatus, Trip } from '../types';

export type ActiveTab = 'trips' | 'places' | 'hunt' | 'journal' | 'discover';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  totalStars: number;
  completedCount: number;
  onOpenVictory: () => void;
  onOpenSettings: () => void;
  syncStatus?: SyncStatus;
  activeTrip?: Trip;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  totalStars,
  completedCount,
  onOpenVictory,
  onOpenSettings,
  syncStatus = 'local_only',
  activeTrip,
}) => {
  const { language, setLanguage, t } = useLanguage();

  const handleNextLanguage = () => {
    const cycle: Language[] = ['th', 'en', 'zh'];
    const nextIdx = (cycle.indexOf(language) + 1) % cycle.length;
    setLanguage(cycle[nextIdx]);
  };

  const tripDisplayName =
    activeTrip
      ? language === 'en' && activeTrip.nameEn
        ? activeTrip.nameEn
        : language === 'zh' && activeTrip.nameZh
        ? activeTrip.nameZh
        : activeTrip.name
      : t('tripBadge');

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-amber-200/60 dark:border-slate-800 shadow-xs">
      <div className="max-w-md mx-auto px-4 pt-3 pb-2">
        {/* Title Bar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl drop-shadow-xs">🚗</span>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight">
                  {t('appTitle')}
                </h1>
                <button
                  onClick={() => setActiveTab('trips')}
                  className="text-[10px] bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-800/60 text-amber-900 dark:text-amber-200 font-bold px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700 cursor-pointer transition-colors truncate max-w-32"
                  title="View all trips"
                >
                  {tripDisplayName}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-56">
                {t('tagline')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Sync status indicator */}
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 transition-all cursor-pointer flex items-center justify-center"
              title={
                syncStatus === 'synced'
                  ? 'Cloud Synced'
                  : syncStatus === 'syncing'
                  ? 'Syncing to cloud...'
                  : syncStatus === 'error'
                  ? 'Sync failed'
                  : 'Saved on device'
              }
            >
              {syncStatus === 'synced' && (
                <div className="flex items-center text-emerald-600 bg-emerald-50 dark:bg-emerald-950 p-1 rounded-lg">
                  <Cloud className="w-3.5 h-3.5" />
                  <Check className="w-2.5 h-2.5 -ml-1" />
                </div>
              )}
              {syncStatus === 'syncing' && (
                <div className="flex items-center text-blue-600 bg-blue-50 dark:bg-blue-950 p-1 rounded-lg">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                </div>
              )}
              {syncStatus === 'error' && (
                <div className="flex items-center text-rose-600 bg-rose-50 dark:bg-rose-950 p-1 rounded-lg">
                  <AlertCircle className="w-3.5 h-3.5" />
                </div>
              )}
              {syncStatus === 'local_only' && (
                <div className="flex items-center text-slate-400 p-1 rounded-lg">
                  <Cloud className="w-3.5 h-3.5" />
                </div>
              )}
            </button>

            {/* Language Switcher Pill */}
            <button
              onClick={handleNextLanguage}
              className="p-1.5 px-2 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 active:scale-95 transition-all flex items-center gap-1 text-[11px] font-black cursor-pointer shadow-2xs"
              title="Switch language / เปลี่ยนภาษา / 切换语言"
            >
              <Globe className="w-3.5 h-3.5 text-amber-500" />
              <span>{language === 'th' ? '🇹🇭 TH' : language === 'en' ? '🇺🇸 EN' : '🇨🇳 中'}</span>
            </button>

            {/* Victory / Achievements button */}
            <button
              onClick={onOpenVictory}
              title={t('victoryTitle')}
              className="relative p-2 rounded-2xl bg-amber-50 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-slate-700 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            >
              <Trophy className="w-4.5 h-4.5 text-amber-500" />
              {completedCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {completedCount}
                </span>
              )}
            </button>

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              title={t('settingsTitle')}
              className="p-2 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            >
              <Settings className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Buttons (5 Tabs: Trips, Places, Hunt, Journal, Discover) */}
        <div className="grid grid-cols-5 gap-1 bg-amber-100/60 dark:bg-slate-800 p-1 rounded-2xl border border-amber-200/50 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('trips')}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl font-bold text-[10px] transition-all cursor-pointer truncate ${
              activeTab === 'trips'
                ? 'bg-white dark:bg-slate-700 text-amber-950 dark:text-amber-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Map className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'trips' ? 'text-amber-500' : 'text-slate-400'}`} />
            <span className="truncate mt-0.5">{t('tabTrips')}</span>
          </button>

          <button
            onClick={() => setActiveTab('places')}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl font-bold text-[10px] transition-all cursor-pointer truncate ${
              activeTab === 'places'
                ? 'bg-white dark:bg-slate-700 text-amber-950 dark:text-amber-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <MapPin className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'places' ? 'text-amber-500' : 'text-slate-400'}`} />
            <span className="truncate mt-0.5">{t('tabPlaces')}</span>
          </button>

          <button
            onClick={() => setActiveTab('hunt')}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl font-bold text-[10px] transition-all cursor-pointer relative truncate ${
              activeTab === 'hunt'
                ? 'bg-white dark:bg-slate-700 text-orange-950 dark:text-orange-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Camera className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'hunt' ? 'text-orange-500' : 'text-slate-400'}`} />
            <span className="truncate mt-0.5">{t('tabHunt')}</span>
            {totalStars > 0 && (
              <span className="absolute top-0.5 right-0.5 text-[8px] bg-amber-500 text-white font-black px-1 rounded-full">
                {totalStars}★
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('journal')}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl font-bold text-[10px] transition-all cursor-pointer truncate ${
              activeTab === 'journal'
                ? 'bg-white dark:bg-slate-700 text-amber-950 dark:text-amber-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'journal' ? 'text-amber-500' : 'text-slate-400'}`} />
            <span className="truncate mt-0.5">{t('tabJournal')}</span>
          </button>

          <button
            onClick={() => setActiveTab('discover')}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl font-bold text-[10px] transition-all cursor-pointer truncate ${
              activeTab === 'discover'
                ? 'bg-white dark:bg-slate-700 text-amber-950 dark:text-amber-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Compass className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'discover' ? 'text-amber-500' : 'text-slate-400'}`} />
            <span className="truncate mt-0.5">{t('tabDiscover')}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
