#!/usr/bin/env node
/**
 * Node script to fetch station info from an external API, geocode addresses via Mapbox,
 * and update src/data/stations.json with coords.
 *
 * Usage:
 * MAPBOX_TOKEN=pk.xxx API_URL=https://... node scripts/updateStations.js
 */
import fs from 'fs/promises';
import path from 'path';

const OUT_FILE = path.resolve('./src/data/stations.json');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJson(url, extraHeaders = {}) {
  const headers = { Accept: 'application/json', ...extraHeaders };
  // If env var SKIP_NGROK_WARNING is set, include the ngrok skip header
  if (process.env.SKIP_NGROK_WARNING && !headers['ngrok-skip-browser-warning']) {
    headers['ngrok-skip-browser-warning'] = '1';
  }
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Fetch ${url} failed: ${res.status}`);
  return res.json();
}

async function geocode(address, token, maxRetries = 3) {
  if (!address) return null;
  const encoded = encodeURIComponent(address);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?limit=1&access_token=${token}`;
  let attempt = 0;
  while (true) {
    try {
      const data = await fetchJson(url);
      if (data.features && data.features.length) {
        const [lng, lat] = data.features[0].center;
        return { lng, lat };
      }
      return null;
    } catch (err) {
      attempt++;
      if (attempt > maxRetries) throw err;
      await sleep(300 * Math.pow(2, attempt - 1));
    }
  }
}

// Preserve station name/address strings as provided by the API (assume they are correctly encoded in Unicode).

