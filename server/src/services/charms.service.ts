import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { env } from '@config/env';

export interface EscrowCharm {
  state: 'Locked' | 'Released' | 'Refunded';
  amount: number;
  buyer: string;
  seller: string;
  timeout: number;
  asset_request: {
    chain: string;
    contract: string;
    amount: string;
    receiver: string;
  };
}

export interface Attestation {
  escrow_id: string;
  tx_hash: string;
  signer: string;
  signature: string;
}

export class CharmsService {
  private appBinary: string;
  private proverApi = env.CHARMS_PROVER_API;
  private appVk = env.CHARMS_APP_VK;

  constructor() {
    const binaryPath = path.join(__dirname, '../../../charms/target/wasm32-wasip1/release/seal.wasm');
    if (!fs.existsSync(binaryPath)) {
      throw new Error('Charms binary not found. Run: cd charms && charms app build');
    }
    this.appBinary = fs.readFileSync(binaryPath).toString('base64');
  }

  getAppString(escrowId: string): string {
    const appId = crypto.createHash('sha256').update(`sealcash-${escrowId}`).digest('hex');
    return `e/${appId}/${this.appVk}`;
  }

  async createLockSpell(
    escrowId: string,
    escrow: EscrowCharm,
    fundingUtxo: string,
    fundingValue: number,
    prevTxHex: string,
    outputAddress: string,
    changeAddress: string
  ): Promise<{ commitTx: string; spellTx: string }> {
    const body = {
      spell: {
        version: 2,
        apps: { '$00': this.getAppString(escrowId) },
        ins: [],
        outs: [{ address: outputAddress, charms: { '$00': escrow }, sats: 1000 }],
        private_inputs: { '$00': { Create: null } }
      },
      binaries: { [this.appVk]: this.appBinary },
      prev_txs: [prevTxHex],
      funding_utxo: fundingUtxo,
      funding_utxo_value: fundingValue,
      change_address: changeAddress,
      fee_rate: 2
    };

    const res = await axios.post(this.proverApi, body, { timeout: 600000 });
    return { commitTx: res.data[0], spellTx: res.data[1] };
  }

  async createReleaseSpell(
    escrowId: string,
    inputUtxo: string,
    escrow: EscrowCharm,
    attestation: Attestation,
    prevTxHex: string,
    sellerAddress: string,
    fundingUtxo: string,
    fundingValue: number,
    changeAddress: string
  ): Promise<{ commitTx: string; spellTx: string }> {
    const body = {
      spell: {
        version: 2,
        apps: { '$00': this.getAppString(escrowId) },
        ins: [{ utxo_id: inputUtxo, charms: { '$00': escrow } }],
        outs: [{ address: sellerAddress, charms: { '$00': { ...escrow, state: 'Released' } }, sats: 1000 }],
        private_inputs: { '$00': { Release: { attestation } } }
      },
      binaries: { [this.appVk]: this.appBinary },
      prev_txs: [prevTxHex],
      funding_utxo: fundingUtxo,
      funding_utxo_value: fundingValue,
      change_address: changeAddress,
      fee_rate: 2
    };

    const res = await axios.post(this.proverApi, body, { timeout: 600000 });
    return { commitTx: res.data[0], spellTx: res.data[1] };
  }

  async createRefundSpell(
    escrowId: string,
    inputUtxo: string,
    escrow: EscrowCharm,
    currentBlock: number,
    prevTxHex: string,
    buyerAddress: string,
    fundingUtxo: string,
    fundingValue: number,
    changeAddress: string
  ): Promise<{ commitTx: string; spellTx: string }> {
    const body = {
      spell: {
        version: 2,
        apps: { '$00': this.getAppString(escrowId) },
        ins: [{ utxo_id: inputUtxo, charms: { '$00': escrow } }],
        outs: [{ address: buyerAddress, charms: { '$00': { ...escrow, state: 'Refunded' } }, sats: 1000 }],
        private_inputs: { '$00': { Refund: { current_block: currentBlock } } }
      },
      binaries: { [this.appVk]: this.appBinary },
      prev_txs: [prevTxHex],
      funding_utxo: fundingUtxo,
      funding_utxo_value: fundingValue,
      change_address: changeAddress,
      fee_rate: 2
    };

    const res = await axios.post(this.proverApi, body, { timeout: 600000 });
    return { commitTx: res.data[0], spellTx: res.data[1] };
  }

  generateAttestation(escrowId: string, txHash: string, signerKey: string): Attestation {
    const msg = `${escrowId}:${txHash}`;
    return {
      escrow_id: escrowId,
      tx_hash: txHash,
      signer: signerKey,
      signature: crypto.createHmac('sha256', signerKey).update(msg).digest('hex')
    };
  }
}
