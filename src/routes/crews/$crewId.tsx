import { createFileRoute } from '@tanstack/react-router'
import { usePageTitle } from '@/hooks/use-page-title'
import { CrewDetailScreen } from '@/screens/crews/crew-detail-screen'

export const Route = createFileRoute('/crews/$crewId')({
  component: function CrewDetailRoute() {
    usePageTitle('Crew')
    return <CrewDetailScreen />
  },
})
