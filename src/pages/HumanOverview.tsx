import { useState } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

type ChakraId = 'root' | 'sacral' | 'solar' | 'heart' | 'throat' | 'thirdeye' | 'crown'

interface ChakraNode {
  id: ChakraId
  label: string
  title: string
  summary: string
  color: string
  cy: number
  delay: number
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
    cy: 44,
    delay: 0,
  },
  {
    id: 'thirdeye',
    label: 'Third Eye',
    title: 'Taurus Ascendant · Aquarius Sun · Rahu Dasha',
    summary:
      'Vedic soul chart. Taurus Ascendant (Mrigashirsha): builder, sensual, land-rooted. Sun + Jupiter + Ketu in 10th (Aquarius): spiritual purpose, public detachment, cosmic contribution. Strong 11th house (Mars, Mercury, Saturn in Pisces): humanitarian ideals, disciplined creativity, networked action. Rahu in Leo 4th: ancestral healing, home as destiny. Moon in Virgo 5th (Uttara Phalguni): devoted service through joy. Current Maha Dasha: Rahu (2018–2036) — Saturn sub-dasha (Jan 2024 – Nov 2026): structure, discipline, karmic building.',
    color: '#2a0080',
    cy: 80,
    delay: 0.28,
  },
  {
    id: 'throat',
    label: 'Throat',
    title: 'Pisces Sun · Gemini Rising · Virgo Moon',
    summary:
      'Sun in Pisces (House IX): visionary, spiritual, boundless imagination, truth-seeker. Moon in Virgo (House III): precise emotional world, service-oriented, analytical heart. Gemini Rising: quick-minded, adaptable, communicative face to the world. Heavy Aries MC with Mercury, Mars, Saturn in 10th: bold, pioneering public presence. Aquarius stellium in 8th (Venus, Uranus, Neptune): depth, transformation, unconventional soul. Jupiter conjunct Sun in Pisces: philosopher, traveller, teacher.',
    color: '#004488',
    cy: 155,
    delay: 0.56,
  },
  {
    id: 'heart',
    label: 'Heart',
    title: 'Who You Are',
    summary:
      'A 7-life-path Projector with Pisces Sun and Taurus Vedic Ascendant — you are a rare combination of boundless vision and deep groundedness. You see what others miss, build what others dream, and guide without needing to lead loudly. The Earth Tiger adds patient courage. You are in Rahu Dasha (2018–2036), the great expansion of your life — currently in the Saturn sub-period (2024–2026): the grind, the roots, the testing. This is not a time to rush. Build deep. What you are planting now will hold everything that comes.',
    color: '#1a5c2a',
    cy: 215,
    delay: 0.84,
  },
  {
    id: 'solar',
    label: 'Solar Plexus',
    title: 'Projector · Wait for the Invitation',
    summary:
      'You are not built to initiate — you are built to see. Your gift is reading systems, energy, and people with uncanny precision. The strategy is to wait for genuine recognition and invitation before acting. When aligned: Success. When not: Bitterness. Over-initiating drains you. Rest is not laziness — it is preparation. You are a guide, not a generator.',
    color: '#8B7A00',
    cy: 270,
    delay: 1.12,
  },
  {
    id: 'sacral',
    label: 'Sacral',
    title: 'The Seeker · Life Path 7',
    summary:
      'Life Path 7 · Destiny 7 · Soul 4 · Personality 3 · Maturity 5. The double-7 stamps your life with a single mission: find truth. Your Soul desires order and foundation; your Personality charms and inspires. Currently in your First Pinnacle (7) — a time of self-discovery and spiritual development. Building years ahead.',
    color: '#8B5A00',
    cy: 325,
    delay: 1.4,
  },
  {
    id: 'root',
    label: 'Root',
    title: 'Earth Tiger · 1998',
    summary:
      "Courageous and grounded. The Earth modifier tempers the Tiger's fire — you build before you leap. Magnetic, loyal, fierce in protection of what matters. Strategic patience is your edge.",
    color: '#8B2500',
    cy: 375,
    delay: 1.68,
  },
]

// ── Star background ────────────────────────────────────────────────────────────

