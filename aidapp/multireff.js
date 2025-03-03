const { Wallet } = require("ethers");
const axios = require("axios");
const fs = require("fs").promises;
const readline = require("readline");

const banner = `
=======================================
    AIDA AUTO BOT | AIRDROP INSIDER
=======================================
`;

const config = {
    baseUrl: "https://back.aidapp.com",
    campaignId: "6b963d81-a8e9-4046-b14f-8454bc3e6eb2",
    excludedMissionId: "f8edb0b4-ac7d-4a32-8522-65c5fb053725", // Task Invite 1 friend
    //referralCode: "msew8RAmU41BymD", // Referral Anda - HAPUS INI ATAU DIKOMENTARI
    headers: {
        "authority": "back.aidapp.com",
        "accept": "*/*",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-US,en;q=0.6",
        "origin": "https://my.aidapp.com",
        "referer": "https://my.aidapp.com/",
        "sec-ch-ua": '"Not(A:Brand";v="99", "Brave";v="133", "Chromium";v="133"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "sec-gpc": "1",
        "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    },
    createWalletMissionId: "df2a34a4-05a9-4bde-856a-7f5b8768889a" // ID Misi "Create the wallet"
};

// Fungsi untuk Membaca Kode Referral dari File
async function readReferralCodes(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        // Asumsikan setiap kode referral ada di baris yang berbeda
        const referralCodes = data.split('\n').map(code => code.trim()).filter(code => code !== '');
        return referralCodes;
    } catch (error) {
        console.error("Error reading referral codes file:", error.message);
        return []; // Mengembalikan array kosong jika terjadi kesalahan
    }
}


// Fungsi untuk Membuat Wallet Baru
async function generateWallet() {
    const wallet = Wallet.createRandom();
    console.log(`\n===== Wallet Baru Dibuat =====`);
    console.log(`Alamat: ${wallet.address}`);
    console.log(`Backup Phrase: ${wallet.mnemonic.phrase}`);
    console.log(`Private Key: ${wallet.privateKey}\n`);
    return wallet;
}

// Fungsi untuk Menandatangani Pesan
async function signMessage(wallet) {
    const message = `MESSAGE_ETHEREUM_${Date.now()}:${Date.now()}`;
    const signature = await wallet.signMessage(message);
    return { message, signature };
}

// Fungsi untuk Mendaftarkan Akun
async function registerAccount(wallet, referralCode) {
    try {
        const { message, signature } = await signMessage(wallet);
        const url = `${config.baseUrl}/user-auth/login?strategy=WALLET&chainType=EVM&address=${wallet.address}&token=${message}&signature=${signature}&inviter=${referralCode}`;
        const response = await axios.get(url);

        if (response.status === 200 && response.data.tokens?.access_token) {
            console.log(`Registered account ${wallet.address} with token: ${response.data.tokens.access_token} using referral code ${referralCode}`);
            return response.data.tokens.access_token;
        } else {
            throw new Error("Failed to register account or retrieve access token.");
        }
    } catch (error) {
        console.error(`Error registering account:`, error.message);
        return null;
    }
}

// Fungsi untuk Menyimpan Wallet ke config.json
async function saveWalletToConfig(wallet) {
    try {
        const data = {
            address: wallet.address,
            privateKey: wallet.privateKey,
            mnemonic: wallet.mnemonic.phrase,
        };

        // Baca atau buat file config.json
        let existingConfig = {};
        try {
            const configFileContent = await fs.readFile("config.json", "utf8");
            existingConfig = JSON.parse(configFileContent);
        } catch (readError) {
            // Jika file tidak ada atau tidak valid, buat objek kosong
            console.log("config.json tidak ditemukan atau tidak valid, membuat baru.");
        }

        if (!existingConfig.wallets) {
            existingConfig.wallets = [];
        }
        
        existingConfig.wallets.push(data);

        await fs.writeFile("config.json", JSON.stringify(existingConfig, null, 2), "utf8");
        console.log(`Saved wallet ${wallet.address} to config.json`);
    } catch (error) {
        console.error(`Error saving wallet to config.json:`, error.message);
    }
}

// Fungsi untuk Mendapatkan Misi yang Tersedia
async function getAvailableMissions(accessToken) {
    try {
        const currentDate = new Date().toISOString();
        const url = `${config.baseUrl}/questing/missions?filter%5Bdate%5D=${currentDate}&filter%5Bgrouped%5D=true&filter%5Bprogress%5D=true&filter%5Brewards%5D=true&filter%5Bstatus%5D=AVAILABLE&filter%5BcampaignId%5D=${config.campaignId}`;
        const response = await axios.get(url, {
            headers: { ...config.headers, authorization: `Bearer ${accessToken}` },
        });

        return response.data.data.filter(
            (mission) => mission.progress === "0" && mission.id !== config.excludedMissionId
        );
    } catch (error) {
        console.error("Error fetching available missions:", error.message);
        return [];
    }
}

