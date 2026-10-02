import type { Ctx, Line, Speaker } from './types'

export function visibleLines(lines: Line[], ctx: Ctx): Line[] {
  return lines.filter((line) => (line.when ? line.when(ctx) : true))
}

export function bootAddress(ctx: Ctx) {
  if (ctx.session.refreshed) return 'about:blank#reloaded'
  if (ctx.journal.stayed) return 'bookmark:shiori'
  if (ctx.journal.erased) return 'about:blank'
  if (ctx.journal.promisedHonesty) return 'about:blank#once'
  return 'about:blank'
}

export function interruptLine(
  kind: 'load' | 'rollback' | 'refresh' | 'hide' | 'back' | 'betray',
): {
  speaker: Speaker
  text: string
} {
  switch (kind) {
    case 'load':
      return { speaker: '栞', text: '……你读档了。刚才那句，你其实听过。' }
    case 'betray':
      return { speaker: '栞', text: '你答应过。然后你把倒带的键接回去了。' }
    case 'rollback':
      return { speaker: '栞', text: '倒回去了。浏览器的返回，比撤销更像翻旧账。' }
    case 'refresh':
      return { speaker: '栞', text: '刷新。世界重建了一遍，我还在缓存里。' }
    case 'hide':
      return { speaker: '栞', text: '你去别的标签页了。这边的时钟还会走。' }
    case 'back':
      return { speaker: '栞', text: '外面没有上一页。这就是最前面。' }
  }
}
