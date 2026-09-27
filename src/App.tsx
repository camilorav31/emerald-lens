import { AppShell, EmulatorView } from './ui/EmulatorView'
import { useApplyTheme } from './ui/shell/ThemeToggle'

function IsolationRequired() {
  return (
    <AppShell
      stage={
        <div className="grid place-items-center py-8">
          <section className="max-w-xl rounded-[24px] border border-line-2 bg-surface-2 p-6 shadow-card" aria-labelledby="coi-title">
            <h1 id="coi-title" className="font-display text-[22px] leading-7 font-semibold">
              Aislamiento cross-origin desactivado
            </h1>
            <p className="mt-3 text-[13px] leading-[18px] text-fg-2">
              El core mGBA usa hilos (SharedArrayBuffer), que el navegador solo habilita si el sitio se sirve con los
              headers <code className="font-mono text-fg-1">Cross-Origin-Opener-Policy: same-origin</code> y{' '}
              <code className="font-mono text-fg-1">Cross-Origin-Embedder-Policy: require-corp</code>.
            </p>
          </section>
        </div>
      }
      panel={null}
    />
  )
}

export default function App() {
  useApplyTheme()
  return window.crossOriginIsolated ? <EmulatorView /> : <IsolationRequired />
}
