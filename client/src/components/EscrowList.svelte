<script lang="ts">
  import { Motion } from 'svelte-motion';
  import { onMount } from 'svelte';
  import { api } from '@lib/api';
  import { escrows, type Escrow } from '@stores/escrow';
  import { wallet } from '@stores/wallet';

  let loading = true;
  let filter: 'all' | 'buyer' | 'seller' = 'all';

  const statusColors: Record<string, string> = {
    pendingInvite: 'bg-yellow-500/20 text-yellow-500',
    pending: 'bg-blue-500/20 text-blue-500',
    accepted: 'bg-cyan-500/20 text-cyan-500',
    locked: 'bg-purple-500/20 text-purple-500',
    completed: 'bg-green-500/20 text-green-500',
    rejected: 'bg-red-500/20 text-red-500',
    refunded: 'bg-orange-500/20 text-orange-500',
  };

  async function loadEscrows() {
    if (!$wallet.connected) return;
    loading = true;
    try {
      const params = filter !== 'all' ? { role: filter } : undefined;
      $escrows = await api.escrow.list(params);
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  }

  async function handleAction(id: string, action: 'accept' | 'reject') {
    try {
      if (action === 'accept') await api.escrow.accept(id);
      else await api.escrow.reject(id);
      await loadEscrows();
    } catch (e: any) {
      alert(e.message);
    }
  }

  onMount(() => {
    if ($wallet.connected) loadEscrows();
  });

  $: if ($wallet.connected) loadEscrows();
  $: filter, $wallet.connected && loadEscrows();
</script>

<Motion
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
  let:motion
>
  <div use:motion class="w-full max-w-2xl mx-auto">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-medium">Your Escrows</h2>
      <div class="flex gap-2">
        {#each ['all', 'buyer', 'seller'] as f}
          <button
            on:click={() => filter = f as typeof filter}
            class="px-3 py-1 text-sm rounded-lg transition-colors {filter === f ? 'bg-[var(--primary)] text-black' : 'bg-[var(--surface)] text-[var(--muted)]'}"
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        {/each}
      </div>
    </div>

    {#if !$wallet.connected}
      <p class="text-center text-[var(--muted)] py-8">Connect wallet to view escrows</p>
    {:else if loading}
      <p class="text-center text-[var(--muted)] py-8">Loading...</p>
    {:else if $escrows.length === 0}
      <p class="text-center text-[var(--muted)] py-8">No escrows found</p>
    {:else}
      <div class="space-y-3">
        {#each $escrows as escrow (escrow._id)}
          <Motion
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            let:motion
          >
            <div use:motion class="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
              <div class="flex items-start justify-between mb-3">
                <div>
                  <span class="text-lg font-medium">{escrow.btcAmount} BTC</span>
                  <span class="text-[var(--muted)] text-sm ml-2">→ {escrow.amount || escrow.tokenId} {escrow.chain}</span>
                </div>
                <span class="px-2 py-0.5 text-xs rounded-full {statusColors[escrow.status] || 'bg-gray-500/20'}">
                  {escrow.status}
                </span>
              </div>
              
              <div class="text-sm text-[var(--muted)] space-y-1">
                <p>Seller: {escrow.sellerId.slice(0, 10)}...</p>
                <p>Expires: {new Date(escrow.timeout).toLocaleDateString()}</p>
              </div>

              {#if escrow.status === 'pending' && escrow.sellerId === $wallet.address}
                <div class="flex gap-2 mt-3">
                  <button
                    on:click={() => handleAction(escrow._id, 'accept')}
                    class="px-4 py-1.5 bg-green-500/20 text-green-500 text-sm rounded-lg hover:bg-green-500/30 transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    on:click={() => handleAction(escrow._id, 'reject')}
                    class="px-4 py-1.5 bg-red-500/20 text-red-500 text-sm rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              {/if}
            </div>
          </Motion>
        {/each}
      </div>
    {/if}
  </div>
</Motion>
