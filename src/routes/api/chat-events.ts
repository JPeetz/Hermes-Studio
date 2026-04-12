import { createFileRoute } from '@tanstack/react-router'
import { isAuthenticated } from '../../server/auth-middleware'
import {
  ensureBusStarted,
  subscribeToChatEvents,
} from '../../server/chat-event-bus'
import { getEventsSince } from '../../server/event-store'

/**
 * SSE endpoint for chat events.
 *
 * Hermes does not expose a global browser-facing event stream, so the server
 * keeps a local singleton bus of translated chat events and fans that out to
 * any browser SSE subscribers.
 *
 * Deterministic replay (Last-Event-ID):
 *   Every event is emitted with an `id: <seq>` field. When the browser's
 *   EventSource reconnects after a network hiccup, it automatically sends
 *   `Last-Event-ID: <N>` and this handler replays all stored events with
 *   seq > N before subscribing to new live events — zero client changes needed.
 */
export const Route = createFileRoute('/api/chat-events')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return new Response(
            JSON.stringify({ ok: false, error: 'Unauthorized' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } },
          )
        }

        const url = new URL(request.url)
        const sessionKeyParam =
          url.searchParams.get('sessionKey')?.trim() || undefined

        // Standard SSE reconnect: browser sends Last-Event-ID header
        const lastEventIdHeader = request.headers.get('last-event-id')
        const lastSeq =
          lastEventIdHeader && /^\d+$/.test(lastEventIdHeader)
            ? parseInt(lastEventIdHeader, 10)
            : 0

        const encoder = new TextEncoder()
        let streamClosed = false
        let unsubscribe: (() => void) | null = null
        let heartbeatTimer: ReturnType<typeof setInterval> | null = null

        const stream = new ReadableStream({
          async start(controller) {
            /**
             * Emit an SSE event, optionally with an id: field for replay.
             * seq === undefined → id: line is omitted (heartbeats, connected).
             */
            const sendEvent = (
              event: string,
              data: unknown,
              seq?: number,
            ) => {
              if (streamClosed) return
              try {
                let payload = ''
                if (seq !== undefined) payload += `id: ${seq}\n`
                payload += `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
                controller.enqueue(encoder.encode(payload))
              } catch {
                /* stream closed */
              }
            }

            const closeStream = () => {
              if (streamClosed) return
              streamClosed = true
              if (heartbeatTimer) {
                clearInterval(heartbeatTimer)
                heartbeatTimer = null
              }
              if (unsubscribe) {
                unsubscribe()
                unsubscribe = null
              }
              try {
                controller.close()
              } catch {
                /* ignore */
              }
            }

            try {
              await ensureBusStarted()

              // ── Replay missed events ──────────────────────────────────────
              // If the client supplies a Last-Event-ID and we have a specific
              // sessionKey to query, replay stored events before going live.
              let replayedCount = 0
              if (lastSeq > 0 && sessionKeyParam) {
                const missed = getEventsSince(sessionKeyParam, lastSeq)
                replayedCount = missed.length
                for (const ev of missed) {
                  sendEvent(ev.eventType, ev.payload, ev.seq)
                }
              }

              // ── Connected acknowledgement (no id: — not replayable) ───────
              sendEvent('connected', {
                timestamp: Date.now(),
                sessionKey: sessionKeyParam || 'all',
                replayed: replayedCount,
              })

              // ── Subscribe to live events ──────────────────────────────────
              unsubscribe = subscribeToChatEvents((evt) => {
                if (streamClosed) return
                // Pass the seq from the event store so the browser can track
                // its Last-Event-ID for future reconnects.
                sendEvent(evt.event, evt.data, evt.seq)
              }, sessionKeyParam)

              // ── Heartbeat (no id:) ────────────────────────────────────────
              heartbeatTimer = setInterval(() => {
                sendEvent('heartbeat', { timestamp: Date.now() })
              }, 30_000)
            } catch (err) {
              const errorMsg = err instanceof Error ? err.message : String(err)
              sendEvent('error', { message: errorMsg })
              closeStream()
            }
          },
          cancel() {
            streamClosed = true
            if (heartbeatTimer) {
              clearInterval(heartbeatTimer)
              heartbeatTimer = null
            }
            if (unsubscribe) {
              unsubscribe()
              unsubscribe = null
            }
          },
        })

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
          },
        })
      },
    },
  },
})
