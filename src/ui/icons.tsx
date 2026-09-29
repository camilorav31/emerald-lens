import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Icon({ size = 16, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  )
}

export const ArrowIcon = ({ direction, ...p }: IconProps & { direction: 'up' | 'down' | 'left' | 'right' }) => {
  const rotate = { up: 0, right: 90, down: 180, left: 270 }[direction]
  return (
    <Icon size={12} {...p}>
      <path d="M8 13V3M4 7l4-4 4 4" transform={`rotate(${rotate} 8 8)`} />
    </Icon>
  )
}
export const EnterIcon = (p: IconProps) => (
  <Icon size={12} {...p}>
    <path d="M13 3v5a2 2 0 0 1-2 2H3M6 7l-3 3 3 3" />
  </Icon>
)
export const BackspaceIcon = (p: IconProps) => (
  <Icon size={14} {...p}>
    <path d="M5.5 3.5H13a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H5.5L2 8z" />
    <path d="M7.5 6.5l3 3M10.5 6.5l-3 3" />
  </Icon>
)
export const PauseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5.5 3.5v9M10.5 3.5v9" />
  </Icon>
)
export const PlayIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 3.2v9.6a.4.4 0 0 0 .6.35l7.6-4.8a.4.4 0 0 0 0-.7L5.6 2.85a.4.4 0 0 0-.6.35z" fill="currentColor" stroke="none" />
  </Icon>
)
export const LockIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
    <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
  </Icon>
)
export const ShieldCheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 1.8l5 1.9v4c0 3.1-2.1 5.4-5 6.5-2.9-1.1-5-3.4-5-6.5v-4z" />
    <path d="M5.8 8l1.6 1.6 3-3.2" />
  </Icon>
)
export const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 8.5l3 3 6-7" />
  </Icon>
)
export const WarningIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 2.2l6.2 11H1.8z" />
    <path d="M8 6.5v3M8 11.5v.01" />
  </Icon>
)
export const AlertIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="8" cy="8" r="6" />
    <path d="M8 5v3.5M8 11v.01" />
  </Icon>
)
export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 4l8 8M12 4l-8 8" />
  </Icon>
)
export const PointerIcon = (p: IconProps) => (
  <Icon size={14} {...p}>
    <path d="M4 2.5l8 5-3.6.9-1.7 3.6z" />
  </Icon>
)
export const DpadIcon = (p: IconProps) => (
  <Icon {...p} strokeWidth={1.2}>
    <path d="M6 2h4v4h4v4h-4v4H6v-4H2V6h4z" />
  </Icon>
)
export const CartridgeIcon = (p: IconProps) => (
  <Icon {...p} strokeWidth={1.2}>
    <path d="M3 2.5h8l2 2v9a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5z" />
    <rect x="5" y="4.5" width="6" height="4" rx=".5" />
  </Icon>
)

export function CartridgeGlyph({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 48) / 64} viewBox="0 0 64 48" fill="none" aria-hidden="true" className="text-fg-3">
      <path
        d="M6 4h44l8 8v30a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
        stroke="currentColor"
        strokeOpacity=".5"
      />
      <rect x="11" y="11" width="36" height="22" rx="2" stroke="#3DDC97" strokeOpacity=".7" />
      <path d="M15 40h34" stroke="currentColor" strokeOpacity=".35" strokeDasharray="2 2" />
    </svg>
  )
}

export const GearIcon = (p: IconProps) => (
  <Icon strokeWidth={1.4} {...p}>
    <circle cx="8" cy="8" r="2.2" />
    <path d="M8 1.5v1.8M8 12.7v1.8M14.5 8h-1.8M3.3 8H1.5M12.6 3.4l-1.3 1.3M4.7 11.3l-1.3 1.3M12.6 12.6l-1.3-1.3M4.7 4.7L3.4 3.4" />
    <circle cx="8" cy="8" r="4.6" />
  </Icon>
)
export const SoundIcon = ({ muted, ...p }: IconProps & { muted: boolean }) => (
  <Icon strokeWidth={1.4} {...p}>
    <path d="M2.5 6h2.2L8 3.2v9.6L4.7 10H2.5z" />
    {muted ? <path d="M11 6l3.5 4M14.5 6L11 10" /> : <path d="M10.5 5.5a3.5 3.5 0 0 1 0 5M12.5 3.8a6 6 0 0 1 0 8.4" />}
  </Icon>
)
