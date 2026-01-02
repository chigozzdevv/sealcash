import {
  AddressPurpose,
  getAddress,
  signMessage,
  request,
  BitcoinNetworkType,
  RpcErrorCode,
  type GetAddressResponse,
} from 'sats-connect';
import { wallet } from '@stores/wallet';
import { api, setToken, clearToken } from './api';

const MEMPOOL_API = 'https://mempool.space/testnet4/api';

export async function connectWallet(): Promise<boolean> {
  try {
    const response = await new Promise<GetAddressResponse>((resolve, reject) => {
      getAddress({
        payload: {
          purposes: [AddressPurpose.Payment],
          message: 'Connect to SealCash',
          network: { type: BitcoinNetworkType.Testnet4 },
        },
        onFinish: resolve,
        onCancel: () => reject(new Error('User cancelled')),
      });
    });

    const address = response.addresses[0]?.address;
    if (!address) throw new Error('No address returned');

    const { challenge } = await api.auth.getChallenge(address);

    const signature = await new Promise<string>((resolve, reject) => {
      signMessage({
        payload: {
          address,
          message: challenge,
          network: { type: BitcoinNetworkType.Testnet4 },
        },
        onFinish: (res) => resolve(res),
        onCancel: () => reject(new Error('User cancelled signing')),
      });
    });

    const { token } = await api.auth.verify(address, signature);
    setToken(token);

    wallet.set({
      connected: true,
      address,
      network: 'testnet',
    });

    return true;
  } catch (err) {
    console.error('Wallet connection failed:', err);
    return false;
  }
}

export function disconnectWallet() {
  clearToken();
  localStorage.removeItem('wallet');
  wallet.set({ connected: false, address: null, network: null });
}

export async function sendBtcTransaction(
  recipientAddress: string,
  amountSats: number
): Promise<string | null> {
  const response = await request('sendTransfer', {
    recipients: [
      {
        address: recipientAddress,
        amount: amountSats,
      },
    ],
  });

  if (response.status === 'success') {
    return response.result.txid;
  } else {
    if (response.error.code === RpcErrorCode.USER_REJECTION) {
      return null;
    }
    throw new Error(response.error.message);
  }
}

export async function getWalletUtxos(address: string): Promise<any[]> {
  const res = await fetch(`${MEMPOOL_API}/address/${address}/utxo`);
  if (!res.ok) throw new Error('Failed to fetch UTXOs');
  return res.json();
}

export async function getRawTransaction(txid: string): Promise<string> {
  const res = await fetch(`${MEMPOOL_API}/tx/${txid}/hex`);
  if (!res.ok) throw new Error('Failed to fetch transaction');
  return res.text();
}

export async function broadcastTransaction(txHex: string): Promise<string> {
  const res = await fetch(`${MEMPOOL_API}/tx`, {
    method: 'POST',
    body: txHex,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Broadcast failed');
  }
  return res.text();
}

export async function signPsbt(psbtBase64: string): Promise<string> {
  const response = await request('signPsbt', {
    psbt: psbtBase64,
    broadcast: false,
    signInputs: {},
  });

  if (response.status === 'success') {
    return response.result.psbt;
  } else {
    if (response.error.code === RpcErrorCode.USER_REJECTION) {
      throw new Error('User rejected signing');
    }
    throw new Error(response.error.message);
  }
}
