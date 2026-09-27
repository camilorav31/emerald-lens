import { useEmulatorStore } from '../../store/emulatorStore'
import { Kbd, Led, VisuallyHidden } from '../primitives'
import type { ScreenScale } from './useIntegerScale'

export function Chin({ scale, showInput = true }: { scale: ScreenScale; showInput?: boolean }) {
  const inputActive = useEmulatorStore((s) => s.inputActive)
  const crisp = scale.mode === 'integer'
  const dims = `${scale.physW} × ${scale.physH}`

  return (
    <div className="device__chin">
      <p className="flex min-w-0 items-center gap-2">
        {showInput && (
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
      <span className="chin__engraving" aria-hidden="true">
        Emerald Lens
      </span>
      <p className="num flex items-center gap-2 justify-self-end whitespace-nowrap" title="Píxeles físicos de tu pantalla">
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
    </div>
  )
}
