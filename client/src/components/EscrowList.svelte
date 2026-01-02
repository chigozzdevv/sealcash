<script lang="ts">
  import { Motion } from 'svelte-motion';
  import { onMount } from 'svelte';
  import { api } from '@lib/api';
  import { escrows, type Escrow } from '@stores/escrow';
  import { wallet } from '@stores/wallet';
  import { sendBtcTransaction, getWalletUtxos, getRawTransaction, broadcastTransaction } from '@lib/wallet';

  let loading = true;
  let filter: 'all' | 'buyer' | 'seller' = 'all';
  let expandedId: string | null = null;
  let actionLoading = false;

  let proofForm = { txHash: '' };

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

  async function handleAcceptReject(id: string, action: 'accept' | 'reject') {
    actionLoading = true;
    try {
      if (action === 'accept') await api.escrow.accept(id);
      else await api.escrow.reject(id);
      await loadEscrows();
    } catch (e: any) {
      alert(e.message);
    } finally {
      actionLoading = false;
    }
  }

  async function handleLock(escrowId: string) {
    actionLoading = true;
    try {
      const escrow = $escrows.find(e => e._id === escrowId);
      if (!escrow) throw new Error('Escrow not found');

      const utxos = await getWalletUtxos($wallet.address!);
      if (!utxos.length) throw new Error('No UTXOs available');

      const amountSats = Math.floor(parseFloat(escrow.btcAmount) * 1e8);
      const minRequired = amountSats + 2000;
      
      const fundingUtxo = utxos.find((u: any) => u.value >= minRequired);
      if (!fundingUtxo) throw new Error(`Need at least ${minRequired} sats in a single UTXO`);

      const prevTxHex = await getRawTransaction(fundingUtxo.txid);

      try {
        const result = await api.escrow.lock(escrowId, {
          fundingUtxo: `${fundingUtxo.txid}:${fundingUtxo.vout}`,
          fundingValue: fundingUtxo.value,
          prevTxHex,
          outputAddress: $wallet.address,
          changeAddress: $wallet.address,
          broadcast: false,
        });

        const commitTxId = await broadcastTransaction(result.commitTx);
        await new Promise(r => setTimeout(r, 500));
        const spellTxId = await broadcastTransaction(result.spellTx);

        alert(`BTC locked successfully!\n\nCommit TX: ${commitTxId}\nSpell TX: ${spellTxId}`);
      } catch (proverErr: any) {
        console.error('Prover error:', proverErr);
        
        const txid = await sendBtcTransaction(escrow.sellerId, amountSats);
        if (txid) {
          alert(`BTC sent via simple transfer.\n\nTxID: ${txid}\n\nNote: Charms spell creation failed - ${proverErr.message}`);
        }
      }
      
      await loadEscrows();
    } catch (e: any) {
      alert(e.message || 'Failed to lock BTC');
    } finally {
      actionLoading = false;
    }
  }

  async function handleSubmitProof(id: string) {
    actionLoading = true;
    try {
      await api.escrow.submitProof(id, proofForm.txHash);
      proofForm = { txHash: '' };
      expandedId = null;
      await loadEscrows();
    } catch (e: any) {
      alert(e.message);
    } finally {
      actionLoading = false;
    }
  }

  function toggleExpand(id: string) {
    expandedId = expandedId === id ? null : id;
  }

  function isBuyer(escrow: any) {
    return escrow.buyerId === $wallet.address;
  }

  function isSeller(escrow: any) {
    return escrow.sellerId === $wallet.address;
  }

  onMount(() => {
    if ($wallet.connected) loadEscrows();
  });

  $: if ($wallet.connected) loadEscrows();
  $: filter, $wallet.connected && loadEscrows();
</script>

