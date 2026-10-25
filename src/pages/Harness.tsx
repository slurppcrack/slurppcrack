import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowUp,
  Boxes,
  Brain,
  Check,
  ChevronsLeft,
  ChevronsRight,
  Circle,
  Code2,
  Command,
  Cpu,
  FileCode2,
  FilePlus2,
  FolderGit2,
  GitBranch,
  Gauge,
  Layers,
  LayoutPanelLeft,
  ListChecks,
  MessageSquarePlus,
  PanelRight,
  Play,
  Plug,
  Search,
  Settings2,
  Sparkles,
  Square,
  SquareTerminal,
  Terminal,
  Wand2,
  Zap,
} from 'lucide-react'
import { Mark } from '../components/Brand'
import { Thread, TypingIndicator } from '../components/Thread'
import { CommandPalette, ModelChip, ModelPicker, type Cmd } from '../components/Pickers'
import { Switch, useToast } from '../components/ui'
import { PersonaIcon, PluginIcon } from '../components/glyphs'
import { runAgent, type Item } from '../lib/agent'
import { estimateCost, modelById, providerById } from '../lib/models'
import { PERSONAS, useSettings } from '../lib/store'
import { PLUGINS } from '../lib/plugins'
import { streamChat } from '../lib/llm'

type Session = { id: string; title: string; items: Item[]; at: number }

const uid = () => Math.random().toString(36).slice(2, 9)

const SUGGESTIONS = [
  { icon: Wand2, title: 'Harden the auth flow', desc: 'sessions never expire, and the login form swallows errors', prompt: 'harden the auth flow before we ship friday — sessions never expire and login errors are silently swallowed' },
  { icon: Gauge, title: 'Build the usage dashboard', desc: 'chart fed by /api/metrics with real empty states', prompt: 'build a usage dashboard with a revenue chart from the metrics endpoint, handle empty and error states' },
  { icon: Code2, title: 'Add a validated API route', desc: 'zod at the edge, caching, typed handler', prompt: 'add a validated api route for metrics with zod and cache headers' },
  { icon: Boxes, title: 'Wire up Stripe checkout', desc: 'checkout session plus an idempotent webhook', prompt: 'wire up stripe checkout with an idempotent webhook handler' },
]

const SLASH = [
  { cmd: '/model', desc: 'switch the main model' },
  { cmd: '/subagent', desc: 'switch the cheap subagent model' },
  { cmd: '/persona', desc: 'change the agent persona' },
  { cmd: '/autonomy', desc: 'cycle ask → auto → yolo' },
  { cmd: '/new', desc: 'start a fresh session' },
  { cmd: '/clear', desc: 'clear this thread' },
  { cmd: '/undo', desc: 'revert to the last checkpoint' },
  { cmd: '/commit', desc: 'commit the working tree' },
  { cmd: '/test', desc: 'run the affected test suite' },
  { cmd: '/diff', desc: 'show the full diff of this session' },
  { cmd: '/cost', desc: 'token and cost breakdown' },
  { cmd: '/plugins', desc: 'open the plugin registry' },
  { cmd: '/mcp', desc: 'list connected MCP servers' },
  { cmd: '/settings', desc: 'open settings' },
  { cmd: '/help', desc: 'everything you can type' },
]

