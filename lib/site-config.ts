const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()

const hasProtocol = (url: string) => /^https?:\/\//i.test(url)

const normalizedUrl = appUrl
  ? hasProtocol(appUrl)
    ? appUrl
    : `https://${appUrl}`
  : 'http://localhost:3000'

export const siteConfig = {
  name: 'Daily Study Review',
  description: 'Track and review your daily study sessions with spaced repetition.',
  url: normalizedUrl,
  ogImage: '/placeholder-logo.png',
  keywords: [
    'spaced repetition',
    'study planner',
    'daily review',
    'learning retention',
    'study habits',
    'education app',
  ],
}

export type SiteConfig = typeof siteConfig
