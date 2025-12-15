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
    const stream = {
        name: "❌ Not Found!",
        description: "🇮🇷 𝐈𝐬 𝐭𝐡𝐢𝐬 𝐚 𝐏𝐞𝐫𝐬𝐢𝐚𝐧 𝐌𝐨𝐯𝐢𝐞/𝐒𝐡𝐨𝐰?\n1. Go back to search results\n2. Scroll down\n3. Play from Persian sections\n\n⚠️ 𝐈𝐟 𝐜𝐨𝐧𝐭𝐞𝐧𝐭 𝐢𝐬𝐧'𝐭 𝐏𝐞𝐫𝐬𝐢𝐚𝐧:\nEmail us its name\nsupport@vidflix.ca",
        externalUrl: "https://dashboard.vidflix.ca/#help",
        behaviorHints: { notWebReady: true }
    };

    res.setHeader('Cache-Control', 'max-age=0, no-cache'); // Disable cache
    res.send({ streams: [stream] });
});

const PORT = 7001;

addon.listen(PORT, function () {
    console.log(`Notify Addon active on port ${PORT}`);
    console.log(`http://127.0.0.1:${PORT}/manifest.json`);
});
