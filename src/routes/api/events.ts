import { createFileRoute } from '@tanstack/react-router'
import {
  getUserIdFromRequest,
  isAuthenticated,
} from '../../server/auth-middleware'
import {
  ensureBusStarted,
  subscribeToChatEvents,
} from '../../server/chat-event-bus'
import { canSeeTaskEvent } from '../../server/user-profiles'

/**
 * Global SSE stream for the chat screen.
 *
 * This subscribes with no session key, so it receives every event on the bus —
 * including task events, which are published under the shared 'all' key. It
 * therefore needs the same two guards as /api/chat-events: authentication, and
 * a per-user filter on task events (Issue #8 Phase 2). Without them this route
 * streamed every user's task activity to any unauthenticated caller.
 */
export const Route = createFileRoute('/api/events')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return new Response(
            JSON.stringify({ ok: false, error: 'Unauthorized' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } },
          )
        }

        const userId = getUserIdFromRequest(request)

        await ensureBusStarted()

        const encoder = new TextEncoder()
        let unsubscribe: (() => void) | null = null
        let keepaliveInterval: ReturnType<typeof setInterval> | null = null

        const stream = new ReadableStream({
          start(controller) {
            // Send connected event immediately
            controller.enqueue(
              encoder.encode(
                `event: connected\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`,
              ),
            )

            // Subscribe to chat event bus
            unsubscribe = subscribeToChatEvents((event) => {
              if (!canSeeTaskEvent(userId, event.event, event.data)) return
              try {
                controller.enqueue(
                  encoder.encode(
                    `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`,
                  ),
                )
              } catch {
                // Stream closed
              }
            })

            // Keepalive every 15s
            keepaliveInterval = setInterval(() => {
              try {
                controller.enqueue(encoder.encode(`: keepalive\n\n`))
              } catch {
                // Stream closed
              }
            }, 15_000)
          },
          cancel() {
            if (unsubscribe) unsubscribe()
            if (keepaliveInterval) clearInterval(keepaliveInterval)
          },
        })

        return new Response(stream, {
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-store',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
          },
        })
      },
    },
  },
})
