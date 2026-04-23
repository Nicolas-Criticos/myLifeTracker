import { useMemo } from 'react'

interface OliveTreeProps {
  healthScore: number // 0–10
  size?: number
}

// Deterministic pseudo-random for stable leaf positions across renders
function seededRand(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

interface LeafBlob {
  cx: number; cy: number; rx: number; ry: number; rotate: number; alpha: number
}
interface Pollen {
  cx: number; cy: number; r: number; delay: number; drift: number
}

// Generate leaf cloud blobs around branch endpoints
const BRANCH_TIPS = [
  // [cx, cy, spread_x, spread_y, count]
  [68,  90,  42, 32, 9],   // upper-left tip
  [292, 88,  42, 32, 9],   // upper-right tip
  [180, 52,  36, 28, 8],   // top tip
  [45,  175, 38, 28, 7],   // mid-left tip
  [315, 172, 38, 28, 7],   // mid-right tip
  [30,  260, 32, 22, 5],   // lower-left tip
  [330, 255, 32, 22, 5],   // lower-right tip
  [110, 118, 30, 22, 6],   // upper-left secondary
  [250, 115, 30, 22, 6],   // upper-right secondary
  [140, 165, 28, 20, 5],   // mid-left along
  [225, 162, 28, 20, 5],   // mid-right along
  [180, 125, 38, 30, 8],   // center upper
] as const

function generateLeafBlobs(): LeafBlob[] {
  const rand = seededRand(7)
  const blobs: LeafBlob[] = []
  for (const [bx, by, sx, sy, count] of BRANCH_TIPS) {
    for (let i = 0; i < count; i++) {
      blobs.push({
        cx: bx + (rand() - 0.5) * sx * 2,
        cy: by + (rand() - 0.5) * sy * 2,
        rx: 14 + rand() * 20,
        ry: 10 + rand() * 14,
        rotate: rand() * 360,
        alpha: 0.22 + rand() * 0.18,
      })
    }
  }
  return blobs
}

function generatePollen(): Pollen[] {
  const rand = seededRand(13)
  return Array.from({ length: 9 }, (_, i) => ({
    cx: 110 + rand() * 140,
    cy: 70 + rand() * 130,
    r: 1.2 + rand() * 1.4,
    delay: i * 0.75,
    drift: (rand() - 0.5) * 30,
  }))
}

const LEAF_BLOBS  = generateLeafBlobs()
const POLLEN_DOTS = generatePollen()

// Sparse blobs: first 30, medium: first 55, full: all 80ish
const SPARSE_COUNT = 28
const MEDIUM_COUNT = 52
const FULL_COUNT   = LEAF_BLOBS.length

export default function OliveTree({ healthScore, size = 380 }: OliveTreeProps) {
  const score = Math.max(0, Math.min(10, healthScore))

  const v = useMemo(() => {
    const s = score

    // Trunk color: from desiccated grey to rich dark bark
    const trunkColor =
      s <= 2 ? '#8e7e6a' :
      s <= 4 ? '#7c6d55' :
      s <= 6 ? '#6e5e48' :
               '#5c4d3a'

    const trunkHighlight =
      s <= 2 ? '#a8998a' :
      s <= 4 ? '#988472' :
               '#866a55'

    // Leaf color: yellow-dead → dull olive → vibrant green
    const leafHue =
      s <= 2 ? 'rgba(140, 130, 70, VAL)' :
      s <= 4 ? 'rgba(120, 135, 75, VAL)' :
      s <= 6 ? 'rgba(100, 135, 70, VAL)' :
      s <= 8 ? 'rgba(85, 128, 60, VAL)' :
               'rgba(72, 120, 48, VAL)'

    const leafAlphaMultiplier = s <= 2 ? 0.35 : s <= 4 ? 0.65 : s <= 6 ? 0.85 : 1

    // How many clusters to show
    const blobCount =
      s <= 1 ? 0 :
      s <= 3 ? Math.round(SPARSE_COUNT * (s / 3)) :
      s <= 5 ? Math.round(SPARSE_COUNT + (MEDIUM_COUNT - SPARSE_COUNT) * ((s - 3) / 2)) :
      s <= 7 ? Math.round(MEDIUM_COUNT + (FULL_COUNT - MEDIUM_COUNT) * ((s - 5) / 2)) :
               FULL_COUNT

    // CSS filter for desaturation in sick states
    const svgFilter =
      s <= 2 ? 'saturate(0.15) brightness(0.82)' :
      s <= 4 ? 'saturate(0.5) brightness(0.88)' :
      s <= 6 ? 'saturate(0.75)' :
               'none'

    const showGlow    = s >= 8
    const showOlives  = s >= 7
    const oliveCount  = showOlives ? Math.round(((s - 6) / 4) * 16) : 0
    const showPollen  = s >= 9

    const glowAlpha   = s >= 9 ? 0.18 : s >= 8 ? 0.1 : 0

    return {
      trunkColor, trunkHighlight, leafHue, leafAlphaMultiplier,
      blobCount, svgFilter, showGlow, showOlives, oliveCount,
      showPollen, glowAlpha,
    }
  }, [score])

  const leafColor = (alpha: number) =>
    v.leafHue.replace('VAL', String(alpha * v.leafAlphaMultiplier))

  // Olive fruit positions (seeded)
  const oliveFruits = useMemo(() => {
    const rand = seededRand(55)
    return Array.from({ length: 16 }, () => ({
      cx: 120 + rand() * 120,
      cy: 70  + rand() * 130,
      rx: 3   + rand() * 2.5,
      ry: 4.5 + rand() * 2.5,
      rotate: -20 + rand() * 40,
    }))
  }, [])

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {/* Ambient canopy glow for healthy+ trees */}
      {v.showGlow && (
        <div style={{
          position: 'absolute',
          left: '50%', top: '35%',
          transform: 'translate(-50%, -50%)',
          width: size * 0.7, height: size * 0.55,
          borderRadius: '50%',
          background: `radial-gradient(ellipse at center, rgba(90, 130, 60, ${v.glowAlpha}) 0%, transparent 70%)`,
          animation: 'glowPulse 7s ease-in-out infinite alternate',
          pointerEvents: 'none',
        }} />
      )}

      <svg
        viewBox="0 0 360 390"
        width={size}
        height={size}
        style={{ overflow: 'visible', filter: v.svgFilter, transition: 'filter 2s ease' }}
      >
        <defs>
          {/* Trunk gradient: lighter edge, darker center */}
          <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={v.trunkHighlight} stopOpacity="0.9" />
            <stop offset="35%"  stopColor={v.trunkColor}     stopOpacity="1"   />
            <stop offset="70%"  stopColor={v.trunkColor}     stopOpacity="1"   />
            <stop offset="100%" stopColor={v.trunkHighlight} stopOpacity="0.7" />
          </linearGradient>

          {/* Olive fruit gradient */}
          <radialGradient id="oliveFruitGrad" cx="35%" cy="30%">
            <stop offset="0%"   stopColor="rgba(100, 115, 55, 0.95)" />
            <stop offset="100%" stopColor="rgba(55, 68, 28, 0.9)"    />
          </radialGradient>

          {/* Ground shadow gradient */}
          <radialGradient id="groundGrad" cx="50%" cy="50%">
            <stop offset="0%"   stopColor={`rgba(60, 50, 30, ${0.06 + score * 0.006})`} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          {/* All animation keyframes */}
          <style>{`
            @keyframes treeSway {
              0%, 100% { transform: rotate(-0.7deg); }
              50%       { transform: rotate(0.7deg);  }
            }
            @keyframes leafDrift {
              0%, 100% { transform: scale(1) rotate(0deg);      }
              25%       { transform: scale(1.03) rotate(0.5deg); }
              75%       { transform: scale(0.98) rotate(-0.4deg);}
            }
            @keyframes oliveBob {
              0%, 100% { transform: translateY(0px);   }
              50%       { transform: translateY(-1.5px);}
            }
            @keyframes pollenRise {
              0%   { transform: translateY(0)    translateX(0);     opacity: 0.75; }
              100% { transform: translateY(-80px) translateX(var(--drift)); opacity: 0;    }
            }
            @keyframes fallLeaf {
              0%   { transform: translateY(0)   rotate(0deg);   opacity: 0.5;  }
              60%  { opacity: 0.4; }
              100% { transform: translateY(60px) rotate(45deg); opacity: 0;    }
            }
            @keyframes glowBreathe {
              0%, 100% { opacity: 0.5; }
              50%       { opacity: 1;   }
            }
            .sway-group    { animation: treeSway 9s ease-in-out infinite; transform-origin: 180px 330px; }
            .leaf-drift    { animation: leafDrift 7s ease-in-out infinite; transform-origin: center; }
            .leaf-drift:nth-child(3n)   { animation-duration: 5.8s; animation-delay: -2.1s; }
            .leaf-drift:nth-child(3n+1) { animation-duration: 8.3s; animation-delay: -4.5s; }
            .leaf-drift:nth-child(3n+2) { animation-duration: 6.5s; animation-delay: -1.2s; }
          `}</style>
        </defs>

        {/* Ground shadow ellipse */}
        <ellipse cx="180" cy="365" rx={45 + score * 4} ry="7" fill="url(#groundGrad)" />

        {/* Root lines (visible dying-struggling) */}
        {score <= 4 && (
          <g opacity={0.25 + (1 - score / 10) * 0.25} stroke={v.trunkColor} strokeWidth="1.5" fill="none">
            <path d="M164 338 Q148 352 130 358" />
            <path d="M196 340 Q214 356 236 360" />
            <path d="M175 342 Q162 358 152 365" />
          </g>
        )}

        {/* ── TRUNK ───────────────────────────────────────────────────────── */}
        {/* Trunk is NOT in the sway group — only branches+leaves sway */}
        <g>
          {/* Main trunk body */}
          <path
            d={`
              M 162,340
              C 158,318 153,295 156,272
              C 159,253 154,235 158,218
              C 161,206 164,198 170,192
              L 180,188 L 190,192
              C 196,198 199,206 202,218
              C 206,235 201,253 204,272
              C 207,295 202,318 198,340
              Z
            `}
            fill="url(#trunkGrad)"
            style={{ transition: 'fill 1.5s ease' }}
          />
          {/* Bark texture grooves */}
          <g opacity={score <= 3 ? 0.35 : 0.15} stroke="rgba(0,0,0,0.2)" strokeWidth="0.7" fill="none">
            <path d="M170 330 Q168 305 171 278" />
            <path d="M190 325 Q192 295 190 265" />
            <path d="M178 315 Q176 285 178 258" />
            {score <= 2 && <>
              <path d="M165 260 L168 254" />
              <path d="M195 245 L192 240" />
            </>}
          </g>
          {/* Knot bump for character */}
          <ellipse cx="176" cy="248" rx="5" ry="4" fill="rgba(0,0,0,0.06)" />
        </g>

        {/* ── EVERYTHING THAT SWAYS ───────────────────────────────────────── */}
        <g className="sway-group">

          {/* ── MAIN BRANCHES ─────────────────────────────────────────────── */}
          <g stroke={v.trunkColor} fill="none" strokeLinecap="round"
             style={{ transition: 'stroke 1.5s ease' }}>
            {/* Lower left */}
            <path d="M 165,290 C 140,278 108,265 80,255 C 62,248 44,243 28,242"
                  strokeWidth={score >= 5 ? 5 : 4} />
            {/* Lower right */}
            <path d="M 195,284 C 220,272 252,258 282,248 C 300,241 318,238 335,237"
                  strokeWidth={score >= 5 ? 5 : 4} />
            {/* Mid left */}
            <path d="M 163,252 C 138,235 108,215 80,195 C 60,180 40,168 24,162"
                  strokeWidth={score >= 5 ? 4.5 : 3.5} />
            {/* Mid right */}
            <path d="M 197,246 C 222,229 252,210 282,190 C 302,175 322,162 338,156"
                  strokeWidth={score >= 5 ? 4.5 : 3.5} />
            {/* Upper left */}
            <path d="M 168,220 C 148,198 126,173 104,150 C 86,132 70,114 60,96"
                  strokeWidth={score >= 5 ? 4 : 3} />
            {/* Upper right */}
            <path d="M 192,215 C 212,193 234,168 258,145 C 276,127 292,110 302,92"
                  strokeWidth={score >= 5 ? 4 : 3} />
            {/* Top center */}
            <path d="M 180,205 C 180,180 182,152 182,124 C 182,102 182,80 183,60"
                  strokeWidth={score >= 5 ? 3.5 : 2.5} />

            {/* Secondary branches (appear at score ≥ 3) */}
            {score >= 3 && <>
              <path d="M 88,255 C 72,245 56,240 40,240" strokeWidth="2.5" />
              <path d="M 275,248 C 292,238 308,234 323,233" strokeWidth="2.5" />
              <path d="M 82,195 C 62,182 44,172 28,168" strokeWidth="2.2" />
              <path d="M 285,188 C 305,174 322,164 336,160" strokeWidth="2.2" />
              <path d="M 106,150 C 88,136 72,120 62,104" strokeWidth="2" />
              <path d="M 256,143 C 274,128 288,112 298,96" strokeWidth="2" />
              <path d="M 183,124 C 165,112 152,96 148,80" strokeWidth="1.8" />
              <path d="M 183,124 C 200,112 212,98 216,82" strokeWidth="1.8" />
            </>}

            {/* Tertiary fine branches (score ≥ 5) */}
            {score >= 5 && <>
              <path d="M 40,240 C 28,236 18,238 12,242" strokeWidth="1.5" />
              <path d="M 322,233 C 334,229 343,232 348,236" strokeWidth="1.5" />
              <path d="M 60,104 C 48,92 40,78 36,66" strokeWidth="1.5" />
              <path d="M 298,96 C 310,84 318,70 320,58" strokeWidth="1.5" />
              <path d="M 148,80 C 138,66 130,54 128,42" strokeWidth="1.4" />
              <path d="M 216,82 C 226,68 232,55 232,44" strokeWidth="1.4" />
            </>}

            {/* Drooping effect for dying/struggling */}
            {score <= 3 && <>
              <path d="M 28,242 C 24,250 22,262 22,272" strokeWidth="1.5" opacity="0.4" />
              <path d="M 335,237 C 339,246 340,258 338,268" strokeWidth="1.5" opacity="0.4" />
            </>}
          </g>

          {/* ── LEAF BLOBS ────────────────────────────────────────────────── */}
          {LEAF_BLOBS.slice(0, v.blobCount).map((b, i) => (
            <ellipse
              key={`lb-${i}`}
              className="leaf-drift"
              cx={b.cx} cy={b.cy}
              rx={b.rx} ry={b.ry}
              fill={leafColor(b.alpha)}
              transform={`rotate(${b.rotate} ${b.cx} ${b.cy})`}
              style={{ transition: 'opacity 2s ease, fill 1.5s ease' }}
            />
          ))}

          {/* ── OLIVE FRUITS ──────────────────────────────────────────────── */}
          {v.showOlives && oliveFruits.slice(0, v.oliveCount).map((o, i) => (
            <ellipse
              key={`ol-${i}`}
              cx={o.cx} cy={o.cy}
              rx={o.rx} ry={o.ry}
              fill="url(#oliveFruitGrad)"
              transform={`rotate(${o.rotate} ${o.cx} ${o.cy})`}
              style={{ animation: `oliveBob ${3.5 + (i % 4) * 0.6}s ease-in-out ${(i % 5) * 0.5}s infinite` }}
            />
          ))}

          {/* ── POLLEN PARTICLES (thriving ≥ 9) ───────────────────────────── */}
          {v.showPollen && POLLEN_DOTS.map((p, i) => (
            <circle
              key={`pol-${i}`}
              cx={p.cx} cy={p.cy}
              r={p.r}
              fill="rgba(195, 215, 130, 0.65)"
              style={{
                '--drift': `${p.drift}px`,
                animation: `pollenRise ${5 + p.delay * 0.6}s ease-out ${p.delay}s infinite`,
              } as React.CSSProperties}
            />
          ))}

          {/* ── FALLING LEAVES (dying ≤ 2) ────────────────────────────────── */}
          {score <= 2 && [0,1,2,3,4].map(i => (
            <ellipse
              key={`fl-${i}`}
              cx={150 + i * 18} cy={255 + i * 10}
              rx="3.5" ry="1.8"
              fill="rgba(145, 128, 72, 0.45)"
              transform={`rotate(${40 + i * 28} ${150 + i * 18} ${255 + i * 10})`}
              style={{ animation: `fallLeaf ${4.5 + i * 0.9}s ease-in ${i * 1.3}s infinite` }}
            />
          ))}

        </g>{/* end sway-group */}
      </svg>
    </div>
  )
}
