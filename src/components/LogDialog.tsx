import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { GameVM } from '@/engine/vm'

export function LogDialog({ vm }: { vm: GameVM }) {
  return (
    <Dialog
      open={vm.runtime.menu === 'log'}
      onOpenChange={(next) => {
        if (!next) vm.closeMenu()
      }}
    >
      <DialogContent className="w-[min(92vw,520px)]">
        <DialogTitle>回想</DialogTitle>
        <DialogDescription>已经说过的话。回滚不会从这里消失。</DialogDescription>
        <div className="mt-3 max-h-[50vh] space-y-2 overflow-y-auto pr-1 text-sm">
          {vm.runtime.snapshot.log.length === 0 ? (
            <p className="text-mute">还是空白。</p>
          ) : (
            vm.runtime.snapshot.log.map((line, i) => (
              <p key={`${i}-${line.text.slice(0, 12)}`} className="leading-relaxed">
                {line.speaker ? (
                  <span className="mr-2 text-bookmark">{line.speaker}</span>
                ) : null}
                <span className={line.speaker === '系统' ? 'text-mute' : 'text-ink/90'}>
                  {line.text}
                </span>
              </p>
            ))
          )}
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
