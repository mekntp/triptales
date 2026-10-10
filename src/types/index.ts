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
  updatedAt?: string;
  isDeleted?: boolean;
}

export interface PhotoItem {
  id: string;
  dataUrl?: string; // Base64 / Local preview
  storagePath?: string; // Supabase storage path
  url?: string; // Public URL
  createdAt: string;
  updatedAt?: string;
  isDeleted?: boolean;
  uploadFailed?: boolean;
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
  tripId?: string;
  completed: boolean;
  stars: number; // 0, 1, 2, 3
  photos: PhotoItem[]; // Support multiple photos per mission
  notes?: string;
  timestamp?: string;
  updatedAt?: string;
}

export interface TripJournal {
  id: string;
  tripId: string;
  date: string;
  note: string;
  mood?: string;
  updatedAt: string;
}

export type SyncStatus = 'local_only' | 'syncing' | 'synced' | 'error' | 'offline';
export type TripStatus = 'upcoming' | 'ongoing' | 'completed' | 'archived';
export type ThemeMode = 'system' | 'light' | 'dark';
export type DistanceUnit = 'km' | 'mi';

export interface Trip {
  id: string;
  userId?: string;
  name: string;
  nameEn?: string;
  nameZh?: string;
  destinationCity?: string;
  startDate?: string;
  endDate?: string;
  subtitle: string;
  subtitleEn?: string;
  subtitleZh?: string;
  description: string;
  descriptionEn?: string;
  descriptionZh?: string;
  coverImage?: string;
  status?: TripStatus;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

export interface CitySearchResult {
  id: string;
  name: string;
  displayName: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  type: string;
}

export type PlaceCategory =
  | 'all'
  | 'attraction'
  | 'culture'
  | 'nature'
  | 'family'
  | 'food'
  | 'market';

export interface RecommendedPlace {
  id: string;
  name: string;
  category: PlaceCategory;
  categoryLabel: string;
  icon: string;
  description: string;
  latitude: number;
  longitude: number;
  distanceFromCenterKm?: number;
  isFamilyFriendly?: boolean;
  address?: string;
  verifiedSource: string;
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
