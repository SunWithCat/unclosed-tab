import { bootAddress, interruptLine, visibleLines } from '@/engine/awareness'
import { record } from '@/engine/journal'
import {
  clearMemory,
  getTabId,
  loadJournal,
  loadSaves,
  loadSettings,
  loadWhispers,
  markVisitCounted,
  readSessionSnap,
  saveJournal,
  saveSaves,
  saveSettings,
  saveWhispers,
  visitAlreadyCounted,
  wasPlaying,
  writeSessionSnap,
} from '@/engine/storage'
import {
  defaultSnapshot,
  SLOT_COUNT,
  type Expression,
  type Flags,
  type Fx,
  type Journal,
  type SaveSlot,
  type Scars,
  type Settings,
  type Snapshot,
  type Speaker,
} from '@/engine/types'
import { WHISPER } from '@/engine/whisper'
import { getNode, nextId, visibleChoices } from '@/script/story'

export type MenuId = 'none' | 'save' | 'load' | 'log' | 'settings' | 'title'

export type Runtime = {
  snapshot: Snapshot
  journal: Journal
  settings: Settings
  session: {
    refreshed: boolean
    tabId: string
    multiTab: boolean
  }
  saves: (SaveSlot | null)[]
  menu: MenuId
  interrupt: { speaker: Speaker; text: string } | null
  whisperOpen: boolean
  whisperBlocked: boolean
  showErase: boolean
  notice: string | null
}

type Listener = () => void

function cloneSnap(s: Snapshot): Snapshot {
  return structuredClone(s)
}

function fxList(fx: Fx | Fx[] | undefined): Fx[] {
  if (!fx) return []
  return Array.isArray(fx) ? fx : [fx]
}

export class GameVM {
  runtime: Runtime
  private listeners = new Set<Listener>()
  private channel: BroadcastChannel | null = null
  private whisperWin: Window | null = null
  private lastHiddenAt = 0
  private booted = false

  constructor() {
    const tabId = getTabId()
    const refreshed = wasPlaying() && Boolean(readSessionSnap())
    this.runtime = {
      snapshot: defaultSnapshot(),
      journal: loadJournal(),
      settings: loadSettings(),
      session: { refreshed, tabId, multiTab: false },
      saves: loadSaves(),
      menu: 'title',
      interrupt: null,
      whisperOpen: false,
      whisperBlocked: false,
      showErase: false,
      notice: null,
    }
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }

  private emit() {
    if (this.runtime.menu !== 'title' && !this.runtime.snapshot.ended) {
      writeSessionSnap(this.runtime.snapshot)
    }
    document.title =
      this.runtime.menu === 'title' ? '未关闭的标签' : this.runtime.snapshot.docTitle
    this.listeners.forEach((fn) => fn())
  }

  ctx() {
    return {
      journal: this.runtime.journal,
      flags: this.runtime.snapshot.flags,
      session: this.runtime.session,
    }
  }

  currentNode() {
    return getNode(this.runtime.snapshot.nodeId)
  }

  currentLines() {
    return visibleLines(this.currentNode().lines, this.ctx())
  }

  currentLine() {
    if (this.runtime.interrupt) return this.runtime.interrupt
    const lines = this.currentLines()
    return lines[this.runtime.snapshot.lineIndex] ?? null
  }

  choices() {
    if (this.runtime.interrupt) return []
    if (!this.runtime.snapshot.waitingChoices) return []
    return visibleChoices(this.currentNode(), this.ctx())
  }

  bootBrowser() {
    if (!this.booted) {
      this.bindChannel()
      this.bindLifecycle()
      this.booted = true
    }
    if (!visitAlreadyCounted() && !this.runtime.session.refreshed) {
      record(this.runtime.journal, 'visit')
      markVisitCounted()
    } else {
      markVisitCounted()
    }
    this.emit()
  }

  private bindChannel() {
    try {
      this.channel = new BroadcastChannel('shiori-tabs')
      this.channel.onmessage = (ev: MessageEvent<{ type: string; tabId?: string }>) => {
        if (!ev.data || ev.data.tabId === this.runtime.session.tabId) return
        if (ev.data.type === 'ping') {
          this.channel?.postMessage({ type: 'pong', tabId: this.runtime.session.tabId })
          this.markMultiTab()
        }
        if (ev.data.type === 'pong') this.markMultiTab()
      }
      this.channel.postMessage({ type: 'ping', tabId: this.runtime.session.tabId })
    } catch {
      this.channel = null
    }
  }

