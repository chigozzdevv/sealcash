import dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env: ${key}`);
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

export const env = {
  PORT: optional('PORT', '3000'),
  NODE_ENV: optional('NODE_ENV', 'development'),
  CLIENT_URL: optional('CLIENT_URL', 'http://localhost:5173'),
  
  // Database
  MONGODB_URI: required('MONGODB_URI'),
  
  // Auth
  AUTH_SECRET: required('AUTH_SECRET'),
  
  // Charms attestation signer
  ATTESTATION_KEY: required('ATTESTATION_KEY'),
  
  // Blockchain RPCs
  ETHEREUM_RPC_URL: required('ETHEREUM_RPC_URL'),
  POLYGON_RPC_URL: required('POLYGON_RPC_URL'),
  BNB_RPC_URL: required('BNB_RPC_URL'),
  SOLANA_RPC_URL: required('SOLANA_RPC_URL'),
  SUI_RPC_URL: required('SUI_RPC_URL'),
  
  // Bitcoin RPC (for transaction broadcasting)
  BITCOIN_RPC_URL: optional('BITCOIN_RPC_URL', 'http://localhost:18332'),
  BITCOIN_RPC_USER: optional('BITCOIN_RPC_USER', ''),
  BITCOIN_RPC_PASSWORD: optional('BITCOIN_RPC_PASSWORD', ''),
  BITCOIN_NETWORK: optional('BITCOIN_NETWORK', 'testnet4'),
  
  // Charms
  CHARMS_PROVER_API: optional('CHARMS_PROVER_API', 'https://v8.charms.dev/spells/prove'),
  CHARMS_APP_VK: required('CHARMS_APP_VK'),
};
