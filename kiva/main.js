const fs = require('fs').promises;
const axios = require('axios');
const Table = require('cli-table');
const chalk = require('chalk');
const crypto = require('crypto');

// Konstanta untuk nama file
const DATA_FILE = 'previousBalances.json';
const ACC_FILE = 'acc.txt';

// Variabel untuk menyimpan data
let previousBalances = {};
let accounts = [];

// Interval penambangan dalam milidetik (24 jam)
const MINING_INTERVAL = 24 * 60 * 60 * 1000;

// Fungsi pembantu

/**
 * Memastikan bahwa file ada. Jika tidak, buat file kosong.
 * @param {string} filePath - Path ke file.
 */
const ensureFileExists = async (filePath) => {
    try {
        await fs.access(filePath);
        console.log(chalk.green(`${filePath} ada.`));
    } catch {
        try {
            await fs.writeFile(filePath, '', 'utf8'); // Buat file kosong
            console.log(chalk.green(`${filePath} dibuat.`));
        } catch (error) {
            console.error(chalk.red(`Gagal membuat ${filePath}: ${error.message}`));
            process.exit(1); // Keluar jika kita tidak dapat membuat file yang diperlukan
        }
    }
};

/**
 * Memuat akun dari file acc.txt.
 * @returns {Promise<void>}
 */
const loadAccounts = async () => {
    try {
        const data = await fs.readFile(ACC_FILE, 'utf8');
        const lines = data.trim().split('\n');

        if (lines.length === 0) {
            console.warn(chalk.yellow(`${ACC_FILE} kosong.`));
            accounts = []; // Atur akun ke array kosong
            return;
        }

        accounts = lines.map(line => {
            const [email, password] = line.split('|'); // Gunakan '|' sebagai pemisah
            if (!email || !password) {
                console.error(chalk.red(`Format tidak valid di ${ACC_FILE}: ${line}`));
                return null; // Lewati baris yang tidak valid
            }
            return { email: email.trim(), password: password.trim() };
        }).filter(account => account !== null); // Saring akun yang tidak valid

        if (accounts.length === 0) {
            console.warn(chalk.yellow(`Tidak ada akun yang valid ditemukan di ${ACC_FILE}.`));
        } else {
            console.log(chalk.green(`Memuat ${accounts.length} akun dari ${ACC_FILE}.`));
        }
    } catch (error) {
        console.error(chalk.red(`Kesalahan memuat akun dari ${ACC_FILE}: ${error.message}`));
        process.exit(1);
    }
};

/**
 * Memuat saldo sebelumnya dari file.
 * @returns {Promise<void>}
 */
const loadPreviousBalances = async () => {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        previousBalances = JSON.parse(data);
        console.log(chalk.green('Saldo sebelumnya dimuat dari file.'));
    } catch (error) {
        console.log(chalk.yellow('Tidak ada file saldo sebelumnya yang ditemukan, memulai dari awal.'));
        previousBalances = {};
    }
};

/**
 * Menyimpan saldo sebelumnya ke file.
 * @returns {Promise<void>}
 */
const savePreviousBalances = async () => {
    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(previousBalances), 'utf8');
        console.log(chalk.green('Saldo sebelumnya disimpan ke file.'));
    } catch (error) {
        console.error(chalk.red('Kesalahan menyimpan saldo sebelumnya ke file:'), error.message);
    }
};

/**
 * Menghasilkan header untuk permintaan.
 * @param {string} [token] - Token otorisasi.
 * @returns {object} - Objek header.
 */
const getHeaders = (token) => ({
    'Content-Type': 'application/json',
    'Accept': '*/*',
    'Accept-Language': 'id-ID,id;q=0.7',
    'Authorization': token ? `Bearer ${token}` : undefined, // Sertakan header Otorisasi jika token ada
});

/**
 * Hash kata sandi menggunakan MD5.
 * @param {string} password - Kata sandi untuk di-hash.
 * @returns {string} - Kata sandi yang di-hash.
 */
const hashPassword = (password) => {
    return crypto.createHash('md5').update(password).digest('hex');
};

