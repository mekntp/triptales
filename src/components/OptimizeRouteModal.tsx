import React from 'react';
import type { Place } from '../types';
import { Sparkles, Check, X, TrendingDown, Clock } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface OptimizeRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalPlaces?: Place[];
  proposedPlaces: Place[];
  originalDistanceKm: number;
  optimizedDistanceKm: number;
  originalDurationMinutes: number;
  optimizedDurationMinutes: number;
  savingsDistanceKm: number;
  savingsDurationMinutes: number;
  isImproved: boolean;
  onApply: (reordered: Place[]) => void;
}

export const OptimizeRouteModal: React.FC<OptimizeRouteModalProps> = ({
  isOpen,
  onClose,
  proposedPlaces,
  originalDistanceKm,
  optimizedDistanceKm,
  originalDurationMinutes,
  optimizedDurationMinutes,
  savingsDistanceKm,
  savingsDurationMinutes,
  isImproved,
  onApply,
}) => {
  const { language, t, formatDuration } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-t-3xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-1.5 rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <h3 className="font-black text-base">{t('optTitle')}</h3>
          </div>
          <p className="text-xs text-blue-100">
            {t('optDesc')}
          </p>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Comparison Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Current */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
              <div className="text-[11px] font-bold text-slate-500 uppercase">{t('currentRoute')}</div>
              <div className="mt-1 text-base font-black text-slate-800">
                {originalDistanceKm} <span className="text-xs font-semibold text-slate-500">{t('kmUnit')}</span>
              </div>
              <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{formatDuration(originalDurationMinutes)}</span>
              </div>
            </div>

            {/* Suggested */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3">
              <div className="text-[11px] font-bold text-emerald-700 uppercase flex items-center gap-1">
                <span>{t('suggestedRoute')}</span>
                <Check className="w-3.5 h-3.5" />
              </div>
              <div className="mt-1 text-base font-black text-emerald-800">
                {optimizedDistanceKm} <span className="text-xs font-semibold text-emerald-600">{t('kmUnit')}</span>
              </div>
              <div className="text-[11px] text-emerald-700 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-emerald-600" />
                <span>{formatDuration(optimizedDurationMinutes)}</span>
              </div>
            </div>
          </div>

          {/* Savings Highlight Badge */}
          {isImproved ? (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-amber-950">
                  🎉 {t('savingsBanner', { km: savingsDistanceKm, time: formatDuration(savingsDurationMinutes) })}
                </div>
                <div className="text-[11px] text-amber-800 mt-0.5">
                  {t('savingsSub')}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center text-slate-600">
              {t('alreadyOptimal')}
            </div>
          )}

          {/* Transparent Estimation Disclaimer */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] text-slate-500 leading-relaxed flex items-start gap-1.5">
            <span className="shrink-0 text-slate-400">ℹ️</span>
            <span>{t('routeEstDisclaimer')}</span>
          </div>

          {/* Proposed Order List */}
          <div>
            <div className="font-bold text-slate-800 mb-2 flex items-center justify-between">
              <span>{t('proposedOrder')}</span>
              <span className="text-[11px] font-semibold text-slate-500">
                {proposedPlaces.filter((p) => p.status !== 'skipped').length}
              </span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {proposedPlaces
                .filter((p) => p.status !== 'skipped')
                .map((place, idx) => {
                  const placeName =
                    language === 'en' && place.nameEn
                      ? place.nameEn
                      : language === 'zh' && place.nameZh
                      ? place.nameZh
                      : place.name;

                  const placeSub =
                    language === 'en' && place.subtitleEn
                      ? place.subtitleEn
                      : language === 'zh' && place.subtitleZh
                      ? place.subtitleZh
                      : place.subtitle;

                  return (
                    <div
                      key={place.id}
                      className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-base shrink-0">{place.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-800 truncate text-xs">{placeName}</div>
                        <div className="text-[10px] text-slate-500 truncate">{placeSub}</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-2 border-t border-slate-100">
            <button
              onClick={() => onApply(proposedPlaces)}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{t('applyReorder')}</span>
            </button>

            <button
              onClick={onClose}
              className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
