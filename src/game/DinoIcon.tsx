import { DINO_BODY, DINO_LEGS } from './sprites'

const ROWS = [...DINO_BODY, ...DINO_LEGS[0]]
const PATH = ROWS.map((row, y) =>
  [...row.matchAll(/#+|e/g)].map((m) => `M${m.index} ${y}h${m[0].length}v1h-${m[0].length}z`).join('')
).join('')

export default function DinoIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size * (22 / 20)}
      height={size}
      viewBox={`0 0 22 ${ROWS.length}`}
      className={className}
      fill="currentColor"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <path d={PATH} />
    </svg>
  )
}
