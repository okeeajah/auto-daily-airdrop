const fs = require('fs').promises;
const readline = require('readline');
const axios = require('axios');
const { ethers } = require('ethers');

// Kode Warna ANSI
const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const MAGENTA = "\x1b[35m";
const CYAN = "\x1b[36m";

console.log(`
${CYAN}----------------------------------------${RESET}
${YELLOW}Overdive Auto Bot | AirdropInsider${RESET}
${CYAN}----------------------------------------${RESET}
${GREEN}Gabung kami : https://t.me/AirdropInsiderID${RESET}
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
        console.error(`${RED}Error membaca pk.txt:${RESET}`, error);
        return [];
    }
}

function walletFromPrivateKey(privateKey) {
    try {
        return new ethers.Wallet(privateKey);
    } catch (error) {
        console.error(`${RED}Private key tidak valid:${RESET}`, error.message);
        return null;
    }
}

async function fetchQuests(walletAddress) {
    try {
        const url = `${QUESTS_URL}?wallet_address=${walletAddress}`;
        const response = await axios.get(url, { headers });
        return response.data;
    } catch (error) {
        console.error(`${RED}Error mengambil quests untuk wallet ${walletAddress}:${RESET}`, error.response?.data || error.message);
        return null;
    }
}

async function completeQuest(walletAddress, questId, questName) {
    try {
        const url = `${QUESTS_URL}${questId}/complete/`;
        const payload = { wallet_address: walletAddress };
        const response = await axios.post(url, payload, { headers });
        if (response.data.success) {
            console.log(`${GREEN}Quest "${questName}" (ID: ${questId}) selesai. Poin yang didapatkan: ${response.data.points_earned}${RESET}`);
            return { success: true, points: response.data.points_earned };
        } else {
            console.log(`${RED}Quest "${questName}" (ID: ${questId}) gagal: ${response.data.message}${RESET}`);
            return { success: false, error: response.data.message };
        }
    } catch (error) {
        console.error(`${RED}Error menyelesaikan quest ${questId} untuk wallet ${walletAddress}:${RESET}`, error.response?.data || error.message);
        return { success: false, error: error.message };
    }
}

async function processAllQuests(walletAddress) {
    let questsData = await fetchQuests(walletAddress);
    if (!questsData || !questsData.success) return;

    const totalPointsBefore = questsData.total_points || 0;
    console.log(`Total poin sebelum quests untuk wallet ${walletAddress}: ${totalPointsBefore}`);

    const quests = questsData.quests.filter(
        quest => quest.is_active && !quest.is_completed
    );

    for (const quest of quests) {
        console.log(`Memproses quest "${quest.name}" (ID: ${quest.id}) untuk wallet ${walletAddress}`);
        const result = await completeQuest(walletAddress, quest.id, quest.name);
        if (result.success) {
            questsData = await fetchQuests(walletAddress);
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const totalPointsAfter = questsData?.total_points || 0;
    console.log(`Total poin setelah quests untuk wallet ${walletAddress}: ${totalPointsAfter}`);
}

async function performDailyCheckIn(walletAddress) {
    const questsData = await fetchQuests(walletAddress);
    if (!questsData || !questsData.success) {
        console.log(`${RED}Gagal mengambil quests untuk wallet ${walletAddress}.${RESET}`);
        return;
    }

    const dailyQuest = questsData.quests.find(
        quest => quest.id === 4 && quest.is_active && !quest.is_completed
    );

    if (dailyQuest) {
        console.log(`Melakukan daily check-in untuk wallet ${walletAddress}`);
        const result = await completeQuest(walletAddress, 4, dailyQuest.name);
        if (result.success) {
            const totalPoints = (await fetchQuests(walletAddress))?.total_points || 0;
            console.log(`${GREEN}Daily check-in selesai. Total poin: ${totalPoints}${RESET}`);
        } else {
            console.log(`${RED}Daily check-in gagal untuk wallet ${walletAddress}.${RESET}`);
        }
    } else {
        console.log(`Daily check-in tidak tersedia atau sudah selesai untuk wallet ${walletAddress}.`);
    }
}

// Fungsi untuk menunggu dengan Promise
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    while (true) {
        const privateKeys = await readPrivateKeys();
        if (privateKeys.length === 0) {
            console.log(`${RED}Tidak ada private key yang ditemukan di pk.txt.${RESET}`);
            return;
        }

        for (let i = 0; i < privateKeys.length; i++) {
            const wallet = walletFromPrivateKey(privateKeys[i]);
            if (!wallet) continue;

            console.log(`${MAGENTA}Memulai proses untuk wallet: ${wallet.address}${RESET}`);

            // Daily Check-In
            console.log(`${YELLOW}Memulai daily check-in...${RESET}`);
            await performDailyCheckIn(wallet.address);

            // Selesaikan Semua Quests
            console.log(`${YELLOW}Memulai menyelesaikan semua quests...${RESET}`);
            await processAllQuests(wallet.address);

            // Tunggu sebelum melanjutkan ke wallet berikutnya
            console.log(`${CYAN}Menunggu 2 detik sebelum melanjutkan ke wallet berikutnya...${RESET}`);
            await sleep(2000);
        }

        // Tambahkan cooldown
        const cooldownHours = 24; // Ubah sesuai kebutuhan
        console.log(`${CYAN}Menunggu selama ${cooldownHours * 60} menit sebelum memulai kembali...${RESET}`);
        await sleep(cooldownHours * 60 * 60 * 1000); // Cooldown dalam milidetik
    }
}

// Jalankan skrip
main().catch(error => console.error(`${RED}Error tak terduga:${RESET}`, error));
