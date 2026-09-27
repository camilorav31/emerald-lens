import { lazy, Suspense, useState, type ReactNode } from 'react'
import { SCHEME_LABELS, type ControlScheme } from '../../emulator/keymaps'
import { hasGame, isSupportedGame, useEmulatorStore } from '../../store/emulatorStore'
import { useSettingsStore, type ScreenFilter } from '../../store/settingsStore'
import type { ScaleMode } from '../game-screen/computeScale'
import { useScreenScale } from '../game-screen/screenScaleStore'
import { crtAvailable, lcdAvailable } from '../game-screen/useIntegerScale'
import { CartridgeIcon, CheckIcon, LockIcon, ShieldCheckIcon, WarningIcon } from '../icons'
import { Button, Led, Segmented } from '../primitives'
import { useRomPicker } from '../rom-loader/useRomPicker'
import { HoldKeys } from './KeyboardLegend'

const DevTools = import.meta.env.DEV ? lazy(() => import('./DevTools')) : null

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2.5 border-t border-line-1 pt-3 first:border-t-0 first:pt-0">
      <h3 className="text-[13px] font-medium text-fg-1">{title}</h3>
      {children}
    </section>
  )
}

function GameCodeChip({ code }: { code: string | null }) {
  const base = 'inline-flex h-[22px] items-center gap-1.5 rounded-sm border px-2 text-xs'
  if (code === null) return <span className={`${base} border-line-2 bg-surface-3 text-fg-2`}>Código no disponible</span>
  if (isSupportedGame(code)) {
    return (
      <span className={`${base} border-accent-line bg-accent-tint text-accent-hi`}>
        <CheckIcon size={12} />
        <span className="font-mono font-medium">{code}</span> · soportado
      </span>
    )
  }
  return (
    <span className={`${base} border-warn-line bg-warn-tint text-warn-fg`}>
      <WarningIcon size={12} />
      <span className="font-mono font-medium">{code}</span> · no soportado
    </span>
  )
}

