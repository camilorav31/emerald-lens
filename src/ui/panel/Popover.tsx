import { useId, useRef, useState, type ReactNode } from 'react'

interface Props {
  label: string
  icon: ReactNode
  title: string
  children: ReactNode
  width?: number
}

// Native popover (top layer, light dismiss, Esc) anchored under its trigger button.
export function PopoverButton({ label, icon, title, children, width = 320 }: Props) {
  const id = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState<{ top: number; right: number }>({ top: 0, right: 0 })

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        popoverTarget={id}
        aria-label={label}
        title={label}
        className="grid size-9 place-items-center rounded-md text-fg-2 transition-colors duration-150 hover:bg-fg-1/5 hover:text-fg-1 pointer-coarse:size-11"
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
        style={{ top: position.top, right: position.right, width: `min(${width}px, calc(100vw - 16px))` }}
        className="fixed inset-auto m-0 max-h-[calc(100dvh-80px)] overflow-y-auto rounded-[12px] border border-line-3 bg-float p-4 text-fg-1 shadow-float"
      >
        <h2 className="section-label mb-3">{title}</h2>
        {children}
      </div>
    </>
  )
}
