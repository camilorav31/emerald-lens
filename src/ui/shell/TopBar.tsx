import { useEffect, useState } from 'react'
import { useEmulatorStore } from '../../store/emulatorStore'
import { GemMark, Wordmark } from '../brand/GemMark'
import { ThemeToggle } from './ThemeToggle'

export function TopBar() {
  const [scrolled, setScrolled] = useState(false)
  const live = useEmulatorStore((s) => s.status === 'running')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Over a live canvas the bar goes opaque instead of blurring, so the game never gets filtered
  const surface = !scrolled
    ? 'border-transparent'
    : live
      ? 'border-line-1 bg-bg-0/95'
      : 'border-line-1 bg-bar backdrop-blur-[12px] backdrop-saturate-[1.1]'

  return (
    <header
      className={`sticky top-0 z-30 h-(--topbar-h) border-b transition-[background-color,border-color] duration-150 ${surface}`}
      data-scrolled={scrolled || undefined}
    >
      <div className="mx-auto flex h-full max-w-[2400px] items-center justify-between px-3 md:px-6 lg:px-4 xl:px-5 2xl:px-8">
        <a href="/" className="brand-link flex items-center gap-2 rounded-[8px]">
          <GemMark />
          <Wordmark />
        </a>
        <div className="flex items-center gap-2">
        {import.meta.env.DEV && (
          <span
            className="inline-flex h-[22px] items-center rounded-sm border border-warn-line bg-warn-tint px-1.5 font-mono text-[11px] font-medium text-warn-fg"
            title="Modo desarrollo: autocarga dev-roms/emerald.gba"
          >
            DEV<span className="sr-only">: modo desarrollo, autocarga dev-roms/emerald.gba</span>
          </span>
        )}
        <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
