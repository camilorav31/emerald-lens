import { useEffect, useState } from 'react'
import { useEmulatorStore } from '../../store/emulatorStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useDropState } from '../drop/useWindowFileDrop'
import { CartridgeGlyph, LockIcon } from '../icons'
import { Button, Led } from '../primitives'
import { useRomPicker } from './useRomPicker'

const stripExt = (name: string) => name.replace(/\.gba$/i, '')

export function IdleDropZone() {
  const storedRoms = useEmulatorStore((s) => s.storedRoms)
  const importing = useEmulatorStore((s) => s.importing)
  const error = useEmulatorStore((s) => s.error)
  const dismissError = useEmulatorStore((s) => s.dismissError)
  const start = useEmulatorStore((s) => s.start)
  const lastRom = useSettingsStore((s) => s.lastRom)
  const dragging = useDropState((s) => s.dragging)
  const [hover, setHover] = useState(false)
  const picker = useRomPicker()

  const invalid = error?.kind === 'invalid-file'
  useEffect(() => {
    if (!invalid) return
    const timer = setTimeout(dismissError, 4000)
    return () => clearTimeout(timer)
  }, [invalid, dismissError])

  const playRom = lastRom && storedRoms.includes(lastRom) ? lastRom : storedRoms[0]
  const bracketColor = invalid ? 'var(--color-err)' : dragging ? 'var(--color-accent)' : hover ? 'var(--color-accent-line)' : undefined

  return (
    <div
      className={`absolute inset-0 z-3 grid place-items-center px-4 text-center transition-colors duration-200 ${dragging ? 'bg-[#0a1c14]' : 'bg-lens-idle'}`}
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

      <div className="relative flex max-w-[420px] flex-col items-center gap-3">
        <span className="[@container_lens_(height<260px)]:hidden">
          <CartridgeGlyph />
        </span>
        <h2 className="font-display text-[28px] leading-8 font-[650] tracking-[-0.02em] [@container_lens_(height<180px)]:hidden [@container_lens_(height<260px)]:text-[20px] [@container_lens_(height<260px)]:leading-6">
          {dragging ? 'Suelta para insertar' : playRom ? 'Listo para jugar' : 'Inserta un cartucho'}
        </h2>
        {!playRom && (
          <p className="text-[13px] leading-[18px] text-pretty text-fg-2 [@container_lens_(height<260px)]:hidden">
            Arrastra tu archivo .gba a cualquier parte de la página o elígelo desde tu equipo.
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2">
          {playRom ? (
            <>
              <Button
                id="idle-cta"
                variant="primary"
                inactive={importing}
                onClick={() => start(playRom)}
                title={playRom}
                className="max-w-[min(28ch,100%)]"
              >
                <span className="truncate">Jugar {stripExt(playRom)}</span>
              </Button>
              <Button inactive={importing} onClick={picker.open}>
                Cargar otra ROM
              </Button>
            </>
          ) : (
            <Button id="idle-cta" variant="primary" inactive={importing} onClick={picker.open}>
              {importing ? (
                <>
                  <span className="size-3.5 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin" aria-hidden="true" />
                  Guardando en este navegador…
                </>
              ) : (
                'Elegir ROM'
              )}
            </Button>
          )}
        </div>

        {invalid ? (
          <p role="alert" className="flex items-center gap-2 text-[13px] leading-[18px] text-err-fg">
            <Led tone="err" />
            {error.message}
          </p>
        ) : (
          <p className="flex items-center gap-1.5 text-xs text-fg-3">
            <LockIcon size={12} />
            Tu ROM se queda en este navegador. No se sube.
          </p>
        )}
        {picker.input}
      </div>
    </div>
  )
}
