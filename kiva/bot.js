const fs = require('fs').promises;
const axios = require('axios');
const Table = require('cli-table');
const chalk = require('chalk');

const previousBalances = {};

const loadTokens = async () => {
    try {
        const data = await fs.readFile('token.txt', 'utf8');
        return data.trim().split('\n').map(token => token.trim());
    } catch (error) {
        console.error(chalk.red('Error loading tokens from token.txt:'), error.message);
        process.exit(1);
    }
};

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

const fetchWithoutProxy = async (url, options) => {
    try {
        const response = await axios.get(url, options);
        return response.data;
    } catch (error) {
        console.error(chalk.red(`Error fetching ${url}: ${error.message}`));
        throw error;
    }
};

function calculateMiningTime(signTime, nowTime) {
    const timeDiffMs = nowTime - signTime;
    const timeDiffSec = timeDiffMs / 1000;
    const hours = Math.floor(timeDiffSec / 3600);
    const minutes = Math.floor((timeDiffSec % 3600) / 60);
    const seconds = Math.floor(timeDiffSec % 60);
    return `${hours}h ${minutes}m ${seconds}s`;
}

async function getUserInfo(token) {
    const data = await fetchWithoutProxy('https://app.kivanet.com/api/user/getUserInfo', { headers: getHeaders(token) });
    return data.object;
}

async function getMyAccountInfo(token) {
    const data = await fetchWithoutProxy('https://app.kivanet.com/api/user/getMyAccountInfo', { headers: getHeaders(token) });
    return data.object;
}

async function getSignInfo(token) {
    const data = await fetchWithoutProxy('https://app.kivanet.com/api/user/getSignInfo', { headers: getHeaders(token) });
    return data.object;
}

function displayStats(accountsData) {
    console.clear();

    const table = new Table({
        head: [chalk.bold('ID'), chalk.bold('Nickname'), chalk.bold('Balance'), chalk.bold('Mining Time'), chalk.bold('Mining Increment'), chalk.bold('Status')],
        colWidths: [10, 15, 15, 15, 20, 15]
    });

    accountsData.forEach(account => {
        table.push([
            account.id || chalk.gray('N/A'),
            account.nickname || chalk.gray('N/A'),
            account.balance || chalk.gray('N/A'),
            account.miningTime || chalk.gray('N/A'),
            account.increment ? `${account.increment >= 0 ? chalk.green('+') : chalk.red('-')}${account.increment.toFixed(4)} Kiva` : chalk.gray('N/A'),
            account.status || chalk.gray('N/A')
        ]);
    });

    console.log(table.toString());

}

async function processAccount(token) {
    const stats = { id: null, nickname: null, balance: null, miningTime: null, increment: null, status: chalk.green('Running') };

    try {
        const userInfo = await getUserInfo(token);
        stats.id = userInfo.id;
        stats.nickname = userInfo.nickName;

        const accountInfo = await getMyAccountInfo(token);
        stats.balance = `${accountInfo.balance} Kiva`;

        const signInfo = await getSignInfo(token);
        stats.miningTime = calculateMiningTime(parseInt(signInfo.signTime), parseInt(signInfo.nowTime));

        // Hitung Mining Increment
        const currentBalance = parseFloat(accountInfo.balance);
        const prevBalance = previousBalances[stats.id] || currentBalance;
        stats.increment = currentBalance - prevBalance; // Hitung increment
        previousBalances[stats.id] = currentBalance; // Update saldo sebelumnya

    } catch (error) {
        stats.status = chalk.red(`Error: ${error.message}`);
    }

    return stats;
}

async function runBot() {
    const tokens = await loadTokens();
    console.log(chalk.green(`Loaded ${tokens.length} tokens from token.txt`));

    setInterval(async () => {
        const promises = tokens.map(token => processAccount(token));
        const results = await Promise.all(promises);
        displayStats(results);
    }, 60 * 1000);
}

runBot().catch(err => console.error(chalk.red('Fatal error:'), err));
      
