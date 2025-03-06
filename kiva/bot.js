const fs = require('fs').promises;
const axios = require('axios');
const Table = require('cli-table');
const chalk = require('chalk');

const DATA_FILE = 'previousBalances.json'; // Nama file untuk menyimpan saldo sebelumnya
let previousBalances = {};

const loadTokens = async () => {
    try {
        const data = await fs.readFile('token.txt', 'utf8');
        return data.trim().split('\n').map(token => token.trim());
    } catch (error) {
        console.error(chalk.red('Error loading tokens from token.txt:'), error.message);
        process.exit(1);
    }
};

// Fungsi untuk memuat saldo sebelumnya dari file
const loadPreviousBalances = async () => {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        previousBalances = JSON.parse(data);
        console.log(chalk.green('Previous balances loaded from file.'));
    } catch (error) {
        console.log(chalk.yellow('No previous balances file found, starting fresh.'));
        previousBalances = {};
    }
};

// Fungsi untuk menyimpan saldo sebelumnya ke file
const savePreviousBalances = async () => {
    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(previousBalances), 'utf8');
        console.log(chalk.green('Previous balances saved to file.'));
    } catch (error) {
        console.error(chalk.red('Error saving previous balances to file:'), error.message);
    }
};

const getHeaders = (token) => ({
    'authority': 'app.kivanet.com',
    'accept': '*/*',
    'accept-language': 'id-ID,id;q=0.7',
    'authorization': token,
    'content-type': 'application/json',
    'language': 'en',
    'origin': 'https://app.kivanet.com',
    'referer': 'https://app.kivanet.com/',
    'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Brave";v="134"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'sec-gpc': '1',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
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
    if (!signTime || !nowTime) {
        return chalk.gray('N/A');
    }
    const timeDiffMs = nowTime - signTime;
    const timeDiffSec = timeDiffMs / 1000;
    const hours = Math.floor(timeDiffSec / 3600);
    const minutes = Math.floor((timeDiffSec % 3600) / 60);
    const seconds = Math.floor(timeDiffSec % 60);
    return `${hours}h ${minutes}m ${seconds}s`;
}

async function getUserInfo(token) {
    try {
        const data = await fetchWithoutProxy('https://app.kivanet.com/api/user/getUserInfo', { headers: getHeaders(token) });
        return data.object;
    } catch (error) {
        console.error(chalk.red(`Error fetching user info: ${error.message}`));
        return null;
    }
}

async function getMyAccountInfo(token) {
    try {
        const data = await fetchWithoutProxy('https://app.kivanet.com/api/user/getMyAccountInfo', { headers: getHeaders(token) });
        return data.object;
    } catch (error) {
        console.error(chalk.red(`Error fetching account info: ${error.message}`));
        return null;
    }
}

async function getSignInfo(token) {
    try {
        const response = await axios.post('https://app.kivanet.com/api/user/sign', {}, {headers: getHeaders(token)}); // Lakukan mining

        const data = await fetchWithoutProxy('https://app.kivanet.com/api/user/getSignInfo', { headers: getHeaders(token) });
        return data.object;
    } catch (error) {
        console.error(chalk.red(`Error fetching sign info: ${error.message}`));
        return null;
    }
}

async function performMining(token) {
    try {
        const response = await axios.post('https://app.kivanet.com/api/user/sign', {}, {
            headers: getHeaders(token)
        });

        if (response.data.state === true && response.data.code === "0000") {
            console.log(chalk.green('Mining berhasil dilakukan.'));
        } else {
            console.error(chalk.red('Mining gagal dilakukan:'), response.data);
        }
    } catch (error) {
        console.error(chalk.red('Error saat melakukan mining:'), error.message);
    }
}

function displayStats(accountsData) {
    console.clear();

    const table = new Table({
        head: [chalk.bold('ID'), chalk.bold('Nickname'), chalk.bold('Balance'), chalk.bold('Mining Time'), chalk.bold('Mining Increment'), chalk.bold('Status')],
        colWidths: [15, 20, 15, 15, 20, 20]
    });

    accountsData.forEach(account => {
        table.push([
            account.id || chalk.gray('N/A'),
            account.nickname || chalk.gray('N/A'),
            account.balance || chalk.gray('N/A'),
            account.miningTime || chalk.gray('N/A'),
            account.increment !== null ? `${account.increment >= 0 ? chalk.green('+') : chalk.red('-')}${account.increment.toFixed(8)} Kiva` : chalk.gray('N/A'),
            account.status || chalk.gray('N/A')
        ]);
    });

    console.log(table.toString());
}

async function processAccount(token) {
    const stats = { id: null, nickname: null, balance: null, miningTime: null, increment: null, status: chalk.green('Running') };

    try {
        const userInfo = await getUserInfo(token);
        if (!userInfo) {
            stats.status = chalk.red('Error: Could not retrieve user info');
            return stats;
        }
        stats.id = userInfo.id;
        stats.nickname = userInfo.nickName;

        const accountInfo = await getMyAccountInfo(token);
        if (!accountInfo) {
            stats.status = chalk.red('Error: Could not retrieve account info');
            return stats;
        }
        stats.balance = `${accountInfo.balance} Kiva`;

        const signInfo = await getSignInfo(token);
        if (!signInfo || !signInfo.signTime || !signInfo.nowTime) {
            stats.miningTime = chalk.gray('N/A');
        } else {
            stats.miningTime = calculateMiningTime(parseInt(signInfo.signTime), parseInt(signInfo.nowTime));
        }

        // Hitung Mining Increment
        const currentBalance = parseFloat(accountInfo.balance);
        const prevBalance = previousBalances[stats.id];
        if (prevBalance !== undefined) {
            stats.increment = currentBalance - prevBalance; // Hitung increment
        } else {
            stats.increment = null; // Set increment ke null jika saldo sebelumnya tidak ada
        }
        previousBalances[stats.id] = currentBalance; // Update saldo sebelumnya

    } catch (error) {
        stats.status = chalk.red(`Error: ${error.message}`);
    }

    return stats;
}

async function startAutoMining(token) {
    // Jalankan mining setiap 24 jam (dalam milidetik)
    const interval = 24 * 60 * 60 * 1000;
    setInterval(async () => {
        console.log(chalk.yellow('Melakukan mining otomatis...'));
        await performMining(token);
    }, interval);
}

async function runBot() {
    await loadPreviousBalances(); // Muat saldo sebelumnya dari file

    const tokens = await loadTokens();
    console.log(chalk.green(`Loaded ${tokens.length} tokens from token.txt`));

    // Jalankan mining otomatis untuk setiap token
    tokens.forEach(token => {
        startAutoMining(token);
    });

    setInterval(async () => {
        const promises = tokens.map(async (token) => {
            try {
                return await processAccount(token);
            } catch (error) {
                console.error(chalk.red(`Error processing account: ${error.message}`));
                return { id: null, nickname: null, balance: null, miningTime: null, increment: null, status: chalk.red(`Error: ${error.message}`) };
            }
        });
        const results = await Promise.all(promises);
        displayStats(results);

        await savePreviousBalances(); // Simpan saldo sebelumnya ke file
    }, 60 * 1000);
}

runBot().catch(err => console.error(chalk.red('Fatal error:'), err));
