import { type Journal, type JournalEventType } from './types'
import { saveJournal } from './storage'

const MAX_EVENTS = 80

export function record(journal: Journal, type: JournalEventType, extra?: string) {
  journal.events.push({ t: Date.now(), type, extra })
  if (journal.events.length > MAX_EVENTS) {
    journal.events.splice(0, journal.events.length - MAX_EVENTS)
  }
  journal.lastSeenAt = Date.now()
  switch (type) {
    case 'save':
      journal.saveCount += 1
      break
    case 'load':
      journal.loadCount += 1
      break
    case 'rollback':
      journal.rollbackCount += 1
      break
    case 'refresh':
      journal.refreshCount += 1
      break
    case 'hide':
      journal.hideCount += 1
      break
    case 'skip':
      journal.skipCount += 1
      break
    case 'close_attempt':
      journal.closeAttempts += 1
      break
    case 'visit':
      journal.visitCount += 1
      break
    default:
      break
  }
  saveJournal(journal)
}

export function honestyBroken(journal: Journal) {
  return journal.loadCount > 0 || journal.rollbackCount > 0
}

export function looped(journal: Journal) {
  return journal.loadCount >= 3 || journal.rollbackCount >= 6
}
