const fs = require('fs');

const rawData = fs.readFileSync('locations.json', 'utf8');
const photos = JSON.parse(rawData);

const validCoordinates = photos
  .filter(p => p.GPSLatitude && p.GPSLongitude)
  .map(p => [p.GPSLongitude, p.GPSLatitude]);

const uniqueCoordinates = Array.from(new Set(validCoordinates.map(JSON.stringify))).map(JSON.parse);

const jsContent = `export const photoLocations = ${JSON.stringify(uniqueCoordinates, null, 2)};`;

fs.writeFileSync('src/js/data/photo-locations.js', jsContent, 'utf8');

console.log(`Extracted ${uniqueCoordinates.length} unique coordinates from ${photos.length} total photos.`);
