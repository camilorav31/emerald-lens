import { AnimatePresence, m } from 'motion/react'
import { useEffect, useState } from 'react'
import { useEmulatorStore } from '../../store/emulatorStore'
import { CloseIcon } from '../icons'
import { Led } from '../primitives'

const POSITION =
  'fixed z-45 bottom-[calc(16px+env(safe-area-inset-bottom))] left-1/2 w-[calc(100%-24px)] max-w-[360px] -translate-x-1/2 touch-only:bottom-[calc(228px+env(safe-area-inset-bottom))] handheld:top-[calc(var(--topbar-h)+env(safe-area-inset-top)+8px)] handheld:bottom-auto lg:bottom-14 lg:left-auto lg:right-6 lg:w-[360px] lg:translate-x-0'

const enter = { opacity: 0, y: 12 }
const shown = { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 420, damping: 32 } }
const leave = { opacity: 0, transition: { duration: 0.15 } }

export function Toaster() {
  const error = useEmulatorStore((s) => s.error)
  const status = useEmulatorStore((s) => s.status)
  const notice = useEmulatorStore((s) => s.notice)
  const dismissError = useEmulatorStore((s) => s.dismissError)
  const dismissNotice = useEmulatorStore((s) => s.dismissNotice)
  const [held, setHeld] = useState(false)

  // Inline homes: invalid files show in the idle drop zone, core failures inside the screen
  const toastError = error && error.kind !== 'core' && !(error.kind === 'invalid-file' && status === 'idle') ? error : null
  const toastNotice = !toastError ? notice : null

  useEffect(() => {
    if (!toastNotice || held) return
    const timer = setTimeout(dismissNotice, 4000)
    return () => clearTimeout(timer)
  }, [toastNotice, held, dismissNotice])

  return (
    <div className={POSITION}>
      <AnimatePresence mode="wait">
        {toastError ? (
          <m.div
            key={`err-${toastError.kind}-${toastError.title}`}
            role="alert"
            initial={enter}
            animate={shown}
            exit={leave}
            className="grid grid-cols-[6px_1fr_28px] items-start gap-3 rounded-[12px] border border-err-line bg-float px-3.5 py-3 shadow-float"
          >
            <Led tone="err" className="mt-[7px]" />
            <div>
              <p className="font-medium text-fg-1">{toastError.title}</p>
              {toastError.message && <p className="text-[13px] leading-[18px] text-fg-2">{toastError.message}</p>}
            </div>
            <button
              type="button"
              onClick={dismissError}
              aria-label="Cerrar aviso"
              className="relative grid size-7 place-items-center rounded-md text-fg-2 before:absolute before:-inset-2 before:content-[''] transition-colors duration-150 hover:bg-fg-1/5 hover:text-fg-1"
            >
              <CloseIcon size={14} />
            </button>
          </m.div>
        ) : toastNotice ? (
          <m.div
            key="notice"
            role="status"
            initial={enter}
            animate={shown}
            exit={leave}
            onPointerEnter={() => setHeld(true)}
            onPointerLeave={() => setHeld(false)}
            onFocus={() => setHeld(true)}
            onBlur={() => setHeld(false)}
            className="flex items-center gap-3 rounded-[12px] border border-line-3 bg-float px-3.5 py-3 shadow-float"
          >
            <Led tone="accent" />
            <p className="flex-1 text-[13px] leading-[18px] text-fg-1">{toastNotice}</p>
            <button
              type="button"
              onClick={dismissNotice}
              aria-label="Cerrar aviso"
              className="relative grid size-7 place-items-center rounded-md text-fg-2 before:absolute before:-inset-2 before:content-[''] transition-colors duration-150 hover:bg-fg-1/5 hover:text-fg-1"
            >
              <CloseIcon size={14} />
            </button>
          </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
