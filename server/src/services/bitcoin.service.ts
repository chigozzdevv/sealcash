import axios from 'axios';
import { env } from '@config/env';

export class BitcoinService {
  private rpcUrl: string;
  private rpcUser: string;
  private rpcPassword: string;
  private network: 'mainnet' | 'testnet' | 'testnet4';

  constructor() {
    this.rpcUrl = env.BITCOIN_RPC_URL || 'http://localhost:18332';
    this.rpcUser = env.BITCOIN_RPC_USER || '';
    this.rpcPassword = env.BITCOIN_RPC_PASSWORD || '';
    this.network = (env.BITCOIN_NETWORK as any) || 'testnet4';
  }

  private async rpc(method: string, params: any[] = []): Promise<any> {
    const response = await axios.post(
      this.rpcUrl,
      { jsonrpc: '1.0', id: Date.now(), method, params },
      {
        auth: this.rpcUser ? { username: this.rpcUser, password: this.rpcPassword } : undefined,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (response.data.error) {
      throw new Error(`Bitcoin RPC error: ${response.data.error.message}`);
    }

    return response.data.result;
  }

  async broadcastSpellPackage(commitTx: string, spellTx: string): Promise<{ commitTxId: string; spellTxId: string }> {
    try {
      const result = await this.rpc('submitpackage', [[commitTx, spellTx]]);
      const txids = result.tx_results || {};
      const commitTxId = Object.keys(txids)[0];
      const spellTxId = Object.keys(txids)[1];
      return { commitTxId, spellTxId };
    } catch (error: any) {
      return this.broadcastIndividually(commitTx, spellTx);
    }
  }

  private async broadcastIndividually(commitTx: string, spellTx: string): Promise<{ commitTxId: string; spellTxId: string }> {
    const commitTxId = await this.rpc('sendrawtransaction', [commitTx]);
    await new Promise(resolve => setTimeout(resolve, 100));
    const spellTxId = await this.rpc('sendrawtransaction', [spellTx]);
    return { commitTxId, spellTxId };
  }

  async getRawTransaction(txid: string): Promise<string> {
    return this.rpc('getrawtransaction', [txid, false]);
  }

  async getBlockHeight(): Promise<number> {
    return this.rpc('getblockcount', []);
  }

  async broadcastViaBlockstream(txHex: string): Promise<string> {
    const baseUrl = this.network === 'mainnet' 
      ? 'https://blockstream.info/api'
      : 'https://blockstream.info/testnet/api';

    const response = await axios.post(`${baseUrl}/tx`, txHex, {
      headers: { 'Content-Type': 'text/plain' },
    });

    return response.data;
  }

  async broadcastSpellPackageExternal(commitTx: string, spellTx: string): Promise<{ commitTxId: string; spellTxId: string }> {
    const commitTxId = await this.broadcastViaBlockstream(commitTx);
    await new Promise(resolve => setTimeout(resolve, 500));
    const spellTxId = await this.broadcastViaBlockstream(spellTx);
    return { commitTxId, spellTxId };
  }
}
