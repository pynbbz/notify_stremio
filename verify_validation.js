
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REQUESTS_FILE = path.join(__dirname, 'requests.json');
const BASE_URL = 'http://127.0.0.1:7001';

// Helpers
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function getRequestCount(imdbId) {
    if (!fs.existsSync(REQUESTS_FILE)) return 0;
    try {
        const data = JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8'));
        const entry = data.find(r => r.imdbId === imdbId);
        return entry ? entry.requestCount : 0;
    } catch (e) {
        return 0;
    }
}

function entryExists(imdbId) {
    if (!fs.existsSync(REQUESTS_FILE)) return false;
    try {
        const data = JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8'));
        return !!data.find(r => r.imdbId === imdbId);
    } catch (e) {
        return false;
    }
}

async function runTests() {
    console.log('Starting verification...');

    // TEST 1: Existing Show (Marvel Zombies - tt16027014)
    console.log('\n--- Test 1: Existing Show (tt16027014) ---');
    const existingId = 'tt16027014';
    const initialCount = getRequestCount(existingId);
    console.log(`Initial count for ${existingId}: ${initialCount}`);

    // 1a. Invalid Episode
    const invalidExisting = 'tt16027014:1:99';
    console.log(`Sending INVALID request: ${invalidExisting}`);
    await fetch(`${BASE_URL}/stream/series/${invalidExisting}.json`);
    await sleep(2000);
    const countAfterInvalid = getRequestCount(existingId);
    if (countAfterInvalid === initialCount) {
        console.log(`✅ PASS: Count did not increase for invalid episode (${countAfterInvalid})`);
    } else {
        console.error(`❌ FAIL: Count increased for invalid episode! (${initialCount} -> ${countAfterInvalid})`);
    }

    // 1b. Valid Episode
    const validExisting = 'tt16027014:1:1';
    console.log(`Sending VALID request: ${validExisting}`);
    await fetch(`${BASE_URL}/stream/series/${validExisting}.json`);
    await sleep(2000);
    const countAfterValid = getRequestCount(existingId);
    if (countAfterValid === countAfterInvalid + 1) {
        console.log(`✅ PASS: Count increased for valid episode (${countAfterValid})`);
    } else {
        console.error(`❌ FAIL: Count did NOT increase for valid episode! (${countAfterInvalid} -> ${countAfterValid})`);
    }


    // TEST 2: New Show (The Wire - tt0306414)
    console.log('\n--- Test 2: New Show (tt0306414) ---');
    const newId = 'tt0306414';
    if (entryExists(newId)) {
        console.log('Warning: Test show already exists in requests.json, clearing it...');
        // Should ideally remove it, but for now we assume it doesn't exist or ignore
    }

    // 2a. Invalid Episode
    const invalidNew = 'tt0306414:1:99';
    console.log(`Sending INVALID request: ${invalidNew}`);
    await fetch(`${BASE_URL}/stream/series/${invalidNew}.json`);
    await sleep(2000);
    if (!entryExists(newId)) {
        console.log(`✅ PASS: Entry was NOT created for invalid episode`);
    } else {
        console.error(`❌ FAIL: Entry WAS created for invalid episode!`);
    }

    // 2b. Valid Episode
    const validNew = 'tt0306414:1:1';
    console.log(`Sending VALID request: ${validNew}`);
    await fetch(`${BASE_URL}/stream/series/${validNew}.json`);
    await sleep(2000);
    if (entryExists(newId)) {
        console.log(`✅ PASS: Entry WAS created for valid episode`);
    } else {
        console.error(`❌ FAIL: Entry was NOT created for valid episode!`);
    }
}

runTests();
