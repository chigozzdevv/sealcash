<script lang="ts">
  import { Motion } from 'svelte-motion';

  export let onLaunch: () => void;
</script>

<div class="flex-1 flex flex-col items-center justify-center text-center px-4">
  <Motion
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    let:motion
  >
    <div use:motion>
      <h1 class="text-4xl md:text-5xl font-bold mb-4">
        <span class="text-[var(--muted)]">Trustless Cross-Chain</span><br />
        OTC Escrow
      </h1>
      <p class="text-[var(--muted)] text-lg md:text-xl max-w-lg mx-auto mb-8">
        Buy and sell tokens and NFTs across chains with Bitcoin-secured escrow. No middlemen, no trust required.
      </p>
    </div>
  </Motion>

  <Motion
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: 0.2 }}
    let:motion
  >
    <button
      use:motion
      on:click={onLaunch}
      class="group px-8 py-3 bg-[var(--primary)] text-black font-semibold rounded-xl hover:opacity-90 transition-all flex items-center gap-2"
    >
      Launch App
      <svg 
        class="w-4 h-4 transition-transform group-hover:-translate-y-0.5" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </button>
  </Motion>
</div>

