const fs = require('fs');
const ethers = require('ethers');
const axios = require('axios');
const cron = require('node-cron');

const ABI = [
    "function claim(uint256 totalPoints, bytes signature)"
];

const config = {
    rpcUrl: 'https://testnet-rpc.monad.xyz',
    chainId: 10143,
    contractAddress: '0x18C9534dfe16a0314B66395F48549716FfF9AA66',
    apiBaseUrl: 'https://api.xyz.land',
    cronSchedule: '1 0 * * *'
};

function getTimeUntilNextRun() {
    const cronPattern = config.cronSchedule;
    const [minute, hour] = cronPattern.split(' ');
    
    const now = new Date();
    const next = new Date();
    next.setUTCHours(parseInt(hour));
    next.setUTCMinutes(parseInt(minute));
    next.setUTCSeconds(0);
    
    if (next <= now) {
        next.setDate(next.getDate() + 1);
    }
    
    const diff = next - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours}h ${minutes}m ${seconds}s`;
}

async function checkScoreAndRank(api) {
    try {
        const scoreResponse = await api.get('/lasso/score');
        const data = scoreResponse.data;
        console.log('\nCurrent Stats:');
        console.log('Rank:', data.rank);
        console.log('Total Score:', data.totalScore);
        console.log('Remaining Plays:', data.remainingPlays);
        console.log('Daily Score:', data.dailyScore);
        return data;
    } catch (error) {
        console.error('Error checking score:', error.message);
        return null;
    }
}

async function main() {
    try {
        const bearerToken = fs.readFileSync('token.txt', 'utf8').trim();
        const privateKey = fs.readFileSync('pk.txt', 'utf8').trim();

        const provider = new ethers.JsonRpcProvider(config.rpcUrl);
        const wallet = new ethers.Wallet(privateKey, provider);
        const contract = new ethers.Contract(config.contractAddress, ABI, wallet);

        const api = axios.create({
            baseURL: config.apiBaseUrl,
            headers: {
                'Authorization': `Bearer ${bearerToken}`,
                'Accept': '*/*',
                'Origin': 'https://www.dusted.app',
                'Referer': 'https://www.dusted.app/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        await checkScoreAndRank(api);

        console.log('\nPlaying Lasso...');
        const playResponse = await api.post('/lasso/play', null, {
            params: {
                network: 'monad',
                chain_id: config.chainId
            }
        });
        console.log('Play response:', playResponse.data);

        console.log('\nGetting claim signature...');
        const claimResponse = await api.get('/lasso/claim');
        console.log('Claim response:', claimResponse.data);

        const { signature, score } = claimResponse.data;

        console.log('\nSubmitting on-chain claim...');
        const tx = await contract.claim(score, signature, {
            maxFeePerGas: ethers.parseUnits('51.5', 'gwei'),
            maxPriorityFeePerGas: ethers.parseUnits('51.5', 'gwei')
        });

        console.log('Transaction submitted:', tx.hash);
        const receipt = await tx.wait();
        console.log('Transaction confirmed in block:', receipt.blockNumber);

        await checkScoreAndRank(api);

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
    }
}

console.log('Starting Lasso Claim Bot...');
console.log('Scheduled to run daily at:', config.cronSchedule, 'UTC');

setInterval(() => {
    process.stdout.write(`\rNext run in: ${getTimeUntilNextRun()}`);
}, 1000);

cron.schedule(config.cronSchedule, () => {
    console.log('\n\nStarting daily claim process...');
    main();
}, {
    timezone: 'UTC'
});

console.log('\nPerforming initial run...');
main();
