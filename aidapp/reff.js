const axios = require('axios');
const fs = require('fs').promises;
const { ethers } = require('ethers');

const banner = `
=======================================
    AIDA AUTO BOT | AIRDROP INSIDER
=======================================
`;

const config = {
    baseUrl: 'https://back.aidapp.com',
    referralLink: 'https://my.aidapp.com?refCode=msew8RAmU41BymD',
    campaignId: '6b963d81-a8e9-4046-b14f-8454bc3e6eb2',
    excludedMissionId: 'f8edb0b4-ac7d-4a32-8522-65c5fb053725',
    headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
        'origin': 'https://my.aidapp.com',
        'referer': 'https://my.aidapp.com/'
    }
};

// Fungsi buat wallet baru
async function createWallet() {
    const wallet = ethers.Wallet.createRandom();
    console.log(`New Wallet Created: ${wallet.address}`);

    const walletData = `${wallet.address}|${wallet.privateKey}\n`;
    await fs.appendFile('wallets.txt', walletData);

    return wallet;
}

// Fungsi auto register pakai referral link
async function registerWallet(wallet) {
    try {
        const response = await axios.post(`${config.baseUrl}/auth/register`, {
            address: wallet.address,
            refCode: 'msew8RAmU41BymD'
        }, { headers: config.headers });

        if (response.data && response.data.token) {
            console.log(`✅ Wallet ${wallet.address} registered successfully!`);
            await fs.appendFile('token.txt', response.data.token + '\n');
            return response.data.token;
        } else {
            console.log(`❌ Failed to register wallet ${wallet.address}`);
            return null;
        }
    } catch (error) {
        console.error(`❌ Error registering wallet ${wallet.address}:`, error.response?.data || error.message);
        return null;
    }
}

// Fungsi dapatkan daftar task yang tersedia
async function getAvailableMissions(accessToken) {
    try {
        const currentDate = new Date().toISOString();
        const response = await axios.get(
            `${config.baseUrl}/questing/missions?filter%5Bdate%5D=${currentDate}&filter%5Bgrouped%5D=true&filter%5Bprogress%5D=true&filter%5Brewards%5D=true&filter%5Bstatus%5D=AVAILABLE&filter%5BcampaignId%5D=${config.campaignId}`,
            {
                headers: {
                    ...config.headers,
                    'authorization': `Bearer ${accessToken}`
                }
            }
        );

        return response.data.data.filter(mission => mission.progress === "0" && mission.id !== config.excludedMissionId);
    } catch (error) {
        console.error('❌ Error fetching available missions:', error.response?.data || error.message);
        return [];
    }
}

// Fungsi untuk menyelesaikan task
async function completeMission(missionId, accessToken) {
    try {
        await axios.post(
            `${config.baseUrl}/questing/mission-activity/${missionId}`,
            {},
            {
                headers: {
                    ...config.headers,
                    'authorization': `Bearer ${accessToken}`,
                    'content-length': '0'
                }
            }
        );

        console.log(`✅ Mission ${missionId} completed successfully!`);
        return true;
    } catch (error) {
        console.error(`❌ Error completing mission ${missionId}:`, error.response?.data || error.message);
        return false;
    }
}

// Fungsi untuk klaim reward setelah menyelesaikan task
async function claimMissionReward(missionId, accessToken) {
    try {
        await axios.post(
            `${config.baseUrl}/questing/mission-reward/${missionId}`,
            {},
            {
                headers: {
                    ...config.headers,
                    'authorization': `Bearer ${accessToken}`,
                    'content-length': '0'
                }
            }
        );

        console.log(`🎉 Reward for mission ${missionId} claimed successfully!`);
        return true;
    } catch (error) {
        console.error(`❌ Error claiming reward for mission ${missionId}:`, error.response?.data || error.message);
        return false;
    }
}

// Fungsi utama untuk menjalankan bot
async function autoCreateRegisterAndQuest(amount) {
    console.log(banner);
    console.log(`Creating & Registering ${amount} wallets and completing quests...`);

    for (let i = 0; i < amount; i++) {
        const wallet = await createWallet();
        const accessToken = await registerWallet(wallet);
        if (!accessToken) continue;

        console.log(`🔎 Fetching available missions for ${wallet.address}...`);
        const missions = await getAvailableMissions(accessToken);
        if (missions.length === 0) {
            console.log('❌ No available missions for this account.');
            continue;
        }

        console.log(`✅ Found ${missions.length} missions. Starting completion...`);
        for (const mission of missions) {
            console.log(`🚀 Completing mission: ${mission.label} (ID: ${mission.id})`);
            
            const completed = await completeMission(mission.id, accessToken);
            if (completed) {
                await new Promise(resolve => setTimeout(resolve, 1000)); 
                await claimMissionReward(mission.id, accessToken);
            }

            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log(`🎉 Finished processing wallet ${wallet.address}`);
    }

    console.log(`\n🚀 Bot finished processing all wallets & quests.`);
}

// Jalankan auto create, register, dan quest completion
async function main() {
    const amount = parseInt(process.argv[2], 10) || 1;
    await autoCreateRegisterAndQuest(amount);
}

main().catch(error => {
    console.error('❌ Bot encountered an error:', error);
});
