import { providerById, type Model } from './models'

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export type LiveOpts = {
  model: Model
  key: string
  baseUrl?: string
  messages: ChatMessage[]
  temperature?: number
  signal?: AbortSignal
  onDelta: (text: string) => void
}

/** Streams a completion from any OpenAI-compatible endpoint. */
export async function streamOpenAI(opts: LiveOpts) {
  const provider = providerById(opts.model.provider)
  const base = (opts.baseUrl || provider.defaultBaseUrl || '').replace(/\/$/, '')
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    signal: opts.signal,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${opts.key}`,
    },
    body: JSON.stringify({
      model: opts.model.apiId ?? opts.model.id,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.3,
      stream: true,
    }),
  })
  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => '')
    throw new Error(`${res.status} ${res.statusText}${body ? ` — ${body.slice(0, 240)}` : ''}`)
  }
  await readSSE(res.body, (json) => {
    const delta = json?.choices?.[0]?.delta?.content
    if (typeof delta === 'string' && delta) opts.onDelta(delta)
  })
}

/** Streams from the Anthropic Messages API. */
export async function streamAnthropic(opts: LiveOpts) {
  const provider = providerById(opts.model.provider)
  const base = (opts.baseUrl || provider.defaultBaseUrl || 'https://api.anthropic.com/v1').replace(/\/$/, '')
  const system = opts.messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n')
  const turns = opts.messages.filter((m) => m.role !== 'system')
  const res = await fetch(`${base}/messages`, {
    method: 'POST',
    signal: opts.signal,
    headers: {
      'content-type': 'application/json',
      'x-api-key': opts.key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: opts.model.apiId ?? opts.model.id,
      max_tokens: 4096,
      temperature: opts.temperature ?? 0.3,
      system: system || undefined,
      messages: turns,
      stream: true,
    }),
  })
  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => '')
    throw new Error(`${res.status} ${res.statusText}${body ? ` — ${body.slice(0, 240)}` : ''}`)
  }
  await readSSE(res.body, (json) => {
    if (json?.type === 'content_block_delta' && json?.delta?.type === 'text_delta') {
      opts.onDelta(json.delta.text)
    }
  })
}

async function readSSE(body: ReadableStream<Uint8Array>, onJson: (j: any) => void) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const frames = buffer.split('\n\n')
    buffer = frames.pop() ?? ''
    for (const frame of frames) {
      for (const line of frame.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const payload = trimmed.slice(5).trim()
        if (!payload || payload === '[DONE]') continue
        try {
          onJson(JSON.parse(payload))
        } catch {
          /* partial frame — ignore */
        }
      }
    }
  }
}

export async function streamChat(opts: LiveOpts) {
  const provider = providerById(opts.model.provider)
  if (provider.protocol === 'anthropic') return streamAnthropic(opts)
  return streamOpenAI(opts)
}