function makeStars(n: number, seed0: number): string {
  let seed = seed0
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  const out: string[] = []
  for (let i = 0; i < n; i++) {
    const x = Math.floor(rand() * 2600)
    const y = Math.floor(rand() * 2800)
    const a = (0.12 + rand() * 0.45).toFixed(2)
    out.push(`${x}px ${y}px 0 0 rgba(212,196,160,${a})`)
  }
  return out.join(',')
}

const STARS_SM = makeStars(700, 42)
const STARS_MD = makeStars(160, 13579)

// ── Styles ─────────────────────────────────────────────────────────────────────

const INJECTED_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');

.human-page * { box-sizing: border-box; }

@keyframes chakraPulse {
  0%, 100% { transform: scale(1); opacity: 0.85; }
  50% { transform: scale(1.38); opacity: 1; }
}
@keyframes chakraOuter {
  0%, 100% { transform: scale(1); opacity: 0.22; }
  50% { transform: scale(1.75); opacity: 0.07; }
}
@keyframes chakraActiveGlow {
  0%, 100% { transform: scale(1.5); opacity: 0.55; }
  50% { transform: scale(2.1); opacity: 0.75; }
}
@keyframes panelReveal {
  from { opacity: 0; transform: translateY(-14px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes starFade {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

.chakra-inner {
  animation: chakraPulse 2.2s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: center;
  cursor: pointer;
  transition: stroke 0.25s, stroke-width 0.25s;
}
.chakra-outer {
  animation: chakraOuter 2.2s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: center;
  pointer-events: none;
}
.chakra-inner-active {
  animation: none;
  transform-box: fill-box;
  transform-origin: center;
  cursor: pointer;
  transition: stroke 0.25s, stroke-width 0.25s;
}
.chakra-outer-active {
  animation: chakraActiveGlow 1.5s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: center;
  pointer-events: none;
}
.human-panel {
  animation: panelReveal 0.45s cubic-bezier(0.22,1,0.36,1) forwards;
}
.human-view-btn {
  font-family: 'EB Garamond', serif;
  font-size: 0.82rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  background: transparent;
  border: 1px solid rgba(200,168,75,0.38);
  color: #c8a84b;
  padding: 8px 26px;
  border-radius: 3px;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}
.human-view-btn:hover {
  background: rgba(200,168,75,0.08);
  border-color: rgba(200,168,75,0.65);
}
`

// ── Component ──────────────────────────────────────────────────────────────────

export default function HumanOverview() {
  const [active, setActive] = useState<ChakraId | null>(null)
  const activeChakra = active ? CHAKRAS.find(c => c.id === active) : null

  const handleNode = (id: ChakraId) => {
    setActive(prev => (prev === id ? null : id))
  }

  return (
    <div
      className="human-page"
      style={{
        background: '#0f0d0a',
        minHeight: '100vh',
        color: '#d4c4a0',
        paddingTop: '80px',
        paddingBottom: '100px',
        position: 'relative',
      }}
    >
      <style>{INJECTED_STYLES}</style>

      {/* Star layers */}
      <div
        style={{
          position: 'fixed', top: 0, left: 0,
          width: '1px', height: '1px',
          borderRadius: '50%', background: 'transparent',
          boxShadow: STARS_SM, zIndex: 0, pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'fixed', top: 0, left: 0,
          width: '1.5px', height: '1.5px',
          borderRadius: '50%', background: 'transparent',
          boxShadow: STARS_MD, zIndex: 0, pointerEvents: 'none',
        }}
      />

      {/* Main content */}
      <div
        style={{
          position: 'relative', zIndex: 1,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '0 24px',
        }}
      >
        {/* ── Header ── */}
        <h1
          style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontSize: 'clamp(1.6rem, 4vw, 2.7rem)',
            fontWeight: 700,
            color: '#c8a84b',
            letterSpacing: '0.04em',
            margin: '0 0 12px',
            textAlign: 'center',
            textShadow: '0 0 50px rgba(200,168,75,0.28)',
          }}
        >
          Nicolas Criticos
        </h1>
        <p
          style={{
            fontFamily: "'EB Garamond', serif",
            fontSize: '1.08rem',
            fontStyle: 'italic',
            color: '#9a8a6a',
            letterSpacing: '0.09em',
            margin: '0 0 56px',
          }}
        >
          Born 13 March 1998 · Johannesburg
        </p>

        {/* ── Vitruvian Man ── */}
        <svg
          viewBox="0 0 500 610"
          width="500"
          height="610"
          style={{ maxWidth: '90vw', overflow: 'visible' }}
          aria-label="Vitruvian figure with chakra nodes"
        >
          <defs>
            <radialGradient id="hvFigureGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#c8a84b" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#c8a84b" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background glow */}
          <ellipse cx="250" cy="300" rx="190" ry="280" fill="url(#hvFigureGlow)" />

          {/* Outer circle */}
          <circle cx="250" cy="300" r="255" fill="none" stroke="#c8a84b" strokeWidth="0.8" strokeOpacity="0.25" />

          {/* Second ring */}
          <circle cx="250" cy="300" r="215" fill="none" stroke="#c8a84b" strokeWidth="0.4" strokeOpacity="0.1" />

          {/* Square */}
          <rect x="15" y="45" width="470" height="510" fill="none" stroke="#c8a84b" strokeWidth="0.5" strokeOpacity="0.15" />

          {/* ── HEAD ── */}
          <circle cx="250" cy="92" r="46" fill="none" stroke="#d4c4a0" strokeWidth="1.5" strokeOpacity="0.85" />

          {/* ── NECK ── */}
          <path d="M238,136 L237,160 M262,136 L263,160" stroke="#d4c4a0" strokeWidth="1.2" strokeOpacity="0.7" />

          {/* ── CLAVICLES / SHOULDERS ── */}
          <path d="M237,160 L192,168 M263,160 L308,168" stroke="#d4c4a0" strokeWidth="1.5" strokeOpacity="0.8" />

          {/* ── ARMS (extended, slightly angled down) ── */}
          <path d="M192,168 L108,196 L28,233" stroke="#d4c4a0" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.85" />
          <path d="M308,168 L392,196 L472,233" stroke="#d4c4a0" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.85" />

          {/* Hands */}
          <circle cx="28" cy="233" r="7" fill="none" stroke="#d4c4a0" strokeWidth="1.2" strokeOpacity="0.6" />
          <circle cx="472" cy="233" r="7" fill="none" stroke="#d4c4a0" strokeWidth="1.2" strokeOpacity="0.6" />

          {/* ── GHOST ARMS (raised, touching circle) ── */}
          <path d="M192,168 L88,130 L18,105" stroke="#d4c4a0" strokeWidth="0.6" strokeOpacity="0.17" strokeDasharray="5,5" />
          <path d="M308,168 L412,130 L482,105" stroke="#d4c4a0" strokeWidth="0.6" strokeOpacity="0.17" strokeDasharray="5,5" />

          {/* ── SPINE / TORSO CENTER ── */}
          <line x1="250" y1="160" x2="250" y2="374" stroke="#d4c4a0" strokeWidth="1.2" strokeOpacity="0.65" />

          {/* ── RIB CAGE OUTLINE ── */}
          <path
            d="M192,168 Q168,228 192,282 Q220,300 250,302 Q280,300 308,282 Q332,228 308,168"
            fill="none" stroke="#d4c4a0" strokeWidth="0.9" strokeOpacity="0.52"
          />

          {/* Navel dot */}
          <circle cx="250" cy="300" r="3" fill="#d4c4a0" fillOpacity="0.32" />

          {/* ── LOWER ABDOMEN SIDES ── */}
          <path d="M192,282 Q190,330 206,374" stroke="#d4c4a0" strokeWidth="0.9" strokeOpacity="0.48" />
          <path d="M308,282 Q310,330 294,374" stroke="#d4c4a0" strokeWidth="0.9" strokeOpacity="0.48" />

          {/* ── PELVIS ARC ── */}
          <path d="M206,374 Q250,362 294,374" stroke="#d4c4a0" strokeWidth="1.3" strokeOpacity="0.7" />

          {/* ── LEGS ── */}
          <path d="M218,374 L196,477 L181,555" stroke="#d4c4a0" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.85" />
          <path d="M282,374 L304,477 L319,555" stroke="#d4c4a0" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.85" />

          {/* Knees */}
          <circle cx="196" cy="477" r="7" fill="none" stroke="#d4c4a0" strokeWidth="1.1" strokeOpacity="0.5" />
          <circle cx="304" cy="477" r="7" fill="none" stroke="#d4c4a0" strokeWidth="1.1" strokeOpacity="0.5" />

          {/* Feet */}
          <path d="M170,556 L193,559" stroke="#d4c4a0" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.7" />
          <path d="M307,556 L330,559" stroke="#d4c4a0" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.7" />

          {/* ── GHOST LEGS (wider spread) ── */}
          <path d="M218,374 L158,555" stroke="#d4c4a0" strokeWidth="0.6" strokeOpacity="0.17" strokeDasharray="5,5" />
          <path d="M282,374 L342,555" stroke="#d4c4a0" strokeWidth="0.6" strokeOpacity="0.17" strokeDasharray="5,5" />

          {/* ── PROPORTION LINES (very faint) ── */}
          <line x1="110" y1="138" x2="390" y2="138" stroke="#c8a84b" strokeWidth="0.4" strokeOpacity="0.1" />
          <line x1="110" y1="300" x2="390" y2="300" stroke="#c8a84b" strokeWidth="0.4" strokeOpacity="0.1" />
          <line x1="110" y1="477" x2="390" y2="477" stroke="#c8a84b" strokeWidth="0.4" strokeOpacity="0.1" />

          {/* ── CHAKRA NODES ── */}
          {CHAKRAS.map(chakra => {
            const isActive = active === chakra.id
            return (
              <g key={chakra.id} onClick={() => handleNode(chakra.id)} style={{ cursor: 'pointer' }}>
                <title>{chakra.label}: {chakra.title}</title>

                {/* Outer glow ring */}
                <circle
                  cx="250"
                  cy={chakra.cy}
                  r="14"
                  fill={chakra.color}
                  className={isActive ? 'chakra-outer-active' : 'chakra-outer'}
                  style={{ animationDelay: `${chakra.delay}s` }}
                />

                {/* Inner dot */}
                <circle
                  cx="250"
                  cy={chakra.cy}
                  r="7"
                  fill={chakra.color}
                  fillOpacity={isActive ? 1 : 0.82}
                  stroke={isActive ? '#c8a84b' : 'rgba(212,196,160,0.35)'}
                  strokeWidth={isActive ? 2.5 : 1}
                  className={isActive ? 'chakra-inner-active' : 'chakra-inner'}
                  style={{ animationDelay: `${chakra.delay}s` }}
                />
              </g>
            )
          })}
        </svg>

        {/* ── Expanded panel ── */}
        {activeChakra && (
          <div
            key={activeChakra.id}
            className="human-panel"
            style={{
              marginTop: '36px',
              width: '100%',
              maxWidth: '660px',
              background: 'rgba(12,10,8,0.9)',
              border: '1px solid rgba(200,168,75,0.32)',
              borderRadius: '6px',
              padding: '34px 40px',
              boxShadow: '0 0 60px rgba(200,168,75,0.07), inset 0 1px 0 rgba(200,168,75,0.1)',
            }}
          >
            {/* Label row */}
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                fontFamily: "'EB Garamond', serif",
                fontSize: '0.73rem',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: activeChakra.color,
                marginBottom: '12px',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: activeChakra.color,
                  boxShadow: `0 0 12px ${activeChakra.color}`,
                  flexShrink: 0,
                }}
              />
              {activeChakra.label}
            </div>

            {/* Title */}
            <h2
              style={{
                fontFamily: "'Cinzel Decorative', serif",
                fontSize: 'clamp(0.95rem, 2.5vw, 1.22rem)',
                fontWeight: 700,
                color: '#c8a84b',
                margin: '0 0 20px',
                letterSpacing: '0.02em',
                lineHeight: 1.35,
              }}
            >
              {activeChakra.title}
            </h2>

            {/* Summary */}
            <p
              style={{
                fontFamily: "'EB Garamond', serif",
                fontSize: '1.1rem',
                lineHeight: 1.78,
                color: '#d4c4a0',
                margin: '0 0 28px',
              }}
            >
              {activeChakra.summary}
            </p>

            {/* View Full */}
            <button
              className="human-view-btn"
              onClick={() => alert(`${activeChakra.label} — full view coming soon.`)}
            >
              View Full
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
