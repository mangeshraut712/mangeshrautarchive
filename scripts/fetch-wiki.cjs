const fs = require('fs');
const path = require('path');
const https = require('https');

const cityDbPath = path.join(__dirname, 'city-db.json');
let cityDb = JSON.parse(fs.readFileSync(cityDbPath, 'utf8'));

const cities = Object.keys(cityDb);
let completed = 0;

function fetchWiki(city) {
  // Try to use a more specific search term if needed, but city name usually works
  const searchTerm = encodeURIComponent(city);
  const options = {
    hostname: 'en.wikipedia.org',
    path: `/api/rest_v1/page/summary/${searchTerm}`,
    method: 'GET',
    headers: { 'User-Agent': 'TravelOdyssey/1.0 (mangeshraut@example.com)' }
  };

  https.get(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      completed++;
      if (res.statusCode === 200) {
        try {
          const result = JSON.parse(data);
          cityDb[city].wikiExtract = result.extract;
          cityDb[city].wikiImage = result.thumbnail ? result.thumbnail.source : null;
          console.log(`✅ ${city}`);
        } catch (_e) {
          console.log(`⚠️ Failed parsing for ${city}`);
        }
      } else {
        console.log(`❌ Not found: ${city}`);
      }

      if (completed === cities.length) {
        fs.writeFileSync(cityDbPath, JSON.stringify(cityDb, null, 2));
        console.log('Finished updating city-db.json');
      }
    });
  }).on('error', (e) => {
    console.error(e);
    completed++;
  });
}

cities.forEach(fetchWiki);
