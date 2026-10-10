import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Sparkles,
  Plus,
  Compass,
  Check,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import type { CitySearchResult, RecommendedPlace, PlaceCategory, Trip, Place } from '../types';
import { searchCities, getCityRecommendations } from '../lib/cityService';
import { useLanguage } from '../i18n/LanguageContext';

interface CityDiscoveryTabProps {
  trips: Trip[];
  activeTrip: Trip;
  onAddPlaceToTrip: (place: Omit<Place, 'id' | 'sortOrder'>, targetTripId: string) => void;
  onCreateTripFromCity: (city: CitySearchResult) => void;
}

const CATEGORIES: { id: PlaceCategory; labelKey: string; icon: string }[] = [
  { id: 'all', labelKey: 'catAll', icon: '🌟' },
  { id: 'attraction', labelKey: 'catAttraction', icon: '📍' },
  { id: 'culture', labelKey: 'catCulture', icon: '🏛️' },
  { id: 'nature', labelKey: 'catNature', icon: '🌳' },
  { id: 'family', labelKey: 'catFamily', icon: '🎡' },
  { id: 'market', labelKey: 'catMarket', icon: '🛍️' },
];

export const CityDiscoveryTab: React.FC<CityDiscoveryTabProps> = ({
  trips,
  activeTrip,
  onAddPlaceToTrip,
  onCreateTripFromCity,
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CitySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCity, setSelectedCity] = useState<CitySearchResult | null>(() => {
    // Default to active trip destination or Bangkok
    return {
      id: 'default_phichit',
      name: 'Phichit',
      displayName: 'Phichit, Thailand',
      country: 'Thailand',
      countryCode: 'TH',
      latitude: 16.4422,
      longitude: 100.3495,
      type: 'city',
    };
  });

  const [activeCategory, setActiveCategory] = useState<PlaceCategory>('all');
  const [recommendations, setRecommendations] = useState<RecommendedPlace[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [addedPlaceIds, setAddedPlaceIds] = useState<Set<string>>(new Set());
  const [targetTripId, setTargetTripId] = useState<string>(activeTrip.id);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchCities(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.warn('Search cities error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load recommendations when selected city changes
  useEffect(() => {
    if (!selectedCity) return;
    setIsLoadingRecs(true);
    getCityRecommendations(
      selectedCity.name,
      selectedCity.latitude,
      selectedCity.longitude,
      activeCategory
    )
      .then((recs) => {
        setRecommendations(recs);
      })
      .catch((err) => {
        console.warn('Failed to load recs:', err);
      })
      .finally(() => {
        setIsLoadingRecs(false);
      });
  }, [selectedCity, activeCategory]);

  const handleSelectCity = (city: CitySearchResult) => {
    setSelectedCity(city);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleAddRecommendation = (rec: RecommendedPlace) => {
    const newPlaceData: Omit<Place, 'id' | 'sortOrder'> = {
      tripId: targetTripId,
      name: rec.name,
      nameEn: rec.name,
      nameZh: rec.name,
      icon: rec.icon,
      subtitle: rec.categoryLabel,
      subtitleEn: rec.categoryLabel,
      subtitleZh: rec.categoryLabel,
      description: rec.description,
      descriptionEn: rec.description,
      descriptionZh: rec.description,
      tags: [rec.categoryLabel, rec.verifiedSource],
      googleMapsUrl: `https://maps.google.com/?q=${rec.latitude},${rec.longitude}`,
      latitude: rec.latitude,
      longitude: rec.longitude,
      status: 'planned',
      isFavoriteForKids: rec.isFamilyFriendly,
      durationMinutes: 45,
    };

    onAddPlaceToTrip(newPlaceData, targetTripId);
    setAddedPlaceIds((prev) => new Set([...prev, rec.id]));
  };

  return (
    <div className="space-y-4 pb-12 animate-fade-in">
      {/* Search Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-black text-slate-800 dark:text-slate-100">
            {t('cityDiscoveryTitle')}
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('cityDiscoverySubtitle')}
        </p>

        {/* Input Form */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchCityPlaceholder')}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl pl-9 pr-10 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
          {isSearching && (
            <RefreshCw className="w-4 h-4 text-amber-500 animate-spin absolute right-3 top-3" />
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-700 max-h-60 overflow-y-auto">
            {searchResults.map((city) => (
              <button
                key={city.id}
                onClick={() => handleSelectCity(city)}
                className="w-full p-3 text-left hover:bg-amber-50 dark:hover:bg-slate-700/50 flex items-center justify-between text-xs transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="truncate">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {city.name}
                    </span>
                    <span className="text-slate-400 text-[11px] ml-1.5 truncate">
                      ({city.country})
                    </span>
                    <p className="text-[10px] text-slate-400 truncate">{city.displayName}</p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected City Hero Banner & Action */}
      {selectedCity && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-5 text-white shadow-md space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                {selectedCity.countryCode || 'WORLD'}
              </span>
              <h3 className="text-xl font-black mt-1">{selectedCity.name}</h3>
              <p className="text-xs text-amber-100 font-medium truncate max-w-xs">
                {selectedCity.displayName}
              </p>
            </div>
            <button
              onClick={() => onCreateTripFromCity(selectedCity)}
              className="bg-white text-orange-950 px-3 py-2 rounded-2xl text-xs font-bold shadow-md hover:bg-amber-50 active:scale-95 transition-all flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('createTripFromCity')}</span>
            </button>
          </div>

          {/* Target trip selector for adding places */}
          <div className="pt-2 border-t border-white/20 flex items-center justify-between text-xs">
            <span className="text-[11px] text-amber-100 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              <span>{t('addToTripLabel')}:</span>
            </span>
            <select
              value={targetTripId}
              onChange={(e) => setTargetTripId(e.target.value)}
              className="bg-black/20 text-white rounded-xl px-2 py-1 text-xs border border-white/30 focus:outline-none"
            >
              {trips.map((t) => (
                <option key={t.id} value={t.id} className="text-slate-900">
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`py-1.5 px-3 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border ${
              activeCategory === cat.id
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{t(cat.labelKey as any)}</span>
          </button>
        ))}
      </div>

      {/* Recommendations List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{t('recommendedPlaces')}</span>
            <span className="text-[11px] text-slate-400 font-normal">
              ({recommendations.length})
            </span>
          </h4>
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>OSM Verified</span>
          </span>
        </div>

        {isLoadingRecs ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 text-center text-slate-400 border border-slate-200 dark:border-slate-700">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
            <p className="text-xs">{t('loadingRecommendations')}</p>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 text-center text-slate-400 border border-slate-200 dark:border-slate-700">
            <MapPin className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs font-semibold">{t('noRecommendationsFound')}</p>
          </div>
        ) : (
          recommendations.map((rec) => {
            const isAdded = addedPlaceIds.has(rec.id);
            return (
              <div
                key={rec.id}
                className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:border-amber-300 transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="text-2xl p-2 bg-amber-50 dark:bg-slate-700 rounded-2xl shrink-0">
                      {rec.icon}
                    </span>
                    <div>
                      <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                        {rec.name}
                      </h5>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-medium mt-1 inline-block">
                        {rec.categoryLabel}
                      </span>
                      {rec.isFamilyFriendly && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md font-bold ml-1 inline-block">
                          🧒 Kids Friendly
                        </span>
                      )}
                    </div>
                  </div>

                  <a
                    href={`https://maps.google.com/?q=${rec.latitude},${rec.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    title="View on Google Maps"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {rec.description}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 truncate max-w-44">
                    📍 {rec.address || selectedCity?.name || 'City Center'}
                  </span>

                  <button
                    onClick={() => handleAddRecommendation(rec)}
                    disabled={isAdded}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isAdded
                        ? 'bg-emerald-100 text-emerald-700 cursor-default'
                        : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs active:scale-95'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{t('addedToTrip')}</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t('addToTrip')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
