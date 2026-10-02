export type Expression = 'hidden' | 'idle' | 'smile' | 'sad' | 'knowing' | 'surprise'
export type Background = 'black' | 'blank' | 'night' | 'cg'
export type Speaker = '栞' | '系统' | ''

export type Greeting = 'hello' | 'quiet' | 'program'
export type AuthorTake = 'finish' | 'unfinished' | 'hate'
export type Finale = 'stay' | 'erase' | 'honest'
export type EndingId = Finale | 'loop'

export type JournalEventType =
  | 'visit'
  | 'save'
  | 'load'
  | 'rollback'
  | 'refresh'
  | 'hide'
  | 'show'
  | 'close_attempt'
  | 'skip'
  | 'whisper'
  | 'whisper_blocked'
  | 'notify'
  | 'ending'
  | 'erase'
  | 'choice'

export type JournalEvent = {
  t: number
  type: JournalEventType
  extra?: string
}

export type Journal = {
  version: 1
  visitCount: number
  saveCount: number
  loadCount: number
  rollbackCount: number
  skipCount: number
  hideCount: number
  refreshCount: number
  closeAttempts: number
  firstSeenAt: number
  lastSeenAt: number
  lastEnding: EndingId | null
  stayed: boolean
  erased: boolean
  eraseCount: number
  promisedHonesty: boolean
  betrayed: boolean
  notifyAsked: boolean
  scars: Scars
  events: JournalEvent[]
}

export type Scars = {
  greeting?: Greeting
  allowTitle?: boolean
  askedTabs?: boolean
  savedWhenAsked?: boolean
  dislikeLoad?: boolean
  wantedWhisper?: boolean
  authorTake?: AuthorTake
  notifyOk?: boolean
}

export type Flags = {
  greeting?: Greeting
  allowTitle?: boolean
  askedTabs?: boolean
  savedWhenAsked?: boolean
  dislikeLoad?: boolean
  wantedWhisper?: boolean
  authorTake?: AuthorTake
  finale?: Finale
  justRefreshed?: boolean
  justLoaded?: boolean
  justRolled?: boolean
  multiTab?: boolean
  titleClaimed?: boolean
  notifyOk?: boolean
}

export type LogLine = {
  speaker: Speaker
  text: string
}

export type Snapshot = {
  nodeId: string
  lineIndex: number
  flags: Flags
  expression: Expression
  background: Background
  address: string
  docTitle: string
  showCg: boolean
  log: LogLine[]
  ended: boolean
  ending?: EndingId
  waitingChoices: boolean
}

export type SaveSlot = {
  id: number
  at: number
  lastLine: string
  nodeId: string
  snapshot: Snapshot
}

export type Settings = {
  cps: number
  autoMs: number
  auto: boolean
  reducedMotion: boolean
  mute: boolean
}

export type SessionInfo = {
  refreshed: boolean
  tabId: string
  multiTab: boolean
}

export type Ctx = {
  journal: Journal
  flags: Flags
  session: SessionInfo
}

export type Fx =
  | 'show-sprite'
  | 'hide-sprite'
  | 'bg-blank'
  | 'bg-night'
  | 'bg-black'
  | 'cg-on'
  | 'cg-off'
  | 'title-shiori'
  | 'title-blank'
  | 'title-wait'
  | 'whisper-open'
  | 'ask-notify'
  | 'address-room'
  | 'address-memory'
  | 'address-about'
  | 'address-blank'
  | 'ending-stay'
  | 'ending-erase'
  | 'ending-honest'
  | 'ending-loop'

export type Line = {
  speaker?: Speaker
  text: string
  expression?: Expression
  fx?: Fx | Fx[]
  when?: (ctx: Ctx) => boolean
}

export type Choice = {
  text: string
  to: string
  when?: (ctx: Ctx) => boolean
  set?: Partial<Flags>
}

export type StoryNode = {
  id: string
  lines: Line[]
  choices?: Choice[]
  next?: string | ((ctx: Ctx) => string)
}

export const STORAGE = {
  journal: 'shiori.journal.v1',
  saves: 'shiori.saves.v1',
  settings: 'shiori.settings.v1',
  whispers: 'shiori.whispers.v1',
  sessionSnap: 'shiori.session.snap',
  playing: 'shiori.session.playing',
  visitCounted: 'shiori.session.visit',
  tabId: 'shiori.session.tab',
} as const

export const SLOT_COUNT = 3

export function emptyJournal(): Journal {
  const t = Date.now()
  return {
    version: 1,
    visitCount: 0,
    saveCount: 0,
    loadCount: 0,
    rollbackCount: 0,
    skipCount: 0,
    hideCount: 0,
    refreshCount: 0,
    closeAttempts: 0,
    firstSeenAt: t,
    lastSeenAt: t,
    lastEnding: null,
    stayed: false,
    erased: false,
    eraseCount: 0,
    promisedHonesty: false,
    betrayed: false,
    notifyAsked: false,
    scars: {},
    events: [],
  }
}

export function defaultSettings(): Settings {
  return {
    cps: 28,
    autoMs: 1400,
    auto: false,
    reducedMotion: false,
    mute: false,
  }
}

export function defaultSnapshot(): Snapshot {
  return {
    nodeId: 'boot',
    lineIndex: 0,
    flags: {},
    expression: 'hidden',
    background: 'black',
    address: 'about:blank',
    docTitle: 'about:blank',
    showCg: false,
    log: [],
    ended: false,
    waitingChoices: false,
  }
}