async function main() {
  const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;
  let API_URL = process.env.API_URL;
  if (!API_URL) {
    // Fall back to reading API base from src/config.js and hitting the guest battery report endpoint
    try {
      const cfgPath = path.resolve('./src/config.js');
      const txt = await fs.readFile(cfgPath, 'utf8');
      const m = txt.match(/API_BASE_URL\s*=\s*["'`]([^"'`]+)["'`]/);
      if (m && m[1]) {
        const base = String(m[1]).replace(/\/+$/, '');
        API_URL = base + '/webAPI/api/getstations';
        console.log('API_URL not set — using API base from src/config.js ->', API_URL);
      } else {
        console.error('API_URL not set and failed to parse API_BASE_URL from src/config.js');
        process.exit(2);
      }
    } catch (err) {
      console.error('API_URL not set and failed to read src/config.js:', err.message || err);
      process.exit(2);
    }
  }
  if (!MAPBOX_TOKEN) {
    console.warn('MAPBOX_TOKEN not set — geocoding will be skipped for stations that lack coordinates.');
  }

  let stations;
  try {
    if (API_URL.startsWith('http://') || API_URL.startsWith('https://')) {
      const hdrs = {};
      if (process.env.SKIP_NGROK_WARNING) hdrs['ngrok-skip-browser-warning'] = '1';
      // show the exact HTTP URL we'll fetch from
      console.log('Fetching HTTP URL:', API_URL);
      stations = await fetchJson(API_URL, hdrs);
    } else {
      // treat as local file path
      const filePath = path.resolve(API_URL);
      console.log('Reading local file:', filePath);
      const txt = await fs.readFile(filePath, 'utf8');
      stations = JSON.parse(txt);
    }
  } catch (err) {
    console.error('Failed to load stations from API_URL:', err.message || err);
    process.exit(4);
  }
  // Accept either an array directly or an object with `data` array (e.g., { status:'success', data: [...] })
  if (!Array.isArray(stations)) {
    if (stations && Array.isArray(stations.data)) {
      stations = stations.data;
    } else {
      console.error('API did not return an array of stations');
      process.exit(3);
    }
  }

  // Deduplicate station records by stationId if available, otherwise by normalized station name.
  // The battery-report endpoint can return multiple rows per station; collapse them into one entry.
  const originalCount = stations.length;
  const grouped = new Map();
  for (const s of stations) {
    const id = s.Station_ID ?? s.stationId ?? s.id ?? s.ID ?? null;
    const rawName = String(s.stationName ?? s.Name ?? s.name ?? s.station ?? '').trim();
    const nameKey = rawName.toLowerCase();
    const key = id != null ? `id:${id}` : `name:${nameKey}`;
    if (!grouped.has(key)) {
      // shallow clone
      grouped.set(key, { ...s });
    } else {
      const cur = grouped.get(key);
      // prefer entries that already have latitude/longitude
      const curLat = cur.Latitude ?? cur.latitude ?? cur.Lat ?? cur.lat ?? cur.latitude ?? null;
      const curLng = cur.Longitude ?? cur.longitude ?? cur.Lng ?? cur.lng ?? cur.longitude ?? null;
      const sLat = s.Latitude ?? s.latitude ?? s.Lat ?? s.lat ?? s.latitude ?? null;
      const sLng = s.Longitude ?? s.longitude ?? s.Lng ?? s.lng ?? s.longitude ?? null;
      if ((!curLat || !curLng) && (sLat && sLng)) {
        grouped.set(key, { ...cur, ...s });
      }
    }
  }
  stations = Array.from(grouped.values());
  console.log(`Got ${originalCount} station records, ${stations.length} unique stations — geocoding addresses (this may take a while if needed)...`);

  // simple sequential geocoding to be gentle with rate limits; you can parallelize if desired
  const out = [];
  for (const s of stations) {
      // Accept many possible field names from the teammate API
      const id = s.Station_ID ?? s.id ?? s.ID ?? s.stationId ?? s.stationId ?? null;
      // Use provided strings as-is (Vietnamese names are expected and should be preserved)
      const name = String(s.Name ?? s.name ?? s.stationName ?? s.station ?? '');
      const address = String(s.Address ?? s.address ?? s.physical_address ?? s.location ?? s.stationAddress ?? '');

    // If the incoming record already has Latitude/Longitude (or lat/lng), prefer those
    const incomingLat = s.Latitude ?? s.latitude ?? s.Lat ?? s.lat ?? s.latitude ?? null;
    const incomingLng = s.Longitude ?? s.longitude ?? s.Lng ?? s.lng ?? s.longitude ?? null;

    let coords = null;
    if (incomingLat != null && incomingLng != null) {
      coords = { lat: Number(incomingLat), lng: Number(incomingLng) };
    } else if (address && MAPBOX_TOKEN) {
      try {
        coords = await geocode(address, MAPBOX_TOKEN);
      } catch (err) {
        console.warn('Geocode failed for', address, err.message || err);
      }
    } else if (address && !MAPBOX_TOKEN) {
      // If API provided no coords and MAPBOX_TOKEN is not set, we can't geocode — issue a note.
      console.warn(`No MAPBOX_TOKEN; skipping geocode for station ${name || id}`);
    }

    const outItem = {
      id: id,
      name: name,
      address: address,
      latitude: coords ? coords.lat : null,
      longitude: coords ? coords.lng : null,
    };
    // Add coords array for Home.jsx which expects station.coords = [lng, lat]
    if (coords) outItem.coords = [coords.lng, coords.lat];

    out.push(outItem);
    console.log(`Processed: ${name || id} -> ${coords ? `${coords.lat},${coords.lng}` : 'NO_COORD'}`);
    // small delay to avoid hitting API limits
    await sleep(150);
  }

  // create output dir if needed
  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });

  // Backup existing stations.json if present
  try {
    const existing = await fs.readFile(OUT_FILE, 'utf8');
    const backupDir = path.join(path.dirname(OUT_FILE), 'backups');
    await fs.mkdir(backupDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `stations-${timestamp}.json`);
    // write backup with explicit UTF-8 encoding (preserve existing content)
    await fs.writeFile(backupPath, existing, 'utf8');
    console.log('Backed up previous stations.json to', backupPath);
  } catch (err) {
    // ENOENT means file doesn't exist yet — ok to continue
    if (err.code && err.code !== 'ENOENT') {
      console.warn('Warning: failed to backup existing stations.json', err);
    }
  }

  // write new stations file
  // Ensure the output file is saved as UTF-8 with BOM so Windows editors show Vietnamese characters correctly
  const bom = '\uFEFF';
  const content = JSON.stringify(out, null, 2);
  await fs.writeFile(OUT_FILE, bom + content, 'utf8');
  console.log('Wrote (UTF-8) ', OUT_FILE);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
