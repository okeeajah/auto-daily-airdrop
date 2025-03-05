const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load cookies dan userId dari file
const accountsPath = path.join(__dirname, 'accounts.txt');
let accounts = [];
if (fs.existsSync(accountsPath)) {
    accounts = fs.readFileSync(accountsPath, 'utf-8').trim().split('\n').map(line => {
        const [userId, cookie] = line.split('|');
        return { userId: userId.trim(), cookie: cookie.trim() };
    });
}

const timezoneOffset = -420;

const logWithStyle = (userId, message) => {
    console.log(`\n[🔥 ${userId}] ${message}`);
};

const checkIn = async (userId, cookie) => {
    try {
        logWithStyle(userId, 'Starting daily check-in...');
        const response = await axios.post('https://server.partofdream.io/checkin/checkin', {
            userId,
            timezoneOffset
        }, {
            headers: {
                'accept': 'application/json, text/plain, */*',
                'content-type': 'application/json',
                'cookie': cookie
            }
        });
        logWithStyle(userId, `✅ Check-in Success! +${response.data.pointsForThisCheckIn} Points`);
    } catch (error) {
        logWithStyle(userId, `❌ Check-in Failed: ${error.response?.data?.message || error.message}`);
    }
};

const spin = async (userId, cookie) => {
    try {
        logWithStyle(userId, 'Spinning the wheel...');
        const response = await axios.post('https://server.partofdream.io/spin/spin', {
            userId,
            timezoneOffset
        }, {
            headers: {
                'accept': 'application/json, text/plain, */*',
                'content-type': 'application/json',
                'cookie': cookie
            }
        });
        logWithStyle(userId, `🎉 Spin Result: ${response.data.prize} | +${response.data.spinPoints} Points`);
    } catch (error) {
        logWithStyle(userId, `❌ Spin Failed: ${error.response?.data?.message || error.message}`);
    }
};

const getTasks = async (userId, cookie) => {
    try {
        const response = await axios.get(`https://server.partofdream.io/task/getTasks?id=${userId}`, {
            headers: {
                'accept': 'application/json, text/plain, */*',
                'cookie': cookie
            }
        });
        return response.data.tasks;
    } catch (error) {
        logWithStyle(userId, `⚠️ Error Fetching Tasks: ${error.response?.data?.message || error.message}`);
        return [];
    }
};

const completeTask = async (userId, cookie, taskId, taskTitle) => {
    try {
        logWithStyle(userId, `🔹 Completing Task: ${taskTitle}...`);
        const response = await axios.post('https://server.partofdream.io/task/complete', {
            userId,
            taskId
        }, {
            headers: {
                'accept': 'application/json, text/plain, */*',
                'content-type': 'application/json',
                'cookie': cookie
            }
        });
        logWithStyle(userId, `✅ Task Completed: ${taskTitle}`);
    } catch (error) {
        logWithStyle(userId, `❌ Task Failed: ${taskTitle} | ${error.response?.data?.message || error.message}`);
    }
};

const runTasks = async (userId, cookie) => {
    const tasks = await getTasks(userId, cookie);
    for (const task of tasks) {
        await completeTask(userId, cookie, task._id, task.title);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Delay 2 detik antar task
    }
};

const runMultiCheckInSpinAndTasks = async () => {
    for (const account of accounts) {
        logWithStyle(account.userId, '🔥 Starting Daily Routine');
        await checkIn(account.userId, account.cookie);
        await spin(account.userId, account.cookie);
        await runTasks(account.userId, account.cookie);
        logWithStyle(account.userId, '✅ Routine Completed!');
        await new Promise(resolve => setTimeout(resolve, 5000)); // Delay 5 detik antar akun
    }
};

runMultiCheckInSpinAndTasks();
