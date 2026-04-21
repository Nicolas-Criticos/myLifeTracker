import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
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
      <div className="flex items-center justify-center h-24 text-[#64748b] text-sm">
        No momentum data this week
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={80}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 10]}
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 6 }}
          labelStyle={{ color: '#f1f5f9', fontSize: 12 }}
          itemStyle={{ color: '#4ade80', fontSize: 12 }}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#4ade80"
          strokeWidth={2}
          dot={{ r: 3, fill: '#4ade80', strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
