import { useSessionStore } from "@/store/session-store";

/** Wait until WebSocket session:ready or timeout. */
export function waitForSessionReady(timeoutMs = 15000): Promise<boolean> {
  if (useSessionStore.getState().isSessionReady) return Promise.resolve(true);

  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs;

    const unsub = useSessionStore.subscribe((state) => {
      if (state.isSessionReady) {
        unsub();
        clearInterval(timer);
        resolve(true);
      }
    });

    const timer = setInterval(() => {
      if (Date.now() > deadline) {
        unsub();
        clearInterval(timer);
        resolve(false);
      }
    }, 200);
  });
}
