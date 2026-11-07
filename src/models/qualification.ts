export type QualificationStepId = 'rising' | 'elite' | 'legendary'

export type QualificationTarget = {
  title: string
  detail: string
  value: string
}

export type QualificationStep = {
  id: QualificationStepId
  tab: string
  name: string
  reward: string
  rewardLabel: string
  status: string
  total: string
  incremental: string
  targets: QualificationTarget[]
}

const targetCopy = {
  verified: {
    title: 'Verified registration',
    detail: 'A genuine new account completes signup verification. One per unique person.',
  },
  wallet: {
    title: 'Wallet activation',
    detail: 'Wallet connected and first eligible security scan completed.',
  },
  subscribers: {
    title: 'New paying subscriber',
    detail:
      'First settled paid subscription. Excludes renewals, trials, refunds and chargebacks.',
  },
  reward: {
    title: 'Credited reward',
    detail: 'Milestone reward credited once the three targets for this step are met.',
  },
}

function targets(
  verified: string,
  wallet: string,
  subscribers: string,
  reward: string,
): QualificationTarget[] {
  return [
    { ...targetCopy.verified, value: verified },
    { ...targetCopy.wallet, value: wallet },
    { ...targetCopy.subscribers, value: subscribers },
    { ...targetCopy.reward, value: reward },
  ]
}

export const qualification = {
  title: 'Qualification Steps',
  required: 'All three targets required',
  unlockTitle: 'How the reward unlocks',
  claimNote: 'To Claim Reward All 3 targets must be met',
  withdrawNote:
    'You can withdraw earnings from subscribed users anytime, whether or not you reach this level’s targets.',
  steps: [
    {
      id: 'rising',
      tab: 'Step 1 · Rising',
      name: 'Rising Ambassador',
      reward: '$1,000 REWARD',
      rewardLabel: 'REWARD - $1000',
      status: 'In progress',
      total: 'Total rewards to date: $1,000',
      incremental: 'Step 1 escrow allocation. This is the first $1,000 milestone reward.',
      targets: targets('500', '300', '100', '$1,000'),
    },
    {
      id: 'elite',
      tab: 'Step 2 · Elite',
      name: 'Elite Ambassador',
      reward: '$2,000 REWARD',
      rewardLabel: 'REWARD - $2000',
      status: 'Locked',
      total: 'Total rewards to date: $3,000',
      incremental:
        'Adds $2,000 on top of Rising. It does not pay the $3,000 total a second time.',
      targets: targets('1,250', '750', '250', '$2,000'),
    },
    {
      id: 'legendary',
      tab: 'Step 3 · Legendary',
      name: 'Legendary Ambassador',
      reward: '$4,000 REWARD',
      rewardLabel: 'REWARD - $4000',
      status: 'Locked',
      total: 'Total rewards to date: $7,000',
      incremental:
        'Adds $4,000 on top of Elite. Lifetime milestone rewards across all three steps are $7,000.',
      targets: targets('2,500', '1,500', '500', '$4,000'),
    },
  ] satisfies QualificationStep[],
  unlocks: [
    { index: '01', text: 'Meet targets All three, cumulative.' },
    { index: '02', text: 'Verify Fraud and refund screen.' },
    { index: '03', text: 'Escrow check Funds confirmed reserved.' },
    { index: '04', text: 'Release Transaction ID recorded.' },
  ],
}
