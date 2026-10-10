import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Import compiled or transpiled route functions or replicate logic for standalone test
import {
  calculateHaversineDistanceKm,
  estimateDrivingDistanceAndTime,
  calculateRouteSummary,
  optimizePlacesOrder,
  generateGoogleMapsDirectionsUrl,
  generateGoogleMapsLegUrl,
} from '../src/lib/route.ts';

describe('Route Estimation & Navigation Tests', () => {
  const stationPlace = {
    id: 'p-1',
    name: 'Phichit Railway Station',
    icon: '🚂',
    subtitle: 'Classic Station',
    description: 'Station',
    tags: [],
    googleMapsUrl: 'https://maps.google.com/?q=16.4422,100.3495',
    latitude: 16.4422,
    longitude: 100.3495,
    sortOrder: 1,
    status: 'planned',
  };

  const watThaLuang = {
    id: 'p-2',
    name: 'Wat Tha Luang',
    icon: '🙏',
    subtitle: 'Sacred Temple',
    description: 'Temple',
    tags: [],
    googleMapsUrl: 'https://maps.google.com/?q=16.4404,100.3551',
    latitude: 16.4404,
    longitude: 100.3551,
    sortOrder: 2,
    status: 'planned',
  };

  const bungSiFai = {
    id: 'p-3',
    name: 'Bung Si Fai',
    icon: '🐊',
    subtitle: 'Lake',
    description: 'Lake',
    tags: [],
    googleMapsUrl: 'https://maps.google.com/?q=16.4258,100.3394',
    latitude: 16.4258,
    longitude: 100.3394,
    sortOrder: 3,
    status: 'planned',
  };

  test('Haversine distance calculation is accurate', () => {
    const dist = calculateHaversineDistanceKm(
      stationPlace.latitude,
      stationPlace.longitude,
      watThaLuang.latitude,
      watThaLuang.longitude
    );
    assert.ok(dist > 0.5 && dist < 1.0, `Expected distance ~0.6km, got ${dist}`);
  });

  test('Driving distance includes road winding multiplier', () => {
    const { distanceKm, durationMinutes } = estimateDrivingDistanceAndTime(
      stationPlace.latitude,
      stationPlace.longitude,
      bungSiFai.latitude,
      bungSiFai.longitude
    );
    assert.ok(distanceKm > 1.5, `Distance should be > 1.5km, got ${distanceKm}`);
    assert.ok(durationMinutes >= 2, `Duration should be >= 2 mins, got ${durationMinutes}`);
  });

  test('calculateRouteSummary correctly sums distance and skips skipped stops', () => {
    const places = [
      stationPlace,
      { ...watThaLuang, status: 'skipped' },
      bungSiFai,
    ];

    const summary = calculateRouteSummary(places);
    assert.equal(summary.legs.length, 1, 'Should have exactly 1 active leg between station and bungSiFai');
    assert.equal(summary.legs[0].fromPlaceId, 'p-1');
    assert.equal(summary.legs[0].toPlaceId, 'p-3');
    assert.ok(summary.totalDistanceKm > 0);
  });

  test('generateGoogleMapsLegUrl creates valid turn-by-turn URL', () => {
    const url = generateGoogleMapsLegUrl(stationPlace, watThaLuang);
    assert.ok(url.startsWith('https://www.google.com/maps/dir/?api=1'));
    assert.ok(url.includes('origin=16.4422%2C100.3495') || url.includes('origin=16.4422,100.3495'));
    assert.ok(url.includes('destination=16.4404%2C100.3551') || url.includes('destination=16.4404,100.3551'));
    assert.ok(url.includes('travelmode=driving'));
  });

  test('generateGoogleMapsDirectionsUrl creates valid multi-stop URL', () => {
    const url = generateGoogleMapsDirectionsUrl([stationPlace, watThaLuang, bungSiFai]);
    assert.ok(url.includes('origin=16.4422,100.3495'));
    assert.ok(url.includes('destination=16.4258,100.3394'));
    assert.ok(url.includes('waypoints=16.4404,100.3551'));
  });

  test('optimizePlacesOrder keeps origin place anchored and retains all places', () => {
    const places = [stationPlace, bungSiFai, watThaLuang];
    const result = optimizePlacesOrder(places, true);

    assert.equal(result.proposedPlaces[0].id, stationPlace.id, 'First place must remain start anchor');
    assert.equal(result.proposedPlaces.length, places.length, 'All places must be retained');
    const ids = new Set(result.proposedPlaces.map((p) => p.id));
    assert.equal(ids.size, 3, 'No duplicate or missing places in optimization');
  });
});
