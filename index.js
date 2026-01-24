import express from 'express';
import cors from 'cors';

const addon = express();
addon.use(cors());

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
    const streams = [
        {
            name: "❌ No Results?",
            description: "Email us its name\nsupport@namavu.com",
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
