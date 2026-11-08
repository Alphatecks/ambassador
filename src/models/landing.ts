export const landing = {
  brand: 'SenseiFi Ambassadors',
  headline: 'Farm influence. Cash out USDT.',
  support:
    'Recruit users, activate wallets, hit rank targets, and pull from a live $30,000 USDT reward pool.',
  primaryCta: 'Enter the program',
  secondaryCta: 'Sign in',
  liveLabel: 'Live payouts',
  pool: {
    kicker: 'Season reward vault',
    title: '$30,000',
    unit: 'USDT',
    lead:
      'This season’s ambassador vault is funded and live. Clear rank targets, unlock escrowed milestone rewards, and keep stacking referral commissions on every verified signup, wallet activation, and paid subscription.',
    detail:
      'Rewards release after fraud review. Self-referrals and duplicate accounts do not count. The harder you push SenseiFi, the more of the vault you can claim.',
    tiers: [
      {
        name: 'Rising',
        amount: '$1,000',
        detail: 'First escrow unlock for clearing all three Rising targets.',
      },
      {
        name: 'Elite',
        amount: '$2,000',
        detail: 'Next rank clear. Bigger pool share for proven ambassadors.',
      },
      {
        name: 'Legendary',
        amount: '$4,000',
        detail: 'Top-tier unlock for ambassadors who finish the full path.',
      },
    ],
  },
  pathTitle: 'The grind',
  pathSupport: 'Three moves. One scoreboard.',
  path: [
    {
      index: '01',
      title: 'Refer',
      detail: 'Verified signups and wallet activations credit your link.',
    },
    {
      index: '02',
      title: 'Broadcast',
      detail: 'Ship daily creatives on X and stack tracked reach.',
    },
    {
      index: '03',
      title: 'Unlock',
      detail: 'Clear rank targets and release escrowed milestone loot.',
    },
  ],
  closeTitle: 'Drop in. Start earning.',
  closeSupport: 'Connect X, grab your link, and join the vault.',
  closeCta: 'Become an ambassador',
} as const

const HEX = '0123456789abcdefABCDEF'

export type LandingWinner = {
  id: string
  wallet: string
  amount: string
  action: 'withdrew' | 'claimed' | 'unlocked'
}

function randomHex(length: number) {
  let value = ''
  for (let index = 0; index < length; index += 1) {
    value += HEX[Math.floor(Math.random() * HEX.length)]
  }
  return value
}

function randomWallet() {
  return `0x${randomHex(4)}…${randomHex(4)}`
}

function randomAmount() {
  const tiers = [
    () => 20 + Math.random() * 80,
    () => 100 + Math.random() * 250,
    () => 300 + Math.random() * 700,
    () => 1000 + Math.random() * 2400,
  ]
  const amount = tiers[Math.floor(Math.random() * tiers.length)]()
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function randomAction(): LandingWinner['action'] {
  const actions: LandingWinner['action'][] = ['withdrew', 'claimed', 'unlocked']
  return actions[Math.floor(Math.random() * actions.length)]
}

export function createLandingWinner(id = randomHex(8)): LandingWinner {
  return {
    id,
    wallet: randomWallet(),
    amount: randomAmount(),
    action: randomAction(),
  }
}

export function createLandingWinners(count: number) {
  return Array.from({ length: count }, () => createLandingWinner())
}
