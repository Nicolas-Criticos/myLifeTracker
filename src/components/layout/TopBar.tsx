import { format } from 'date-fns'
import { formatWeekRange, getWeekRange, nowInSAST } from '../../lib/utils'

interface TopBarProps {
  title: string
}

export default function TopBar({ title }: TopBarProps) {
  const now = nowInSAST()
  const { start, end } = getWeekRange(now)

  return (
    <header className="h-14 border-b border-[rgba(139,127,109,0.15)] bg-[#f6f3ee] flex items-center justify-between px-6 shrink-0">
      <h1 className="text-[#2b2b2b] font-medium text-base tracking-wide">{title}</h1>
      <div className="flex items-center gap-4 text-sm text-[#8a7f6d]">
        <span className="tracking-wide">Week: {formatWeekRange(start, end)}</span>
        <span className="text-[rgba(139,127,109,0.3)]">·</span>
        <span>{format(now, 'EEE, MMM d')}</span>
      </div>
    </header>
  )
}
