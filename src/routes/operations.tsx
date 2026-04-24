import { createFileRoute } from '@tanstack/react-router'
import { usePageTitle } from '@/hooks/use-page-title'
import { OperationsScreen } from '@/screens/operations/operations-screen'

export const Route = createFileRoute('/operations')({
  component: function OperationsRoute() {
    usePageTitle('Operations')
    return <OperationsScreen />
  },
})
