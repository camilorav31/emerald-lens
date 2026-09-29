import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import type { GbaButton } from '../../emulator/keymaps'
import { hasGame, useEmulatorStore } from '../../store/emulatorStore'
import { useSettingsStore } from '../../store/settingsStore'
import { ArrowIcon, GearIcon, PauseIcon, PlayIcon, SoundIcon } from '../icons'
import { PopoverButton } from '../panel/Popover'
import { returnToGame } from './returnToGame'
import { SettingsContent } from '../panel/SettingsContent'

// Height reserved at the end of the page so the fixed pad never hides the party or the footer
const PAD_SPACE = 'hidden touch-only:block handheld:hidden h-[calc(212px+env(safe-area-inset-bottom))]'

type Held = ReadonlySet<GbaButton>
type SetButton = (button: GbaButton, pressed: boolean) => void

// Presses go straight to the core's key mask. A press needs a running game; a release always goes through.
function useHeldButtons(): [Held, SetButton] {
  const [held, setHeld] = useState<Held>(() => new Set())
  const current = useRef(new Set<GbaButton>())

  const set = useCallback<SetButton>((button, pressed) => {
    if (current.current.has(button) === pressed) return
    const { emulator, status } = useEmulatorStore.getState()
    if (pressed && status !== 'running') return
    if (pressed) current.current.add(button)
    else current.current.delete(button)
    emulator?.setButton(button, pressed)
    setHeld(new Set(current.current))
  }, [])

  useEffect(() => {
    const releaseAll = () => {
      for (const button of [...current.current]) set(button, false)
    }
    const unsubscribe = useEmulatorStore.subscribe((state, prev) => {
      if (state.status !== 'running' && prev.status === 'running') releaseAll()
    })
    document.addEventListener('visibilitychange', releaseAll)
    window.addEventListener('blur', releaseAll)
    return () => {
      unsubscribe()
      document.removeEventListener('visibilitychange', releaseAll)
      window.removeEventListener('blur', releaseAll)
      releaseAll()
    }
  }, [set])

  return [held, set]
}

// Never takes focus: moving it off the game screen would make the core drop every held button
const noFocus = (e: PointerEvent) => e.preventDefault()

function PadButton({
  button,
  label,
  held,
  set,
  className,
  children,
}: {
  button: GbaButton
  label: string
  held: Held
  set: SetButton
  className: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={label}
      data-pressed={held.has(button) || undefined}
      className={`touch-pad__btn ${className}`}
      onPointerDown={(e) => {
        noFocus(e)
        set(button, true)
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerUp={() => set(button, false)}
      onPointerCancel={() => set(button, false)}
      onLostPointerCapture={() => set(button, false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  )
}

const DIRECTIONS = ['up', 'right', 'down', 'left'] as const

// One surface for the whole cross, so a thumb can slide between directions (and into diagonals)
function Dpad({ held, set }: { held: Held; set: SetButton }) {
  const ref = useRef<HTMLDivElement>(null)

  const apply = (e: PointerEvent) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    const ax = Math.abs(x)
    const ay = Math.abs(y)
    const dead = 0.12
    // the weaker axis joins in only when the thumb is roughly diagonal
    set('left', x < -dead && ax >= ay * 0.5)
    set('right', x > dead && ax >= ay * 0.5)
    set('up', y < -dead && ay >= ax * 0.5)
    set('down', y > dead && ay >= ax * 0.5)
  }
  const release = () => DIRECTIONS.forEach((d) => set(d, false))

  return (
    <div
      ref={ref}
      role="group"
      aria-label="Cruceta"
      className="touch-pad__dpad"
      onPointerDown={(e) => {
        noFocus(e)
        apply(e)
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && apply(e)}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(e) => e.preventDefault()}
    >
      {DIRECTIONS.map((d) => (
        <span key={d} className="touch-pad__arrow" data-dir={d} data-pressed={held.has(d) || undefined}>
          <ArrowIcon direction={d} size={18} />
        </span>
      ))}
    </div>
  )
}

function PadUtilities() {
  const status = useEmulatorStore((s) => s.status)
  const togglePause = useEmulatorStore((s) => s.togglePause)
  const muted = useSettingsStore((s) => s.muted)
  const toggleMuted = useSettingsStore((s) => s.toggleMuted)
  const fastForward = useSettingsStore((s) => s.fastForward)
  const toggleFastForward = useSettingsStore((s) => s.toggleFastForward)
  const loaded = hasGame(status)

  return (
    <div className="touch-pad__utils">
      {loaded && (
        <>
          <button
            type="button"
            tabIndex={-1}
            className="touch-pad__btn touch-pad__util"
            aria-label={status === 'running' ? 'Pausar' : 'Reanudar'}
            onPointerDown={noFocus}
            onClick={togglePause}
          >
            {status === 'running' ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button
            type="button"
            tabIndex={-1}
            className="touch-pad__btn touch-pad__util"
            aria-label="Música y sonido"
            aria-pressed={!muted}
            onPointerDown={noFocus}
            onClick={toggleMuted}
          >
            <SoundIcon muted={muted} />
          </button>
          <button
            type="button"
            tabIndex={-1}
            className="touch-pad__btn touch-pad__util"
            aria-label="Velocidad ×2"
            aria-pressed={fastForward}
            onPointerDown={noFocus}
            onClick={toggleFastForward}
          >
            ×2
          </button>
        </>
      )}
      <PopoverButton
        label="Ajustes"
        title="Ajustes"
        icon={<GearIcon />}
        width={560}
        placement="above"
        buttonClassName="touch-pad__btn touch-pad__util"
        onClose={returnToGame}
      >
        <SettingsContent />
      </PopoverButton>
    </div>
  )
}

// On-screen gamepad for touch devices. `fixed` floats over the page (tablets, landscape phones);
// `dock` sits in the flow at the bottom of the handheld layout and also carries the utility buttons.
export function TouchControls({ variant = 'fixed' }: { variant?: 'fixed' | 'dock' }) {
  const loaded = useEmulatorStore((s) => hasGame(s.status))
  const [held, set] = useHeldButtons()
  const dock = variant === 'dock'
  if (!loaded && !dock) return null
  const props = { held, set }

  return (
    <>
      {!dock && <div className={PAD_SPACE} aria-hidden="true" />}
      <section
        aria-label="Controles táctiles"
        data-idle={!loaded || undefined}
        className={dock ? 'touch-pad touch-pad--dock hidden handheld:grid' : 'touch-pad hidden touch-only:grid handheld:hidden'}
      >
        <PadButton {...props} button="l" label="L" className="touch-pad__shoulder touch-pad__shoulder--l">
          L
        </PadButton>
        <PadButton {...props} button="r" label="R" className="touch-pad__shoulder touch-pad__shoulder--r">
          R
        </PadButton>
        {dock && <PadUtilities />}

        <Dpad {...props} />

        <div className="touch-pad__center">
          <PadButton {...props} button="select" label="Select" className="touch-pad__pill">
            <span aria-hidden="true">Select</span>
          </PadButton>
          <PadButton {...props} button="start" label="Start" className="touch-pad__pill">
            <span aria-hidden="true">Start</span>
          </PadButton>
        </div>

        <div className="touch-pad__face">
          <PadButton {...props} button="b" label="Botón B" className="touch-pad__round touch-pad__round--b">
            B
          </PadButton>
          <PadButton {...props} button="a" label="Botón A" className="touch-pad__round touch-pad__round--a">
            A
          </PadButton>
        </div>
      </section>
    </>
  )
}
