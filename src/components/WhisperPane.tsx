import { useEffect, useState } from 'react'
import { loadWhispers } from '@/engine/storage'
import { BrowserChrome } from '@/components/BrowserChrome'

type Note = { text: string; t: number }

export function WhisperPane() {
  const [notes, setNotes] = useState<Note[]>(() =>
    loadWhispers().map((text, i) => ({ text, t: i })),
  )

  useEffect(() => {
    document.title = '未说出口'
    const ch = new BroadcastChannel('shiori-whisper')
    ch.onmessage = (ev: MessageEvent<{ type?: string; text?: string; t?: number }>) => {
      if (ev.data?.type === 'note' && ev.data.text) {
        setNotes((prev) => [...prev, { text: ev.data.text ?? '', t: ev.data.t ?? Date.now() }])
      }
    }
    return () => ch.close()
  }, [])

  return (
    <div className="flex h-full min-h-svh flex-col bg-[#0f1016] text-ink">
      <BrowserChrome address="bookmark://unspoken" title="未说出口" compact />
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        <p className="font-serif text-sm text-mute">对话框里的她会演戏。这里不会。</p>
        {notes.length === 0 ? (
          <p className="text-sm text-mute">还没有没说出口的话。</p>
        ) : (
          notes.map((note, i) => (
            <div
              key={`${i}-${note.text}`}
              className="rounded-md bg-[#efe7d6] px-3 py-2 font-serif text-sm leading-relaxed text-[#2b261f] shadow-sm"
            >
              {note.text}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
