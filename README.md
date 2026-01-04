# SealCash

Trustless cross-chain escrow using [Charms](https://charms.dev) on Bitcoin.

Trade tokens/NFTs on any chain for BTC without trusting a third party. The escrow logic lives on Bitcoin as a Charms spell—BTC is locked until the seller proves they sent the agreed asset.

## Table of Contents

- [How It Works](#how-it-works)
- [Architecture Overview](#architecture-overview)
- [Charms Integration](#charms-integration)
- [Supported Chains](#supported-chains)
- [Project Structure](#project-structure)
- [Setup](#setup)
- [API Reference](#api-reference)
- [Client Features](#client-features)
- [Security Model](#security-model)
- [Development](#development)

## How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ESCROW FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. CREATE          2. ACCEPT          3. LOCK           4. COMPLETE       │
│  ────────          ────────          ────────          ────────            │
│                                                                             │
│  Buyer creates     Seller reviews    Buyer locks       Seller sends        │
│  escrow with       and accepts       BTC via           tokens, submits     │
│  terms             the deal          Charms spell      tx hash as proof    │
│                                                                             │
│       │                 │                 │                 │              │
│       ▼                 ▼                 ▼                 ▼              │
│  ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐           │
│  │ pending │ ───► │ accepted│ ───► │ locked  │ ───► │completed│           │
│  └─────────┘      └─────────┘      └─────────┘      └─────────┘           │
│                                           │                                │
│                                           │ timeout                        │
│                                           ▼                                │
│                                    ┌─────────┐                             │
│                                    │refunded │                             │
│                                    └─────────┘                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step-by-Step Flow

1. **Buyer creates escrow** - Specifies seller's BTC address, BTC amount, and the token/NFT they want to receive
2. **Seller receives invite** - Gets a shareable link (`/invite/:id`), connects wallet, reviews terms
3. **Seller accepts** - Escrow moves to `accepted` state
4. **Buyer locks BTC** - Creates a Charms spell that locks BTC on-chain with escrow conditions
5. **Seller sends tokens** - Transfers the agreed asset on the target chain (Ethereum, Solana, etc.)
6. **Seller submits proof** - Provides the transaction hash for on-chain verification
7. **Server verifies & releases** - Validates the transfer via RPC, generates attestation, releases BTC to seller
8. **Timeout protection** - If seller doesn't deliver, buyer can reclaim BTC after expiry

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Svelte Client │────▶│  Express Server │────▶│    MongoDB      │
│   (sats-connect)│     │   (Bun runtime) │     │                 │
└────────┬────────┘     └────────┬────────┘     └─────────────────┘
         │                       │
         │                       ├──────────────────────────────────┐
         │                       │                                  │
         ▼                       ▼                                  ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────────────┐
│ Bitcoin Wallet  │     │  Charms Prover  │     │   Blockchain RPCs       │
│ (Xverse/Leather)│     │  API (v8)       │     │ (ETH/Polygon/BNB/SOL/SUI)│
└─────────────────┘     └─────────────────┘     └─────────────────────────┘
```

### Core Services

| Service | Purpose |
|---------|---------|
| `EscrowService` | Manages escrow lifecycle (create, accept, lock, release, refund) |
| `CharmsService` | Builds and submits spells to Charms prover API |
| `BlockchainService` | Verifies token/NFT transfers across 5 chains |
| `BitcoinService` | Broadcasts transactions to Bitcoin network |
| `AuthService` | Bitcoin message signing authentication (no passwords) |

## Charms Integration

[Charms](https://charms.dev) is a protocol for programmable UTXOs on Bitcoin. SealCash uses Charms to enforce escrow conditions directly on-chain.

### Escrow Contract (Rust)

The escrow logic is compiled to WASM and executed by the Charms prover:

```rust
// charms/src/lib.rs

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EscrowState {
    Locked,    // BTC is locked, waiting for seller to deliver
    Released,  // Seller delivered, BTC released to seller
    Refunded,  // Timeout expired, BTC returned to buyer
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Escrow {
    pub state: EscrowState,
    pub amount: u64,              // BTC amount in satoshis
    pub buyer: String,            // Buyer's BTC address
    pub seller: String,           // Seller's BTC address
    pub timeout: u64,             // Unix timestamp for refund eligibility
    pub asset_request: AssetRequest,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetRequest {
    pub chain: String,            // ethereum, polygon, bnb, solana, sui
    pub contract: String,         // Token/NFT contract address
    pub amount: String,           // Token amount or NFT token ID
    pub receiver: String,         // Buyer's address on target chain
}

// Witness types for state transitions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EscrowWitness {
    Create,
    Release { attestation: Attestation },
    Refund { current_block: u64 },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Attestation {
    pub escrow_id: String,
    pub tx_hash: String,          // Cross-chain transfer tx hash
    pub signer: String,           // Server's attestation key
    pub signature: String,        // HMAC-SHA256 signature
}
```

### Spell Creation

The `CharmsService` constructs spells and submits them to the Charms prover API:

```typescript
// server/src/services/charms.service.ts

// Lock Spell - Buyer locks BTC
async createLockSpell(escrowId, escrow, fundingUtxo, ...) {
  const body = {
    chain: 'bitcoin',
    spell: {
      version: 8,
      apps: { '$00': this.getAppString(escrowId) },
      ins: [],
      outs: [{
        address: outputAddress,
        charms: { '$00': escrow },  // Escrow state embedded in UTXO
        sats: 1000
      }],
    },
    binaries: { [this.appVk]: this.appBinary },  // WASM binary
    funding_utxo: fundingUtxo,
    fee_rate: 2
  };
  
  const res = await axios.post(this.proverApi, body);
  return { commitTx: res.data[0], spellTx: res.data[1] };
}

// Release Spell - Server releases BTC after verification
async createReleaseSpell(escrowId, inputUtxo, escrow, attestation, ...) {
  // Includes attestation as private input
  private_inputs: {
    '$00': { Release: { attestation } }
  }
}

// Refund Spell - Buyer reclaims after timeout
async createRefundSpell(escrowId, inputUtxo, escrow, currentBlock, ...) {
  private_inputs: {
    '$00': { Refund: { current_block: currentBlock } }
  }
}
```

### Attestation Flow

When the seller submits proof of token transfer:

1. Server calls `BlockchainService.verifyTokenTransfer()` to validate on-chain
2. If valid, server generates an attestation signed with `ATTESTATION_KEY`
3. Attestation is included as private input in the release spell
4. Charms prover verifies the attestation and allows state transition

```typescript
generateAttestation(escrowId: string, txHash: string, signerKey: string): Attestation {
  const msg = `${escrowId}:${txHash}`;
  return {
    escrow_id: escrowId,
    tx_hash: txHash,
    signer: signerKey,
    signature: crypto.createHmac('sha256', signerKey).update(msg).digest('hex')
  };
}
```

### Building the Charms App

```bash
cd charms

# Add WASM target
rustup target add wasm32-wasip1

# Build release binary
cargo build --release --target wasm32-wasip1

# Get verification key (required for .env)
charms app vk $(charms app build)
# Output: ef713cb169105cca61dafddd982ffb8e61d41f33eeb767ab5e2e724f0031bb0b
```

The server automatically loads the WASM binary from:
```
charms/target/wasm32-wasip1/release/seal.wasm
```

## Supported Chains

| Chain    | Native | Tokens    | NFTs           | Verification Method |
|----------|--------|-----------|----------------|---------------------|
| Ethereum | ETH    | ERC20     | ERC721/ERC1155 | Web3.js + Transfer event logs |
| Polygon  | MATIC  | ERC20     | ERC721/ERC1155 | Web3.js + Transfer event logs |
| BNB      | BNB    | BEP20     | BEP721/BEP1155 | Web3.js + Transfer event logs |
| Solana   | SOL    | SPL Token | SPL NFT        | @solana/web3.js + token balances |
| Sui      | SUI    | Move Coin | Move NFT       | @mysten/sui + balance changes |

### Verification Logic

For EVM chains (Ethereum, Polygon, BNB):
```typescript
// Parse Transfer event: 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
const log = receipt.logs.find(l =>
  l.address === contractAddress &&
  l.topics[0] === TRANSFER_EVENT_SIGNATURE
);
const from = '0x' + log.topics[1].slice(26);
const to = '0x' + log.topics[2].slice(26);
const amount = web3.utils.hexToNumberString(log.data);
```

For Solana:
```typescript
// Compare pre/post token balances
const pre = tx.meta.preTokenBalances;
const post = tx.meta.postTokenBalances;
const receiverPost = post.find(b => b.owner === expectedTo && b.mint === mintAddress);
```

## Project Structure

```
sealcash/
├── server/                      # Express.js backend (Bun runtime)
│   ├── src/
│   │   ├── app.ts               # Entry point, route mounting
│   │   ├── api/
│   │   │   ├── auth.routes.ts   # Challenge/verify endpoints
│   │   │   ├── escrow.routes.ts # Escrow CRUD + actions
│   │   │   └── user.routes.ts   # Profile management
│   │   ├── auth/
│   │   │   └── auth.service.ts  # Bitcoin message signing, JWT-like tokens
│   │   ├── config/
│   │   │   ├── database.ts      # MongoDB connection
│   │   │   └── env.ts           # Environment validation
│   │   ├── models/
│   │   │   └── models.ts        # User & Escrow Mongoose schemas
│   │   └── services/
│   │       ├── escrow.service.ts     # Core business logic
│   │       ├── charms.service.ts     # Spell construction & prover API
│   │       ├── blockchain.service.ts # Multi-chain verification
│   │       ├── bitcoin.service.ts    # TX broadcasting
│   │       └── user.service.ts       # User management
│   ├── .env.example
│   └── package.json
│
├── client/                      # Svelte + Vite frontend
│   ├── src/
│   │   ├── App.svelte           # Main app, routing
│   │   ├── components/
│   │   │   ├── EscrowForm.svelte    # Create escrow form
│   │   │   ├── EscrowList.svelte    # History with actions
│   │   │   ├── InvitePage.svelte    # Seller invite acceptance
│   │   │   ├── InboxDropdown.svelte # Pending invites
│   │   │   ├── Hero.svelte          # Landing page
│   │   │   ├── WalletButton.svelte  # Connect/disconnect
│   │   │   └── NetworkToggle.svelte # Testnet indicator
│   │   ├── lib/
│   │   │   ├── api.ts           # Typed API client
│   │   │   └── wallet.ts        # sats-connect integration
│   │   └── stores/
│   │       ├── wallet.ts        # Wallet state
│   │       └── escrow.ts        # Escrow list state
│   └── package.json
│
└── charms/                      # Rust Charms app
    ├── src/
    │   ├── lib.rs               # Escrow contract logic
    │   └── main.rs              # Entry point
    ├── spells/                  # Example spell templates
    │   ├── mint-token.yaml
    │   ├── mint-nft.yaml
    │   └── send.yaml
    └── Cargo.toml
```

## Setup

### Prerequisites

- [Bun](https://bun.sh) v1.0+ (runtime for server and client)
- [MongoDB](https://www.mongodb.com/) v6+
- [Rust](https://rustup.rs) with `wasm32-wasip1` target
- [Charms CLI](https://charms.dev) (for building the app)
- Bitcoin wallet browser extension (Xverse, Leather, etc.)

### 1. Build Charms App

```bash
cd charms

# Install WASM target
rustup target add wasm32-wasip1

# Build optimized release
cargo build --release --target wasm32-wasip1

# Get verification key
charms app vk $(charms app build)
# Save this output for CHARMS_APP_VK
```

### 2. Configure Server

```bash
cd server
cp .env.example .env
```

Edit `.env` with your values:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/sealcash

# Auth (generate a random 32+ char string)
AUTH_SECRET=your-secret-key-min-32-chars-long

# Attestation signing key (generate a random string)
ATTESTATION_KEY=your-attestation-signer-key

# Charms
CHARMS_PROVER_API=https://v8.charms.dev/spells/prove
CHARMS_APP_VK=<output from charms app vk>

# Blockchain RPCs (get free API keys from Alchemy, Infura, etc.)
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
BNB_RPC_URL=https://bsc-dataseed.binance.org/
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SUI_RPC_URL=https://fullnode.mainnet.sui.io:443

# Bitcoin (testnet4 by default)
BITCOIN_NETWORK=testnet4
BITCOIN_RPC_URL=http://localhost:18332
BITCOIN_RPC_USER=your-rpc-user
BITCOIN_RPC_PASSWORD=your-rpc-password
```

### 3. Install Dependencies & Run

```bash
# Terminal 1: Server
cd server
bun install
bun dev  # Runs on http://localhost:3000

# Terminal 2: Client
cd client
bun install
bun dev  # Runs on http://localhost:5173
```

### 4. Connect Wallet

1. Install a Bitcoin wallet extension (Xverse or Leather recommended)
2. Switch to Testnet4 network
3. Get testnet BTC from a faucet
4. Click "Connect Wallet" in the app

## API Reference

### Authentication

Bitcoin message signing authentication—no passwords required.

```bash
# 1. Request challenge
GET /api/auth/challenge?btcAddress=tb1q...
# Response: { "challenge": "sealcash:1704067200000:abc123..." }

# 2. Sign challenge with wallet, then verify
POST /api/auth/verify
Content-Type: application/json
{
  "btcAddress": "tb1q...",
  "signature": "<wallet signature>"
}
# Response: { "token": "...", "user": {...}, "isNewUser": true, "activatedInvites": 0 }

# 3. Use token for authenticated requests
Authorization: Bearer <token>
```

### Escrow Endpoints

```bash
# Create escrow (buyer)
POST /api/escrow/create
Authorization: Bearer <token>
{
  "sellerBtcAddress": "tb1q...",
  "btcAmount": "0.001",
  "assetType": "token",           # "token" or "nft"
  "chain": "ethereum",            # ethereum, polygon, bnb, solana, sui
  "contractAddress": "0x...",     # Token/NFT contract
  "amount": "1000",               # For tokens
  "tokenId": "123",               # For NFTs
  "senderAddress": "0x...",       # Seller's address on target chain
  "receiverAddress": "0x...",     # Buyer's address on target chain
  "timeout": "2024-12-25T00:00:00Z"
}
# Response: { "_id": "...", "status": "pending", ... }

# Accept escrow (seller)
POST /api/escrow/:id/accept
Authorization: Bearer <token>

# Reject escrow (seller)
POST /api/escrow/:id/reject
Authorization: Bearer <token>

# Lock BTC (buyer) - creates Charms spell
POST /api/escrow/:id/lock
Authorization: Bearer <token>
{
  "fundingUtxo": "txid:vout",     # UTXO to spend
  "fundingValue": 50000,          # UTXO value in sats
  "prevTxHex": "...",             # Raw previous transaction
  "outputAddress": "tb1q...",     # Where to create the charm
  "changeAddress": "tb1q...",     # Change address
  "broadcast": false              # If true, server broadcasts
}
# Response: { "escrow": {...}, "commitTx": "...", "spellTx": "..." }

# Submit proof (seller) - after sending tokens
POST /api/escrow/:id/submit-proof
Authorization: Bearer <token>
{ "txHash": "0x..." }
# Response: { "escrow": {...}, "verified": true }

# Release BTC (seller) - after verification
POST /api/escrow/:id/release
Authorization: Bearer <token>
{
  "fundingUtxo": "txid:vout",
  "fundingValue": 50000,
  "prevTxHex": "...",
  "changeAddress": "tb1q...",
  "broadcast": false
}

# Refund (buyer) - after timeout
POST /api/escrow/:id/refund
Authorization: Bearer <token>
{
  "currentBlock": 12345,
  "fundingUtxo": "txid:vout",
  "fundingValue": 50000,
  "prevTxHex": "...",
  "changeAddress": "tb1q...",
  "broadcast": false
}

# Get escrow details (authenticated)
GET /api/escrow/:id
Authorization: Bearer <token>

# List user's escrows
GET /api/escrow?role=buyer&status=locked
Authorization: Bearer <token>

# Get pending invites
GET /api/escrow/pending-invites
Authorization: Bearer <token>

# Public invite info (no auth required)
GET /api/escrow/invite/:id
```

### User Endpoints

```bash
# Get profile
GET /api/users/profile
Authorization: Bearer <token>

# Update chain addresses
PUT /api/users/addresses
Authorization: Bearer <token>
{
  "addresses": {
    "ethereum": "0x...",
    "solana": "...",
    "sui": "0x..."
  }
}
```

## Client Features

### Wallet Integration

Uses [sats-connect](https://docs.xverse.app/sats-connect) for Bitcoin wallet interaction:

- **Connect**: Request payment address via `getAddress()`
- **Sign**: Sign authentication challenges via `signMessage()`
- **Send**: Broadcast transactions via `sendTransfer()` or direct mempool API

```typescript
// client/src/lib/wallet.ts
import { getAddress, signMessage, request } from 'sats-connect';

// Connect and authenticate
const response = await getAddress({
  payload: {
    purposes: [AddressPurpose.Payment],
    network: { type: BitcoinNetworkType.Testnet4 },
  },
  onFinish: resolve,
});
```

### UI Components

| Component | Purpose |
|-----------|---------|
| `EscrowForm` | Create new escrow with all parameters |
| `EscrowList` | View history, filter by role/status, take actions |
| `InvitePage` | Seller landing page for invite links |
| `InboxDropdown` | Notification badge for pending invites |
| `WalletButton` | Connect/disconnect wallet |
| `NetworkToggle` | Display current network (testnet indicator) |

### Invite Flow

1. Buyer creates escrow → gets invite link `/invite/:id`
2. Buyer shares link with seller
3. Seller opens link → sees escrow details
4. Seller connects wallet → auto-registers if new user
5. Seller accepts → escrow moves to `accepted` state

## Security Model

### Trust Assumptions

| Component | Trust Level | Notes |
|-----------|-------------|-------|
| Bitcoin | Trustless | BTC locked in Charms spell on-chain |
| Charms Prover | Trusted | Generates ZK proofs for spell execution |
| Server | Semi-trusted | Verifies transfers, signs attestations |
| Blockchain RPCs | Trusted | Used for cross-chain verification |

### Security Features

1. **No custody** - BTC is locked in a Charms spell, not held by the server
2. **On-chain verification** - Token transfers verified via direct RPC calls
3. **Timeout protection** - Buyers can always reclaim BTC after expiry
4. **Attestation signing** - Server signs release attestations with `ATTESTATION_KEY`
5. **Bitcoin auth** - No passwords—wallet signatures only
6. **Challenge expiry** - Auth challenges expire after 5 minutes
7. **Token expiry** - Auth tokens expire after 24 hours

### Potential Attack Vectors

| Attack | Mitigation |
|--------|------------|
| Server refuses to release | Buyer can refund after timeout |
| Fake transfer proof | Server verifies on-chain via RPC |
| Replay attestation | Attestation includes unique escrow_id |
| Stolen auth token | 24h expiry, wallet-bound |

## Development

### Running Tests

```bash
# Charms contract tests
cd charms
cargo test

# Server (no tests yet)
cd server
# TODO: Add tests

# Client (no tests yet)
cd client
# TODO: Add tests
```

### Development Commands

```bash
# Server with hot reload
cd server && bun dev

# Client with hot reload
cd client && bun dev

# Build Charms app
cd charms && cargo build --release --target wasm32-wasip1

# Get Charms verification key
cd charms && charms app vk $(charms app build)
```

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Server port |
| `NODE_ENV` | No | `development` | Environment |
| `MONGODB_URI` | Yes | - | MongoDB connection string |
| `AUTH_SECRET` | Yes | - | Secret for token signing (32+ chars) |
| `ATTESTATION_KEY` | Yes | - | Key for signing release attestations |
| `CHARMS_PROVER_API` | No | `https://v8.charms.dev/spells/prove` | Charms prover endpoint |
| `CHARMS_APP_VK` | Yes | - | App verification key from `charms app vk` |
| `ETHEREUM_RPC_URL` | Yes | - | Ethereum RPC endpoint |
| `POLYGON_RPC_URL` | Yes | - | Polygon RPC endpoint |
| `BNB_RPC_URL` | Yes | - | BNB Chain RPC endpoint |
| `SOLANA_RPC_URL` | Yes | - | Solana RPC endpoint |
| `SUI_RPC_URL` | Yes | - | Sui RPC endpoint |
| `BITCOIN_NETWORK` | No | `testnet4` | Bitcoin network |
| `BITCOIN_RPC_URL` | No | `http://localhost:18332` | Bitcoin Core RPC |
| `BITCOIN_RPC_USER` | No | - | Bitcoin RPC username |
| `BITCOIN_RPC_PASSWORD` | No | - | Bitcoin RPC password |

## License

MIT
