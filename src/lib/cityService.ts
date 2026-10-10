/**
 * City Geocoding & OpenStreetMap-based discovery service
 * Complies with Nominatim / OSM rate limit & attribution guidelines
 * Includes client-side caching to avoid redundant network requests.
 */
import type { CitySearchResult, RecommendedPlace, PlaceCategory } from '../types';

// In-memory cache to respect OSM rate limits and debounce
const searchCache = new Map<string, CitySearchResult[]>();
const recommendationsCache = new Map<string, RecommendedPlace[]>();

/**
 * Curated high-fidelity destination highlights for famous tourist hubs
 * Used as reliable fallback or instant highlights when offline or before remote query.
 */
const CURATED_CITY_HIGHLIGHTS: Record<string, RecommendedPlace[]> = {
  bangkok: [
    {
      id: 'bkk-1',
      name: 'Grand Palace & Wat Phra Kaew',
      category: 'culture',
      categoryLabel: 'Culture & Temple',
      icon: '👑',
      description: 'Historical royal complex with the revered Emerald Buddha and glittering gold pagodas.',
      latitude: 13.7500,
      longitude: 100.4914,
      isFamilyFriendly: true,
      address: 'Na Phra Lan Rd, Phra Borom Maha Ratchawang, Bangkok',
      verifiedSource: 'Curated Heritage',
    },
    {
      id: 'bkk-2',
      name: 'Chatuchak Weekend Market',
      category: 'market',
      categoryLabel: 'Market & Shopping',
      icon: '🛍️',
      description: 'Massive open-air bazaar with thousands of stalls selling crafts, clothing, food and plants.',
      latitude: 13.7999,
      longitude: 100.5504,
      isFamilyFriendly: true,
      address: 'Kamphaeng Phet 2 Rd, Chatuchak, Bangkok',
      verifiedSource: 'Curated Heritage',
    },
    {
      id: 'bkk-3',
      name: 'Lumphini Park',
      category: 'nature',
      categoryLabel: 'Park & Nature',
      icon: '🌳',
      description: 'Green oasis in central Bangkok with paddle boats, playgrounds, and resident monitor lizards.',
      latitude: 13.7314,
      longitude: 100.5417,
      isFamilyFriendly: true,
      address: 'Rama IV Rd, Pathum Wan, Bangkok',
      verifiedSource: 'Curated Heritage',
    },
    {
      id: 'bkk-4',
      name: 'SEA LIFE Bangkok Ocean World',
      category: 'family',
      categoryLabel: 'Family Attractions',
      icon: '🐠',
      description: 'Vast underground aquarium in Siam Paragon featuring sharks, penguins, and interactive tunnels.',
      latitude: 13.7460,
      longitude: 100.5349,
      isFamilyFriendly: true,
      address: 'Siam Paragon B1-B2, Pathum Wan, Bangkok',
      verifiedSource: 'Curated Heritage',
    },
  ],
  phichit: [
    {
      id: 'pct-1',
      name: 'Phichit Heritage Railway Station',
      category: 'attraction',
      categoryLabel: 'Heritage Landmark',
      icon: '🚂',
      description: 'Classic European-style cream railway station built during King Rama V era.',
      latitude: 16.4422,
      longitude: 100.3495,
      isFamilyFriendly: true,
      address: 'Nai Mueang, Phichit',
      verifiedSource: 'Curated Heritage',
    },
    {
      id: 'pct-2',
      name: 'Wat Tha Luang (Luang Phor Phet)',
      category: 'culture',
      categoryLabel: 'Temple & Sacred',
      icon: '🙏',
      description: 'Revered riverside royal monastery enshrining Luang Phor Phet Buddha statue.',
      latitude: 16.4402,
      longitude: 100.3548,
      isFamilyFriendly: true,
      address: 'Nan River Road, Nai Mueang, Phichit',
      verifiedSource: 'Curated Heritage',
    },
    {
      id: 'pct-3',
      name: 'Bung Si Fai Lake & Giant Crocodile',
      category: 'family',
      categoryLabel: 'Park & Family',
      icon: '🐊',
      description: 'Second largest freshwater lake in Thailand with giant Chalawan statue and promenade.',
      latitude: 16.4277,
      longitude: 100.3669,
      isFamilyFriendly: true,
      address: 'Tha Luang, Phichit',
      verifiedSource: 'Curated Heritage',
    },
    {
      id: 'pct-4',
      name: 'Bung Si Fai Freshwater Aquarium',
      category: 'family',
      categoryLabel: 'Aquarium & Science',
      icon: '🐟',
      description: 'Circular aquarium showcase exhibiting indigenous Thai freshwater fishes.',
      latitude: 16.4255,
      longitude: 100.3644,
      isFamilyFriendly: true,
      address: 'Bung Si Fai Park, Phichit',
      verifiedSource: 'Curated Heritage',
    },
  ],
  phitsanulok: [
    {
      id: 'phx-1',
      name: 'Wat Phra Si Rattana Mahathat (Wat Yai)',
      category: 'culture',
      categoryLabel: 'Sacred Landmark',
      icon: '🙏',
      description: 'Famous historic temple enshrining Phra Phuttha Chinnarat, renowned as the most beautiful gold Buddha.',
      latitude: 16.8236,
      longitude: 100.2619,
      isFamilyFriendly: true,
      address: 'Phutthabucha Rd, Nai Mueang, Phitsanulok',
      verifiedSource: 'Curated Heritage',
    },
    {
      id: 'phx-2',
      name: 'Sergeant Major Thawee Folk Museum',
      category: 'culture',
      categoryLabel: 'Museum & Folk Toys',
      icon: '🪵',
      description: 'Extraordinary folk museum with vintage Thai kitchenware, hunting tools, and traditional wooden toys.',
      latitude: 16.8093,
      longitude: 100.2691,
      isFamilyFriendly: true,
      address: 'Wisut Kasat Rd, Nai Mueang, Phitsanulok',
      verifiedSource: 'Curated Heritage',
    },
    {
      id: 'phx-3',
      name: 'Chan Royal Palace Historic Site',
      category: 'attraction',
      categoryLabel: 'Historical Site',
      icon: '🏯',
      description: 'Birthplace of King Naresuan the Great with excavated brick foundations and informative museum.',
      latitude: 16.8306,
      longitude: 100.2608,
      isFamilyFriendly: true,
      address: 'Wang Chan, Nai Mueang, Phitsanulok',
      verifiedSource: 'Curated Heritage',
    },
  ],
  tokyo: [
    {
      id: 'tky-1',
      name: 'Senso-ji Temple & Nakamise-dori',
      category: 'culture',
      categoryLabel: 'Temple & History',
      icon: '⛩️',
      description: 'Oldest Buddhist temple in Tokyo with its iconic Kaminarimon gate and bustling souvenir street.',
      latitude: 35.7148,
      longitude: 139.7967,
      isFamilyFriendly: true,
      address: 'Asakusa, Taito, Tokyo',
      verifiedSource: 'Curated Heritage',
    },
    {
      id: 'tky-2',
      name: 'Ueno Zoo & Ueno Park',
      category: 'family',
      categoryLabel: 'Family & Zoo',
      icon: '🐼',
      description: 'Historic city park with giant pandas, tranquil ponds, and multiple world-class national museums.',
      latitude: 35.7140,
      longitude: 139.7741,
      isFamilyFriendly: true,
      address: 'Uenokoen, Taito, Tokyo',
      verifiedSource: 'Curated Heritage',
    },
    {
      id: 'tky-3',
      name: 'Shinjuku Gyoen National Garden',
      category: 'nature',
      categoryLabel: 'Gardens & Nature',
      icon: '🌸',
      description: 'Sprawling park blending traditional Japanese landscape, English formal, and French gardens.',
      latitude: 35.6852,
      longitude: 139.7101,
      isFamilyFriendly: true,
      address: 'Naitomachi, Shinjuku, Tokyo',
      verifiedSource: 'Curated Heritage',
    },
  ],
  singapore: [
    {
      id: 'sg-1',
      name: 'Gardens by the Bay & Supertree Grove',
      category: 'nature',
      categoryLabel: 'Nature & Futuristic',
      icon: '🌺',
      description: 'Futuristic botanical park featuring towering Supertrees, Flower Dome, and Cloud Forest waterfalls.',
      latitude: 1.2816,
      longitude: 103.8636,
      isFamilyFriendly: true,
      address: 'Marina Gardens Dr, Singapore',
      verifiedSource: 'Curated Heritage',
    },
    {
      id: 'sg-2',
      name: 'Singapore Botanic Gardens',
      category: 'nature',
      categoryLabel: 'UNESCO World Heritage',
      icon: '🌿',
      description: '160-year-old tropical garden with Jacob Ballas Children’s Garden and stunning National Orchid Garden.',
      latitude: 1.3138,
      longitude: 103.8159,
      isFamilyFriendly: true,
      address: 'Cluny Rd, Singapore',
      verifiedSource: 'Curated Heritage',
    },
    {
      id: 'sg-3',
      name: 'Merlion Park & Marina Bay',
      category: 'attraction',
      categoryLabel: 'Iconic Landmark',
      icon: '🦁',
      description: 'Famous waterfront park featuring the half-lion, half-fish water-spouting statue and bay views.',
      latitude: 1.2868,
      longitude: 103.8545,
      isFamilyFriendly: true,
      address: 'Fullerton Rd, Singapore',
      verifiedSource: 'Curated Heritage',
    },
  ],
};

