import React from 'react';
import { MapPin, Camera, BookOpen, Trophy, Settings } from 'lucide-react';

export type ActiveTab = 'places' | 'hunt' | 'journal';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  totalStars: number;
  completedCount: number;
  onOpenVictory: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  totalStars,
  completedCount,
  onOpenVictory,
  onOpenSettings,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-amber-200/60 shadow-xs">
      <div className="max-w-md mx-auto px-4 pt-3 pb-2">
        {/* Title Bar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl drop-shadow-xs">🚗</span>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-black text-slate-800 leading-tight">
                  TripTales
                </h1>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                  พิจิตร 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Plan the trip. Capture the memories.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Victory / Achievements button */}
            <button
              onClick={onOpenVictory}
              title="สรุปเหรียญรางวัล"
              className="relative p-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            >
              <Trophy className="w-5 h-5 text-amber-500" />
              {completedCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {completedCount}
                </span>
              )}
            </button>

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              title="ตั้งค่า & ซิงค์คลาวด์"
              className="p-2 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Buttons (3 Tabs) */}
        <div className="grid grid-cols-3 gap-1.5 bg-amber-100/60 p-1 rounded-2xl border border-amber-200/50">
          <button
            onClick={() => setActiveTab('places')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'places'
                ? 'bg-white text-amber-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className={`w-3.5 h-3.5 ${activeTab === 'places' ? 'text-amber-600' : 'text-slate-400'}`} />
            <span>แผนที่เที่ยว</span>
          </button>

          <button
            onClick={() => setActiveTab('hunt')}
            className={`flex items-center justify-center gap-1 py-2 px-2 rounded-xl font-bold text-xs transition-all cursor-pointer relative ${
              activeTab === 'hunt'
                ? 'bg-white text-orange-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className={`w-3.5 h-3.5 ${activeTab === 'hunt' ? 'text-orange-500' : 'text-slate-400'}`} />
            <span>Photo Hunt</span>
            {totalStars > 0 && (
              <span className="text-[10px] bg-amber-500 text-white font-black px-1.5 py-0.2 rounded-full">
                {totalStars}★
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('journal')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'journal'
                ? 'bg-white text-amber-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className={`w-3.5 h-3.5 ${activeTab === 'journal' ? 'text-amber-600' : 'text-slate-400'}`} />
            <span>บันทึกทริป</span>
          </button>
        </div>
      </div>
    </header>
  );
};
