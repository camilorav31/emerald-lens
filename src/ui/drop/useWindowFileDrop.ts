import { useEffect } from 'react'
import { create } from 'zustand'
import { announce } from '../../store/announcer'
import { useEmulatorStore } from '../../store/emulatorStore'

export const useDropState = create<{ dragging: boolean }>(() => ({ dragging: false }))

const hasFiles = (e: DragEvent) => e.dataTransfer?.types.includes('Files') ?? false

// Whole-page drop target. dragenter/leave fire per child element, so a depth counter tracks the real state.
export function useWindowFileDrop() {
  useEffect(() => {
    let depth = 0
    const hide = () => {
      depth = 0
      useDropState.setState({ dragging: false })
    }
    const onEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return
      e.preventDefault()
      if (depth++ === 0) {
        useDropState.setState({ dragging: true })
        announce('Suelta el archivo para cargar la ROM')
      }
    }
    const onLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return
      if (--depth <= 0) hide()
    }
    const onOver = (e: DragEvent) => e.preventDefault()
    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      hide()
      const file = e.dataTransfer?.files[0]
      if (file) useEmulatorStore.getState().insertFile(file)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && useDropState.getState().dragging) hide()
    }

    window.addEventListener('dragenter', onEnter)
    window.addEventListener('dragleave', onLeave)
    window.addEventListener('dragover', onOver)
    window.addEventListener('drop', onDrop)
    window.addEventListener('dragend', hide)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('dragenter', onEnter)
      window.removeEventListener('dragleave', onLeave)
      window.removeEventListener('dragover', onOver)
      window.removeEventListener('drop', onDrop)
      window.removeEventListener('dragend', hide)
      window.removeEventListener('keydown', onKey)
    }
  }, [])
}
