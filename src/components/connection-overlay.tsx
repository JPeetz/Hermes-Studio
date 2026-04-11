// Stub — connection overlay (not used in Hermes Studio)
export function useConnectionRestart() {
  return {
    triggerRestart: async (fn: () => Promise<void>) => {
      await fn()
    },
  }
}

export function ConnectionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
