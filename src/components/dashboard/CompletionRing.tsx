interface CompletionRingProps {
  percent: number
  color: string
  size?: number
}

export default function CompletionRing({ percent, color, size = 48 }: CompletionRingProps) {
  const r = (size - 4) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (percent / 100) * circumference

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--border)"
        strokeWidth={2}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ opacity: 0.7 }}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize={size < 50 ? '9' : '11'}
        fill="var(--ink-muted)"
        fontFamily="var(--font-body)"
        fontWeight="300"
      >
        {Math.round(percent)}%
      </text>
    </svg>
  )
}
