import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import type { GameVM } from '@/engine/vm'

export function SettingsDialog({ vm }: { vm: GameVM }) {
  const s = vm.runtime.settings
  return (
    <Dialog
      open={vm.runtime.menu === 'settings'}
      onOpenChange={(next) => {
        if (!next) vm.closeMenu()
      }}
    >
      <DialogContent>
        <DialogTitle>设置</DialogTitle>
        <DialogDescription>只存在这台浏览器里。</DialogDescription>
        <div className="mt-4 space-y-5 text-sm">
          <label className="block">
            <div className="mb-2 flex justify-between text-mute">
              <span>文字速度</span>
              <span>{s.cps} 字/秒</span>
            </div>
            <Slider
              min={10}
              max={60}
              step={1}
              value={[s.cps]}
              onValueChange={([cps]) => vm.updateSettings({ cps: cps ?? s.cps })}
            />
          </label>
          <label className="block">
            <div className="mb-2 flex justify-between text-mute">
              <span>自动间隔</span>
              <span>{(s.autoMs / 1000).toFixed(1)} 秒</span>
            </div>
            <Slider
              min={600}
              max={2800}
              step={100}
              value={[s.autoMs]}
              onValueChange={([autoMs]) => vm.updateSettings({ autoMs: autoMs ?? s.autoMs })}
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-mute">减少动效</span>
            <input
              type="checkbox"
              checked={s.reducedMotion}
              onChange={(e) => vm.updateSettings({ reducedMotion: e.target.checked })}
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-mute">静音</span>
            <input
              type="checkbox"
              checked={s.mute}
              onChange={(e) => vm.updateSettings({ mute: e.target.checked })}
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end">
          <Button variant="ghost" onClick={() => vm.closeMenu()}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
