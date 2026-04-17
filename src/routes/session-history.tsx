import { createFileRoute } from '@tanstack/react-router'
import { SessionHistoryScreen } from '@/screens/session-history/session-history-screen'

export const Route = createFileRoute('/session-history')({
  component: SessionHistoryScreen,
})
