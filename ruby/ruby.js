const fs = require('fs');
const axios = require('axios');
const crypto = require('crypto');
const path = require('path');

const BASE_URL = 'https://rubi.click/api';
const headers = {
  'User-Agent': 'okhttp/4.9.1',
  'Connection': 'Keep-Alive',
  'Accept': 'application/json',
  'Accept-Encoding': 'gzip',
  'Content-Type': 'application/json',
  'lang': 'en',
  'driver-login': 'jwt',
  'app_version': '1.42'
};

const EXPLOIT_STOCK_ID = 20;

function generateDeviceInfo() {
  const manufacturers = ['Samsung', 'Xiaomi', 'OnePlus', 'OPPO', 'Vivo', 'Realme', 'Huawei'];
  const deviceModels = ['A5010', 'SM-A505F', 'Redmi Note 9', 'F11 Pro', 'V2023', 'GT Neo 3', 'P40 Lite'];
  const deviceNames = ['samsung-a50', 'xiaomi-note9', 'oneplus-nord', 'oppo-f11', 'vivo-v20', 'realme-gt', 'huawei-p40'];
  const androidVersions = ['9', '10', '11', '12', '13'];
  
  const randomIndex = Math.floor(Math.random() * manufacturers.length);
  const randomDeviceId = crypto.randomBytes(8).toString('hex');
  const randomPushToken = crypto.randomUUID ? crypto.randomUUID() : 
                           `${crypto.randomBytes(4).toString('hex')}-${crypto.randomBytes(2).toString('hex')}-` +
                           `${crypto.randomBytes(2).toString('hex')}-${crypto.randomBytes(2).toString('hex')}-` +
                           `${crypto.randomBytes(6).toString('hex')}`;
  
  return {
    device_push_token: randomPushToken,
    device_os: "android",
    device_id: randomDeviceId,
    device_name: deviceNames[randomIndex],
    device_model: deviceModels[randomIndex],
    device_branch: manufacturers[randomIndex],
    device_os_version: androidVersions[Math.floor(Math.random() * androidVersions.length)],
    device_manufacturer: manufacturers[randomIndex]
  };
}

async function login(username, password) {
  try {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }
    
    console.log(`Attempting to login with username: ${username}`);
    
    const deviceInfo = generateDeviceInfo();
    
    const loginData = {
      username,
      password,
      ...deviceInfo
    };
    
    const response = await axios.post(`${BASE_URL}/login`, loginData, {
      headers
    });
    
    if (response.data && response.data.access_token) {
      const token = response.data.access_token;
      fs.writeFileSync('token.txt', token);
      console.log('Login successful! Token saved to token.txt');
      return token;
    } else {
      throw new Error('No access token received');
    }
  } catch (error) {
    console.error('Login failed:', error.response ? error.response.data : error.message);
    throw new Error('Login failed');
  }
}

class RubiClient {
  constructor(token) {
    this.token = token;
    this.headers = {
      ...headers,
      'authorization': `Bearer ${token}`
    };
  }

  async getConfig() {
    try {
      const response = await axios.get(`${BASE_URL}/config/all`, {
        headers: this.headers
      });
      return response.data;
    } catch (error) {
      console.error('Error getting config:', error.message);
      return null;
    }
  }

  async startMining() {
    try {
      const response = await axios.post(`${BASE_URL}/exploit`, {
        exploit_stock_id: EXPLOIT_STOCK_ID
      }, {
        headers: this.headers
      });
      return response.data;
    } catch (error) {
      console.error('Error starting mining:', error.message);
      return null;
    }
  }

  async getStockInfo() {
    try {
      const response = await axios.get(`${BASE_URL}/exploit/stock_v2`, {
        headers: this.headers
      });
      return response.data;
    } catch (error) {
      console.error('Error getting stock info:', error.message);
      return null;
    }
  }

  async getRemainingTime() {
    try {
      const response = await axios.post(`${BASE_URL}/exploit/time-remain`, {}, {
        headers: this.headers
      });
      return response.data;
    } catch (error) {
      console.error('Error getting remaining time:', error.message);
      return null;
    }
  }

