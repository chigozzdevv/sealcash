import Web3 from 'web3';
import { Connection } from '@solana/web3.js';
import { SuiClient } from '@mysten/sui/client';
import { env } from '@config/env';

export type ChainType = 'ethereum' | 'polygon' | 'bnb' | 'solana' | 'sui';

export interface TokenTransfer {
  from: string;
  to: string;
  amount: string;
  contractAddress?: string;
  blockNumber: number;
  timestamp: number;
}

export interface NFTTransfer {
  from: string;
  to: string;
  tokenId: string;
  contractAddress: string;
  blockNumber: number;
  timestamp: number;
}

export class BlockchainService {
  private web3Eth: Web3;
  private web3Polygon: Web3;
  private web3Bnb: Web3;
  private solana: Connection;
  private sui: SuiClient;

  constructor() {
    this.web3Eth = new Web3(env.ETHEREUM_RPC_URL);
    this.web3Polygon = new Web3(env.POLYGON_RPC_URL);
    this.web3Bnb = new Web3(env.BNB_RPC_URL);
    this.solana = new Connection(env.SOLANA_RPC_URL);
    this.sui = new SuiClient({ url: env.SUI_RPC_URL });
  }

  async verifyTokenTransfer(
    chain: ChainType,
    txHash: string,
    expectedFrom: string,
    expectedTo: string,
    expectedAmount: string,
    contractAddress?: string
  ): Promise<TokenTransfer | null> {
    try {
      switch (chain) {
        case 'ethereum':
        case 'polygon':
        case 'bnb':
          return this.verifyEVMToken(chain, txHash, expectedFrom, expectedTo, expectedAmount, contractAddress);
        case 'solana':
          return this.verifySolanaToken(txHash, expectedFrom, expectedTo, expectedAmount, contractAddress);
        case 'sui':
          return this.verifySuiToken(txHash, expectedFrom, expectedTo, expectedAmount);
        default:
          return null;
      }
    } catch {
      return null;
    }
  }

  async verifyNFTTransfer(
    chain: ChainType,
    txHash: string,
    expectedFrom: string,
    expectedTo: string,
    expectedTokenId: string,
    contractAddress: string
  ): Promise<NFTTransfer | null> {
    try {
      switch (chain) {
        case 'ethereum':
        case 'polygon':
        case 'bnb':
          return this.verifyEVMNFT(chain, txHash, expectedFrom, expectedTo, expectedTokenId, contractAddress);
        case 'solana':
          return this.verifySolanaNFT(txHash, expectedFrom, expectedTo, expectedTokenId);
        case 'sui':
          return this.verifySuiNFT(txHash, expectedFrom, expectedTo, expectedTokenId);
        default:
          return null;
      }
    } catch {
      return null;
    }
  }

