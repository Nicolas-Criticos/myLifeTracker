import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// ── Types ──────────────────────────────────────────────────────────────────────

type ChakraId = 'root' | 'sacral' | 'solar' | 'heart' | 'throat' | 'thirdeye' | 'crown'

interface ChakraNode {
  id: ChakraId
  label: string
  title: string
  summary: string
  color: string
  top: number
  side: 'left' | 'right'
  pdf?: string
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  alpha: number
  alphaDir: number
  alphaSpeed: number
}

// ── Data ───────────────────────────────────────────────────────────────────────

const CHAKRAS: ChakraNode[] = [
  {
    id: 'crown',
    label: 'Crown · AI Synthesis',
    title: 'Who You Are',
    summary:
      'A 7-life-path Projector with Pisces Sun and Taurus Vedic Ascendant — you are a rare combination of boundless vision and deep groundedness. You see what others miss, build what others dream, and guide without needing to lead loudly. The Earth Tiger adds patient courage. You are in Rahu Dasha (2018–2036), the great expansion of your life — currently in the Saturn sub-period (2024–2026): the grind, the roots, the testing. This is not a time to rush. Build deep. What you are planting now will hold everything that comes.',
    color: '#7B00CC',
    top: 15,
    side: 'right',
  },
  {
    id: 'thirdeye',
    label: 'Third Eye · Vedic',
    title: 'Taurus Ascendant · Aquarius Sun · Rahu Dasha',
    summary:
      'Vedic soul chart. Taurus Ascendant (Mrigashirsha): builder, sensual, land-rooted. Sun + Jupiter + Ketu in 10th (Aquarius): spiritual purpose, public detachment, cosmic contribution. Strong 11th house (Mars, Mercury, Saturn in Pisces): humanitarian ideals, disciplined creativity, networked action. Rahu in Leo 4th: ancestral healing, home as destiny. Moon in Virgo 5th (Uttara Phalguni): devoted service through joy. Current Maha Dasha: Rahu (2018–2036) — Saturn sub-dasha (Jan 2024 – Nov 2026): structure, discipline, karmic building.',
    color: '#3311AA',
    top: 20,
    side: 'left',
    pdf: '/docs/vedic-astrology.pdf',
  },
  {
    id: 'throat',
    label: 'Throat · Western Astrology',
    title: 'Pisces Sun · Gemini Rising · Virgo Moon',
    summary:
      'Sun in Pisces (House IX): visionary, spiritual, boundless imagination, truth-seeker. Moon in Virgo (House III): precise emotional world, service-oriented, analytical heart. Gemini Rising: quick-minded, adaptable, communicative face to the world. Heavy Aries MC with Mercury, Mars, Saturn in 10th: bold, pioneering public presence. Aquarius stellium in 8th (Venus, Uranus, Neptune): depth, transformation, unconventional soul. Jupiter conjunct Sun in Pisces: philosopher, traveller, teacher.',
    color: '#0055AA',
    top: 27,
    side: 'right',
    pdf: '/docs/western-astrology.pdf',
  },
  {
    id: 'heart',
    label: 'Heart · Nicolas Criticos',
    title: 'Skills & Experience',
    summary:
      'Qualified electrical engineer with a deep commitment to sustainable living and regenerative agriculture. Combines technical engineering expertise with hands-on experience in permaculture, earthship construction, and organic farming. Currently leading the rehabilitation of 16,000 neglected olive trees in the Swartberg Karoo while managing a boutique guest farm and building a direct-to-consumer olive oil brand. Driven by the vision of building systems that leave land, people, and communities richer than they were found.',
    color: '#1a7a2a',
    top: 36,
    side: 'left',
    pdf: '/docs/cv-nicolas-criticos.pdf',
  },
  {
    id: 'solar',
    label: 'Solar Plexus · Human Design',
    title: 'Projector · Wait for the Invitation',
    summary:
      'You are not built to initiate — you are built to see. Your gift is reading systems, energy, and people with uncanny precision. The strategy is to wait for genuine recognition and invitation before acting. When aligned: Success. When not: Bitterness. Over-initiating drains you. Rest is not laziness — it is preparation. You are a guide, not a generator.',
    color: '#AA8800',
    top: 45,
    side: 'right',
    pdf: 'https://ahumandesign.com/chart/result/#chart,bmFtZT1OaWNvbGFzK0NyaXRpY29zJnllYXI9MTk5OCZtb250aD0wMyZkYXk9MTMmaG91cj0xMyZtaW51dGU9MDMmYmlydGhwbGFjZT1Kb2hhbm5lc2J1cmclMkMrR2F1dGVuZyUyQytTb3V0aCtBZnJpY2EmdGltZXpvbmU9QWZyaWNhJTJGSm9oYW5uZXNidXJnJmxhdGl0dWRlPS0yNi4yMDIyNzAwMCZsb25naXR1ZGU9MjguMDQzNjMwMDAmZW1haWxfYWRkcmVzcz1uaWNvbGFzLmNyaXRpY29zOTglNDBnbWFpbC5jb20mY2hhcnRVcmw9aHR0cHMlM0ElMkYlMkZhaHVtYW5kZXNpZ24uY29tJTJGY2hhcnQlMkZyZXN1bHQlMkYlMjNjaGFydCUyQ2JtRnRaVDFPYVdOdmJHRnpLME55YVhScFkyOXpKbmxsWVhJOU1UazVPQ1p0YjI1MGFEMHdNeVprWVhrOU1UTW1hRzkxY2oweE15Wm1hVzUxZEdVOU1ETW1ZbWx5ZEdod2JHRmpaVDFLYjJoaGJtNWxjMkoxY21jbE1rTXJSMkYxZEdWdVp5VXlReXRUYjNWMGFDdEJabkpwWTJFbWRHbHRaWHB2Ym1VOU1XWXlMbVJ3TURReGJteHZaWE01TXpreE15WnNiMjVuYVhROU5qZ3VNRFF6TmpNd01EQW1aVzFoYVd3OVFXWnlhV05oSlRKR1NtOW9ZVzV1WlhOaWRYSm5KbXhoZEdsMGRXUmxQUzF5Tmk0eU1ESXlOekF3TUNac2IyNW5hWFIxWkdVOU1qZ3VNRFF6TmpNd01EQW1aVzFoYVd4ZllXUmtjbVZ6Y3oxdWFXTnZiR0Z6TG1OeWFYUnBZMjl6T1RnbE5EQm5iV0ZwYkM1amIyMCUzRA==',
  },
  {
    id: 'sacral',
    label: 'Sacral · Numerology',
    title: 'The Seeker · Life Path 7',
    summary:
      'Life Path 7 · Destiny 7 · Soul 4 · Personality 3 · Maturity 5. The double-7 stamps your life with a single mission: find truth. Your Soul desires order and foundation; your Personality charms and inspires. Currently in your First Pinnacle (7) — a time of self-discovery and spiritual development. Building years ahead.',
    color: '#CC6600',
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
    color: '#CC2200',
    top: 63,
    side: 'right',
  },
]

