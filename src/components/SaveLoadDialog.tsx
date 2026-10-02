import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { formatWhen } from '@/lib/utils'
import type { GameVM } from '@/engine/vm'

export function SaveLoadDialog({
  vm,
  mode,
}: {
  vm: GameVM
  mode: 'save' | 'load'
}) {
  const open = vm.runtime.menu === mode
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) vm.closeMenu()
      }}
    >
      <DialogContent>
        <DialogTitle>{mode === 'save' ? '存档 · 闪光灯' : '读档 · 旧消息'}</DialogTitle>
        <DialogDescription>
          {mode === 'save'
            ? '存一次，她就会被拍一张照片。'
            : '读档时，她会跟刚才的自己握手。'}
        </DialogDescription>
        <div className="mt-4 space-y-2">
          {([0, 1, 2] as const).map((i) => {
            const slot = vm.runtime.saves[i]
            return (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (mode === 'save') vm.saveSlot(i)
                else if (slot) vm.loadSlot(i)
              }}
              disabled={mode === 'load' && !slot}
              className="flex w-full items-start justify-between gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-left hover:border-bookmark/50 disabled:opacity-40"
            >
              <div>
                <div className="text-xs text-bookmark">第 {i + 1} 格</div>
                <div className="mt-1 font-serif text-sm text-ink">
                  {slot ? slot.lastLine : '空'}
                </div>
                {slot ? (
                  <div className="mt-1 text-[11px] text-mute">{formatWhen(slot.at)}</div>
                ) : null}
              </div>
              {slot ? <span className="text-bookmark">🔖</span> : null}
            </button>
            )
          })}
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" onClick={() => vm.closeMenu()}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
