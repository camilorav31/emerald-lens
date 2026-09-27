import { CORE_SOURCE_URL, MGBA_URL, REPO_URL } from '../../config/links'

const LINK =
  'rounded-xs text-fg-2 underline decoration-line-3 underline-offset-[3px] transition-colors duration-150 hover:text-fg-1 hover:decoration-accent'

export function Footer() {
  return (
    <footer className="border-t border-line-1 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-[2400px] flex-col items-center gap-x-6 gap-y-1 px-3 py-3 text-center text-xs text-fg-3 md:px-6 lg:h-10 lg:flex-row lg:justify-between lg:px-4 lg:py-0 lg:text-left xl:px-5 2xl:px-8">
        <p>Proyecto educativo. No afiliado a Nintendo, Game Freak ni The Pokémon Company.</p>
        <p className="flex flex-wrap justify-center gap-x-3 gap-y-1">
          <span>
            Emulación:{' '}
            <a className={LINK} href={MGBA_URL} target="_blank" rel="noreferrer">
              mGBA
            </a>{' '}
            (MPL-2.0)
          </span>
          <span>
            Sprites:{' '}
            <a className={LINK} href="https://play.pokemonshowdown.com/sprites/" target="_blank" rel="noreferrer">
              Pokémon Showdown
            </a>
          </span>
          {CORE_SOURCE_URL && (
            <a className={LINK} href={CORE_SOURCE_URL} target="_blank" rel="noreferrer">
              Código del core
            </a>
          )}
          {REPO_URL && (
            <a className={LINK} href={REPO_URL} target="_blank" rel="noreferrer">
              Código fuente
            </a>
          )}
        </p>
      </div>
    </footer>
  )
}
