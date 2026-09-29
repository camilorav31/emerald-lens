import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { startPartyPolling } from '../store/partyStore'
import { DropOverlay } from './drop/DropOverlay'
import { useWindowFileDrop } from './drop/useWindowFileDrop'
import { ConsoleFrame } from './game-screen/ConsoleFrame'
import { SidePanel } from './panel/SidePanel'
import { LiveRegion, SkipLink } from './shell/A11y'
import { Footer } from './shell/Footer'
import { Splash } from './shell/Splash'
import { Toaster } from './shell/Toaster'
import { TopBar } from './shell/TopBar'

export function AppShell({ stage, panel }: { stage: ReactNode; panel: ReactNode }) {
  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr_auto] lg:h-[max(100dvh,560px)] lg:grid-rows-[56px_minmax(0,1fr)_40px]">
      <SkipLink />
      <TopBar />
      <main className="mx-auto grid w-full max-w-[2400px] content-start gap-3 px-3 py-(--pad-y) md:gap-4 md:px-6 lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_356px] lg:content-stretch lg:px-4 lg:py-4 xl:gap-5 xl:px-5 xl:py-5 2xl:grid-cols-[minmax(0,1fr)_380px] 2xl:gap-8 2xl:px-8 2xl:py-6">
        {stage}
        <aside
          aria-label="Panel del emulador"
          className="flex min-w-0 flex-col lg:min-h-0 lg:overflow-y-auto lg:overflow-x-hidden lg:overscroll-contain lg:px-0.5 lg:[scrollbar-gutter:stable] lg:[scrollbar-width:thin]"
        >
          {panel}
        </aside>
      </main>
      <Footer />
    </div>
  )
}

const DemoBar = import.meta.env.DEV ? lazy(() => import('../dev/DemoBar')) : null

export function EmulatorView() {
  useWindowFileDrop()
  useEffect(() => startPartyPolling(), [])
  return (
    <>
      <AppShell stage={<ConsoleFrame />} panel={<SidePanel />} />
      <DropOverlay />
      <Toaster />
      <LiveRegion />
      <Splash />
      {DemoBar && (
        <Suspense>
          <DemoBar />
        </Suspense>
      )}
    </>
  )
}
