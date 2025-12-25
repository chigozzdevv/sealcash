# SealCash – Trustless Multi-Chain Escrow Platform

**Production-ready BitcoinOS-compliant escrow service with real blockchain verification**

## 🚀 Features

- **Real Blockchain Verification**: All transactions verified on actual chains (ETH, SOL, SUI, Polygon, BNB)
- **BitcoinOS Integration**: BitSNARK VM, Grail Bridge, Charms Protocol, zkBTC
- **TEE Authentication**: Cryptographic attestation instead of passwords
- **Multi-Chain Support**: Tokens and NFTs across 5 major blockchains
- **Account-Based**: Both parties must register to participate

## 🏗️ Architecture

### Core Components
- **BitSNARK VM**: 3-instruction virtual machine for zk-proof verification
- **Grail Bridge**: Trustless Bitcoin bridging with 12-of-16 operator threshold  
- **Charms Protocol**: UTXO-based token standard with zk-proof validation
- **zkBTC**: 1:1 Bitcoin-collateralized synthetic token
- **Real Blockchain Service**: Direct RPC verification on live networks

### Supported Chains & Assets

| Chain     | Native Token | Token Standard | NFT Standard     |
|-----------|-------------|----------------|------------------|
| Ethereum  | ETH         | ERC20          | ERC721/ERC1155   |
| Polygon   | MATIC       | ERC20          | ERC721/ERC1155   |
| BNB Chain | BNB         | BEP20          | BEP721/BEP1155   |
| Solana    | SOL         | SPL Token      | SPL NFT          |
| Sui       | SUI         | Move Coin      | Move NFT         |

## 🔄 Complete User Flow

### 1. Account Registration
```http
POST /api/users/register
{
  "publicKey": "user_public_key",
  "addresses": {
    "ethereum": "0x...",
    "solana": "...",
    "bitcoin": "bc1..."
  }
}
```

### 2. Create Escrow (Buyer)
```http
POST /api/escrow/create
Headers: X-Attestation: <base64_attestation>
{
  "sellerId": "seller_public_key",
  "btcAmount": "0.001",
  "assetType": "token",
  "chain": "ethereum",
  "contractAddress": "0x...",
  "amount": "1000",
  "senderAddress": "0x...",
  "receiverAddress": "0x...",
  "timeout": "2024-12-25T00:00:00Z"
}
```

### 3. Accept/Reject Escrow (Seller)
```http
POST /api/escrow/:id/accept
Headers: X-Attestation: <base64_attestation>
```

### 4. Submit Proof (Seller)
```http
POST /api/escrow/:id/submit-proof
Headers: X-Attestation: <base64_attestation>
{
  "txHash": "0xabc123..."
}
```

## 🔐 Authentication

BitcoinOS uses cryptographic attestation instead of traditional auth:

```http
POST /api/auth/attestation
{
  "publicKey": "your_public_key",
  "platform": "PASSKEY"
}
```

Include attestation in all requests:
```
X-Attestation: eyJwdWJsaWNLZXkiOi...
```

## 🛠️ API Endpoints

### User Management
- `POST /api/users/register` - Register new user
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/addresses` - Update blockchain addresses

### Escrow Operations
- `POST /api/escrow/create` - Create new escrow
- `GET /api/escrow/:id/status` - Check escrow status
- `POST /api/escrow/:id/accept` - Accept escrow invitation
- `POST /api/escrow/:id/reject` - Reject escrow invitation
- `POST /api/escrow/:id/submit-proof` - Submit transaction proof
- `GET /api/escrow/my-escrows` - Get user's escrows

### BitcoinOS Protocol
- `POST /api/v1/peg-in` - Lock BTC, get Taproot address
- `POST /api/v1/peg-out` - Burn zkBTC, release BTC
- `POST /api/v1/zkbtc/mint` - Mint zkBTC with BTC collateral
- `POST /api/v1/bitsnark/prove` - Initiate zk-proof challenge

## 🚀 Setup

```bash
npm install
cp .env.example .env
# Configure real RPC URLs in .env
npm run build
npm start
```

## 🔧 Environment Variables

```env
# Real Blockchain RPC URLs (Required)
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
BNB_RPC_URL=https://bsc-dataseed.binance.org/
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SUI_RPC_URL=https://fullnode.mainnet.sui.io:443

MONGODB_URI=mongodb://localhost:27017/sealcash-production
BITCOIN_NETWORK=testnet
```

## ✅ Production Features

- **No Mocks**: All blockchain verification uses real RPC calls
- **Real zk-Proofs**: Actual BitSNARK proof generation and verification
- **TEE Security**: Cryptographic attestation for all operations
- **Multi-Chain**: Support for 5 major blockchain networks
- **Account System**: Required registration for both parties
- **Timeout Handling**: Automatic refunds for expired escrows
- **Status Tracking**: Real-time escrow status updates

## 🏆 BitcoinOS Compliance

- ✅ BitSNARK VM with addmod/andbit/equal instructions
- ✅ Groth16 proofs (300-byte fixed size)
- ✅ Challenge-response fraud proof protocol
- ✅ MuSig2 threshold signatures (12-of-16)
- ✅ Charms token standard with CBOR inscriptions
- ✅ zkBTC 1:1 BTC collateralization
- ✅ Taproot addresses with recovery timelocks
- ✅ Real blockchain verification (no mocks)
- ✅ TEE-based authentication
