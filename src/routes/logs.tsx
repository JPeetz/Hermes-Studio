import { createFileRoute } from '@tanstack/react-router'
import { LogsScreen } from '@/screens/logs/logs-screen'

export const Route = createFileRoute('/logs')({
  component: LogsScreen,
})
