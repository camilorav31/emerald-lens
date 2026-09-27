import { useEffect, useState, type ReactNode } from 'react'
import { KEYMAPS, SCHEME_LABELS, type GbaButton, type KeyBinding } from '../../emulator/keymaps'
import { useEmulatorStore } from '../../store/emulatorStore'
import { useSettingsStore } from '../../store/settingsStore'
import { ArrowIcon, BackspaceIcon, EnterIcon } from '../icons'
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
  ArrowUp: 'flecha arriba',
  ArrowDown: 'flecha abajo',
  ArrowLeft: 'flecha izquierda',
  ArrowRight: 'flecha derecha',
}

function keyContent(binding: KeyBinding): { content: ReactNode; label: string } {
  if (binding.key.startsWith('Arrow')) {
    const direction = binding.key.slice(5).toLowerCase() as 'up' | 'down' | 'left' | 'right'
    return { content: <ArrowIcon direction={direction} />, label: ARROW_LABEL[binding.key] }
  }
  if (binding.key === 'Enter') return { content: <EnterIcon />, label: 'Enter' }
  if (binding.key === 'Backspace') return { content: <BackspaceIcon />, label: 'Retroceso' }
  return { content: binding.key.toUpperCase(), label: binding.key.toUpperCase() }
}

function BoundKey({ binding, pressed, size }: { binding: KeyBinding; pressed: boolean; size?: 'mini' }) {
  const { content } = keyContent(binding)
  return (
    <Kbd pressed={pressed} size={size}>
      {content}
    </Kbd>
  )
}

const DPAD: { button: GbaButton; area: string; name: string }[] = [
  { button: 'up', area: '1 / 2', name: 'Arriba' },
  { button: 'left', area: '2 / 1', name: 'Izquierda' },
  { button: 'right', area: '2 / 3', name: 'Derecha' },
  { button: 'down', area: '3 / 2', name: 'Abajo' },
]

// Always-visible controls, laid out like a Game Boy Advance; buttons light up while the game has input
export function ControlsCompact() {
  const scheme = useSettingsStore((s) => s.controlScheme)
  const inputActive = useEmulatorStore((s) => s.inputActive)
  const pressed = usePressedKeys(inputActive)
  const map = KEYMAPS[scheme]
  const isDown = (button: GbaButton) => pressed.has(map[button].key)
  const sr = (name: string, button: GbaButton) => <VisuallyHidden>{`${name}: tecla ${keyContent(map[button]).label}. `}</VisuallyHidden>

  return (
    <section aria-label="Controles" className="gba-pad touch-only:hidden">
      {(['l', 'r'] as const).map((side) => (
        <span key={side} className="gba-pad__shoulder" data-side={side} data-pressed={isDown(side) || undefined}>
          <span aria-hidden="true">{side.toUpperCase()}</span>
          <BoundKey binding={map[side]} pressed={isDown(side)} size="mini" />
          {sr(`Gatillo ${side.toUpperCase()}`, side)}
        </span>
      ))}

      <div className="gba-pad__body">
        <div className="gba-dpad" role="group" aria-label="Cruceta">
          {DPAD.map(({ button, area, name }) => (
            <span key={button} style={{ gridArea: area }}>
              <BoundKey binding={map[button]} pressed={isDown(button)} />
              {sr(name, button)}
            </span>
          ))}
        </div>

        <div className="flex min-w-0 flex-col items-center gap-2.5">
          <div className="gba-center">
            {(['select', 'start'] as const).map((button) => (
              <span key={button} className="gba-center__btn">
                <span className="gba-pill" data-pressed={isDown(button) || undefined} aria-hidden="true" />
                <span aria-hidden="true">{button}</span>
                <BoundKey binding={map[button]} pressed={isDown(button)} size="mini" />
                {sr(button === 'start' ? 'Start' : 'Select', button)}
              </span>
            ))}
          </div>
          <p id="legend-note" className="text-center text-[10px] leading-3 text-fg-3">
            {SCHEME_LABELS[scheme]} · <span className="whitespace-nowrap">Tab para salir</span>
          </p>
        </div>

        <div className="gba-face">
          {(['b', 'a'] as const).map((button) => (
            <span key={button} className="gba-face__btn" data-button={button}>
              <span className="gba-round" data-pressed={isDown(button) || undefined} aria-hidden="true">
                {button.toUpperCase()}
              </span>
              <BoundKey binding={map[button]} pressed={isDown(button)} size="mini" />
              {sr(`Botón ${button.toUpperCase()}`, button)}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ExtraKeys() {
  const rows = [
    { label: 'Velocidad ×2 (activar / desactivar)', key: 'F' },
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