// ── Constants ──────────────────────────────────────────────────────────────────

const DOT_LEFT = 50
const LINE_LEN = 16
const TOPBAR_H = 64
const PARTICLE_COUNT = 55
const BG_COLOR = '#f0e9d8'

// ── Particle canvas ────────────────────────────────────────────────────────────

function useParticleCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const rafRef = useRef<number>(0)
  const particlesRef = useRef<Particle[]>([])

  const init = useCallback((w: number, h: number) => {
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.12,
      r: Math.random() * 1.4 + 0.3,
      alpha: Math.random() * 0.35 + 0.05,
      alphaDir: Math.random() > 0.5 ? 1 : -1,
      alphaSpeed: Math.random() * 0.0015 + 0.0004,
    }))
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      init(canvas.width, canvas.height)
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      const { width: w, height: h } = canvas
      ctx.clearRect(0, 0, w, h)

      for (const p of particlesRef.current) {
        // drift
        p.x += p.vx
        p.y += p.vy
        // wrap
        if (p.x < -4) p.x = w + 4
        if (p.x > w + 4) p.x = -4
        if (p.y < -4) p.y = h + 4
        if (p.y > h + 4) p.y = -4
        // breathe
        p.alpha += p.alphaDir * p.alphaSpeed
        if (p.alpha > 0.42 || p.alpha < 0.04) p.alphaDir *= -1

        // draw dot — warm dusty gold tint
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(140, 115, 70, ${p.alpha})`
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafRef.current)
    }
  }, [canvasRef, init])
}

// ── Injected CSS ───────────────────────────────────────────────────────────────

const STYLES = `
@import url("https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&display=swap");

/* ── Entry animation ── */
@keyframes ho-fadein {
  0%   { opacity: 0; transform: scale(1.018); filter: blur(10px); }
  40%  { opacity: 0.4; filter: blur(3px); }
  100% { opacity: 1; transform: scale(1);   filter: blur(0px); }
}

/* ── Chakra dot pulse ── */
@keyframes ho-pulse {
  0%, 100% { box-shadow: var(--glow-sm); transform: translate(-50%,-50%) scale(1); }
  50%       { box-shadow: var(--glow-lg); transform: translate(-50%,-50%) scale(1.25); }
}

/* ── Scan line sweep ── */
@keyframes ho-scan {
  0%   { top: 0%;   opacity: 0; }
  5%   { opacity: 0.18; }
  95%  { opacity: 0.18; }
  100% { top: 100%; opacity: 0; }
}

/* ── Bracket corner flicker ── */
@keyframes ho-flicker {
  0%, 100% { opacity: 0.22; }
  50%       { opacity: 0.38; }
}

/* ── Label panel slide in ── */
@keyframes ho-panel-in {
  from { opacity: 0; transform: translateY(-46%) translateX(6px); }
  to   { opacity: 1; transform: translateY(-50%) translateX(0); }
}
@keyframes ho-panel-in-left {
  from { opacity: 0; transform: translateY(-46%) translateX(-6px); }
  to   { opacity: 1; transform: translateY(-50%) translateX(0); }
}

/* ── Description card reveal ── */
@keyframes ho-card-in {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.ho-page {
  animation: ho-fadein 2.2s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.ho-dot {
  cursor: pointer;
  animation: ho-pulse var(--pulse-dur, 3.2s) ease-in-out infinite;
}

.ho-label {
  cursor: pointer;
  transition: opacity 0.15s;
  user-select: none;
  font-family: "IM Fell English", serif;
  font-style: italic;
  font-size: 0.82rem;
  color: #2a1a08;
  line-height: 1.2;
  text-shadow: 0 1px 4px rgba(232,220,195,0.9), 0 0 8px rgba(232,220,195,0.7);
}
.ho-label:hover { opacity: 0.6; }

.ho-node-right {
  animation: ho-panel-in 0.55s cubic-bezier(0.22,1,0.36,1) both;
}
.ho-node-left {
  animation: ho-panel-in-left 0.55s cubic-bezier(0.22,1,0.36,1) both;
}

.ho-card {
  animation: ho-card-in 0.3s ease both;
}

.ho-scan {
  position: absolute;
  left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(100,80,40,0.5) 40%, rgba(100,80,40,0.5) 60%, transparent 100%);
  pointer-events: none;
  z-index: 3;
  animation: ho-scan 9s linear infinite;
}

.ho-corner {
  position: absolute;
  width: 28px;
  height: 28px;
  pointer-events: none;
  z-index: 8;
  animation: ho-flicker 4s ease-in-out infinite;
}

.ho-back-btn {
  position: fixed;
  top: 80px;
  left: 20px;
  z-index: 20;
  background: rgba(232,220,195,0.75);
  border: 1px solid rgba(90,74,48,0.3);
  backdropFilter: blur(6px);
  color: #3d2e1a;
  font-family: "IM Fell English", serif;
  font-style: italic;
  font-size: 0.78rem;
  padding: 5px 12px;
  cursor: pointer;
  border-radius: 2px;
  letter-spacing: 0.06em;
  transition: background 0.2s, opacity 0.2s;
}
.ho-back-btn:hover { background: rgba(220,208,183,0.92); opacity: 0.85; }

.ho-glyph {
  font-family: "IM Fell English", serif;
  font-style: italic;
  color: rgba(90,74,48,0.18);
  pointer-events: none;
  user-select: none;
  position: absolute;
  z-index: 2;
  animation: ho-flicker 6s ease-in-out infinite;
}
`

// ── Corner bracket SVG ─────────────────────────────────────────────────────────

function CornerBracket({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const style: React.CSSProperties = {
    top:    pos.startsWith('t') ? '12px' : undefined,
    bottom: pos.startsWith('b') ? '12px' : undefined,
    left:   pos.endsWith('l')   ? '12px' : undefined,
    right:  pos.endsWith('r')   ? '12px' : undefined,
  }
  // rotate per corner
  const rot = { tl: 0, tr: 90, br: 180, bl: 270 }[pos]

  return (
    <div className="ho-corner" style={style}>
      <svg
        width="28" height="28" viewBox="0 0 28 28"
        style={{ transform: `rotate(${rot}deg)` }}
        fill="none"
      >
        <path d="M2 14 L2 2 L14 2" stroke="rgba(90,74,48,0.45)" strokeWidth="1.2"/>
      </svg>
    </div>
  )
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function HumanOverview() {
  const [active, setActive]     = useState<ChakraId | null>(null)
  const [mounted, setMounted]   = useState(false)
  const canvasRef               = useRef<HTMLCanvasElement>(null)
  const navigate                = useNavigate()

  useEffect(() => { setMounted(true) }, [])

  useParticleCanvas(canvasRef)

  const toggle = (id: ChakraId) =>
    setActive(prev => (prev === id ? null : id))

  // Stagger animation delays per node so they appear sequentially
  const nodeDelay = (i: number) => `${0.35 + i * 0.08}s`

  return (
    <div
      className={mounted ? 'ho-page' : ''}
      style={{
        position: 'relative',
        width: '100vw',
        minHeight: `calc(100vh - ${TOPBAR_H}px)`,
        background: BG_COLOR,
        overflow: 'hidden',
      }}
    >
      <style>{STYLES}</style>

      {/* ── Particle canvas ── */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* ── Scan line ── */}
      <div className="ho-scan" />

      {/* ── Corner brackets ── */}
      {(['tl','tr','bl','br'] as const).map(p => (
        <CornerBracket key={p} pos={p} />
      ))}

      {/* ── Ambient glyphs ── */}
      <div className="ho-glyph" style={{ fontSize:'4.5rem', top:'6%',  left:'5%',  animationDelay:'0s'   }}>φ</div>
      <div className="ho-glyph" style={{ fontSize:'3.2rem', top:'72%', left:'4%',  animationDelay:'1.5s' }}>∞</div>
      <div className="ho-glyph" style={{ fontSize:'2.8rem', top:'20%', right:'4%', animationDelay:'3s'   }}>Ω</div>
      <div className="ho-glyph" style={{ fontSize:'3.8rem', top:'78%', right:'5%', animationDelay:'2s'   }}>△</div>
      <div className="ho-glyph" style={{ fontSize:'2rem',   top:'52%', left:'3%',  animationDelay:'0.8s' }}>VII</div>
      <div className="ho-glyph" style={{ fontSize:'1.6rem', top:'42%', right:'3%', animationDelay:'4s'   }}>1998</div>

      {/* ── Vitruvian — faded into background, floating ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        {/* Shadow halo behind image — gives the floating/raised look */}
        <div style={{
          position: 'absolute',
          width: '52%',
          height: '82%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(80,60,30,0.18) 0%, rgba(80,60,30,0.08) 50%, transparent 75%)',
          filter: 'blur(28px)',
          zIndex: 1,
          transform: 'translateY(2%)',
        }} />
        {/* Image with edge fade mask */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            WebkitMaskImage:
              'radial-gradient(ellipse 52% 78% at 50% 50%, black 30%, rgba(0,0,0,0.75) 52%, rgba(0,0,0,0.2) 72%, transparent 100%)',
            maskImage:
              'radial-gradient(ellipse 52% 78% at 50% 50%, black 30%, rgba(0,0,0,0.75) 52%, rgba(0,0,0,0.2) 72%, transparent 100%)',
            zIndex: 2,
          }}
        >
          <img
            src="/vitruvian.jpg"
            alt="Vitruvian Man"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'center center',
              filter: 'drop-shadow(0 8px 32px rgba(60,40,10,0.28)) drop-shadow(0 2px 8px rgba(60,40,10,0.18))',
            }}
          />
        </div>
      </div>

      {/* ── Back button ── */}
      <button className="ho-back-btn" onClick={() => navigate('/')}>
        ← dashboard
      </button>

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
            fontSize: '1.5rem',
            letterSpacing: '0.12em',
            color: '#3d2e1a',
            textShadow: '0 2px 12px rgba(232,220,195,0.7)',
          }}
        >
          Nicolas Criticos
        </div>
        <div
          style={{
            fontFamily: '"IM Fell English", serif',
            fontStyle: 'italic',
            fontSize: '0.8rem',
            letterSpacing: '0.1em',
            color: '#6a5840',
            marginTop: '3px',
          }}
        >
          Born 13 March 1998 · Johannesburg
        </div>
        {/* thin rule */}
        <div style={{
          margin: '6px auto 0',
          width: '120px',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(90,74,48,0.35), transparent)',
        }} />
      </div>

      {/* ── SVG: architect lines + tick marks ── */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 4,
        }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {CHAKRAS.map(chakra => {
          const y  = chakra.top
          const x2 = chakra.side === 'right' ? DOT_LEFT + LINE_LEN : DOT_LEFT - LINE_LEN
          return (
            <g key={chakra.id}>
              <line
                x1={DOT_LEFT} y1={y} x2={x2} y2={y}
                stroke="#5a4a30" strokeWidth="0.5" opacity="0.5"
                vectorEffect="non-scaling-stroke"
              />
              {/* small tick */}
              <line
                x1={x2} y1={y - 0.6} x2={x2} y2={y + 0.6}
                stroke="#5a4a30" strokeWidth="0.7" opacity="0.65"
                vectorEffect="non-scaling-stroke"
              />
              {/* tiny inner tick near dot */}
              <line
                x1={DOT_LEFT + (chakra.side === 'right' ? 1.5 : -1.5)} y1={y - 0.4}
                x2={DOT_LEFT + (chakra.side === 'right' ? 1.5 : -1.5)} y2={y + 0.4}
                stroke="#5a4a30" strokeWidth="0.5" opacity="0.4"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          )
        })}
      </svg>

      {/* ── Chakra nodes ── */}
      {CHAKRAS.map((chakra, i) => {
        const isActive = active === chakra.id
        const isRight  = chakra.side === 'right'
        const lineEndX = isRight ? DOT_LEFT + LINE_LEN : DOT_LEFT - LINE_LEN

        const labelPos: React.CSSProperties = isRight
          ? { left: `${lineEndX + 1}%`, textAlign: 'left' }
          : { right: `${100 - (lineEndX - 1)}%`, textAlign: 'right' }

        const glowSm = `0 0 6px ${chakra.color}88, 0 0 2px ${chakra.color}55`
        const glowLg = `0 0 14px ${chakra.color}cc, 0 0 6px ${chakra.color}88, 0 0 2px ${chakra.color}`

        // stagger pulse durations so they don't all pulse together
        const pulseDur = `${2.8 + i * 0.35}s`

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
                width: isActive ? '13px' : '10px',
                height: isActive ? '13px' : '10px',
                borderRadius: '50%',
                background: chakra.color,
                opacity: isActive ? 0.95 : 0.72,
                zIndex: 6,
                transition: 'width 0.2s, height 0.2s, opacity 0.2s',
                ['--glow-sm' as string]: glowSm,
                ['--glow-lg' as string]: glowLg,
                ['--pulse-dur' as string]: pulseDur,
              } as React.CSSProperties}
            />

            {/* Label + panel */}
            <div
              className={isRight ? 'ho-node-right' : 'ho-node-left'}
              style={{
                position: 'absolute',
                top: `${chakra.top}%`,
                ...labelPos,
                transform: 'translateY(-50%)',
                zIndex: 7,
                maxWidth: '220px',
                textAlign: isRight ? 'left' : 'right',
                animationDelay: nodeDelay(i),
                animationFillMode: 'both',
              }}
            >
              <div
                className="ho-label"
                onClick={() => toggle(chakra.id)}
              >
                {chakra.label}
              </div>

              {isActive && (
                <div
                  className="ho-card"
                  style={{
                    marginTop: '7px',
                    fontFamily: '"IM Fell English", serif',
                    fontStyle: 'italic',
                    color: '#2a1a08',
                    maxWidth: '220px',
                    lineHeight: 1.7,
                    background: 'rgba(240, 230, 210, 0.92)',
                    backdropFilter: 'blur(6px)',
                    padding: '10px 12px',
                    borderRadius: '2px',
                    borderLeft: isRight ? `2px solid ${chakra.color}88` : 'none',
                    borderRight: isRight ? 'none' : `2px solid ${chakra.color}88`,
                    boxShadow: `0 2px 16px rgba(44,30,10,0.15), 0 0 0 0.5px rgba(90,74,48,0.15)`,
                  }}
                >
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 'normal',
                    color: chakra.color,
                    marginBottom: '5px',
                    letterSpacing: '0.04em',
                    filter: 'brightness(0.75)',
                  }}>
                    {chakra.title}
                  </div>
                  <div style={{ fontSize: '0.71rem', color: '#3a2a14' }}>
                    {chakra.summary}
                  </div>
                  {chakra.pdf && (
                    <a
                      href={chakra.pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        marginTop: '8px',
                        fontFamily: '"IM Fell English", serif',
                        fontStyle: 'italic',
                        fontSize: '0.65rem',
                        color: '#5a4a30',
                        textDecoration: 'underline',
                        textUnderlineOffset: '2px',
                        opacity: 0.75,
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

      {/* ── Bottom inscription ── */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: 0,
        right: 0,
        textAlign: 'center',
        pointerEvents: 'none',
        zIndex: 8,
      }}>
        <div style={{
          margin: '0 auto 6px',
          width: '80px',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(90,74,48,0.3), transparent)',
        }} />
        <div style={{
          fontFamily: '"IM Fell English", serif',
          fontStyle: 'italic',
          fontSize: '0.65rem',
          letterSpacing: '0.14em',
          color: 'rgba(90,74,48,0.45)',
        }}>
          Rahu Mahadasha · Saturn Antardasha · 2024–2026
        </div>
      </div>
    </div>
  )
}
