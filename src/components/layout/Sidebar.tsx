import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils'

const nav = [
  { to: '/', label: 'Dashboard', icon: '◎' },
  { to: '/projects', label: 'Projects', icon: '◈' },
  { to: '/reviews', label: 'Reviews', icon: '◉' },
  { to: '/insights', label: 'Insights', icon: '⬡' },
  { to: '/business', label: 'Business', icon: '◈' },
]

export default function Sidebar() {
  return (
    <aside className="w-[220px] min-h-screen bg-[#f0ece4] border-r border-[rgba(139,127,109,0.18)] flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-7 py-8 border-b border-[rgba(139,127,109,0.15)]">
        {/* Concentric circle motif */}
        <div className="relative w-10 h-10 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-[rgba(92,122,92,0.12)]" />
          <div className="absolute inset-2 rounded-full border border-[rgba(92,122,92,0.2)]" />
          <div className="absolute inset-4 rounded-full border border-[rgba(92,122,92,0.35)]" />
          <div className="w-2 h-2 rounded-full bg-[rgba(92,122,92,0.5)]" />
        </div>
        <p className="text-[#2b2b2b] text-xs font-medium tracking-[0.18em] uppercase">Samsara</p>
        <p className="text-[#8a7f6d] text-xs tracking-wide mt-0.5">Life Tracker</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-5 space-y-1">
        {nav.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm transition-all duration-200',
                isActive
                  ? 'bg-[rgba(92,122,92,0.12)] text-[var(--foundation)] font-medium'
                  : 'text-[#8a7f6d] hover:text-[#2b2b2b] hover:bg-[rgba(139,127,109,0.08)]'
              )
            }
          >
            <span className="text-base leading-none opacity-60">{icon}</span>
            <span className="tracking-wide">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-7 py-5 border-t border-[rgba(139,127,109,0.15)]">
        <p className="text-[#8a7f6d] text-xs tracking-wider uppercase">SAST · UTC+2</p>
      </div>
    </aside>
  )
}
