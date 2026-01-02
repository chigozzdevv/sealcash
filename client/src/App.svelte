<script lang="ts">
  import { Motion } from 'svelte-motion';
  import { onMount } from 'svelte';
  import WalletButton from '@components/WalletButton.svelte';
  import NetworkToggle from '@components/NetworkToggle.svelte';
  import Hero from '@components/Hero.svelte';
  import EscrowForm from '@components/EscrowForm.svelte';
  import EscrowList from '@components/EscrowList.svelte';
  import InboxDropdown from '@components/InboxDropdown.svelte';
  import InvitePage from '@components/InvitePage.svelte';
  import { wallet } from '@stores/wallet';
  import { getToken } from '@lib/api';

  let showApp = window.location.pathname === '/app';
  let view: 'create' | 'history' = 'create';
  let inviteId: string | null = null;

  onMount(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/invite\/([a-f0-9]+)$/i);
    if (match) {
      inviteId = match[1];
    }

    if (getToken()) {
      const stored = localStorage.getItem('wallet');
      if (stored) {
        wallet.set(JSON.parse(stored));
      }
    }

    window.addEventListener('popstate', () => {
      showApp = window.location.pathname === '/app';
    });
  });

  wallet.subscribe(($w) => {
    if ($w.connected) {
      localStorage.setItem('wallet', JSON.stringify($w));
    }
  });

  function handleLaunch() {
    showApp = true;
    window.history.pushState({}, '', '/app');
  }

  function handleBack() {
    showApp = false;
    window.history.pushState({}, '', '/');
  }

  function handleInviteClose() {
    inviteId = null;
    window.history.pushState({}, '', '/');
    showApp = true;
  }
</script>

<div class="min-h-screen flex flex-col px-4 md:px-8 relative">
  {#if inviteId}
    <InvitePage escrowId={inviteId} onClose={handleInviteClose} />
  {:else}
    {#if !showApp}
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center_top,rgba(247,147,26,0.15)_0%,transparent_50%)] pointer-events-none"></div>
    {/if}
    
    <header class="flex items-center justify-between relative z-10 py-2">
    {#if showApp}
      <button on:click={handleBack} class="flex items-center gap-2 text-[var(--muted)] hover:text-white transition-colors">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>
    {:else}
      <img src="/sealcash-logo.png" alt="SealCash" class="h-36 -my-8" />
    {/if}
    
    <div class="flex items-center gap-2">
      {#if showApp && $wallet.connected}
        <InboxDropdown />
        <button
          on:click={() => view = 'history'}
          class="p-2 text-[var(--muted)] hover:text-white transition-colors {view === 'history' ? 'text-white' : ''}"
          title="History"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <NetworkToggle />
      {/if}
      <WalletButton />
    </div>
  </header>

  {#if showApp}
    <main class="flex-1 flex flex-col max-w-2xl w-full mx-auto py-8">
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
  {/if}
</div>
