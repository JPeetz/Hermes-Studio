import { hasActiveSendRun } from './send-run-tracker'
import { appendEvent } from './event-store'

export interface ChatSSEEvent {
  event: string
  data: Record<string, unknown>
  /** Sequence number from the event store; undefined when store is unavailable. */
  seq?: number
}

type ChatSSESubscriber = (event: ChatSSEEvent) => void

// ─── Singleton state (survives Vite HMR via globalThis) ─────────────────

const BUS_KEY = '__hermes_chat_event_bus__' as const

interface BusState {
  subscribers: Set<ChatSSESubscriber>
  started: boolean
}

function getBus(): BusState {
  if (!(globalThis as any)[BUS_KEY]) {
    ;(globalThis as any)[BUS_KEY] = {
      subscribers: new Set<ChatSSESubscriber>(),
      started: false,
    }
  }
  return (globalThis as any)[BUS_KEY]
}

function broadcast(
  event: string,
  data: Record<string, unknown>,
  seq?: number,
): void {
  const bus = getBus()
  const evt: ChatSSEEvent = { event, data, seq }
  for (const sub of bus.subscribers) {
    try {
      sub(evt)
    } catch {
      // subscriber error — don't crash the bus
    }
  }
}

export function publishChatEvent(
  event: string,
  data: Record<string, unknown>,
): void {
  const runId = typeof data.runId === 'string' ? data.runId : undefined
  if (hasActiveSendRun(runId)) return

  // Persist before broadcasting so the seq is available to subscribers for
  // the SSE id: field. Only events that pass the guard above are stored —
  // dropped events are never delivered and should not be in the replay log.
  const sessionKey =
    typeof data.sessionKey === 'string' ? data.sessionKey : 'all'
  const seq = appendEvent(sessionKey, runId, event, data) ?? undefined

  broadcast(event, data, seq)
}

export async function ensureBusStarted(): Promise<void> {
  const bus = getBus()
  if (bus.started) return
  bus.started = true
}

export function subscribeToChatEvents(
  subscriber: ChatSSESubscriber,
  sessionKeyFilter?: string,
): () => void {
  const bus = getBus()

  // Wrap subscriber with session key filter if provided
  const wrappedSubscriber: ChatSSESubscriber = sessionKeyFilter
    ? (event) => {
        const eventSessionKey = event.data.sessionKey as string | undefined
        if (eventSessionKey && eventSessionKey !== sessionKeyFilter) return
        const runId =
          typeof event.data.runId === 'string' ? event.data.runId : undefined
        if (hasActiveSendRun(runId)) return
        subscriber(event)
      }
    : (event) => {
        const runId =
          typeof event.data.runId === 'string' ? event.data.runId : undefined
        if (hasActiveSendRun(runId)) return
        subscriber(event)
      }

  bus.subscribers.add(wrappedSubscriber)
  return () => {
    bus.subscribers.delete(wrappedSubscriber)
  }
}
