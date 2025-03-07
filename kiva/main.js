const fs = require('fs').promises;
const axios = require('axios');
const Table = require('cli-table');
const chalk = require('chalk');
const crypto = require('crypto');
const path = require('path');

const DATA_FILE = 'previousBalances.json';
const ACC_FILE = 'acc.txt';
let previousBalances = {};
let accounts = [];

// Ensure necessary files exist
const ensureFileExists = async (filePath) => {
    try {
        await fs.access(filePath);
    } catch {
        await fs.writeFile(filePath, '', 'utf8'); // Create an empty file
        console.log(`${filePath} created`);
    }
};

// Load accounts from acc.txt
const loadAccounts = async () => {
    try {
        const data = await fs.readFile(ACC_FILE, 'utf8');
        if (!data.trim()) {
            throw new Error('acc.txt is empty');
        }
        accounts = data.trim().split('\n').map(line => {
            const [email, password] = line.split('|'); // Use '|' as the separator
            if (!email || !password) {
                throw new Error(`Invalid format in acc.txt: ${line}`);
            }
            return { email: email.trim(), password: password.trim() };
        });
    } catch (error) {
        console.error(chalk.red(`Error loading accounts from ${ACC_FILE}:`), error.message);
        process.exit(1);
    }
};

// Load previous balances
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

// Save previous balances
const savePreviousBalances = async () => {
    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(previousBalances), 'utf8');
        console.log(chalk.green('Previous balances saved to file.'));
    } catch (error) {
        console.error(chalk.red('Error saving previous balances to file:'), error.message);
    }
};

// Generate headers for requests
const getHeaders = (token) => ({
    'Content-Type': 'application/json',
    'Accept': '*/*',
    'Accept-Language': 'id-ID,id;q=0.7',
    'Authorization': token, // Include Authorization header
});

// Hash password using MD5
const hashPassword = (password) => {
    return crypto.createHash('md5').update(password).digest('hex');
};

// Calculate mining time
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

// Login function
const login = async (email, password) => {
    const headers = getHeaders();

    try {
        const hashedPassword = hashPassword(password); // Hash the password before sending
        const response = await axios.post('https://app.kivanet.com/api/user/login', { email, password: hashedPassword }, { headers });
        
        if (response.data.state) {
            return response.data.object; // Return token
        } else {
            console.error(chalk.red(`Login failed for ${email}: ${response.data.message}`));
            return null;
        }
    } catch (error) {
        console.error(chalk.red(`Error logging in with ${email}: ${error.message}`));
        return null;
    }
};

// Fetch user info
const getUserInfo = async (token) => {
    try {
        const response = await axios.get('https://app.kivanet.com/api/user/getUserInfo', { headers: getHeaders(token) });
        return response.data.object;
    } catch (error) {
        console.error(chalk.red(`Error fetching user info: ${error.message}`));
        return null;
    }
};

// Fetch account info
const getMyAccountInfo = async (token) => {
    try {
        const response = await axios.get('https://app.kivanet.com/api/user/getMyAccountInfo', { headers: getHeaders(token) });
        return response.data.object;
    } catch (error) {
        console.error(chalk.red(`Error fetching account info: ${error.message}`));
        return null;
    }
};

// Get sign info with retry
const getSignInfo = async (token, maxRetries = 3) => {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            const response = await axios.get('https://app.kivanet.com/api/user/getSignInfo', { headers: getHeaders(token) });
            if (response.data && response.data.object) {
                return response.data.object;
            } else {
                console.warn(chalk.yellow(`getSignInfo: Retrying attempt ${retries + 1} - No data.object in response`));
                retries++;
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
            }
        } catch (error) {
            console.error(chalk.red(`getSignInfo: Error fetching sign info (attempt ${retries + 1}): ${error.message}`));
            retries++;
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
        }
    }
    console.error(chalk.red(`getSignInfo: Max retries reached - Unable to fetch sign info after ${maxRetries} attempts`));
    return null;
};

// Display stats in a table
const displayStats = (accountsData) => {
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
};

// Process each account
const processAccount = async ({ email, password }) => {
    const stats = { id: null, nickname: null, balance: null, miningTime: null, increment: null, status: chalk.green('Running') };

    const token = await login(email, password);

    if (!token) {
        stats.status = chalk.red(`Login failed for ${email}`);
        return stats;
    }

    try {
        const userInfo = await getUserInfo(token);
        
        if (!userInfo) {
            stats.status = chalk.red(`Error retrieving user info for ${email}`);
            return stats;
        }

        stats.id = userInfo.id;
        stats.nickname = userInfo.nickName;

        const accountInfo = await getMyAccountInfo(token);
        
        if (!accountInfo) {
            stats.status = chalk.red(`Error retrieving account info for ${email}`);
            return stats;
        }

        stats.balance = `${accountInfo.balance} Kiva`;

        const signInfo = await getSignInfo(token);

        if (!signInfo || !signInfo.signTime || !signInfo.nowTime) {
            stats.miningTime = chalk.gray('N/A');
            stats.increment = null; // No increment calculation possible without balance info
        } else {
            stats.miningTime = calculateMiningTime(parseInt(signInfo.signTime), parseInt(signInfo.nowTime));
            
            // Calculate Mining Increment
            const currentBalance = parseFloat(accountInfo.balance);
            const prevBalance = previousBalances[stats.id];

            if (prevBalance !== undefined) {
                stats.increment = currentBalance - prevBalance; // Calculate increment
            } else {
                stats.increment = null; // Set increment to null if previous balance is not available
            }

            previousBalances[stats.id] = currentBalance; // Update previous balance
        }

    } catch (error) {
       stats.status=chalk.red(`Error processing account ${email}: ${error.message}`);
   }

   return stats;
};

// Perform mining for a single account
const performMining = async (token, email) => {
    try {
        await axios.post("https://app.kivanet.com/api/user/sign", {}, { headers: getHeaders(token) });
        return true;
    } catch (error) {
        console.error(chalk.red(`Mining failed for ${email}:`, error.message));
        return false;
    }
};

// Perform mining function every 24 hours for each account
async function performMiningForAllAccounts() {
    for (let account of accounts) {
        const token = await login(account.email, account.password);
        if (token) {
            try {
                // Perform mining
                const miningSuccessful = await performMining(token, account.email);
                if (!miningSuccessful) {
                    console.error(chalk.red(`Mining failed for ${account.email}`));
                }
            } catch (error) {
                console.error(chalk.red(`Mining failed for ${account.email}:`, error.message));
            }
        } else {
            console.error(chalk.red(`Login failed for ${account.email}`));
        }
    }
}

// Main bot execution function
const runBot = async () => {
    await ensureFileExists(ACC_FILE);
    await ensureFileExists(DATA_FILE);

    await loadPreviousBalances();
    
    await loadAccounts(); // Load accounts

    console.log(chalk.green(`Loaded ${accounts.length} accounts from acc.txt`));

    // Perform initial mining silently
    await performMiningForAllAccounts();

    // Display table immediately after initial mining
    const results = await Promise.all(accounts.map(processAccount));
    displayStats(results);

    // Start automatic mining every 24 hours using setInterval
    setInterval(async () => {
        console.log(chalk.yellow("Performing automatic mining..."));
        await performMiningForAllAccounts();
    }, 24 * 60 * 60 * 1000); // Every 24 hours

    setInterval(async () => {
        const results = await Promise.all(accounts.map(processAccount));

        displayStats(results);

        await savePreviousBalances(); // Save previous balances to file
    }, 60 * 1000); // Runs every minute
};

// Start the bot
runBot().catch(err => console.error(chalk.red("Fatal error:"), err));
