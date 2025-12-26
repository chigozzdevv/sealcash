<script lang="ts">
  import { onMount } from 'svelte';
  import { Motion } from 'svelte-motion';
  import { api } from '@lib/api';
  import { wallet } from '@stores/wallet';
  import { connectWallet } from '@lib/wallet';
  import WalletButton from './WalletButton.svelte';

  export let escrowId: string;
  export let onClose: () => void;

  let escrow: any = null;
  let loading = true;
  let error = '';
  let accepting = false;

  onMount(async () => {
    try {
      escrow = await api.escrow.getPublic(escrowId);
    } catch (e: any) {
      error = e.message || 'Escrow not found';
    } finally {
      loading = false;
    }
  });

  async function handleConnectAndAccept() {
    accepting = true;
    error = '';

    try {
      // Connect wallet if not connected
      if (!$wallet.connected) {
        const connected = await connectWallet();
        if (!connected) {
          error = 'Wallet connection failed';
          accepting = false;
          return;
        }
      }

      // Verify this wallet matches the seller address
      if ($wallet.address !== escrow.sellerId) {
        error = `Please connect with the seller wallet: ${escrow.sellerId.slice(0, 10)}...`;
        accepting = false;
        return;
      }

      // Accept the escrow (backend will auto-register if needed)
      await api.escrow.accept(escrowId);
      
      // Success - redirect to app
      onClose();
    } catch (e: any) {
      error = e.message || 'Failed to accept escrow';
    } finally {
      accepting = false;
    }
  }
</script>

<div class="min-h-screen flex flex-col items-center justify-center px-4">
  <Motion
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    let:motion
  >
    <div use:motion class="w-full max-w-md">
      {#if loading}
        <div class="text-center">
          <div class="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-[var(--muted)]">Loading escrow...</p>
        </div>

      {:else if error && !escrow}
        <div class="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 text-center">
          <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg class="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 class="text-lg font-medium mb-2">Escrow Not Found</h2>
          <p class="text-[var(--muted)] text-sm mb-4">{error}</p>
          <button on:click={onClose} class="text-[var(--primary)] text-sm hover:underline">
            Go to App
          </button>
        </div>

      {:else if escrow}
        <div class="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div class="p-6 border-b border-[var(--border)]">
            <h2 class="text-xl font-medium mb-1">You've Been Invited</h2>
            <p class="text-[var(--muted)] text-sm">Someone wants to trade with you</p>
          </div>

          <div class="p-6 space-y-4">
            <div class="flex justify-between items-center">
              <span class="text-[var(--muted)]">You Receive</span>
              <span class="text-lg font-medium text-[var(--primary)]">{escrow.btcAmount} BTC</span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-[var(--muted)]">You Send</span>
              <span class="font-medium">
                {escrow.amount || escrow.tokenId} 
                <span class="text-[var(--muted)] text-sm">on {escrow.chain}</span>
              </span>
            </div>

            {#if escrow.contractAddress}
              <div class="text-xs text-[var(--muted)] bg-black/30 p-2 rounded-lg break-all">
                Contract: {escrow.contractAddress}
              </div>
            {/if}

            <div class="flex justify-between items-center text-sm">
              <span class="text-[var(--muted)]">Expires</span>
              <span>{new Date(escrow.timeout).toLocaleString()}</span>
            </div>

            <div class="flex justify-between items-center text-sm">
              <span class="text-[var(--muted)]">From</span>
              <span class="font-mono text-xs">{escrow.buyerId.slice(0, 12)}...</span>
            </div>
          </div>

          <div class="p-6 bg-black/20">
            {#if error}
              <p class="text-red-500 text-sm mb-3">{error}</p>
            {/if}

            {#if escrow.status === 'pendingInvite' || escrow.status === 'pending'}
              {#if $wallet.connected}
                <button
                  on:click={handleConnectAndAccept}
                  disabled={accepting}
                  class="w-full py-3 bg-[var(--primary)] text-black font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {accepting ? 'Accepting...' : 'Accept Escrow'}
                </button>
                <p class="text-center text-[var(--muted)] text-xs mt-2">
                  Connected: {$wallet.address?.slice(0, 8)}...
                </p>
              {:else}
                <button
                  on:click={handleConnectAndAccept}
                  disabled={accepting}
                  class="w-full py-3 bg-[var(--primary)] text-black font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {accepting ? 'Connecting...' : 'Connect Wallet & Accept'}
                </button>
              {/if}
            {:else if escrow.status === 'accepted'}
              <p class="text-center text-green-500">✓ Already accepted</p>
            {:else}
              <p class="text-center text-[var(--muted)]">This escrow is no longer available</p>
            {/if}

            <button on:click={onClose} class="w-full mt-3 text-[var(--muted)] text-sm hover:text-white transition-colors">
              Cancel
            </button>
          </div>
        </div>
      {/if}
    </div>
  </Motion>
</div>