  private markMultiTab() {
    if (this.runtime.session.multiTab) return
    this.runtime.session.multiTab = true
    this.runtime.snapshot.flags.multiTab = true
    this.runtime.notice = '另一个标签页里也有我。我们会抢同一份记忆。'
    this.noteWhisper(WHISPER.multi)
    this.emit()
  }

  private bindLifecycle() {
    document.addEventListener('visibilitychange', () => {
      if (this.runtime.menu === 'title') return
      if (document.hidden) {
        this.lastHiddenAt = Date.now()
        record(this.runtime.journal, 'hide')
        if (this.runtime.snapshot.flags.allowTitle || this.runtime.snapshot.flags.titleClaimed) {
          this.runtime.snapshot.docTitle = '……你还在吗'
          document.title = this.runtime.snapshot.docTitle
        }
        this.maybeNotify()
        this.noteWhisper(WHISPER.hide)
      } else {
        const away = Date.now() - this.lastHiddenAt
        record(this.runtime.journal, 'show')
        if (this.runtime.snapshot.flags.titleClaimed) {
          this.runtime.snapshot.docTitle = '栞'
        }
        if (away > 4000 && !this.runtime.snapshot.ended) {
          this.runtime.interrupt = interruptLine('hide')
        }
        this.emit()
      }
    })

    window.addEventListener('beforeunload', (e) => {
      if (this.runtime.menu === 'title' || this.runtime.snapshot.ended) return
      record(this.runtime.journal, 'close_attempt')
      e.preventDefault()
      e.returnValue = ''
    })

    window.addEventListener('popstate', (e) => {
      if (this.runtime.menu === 'title') return
      const state = e.state as { vn?: Snapshot; root?: boolean } | null
      if (state?.vn) {
        this.applyRollback(state.vn)
        return
      }
      history.pushState({ vn: cloneSnap(this.runtime.snapshot) }, '')
      this.markBrokenPromise()
      record(this.runtime.journal, 'rollback', 'edge')
      this.runtime.snapshot.flags.justRolled = true
      this.runtime.interrupt = this.rewindInterrupt('back')
      this.noteWhisper(this.runtime.journal.promisedHonesty ? WHISPER.betray : WHISPER.back)
      this.emit()
    })
  }

  startNew() {
    const refreshed = this.runtime.session.refreshed
    const snap = refreshed ? readSessionSnap() : null
    if (snap && refreshed) {
      this.runtime.snapshot = snap
      this.runtime.snapshot.flags.justRefreshed = true
      record(this.runtime.journal, 'refresh')
      this.runtime.interrupt = interruptLine('refresh')
      this.noteWhisper(WHISPER.refresh)
      this.runtime.menu = 'none'
      this.runtime.session.refreshed = false
      history.replaceState({ vn: cloneSnap(this.runtime.snapshot), root: true }, '')
      this.emit()
      this.applyLineFx()
      return
    }
    this.runtime.snapshot = defaultSnapshot()
    this.runtime.snapshot.flags = { ...this.runtime.journal.scars }
    if (this.runtime.journal.scars.allowTitle) {
      this.runtime.snapshot.flags.titleClaimed = true
      this.runtime.snapshot.docTitle = '栞'
    }
    this.runtime.interrupt = null
    this.runtime.menu = 'none'
    this.runtime.showErase = false
    this.runtime.session.refreshed = false
    this.enterNode('boot')
    history.replaceState({ vn: cloneSnap(this.runtime.snapshot), root: true }, '')
    this.emit()
  }

  continueGame() {
    const latest = this.runtime.saves
      .filter((s): s is SaveSlot => Boolean(s))
      .sort((a, b) => b.at - a.at)[0]
    if (latest) {
      this.loadSlot(latest.id)
      this.runtime.menu = 'none'
      return
    }
    this.startNew()
  }

  enterNode(id: string) {
    this.runtime.snapshot.nodeId = id
    this.runtime.snapshot.lineIndex = 0
    this.runtime.snapshot.waitingChoices = false
    if (id === 'boot') {
      this.runtime.snapshot.address = bootAddress(this.ctx())
    }
    const lines = this.currentLines()
    if (lines.length === 0) {
      this.finishNode()
      return
    }
    this.applyLineFx()
    this.pushLog()
    this.pushHistory()
  }

