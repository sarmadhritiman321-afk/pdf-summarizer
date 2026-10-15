// Pixel-art sprites for the Dino Runner. '#' = filled pixel, 'e' = eye (a hole, or an accent colour when dead).
// Every row of a sprite must have the same width (checked at startup in dev).

export const DINO_BODY = [
  '............##########',
  '............##e#######',
  '............##########',
  '............##########',
  '............#####.....',
  '............########..',
  '#..........#####......',
  '#.........######......',
  '##.......#########..#.',
  '##......###########.#.',
  '###....############...',
  '.###############......',
  '..##############......',
  '...#############......',
  '....###########.......',
  '.....##########.......',
  '......#########.......',
]

// Two leg frames for running (3 rows each, drawn under DINO_BODY)
export const DINO_LEGS: string[][] = [
  ['......####..####......', '......####....##......', '......####............'],
  ['......####..####......', '......##....####......', '............####......'],
]

export const DINO_DUCK_BODY = [
  '..................########',
  '..................##e#####',
  '..................########',
  '..................#####...',
  '#.....##############......',
  '##...#################....',
  '###.###################...',
  '.######################...',
  '..#####################...',
  '....###################...',
  '......##############......',
]

export const DINO_DUCK_LEGS: string[][] = [
  ['......####..####..........', '......####....##..........'],
  ['......####..####..........', '......##....####..........'],
]

// Rect lists in sprite units: [x, y, w, h]
export type R = [number, number, number, number]

export const CACTUS_SMALL: { w: number; h: number; rects: R[] } = {
  w: 9,
  h: 18,
  rects: [[3, 0, 3, 18], [0, 5, 2, 6], [2, 9, 1, 2], [7, 3, 2, 6], [6, 7, 1, 2]],
}

export const CACTUS_LARGE: { w: number; h: number; rects: R[] } = {
  w: 12,
  h: 24,
  rects: [[4, 0, 4, 24], [0, 7, 2, 8], [2, 12, 2, 2], [10, 4, 2, 9], [8, 10, 2, 2]],
}

export const BIRD_FRAMES: { w: number; h: number; rects: R[] }[] = [
  { w: 14, h: 10, rects: [[2, 5, 9, 3], [11, 4, 3, 3], [0, 5, 2, 1], [4, 1, 3, 4]] },
  { w: 14, h: 10, rects: [[2, 5, 9, 3], [11, 4, 3, 3], [0, 5, 2, 1], [4, 8, 3, 2]] },
]

export const CLOUD: R[] = [[3, 0, 5, 2], [0, 2, 12, 2], [2, 4, 8, 1]]

export function validateSprites() {
  const groups = [DINO_BODY, ...DINO_LEGS, DINO_DUCK_BODY, ...DINO_DUCK_LEGS]
  const widths = new Set<number>()
  for (const g of [DINO_BODY, ...DINO_LEGS]) g.forEach((r) => widths.add(r.length))
  if (widths.size !== 1) console.warn('dino sprite rows differ in width', [...widths])
  const dw = new Set<number>()
  for (const g of [DINO_DUCK_BODY, ...DINO_DUCK_LEGS]) g.forEach((r) => dw.add(r.length))
  if (dw.size !== 1) console.warn('duck sprite rows differ in width', [...dw])
  return groups.length
}
