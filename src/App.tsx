import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import type { Place, MissionState, TripJournal, PhotoItem } from './types';
import { INITIAL_PLACES, INITIAL_TRIP_INFO } from './data/places';
import { INITIAL_PHOTO_MISSIONS } from './data/missions';
import { Header, type ActiveTab } from './components/Header';
import { ProgressBar } from './components/ProgressBar';
import { PlacesTab } from './components/PlacesTab';
import { PhotoHuntTab } from './components/PhotoHuntTab';
import { JournalTab } from './components/JournalTab';
import { VictoryModal } from './components/VictoryModal';
import { PhotoModal } from './components/PhotoModal';
import { SettingsModal } from './components/SettingsModal';
import {
  saveMissionPhotosToDB,
  getAllMissionPhotosFromDB,
  savePlacesToDB,
  getPlacesFromDB,
  saveJournalToDB,
  getAllJournalsFromDB,
  clearAllLocalData,
} from './lib/db';
import {
  uploadPhotoToSupabase,
  syncMissionToSupabase,
  syncPlacesToSupabase,
  syncJournalToSupabase,
  getSupabaseClient,
} from './lib/supabase';
import { useLanguage } from './i18n/LanguageContext';

export function App() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<ActiveTab>('places');

  // Places itinerary state (persisted)
  const [places, setPlaces] = useState<Place[]>(() => {
    try {
      const saved = localStorage.getItem('triptales_places');
      return saved ? JSON.parse(saved) : INITIAL_PLACES;
    } catch {
      return INITIAL_PLACES;
    }
  });

  // Photo missions progress state (persisted)
  const [missionStates, setMissionStates] = useState<Record<number, MissionState>>(() => {
    try {
      const saved = localStorage.getItem('triptales_mission_states');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Daily trip journal state
  const [currentJournal, setCurrentJournal] = useState<TripJournal>(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      id: `journal-${today}`,
      tripId: INITIAL_TRIP_INFO.id,
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
  const [isSyncing, setIsSyncing] = useState(false);

  // Load IndexedDB on mount (places, photos, journals)
  useEffect(() => {
    async function initFromIndexedDB() {
      // 1. Places from DB
      const dbPlaces = await getPlacesFromDB();
      if (dbPlaces && dbPlaces.length > 0) {
        setPlaces(dbPlaces);
      }

      // 2. Photos from DB
      const storedPhotos = await getAllMissionPhotosFromDB();
      if (Object.keys(storedPhotos).length > 0) {
        setMissionStates((prev) => {
          const next = { ...prev };
          let changed = false;
          for (const [mId, photoList] of Object.entries(storedPhotos)) {
            const id = Number(mId);
            const existing = next[id] || {
              missionId: id,
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

      // 3. Journals from DB
      const dbJournals = await getAllJournalsFromDB();
      if (dbJournals && dbJournals.length > 0) {
        setAllJournals(dbJournals);
        const todayEntry = dbJournals.find((j) => j.date === currentJournal.date);
        if (todayEntry) setCurrentJournal(todayEntry);
      }
    }

    initFromIndexedDB();
  }, []);

  // Persist places to localStorage and IndexedDB
  const handleUpdatePlaces = (newPlaces: Place[]) => {
    setPlaces(newPlaces);
    localStorage.setItem('triptales_places', JSON.stringify(newPlaces));
    savePlacesToDB(newPlaces);
  };

  // Persist mission states to localStorage and IndexedDB
  const handleUpdateMission = async (
    missionId: number,
    update: Partial<MissionState>
  ) => {
    const current = missionStates[missionId] || {
      missionId,
      completed: false,
      stars: 0,
      photos: [],
      notes: '',
    };

    const nextState: MissionState = {
      ...current,
      ...update,
    };

    // If photos changed, persist to IndexedDB
    if (update.photos) {
      await saveMissionPhotosToDB(missionId, update.photos);
    }

    setMissionStates((prev) => ({
      ...prev,
      [missionId]: nextState,
    }));

    // Save metadata to localStorage (without giant data URLs to save quota)
    const metaOnly: Record<number, Omit<MissionState, 'photos'> & { photoCount: number }> = {};
    for (const [id, s] of Object.entries({ ...missionStates, [missionId]: nextState })) {
      const numId = Number(id);
      metaOnly[numId] = {
        missionId: s.missionId,
        completed: s.completed,
        stars: s.stars,
        notes: s.notes,
        timestamp: s.timestamp,
        photoCount: s.photos?.length || 0,
      };
    }
    localStorage.setItem('triptales_mission_states', JSON.stringify(metaOnly));

    // Background sync to Supabase if configured
    const client = getSupabaseClient();
    if (client) {
      (async () => {
        // Upload any local dataUrl photos to Supabase Storage
        const syncedPhotos: PhotoItem[] = [];
        for (const p of nextState.photos || []) {
          if (p.dataUrl && !p.url) {
            const publicUrl = await uploadPhotoToSupabase(missionId, p.id, p.dataUrl);
            syncedPhotos.push({
              ...p,
              url: publicUrl || undefined,
            });
          } else {
            syncedPhotos.push(p);
          }
        }
        await syncMissionToSupabase(INITIAL_TRIP_INFO.id, {
          ...nextState,
          photos: syncedPhotos,
        });
      })();
    }
  };

  // Persist Journal
  const handleSaveJournal = async (journal: TripJournal) => {
    setCurrentJournal(journal);
    setAllJournals((prev) => {
      const filtered = prev.filter((j) => j.date !== journal.date);
      return [...filtered, journal];
    });

    await saveJournalToDB(journal);

    // Sync to Supabase if configured
    const client = getSupabaseClient();
    if (client) {
      syncJournalToSupabase(journal);
    }
  };

  // Total stars and completed count
  const totalStars = Object.values(missionStates).reduce(
    (sum, state) => sum + (state.stars || 0),
    0
  );

  const completedCount = Object.values(missionStates).filter(
    (state) => state.completed || (state.stars || 0) > 0
  ).length;

  // Cloud sync all
  const handleSyncToSupabase = async () => {
    const client = getSupabaseClient();
    if (!client) {
      alert(t('supabaseSection'));
      return;
    }

    setIsSyncing(true);
    try {
      // 1. Sync places
      await syncPlacesToSupabase(INITIAL_TRIP_INFO.id, places);

      // 2. Sync missions and upload photos
      for (const [idStr, state] of Object.entries(missionStates)) {
        const missionId = Number(idStr);
        const uploadedPhotos: PhotoItem[] = [];

        for (const p of state.photos || []) {
          if (p.dataUrl && !p.url) {
            const uploadedUrl = await uploadPhotoToSupabase(missionId, p.id, p.dataUrl);
            uploadedPhotos.push({ ...p, url: uploadedUrl || undefined });
          } else {
            uploadedPhotos.push(p);
          }
        }

        await syncMissionToSupabase(INITIAL_TRIP_INFO.id, {
          ...state,
          photos: uploadedPhotos,
        });
      }

      // 3. Sync journal
      if (currentJournal.note) {
        await syncJournalToSupabase(currentJournal);
      }

      alert(t('settingsSaved'));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Export JSON backup
  const handleExportBackup = () => {
    const backupData = {
      app: 'TripTales',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      trip: INITIAL_TRIP_INFO,
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
    a.download = `triptales_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
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
              await saveMissionPhotosToDB(Number(mId), s.photos);
            }
          }
        }
        if (parsed.journals) {
          for (const j of parsed.journals) {
            await saveJournalToDB(j);
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

  // Reset all data
  const handleResetAllData = async () => {
    if (window.confirm(t('resetConfirm'))) {
      await clearAllLocalData();
      localStorage.removeItem('triptales_places');
      localStorage.removeItem('triptales_mission_states');
      setPlaces(INITIAL_PLACES);
      setMissionStates({});
      const resetDate = new Date().toISOString().split('T')[0];
      setCurrentJournal({
        id: `journal-${resetDate}`,
        tripId: INITIAL_TRIP_INFO.id,
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
        onResetAllData={handleResetAllData}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        onSyncToSupabase={handleSyncToSupabase}
        isSyncing={isSyncing}
      />

      {/* Vercel Web Analytics */}
      <Analytics />
    </div>
  );
}

export default App;
