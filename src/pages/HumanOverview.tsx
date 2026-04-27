import { useState } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

type ChakraId = 'root' | 'sacral' | 'solar' | 'heart' | 'throat' | 'thirdeye' | 'crown'

interface ChakraNode {
  id: ChakraId
  label: string
  title: string
  summary: string
  color: string
  top: number        // % from top of container
  side: 'left' | 'right'
  pdf?: string
}

// ── Data ───────────────────────────────────────────────────────────────────────

const CHAKRAS: ChakraNode[] = [
  {
    id: 'crown',
    label: 'Crown',
    title: 'Crown · Awaiting',
    summary:
      'This node is open. Future inputs: additional charts, sacred geometry, or personal revelation.',
    color: '#6B00B3',
    top: 11,
    side: 'right',
  },
  {
    id: 'thirdeye',
    label: 'Third Eye · Vedic',
    title: 'Taurus Ascendant · Aquarius Sun · Rahu Dasha',
    summary:
      'Vedic soul chart. Taurus Ascendant (Mrigashirsha): builder, sensual, land-rooted. Sun + Jupiter + Ketu in 10th (Aquarius): spiritual purpose, public detachment, cosmic contribution. Strong 11th house (Mars, Mercury, Saturn in Pisces): humanitarian ideals, disciplined creativity, networked action. Rahu in Leo 4th: ancestral healing, home as destiny. Moon in Virgo 5th (Uttara Phalguni): devoted service through joy. Current Maha Dasha: Rahu (2018–2036) — Saturn sub-dasha (Jan 2024 – Nov 2026): structure, discipline, karmic building.',
    color: '#2a0080',
    top: 16,
    side: 'left',
    pdf: '/docs/vedic-astrology.pdf',
  },
  {
    id: 'throat',
    label: 'Throat · Western Astrology',
    title: 'Pisces Sun · Gemini Rising · Virgo Moon',
    summary:
      'Sun in Pisces (House IX): visionary, spiritual, boundless imagination, truth-seeker. Moon in Virgo (House III): precise emotional world, service-oriented, analytical heart. Gemini Rising: quick-minded, adaptable, communicative face to the world. Heavy Aries MC with Mercury, Mars, Saturn in 10th: bold, pioneering public presence. Aquarius stellium in 8th (Venus, Uranus, Neptune): depth, transformation, unconventional soul. Jupiter conjunct Sun in Pisces: philosopher, traveller, teacher.',
    color: '#004488',
    top: 24,
    side: 'right',
    pdf: '/docs/western-astrology.pdf',
  },
  {
    id: 'heart',
    label: 'Heart · AI Synthesis',
    title: 'Who You Are',
    summary:
      'A 7-life-path Projector with Pisces Sun and Taurus Vedic Ascendant — you are a rare combination of boundless vision and deep groundedness. You see what others miss, build what others dream, and guide without needing to lead loudly. The Earth Tiger adds patient courage. You are in Rahu Dasha (2018–2036), the great expansion of your life — currently in the Saturn sub-period (2024–2026): the grind, the roots, the testing. This is not a time to rush. Build deep. What you are planting now will hold everything that comes.',
    color: '#1a5c2a',
    top: 35,
    side: 'left',
  },
  {
    id: 'solar',
    label: 'Solar Plexus · Human Design',
    title: 'Projector · Wait for the Invitation',
    summary:
      'You are not built to initiate — you are built to see. Your gift is reading systems, energy, and people with uncanny precision. The strategy is to wait for genuine recognition and invitation before acting. When aligned: Success. When not: Bitterness. Over-initiating drains you. Rest is not laziness — it is preparation. You are a guide, not a generator.',
    color: '#8B7A00',
    top: 44,
    side: 'right',
    pdf: '/docs/human-design.pdf',
  },
  {
    id: 'sacral',
    label: 'Sacral · Numerology',
    title: 'The Seeker · Life Path 7',
    summary:
      'Life Path 7 · Destiny 7 · Soul 4 · Personality 3 · Maturity 5. The double-7 stamps your life with a single mission: find truth. Your Soul desires order and foundation; your Personality charms and inspires. Currently in your First Pinnacle (7) — a time of self-discovery and spiritual development. Building years ahead.',
    color: '#8B5A00',
    top: 54,
    side: 'left',
    pdf: '/docs/numerology.pdf',
  },
  {
    id: 'root',
    label: 'Root · Chinese Astrology',
    title: 'Earth Tiger · 1998',
    summary:
      "Courageous and grounded. The Earth modifier tempers the Tiger's fire — you build before you leap. Magnetic, loyal, fierce in protection of what matters. Strategic patience is your edge.",
    color: '#8B2500',
    top: 65,
    side: 'right',
  },
]

// ── Layout constants ───────────────────────────────────────────────────────────

const DOT_LEFT = 49   // % x-position of the chakra spine
const LINE_LEN = 14   // SVG units (viewBox 0-100) — ~150-200px at typical viewport
const TOPBAR_H = 64   // px — matches TopBar height

// ── Injected styles ────────────────────────────────────────────────────────────

