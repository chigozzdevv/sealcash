# SealCash

Trustless cross-chain escrow using [Charms](https://charms.dev) on Bitcoin.

Trade tokens/NFTs on any chain for BTC without trusting a third party. The escrow logic lives on Bitcoin as a Charms spell—BTC (to use zkBTC via Grail Pro later) is locked until the seller proves they sent the agreed asset.

## How It Works

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                               ESCROW FLOW                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. CREATE          2. ACCEPT          3. LOCK           4. COMPLETE        │
│  ────────           ────────           ────────          ────────           │
│                                                                              │
│  Buyer creates      Seller reviews     Buyer locks       Seller sends       │
│  escrow with        and accepts        BTC via           tokens, submits    │
│  terms              the deal           Charms spell      tx hash as proof   │
│                                                                              │
│       │                  │                  │                  │            │
│       ▼                  ▼                  ▼                  ▼            │
│  ┌─────────┐       ┌─────────┐       ┌─────────┐       ┌─────────┐         │
│  │ pending │ ────► │ accepted│ ────► │ locked  │ ────► │completed│         │
│  └─────────┘       └─────────┘       └─────────┘       └─────────┘         │
│                                           │                                 │
│                                           │ timeout                         │
│                                           ▼                                 │
│                                     ┌──────────┐                            │
│                                     │ refunded │                            │
│                                     └──────────┘                            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

1. **Buyer** creates an escrow specifying: seller's BTC address, BTC amount, and the token/NFT they want
2. **Seller** receives invite link, connects wallet, and accepts
3. **Buyer** locks BTC by creating a Charms spell (on-chain Bitcoin transaction)
4. **Seller** sends the tokens on the target chain, then submits the tx hash
5. **Server** verifies the transfer on-chain and releases BTC to seller
6. If seller doesn't deliver before timeout, buyer can reclaim their BTC

## Charms Integration

[Charms](https://charms.dev) is a protocol for programmable UTXOs on Bitcoin. SealCash uses it to:

- Lock BTC in a spell with escrow conditions
- Release BTC only when asset transfer is verified
- Enable trustless refunds after timeout

### Escrow Charm Structure

```rust
pub struct Escrow {
    pub state: EscrowState,      // Locked | Released | Refunded
    pub amount: u64,             // BTC amount in sats
    pub buyer: String,           // Buyer's BTC address
    pub seller: String,          // Seller's BTC address
    pub timeout: u64,            // Block height for refund eligibility
    pub asset_request: AssetRequest,
}

pub struct AssetRequest {
    pub chain: String,           // ethereum, polygon, bnb, solana, sui
    pub contract: String,        // Token/NFT contract address
    pub amount: String,          // Token amount or NFT token ID
    pub receiver: String,        // Buyer's address on target chain
}
```

### Spell Operations

The Charms service creates three types of spells:

**Lock Spell** - Buyer locks BTC
```yaml
version: 8
apps:
  $00: e/{app_id}/{app_vk}
ins: []
outs:
  - address: {output_address}
    charms:
      $00: { state: Locked, amount: 100000, buyer: "...", seller: "...", ... }
    sats: 1000
```

**Release Spell** - Server releases BTC to seller after verification
```yaml
ins:
  - utxo_id: {locked_utxo}
    charms: { $00: { state: Locked, ... } }
outs:
  - address: {seller_address}
    charms: { $00: { state: Released, ... } }
private_inputs:
  $00: { Release: { attestation: { escrow_id, tx_hash, signer, signature } } }
```

**Refund Spell** - Buyer reclaims BTC after timeout
```yaml
ins:
  - utxo_id: {locked_utxo}
    charms: { $00: { state: Locked, ... } }
outs:
  - address: {buyer_address}
    charms: { $00: { state: Refunded, ... } }
private_inputs:
  $00: { Refund: { current_block: 12345 } }
```

### Building the Charms App

```bash
cd charms

# Build WASM binary
cargo build --release --target wasm32-wasip1

# Get verification key (needed for .env)
charms app vk $(charms app build)
```

The server loads the WASM binary from `charms/target/wasm32-wasip1/release/seal.wasm` and sends it to the Charms prover API when creating spells.

## Supported Chains

| Chain    | Native | Tokens    | NFTs           |
|----------|--------|-----------|----------------|
| Ethereum | ETH    | ERC20     | ERC721/ERC1155 |
| Polygon  | MATIC  | ERC20     | ERC721/ERC1155 |
| BNB      | BNB    | BEP20     | BEP721/BEP1155 |
| Solana   | SOL    | SPL Token | SPL NFT        |
| Sui      | SUI    | Move Coin | Move NFT       |

Verification happens via direct RPC calls to each chain.

## Project Structure

```
sealcash/
├── server/                 # Express.js backend
│   └── src/
│       ├── api/            # REST endpoints
│       ├── auth/           # Bitcoin message signing auth
│       ├── config/         # Environment & database
│       ├── models/         # MongoDB schemas
│       └── services/
│           ├── escrow.service.ts      # Core escrow logic
│           ├── charms.service.ts      # Charms spell creation
│           ├── blockchain.service.ts  # Multi-chain verification
│           └── bitcoin.service.ts     # BTC transaction broadcasting
├── client/                 # Svelte frontend
│   └── src/
│       ├── components/     # UI components
│       ├── lib/            # API client, wallet integration
│       └── stores/         # Svelte stores
└── charms/                 # Rust Charms app
    ├── src/lib.rs          # Escrow contract logic
    └── spells/             # Example spell templates
```

## Setup

### Prerequisites

- [Bun](https://bun.sh) runtime
- MongoDB
- [Rust](https://rustup.rs) with `wasm32-wasip1` target
- [Charms CLI](https://charms.dev) (for building the app)
- Bitcoin wallet (Xverse, Leather, etc.)

### 1. Build Charms App

```bash
cd charms
rustup target add wasm32-wasip1
cargo build --release --target wasm32-wasip1

# Get the verification key
charms app vk $(charms app build)
# Copy this value for CHARMS_APP_VK in .env
```

### 2. Configure Server

```bash
cd server
cp .env.example .env
```

Edit `.env`:

```env
# Required
MONGODB_URI=mongodb://localhost:27017/sealcash
AUTH_SECRET=your-secret-key-min-32-chars-long
ATTESTATION_KEY=your-attestation-signer-key
CHARMS_APP_VK=<output from charms app vk>

# Blockchain RPCs (get free keys from Alchemy, Infura, etc.)
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
BNB_RPC_URL=https://bsc-dataseed.binance.org/
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SUI_RPC_URL=https://fullnode.mainnet.sui.io:443

# Bitcoin (testnet4 by default)
BITCOIN_NETWORK=testnet4
BITCOIN_RPC_URL=http://localhost:18332  # Optional: for direct broadcasting
```

### 3. Run

```bash
# Server
cd server
bun install
bun dev

# Client (separate terminal)
cd client
bun install
bun dev
```

Server runs on `http://localhost:3000`, client on `http://localhost:5173`.

## API Reference

### Authentication

Uses Bitcoin message signing. No passwords.

```bash
# 1. Get challenge
GET /api/auth/challenge?btcAddress=tb1q...

# 2. Sign challenge with wallet, then verify
POST /api/auth/verify
{ "btcAddress": "tb1q...", "signature": "..." }
# Returns: { "token": "...", "user": {...} }

# 3. Use token in subsequent requests
Authorization: Bearer <token>
```

### Escrow Endpoints

```bash
# Create escrow (buyer)
POST /api/escrow/create
{
  "sellerBtcAddress": "tb1q...",
  "btcAmount": "0.001",
  "assetType": "token",
  "chain": "ethereum",
  "contractAddress": "0x...",
  "amount": "1000",
  "senderAddress": "0x...",      # Seller's address on chain
  "receiverAddress": "0x...",    # Buyer's address on chain
  "timeout": "2024-12-25T00:00:00Z"
}

# Accept escrow (seller)
POST /api/escrow/:id/accept

# Reject escrow (seller)
POST /api/escrow/:id/reject

# Lock BTC (buyer) - creates Charms spell
POST /api/escrow/:id/lock
{
  "fundingUtxo": "txid:vout",
  "fundingValue": 50000,
  "prevTxHex": "...",
  "outputAddress": "tb1q...",
  "changeAddress": "tb1q...",
  "broadcast": false
}

# Submit proof (seller) - after sending tokens
POST /api/escrow/:id/submit-proof
{ "txHash": "0x..." }

# Release BTC (seller) - after verification
POST /api/escrow/:id/release
{ ... }

# Refund (buyer) - after timeout
POST /api/escrow/:id/refund
{ "currentBlock": 12345, ... }

# Get escrow details
GET /api/escrow/:id

# List user's escrows
GET /api/escrow?role=buyer&status=locked

# Get pending invites
GET /api/escrow/pending-invites

# Public invite info (no auth)
GET /api/escrow/invite/:id
```

### User Endpoints

```bash
# Get profile
GET /api/users/profile

# Update chain addresses
PUT /api/users/addresses
{ "addresses": { "ethereum": "0x...", "solana": "..." } }
```

## Client Features

- **Wallet Connection**: Xverse, Leather, and other Bitcoin wallets via sats-connect
- **Invite Links**: Share `/invite/:id` URLs with sellers
- **Escrow Management**: Create, accept, lock, submit proof
- **History View**: Filter by role (buyer/seller) and status
- **Inbox**: Pending invites notification

## Security

- **No custody**: BTC is locked in a Charms spell, not held by the server
- **On-chain verification**: Token transfers verified via RPC, not trusted
- **Timeout protection**: Buyers can always reclaim BTC after expiry
- **Attestation signing**: Server signs release attestations with `ATTESTATION_KEY`
- **Bitcoin auth**: No passwords—wallet signatures only

## Development

```bash
# Run server in watch mode
cd server && bun dev

# Run client in dev mode
cd client && bun dev

# Run Charms tests
cd charms && cargo test
```
