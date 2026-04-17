import { createFileRoute } from '@tanstack/react-router'
import { PatternsCorrectionScreen } from '@/screens/patterns/patterns-corrections-screen'

export const Route = createFileRoute('/patterns')({
  component: PatternsCorrectionScreen,
})
