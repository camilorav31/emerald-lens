import { useEmulatorStore } from '../../store/emulatorStore'

// After closing the settings, hand the keyboard back to the game so play resumes without a click
export function returnToGame() {
  if (useEmulatorStore.getState().status === 'running') document.getElementById('game-screen')?.focus({ preventScroll: true })
}
