import { createFileRoute } from '@tanstack/react-router'
import { usePageTitle } from '@/hooks/use-page-title'
import { ConductorScreen } from '@/screens/conductor/conductor-screen'

export const Route = createFileRoute('/conductor')({
  component: function ConductorRoute() {
    usePageTitle('Conductor')
    return <ConductorScreen />
  },
})
