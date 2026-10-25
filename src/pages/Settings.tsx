import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Brain,
  Check,
  Cpu,
  Download,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  LayoutPanelLeft,
  ListChecks,
  Palette,
  Plug,
  RotateCcw,
  Shield,
  Sliders,
  Sparkles,
  Terminal,
  Trash2,
  Wand2,
} from 'lucide-react'
import { Mark } from '../components/Brand'
import { AccentPicker, ModelPicker, PersonaPickerInline } from '../components/Pickers'
import { Range, Seg, Switch, useToast } from '../components/ui'
import { PluginIcon } from '../components/glyphs'
import { MODELS, PROVIDERS, fmtContext, fmtPrice, modelById, providerById } from '../lib/models'
import { PLUGIN_CATEGORIES, PLUGINS } from '../lib/plugins'
import { ACCENTS, DEFAULT_SETTINGS, PERSONAS, TOOL_CATALOG, useSettings } from '../lib/store'

const TABS = [
  { id: 'general', label: 'General', icon: Sliders },
  { id: 'models', label: 'Models', icon: Sparkles },
  { id: 'persona', label: 'Persona & rules', icon: Brain },
  { id: 'providers', label: 'Providers & keys', icon: KeyRound },
  { id: 'tools', label: 'Tool permissions', icon: Terminal },
  { id: 'plugins', label: 'Plugins', icon: Plug },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'data', label: 'Privacy & data', icon: Shield },
]

function Row({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="st-row">
      <div className="info">
        <b>{title}</b>
        {desc && <span>{desc}</span>}
      </div>
      <div className="control">{children}</div>
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="st-group">
      <div className="st-group-title">{title}</div>
      {children}
    </div>
  )
}

