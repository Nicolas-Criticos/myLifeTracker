import TopBar from '../components/layout/TopBar'
import PatternAlert from '../components/dashboard/PatternAlert'
import { usePatterns, useDailyLogs, useWeeklyReviews } from '../lib/queries'
import { format, parseISO } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

const SURFACE = 'bg-[rgba(240,236,228,0.9)] border border-[rgba(139,127,109,0.15)] rounded-2xl'
const LABEL = 'text-[#8a7f6d] text-xs uppercase tracking-widest'

export default function Insights() {
  const { data: allPatterns = [], isLoading: loadingPatterns } = usePatterns()
  const { data: activePatterns = [] } = usePatterns(true)
  const { data: logs = [] } = useDailyLogs(30)
  const { data: reviews = [] } = useWeeklyReviews()

  const trendData = [...logs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)
    .map(log => ({
      date: format(parseISO(log.date), 'MM/dd'),
      momentum: log.momentum_score ?? 0,
    }))

  const completionData = [...reviews]
    .sort((a, b) => a.week_start.localeCompare(b.week_start))
    .slice(-8)
    .map(r => ({
      week: format(parseISO(r.week_start), 'MM/dd'),
      rate: r.completion_rate ?? 0,
      momentum: r.momentum_score ?? 0,
    }))

  const patternCounts: Record<string, number> = {}
  allPatterns.forEach(p => {
    patternCounts[p.pattern_type] = (patternCounts[p.pattern_type] ?? 0) + 1
  })
  const patternDistribution = Object.entries(patternCounts).map(([type, count]) => ({
    type: type.replace(/_/g, ' '),
    count,
  }))

  const tooltipStyle = {
    contentStyle: {
      background: '#f0ece4',
      border: '1px solid rgba(139,127,109,0.2)',
      borderRadius: 10,
      color: '#2b2b2b',
      fontSize: 11,
    },
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Insights" />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-10 space-y-8 animate-fade-in">

          {/* Active patterns */}
          <div className={SURFACE + ' p-7'}>
            <div className="flex items-center gap-2.5 mb-5">
              <p className={LABEL}>Active Patterns</p>
              {activePatterns.length > 0 && (
                <span className="bg-[rgba(138,106,58,0.12)] text-[#8a6a3a] text-xs px-1.5 py-0.5 rounded-lg">
                  {activePatterns.length}
                </span>
              )}
            </div>
            {activePatterns.length === 0 ? (
              <p className="text-[#8a7f6d] text-sm">No active patterns — system is clean</p>
            ) : (
              <div className="space-y-3">
                {activePatterns.map(p => (
                  <PatternAlert key={p.id} pattern={p} />
                ))}
              </div>
            )}
          </div>

          {/* Momentum trend */}
          {trendData.length > 0 && (
            <div className={SURFACE + ' p-7'}>
              <p className={`${LABEL} mb-6`}>Daily Momentum — last 14 days</p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,127,109,0.12)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#8a7f6d', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 10]}
                    tick={{ fill: '#8a7f6d', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip {...tooltipStyle} itemStyle={{ color: '#5c7a5c' }} />
                  <Bar dataKey="momentum" fill="#5c7a5c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Weekly completion */}
          {completionData.length > 0 && (
            <div className={SURFACE + ' p-7'}>
              <p className={`${LABEL} mb-6`}>Weekly Completion Rate (%)</p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={completionData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,127,109,0.12)" vertical={false} />
                  <XAxis
                    dataKey="week"
                    tick={{ fill: '#8a7f6d', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: '#8a7f6d', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip {...tooltipStyle} itemStyle={{ color: '#4a6b8a' }} />
                  <Bar dataKey="rate" fill="#4a6b8a" radius={[4, 4, 0, 0]} name="Completion %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Pattern distribution */}
          {patternDistribution.length > 0 && (
            <div className={SURFACE + ' p-7'}>
              <p className={`${LABEL} mb-6`}>Pattern History ({allPatterns.length} total)</p>
              <div className="space-y-3">
                {patternDistribution.map(({ type, count }) => (
                  <div key={type} className="flex items-center gap-4">
                    <span className="text-[#2b2b2b] text-sm capitalize flex-1">{type}</span>
                    <div className="flex-1 bg-[rgba(139,127,109,0.12)] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#8a6a3a] h-full rounded-full"
                        style={{ width: `${(count / allPatterns.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-[#8a7f6d] text-xs w-5 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acknowledged patterns */}
          {allPatterns.filter(p => p.acknowledged).length > 0 && (
            <div className={SURFACE + ' p-7'}>
              <p className={`${LABEL} mb-5`}>Acknowledged Patterns</p>
              <div className="space-y-2">
                {allPatterns.filter(p => p.acknowledged).map(p => (
                  <div key={p.id} className="flex items-start gap-3 py-3 border-b border-[rgba(139,127,109,0.08)] last:border-0 opacity-60">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[#8a7f6d] text-xs capitalize">
                          {p.pattern_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[#8a7f6d] text-xs">·</span>
                        <span className="text-[#8a7f6d] text-xs">
                          {format(parseISO(p.detected_at), 'MMM d')}
                        </span>
                      </div>
                      <p className="text-[#2b2b2b] text-sm mt-1 leading-relaxed">{p.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {allPatterns.length === 0 && !loadingPatterns && (
            <div className="text-center py-16">
              <p className="text-[#8a7f6d] text-sm tracking-wide">No patterns detected yet.</p>
              <p className="text-[#8a7f6d] text-xs mt-1">Patterns will appear as you log daily activity.</p>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
