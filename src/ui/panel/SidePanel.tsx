import { hasGame, useEmulatorStore } from '../../store/emulatorStore'
import { PauseIcon, PlayIcon } from '../icons'
import { PartyPanel } from '../party/PartyPanel'
import { Led } from '../primitives'
import { ControlsCompact } from './KeyboardLegend'
import { PopoverButton } from './Popover'
import { SettingsContent } from './SettingsContent'

function GearIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <circle cx="8" cy="8" r="2.2" />
      <path d="M8 1.5v1.8M8 12.7v1.8M14.5 8h-1.8M3.3 8H1.5M12.6 3.4l-1.3 1.3M4.7 11.3l-1.3 1.3M12.6 12.6l-1.3-1.3M4.7 4.7L3.4 3.4" strokeLinecap="round" />
      <circle cx="8" cy="8" r="4.6" />
    </svg>
  )
}

const STATUS_TEXT = { booting: 'Iniciando', idle: 'Sin cartucho', running: 'En curso', paused: 'En pausa', error: 'Error' } as const

function Toolbar() {
  const status = useEmulatorStore((s) => s.status)
  const romName = useEmulatorStore((s) => s.romName)
  const togglePause = useEmulatorStore((s) => s.togglePause)
  const loaded = hasGame(status)
  const tone = status === 'running' ? 'accent' : status === 'booting' ? 'warn' : status === 'error' ? 'err' : undefined

  return (
    <div className="flex h-10 items-center gap-2">
      <p className="flex min-w-0 flex-1 items-center gap-2 text-[13px]" role="status">
        <Led tone={tone} />
        <span className="flex-none text-fg-2">{STATUS_TEXT[status]}</span>
        {loaded && romName && (
          <span className="truncate text-fg-3" title={romName}>
            · {romName.replace(/\.gba$/i, '')}
          </span>
        )}
      </p>
      {loaded && (
        <button
          type="button"
          onClick={togglePause}
          aria-label={status === 'running' ? 'Pausar' : 'Reanudar'}
          title={status === 'running' ? 'Pausar' : 'Reanudar'}
          className="grid size-9 place-items-center rounded-md text-fg-2 transition-colors duration-150 hover:bg-white/5 hover:text-fg-1 pointer-coarse:size-11"
        >
          {status === 'running' ? <PauseIcon /> : <PlayIcon />}
        </button>
      )}
      <PopoverButton label="Ajustes" title="Ajustes" icon={<GearIcon />}>
        <SettingsContent />
      </PopoverButton>
    </div>
  )
}

// While playing, the panel shows only the controls and the party; everything else lives behind the gear
export function SidePanel() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <Toolbar />
      <ControlsCompact />
      <PartyPanel />
    </div>
  )
}
