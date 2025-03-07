const fs = require('fs').promises;
const axios = require('axios');

const defaultHeaders = {
    'user-agent': 'Dart/3.6 (dart:io)',
    'accept': '*/*',
    'accept-encoding': 'gzip',
    'host': 'api.airdroptoken.com'
};

const API_ENDPOINTS = {
    payouts: 'https://api.airdroptoken.com/airdrops/payouts',
    miners: 'https://api.airdroptoken.com/miners/',
    minerDetail: 'https://api.airdroptoken.com/miners/miner/'
};

async function getToken() {
    try {
        const token = await fs.readFile('token.txt', 'utf8');
        return token.trim();
    } catch (error) {
        console.error('Error reading token.txt:', error.message);
        return null;
    }
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function makeApiRequest(endpoint, token) {
    try {
        const response = await axios.get(endpoint, {
            headers: {
                ...defaultHeaders,
                'authorization': `Bearer ${token}`
            },
            timeout: 30000
        });
        return response.data;
    } catch (error) {
        if (error.response?.status === 520) {
            console.log('Cloudflare Error 520 detected, retrying after delay...');
        } else {
            console.log(`Error requesting ${endpoint}:`, 
                error.response?.data?.message || error.message);
        }
        return null;
    }
}

async function startMining() {
    const token = await getToken();
    if (!token) {
        console.log('Cannot proceed without token. Ensure token.txt exists.');
        return;
    }

    console.log('Starting Lamira mining...');
    console.log('Token:', token.substring(0, 20) + '...');
    console.log('Press Ctrl+C to stop the bot');

    while (true) {
        try {
            const minerData = await makeApiRequest(API_ENDPOINTS.minerDetail, token);
            if (minerData) {
                console.log('\nMiner Status:');
                console.log('ADT Earned:', minerData.object.adt_earned);
                console.log('Mining Time Left:', minerData.object.mining_time_left, 'seconds');
                console.log('ADT per Hour:', minerData.object.adt_per_hour);
            }

            const payoutData = await makeApiRequest(API_ENDPOINTS.payouts, token);
            if (payoutData) {
                console.log('\nPayouts Status:', payoutData);
            }

            const minersData = await makeApiRequest(API_ENDPOINTS.miners, token);
            if (minersData) {
                console.log('\nMiners Data:', minersData);
            }

        } catch (error) {
            console.log('Error in mining loop:', error.message);
        }

        console.log('\nWaiting 15 seconds for the next update...');
        await delay(15000);
    }
}

process.on('SIGINT', () => {
    console.log('\nBot stopped by user');
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error.message);
});

startMining();
