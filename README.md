# 🎉🚀 Auto Daily Airdrop Bot 🔥💰  

Automate your daily check-ins, tasks, and claims for multiple platforms with ease!  
This script will help you get **daily rewards** from multiple platforms including **Infinity Ground, Lasso, Klok AI**, and **Zaros** with minimal effort! 🎯🎯  

---

## ✨🚀 Features  

✅ **🔄 Auto Check-in & Task Completion** for **Infinity Ground**  
✅ **🎮 Auto Play Lasso & Claim MON**  
✅ **🤖 Automate Tasks** with **Klok AI**  
✅ **💼 Zaros Daily Check-in with Wallet Integration**  
✅ **🛠️ Run scripts in the background using `screen` on VPS**  

---

## 🛠️ Installation  

### **1️⃣ Prerequisites**  
⚡ Make sure you have **Node.js** installed. If not, you can download it **[here](https://nodejs.org/)**.  

💾 Install `screen` on your VPS (if not installed):  

```bash
sudo apt install screen -y  # Ubuntu/Debian 🐧
sudo yum install screen -y  # CentOS/RHEL 🔥
```

---

### **2️⃣ Clone the Repository**  

```bash
git clone https://github.com/okeeajah/auto-daily-airdrop.git  
cd auto-daily-airdrop  
```

---

### **3️⃣ Install Dependencies**  

```bash
npm install fs axios ethers path node-cron  
```

---

## 🚀 How to Use (with `screen`)  

### **🔹 Infinity Ground Auto Check-in ⏳**  
1️⃣ **Navigate to the Infinity Ground folder**:  

   ```bash
   cd infinity  
   ```

2️⃣ **Start a new `screen` session**:  

   ```bash
   screen -S infinity  
   ```

3️⃣ **Set your Bearer Token**:  

   ```bash
   nano token.txt  
   ```

4️⃣ **Run the script**:  

   ```bash
   node infinity.js  
   ```

---

### **🔹 Auto Play Lasso & Claim MON 🎮**  
1️⃣ **Navigate to the Lasso folder**:  

   ```bash
   cd dusted  
   ```

2️⃣ **Start a new `screen` session**:  

   ```bash
   screen -S lasso  
   ```

3️⃣ **Set up your Wallet Private Key**:  

   ```bash
   nano pk.txt  
   ```

4️⃣ **Run the script**:  

   ```bash
   node dusted.js  
   ```

---

### **🔹 Automate Tasks with Klok AI 🤖**  
1️⃣ **Navigate to the Klok AI folder**:  

   ```bash
   cd klok  
   ```

2️⃣ **Start a new `screen` session**:  

   ```bash
   screen -S klok  
   ```

3️⃣ **Set up your Session Token**:  

   ```bash
   nano token.txt  
   ```

4️⃣ **Run the script**:  

   ```bash
   node klok.js  
   ```

---

### **🔹 Zaros Daily Check-in 💼**  
1️⃣ **Navigate to the Zaros folder**:  

   ```bash
   cd zaros  
   ```

2️⃣ **Start a new `screen` session**:  

   ```bash
   screen -S zaros  
   ```

3️⃣ **Set up your session token, account ID, and wallet address**:  

   ```bash
   nano config.json  
   ```

4️⃣ **Use the following format for `config.json`**:  

   ```json
   {
     "baseUrl": "https://production.api.zaros.fi",
     "accountId": "8xxx",
     "walletAddress": "WALLETADDREESS",
     "sessionToken": "your-session-token-here"
   }
   ```

5️⃣ **Install dependencies**:  

   ```bash
   npm install axios fs path  
   ```

6️⃣ **Run the script**:  

   ```bash
   node zaros.js  
   ```

---

## ✅ Tips & Tricks 💡  
🟢 **Exit screen session**:  
   - Tekan **Ctrl + A**, lalu **D** (detach session).  

🟢 **Reopen screen session**:  
   ```bash
   screen -r infinity  # Ganti "infinity" dengan nama session yang sesuai  
   ```

🟢 **Check all running screen sessions**:  
   ```bash
   screen -ls  
   ```

🟢 **Terminate a screen session**:  
   ```bash
   screen -X -S infinity quit  # Ganti "infinity" dengan nama session yang ingin dihentikan  
   ```

---

🔥 **Now you're ready to automate your daily airdrops like a pro!** 🚀  
💰 **Earn rewards effortlessly & maximize your profits!** 💎💸  

📌 **Star this repo if you find it useful!** ⭐