function SessionSection() {
  const status = useEmulatorStore((s) => s.status)
  const romName = useEmulatorStore((s) => s.romName)
  const gameCode = useEmulatorStore((s) => s.gameCode)
  const memoryAccess = useEmulatorStore((s) => s.memoryAccess)
  const version = useEmulatorStore((s) => s.emulator?.version)

  if (!hasGame(status) || !romName) {
    return <p className="text-xs text-fg-3">Sin cartucho insertado.</p>
  }
  return (
    <dl className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-y-2 text-[13px]">
      <dt className="text-fg-3">ROM</dt>
      <dd className="truncate text-fg-1" title={romName}>
        {romName}
      </dd>
      <dt className="text-fg-3">Juego</dt>
      <dd>
        <GameCodeChip code={gameCode} />
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

const SCALE_OPTIONS: { value: ScaleMode; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'integer', label: 'Entera' },
  { value: 'fit', label: 'Ajustar' },
]

function ScreenSection() {
  const { scaleMode, setScaleMode, filter, setFilter } = useSettingsStore()
  const scale = useScreenScale((s) => s.scale)
  const lcd = lcdAvailable(scale)
  const crt = crtAvailable(scale)
  const blocked = (filter === 'lcd' && !lcd) || (filter === 'crt' && !crt)
  const filterOptions: { value: ScreenFilter; label: string; disabled?: boolean }[] = [
    { value: 'none', label: 'Ninguno' },
    { value: 'lcd', label: 'LCD', disabled: !lcd && filter !== 'lcd' },
    { value: 'crt', label: 'CRT', disabled: !crt && filter !== 'crt' },
  ]
  return (
    <>
      <div className="space-y-1.5">
        <p className="text-xs text-fg-3">Escala</p>
        <Segmented label="Escala" value={scaleMode} options={SCALE_OPTIONS} onChange={setScaleMode} />
      </div>
      <div className="space-y-1.5">
        <p className="text-xs text-fg-3">Filtro</p>
        <Segmented label="Filtro" value={filter} options={filterOptions} onChange={setFilter} />
        {blocked && (
          <p className="text-xs text-pretty text-fg-3">
            {filter.toUpperCase()} en pausa: necesita escala nítida de {filter === 'lcd' ? 3 : 2}× o más.
          </p>
        )}
      </div>
    </>
  )
}

function ControlsSection() {
  const { controlScheme, setControlScheme } = useSettingsStore()
  const options = (Object.keys(SCHEME_LABELS) as ControlScheme[]).map((value) => ({ value, label: SCHEME_LABELS[value] }))
  return (
    <>
      <Segmented label="Esquema de controles" value={controlScheme} options={options} onChange={setControlScheme} />
      <p className="text-xs text-fg-3">
        {controlScheme === 'wasd'
          ? 'Cruceta con W A S D · A = K, B = J, L = Q, R = E.'
          : 'Cruceta con flechas · A = X, B = Z, L = A, R = S.'}
      </p>
      <HoldKeys />
    </>
  )
}

function RomsSection() {
  const storedRoms = useEmulatorStore((s) => s.storedRoms)
  const status = useEmulatorStore((s) => s.status)
  const romName = useEmulatorStore((s) => s.romName)
  const start = useEmulatorStore((s) => s.start)
  const [confirming, setConfirming] = useState<string | null>(null)
  const picker = useRomPicker()
  const loaded = hasGame(status)

  return (
    <>
      <ul className="space-y-1">
        {storedRoms.map((rom) => {
          const current = loaded && rom === romName
          return (
            <li key={rom} className="rounded-md border border-line-1">
              <button
                type="button"
                aria-current={current || undefined}
                aria-disabled={current || status === 'booting' || undefined}
                onClick={() => {
                  if (current || status === 'booting') return
                  if (loaded) setConfirming(rom)
                  else start(rom)
                }}
                className="grid h-9 w-full grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-2 rounded-md px-2.5 text-left text-[13px] transition-colors duration-150 hover:bg-surface-3 aria-disabled:cursor-default aria-disabled:hover:bg-transparent"
              >
                <CartridgeIcon className="text-fg-3" />
                <span className="truncate text-fg-1">{rom}</span>
                <span className="flex items-center gap-1.5 text-xs text-fg-2">
                  {current ? (
                    <>
                      <Led tone="accent" />
                      En curso
                    </>
                  ) : (
                    <span className="text-accent-hi">Jugar →</span>
                  )}
                </span>
              </button>
              {confirming === rom && (
                <div className="space-y-2 px-2.5 pb-2.5">
                  <p className="text-xs text-fg-2">Se cerrará la partida actual. Guarda dentro del juego antes.</p>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setConfirming(null)
                        start(rom)
                      }}
                    >
                      Cambiar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirming(null)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
      <Button size="sm" className="w-full" onClick={picker.open} inactive={status === 'booting'}>
        Cargar otra ROM
      </Button>
      {picker.input}
    </>
  )
}

export function SettingsContent() {
  return (
    <div className="space-y-3">
      <Section title="Sesión">
        <SessionSection />
      </Section>
      <Section title="Pantalla">
        <ScreenSection />
      </Section>
      <Section title="Controles">
        <ControlsSection />
      </Section>
      <Section title="Cartuchos en este navegador">
        <RomsSection />
      </Section>
      <Section title="Privacidad">
        <p className="flex gap-2 text-xs text-pretty text-fg-2">
          <ShieldCheckIcon className="mt-px flex-none text-accent" />
          Tu ROM y tus partidas se guardan solo en este navegador (IndexedDB). No se suben ni se comparten.
        </p>
        <p className="flex items-center gap-1.5 text-xs text-fg-3">
          <LockIcon size={12} />
          Usa solo copias de juegos que poseas legalmente.
        </p>
      </Section>
      {DevTools && (
        <Suspense>
          <Section title="Desarrollo">
            <DevTools />
          </Section>
        </Suspense>
      )}
    </div>
  )
}
