import { writable } from 'svelte/store';

export interface Escrow {
  _id: string;
  buyerId: string;
  sellerId: string;
  btcAmount: string;
  assetType: 'token' | 'nft';
  chain: string;
  contractAddress?: string;
  amount?: string;
  tokenId?: string;
  status: string;
  timeout: string;
  createdAt: string;
}

export const escrows = writable<Escrow[]>([]);
export const activeEscrow = writable<Escrow | null>(null);
