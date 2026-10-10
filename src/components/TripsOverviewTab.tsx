import React, { useState } from 'react';
import {
  Map,
  Plus,
  Calendar,
  CheckCircle2,
  Archive,
  Trash2,
  Copy,
  Edit3,
  MapPin,
  ArrowRight,
  Search,
} from 'lucide-react';
import type { Trip } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface TripsOverviewTabProps {
  trips: Trip[];
  activeTripId: string;
  onSelectTrip: (tripId: string) => void;
  onCreateTrip: (trip: Omit<Trip, 'id'>) => void;
  onUpdateTrip: (trip: Trip) => void;
  onDuplicateTrip: (tripId: string) => void;
  onArchiveTrip: (tripId: string) => void;
  onDeleteTrip: (tripId: string) => void;
}

export const TripsOverviewTab: React.FC<TripsOverviewTabProps> = ({
  trips,
  activeTripId,
  onSelectTrip,
  onCreateTrip,
  onUpdateTrip,
  onDuplicateTrip,
  onArchiveTrip,
  onDeleteTrip,
}) => {
  const { t, language } = useLanguage();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');

  const openCreateModal = () => {
    setName('');
    setDestinationCity('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setSubtitle('');
    setDescription('');
    setIsCreateOpen(true);
  };

  const openEditModal = (trip: Trip) => {
    setEditingTrip(trip);
    setName(trip.name);
    setDestinationCity(trip.destinationCity || '');
    setStartDate(trip.startDate || '');
    setEndDate(trip.endDate || '');
    setSubtitle(trip.subtitle || '');
    setDescription(trip.description || '');
  };

  const handleSaveTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingTrip) {
      onUpdateTrip({
        ...editingTrip,
        name: name.trim(),
        nameEn: name.trim(),
        destinationCity: destinationCity.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        subtitle: subtitle.trim() || destinationCity.trim() || 'Trip Itinerary',
        description: description.trim(),
        updatedAt: new Date().toISOString(),
      });
      setEditingTrip(null);
    } else {
      onCreateTrip({
        name: name.trim(),
        nameEn: name.trim(),
        destinationCity: destinationCity.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        subtitle: subtitle.trim() || destinationCity.trim() || 'Family Vacation 2026',
        description: description.trim(),
        status: 'upcoming',
        coverImage:
          'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setIsCreateOpen(false);
    }
  };

  const filteredTrips = trips.filter((t) => {
    if (t.isDeleted) return false;
    if (statusFilter === 'archived' && t.status !== 'archived') return false;
    if (statusFilter === 'active' && t.status === 'archived') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = t.name.toLowerCase().includes(q);
      const matchCity = (t.destinationCity || '').toLowerCase().includes(q);
      const matchDesc = (t.description || '').toLowerCase().includes(q);
      return matchName || matchCity || matchDesc;
    }
    return true;
  });

  return (
    <div className="space-y-4 pb-12 animate-fade-in">
      {/* Top Banner & Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Map className="w-5 h-5 text-amber-500" />
            <span>{t('myTripsTitle')}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('myTripsSubtitle')}
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-3.5 py-2 rounded-2xl shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('newTripBtn')}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchTripsPlaceholder')}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {t('filterAllTrips')}
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {t('filterActiveTrips')}
          </button>
          <button
            onClick={() => setStatusFilter('archived')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'archived'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {t('filterArchivedTrips')}
          </button>
        </div>
      </div>

      {/* Trips Cards List */}
      <div className="space-y-3">
        {filteredTrips.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 text-center border border-slate-200 dark:border-slate-700 space-y-3">
            <Map className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h4 className="font-bold text-slate-700 dark:text-slate-300 text-xs">
              {t('noTripsFound')}
            </h4>
            <p className="text-[11px] text-slate-400">
              {t('noTripsHint')}
            </p>
            <button
              onClick={openCreateModal}
              className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('createFirstTrip')}</span>
            </button>
          </div>
        ) : (
          filteredTrips.map((trip) => {
            const isActive = trip.id === activeTripId;
            const tripTitle =
              language === 'en' && trip.nameEn
                ? trip.nameEn
                : language === 'zh' && trip.nameZh
                ? trip.nameZh
                : trip.name;

            return (
              <div
                key={trip.id}
                className={`bg-white dark:bg-slate-800 rounded-3xl p-4 border transition-all space-y-3 shadow-xs ${
                  isActive
                    ? 'border-amber-400 ring-2 ring-amber-400/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                {/* Trip Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 truncate">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm truncate">
                        {tripTitle}
                      </h3>
                      {isActive && (
                        <span className="shrink-0 text-[10px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full shadow-2xs">
                          ✓ {t('activeBadge')}
                        </span>
                      )}
                      {trip.status === 'archived' && (
                        <span className="shrink-0 text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                          {t('archivedBadge')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {trip.destinationCity && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-500" />
                          <span>{trip.destinationCity}</span>
                        </span>
                      )}
                      {trip.startDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{trip.startDate}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Dropdown / Quick Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(trip)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                      title={t('editTrip')}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDuplicateTrip(trip.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                      title={t('duplicateTrip')}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onArchiveTrip(trip.id)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                      title={trip.status === 'archived' ? t('restoreTrip') : t('archiveTrip')}
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                    {trips.length > 1 && (
                      <button
                        onClick={() => {
                          if (window.confirm(t('deleteTripConfirm', { name: trip.name }))) {
                            onDeleteTrip(trip.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                        title={t('deleteTrip')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                  {trip.description || trip.subtitle}
                </p>

                {/* Footer with Select / Continue Button */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400">
                    {trip.updatedAt ? `Updated ${trip.updatedAt.slice(0, 10)}` : ''}
                  </span>

                  {isActive ? (
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t('currentlyPlanning')}</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => onSelectTrip(trip.id)}
                      className="bg-slate-100 dark:bg-slate-700 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <span>{t('openTrip')}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Trip Modal */}
      {(isCreateOpen || editingTrip) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
              {editingTrip ? t('editTripTitle') : t('newTripModalTitle')}
            </h3>

            <form onSubmit={handleSaveTrip} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {t('tripNameLabel')} *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Phichit Adventure 2026"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {t('destinationCityLabel')}
                </label>
                <input
                  type="text"
                  value={destinationCity}
                  onChange={(e) => setDestinationCity(e.target.value)}
                  placeholder="e.g. Phichit / Bangkok / Tokyo"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {t('startDateLabel')}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {t('endDateLabel')}
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {t('subtitleLabel')}
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Short tagline or motto"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {t('descLabel')}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this trip about?"
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingTrip(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer hover:bg-slate-200"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold cursor-pointer shadow-xs"
                >
                  {t('savePlace')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