// Fungsi untuk Menyelesaikan Misi
async function completeMission(missionId, accessToken) {
    try {
        const url = `${config.baseUrl}/questing/mission-activity/${missionId}`;
        await axios.post(url, {}, { headers: { ...config.headers, authorization: `Bearer ${accessToken}` } });
        console.log(`Mission ${missionId} completed successfully!`);
        return true;
    } catch (error) {
        console.error(`Error completing mission ${missionId}:`, error.message);
        return false;
    }
}

// Fungsi untuk Mengklaim Hadiah Misi
async function claimMissionReward(missionId, accessToken) {
    try {
        const url = `${config.baseUrl}/questing/mission-reward/${missionId}`;
        await axios.post(url, {}, { headers: { ...config.headers, authorization: `Bearer ${accessToken}` } });
        console.log(`Reward for mission ${missionId} claimed successfully!`);
        return true;
    } catch (error) {
        console.error(`Error claiming reward for mission ${missionId}:`, error.message);
        return false;
    }
}

// Fungsi untuk Memproses Akun
async function processAccount(wallet, accessToken) {
    try {
        // Simpan wallet ke config.json
        await saveWalletToConfig(wallet);

        // **Task: Create Wallet**
        // Check if the create wallet mission ID is set
        if (config.createWalletMissionId) {
            console.log(`Attempting to complete Create Wallet mission (ID: ${config.createWalletMissionId})`);
            const createWalletCompleted = await completeMission(config.createWalletMissionId, accessToken);
            
            if (createWalletCompleted) {
                await claimMissionReward(config.createWalletMissionId, accessToken);
            } else {
                console.log(`Failed to complete Create Wallet mission (ID: ${config.createWalletMissionId}).`);
            }
            
            // Small delay after attempting the create wallet mission
            await new Promise((resolve) => setTimeout(resolve, 2000));
        } else {
            console.log("Create Wallet mission ID not set. Skipping Create Wallet mission.");
        }

        // Ambil misi yang tersedia
        const availableMissions = await getAvailableMissions(accessToken);
        if (availableMissions.length === 0) {
            console.log("No missions available for this account.");
            return;
        }

        console.log(`Found ${availableMissions.length} missions to complete.`);

        // Proses setiap misi
        for (const mission of availableMissions) {
            console.log(`Processing mission: ${mission.label} (ID: ${mission.id})`);

            const completed = await completeMission(mission.id, accessToken);
            if (completed) {
                await claimMissionReward(mission.id, accessToken);
            }

            // Tambahkan jeda waktu antar misi
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
    } catch (error) {
        console.error("Error processing account:", error.message);
    }
}

// Fungsi untuk Meminta Input dari Pengguna
function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => rl.question(query, (ans) => rl.close() || resolve(ans)));
}

// Jalankan Bot
(async () => {
    try {
        console.log(banner);

        // Baca kode referral dari file
        const referralCodes = await readReferralCodes('reffcode.txt');

        if (referralCodes.length === 0) {
            throw new Error("No referral codes found in reffcode.txt. Please add referral codes to the file.");
        }

        const answer = await askQuestion("Enter the number of accounts to generate: ");
        const accountCount = parseInt(answer);

        if (isNaN(accountCount) || accountCount <= 0) {
            throw new Error("Invalid number of accounts.");
        }

        console.log(`Starting bot to generate ${accountCount} accounts...`);

        for (let i = 1; i <= accountCount; i++) {
            console.log(`\nProcessing account ${i}/${accountCount}...`);

            // Pilih kode referral secara bergiliran
            const referralCode = referralCodes[i % referralCodes.length];
            console.log(`Using referral code: ${referralCode}`);

            // Buat wallet baru dan daftar akun
            const wallet = await generateWallet();
            const accessToken = await registerAccount(wallet, referralCode); // Gunakan referral code dari file

            if (!accessToken) {
                console.error(`Failed to register account ${i}. Skipping...`);
                continue;
            }

            // Proses akun dan misinya
            try {
                await processAccount(wallet, accessToken);
            } catch (error) {
                console.error(`Error saat memproses akun:`, error.message);
            }
            // Tambahkan jeda waktu antar akun
            await new Promise((resolve) => setTimeout(resolve, 3000));

            console.log(`Finished processing account ${i}`);
        }

        console.log("\nBot finished processing all accounts.");
    } catch (error) {
        console.error("An error occurred:", error.message);
    }
})();
      