  private async verifyEVMToken(
    chain: ChainType,
    txHash: string,
    expectedFrom: string,
    expectedTo: string,
    expectedAmount: string,
    contractAddress?: string
  ): Promise<TokenTransfer | null> {
    const web3 = this.getWeb3(chain);
    const [receipt, tx] = await Promise.all([
      web3.eth.getTransactionReceipt(txHash),
      web3.eth.getTransaction(txHash)
    ]);

    if (!receipt?.status || !tx) return null;
    const block = await web3.eth.getBlock(receipt.blockNumber);

    if (contractAddress) {
      const log = receipt.logs.find((l: any) =>
        l.address?.toLowerCase() === contractAddress.toLowerCase() &&
        l.topics?.[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
      );
      if (!log?.topics || !log.data) return null;

      const from = '0x' + log.topics[1].slice(26);
      const to = '0x' + log.topics[2].slice(26);
      const amount = web3.utils.hexToNumberString(log.data);

      if (from.toLowerCase() !== expectedFrom.toLowerCase() ||
          to.toLowerCase() !== expectedTo.toLowerCase() ||
          amount !== expectedAmount) return null;

      return { from, to, amount, contractAddress, blockNumber: Number(receipt.blockNumber), timestamp: Number(block.timestamp) };
    } else {
      if (tx.from.toLowerCase() !== expectedFrom.toLowerCase() ||
          tx.to?.toLowerCase() !== expectedTo.toLowerCase() ||
          tx.value !== expectedAmount) return null;

      return { from: tx.from, to: tx.to!, amount: tx.value, blockNumber: Number(receipt.blockNumber), timestamp: Number(block.timestamp) };
    }
  }

  private async verifyEVMNFT(
    chain: ChainType,
    txHash: string,
    expectedFrom: string,
    expectedTo: string,
    expectedTokenId: string,
    contractAddress: string
  ): Promise<NFTTransfer | null> {
    const web3 = this.getWeb3(chain);
    const receipt = await web3.eth.getTransactionReceipt(txHash);
    if (!receipt?.status) return null;

    const block = await web3.eth.getBlock(receipt.blockNumber);
    const log = receipt.logs.find((l: any) =>
      l.address?.toLowerCase() === contractAddress.toLowerCase() &&
      (l.topics?.[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' ||
       l.topics?.[0] === '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62')
    );
    if (!log?.topics) return null;

    const from = '0x' + log.topics[1].slice(26);
    const to = '0x' + log.topics[2].slice(26);
    const tokenId = web3.utils.hexToNumberString(log.topics[3] || log.data?.slice(0, 66) || '0x0');

    if (from.toLowerCase() !== expectedFrom.toLowerCase() ||
        to.toLowerCase() !== expectedTo.toLowerCase() ||
        tokenId !== expectedTokenId) return null;

    return { from, to, tokenId, contractAddress, blockNumber: Number(receipt.blockNumber), timestamp: Number(block.timestamp) };
  }

  private async verifySolanaToken(
    txHash: string,
    expectedFrom: string,
    expectedTo: string,
    expectedAmount: string,
    mintAddress?: string
  ): Promise<TokenTransfer | null> {
    const tx = await this.solana.getTransaction(txHash, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 });
    if (!tx?.meta || tx.meta.err) return null;

    const blockTime = tx.blockTime || Math.floor(Date.now() / 1000);

    if (mintAddress) {
      const pre = tx.meta.preTokenBalances || [];
      const post = tx.meta.postTokenBalances || [];
      const receiverPost = post.find((b: any) => b.owner === expectedTo && b.mint === mintAddress);
      const receiverPre = pre.find((b: any) => b.owner === expectedTo && b.mint === mintAddress);
      if (!receiverPost) return null;

      const amount = (receiverPost.uiTokenAmount.uiAmount || 0) - (receiverPre?.uiTokenAmount.uiAmount || 0);
      if (Math.abs(amount - parseFloat(expectedAmount)) > 0.000001) return null;

      return { from: expectedFrom, to: expectedTo, amount: amount.toString(), contractAddress: mintAddress, blockNumber: tx.slot, timestamp: blockTime };
    } else {
      const keys = tx.transaction.message.staticAccountKeys || [];
      const fromIdx = keys.findIndex((k: any) => k.toBase58() === expectedFrom);
      const toIdx = keys.findIndex((k: any) => k.toBase58() === expectedTo);
      if (fromIdx === -1 || toIdx === -1) return null;

      const amount = (tx.meta.postBalances[toIdx] - tx.meta.preBalances[toIdx]) / 1e9;
      if (Math.abs(amount - parseFloat(expectedAmount)) > 0.000001) return null;

      return { from: expectedFrom, to: expectedTo, amount: amount.toString(), blockNumber: tx.slot, timestamp: blockTime };
    }
  }

  private async verifySolanaNFT(
    txHash: string,
    expectedFrom: string,
    expectedTo: string,
    expectedTokenId: string
  ): Promise<NFTTransfer | null> {
    const tx = await this.solana.getTransaction(txHash, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 });
    if (!tx?.meta || tx.meta.err) return null;

    const post = tx.meta.postTokenBalances || [];
    const nft = post.find((b: any) => b.mint === expectedTokenId && b.owner === expectedTo && b.uiTokenAmount.uiAmount === 1);
    if (!nft) return null;

    return { from: expectedFrom, to: expectedTo, tokenId: expectedTokenId, contractAddress: expectedTokenId, blockNumber: tx.slot, timestamp: tx.blockTime || Math.floor(Date.now() / 1000) };
  }

  private async verifySuiToken(
    txHash: string,
    expectedFrom: string,
    expectedTo: string,
    expectedAmount: string
  ): Promise<TokenTransfer | null> {
    const tx = await this.sui.getTransactionBlock({ digest: txHash, options: { showEffects: true, showBalanceChanges: true } });
    if (!tx.effects || tx.effects.status.status !== 'success') return null;

    const changes = (tx.effects as any).balanceChanges || [];
    const change = changes.find((c: any) => c.owner?.AddressOwner === expectedTo && parseInt(c.amount) > 0);
    if (!change) return null;

    const amount = parseInt(change.amount) / 1e9;
    if (Math.abs(amount - parseFloat(expectedAmount)) > 0.000001) return null;

    return { from: expectedFrom, to: expectedTo, amount: amount.toString(), blockNumber: parseInt(tx.checkpoint || '0'), timestamp: parseInt(tx.timestampMs || '0') / 1000 };
  }

  private async verifySuiNFT(
    txHash: string,
    expectedFrom: string,
    expectedTo: string,
    expectedTokenId: string
  ): Promise<NFTTransfer | null> {
    const tx = await this.sui.getTransactionBlock({ digest: txHash, options: { showEffects: true, showObjectChanges: true } });
    if (!tx.effects || tx.effects.status.status !== 'success') return null;

    const changes = (tx.effects as any).objectChanges || [];
    const nft = changes.find((c: any) => c.type === 'transferred' && c.objectId === expectedTokenId && c.recipient?.AddressOwner === expectedTo);
    if (!nft) return null;

    return { from: expectedFrom, to: expectedTo, tokenId: expectedTokenId, contractAddress: expectedTokenId, blockNumber: parseInt(tx.checkpoint || '0'), timestamp: parseInt(tx.timestampMs || '0') / 1000 };
  }

  private getWeb3(chain: ChainType): Web3 {
    switch (chain) {
      case 'ethereum': return this.web3Eth;
      case 'polygon': return this.web3Polygon;
      case 'bnb': return this.web3Bnb;
      default: throw new Error(`No Web3 for ${chain}`);
    }
  }
}
