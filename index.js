import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const addon = express();
addon.use(cors());

const REQUESTS_FILE = path.join(__dirname, 'requests.json');

// Load existing requests or initialize empty array
function loadRequests() {
    try {
        if (fs.existsSync(REQUESTS_FILE)) {
            const data = fs.readFileSync(REQUESTS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading requests:', error);
    }
    return [];
}

// Fetch metadata from Cinemeta API
async function fetchMetadata(type, imdbId) {
    try {
        const url = `https://v3-cinemeta.strem.io/meta/${type}/${imdbId}.json`;
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`Cinemeta API error: ${response.status}`);
            return null;
        }

        const data = await response.json();
        if (data && data.meta) {
            return {
                name: data.meta.name || null,
                year: data.meta.year || data.meta.releaseInfo || null,
                poster: data.meta.poster || null,
                videos: data.meta.videos || []
            };
        }
    } catch (error) {
        console.error('Error fetching metadata:', error);
    }
    return null;
}

// Save request to file (async to fetch metadata)
async function saveRequest(type, id) {
    const requests = loadRequests();

    // Extract just the IMDb ID (remove any :season:episode suffix)
    const imdbId = id.split(':')[0];

    // Validate if episode exists (for BOTH new and existing shows)
    if (id.includes(':')) {
        // We need metadata to validate. 
        // Note: We might fetch metadata twice (here and later), but for validation it's necessary.
        // Optimization: Pass this metadata down if fetched?
        // For simplicity, we'll fetch it here.
        const metadata = await fetchMetadata(type, imdbId);

        if (metadata && metadata.videos) {
            const episodeExists = metadata.videos.some(video => video.id === id);
            if (!episodeExists) {
                console.log(`Skipping invalid episode request: ${id}`);
                return;
            }
        }
    }

    // Check if this ID was already requested (using fullId to distinguish episodes)
    const existingIndex = requests.findIndex(r => r.fullId === id);

    if (existingIndex >= 0) {
        // Update existing request with new timestamp and increment count
        requests[existingIndex].lastRequested = new Date().toISOString();
        requests[existingIndex].requestCount = (requests[existingIndex].requestCount || 1) + 1;

        // If we don't have metadata yet, try to fetch it
        if (!requests[existingIndex].name) {
            const metadata = await fetchMetadata(type, imdbId);
            if (metadata) {
                requests[existingIndex].name = metadata.name;
                requests[existingIndex].year = metadata.year;
                requests[existingIndex].poster = metadata.poster;
            }
        }
    } else {
        // Fetch metadata for new request
        // Optimization: if we already fetched it for validation, we could reuse it.
        // But the previous block only runs if id includes ':'. This block runs for movies too.
        // Let's just re-fetch or keep it simple. The overhead is acceptable for this task.
        const metadata = await fetchMetadata(type, imdbId);

        // Add new request
        requests.push({
            type,
            imdbId,
            fullId: id,
            name: metadata?.name || null,
            year: metadata?.year || null,
            poster: metadata?.poster || null,
            firstRequested: new Date().toISOString(),
            lastRequested: new Date().toISOString(),
            requestCount: 1
        });
    }

    try {
        fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2));
        console.log(`Saved request: ${type} - ${id}${requests[existingIndex >= 0 ? existingIndex : requests.length - 1].name ? ` (${requests[existingIndex >= 0 ? existingIndex : requests.length - 1].name})` : ''}`);
    } catch (error) {
        console.error('Error saving request:', error);
    }
}

const MANIFEST = {
    id: 'org.vidflix.notify',
    version: '1.0.0',
    name: 'VidFlix Notification',
    description: 'Notification addon for Persian content',
    resources: ['stream'],
    types: ['movie', 'series'],
    idPrefixes: ['tt'],
    catalogs: []
};

addon.get('/manifest.json', (req, res) => {
    res.setHeader('Cache-Control', 'max-age=86400'); // Cache for 1 day
    res.send(MANIFEST);
});

addon.get('/stream/:type/:id.json', (req, res) => {
    const { type, id } = req.params;

    // Save the request for tracking
    saveRequest(type, id);

    const streams = [
        {
            name: "❌ Not Available Yet",
            description: "We'll add it as soon as it's available",
            externalUrl: "https://dashboard.namavu.com/#help",
            behaviorHints: { notWebReady: true }
        }
    ];

    res.setHeader('Cache-Control', 'max-age=0, no-cache'); // Disable cache
    res.send({ streams });
});

const PORT = 7001;

addon.listen(PORT, function () {
    console.log(`Notify Addon active on port ${PORT}`);
    console.log(`http://127.0.0.1:${PORT}/manifest.json`);
});
