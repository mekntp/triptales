import React, { useState, useEffect, useRef } from 'react';
import { Analytics } from '@vercel/analytics/react';
import type { Place, MissionState, TripJournal, Trip, SyncStatus } from './types';
import { INITIAL_PLACES, INITIAL_TRIPS } from './data/places';
import { INITIAL_PHOTO_MISSIONS } from './data/missions';
import { Header, type ActiveTab } from './components/Header';
import { ProgressBar } from './components/ProgressBar';
import { PlacesTab } from './components/PlacesTab';
import { PhotoHuntTab } from './components/PhotoHuntTab';
import { JournalTab } from './components/JournalTab';
import { VictoryModal } from './components/VictoryModal';
import { PhotoModal } from './components/PhotoModal';
import { SettingsModal } from './components/SettingsModal';
import { ExitConfirmModal } from './components/ExitConfirmModal';
import {
  saveMissionPhotosToDB,
  getAllMissionPhotosFromDB,
  savePlacesToDB,
  getPlacesFromDB,
  saveJournalToDB,
  getAllJournalsFromDB,
  getAllTripsFromDB,
  saveTripToDB,
  clearAllLocalData,
} from './lib/db';
import {
  uploadPhotoToSupabase,
  syncAllToSupabase,
  restoreAllFromSupabase,
  getSupabaseClient,
  onAuthStateChange,
} from './lib/supabase';
import { useLanguage } from './i18n/LanguageContext';

