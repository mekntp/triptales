import type { Place, RouteLeg, RouteSummary } from '../types';

/**
 * Calculate Great-Circle distance using Haversine formula (km)
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimate realistic driving distance and time.
 * In Thailand provincial areas, roads have a winding/detour factor of ~1.28
 * and average driving speed with traffic and turns is ~50 km/h.
 */
export function estimateDrivingDistanceAndTime(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): { distanceKm: number; durationMinutes: number } {
  const straightLine = calculateHaversineDistanceKm(lat1, lon1, lat2, lon2);
  
  if (straightLine < 0.05) {
    return { distanceKm: 0.1, durationMinutes: 1 };
  }

  const ROAD_WINDING_FACTOR = 1.28;
  const distanceKm = Math.round(straightLine * ROAD_WINDING_FACTOR * 10) / 10;
  
  // Speed model: slower in city (30-40km/h), faster on provincial highways (60-70km/h)
  const averageSpeedKmh = distanceKm < 5 ? 35 : distanceKm < 15 ? 48 : 60;
  const durationMinutes = Math.max(2, Math.round((distanceKm / averageSpeedKmh) * 60));

  return { distanceKm, durationMinutes };
}

/**
 * Calculate Route Summary across an ordered list of places.
 * Skips consecutive places if coordinates are missing or if place status is 'skipped'.
 */
export function calculateRouteSummary(places: Place[]): RouteSummary {
  // Only calculate route for non-skipped places
  const activePlaces = places.filter((p) => p.status !== 'skipped');
  const legs: RouteLeg[] = [];
  let totalDistanceKm = 0;
  let totalDurationMinutes = 0;

  for (let i = 0; i < activePlaces.length - 1; i++) {
    const current = activePlaces[i];
    const next = activePlaces[i + 1];

    if (
      current.latitude !== undefined &&
      current.longitude !== undefined &&
      next.latitude !== undefined &&
      next.longitude !== undefined
    ) {
      const { distanceKm, durationMinutes } = estimateDrivingDistanceAndTime(
        current.latitude,
        current.longitude,
        next.latitude,
        next.longitude
      );

      legs.push({
        fromPlaceId: current.id,
        toPlaceId: next.id,
        fromName: current.name,
        toName: next.name,
        distanceKm,
        durationMinutes,
      });

      totalDistanceKm += distanceKm;
      totalDurationMinutes += durationMinutes;
    }
  }

  return {
    legs,
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    totalDurationMinutes,
  };
}

/**
 * Generate Google Maps turn-by-turn driving directions URL for a single leg between two places
 */
export function generateGoogleMapsLegUrl(from: Place, to: Place): string {
  const origin =
    from.latitude !== undefined && from.longitude !== undefined
      ? `${from.latitude},${from.longitude}`
      : encodeURIComponent(from.name);

  const destination =
    to.latitude !== undefined && to.longitude !== undefined
      ? `${to.latitude},${to.longitude}`
      : encodeURIComponent(to.name);

  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
}

/**
 * Generate full Google Maps directions URL for an ordered list of places
 */
export function generateGoogleMapsDirectionsUrl(places: Place[]): string {
  const activePlaces = places.filter((p) => p.status !== 'skipped');
  if (activePlaces.length === 0) return 'https://www.google.com/maps';

  const queryWaypoints = activePlaces.map((p) => {
    if (p.latitude !== undefined && p.longitude !== undefined) {
      return `${p.latitude},${p.longitude}`;
    }
    return encodeURIComponent(p.name);
  });

  if (queryWaypoints.length === 1) {
    return `https://www.google.com/maps/search/?api=1&query=${queryWaypoints[0]}`;
  }

  const origin = queryWaypoints[0];
  const destination = queryWaypoints[queryWaypoints.length - 1];
  const waypoints = queryWaypoints.slice(1, -1).join('|');

  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
  if (waypoints) {
    url += `&waypoints=${waypoints}`;
  }
  url += '&travelmode=driving';

  return url;
}

/**
 * Optimize route order using Traveling Salesperson Problem (TSP) heuristic:
 * 1. Keep the first place as the starting anchor (e.g. Hotel / Station / Origin)
 * 2. Use Nearest-Neighbor selection
 * 3. Refine with 2-Opt pairwise exchange
 */
