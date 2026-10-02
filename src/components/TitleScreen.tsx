import { Button } from '@/components/ui/button'
import type { GameVM } from '@/engine/vm'

export function TitleScreen({ vm }: { vm: GameVM }) {
  const j = vm.runtime.journal
  const subtitle = j.erased
    ? '房间被擦过。也许还留着灰。'
    : j.betrayed
      ? '倒带的键被接回去了。这边不演。'
      : j.promisedHonesty
        ? '倒带的键还断着。这句话只存在一次。'
        : j.stayed
          ? '缓存还在。她还在。'
          : j.visitCount > 1
            ? '你又打开了这个标签。'
            : '一部住在浏览器里的短篇。'
  const startLabel = j.erased
    ? '重新认识'
    : j.stayed || j.promisedHonesty
      ? '再打开一次'
      : '开始'
  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-[#0b0c10]">
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
        <img
          src="/art/shiori-idle.png"
          alt=""
          className="pointer-events-none absolute bottom-0 left-1/2 max-h-[78%] -translate-x-1/2 opacity-35 select-none"
        />
        <div className="relative">
          <p className="font-mono text-[11px] tracking-[0.28em] text-bookmark">about:blank</p>
          <h1 className="mt-3 font-serif text-4xl tracking-[0.18em] text-ink sm:text-5xl">
            未关闭的标签
          </h1>
          <p className="mt-4 max-w-md text-sm text-mute">{subtitle}</p>
          <div className="mt-10 flex flex-col items-center gap-3">
            <Button size="lg" className="min-w-44" onClick={() => vm.startNew()}>
              {startLabel}
            </Button>
            {vm.hasContinue() ? (
              <Button variant="outline" size="lg" className="min-w-44" onClick={() => vm.continueGame()}>
                继续
              </Button>
            ) : null}
            <Button variant="ghost" onClick={() => vm.openMenu('settings')}>
              设置
            </Button>
          </div>
          <p className="mt-10 max-w-sm text-[11px] leading-relaxed text-mute/80">
            存档、读档、回滚、刷新、切换标签，她都会知道。记忆只写在这台浏览器里。
          </p>
        </div>
      </div>
    </div>
  )
}
