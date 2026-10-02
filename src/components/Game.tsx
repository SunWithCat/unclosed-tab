import { useEffect, useReducer, useState } from 'react'
import { BrowserChrome } from '@/components/BrowserChrome'
import { LogDialog } from '@/components/LogDialog'
import { SaveLoadDialog } from '@/components/SaveLoadDialog'
import { SettingsDialog } from '@/components/SettingsDialog'
import { TitleScreen } from '@/components/TitleScreen'
import { Button } from '@/components/ui/button'
import { playTick } from '@/engine/audio'
import { bgSrc, GameVM, spriteSrc } from '@/engine/vm'
import { cn } from '@/lib/utils'

function useGame() {
  const [vm] = useState(() => new GameVM())
  const [, rerender] = useReducer((n: number) => n + 1, 0)
  useEffect(() => vm.subscribe(rerender), [vm])
  useEffect(() => {
    vm.bootBrowser()
    if (vm.runtime.session.refreshed) vm.startNew()
  }, [vm])
  return vm
}

export function Game() {
  const vm = useGame()
  const rt = vm.runtime
  const line = vm.currentLine()
  const choices = vm.choices()
  const playing = rt.menu !== 'title'
  const [shown, setShown] = useState(0)
  const text = line?.text ?? ''
  const [prevText, setPrevText] = useState(text)
  if (text !== prevText) {
    setPrevText(text)
    setShown(0)
  }
  const complete =
    shown >= text.length ||
    rt.settings.reducedMotion ||
    text.length === 0 ||
    choices.length > 0

  useEffect(() => {
    if (!playing || !text || complete) return
    const delay = Math.max(12, 1000 / rt.settings.cps)
    const id = window.setTimeout(() => {
      setShown((n) => Math.min(text.length, n + 1))
    }, delay)
    return () => window.clearTimeout(id)
  }, [playing, text, complete, rt.settings.cps, shown])

  const display = complete ? text : text.slice(0, shown)

  function handleAdvance() {
    if (rt.menu !== 'none' && rt.menu !== 'title') return
    if (!complete) {
      setShown(text.length)
      return
    }
    if (choices.length > 0) return
    playTick(rt.settings.mute)
    vm.advance()
  }

  useEffect(() => {
    if (!rt.settings.auto || !playing || !complete || choices.length > 0 || rt.snapshot.ended) return
    const id = window.setTimeout(() => vm.advance(), rt.settings.autoMs)
    return () => window.clearTimeout(id)
  }, [rt.settings.auto, rt.settings.autoMs, playing, complete, choices.length, rt.snapshot.ended, vm, text])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (rt.menu === 'title') return
      if (e.key === 'Escape') {
        vm.toTitle()
        return
      }
      if (rt.menu !== 'none') return
      if (e.key === 'Control') {
        vm.skipBurst()
        return
      }
      if (e.key === 's' || e.key === 'S') {
        vm.openMenu('save')
        return
      }
      if (e.key === 'l' || e.key === 'L') {
        vm.openMenu('load')
        return
      }
      if (e.key === 'ArrowLeft') {
        vm.rollback()
        return
      }
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'z' || e.key === 'Z') {
        e.preventDefault()
        handleAdvance()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const bg = rt.snapshot.showCg ? '/art/cg-glass.png' : bgSrc(rt.snapshot.background)
  const showSprite = rt.snapshot.expression !== 'hidden' && !rt.snapshot.showCg
  const speaker = line?.speaker ?? ''

  return (
    <div className="grain relative flex h-svh flex-col bg-night">
      <BrowserChrome
        address={playing ? rt.snapshot.address : 'about:blank'}
        title={playing ? rt.snapshot.docTitle : 'about:blank'}
      />

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          className="absolute inset-0 bg-[#07080c]"
          style={
            bg
              ? {
                  backgroundImage: `url(${bg})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        />
        {rt.snapshot.background === 'black' || !bg ? (
          <div className="absolute inset-0 bg-[#07080c]" />
        ) : null}

        {showSprite && playing ? (
          <img
            src={spriteSrc(rt.snapshot.expression)}
            alt="栞"
            className={cn(
              'pointer-events-none absolute bottom-0 left-1/2 z-10 max-h-[86%] -translate-x-1/2 select-none object-contain drop-shadow-2xl sm:max-h-[90%]',
              rt.settings.reducedMotion ? '' : 'fade-in',
            )}
          />
        ) : null}

        {playing ? (
          <div className="relative z-20 flex items-start justify-between gap-2 p-2 sm:p-3">
          <div className="flex min-w-0 flex-nowrap gap-0.5 overflow-x-auto sm:gap-1">
            <Button variant="ghost" size="menu" onClick={() => vm.toTitle()}>
              标题
            </Button>
            <Button variant="ghost" size="menu" onClick={() => vm.openMenu('save')}>
              存档
            </Button>
            <Button variant="ghost" size="menu" onClick={() => vm.openMenu('load')}>
              读档
            </Button>
            <Button variant="ghost" size="menu" onClick={() => vm.rollback()}>
              回滚
            </Button>
            <Button variant="ghost" size="menu" onClick={() => vm.openMenu('log')}>
              回想
            </Button>
          </div>
          <div className="flex shrink-0 gap-0.5 sm:gap-1">
            <Button variant="ghost" size="menu" onClick={() => vm.openMenu('settings')}>
              设置
            </Button>
            <Button
              variant={rt.settings.auto ? 'outline' : 'ghost'}
              size="menu"
              onClick={() => vm.updateSettings({ auto: !rt.settings.auto })}
            >
              自动
            </Button>
            <Button variant="ghost" size="menu" onClick={() => vm.skipBurst()}>
              跳过
            </Button>
          </div>
        </div>
        ) : null}

        {playing ? (
        <button
          type="button"
          className="relative z-10 min-h-0 flex-1 cursor-default"
          onClick={handleAdvance}
          onWheel={(e) => {
            if (e.deltaY < -20) vm.rollback()
            if (e.deltaY > 20) handleAdvance()
          }}
          aria-label="推进对话"
        />
        ) : (
          <div className="min-h-0 flex-1" />
        )}

        {playing ? (
          <div className="relative z-20 px-3 pb-3 sm:px-6 sm:pb-5">
            {choices.length > 0 ? (
              <div className="mb-3 flex flex-col gap-2">
                {choices.map((choice, i) => (
                  <Button
                    key={choice.text}
                    variant="outline"
                    className="h-auto justify-start whitespace-normal py-3 text-left font-serif"
                    onClick={() => {
                      playTick(rt.settings.mute)
                      vm.choose(i)
                    }}
                  >
                    {choice.text}
                  </Button>
                ))}
              </div>
            ) : null}

            {rt.showErase ? (
              <div className="mb-3">
                <Button variant="default" onClick={() => vm.eraseNow()}>
                  清除记忆
                </Button>
              </div>
            ) : null}

            <div
              className="rounded-xl border border-white/10 bg-black/55 px-4 py-3 shadow-2xl backdrop-blur-md sm:px-6 sm:py-4"
              onClick={handleAdvance}
            >
              {speaker ? (
                <div
                  className={cn(
                    'mb-2 inline-block rounded px-2 py-0.5 font-serif text-sm',
                    speaker === '系统' ? 'bg-white/8 text-mute' : 'bg-bookmark/90 text-white',
                  )}
                >
                  {speaker}
                </div>
              ) : null}
              <p className="min-h-[3.6em] font-serif text-[15px] leading-8 text-ink sm:text-[17px]">
                {display}
                {!complete ? <span className="caret text-bookmark">▌</span> : null}
                {complete && choices.length === 0 ? (
                  <span className="ml-2 text-xs text-mute">▼</span>
                ) : null}
              </p>
            </div>
          </div>
        ) : null}

        {rt.notice && playing ? (
          <button
            type="button"
            className="absolute top-14 right-3 z-30 max-w-xs rounded-lg border border-bookmark/40 bg-black/80 px-3 py-2 text-left text-xs text-ink"
            onClick={() => vm.dismissNotice()}
          >
            {rt.notice}
          </button>
        ) : null}
        {rt.menu === 'title' ? <TitleScreen vm={vm} /> : null}
      </div>

      <SaveLoadDialog vm={vm} mode="save" />
      <SaveLoadDialog vm={vm} mode="load" />
      <LogDialog vm={vm} />
      <SettingsDialog vm={vm} />
    </div>
  )
}
