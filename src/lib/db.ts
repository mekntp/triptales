// IndexedDB helper for TripTales offline-first storage (Multi-trip scoped)
import type { Place, PhotoItem, TripJournal, Trip } from '../types';

const DB_NAME = 'triptales_db';
const DB_VERSION = 3;

const TRIPS_STORE = 'trips_store';
const PLACES_STORE = 'places_store';
const PHOTO_STORE = 'mission_photos';
const JOURNAL_STORE = 'journal_store';

const DEFAULT_TRIP_ID = 'phichit-2026';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const oldVersion = event.oldVersion;

      // 1. Trips Store
      if (!db.objectStoreNames.contains(TRIPS_STORE)) {
        db.createObjectStore(TRIPS_STORE, { keyPath: 'id' });
      }

      // 2. Places Store
      let placesStore: IDBObjectStore;
      if (!db.objectStoreNames.contains(PLACES_STORE)) {
        placesStore = db.createObjectStore(PLACES_STORE, { keyPath: 'id' });
        placesStore.createIndex('tripId', 'tripId', { unique: false });
      } else {
        placesStore = request.transaction!.objectStore(PLACES_STORE);
        if (!placesStore.indexNames.contains('tripId')) {
          placesStore.createIndex('tripId', 'tripId', { unique: false });
        }
      }

      // 3. Photo Store
      // In v2, keyPath was 'missionId'. In v3, we use composite string key 'id' (${tripId}_${missionId})
      if (oldVersion < 3 && db.objectStoreNames.contains(PHOTO_STORE)) {
        // Upgrade will migrate in onsuccess if needed or recreate
        try {
          db.deleteObjectStore(PHOTO_STORE);
        } catch {
          // ignore
        }
      }
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        const photoStore = db.createObjectStore(PHOTO_STORE, { keyPath: 'id' });
        photoStore.createIndex('tripId', 'tripId', { unique: false });
        photoStore.createIndex('missionId', 'missionId', { unique: false });
      }

      // 4. Journal Store
      // In v2, keyPath was 'date'. In v3, keyPath is 'id' (${tripId}_${date})
      if (oldVersion < 3 && db.objectStoreNames.contains(JOURNAL_STORE)) {
        try {
          db.deleteObjectStore(JOURNAL_STORE);
        } catch {
          // ignore
        }
      }
      if (!db.objectStoreNames.contains(JOURNAL_STORE)) {
        const journalStore = db.createObjectStore(JOURNAL_STORE, { keyPath: 'id' });
        journalStore.createIndex('tripId', 'tripId', { unique: false });
        journalStore.createIndex('date', 'date', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ==================== TRIPS ====================

export async function saveTripToDB(trip: Trip): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TRIPS_STORE, 'readwrite');
      const store = tx.objectStore(TRIPS_STORE);
      const req = store.put({
        ...trip,
        updatedAt: trip.updatedAt || new Date().toISOString(),
      });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to save trip to IndexedDB:', err);
  }
}

export async function getAllTripsFromDB(): Promise<Trip[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(TRIPS_STORE, 'readonly');
      const store = tx.objectStore(TRIPS_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const result = (req.result || []) as Trip[];
        resolve(result.filter((t) => !t.isDeleted));
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function deleteTripFromDB(tripId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction([TRIPS_STORE, PLACES_STORE, PHOTO_STORE, JOURNAL_STORE], 'readwrite');
      tx.objectStore(TRIPS_STORE).delete(tripId);

      // Clean up places, photos, journals for this trip
      const placesStore = tx.objectStore(PLACES_STORE);
      const placesReq = placesStore.getAll();
      placesReq.onsuccess = () => {
        for (const p of placesReq.result || []) {
          if (p.tripId === tripId) placesStore.delete(p.id);
        }
      };

      const photoStore = tx.objectStore(PHOTO_STORE);
      const photoReq = photoStore.getAll();
      photoReq.onsuccess = () => {
        for (const p of photoReq.result || []) {
          if (p.tripId === tripId) photoStore.delete(p.id);
        }
      };

      const journalStore = tx.objectStore(JOURNAL_STORE);
      const journalReq = journalStore.getAll();
      journalReq.onsuccess = () => {
        for (const j of journalReq.result || []) {
          if (j.tripId === tripId) journalStore.delete(j.id);
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('Failed to delete trip from IndexedDB:', err);
  }
}

// ==================== PHOTOS ====================

export interface StoredMissionPhotos {
  id: string; // `${tripId}_${missionId}`
  tripId: string;
  missionId: number;
  photos: PhotoItem[];
  updatedAt: string;
}

export async function saveMissionPhotosToDB(
  missionId: number,
  photos: PhotoItem[],
  tripId: string = DEFAULT_TRIP_ID
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, 'readwrite');
      const store = tx.objectStore(PHOTO_STORE);
      const key = `${tripId}_${missionId}`;
      const req = store.put({
        id: key,
        tripId,
        missionId,
        photos,
        updatedAt: new Date().toISOString(),
      });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to save photos to IndexedDB:', err);
  }
}

export async function getAllMissionPhotosFromDB(
  tripId: string = DEFAULT_TRIP_ID
): Promise<Record<number, PhotoItem[]>> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(PHOTO_STORE, 'readonly');
      const store = tx.objectStore(PHOTO_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const results: Record<number, PhotoItem[]> = {};
        for (const item of req.result || []) {
          // Filter by tripId if provided
          if (item.tripId && item.tripId !== tripId) continue;
          if (Array.isArray(item.photos)) {
            results[item.missionId] = item.photos.filter((p: PhotoItem) => !p.isDeleted);
          }
        }
        resolve(results);
      };
      req.onerror = () => resolve({});
    });
  } catch {
    return {};
  }
}

