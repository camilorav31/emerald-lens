import { useRef, type ButtonHTMLAttributes, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'md' | 'sm'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-ink shadow-raise hover:bg-accent-hi active:bg-accent-lo aria-disabled:bg-surface-disabled aria-disabled:text-fg-disabled aria-disabled:shadow-none',
  secondary:
    'bg-surface-2 text-fg-1 border border-line-2 hover:bg-surface-3 hover:border-line-3 aria-disabled:bg-surface-disabled aria-disabled:text-fg-disabled aria-disabled:border-line-disabled',
  ghost: 'text-fg-2 hover:text-fg-1 hover:bg-white/5 aria-disabled:text-fg-disabled',
}
const SIZES: Record<Size, string> = {
  md: 'h-10 px-4 pointer-coarse:h-11',
  sm: 'h-8 px-3 pointer-coarse:h-11',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  // keeps the control focusable with an explanation instead of removing it from the tab order
  inactive?: boolean
}

export function Button({ variant = 'secondary', size = 'md', icon, inactive, className = '', children, onClick, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      aria-disabled={inactive || undefined}
      onClick={inactive ? undefined : onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-[background-color,border-color,color,translate,box-shadow] duration-150 ease-out active:translate-y-px active:shadow-press aria-disabled:cursor-not-allowed aria-disabled:active:translate-y-0 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}

export function Led({ tone, className = '' }: { tone?: 'accent' | 'warn' | 'err'; className?: string }) {
  return <span className={`led ${className}`} data-tone={tone} aria-hidden="true" />
}

export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>
}

export function Kbd({ children, label, pressed, size }: { children: ReactNode; label?: string; pressed?: boolean; size?: 'mini' }) {
  return (
    <kbd className="kbd" data-pressed={pressed || undefined} data-size={size}>
      {children}
      {label && <VisuallyHidden>{label}</VisuallyHidden>}
    </kbd>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <span className={`skeleton block ${className}`} aria-hidden="true" />
}

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  disabled?: boolean
}

interface SegmentedProps<T extends string> {
  label: string
  value: T
  options: SegmentedOption<T>[]
  onChange: (value: T) => void
}

// Radiogroup with roving tabindex: arrows move and select, Home/End jump, disabled options are skipped
export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const index = Math.max(0, options.findIndex((o) => o.value === value))

  const move = (from: number, step: number) => {
    for (let i = 1; i <= options.length; i++) {
      const next = (from + step * i + options.length * i) % options.length
      if (!options[next].disabled) return next
    }
    return from
  }

  const onKeyDown = (event: KeyboardEvent) => {
    let next: number | null = null
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = move(index, 1)
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = move(index, -1)
    else if (event.key === 'Home') next = move(-1, 1)
    else if (event.key === 'End') next = move(options.length, -1)
    if (next === null) return
    event.preventDefault()
    onChange(options[next].value)
    refs.current[next]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="segmented"
      style={{ '--n': options.length, '--i': index } as CSSProperties}
      onKeyDown={onKeyDown}
    >
      <span className="segmented__indicator" aria-hidden="true" />
      {options.map((option, i) => {
        const checked = option.value === value
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-disabled={option.disabled || undefined}
            tabIndex={checked ? 0 : -1}
            onClick={() => !option.disabled && onChange(option.value)}
            className={`relative z-10 h-7 rounded-[8px] text-[13px] leading-[18px] transition-colors duration-150 pointer-coarse:h-10 ${
              checked
                ? 'font-medium text-accent-hi'
                : option.disabled
                  ? 'cursor-not-allowed text-fg-disabled'
                  : 'text-fg-2 hover:bg-white/4 hover:text-fg-1'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
