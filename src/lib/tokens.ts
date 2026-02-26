export const TOKEN_COSTS = {
  SCAN_WEBSITE: 10,
  GENERATE_CALENDAR: 50,
  GENERATE_POST: 3,
  GENERATE_IMAGE: 5,
  REGENERATE_POST: 3,
  AUTO_POST: 2,
} as const

export const TOKEN_PACKS = [
  { id: 'pack_100', name: 'Starter', tokens: 100, price: 9, currency: 'EUR', popular: false },
  { id: 'pack_500', name: 'Creator', tokens: 500, price: 39, currency: 'EUR', popular: true },
  { id: 'pack_1500', name: 'Pro', tokens: 1500, price: 99, currency: 'EUR', popular: false },
  { id: 'pack_5000', name: 'Agency', tokens: 5000, price: 299, currency: 'EUR', popular: false },
] as const

export const FREE_TOKENS = 50

export function getTokenPackById(id: string) {
  return TOKEN_PACKS.find(pack => pack.id === id)
}

export function estimateCalendarCost(postCount: number, withImages: boolean): number {
  const baseCost = TOKEN_COSTS.GENERATE_CALENDAR
  const imageCost = withImages ? postCount * TOKEN_COSTS.GENERATE_IMAGE : 0
  return baseCost + imageCost
}
