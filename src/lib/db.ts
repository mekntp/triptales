// IndexedDB helper for TripTales offline-first storage
import type { Place, PhotoItem, TripJournal } from '../types';

const DB_NAME = 'triptales_db';
const DB_VERSION = 2;

const PHOTO_STORE = 'mission_photos';
const PLACES_STORE = 'places_store';
const JOURNAL_STORE = 'journal_store';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        db.createObjectStore(PHOTO_STORE, { keyPath: 'missionId' });
      }
      if (!db.objectStoreNames.contains(PLACES_STORE)) {
        db.createObjectStore(PLACES_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(JOURNAL_STORE)) {
        db.createObjectStore(JOURNAL_STORE, { keyPath: 'date' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ==================== PHOTOS ====================

export interface StoredMissionPhotos {
  missionId: number;
  photos: PhotoItem[];
  updatedAt: string;
}

export async function saveMissionPhotosToDB(
  missionId: number,
  photos: PhotoItem[]
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, 'readwrite');
      const store = tx.objectStore(PHOTO_STORE);
      const req = store.put({
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

export async function getAllMissionPhotosFromDB(): Promise<Record<number, PhotoItem[]>> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(PHOTO_STORE, 'readonly');
      const store = tx.objectStore(PHOTO_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const results: Record<number, PhotoItem[]> = {};
        for (const item of req.result || []) {
          // Handle both v1 {dataUrl} and v2 {photos} formats
          if (Array.isArray(item.photos)) {
            results[item.missionId] = item.photos;
          } else if (item.dataUrl) {
            results[item.missionId] = [
              {
                id: `legacy-${Date.now()}`,
                dataUrl: item.dataUrl,
                createdAt: item.savedAt || new Date().toISOString(),
              },
            ];
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

export async function deleteMissionPhotosFromDB(missionId: number): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(PHOTO_STORE, 'readwrite');
      const store = tx.objectStore(PHOTO_STORE);
      const req = store.delete(missionId);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('Failed to delete photos from IndexedDB:', err);
  }
}

// ==================== PLACES ====================

export async function savePlacesToDB(places: Place[]): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PLACES_STORE, 'readwrite');
      const store = tx.objectStore(PLACES_STORE);
      store.clear();
      places.forEach((p) => store.put(p));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save places to IndexedDB:', err);
  }
}

export async function getPlacesFromDB(): Promise<Place[] | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(PLACES_STORE, 'readonly');
      const store = tx.objectStore(PLACES_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const result = req.result as Place[];
        if (result && result.length > 0) {
          result.sort((a, b) => a.sortOrder - b.sortOrder);
          resolve(result);
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
      const req = store.put(journal);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to save journal to IndexedDB:', err);
  }
}

export async function getJournalFromDB(date: string): Promise<TripJournal | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(JOURNAL_STORE, 'readonly');
      const store = tx.objectStore(JOURNAL_STORE);
      const req = store.get(date);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function getAllJournalsFromDB(): Promise<TripJournal[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(JOURNAL_STORE, 'readonly');
      const store = tx.objectStore(JOURNAL_STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
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
    const tx = db.transaction([PHOTO_STORE, PLACES_STORE, JOURNAL_STORE], 'readwrite');
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
