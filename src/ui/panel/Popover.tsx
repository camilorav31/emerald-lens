import { useId, useRef, useState, type ReactNode } from 'react'
import { HANDHELD_QUERY, useMediaQuery } from '../useMediaQuery'

interface Props {
  label: string
  icon: ReactNode
  title: string
  children: ReactNode
  width?: number
  // Runs after it closes, only when focus was left on the trigger (Esc or the trigger itself),
  // never when the user clicked another control
  onClose?: () => void
  // Replaces the default trigger look; with it the trigger also keeps focus where it was
  buttonClassName?: string
}

// Native popover (top layer, light dismiss, Esc) anchored under its trigger button.
export function PopoverButton({ label, icon, title, children, width = 320, onClose, buttonClassName }: Props) {
  const id = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState<{ top: number; right: number }>({ top: 0, right: 0 })
  // On portrait phones it is a bottom sheet with a scrim, like the party detail, instead of a floating card
  const sheet = useMediaQuery(HANDHELD_QUERY)

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        popoverTarget={id}
        aria-label={label}
        title={label}
        className={
          buttonClassName ??
          'grid size-9 place-items-center rounded-md text-fg-2 transition-colors duration-150 hover:bg-fg-1/5 hover:text-fg-1 pointer-coarse:size-11'
        }
        onPointerDown={buttonClassName ? (e) => e.preventDefault() : undefined}
      >
        {icon}
      </button>
      <div
        id={id}
        popover="auto"
        onBeforeToggle={(e) => {
          if ((e as unknown as ToggleEvent).newState !== 'open' || !buttonRef.current) return
          const rect = buttonRef.current.getBoundingClientRect()
          setPosition({ top: rect.bottom + 8, right: Math.max(8, window.innerWidth - rect.right) })
        }}
        onToggle={(e) => {
          if ((e as unknown as ToggleEvent).newState !== 'closed') return
          const active = document.activeElement
          if (active === buttonRef.current || active === document.body) onClose?.()
        }}
        style={
          sheet
            ? { left: 8, right: 8, bottom: 'calc(8px + env(safe-area-inset-bottom))', width: 'auto', maxHeight: 'min(72dvh, 560px)' }
            : { top: position.top, right: position.right, maxHeight: 'calc(100dvh - 80px)', width: `min(${width}px, calc(100vw - 16px))` }
        }
        className="fixed inset-auto m-0 overflow-y-auto overscroll-contain rounded-[12px] border border-line-3 bg-float p-4 text-fg-1 shadow-float handheld:backdrop:bg-scrim handheld:rounded-[20px]"
      >
        <h2 className="section-label mb-3">{title}</h2>
        {children}
      </div>
    </>
  )
}
