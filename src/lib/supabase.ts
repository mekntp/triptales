import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Place, MissionState, TripJournal } from '../types';

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
      cachedClient = createClient(url, anonKey);
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

/**
 * Upload a photo (data URL) to Supabase Storage bucket 'trip-photos'
 */
export async function uploadPhotoToSupabase(
  missionId: number,
  photoId: string,
  dataUrl: string
): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const ext = blob.type.includes('png') ? 'png' : 'jpg';
    const filePath = `missions/m_${missionId}_${photoId}_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('trip-photos')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.warn('Supabase storage upload error:', uploadError);
      return null;
    }

    const { data: publicData } = supabase.storage
      .from('trip-photos')
      .getPublicUrl(filePath);

    return publicData?.publicUrl || null;
  } catch (err) {
    console.warn('Failed to upload photo to Supabase:', err);
    return null;
  }
}

/**
 * Sync places itinerary to Supabase table 'places'
 */
export async function syncPlacesToSupabase(tripId: string, places: Place[]): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const records = places.map((p) => ({
      id: p.id,
      trip_id: tripId,
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
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('places').upsert(records, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase sync places error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Failed to sync places to Supabase:', err);
    return false;
  }
}

/**
 * Sync a photo mission state to Supabase table 'photo_missions'
 */
export async function syncMissionToSupabase(
  tripId: string,
  state: MissionState
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('photo_missions').upsert(
      {
        trip_id: tripId,
        mission_id: state.missionId,
        stars: state.stars,
        completed: state.completed,
        notes: state.notes || '',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'trip_id, mission_id' }
    );

    if (error) {
      console.warn('Supabase sync mission error:', error);
      return false;
    }

    // Sync individual photos if present
    for (const photo of state.photos) {
      if (photo.url) {
        await supabase.from('photos').upsert(
          {
            id: photo.id,
            mission_id: state.missionId,
            trip_id: tripId,
            storage_path: photo.storagePath || '',
            public_url: photo.url,
            created_at: photo.createdAt,
          },
          { onConflict: 'id' }
        );
      }
    }

    return true;
  } catch (err) {
    console.warn('Failed to sync mission to Supabase:', err);
    return false;
  }
}

/**
 * Sync daily trip journal to Supabase table 'trip_journal'
 */
export async function syncJournalToSupabase(journal: TripJournal): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('trip_journal').upsert(
      {
        id: journal.id,
        trip_id: journal.tripId,
        date: journal.date,
        note: journal.note,
        mood: journal.mood,
        updated_at: journal.updatedAt,
      },
      { onConflict: 'trip_id, date' }
    );

    if (error) {
      console.warn('Supabase sync journal error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Failed to sync journal to Supabase:', err);
    return false;
  }
}
