# 🚀 **Auto Daily Airdrop Bot**  

🔹 **Automate daily check-ins, tasks, and claims**  
🔹 **Supports multiple platforms: Infinity Ground, Lasso, Klok AI, Zaros, and Fun Overdive**  
🔹 **Runs in the background using `screen` on VPS**  
🔹 **Supports Multi Wallet & Proxies**  

---

## 📂 **Struktur Direktori**
```
auto-daily-airdrop/
│── dusted/        # Auto Play Lasso & Claim MON
│── infinity/      # Auto Check-in & Task Completion for Infinity Ground
│── klok/         # Automate Tasks with Klok AI
│── zaros/        # Zaros Daily Check-in with Wallet Integration
│── overdive/     # Fun Overdive Auto Task + Daily Check-in
│── README.md     # Dokumentasi utama
```

---

## 🛠️ **Installation**  

### 1️⃣ **Prerequisites**  
💾 Install **Node.js** & `screen`:  

```bash
sudo apt install screen -y  # Ubuntu/Debian  
sudo yum install screen -y  # CentOS/RHEL  
```

🖍️ **(Optional) Install `chalk@4` for better output formatting:**  
```bash
npm install chalk@4  
```

---

## 📌 **Project 1: Infinity Ground Auto Check-in**  
✔️ **Check-in & Complete Tasks Automatically**  

### **Setup**
```bash
cd infinity  
screen -S infinity  
nano token.txt  
```
🎯 **Run the script:**  
```bash
node infinity.js  
```

---

## 🎮 **Project 2: Auto Play Lasso & Claim MON**  
✔️ **Uses Bearer Token + Wallet Private Key**  

### **Setup**
```bash
cd dusted  
screen -S lasso  
nano pk.txt  
nano token.txt  
npm install axios ethers fs node-cron chalk@4  
```
🎯 **Run the script:**  
```bash
node dusted.js  
```

---

## 🤖 **Project 3: Automate Tasks with Klok AI**  
✔️ **Automates multiple AI tasks**  

### **Setup**
```bash
cd klok  
screen -S klok  
nano token.txt  
```
🎯 **Run the script:**  
```bash
node klok.js  
```

---

## 💼 **Project 4: Zaros Daily Check-in**  
✔️ **Login & Check-in using Wallet Integration**  

### **Setup**
```bash
cd zaros  
screen -S zaros  
nano config.json  
```

📜 **Config Format (`config.json`):**
```json
{
  "baseUrl": "https://production.api.zaros.fi",
  "accountId": "8xxx",
  "walletAddress": "WALLETADDREESS",
  "sessionToken": "your-session-token-here"
}
```

🎯 **Run the script:**  
```bash
npm install axios fs path chalk@4  
node zaros.js  
```

---

## 🎯 **Project 5: Fun Overdive Auto Task + Daily Check-in**  
✔️ **Supports Multi Wallet & Proxies**  
✔️ **Requires Twitter Verification for Social Tasks**  

### **Setup**
```bash
cd overdive  
screen -S overdive  
nano pk.txt  
nano proxies.txt  
```

🎯 **Run the script:**  
```bash
npm install axios fs readline ethers https-proxy-agent socks-proxy-agent chalk@4  
node overdive.js  # atau  
node bot.js  
```

---

### 🔥 **Tips & Tricks**  
✔️ **Exit `screen` session:** `Ctrl + A`, lalu `D`  
✔️ **Reopen `screen` session:**  
```bash
screen -r overdive  
```
✔️ **Check all running `screen` sessions:**  
```bash
screen -ls  
```
✔️ **Terminate a `screen` session:**  
```bash
screen -X -S overdive quit  
```

---

💎 **Now you’re ready to automate everything & claim daily rewards like a pro! 🚀**  
⭐ **Star this repo if you find it useful!** ⭐
