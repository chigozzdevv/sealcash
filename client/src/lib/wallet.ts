import {
  AddressPurpose,
  getAddress,
  signMessage,
  sendBtcTransaction as satsSendBtc,
  BitcoinNetworkType,
  type GetAddressResponse,
} from 'sats-connect';
import { wallet } from '@stores/wallet';
import { api, setToken, clearToken } from './api';

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
  wallet.set({ connected: false, address: null, network: null });
}

export async function sendBtcTransaction(
  recipientAddress: string,
  amountSats: number
): Promise<string | null> {
  try {
    const txid = await new Promise<string>((resolve, reject) => {
      satsSendBtc({
        payload: {
          network: { type: BitcoinNetworkType.Testnet4 },
          recipients: [
            {
              address: recipientAddress,
              amountSats: BigInt(amountSats),
            },
          ],
          senderAddress: recipientAddress,
        },
        onFinish: (response) => resolve(response.txid),
        onCancel: () => reject(new Error('User cancelled transaction')),
      });
    });
    return txid;
  } catch (err) {
    console.error('Send BTC failed:', err);
    throw err;
  }
}

export async function getWalletUtxos(): Promise<any[]> {
  return [];
}
