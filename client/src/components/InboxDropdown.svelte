<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '@lib/api';
  import { wallet } from '@stores/wallet';

  let open = false;
  let pendingEscrows: any[] = [];
  let loading = false;

  async function loadPending() {
    if (!$wallet.connected) return;
    loading = true;
    try {
      pendingEscrows = await api.escrow.pendingInvites();
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
      await loadPending();
    } catch (e: any) {
      alert(e.message);
    }
  }

  function toggleDropdown() {
    open = !open;
    if (open) loadPending();
  }

  function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.inbox-dropdown')) {
      open = false;
    }
  }

  onMount(() => {
    if ($wallet.connected) loadPending();
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  });

  $: if ($wallet.connected) loadPending();
</script>

<div class="relative inbox-dropdown">
  <button
    on:click={toggleDropdown}
    class="relative p-2 text-[var(--muted)] hover:text-white transition-colors"
  >
    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
    {#if pendingEscrows.length > 0}
      <span class="absolute -top-1 -right-1 w-4 h-4 bg-[var(--primary)] text-black text-xs rounded-full flex items-center justify-center">
        {pendingEscrows.length}
      </span>
    {/if}
  </button>

  {#if open}
    <div class="absolute right-0 top-full mt-2 w-80 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl z-50 overflow-hidden">
      <div class="p-3 border-b border-[var(--border)]">
        <h3 class="font-medium text-sm">Pending Requests</h3>
      </div>
      
      <div class="max-h-64 overflow-y-auto">
        {#if loading}
          <p class="p-4 text-center text-[var(--muted)] text-sm">Loading...</p>
        {:else if pendingEscrows.length === 0}
          <p class="p-4 text-center text-[var(--muted)] text-sm">No pending requests</p>
        {:else}
          {#each pendingEscrows as escrow (escrow._id)}
            <div class="p-3 border-b border-[var(--border)] last:border-b-0">
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-sm">{escrow.btcAmount} BTC</span>
                <span class="text-xs text-[var(--muted)]">{escrow.chain}</span>
              </div>
              <p class="text-xs text-[var(--muted)] mb-2 truncate">
                From: {escrow.buyerId.slice(0, 12)}...
              </p>
              <div class="flex gap-2">
                <button
                  on:click={() => handleAction(escrow._id, 'accept')}
                  class="flex-1 px-3 py-1.5 bg-green-500/20 text-green-500 text-xs rounded-lg hover:bg-green-500/30 transition-colors"
                >
                  Accept
                </button>
                <button
                  on:click={() => handleAction(escrow._id, 'reject')}
                  class="flex-1 px-3 py-1.5 bg-red-500/20 text-red-500 text-xs rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>
