// Environment helpers for BYO OpenAI key in a Vite app (browser)
// Prefer Vite env var VITE_OPENAI_API_KEY; fallback to window.OPENAI_API_KEY for quick demos.

export const OPENAI_API_KEY: string | undefined =
  (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_OPENAI_API_KEY) ||
  (typeof window !== 'undefined' ? (window as any).OPENAI_API_KEY : undefined)

export function assertOpenAIKey() {
  if (!OPENAI_API_KEY) {
    throw new Error('Falta OPENAI_API_KEY. Define VITE_OPENAI_API_KEY en .env o window.OPENAI_API_KEY en runtime.')
  }
}
