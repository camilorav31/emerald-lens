import { useEffect } from 'react'
import { usePartyStore } from '../store/partyStore'
import { Button } from '../ui/primitives'
import { demoFaint, demoHealAll, demoLevelUp, startDemoParty, stopDemoParty } from './demoParty'

// Dev-only floating controls while the demo team is shown, kept outside the gear popup so the
// animations in the party UI stay visible. On the portrait-phone handheld it sits under the party strip, in the
// slack above the screen, instead of over the pad. `?demo` starts the demo team (handy on a phone over the LAN).
export default function DemoBar() {
  const demo = usePartyStore((s) => s.demo)
  useEffect(() => {
    if (new URLSearchParams(location.search).has('demo')) startDemoParty()
  }, [])
  if (!demo) return null
  return (
    <div
      role="toolbar"
      aria-label="Controles del equipo de demo"
      className="fixed bottom-4 left-1/2 z-40 flex max-w-[calc(100vw-16px)] -translate-x-1/2 items-center gap-1.5 rounded-full border border-warn-line bg-float px-2 py-1.5 shadow-float handheld:inset-x-2 handheld:top-[calc(var(--topbar-h)+62px)] handheld:bottom-auto handheld:max-w-none handheld:translate-x-0 handheld:rounded-lg handheld:p-1 handheld:[&_button]:h-9 handheld:[&_button]:flex-1 handheld:[&_button]:px-1.5 handheld:[&_button]:text-[13px]"
    >
      <span className="px-2 font-mono text-[11px] font-medium text-warn-fg handheld:sr-only">DEMO</span>
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