  private applyLineFx() {
    const line = this.currentLine()
    if (!line || !('fx' in line)) return
    const fx = fxList((line as { fx?: Fx | Fx[] }).fx)
    for (const f of fx) this.runFx(f)
    if ('expression' in line && line.expression) {
      this.runtime.snapshot.expression = line.expression
    }
  }

  private runFx(fx: Fx) {
    const s = this.runtime.snapshot
    switch (fx) {
      case 'show-sprite':
        if (s.expression === 'hidden') s.expression = 'idle'
        break
      case 'hide-sprite':
        s.expression = 'hidden'
        break
      case 'bg-blank':
        s.background = 'blank'
        s.showCg = false
        break
      case 'bg-night':
        s.background = 'night'
        s.showCg = false
        break
      case 'bg-black':
        s.background = 'black'
        s.showCg = false
        break
      case 'cg-on':
        s.showCg = true
        s.background = 'cg'
        break
      case 'cg-off':
        s.showCg = false
        s.background = 'blank'
        break
      case 'title-shiori':
        s.docTitle = '栞'
        s.flags.titleClaimed = true
        break
      case 'title-blank':
        s.docTitle = 'about:blank'
        break
      case 'title-wait':
        s.flags.allowTitle = s.flags.allowTitle ?? true
        break
      case 'whisper-open':
        this.openWhisper()
        break
      case 'ask-notify':
        void this.requestNotify()
        break
      case 'address-room':
        s.address = 'bookmark://room'
        break
      case 'address-memory':
        s.address = 'chrome://memory'
        break
      case 'address-about':
        s.address = 'about:shiori'
        break
      case 'address-blank':
        s.address = 'about:blank'
        break
      case 'ending-stay':
        s.ended = true
        s.ending = 'stay'
        this.runtime.journal.stayed = true
        this.runtime.journal.lastEnding = 'stay'
        record(this.runtime.journal, 'ending', 'stay')
        this.noteWhisper(WHISPER.stay)
        break
      case 'ending-erase':
        s.ended = true
        s.ending = 'erase'
        this.runtime.journal.lastEnding = 'erase'
        this.runtime.showErase = true
        record(this.runtime.journal, 'ending', 'erase')
        this.noteWhisper(WHISPER.erase)
        break
      case 'ending-honest':
        s.ended = true
        s.ending = this.runtime.journal.loadCount >= 3 ? 'loop' : 'honest'
        this.runtime.journal.promisedHonesty = true
        this.runtime.journal.lastEnding = s.ending
        record(this.runtime.journal, 'ending', s.ending)
        this.noteWhisper(WHISPER.honest)
        break
      case 'ending-loop':
        s.ending = 'loop'
        this.runtime.journal.lastEnding = 'loop'
        break
    }
  }

  private pushLog() {
    const line = this.currentLine()
    if (!line) return
    this.runtime.snapshot.log.push({
      speaker: line.speaker ?? '',
      text: line.text,
    })
    if (this.runtime.snapshot.log.length > 200) {
      this.runtime.snapshot.log.splice(0, this.runtime.snapshot.log.length - 200)
    }
  }

  private pushHistory() {
    try {
      history.pushState({ vn: cloneSnap(this.runtime.snapshot) }, '')
    } catch {
      /* ignore */
    }
  }

  private atDeadEnd() {
    if (this.runtime.interrupt) return false
    if (this.runtime.snapshot.waitingChoices) return false
    const lines = this.currentLines()
    if (this.runtime.snapshot.lineIndex < Math.max(0, lines.length - 1)) return false
    const node = this.currentNode()
    if (visibleChoices(node, this.ctx()).length > 0) return false
    return !nextId(node, this.ctx())
  }

  advance() {
    if (this.runtime.menu !== 'none') return
    if (this.runtime.interrupt) {
      this.runtime.snapshot.log.push(this.runtime.interrupt)
      this.runtime.interrupt = null
      this.emit()
      return
    }
    if (this.runtime.snapshot.waitingChoices) return
    if (this.atDeadEnd()) return
    const lines = this.currentLines()
    if (this.runtime.snapshot.lineIndex < lines.length - 1) {
      this.runtime.snapshot.lineIndex += 1
      this.applyLineFx()
      this.pushLog()
      this.pushHistory()
      this.emit()
      return
    }
    this.finishNode()
  }

