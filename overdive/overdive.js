const fs = require('fs').promises;
const readline = require('readline');
const axios = require('axios');
const { ethers } = require('ethers');
const { HttpsProxyAgent } = require('https-proxy-agent'); 
const { SocksProxyAgent } = require('socks-proxy-agent'); 

console.log(`
----------------------------------------
Overdive Auto Bot | AirdropInsider
----------------------------------------
Join us : https://t.me/AirdropInsiderID
`);

const CREATE_WALLET_URL = 'https://overdive.xyz/api/membership/wallet/create/';
const QUESTS_URL = 'https://overdive.xyz/api/membership/wallet-quests/';
const headers = {
    'accept': 'application/json, text/plain, */*',
    'accept-encoding': 'gzip, deflate, br, zstd',
    'accept-language': 'en-US,en;q=0.9',
    'content-type': 'application/json',
    'origin': 'https://fun.overdive.xyz',
    'referer': 'https://fun.overdive.xyz/',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site',
    'sec-gpc': '1',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0',
    'sec-ch-ua': '"Not(A:Brand";v="99", "Microsoft Edge";v="133", "Chromium";v="133"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"'
};

async function readPrivateKeys() {
    try {
        const data = await fs.readFile('pk.txt', 'utf8');
        return data.split('\n').map(pk => pk.trim()).filter(pk => pk);
    } catch (error) {
        console.error('Error reading pk.txt:', error);
        return [];
    }
}

async function readProxies() {
    try {
        const data = await fs.readFile('proxies.txt', 'utf8');
        return data.split('\n').map(proxy => proxy.trim()).filter(proxy => proxy);
    } catch (error) {
        console.error('Error reading proxies.txt:', error);
        return [];
    }
}

function walletFromPrivateKey(privateKey) {
    try {
        return new ethers.Wallet(privateKey);
    } catch (error) {
        console.error('Invalid private key:', error.message);
        return null;
    }
}

function getProxyAgent(proxyString) {
    if (!proxyString) return null;
    
    try {
        let protocol, auth, host, port;
        
        if (proxyString.includes('://')) {
            const parts = proxyString.split('://');
            protocol = parts[0].toLowerCase();
            proxyString = parts[1];
        } else {
            protocol = 'http';
        }
        
        if (proxyString.includes('@')) {
            const parts = proxyString.split('@');
            auth = parts[0];
            proxyString = parts[1];
        }
        
        const hostPortParts = proxyString.split(':');
        host = hostPortParts[0];
        port = hostPortParts[1] || (protocol === 'http' || protocol === 'https' ? '80' : '1080');
        
        let proxyUrl;
        if (auth) {
            proxyUrl = `${protocol}://${auth}@${host}:${port}`;
        } else {
            proxyUrl = `${protocol}://${host}:${port}`;
        }
        
        if (protocol === 'http' || protocol === 'https') {
            return new HttpsProxyAgent(proxyUrl);
        } else if (protocol === 'socks4') {
            return new SocksProxyAgent(proxyUrl);
        } else if (protocol === 'socks5') {
            return new SocksProxyAgent(proxyUrl);
        } else {
            console.error(`Unsupported proxy protocol: ${protocol}`);
            return null;
        }
    } catch (error) {
        console.error(`Error creating proxy agent for ${proxyString}:`, error.message);
        return null;
    }
}

async function fetchQuests(walletAddress, proxyAgent) {
    try {
        const url = `${QUESTS_URL}?wallet_address=${walletAddress}`;
        const config = { headers };
        if (proxyAgent) config.httpsAgent = proxyAgent;
        const response = await axios.get(url, config);
        return response.data;
    } catch (error) {
        console.error(`Error fetching quests for wallet ${walletAddress}:`, error.response?.data || error.message);
        return null;
    }
}

async function completeQuest(walletAddress, questId, questName, proxyAgent) {
    try {
        const url = `${QUESTS_URL}${questId}/complete/`;
        const payload = { wallet_address: walletAddress };
        const config = { headers };
        if (proxyAgent) config.httpsAgent = proxyAgent;
        const response = await axios.post(url, payload, config);
        if (response.data.success) {
            console.log(`Quest "${questName}" (ID: ${questId}) completed. Points earned: ${response.data.points_earned}`);
            return { success: true, points: response.data.points_earned };
        } else {
            console.log(`Quest "${questName}" (ID: ${questId}) failed: ${response.data.message}`);
            return { success: false, error: response.data.message };
        }
    } catch (error) {
        console.error(`Error completing quest ${questId} for wallet ${walletAddress}:`, error.response?.data || error.message);
        return { success: false, error: error.message };
    }
}

