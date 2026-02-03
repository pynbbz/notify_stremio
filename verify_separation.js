
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REQUESTS_FILE = path.join(__dirname, 'requests.json');
const BASE_URL = 'http://127.0.0.1:7001';

// Helpers
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function getEntry(fullId) {
    if (!fs.existsSync(REQUESTS_FILE)) return null;
    try {
        const data = JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8'));
        return data.find(r => r.fullId === fullId);
    } catch (e) {
        return null;
    }
}

async function runTests() {
    console.log('Starting verification for Episode Separation...');

    const showId = 'tt16027014'; // Marvel Zombies

    // Test 1: Episode 1
    const ep1 = `${showId}:1:1`;
    console.log(`Requesting Ep 1: ${ep1}`);
    await fetch(`${BASE_URL}/stream/series/${ep1}.json`);
    await sleep(2000);

    // Test 2: Episode 2
    const ep2 = `${showId}:1:2`;
    console.log(`Requesting Ep 2: ${ep2}`);
    await fetch(`${BASE_URL}/stream/series/${ep2}.json`);
    await sleep(2000);

    // Test 3: Episode 1 AGAIN
    console.log(`Requesting Ep 1 AGAIN: ${ep1}`);
    await fetch(`${BASE_URL}/stream/series/${ep1}.json`);
    await sleep(2000);

    const entry1 = getEntry(ep1);
    const entry2 = getEntry(ep2);

    // Checks
    if (entry1 && entry2) {
        console.log('✅ PASS: Both episodes are present as separate entries.');

        if (entry1.requestCount >= 2) { // It might be more if previous tests ran
            console.log(`✅ PASS: Episode 1 count increased (current: ${entry1.requestCount})`);
        } else {
            console.error(`❌ FAIL: Episode 1 count did not increase correctly (current: ${entry1.requestCount})`);
        }
    } else {
        console.error('❌ FAIL: Episodes are missing from requests.json');
        if (!entry1) console.error(`   Missing: ${ep1}`);
        if (!entry2) console.error(`   Missing: ${ep2}`);
    }
}

runTests();
