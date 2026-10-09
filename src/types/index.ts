export type PlaceStatus = 'planned' | 'visited' | 'skipped';

export interface Place {
  id: string;
  tripId?: string;
  name: string;
  nameEn?: string;
  nameZh?: string;
  icon: string;
  subtitle: string;
  subtitleEn?: string;
  subtitleZh?: string;
  description: string;
  descriptionEn?: string;
  descriptionZh?: string;
  tags: string[];
  googleMapsUrl: string;
  latitude?: number;
  longitude?: number;
  durationMinutes?: number;
  sortOrder: number;
  status: PlaceStatus;
  isFavoriteForKids?: boolean;
}

export interface PhotoItem {
  id: string;
  dataUrl?: string; // Base64 / Local preview
  storagePath?: string; // Supabase storage path
  url?: string; // Public URL
  createdAt: string;
}

export interface PhotoMission {
  id: number;
  tripId?: string;
  placeId?: string;
  title: string;
  titleEn?: string;
  titleZh?: string;
  icon: string;
  hint: string;
  hintEn?: string;
  hintZh?: string;
  isBonus?: boolean;
}

export interface MissionState {
  missionId: number;
  completed: boolean;
  stars: number; // 0, 1, 2, 3
  photos: PhotoItem[]; // Support multiple photos per mission
  notes?: string;
  timestamp?: string;
}

export interface TripJournal {
  id: string;
  tripId: string;
  date: string;
  note: string;
  mood?: string;
  updatedAt: string;
}

export interface Trip {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  coverImage?: string;
}

export interface RankInfo {
  minStars: number;
  maxStars: number;
  title: string;
  titleEn?: string;
  titleZh?: string;
  badge: string;
  description: string;
  descriptionEn?: string;
  descriptionZh?: string;
  color: string;
}

export interface RouteLeg {
  fromPlaceId: string;
  toPlaceId: string;
  fromName: string;
  toName: string;
  distanceKm: number;
  durationMinutes: number;
}

export interface RouteSummary {
  legs: RouteLeg[];
  totalDistanceKm: number;
  totalDurationMinutes: number;
}
