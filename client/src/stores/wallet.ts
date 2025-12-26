import { writable, derived } from 'svelte/store';

interface WalletState {
  connected: boolean;
  address: string | null;
  network: string | null;
}

const initialState: WalletState = {
  connected: false,
  address: null,
  network: null,
};

export const wallet = writable<WalletState>(initialState);
export const network = writable<'testnet' | 'mainnet'>('testnet');

export const shortAddress = derived(wallet, ($wallet) =>
  $wallet.address ? `${$wallet.address.slice(0, 6)}...${$wallet.address.slice(-4)}` : null
);
