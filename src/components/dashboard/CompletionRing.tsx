interface CompletionRingProps {
  percent: number
  color: string
  size?: number
}

export default function CompletionRing({ percent, color, size = 48 }: CompletionRingProps) {
  const r = (size - 6) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (percent / 100) * circumference

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#2a2d3a"
        strokeWidth={5}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize={size < 50 ? '10' : '12'}
        fill="#f1f5f9"
        fontFamily="Inter, sans-serif"
      >
        {Math.round(percent)}%
      </text>
    </svg>
  )
}
