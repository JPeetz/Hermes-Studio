import { createFileRoute } from '@tanstack/react-router'
import { usePageTitle } from '@/hooks/use-page-title'
import { HelpScreen } from '@/screens/help/help-screen'

export const Route = createFileRoute('/help')({
  component: function HelpRoute() {
    usePageTitle('Help')
    return <HelpScreen />
  },
})