/**
 * Menghitung waktu penambangan dari dua tanda waktu.
 * @param {number} signTime - Tanda waktu penandatanganan.
 * @param {number} nowTime - Tanda waktu saat ini.
 * @returns {string} - String yang diformat yang mewakili waktu penambangan, atau 'N/A' jika salah satu tanda waktu hilang.
 */
function calculateMiningTime(signTime, nowTime) {
    if (!signTime || !nowTime) {
        return chalk.gray('N/A');
    }
    const timeDiffMs = nowTime - signTime;
    const timeDiffSec = timeDiffMs / 1000;
    const hours = Math.floor(timeDiffSec / 3600);
    const minutes = Math.floor((timeDiffSec % 3600) / 60);
    const seconds = Math.floor(timeDiffSec % 60);
    return `${hours}j ${minutes}m ${seconds}s`;
}

// Fungsi API

/**
 * Mencoba masuk dengan email dan kata sandi yang diberikan.
 * @param {string} email - Email akun.
 * @param {string} password - Kata sandi akun.
 * @returns {Promise<string|null>} - Token jika berhasil, null jika tidak.
 */
const login = async (email, password) => {
    const headers = getHeaders();
    try {
        const hashedPassword = hashPassword(password); // Hash kata sandi sebelum mengirim
        const response = await axios.post('https://app.kivanet.com/api/user/login', { email, password: hashedPassword }, { headers });

        if (response.data.state) {
            return response.data.object; // Kembalikan token
        } else {
            return null;
        }
    } catch (error) {
        return null;
    }
};

/**
 * Mengambil informasi pengguna.
 * @param {string} token - Token otorisasi.
 * @returns {Promise<object|null>} - Informasi pengguna jika berhasil, null jika tidak.
 */
const getUserInfo = async (token) => {
    try {
        const response = await axios.get('https://app.kivanet.com/api/user/getUserInfo', { headers: getHeaders(token) });
        if (response.data && response.data.object) {
            return response.data.object;
        } else {
            return null;
        }
    } catch (error) {
        return null;
    }
};

/**
 * Mengambil informasi akun saya.
 * @param {string} token - Token otorisasi.
 * @returns {Promise<object|null>} - Informasi akun jika berhasil, null jika tidak.
 */
const getMyAccountInfo = async (token) => {
    try {
        const response = await axios.get('https://app.kivanet.com/api/user/getMyAccountInfo', { headers: getHeaders(token) });
        if (response.data && response.data.object) {
            return response.data.object;
        } else {
            return null;
        }
    } catch (error) {
        return null;
    }
};

/**
 * Mengambil informasi penandatanganan dengan percobaan ulang.
 * @param {string} token - Token otorisasi.
 * @param {number} [maxRetries=3] - Jumlah maksimum percobaan ulang.
 * @returns {Promise<object|null>} - Informasi penandatanganan jika berhasil, null jika tidak setelah semua percobaan ulang.
 */
const getSignInfo = async (token, maxRetries = 3) => {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            const response = await axios.get('https://app.kivanet.com/api/user/getSignInfo', { headers: getHeaders(token) });
            if (response.data && response.data.object) {
                return response.data.object;
            } else {
                retries++;
                await new Promise(resolve => setTimeout(resolve, 1000)); // Tunggu 1 detik sebelum mencoba lagi
            }
        } catch (error) {
            retries++;
            await new Promise(resolve => setTimeout(resolve, 1000)); // Tunggu 1 detik sebelum mencoba lagi
        }
    }
    return null;
};

/**
 * Melakukan penambangan untuk satu akun.
 * @param {string} token - Token otorisasi.
 * @param {string} email - Email akun.
 * @returns {Promise<boolean>} - Benar jika penambangan berhasil, salah jika tidak.
 */
const performMining = async (token, email) => {
    try {
        const response = await axios.post("https://app.kivanet.com/api/user/sign", {}, { headers: getHeaders(token) });
        if (response.data && response.data.state) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        return false;
    }
};

// Fungsi tampilan

