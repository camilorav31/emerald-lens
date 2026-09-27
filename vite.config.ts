import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The mGBA core runs on pthreads (SharedArrayBuffer), which requires cross-origin isolation.
const crossOriginIsolation = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
}

// Showdown sprites carry no CORS/CORP headers, so COEP blocks them cross-origin; serve them same-origin.
// Production does the same with vercel.json rewrites / public/_redirects.
const spriteProxy = {
  '/sprites/showdown': {
    target: 'https://play.pokemonshowdown.com',
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/sprites\/showdown/, '/sprites'),
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { headers: crossOriginIsolation, proxy: spriteProxy },
  preview: { headers: crossOriginIsolation, proxy: spriteProxy },
  // Pre-bundling would break the core's import.meta.url-relative wasm + worker loading
  optimizeDeps: { exclude: ['@emerald-lens/mgba-wasm'] },
  worker: { format: 'es' },
})
