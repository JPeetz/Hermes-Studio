import { createFileRoute } from '@tanstack/react-router'
import { isAuthenticated } from '../../server/auth-middleware'
import {
  ensureBusStarted,
  subscribeToChatEvents,
} from '../../server/chat-event-bus'

/**
 * Global SSE stream.
 *
 * This subscribes with no session key, so it receives every event on the bus —
 * including task events, which task-store publishes under the shared 'all'
 * session key with the task id and title in the payload. Without an auth check
 * it streamed those to any unauthenticated caller. /api/chat-events,
 * /api/events/replay and /api/audit all already guard; this one was missed.
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
