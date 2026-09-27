import { useRef } from 'react'
import { useEmulatorStore } from '../../store/emulatorStore'

export function useRomPicker() {
  const ref = useRef<HTMLInputElement>(null)
  const insertFile = useEmulatorStore((s) => s.insertFile)

  const input = (
    <input
      ref={ref}
      type="file"
      accept=".gba"
      hidden
      tabIndex={-1}
      onChange={(event) => {
        const file = event.target.files?.[0]
        if (file) void insertFile(file)
        event.target.value = ''
      }}
    />
  )

  return { open: () => ref.current?.click(), input }
}
