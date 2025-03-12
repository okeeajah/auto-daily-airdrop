require("dotenv").config();
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { Wallet, ethers } = require("ethers");

const ACCOUNTS_FILE = path.join(__dirname, "accounts.txt");

const args = process.argv.slice(2);
const REFERRAL_CODE = args[0];
const ACCOUNT_COUNT = parseInt(args[1], 10) || 1;

if (!REFERRAL_CODE) {
  console.error("❌ Harap masukkan kode referral!");
  process.exit(1);
}

console.log(`🔗 Menggunakan Referral Code: ${REFERRAL_CODE}`);
console.log(`👥 Jumlah Akun yang Dibuat: ${ACCOUNT_COUNT}`);

function generateWallet() {
  const wallet = Wallet.createRandom();
  const address = wallet.address;
  const privateKey = wallet.privateKey;

  fs.appendFileSync(ACCOUNTS_FILE, `${address} | ${privateKey}\n`);
  console.log(`✅ Wallet Baru: ${address}`);
  return wallet;
}

function createSiweMessage(address) {
  const nonce = ethers.hexlify(ethers.randomBytes(32)).slice(2);
  const timestamp = new Date().toISOString();
  return `klokapp.ai wants you to sign in with your Ethereum account:\n${address}\n\n\n` +
         `URI: https://klokapp.ai/\n` +
         `Version: 1\n` +
         `Chain ID: 1\n` +
         `Nonce: ${nonce}\n` +
         `Issued At: ${timestamp}`;
}

async function signMessageAndRegister(wallet) {
  const address = wallet.address;
  const message = createSiweMessage(address);
  console.log(`📝 Signing Message for ${address}`);
  const signedMessage = await wallet.signMessage(message);
  const payload = { signedMessage, message, referral_code: REFERRAL_CODE };

  try {
    const response = await axios.post("https://api1-pp.klokapp.ai/v1/verify", payload, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
        "Origin": "https://klokapp.ai",
        "Referer": "https://klokapp.ai/",
      }
    });
    console.log(`✅ Akun ${address} berhasil didaftarkan!`);
  } catch (error) {
    console.error(`❌ Gagal mendaftar ${address}:`, error.response ? error.response.data : error.message);
  }
}

async function main() {
  for (let i = 0; i < ACCOUNT_COUNT; i++) {
    const wallet = generateWallet();
    await signMessageAndRegister(wallet);
  }
}

main();
