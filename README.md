# 🎉 **Auto Daily Airdrop Bot** 🎉

**Automate your daily check-ins, tasks, and claims for multiple platforms with ease!**  
This script will help you get daily rewards from multiple platforms including **Infinity Ground, Lasso, Klok AI**, and **Zaros** with minimal effort!

---

## 🧩 Features
- ✅ **Auto Check-in & Task Completion** for Infinity Ground
- 🎮 **Auto Play Lasso & Claim MON**
- 🤖 **Automate Tasks with Klok AI**
- 💰 **Zaros Daily Check-in** with Wallet Integration

---

## 🚀 Installation

### 1️⃣ Prerequisites
- Make sure you have **Node.js** installed. If not, you can download it [here](https://nodejs.org/).

### 2️⃣ Clone the Repository

```bash
git clone https://github.com/okeeajah/auto-daily-airdrop.git
cd auto-daily-airdrop
```

### 3️⃣ Install Dependencies

```bash
npm install fs axios ethers path node-cron
```

---

## 🏃‍♂️ How to Use

### 🔹 **Infinity Ground Auto Check-in**
1. Set your **Bearer Token**:

   ```bash
   nano token.txt
   ```

2. Run the script:

   ```bash
   node infinity.js
   ```

### 🔹 **Auto Play Lasso & Claim MON**
1. Add your **Wallet Private Key**:

   ```bash
   nano pk.txt
   ```

2. Run the script:

   ```bash
   node dusted.js
   ```

### 🔹 **Klok AI Automation**
1. Extract the **Session Token** from the browser (press `F12`, go to **Application > LocalStorage**, and copy the session token).

2. Save it in `token.txt`:

   ```bash
   nano token.txt
   ```

3. Run the script:

   ```bash
   node klok.js
   ```

### 🔹 **Zaros Daily Check-in**
1. Open your browser DevTools (`F12`), navigate to **LocalStorage**, and extract:
   - **sessionID**
   - **accountID**
   - **walletAddress**

2. Create the **config.json** file:

   ```bash
   nano config.json
   ```

3. Add the following format to the file:

   ```json
   {
     "baseUrl": "https://production.api.zaros.fi",
     "accountId": "8xxx",
     "walletAddress": "YOUR_WALLET_ADDRESS",
     "sessionToken": "YOUR_SESSION_TOKEN"
   }
   ```

4. Run the script:

   ```bash
   node zaros.js
   ```

---

## 💡 Contributing
Feel free to fork this repo and create a **pull request** with your improvements!

---

## 📜 License
This project is licensed under the **MIT License**.

---

**Happy automating!** 🚀
