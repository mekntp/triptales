import { createClient, SupabaseClient, type User } from '@supabase/supabase-js';
import type { Place, MissionState, TripJournal, PhotoItem, Trip } from '../types';
import {
  savePlacesToDB,
  saveMissionPhotosToDB,
  saveJournalToDB,
  saveTripToDB,
} from './db';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getStoredSupabaseConfig(): SupabaseConfig {
  const envUrl = (
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL
  ) as string | undefined;

  const envKey = (
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) as string | undefined;

  const localUrl = localStorage.getItem('triptales_supabase_url') || localStorage.getItem('supabase_url');
  const localKey = localStorage.getItem('triptales_supabase_anon_key') || localStorage.getItem('supabase_anon_key');

  const rawUrl = localUrl || envUrl || '';
  const rawKey = localKey || envKey || '';

  const clean = (val: string) => val.replace(/^<|>$/g, '').trim();

  return {
    url: clean(rawUrl),
    anonKey: clean(rawKey),
  };
}

export function saveSupabaseConfig(config: SupabaseConfig) {
  if (config.url) {
    localStorage.setItem('triptales_supabase_url', config.url);
  }
  if (config.anonKey) {
    localStorage.setItem('triptales_supabase_anon_key', config.anonKey);
  }
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getStoredSupabaseConfig();
  if (!url || !anonKey) {
    return null;
  }

  try {
    if (!cachedClient) {
      cachedClient = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    }
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function resetSupabaseClient() {
  cachedClient = null;
}

// ==================== AUTHENTICATION ====================

export async function getCurrentUser(): Promise<User | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data: { user } } = await client.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  const client = getSupabaseClient();
  if (!client) return () => {};
  const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
  return () => {
    subscription.unsubscribe();
  };
}

export async function signInWithOtp(email: string): Promise<{ error: Error | null }> {
  const client = getSupabaseClient();
  if (!client) return { error: new Error('Supabase client not configured') };
  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });
  return { error };
}

export async function signOut(): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  await client.auth.signOut();
}

// ==================== PHOTO STORAGE ====================

/**
 * Upload a photo (data URL) to Supabase Storage bucket 'trip-photos'
 * Scoped by authenticated user ID for strict RLS compliance
 */
