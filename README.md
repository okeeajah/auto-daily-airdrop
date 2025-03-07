# 📌 Auto Daily Airdrop Bot 🚀

Automate your daily check-ins, tasks, and claims for multiple platforms with ease!  
This script will help you mendapatkan daily rewards dari berbagai platform, termasuk **Infinity Ground, Lasso, Klok AI, Zaros, Fun Overdive, AIDA, dan Dreamer** dengan mudah!

## 🎯 Features  
✅ Auto Check-in & Task Completion for Infinity Ground  
✅ Auto Play Lasso & Claim MON  
✅ Automate Tasks with Klok AI  
✅ Zaros Daily Check-in with Wallet Integration  
✅ Fun Overdive Auto Task + Daily Check-in (Support Multi Wallet & Proxies)  
✅ AIDA Auto Task Bot (Complete all tasks except Invite Friends)  
✅ Dreamer Auto Spin & Daily Check-in  
✅ Run scripts in the background using `screen` on VPS  

---

## 🛠️ Installation  

### **1️⃣ Clone Repository & Install Dependencies**  
```bash
git clone https://github.com/okeeajah/auto-daily-airdrop.git
cd auto-daily-airdrop

npm install axios fs ethers path node-cron readline https-proxy-agent socks-proxy-agent chalk@4 cli-table
```

---

### **2️⃣ Infinity Ground Auto Check-in**  
```bash
cd infinity
nano token.txt

screen -S infinity
node infinity.js
```

---

### **3️⃣ Auto Play Lasso and Claim MON**  
```bash
cd dusted
nano pk.txt
nano token.txt

screen -S lasso
node dusted.js
```

---

### **4️⃣ Klok AI Auto Tasks**  
```bash
cd klok
nano token.txt

screen -S klok
node klok.js
```

---

### **5️⃣ Zaros Daily Check-in**  
**1. Get session ID & account info**  
- Open Developer Tools (**F12**)  
- Go to **Local Storage** → **Find Session ID**  
- AccountID: **Trading Account#(YOUR ID)** (ex: Trading Account#8930)  

**2. Setup Config File**  
```bash
cd zaros
nano config.json
```
- Format:  
```json
{
  "baseUrl": "https://production.api.zaros.fi",
  "accountId": "8xxx",
  "walletAddress": "YOUR_WALLET_ADDRESS",
  "sessionToken": "YOUR_SESSION_TOKEN"
}
```

**3. Run the bot**  
```bash
screen -S zaros
node zaros.js
```

---

### **6️⃣ Fun Overdive Auto Task + Daily Check-in**  
✅ **Support Multi Wallet & Proxies**  
➡️ **NEED TO VERIFY TWITTER FOR SOCIAL TASKS**  

```bash
cd overdive
nano pk.txt
nano proxies.txt

screen -S overdive
node overdive.js
```

---

### **7️⃣ AIDA Auto Task Bot**  
✅ **Auto Complete all tasks (exclude Invite Friends)**  
✅ **Support Multi Accounts**  

**1. Get Access Token**  
- Open Developer Tools (**F12**)  
- Go to **Application** → **Local Storage**  
- Find **Access Token**  

**2. Save Token**  
```bash
cd aidapp
nano token.txt
```
- Paste your **Access Token**  
- Save & Exit  

**3. Run AIDA Bot**  
```bash
screen -S aida
node bot.js
```

**4. Run Multi Referral**  
```bash
node multireff.js
```

**5. Run Referral**  
```bash
node reff.js
```

---

### **8️⃣ Dreamer Auto Spin & Daily Check-in**  
✅ **Auto Spin & Daily Check-in only (No Auto Task)**  

**1. Add accounts**  
```bash
cd dreamer
nano accounts.txt
```
- Format:  
```txt
uid|cookie
```
- Example:  
```txt
123456789|your-cookie-here
```

**2. Run Dreamer Auto Spin & Daily Check-in**  
```bash
screen -S dreamer
node bot.js
```

---

## 🔥 Notes  
- **Always use `screen`** to run bots on VPS  
- **Make sure to enter valid tokens/wallets**  
- **Proxies are required for Fun Overdive**  
- **Twitter verification is needed for Overdive social tasks**  
- **Dreamer requires `uid` and `cookie` format**  
- **Dreamer Auto Spin & Daily Check-in menggunakan `node bot.js`**  

🚀 **Enjoy your automated tasks!** 🚀
