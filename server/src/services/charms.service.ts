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

export interface SpellResult {
  commitTx: string;
  spellTx: string;
}

const SPELL_VERSION = 8;

export class CharmsService {
  private proverApi = env.CHARMS_PROVER_API;
  private appVk = env.CHARMS_APP_VK;
  private appBinary: string | null = null;

  constructor() {
    this.loadAppBinary();
  }

  private loadAppBinary(): void {
    const possiblePaths = [
      path.join(process.cwd(), '../charms/target/wasm32-wasip1/release/seal.wasm'),
      path.join(process.cwd(), 'charms/target/wasm32-wasip1/release/seal.wasm'),
      path.join(__dirname, '../../../charms/target/wasm32-wasip1/release/seal.wasm'),
      path.join(__dirname, '../../../../charms/target/wasm32-wasip1/release/seal.wasm'),
    ];

    for (const binaryPath of possiblePaths) {
      if (fs.existsSync(binaryPath)) {
        this.appBinary = fs.readFileSync(binaryPath).toString('base64');
        return;
      }
    }
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
  ): Promise<SpellResult> {
    const body = {
      chain: 'bitcoin',
      spell: {
        version: SPELL_VERSION,
        apps: { '$00': this.getAppString(escrowId) },
        ins: [],
        outs: [{ address: outputAddress, charms: { '$00': escrow.amount }, sats: 1000 }],
      },
      binaries: this.appBinary ? { [this.appVk]: this.appBinary } : {},
      prev_txs: prevTxHex ? [{ bitcoin: prevTxHex }] : [],
      funding_utxo: fundingUtxo,
      funding_utxo_value: fundingValue,
      change_address: changeAddress,
      fee_rate: 2
    };

    try {
      const res = await axios.post(this.proverApi, body, { timeout: 600000 });
      return { 
        commitTx: res.data[0].bitcoin || res.data[0], 
        spellTx: res.data[1].bitcoin || res.data[1] 
      };
    } catch (error: any) {
      console.error('[CharmsService] createLockSpell error:', error.response?.data || error.message);
      throw new Error(`Prover API error: ${JSON.stringify(error.response?.data || error.message)}`);
    }
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
  ): Promise<SpellResult> {
    const body = {
      chain: 'bitcoin',
      spell: {
        version: SPELL_VERSION,
        apps: { '$00': this.getAppString(escrowId) },
        ins: [{ utxo_id: inputUtxo, charms: { '$00': escrow } }],
        outs: [{ address: sellerAddress, charms: { '$00': { ...escrow, state: 'Released' } }, sats: 1000 }],
      },
      binaries: this.appBinary ? { [this.appVk]: this.appBinary } : {},
      prev_txs: [{ bitcoin: prevTxHex }],
      funding_utxo: fundingUtxo,
      funding_utxo_value: fundingValue,
      change_address: changeAddress,
      fee_rate: 2,
      private_inputs: { '$00': { "Release": { "attestation": attestation } } }
    };

    try {
      const res = await axios.post(this.proverApi, body, { timeout: 600000 });
      return { 
        commitTx: res.data[0].bitcoin || res.data[0], 
        spellTx: res.data[1].bitcoin || res.data[1] 
      };
    } catch (error: any) {
      console.error('[CharmsService] createReleaseSpell error:', error.response?.data || error.message);
      throw new Error(`Prover API error: ${JSON.stringify(error.response?.data || error.message)}`);
    }
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
  ): Promise<SpellResult> {
    const body = {
      chain: 'bitcoin',
      spell: {
        version: SPELL_VERSION,
        apps: { '$00': this.getAppString(escrowId) },
        ins: [{ utxo_id: inputUtxo, charms: { '$00': escrow } }],
        outs: [{ address: buyerAddress, charms: { '$00': { ...escrow, state: 'Refunded' } }, sats: 1000 }],
      },
      binaries: this.appBinary ? { [this.appVk]: this.appBinary } : {},
      prev_txs: [{ bitcoin: prevTxHex }],
      funding_utxo: fundingUtxo,
      funding_utxo_value: fundingValue,
      change_address: changeAddress,
      fee_rate: 2,
      private_inputs: { '$00': { "Refund": { "current_block": currentBlock } } }
    };

    try {
      const res = await axios.post(this.proverApi, body, { timeout: 600000 });
      return { 
        commitTx: res.data[0].bitcoin || res.data[0], 
        spellTx: res.data[1].bitcoin || res.data[1] 
      };
    } catch (error: any) {
      console.error('[CharmsService] createRefundSpell error:', error.response?.data || error.message);
      throw new Error(`Prover API error: ${JSON.stringify(error.response?.data || error.message)}`);
    }
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
