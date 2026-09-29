import { useId, useRef, useState, type ReactNode } from 'react'

interface Props {
  label: string
  icon: ReactNode
  title: string
  children: ReactNode
  width?: number
  // Runs after it closes, only when focus was left on the trigger (Esc or the trigger itself),
  // never when the user clicked another control
  onClose?: () => void
  // Opens above the trigger (for controls docked at the bottom of the screen)
  placement?: 'below' | 'above'
  // Replaces the default trigger look; with it the trigger also keeps focus where it was
  buttonClassName?: string
}

// Native popover (top layer, light dismiss, Esc) anchored under its trigger button.
export function PopoverButton({ label, icon, title, children, width = 320, onClose, placement = 'below', buttonClassName }: Props) {
  const id = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState<{ top?: number; bottom?: number; right: number; maxHeight: string }>({ top: 0, right: 0, maxHeight: 'calc(100dvh - 80px)' })

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
          const right = Math.max(8, window.innerWidth - rect.right)
          setPosition(
            placement === 'above'
              ? { bottom: window.innerHeight - rect.top + 8, right: 8, maxHeight: `${Math.max(160, rect.top - 16)}px` }
              : { top: rect.bottom + 8, right, maxHeight: 'calc(100dvh - 80px)' },
          )
        }}
        onToggle={(e) => {
          if ((e as unknown as ToggleEvent).newState !== 'closed') return
          const active = document.activeElement
          if (active === buttonRef.current || active === document.body) onClose?.()
        }}
        style={{
          top: position.top,
          bottom: position.bottom,
          right: position.right,
          maxHeight: position.maxHeight,
          width: `min(${width}px, calc(100vw - 16px))`,
        }}
        className="fixed inset-auto m-0 overflow-y-auto rounded-[12px] border border-line-3 bg-float p-4 text-fg-1 shadow-float"
      >
        <h2 className="section-label mb-3">{title}</h2>
        {children}
      </div>
    </>
  )
}