export async function deleteMissionPhotosFromDB(
  missionId: number,
  tripId: string = DEFAULT_TRIP_ID
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(PHOTO_STORE, 'readwrite');
      const store = tx.objectStore(PHOTO_STORE);
      const key = `${tripId}_${missionId}`;
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('Failed to delete photos from IndexedDB:', err);
  }
}

// ==================== PLACES ====================

export async function savePlacesToDB(
  places: Place[],
  tripId: string = DEFAULT_TRIP_ID
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PLACES_STORE, 'readwrite');
      const store = tx.objectStore(PLACES_STORE);

      // Only clear places belonging to this trip
      const getAllReq = store.getAll();
      getAllReq.onsuccess = () => {
        for (const existing of getAllReq.result || []) {
          if (!existing.tripId || existing.tripId === tripId) {
            store.delete(existing.id);
          }
        }
        places.forEach((p) => {
          store.put({
            ...p,
            tripId: p.tripId || tripId,
            updatedAt: p.updatedAt || new Date().toISOString(),
          });
        });
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save places to IndexedDB:', err);
  }
}

export async function getPlacesFromDB(
  tripId: string = DEFAULT_TRIP_ID
): Promise<Place[] | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(PLACES_STORE, 'readonly');
      const store = tx.objectStore(PLACES_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const allPlaces = (req.result || []) as Place[];
        const filtered = allPlaces.filter(
          (p) => (!p.tripId && tripId === DEFAULT_TRIP_ID) || p.tripId === tripId
        );
        if (filtered.length > 0) {
          filtered.sort((a, b) => a.sortOrder - b.sortOrder);
          resolve(filtered);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// ==================== DAILY JOURNAL ====================

export async function saveJournalToDB(journal: TripJournal): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(JOURNAL_STORE, 'readwrite');
      const store = tx.objectStore(JOURNAL_STORE);
      const id = journal.id || `${journal.tripId || DEFAULT_TRIP_ID}_${journal.date}`;
      const req = store.put({
        ...journal,
        id,
        tripId: journal.tripId || DEFAULT_TRIP_ID,
        updatedAt: journal.updatedAt || new Date().toISOString(),
      });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to save journal to IndexedDB:', err);
  }
}

export async function getJournalFromDB(
  date: string,
  tripId: string = DEFAULT_TRIP_ID
): Promise<TripJournal | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(JOURNAL_STORE, 'readonly');
      const store = tx.objectStore(JOURNAL_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const found = (req.result || []).find(
          (j: TripJournal) => (j.tripId === tripId || (!j.tripId && tripId === DEFAULT_TRIP_ID)) && j.date === date
        );
        resolve(found || null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function getAllJournalsFromDB(
  tripId: string = DEFAULT_TRIP_ID
): Promise<TripJournal[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(JOURNAL_STORE, 'readonly');
      const store = tx.objectStore(JOURNAL_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const all = (req.result || []) as TripJournal[];
        const filtered = all.filter(
          (j) => (!j.tripId && tripId === DEFAULT_TRIP_ID) || j.tripId === tripId
        );
        resolve(filtered);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

// ==================== RESET ====================

export async function clearAllLocalData(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([TRIPS_STORE, PHOTO_STORE, PLACES_STORE, JOURNAL_STORE], 'readwrite');
    tx.objectStore(TRIPS_STORE).clear();
    tx.objectStore(PHOTO_STORE).clear();
    tx.objectStore(PLACES_STORE).clear();
    tx.objectStore(JOURNAL_STORE).clear();
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Ignore
  }
}
