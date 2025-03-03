const axios = require('axios');
const fs = require('fs').promises;

const banner = `
=======================================
    AIDA AUTO BOT | AIRDROP INSIDER
=======================================
`;

const config = {
    baseUrl: 'https://back.aidapp.com',
    campaignId: '6b963d81-a8e9-4046-b14f-8454bc3e6eb2',
    excludedMissionId: 'f8edb0b4-ac7d-4a32-8522-65c5fb053725', // Task Invite 1 friend
    headers: {
        'authority': 'back.aidapp.com',
        'accept': '*/*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'en-US,en;q=0.6',
        'origin': 'https://my.aidapp.com',
        'referer': 'https://my.aidapp.com/',
        'sec-ch-ua': '"Not(A:Brand";v="99", "Brave";v="133", "Chromium";v="133"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'sec-gpc': '1',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
    }
};

async function readTokens(filename) {
    try {
        const content = await fs.readFile(filename, 'utf8');
        return content.trim().split('\n').filter(token => token.length > 0);
    } catch (error) {
        console.error(`Error reading ${filename}:`, error.message);
        return [];
    }
}

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
        
        return response.data.data.filter(mission => 
            mission.progress === "0" && mission.id !== config.excludedMissionId
        );
    } catch (error) {
        console.error('Error fetching available missions:', error.response?.data || error.message);
        return [];
    }
}

async function completeMission(missionId, accessToken) {
    try {
        const response = await axios.post(
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

        console.log(`Mission ${missionId} completed successfully!`);
        return true;
    } catch (error) {
        console.error(`Error completing mission ${missionId}:`, error.response?.data || error.message);
        return false;
    }
}

async function claimMissionReward(missionId, accessToken) {
    try {
        const response = await axios.post(
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

        console.log(`Reward for mission ${missionId} claimed successfully!`);
        return true;
    } catch (error) {
        console.error(`Error claiming reward for mission ${missionId}:`, error.response?.data || error.message);
        return false;
    }
}

async function runBot() {
    console.log(banner); 

    const tokens = await readTokens('token.txt');
    if (tokens.length === 0) {
        console.error('No tokens found in token.txt');
        return;
    }

    console.log(`Found ${tokens.length} tokens to process...`);

    for (let i = 0; i < tokens.length; i++) {
        const accessToken = tokens[i];
        console.log(`\nProcessing token ${i + 1}/${tokens.length}: ${accessToken.slice(0, 20)}...`);

        const availableMissions = await getAvailableMissions(accessToken);
        if (availableMissions.length === 0) {
            console.log('No available missions to complete for this token.');
            continue;
        }

        console.log(`Found ${availableMissions.length} missions to complete.`);

        for (const mission of availableMissions) {
            console.log(`Processing mission: ${mission.label} (ID: ${mission.id})`);
            
            const completed = await completeMission(mission.id, accessToken);
            if (completed) {
                await new Promise(resolve => setTimeout(resolve, 1000)); 
                await claimMissionReward(mission.id, accessToken);
            }

            await new Promise(resolve => setTimeout(resolve, 2000)); 
        }

        console.log(`Finished processing token ${i + 1}`);
    }

    console.log('\nBot finished processing all tokens.');
}

runBot().catch(error => {
    console.error('Bot encountered an error:', error);
});
