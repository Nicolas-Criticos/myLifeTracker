import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import type { DailyLog } from '../../lib/supabase'

interface MomentumChartProps {
  logs: DailyLog[]
}

export default function MomentumChart({ logs }: MomentumChartProps) {
  const data = [...logs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(log => ({
      date: format(parseISO(log.date), 'EEE'),
      score: log.momentum_score ?? 0,
    }))

  if (data.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '80px',
        fontFamily: 'var(--font-body)',
        fontWeight: 300,
        fontSize: '0.875rem',
        color: 'var(--ink-muted)',
        fontStyle: 'italic',
      }}>
        Today is day one. Come back tonight and log how it went.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={100}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="oliveGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#6b7c5c" stopOpacity={0.22} />
            <stop offset="95%" stopColor="#6b7c5c" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tick={{ fill: '#7a7568', fontSize: 11, fontFamily: 'var(--font-body)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 10]}
          tick={{ fill: '#7a7568', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: 'rgba(255,252,245,0.95)',
            border: '1px solid rgba(44,42,37,0.08)',
            borderRadius: '12px',
            color: '#2c2a25',
            fontSize: 12,
            fontFamily: 'var(--font-body)',
            boxShadow: '0 4px 24px rgba(44,42,37,0.08)',
          }}
          itemStyle={{ color: '#6b7c5c' }}
        />
        <Area
          type="monotone"
          dataKey="score"
          stroke="#6b7c5c"
          strokeWidth={1.5}
          fill="url(#oliveGrad)"
          dot={false}
          activeDot={{ r: 3, fill: '#6b7c5c', stroke: 'none' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
