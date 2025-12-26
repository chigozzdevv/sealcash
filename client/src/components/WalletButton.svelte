<script lang="ts">
  import { Motion } from 'svelte-motion';
  import { wallet, shortAddress } from '@stores/wallet';
  import { connectWallet, disconnectWallet } from '@lib/wallet';

  let connecting = false;

  async function handleConnect() {
    connecting = true;
    await connectWallet();
    connecting = false;
  }
</script>

<Motion
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
  let:motion
>
  <div use:motion>
    {#if $wallet.connected}
      <div class="flex items-center gap-3">
        <span class="px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm">
          {$shortAddress}
        </span>
        <button
          on:click={disconnectWallet}
          class="px-4 py-1.5 text-sm text-[var(--muted)] hover:text-white transition-colors"
        >
          Disconnect
        </button>
      </div>
    {:else}
      <button
        on:click={handleConnect}
        disabled={connecting}
        class="px-5 py-2 bg-[var(--primary)] text-black font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    {/if}
  </div>
</Motion>
