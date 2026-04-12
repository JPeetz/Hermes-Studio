import { createFileRoute } from '@tanstack/react-router'
import { usePageTitle } from '@/hooks/use-page-title'
import { CrewsScreen } from '@/screens/crews/crews-screen'

export const Route = createFileRoute('/crews/')({
  component: function CrewsRoute() {
    usePageTitle('Crews')
    return <CrewsScreen />
  },
})
