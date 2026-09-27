import { AnimatePresence, m } from 'motion/react'
import type { CSSProperties } from 'react'
import { useEmulatorStore } from '../../store/emulatorStore'
import { CartridgeGlyph } from '../icons'
import { useDropState } from './useWindowFileDrop'

const COPY = {
  idle: {
    title: 'Suelta para insertar el cartucho',
    body: 'Solo archivos .gba. La ROM se guarda en este navegador (IndexedDB) y nunca se sube.',
    tone: 'text-fg-2',
  },
  game: {
    title: 'Suelta para cambiar de cartucho',
    body: 'Se cerrará la partida actual. Guarda dentro del juego antes de cambiar.',
    tone: 'text-warn-fg',
  },
  booting: {
    title: 'El emulador aún se está iniciando',
    body: 'Suéltala igualmente: se insertará en cuanto esté listo.',
    tone: 'text-fg-2',
  },
}

export function DropOverlay() {
  const dragging = useDropState((s) => s.dragging)
  const status = useEmulatorStore((s) => s.status)
  const copy = status === 'booting' ? COPY.booting : status === 'running' || status === 'paused' ? COPY.game : COPY.idle

  return (
    <AnimatePresence>
      {dragging && (
        <m.div
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.16 } }}
          exit={{ opacity: 0, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } }}
          className="fixed inset-0 z-50 grid place-items-center bg-[rgb(5_6_6/.86)] px-6 backdrop-blur-[8px] supports-[not(backdrop-filter:blur(1px))]:bg-[rgb(5_6_6/.96)]"
        >
          <m.div
            className="viewfinder"
            style={{ '--vf-arm': '32px', '--vf-w': '2px', color: 'var(--color-accent)', transition: 'none' } as CSSProperties}
            initial={{ inset: 48 }}
            animate={{ inset: 24, transition: { type: 'spring', stiffness: 520, damping: 32 } }}
          >
            <i />
            <i />
            <i />
            <i />
            <span className="absolute inset-0 rounded-[2px] border border-line-1" />
          </m.div>
          <div className="flex max-w-md flex-col items-center gap-3 text-center">
            <CartridgeGlyph size={80} />
            <p className="font-display text-[22px] leading-7 font-[650] tracking-[-0.02em] md:text-[28px] md:leading-8">
              {copy.title}
            </p>
            <p className={`text-[13px] leading-[18px] text-pretty ${copy.tone}`}>{copy.body}</p>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
