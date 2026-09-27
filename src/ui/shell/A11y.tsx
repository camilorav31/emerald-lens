import { useAnnouncer } from '../../store/announcer'
import { hasGame, useEmulatorStore } from '../../store/emulatorStore'

export function SkipLink() {
  const status = useEmulatorStore((s) => s.status)
  const game = hasGame(status)
  return (
    <a
      href={game ? '#game-screen' : '#idle-cta'}
      onClick={(e) => {
        const target = document.getElementById(game ? 'game-screen' : 'idle-cta')
        if (!target) return
        e.preventDefault()
        target.focus()
      }}
      className="fixed top-2 left-2 z-60 -translate-y-[200%] rounded-md border border-line-2 bg-surface-2 px-4 py-2 font-medium text-fg-1 focus:translate-y-0"
    >
      {game ? 'Saltar a la pantalla del juego' : 'Saltar a Elegir ROM'}
    </a>
  )
}

export function LiveRegion() {
  const { message, id } = useAnnouncer()
  return (
    <div className="sr-only" aria-live="polite" aria-atomic="true">
      <span key={id}>{message}</span>
    </div>
  )
}
