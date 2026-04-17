import { createFileRoute } from '@tanstack/react-router'
import { AnalyticsScreen } from '@/screens/analytics/analytics-screen'

export const Route = createFileRoute('/analytics')({
  component: AnalyticsScreen,
})
