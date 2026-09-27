import { usePartyStore } from '../store/partyStore'
import { Button } from '../ui/primitives'
import { demoFaint, demoHealAll, demoLevelUp, stopDemoParty } from './demoParty'

// Dev-only floating controls while the demo team is shown, kept outside the gear popup so the
// animations in the side panel stay visible.
export default function DemoBar() {
  const demo = usePartyStore((s) => s.demo)
  if (!demo) return null
  return (
    <div
      role="toolbar"
      aria-label="Controles del equipo de demo"
      className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-warn-line bg-float px-2 py-1.5 shadow-float"
    >
      <span className="px-2 font-mono text-[11px] font-medium text-warn-fg">DEMO</span>
      <Button size="sm" onClick={demoLevelUp}>
        Subir nivel
      </Button>
      <Button size="sm" onClick={demoFaint}>
        Debilitar
      </Button>
      <Button size="sm" onClick={demoHealAll}>
        Curar
      </Button>
      <Button size="sm" variant="ghost" onClick={stopDemoParty}>
        Salir
      </Button>
    </div>
  )
}
