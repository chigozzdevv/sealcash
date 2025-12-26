<script lang="ts">
  import { Motion } from 'svelte-motion';
  import { api } from '@lib/api';
  import { wallet } from '@stores/wallet';

  let form = {
    sellerBtcAddress: '',
    btcAmount: '',
    assetType: 'token' as 'token' | 'nft',
    chain: 'ethereum',
    contractAddress: '',
    amount: '',
    tokenId: '',
    senderAddress: '',
    receiverAddress: '',
    timeout: '',
  };

  let loading = false;
  let result: { inviteLink: string | null; escrowId: string } | null = null;
  let error = '';

  const chains = ['ethereum', 'polygon', 'bnb', 'solana', 'sui'];

  async function handleSubmit() {
    error = '';
    loading = true;

    try {
      const timeout = new Date();
      timeout.setHours(timeout.getHours() + parseInt(form.timeout) || 24);

      const data = {
        ...form,
        timeout: timeout.toISOString(),
      };

      const res = await api.escrow.create(data);
      result = { inviteLink: res.inviteLink, escrowId: res.escrow._id };
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  function reset() {
    result = null;
    form = {
      sellerBtcAddress: '',
      btcAmount: '',
      assetType: 'token',
      chain: 'ethereum',
      contractAddress: '',
      amount: '',
      tokenId: '',
      senderAddress: '',
      receiverAddress: '',
      timeout: '',
    };
  }
</script>

<Motion
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
  let:motion
>
  <div use:motion class="w-full max-w-lg mx-auto">
    {#if result}
      <div class="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-center">
        <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
          <svg class="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 class="text-lg font-medium mb-2">Escrow Created</h3>
        {#if result.inviteLink}
          <p class="text-[var(--muted)] text-sm mb-4">Share this link with the seller:</p>
          <code class="block p-3 bg-black/50 rounded-lg text-sm break-all mb-4">
            {window.location.origin}{result.inviteLink}
          </code>
        {:else}
          <p class="text-[var(--muted)] text-sm mb-4">Seller has been notified.</p>
        {/if}
        <button on:click={reset} class="text-[var(--primary)] text-sm hover:underline">
          Create another
        </button>
      </div>
    {:else}
      <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2">
            <label class="block text-sm text-[var(--muted)] mb-1.5">Seller BTC Address</label>
            <input
              bind:value={form.sellerBtcAddress}
              type="text"
              required
              placeholder="tb1q..."
              class="w-full px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg focus:border-[var(--primary)] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label class="block text-sm text-[var(--muted)] mb-1.5">BTC Amount</label>
            <input
              bind:value={form.btcAmount}
              type="text"
              required
              placeholder="0.001"
              class="w-full px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg focus:border-[var(--primary)] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label class="block text-sm text-[var(--muted)] mb-1.5">Timeout (hours)</label>
            <input
              bind:value={form.timeout}
              type="number"
              required
              placeholder="24"
              class="w-full px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg focus:border-[var(--primary)] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label class="block text-sm text-[var(--muted)] mb-1.5">Asset Type</label>
            <select
              bind:value={form.assetType}
              class="w-full px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg focus:border-[var(--primary)] focus:outline-none transition-colors"
            >
              <option value="token">Token</option>
              <option value="nft">NFT</option>
            </select>
          </div>

          <div>
            <label class="block text-sm text-[var(--muted)] mb-1.5">Chain</label>
            <select
              bind:value={form.chain}
              class="w-full px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg focus:border-[var(--primary)] focus:outline-none transition-colors"
            >
              {#each chains as chain}
                <option value={chain}>{chain.charAt(0).toUpperCase() + chain.slice(1)}</option>
              {/each}
            </select>
          </div>

          <div class="col-span-2">
            <label class="block text-sm text-[var(--muted)] mb-1.5">Contract Address</label>
            <input
              bind:value={form.contractAddress}
              type="text"
              placeholder="0x..."
              class="w-full px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg focus:border-[var(--primary)] focus:outline-none transition-colors"
            />
          </div>

          {#if form.assetType === 'token'}
            <div class="col-span-2">
              <label class="block text-sm text-[var(--muted)] mb-1.5">Token Amount</label>
              <input
                bind:value={form.amount}
                type="text"
                placeholder="1000"
                class="w-full px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg focus:border-[var(--primary)] focus:outline-none transition-colors"
              />
            </div>
          {:else}
            <div class="col-span-2">
              <label class="block text-sm text-[var(--muted)] mb-1.5">Token ID</label>
              <input
                bind:value={form.tokenId}
                type="text"
                placeholder="1234"
                class="w-full px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg focus:border-[var(--primary)] focus:outline-none transition-colors"
              />
            </div>
          {/if}

          <div>
            <label class="block text-sm text-[var(--muted)] mb-1.5">Sender Address</label>
            <input
              bind:value={form.senderAddress}
              type="text"
              required
              placeholder="Seller's address on chain"
              class="w-full px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg focus:border-[var(--primary)] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label class="block text-sm text-[var(--muted)] mb-1.5">Receiver Address</label>
            <input
              bind:value={form.receiverAddress}
              type="text"
              required
              placeholder="Your address on chain"
              class="w-full px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg focus:border-[var(--primary)] focus:outline-none transition-colors"
            />
          </div>
        </div>

        {#if error}
          <p class="text-red-500 text-sm">{error}</p>
        {/if}

        <p class="text-center text-[var(--muted)] text-xs mb-3">
          ⚠️ Testnet mode — use testnet BTC and devnet tokens
        </p>

        <button
          type="submit"
          disabled={loading || !$wallet.connected}
          class="w-full py-3 bg-[var(--primary)] text-black font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Escrow'}
        </button>
      </form>
    {/if}
  </div>
</Motion>
