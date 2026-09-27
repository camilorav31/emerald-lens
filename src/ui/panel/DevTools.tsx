import { useDevAutoload } from '../../dev/devRom'

// Imported only behind import.meta.env.DEV via React.lazy, so it is not in the production bundle
export default function DevTools() {
  const result = useDevAutoload((s) => s.result)
  const text = {
    loaded: 'Autocarga: dev-roms/emerald.gba insertado.',
    stored: 'Cartucho ya guardado en IndexedDB; arranca solo.',
    missing: 'Autocarga omitida: no se encontró dev-roms/emerald.gba',
    skipped: 'Autocarga desactivada (?autoload=0)',
  }
  return (
    <div className="space-y-2">
      <p className={`text-xs ${result === 'missing' ? 'text-warn-fg' : 'text-fg-2'}`}>{result ? text[result] : 'Autocarga pendiente…'}</p>
      <a
        href={result === 'skipped' ? '/' : '/?autoload=0'}
        className="inline-block rounded-xs text-xs text-fg-2 underline decoration-line-3 underline-offset-[3px] hover:text-fg-1 hover:decoration-accent"
      >
        {result === 'skipped' ? 'Volver a la autocarga' : 'Ver estado inicial (?autoload=0)'}
      </a>
    </div>
  )
}
