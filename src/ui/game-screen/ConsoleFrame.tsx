import { useEffect, useRef } from 'react'
import { bootEmulator } from '../../emulator/emulator'
import { useEmulatorStore } from '../../store/emulatorStore'
import { useSettingsStore } from '../../store/settingsStore'
import { Chin } from './Chin'
import { ScreenOverlays } from './ScreenOverlays'
import { useScreenScale } from './screenScaleStore'
import { crtAvailable, lcdAvailable, useIntegerScale } from './useIntegerScale'
import { useGameInput } from './useGameInput'

export function ConsoleFrame() {
  const probeRef = useRef<HTMLDivElement>(null)
  const deviceRef = useRef<HTMLElement>(null)
  const lensRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const status = useEmulatorStore((s) => s.status)
  const inputActive = useEmulatorStore((s) => s.inputActive)
  const filter = useSettingsStore((s) => s.filter)

  const scale = useIntegerScale({ probe: probeRef, device: deviceRef, lens: lensRef }, 'auto')
  useGameInput(canvasRef)

  useEffect(() => {
    useScreenScale.setState({ scale })
  }, [scale])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const { ready, fail } = useEmulatorStore.getState()
    bootEmulator(canvas).then(async (emulator) => {
      await ready(emulator)
      if (import.meta.env.DEV) {
        if (canvas.width !== 240 || canvas.height !== 160) console.warn('[dev] unexpected canvas size', canvas.width, canvas.height)
        void import('../../dev/devRom').then((dev) => dev.autoloadDevRom())
      }
    }, fail)
  }, [])

  useEffect(() => {
    if (status === 'running') canvasRef.current?.focus({ preventScroll: true })
  }, [status])

  const activeFilter =
    filter === 'lcd' && lcdAvailable(scale) ? 'lcd' : filter === 'crt' && crtAvailable(scale) ? 'crt' : 'none'

  return (
    <div className="stage">
      <div ref={probeRef} className="stage__probe" aria-hidden="true" />
      <section
        ref={deviceRef}
        className="device"
        data-state={status}
        data-input={inputActive ? 'on' : 'off'}
        data-live={status === 'running' || undefined}
        data-crisp={scale.mode === 'integer'}
        aria-label="Consola"
        style={{ visibility: scale.measured ? undefined : 'hidden' }}
      >
        <span className="device__live" aria-hidden="true" />
        <div className="device__well">
          <div ref={lensRef} className={`device__lens ${status === 'running' && !inputActive ? 'cursor-pointer' : ''}`}>
            <canvas
              ref={canvasRef}
              id="game-screen"
              width={240}
              height={160}
              tabIndex={0}
              role="application"
              aria-label="Pantalla del juego. Haz clic o enfócala para jugar; pulsa Tab para salir."
              aria-describedby="legend-note"
            />
            <div className="screen-filter" data-filter={activeFilter} aria-hidden="true" />
            <div className="lens-glass" aria-hidden="true" />
            <ScreenOverlays lens={lensRef} />
          </div>
        </div>
        <Chin scale={scale} />
      </section>
    </div>
  )
}