const STYLES = `
@import url("https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&display=swap");

.ho-dot  { cursor: pointer; }
.ho-label {
  cursor: pointer;
  transition: opacity 0.15s;
  user-select: none;
}
.ho-label:hover { opacity: 0.6; }
`

// ── Component ──────────────────────────────────────────────────────────────────

export default function HumanOverview() {
  const [active, setActive] = useState<ChakraId | null>(null)

  const toggle = (id: ChakraId) =>
    setActive(prev => (prev === id ? null : id))

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: `calc(100vh - ${TOPBAR_H}px)`,
        overflow: 'visible',
      }}
    >
      <style>{STYLES}</style>

      {/* ── Vitruvian background ── */}
      <img
        src="/vitruvian.jpg"
        alt="Vitruvian Man"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center top',
        }}
      />

      {/* ── Header ── */}
      <div
        style={{
          position: 'absolute',
          top: '18px',
          left: 0,
          right: 0,
          textAlign: 'center',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            fontFamily: '"IM Fell English", serif',
            fontStyle: 'italic',
            fontSize: '1.4rem',
            letterSpacing: '0.15em',
            color: '#3d2e1a',
          }}
        >
          Nicolas Criticos
        </div>
        <div
          style={{
            fontFamily: '"IM Fell English", serif',
            fontStyle: 'italic',
            fontSize: '0.82rem',
            letterSpacing: '0.08em',
            color: '#5a4a30',
            marginTop: '4px',
          }}
        >
          Born 13 March 1998 · Johannesburg
        </div>
      </div>

      {/* ── SVG overlay: architect lines + tick marks ── */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 2,
        }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {CHAKRAS.map(chakra => {
          const y = chakra.top
          const x2 =
            chakra.side === 'right'
              ? DOT_LEFT + LINE_LEN
              : DOT_LEFT - LINE_LEN
          return (
            <g key={chakra.id}>
              {/* Horizontal line */}
              <line
                x1={DOT_LEFT} y1={y}
                x2={x2}        y2={y}
                stroke="#5a4a30"
                strokeWidth="0.8"
                opacity="0.6"
                vectorEffect="non-scaling-stroke"
              />
              {/* Tick mark at line end */}
              <line
                x1={x2} y1={y - 0.5}
                x2={x2} y2={y + 0.5}
                stroke="#5a4a30"
                strokeWidth="0.8"
                opacity="0.75"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          )
        })}
      </svg>

      {/* ── Chakra nodes: dot + label + description ── */}
      {CHAKRAS.map(chakra => {
        const isActive = active === chakra.id
        const isRight = chakra.side === 'right'
        const lineEndX = isRight ? DOT_LEFT + LINE_LEN : DOT_LEFT - LINE_LEN

        // Position the label div just past the tick mark
        const labelPos: React.CSSProperties = isRight
          ? { left: `${lineEndX + 1}%` }
          : { right: `${100 - (lineEndX - 1)}%` }

        return (
          <div key={chakra.id}>
            {/* Dot */}
            <div
              className="ho-dot"
              onClick={() => toggle(chakra.id)}
              style={{
                position: 'absolute',
                left: `${DOT_LEFT}%`,
                top: `${chakra.top}%`,
                transform: 'translate(-50%, -50%)',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: chakra.color,
                opacity: 0.65,
                boxShadow: `0 0 8px ${chakra.color}99, 0 0 3px ${chakra.color}66`,
                zIndex: 5,
              }}
            />

            {/* Label + panel container */}
            <div
              style={{
                position: 'absolute',
                top: `${chakra.top}%`,
                ...labelPos,
                transform: 'translateY(-50%)',
                zIndex: 6,
                maxWidth: '220px',
                textAlign: isRight ? 'left' : 'right',
              }}
            >
              {/* Clickable label */}
              <div
                className="ho-label"
                onClick={() => toggle(chakra.id)}
                style={{
                  fontFamily: '"IM Fell English", serif',
                  fontStyle: 'italic',
                  fontSize: '0.82rem',
                  color: '#3d2e1a',
                  lineHeight: 1.2,
                }}
              >
                {chakra.label}
              </div>

              {/* Description panel — open when active */}
              {isActive && (
                <div
                  style={{
                    marginTop: '7px',
                    fontFamily: '"IM Fell English", serif',
                    fontStyle: 'italic',
                    color: '#4a3a28',
                    maxWidth: '220px',
                    lineHeight: 1.7,
                  }}
                >
                  {/* Title */}
                  <div
                    style={{
                      fontSize: '0.76rem',
                      color: '#3d2e1a',
                      marginBottom: '5px',
                    }}
                  >
                    {chakra.title}
                  </div>

                  {/* Body */}
                  <div style={{ fontSize: '0.72rem' }}>
                    {chakra.summary}
                  </div>

                  {/* PDF link */}
                  {chakra.pdf && (
                    <a
                      href={chakra.pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        marginTop: '7px',
                        fontFamily: '"IM Fell English", serif',
                        fontStyle: 'italic',
                        fontSize: '0.65rem',
                        color: '#5a4a30',
                        textDecoration: 'underline',
                        textUnderlineOffset: '2px',
                        opacity: 0.85,
                      }}
                    >
                      view source ↗
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