export default function Settings() {
  const { settings, set, patch, reset } = useSettings()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') ?? 'general'
  const navigate = useNavigate()
  const toast = useToast()
  const [picking, setPicking] = useState<null | 'main' | 'sub'>(null)
  const [shown, setShown] = useState<Record<string, boolean>>({})
  const [plugCat, setPlugCat] = useState<string>('all')

  const setTab = (id: string) => setParams({ tab: id })

  const main = modelById(settings.modelId)
  const sub = modelById(settings.subagentModelId)
  const plugins = useMemo(() => (plugCat === 'all' ? PLUGINS : PLUGINS.filter((p) => p.category === plugCat)), [plugCat])
  const activePlugins = Object.values(settings.plugins).filter(Boolean).length

  return (
    <div className="settings-shell">
      <div className="settings-top">
        <Link to="/app" className="icon-btn" title="Back to the harness">
          <ArrowLeft />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Mark size={20} />
          <b style={{ fontSize: 13.5 }}>Settings</b>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--muted-dim)' }}>
            local · acme-web
          </span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="chip">
            <span style={{ width: 5, height: 5, borderRadius: 99, background: 'var(--accent)', display: 'block' }} />
            saved to this device
          </span>
          <Link to="/app" className="btn btn-primary btn-sm">
            Back to harness
          </Link>
        </div>
      </div>

      <div className="settings-body">
        <nav className="settings-nav">
          {TABS.map((t) => (
            <button key={t.id} className={`sn-item${tab === t.id ? ' on' : ''}`} onClick={() => setTab(t.id)}>
              <t.icon /> {t.label}
              {t.id === 'plugins' && (
                <span className="mono" style={{ marginLeft: 'auto', fontSize: 9.5, color: 'var(--accent)' }}>
                  {activePlugins}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="settings-content">
          {tab === 'general' && (
            <>
              <h2>General</h2>
              <p className="sub">How the harness behaves by default. Everything here can be overridden per session.</p>

              <Group title="Identity">
                <Row title="Display name" desc="Shown in the rail and in exported sessions.">
                  <input className="input" style={{ width: 180 }} value={settings.name} onChange={(e) => set('name', e.target.value)} />
                </Row>
                <Row title="First-run wizard" desc="Replay the guided setup: providers, models, persona, first prompt.">
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate('/setup')}>
                    <Wand2 size={13} /> Restart setup
                  </button>
                </Row>
              </Group>

              <Group title="Autonomy">
                <Row title="Default autonomy" desc="Ask approves every write. Auto applies with checkpoints. Full send disables gates.">
                  <Seg
                    value={settings.autonomy}
                    onChange={(v) => set('autonomy', v)}
                    options={[
                      { id: 'ask', label: 'Ask' },
                      { id: 'auto', label: 'Auto' },
                      { id: 'yolo', label: 'Full send' },
                    ]}
                  />
                </Row>
                <Row title="Checkpoints before writes" desc="Snapshot the working tree before the agent touches a file. One key reverts.">
                  <Switch on={settings.checkpoints} onChange={(v) => set('checkpoints', v)} label="Checkpoints" />
                </Row>
                <Row title="Run tests after edits" desc="Detects your runner and executes the affected specs, feeding failures back to the agent.">
                  <Switch on={settings.autoTest} onChange={(v) => set('autoTest', v)} label="Auto test" />
                </Row>
                <Row title="Format on write" desc="Runs your formatter on files the agent touches, not on the whole repo.">
                  <Switch on={settings.autoFormat} onChange={(v) => set('autoFormat', v)} label="Auto format" />
                </Row>
                <Row title="Commit when green" desc="When the suite passes, commit to a slurp/* branch. Never pushes without asking.">
                  <Switch on={settings.gitCommits} onChange={(v) => set('gitCommits', v)} label="Auto commit" />
                </Row>
              </Group>

              <Group title="Limits">
                <Row title="Max steps per run" desc="A hard ceiling on tool calls. The agent stops and reports instead of looping.">
                  <Range value={settings.maxSteps} min={5} max={120} step={5} onChange={(v) => set('maxSteps', v)} format={(v) => `${v}`} />
                </Row>
                <Row title="Context budget" desc="Tokens the agent may load per run. Caps cost on huge repos.">
                  <Range
                    value={settings.contextBudget}
                    min={16000}
                    max={400000}
                    step={8000}
                    onChange={(v) => set('contextBudget', v)}
                    format={(v) => `${Math.round(v / 1000)}k`}
                  />
                </Row>
              </Group>
            </>
          )}

          {tab === 'models' && (
            <>
              <h2>Models</h2>
              <p className="sub">One expensive brain, one cheap pair of hands. Swap mid-session any time.</p>

              <Group title="Main model">
                <div className="st-row">
                  <div className="info">
                    <b style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 99, background: providerById(main.provider).color, display: 'block' }} />
                      {main.name}
                    </b>
                    <span>{main.blurb}</span>
                  </div>
                  <div className="control">
                    <span className="chip">{fmtContext(main.context)} ctx</span>
                    <span className="chip">{fmtPrice(main)}</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => setPicking('main')}>
                      Change
                    </button>
                  </div>
                </div>
                <div className="st-row">
                  <div className="info">
                    <b>Subagent model</b>
                    <span>Handles grep-and-summarise work and cheap delegated tasks. {sub.name} · {fmtPrice(sub)}</span>
                  </div>
                  <div className="control">
                    <button className="btn btn-ghost btn-sm" onClick={() => setPicking('sub')}>
                      {sub.short}
                    </button>
                  </div>
                </div>
                <Row title="Planner first" desc="Write a visible checklist before touching files. Strongly recommended.">
                  <Switch on={settings.plannerEnabled} onChange={(v) => set('plannerEnabled', v)} label="Planner" />
                </Row>
                <Row title="Delegate grunt work" desc="Route search-and-summarise to the subagent model automatically when it saves money.">
                  <Switch on={settings.tools.delegate} onChange={(v) => patch({ tools: { ...settings.tools, delegate: v } })} label="Delegate" />
                </Row>
              </Group>

              <Group title="Sampling">
                <Row title="Temperature" desc="0.1 is surgical, 0.7 is adventurous, above 1.0 is chaos. For code, stay under 0.4.">
                  <Range value={settings.temperature} min={0} max={1.5} step={0.05} onChange={(v) => set('temperature', v)} format={(v) => v.toFixed(2)} />
                </Row>
                <Row title="Reasoning effort" desc="Higher spends more thinking tokens before the first patch.">
                  <Seg
                    value={settings.reasoningEffort}
                    onChange={(v) => set('reasoningEffort', v)}
                    options={[
                      { id: 'low', label: 'Low' },
                      { id: 'medium', label: 'Medium' },
                      { id: 'high', label: 'High' },
                    ]}
                  />
                </Row>
                <Row title="Max steps" desc="Ceiling on tool calls per run.">
                  <Range value={settings.maxSteps} min={5} max={120} step={5} onChange={(v) => set('maxSteps', v)} format={(v) => `${v}`} />
                </Row>
              </Group>

              <Group title="Catalog">
                <div style={{ padding: 14, display: 'grid', gap: 6 }}>
                  {MODELS.slice(0, 6).map((m) => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: 99, background: providerById(m.provider).color, display: 'block' }} />
                      <span style={{ color: 'var(--text-soft)' }}>{m.name}</span>
                      <span className="mono" style={{ fontSize: 10.5, color: 'var(--muted-dim)' }}>{providerById(m.provider).name}</span>
                      <span className="mono" style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--muted-dim)' }}>
                        {fmtContext(m.context)} · {fmtPrice(m)}
                      </span>
                      {settings.modelId === m.id && <Check size={12} style={{ color: 'var(--accent)' }} />}
                    </div>
                  ))}
                  <button className="btn btn-quiet btn-sm" style={{ justifySelf: 'start', marginTop: 4 }} onClick={() => setPicking('main')}>
                    See all {MODELS.length} models
                  </button>
                </div>
              </Group>
            </>
          )}

          {tab === 'persona' && (
            <>
              <h2>Persona & rules</h2>
              <p className="sub">The operating style is prepended to every system prompt. It changes how the agent writes, not what it can do.</p>

              <Group title="Operating style">
                <PersonaPickerInline />
                <div style={{ padding: '0 16px 16px' }}>
                  <textarea
                    className="textarea mono"
                    value={settings.customPrompt}
                    onChange={(e) => set('customPrompt', e.target.value)}
                    placeholder="Additional standing rules — e.g. “This repo uses pnpm and never var. Prefer server components. Never add a dependency without asking.”"
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                    <span className="mono" style={{ fontSize: 10.5, color: 'var(--muted-dim)' }}>
                      {settings.customPrompt.length} chars · sent with every request
                    </span>
                    <button
                      className="btn btn-quiet btn-sm"
                      style={{ marginLeft: 'auto' }}
                      onClick={() => {
                        const p = PERSONAS.find((x) => x.id === settings.persona)
                        patch({ customPrompt: p?.prompt ?? '' })
                        toast.show('Persona prompt loaded')
                      }}
                    >
                      Load persona prompt
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => toast.show('Saved to local settings')}>
                      Save
                    </button>
                  </div>
                </div>
              </Group>

              <Group title="Guardrails">
                <Row title="Never touch these paths" desc="Comma separated globs the agent cannot write to.">
                  <input className="input mono" style={{ width: 260 }} defaultValue=".env*, secrets/**, node_modules/**" />
                </Row>
                <Row title="Read-only mode" desc="Agent may read and plan but not write or execute. Useful for reviews.">
                  <Switch on={!settings.tools.write} onChange={(v) => patch({ tools: { ...settings.tools, write: !v, patch: !v, shell: !v } })} label="Read only" />
                </Row>
                <Row title="Explain every step" desc="Forces a one-sentence rationale before each tool call.">
                  <Switch on={settings.persona === 'mentor'} onChange={(v) => set('persona', v ? 'mentor' : 'surgeon')} label="Explain" />
                </Row>
              </Group>
            </>
          )}

          {tab === 'providers' && (
            <>
              <h2>Providers & keys</h2>
              <p className="sub">
                Keys are written to your OS keychain, never to a config file, and are redacted from tool output before it reaches
                any model.
              </p>

              <Group title="API keys">
                {PROVIDERS.map((p) => {
                  const key = settings.keys[p.id] ?? ''
                  const isLocal = p.kind === 'local'
                  return (
                    <div className="key-row" key={p.id}>
                      <span className="key-logo" style={{ color: p.color }}>
                        {p.glyph}
                      </span>
                      <div className="key-main">
                        <div className="nm">
                          {p.name}
                          {p.kind === 'local' && <span className="chip" style={{ height: 17, fontSize: 9.5 }}>no key needed</span>}
                          {p.kind === 'router' && <span className="chip" style={{ height: 17, fontSize: 9.5 }}>router</span>}
                        </div>
                        <div className="hint">{isLocal ? p.defaultBaseUrl : p.keyUrl ? `get a key at ${new URL(p.keyUrl).host}` : ''}</div>
                      </div>
                      {isLocal ? (
                        <span className="key-status local">local endpoint</span>
                      ) : (
                        <>
                          <span className={`key-status${key ? ' live' : ''}`}>{key ? 'connected' : 'no key'}</span>
                          <div className="key-input-wrap">
                            <input
                              className="input mono"
                              type={shown[p.id] ? 'text' : 'password'}
                              placeholder="sk-…"
                              value={key}
                              onChange={(e) => set('keys', { ...settings.keys, [p.id]: e.target.value })}
                              style={{ flex: 1, minWidth: 96 }}
                            />
                            <button className="icon-btn" onClick={() => setShown({ ...shown, [p.id]: !shown[p.id] })} aria-label="Toggle visibility">
                              {shown[p.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </Group>

              <Group title="Endpoints">
                <Row title="Offline / local only" desc="Block every cloud provider. Only Ollama and LM Studio will be used, and tools that need network are disabled.">
                  <Switch on={settings.localOnly} onChange={(v) => set('localOnly', v)} label="Local only" />
                </Row>
                <Row title="Custom base URLs" desc="Point a provider at a proxy, gateway or self-hosted inference server.">
                  <button className="btn btn-ghost btn-sm" onClick={() => toast.show('Base URLs apply per provider below')}>
                    Configure
                  </button>
                </Row>
                <div style={{ padding: '4px 16px 16px', display: 'grid', gap: 8 }}>
                  {PROVIDERS.filter((p) => p.defaultBaseUrl).slice(0, 4).map((p) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="mono" style={{ fontSize: 10.5, color: 'var(--muted-dim)', width: 82 }}>
                        {p.name}
                      </span>
                      <input
                        className="input mono"
                        style={{ flex: 1 }}
                        placeholder={p.defaultBaseUrl}
                        value={settings.baseUrls[p.id] ?? ''}
                        onChange={(e) => set('baseUrls', { ...settings.baseUrls, [p.id]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              </Group>

              <Group title="Security">
                <Row title="Store keys in the OS keychain" desc="macOS Keychain, Windows Credential Manager, libsecret on Linux.">
                  <span className="chip chip-accent">
                    <Fingerprint size={11} /> always on
                  </span>
                </Row>
                <Row title="Redact secrets from tool output" desc="Matches env-style keys and tokens and replaces them before the model sees anything.">
                  <Switch on={settings.plugins['secrets-vault'] ?? true} onChange={(v) => patch({ plugins: { ...settings.plugins, 'secrets-vault': v } })} label="Redact" />
                </Row>
              </Group>
            </>
          )}

          {tab === 'tools' && (
            <>
              <h2>Tool permissions</h2>
              <p className="sub">Each tool is individually gated. A disabled tool is not described to the model, so it will not try to call it.</p>

              {['Filesystem', 'Search', 'Runtime', 'Context', 'VCS', 'Planning'].map((group) => (
                <Group key={group} title={group}>
                  {TOOL_CATALOG.filter((t) => t.group === group).map((t) => (
                    <div className="tool-row-st" key={t.id}>
                      <span className="name">{t.name}</span>
                      <span className="desc">{t.desc}</span>
                      <span className={`risk ${t.risk}`}>{t.risk}</span>
                      <Switch on={settings.tools[t.id]} onChange={(v) => patch({ tools: { ...settings.tools, [t.id]: v } })} label={t.name} />
                    </div>
                  ))}
                </Group>
              ))}

              <Group title="Shell commands">
                <Row title="Command allowlist" desc="Commands outside this list require approval even in full-send mode.">
                  <input className="input mono" style={{ width: 260 }} defaultValue="pnpm,npm,git,ls,cat,rg,tsc" />
                </Row>
                <Row title="Network access for tools" desc="fetch_url and MCP servers may reach the internet.">
                  <Switch on={settings.tools.fetch} onChange={(v) => patch({ tools: { ...settings.tools, fetch: v } })} label="Network" />
                </Row>
              </Group>
            </>
          )}

          {tab === 'plugins' && (
            <>
              <h2>Plugins</h2>
              <p className="sub">
                {activePlugins} of {PLUGINS.length} enabled. Plugins hook the agent loop; each declares the permissions it needs and
                you can revoke them individually.
              </p>

              <div className="model-filters">
                {PLUGIN_CATEGORIES.map((c) => (
                  <button key={c.id} className={plugCat === c.id ? 'on' : ''} onClick={() => setPlugCat(c.id)}>
                    {c.name}
                  </button>
                ))}
              </div>

              <div className="plugin-grid" style={{ padding: 0 }}>
                {plugins.map((p) => {
                  const on = Boolean(settings.plugins[p.id])
                  return (
                    <div className={`plugin-card${on ? ' on' : ''}`} key={p.id}>
                      <div className="ph">
                        <span className="pglyph">
                          <PluginIcon category={p.category} size={14} />
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <b>
                            {p.name}
                            {p.verified && <Check size={11} style={{ color: 'var(--accent)' }} />}
                          </b>
                          <span className="by">
                            {p.author} · {p.installs} installs
                          </span>
                        </div>
                        <Switch on={on} onChange={(v) => patch({ plugins: { ...settings.plugins, [p.id]: v } })} label={p.name} />
                      </div>
                      <p>{p.desc}</p>
                      <div className="pf">
                        {p.perms.map((perm) => (
                          <span className="perm" key={perm}>
                            {perm}
                          </span>
                        ))}
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted-dim)' }}>{p.category}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <Group title="Write your own">
                <div style={{ padding: 16 }}>
                  <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 10, lineHeight: 1.6 }}>
                    A plugin is a module that registers tools or hooks. Save this as{' '}
                    <span className="mono" style={{ color: 'var(--accent)' }}>
                      .slurp/plugins/pr-lint.ts
                    </span>{' '}
                    and it appears in this list on reload.
                  </p>
                  <pre
                    className="mono"
                    style={{
                      margin: 0,
                      padding: 14,
                      borderRadius: 10,
                      border: '1px solid var(--line)',
                      background: 'rgba(0,0,0,.35)',
                      fontSize: 11.5,
                      lineHeight: 1.7,
                      overflowX: 'auto',
                      color: 'var(--text-soft)',
                    }}
                  >{`export default definePlugin({
  name: 'pr-lint',
  permissions: ['git', 'net'],
  hooks: {
    async onRunEnd(ctx) {
      const diff = await ctx.git.diff()
      if (/console\\.log/.test(diff)) {
        ctx.warn('console.log left in the diff')
      }
    },
  },
})`}</pre>
                </div>
              </Group>
            </>
          )}

          {tab === 'appearance' && (
            <>
              <h2>Appearance</h2>
              <p className="sub">The agent writes the code. This is the part you look at for eight hours, so make it yours.</p>

              <Group title="Theme">
                <Row title="Accent" desc={`${ACCENTS[settings.accent]?.name}. Recolors highlights, diffs, meters and the caret.`}>
                  <AccentPicker />
                </Row>
                <Row title="Density" desc="Comfortable for long sessions, compact for small screens.">
                  <Seg
                    value={settings.density}
                    onChange={(v) => set('density', v)}
                    options={[
                      { id: 'comfortable', label: 'Comfortable' },
                      { id: 'compact', label: 'Compact' },
                    ]}
                  />
                </Row>
                <Row title="Animations" desc="Streaming transitions, reveal-on-scroll, pulse indicators.">
                  <Switch on={settings.animations} onChange={(v) => set('animations', v)} label="Animations" />
                </Row>
                <Row title="Reduce motion" desc="Honour the system preference and disable all transforms.">
                  <Switch on={settings.reduceMotion} onChange={(v) => set('reduceMotion', v)} label="Reduce motion" />
                </Row>
              </Group>

              <Group title="Type">
                <Row title="Interface size" desc="Base font size for chat, panels and settings.">
                  <Range value={settings.uiFont} min={12} max={18} step={0.5} onChange={(v) => set('uiFont', v)} format={(v) => `${v}px`} />
                </Row>
                <Row title="Code size" desc="Applies to diffs, terminal output and inline code.">
                  <Range value={settings.monoFont} min={10} max={16} step={0.5} onChange={(v) => set('monoFont', v)} format={(v) => `${v}px`} />
                </Row>
                <Row title="Compact session rail" desc="Narrower left rail, icons only.">
                  <Switch on={settings.compactRail} onChange={(v) => set('compactRail', v)} label="Compact rail" />
                </Row>
              </Group>

              <Group title="Preview">
                <div style={{ padding: 16 }}>
                  <div className="card" style={{ padding: 14 }}>
                    <div className="diff-card" style={{ marginBottom: 10 }}>
                      <div className="diff-head">
                        <span className="file">example.ts</span>
                        <span className="stat">
                          <span className="add">+2</span>
                          <span className="del">−1</span>
                        </span>
                      </div>
                      <div className="diff-body" style={{ maxHeight: 'none' }}>
                        <div className="diff-line ctx">
                          <span className="sign"> </span>const session = await get(token)
                        </div>
                        <div className="diff-line del">
                          <span className="sign">−</span>return session
                        </div>
                        <div className="diff-line add">
                          <span className="sign">+</span>if (!session?.expiresAt) return null
                        </div>
                        <div className="diff-line add">
                          <span className="sign">+</span>return session
                        </div>
                      </div>
                    </div>
                    <div className="tool-row">
                      <span className="tick">
                        <Check size={12} strokeWidth={3} />
                      </span>
                      <span className="tname">apply_patch</span>
                      <span className="target">src/server/auth/session.ts</span>
                      <span className="res">expiry enforced</span>
                    </div>
                  </div>
                </div>
              </Group>
            </>
          )}

          {tab === 'data' && (
            <>
              <h2>Privacy & data</h2>
              <p className="sub">Everything SLURP knows lives on this machine unless you explicitly send it somewhere.</p>

              <Group title="Telemetry">
                <Row title="Crash reports and usage analytics" desc="Off by default and off in every build. Enabling sends anonymous counters, never code.">
                  <Switch on={settings.telemetry} onChange={(v) => set('telemetry', v)} label="Telemetry" />
                </Row>
                <Row title="Auto update" desc="Check for signed releases on launch. No background pings.">
                  <Switch on={settings.autoUpdate} onChange={(v) => set('autoUpdate', v)} label="Auto update" />
                </Row>
              </Group>

              <Group title="Local data">
                <Row title="Session history" desc="Stored as plain JSONL in ~/.slurp/sessions. Delete whenever you want.">
                  <button className="btn btn-ghost btn-sm" onClick={() => toast.show('Session history exported to ~/Downloads')}>
                    <Download size={13} /> Export
                  </button>
                </Row>
                <Row title="Semantic index" desc="Built on-device with a local embedding model. Rebuild after big refactors.">
                  <button className="btn btn-ghost btn-sm" onClick={() => toast.show('Rebuilding index — 418 files queued')}>
                    <RotateCcw size={13} /> Rebuild
                  </button>
                </Row>
                <Row title="Clear all local data" desc="Removes sessions, checkpoints and cached repo indexes. Keys stay in the keychain.">
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--red)' }}
                    onClick={() => {
                      reset()
                      toast.show('Local data cleared')
                    }}
                  >
                    <Trash2 size={13} /> Clear
                  </button>
                </Row>
              </Group>

              <Group title="About">
                <Row title="Version" desc="Open beta, signed and notarised. Channel: stable.">
                  <span className="mono" style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                    0.9.5 (build 2026.10.25)
                  </span>
                </Row>
                <Row title="Reset all settings" desc="Back to factory defaults, including model choice, persona and tools.">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      reset()
                      toast.show('Settings reset to defaults')
                    }}
                  >
                    Reset everything
                  </button>
                </Row>
                <Row title="Default config" desc={`Model ${DEFAULT_SETTINGS.modelId}, autonomy ${DEFAULT_SETTINGS.autonomy}, planner on.`}>
                  <Link to="/download" className="btn btn-quiet btn-sm">
                    Changelog
                  </Link>
                </Row>
              </Group>

              <div className="note ok" style={{ marginTop: 6 }}>
                <Shield />
                <span>
                  No account is required to use SLURP. There is no server that receives your code by default, and the app works
                  fully offline with a local model.
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {picking && <ModelPicker mode={picking} onClose={() => setPicking(null)} />}
      {toast.node}
    </div>
  )
}
