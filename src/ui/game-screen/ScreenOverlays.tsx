import { AnimatePresence, m } from 'motion/react'
import { useEffect, useRef, useState, type RefObject } from 'react'
import { useEmulatorStore } from '../../store/emulatorStore'
import { GemMark } from '../brand/GemMark'
import { AlertIcon, PlayIcon, PointerIcon } from '../icons'
import { IdleDropZone } from '../rom-loader/IdleDropZone'
import { Button, Kbd } from '../primitives'

const TOUCH_ONLY = '(hover: none) and (pointer: coarse)'

function useDelayed(active: boolean, delayMs: number) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    if (!active) {
      setShown(false)
      return
    }
    const timer = setTimeout(() => setShown(true), delayMs)
    return () => clearTimeout(timer)
  }, [active, delayMs])
  return shown
}

function BootSkeleton() {
  const shown = useDelayed(true, 150)
  return (
    <div className="absolute inset-0 z-3" aria-busy="true">
      {shown && (
        <div className="skeleton absolute inset-0 grid place-items-center rounded-none bg-surface-1">
          <div className="relative flex flex-col items-center gap-2 text-center">
            <GemMark size={28} className="opacity-40" />
            <p className="text-[13px] leading-[18px] text-fg-2">Iniciando el emulador</p>
            <p className="text-xs text-fg-3">mGBA · WebAssembly</p>
          </div>
        </div>
      )}
    </div>
  )
}

function PausePlate() {
  const togglePause = useEmulatorStore((s) => s.togglePause)
  return (
    <m.div
      className="absolute inset-0 z-3 grid place-items-center bg-bg-0/60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.2 } }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >
      <m.div
        className="flex items-center gap-4 rounded-[12px] border border-line-3 bg-float px-[18px] py-[14px] shadow-float"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 500, damping: 36 } }}
      >
        <span className="flex gap-[3px]" aria-hidden="true">
          <i className="h-3 w-[3px] rounded-[1px] bg-accent" />
          <i className="h-3 w-[3px] rounded-[1px] bg-accent" />
        </span>
        <p className="font-display text-[22px] leading-7 font-semibold tracking-[-0.015em] [@container_lens_(width<360px)]:text-[18px]">
          En pausa
        </p>
        <Button variant="primary" size="sm" icon={<PlayIcon />} onClick={togglePause}>
          <span className="[@container_lens_(width<360px)]:sr-only">Reanudar</span>
        </Button>
      </m.div>
    </m.div>
  )
}

function InputPill({ lens }: { lens: RefObject<HTMLDivElement | null> }) {
  const status = useEmulatorStore((s) => s.status)
  const inputActive = useEmulatorStore((s) => s.inputActive)
  const idle = status === 'running' && !inputActive
  const armed = useDelayed(idle, 150)
  const [visible, setVisible] = useState(false)
  const [firstHint, setFirstHint] = useState(false)
  const hinted = useRef(false)
  const touchOnly = typeof window !== 'undefined' && window.matchMedia(TOUCH_ONLY).matches

  useEffect(() => {
    if (!armed) {
      setVisible(false)
      return
    }
    setVisible(true)
    const hide = setTimeout(() => setVisible(false), touchOnly ? 4000 : 5000)
    const el = lens.current
    const show = () => setVisible(true)
    el?.addEventListener('pointerenter', show)
    return () => {
      clearTimeout(hide)
      el?.removeEventListener('pointerenter', show)
    }
  }, [armed, lens, touchOnly])

  useEffect(() => {
    if (!inputActive || hinted.current) return
    hinted.current = true
    setFirstHint(true)
    const timer = setTimeout(() => setFirstHint(false), 2500)
    return () => clearTimeout(timer)
  }, [inputActive])

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-4 flex justify-center px-3" aria-hidden="true">
      <AnimatePresence>
        {visible && idle && (
          <m.div
            key="invite"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            className="flex items-center gap-2 rounded-full border border-line-3 bg-bg-0/90 px-3.5 py-2"
          >
            <PointerIcon className="text-fg-2" />
            {touchOnly ? (
              <span className="text-[13px] leading-[18px] text-fg-1">Este emulador se controla con teclado</span>
            ) : (
              <span className="flex flex-col text-left">
                <span className="text-[13px] leading-[18px] text-fg-1">Haz clic en la pantalla para jugar</span>
                <span className="text-xs text-fg-2 [@container_lens_(width<360px)]:hidden">o navega hasta ella con Tab</span>
              </span>
            )}
          </m.div>
        )}
        {firstHint && inputActive && (
          <m.div
            key="hint"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            className="flex items-center gap-2 rounded-full border border-line-3 bg-bg-0/90 px-3.5 py-2 text-[13px] leading-[18px] text-fg-1"
          >
            Controles activos · <Kbd size="mini">Tab</Kbd> para salir
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CoreError() {
  const error = useEmulatorStore((s) => s.error)
  return (
    <div className="absolute inset-0 z-3 grid place-items-center overflow-auto bg-lens-idle p-4 text-center">
      <div className="flex max-w-md flex-col items-center gap-3">
        <AlertIcon size={24} className="text-err-fg" />
        <h2 className="font-display text-[22px] leading-7 font-semibold">No se pudo iniciar el emulador</h2>
        {error?.message && (
          <pre className="max-h-[4.5rem] max-w-full overflow-auto rounded-md bg-well px-3 py-2 text-left font-mono text-xs whitespace-pre-wrap text-fg-2">
            {error.message}
          </pre>
        )}
        <Button variant="primary" onClick={() => location.reload()}>
          Recargar página
        </Button>
      </div>
    </div>
  )
}

// Black cover that fades out on idle -> running so the first frames never flash
function PowerOnCover() {
  return (
    <m.div
      className="pointer-events-none absolute inset-0 z-3 bg-black"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0, transition: { duration: 0.3 } }}
      aria-hidden="true"
    />
  )
}

export function ScreenOverlays({ lens }: { lens: RefObject<HTMLDivElement | null> }) {
  const status = useEmulatorStore((s) => s.status)
  const romName = useEmulatorStore((s) => s.romName)

  return (
    <>
      {status === 'booting' && <BootSkeleton />}
      {status === 'idle' && <IdleDropZone />}
      {status === 'error' && <CoreError />}
      {(status === 'running' || status === 'paused') && <PowerOnCover key={romName} />}
      <AnimatePresence>{status === 'paused' && <PausePlate key="pause" />}</AnimatePresence>
      <InputPill lens={lens} />
    </>
  )
}
