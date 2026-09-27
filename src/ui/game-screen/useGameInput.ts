import { useEffect, type RefObject } from 'react'
import { announce } from '../../store/announcer'
import { useEmulatorStore } from '../../store/emulatorStore'
import { useSettingsStore } from '../../store/settingsStore'

// Keys that would scroll a stacked layout while playing
const NAV_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'PageUp', 'PageDown', 'Home', 'End'])

const TABBABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function focusAdjacentTabbable(from: HTMLElement, step: 1 | -1) {
  const all = [...document.querySelectorAll<HTMLElement>(TABBABLE)].filter(
    (el) => !el.closest('[inert]') && !el.hidden && el.getClientRects().length > 0,
  )
  const next = all[all.indexOf(from) + step]
  if (next) next.focus()
  else from.blur()
}

// Game keys reach the core only while the screen is focused, the window is focused, a game is
// running and no key is held (so the Enter that clicked "Reanudar" never becomes a Start press).
export function useGameInput(canvasRef: RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const held = new Set<string>()
    let frame = 0

    const setActive = (active: boolean) => {
      const { inputActive, status, setInputActive } = useEmulatorStore.getState()
      if (inputActive === active) return
      setInputActive(active)
      if (status === 'running') announce(active ? 'Teclado del juego activo. Pulsa Tab para salir.' : 'Teclado del juego inactivo.')
    }

    const wanted = () =>
      document.activeElement === canvas &&
      document.hasFocus() &&
      document.visibilityState === 'visible' &&
      useEmulatorStore.getState().status === 'running'

    const evaluate = () => {
      cancelAnimationFrame(frame)
      if (!wanted()) {
        setActive(false)
        return
      }
      if (useEmulatorStore.getState().inputActive || held.size > 0) return
      frame = requestAnimationFrame(() => {
        if (wanted() && held.size === 0) setActive(true)
      })
    }

    const onKeyDown = (e: KeyboardEvent) => held.add(e.code)
    const onKeyUp = (e: KeyboardEvent) => {
      held.delete(e.code)
      if (held.size === 0) evaluate()
    }
    const onWindowBlur = () => {
      held.clear()
      evaluate()
    }
    const onCanvasKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        // synchronous, so SDL's key events are off before the core's window listener sees anything
        cancelAnimationFrame(frame)
        setActive(false)
        e.preventDefault()
        focusAdjacentTabbable(canvas, e.shiftKey ? -1 : 1)
        return
      }
      // The core hardwires hold-F (2x) and hold-R (rewind); keep both away from it. F toggles 2x instead.
      const key = e.key.toLowerCase()
      if (key === 'f' || key === 'r') {
        e.stopPropagation()
        if (key === 'f' && !e.repeat && useEmulatorStore.getState().inputActive) useSettingsStore.getState().toggleFastForward()
        return
      }
      if (useEmulatorStore.getState().inputActive && NAV_KEYS.has(e.code)) e.preventDefault()
    }
    const onCanvasKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key === 'f' || key === 'r') e.stopPropagation()
    }

    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('keyup', onKeyUp, true)
    document.addEventListener('visibilitychange', evaluate)
    window.addEventListener('blur', onWindowBlur)
    window.addEventListener('focus', evaluate)
    canvas.addEventListener('focus', evaluate)
    canvas.addEventListener('blur', evaluate)
    canvas.addEventListener('keydown', onCanvasKeyDown)
    canvas.addEventListener('keyup', onCanvasKeyUp)
    const unsubscribe = useEmulatorStore.subscribe((state, prev) => {
      if (state.status !== prev.status) evaluate()
    })

    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('keyup', onKeyUp, true)
      document.removeEventListener('visibilitychange', evaluate)
      window.removeEventListener('blur', onWindowBlur)
      window.removeEventListener('focus', evaluate)
      canvas.removeEventListener('focus', evaluate)
      canvas.removeEventListener('blur', evaluate)
      canvas.removeEventListener('keydown', onCanvasKeyDown)
      canvas.removeEventListener('keyup', onCanvasKeyUp)
      unsubscribe()
    }
  }, [canvasRef])
}
