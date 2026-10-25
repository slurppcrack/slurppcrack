import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ProviderId } from './models'

export type Autonomy = 'ask' | 'auto' | 'yolo'
export type Density = 'comfortable' | 'compact'

export type Settings = {
  onboarded: boolean
  name: string
  // models
  modelId: string
  subagentModelId: string
  plannerEnabled: boolean
  temperature: number
  maxSteps: number
  reasoningEffort: 'low' | 'medium' | 'high'
  // providers
  keys: Partial<Record<ProviderId, string>>
  baseUrls: Partial<Record<ProviderId, string>>
  localOnly: boolean
  // behaviour
  persona: string
  customPrompt: string
  autonomy: Autonomy
  autoFormat: boolean
  autoTest: boolean
  gitCommits: boolean
  contextBudget: number
  // tools
  tools: Record<string, boolean>
  // chrome
  accent: string
  density: Density
  uiFont: number
  monoFont: number
  animations: boolean
  reduceMotion: boolean
  compactRail: boolean
  // plugins + data
  plugins: Record<string, boolean>
  telemetry: boolean
  autoUpdate: boolean
  checkpoints: boolean
}

export const PERSONAS = [
  {
    id: 'surgeon',
    name: 'The Surgeon',
    emoji: 'scissors',
    desc: 'Minimal diffs. Never rewrites what it does not have to touch.',
    prompt:
      'Make the smallest possible change that solves the problem. Never reformat untouched code, never rename unrelated symbols, never rewrite a file you can patch. Prefer surgical diffs over rewrites.',
  },
  {
    id: 'architect',
    name: 'The Architect',
    emoji: 'ruler',
    desc: 'Plans the shape of the system first, then builds it in clean layers.',
    prompt:
      'Before writing code, produce a short plan of the module boundaries and data flow. Prefer small composable files over god-files. Name things precisely. Add a one-line doc comment to every exported symbol.',
  },
  {
    id: 'racer',
    name: 'The Racer',
    emoji: 'zap',
    desc: 'Moves fast, ships the vertical slice, refines only after it runs.',
    prompt:
      'Bias hard toward a working vertical slice. Do not gold-plate. Ship the shortest path to something the user can click, then iterate. Skip tests for throwaway spikes, add them the moment the shape settles.',
  },
  {
    id: 'mentor',
    name: 'The Mentor',
    emoji: 'cap',
    desc: 'Explains every decision as it goes, like a patient senior dev pairing.',
    prompt:
      'Teach as you build. Before each significant edit, say in one sentence why. After each tool call, summarise what changed and what it means. Never dump unexplained code.',
  },
  {
    id: 'custom',
    name: 'Custom',
    emoji: 'pen',
    desc: 'Write your own operating instructions.',
    prompt: '',
  },
] as const

export const TOOL_CATALOG = [
  { id: 'read', name: 'read_file', desc: 'Read files with line ranges', risk: 'safe', group: 'Filesystem' },
  { id: 'write', name: 'write_file', desc: 'Create or overwrite files', risk: 'write', group: 'Filesystem' },
  { id: 'patch', name: 'apply_patch', desc: 'Unified-diff edits with fuzzy matching', risk: 'write', group: 'Filesystem' },
  { id: 'glob', name: 'glob', desc: 'Find files by pattern', risk: 'safe', group: 'Search' },
  { id: 'grep', name: 'grep', desc: 'Ripgrep across the workspace', risk: 'safe', group: 'Search' },
  { id: 'shell', name: 'run_command', desc: 'Execute shell commands in a sandbox', risk: 'exec', group: 'Runtime' },
  { id: 'browser', name: 'browser', desc: 'Drive a headless browser and screenshot', risk: 'exec', group: 'Runtime' },
  { id: 'fetch', name: 'fetch_url', desc: 'Fetch docs and APIs', risk: 'net', group: 'Context' },
  { id: 'git', name: 'git', desc: 'Stage, diff, commit, branch', risk: 'write', group: 'VCS' },
  { id: 'lsp', name: 'lsp', desc: 'Diagnostics, hover, rename via language servers', risk: 'safe', group: 'Context' },
  { id: 'todo', name: 'todo', desc: 'Maintain a live task list', risk: 'safe', group: 'Planning' },
  { id: 'delegate', name: 'delegate', desc: 'Spin up cheap subagents for grunt work', risk: 'net', group: 'Planning' },
] as const

export const DEFAULT_SETTINGS: Settings = {
  onboarded: false,
  name: 'you',
  modelId: 'claude-sonnet-4-5',
  subagentModelId: 'gpt-5-mini',
  plannerEnabled: true,
  temperature: 0.3,
  maxSteps: 40,
  reasoningEffort: 'medium',
  keys: {},
  baseUrls: {},
  localOnly: false,
  persona: 'surgeon',
  customPrompt: '',
  autonomy: 'auto',
  autoFormat: true,
  autoTest: true,
  gitCommits: false,
  contextBudget: 120_000,
  tools: {
    read: true,
    write: true,
    patch: true,
    glob: true,
    grep: true,
    shell: true,
    browser: false,
    fetch: true,
    git: true,
    lsp: true,
    todo: true,
    delegate: true,
  },
  accent: 'lime',
  density: 'comfortable',
  uiFont: 14,
  monoFont: 12.5,
  animations: true,
  reduceMotion: false,
  compactRail: false,
  plugins: {
    'git-guard': true,
    'test-watcher': true,
    'mcp-bridge': true,
    'figma-sync': false,
    'voice-mode': false,
    'semantic-index': true,
    'cost-guard': true,
    'vibe-themes': true,
  },
  telemetry: false,
  autoUpdate: true,
  checkpoints: true,
}

const KEY = 'slurp.settings.v1'

export const ACCENTS: Record<string, { name: string; hex: string; glow: string }> = {
  lime: { name: 'Acid lime', hex: '#c6ff4a', glow: '198, 255, 74' },
  mint: { name: 'Mint', hex: '#6ef7c4', glow: '110, 247, 196' },
  ice: { name: 'Ice', hex: '#8ad8ff', glow: '138, 216, 255' },
  violet: { name: 'Violet', hex: '#b69bff', glow: '182, 155, 255' },
  ember: { name: 'Ember', hex: '#ff9d5c', glow: '255, 157, 92' },
  rose: { name: 'Rose', hex: '#ff8ab5', glow: '255, 138, 181' },
}

type Ctx = {
  settings: Settings
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  patch: (p: Partial<Settings>) => void
  reset: () => void
  accent: { name: string; hex: string; glow: string }
}

const SettingsCtx = createContext<Ctx | null>(null)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return DEFAULT_SETTINGS
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings))
    } catch {}
    const accent = ACCENTS[settings.accent] ?? ACCENTS.lime
    const root = document.documentElement
    root.style.setProperty('--accent', accent.hex)
    root.style.setProperty('--accent-glow', accent.glow)
    root.style.setProperty('--ui-size', `${settings.uiFont}px`)
    root.style.setProperty('--mono-size', `${settings.monoFont}px`)
    root.dataset.density = settings.density
    root.dataset.motion = settings.animations && !settings.reduceMotion ? 'on' : 'off'
  }, [settings])

  const value = useMemo<Ctx>(
    () => ({
      settings,
      set: (key, val) => setSettings((s) => ({ ...s, [key]: val })),
      patch: (p) => setSettings((s) => ({ ...s, ...p })),
      reset: () => setSettings(DEFAULT_SETTINGS),
      accent: ACCENTS[settings.accent] ?? ACCENTS.lime,
    }),
    [settings],
  )

  return <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsCtx)
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider')
  return ctx
}