export function App() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<ActiveTab>('places');

  // Multi-Trip State
  const [trips, setTrips] = useState<Trip[]>(INITIAL_TRIPS);
  const [activeTripId, setActiveTripId] = useState<string>(() => {
    return localStorage.getItem('triptales_active_trip_id') || INITIAL_TRIPS[0].id;
  });

  const activeTrip = trips.find((t) => t.id === activeTripId) || trips[0] || INITIAL_TRIPS[0];

  // Places itinerary state (persisted per trip)
  const [places, setPlaces] = useState<Place[]>(() => {
    try {
      const saved = localStorage.getItem(`triptales_places_${activeTripId}`);
      if (saved) return JSON.parse(saved);
      // Legacy fallback
      const legacy = localStorage.getItem('triptales_places');
      return legacy ? JSON.parse(legacy) : INITIAL_PLACES;
    } catch {
      return INITIAL_PLACES;
    }
  });

  // Photo missions progress state (persisted per trip)
  const [missionStates, setMissionStates] = useState<Record<number, MissionState>>(() => {
    try {
      const saved = localStorage.getItem(`triptales_mission_states_${activeTripId}`);
      if (saved) return JSON.parse(saved);
      // Legacy fallback
      const legacy = localStorage.getItem('triptales_mission_states');
      return legacy ? JSON.parse(legacy) : {};
    } catch {
      return {};
    }
  });

  // Daily trip journal state
  const [currentJournal, setCurrentJournal] = useState<TripJournal>(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      id: `${activeTripId}_${today}`,
      tripId: activeTripId,
      date: today,
      note: '',
      mood: '😄',
      updatedAt: new Date().toISOString(),
    };
  });
  const [allJournals, setAllJournals] = useState<TripJournal[]>([]);

  // Modals state
  const [isVictoryOpen, setIsVictoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string } | null>(null);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);

  // Sync state
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('local_only');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Unsaved / active editing flag for exit warning
  const [hasUnsavedEdits] = useState(false);

  // Refs for tracking open modals in popstate event listener
  const previewPhotoRef = useRef(previewPhoto);
  const isVictoryOpenRef = useRef(isVictoryOpen);
  const isSettingsOpenRef = useRef(isSettingsOpen);
  const isExitConfirmOpenRef = useRef(isExitConfirmOpen);

  useEffect(() => {
    previewPhotoRef.current = previewPhoto;
    isVictoryOpenRef.current = isVictoryOpen;
    isSettingsOpenRef.current = isSettingsOpen;
    isExitConfirmOpenRef.current = isExitConfirmOpen;
  }, [previewPhoto, isVictoryOpen, isSettingsOpen, isExitConfirmOpen]);

  const isExitingRef = useRef(false);

  // ==================== BROWSER BACK BUTTON HANDLING ====================
  useEffect(() => {
    // Establish initial history entry for PWA Back button interception
    window.history.pushState({ triptalesApp: true }, '');

    const handlePopState = () => {
      // If user deliberately confirmed exit, allow navigation
      if (isExitingRef.current) {
        return;
      }

      // Priority 1: Close topmost photo modal if open
      if (previewPhotoRef.current) {
        setPreviewPhoto(null);
        window.history.pushState({ triptalesApp: true }, '');
        return;
      }

      // Priority 2: Close Victory modal if open
      if (isVictoryOpenRef.current) {
        setIsVictoryOpen(false);
        window.history.pushState({ triptalesApp: true }, '');
        return;
      }

      // Priority 3: Close Settings modal if open
      if (isSettingsOpenRef.current) {
        setIsSettingsOpen(false);
        window.history.pushState({ triptalesApp: true }, '');
        return;
      }

      // Priority 4: If Exit Confirm dialog is already open, Stay by closing it
      if (isExitConfirmOpenRef.current) {
        setIsExitConfirmOpen(false);
        window.history.pushState({ triptalesApp: true }, '');
        return;
      }

      // Priority 5: At base app level -> Display Exit Confirmation Dialog
      setIsExitConfirmOpen(true);
      window.history.pushState({ triptalesApp: true }, '');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleStayInApp = () => {
    setIsExitConfirmOpen(false);
  };

  const handleExitApp = () => {
    isExitingRef.current = true;
    setIsExitConfirmOpen(false);
    window.history.back();
  };

  // ==================== LOAD LOCAL & INDEXEDDB DATA ====================
  useEffect(() => {
    async function initData() {
      // 1. Load Trips from DB
      const dbTrips = await getAllTripsFromDB();
      if (dbTrips && dbTrips.length > 0) {
        setTrips(dbTrips);
      } else {
        // Seed default trips to DB
        for (const t of INITIAL_TRIPS) {
          await saveTripToDB(t);
        }
      }

      // 2. Load Places for active trip
      const dbPlaces = await getPlacesFromDB(activeTripId);
      if (dbPlaces && dbPlaces.length > 0) {
        setPlaces(dbPlaces);
      } else if (activeTripId === 'phichit-2026') {
        setPlaces(INITIAL_PLACES);
        await savePlacesToDB(INITIAL_PLACES, activeTripId);
      }

      // 3. Load Photos for active trip
      const storedPhotos = await getAllMissionPhotosFromDB(activeTripId);
      if (Object.keys(storedPhotos).length > 0) {
        setMissionStates((prev) => {
          const next = { ...prev };
          let changed = false;
          for (const [mId, photoList] of Object.entries(storedPhotos)) {
            const id = Number(mId);
            const existing = next[id] || {
              missionId: id,
              tripId: activeTripId,
              completed: true,
              stars: 2,
              photos: [],
            };
            if (!existing.photos || existing.photos.length === 0) {
              next[id] = {
                ...existing,
                photos: photoList,
                completed: true,
              };
              changed = true;
            }
          }
          return changed ? next : prev;
        });
      }

      // 4. Load Journals for active trip
      const dbJournals = await getAllJournalsFromDB(activeTripId);
      if (dbJournals && dbJournals.length > 0) {
        setAllJournals(dbJournals);
        const todayDate = new Date().toISOString().split('T')[0];
        const todayEntry = dbJournals.find((j) => j.date === todayDate);
        if (todayEntry) setCurrentJournal(todayEntry);
      }

      // 5. Check Supabase connection
      const client = getSupabaseClient();
      if (client) {
        setSyncStatus('synced');
      }
    }

    initData();
  }, [activeTripId]);

  // Listen to Supabase auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        setSyncStatus('synced');
      }
    });
    return () => unsubscribe();
  }, []);

  // ==================== SWITCH TRIP ====================
  const handleSelectTrip = async (tripId: string) => {
    setActiveTripId(tripId);
    localStorage.setItem('triptales_active_trip_id', tripId);

    // Load places for selected trip
    const tripPlaces = await getPlacesFromDB(tripId);
    setPlaces(tripPlaces || (tripId === 'phichit-2026' ? INITIAL_PLACES : []));

    // Load photos
    const tripPhotos = await getAllMissionPhotosFromDB(tripId);
    const newMissionStates: Record<number, MissionState> = {};
    for (const [mId, photos] of Object.entries(tripPhotos)) {
      newMissionStates[Number(mId)] = {
        missionId: Number(mId),
        tripId,
        completed: true,
        stars: 2,
        photos,
      };
    }
    setMissionStates(newMissionStates);

    // Load journals
    const tripJournals = await getAllJournalsFromDB(tripId);
    setAllJournals(tripJournals);
    const todayDate = new Date().toISOString().split('T')[0];
    const todayEntry = tripJournals.find((j) => j.date === todayDate);
    setCurrentJournal(
      todayEntry || {
        id: `${tripId}_${todayDate}`,
        tripId,
        date: todayDate,
        note: '',
        mood: '😄',
        updatedAt: new Date().toISOString(),
      }
    );
  };

  // ==================== STATE PERSISTENCE ====================
  const handleUpdatePlaces = (newPlaces: Place[]) => {
    setPlaces(newPlaces);
    localStorage.setItem(`triptales_places_${activeTripId}`, JSON.stringify(newPlaces));
    savePlacesToDB(newPlaces, activeTripId);
  };

  const handleUpdateMission = async (
    missionId: number,
    update: Partial<MissionState>
  ) => {
    const current = missionStates[missionId] || {
      missionId,
      tripId: activeTripId,
      completed: false,
      stars: 0,
      photos: [],
      notes: '',
    };

    const nextState: MissionState = {
      ...current,
      ...update,
      tripId: activeTripId,
      updatedAt: new Date().toISOString(),
    };

    if (update.photos) {
      await saveMissionPhotosToDB(missionId, update.photos, activeTripId);
    }

    setMissionStates((prev) => ({
      ...prev,
      [missionId]: nextState,
    }));

    // Save metadata to localStorage (without giant base64 images)
    const metaOnly: Record<number, Omit<MissionState, 'photos'> & { photoCount: number }> = {};
    for (const [id, s] of Object.entries({ ...missionStates, [missionId]: nextState })) {
      const numId = Number(id);
      metaOnly[numId] = {
        missionId: s.missionId,
        tripId: activeTripId,
        completed: s.completed,
        stars: s.stars,
        notes: s.notes,
        timestamp: s.timestamp,
        updatedAt: s.updatedAt,
        photoCount: s.photos?.length || 0,
      };
    }
    localStorage.setItem(`triptales_mission_states_${activeTripId}`, JSON.stringify(metaOnly));

    // Background upload photo if Supabase is active
    const client = getSupabaseClient();
    if (client && update.photos) {
      (async () => {
        for (const p of update.photos || []) {
          if (p.dataUrl && !p.url) {
            await uploadPhotoToSupabase(activeTripId, missionId, p.id, p.dataUrl);
          }
        }
      })();
    }
  };

  const handleSaveJournal = async (journal: TripJournal) => {
    const updatedJournal = {
      ...journal,
      tripId: activeTripId,
      updatedAt: new Date().toISOString(),
    };
    setCurrentJournal(updatedJournal);
    setAllJournals((prev) => {
      const filtered = prev.filter((j) => j.date !== journal.date);
      return [...filtered, updatedJournal];
    });

    await saveJournalToDB(updatedJournal);
  };

  // Total stars and completed count
  const totalStars = Object.values(missionStates).reduce(
    (sum, state) => sum + (state.stars || 0),
    0
  );

  const completedCount = Object.values(missionStates).filter(
    (state) => state.completed || (state.stars || 0) > 0
  ).length;

  // ==================== CLOUD BACKUP & RESTORE ====================
  const handleSyncToSupabase = async () => {
    const client = getSupabaseClient();
    if (!client) {
      alert(t('supabaseSection'));
      return;
    }

    setIsSyncing(true);
    setSyncStatus('syncing');
    try {
      const res = await syncAllToSupabase(activeTrip, places, missionStates, allJournals);
      if (res.success) {
        setSyncStatus('synced');
        alert(
          t('syncSuccessSummary', {
            places: res.syncedPlaces,
            missions: res.syncedMissions,
            photos: res.syncedPhotos,
          })
        );
      } else {
        setSyncStatus('error');
        alert(res.error || 'Sync failed');
      }
    } catch (err) {
      setSyncStatus('error');
      alert((err as Error).message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestoreFromSupabase = async () => {
    const client = getSupabaseClient();
    if (!client) {
      alert(t('supabaseSection'));
      return;
    }

    setIsRestoring(true);
    try {
      const res = await restoreAllFromSupabase(activeTripId);
      if (res.success) {
        if (res.places.length > 0) setPlaces(res.places);
        if (Object.keys(res.missionStates).length > 0) setMissionStates(res.missionStates);
        if (res.journals.length > 0) {
          setAllJournals(res.journals);
          const todayDate = new Date().toISOString().split('T')[0];
          const todayEntry = res.journals.find((j) => j.date === todayDate);
          if (todayEntry) setCurrentJournal(todayEntry);
        }
        setSyncStatus('synced');
        alert(
          t('restoreSuccess', {
            places: res.places.length,
            missions: Object.keys(res.missionStates).length,
            journals: res.journals.length,
          })
        );
      } else {
        alert(t('restoreFailed', { error: res.error || 'Restore error' }));
      }
    } catch (err) {
      alert(t('restoreFailed', { error: (err as Error).message }));
    } finally {
      setIsRestoring(false);
    }
  };

  // ==================== BACKUP EXPORT & IMPORT ====================
  const handleExportBackup = () => {
    const backupData = {
      app: 'TripTales',
      version: '2.5.0',
      exportedAt: new Date().toISOString(),
      trip: activeTrip,
      trips,
      places,
      missionStates,
      journals: allJournals,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `triptales_${activeTripId}_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (parsed.places) {
          handleUpdatePlaces(parsed.places);
        }
        if (parsed.missionStates) {
          setMissionStates(parsed.missionStates);
          for (const [mId, s] of Object.entries(parsed.missionStates as Record<string, MissionState>)) {
            if (s.photos && s.photos.length > 0) {
              await saveMissionPhotosToDB(Number(mId), s.photos, activeTripId);
            }
          }
        }
        if (parsed.journals) {
          for (const j of parsed.journals) {
            await saveJournalToDB({ ...j, tripId: activeTripId });
          }
          setAllJournals(parsed.journals);
        }
        alert('นำเข้าข้อมูลสำรองสำเร็จเรียบร้อยครับ!');
      } catch {
        alert('ไฟล์สำรองไม่ถูกต้อง');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetAllData = async () => {
    if (window.confirm(t('resetConfirm'))) {
      await clearAllLocalData();
      localStorage.removeItem(`triptales_places_${activeTripId}`);
      localStorage.removeItem(`triptales_mission_states_${activeTripId}`);
      localStorage.removeItem('triptales_places');
      localStorage.removeItem('triptales_mission_states');
      setPlaces(INITIAL_PLACES);
      setMissionStates({});
      const resetDate = new Date().toISOString().split('T')[0];
      setCurrentJournal({
        id: `${activeTripId}_${resetDate}`,
        tripId: activeTripId,
        date: resetDate,
        note: '',
        mood: '😄',
        updatedAt: new Date().toISOString(),
      });
      setAllJournals([]);
      setIsSettingsOpen(false);
      alert(t('resetSuccess'));
    }
  };

  return (
    <div className="min-h-screen bg-amber-50/40 pb-16">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalStars={totalStars}
        completedCount={completedCount}
        onOpenVictory={() => setIsVictoryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        syncStatus={syncStatus}
        activeTrip={activeTrip}
      />

      {/* Main Container */}
      <main className="max-w-md mx-auto px-4 pt-3">
        {/* Progress Score Bar */}
        <ProgressBar
          totalStars={totalStars}
          completedCount={completedCount}
          totalMissions={INITIAL_PHOTO_MISSIONS.length}
          onOpenVictory={() => setIsVictoryOpen(true)}
        />

        {/* Tab 1: Itinerary & Route Map */}
        {activeTab === 'places' && (
          <PlacesTab
            places={places}
            onUpdatePlaces={handleUpdatePlaces}
            onJumpToPhotoHunt={() => setActiveTab('hunt')}
          />
        )}

        {/* Tab 2: Photo Scavenger Hunt */}
        {activeTab === 'hunt' && (
          <PhotoHuntTab
            missions={INITIAL_PHOTO_MISSIONS}
            missionStates={missionStates}
            onUpdateMission={handleUpdateMission}
            onOpenPhotoPreview={(url, title) => setPreviewPhoto({ url, title })}
          />
        )}

        {/* Tab 3: Daily Journal */}
        {activeTab === 'journal' && (
          <JournalTab
            currentJournal={currentJournal}
            allJournals={allJournals}
            onSaveJournal={handleSaveJournal}
          />
        )}
      </main>

      {/* Fullscreen Photo Viewer */}
      <PhotoModal
        isOpen={!!previewPhoto}
        photoUrl={previewPhoto?.url || null}
        title={previewPhoto?.title || ''}
        onClose={() => setPreviewPhoto(null)}
      />

      {/* Victory & Certificate Modal */}
      <VictoryModal
        isOpen={isVictoryOpen}
        onClose={() => setIsVictoryOpen(false)}
        totalStars={totalStars}
        missionStates={missionStates}
        missions={INITIAL_PHOTO_MISSIONS}
        onOpenPhotoPreview={(url, title) => setPreviewPhoto({ url, title })}
      />

      {/* Settings & Supabase Cloud Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        trips={trips}
        activeTripId={activeTripId}
        onSelectTrip={handleSelectTrip}
        onResetAllData={handleResetAllData}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        onSyncToSupabase={handleSyncToSupabase}
        onRestoreFromSupabase={handleRestoreFromSupabase}
        isSyncing={isSyncing}
        isRestoring={isRestoring}
        syncStatus={syncStatus}
      />

      {/* Exit Confirmation Dialog for Browser/Android Back Button */}
      <ExitConfirmModal
        isOpen={isExitConfirmOpen}
        hasUnsavedChanges={hasUnsavedEdits || isSyncing}
        onStay={handleStayInApp}
        onExit={handleExitApp}
      />

      {/* Vercel Web Analytics */}
      <Analytics />
    </div>
  );
}

export default App;
