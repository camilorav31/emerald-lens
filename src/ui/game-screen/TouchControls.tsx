import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import type { GbaButton } from '../../emulator/keymaps'
import { hasGame, useEmulatorStore } from '../../store/emulatorStore'
import { ArrowIcon } from '../icons'
import { noFocus } from './noFocus'

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
    // a lost pointerup (rotation, call, app switch) must never leave a button stuck down
    document.addEventListener('visibilitychange', releaseAll)
    window.addEventListener('blur', releaseAll)
    window.addEventListener('pagehide', releaseAll)
    window.addEventListener('orientationchange', releaseAll)
    return () => {
      unsubscribe()
      document.removeEventListener('visibilitychange', releaseAll)
      window.removeEventListener('blur', releaseAll)
      window.removeEventListener('pagehide', releaseAll)
      window.removeEventListener('orientationchange', releaseAll)
      releaseAll()
    }
  }, [set])

  return [held, set]
}

// Keyboard, switch and voice-control activation arrives as a click with no pointer: press briefly
function tap(set: SetButton, button: GbaButton) {
  set(button, true)
  setTimeout(() => set(button, false), 90)
}

function PadButton({
  button,
  label,
  held,
  set,
  idle,
  className,
  children,
}: {
  button: GbaButton
  label: string
  held: Held
  set: SetButton
  idle: boolean
  className: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={label}
      aria-disabled={idle || undefined}
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
      onClick={(e) => e.detail === 0 && tap(set, button)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  )
}

const DIRECTIONS = ['up', 'right', 'down', 'left'] as const
const DIRECTION_NAMES = { up: 'Arriba', right: 'Derecha', down: 'Abajo', left: 'Izquierda' }

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
      {DIRECTIONS.map((d) => (
        <button key={d} type="button" tabIndex={-1} className="sr-only" onClick={() => tap(set, d)}>
          {DIRECTION_NAMES[d]}
        </button>
      ))}
    </div>
  )
}

// On-screen gamepad for touch devices. `fixed` floats over the page (tablets, landscape phones);
// `dock` sits in the flow at the bottom of the portrait-phone layout.
export function TouchControls({ variant = 'fixed' }: { variant?: 'fixed' | 'dock' }) {
  const loaded = useEmulatorStore((s) => hasGame(s.status))
  const running = useEmulatorStore((s) => s.status === 'running')
  const [held, set] = useHeldButtons()
  const dock = variant === 'dock'
  if (!loaded && !dock) return null
  const props = { held, set, idle: !running }

  return (
    <>
      {!dock && <div className={PAD_SPACE} aria-hidden="true" />}
      <section
        aria-label="Controles táctiles"
        data-idle={!running || undefined}
        className={dock ? 'touch-pad touch-pad--dock hidden handheld:grid' : 'touch-pad hidden touch-only:grid handheld:hidden'}
      >
        <PadButton {...props} button="l" label="L" className="touch-pad__shoulder touch-pad__shoulder--l">
          L
        </PadButton>
        <PadButton {...props} button="r" label="R" className="touch-pad__shoulder touch-pad__shoulder--r">
          R
        </PadButton>

        <Dpad held={held} set={set} />

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
