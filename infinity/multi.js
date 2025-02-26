const fs = require('fs');
const axios = require('axios');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Configuration
const API_BASE_URL = 'https://api.infinityg.ai/api/v1';

/**
 * Formats the API response to standardize success messages.
 */
function formatResponse(response) {
    if (response.code === '90000' && response.message === '成功') {
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
        console.log('Daily check-in:', formattedResponse);
        return formattedResponse;
    } catch (error) {
        console.error('Check-in error:', error.response?.data || error.message);
    }
}

/**
 * Retrieves the task list from the API.
 */
async function getTaskList(api) {
    try {
        const response = await api.post('/task/list');
        const formattedResponse = formatResponse(response.data);
        console.log('Task list retrieved:', formattedResponse);
        return formattedResponse;
    } catch (error) {
        console.error('Get task list error:', error.response?.data || error.message);
        return null;
    }
}

/**
 * Completes a specific task via the API.
 */
async function completeTask(api, taskId) {
    try {
        const response = await api.post('/task/complete', { taskId });
        const formattedResponse = formatResponse(response.data);
        console.log(`Task ${taskId} completed:`, formattedResponse);
        return formattedResponse;
    } catch (error) {
        console.error(`Complete task ${taskId} error:`, error.response?.data || error.message);
        return null;
    }
}

/**
 * Claims a specific task via the API.
 */
async function claimTask(api, taskId) {
    try {
        const response = await api.post('/task/claim', { taskId });
        const formattedResponse = formatResponse(response.data);
        console.log(`Task ${taskId} claimed:`, formattedResponse);
        return formattedResponse;
    } catch (error) {
        console.error(`Claim task ${taskId} error:`, error.response?.data || error.message);
        return null;
    }
}

/**
 * Processes a single token to perform daily check-in, claim, and complete tasks.
 */
async function processToken(token) {
    try {
        console.log(`\nProcessing token: ${token.slice(-5)}`);

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
                            console.log(`Claiming completed task: ${taskName} (ID: ${taskId})`);
                            await claimTask(api, taskId);
                            await sleep(2000);
                            console.log(`Task ${taskName} claimed successfully!`);
                        } else if (taskStatus === 0 && ["Follow X", "Explore the Ground and play a game", "Join Telegram Announcement", "Join Telegram Community", "Share a meme", "Fill out the feedback form", "Quote tweet & tag 3 frens"].includes(taskName)) {
                            console.log(`Pressing GO! and claiming task: ${taskName} (ID: ${taskId})`);
                            await completeTask(api, taskId);
                            await sleep(2000);
                            await claimTask(api, taskId);
                            await sleep(2000);
                            console.log(`Task ${taskName} completed and claimed successfully!`);
                        } else if (taskStatus === 0 && !["Follow X", "Explore the Ground and play a game", "Join Telegram Announcement", "Join Telegram Community", "Share a meme", "Fill out the feedback form", "Quote tweet & tag 3 frens"].includes(taskName)) {
                            console.log(`Task ${taskName} (ID: ${taskId}) has GO! button but not in the list to be automated. Please review manually.`);
                        }
                        else {
                            console.log(`Task ${taskName} (ID: ${taskId}) is not actionable (status: ${taskStatus}).`);
                        }
                    }
                }
            }
        } else {
            console.log("No tasks found or invalid response format.");
        }

        console.log(`Tasks processed for token ending with ${token.slice(-5)}`);
    } catch (error) {
        console.error(`Error processing token: ${error.message}`);
    }
}

/**
 * Main bot function to read tokens from token.txt and process them.
 */
async function runBot() {
    try {
        console.log('\nStarting InfinityG bot...');

        // Read tokens from file, split by newline, trim each, and filter out empty tokens
        const tokens = fs.readFileSync('token.txt', 'utf8')
            .split('\n')
            .map(t => t.trim())
            .filter(t => t);

        if (tokens.length === 0) {
            throw new Error('No tokens found in token.txt. Please add tokens to the file.');
        }

        console.log(`Found ${tokens.length} tokens. Processing each token...`);

        // Process each token
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            console.log(`Processing token ${i + 1} of ${tokens.length}`);
            await processToken(token);
            await sleep(5000); // Add delay between token processing
        }

        console.log('\nAll tokens processed successfully');
    } catch (error) {
        console.error('Bot error:', error.message);
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
        console.log(`\nNext run in ${formatTimeRemaining(timeRemaining)}`);

        // Update countdown every second
        const countdownInterval = setInterval(() => {
            timeRemaining -= 1000;
            process.stdout.write(`\rTime until next run: ${formatTimeRemaining(timeRemaining)}`);

            if (timeRemaining <= 0) {
                clearInterval(countdownInterval);
                process.stdout.write('\n');
            }
        }, 1000);

        await sleep(twelveHours);
    }
}

// Start the bot with daily check-in and tasks
console.log('Starting bot with daily check-in and tasks...');
runBotWithCountdown();
                              
