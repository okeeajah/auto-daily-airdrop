const fs = require('fs');
const axios = require('axios');
const chalk = require('chalk');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Configuration
const API_BASE_URL = 'https://api.infinityg.ai/api/v1';

/**
 * Formats the API response to standardize success messages.
 */
function formatResponse(response) {
    if (response.code === '90000' && response.message === 'æˆåŠŸ') {
        return {
            ...response,
            message: 'Success',
            status: 'Operation completed successfully'
        };
    }
    return response;
}

/**
 * Performs the daily check-in task.
 */
async function dailyCheckIn(api) {
    try {
        const response = await api.post('/task/checkIn/');
        const formattedResponse = formatResponse(response.data);
        console.log(chalk.blue('[INFO] ðŸ”¹ Melakukan check-in harian...'));
        console.log(chalk.green('[SUCCESS] âœ… Daily check-in berhasil!'));
        return formattedResponse;
    } catch (error) {
        console.error(chalk.red('[ERROR] âŒ Check-in error:', error.response?.data || error.message));
    }
}

/**
 * Retrieves the task list from the API.
 */
async function getTaskList(api) {
    try {
        const response = await api.post('/task/list');
        const formattedResponse = formatResponse(response.data);
        console.log(chalk.blue('[INFO] ðŸ”¹ Mengambil daftar tugas...'));
        return formattedResponse;
    } catch (error) {
        console.error(chalk.red('[ERROR] âŒ Get task list error:', error.response?.data || error.message));
        return null;
    }
}

/**
 * Completes a specific task via the API.
 */
async function completeTask(api, taskId, taskName) {
    try {
        const response = await api.post('/task/complete', { taskId });
        const formattedResponse = formatResponse(response.data);
        console.log(chalk.blue(`[INFO] ðŸ”¹ Menyelesaikan tugas: ${taskName} (ID: ${taskId})`));
        console.log(chalk.green('[SUCCESS] âœ… Tugas selesai!'));
        return formattedResponse;
    } catch (error) {
        console.error(chalk.red(`[ERROR] âŒ Complete task ${taskId} error:`, error.response?.data || error.message));
        return null;
    }
}

/**
 * Claims a specific task via the API.
 */
async function claimTask(api, taskId, taskName) {
    try {
        const response = await api.post('/task/claim', { taskId });
        const formattedResponse = formatResponse(response.data);
        console.log(chalk.blue(`[INFO] ðŸ”¹ Mengklaim tugas: ${taskName} (ID: ${taskId})`));
        console.log(chalk.green('[SUCCESS] âœ… Hadiah berhasil diklaim!'));
        return formattedResponse;
    } catch (error) {
        console.error(chalk.red(`[ERROR] âŒ Claim task ${taskId} error:`, error.response?.data || error.message));
        return null;
    }
}

/**
 * Processes a single token to perform daily check-in, claim, and complete tasks.
 */
async function processToken(token) {
    try {
        console.log(chalk.yellow(`\nðŸ”„ Memproses token: ${token.slice(-5)}`));

        // Create Axios instance with predefined headers
        const api = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Origin': 'https://www.infinityg.ai',
                'Referer': 'https://www.infinityg.ai/'
            }
        });

        // Perform daily check-in
        await dailyCheckIn(api);
        await sleep(2000);

        // Get the list of tasks
        const taskList = await getTaskList(api);
        await sleep(2000);

        if (taskList && taskList.data && taskList.data.taskModelResponses) {
            for (const taskModel of taskList.data.taskModelResponses) {
                if (taskModel.taskResponseList) {
                    for (const task of taskModel.taskResponseList) {
                        const taskName = task.taskName;
                        const taskId = task.taskId;
                        const taskStatus = task.status;

                        // Handle different task statuses
                        if (taskStatus === 3) {
                            await claimTask(api, taskId, taskName);
                            await sleep(2000);
                        } else if (taskStatus === 0 && ["Follow X", "Explore the Ground and play a game", "Join Telegram Announcement", "Join Telegram Community", "Follow Intern's X", "Share a meme", "Share with your friends", "Quote tweet & tag 3 frens", "Share on X", "Like @Infinityg_ai's tweet", "Fill out the feedback form"].includes(taskName)) {
                            await completeTask(api, taskId, taskName);
                            await sleep(2000);
                            await claimTask(api, taskId, taskName);
                            await sleep(2000);
                        } else {
                            console.log(chalk.yellow(`[WARNING] â³ Tugas ${taskName} tidak bisa diproses (status: ${taskStatus}).`));
                        }
                    }
                }
            }
        } else {
            console.log(chalk.blue('[INFO] ðŸ”¹ Tidak ada tugas yang ditemukan.'));
        }

        console.log(chalk.green(`[SUCCESS] âœ… Semua tugas selesai untuk token ${token.slice(-5)}`));
    } catch (error) {
        console.error(chalk.red(`[ERROR] âŒ Error processing token: ${error.message}`));
    }
}

/**
 * Main bot function to read tokens from token.txt and process them.
 */
async function runBot() {
    try {
        console.log(chalk.blue('[INFO] ðŸš€ Memulai bot InfinityG...'));

        // Read tokens from file, split by newline, trim each, and filter out empty tokens
        const tokens = fs.readFileSync('token.txt', 'utf8')
            .split('\n')
            .map(t => t.trim())
            .filter(t => t);

        if (tokens.length === 0) {
            throw new Error('Tidak ada token yang ditemukan di token.txt. Silakan tambahkan token ke file.');
        }

        console.log(chalk.blue(`[INFO] ðŸ” Ditemukan ${tokens.length} token. Mulai proses...`));

        // Process each token
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            await processToken(token);
            await sleep(5000); // Add delay between token processing
        }

        console.log(chalk.green('[SUCCESS] âœ… Semua token telah diproses dengan sukses!'));
    } catch (error) {
        console.error(chalk.red('[ERROR] âŒ Bot error:', error.message));
    }
}

/**
 * Formats milliseconds into a human-readable time format.
 */
function formatTimeRemaining(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
}

/**
 * Runs the bot in a loop with a countdown timer between runs.
 */
async function runBotWithCountdown() {
    while (true) {
        await runBot();

        const twelveHours = 12 * 60 * 60 * 1000;
        let timeRemaining = twelveHours;
        console.log(chalk.cyan(`\nâ³ Menunggu ${formatTimeRemaining(timeRemaining)} sebelum run berikutnya`));

        // Update countdown every second
        const countdownInterval = setInterval(() => {
            timeRemaining -= 1000;
            process.stdout.write(chalk.cyan(`\râ³ Menunggu ${formatTimeRemaining(timeRemaining)} sebelum run berikutnya`));

            if (timeRemaining <= 0) {
                clearInterval(countdownInterval);
                process.stdout.write('\n');
            }
        }, 1000);

        await sleep(twelveHours);
    }
}

// Start the bot with daily check-in and tasks
console.log(chalk.blue('[INFO] ðŸš€ Starting bot with daily check-in and tasks...'));
runBotWithCountdown();
