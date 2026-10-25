export type ProviderId =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'deepseek'
  | 'xai'
  | 'moonshot'
  | 'qwen'
  | 'mistral'
  | 'openrouter'
  | 'ollama'
  | 'lmstudio'

export type Provider = {
  id: ProviderId
  name: string
  glyph: string
  color: string
  kind: 'cloud' | 'local' | 'router'
  keyUrl?: string
  docs?: string
  /** whether the endpoint accepts an OpenAI-compatible chat body */
  protocol: 'anthropic' | 'openai' | 'google'
  defaultBaseUrl?: string
  envKey?: string
}

export type Model = {
  id: string
  name: string
  short: string
  provider: ProviderId
  context: number
  /** $ per 1M tokens */
  priceIn: number
  priceOut: number
  speed: 1 | 2 | 3 | 4 | 5
  reasoning: 1 | 2 | 3 | 4 | 5
  coding: 1 | 2 | 3 | 4 | 5
  tags: string[]
  blurb: string
  agentic?: boolean
  vision?: boolean
  local?: boolean
  // provider model string when it differs from id
  apiId?: string
}

export const PROVIDERS: Provider[] = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    glyph: '✳',
    color: '#d97757',
    kind: 'cloud',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    protocol: 'anthropic',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    envKey: 'ANTHROPIC_API_KEY',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    glyph: '◎',
    color: '#10a37f',
    kind: 'cloud',
    keyUrl: 'https://platform.openai.com/api-keys',
    protocol: 'openai',
    defaultBaseUrl: 'https://api.openai.com/v1',
    envKey: 'OPENAI_API_KEY',
  },
  {
    id: 'google',
    name: 'Google',
    glyph: '✦',
    color: '#4285f4',
    kind: 'cloud',
    keyUrl: 'https://aistudio.google.com/apikey',
    protocol: 'google',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    envKey: 'GEMINI_API_KEY',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    glyph: '⌁',
    color: '#4d6bfe',
    kind: 'cloud',
    keyUrl: 'https://platform.deepseek.com/api_keys',
    protocol: 'openai',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    envKey: 'DEEPSEEK_API_KEY',
  },
  {
    id: 'xai',
    name: 'xAI',
    glyph: '𝕏',
    color: '#c9c9c9',
    kind: 'cloud',
    keyUrl: 'https://console.x.ai',
    protocol: 'openai',
    defaultBaseUrl: 'https://api.x.ai/v1',
    envKey: 'XAI_API_KEY',
  },
  {
    id: 'moonshot',
    name: 'Moonshot',
    glyph: '☾',
    color: '#8b7cf6',
    kind: 'cloud',
    keyUrl: 'https://platform.moonshot.ai/console/api-keys',
    protocol: 'openai',
    defaultBaseUrl: 'https://api.moonshot.ai/v1',
    envKey: 'MOONSHOT_API_KEY',
  },
  {
    id: 'qwen',
    name: 'Alibaba Qwen',
    glyph: '◈',
    color: '#6f5bff',
    kind: 'cloud',
    keyUrl: 'https://bailian.console.alibabacloud.com',
    protocol: 'openai',
    defaultBaseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    envKey: 'DASHSCOPE_API_KEY',
  },
  {
    id: 'mistral',
    name: 'Mistral',
    glyph: '≋',
    color: '#ff7000',
    kind: 'cloud',
    keyUrl: 'https://console.mistral.ai/api-keys',
    protocol: 'openai',
    defaultBaseUrl: 'https://api.mistral.ai/v1',
    envKey: 'MISTRAL_API_KEY',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    glyph: '⇄',
    color: '#94a3b8',
    kind: 'router',
    keyUrl: 'https://openrouter.ai/keys',
    protocol: 'openai',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    envKey: 'OPENROUTER_API_KEY',
  },
  {
    id: 'ollama',
    name: 'Ollama',
    glyph: '🦙',
    color: '#ffffff',
    kind: 'local',
    protocol: 'openai',
    defaultBaseUrl: 'http://localhost:11434/v1',
  },
  {
    id: 'lmstudio',
    name: 'LM Studio',
    glyph: '▤',
    color: '#7c8fff',
    kind: 'local',
    protocol: 'openai',
    defaultBaseUrl: 'http://localhost:1234/v1',
  },
]

