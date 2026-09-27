import { DEV_ROM, loadDevRom, useDevAutoload } from '../../dev/devRom'
import { useEmulatorStore } from '../../store/emulatorStore'
import { Button } from '../primitives'

// Imported only behind import.meta.env.DEV via React.lazy, so it is not in the production bundle
export default function DevTools() {
  const result = useDevAutoload((s) => s.result)
  const status = useEmulatorStore((s) => s.status)
  return (
    <div className="space-y-2">
      <p className={`text-xs ${result === 'missing' ? 'text-warn-fg' : 'text-fg-2'}`}>
        {result === 'missing'
          ? `Autocarga omitida: no se encontró dev-roms/${DEV_ROM}`
          : result === 'skipped'
            ? 'Autocarga desactivada (?autoload=0)'
            : `Autocarga: dev-roms/${DEV_ROM}`}
      </p>
      <Button size="sm" className="w-full" inactive={status === 'booting'} onClick={() => void loadDevRom()}>
        Cargar dev-roms/{DEV_ROM}
      </Button>
      <a
        href={result === 'skipped' ? '/' : '/?autoload=0'}
        className="inline-block rounded-xs text-xs text-fg-2 underline decoration-line-3 underline-offset-[3px] hover:text-fg-1 hover:decoration-accent"
      >
        {result === 'skipped' ? 'Volver a la autocarga' : 'Ver estado inicial (?autoload=0)'}
      </a>
    </div>
  )
}