export default function Harness() {
  const { settings, patch } = useSettings()
  const navigate = useNavigate()
  const toast = useToast()

  const [sessions, setSessions] = useState<Session[]>(() => [
    { id: uid(), title: 'Harden the auth flow', at: Date.now(), items: [] },
    { id: uid(), title: 'Fix flaky checkout test', at: Date.now() - 864e5, items: [] },
    { id: uid(), title: 'Usage chart on the dashboard', at: Date.now() - 1728e5, items: [] },
  ])
  const [activeId, setActiveId] = useState(() => '')
  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const [modelOpen, setModelOpen] = useState<false | 'main' | 'sub'>(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [rightTab, setRightTab] = useState<'run' | 'tools' | 'files'>('run')
  const [rightOpen, setRightOpen] = useState(true)
  const [railOpen, setRailOpen] = useState(false)
  const [slashSel, setSlashSel] = useState(0)
  const [approval, setApproval] = useState<{ tool: string; target: string; resolve: (v: boolean) => void } | null>(null)
  const [liveEnabled, setLiveEnabled] = useState(true)
  const [now, setNow] = useState(Date.now())
  const [runStart, setRunStart] = useState<number | null>(null)

  const signal = useRef({ aborted: false })
  const taRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setActiveId((prev) => prev || sessions[0].id)
  }, [sessions])

  const active = sessions.find((s) => s.id === activeId) ?? sessions[0]
  const items = active?.items ?? []

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(t)
  }, [running])

  const model = modelById(settings.modelId)
  const provider = providerById(model.provider)
  const hasKey = Boolean(settings.keys[model.provider])

  const setItems = useCallback(
    (fn: (prev: Item[]) => Item[]) => {
      setSessions((prev) => prev.map((s) => (s.id === activeId ? { ...s, items: fn(s.items) } : s)))
    },
    [activeId],
  )

  const push = useCallback((item: Item) => setItems((prev) => [...prev, item]), [setItems])

  const upsert = useCallback(
    (item: Item) =>
      setItems((prev) => {
        const i = prev.findIndex((x) => x.id === item.id)
        if (i === -1) return [...prev, item]
        const next = prev.slice()
        next[i] = item
        return next
      }),
    [setItems],
  )

  const abort = () => {
    signal.current.aborted = true
    setApproval((a) => {
      a?.resolve(false)
      return null
    })
  }

  const runLive = async (prompt: string) => {
    const id = uid()
    upsert({ id, kind: 'text', text: '', live: true })
    let acc = ''
    try {
      await streamChat({
        model,
        key: settings.keys[model.provider] ?? '',
        baseUrl: settings.baseUrls[model.provider],
        temperature: settings.temperature,
        signal: undefined,
        messages: [
          {
            role: 'system',
            content: [
              'You are SLURP, an agentic coding assistant running inside a local-first harness attached to the workspace "acme-web" (a Next.js + TypeScript app).',
              'Be concrete and terse. When you propose code, show the smallest diff that works and name the file it belongs to. Never invent files or APIs you have not seen.',
              PERSONAS.find((p) => p.id === settings.persona)?.prompt ?? '',
              settings.customPrompt ?? '',
              `Operating settings: autonomy=${settings.autonomy}, planner=${settings.plannerEnabled}, temperature=${settings.temperature}.`,
            ]
              .filter(Boolean)
              .join('\n\n'),
          },
          { role: 'user', content: prompt },
        ],
        onDelta: (d) => {
          acc += d
          upsert({ id, kind: 'text', text: acc, live: true })
        },
      })
      upsert({ id, kind: 'text', text: acc, live: false })
      push({
        id: uid(),
        kind: 'note',
        tone: 'info',
        text: 'Live response from the real API. The desktop build continues this into tool calls against your actual workspace.',
      })
    } catch (e: any) {
      upsert({
        id,
        kind: 'text',
        text: `The provider rejected that request: ${e?.message ?? 'unknown error'}. The key may be for a different provider, or the endpoint/base URL is off. Fix it in Settings → Providers, or switch to demo mode below.`,
        live: false,
      })
      push({ id: uid(), kind: 'note', tone: 'warn', text: 'Live call failed. Demo mode still works — toggle “live” off in the composer to run the scripted agent.' })
    }
  }

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim()
    if (!text || running) return
    if (text.startsWith('/')) {
      setInput('')
      runCommand(text)
      return
    }
    setInput('')
    push({ id: uid(), kind: 'user', text, at: Date.now() })
    if (active.items.length === 0) {
      setSessions((prev) => prev.map((s) => (s.id === activeId ? { ...s, title: text.slice(0, 42) } : s)))
    }

    signal.current = { aborted: false }
    setRunning(true)
    setRunStart(Date.now())
    const useLive = liveEnabled && hasKey

    if (useLive) {
      await runLive(text)
      setRunning(false)
      setRunStart(null)
      return
    }

    try {
      await runAgent(text, {
        modelId: settings.modelId,
        autonomy: settings.autonomy,
        persona: settings.persona,
        planner: settings.plannerEnabled,
        autoTest: settings.autoTest,
        onEvent: (item) => upsert(item),
        signal: signal.current,
        requestApproval: ({ tool, target }) =>
          new Promise<boolean>((resolve) => {
            setApproval({ tool, target, resolve: (v) => resolve(v) })
          }),
      })
    } catch {
      /* aborted */
    } finally {
      setApproval(null)
      setRunning(false)
      setRunStart(null)
    }
  }

  const runCommand = (raw: string) => {
    const [cmd] = raw.split(/\s+/)
    switch (cmd) {
      case '/model':
        setModelOpen('main')
        break
      case '/subagent':
        setModelOpen('sub')
        break
      case '/persona':
        navigate('/settings?tab=persona')
        break
      case '/settings':
        navigate('/settings')
        break
      case '/plugins':
        navigate('/settings?tab=plugins')
        break
      case '/autonomy': {
        const order = ['ask', 'auto', 'yolo'] as const
        const next = order[(order.indexOf(settings.autonomy) + 1) % 3]
        patch({ autonomy: next })
        toast.show(`Autonomy: ${next}`)
        break
      }
      case '/new': {
        const s: Session = { id: uid(), title: 'New session', at: Date.now(), items: [] }
        setSessions((p) => [s, ...p])
        setActiveId(s.id)
        break
      }
      case '/clear':
        setItems(() => [])
        toast.show('Thread cleared')
        break
      case '/undo':
        push({ id: uid(), kind: 'note', tone: 'ok', text: 'Reverted 3 files to checkpoint “before auth patch”. Working tree is clean.' })
        break
      case '/commit':
        push({ id: uid(), kind: 'note', tone: 'ok', text: 'Committed as 8f2c1ae — “harden session expiry, gate protected routes”. Pushed to origin/slurp/auth-hardening.' })
        break
      case '/test':
        push({ id: uid(), kind: 'note', tone: 'info', text: 'Running the affected suite: 13 passed, 0 failed. Logs are in the Run panel.' })
        break
      case '/diff':
        push({ id: uid(), kind: 'note', tone: 'info', text: 'The full session diff is in the Files panel on the right — 3 files, +68 −23.' })
        break
      case '/cost':
        push({ id: uid(), kind: 'note', tone: 'info', text: `This session: ~${fmtTok(est.inTok)} input, ~${fmtTok(est.outTok)} output on ${model.short} → ~$${est.cost.toFixed(4)}. Budget left today: $4.71 of $5.00.` })
        break
      case '/mcp':
        push({ id: uid(), kind: 'note', tone: 'info', text: 'MCP bridge: postgres (connected), linear (connected), playwright (idle), notion (not configured).' })
        break
      case '/help':
        push({ id: uid(), kind: 'note', tone: 'info', text: SLASH.map((s) => s.cmd).join('   ') })
        break
      default:
        push({ id: uid(), kind: 'note', tone: 'warn', text: `Unknown command ${cmd}. Try /help.` })
    }
    scrollToEnd()
  }

  const scrollToEnd = () => {
    requestAnimationFrame(() => {
      const el = scrollRef.current
      if (el) el.scrollTop = el.scrollHeight
    })
  }

  // derived stats
  const diffs = useMemo(() => items.filter((i): i is Extract<Item, { kind: 'diff' }> => i.kind === 'diff'), [items])
  const toolCount = items.filter((i) => i.kind === 'tool').length
  const doneItem = useMemo(() => [...items].reverse().find((i): i is Extract<Item, { kind: 'done' }> => i.kind === 'done'), [items])
  const filesTouched = useMemo(() => Array.from(new Set(diffs.map((d) => d.file))), [diffs])
  const added = diffs.reduce((a, d) => a + d.added, 0)
  const removed = diffs.reduce((a, d) => a + d.removed, 0)
  const est = useMemo(() => {
    const inTok = doneItem?.stats.inTok ?? toolCount * 1450 + 3200
    const outTok = doneItem?.stats.outTok ?? toolCount * 210 + 400
    return { inTok, outTok, cost: estimateCost(model, inTok, outTok) }
  }, [doneItem, toolCount, model])

  const elapsed = runStart ? now - runStart : doneItem?.stats.ms ?? 0

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
      if (meta && e.key.toLowerCase() === 'm') {
        e.preventDefault()
        setModelOpen('main')
      }
      if (meta && e.key === ',') {
        e.preventDefault()
        navigate('/settings')
      }
      if (meta && e.key === 'Enter') {
        e.preventDefault()
        send()
      }
      if (e.key === 'Escape' && running) abort()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [running, send, navigate])

  // autosize textarea
  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 220)}px`
  }, [input])

  const slashQuery = input.startsWith('/') && !input.includes(' ') ? input.toLowerCase() : null
  const slashList = slashQuery ? SLASH.filter((s) => s.cmd.startsWith(slashQuery)) : []

  const commands: Cmd[] = [
    { id: 'model', group: 'Models', label: 'Switch main model…', hint: '⌘M', icon: Sparkles, run: () => setModelOpen('main') },
    { id: 'submodel', group: 'Models', label: 'Switch subagent model…', hint: modelById(settings.subagentModelId).short, icon: Cpu, run: () => setModelOpen('sub') },
    { id: 'new', group: 'Session', label: 'New session', icon: MessageSquarePlus, run: () => runCommand('/new') },
    { id: 'clear', group: 'Session', label: 'Clear this thread', icon: Layers, run: () => runCommand('/clear') },
    { id: 'undo', group: 'Session', label: 'Revert to last checkpoint', hint: '⌘Z', icon: GitBranch, run: () => runCommand('/undo') },
    { id: 'commit', group: 'Session', label: 'Commit the working tree', icon: Boxes, run: () => runCommand('/commit') },
    { id: 'persona', group: 'Settings', label: 'Change persona', icon: Brain, run: () => navigate('/settings?tab=persona') },
    { id: 'tools', group: 'Settings', label: 'Tool permissions', icon: Terminal, run: () => navigate('/settings?tab=tools') },
    { id: 'plugins', group: 'Settings', label: 'Plugin registry', icon: Plug, run: () => navigate('/settings?tab=plugins') },
    { id: 'appearance', group: 'Settings', label: 'Appearance & accent', icon: LayoutPanelLeft, run: () => navigate('/settings?tab=appearance') },
    { id: 'all', group: 'Settings', label: 'All settings…', hint: '⌘,', icon: Settings2, run: () => navigate('/settings') },
    { id: 'panel', group: 'View', label: rightOpen ? 'Hide right panel' : 'Show right panel', icon: PanelRight, run: () => setRightOpen((v) => !v) },
  ]

  return (
    <div className={`shell${railOpen ? '' : ''}`}>
      {/* rail */}
      <div className={`rail-wrap${railOpen ? ' open' : ''}`} style={{ gridColumn: 1 }}>
        <aside className="rail">
          <div className="rail-top">
            <Link to="/" className="brand" style={{ fontSize: 14.5 }}>
              <Mark size={22} />
              <span>slurp</span>
            </Link>
            <button className="icon-btn" style={{ marginLeft: 'auto' }} onClick={() => navigate('/')} title="Home">
              <ChevronsLeft />
            </button>
          </div>
          <div className="rail-scroll">
            <div>
              <button
                className="rail-item"
                style={{ border: '1px solid var(--line)', background: 'rgba(255,255,255,.03)', color: 'var(--text)' }}
                onClick={() => runCommand('/new')}
              >
                <MessageSquarePlus /> New session
                <span className="tail">⌘N</span>
              </button>
            </div>

            <div className="rail-group">
              <div className="lbl">Workspace</div>
              <div className="rail-item on">
                <FolderGit2 /> acme-web
                <span className="tail">main</span>
              </div>
              <div className="rail-item">
                <FolderGit2 /> slurp-plugins
              </div>
              <div className="rail-item" style={{ color: 'var(--muted-dim)' }}>
                <FilePlus2 /> Add folder…
              </div>
            </div>

            <div className="rail-group">
              <div className="lbl">Sessions</div>
              {sessions.map((s) => (
                <button
                  key={s.id}
                  className={`rail-item${s.id === activeId ? ' on' : ''}`}
                  onClick={() => {
                    setActiveId(s.id)
                    setRailOpen(false)
                  }}
                >
                  <Circle size={5} style={{ fill: 'currentColor', opacity: 0.7 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
                  {s.id === activeId && running && <span className="dot" />}
                </button>
              ))}
            </div>

            <div className="rail-group">
              <div className="lbl">Plugins active</div>
              {PLUGINS.filter((p) => settings.plugins[p.id])
                .slice(0, 4)
                .map((p) => (
                  <div className="rail-item" key={p.id} style={{ color: 'var(--muted)' }}>
                    <span style={{ width: 15, display: 'grid', placeItems: 'center' }}>
                      <PluginIcon category={p.category} size={13} />
                    </span>
                    <span style={{ fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                    <span className="tail" style={{ color: 'var(--accent)' }}>
                      on
                    </span>
                  </div>
                ))}
              <button className="rail-item" style={{ color: 'var(--muted-dim)' }} onClick={() => navigate('/settings?tab=plugins')}>
                <Plug /> Manage plugins
              </button>
            </div>

            <div className="budget">
              <div className="row">
                <span>context</span>
                <b>{Math.min(99, Math.round(((est.inTok + est.outTok) / settings.contextBudget) * 100))}%</b>
              </div>
              <div className="meter" style={{ height: 4 }}>
                <i style={{ width: `${Math.min(99, ((est.inTok + est.outTok) / settings.contextBudget) * 100)}%` }} />
              </div>
              <div className="row" style={{ marginTop: 8, marginBottom: 0 }}>
                <span>{fmtTok(est.inTok + est.outTok)} / {fmtTok(settings.contextBudget)}</span>
                <b style={{ color: 'var(--accent)' }}>${est.cost.toFixed(3)}</b>
              </div>
            </div>
          </div>

          <div className="rail-foot">
            <button className="rail-item" onClick={() => navigate('/settings')}>
              <Settings2 /> Settings
              <span className="tail">⌘,</span>
            </button>
            <div className="rail-user">
              <span className="avatar">{settings.name.slice(0, 1).toUpperCase()}</span>
              <span>
                <span className="who" style={{ display: 'block' }}>
                  {settings.name}
                </span>
                <span className="plan">open beta · local</span>
              </span>
              <ChevronsRight style={{ transform: 'rotate(90deg)' }} />
            </div>
          </div>
        </aside>
      </div>

      {/* main */}
      <div className="main" style={{ gridColumn: 2 }}>
        <div className="topbar">
          <button className="icon-btn" onClick={() => setRailOpen((v) => !v)} title="Sessions">
            <ChevronsRight style={{ transform: railOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
          </button>
          <div className="crumbs">
            <FolderGit2 />
            <span>acme-web</span>
            <span style={{ opacity: 0.4 }}>/</span>
            <b>{active?.title ?? 'New session'}</b>
          </div>
          <span className="chip hide-sm" style={{ marginLeft: 4, height: 22, fontSize: 10.5 }}>
            <GitBranch size={10} /> main
          </span>
          <div className="top-right">
            <button className="chip hide-sm" style={{ height: 26 }} onClick={() => runCommand('/autonomy')} title="Autonomy">
              <Zap size={11} style={{ color: 'var(--accent)' }} />
              {settings.autonomy === 'ask' ? 'ask before writes' : settings.autonomy === 'auto' ? 'auto + checkpoints' : 'full send'}
            </button>
            <ModelChip id={settings.modelId} onClick={() => setModelOpen('main')} compact />
            {hasKey && liveEnabled ? <span className="live-pill">live</span> : <span className="live-pill demo">demo</span>}
            <button className="icon-btn" onClick={() => setPaletteOpen(true)} title="Command palette (⌘K)">
              <Command />
            </button>
            <button className="icon-btn hide-sm" onClick={() => setRightOpen((v) => !v)} title="Toggle panel">
              <PanelRight />
            </button>
            <button className="icon-btn" onClick={() => navigate('/settings')} title="Settings (⌘,)">
              <Settings2 />
            </button>
          </div>
        </div>

        {!settings.onboarded && (
          <div className="setup-banner">
            <Sparkles size={13} />
            <span>
              <b>Finish setup</b> — pick models, persona and autonomy once, and every future session starts tuned to you.
            </span>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/setup')}>
              Run the 90-second setup
            </button>
            <button className="btn btn-quiet btn-sm" onClick={() => patch({ onboarded: true })}>
              Skip
            </button>
          </div>
        )}

        <div className="thread" ref={scrollRef}>
          {items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-glyph">
                <Wand2 />
              </div>
              <h1>What are we building?</h1>
              <p>
                Describe the change. SLURP explores the repo, writes a plan, patches the files it has to touch and runs your
                tests before it says it is done.
              </p>
              <div className="suggestions">
                {SUGGESTIONS.map((s) => (
                  <button className="suggestion" key={s.title} onClick={() => send(s.prompt)}>
                    <span className="sg">
                      <s.icon />
                    </span>
                    <span>
                      <b>{s.title}</b>
                      <span>{s.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="mono" style={{ marginTop: 22, fontSize: 11, color: 'var(--muted-dim)' }}>
                {hasKey ? `live key detected for ${provider.name} — responses will be real` : `demo mode · add a ${provider.name} key in settings for live responses`}
              </div>
            </div>
          ) : (
            <div className="thread-inner">
              <Thread items={items} modelId={settings.modelId} onFollowUp={(t) => send(t)} />
              {running && <TypingIndicator modelId={settings.modelId} />}

              {approval && (
                <div className="approval">
                  <span className="ac">
                    <AlertTriangle />
                  </span>
                  <span>
                    <b>Approve write?</b>
                    <span className="sm">
                      {approval.tool} · {approval.target}
                    </span>
                  </span>
                  <span className="acts">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        approval.resolve(false)
                        setApproval(null)
                      }}
                    >
                      Reject
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        approval.resolve(true)
                        setApproval(null)
                      }}
                    >
                      <Check size={12} /> Approve
                    </button>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="composer-wrap">
          <div className="composer" style={{ position: 'relative' }}>
            {slashList.length > 0 && (
              <div className="slash-menu">
                {slashList.map((s, i) => (
                  <button
                    key={s.cmd}
                    className={`slash-item${i === slashSel ? ' sel' : ''}`}
                    onMouseEnter={() => setSlashSel(i)}
                    onClick={() => {
                      setInput('')
                      runCommand(s.cmd)
                    }}
                  >
                    <span className="cmd">{s.cmd}</span>
                    <span className="d">{s.desc}</span>
                  </button>
                ))}
              </div>
            )}
            <textarea
              ref={taRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                setSlashSel(0)
              }}
              onKeyDown={(e) => {
                if (slashList.length > 0) {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setSlashSel((s) => Math.min(s + 1, slashList.length - 1))
                    return
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setSlashSel((s) => Math.max(s - 1, 0))
                    return
                  }
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const cmd = slashList[slashSel]
                    setInput('')
                    if (cmd) runCommand(cmd.cmd)
                    return
                  }
                }
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              placeholder={running ? 'Agent is working — press esc to stop…' : 'Describe the change, or type / for commands…'}
              rows={1}
              spellCheck={false}
            />
            <div className="composer-bar">
              <button className="cb-chip" onClick={() => setModelOpen('main')}>
                <span className="pdot" style={{ background: provider.color }} />
                {model.short}
              </button>
              <button className="cb-chip persona" onClick={() => navigate('/settings?tab=persona')}>
                <PersonaIcon id={settings.persona} size={13} />
                {PERSONAS.find((p) => p.id === settings.persona)?.name.replace('The ', '')}
              </button>
              <button
                className={`cb-chip${settings.plannerEnabled ? ' on' : ''}`}
                onClick={() => patch({ plannerEnabled: !settings.plannerEnabled })}
                title="Plan before acting"
              >
                <ListChecks /> plan
              </button>
              <button
                className={`cb-chip${settings.autoTest ? ' on' : ''}`}
                onClick={() => patch({ autoTest: !settings.autoTest })}
                title="Run tests after edits"
              >
                <SquareTerminal /> test
              </button>
              {hasKey && (
                <button className={`cb-chip${liveEnabled ? ' on' : ''}`} onClick={() => setLiveEnabled((v) => !v)} title="Use the real API">
                  <Play /> live
                </button>
              )}
              <div className="cb-right">
                <span className="cost-hint">
                  {filesTouched.length} files · ${est.cost.toFixed(3)}
                </span>
                {running ? (
                  <button className="send-btn stop" onClick={abort} title="Stop (esc)">
                    <Square size={13} style={{ fill: 'currentColor' }} />
                  </button>
                ) : (
                  <button className="send-btn" onClick={() => send()} disabled={!input.trim()} title="Send (⌘↵)">
                    <ArrowUp />
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="composer-foot">
            <span>
              <span className="kbd">↵</span> send
            </span>
            <span className="opt">
              <span className="kbd">⇧↵</span> newline
            </span>
            <span className="opt">
              <span className="kbd">/</span> commands
            </span>
            <span>
              <span className="kbd">⌘K</span> palette
            </span>
            <span className="grow">{settings.autonomy === 'ask' ? 'you approve every write' : 'checkpoints on'}</span>
            <span style={{ color: hasKey && liveEnabled ? 'var(--accent)' : 'var(--muted-dim)' }}>
              {hasKey && liveEnabled ? `${provider.name} · live` : 'simulated repo'}
            </span>
          </div>
        </div>
      </div>

      {/* right panel */}
      <div className={`right${rightOpen ? '' : ' collapsed'}`} style={{ gridColumn: 3 }}>
        <div className="right-tabs">
          <button className={rightTab === 'run' ? 'on' : ''} onClick={() => setRightTab('run')}>
            Run
          </button>
          <button className={rightTab === 'tools' ? 'on' : ''} onClick={() => setRightTab('tools')}>
            Tools
          </button>
          <button className={rightTab === 'files' ? 'on' : ''} onClick={() => setRightTab('files')}>
            Files
          </button>
        </div>
        <div className="right-body">
          {rightTab === 'run' && (
            <>
              <div className="panel-card">
                <h5>
                  <Cpu size={11} /> this run
                  <span className="grow">{running ? 'live' : doneItem ? 'complete' : 'idle'}</span>
                </h5>
                <div className="kv">
                  <span>model</span>
                  <b>{model.short}</b>
                </div>
                <div className="kv">
                  <span>subagent</span>
                  <b>{modelById(settings.subagentModelId).short}</b>
                </div>
                <div className="kv">
                  <span>persona</span>
                  <b>{PERSONAS.find((p) => p.id === settings.persona)?.name.replace('The ', '')}</b>
                </div>
                <div className="kv">
                  <span>steps</span>
                  <b>{doneItem?.stats.steps ?? toolCount}</b>
                </div>
                <div className="kv">
                  <span>elapsed</span>
                  <b>{(elapsed / 1000).toFixed(1)}s</b>
                </div>
                <div className="kv">
                  <span>tokens</span>
                  <b>
                    {fmtTok(est.inTok)} / {fmtTok(est.outTok)}
                  </b>
                </div>
                <div className="kv">
                  <span>cost</span>
                  <b style={{ color: 'var(--accent)' }}>${est.cost.toFixed(4)}</b>
                </div>
              </div>

              <div className="panel-card">
                <h5>
                  <Gauge size={11} /> context meter
                  <span className="grow">{Math.round(((est.inTok + est.outTok) / settings.contextBudget) * 100)}%</span>
                </h5>
                <div className="meter">
                  <i style={{ width: `${Math.min(99, ((est.inTok + est.outTok) / settings.contextBudget) * 100)}%` }} />
                </div>
                <div className="kv" style={{ marginTop: 8 }}>
                  <span>budget</span>
                  <b>{fmtTok(settings.contextBudget)}</b>
                </div>
                <div className="kv">
                  <span>model window</span>
                  <b>{fmtTok(model.context)}</b>
                </div>
              </div>

              <div className="panel-card">
                <h5>
                  <ListChecks size={11} /> plan
                </h5>
                {items.filter((i) => i.kind === 'plan').length === 0 ? (
                  <p style={{ fontSize: 11.5, color: 'var(--muted-dim)', lineHeight: 1.6 }}>
                    No plan yet. Send a task and the agent will write one before it touches a file.
                  </p>
                ) : (
                  (items.filter((i) => i.kind === 'plan').slice(-1)[0] as any).todos.map((t: any, i: number) => (
                    <div className={`plan-row ${t.status}`} key={i} style={{ fontSize: 12 }}>
                      <span className="box">{t.status === 'done' && <Check size={8} strokeWidth={4} />}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.label}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="panel-card">
                <h5>
                  <SquareTerminal size={11} /> last command
                </h5>
                <div className="term-mini">
                  <div>$ pnpm test --changed</div>
                  <div className="ok">✓ 13 passed</div>
                  <div>✓ 3 files</div>
                  <div>duration 1.84s</div>
                </div>
              </div>
            </>
          )}

          {rightTab === 'tools' && (
            <>
              <div className="panel-card">
                <h5>
                  <Terminal size={11} /> enabled tools
                  <span className="grow">{Object.values(settings.tools).filter(Boolean).length}/12</span>
                </h5>
                {Object.entries(settings.tools).map(([id, on]) => (
                  <div className="kv" key={id} style={{ padding: '6px 0' }}>
                    <span className="mono" style={{ fontSize: 11 }}>
                      {id}
                    </span>
                    <Switch on={on} onChange={(v) => patch({ tools: { ...settings.tools, [id]: v } })} label={id} />
                  </div>
                ))}
              </div>
              <div className="panel-card">
                <h5>
                  <Plug size={11} /> MCP servers
                </h5>
                <div className="kv">
                  <span>postgres</span>
                  <b style={{ color: 'var(--accent)' }}>4 tools</b>
                </div>
                <div className="kv">
                  <span>linear</span>
                  <b style={{ color: 'var(--accent)' }}>6 tools</b>
                </div>
                <div className="kv">
                  <span>playwright</span>
                  <b>idle</b>
                </div>
              </div>
            </>
          )}

          {rightTab === 'files' && (
            <>
              <div className="panel-card">
                <h5>
                  <FileCode2 size={11} /> changed
                  <span className="grow">
                    +{added} −{removed}
                  </span>
                </h5>
                {filesTouched.length === 0 ? (
                  <p style={{ fontSize: 11.5, color: 'var(--muted-dim)', lineHeight: 1.6 }}>
                    Nothing changed yet in this session.
                  </p>
                ) : (
                  diffs.map((d, i) => (
                    <div className="file-row" key={`${d.file}-${i}`}>
                      <i className="bar" style={{ background: 'var(--accent)' }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.file}</span>
                      <span className="st" style={{ color: 'var(--accent)' }}>
                        +{d.added}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="panel-card">
                <h5>
                  <Search size={11} /> context loaded
                </h5>
                {['src/server/auth/session.ts', 'middleware.ts', 'src/app/(auth)/login/page.tsx', 'docs/auth.md'].map((f) => (
                  <div className="file-row" key={f}>
                    <i className="bar" style={{ background: 'rgba(182,155,255,.6)' }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f}</span>
                  </div>
                ))}
              </div>
              <div className="panel-card">
                <h5>
                  <GitBranch size={11} /> branch
                </h5>
                <div className="kv">
                  <span>worktree</span>
                  <b>slurp/auth-hardening</b>
                </div>
                <div className="kv">
                  <span>checkpoint</span>
                  <b>2 min ago</b>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 8 }} onClick={() => runCommand('/undo')}>
                  Revert to checkpoint
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {railOpen && <div className="scrim" onClick={() => setRailOpen(false)} style={{ zIndex: 100 }} />}
      {modelOpen && <ModelPicker mode={modelOpen === 'sub' ? 'sub' : 'main'} onClose={() => setModelOpen(false)} />}
      {paletteOpen && <CommandPalette commands={commands} onClose={() => setPaletteOpen(false)} />}
      {toast.node}
    </div>
  )
}

function fmtTok(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${Math.round(n)}`
}
