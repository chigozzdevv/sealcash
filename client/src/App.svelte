<script lang="ts">
  import { Motion } from 'svelte-motion';
  import WalletButton from '@components/WalletButton.svelte';
  import NetworkToggle from '@components/NetworkToggle.svelte';
  import Hero from '@components/Hero.svelte';
  import EscrowForm from '@components/EscrowForm.svelte';
  import EscrowList from '@components/EscrowList.svelte';
  import { wallet } from '@stores/wallet';

  let showApp = false;
  let view: 'create' | 'history' = 'create';

  function handleLaunch() {
    showApp = true;
  }

  function handleBack() {
    showApp = false;
  }
</script>

<div class="min-h-screen flex flex-col p-4 md:p-8 relative">
  {#if !showApp}
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center_top,rgba(247,147,26,0.15)_0%,transparent_50%)] pointer-events-none"></div>
  {/if}
  <header class="flex items-center justify-between relative z-10">
    {#if showApp}
      <button on:click={handleBack} class="flex items-center gap-2 text-[var(--muted)] hover:text-white transition-colors">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>
    {:else}
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl border border-[var(--primary)] flex items-center justify-center">
          <span class="text-[var(--primary)] font-bold text-lg">S</span>
        </div>
        <h1 class="text-xl font-semibold">SealCash</h1>
      </div>
    {/if}
    <div class="flex items-center gap-3">
      {#if showApp}
        <NetworkToggle />
      {/if}
      <WalletButton />
    </div>
  </header>

  {#if showApp}
    <main class="flex-1 flex flex-col justify-center max-w-2xl w-full mx-auto py-8">
      {#if $wallet.connected}
        <div class="flex justify-center gap-2 mb-8">
          <button
            on:click={() => view = 'create'}
            class="px-4 py-2 rounded-lg transition-colors {view === 'create' ? 'bg-[var(--surface)] border border-[var(--border)]' : 'text-[var(--muted)]'}"
          >
            Create Escrow
          </button>
          <button
            on:click={() => view = 'history'}
            class="px-4 py-2 rounded-lg transition-colors {view === 'history' ? 'bg-[var(--surface)] border border-[var(--border)]' : 'text-[var(--muted)]'}"
          >
            History
          </button>
        </div>
      {/if}

      {#if view === 'create'}
        <EscrowForm />
      {:else}
        <EscrowList />
      {/if}

      {#if !$wallet.connected}
        <Motion
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          let:motion
        >
          <p use:motion class="text-center text-[var(--muted)] mt-8">
            Connect your Bitcoin wallet to get started
          </p>
        </Motion>
      {/if}
    </main>
  {:else}
    <Hero onLaunch={handleLaunch} />
  {/if}
</div>
