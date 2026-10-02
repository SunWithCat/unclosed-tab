import { useEffect } from 'react'
import { Game } from '@/components/Game'
import { WhisperPane } from '@/components/WhisperPane'

const PRELOAD_ASSETS = [
  '/art/bg-blank.png',
  '/art/bg-night.png',
  '/art/cg-glass.png',
  '/art/shiori-idle.png',
  '/art/shiori-smile.png',
  '/art/shiori-sad.png',
  '/art/shiori-knowing.png',
  '/art/shiori-surprise.png',
]

export default function App() {
  useEffect(() => {
    PRELOAD_ASSETS.forEach((src) => {
      const img = new Image()
      img.src = src
    })
  }, [])

  const pane = new URLSearchParams(window.location.search).get('pane')
  if (pane === 'whisper') return <WhisperPane />
  return <Game />
}

