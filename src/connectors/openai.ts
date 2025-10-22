export type ChatJSONParams = {
  apiKey: string
  model: string
  systemPrompt?: string
  userPrompt: string
  temperature?: number
  timeoutMs?: number
}

export async function openAIChatJSON<T = unknown>(params: ChatJSONParams): Promise<T> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), params.timeoutMs ?? 20000)

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        temperature: params.temperature ?? 0.2,
        // Ask for JSON object if supported
        response_format: { type: 'json_object' },
        messages: [
          params.systemPrompt ? { role: 'system', content: params.systemPrompt } : undefined,
          { role: 'user', content: params.userPrompt },
        ].filter(Boolean),
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`OpenAI error ${res.status}: ${text}`)
    }

    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content
    if (!content) throw new Error('OpenAI devolvió una respuesta vacía')

    // Attempt to parse JSON
    let parsed: unknown
    try {
      parsed = JSON.parse(content)
    } catch {
      const match = content.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('No se encontró JSON en la respuesta del modelo')
      parsed = JSON.parse(match[0])
    }
    return parsed as T
  } finally {
    clearTimeout(id)
  }
}
