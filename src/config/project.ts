export const project = {
  name: 'SenseiFi Influencer',
  slug: 'senseifi-influencer',
  displayName: 'SenseiFi Influencer',
  version: '0.1.0',
  platform: 'react',
  description: 'Influencer portal for SenseiFi.',
  modules: [],
} as const

export type ProjectModule = (typeof project.modules)[number]
export type ProjectModuleId = ProjectModule['id']
