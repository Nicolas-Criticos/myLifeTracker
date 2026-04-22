import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils'

const nav = [
  { to: '/', label: 'Dashboard', icon: '◎' },
  { to: '/projects', label: 'Projects', icon: '◈' },
  { to: '/reviews', label: 'Reviews', icon: '◉' },
  { to: '/insights', label: 'Insights', icon: '⬡' },
]

export default function Sidebar() {
  return (
    <aside className="w-52 min-h-screen bg-[#f0ece4] border-r border-[rgba(139,127,109,0.18)] flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-[rgba(139,127,109,0.15)]">
        <div className="flex items-center gap-2.5 mb-1">
          {/* Centered circle motif */}
          <div className="w-5 h-5 rounded-full border border-[rgba(92,122,92,0.5)] flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[var(--foundation)]" />
          </div>
          <span className="text-[#2b2b2b] font-medium text-sm tracking-widest uppercase">Samsara</span>
        </div>
        <p className="text-[#8a7f6d] text-xs tracking-wide pl-7.5">Life Tracker</p>
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
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
                isActive
                  ? 'bg-[rgba(92,122,92,0.12)] text-[var(--foundation)] font-medium'
                  : 'text-[#8a7f6d] hover:text-[#2b2b2b] hover:bg-[rgba(139,127,109,0.08)]'
              )
            }
          >
            <span className="text-base leading-none opacity-70">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[rgba(139,127,109,0.15)]">
        <p className="text-[#8a7f6d] text-xs tracking-wide">SAST · UTC+2</p>
      </div>
    </aside>
  )
}