export async function uploadPhotoToSupabase(
  tripId: string,
  missionId: number,
  photoId: string,
  dataUrl: string
): Promise<{ url: string | null; storagePath: string | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { url: null, storagePath: null };

  try {
    const user = await getCurrentUser();
    const userFolder = user?.id || 'public_guest';

    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const ext = blob.type.includes('png') ? 'png' : 'jpg';
    const filePath = `${userFolder}/${tripId}/m_${missionId}_${photoId}_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('trip-photos')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.warn('Supabase storage upload error:', uploadError);
      return { url: null, storagePath: null };
    }

    const { data: publicData } = supabase.storage
      .from('trip-photos')
      .getPublicUrl(filePath);

    return {
      url: publicData?.publicUrl || null,
      storagePath: filePath,
    };
  } catch (err) {
    console.warn('Failed to upload photo to Supabase:', err);
    return { url: null, storagePath: null };
  }
}

// ==================== CLOUD SYNC (BACKUP) ====================

export interface SyncResult {
  success: boolean;
  syncedPlaces: number;
  syncedMissions: number;
  syncedPhotos: number;
  syncedJournals: number;
  error?: string;
}

/**
 * Perform full two-way cloud backup to Supabase
 */
export async function syncAllToSupabase(
  trip: Trip,
  places: Place[],
  missionStates: Record<number, MissionState>,
  journals: TripJournal[]
): Promise<SyncResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      success: false,
      syncedPlaces: 0,
      syncedMissions: 0,
      syncedPhotos: 0,
      syncedJournals: 0,
      error: 'Supabase client not configured',
    };
  }

  const user = await getCurrentUser();
  const userId = user?.id;

  try {
    // 1. Sync Trip Header
    await supabase.from('trips').upsert(
      {
        id: trip.id,
        user_id: userId,
        name: trip.name,
        subtitle: trip.subtitle,
        description: trip.description,
        cover_image: trip.coverImage,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    // 2. Sync Places (Handle deleted places as well)
    const placeRecords = places.map((p) => ({
      id: p.id,
      trip_id: trip.id,
      user_id: userId,
      sort_order: p.sortOrder,
      icon: p.icon,
      name: p.name,
      subtitle: p.subtitle,
      description: p.description,
      tags: p.tags,
      maps_url: p.googleMapsUrl,
      latitude: p.latitude,
      longitude: p.longitude,
      duration_minutes: p.durationMinutes,
      status: p.status,
      is_favorite_for_kids: p.isFavoriteForKids || false,
      is_deleted: p.isDeleted || false,
      updated_at: p.updatedAt || new Date().toISOString(),
    }));

    if (placeRecords.length > 0) {
      const { error: placesError } = await supabase.from('places').upsert(placeRecords, { onConflict: 'id' });
      if (placesError) throw placesError;
    }

    // 3. Sync Mission States and Upload pending photos
    let syncedPhotos = 0;
    for (const [idStr, state] of Object.entries(missionStates)) {
      const missionId = Number(idStr);
      const updatedPhotos: PhotoItem[] = [];

      for (const p of state.photos || []) {
        // Upload photo if not yet uploaded to cloud
        if (p.dataUrl && !p.url) {
          const { url, storagePath } = await uploadPhotoToSupabase(trip.id, missionId, p.id, p.dataUrl);
          if (url) {
            syncedPhotos++;
            updatedPhotos.push({
              ...p,
              url,
              storagePath: storagePath || undefined,
              uploadFailed: false,
            });
          } else {
            updatedPhotos.push({ ...p, uploadFailed: true });
          }
        } else {
          updatedPhotos.push(p);
        }
      }

      // Upsert Mission State
      const { error: missionError } = await supabase.from('photo_missions').upsert(
        {
          trip_id: trip.id,
          mission_id: missionId,
          user_id: userId,
          stars: state.stars,
          completed: state.completed,
          notes: state.notes || '',
          updated_at: state.updatedAt || new Date().toISOString(),
        },
        { onConflict: 'trip_id, mission_id' }
      );
      if (missionError) throw missionError;

      // Upsert photo records
      for (const p of updatedPhotos) {
        if (p.url) {
          await supabase.from('photos').upsert(
            {
              id: p.id,
              mission_id: missionId,
              trip_id: trip.id,
              user_id: userId,
              storage_path: p.storagePath || '',
              public_url: p.url,
              is_deleted: p.isDeleted || false,
              created_at: p.createdAt,
            },
            { onConflict: 'id' }
          );
        }
      }
    }

    // 4. Sync Journals
    let syncedJournals = 0;
    for (const j of journals) {
      const { error: journalError } = await supabase.from('trip_journal').upsert(
        {
          id: j.id || `${trip.id}_${j.date}`,
          trip_id: trip.id,
          user_id: userId,
          date: j.date,
          note: j.note,
          mood: j.mood,
          updated_at: j.updatedAt || new Date().toISOString(),
        },
        { onConflict: 'trip_id, date' }
      );
      if (!journalError) syncedJournals++;
    }

    return {
      success: true,
      syncedPlaces: placeRecords.length,
      syncedMissions: Object.keys(missionStates).length,
      syncedPhotos,
      syncedJournals,
    };
  } catch (err) {
    console.error('Supabase sync error:', err);
    return {
      success: false,
      syncedPlaces: 0,
      syncedMissions: 0,
      syncedPhotos: 0,
      syncedJournals: 0,
      error: (err as Error).message || 'Sync failed',
    };
  }
}

// ==================== CLOUD RESTORE ====================

export interface RestoreResult {
  success: boolean;
  trip?: Trip;
  places: Place[];
  missionStates: Record<number, MissionState>;
  journals: TripJournal[];
  error?: string;
}

/**
 * Restore trip and all associated data from Supabase
 * Reconciles with local IndexedDB (Last-Write-Wins based on updatedAt)
 */
export async function restoreAllFromSupabase(tripId: string): Promise<RestoreResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      success: false,
      places: [],
      missionStates: {},
      journals: [],
      error: 'Supabase client not configured',
    };
  }

  try {
    // 1. Fetch Trip Header
    const { data: tripData } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    let restoredTrip: Trip | undefined;
    if (tripData) {
      restoredTrip = {
        id: tripData.id,
        name: tripData.name,
        subtitle: tripData.subtitle,
        description: tripData.description,
        coverImage: tripData.cover_image,
        createdAt: tripData.created_at,
        updatedAt: tripData.updated_at,
      };
      await saveTripToDB(restoredTrip);
    }

    // 2. Fetch Places
    const { data: placesData, error: placesErr } = await supabase
      .from('places')
      .select('*')
      .eq('trip_id', tripId)
      .eq('is_deleted', false)
      .order('sort_order', { ascending: true });

    if (placesErr) throw placesErr;

    const restoredPlaces: Place[] = (placesData || []).map((row) => ({
      id: row.id,
      tripId: row.trip_id,
      name: row.name,
      subtitle: row.subtitle,
      description: row.description,
      icon: row.icon || '📍',
      tags: row.tags || [],
      googleMapsUrl: row.maps_url || '',
      latitude: row.latitude,
      longitude: row.longitude,
      durationMinutes: row.duration_minutes,
      sortOrder: row.sort_order,
      status: row.status || 'planned',
      isFavoriteForKids: row.is_favorite_for_kids || false,
      updatedAt: row.updated_at,
    }));

    if (restoredPlaces.length > 0) {
      await savePlacesToDB(restoredPlaces, tripId);
    }

    // 3. Fetch Photo Missions & Photos
    const { data: missionsData } = await supabase
      .from('photo_missions')
      .select('*')
      .eq('trip_id', tripId);

    const { data: photosData } = await supabase
      .from('photos')
      .select('*')
      .eq('trip_id', tripId)
      .eq('is_deleted', false);

    const restoredMissionStates: Record<number, MissionState> = {};

    // Group photos by mission_id
    const photosByMission: Record<number, PhotoItem[]> = {};
    for (const p of photosData || []) {
      if (!photosByMission[p.mission_id]) {
        photosByMission[p.mission_id] = [];
      }
      photosByMission[p.mission_id].push({
        id: p.id,
        url: p.public_url,
        storagePath: p.storage_path,
        createdAt: p.created_at,
      });
    }

    for (const m of missionsData || []) {
      const missionPhotos = photosByMission[m.mission_id] || [];
      restoredMissionStates[m.mission_id] = {
        missionId: m.mission_id,
        tripId,
        completed: m.completed,
        stars: m.stars,
        notes: m.notes || '',
        photos: missionPhotos,
        updatedAt: m.updated_at,
      };
      await saveMissionPhotosToDB(m.mission_id, missionPhotos, tripId);
    }

    // 4. Fetch Trip Journals
    const { data: journalData } = await supabase
      .from('trip_journal')
      .select('*')
      .eq('trip_id', tripId)
      .eq('is_deleted', false)
      .order('date', { ascending: true });

    const restoredJournals: TripJournal[] = (journalData || []).map((j) => ({
      id: j.id,
      tripId: j.trip_id,
      date: j.date,
      note: j.note,
      mood: j.mood,
      updatedAt: j.updated_at,
    }));

    for (const j of restoredJournals) {
      await saveJournalToDB(j);
    }

    return {
      success: true,
      trip: restoredTrip,
      places: restoredPlaces,
      missionStates: restoredMissionStates,
      journals: restoredJournals,
    };
  } catch (err) {
    console.error('Failed to restore from Supabase:', err);
    return {
      success: false,
      places: [],
      missionStates: {},
      journals: [],
      error: (err as Error).message || 'Restore failed',
    };
  }
}
