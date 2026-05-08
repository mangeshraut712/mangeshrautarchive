const CITY_INTELLIGENCE = {
  Philadelphia: {
    culturalSignificance: 'A historic American city where university life, civic architecture, museums, and neighborhood culture overlap.',
    localAtmosphere: 'brick streets, campus energy, riverside walks, and quiet academic corners',
    mustSee: ['30th Street Station', 'Old City', 'Schuylkill River Trail'],
    sensoryDescriptors: ['train-hall echoes', 'fall air', 'museum stone', 'coffee between classes'],
  },
  Pune: {
    culturalSignificance: 'My home base in India: a learning and technology city shaped by Maharashtrian history, forts, monsoon hills, food streets, and student life.',
    localAtmosphere: 'green hills, late-night food streets, engineering campuses, old-city peths, and familiar home-base movement',
    mustSee: ['Shaniwar Wada', 'Aga Khan Palace', 'Sinhagad Fort', 'Dagdusheth Ganpati', 'Pataleshwar Cave Temple'],
    sensoryDescriptors: ['monsoon petrichor', 'cutting chai', 'two-wheeler motion', 'fort wind'],
    homeBase: true,
    guideSummary: 'A compact city guide for Pune: heritage in the old peths, quiet palace gardens, hill-fort mornings, Ganesh festival energy, campus corridors, and cafe streets.',
    bestFor: ['Home base', 'Maratha heritage', 'Monsoon hills', 'Street food', 'Student culture'],
    neighborhoods: ['Shivajinagar', 'FC Road', 'Koregaon Park', 'Kothrud', 'Hinjewadi', 'Viman Nagar'],
    thingsToDo: [
      {
        title: 'Shaniwar Wada',
        category: 'Historic palace fort',
        summary: 'The former Peshwa seat and one of Pune’s strongest cultural symbols, known for Delhi Darwaja, palace remains, fountains, and evening history shows.',
        image: 'https://cdn.s3waas.gov.in/s3ffeabd223de0d4eacb9a3e6e53e5448d/uploads/bfi_thumb/2018040254-olwe31n5ph474jwoxra06pxchcyt06jg01vxl63iz8.jpg',
        source: 'District Pune',
        sourceUrl: 'https://pune.gov.in/en/tourist-place/shaniwarwada/',
      },
      {
        title: 'Aga Khan Palace',
        category: 'Gandhi heritage',
        summary: 'A calm landmark with gardens, arches, and deep connection to India’s freedom movement and the Kasturba Gandhi Memorial.',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Aga_Khan_Palace_Pune.jpg/960px-Aga_Khan_Palace_Pune.jpg',
        source: 'Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Aga_Khan_Palace_Pune.jpg',
      },
      {
        title: 'Sinhagad Fort',
        category: 'Hill fort and trek',
        summary: 'A Sahyadri fort near Pune tied to Tanaji Malusare, sweeping hill views, monsoon trails, and classic kanda bhaji stops.',
        image: 'https://cdn.s3waas.gov.in/s3ffeabd223de0d4eacb9a3e6e53e5448d/uploads/bfi_thumb/2018042587-olwe37a6uhbx27oi0tprloi41o70ad5u0tsugtv5xw.jpg',
        source: 'District Pune',
        sourceUrl: 'https://pune.gov.in/en/tourist-place/sinhagad/',
      },
      {
        title: 'Dagdusheth Ganpati',
        category: 'Temple and festival culture',
        summary: 'One of Pune’s most loved Ganesh temples, especially powerful during Ganeshotsav when the old city becomes a civic celebration.',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Shikhara_of_Dagdusheth_Halwai_Ganpati_Temple%2C_Pune.jpg/960px-Shikhara_of_Dagdusheth_Halwai_Ganpati_Temple%2C_Pune.jpg',
        source: 'Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Shikhara_of_Dagdusheth_Halwai_Ganpati_Temple,_Pune.jpg',
      },
      {
        title: 'Pataleshwar Cave Temple',
        category: 'Rock-cut temple',
        summary: 'An 8th-century rock-cut cave temple in the city, a quiet architectural pause near Shivajinagar.',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Pataleswar_Main_Entrance_Image.jpg/960px-Pataleswar_Main_Entrance_Image.jpg',
        source: 'Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Pataleswar_Main_Entrance_Image.jpg',
      },
    ],
  },
  Mumbai: {
    culturalSignificance: 'India’s cinematic, financial, and coastal metropolis, built around movement, arrival, and dense urban energy.',
    localAtmosphere: 'sea air, terminals, dense streets, glass towers, and late evening lights',
    mustSee: ['Marine Drive', 'Gateway of India', 'Bandra-Worli Sea Link'],
    sensoryDescriptors: ['salt air', 'local train rhythm', 'street food smoke', 'humid neon'],
  },
  Dubai: {
    culturalSignificance: 'A global connection point where airport scale, desert modernity, and vertical architecture meet.',
    localAtmosphere: 'polished terminals, warm night air, reflective towers, and long-haul anticipation',
    mustSee: ['Dubai Creek', 'Burj Khalifa', 'Museum of the Future'],
    sensoryDescriptors: ['terminal light', 'desert heat', 'quiet lounges', 'glass reflections'],
  },
  Newark: {
    culturalSignificance: 'A major New York-area gateway where international arrivals connect into the Northeast corridor.',
    localAtmosphere: 'runway lights, rail links, river crossings, and the first signal of the East Coast',
    mustSee: ['Newark Penn Station', 'Ironbound', 'Branch Brook Park'],
    sensoryDescriptors: ['terminal glass', 'train announcements', 'winter air', 'arrival momentum'],
  },
  'San Juan': {
    culturalSignificance: 'Puerto Rico’s capital blends Caribbean coastline, Spanish colonial streets, forts, and vivid color.',
    localAtmosphere: 'ocean breeze, pastel walls, fort stone, music, and old-city balconies',
    mustSee: ['Old San Juan', 'Castillo San Felipe del Morro', 'Condado'],
    sensoryDescriptors: ['sea salt', 'cobblestone warmth', 'salsa rhythm', 'tropical rain'],
  },
  Miami: {
    culturalSignificance: 'A coastal gateway shaped by Latin American culture, art deco architecture, port energy, and Atlantic light.',
    localAtmosphere: 'palms, waterfront terminals, beach avenues, neon evenings, and bilingual street life',
    mustSee: ['South Beach', 'Wynwood Walls', 'Biscayne Bay'],
    sensoryDescriptors: ['ocean humidity', 'neon glow', 'cafecito aroma', 'terminal horns'],
  },
  Houston: {
    culturalSignificance: 'A sprawling Gulf Coast metropolis known for space, energy, food diversity, and global neighborhoods.',
    localAtmosphere: 'wide skylines, humid evenings, bayou air, and serious food culture',
    mustSee: ['Space Center Houston', 'Museum District', 'Buffalo Bayou Park'],
    sensoryDescriptors: ['warm rain', 'highway scale', 'barbecue smoke', 'bayou air'],
  },
  Chennai: {
    culturalSignificance: 'A coastal South Indian city known for temples, classical arts, technology, beaches, and Tamil culture.',
    localAtmosphere: 'Bay of Bengal air, temple bells, filter coffee, and warm coastal light',
    mustSee: ['Marina Beach', 'Kapaleeshwarar Temple', 'Fort St. George'],
    sensoryDescriptors: ['filter coffee', 'sea wind', 'jasmine', 'temple bells'],
  },
  Hyderabad: {
    culturalSignificance: 'A Deccan city where old-city heritage, biryani culture, and major technology districts meet.',
    localAtmosphere: 'granite hills, evening bazaars, tech parks, pearls, and layered history',
    mustSee: ['Charminar', 'Golconda Fort', 'HITEC City'],
    sensoryDescriptors: ['biryani spice', 'stone heat', 'market lights', 'monsoon clouds'],
  },
  Delhi: {
    culturalSignificance: 'India’s capital layers Mughal monuments, civic power, markets, food, and modern metro movement.',
    localAtmosphere: 'wide boulevards, old-city lanes, winter haze, monuments, and constant political gravity',
    mustSee: ['India Gate', 'Humayun’s Tomb', 'Chandni Chowk'],
    sensoryDescriptors: ['winter fog', 'chaat spice', 'metro hum', 'red sandstone'],
  },
  Jaipur: {
    culturalSignificance: 'Rajasthan’s planned Pink City, known for royal architecture, craft traditions, and desert-edge color.',
    localAtmosphere: 'sandstone geometry, bazaar color, palace courtyards, and warm evening light',
    mustSee: ['Hawa Mahal', 'Amber Fort', 'City Palace'],
    sensoryDescriptors: ['pink stone', 'spice markets', 'dry heat', 'courtyard shadows'],
  },
  Jodhpur: {
    culturalSignificance: 'The Blue City of Rajasthan, anchored by fort architecture and desert trade history.',
    localAtmosphere: 'blue lanes, fort silhouettes, rooftop views, and old-city texture',
    mustSee: ['Mehrangarh Fort', 'Clock Tower Market', 'Jaswant Thada'],
    sensoryDescriptors: ['desert light', 'blue walls', 'market bells', 'stone steps'],
  },
  Jaisalmer: {
    culturalSignificance: 'A golden desert city where sandstone fort walls meet Thar Desert culture.',
    localAtmosphere: 'wind-carved streets, golden stone, desert horizon, and slow sunset drama',
    mustSee: ['Jaisalmer Fort', 'Patwon Ki Haveli', 'Sam Sand Dunes'],
    sensoryDescriptors: ['sand warmth', 'camel bells', 'golden dusk', 'dry wind'],
  },
  Toronto: {
    culturalSignificance: 'A multicultural lakeside metropolis with a strong skyline, food scene, and cross-border urban scale.',
    localAtmosphere: 'lake air, tower views, streetcars, late dinners, and neighborhood diversity',
    mustSee: ['CN Tower', 'Harbourfront', 'Kensington Market'],
    sensoryDescriptors: ['lake breeze', 'streetcar hum', 'night skyline', 'food-market steam'],
  },
  'Washington, DC': {
    culturalSignificance: 'A civic capital organized around monuments, museums, government, and ceremonial space.',
    localAtmosphere: 'broad avenues, marble facades, quiet museums, and formal evening light',
    mustSee: ['National Mall', 'Smithsonian Museums', 'Lincoln Memorial'],
    sensoryDescriptors: ['marble coolness', 'museum hush', 'spring blossoms', 'wide avenues'],
  },
  'Ocean Cay': {
    culturalSignificance: 'A private Bahamian marine reserve stop built around clear water, beach time, and slow cruise-day pacing.',
    localAtmosphere: 'white sand, ship lights, shallow water, and island quiet',
    mustSee: ['Ocean Cay Lighthouse', 'MSC Marine Reserve beaches', 'lagoon shoreline'],
    sensoryDescriptors: ['salt spray', 'soft sand', 'warm water', 'ship lights'],
  },
  'Key West': {
    culturalSignificance: 'The southern edge of the continental United States, known for maritime history, pastel houses, and island eccentricity.',
    localAtmosphere: 'porches, sea wind, harbor walks, and sunset crowds',
    mustSee: ['Mallory Square', 'Southernmost Point', 'Duval Street'],
    sensoryDescriptors: ['lime citrus', 'harbor breeze', 'rooster calls', 'sunset heat'],
  },
};

