import { Game } from '@/components/Game'
import { WhisperPane } from '@/components/WhisperPane'

export default function App() {
  const pane = new URLSearchParams(window.location.search).get('pane')
  if (pane === 'whisper') return <WhisperPane />
  return <Game />
}
