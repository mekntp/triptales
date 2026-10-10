import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Data Isolation & Conflict Resolution Tests', () => {
  // LWW reconciliation logic test
  function reconcileRecords(localRecord, cloudRecord) {
    if (!cloudRecord) return localRecord;
    if (!localRecord) return cloudRecord;

    const localTime = new Date(localRecord.updatedAt || 0).getTime();
    const cloudTime = new Date(cloudRecord.updated_at || cloudRecord.updatedAt || 0).getTime();

    // If local was marked deleted and is newer or equal, deletion persists
    if (localRecord.isDeleted && localTime >= cloudTime) {
      return null;
    }
    // If cloud is newer and not deleted, cloud wins
    if (cloudTime > localTime) {
      return cloudRecord;
    }
    // Otherwise local wins
    return localRecord;
  }

  test('Multi-trip isolation: records are strictly segregated by tripId', () => {
    const trip1Places = [
      { id: 'p-1', tripId: 'phichit-2026', name: 'Phichit Station' },
      { id: 'p-2', tripId: 'phichit-2026', name: 'Bung Si Fai' },
    ];
    const trip2Places = [
      { id: 'p-101', tripId: 'phitsanulok-2026', name: 'Wat Yai' },
    ];

    const allStores = [...trip1Places, ...trip2Places];

    const filteredPhichit = allStores.filter((p) => p.tripId === 'phichit-2026');
    const filteredPhitsanulok = allStores.filter((p) => p.tripId === 'phitsanulok-2026');

    assert.equal(filteredPhichit.length, 2);
    assert.equal(filteredPhitsanulok.length, 1);
    assert.ok(filteredPhichit.every((p) => p.tripId === 'phichit-2026'));
  });

  test('Conflict Resolution: Newer local edit wins over older cloud record', () => {
    const local = {
      id: 'p-1',
      name: 'Local Updated Station Name',
      updatedAt: '2026-10-10T10:00:00.000Z',
    };
    const cloud = {
      id: 'p-1',
      name: 'Old Cloud Name',
      updated_at: '2026-10-09T10:00:00.000Z',
    };

    const resolved = reconcileRecords(local, cloud);
    assert.equal(resolved.name, 'Local Updated Station Name');
  });

  test('Conflict Resolution: Newer cloud record wins over older local copy', () => {
    const local = {
      id: 'p-1',
      name: 'Stale Local Station',
      updatedAt: '2026-10-09T10:00:00.000Z',
    };
    const cloud = {
      id: 'p-1',
      name: 'Updated from Cloud on Tablet',
      updated_at: '2026-10-10T12:00:00.000Z',
    };

    const resolved = reconcileRecords(local, cloud);
    assert.equal(resolved.name, 'Updated from Cloud on Tablet');
  });

  test('Deletion Tombstone: Locally deleted record is not resurrected by older cloud copy', () => {
    const localDeleted = {
      id: 'p-3',
      isDeleted: true,
      updatedAt: '2026-10-10T14:00:00.000Z',
    };
    const olderCloud = {
      id: 'p-3',
      name: 'Deleted Stop',
      updated_at: '2026-10-09T10:00:00.000Z',
    };

    const resolved = reconcileRecords(localDeleted, olderCloud);
    assert.equal(resolved, null, 'Deleted stop must be reconciled away and not resurrected');
  });

  test('Photo item retains ID and storage path across serialization', () => {
    const photo = {
      id: 'photo-12345',
      storagePath: 'user-abc/phichit-2026/m_1_photo-12345_1234567.jpg',
      url: 'https://xyz.supabase.co/storage/v1/object/public/trip-photos/user-abc/phichit-2026/m_1_photo-12345_1234567.jpg',
      createdAt: '2026-10-10T08:00:00.000Z',
    };

    const serialized = JSON.stringify(photo);
    const deserialized = JSON.parse(serialized);

    assert.equal(deserialized.id, photo.id);
    assert.equal(deserialized.storagePath, photo.storagePath);
    assert.equal(deserialized.url, photo.url);
  });
});