const CURATED_HOME_CITY_STOPS = [
  {
    id: 'home-pune',
    coordinates: [73.8567, 18.5204],
    name: 'Pune',
    region: 'Maharashtra',
    country: 'India',
    emoji: '🇮🇳',
    tagline: 'Home base in India',
    highlight: 'Maratha heritage, engineering culture, monsoon hills, food streets, and the city I call home',
  },
];

const LOCATION_OVERRIDES = {
  'Sinhagad Fort|Maharashtra|India': {
    city: 'Pune',
    placeName: 'Sinhagad Fort',
    placeKind: 'Hill fort',
  },
  'Midtown Manhattan|New York|USA': {
    city: 'New York City',
    placeName: 'Midtown Manhattan',
    placeKind: 'Neighborhood',
  },
  'Washington D.C.|District of Columbia|USA': {
    city: 'Washington, DC',
  },
  'Biscayne Bay|Florida|USA': {
    city: 'Miami',
    placeName: 'Biscayne Bay',
    placeKind: 'Bay',
  },
  'Clear Lake|Texas|USA': {
    city: 'Houston',
    placeName: 'Clear Lake',
    placeKind: 'Neighborhood',
  },
  'Spring|Texas|USA': {
    city: 'Houston',
    placeName: 'Spring',
    placeKind: 'Suburb',
  },
  'New Delhi|Delhi|India': {
    city: 'Delhi',
    placeName: 'New Delhi',
    placeKind: 'Capital district',
  },
  'Hyderabad East|Telangana|India': {
    city: 'Hyderabad',
    placeName: 'Hyderabad East',
    placeKind: 'District',
  },
  'Dubai South|Dubai|UAE': {
    city: 'Dubai',
    placeName: 'Dubai South',
    placeKind: 'District',
  },
  'Acadia|Maine|USA': {
    city: 'Bar Harbor',
    placeName: 'Acadia National Park',
    placeKind: 'National park',
  },
};

