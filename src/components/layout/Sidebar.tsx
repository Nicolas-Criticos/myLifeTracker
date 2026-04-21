import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils'

const nav = [
  { to: '/', label: 'Dashboard', icon: '⬡' },
  { to: '/projects', label: 'Projects', icon: '◈' },
  { to: '/reviews', label: 'Reviews', icon: '◉' },
  { to: '/insights', label: 'Insights', icon: '◎' },
]

export default function Sidebar() {
  return (
    <aside className="w-56 min-h-screen bg-[#1a1d27] border-r border-[#2a2d3a] flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[#2a2d3a]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#4ade80]" />
          <span className="text-[#f1f5f9] font-semibold text-sm tracking-wide">myLifeTracker</span>
        </div>
        <p className="text-[#64748b] text-xs mt-1">Execution OS</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors',
                isActive
                  ? 'bg-[#4ade80]/10 text-[#4ade80] font-medium'
                  : 'text-[#64748b] hover:text-[#f1f5f9] hover:bg-white/5'
              )
            }
          >
            <span className="text-base leading-none">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[#2a2d3a]">
        <p className="text-[#64748b] text-xs">SAST · UTC+2</p>
      </div>
    </aside>
  )
}