/**
 * Menampilkan statistik dalam tabel.
 * @param {Array<object>} accountsData - Array data akun.
 */
const displayStats = (accountsData) => {
    console.clear();

    const table = new Table({
        head: [chalk.bold('ID'), chalk.bold('Nama Panggilan'), chalk.bold('Saldo'), chalk.bold('Waktu Penambangan'), chalk.bold('Kenaikan Penambangan'), chalk.bold('Status')],
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

// Fungsi pemrosesan utama

/**
 * Memproses satu akun.
 * @param {object} account - Objek akun dengan email dan kata sandi.
 * @returns {Promise<object>} - Objek statistik dengan informasi tentang akun.
 */
const processAccount = async ({ email, password }) => {
    const stats = { id: null, nickname: null, balance: null, miningTime: null, increment: null };

    try {
        const token = await login(email, password);
        
        if (!token) return {...stats, status: chalk.red(`Login gagal untuk ${email}`)};
        
        const userInfo = await getUserInfo(token);
        
        if (!userInfo) return {...stats, status: chalk.red(`Gagal mengambil informasi pengguna untuk ${email}`)};
        
        stats.id = userInfo.id;
        stats.nickname = userInfo.nickName;

        const accountInfo = await getMyAccountInfo(token);
        
        if (!accountInfo) return {...stats, status: chalk.red(`Gagal mengambil informasi akun untuk ${email}`)};
        
        stats.balance = `${accountInfo.balance} Kiva`;

        const signInfo = await getSignInfo(token);
        
        if (!signInfo || !signInfo.signTime || !signInfo.nowTime) {
            stats.miningTime = chalk.gray('N/A');
            stats.increment = null; // Tidak mungkin menghitung kenaikan tanpa informasi saldo
        } else {
            stats.miningTime = calculateMiningTime(parseInt(signInfo.signTime), parseInt(signInfo.nowTime));

            // Hitung Kenaikan Penambangan
            const currentBalance = parseFloat(accountInfo.balance);
            const prevBalance = previousBalances[stats.id];

            if (prevBalance !== undefined) {
                stats.increment = currentBalance - prevBalance; // Hitung kenaikan
                previousBalances[stats.id] = currentBalance; // Perbarui saldo sebelumnya
            } else {
                stats.increment = null; // Atur kenaikan ke null jika saldo sebelumnya tidak tersedia
                previousBalances[stats.id] = currentBalance; // Simpan saldo saat ini sebagai saldo sebelumnya pertama kali
            }

        	stats.status=chalk.green("Selesai");
            
    	}
		
		return stats;

	} catch(error){
		return {...stats,status:chalk.red(`Kesalahan saat memproses akun ${email}: ${error.message}`)};
	}
};

/**
 * Melakukan penambangan untuk semua akun secara otomatis setiap interval tertentu
 */
async function performMiningForAllAccounts() {

	for (let account of accounts){
		const token=await login(account.email,account.password);

		if(token){
			await performMining(token,account.email);
		}
	}
}

/**
* Fungsi utama untuk menjalankan bot. 
* @returns{Promise<void>}
*/
const runBot=async()=>{
	await ensureFileExists(ACC_FILE);
	await ensureFileExists(DATA_FILE);

	await loadPreviousBalances();
	await loadAccounts(); 

	if(accounts.length===0){
		console.log(chalk.red("Tidak ada akun yang dimuat. Menghentikan bot."));
		return;
	}

	await performMiningForAllAccounts();

	const results=await Promise.all(accounts.map(processAccount));
	displayStats(results);

	setInterval(async () => {

		await performMiningForAllAccounts();
		
		const results=await Promise.all(accounts.map(processAccount));
		displayStats(results);
		
		await savePreviousBalances();
		
	},MINING_INTERVAL);

	setInterval(async () => {

		const results=await Promise.all(accounts.map(processAccount));
		displayStats(results);
		
		await savePreviousBalances(); 
		
	},60*1000); 
};

// Mulai bot
runBot().catch(err=>console.error(chalk.red("Kesalahan fatal:"),err));