/**
 * Search international cities using OpenStreetMap Nominatim with caching
 */
export async function searchCities(query: string): Promise<CitySearchResult[]> {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length < 2) return [];

  if (searchCache.has(trimmed)) {
    return searchCache.get(trimmed)!;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&featuretype=city&limit=7&addressdetails=1`;

    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en,th,zh',
        'User-Agent': 'TripTales-Family-Travel-PWA/3.0 (https://github.com/mekntp/triptales)',
      },
    });

    if (!res.ok) {
      throw new Error(`Nominatim query failed: ${res.status}`);
    }

    const data = await res.json();
    const results: CitySearchResult[] = (data || []).map((item: any, idx: number) => {
      const address = item.address || {};
      const cityName =
        address.city ||
        address.town ||
        address.municipality ||
        address.village ||
        address.county ||
        item.name;

      const country = address.country || '';
      const countryCode = (address.country_code || '').toUpperCase();

      return {
        id: `${item.osm_id || idx}_${item.lat}_${item.lon}`,
        name: cityName || item.display_name.split(',')[0],
        displayName: item.display_name,
        country,
        countryCode,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        type: item.type || 'city',
      };
    });

    // Deduplicate by normalized name + countryCode
    const seen = new Set<string>();
    const deduplicated = results.filter((r) => {
      const key = `${r.name.toLowerCase()}_${r.countryCode}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    searchCache.set(trimmed, deduplicated);
    return deduplicated;
  } catch (err) {
    console.warn('City geocoding error, providing fallback suggestions:', err);

    // Fallback: match curated cities
    const fallbackMatches: CitySearchResult[] = [];
    if ('bangkok'.includes(trimmed) || 'กรุงเทพ'.includes(trimmed) || '曼谷'.includes(trimmed)) {
      fallbackMatches.push({
        id: 'fallback_bkk',
        name: 'Bangkok',
        displayName: 'Bangkok, Thailand',
        country: 'Thailand',
        countryCode: 'TH',
        latitude: 13.7563,
        longitude: 100.5018,
        type: 'city',
      });
    }
    if ('phichit'.includes(trimmed) || 'พิจิตร'.includes(trimmed) || '披集'.includes(trimmed)) {
      fallbackMatches.push({
        id: 'fallback_pct',
        name: 'Phichit',
        displayName: 'Phichit, Thailand',
        country: 'Thailand',
        countryCode: 'TH',
        latitude: 16.4422,
        longitude: 100.3495,
        type: 'city',
      });
    }
    if ('phitsanulok'.includes(trimmed) || 'พิษณุโลก'.includes(trimmed) || '彭世洛'.includes(trimmed)) {
      fallbackMatches.push({
        id: 'fallback_phx',
        name: 'Phitsanulok',
        displayName: 'Phitsanulok, Thailand',
        country: 'Thailand',
        countryCode: 'TH',
        latitude: 16.8211,
        longitude: 100.2659,
        type: 'city',
      });
    }
    if ('tokyo'.includes(trimmed) || 'โตเกียว'.includes(trimmed) || '东京'.includes(trimmed)) {
      fallbackMatches.push({
        id: 'fallback_tky',
        name: 'Tokyo',
        displayName: 'Tokyo, Japan',
        country: 'Japan',
        countryCode: 'JP',
        latitude: 35.6762,
        longitude: 139.6503,
        type: 'city',
      });
    }
    if ('singapore'.includes(trimmed) || 'สิงคโปร์'.includes(trimmed) || '新加坡'.includes(trimmed)) {
      fallbackMatches.push({
        id: 'fallback_sg',
        name: 'Singapore',
        displayName: 'Singapore',
        country: 'Singapore',
        countryCode: 'SG',
        latitude: 1.3521,
        longitude: 103.8198,
        type: 'city',
      });
    }

    return fallbackMatches;
  }
}

