const axios = require('axios');
const fs = require('fs');
const path = require('path');

const accountsPath = path.join(__dirname, 'accounts.txt');
let accounts = [];

if (fs.existsSync(accountsPath)) {
    accounts = fs.readFileSync(accountsPath, 'utf-8').trim().split('\n').map(line => {
        const [userId, cookie] = line.split('|');
        return { userId: userId.trim(), cookie: cookie.trim() };
    });
}

const timezoneOffset = -420;
const cooldownTime = 13 * 60 * 60 * 1000;
const delayTime = 15000;

const logWithStyle = (userId, message) => {
    console.log(`[🔥 ${userId}] ${message}`);
};

// 1. Tambahkan fungsi checkIn yang hilang
const checkIn = async (userId, cookie) => {
    try {
        logWithStyle(userId, '📅 Starting daily check-in...');
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
        logWithStyle(userId, `✅ Check-in Success! +${response.data?.pointsForThisCheckIn || 0} Points`);
    } catch (error) {
        logWithStyle(userId, `❌ Check-in Failed: ${error.response?.data?.message || error.message}`);
    }
};

// 2. Tambahkan fungsi spin yang hilang
const spin = async (userId, cookie) => {
    try {
        logWithStyle(userId, '🎡 Spinning the wheel...');
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
        logWithStyle(userId, `🎁 Spin Result: ${response.data?.prize || 'No Prize'} | +${response.data?.spinPoints || 0} Points`);
    } catch (error) {
        logWithStyle(userId, `❌ Spin Failed: ${error.response?.data?.message || error.message}`);
    }
};

// 3. Fungsi untuk menyelesaikan tugas (sudah diperbaiki)
const getTasks = async (userId, cookie) => {
    try {
        const response = await axios.get(`https://server.partofdream.io/task/getTasks?id=${userId}`, {
            headers: { 
                'cookie': cookie,
                'accept': 'application/json, text/plain, */*'
            }
        });
        return response.data.tasks.filter(task => task.action === 'Delay');
    } catch (error) {
        logWithStyle(userId, `❌ Gagal mendapatkan tugas: ${error.message}`);
        return [];
    }
};

const completeSingleTask = async (userId, cookie, task) => {
    try {
        await axios.post('https://server.partofdream.io/task/completeTask/Delay', {
            userId: userId,
            taskId: task._id,
            fromPage: "/quests"
        }, {
            headers: {
                'content-type': 'application/json',
                'cookie': cookie
            }
        });
        return { success: true, points: task.points };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

const completeAllTasks = async (userId, cookie) => {
    try {
        logWithStyle(userId, '🔍 Mencari tugas yang bisa diselesaikan...');
        const tasks = await getTasks(userId, cookie);
        
        let totalPoints = 0;
        let completedTasks = 0;

        for (const task of tasks) {
            logWithStyle(userId, `⏳ Mencoba menyelesaikan: ${task.title}`);
            const result = await completeSingleTask(userId, cookie, task);
            
            if (result.success) {
                completedTasks++;
                totalPoints += task.points;
                logWithStyle(userId, `✅ Berhasil: ${task.title} (+${task.points} poin)`);
            } else {
                logWithStyle(userId, `❌ Gagal: ${task.title}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, delayTime));
        }

        logWithStyle(userId, `📊 Total Tugas Diselesaikan: ${completedTasks}`);
        logWithStyle(userId, `💰 Total Poin Diperoleh: ${totalPoints}`);

    } catch (error) {
        logWithStyle(userId, `❌ Error utama: ${error.message}`);
    }
};

// 4. Fungsi utama dengan urutan yang benar
const runRoutine = async () => {
    while (true) {
        console.log("\n[🔥] Memulai tugas harian untuk semua akun...\n");

        for (const account of accounts) {
            logWithStyle(account.userId, '🌟 Starting Daily Routine');
            
            await checkIn(account.userId, account.cookie);
            await new Promise(resolve => setTimeout(resolve, delayTime));

            await spin(account.userId, account.cookie);
            await new Promise(resolve => setTimeout(resolve, delayTime));

            await completeAllTasks(account.userId, account.cookie);
            await new Promise(resolve => setTimeout(resolve, delayTime));

            logWithStyle(account.userId, '✅ Routine Completed!');
            await new Promise(resolve => setTimeout(resolve, delayTime));
        }

        const nextRunTime = new Date(Date.now() + cooldownTime);
        console.log(`\n🕒 Cooldown 13 jam... Script akan berjalan kembali pada: ${nextRunTime.toLocaleString()}\n`);
        await new Promise(resolve => setTimeout(resolve, cooldownTime));
    }
};

runRoutine();
