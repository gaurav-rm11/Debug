# 🛡️ Debug: Decentralized Bug Bounty Platform

**Debug** is a next-generation Bug Bounty platform that leverages the Ethereum blockchain for transparent, trustless escrow management and Gemini AI for automated report triage and verification.


## 🚀 Vision
Bridge the gap between security researchers and organizations using decentralized finance. No more delayed payouts or disputes—contracts handle the money, and AI assists the triage.

---

## 🏗️ Architecture

### 1. Frontend (React + Vite + Ethers.js v6)
A high-performance, futuristic UI built with:
- **Three.js / React Three Fiber**: For immersive 3D backgrounds.
- **Lucide React**: Predictive iconography.
- **Ethers.js v6**: Seamless Web3 wallet integration and contract interaction.
- **Tailwind CSS**: Modern, responsive styling.

### 2. Backend (Node.js + Supabase)
A robust data layer providing:
- **Supabase (Postgres)**: Real-time database for bounties, reports, and notifications.
- **Gemini AI Integration**: Automated plagiarism checks and severity evaluation for submitted reports.
- **RLS (Row Level Security)**: Secure, role-based access for Researchers and Organizations.

### 3. Smart Contracts (Solidity 0.8.19)
Secure escrow logic:
- **BountyEscrow.sol**: Handles organization deposits, researcher payouts, and bounty closures.
- **Optimized for Local Node**: Uses Solidity 0.8.19 to ensure compatibility with all EVM environments (avoids `PUSH0` incompatibility).

---

## 🛠️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- MetaMask Browser Extension
- [Supabase Account](https://supabase.com/)
- [Gemini API Key](https://aistudio.google.com/)

### 1. Smart Contracts
```bash
cd contracts
npm install
npx hardhat node  # Keep this terminal running
```
*In a separate terminal:*
```bash
npx hardhat compile
```

### 2. Backend
```bash
cd backend
npm install
# Configure your .env (see backend/.env.example)
node index.js
```

### 3. Frontend
```bash
cd frontend
npm install
# Configure your .env (see frontend/.env.example)
npm run dev
```

---

## 🔐 Database Migration
Execute the `supabase_schema.sql` file in your Supabase SQL Editor to initialize the tables (`users`, `bounties`, `reports`, `notifications`).

---

## 📜 Key Features
- **Smart Escrow**: Funds are locked on-chain at bounty creation.
- **AI Triage**: Reports are instantly scanned for quality and severity by Gemini.
- **Real-time Notifications**: Researchers get instant updates on triage and payouts.
- **Public & Private Programs**: Organizations can invite specific researchers to private audits.

---

## 📄 License
This project is licensed under the MIT License.
