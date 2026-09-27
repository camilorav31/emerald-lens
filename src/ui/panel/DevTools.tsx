import { startDemoParty, stopDemoParty } from '../../dev/demoParty'
import { useDevAutoload } from '../../dev/devRom'
import { usePartyStore } from '../../store/partyStore'
import { Button } from '../primitives'

// Imported only behind import.meta.env.DEV via React.lazy, so it is not in the production bundle
export default function DevTools() {
  const result = useDevAutoload((s) => s.result)
  const demo = usePartyStore((s) => s.demo)
  const text = {
    loaded: 'Autocarga: dev-roms/emerald.gba insertado.',
    stored: 'Cartucho ya guardado en IndexedDB; arranca solo.',
    missing: 'Autocarga omitida: no se encontró dev-roms/emerald.gba',
    skipped: 'Autocarga desactivada (?autoload=0)',
  }
  return (
    <div className="space-y-3">
      <p className={`text-xs ${result === 'missing' ? 'text-warn-fg' : 'text-fg-2'}`}>{result ? text[result] : 'Autocarga pendiente…'}</p>

      <div className="space-y-2 rounded-md border border-dashed border-warn-line p-2.5">
        <p className="text-xs text-fg-2">
          Equipo ficticio para probar las animaciones. Los controles aparecen en una barra abajo; mientras está activo, el panel ignora la memoria del juego.
        </p>
        {demo ? (
          <Button size="sm" variant="ghost" className="w-full" onClick={stopDemoParty}>
            Volver al equipo real
          </Button>
        ) : (
          <Button size="sm" className="w-full" onClick={startDemoParty}>
            Mostrar equipo de demo
          </Button>
        )}
      </div>

      <a
        href={result === 'skipped' ? '/' : '/?autoload=0'}
        className="inline-block rounded-xs text-xs text-fg-2 underline decoration-line-3 underline-offset-[3px] hover:text-fg-1 hover:decoration-accent"
      >
        {result === 'skipped' ? 'Volver a la autocarga' : 'Ver estado inicial (?autoload=0)'}
      </a>
    </div>
  )
}
