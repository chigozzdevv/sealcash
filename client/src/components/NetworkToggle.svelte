<script lang="ts">
  import { network } from '@stores/wallet';

  let open = false;

  function select(value: 'testnet' | 'mainnet') {
    if (value === 'mainnet') return;
    $network = value;
    open = false;
  }
</script>

<svelte:window on:click={() => open = false} />

<div class="relative">
  <button
    on:click|stopPropagation={() => open = !open}
    class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm hover:bg-white/5 transition-colors"
  >
    <div class="w-2 h-2 rounded-full bg-green-500"></div>
    Testnet
    <svg class="w-4 h-4 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  {#if open}
    <div class="absolute top-full right-0 mt-1 py-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg min-w-[120px] z-50">
      <button
        on:click|stopPropagation={() => select('testnet')}
        class="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-white/5"
      >
        <div class="w-2 h-2 rounded-full bg-green-500"></div>
        Testnet
      </button>
      <button
        disabled
        class="w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-[var(--muted)] opacity-50 cursor-not-allowed"
      >
        <div class="w-2 h-2 rounded-full bg-gray-500"></div>
        Mainnet
        <span class="text-xs ml-auto">Soon</span>
      </button>
    </div>
  {/if}
</div>
