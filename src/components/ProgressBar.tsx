import React from 'react';
import { Star, Award, Sparkles } from 'lucide-react';
import { getRank } from '../data/missions';
import { useLanguage } from '../i18n/LanguageContext';

interface ProgressBarProps {
  totalStars: number;
  completedCount: number;
  totalMissions: number;
  onOpenVictory: () => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  totalStars,
  completedCount,
  totalMissions,
  onOpenVictory,
}) => {
  const { language, t } = useLanguage();
  const currentRank = getRank(totalStars);
  const maxStars = Math.max(22, totalMissions * 3);
  const progressPercent = Math.min(100, Math.round((totalStars / maxStars) * 100));

  const rankTitle =
    language === 'en' && currentRank.titleEn
      ? currentRank.titleEn
      : language === 'zh' && currentRank.titleZh
      ? currentRank.titleZh
      : currentRank.title;

  const rankDesc =
    language === 'en' && currentRank.descriptionEn
      ? currentRank.descriptionEn
      : language === 'zh' && currentRank.descriptionZh
      ? currentRank.descriptionZh
      : currentRank.description;

  return (
    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-4 text-white shadow-md shadow-orange-500/15 mb-4 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
      <div className="absolute left-1/2 -top-10 w-24 h-24 rounded-full bg-yellow-300/20 blur-lg pointer-events-none" />

      {/* Main Score & Rank Row */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div>
          <div className="flex items-center gap-1.5 text-amber-100 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
            <span>{t('scavengerTitle')}</span>
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <div className="flex items-center gap-1">
              <Star className="w-6 h-6 fill-yellow-300 text-yellow-300 drop-shadow-xs" />
              <span className="text-2xl font-black tracking-tight">{totalStars}</span>
              <span className="text-amber-200 text-sm font-semibold">/ {maxStars} {t('stars')}</span>
            </div>
          </div>
        </div>

        {/* Current Rank Badge Button */}
        <button
          onClick={onOpenVictory}
          className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 px-3 py-1.5 rounded-2xl flex items-center gap-2 active:scale-95 transition-all text-left cursor-pointer"
        >
          <span className="text-2xl">{currentRank.badge}</span>
          <div>
            <div className="text-[10px] text-amber-100 font-medium leading-none">{t('rankPrefix')}</div>
            <div className="text-xs font-bold text-white leading-tight mt-0.5">{rankTitle}</div>
          </div>
        </button>
      </div>

      {/* Progress Bars */}
      <div className="space-y-1.5 relative z-10">
        <div className="flex justify-between items-center text-xs font-medium text-amber-100">
          <span>{t('completedMissions', { count: completedCount, total: totalMissions })}</span>
          <span className="font-bold text-white">{progressPercent}%</span>
        </div>

        <div className="w-full bg-black/20 rounded-full h-2.5 p-0.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-yellow-300 to-amber-200 h-full rounded-full transition-all duration-500 shadow-xs"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Quick encouragement note */}
      <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-amber-100 relative z-10">
        <span>{rankDesc}</span>
        {totalStars >= maxStars ? (
          <span className="font-bold text-yellow-200 flex items-center gap-1">
            <Award className="w-3.5 h-3.5" /> {t('allMissionsCompleted')}
          </span>
        ) : (
          <span className="text-amber-200">
            {t('starsToMaster', { count: Math.max(0, maxStars - totalStars) })}
          </span>
        )}
      </div>
    </div>
  );
};
