import { lazy, Suspense, type ReactNode } from 'react'
import { SCHEME_LABELS, type ControlScheme } from '../../emulator/keymaps'
import { hasGame, useEmulatorStore } from '../../store/emulatorStore'
import { useSettingsStore, type ScreenFilter } from '../../store/settingsStore'
import { useScreenScale } from '../game-screen/screenScaleStore'
import { crtAvailable, lcdAvailable } from '../game-screen/useIntegerScale'
import { CheckIcon, LockIcon, ShieldCheckIcon } from '../icons'
import { Led, Segmented } from '../primitives'
import { Credits } from '../shell/Footer'
import { ExtraKeys } from './KeyboardLegend'

const DevTools = import.meta.env.DEV ? lazy(() => import('./DevTools')) : null

function Section({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`space-y-2.5 border-t border-line-1 pt-3 first:border-t-0 first:pt-0 ${className}`}>
      <h3 className="text-[13px] font-medium text-fg-1">{title}</h3>
      {children}
    </section>
  )
}

export function Switch({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3">
      <span className="min-w-0">
        <span className="block text-[13px] text-fg-2">{label}</span>
        {hint && <span className="block text-xs text-fg-3">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden="true"
        className="relative mt-0.5 h-5 w-9 flex-none rounded-full border border-line-strong bg-surface-1 transition-colors duration-150 peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus after:absolute after:top-0.5 after:left-0.5 after:size-3.5 after:rounded-full after:bg-fg-2 after:transition-[translate,background-color] after:duration-150 peer-checked:after:translate-x-4 peer-checked:after:bg-accent-ink"
      />
    </label>
  )
}

// Only cartridges the reader can decode ever start, so this covers every code that reaches the panel
const GAME_NAMES: Record<string, string> = { BPEE: 'Esmeralda' }

function SessionSection() {
  const status = useEmulatorStore((s) => s.status)
  const gameCode = useEmulatorStore((s) => s.gameCode)
  const memoryAccess = useEmulatorStore((s) => s.memoryAccess)
  const version = useEmulatorStore((s) => s.emulator?.version)

  if (!hasGame(status)) return <p className="text-xs text-fg-3">Sin cartucho insertado.</p>
  return (
    <dl className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-y-2 text-[13px]">
      <dt className="text-fg-3">Juego</dt>
      <dd>
        <span className="inline-flex h-[22px] items-center gap-1.5 rounded-sm border border-accent-line bg-accent-tint px-2 text-xs whitespace-nowrap text-accent-hi">
          <CheckIcon size={12} />
          {(gameCode && GAME_NAMES[gameCode]) ?? 'Desconocido'} ·<span className="font-mono font-medium">{gameCode}</span>
        </span>
      </dd>
      <dt className="text-fg-3">Memoria</dt>
      <dd className="flex items-center gap-2 text-xs text-fg-2">
        <Led tone={memoryAccess === 'live' ? 'accent' : 'warn'} />
        {memoryAccess === 'live' ? 'Lectura directa (core parcheado)' : 'Snapshots de save state (core sin parchear)'}
      </dd>
      <dt className="text-fg-3">Núcleo</dt>
      <dd className="font-mono text-xs text-fg-2">{version}</dd>
    </dl>
  )
}

function ScreenSection() {
  const { filter, setFilter } = useSettingsStore()
  const scale = useScreenScale((s) => s.scale)
  const lcd = lcdAvailable(scale)
  const crt = crtAvailable(scale)
  const blocked = (filter === 'lcd' && !lcd) || (filter === 'crt' && !crt)
  const options: { value: ScreenFilter; label: string; disabled?: boolean }[] = [
    { value: 'none', label: 'Ninguno' },
    { value: 'lcd', label: 'LCD', disabled: !lcd && filter !== 'lcd' },
    { value: 'crt', label: 'CRT', disabled: !crt && filter !== 'crt' },
  ]
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-fg-3">Filtro de pantalla</p>
      <Segmented label="Filtro de pantalla" value={filter} options={options} onChange={setFilter} />
      {blocked && (
        <p className="text-xs text-pretty text-fg-3">
          {filter.toUpperCase()} en pausa: necesita una pantalla nítida de {filter === 'lcd' ? 3 : 2}× o más.
        </p>
      )}
    </div>
  )
}

function ControlsSection() {
  const { controlScheme, setControlScheme } = useSettingsStore()
  const options = (Object.keys(SCHEME_LABELS) as ControlScheme[]).map((value) => ({ value, label: SCHEME_LABELS[value] }))
  return (
    <>
      <Segmented label="Esquema de controles" value={controlScheme} options={options} onChange={setControlScheme} />
      <ExtraKeys />
    </>
  )
}

function PerformanceSection() {
  const perfMonitor = useSettingsStore((s) => s.perfMonitor)
  const setPerfMonitor = useSettingsStore((s) => s.setPerfMonitor)
  return (
    <Switch
      label="Monitor de FPS y memoria"
      hint="Se muestra bajo la pantalla del juego."
      checked={perfMonitor}
      onChange={setPerfMonitor}
    />
  )
}

// Two columns when the popover is wide enough, so the whole thing fits short screens without scrolling
export function SettingsContent() {
  return (
    <div className="@container">
      <div className="flex flex-col gap-3 @lg:grid @lg:grid-cols-2 @lg:gap-x-6">
        <div className="space-y-3">
          <Section title="Sesión">
            <SessionSection />
          </Section>
          <Section title="Pantalla">
            <ScreenSection />
          </Section>
          <Section title="Rendimiento">
            <PerformanceSection />
          </Section>
        </div>
        <div className="space-y-3 border-t border-line-1 pt-3 @lg:border-t-0 @lg:border-l @lg:pt-0 @lg:pl-6">
          <Section title="Controles" className="handheld:hidden">
            <ControlsSection />
          </Section>
          <Section title="Privacidad">
            <p className="flex gap-2 text-xs text-pretty text-fg-2">
              <ShieldCheckIcon className="mt-px flex-none text-accent-hi" />
              Tu cartucho y tus partidas se guardan solo en este navegador (IndexedDB). No se suben ni se comparten.
            </p>
            <p className="flex items-center gap-1.5 text-xs text-fg-3">
              <LockIcon size={12} />
              Usa solo copias de juegos que poseas legalmente.
            </p>
          </Section>
          <Section title="Créditos" className="hidden handheld:block">
            <div className="space-y-1.5 text-xs text-fg-3">
              <Credits />
            </div>
          </Section>
          {DevTools && (
            <Suspense>
              <Section title="Desarrollo">
                <DevTools />
              </Section>
            </Suspense>
          )}
        </div>
      </div>
    </div>
  )
}