/**
 * Fetch recommended POIs for a destination city
 */
export async function getCityRecommendations(
  cityName: string,
  lat: number,
  lon: number,
  category: PlaceCategory = 'all'
): Promise<RecommendedPlace[]> {
  const normCity = cityName.toLowerCase().trim();
  const cacheKey = `${normCity}_${lat.toFixed(2)}_${lon.toFixed(2)}`;

  if (recommendationsCache.has(cacheKey)) {
    const list = recommendationsCache.get(cacheKey)!;
    return filterByCategory(list, category);
  }

  // Check if we have curated highlights for this city
  for (const [key, curatedList] of Object.entries(CURATED_CITY_HIGHLIGHTS)) {
    if (normCity.includes(key) || key.includes(normCity)) {
      recommendationsCache.set(cacheKey, curatedList);
      return filterByCategory(curatedList, category);
    }
  }

  // If no curated highlights, query OpenStreetMap Overpass / Nominatim POIs around coordinates
  try {
    const radius = 10000; // 10 km
    const overpassQuery = `
      [out:json][timeout:10];
      (
        node["tourism"~"attraction|museum|theme_park|zoo|aquarium|viewpoint"](around:${radius},${lat},${lon});
        node["historic"~"monument|castle|memorial|ruins"](around:${radius},${lat},${lon});
        node["leisure"~"park|water_park"](around:${radius},${lat},${lon});
      );
      out 15;
    `;

    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: overpassQuery,
    });

    if (res.ok) {
      const data = await res.json();
      const fetched: RecommendedPlace[] = (data.elements || [])
        .filter((el: any) => el.tags && (el.tags.name || el.tags['name:en']))
        .slice(0, 10)
        .map((el: any, idx: number) => {
          const tags = el.tags;
          const name = tags['name:en'] || tags.name;
          const tourism = tags.tourism || '';
          const leisure = tags.leisure || '';

          let cat: PlaceCategory = 'attraction';
          let catLabel = 'Attraction';
          let icon = '📍';
          let isFamily = false;

          if (tourism === 'museum') {
            cat = 'culture';
            catLabel = 'Museum & Culture';
            icon = '🏛️';
            isFamily = true;
          } else if (leisure === 'park' || tourism === 'viewpoint') {
            cat = 'nature';
            catLabel = 'Park & Nature';
            icon = '🌳';
            isFamily = true;
          } else if (tourism === 'zoo' || tourism === 'aquarium' || tourism === 'theme_park') {
            cat = 'family';
            catLabel = 'Family Fun';
            icon = '🎡';
            isFamily = true;
          }

          return {
            id: `osm_${el.id || idx}`,
            name,
            category: cat,
            categoryLabel: catLabel,
            icon,
            description: tags.description || `Popular ${catLabel.toLowerCase()} in ${cityName}.`,
            latitude: el.lat,
            longitude: el.lon,
            isFamilyFriendly: isFamily,
            address: tags['addr:street'] ? `${tags['addr:street']}, ${cityName}` : cityName,
            verifiedSource: 'OpenStreetMap',
          };
        });

      if (fetched.length > 0) {
        recommendationsCache.set(cacheKey, fetched);
        return filterByCategory(fetched, category);
      }
    }
  } catch (err) {
    console.warn('Live Overpass POI query failed, using city center fallback:', err);
  }

  // Fallback: create city center landmark
  const fallbackList: RecommendedPlace[] = [
    {
      id: `center_${normCity}`,
      name: `${cityName} City Center`,
      category: 'attraction',
      categoryLabel: 'City Center',
      icon: '🏙️',
      description: `Downtown central area and starting point for exploring ${cityName}.`,
      latitude: lat,
      longitude: lon,
      isFamilyFriendly: true,
      address: cityName,
      verifiedSource: 'City Discovery',
    },
  ];

  recommendationsCache.set(cacheKey, fallbackList);
  return filterByCategory(fallbackList, category);
}

function filterByCategory(list: RecommendedPlace[], category: PlaceCategory): RecommendedPlace[] {
  if (category === 'all') return list;
  return list.filter((p) => p.category === category);
}