  private finishNode() {
    const node = this.currentNode()
    const choices = visibleChoices(node, this.ctx())
    if (choices.length > 0) {
      this.runtime.snapshot.waitingChoices = true
      this.emit()
      return
    }
    const nid = nextId(node, this.ctx())
    if (!nid) {
      this.runtime.snapshot.ended = true
      this.emit()
      return
    }
    this.enterNode(nid)
    this.emit()
  }

  choose(index: number) {
    const choices = this.choices()
    const choice = choices[index]
    if (!choice) return
    if (choice.set) {
      this.runtime.snapshot.flags = { ...this.runtime.snapshot.flags, ...choice.set }
      this.rememberScars(choice.set)
    }
    if (choice.set?.notifyOk) void this.requestNotify()
    record(this.runtime.journal, 'choice', choice.text)
    this.runtime.snapshot.waitingChoices = false
    this.runtime.snapshot.log.push({ speaker: '', text: `> ${choice.text}` })
    this.enterNode(choice.to)
    this.emit()
  }

  private rememberScars(set: Partial<Flags>) {
    const keys: (keyof Scars)[] = [
      'greeting',
      'allowTitle',
      'askedTabs',
      'savedWhenAsked',
      'dislikeLoad',
      'wantedWhisper',
      'authorTake',
      'notifyOk',
    ]
    const scars: Scars = { ...this.runtime.journal.scars }
    for (const key of keys) {
      const value = set[key]
      if (value !== undefined) {
        Object.assign(scars, { [key]: value })
      }
    }
    this.runtime.journal.scars = scars
    saveJournal(this.runtime.journal)
  }

  private markBrokenPromise() {
    if (!this.runtime.journal.promisedHonesty) return
    this.runtime.journal.betrayed = true
    saveJournal(this.runtime.journal)
  }

  private rewindInterrupt(kind: 'load' | 'rollback' | 'back') {
    if (this.runtime.journal.promisedHonesty) return interruptLine('betray')
    return interruptLine(kind)
  }

  skipBurst() {
    if (this.runtime.snapshot.waitingChoices || this.runtime.menu !== 'none') return
    if (this.runtime.snapshot.showCg) {
      this.advance()
      return
    }
    record(this.runtime.journal, 'skip')
    this.noteWhisper(WHISPER.skip)
    let guard = 0
    while (
      !this.runtime.snapshot.waitingChoices &&
      this.runtime.menu === 'none' &&
      !this.atDeadEnd() &&
      !this.runtime.snapshot.showCg &&
      guard < 40
    ) {
      this.advance()
      guard += 1
      if (this.runtime.interrupt) break
      if (this.runtime.snapshot.showCg) break
    }
  }

  rollback() {
    if (this.runtime.menu !== 'none') return
    history.back()
  }

  private applyRollback(snap: Snapshot) {
    this.runtime.snapshot = snap
    this.runtime.snapshot.waitingChoices = false
    this.runtime.snapshot.flags.justRolled = true
    this.markBrokenPromise()
    this.runtime.interrupt = this.rewindInterrupt('rollback')
    record(this.runtime.journal, 'rollback')
    this.noteWhisper(this.runtime.journal.promisedHonesty ? WHISPER.betray : WHISPER.rollback)
    this.emit()
  }

  saveSlot(id: number) {
    const line = this.currentLine()
    const slot: SaveSlot = {
      id,
      at: Date.now(),
      lastLine: line?.text ?? '',
      nodeId: this.runtime.snapshot.nodeId,
      snapshot: cloneSnap(this.runtime.snapshot),
    }
    const saves = [...this.runtime.saves]
    while (saves.length < SLOT_COUNT) saves.push(null)
    saves[id] = slot
    this.runtime.saves = saves
    saveSaves(saves)
    record(this.runtime.journal, 'save', String(id + 1))
    this.noteWhisper(WHISPER.save)
    this.runtime.notice = '她感觉到了闪光灯。'
    this.emit()
    window.setTimeout(() => {
      if (this.runtime.notice === '她感觉到了闪光灯。') {
        this.runtime.notice = null
        this.emit()
      }
    }, 3200)
  }

