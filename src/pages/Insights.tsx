import TopBar from '../components/layout/TopBar'
import PatternAlert from '../components/dashboard/PatternAlert'
import { usePatterns, useDailyLogs, useWeeklyReviews } from '../lib/queries'
import { format, parseISO } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

export default function Insights() {
  const { data: allPatterns = [], isLoading: loadingPatterns } = usePatterns()
  const { data: activePatterns = [] } = usePatterns(true)
  const { data: logs = [] } = useDailyLogs(30)
  const { data: reviews = [] } = useWeeklyReviews()

  // Energy & focus trend data (last 14 days of logs)
  const trendData = [...logs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)
    .map(log => ({
      date: format(parseISO(log.date), 'MM/dd'),
      momentum: log.momentum_score ?? 0,
    }))

  // Weekly completion trend
  const completionData = [...reviews]
    .sort((a, b) => a.week_start.localeCompare(b.week_start))
    .slice(-8)
    .map(r => ({
      week: format(parseISO(r.week_start), 'MM/dd'),
      rate: r.completion_rate ?? 0,
      momentum: r.momentum_score ?? 0,
    }))

  // Pattern distribution
  const patternCounts: Record<string, number> = {}
  allPatterns.forEach(p => {
    patternCounts[p.pattern_type] = (patternCounts[p.pattern_type] ?? 0) + 1
  })
  const patternDistribution = Object.entries(patternCounts).map(([type, count]) => ({
    type: type.replace(/_/g, ' '),
    count,
  }))

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Insights" />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Active patterns */}
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <p className="text-[#64748b] text-xs uppercase tracking-wide">Active Patterns</p>
            {activePatterns.length > 0 && (
              <span className="bg-amber-400/20 text-amber-400 text-xs px-1.5 py-0.5 rounded">
                {activePatterns.length}
              </span>
            )}
          </div>
          {activePatterns.length === 0 ? (
            <p className="text-[#64748b] text-sm">No active patterns — system is clean</p>
          ) : (
            <div className="space-y-2">
              {activePatterns.map(p => (
                <PatternAlert key={p.id} pattern={p} />
              ))}
            </div>
          )}
        </div>

        {/* Momentum trend */}
        {trendData.length > 0 && (
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-4">
            <p className="text-[#64748b] text-xs uppercase tracking-wide mb-4">
              Daily Momentum (last 14 days)
            </p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 10]}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 6 }}
                  labelStyle={{ color: '#f1f5f9', fontSize: 11 }}
                  itemStyle={{ color: '#4ade80', fontSize: 11 }}
                />
                <Bar dataKey="momentum" fill="#4ade80" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Weekly completion vs momentum */}
        {completionData.length > 0 && (
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-4">
            <p className="text-[#64748b] text-xs uppercase tracking-wide mb-4">
              Weekly Completion Rate (%)
            </p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={completionData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 6 }}
                  labelStyle={{ color: '#f1f5f9', fontSize: 11 }}
                  itemStyle={{ color: '#60a5fa', fontSize: 11 }}
                />
                <Bar dataKey="rate" fill="#60a5fa" radius={[3, 3, 0, 0]} name="Completion %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Pattern distribution */}
        {patternDistribution.length > 0 && (
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-4">
            <p className="text-[#64748b] text-xs uppercase tracking-wide mb-4">
              Pattern History ({allPatterns.length} total)
            </p>
            <div className="space-y-2">
              {patternDistribution.map(({ type, count }) => (
                <div key={type} className="flex items-center gap-3">
                  <span className="text-[#f1f5f9] text-sm capitalize flex-1">{type}</span>
                  <div className="flex-1 bg-[#2a2d3a] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full"
                      style={{ width: `${(count / allPatterns.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-[#64748b] text-xs w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All acknowledged patterns */}
        {allPatterns.filter(p => p.acknowledged).length > 0 && (
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-4">
            <p className="text-[#64748b] text-xs uppercase tracking-wide mb-3">
              Acknowledged Patterns
            </p>
            <div className="space-y-2">
              {allPatterns.filter(p => p.acknowledged).map(p => (
                <div key={p.id} className="flex items-start gap-3 py-2 border-b border-[#2a2d3a] last:border-0 opacity-60">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[#64748b] text-xs capitalize">
                        {p.pattern_type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[#64748b] text-xs">·</span>
                      <span className="text-[#64748b] text-xs">
                        {format(parseISO(p.detected_at), 'MMM d')}
                      </span>
                    </div>
                    <p className="text-[#f1f5f9] text-sm mt-0.5">{p.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {allPatterns.length === 0 && !loadingPatterns && (
          <div className="text-center py-12">
            <p className="text-[#64748b] text-sm">No patterns detected yet.</p>
            <p className="text-[#64748b] text-xs mt-1">Patterns will appear as you log daily activity.</p>
          </div>
        )}
      </main>
    </div>
  )
}
