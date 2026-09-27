import { useEffect, useState, type ReactNode } from 'react'
import { KEYMAPS, type GbaButton, type KeyBinding } from '../../emulator/keymaps'
import { useEmulatorStore } from '../../store/emulatorStore'
import { useSettingsStore } from '../../store/settingsStore'
import { ArrowIcon, BackspaceIcon, DpadIcon, EnterIcon } from '../icons'
import { Kbd, VisuallyHidden } from '../primitives'

// The core resolves keys by keysym (layout-aware), so feedback follows event.key, not event.code
const keyId = (e: KeyboardEvent) => (e.key.length === 1 ? e.key.toLowerCase() : e.key)

function usePressedKeys(enabled: boolean) {
  const [pressed, setPressed] = useState<ReadonlySet<string>>(() => new Set())
  useEffect(() => {
    if (!enabled) return
    const onDown = (e: KeyboardEvent) => setPressed((prev) => (prev.has(keyId(e)) ? prev : new Set(prev).add(keyId(e))))
    const onUp = (e: KeyboardEvent) =>
      setPressed((prev) => {
        if (!prev.has(keyId(e))) return prev
        const next = new Set(prev)
        next.delete(keyId(e))
        return next
      })
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      setPressed(new Set())
    }
  }, [enabled])
  return pressed
}

const ARROW_LABEL: Record<string, string> = {
  ArrowUp: 'Flecha arriba',
  ArrowDown: 'Flecha abajo',
  ArrowLeft: 'Flecha izquierda',
  ArrowRight: 'Flecha derecha',
}

function keyContent(binding: KeyBinding): { content: ReactNode; label?: string } {
  if (binding.key.startsWith('Arrow')) {
    const direction = binding.key.slice(5).toLowerCase() as 'up' | 'down' | 'left' | 'right'
    return { content: <ArrowIcon direction={direction} />, label: ARROW_LABEL[binding.key] }
  }
  if (binding.key === 'Enter') return { content: <EnterIcon />, label: 'Enter' }
  if (binding.key === 'Backspace') return { content: <BackspaceIcon />, label: 'Retroceso' }
  return { content: binding.key.toUpperCase() }
}

const BADGES: { button: GbaButton; label: string; shape: 'round' | 'shoulder' | 'pill'; text: string }[] = [
  { button: 'a', label: 'Botón A', shape: 'round', text: 'A' },
  { button: 'b', label: 'Botón B', shape: 'round', text: 'B' },
  { button: 'l', label: 'Botón L', shape: 'shoulder', text: 'L' },
  { button: 'r', label: 'Botón R', shape: 'shoulder', text: 'R' },
  { button: 'start', label: 'Start', shape: 'pill', text: 'Start' },
  { button: 'select', label: 'Select', shape: 'pill', text: 'Select' },
]

function BoundKey({ binding, pressed }: { binding: KeyBinding; pressed: ReadonlySet<string> }) {
  const { content, label } = keyContent(binding)
  return (
    <Kbd label={label} pressed={pressed.has(binding.key)}>
      {content}
    </Kbd>
  )
}

// Compact, always-visible legend for the side panel; keys light up while the game has input
export function ControlsCompact() {
  const scheme = useSettingsStore((s) => s.controlScheme)
  const inputActive = useEmulatorStore((s) => s.inputActive)
  const pressed = usePressedKeys(inputActive)
  const map = KEYMAPS[scheme]

  return (
    <section aria-label="Controles" className="rounded-lg border border-line-2 bg-panel p-3 shadow-card">
      <header className="mb-2.5 flex h-5 items-center justify-between [@media(height<860px)]:mb-1.5">
        <h2 className="section-label">Controles</h2>
        <span className="text-xs text-fg-3">{scheme === 'wasd' ? 'WASD' : 'Flechas'}</span>
      </header>
      {/* Two rows in a 4-column grid: d-pad + A + B, then L + R + Start + Select */}
      <dl className="grid grid-cols-4 items-center gap-x-2 gap-y-1.5 touch-only:hidden">
        <div className="col-span-2 flex items-center gap-1.5">
          <dt className="flex text-fg-2" title="Cruceta">
            <DpadIcon />
            <VisuallyHidden>Cruceta</VisuallyHidden>
          </dt>
          <dd className="flex gap-1">
            {(scheme === 'wasd' ? (['up', 'left', 'down', 'right'] as const) : (['up', 'down', 'left', 'right'] as const)).map((d) => (
              <BoundKey key={d} binding={map[d]} pressed={pressed} />
            ))}
          </dd>
        </div>
        {BADGES.map((b) => (
          <div key={b.button} className="flex items-center justify-between gap-1">
            <dt className="flex">
              <span className="gba-badge" data-shape={b.shape} aria-hidden="true">
                {b.text}
              </span>
              <VisuallyHidden>{b.label}</VisuallyHidden>
            </dt>
            <dd>
              <BoundKey binding={map[b.button]} pressed={pressed} />
            </dd>
          </div>
        ))}
      </dl>
      <p id="legend-note" className="mt-2.5 text-xs text-fg-3 touch-only:mt-0 [@media(height<860px)]:sr-only">
        <span className="touch-only:hidden">Clic en la pantalla para jugar · Tab para salir</span>
        <span className="hidden touch-only:inline">Este emulador se controla con un teclado físico.</span>
      </p>
    </section>
  )
}

export function HoldKeys() {
  const rows = [
    { label: 'Avance rápido (2×)', key: 'F' },
    { label: 'Rebobinar', key: 'R' },
    { label: 'Salir de la pantalla', key: 'Tab' },
  ]
  return (
    <dl className="space-y-1.5">
      {rows.map((row) => (
        <div key={row.key} className="flex items-center justify-between gap-2">
          <dt className="text-[13px] text-fg-2">{row.label}</dt>
          <dd>
            <Kbd>{row.key}</Kbd>
          </dd>
        </div>
      ))}
    </dl>
  )
}
