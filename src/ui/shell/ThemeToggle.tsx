import { useEffect, useSyncExternalStore } from 'react'
import { useSettingsStore, type Theme } from '../../store/settingsStore'

// Bar color under the browser toolbar: the page gradient's top color plus its glow (keep in sync with index.html)
const THEME_COLOR: Record<Theme, string> = { dark: '#0f382a', light: '#dcede4' }
const DARK_QUERY = '(prefers-color-scheme: dark)'
const subscribeSystem = (onChange: () => void) => {
  const query = window.matchMedia(DARK_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}
const systemTheme = (): Theme => (window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light')

// An explicit choice wins; otherwise follow the OS. index.html applies the same rule before first paint.
export function useResolvedTheme(): Theme {
  const chosen = useSettingsStore((s) => s.theme)
  const system = useSyncExternalStore(subscribeSystem, systemTheme)
  return chosen ?? system
}

export function useApplyTheme() {
  const theme = useResolvedTheme()
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
  }, [theme])
}

export function ThemeToggle() {
  const theme = useResolvedTheme()
  const setTheme = useSettingsStore((s) => s.setTheme)
  const next = theme === 'dark' ? 'light' : 'dark'
  const label = next === 'light' ? 'Cambiar a modo día' : 'Cambiar a modo noche'
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={label}
      title={label}
      className="grid size-9 place-items-center rounded-md text-fg-2 transition-colors duration-150 hover:bg-fg-1/5 hover:text-fg-1 pointer-coarse:size-11"
    >
      {theme === 'dark' ? (
        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M13.5 9.6A5.5 5.5 0 0 1 6.4 2.5a5.5 5.5 0 1 0 7.1 7.1z" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <circle cx="8" cy="8" r="3" />
          <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" strokeLinecap="round" />
        </svg>
      )}
    </button>
  )
}
