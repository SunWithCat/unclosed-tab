type Props = {
  address: string
  title: string
  compact?: boolean
}

export function BrowserChrome({ address, title, compact }: Props) {
  return (
    <div className="flex shrink-0 flex-col border-b border-white/10 bg-[#12131a]">
      <div className="flex items-center gap-2 px-3 py-1.5">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="ml-2 hidden min-w-0 flex-1 items-center gap-2 sm:flex">
          <div className="truncate rounded-md bg-black/40 px-3 py-1 font-mono text-[11px] text-mute">
            {address}
          </div>
        </div>
        <div className="ml-auto max-w-[45%] truncate font-serif text-xs text-ink/80 sm:max-w-none">
          {title}
        </div>
      </div>
      {compact ? null : (
        <div className="flex gap-1 px-2 pb-1.5 sm:hidden">
          <div className="truncate rounded-md bg-black/40 px-2 py-1 font-mono text-[10px] text-mute">
            {address}
          </div>
        </div>
      )}
    </div>
  )
}