const CITY_ANCHORS = [
  { name: 'Pune', region: 'Maharashtra', country: 'India', emoji: '🇮🇳', coordinates: [73.8567, 18.5204] },
  { name: 'Mumbai', region: 'Maharashtra', country: 'India', emoji: '🇮🇳', coordinates: [72.8777, 19.076] },
  { name: 'Delhi', region: 'Delhi', country: 'India', emoji: '🇮🇳', coordinates: [77.209, 28.6139] },
  { name: 'Hyderabad', region: 'Telangana', country: 'India', emoji: '🇮🇳', coordinates: [78.4867, 17.385] },
  { name: 'Philadelphia', region: 'Pennsylvania', country: 'USA', emoji: '🇺🇸', coordinates: [-75.1652, 39.9526] },
  { name: 'New York City', region: 'New York', country: 'USA', emoji: '🇺🇸', coordinates: [-74.006, 40.7128] },
  { name: 'Washington, DC', region: 'District of Columbia', country: 'USA', emoji: '🇺🇸', coordinates: [-77.0369, 38.9072] },
  { name: 'Miami', region: 'Florida', country: 'USA', emoji: '🇺🇸', coordinates: [-80.1918, 25.7617] },
  { name: 'Houston', region: 'Texas', country: 'USA', emoji: '🇺🇸', coordinates: [-95.3698, 29.7604] },
  { name: 'Dubai', region: 'Dubai', country: 'UAE', emoji: '🇦🇪', coordinates: [55.2708, 25.2048] },
];