async function processAllQuests(walletAddress, proxyAgent) {
    let questsData = await fetchQuests(walletAddress, proxyAgent);
    if (!questsData || !questsData.success) return;

    const totalPointsBefore = questsData.total_points || 0;
    console.log(`Total points before quests for wallet ${walletAddress}: ${totalPointsBefore}`);

    const quests = questsData.quests.filter(
        quest => quest.is_active && !quest.is_completed
    );

    for (const quest of quests) {
        console.log(`Processing quest "${quest.name}" (ID: ${quest.id}) for wallet ${walletAddress}`);
        const result = await completeQuest(walletAddress, quest.id, quest.name, proxyAgent);
        if (result.success) {
            questsData = await fetchQuests(walletAddress, proxyAgent);
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const totalPointsAfter = questsData?.total_points || 0;
    console.log(`Total points after quests for wallet ${walletAddress}: ${totalPointsAfter}`);
}

async function performDailyCheckIn(walletAddress, proxyAgent) {
    const questsData = await fetchQuests(walletAddress, proxyAgent);
    if (!questsData || !questsData.success) {
        console.log(`Failed to fetch quests for wallet ${walletAddress}. Starting countdown anyway.`);
        startCountdown(walletAddress, proxyAgent);
        return;
    }

    const dailyQuest = questsData.quests.find(
        quest => quest.id === 4 && quest.is_active && !quest.is_completed
    );

    if (dailyQuest) {
        console.log(`Performing daily check-in for wallet ${walletAddress}`);
        const result = await completeQuest(walletAddress, 4, dailyQuest.name, proxyAgent);
        if (result.success) {
            const totalPoints = (await fetchQuests(walletAddress, proxyAgent))?.total_points || 0;
            console.log(`Daily check-in completed. Total points: ${totalPoints}`);
        } else {
            console.log(`Daily check-in failed for wallet ${walletAddress}. Starting countdown anyway.`);
        }
    } else {
        console.log(`Daily check-in (ID: 4) not available or already completed for wallet ${walletAddress} today. Starting countdown.`);
    }
    startCountdown(walletAddress, proxyAgent);
}

function startCountdown(walletAddress, proxyAgent) {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(now.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0); 
    const timeLeft = tomorrow - now;

    console.log(`Next daily check-in for wallet ${walletAddress} available in:`);
    const countdown = setInterval(() => {
        const remaining = tomorrow - new Date();
        if (remaining <= 0) {
            clearInterval(countdown);
            console.log(`\nDaily check-in now available for wallet ${walletAddress}!`);
            performDailyCheckIn(walletAddress, proxyAgent); 
        } else {
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
            process.stdout.write(`\r${hours}h ${minutes}m ${seconds}s`);
        }
    }, 1000);
}

async function testProxyConnection(proxy) {
    try {
        const proxyAgent = getProxyAgent(proxy);
        if (!proxyAgent) {
            return { success: false, message: 'Failed to create proxy agent' };
        }
        
        console.log(`Testing proxy connection: ${proxy}`);
        const response = await axios.get('https://api.ipify.org?format=json', {
            httpsAgent: proxyAgent,
            timeout: 10000
        });
        
        return { 
            success: true, 
            ip: response.data.ip,
            message: `Proxy working. Your IP: ${response.data.ip}`
        };
    } catch (error) {
        return { 
            success: false, 
            message: `Proxy test failed: ${error.message}`
        };
    }
}

async function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const privateKeys = await readPrivateKeys();
    if (privateKeys.length === 0) {
        console.log('No private keys found in pk.txt.');
        rl.close();
        return;
    }

    const proxies = await readProxies();
    console.log(`Loaded ${privateKeys.length} private keys and ${proxies.length} proxies.`);

    const wallets = [];
    console.log(`Loading wallets from pk.txt...`);
    for (let i = 0; i < privateKeys.length; i++) {
        const wallet = walletFromPrivateKey(privateKeys[i]);
        if (wallet) {
            console.log(`Loaded wallet ${i + 1}/${privateKeys.length}: ${wallet.address}`);
            wallets.push({
                wallet,
                proxy: proxies.length > 0 ? proxies[i % proxies.length] : null 
            });
        } else {
            console.log(`Failed to load wallet from private key ${i + 1}`);
        }
    }

    if (wallets.length === 0) {
        console.log('No valid wallets to process.');
        rl.close();
        return;
    }

    const actionChoice = await new Promise(resolve => {
        rl.question('Choose an action:\n1. Complete all quests\n2. Perform daily check-in\n3. Test proxy connections\nEnter 1, 2, or 3: ', answer => {
            resolve(parseInt(answer));
        });
    });
    
    if (actionChoice === 3) {
        
        if (proxies.length === 0) {
            console.log('No proxies to test. Please add proxies to proxies.txt');
            rl.close();
            return;
        }
        
        console.log('Testing proxy connections...');
        for (let i = 0; i < proxies.length; i++) {
            const result = await testProxyConnection(proxies[i]);
            console.log(`Proxy ${i+1}: ${proxies[i]} - ${result.success ? '✅ ' + result.message : '❌ ' + result.message}`);
        }
        
        rl.close();
        return;
    }
    
    rl.close();

    for (const { wallet, proxy } of wallets) {
        let proxyAgent = null;
        if (proxy) {
            proxyAgent = getProxyAgent(proxy);
            console.log(`Using proxy: ${proxy} for wallet ${wallet.address}`);
            if (!proxyAgent) {
                console.log(`Warning: Failed to create proxy agent for ${proxy}. Continuing without proxy.`);
            }
        } else {
            console.log(`No proxy assigned for wallet ${wallet.address}`);
        }

        if (actionChoice === 1) {
            await processAllQuests(wallet.address, proxyAgent);
        } else if (actionChoice === 2) {
            await performDailyCheckIn(wallet.address, proxyAgent);
        } else {
            console.log('Invalid action choice. Skipping wallet:', wallet.address);
        }
        await new Promise(resolve => setTimeout(resolve, 2000)); 
    }

    console.log('Process completed!');
}

// Run the script
main().catch(error => console.error('Unexpected error:', error));