  async getHomeInfo() {
    try {
      const response = await axios.get(`${BASE_URL}/home`, {
        headers: this.headers
      });
      return response.data;
    } catch (error) {
      console.error('Error getting home info:', error.message);
      return null;
    }
  }

  async getWalletInfo() {
    try {
      const response = await axios.get(`${BASE_URL}/wallet/info`, {
        headers: {
          ...this.headers,
          'wallet-token': 'null',
          'wallet-code': 'null'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting wallet info:', error.message);
      return null;
    }
  }

  async refreshToken() {
    try {
      const response = await axios.post(`${BASE_URL}/user/refresh`, {}, {
        headers: this.headers
      });
      
      if (response.data && response.data.access_token) {
        this.token = response.data.access_token;
        this.headers.authorization = `Bearer ${this.token}`;
        
        fs.writeFileSync('token.txt', this.token);
        console.log('Token refreshed and saved');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error refreshing token:', error.message);
      return null;
    }
  }

  async isTokenValid() {
    try {
      const response = await this.getHomeInfo();
      return response && response.success !== false;
    } catch (error) {
      return false;
    }
  }
}

class MiningBot {
  constructor(token) {
    this.token = token;
    this.client = new RubiClient(this.token);
    this.running = false;
    this.miningInterval = null;
    this.checkInterval = null;
    this.tokenRefreshInterval = null;
    this.balanceUpdateInterval = null;
    this.lastRubyBlockSwapAll = 0;
  }

  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  async displayInfo() {
    const walletInfo = await this.client.getWalletInfo();
    if (walletInfo && walletInfo.data) {
      const balance = walletInfo.data.balance || 0;
      console.log(`\n📊 Current Balance: ${balance} coins`);
    }

    const homeInfo = await this.client.getHomeInfo();
    if (homeInfo && homeInfo.data && homeInfo.data.info) {
      const rubyBlockSwapAll = homeInfo.data.info.ruby_block_swap_all || 0;
      const rubyBlockSwap = homeInfo.data.info.ruby_block_swap || 0;
      const exploitSpeed = homeInfo.data.info.exploit_speed || 0;
      
      console.log(`💎 Ruby Block Swap All: ${rubyBlockSwapAll.toFixed(5)}`);
      console.log(`💠 Ruby Block Swap: ${rubyBlockSwap}`);
      console.log(`⚡ Exploit Speed: ${exploitSpeed}`);
      
      if (this.lastRubyBlockSwapAll > 0) {
        const difference = rubyBlockSwapAll - this.lastRubyBlockSwapAll;
        if (difference !== 0) {
          console.log(`📈 Change since last check: ${difference > 0 ? '+' : ''}${difference.toFixed(5)}`);
        }
      }
      
      this.lastRubyBlockSwapAll = rubyBlockSwapAll;
    }

    const timeInfo = await this.client.getRemainingTime();
    if (timeInfo && timeInfo.data) {
      const remainingTime = timeInfo.data.time_remain || 0;
      const exploitedTime = timeInfo.data.time_exploited || 0;
      console.log(`⏱️ Mining time remaining: ${this.formatTime(remainingTime)}`);
      console.log(`⌛ Time already mined: ${this.formatTime(exploitedTime)}`);
    }

    const stockInfo = await this.client.getStockInfo();
    if (stockInfo && stockInfo.data && stockInfo.data.length > 0) {
      const currentStock = stockInfo.data.find(item => item.id === EXPLOIT_STOCK_ID);
      if (currentStock) {
        console.log(`🔍 Mining stock: ${currentStock.name} (ID: ${currentStock.id})`);
        console.log(`💰 Reward: ${currentStock.item_price} coins per session`);
      }
    }
  }

  async updateRealTimeBalance() {
    try {
      const homeInfo = await this.client.getHomeInfo();
      if (homeInfo && homeInfo.data && homeInfo.data.info) {
        const rubyBlockSwapAll = homeInfo.data.info.ruby_block_swap_all || 0;
        
        process.stdout.write(`\r💎 Ruby Block Swap All: ${rubyBlockSwapAll.toFixed(5)}${' '.repeat(20)}`);
        
        if (this.lastRubyBlockSwapAll > 0) {
          const difference = rubyBlockSwapAll - this.lastRubyBlockSwapAll;
          if (difference !== 0) {
            process.stdout.write(` | Change: ${difference > 0 ? '+' : ''}${difference.toFixed(5)}`);
          }
        }
        
        this.lastRubyBlockSwapAll = rubyBlockSwapAll;
      }
    } catch (error) {
      process.stdout.write(`\rError updating balance: ${error.message}${' '.repeat(20)}`);
    }
  }

  async startMining() {
    if (this.running) {
      console.log('Mining bot is already running');
      return;
    }

    this.running = true;
    console.log('🤖 Starting Rubi Click Mining Bot...');
    
    await this.displayInfo();

    this.balanceUpdateInterval = setInterval(() => {
      this.updateRealTimeBalance();
    }, 10 * 1000);

    this.tokenRefreshInterval = setInterval(async () => {
      await this.client.refreshToken();
    }, 50 * 60 * 1000);

    this.miningInterval = setInterval(async () => {
      const result = await this.client.startMining();
      if (result && result.success) {
        console.log(`\n✅ Mining successful! ${new Date().toLocaleTimeString()}`);
        await this.displayInfo();
      } else if (result) {
        console.log(`\n❌ Mining failed: ${result.message || 'Unknown error'}`);
      } else {
        console.log('\n❌ Mining failed');
      }
    }, 5 * 60 * 1000); 

    this.checkInterval = setInterval(async () => {
      await this.displayInfo();
    }, 15 * 60 * 1000);
  }

  stop() {
    if (!this.running) {
      console.log('Mining bot is not running');
      return;
    }

    clearInterval(this.miningInterval);
    clearInterval(this.checkInterval);
    clearInterval(this.tokenRefreshInterval);
    clearInterval(this.balanceUpdateInterval);
    this.running = false;
    console.log('Mining bot stopped');
  }
}

function clearTerminal() {
  process.stdout.write('\x1Bc');
}

function promptCredentials() {
  return new Promise((resolve) => {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    let username, password;

    readline.question('Enter your Rubi Click username: ', (answer) => {
      username = answer;
      
      process.stdout.write('Enter your Rubi Click password: ');
      process.stdin.setRawMode(true);
      let pass = '';
      
      process.stdin.on('data', (data) => {
        const char = data.toString();
        
        if (char === '\r' || char === '\n') {
          process.stdin.setRawMode(false);
          readline.close();
          process.stdout.write('\n');
          password = pass;
          resolve({ username, password });
        } 

        else if (char === '\b' || char === '\x7f') {
          if (pass.length > 0) {
            pass = pass.slice(0, -1);
            process.stdout.write('\b \b');
          }
        } 

        else if (char !== '\u0003') { 
          pass += char;
          process.stdout.write('*');
        }
      });
    });
  });
}

async function main() {
  clearTerminal();
  console.log('===== RUBI CLICK MINING BOT =====');
  console.log('Press Ctrl+C to stop the bot at any time\n');
  
  let token;
  
  if (fs.existsSync('token.txt')) {
    token = fs.readFileSync('token.txt', 'utf8').trim();
    console.log('Found existing token, verifying...');
    
    const client = new RubiClient(token);
    const isValid = await client.isTokenValid();
    
    if (!isValid) {
      console.log('Token is invalid or expired, login required');
      token = null;
    } else {
      console.log('Token is valid, using existing token');
    }
  }
  
  if (!token) {
    const credentials = await promptCredentials();
    try {
      token = await login(credentials.username, credentials.password);
    } catch (error) {
      console.error('Login failed. Please try again.');
      process.exit(1);
    }
  }
  
  const bot = new MiningBot(token);
  bot.startMining();
  
  process.on('SIGINT', () => {
    console.log('\nStopping mining bot...');
    bot.stop();
    process.exit();
  });
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
