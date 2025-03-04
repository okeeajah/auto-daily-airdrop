const fs = require('fs').promises;
const axios = require('axios');

const getHeaders = (token) => ({
    'authority': 'app.kivanet.com',
    'accept': '*/*',
    'accept-language': 'en-US,en;q=0.6',
    'authorization': `Bearer ${token}`,
    'content-type': 'application/json',
    'language': 'en',
    'origin': 'https://app.kivanet.com',
    'referer': 'https://app.kivanet.com/',
    'sec-ch-ua': '"Not(A:Brand";v="99", "Brave";v="133", "Chromium";v="133"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'sec-gpc': '1',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
});

async function getToken() {
    try {
        const token = await fs.readFile('token.txt', 'utf8');
        return token.trim();
    } catch (error) {
        console.error('Error loading token from token.txt:', error.message);
        process.exit(1);
    }
}

function calculateMiningTime(signTime, nowTime) {
    const timeDiffMs = nowTime - signTime;
    const timeDiffSec = timeDiffMs / 1000;
    const hours = Math.floor(timeDiffSec / 3600);
    const minutes = Math.floor((timeDiffSec % 3600) / 60);
    const seconds = Math.floor(timeDiffSec % 60);
    return `${hours} hours ${minutes} minutes ${seconds} seconds`;
}

async function getUserInfo(token) {
    try {
        const response = await axios.get(
            'https://app.kivanet.com/api/user/getUserInfo',
            { headers: getHeaders(token) }
        );
        return response.data.object;
    } catch (error) {
        console.error('Error fetching user info:', error.response?.data || error.message);
        return null;
    }
}

async function getMyAccountInfo(token) {
    try {
        const response = await axios.get(
            'https://app.kivanet.com/api/user/getMyAccountInfo',
            { headers: getHeaders(token) }
        );
        return response.data.object;
    } catch (error) {
        console.error('Error fetching account info:', error.response?.data || error.message);
        return null;
    }
}

async function getSignInfo(token) {
    try {
        const response = await axios.get(
            'https://app.kivanet.com/api/user/getSignInfo',
            { headers: getHeaders(token) }
        );
        return response.data.object;
    } catch (error) {
        console.error('Error fetching sign info:', error.response?.data || error.message);
        return null;
    }
}

async function displayAccountInfo(token) {
    const userInfo = await getUserInfo(token);
    const accountInfo = await getMyAccountInfo(token);
    const signInfo = await getSignInfo(token);

    if (userInfo) {
        console.log('=== KIVA AUTO BOT| AIRDROP INSIDERS ===');
        console.log('ID:', userInfo.id);
        console.log('Email:', userInfo.email);
        console.log('Nickname:', userInfo.nickName);
        console.log('Invite Code:', userInfo.inviteNum);
        console.log('Avatar:', userInfo.avatar);
        console.log('Created Date:', userInfo.createTime);
        console.log('Invite Count:', userInfo.inviteCount);
    }

    if (accountInfo && signInfo) {
        console.log('\n=== Mining Status ===');
        const miningTime = calculateMiningTime(parseInt(signInfo.signTime), parseInt(signInfo.nowTime));
        console.log('Mining Time:', miningTime);
        console.log('Balance:', `${accountInfo.balance} Kiva`);
    }

    console.log('====================\n');
}

async function runBot() {
    const token = await getToken();
    console.log('Token loaded from token.txt');

    await displayAccountInfo(token);

    setInterval(async () => {
        const accountInfo = await getMyAccountInfo(token);
        const signInfo = await getSignInfo(token);

        if (accountInfo && signInfo) {
            const miningTime = calculateMiningTime(parseInt(signInfo.signTime), parseInt(signInfo.nowTime));
            console.log('=== Minute-by-Minute Update ===');
            console.log('Mining Time:', miningTime);
            console.log('Balance:', `${accountInfo.balance} Kiva`);
            console.log('========================\n');
        }
    }, 60 * 1000); 
}

// Run the bot
runBot().catch(console.error);
