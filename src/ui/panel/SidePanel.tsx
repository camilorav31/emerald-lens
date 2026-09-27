import type { ReactNode } from 'react'
import { hasGame, useEmulatorStore } from '../../store/emulatorStore'
import { useSettingsStore } from '../../store/settingsStore'
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

function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 6h2.2L8 3.2v9.6L4.7 10H2.5z" />
      {muted ? <path d="M11 6l3.5 4M14.5 6L11 10" /> : <path d="M10.5 5.5a3.5 3.5 0 0 1 0 5M12.5 3.8a6 6 0 0 1 0 8.4" />}
    </svg>
  )
}

function ToolButton({ label, pressed, onClick, children }: { label: string; pressed?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={`grid h-9 min-w-9 place-items-center rounded-md px-1.5 transition-colors duration-150 pointer-coarse:h-11 pointer-coarse:min-w-11 ${
        pressed ? 'bg-accent-tint text-accent-hi' : 'text-fg-2 hover:bg-fg-1/5 hover:text-fg-1'
      }`}
    >
      {children}
    </button>
  )
}

const STATUS_TEXT = { booting: 'Iniciando', idle: 'Sin cartucho', running: 'En curso', paused: 'En pausa', error: 'Error' } as const

function Toolbar() {
  const status = useEmulatorStore((s) => s.status)
  const togglePause = useEmulatorStore((s) => s.togglePause)
  const muted = useSettingsStore((s) => s.muted)
  const toggleMuted = useSettingsStore((s) => s.toggleMuted)
  const fastForward = useSettingsStore((s) => s.fastForward)
  const toggleFastForward = useSettingsStore((s) => s.toggleFastForward)
  const loaded = hasGame(status)
  const tone = status === 'running' ? 'accent' : status === 'booting' ? 'warn' : status === 'error' ? 'err' : undefined

  return (
    <div className="flex h-10 items-center gap-1">
      <p className="flex min-w-0 flex-1 items-center gap-2 text-[13px]" role="status">
        <Led tone={tone} />
        <span className="truncate text-fg-2">{STATUS_TEXT[status]}</span>
      </p>
      {loaded && (
        <>
          <ToolButton label={status === 'running' ? 'Pausar' : 'Reanudar'} onClick={togglePause}>
            {status === 'running' ? <PauseIcon /> : <PlayIcon />}
          </ToolButton>
          <ToolButton label="Música y sonido" pressed={!muted} onClick={toggleMuted}>
            <SoundIcon muted={muted} />
          </ToolButton>
          <ToolButton label="Velocidad ×2 (tecla F)" pressed={fastForward} onClick={toggleFastForward}>
            <span className="num font-mono text-xs font-semibold">×2</span>
          </ToolButton>
        </>
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
