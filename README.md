# 🎉 **Auto Daily Airdrop Bot** 🎉

**Automate your daily check-ins, tasks, and claims for multiple platforms with ease!**  
This script will help you get daily rewards from multiple platforms including **Infinity Ground, Lasso, Klok AI**, and **Zaros** with minimal effort!

---

## 🧩 Features
- ✅ **Auto Check-in & Task Completion** for Infinity Ground
- 🎮 **Auto Play Lasso & Claim MON**
- 🤖 **Automate Tasks with Klok AI**
- 💰 **Zaros Daily Check-in** with Wallet Integration
- 🔄 **Run scripts in the background using `screen` on VPS**

---

## 🚀 Installation

### 1️⃣ Prerequisites
- Make sure you have **Node.js** installed. If not, you can download it [here](https://nodejs.org/).
- Install **screen** on your VPS (if not installed):

  ```bash
  sudo apt install screen -y  # Ubuntu/Debian
  sudo yum install screen -y  # CentOS/RHEL
  ```

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

## 🏃‍♂️ How to Use (with `screen`)

### 🔹 **Infinity Ground Auto Check-in**
1. Set your **Bearer Token**:

   ```bash
   nano token.txt
   ```

2. Start a new screen session:

   ```bash
   screen -S infinity
   ```

3. Run the script:

   ```bash
   node infinity.js
   ```

4. Detach from screen (so it runs in the background):  
   Press `CTRL + A`, then `D`

5. To reattach the screen:

   ```bash
   screen -r infinity
   ```

---

### 🔹 **Auto Play Lasso & Claim MON**
1. Add your **Wallet Private Key**:

   ```bash
   nano pk.txt
   ```

2. Start a new screen session:

   ```bash
   screen -S lasso
   ```

3. Run the script:

   ```bash
   node dusted.js
   ```

4. Detach from screen: `CTRL + A`, then `D`

5. Reattach:

   ```bash
   screen -r lasso
   ```

---

### 🔹 **Klok AI Automation**
1. Extract the **Session Token** from the browser (press `F12`, go to **Application > LocalStorage**, and copy the session token).

2. Save it in `token.txt`:

   ```bash
   nano token.txt
   ```

3. Start a new screen session:

   ```bash
   screen -S klok
   ```

4. Run the script:

   ```bash
   node klok.js
   ```

5. Detach from screen: `CTRL + A`, then `D`

6. Reattach:

   ```bash
   screen -r klok
   ```

---

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

4. Start a new screen session:

   ```bash
   screen -S zaros
   ```

5. Run the script:

   ```bash
   node zaros.js
   ```

6. Detach from screen: `CTRL + A`, then `D`

7. Reattach:

   ```bash
   screen -r zaros
   ```

---

## 🔥 Managing `screen` Sessions
- **List all running screen sessions**:

  ```bash
  screen -ls
  ```

- **Kill a screen session** (replace `session_name` with the actual name):

  ```bash
  screen -X -S session_name quit
  ```

---

## 💡 Contributing
Feel free to fork this repo and create a **pull request** with your improvements!

---

## 📜 License
This project is licensed under the **MIT License**.

---

**Happy automating!** 🚀
