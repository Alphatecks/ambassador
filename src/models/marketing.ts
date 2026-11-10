import logo from '../../assets/images/logo.png'
import avatar from '../../assets/images/ambassador-avatar.jpg'

export type MarketingAssetType = 'image' | 'story' | 'caption' | 'video'

export type MarketingPlatform =
  | 'Instagram'
  | 'X'
  | 'TikTok'
  | 'LinkedIn'
  | 'All'

export type MarketingAsset = {
  id: string
  type: MarketingAssetType
  title: string
  platform: MarketingPlatform
  caption: string
  preview: string
  downloadUrl: string
  fileName: string
}

export type MarketingPack = {
  id: string
  dateLabel: string
  isToday: boolean
  note: string
  assets: MarketingAsset[]
}

export const marketing = {
  title: 'Marketing materials',
  subtitle: 'Daily creatives from admin. Download them and reshare on your platforms.',
  ambassador: {
    name: 'Rising Ambassador',
    level: 'Level 1',
  },
  todayNote: 'Admin refreshes this pack every day. Grab today’s assets before they rotate.',
  previousTitle: 'Previous days',
}

export const marketingPacks: MarketingPack[] = [
  {
    id: 'pack-2026-11-07',
    dateLabel: 'Today · 7 Nov',
    isToday: true,
    note: '3 assets ready to reshare',
    assets: [
      {
        id: 'today-ig-square',
        type: 'image',
        title: 'SenseiFi wallet launch square',
        platform: 'Instagram',
        caption:
          'Protect your crypto with SenseiFi. Scan threats before they hit your wallet. Join with my link.',
        preview: logo,
        downloadUrl: logo,
        fileName: 'senseifi-wallet-launch-square.png',
      },
      {
        id: 'today-story',
        type: 'story',
        title: 'Ambassador story frame',
        platform: 'Instagram',
        caption:
          'New SenseiFi ambassador drop today. Follow the link in my bio to get started.',
        preview: avatar,
        downloadUrl: avatar,
        fileName: 'senseifi-ambassador-story.jpg',
      },
      {
        id: 'today-x-caption',
        type: 'caption',
        title: 'X short post',
        platform: 'X',
        caption:
          'SenseiFi Ambassadors earn when people activate wallets and subscribe. Grab today’s creative and share your referral link.',
        preview: logo,
        downloadUrl: logo,
        fileName: 'senseifi-x-caption.txt',
      },
    ],
  },
  {
    id: 'pack-2026-11-06',
    dateLabel: '6 Nov',
    isToday: false,
    note: '2 assets from yesterday',
    assets: [
      {
        id: 'yest-tiktok',
        type: 'video',
        title: '60s product walkthrough cover',
        platform: 'TikTok',
        caption:
          'Watch how SenseiFi scans a wallet in under a minute. Link in bio for early access.',
        preview: logo,
        downloadUrl: logo,
        fileName: 'senseifi-tiktok-cover.png',
      },
      {
        id: 'yest-linkedin',
        type: 'image',
        title: 'LinkedIn trust post',
        platform: 'LinkedIn',
        caption:
          'Security should come before the first transfer. SenseiFi helps users verify risk early.',
        preview: avatar,
        downloadUrl: avatar,
        fileName: 'senseifi-linkedin-trust.jpg',
      },
    ],
  },
  {
    id: 'pack-2026-11-05',
    dateLabel: '5 Nov',
    isToday: false,
    note: '2 assets from 5 Nov',
    assets: [
      {
        id: 'older-all',
        type: 'image',
        title: 'Referral reminder graphic',
        platform: 'All',
        caption:
          'One referral link. One account. Share SenseiFi and earn on verified activations.',
        preview: logo,
        downloadUrl: logo,
        fileName: 'senseifi-referral-reminder.png',
      },
      {
        id: 'older-caption',
        type: 'caption',
        title: 'Story caption pack',
        platform: 'Instagram',
        caption:
          'Day 3 of sharing SenseiFi. Download the daily creative, post it, and drop your referral link.',
        preview: logo,
        downloadUrl: logo,
        fileName: 'senseifi-story-caption.txt',
      },
    ],
  },
]

export const typeLabels: Record<MarketingAssetType, string> = {
  image: 'Image',
  story: 'Story',
  caption: 'Caption',
  video: 'Video',
}
