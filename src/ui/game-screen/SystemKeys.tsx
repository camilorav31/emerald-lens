import { hasGame, useEmulatorStore } from '../../store/emulatorStore'
import { useSettingsStore } from '../../store/settingsStore'
import { GearIcon, PauseIcon, PlayIcon, SoundIcon } from '../icons'
import { PopoverButton } from '../panel/Popover'
import { SettingsContent } from '../panel/SettingsContent'
import { noFocus } from './noFocus'
import { returnToGame } from './returnToGame'

function Key({ label, pressed, onClick, children }: { label: string; pressed?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" tabIndex={-1} className="chin-key" aria-label={label} aria-pressed={pressed} onPointerDown={noFocus} onClick={onClick}>
      {children}
    </button>
  )
}

// Pause and sound on the left, speed and settings on the right: the console's system keys, in the chin of
// the portrait-phone layout. Only the settings key exists before a game is loaded.
export function SystemKeys({ side }: { side: 'left' | 'right' }) {
  const status = useEmulatorStore((s) => s.status)
  const togglePause = useEmulatorStore((s) => s.togglePause)
  const muted = useSettingsStore((s) => s.muted)
  const toggleMuted = useSettingsStore((s) => s.toggleMuted)
  const fastForward = useSettingsStore((s) => s.fastForward)
  const toggleFastForward = useSettingsStore((s) => s.toggleFastForward)
  const loaded = hasGame(status)

  if (side === 'left') {
    if (!loaded) return null
    return (
      <>
        <Key label={status === 'running' ? 'Pausar' : 'Reanudar'} onClick={togglePause}>
          {status === 'running' ? <PauseIcon /> : <PlayIcon />}
        </Key>
        <Key label="Música y sonido" pressed={!muted} onClick={toggleMuted}>
          <SoundIcon muted={muted} />
        </Key>
      </>
    )
  }

  return (
    <>
      {loaded && (
        <Key label="Velocidad ×2" pressed={fastForward} onClick={toggleFastForward}>
          ×2
        </Key>
      )}
      <PopoverButton label="Ajustes" title="Ajustes" icon={<GearIcon />} width={560} buttonClassName="chin-key" onClose={returnToGame}>
        <SettingsContent />
      </PopoverButton>
    </>
  )
}
