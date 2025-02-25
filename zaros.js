const axios = require("axios");
const fs = require("fs");
const path = require("path");

const CONFIG = {
    idFile: "id.txt",
    logFile: "claim_log.txt",
    dailyInterval: 24 * 60 * 60 * 1000,
    weeklyClaimDay: 1,
    dailyClaimHour: 2,
    retryDelay: 60 * 1000,
    delayBetweenClaims: 2000,
    
    telegram: {
        enabled: false,
        botToken: "",
        chatId: "",
        notifySuccess: true,
        notifyError: true,
        notifySummary: true
    }
};

function formatDate(date) {
    const pad = (num) => String(num).padStart(2, '0');
    
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function log(message, notifyTelegram = false) {
    const timestamp = formatDate(new Date());
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    
    try {
        fs.appendFileSync(CONFIG.logFile, logMessage + "\n");
    } catch (err) {
        console.error(`Failed to write to log file: ${err.message}`);
    }
    
    if (notifyTelegram) {
        sendTelegramMessage(message).catch(err => {
            console.error(`Failed to send Telegram message: ${err.message}`);
        });
    }
}

async function sendTelegramMessage(message) {
    if (!CONFIG.telegram.enabled || !CONFIG.telegram.botToken || !CONFIG.telegram.chatId) {
        return;
    }
    
    const formattedMessage = message.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g, isoString => {
        return formatDate(new Date(isoString));
    });
    
    const url = `https://api.telegram.org/bot${CONFIG.telegram.botToken}/sendMessage`;
    
    try {
        const messageToSend = `ðŸ¤– *ZAROS Auto Claim*\n\n${formattedMessage}`;
        await axios.post(url, {
            chat_id: CONFIG.telegram.chatId,
            text: messageToSend,
            parse_mode: 'Markdown'
        });
    } catch (error) {
        console.error(`Telegram API error: ${error.message}`);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function claim(claimType, id) {
    const url = `https://production.api.zaros.fi/festival/${claimType}/claim?tradingAccountId=${id}`;
    
    try {
        log(`Claiming ${claimType} for ID: ${id}`);
        const response = await axios.post(url);
        const successMessage = `Successfully claimed ${claimType} for ID: ${id}`;
        log(successMessage, CONFIG.telegram.enabled && CONFIG.telegram.notifySuccess);
        return true;
    } catch (error) {
        let errorMessage;
        if (error.response) {
            errorMessage = `Failed to claim ${claimType} for ID: ${id} - ${error.response.status}: ${error.response.data?.message || 'Already claimed'}`;
        } else {
            errorMessage = `Error claiming ${claimType} for ID: ${id} - ${error.message}`;
        }
        log(errorMessage, CONFIG.telegram.enabled && CONFIG.telegram.notifyError);
        return false;
    }
}

function readIds() {
    try {
        if (!fs.existsSync(CONFIG.idFile)) {
            log(`Warning: ${CONFIG.idFile} does not exist. Creating empty file.`);
            fs.writeFileSync(CONFIG.idFile, '');
            return [];
        }
        
        const data = fs.readFileSync(CONFIG.idFile, 'utf8');
        const ids = data.split('\n').filter(id => id.trim() !== '');
        return ids;
    } catch (error) {
        log(`Error reading IDs file: ${error.message}`, CONFIG.telegram.enabled && CONFIG.telegram.notifyError);
        return [];
    }
}

async function processAllClaims(processDaily, processWeekly) {
    const startTime = new Date();
    let successCount = 0;
    let failCount = 0;
    
    log("========================================");
    log(`   ZAROS Auto Claim - ${formatDate(startTime)}`);
    log("========================================");
    
    if (CONFIG.telegram.enabled && CONFIG.telegram.notifySummary) {
        await sendTelegramMessage(`ðŸš€ Starting claim process\nðŸ“… Date: ${formatDate(startTime)}`);
    }
    
    if (!processDaily && !processWeekly) {
        log("No claims to process at this time.");
        return { success: 0, fail: 0 };
    }
    
    const ids = readIds();
    if (ids.length === 0) {
        log("No IDs found. Please add IDs to id.txt (one per line).", CONFIG.telegram.enabled && CONFIG.telegram.notifyError);
        return { success: 0, fail: 0 };
    }
    
    log(`Found ${ids.length} IDs to process`);
    log(`Processing: ${processDaily ? 'Daily' : ''}${processDaily && processWeekly ? ' and ' : ''}${processWeekly ? 'Weekly' : ''} claims`);
    
    for (const id of ids) {
        const trimmedId = id.trim();
        if (!trimmedId) continue;
        
        if (processDaily) {
            const result = await claim("daily", trimmedId);
            if (result) successCount++; else failCount++;
            await sleep(CONFIG.delayBetweenClaims);
        }
        
        if (processWeekly) {
            const result = await claim("weekly", trimmedId);
            if (result) successCount++; else failCount++;
            await sleep(CONFIG.delayBetweenClaims);
        }
    }
    
    const endTime = new Date();
    const duration = Math.round((endTime - startTime) / 1000);
    const completionMessage = `All claims processed. Success: ${successCount}, Failed: ${failCount}, Duration: ${duration}s`;
    log(completionMessage);
    
    if (CONFIG.telegram.enabled && CONFIG.telegram.notifySummary) {
        const summary = `âœ… Claim process completed\n` +
            `ðŸ“Š Results:\n` +
            `- Success: ${successCount}\n` +
            `- Failed: ${failCount}\n` +
            `- Duration: ${duration} seconds\n` +
            `- Claim types: ${processDaily ? 'Daily' : ''}${processDaily && processWeekly ? ' and ' : ''}${processWeekly ? 'Weekly' : ''}`;
        await sendTelegramMessage(summary);
    }
    
    return { success: successCount, fail: failCount };
}

function calculateMsUntilTime(targetHour) {
    const now = new Date();
    const target = new Date(now);
    
    target.setHours(targetHour, 0, 0, 0);
    
    if (target <= now) {
        target.setDate(target.getDate() + 1);
    }
    
    return target.getTime() - now.getTime();
}

function isWeeklyClaimDay() {
    return new Date().getDay() === CONFIG.weeklyClaimDay;
}

async function runClaimCycle() {
    try {
        const now = new Date();
        const currentHour = now.getHours();
        const shouldProcessDaily = true;
        const shouldProcessWeekly = isWeeklyClaimDay();
        
        await processAllClaims(shouldProcessDaily, shouldProcessWeekly);
        
        const msUntilNextRun = calculateMsUntilTime(CONFIG.dailyClaimHour);
        const nextRunTime = new Date(Date.now() + msUntilNextRun);
        
        const nextRunMessage = `Next run scheduled for: ${formatDate(nextRunTime)}`;
        log(nextRunMessage);
        
        const hours = Math.floor(msUntilNextRun / (60 * 60 * 1000));
        const minutes = Math.floor((msUntilNextRun % (60 * 60 * 1000)) / (60 * 1000));
        log(`Sleeping for ${hours} hours and ${minutes} minutes...`);
        
        if (CONFIG.telegram.enabled && CONFIG.telegram.notifySummary) {
            await sendTelegramMessage(`â° ${nextRunMessage}\nâ³ Waiting: ${hours} hours and ${minutes} minutes`);
        }
        
        setTimeout(runClaimCycle, msUntilNextRun);
        
    } catch (error) {
        const errorMessage = `Error in claim cycle: ${error.message}`;
        log(errorMessage, CONFIG.telegram.enabled && CONFIG.telegram.notifyError);
        log(`Retrying in ${CONFIG.retryDelay / 1000} seconds...`);
        setTimeout(runClaimCycle, CONFIG.retryDelay);
    }
}

function showStartupBanner() {
    console.clear();
    log("************************************************");
    log("*         ZAROS AUTO CLAIM SCRIPT              *");
    log("*                                              *");
    log(`*  Started: ${formatDate(new Date())}              *`);
    log("*                                              *");
    log("*  Daily claims will run automatically at      *");
    log(`*  ${CONFIG.dailyClaimHour}:00 AM every day                         *`);
    log("*                                              *");
    log(`*  Weekly claims will run every ${getDayName(CONFIG.weeklyClaimDay)}          *`);
    log("*                                              *");
    log("*  Telegram notifications: " + (CONFIG.telegram.enabled ? "ENABLED " : "DISABLED") + "           *");
    log("*		modder : @Hanzbroww		*");
    log("*                                              *");
    log("*  Press Ctrl+C to stop the script            *");
    log("************************************************");
    
    if (CONFIG.telegram.enabled && CONFIG.telegram.notifySummary) {
        sendTelegramMessage(`ðŸ”„ ZAROS Auto Claim script started\nðŸ“… Date: ${formatDate(new Date())}`);
    }
}

function getDayName(day) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[day] || "Monday";
}

async function setupTelegram() {
    if (CONFIG.telegram.enabled) {
        return;
    }
    
    console.log("\n=== TELEGRAM SETUP ===");
    console.log("Would you like to enable Telegram notifications? (yes/no)");
    console.log("Type your answer and press Enter:");
    
    const answer = await new Promise(resolve => {
        process.stdin.once('data', data => {
            resolve(data.toString().trim().toLowerCase());
        });
    });
    
    if (answer === 'yes' || answer === 'y') {
        console.log("\nFollow these steps to set up your Telegram bot:");
        console.log("1. Message @BotFather on Telegram to create a new bot");
        console.log("2. Copy the bot token @BotFather gives you");
        console.log("3. Start a conversation with your new bot");
        console.log("4. Run this command in your browser to get your chat ID:");
        console.log("   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates\n");
        
        console.log("Enter your bot token:");
        const botToken = await new Promise(resolve => {
            process.stdin.once('data', data => {
                resolve(data.toString().trim());
            });
        });
        
        console.log("Enter your chat ID:");
        const chatId = await new Promise(resolve => {
            process.stdin.once('data', data => {
                resolve(data.toString().trim());
            });
        });
        
        CONFIG.telegram.enabled = true;
        CONFIG.telegram.botToken = botToken;
        CONFIG.telegram.chatId = chatId;
        
        try {
            await sendTelegramMessage("âœ… Telegram notifications for ZAROS Auto Claim are now set up correctly!");
            console.log("\nâœ… Telegram setup complete! You should receive a test message.");
        } catch (error) {
            console.log("\nâŒ Telegram setup failed:", error.message);
            CONFIG.telegram.enabled = false;
        }
        
        try {
            const configFileContent = `// Telegram configuration for ZAROS auto claim
module.exports = {
    telegram: {
        enabled: ${CONFIG.telegram.enabled},
        botToken: "${CONFIG.telegram.botToken}",
        chatId: "${CONFIG.telegram.chatId}",
        notifySuccess: ${CONFIG.telegram.notifySuccess},
        notifyError: ${CONFIG.telegram.notifyError},
        notifySummary: ${CONFIG.telegram.notifySummary}
    }
};`;
            fs.writeFileSync('telegram_config.js', configFileContent);
            console.log("Configuration saved to telegram_config.js");
        } catch (error) {
            console.log("Failed to save configuration:", error.message);
        }
    } else {
        console.log("\nTelegram notifications will not be enabled.");
    }
}

function loadTelegramConfig() {
    try {
        if (fs.existsSync('telegram_config.js')) {
            const telegramConfig = require('./telegram_config.js');
            if (telegramConfig && telegramConfig.telegram) {
                CONFIG.telegram = telegramConfig.telegram;
                return true;
            }
        }
    } catch (error) {
        console.error("Failed to load Telegram config:", error.message);
    }
    return false;
}

async function start() {
    const loaded = loadTelegramConfig();
    
    if (!loaded) {
        await setupTelegram();
    }
    
    showStartupBanner();
    runClaimCycle();
}

process.on('SIGINT', function() {
    log("Script stopped by user", CONFIG.telegram.enabled && CONFIG.telegram.notifySummary);
    process.exit();
});

start();
