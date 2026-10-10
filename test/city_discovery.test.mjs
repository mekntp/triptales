import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { searchCities, getCityRecommendations } from '../src/lib/cityService.ts';

describe('City Discovery & Recommendation Tests', () => {
  it('searchCities fallback provides verified matches for Bangkok and Tokyo', async () => {
    // When offline or mocked query
    const bkkResults = await searchCities('bangkok');
    assert.ok(bkkResults.length > 0, 'Should find Bangkok');
    assert.strictEqual(bkkResults[0].countryCode, 'TH');
    assert.strictEqual(bkkResults[0].name, 'Bangkok');

    const tkyResults = await searchCities('tokyo');
    assert.ok(tkyResults.length > 0, 'Should find Tokyo');
    assert.strictEqual(tkyResults[0].countryCode, 'JP');
  });

  it('searchCities handles Thai query strings accurately', async () => {
    const phichitResults = await searchCities('พิจิตร');
    assert.ok(phichitResults.length > 0, 'Should find Phichit via Thai query');
    assert.strictEqual(phichitResults[0].name, 'Phichit');
  });

  it('getCityRecommendations returns curated highlights for known cities', async () => {
    const bkkRecs = await getCityRecommendations('bangkok', 13.75, 100.49, 'all');
    assert.ok(bkkRecs.length >= 3, 'Bangkok should have at least 3 curated highlights');
    assert.ok(bkkRecs.some((r) => r.category === 'culture'), 'Should include culture highlight');
    assert.ok(bkkRecs.some((r) => r.isFamilyFriendly === true), 'Should include family friendly places');
  });

  it('getCityRecommendations filters by category accurately', async () => {
    const phichitNature = await getCityRecommendations('phichit', 16.44, 100.35, 'family');
    assert.ok(phichitNature.length > 0, 'Should find family category places in Phichit');
    for (const place of phichitNature) {
      assert.strictEqual(place.category, 'family', 'All results must match the family category');
    }
  });

  it('Adding recommendation preserves stable coordinates and metadata', async () => {
    const tokyoRecs = await getCityRecommendations('tokyo', 35.67, 139.65, 'culture');
    assert.ok(tokyoRecs.length > 0);
    const place = tokyoRecs[0];
    assert.ok(place.latitude > 0, 'Latitude must be a valid number');
    assert.ok(place.longitude > 0, 'Longitude must be a valid number');
    assert.ok(place.verifiedSource, 'Must include verified source attribution');
  });
});
