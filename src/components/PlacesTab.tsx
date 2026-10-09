import React, { useState } from 'react';
import type { Place, PlaceStatus } from '../types';
import {
  Navigation,
  Plus,
  Edit2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Heart,
  CheckCircle2,
  Clock,
  ArrowDown,
  CircleOff,
  Compass,
} from 'lucide-react';
import { RouteMap } from './RouteMap';
import { OptimizeRouteModal } from './OptimizeRouteModal';
import { EditPlaceModal } from './EditPlaceModal';
import {
  calculateRouteSummary,
  estimateDrivingDistanceAndTime,
  optimizePlacesOrder,
} from '../lib/route';
import { useLanguage } from '../i18n/LanguageContext';

interface PlacesTabProps {
  places: Place[];
  onUpdatePlaces: (newPlaces: Place[]) => void;
  onJumpToPhotoHunt?: (placeId?: string) => void;
}

export const PlacesTab: React.FC<PlacesTabProps> = ({
  places,
  onUpdatePlaces,
  onJumpToPhotoHunt,
}) => {
  const { language, t, formatDuration } = useLanguage();
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);

  // Calculate current route stats
  const routeSummary = calculateRouteSummary(places);

  // Pre-calculate optimization proposal
  const optimizationProposal = optimizePlacesOrder(places, true);

  // Status counters
  const visitedCount = places.filter((p) => p.status === 'visited').length;
  const activePlaces = places.filter((p) => p.status !== 'skipped');

  // Status toggle handler
  const handleStatusChange = (placeId: string, newStatus: PlaceStatus) => {
    const updated = places.map((p) => (p.id === placeId ? { ...p, status: newStatus } : p));
    onUpdatePlaces(updated);
  };

  // Reorder up / down (ideal for touch screens)
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= places.length) return;

    const copy = [...places];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    const reordered = copy.map((p, idx) => ({ ...p, sortOrder: idx + 1 }));
    onUpdatePlaces(reordered);
  };

  // Save place (add or update)
  const handleSavePlace = (savedPlace: Place) => {
    const exists = places.some((p) => p.id === savedPlace.id);
    let nextPlaces: Place[];
    if (exists) {
      nextPlaces = places.map((p) => (p.id === savedPlace.id ? savedPlace : p));
    } else {
      nextPlaces = [...places, { ...savedPlace, sortOrder: places.length + 1 }];
    }
    onUpdatePlaces(nextPlaces);
  };

  // Delete place
  const handleDeletePlace = (placeId: string) => {
    const nextPlaces = places
      .filter((p) => p.id !== placeId)
      .map((p, idx) => ({ ...p, sortOrder: idx + 1 }));
    onUpdatePlaces(nextPlaces);
  };

  // Apply route optimization
  const handleApplyOptimization = (proposed: Place[]) => {
    onUpdatePlaces(proposed);
    setIsOptimizeModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Route Quick Summary Bar */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-4 text-white shadow-md shadow-orange-500/15 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-amber-100 text-xs font-semibold uppercase">
            <Compass className="w-4 h-4 text-yellow-200" />
            <span>{t('routeSummary')}</span>
          </div>

          <div className="text-[11px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
            {t('checkedIn', { visited: visitedCount, total: places.length })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-2.5 border border-white/20">
            <div className="text-[10px] text-amber-100 uppercase font-semibold">{t('totalDistance')}</div>
            <div className="text-xl font-black text-white mt-0.5">
              {routeSummary.totalDistanceKm}{' '}
              <span className="text-xs font-normal text-amber-200">{t('kmUnit')}</span>
            </div>
          </div>

          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-2.5 border border-white/20">
            <div className="text-[10px] text-amber-100 uppercase font-semibold">{t('estDriveTime')}</div>
            <div className="text-xl font-black text-white mt-0.5">
              {formatDuration(routeSummary.totalDurationMinutes)}
            </div>
          </div>
        </div>

        {/* Optimize Route Button */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setIsOptimizeModalOpen(true)}
            className="flex-1 py-2.5 px-3 rounded-2xl bg-white hover:bg-amber-50 active:scale-98 text-amber-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-orange-600 fill-orange-600" />
            <span>{t('optimizeRoute')}</span>
            {optimizationProposal.isImproved && (
              <span className="bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {t('savedKm', { km: optimizationProposal.savingsDistanceKm })}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setEditingPlace(null);
              setIsEditModalOpen(true);
            }}
            className="py-2.5 px-3 rounded-2xl bg-black/20 hover:bg-black/30 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
            title={t('addStop')}
          >
            <Plus className="w-4 h-4" />
            <span>{t('addStop')}</span>
          </button>
        </div>
      </div>

      {/* Interactive Map Preview Card */}
      {showMap && (
        <RouteMap
          places={places}
          routeSummary={routeSummary}
          selectedPlaceId={selectedPlaceId}
          onSelectPlace={(id) => setSelectedPlaceId(id)}
        />
      )}

      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
          {t('itineraryHeader', { count: activePlaces.length })}
        </div>
        <button
          onClick={() => setShowMap(!showMap)}
          className="text-xs font-semibold text-amber-700 hover:text-amber-800 cursor-pointer"
        >
          {showMap ? t('hideMap') : t('showMap')}
        </button>
      </div>

      {/* Places List */}
      <div className="space-y-3">
        {places.map((place, index) => {
          const isVisited = place.status === 'visited';
          const isSkipped = place.status === 'skipped';
          const isSelected = selectedPlaceId === place.id;
          const isLast = index === places.length - 1;

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

          const placeDesc =
            language === 'en' && place.descriptionEn
              ? place.descriptionEn
              : language === 'zh' && place.descriptionZh
              ? place.descriptionZh
              : place.description;

          // Calculate leg to next place if available
          let nextLeg = null;
          if (
            !isLast &&
            !isSkipped &&
            places[index + 1].status !== 'skipped' &&
            place.latitude &&
            place.longitude &&
            places[index + 1].latitude &&
            places[index + 1].longitude
          ) {
            nextLeg = estimateDrivingDistanceAndTime(
              place.latitude,
              place.longitude,
              places[index + 1].latitude!,
              places[index + 1].longitude!
            );
          }

          return (
            <div key={place.id} className="relative">
              {/* Place Card */}
              <div
                onClick={() => setSelectedPlaceId(place.id)}
                className={`rounded-3xl p-4 transition-all duration-200 border cursor-pointer ${
                  isSkipped
                    ? 'bg-slate-100/80 border-slate-200 opacity-60'
                    : isVisited
                    ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                    : isSelected
                    ? 'bg-white border-amber-400 ring-2 ring-amber-400/30 shadow-md'
                    : 'bg-white border-amber-100 shadow-xs hover:border-amber-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Number Badge & Icon */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs ${
                        isSkipped
                          ? 'bg-slate-200 text-slate-400'
                          : isVisited
                          ? 'bg-emerald-100 border border-emerald-300'
                          : 'bg-amber-50 border border-amber-200'
                      }`}
                    >
                      {place.icon}
                    </div>
                    <span
                      className={`absolute -top-1.5 -left-1.5 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white ${
                        isSkipped
                          ? 'bg-slate-400 text-white'
                          : isVisited
                          ? 'bg-emerald-600 text-white'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {index + 1}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3
                            className={`font-bold text-base leading-snug ${
                              isSkipped ? 'line-through text-slate-400' : 'text-slate-900'
                            }`}
                          >
                            {placeName}
                          </h3>
                          {place.isFavoriteForKids && (
                            <span className="inline-flex items-center gap-0.5 bg-rose-50 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200">
                              <Heart className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
                              {t('kidsLove')}
                            </span>
                          )}
                        </div>
                        {placeSub && (
                          <p className="text-xs text-amber-700 font-medium mt-0.5">
                            {placeSub}
                          </p>
                        )}
                      </div>

                      {/* Move Up/Down Controls for mobile touch */}
                      <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          disabled={index === 0}
                          onClick={() => handleMove(index, 'up')}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          disabled={index === places.length - 1}
                          onClick={() => handleMove(index, 'down')}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingPlace(place);
                            setIsEditModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-amber-600 cursor-pointer ml-1"
                          title={t('editPlaceTitle')}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {placeDesc && (
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        {placeDesc}
                      </p>
                    )}

                    {/* Status Pill Toggle Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                      {/* Planned Button */}
                      <button
                        onClick={() => handleStatusChange(place.id, 'planned')}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          place.status === 'planned'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {t('planned')}
                      </button>

                      {/* Visited Button */}
                      <button
                        onClick={() => handleStatusChange(place.id, 'visited')}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          place.status === 'visited'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t('visited')}</span>
                      </button>

                      {/* Skipped Button */}
                      <button
                        onClick={() =>
                          handleStatusChange(place.id, place.status === 'skipped' ? 'planned' : 'skipped')
                        }
                        className={`px-2 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          place.status === 'skipped'
                            ? 'bg-slate-600 text-white'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        <CircleOff className="w-3 h-3" />
                        <span>{t('skipped')}</span>
                      </button>

                      {/* Actions */}
                      <div className="ml-auto flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onJumpToPhotoHunt?.(place.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 cursor-pointer"
                          title={t('jumpToMission')}
                        >
                          <span>📸 {t('jumpToMission')}</span>
                        </button>

                        <a
                          href={place.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 cursor-pointer"
                        >
                          <Navigation className="w-3 h-3 text-blue-600" />
                          <span>{t('navigate')}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Driving distance / time between this place and the next */}
              {nextLeg && (
                <div className="flex items-center justify-center my-1.5 relative z-0">
                  <div className="bg-amber-100/90 border border-amber-300 text-amber-900 rounded-full px-3 py-1 text-[11px] font-bold flex items-center gap-1.5 shadow-2xs">
                    <ArrowDown className="w-3 h-3 text-amber-600" />
                    <span>{t('drive', { km: nextLeg.distanceKm, time: formatDuration(nextLeg.durationMinutes) })}</span>
                    <span>•</span>
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>~{formatDuration(nextLeg.durationMinutes)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Add Place Button */}
      <div className="pt-2">
        <button
          onClick={() => {
            setEditingPlace(null);
            setIsEditModalOpen(true);
          }}
          className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-amber-50 text-amber-900 font-bold text-xs border-2 border-dashed border-amber-300 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs active:scale-98"
        >
          <Plus className="w-4 h-4 text-amber-600" />
          <span>{t('addNewPlaceCard')}</span>
        </button>
      </div>

      {/* Optimization Modal */}
      <OptimizeRouteModal
        isOpen={isOptimizeModalOpen}
        onClose={() => setIsOptimizeModalOpen(false)}
        originalPlaces={places}
        proposedPlaces={optimizationProposal.proposedPlaces}
        originalDistanceKm={optimizationProposal.originalDistanceKm}
        optimizedDistanceKm={optimizationProposal.optimizedDistanceKm}
        originalDurationMinutes={optimizationProposal.originalDurationMinutes}
        optimizedDurationMinutes={optimizationProposal.optimizedDurationMinutes}
        savingsDistanceKm={optimizationProposal.savingsDistanceKm}
        savingsDurationMinutes={optimizationProposal.savingsDurationMinutes}
        isImproved={optimizationProposal.isImproved}
        onApply={handleApplyOptimization}
      />

      {/* Edit / Add Place Modal */}
      <EditPlaceModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPlace(null);
        }}
        place={editingPlace}
        onSave={handleSavePlace}
        onDelete={handleDeletePlace}
      />
    </div>
  );
};
