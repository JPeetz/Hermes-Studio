import { createFileRoute } from '@tanstack/react-router'
import { usePageTitle } from '@/hooks/use-page-title'
import { DocsScreen } from '@/screens/docs/docs-screen'

export const Route = createFileRoute('/docs')({
  component: function DocsRoute() {
    usePageTitle('Documentation')
    return <DocsScreen />
  },
})
