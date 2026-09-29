import { useEmulatorStore } from '../../store/emulatorStore'
import { useSettingsStore } from '../../store/settingsStore'
import { PerfHud } from './PerfHud'
import { SystemKeys } from './SystemKeys'
import { Kbd, Led, VisuallyHidden } from '../primitives'
import { useMediaQuery } from '../useMediaQuery'
import type { ScreenScale } from './useIntegerScale'

const TOUCH_ONLY = '(hover: none) and (pointer: coarse)'

export function Chin({ scale, showInput = true }: { scale: ScreenScale; showInput?: boolean }) {
  const inputActive = useEmulatorStore((s) => s.inputActive)
  const perfMonitor = useSettingsStore((s) => s.perfMonitor)
  const fastForward = useSettingsStore((s) => s.fastForward)
  const running = useEmulatorStore((s) => s.status === 'running')
  const touch = useMediaQuery(TOUCH_ONLY)
  const crisp = scale.mode === 'integer'
  const dims = `${scale.physW} × ${scale.physH}`

  return (
    <div className="device__chin">
      <p className="flex min-w-0 items-center gap-2 handheld:hidden">
        {showInput && touch && (
          <>
            <Led tone="accent" />
            <span className="truncate">Controles táctiles</span>
          </>
        )}
        {showInput && !touch && (
          <>
            <Led tone={inputActive ? 'accent' : undefined} />
            {inputActive ? (
              <span className="truncate">
                Teclado activo
                <span className="chin__hint">
                  {' · '}
                  <Kbd size="mini">Tab</Kbd> para salir
                </span>
              </span>
            ) : (
              <span className="truncate">Teclado inactivo</span>
            )}
          </>
        )}
      </p>
      {perfMonitor ? (
        <PerfHud />
      ) : (
        <span className="chin__engraving handheld:hidden" aria-hidden="true">
          Emerald Lens
        </span>
      )}
      <p className="num flex items-center gap-2 justify-self-end whitespace-nowrap handheld:hidden" title="Píxeles físicos de tu pantalla">
        {fastForward && running && (
          <span className="rounded-xs bg-accent px-1.5 py-px font-mono text-[11px] font-semibold text-accent-ink" role="status">
            ×2
          </span>
        )}
        <Led tone={crisp ? 'accent' : undefined} />
        {crisp ? (
          <>
            <span aria-hidden="true">
              Nítido · {scale.dev}×<span className="chin__dims"> · {dims}</span>
            </span>
            <VisuallyHidden>Escala nítida: {scale.dev} píxeles físicos por píxel</VisuallyHidden>
          </>
        ) : (
          <>
            <span aria-hidden="true">
              Ajustado<span className="chin__dims"> · {dims}</span>
            </span>
            <VisuallyHidden>Escala ajustada, píxeles desiguales</VisuallyHidden>
          </>
        )}
      </p>
      <div className="col-start-1 row-start-1 hidden items-center gap-1 handheld:flex">
        <SystemKeys side="left" />
      </div>
      <div className="col-start-3 row-start-1 hidden items-center gap-1 justify-self-end handheld:flex">
        <SystemKeys side="right" />
      </div>
    </div>
  )
}
