import { format } from 'date-fns'
import { getWeekRange, formatWeekRange, nowInSAST } from '../../lib/utils'

interface TopBarProps {
  title: string
}

export default function TopBar({ title }: TopBarProps) {
  const now = nowInSAST()
  const { start, end } = getWeekRange(now)

  return (
    <header className="h-14 border-b border-[#2a2d3a] bg-[#1a1d27] flex items-center justify-between px-6 shrink-0">
      <h1 className="text-[#f1f5f9] font-semibold text-base">{title}</h1>
      <div className="flex items-center gap-4 text-sm text-[#64748b]">
        <span>Week: {formatWeekRange(start, end)}</span>
        <span className="text-[#2a2d3a]">|</span>
        <span>{format(now, 'EEE, MMM d')}</span>
      </div>
    </header>
  )
}