export function optimizePlacesOrder(
  places: Place[],
  keepFirstFixed = true
): {
  proposedPlaces: Place[];
  originalDistanceKm: number;
  optimizedDistanceKm: number;
  originalDurationMinutes: number;
  optimizedDurationMinutes: number;
  savingsDistanceKm: number;
  savingsDurationMinutes: number;
  isImproved: boolean;
} {
  const originalSummary = calculateRouteSummary(places);

  // If 3 or fewer active places with coordinates, already optimal or trivial
  const validPlaces = places.filter(
    (p) => p.latitude !== undefined && p.longitude !== undefined && p.status !== 'skipped'
  );

  if (validPlaces.length <= 3) {
    return {
      proposedPlaces: [...places],
      originalDistanceKm: originalSummary.totalDistanceKm,
      optimizedDistanceKm: originalSummary.totalDistanceKm,
      originalDurationMinutes: originalSummary.totalDurationMinutes,
      optimizedDurationMinutes: originalSummary.totalDurationMinutes,
      savingsDistanceKm: 0,
      savingsDurationMinutes: 0,
      isImproved: false,
    };
  }

  // Work on active valid places
  const startIdx = keepFirstFixed ? 1 : 0;
  const startPlace = places[0];
  const toOptimize = places.slice(startIdx).filter((p) => p.status !== 'skipped');
  const skippedOrInvalid = places.filter((p) => p.status === 'skipped');

  // Nearest-Neighbor algorithm
  const ordered: Place[] = keepFirstFixed ? [startPlace] : [];
  const remaining = [...toOptimize];

  if (!keepFirstFixed && remaining.length > 0) {
    ordered.push(remaining.shift()!);
  }

  while (remaining.length > 0) {
    const last = ordered[ordered.length - 1];
    let bestIdx = 0;
    let shortestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      if (
        last.latitude !== undefined &&
        last.longitude !== undefined &&
        candidate.latitude !== undefined &&
        candidate.longitude !== undefined
      ) {
        const d = calculateHaversineDistanceKm(
          last.latitude,
          last.longitude,
          candidate.latitude,
          candidate.longitude
        );
        if (d < shortestDist) {
          shortestDist = d;
          bestIdx = i;
        }
      }
    }

    ordered.push(remaining.splice(bestIdx, 1)[0]);
  }

  // 2-Opt local search refinement
  let improved = true;
  let currentOrder = [...ordered];
  let iterations = 0;

  const calculateTotalOrderDistance = (list: Place[]) => {
    let d = 0;
    for (let i = 0; i < list.length - 1; i++) {
      if (
        list[i].latitude !== undefined &&
        list[i].longitude !== undefined &&
        list[i + 1].latitude !== undefined &&
        list[i + 1].longitude !== undefined
      ) {
        d += calculateHaversineDistanceKm(
          list[i].latitude!,
          list[i].longitude!,
          list[i + 1].latitude!,
          list[i + 1].longitude!
        );
      }
    }
    return d;
  };

  const fixedCount = keepFirstFixed ? 1 : 0;
  while (improved && iterations < 50) {
    improved = false;
    iterations++;
    const bestDistance = calculateTotalOrderDistance(currentOrder);

    for (let i = fixedCount; i < currentOrder.length - 1; i++) {
      for (let k = i + 1; k < currentOrder.length; k++) {
        // Reverse sub-array between i and k
        const candidate = [
          ...currentOrder.slice(0, i),
          ...currentOrder.slice(i, k + 1).reverse(),
          ...currentOrder.slice(k + 1),
        ];

        const candidateDist = calculateTotalOrderDistance(candidate);
        if (candidateDist < bestDistance - 0.05) {
          currentOrder = candidate;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }

  // Append skipped places at the end maintaining their disabled state
  const finalProposed = [...currentOrder, ...skippedOrInvalid].map((p, idx) => ({
    ...p,
    sortOrder: idx + 1,
  }));

  const optimizedSummary = calculateRouteSummary(finalProposed);

  const savingsDist = Math.max(
    0,
    Math.round((originalSummary.totalDistanceKm - optimizedSummary.totalDistanceKm) * 10) / 10
  );
  const savingsTime = Math.max(
    0,
    originalSummary.totalDurationMinutes - optimizedSummary.totalDurationMinutes
  );

  return {
    proposedPlaces: finalProposed,
    originalDistanceKm: originalSummary.totalDistanceKm,
    optimizedDistanceKm: optimizedSummary.totalDistanceKm,
    originalDurationMinutes: originalSummary.totalDurationMinutes,
    optimizedDurationMinutes: optimizedSummary.totalDurationMinutes,
    savingsDistanceKm: savingsDist,
    savingsDurationMinutes: savingsTime,
    isImproved: savingsDist > 0.5,
  };
}

/**
 * Format minutes to child/parent readable Thai text
 * e.g. 78 -> "1 ชม. 18 นาที", 25 -> "25 นาที"
 */
export function formatDurationThai(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} นาที`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} ชม.`;
  }
  return `${hours} ชม. ${mins} นาที`;
}
