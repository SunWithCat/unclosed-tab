import {
  STORAGE,
  defaultSettings,
  emptyJournal,
  type Journal,
  type SaveSlot,
  type Settings,
  type Snapshot,
} from './types'

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function loadJournal(): Journal {
  const j = readJson<Journal>(STORAGE.journal)
  if (!j || j.version !== 1) return emptyJournal()
  return { ...emptyJournal(), ...j, events: j.events ?? [], scars: j.scars ?? {} }
}

export function saveJournal(journal: Journal) {
  journal.lastSeenAt = Date.now()
  writeJson(STORAGE.journal, journal)
}

export function loadSaves(): (SaveSlot | null)[] {
  const slots = readJson<(SaveSlot | null)[]>(STORAGE.saves)
  if (!slots || !Array.isArray(slots)) return [null, null, null]
  return [0, 1, 2].map((i) => slots[i] ?? null)
}

export function saveSaves(slots: (SaveSlot | null)[]) {
  writeJson(STORAGE.saves, slots)
}

export function loadSettings(): Settings {
  const s = readJson<Partial<Settings>>(STORAGE.settings)
  return { ...defaultSettings(), ...s }
}

export function saveSettings(settings: Settings) {
  writeJson(STORAGE.settings, settings)
}

export function writeSessionSnap(snapshot: Snapshot) {
  try {
    sessionStorage.setItem(STORAGE.sessionSnap, JSON.stringify(snapshot))
    sessionStorage.setItem(STORAGE.playing, '1')
  } catch {
    /* ignore */
  }
}

export function readSessionSnap(): Snapshot | null {
  try {
    const raw = sessionStorage.getItem(STORAGE.sessionSnap)
    if (!raw) return null
    return JSON.parse(raw) as Snapshot
  } catch {
    return null
  }
}

export function wasPlaying(): boolean {
  try {
    return sessionStorage.getItem(STORAGE.playing) === '1'
  } catch {
    return false
  }
}

export function markVisitCounted() {
  try {
    sessionStorage.setItem(STORAGE.visitCounted, '1')
  } catch {
    /* ignore */
  }
}

export function visitAlreadyCounted() {
  try {
    return sessionStorage.getItem(STORAGE.visitCounted) === '1'
  } catch {
    return false
  }
}

export function getTabId() {
  try {
    const existing = sessionStorage.getItem(STORAGE.tabId)
    if (existing) return existing
    const id = crypto.randomUUID()
    sessionStorage.setItem(STORAGE.tabId, id)
    return id
  } catch {
    return 'tab'
  }
}

export function loadWhispers(): string[] {
  return readJson<string[]>(STORAGE.whispers) ?? []
}

export function saveWhispers(notes: string[]) {
  writeJson(STORAGE.whispers, notes.slice(-24))
}

export function clearMemory() {
  const eraseCount = loadJournal().eraseCount + 1
  try {
    localStorage.removeItem(STORAGE.journal)
    localStorage.removeItem(STORAGE.saves)
    localStorage.removeItem(STORAGE.whispers)
    sessionStorage.removeItem(STORAGE.sessionSnap)
    sessionStorage.removeItem(STORAGE.playing)
    sessionStorage.removeItem(STORAGE.visitCounted)
  } catch {
    /* ignore */
  }
  const leftover: Journal = {
    ...emptyJournal(),
    erased: true,
    eraseCount,
    visitCount: 0,
  }
  saveJournal(leftover)
}
