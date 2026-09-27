import { useId } from 'react'

export function GemMark({ size = 20, className = '' }: { size?: number; className?: string }) {
  const id = useId()
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className={`gem-mark ${className}`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7DEBBB" />
          <stop offset=".55" stopColor="#3DDC97" />
          <stop offset="1" stopColor="#0E7A50" />
        </linearGradient>
      </defs>
      <path d="M8 2h8l4 4v12l-4 4H8l-4-4V6z" fill={`url(#${id})`} />
      <path
        className="gem-mark__table transition-[fill-opacity] duration-150"
        d="M9.5 6h5L16 7.5v9L14.5 18h-5L8 16.5v-9z"
        fill="#03140D"
        fillOpacity=".28"
      />
      <path
        d="M8 2l1.5 4M16 2l-1.5 4M20 6l-4 1.5M20 18l-4-1.5M16 22l-1.5-4M8 22l1.5-4M4 18l4-1.5M4 6l4 1.5"
        stroke="#03140D"
        strokeOpacity=".35"
        strokeWidth=".75"
      />
      <path d="M10 7.2h3" stroke="#FFF" strokeOpacity=".6" strokeWidth=".8" strokeLinecap="round" />
      <path d="M8 2h8l4 4v12l-4 4H8l-4-4V6z" fill="none" stroke="#FFF" strokeOpacity=".35" strokeWidth=".75" />
    </svg>
  )
}

export function Wordmark() {
  return (
    <span className="font-display text-[18px] leading-6 tracking-[-0.01em]">
      <span className="font-bold text-fg-1">Emerald</span> <span className="font-medium text-fg-2">Lens</span>
    </span>
  )
}