<Motion initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} let:motion>
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
          <div class="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
            <button 
              on:click={() => toggleExpand(escrow._id)}
              class="w-full p-4 text-left"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="text-lg font-medium">{escrow.btcAmount} BTC</span>
                  <span class="text-[var(--muted)] text-sm">→ {escrow.amount || escrow.tokenId} {escrow.chain}</span>
                  <span class="px-2 py-0.5 text-xs rounded-full bg-[var(--border)] text-[var(--muted)]">
                    {isBuyer(escrow) ? 'Buyer' : 'Seller'}
                  </span>
                </div>
                <span class="px-2 py-0.5 text-xs rounded-full {statusColors[escrow.status] || 'bg-gray-500/20'}">
                  {escrow.status}
                </span>
              </div>
              <div class="text-sm text-[var(--muted)]">
                <span>Expires: {new Date(escrow.timeout).toLocaleDateString()}</span>
              </div>
            </button>

            {#if expandedId === escrow._id}
              <div class="px-4 pb-4 border-t border-[var(--border)] pt-3">
                <!-- Seller: Accept/Reject pending escrow -->
                {#if escrow.status === 'pending' && isSeller(escrow)}
                  <div class="flex gap-2">
                    <button
                      on:click={() => handleAcceptReject(escrow._id, 'accept')}
                      disabled={actionLoading}
                      class="flex-1 px-4 py-2 bg-green-500/20 text-green-500 text-sm rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                    >
                      Accept Escrow
                    </button>
                    <button
                      on:click={() => handleAcceptReject(escrow._id, 'reject')}
                      disabled={actionLoading}
                      class="flex-1 px-4 py-2 bg-red-500/20 text-red-500 text-sm rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>

                <!-- Buyer: Lock BTC after seller accepts -->
                {:else if escrow.status === 'accepted' && isBuyer(escrow)}
                  <div class="space-y-3">
                    <p class="text-sm text-[var(--muted)]">Seller accepted. Lock your BTC to proceed.</p>
                    <div class="text-xs text-[var(--muted)] bg-black/30 p-2 rounded-lg">
                      <p>Amount: {escrow.btcAmount} BTC</p>
                      <p>To receive: {escrow.amount || escrow.tokenId} on {escrow.chain}</p>
                    </div>
                    <button
                      on:click={() => handleLock(escrow._id)}
                      disabled={actionLoading}
                      class="w-full px-4 py-2 bg-[var(--primary)] text-black text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {actionLoading ? 'Preparing transaction...' : `Lock ${escrow.btcAmount} BTC`}
                    </button>
                    <p class="text-xs text-center text-[var(--muted)]">Your wallet will prompt you to sign the transaction</p>
                  </div>

                <!-- Seller: Waiting for buyer to lock BTC -->
                {:else if escrow.status === 'accepted' && isSeller(escrow)}
                  <div class="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p class="text-sm text-yellow-500">⚠️ Waiting for buyer to lock BTC</p>
                    <p class="text-xs text-[var(--muted)] mt-1">Do NOT send tokens until status shows "locked"</p>
                  </div>

                <!-- Seller: Submit proof after BTC is locked -->
                {:else if escrow.status === 'locked' && isSeller(escrow)}
                  <div class="space-y-3">
                    <p class="text-sm text-[var(--muted)]">BTC is locked. Send the tokens and submit the transaction hash.</p>
                    <div class="text-xs text-[var(--muted)] bg-black/30 p-2 rounded-lg">
                      <p>Send to: {escrow.receiverAddress}</p>
                      <p>Amount: {escrow.amount || escrow.tokenId}</p>
                      <p>Chain: {escrow.chain}</p>
                    </div>
                    <input
                      bind:value={proofForm.txHash}
                      placeholder="Transaction hash"
                      class="w-full px-3 py-2 bg-black/30 border border-[var(--border)] rounded-lg text-sm"
                    />
                    <button
                      on:click={() => handleSubmitProof(escrow._id)}
                      disabled={actionLoading || !proofForm.txHash}
                      class="w-full px-4 py-2 bg-[var(--primary)] text-black text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {actionLoading ? 'Verifying...' : 'Submit Proof'}
                    </button>
                  </div>

                <!-- Completed -->
                {:else if escrow.status === 'completed'}
                  <p class="text-sm text-green-500">✓ Escrow completed successfully</p>

                <!-- Refunded -->
                {:else if escrow.status === 'refunded'}
                  <p class="text-sm text-orange-500">↩ Escrow was refunded</p>

                <!-- Rejected -->
                {:else if escrow.status === 'rejected'}
                  <p class="text-sm text-red-500">✗ Escrow was rejected</p>

                {:else}
                  <p class="text-sm text-[var(--muted)]">Waiting for next step...</p>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</Motion>