export const providerById = (id: ProviderId) =>
  PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0]

export const MODELS: Model[] = [
  {
    id: 'claude-sonnet-4-5',
    name: 'Claude Sonnet 4.5',
    short: 'Sonnet 4.5',
    provider: 'anthropic',
    context: 200_000,
    priceIn: 3,
    priceOut: 15,
    speed: 3,
    reasoning: 4,
    coding: 5,
    tags: ['agentic', 'best-all-round', 'vision'],
    blurb: 'The default for a reason. Long-horizon agent work, surgical edits, great at following a spec.',
    agentic: true,
    vision: true,
    apiId: 'claude-sonnet-4-5-20250929',
  },
  {
    id: 'claude-opus-4-1',
    name: 'Claude Opus 4.1',
    short: 'Opus 4.1',
    provider: 'anthropic',
    context: 200_000,
    priceIn: 15,
    priceOut: 75,
    speed: 2,
    reasoning: 5,
    coding: 5,
    tags: ['deep-reasoning', 'expensive'],
    blurb: 'Reach for it when the architecture is genuinely hard and you can afford slow, careful thought.',
    agentic: true,
    vision: true,
    apiId: 'claude-opus-4-1-20250805',
  },
  {
    id: 'gpt-5',
    name: 'GPT-5',
    short: 'GPT-5',
    provider: 'openai',
    context: 400_000,
    priceIn: 1.25,
    priceOut: 10,
    speed: 4,
    reasoning: 5,
    coding: 5,
    tags: ['frontier', 'tools', 'vision'],
    blurb: 'Enormous context, strong tool discipline, excellent at refactors that span a monorepo.',
    agentic: true,
    vision: true,
    apiId: 'gpt-5',
  },
  {
    id: 'gpt-5-mini',
    name: 'GPT-5 mini',
    short: 'GPT-5 mini',
    provider: 'openai',
    context: 272_000,
    priceIn: 0.25,
    priceOut: 2,
    speed: 5,
    reasoning: 3,
    coding: 4,
    tags: ['cheap', 'fast', 'subagent'],
    blurb: 'Perfect as the cheap subagent that greps your repo while the big model thinks.',
    agentic: true,
    apiId: 'gpt-5-mini',
  },
  {
    id: 'gemini-2-5-pro',
    name: 'Gemini 2.5 Pro',
    short: 'Gemini 2.5 Pro',
    provider: 'google',
    context: 1_000_000,
    priceIn: 1.25,
    priceOut: 10,
    speed: 4,
    reasoning: 4,
    coding: 4,
    tags: ['1m-context', 'vision', 'cheap-context'],
    blurb: 'A million tokens of context. Point it at the whole repo and it will still find the bug.',
    agentic: true,
    vision: true,
    apiId: 'gemini-2.5-pro',
  },
  {
    id: 'gemini-2-5-flash',
    name: 'Gemini 2.5 Flash',
    short: 'Gemini Flash',
    provider: 'google',
    context: 1_000_000,
    priceIn: 0.3,
    priceOut: 2.5,
    speed: 5,
    reasoning: 3,
    coding: 3,
    tags: ['fast', 'cheap', 'vision'],
    blurb: 'Absurdly fast. Great for autocomplete-ish loops and UI tickets.',
    agentic: true,
    vision: true,
    apiId: 'gemini-2.5-flash',
  },
  {
    id: 'deepseek-v3-2',
    name: 'DeepSeek V3.2',
    short: 'DeepSeek V3.2',
    provider: 'deepseek',
    context: 128_000,
    priceIn: 0.28,
    priceOut: 0.42,
    speed: 4,
    reasoning: 4,
    coding: 4,
    tags: ['price-performance', 'coding'],
    blurb: 'The value king. Punches far above its price on real refactors and test writing.',
    agentic: true,
    apiId: 'deepseek-chat',
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    short: 'R1',
    provider: 'deepseek',
    context: 128_000,
    priceIn: 0.55,
    priceOut: 2.19,
    speed: 2,
    reasoning: 5,
    coding: 4,
    tags: ['reasoning', 'thinking'],
    blurb: 'Show-me-the-thinking mode. Hand it a nasty bug and a stack trace.',
    apiId: 'deepseek-reasoner',
  },
  {
    id: 'kimi-k2',
    name: 'Kimi K2 Thinking',
    short: 'Kimi K2',
    provider: 'moonshot',
    context: 256_000,
    priceIn: 0.6,
    priceOut: 2.5,
    speed: 3,
    reasoning: 5,
    coding: 5,
    tags: ['open-weights', 'agentic', 'cheap-reasoning'],
    blurb: 'Open-weights agentic beast. Runs 200+ tool calls without losing the plot.',
    agentic: true,
    apiId: 'kimi-k2-thinking',
  },
  {
    id: 'qwen3-coder',
    name: 'Qwen3 Coder 480B',
    short: 'Qwen3 Coder',
    provider: 'qwen',
    context: 256_000,
    priceIn: 0.3,
    priceOut: 1.2,
    speed: 4,
    reasoning: 4,
    coding: 5,
    tags: ['open-weights', 'coding', 'cheap'],
    blurb: 'Trained for repos and diffs. The best cost-per-merged-PR in the catalog.',
    agentic: true,
    apiId: 'qwen3-coder-plus',
  },
  {
    id: 'grok-4-fast',
    name: 'Grok 4 Fast',
    short: 'Grok 4 Fast',
    provider: 'xai',
    context: 2_000_000,
    priceIn: 0.2,
    priceOut: 0.5,
    speed: 5,
    reasoning: 4,
    coding: 4,
    tags: ['2m-context', 'tools', 'fast'],
    blurb: 'Two million tokens and no patience. Good for sweeping migrations.',
    agentic: true,
    apiId: 'grok-4-fast-reasoning',
  },
  {
    id: 'mistral-medium-3',
    name: 'Mistral Medium 3',
    short: 'Mistral M3',
    provider: 'mistral',
    context: 128_000,
    priceIn: 0.4,
    priceOut: 2,
    speed: 4,
    reasoning: 3,
    coding: 4,
    tags: ['eu-hosted', 'cheap'],
    blurb: 'EU-hosted, fast, and surprisingly good at TypeScript.',
    agentic: true,
    apiId: 'mistral-medium-latest',
  },
  {
    id: 'llama-4-scout',
    name: 'Llama 4 Scout',
    short: 'Llama 4',
    provider: 'openrouter',
    context: 320_000,
    priceIn: 0.15,
    priceOut: 0.6,
    speed: 4,
    reasoning: 3,
    coding: 3,
    tags: ['open-weights', 'router'],
    blurb: 'One toggle away through OpenRouter. Fine for scaffolding and docs.',
    apiId: 'meta-llama/llama-4-scout',
  },
  {
    id: 'qwen2-5-coder-32b-local',
    name: 'Qwen2.5 Coder 32B',
    short: 'Qwen 32B · local',
    provider: 'ollama',
    context: 32_768,
    priceIn: 0,
    priceOut: 0,
    speed: 2,
    reasoning: 3,
    coding: 3,
    tags: ['local', 'private', 'offline'],
    blurb: 'Runs on your own box. Nothing leaves the machine. Ever.',
    local: true,
    apiId: 'qwen2.5-coder:32b',
  },
  {
    id: 'devstral-local',
    name: 'Devstral 24B',
    short: 'Devstral · local',
    provider: 'lmstudio',
    context: 128_000,
    priceIn: 0,
    priceOut: 0,
    speed: 3,
    reasoning: 3,
    coding: 4,
    tags: ['local', 'agentic', 'private'],
    blurb: 'A small model purpose-built for agent scaffolding. Great with SLURP tools.',
    local: true,
    apiId: 'devstral-small',
  },
]

export const modelById = (id: string) => MODELS.find((m) => m.id === id) ?? MODELS[0]

export const fmtContext = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}M` : `${Math.round(n / 1000)}K`

export const fmtPrice = (m: Model) =>
  m.local || (m.priceIn === 0 && m.priceOut === 0) ? 'free' : `$${m.priceIn} / $${m.priceOut}`

/** Rough, honest cost estimate for the HUD. */
export const estimateCost = (m: Model, inTok: number, outTok: number) =>
  (inTok / 1_000_000) * m.priceIn + (outTok / 1_000_000) * m.priceOut