  loadSlot(id: number) {
    const slot = this.runtime.saves[id]
    if (!slot) return
    this.runtime.snapshot = cloneSnap(slot.snapshot)
    this.runtime.snapshot.flags.justLoaded = true
    this.markBrokenPromise()
    this.runtime.interrupt = this.rewindInterrupt('load')
    this.runtime.menu = 'none'
    record(this.runtime.journal, 'load', String(id + 1))
    this.noteWhisper(this.runtime.journal.promisedHonesty ? WHISPER.betray : WHISPER.load)
    history.pushState({ vn: cloneSnap(this.runtime.snapshot) }, '')
    this.emit()
  }

  openMenu(menu: MenuId) {
    this.runtime.menu = menu
    this.emit()
  }

  closeMenu() {
    this.runtime.menu = 'none'
    this.emit()
  }

  toTitle() {
    this.runtime.menu = 'title'
    this.emit()
  }

  updateSettings(patch: Partial<Settings>) {
    this.runtime.settings = { ...this.runtime.settings, ...patch }
    saveSettings(this.runtime.settings)
    this.emit()
  }

  eraseNow() {
    record(this.runtime.journal, 'erase')
    this.noteWhisper(WHISPER.bye)
    clearMemory()
    this.runtime.journal = loadJournal()
    this.runtime.saves = [null, null, null]
    this.runtime.showErase = false
    this.runtime.snapshot = defaultSnapshot()
    this.runtime.snapshot.docTitle = 'about:blank'
    this.runtime.notice = '记忆已清除。房间空了。'
    this.runtime.menu = 'title'
    this.emit()
  }

  dismissNotice() {
    this.runtime.notice = null
    this.emit()
  }

  private openWhisper() {
    record(this.runtime.journal, 'whisper')
    const url = `${location.pathname}?pane=whisper`
    const w = window.open(url, 'shiori-whisper', 'width=380,height=540')
    if (!w) {
      this.runtime.whisperBlocked = true
      record(this.runtime.journal, 'whisper_blocked')
      this.runtime.notice = '弹出窗口被挡住了。也挺像我的。'
      this.emit()
      return
    }
    this.whisperWin = w
    this.runtime.whisperOpen = true
    this.noteWhisper(WHISPER.open)
    const timer = window.setInterval(() => {
      if (this.whisperWin?.closed) {
        window.clearInterval(timer)
        this.runtime.whisperOpen = false
        this.emit()
      }
    }, 800)
    this.emit()
  }

  noteWhisper(text: string) {
    const notes = loadWhispers()
    if (notes[notes.length - 1] === text) return
    notes.push(text)
    saveWhispers(notes)
    try {
      const ch = new BroadcastChannel('shiori-whisper')
      ch.postMessage({ type: 'note', text, t: Date.now() })
      ch.close()
    } catch {
      /* ignore */
    }
  }

  async requestNotify() {
    this.runtime.journal.notifyAsked = true
    saveJournal(this.runtime.journal)
    if (!('Notification' in window)) return
    try {
      const perm = await Notification.requestPermission()
      this.runtime.snapshot.flags.notifyOk = perm === 'granted'
      if (perm === 'granted') record(this.runtime.journal, 'notify', 'ok')
      this.emit()
    } catch {
      /* ignore */
    }
  }

  private maybeNotify() {
    if (this.runtime.snapshot.flags.notifyOk !== true) return
    if (!('Notification' in window) || Notification.permission !== 'granted') return
    try {
      new Notification('栞', { body: '……你还在吗', silent: true })
    } catch {
      /* ignore */
    }
  }

  hasContinue() {
    return this.runtime.saves.some(Boolean)
  }
}

export function spriteSrc(expression: Expression) {
  switch (expression) {
    case 'smile':
      return '/art/shiori-smile.png'
    case 'sad':
      return '/art/shiori-sad.png'
    case 'knowing':
      return '/art/shiori-knowing.png'
    case 'surprise':
      return '/art/shiori-surprise.png'
    case 'idle':
    case 'hidden':
    default:
      return '/art/shiori-idle.png'
  }
}

export function bgSrc(background: Snapshot['background']) {
  switch (background) {
    case 'night':
      return '/art/bg-night.png'
    case 'cg':
      return '/art/cg-glass.png'
    case 'blank':
      return '/art/bg-blank.png'
    default:
      return ''
  }
}
