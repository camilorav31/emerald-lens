import { useEffect, useState } from 'react'
import { useEmulatorStore } from '../../store/emulatorStore'
import { useDropState } from '../drop/useWindowFileDrop'
import { CartridgeGlyph, LockIcon } from '../icons'
import { Button, Led } from '../primitives'
import { useRomPicker } from './useRomPicker'

// Shown only until the visitor inserts their Emerald cartridge once; after that it autostarts
export function IdleDropZone() {
  const importing = useEmulatorStore((s) => s.importing)
  const error = useEmulatorStore((s) => s.error)
  const dismissError = useEmulatorStore((s) => s.dismissError)
  const dragging = useDropState((s) => s.dragging)
  const [hover, setHover] = useState(false)
  const picker = useRomPicker()

  const invalid = error?.kind === 'invalid-file'
  useEffect(() => {
    if (!invalid) return
    const timer = setTimeout(dismissError, 6000)
    return () => clearTimeout(timer)
  }, [invalid, dismissError])

  const bracketColor = invalid ? 'var(--color-err)' : dragging ? 'var(--color-accent)' : hover ? 'var(--color-accent-line)' : undefined

  return (
    <div
      className={`absolute inset-0 z-3 grid place-items-center px-4 text-center transition-colors duration-200 ${dragging ? 'bg-accent-tint' : 'bg-lens-idle'}`}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onClick={(event) => {
        if (event.target === event.currentTarget && !importing) picker.open()
      }}
    >
      <div
        className="viewfinder max-md:[--vf-inset:8px]"
        style={{ color: bracketColor, inset: hover || dragging ? 12 : undefined }}
        aria-hidden="true"
      >
        <i />
        <i />
        <i />
        <i />
      </div>

      <div className="relative flex max-w-[440px] flex-col items-center gap-3">
        <span className="[@container_lens_(height<260px)]:hidden">
          <CartridgeGlyph />
        </span>
        <h2 className="font-display text-[28px] leading-8 font-[650] tracking-[-0.02em] text-fg-1 [@container_lens_(height<180px)]:hidden [@container_lens_(height<260px)]:text-[20px] [@container_lens_(height<260px)]:leading-6">
          {dragging ? 'Suelta para insertar' : 'Inserta tu cartucho'}
        </h2>
        <p className="text-[13px] leading-[18px] text-pretty text-fg-2 [@container_lens_(height<260px)]:hidden">
          Carga tu copia de Pokémon Esmeralda (USA/Europa). Solo la primera vez: después el juego arranca solo.
        </p>

        <Button id="idle-cta" variant="primary" inactive={importing} onClick={picker.open}>
          {importing ? (
            <>
              <span className="size-3.5 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin" aria-hidden="true" />
              Guardando en este navegador…
            </>
          ) : (
            'Elegir archivo'
          )}
        </Button>

        {invalid ? (
          <p role="alert" className="flex items-center gap-2 text-[13px] leading-[18px] text-err-fg">
            <Led tone="err" />
            {error.message}
          </p>
        ) : (
          <p className="flex items-center gap-1.5 text-xs text-fg-3">
            <LockIcon size={12} />
            Se queda en este navegador. Nunca se sube.
          </p>
        )}
        {picker.input}
      </div>
    </div>
  )
}
