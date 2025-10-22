import { openAIChatJSON } from '../connectors/openai'
import { OPENAI_API_KEY, assertOpenAIKey } from '../env'
import { summarySchema, type SummaryOutput } from './schemas'

export type SummarizeInput = Array<{ title?: string; content: string }>

const SYSTEM_PROMPT =
  'Sos un asistente que devuelve estricto JSON con la forma {"title": string, "summary": string, "tags": string[] }.'

export async function summarizeSelection(
  selected: SummarizeInput,
  model = 'gpt-4o-mini',
  temperature = 0.2
): Promise<SummaryOutput> {
  if (!selected || selected.length === 0) {
    throw new Error('Selecciona 1–3 TextNodes para resumir.')
  }
  if (selected.length > 3) {
    throw new Error('Máximo 3 TextNodes en el MVP.')
  }
  assertOpenAIKey()

  const concat = selected
    .map((n, i) => `#${i + 1} ${n.title ?? '(sin título)'}\n${n.content}`)
    .join('\n\n---\n\n')

  let body = concat
  const MAX_CHARS = 8000
  if (body.length > MAX_CHARS) {
    body = body.slice(0, MAX_CHARS) + '\n... [truncated]'
  }

  const userPrompt =
    'Dada la siguiente selección de textos, generá un título claro, un resumen conciso (4–6 oraciones) y 3–6 tags.\n' +
    'Estilo: neutral, informativo.\nContenido:\n---\n' +
    body +
    '\n---\nDevolvé SOLO el JSON, sin explicación.'

  const raw = await openAIChatJSON<unknown>({
    apiKey: OPENAI_API_KEY!,
    model,
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    temperature,
  })
  const parsed = summarySchema.parse(raw)
  return parsed
}