const COUNTRY_INTELLIGENCE = {
  India: {
    mood: 'heritage, heat, monsoon movement, regional food, forts, and layered city memory',
    signature: 'forts, coastal places, temples, food streets, markets, and regional city culture',
  },
  USA: {
    mood: 'academic life, city grids, highways, museums, coastlines, and east-coast movement',
    signature: 'riverfronts, skylines, campuses, museums, civic landmarks, and large-scale geography',
  },
  UAE: {
    mood: 'transit scale, glass architecture, desert climate, and global connection',
    signature: 'airports, towers, waterfront districts, and night-lit terminals',
  },
  'Puerto Rico': {
    mood: 'Caribbean color, ocean air, colonial texture, and island pace',
    signature: 'old streets, beaches, forts, rainforests, and coastal light',
  },
};

function isUsefulPlace(stop) {
  const name = String(stop.name || '').trim();
  if (!name) return false;
  return !/(unknown|coordinate|odyssey|unnamed|photo)/i.test(name);
}

function getLocationKey(stop) {
  return `${stop.name}|${stop.region}|${stop.country}`;
}

function getDistanceKm(fromCoordinates, toCoordinates) {
  const [fromLng, fromLat] = fromCoordinates;
  const [toLng, toLat] = toCoordinates;
  const toRadians = degrees => degrees * (Math.PI / 180);
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(toLat - fromLat);
  const deltaLng = toRadians(toLng - fromLng);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(deltaLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestCity(stop, maxDistanceKm = 45) {
  if (!Array.isArray(stop.coordinates)) return null;

  return CITY_ANCHORS
    .filter(city => city.country === stop.country)
    .map(city => ({
      ...city,
      distanceKm: getDistanceKm(stop.coordinates, city.coordinates),
    }))
    .filter(city => city.distanceKm <= maxDistanceKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)[0] || null;
}

function normalizeStopLocation(stop) {
  const override = LOCATION_OVERRIDES[getLocationKey(stop)];
  if (override) {
    return {
      ...stop,
      name: override.city,
      region: override.region || stop.region,
      country: override.country || stop.country,
      emoji: override.emoji || stop.emoji,
      originalName: stop.name,
      placeName: override.placeName || '',
      placeKind: override.placeKind || '',
      resolvedBy: 'curated-location',
    };
  }

  if (isUsefulPlace(stop)) return stop;

  const nearestCity = findNearestCity(stop);
  if (!nearestCity) return null;

  return {
    ...stop,
    name: nearestCity.name,
    region: nearestCity.region,
    country: nearestCity.country,
    emoji: nearestCity.emoji,
    originalName: stop.name || 'Unlabeled location',
    placeName: `Near ${nearestCity.name}`,
    placeKind: 'Nearby location',
    resolvedBy: 'nearest-city',
  };
}

function buildFallbackCityIntelligence(stop) {
  const country = COUNTRY_INTELLIGENCE[stop.country];
  const placeContext = stop.placeName ? `${stop.placeName} is part of the ${stop.name} area and` : stop.name;

  return {
    culturalSignificance: `${placeContext} adds a ${stop.region} perspective to the wider ${stop.country} travel story.`,
    localAtmosphere: country?.mood || 'local movement, arrival energy, and place-specific memory',
    mustSee: [stop.placeName || stop.name, stop.region, country?.signature || 'the surrounding neighborhoods'],
    sensoryDescriptors: ['street texture', 'changing light', 'arrival rhythm', 'local atmosphere'],
  };
}

function dedupeStops(stops) {
  const byPlace = new Map();
  stops.map(normalizeStopLocation).filter(Boolean).forEach(stop => {
    const key = `${stop.name}|${stop.placeName || ''}|${stop.region}|${stop.country}`;
    const current = byPlace.get(key);
    if (!current || stop.photoCount > current.photoCount) {
      byPlace.set(key, stop);
    }
  });
  return [...byPlace.values()];
}

function withCuratedHomeCities(stops) {
  const existing = new Set(stops.map(stop => `${stop.name}|${stop.region}|${stop.country}`));
  const missingHomeCities = CURATED_HOME_CITY_STOPS.filter(
    stop => !existing.has(`${stop.name}|${stop.region}|${stop.country}`)
  );

  return [...missingHomeCities, ...stops];
}

function createWaypoint(stop, index) {
  const intelligence = CITY_INTELLIGENCE[stop.name] || buildFallbackCityIntelligence(stop);
  const whyVisitText = stop.highlight ? `Discover ${stop.highlight}` : `Visit for ${intelligence.mustSee.slice(0, 2).join(' and ').toLowerCase()}, then stay for ${intelligence.localAtmosphere}.`;
  const hasCuratedIntelligence = Boolean(CITY_INTELLIGENCE[stop.name]);
  const headline = stop.placeName ? `${stop.name}: ${stop.placeName}` : `${stop.name}, ${stop.region}`;

  return {
    id: `place-${index + 1}`,
    sourceId: stop.id,
    title: stop.name,
    locality: {
      city: stop.name,
      placeName: stop.placeName || '',
      placeKind: stop.placeKind || '',
      originalName: stop.originalName || stop.name,
      region: stop.region,
      country: stop.country,
      emoji: stop.emoji,
      coordinates: stop.coordinates,
      resolvedBy: stop.resolvedBy || 'source',
    },
    editorial: {
      headline,
      tagline: stop.tagline || intelligence.localAtmosphere,
      highlight: stop.highlight || intelligence.culturalSignificance,
      featured: hasCuratedIntelligence,
      homeBase: Boolean(intelligence.homeBase),
      experience: intelligence.localAtmosphere,
      culturalSignificance: intelligence.culturalSignificance,
      mustSee: intelligence.mustSee,
      sensoryDescriptors: intelligence.sensoryDescriptors,
      whyVisit: stop.placeName ? `${stop.placeName} gives ${stop.name} a more specific travel texture: ${stop.highlight || intelligence.culturalSignificance}` : whyVisitText,
      guideSummary: intelligence.guideSummary || '',
      bestFor: intelligence.bestFor || [],
      neighborhoods: intelligence.neighborhoods || [],
      thingsToDo: intelligence.thingsToDo || [],
    },
  };
}

function createCountryChapters(waypoints) {
  const byCountry = new Map();

  waypoints.forEach(waypoint => {
    const { country, city, region, emoji } = waypoint.locality;
    const current = byCountry.get(country) || {
      name: country,
      emoji,
      cities: new Set(),
      regions: new Set(),
      placeCount: 0,
      intelligence: COUNTRY_INTELLIGENCE[country] || {
        mood: 'distinct local atmosphere and personal travel memory',
        signature: 'landmarks, neighborhoods, public spaces, and arrival moments',
      },
    };

    current.cities.add(city);
    current.regions.add(region);
    current.placeCount += 1;
    byCountry.set(country, current);
  });

  return [...byCountry.values()]
    .map(country => ({
      name: country.name,
      emoji: country.emoji,
      cityCount: country.cities.size,
      regionCount: country.regions.size,
      placeCount: country.placeCount,
      mood: country.intelligence.mood,
      signature: country.intelligence.signature,
    }))
    .sort((a, b) => b.cityCount - a.cityCount || a.name.localeCompare(b.name));
}

function summarizeCountries(countryBreakdown) {
  return countryBreakdown.map(country => ({
    name: country.name,
    emoji: country.emoji,
    cityCount: country.cityCount,
    intelligence: COUNTRY_INTELLIGENCE[country.name] || {
      mood: 'distinct local atmosphere and personal travel memory',
      signature: 'landmarks, neighborhoods, public spaces, and arrival moments',
    },
  }));
}

export function createTravelNarrative(rawTravelData) {
  const waypoints = dedupeStops(withCuratedHomeCities(rawTravelData.stops)).map(createWaypoint);
  const countries = new Set(waypoints.map(waypoint => waypoint.locality.country));
  const cities = new Set(waypoints.map(waypoint => waypoint.locality.city));
  const regions = new Set(waypoints.map(waypoint => `${waypoint.locality.region}|${waypoint.locality.country}`));

  return {
    version: '2026.05.visited-places-atlas',
    summary: {
      countries: countries.size,
      cities: cities.size,
      regions: regions.size,
      waypointCount: waypoints.length,
      headline: 'A personal atlas of countries, cities, and places visited.',
      experienceFocus: 'location intelligence and visited-place storytelling over movement mechanics',
    },
    countryInsights: summarizeCountries(rawTravelData.countryBreakdown),
    countryChapters: createCountryChapters(waypoints),
    waypoints,
  };
}
