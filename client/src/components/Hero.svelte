<script lang="ts">
  import { Motion } from 'svelte-motion';

  export let onLaunch: () => void;
</script>

<div class="flex-1 flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
  <!-- Floating Bitcoin symbols -->
  <div class="absolute inset-0 pointer-events-none">
    <div class="absolute top-1/4 left-[10%] text-[var(--primary)] opacity-10 text-6xl animate-float-slow">₿</div>
    <div class="absolute top-1/3 right-[15%] text-[var(--primary)] opacity-5 text-4xl animate-float-medium">₿</div>
    <div class="absolute bottom-1/4 left-[20%] text-[var(--primary)] opacity-5 text-5xl animate-float-fast">₿</div>
    <div class="absolute bottom-1/3 right-[10%] text-[var(--primary)] opacity-10 text-3xl animate-float-slow">₿</div>
    <div class="absolute top-1/2 left-[5%] text-[var(--primary)] opacity-5 text-4xl animate-float-medium">◈</div>
    <div class="absolute top-[20%] right-[25%] text-[var(--primary)] opacity-5 text-3xl animate-float-fast">◈</div>
  </div>

  <!-- Glow effect behind headline -->
  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[var(--primary)] opacity-5 blur-[100px] rounded-full pointer-events-none"></div>

  <Motion
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    let:motion
  >
    <div use:motion class="relative z-10">
      <h1 class="text-4xl md:text-6xl font-bold mb-4">
        <span class="text-[var(--muted)]">Trustless Cross-Chain</span><br />
        <span class="bg-gradient-to-r from-[var(--primary)] to-yellow-500 bg-clip-text text-transparent">OTC Escrow</span>
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
      class="group relative z-10 px-8 py-3 bg-[var(--primary)] text-black font-semibold rounded-xl hover:opacity-90 transition-all flex items-center gap-2 hover:shadow-[0_0_30px_rgba(247,147,26,0.3)]"
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

  <!-- Powered by badge -->
  <Motion
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.6, delay: 0.4 }}
    let:motion
  >
    <div use:motion class="mt-12 text-[var(--muted)] text-sm opacity-60">
      Powered by <span class="text-[var(--primary)] font-semibold">Charms Protocol</span> (BOS stack)
    </div>
  </Motion>
</div>

<style>
  @keyframes float-slow {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(5deg); }
  }
  @keyframes float-medium {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-15px) rotate(-5deg); }
  }
  @keyframes float-fast {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  :global(.animate-float-slow) { animation: float-slow 8s ease-in-out infinite; }
  :global(.animate-float-medium) { animation: float-medium 6s ease-in-out infinite; }
  :global(.animate-float-fast) { animation: float-fast 4s ease-in-out infinite; }
</style>
