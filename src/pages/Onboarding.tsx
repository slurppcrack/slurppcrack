import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Eye, EyeOff, KeyRound, Sparkles, Zap } from 'lucide-react'
import { Mark } from '../components/Brand'
import { AccentPicker } from '../components/Pickers'
import { Range, Switch } from '../components/ui'
import { AutonomyIcon, PersonaIcon, PluginIcon } from '../components/glyphs'
import { MODELS, PROVIDERS, fmtContext, fmtPrice, providerById, type ProviderId } from '../lib/models'
import { PLUGINS } from '../lib/plugins'
import { ACCENTS, PERSONAS, useSettings } from '../lib/store'

const STEPS = ['Welcome', 'Provider', 'Models', 'Persona', 'Autonomy', 'Look', 'Plugins', 'Ready']

export default function Onboarding() {
  const { settings, set, patch } = useSettings()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [provider, setProvider] = useState<ProviderId>('anthropic')
  const [showKey, setShowKey] = useState(false)

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1))
  const back = () => setStep((s) => Math.max(s - 1, 0))
  const finish = () => {
    patch({ onboarded: true })
    navigate('/app')
  }

  const prov = providerById(provider)
  const key = settings.keys[provider] ?? ''
  const keyReady = prov.kind === 'local' || Boolean(key)

  return (
    <div className="ob">
      <div className="site-bg">
        <div className="grid-lines" />
      </div>
      <div className="ob-top">
        <Link to="/" className="brand" style={{ fontSize: 15 }}>
          <Mark />
          <span>slurp</span>
        </Link>
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--muted-dim)', letterSpacing: '.08em' }}>
          FIRST-RUN SETUP
        </span>
        <div className="ob-progress">
          {STEPS.map((s, i) => (
            <i key={s} className={i <= step ? 'on' : ''} />
          ))}
        </div>
      </div>

      <div className="ob-main">
        <div className="ob-card" key={step}>
          <div className="ob-kicker">
            step {step + 1} of {STEPS.length} · {STEPS[step]}
          </div>

          {step === 0 && (
            <>
              <h1>
                Let's make this
                <br />
                <span style={{ color: 'var(--accent)' }}>yours in ninety seconds.</span>
              </h1>
              <p className="lede">
                Six quick choices and the harness is tuned to how you work: which models, how much autonomy, what it may touch.
                Everything is editable later, and nothing leaves this machine unless you paste a key and choose a cloud model.
              </p>
              <div style={{ marginTop: 26, maxWidth: 380 }}>
                <div className="mono" style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-dim)', marginBottom: 8 }}>
                  What should the agent call you?
                </div>
                <input
                  className="input"
                  style={{ width: '100%', height: 40 }}
                  value={settings.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="your name"
                />
              </div>
              <div className="ob-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 22 }}>
                {[
                  ['15 models', 'Claude, GPT-5, Gemini, DeepSeek, Kimi, Qwen and local'],
                  ['Local-first', 'keys in your keychain, zero telemetry'],
                  ['12 plugins', 'git guard, test watcher, MCP bridge and more'],
                ].map(([t, d]) => (
                  <div className="pick" key={t} style={{ pointerEvents: 'none' }}>
                    <b>{t}</b>
                    <span>{d}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h1>Where should the intelligence come from?</h1>
              <p className="lede">
                Pick a cloud provider and paste a key, or go fully local. You can add more providers whenever you want — this just
                decides what we verify first.
              </p>
              <div className="ob-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginTop: 24 }}>
                {PROVIDERS.filter((p) => ['anthropic', 'openai', 'google', 'deepseek', 'moonshot', 'qwen', 'openrouter', 'ollama'].includes(p.id)).map((p) => (
                  <button key={p.id} className={`pick${provider === p.id ? ' on' : ''}`} onClick={() => setProvider(p.id)}>
                    <span className="top">
                      <span className="lg" style={{ color: p.color }}>
                        {p.glyph}
                      </span>
                      <b>{p.name}</b>
                      {p.kind === 'local' && <span className="chip" style={{ height: 18, fontSize: 9.5, marginLeft: 'auto' }}>free</span>}
                      {provider === p.id && <Check size={14} style={{ marginLeft: 'auto', color: 'var(--accent)' }} />}
                    </span>
                    <span>
                      {p.kind === 'local'
                        ? 'Runs on your machine. No key, no bill, no code leaving the box.'
                        : p.kind === 'router'
                          ? 'One key for hundreds of models including open weights.'
                          : 'Bring your own key. Billed by the provider at list price.'}
                    </span>
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 22, maxWidth: 560 }}>
                {prov.kind === 'local' ? (
                  <div className="note ok">
                    <Sparkles />
                    <span>
                      Local selected. Make sure Ollama is running (<span className="mono">ollama serve</span>) and you have pulled a
                      coder model, e.g. <span className="mono">ollama pull qwen2.5-coder:32b</span>.
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="mono" style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-dim)', marginBottom: 8 }}>
                      {prov.name} API key
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <input
                          className="input mono"
                          style={{ width: '100%', height: 40, paddingRight: 40 }}
                          type={showKey ? 'text' : 'password'}
                          value={key}
                          onChange={(e) => set('keys', { ...settings.keys, [provider]: e.target.value })}
                          placeholder="paste your key — stored in the OS keychain"
                        />
                        <button
                          className="icon-btn"
                          style={{ position: 'absolute', right: 5, top: 5 }}
                          onClick={() => setShowKey((v) => !v)}
                          aria-label="toggle"
                        >
                          {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      <span className={`chip${keyReady ? ' chip-accent' : ''}`} style={{ height: 40, paddingInline: 12 }}>
                        {keyReady ? <Check size={12} /> : <KeyRound size={12} />}
                        {keyReady ? 'looks good' : 'optional'}
                      </span>
                    </div>
                    <p style={{ fontSize: 11.5, color: 'var(--muted-dim)', marginTop: 8 }}>
                      You can skip this and use demo mode. Keys never leave this device.
                    </p>
                  </>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1>Two models. One brain, one pair of hands.</h1>
              <p className="lede">
                The main model does the thinking and the writing. The subagent handles cheap grunt work — searching, summarising,
                reading files you probably will not need.
              </p>

              <div style={{ marginTop: 24 }}>
                <div className="mono" style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-dim)', marginBottom: 10 }}>
                  main model
                </div>
                <div className="ob-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginTop: 0 }}>
                  {MODELS.filter((m) => ['anthropic', 'openai', 'google', 'deepseek', 'moonshot', 'qwen'].includes(m.provider)).slice(0, 6).map((m) => (
                    <button
                      key={m.id}
                      className={`pick${settings.modelId === m.id ? ' on' : ''}`}
                      onClick={() => patch({ modelId: m.id })}
                    >
                      <span className="top">
                        <span className="lg" style={{ color: providerById(m.provider).color }}>
                          {providerById(m.provider).glyph}
                        </span>
                        <b>{m.name}</b>
                        {settings.modelId === m.id && <Check size={14} style={{ marginLeft: 'auto', color: 'var(--accent)' }} />}
                      </span>
                      <span>
                        {fmtContext(m.context)} ctx · {fmtPrice(m)} · {m.tags[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 22 }}>
                <div className="mono" style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-dim)', marginBottom: 10 }}>
                  subagent model — cheap and fast
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['gpt-5-mini', 'gemini-2-5-flash', 'deepseek-v3-2', 'qwen3-coder', 'qwen2-5-coder-32b-local'].map((id) => {
                    const m = MODELS.find((x) => x.id === id)!
                    const on = settings.subagentModelId === id
                    return (
                      <button
                        key={id}
                        className={`chip${on ? ' chip-accent' : ''}`}
                        style={{ height: 32, paddingInline: 12 }}
                        onClick={() => patch({ subagentModelId: id })}
                      >
                        {on && <Check size={11} />} {m.short} · {fmtPrice(m)}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <div className="st-row" style={{ padding: 0, border: 0 }}>
                  <div className="info">
                    <b>Planner first</b>
                    <span>Write a checklist before touching a file. Costs a few hundred tokens, saves whole runs.</span>
                  </div>
                  <div className="control">
                    <Range value={settings.temperature} min={0} max={1} step={0.05} onChange={(v) => set('temperature', v)} format={(v) => `temp ${v.toFixed(2)}`} />
                    <Switch on={settings.plannerEnabled} onChange={(v) => set('plannerEnabled', v)} label="Planner" />
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1>How should it behave?</h1>
              <p className="lede">
                Personas change the operating style, not the capabilities. Pick the one that matches how you like to review work,
                then add any standing rules.
              </p>
              <div className="ob-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {PERSONAS.filter((p) => p.id !== 'custom').map((p) => (
                  <button
                    key={p.id}
                    className={`pick${settings.persona === p.id ? ' on' : ''}`}
                    onClick={() => patch({ persona: p.id, customPrompt: p.prompt })}
                  >
                    <span className="top">
                      <span className="lg">
                        <PersonaIcon id={p.id} size={14} />
                      </span>
                      <b>{p.name}</b>
                      {settings.persona === p.id && <Check size={14} style={{ marginLeft: 'auto', color: 'var(--accent)' }} />}
                    </span>
                    <span>{p.desc}</span>
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 20 }}>
                <div className="mono" style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-dim)', marginBottom: 8 }}>
                  standing rules (optional)
                </div>
                <textarea
                  className="textarea mono"
                  style={{ minHeight: 80 }}
                  value={settings.customPrompt}
                  onChange={(e) => set('customPrompt', e.target.value)}
                  placeholder="e.g. This repo uses pnpm. Never add a dependency without asking. Prefer server components."
                />
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h1>How much rope?</h1>
              <p className="lede">
                Autonomy is the single most important setting. Start cautious — you can always loosen it mid-session.
              </p>
              <div className="ob-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 24 }}>
                {[
                  ['ask', 'Ask before writes', 'You approve every patch. Slowest, safest, best for production repos.'],
                  ['auto', 'Auto + checkpoints', 'Applies patches, snapshots first, one key reverts everything.'],
                  ['yolo', 'Full send', 'No gates. Runs tests, commits, keeps going until done. For spikes.'],
                ].map(([id, title, desc]) => (
                  <button
                    key={id}
                    className={`pick${settings.autonomy === id ? ' on' : ''}`}
                    onClick={() => set('autonomy', id as any)}
                  >
                    <span className="top">
                      <span className="lg">
                        <AutonomyIcon id={id as string} size={14} />
                      </span>
                      <b>{title}</b>
                    </span>
                    <span>{desc}</span>
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 24, display: 'grid', gap: 8 }}>
                {[
                  ['checkpoints', 'Checkpoint before every write', settings.checkpoints],
                  ['autoTest', 'Run tests after edits and fix failures', settings.autoTest],
                  ['plannerEnabled', 'Plan before acting', settings.plannerEnabled],
                  ['autoFormat', 'Format touched files', settings.autoFormat],
                ].map(([k, label, val]) => (
                  <div className="st-row" key={k as string} style={{ border: '1px solid var(--line)', borderRadius: 10, background: 'rgba(255,255,255,.02)' }}>
                    <div className="info">
                      <b>{label}</b>
                    </div>
                    <div className="control">
                      <Switch on={Boolean(val)} onChange={(v) => set(k as any, v as any)} label={label as string} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h1>Make it look like your machine.</h1>
              <p className="lede">Six accents, two densities, independent type sizes. Change it any time — nothing here affects the agent.</p>

              <div style={{ marginTop: 26, display: 'grid', gap: 22, maxWidth: 520 }}>
                <div>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-dim)', marginBottom: 10 }}>
                    accent — {ACCENTS[settings.accent]?.name}
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {Object.entries(ACCENTS).map(([id, a]) => (
                      <button
                        key={id}
                        onClick={() => set('accent', id)}
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 11,
                          background: a.hex,
                          border: settings.accent === id ? '2px solid #fff' : '1px solid rgba(255,255,255,.16)',
                          boxShadow: settings.accent === id ? `0 0 24px -4px ${a.hex}` : 'none',
                          transition: 'all .2s',
                        }}
                        aria-label={a.name}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-dim)', marginBottom: 10 }}>
                    density
                  </div>
                  <div className="seg">
                    <button className={settings.density === 'comfortable' ? 'on' : ''} onClick={() => set('density', 'comfortable')}>
                      Comfortable
                    </button>
                    <button className={settings.density === 'compact' ? 'on' : ''} onClick={() => set('density', 'compact')}>
                      Compact
                    </button>
                  </div>
                </div>

                <div>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-dim)', marginBottom: 10 }}>
                    interface size
                  </div>
                  <Range value={settings.uiFont} min={12} max={18} step={0.5} onChange={(v) => set('uiFont', v)} format={(v) => `${v}px`} />
                </div>

                <div className="card" style={{ padding: 14 }}>
                  <div className="tool-row" style={{ marginBottom: 8 }}>
                    <span className="tick">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    <span className="tname">apply_patch</span>
                    <span className="target">middleware.ts</span>
                    <span className="res">+16 −6</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: 'var(--text-soft)', lineHeight: 1.6 }}>
                    This is roughly how a run will look. Diffs on the left of your eye, plan above, cost in the corner.
                  </p>
                </div>
              </div>
            </>
          )}

          {step === 6 && (
            <>
              <h1>Which plugins earn a spot?</h1>
              <p className="lede">All of these ship in the box but stay off until you enable them. Each one declares the permissions it needs.</p>
              <div className="ob-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginTop: 22, maxHeight: 340, overflowY: 'auto', paddingRight: 4 }}>
                {PLUGINS.slice(0, 8).map((p) => {
                  const on = Boolean(settings.plugins[p.id])
                  return (
                    <button
                      key={p.id}
                      className={`pick${on ? ' on' : ''}`}
                      onClick={() => patch({ plugins: { ...settings.plugins, [p.id]: !on } })}
                      style={{ textAlign: 'left' }}
                    >
                      <span className="top">
                        <span className="lg">
                          <PluginIcon category={p.category} size={14} />
                        </span>
                        <b>{p.name}</b>
                        <span style={{ marginLeft: 'auto', display: 'grid', placeItems: 'center', width: 16, height: 16, borderRadius: 5, border: '1px solid var(--line)', background: on ? 'var(--accent)' : 'transparent', color: '#0a0f06' }}>
                          {on && <Check size={10} strokeWidth={4} />}
                        </span>
                      </span>
                      <span>{p.tagline}</span>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {step === 7 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <span
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    display: 'grid',
                    placeItems: 'center',
                    background: 'rgba(198,255,74,.12)',
                    border: '1px solid rgba(198,255,74,.3)',
                    color: 'var(--accent)',
                  }}
                >
                  <CheckCircle2 size={22} />
                </span>
                <div>
                  <h1 style={{ fontSize: 30 }}>You're set, {settings.name}.</h1>
                  <p style={{ color: 'var(--muted)', fontSize: 13.5, marginTop: 4 }}>Here is what we configured. Nothing here is permanent.</p>
                </div>
              </div>

              <div className="card" style={{ padding: 18, display: 'grid', gap: 0 }}>
                {[
                  ['Main model', `${MODELS.find((m) => m.id === settings.modelId)?.name} — ${fmtPrice(MODELS.find((m) => m.id === settings.modelId)!)}`],
                  ['Subagent', MODELS.find((m) => m.id === settings.subagentModelId)?.short ?? '—'],
                  ['Persona', PERSONAS.find((p) => p.id === settings.persona)?.name ?? 'Custom'],
                  ['Autonomy', settings.autonomy === 'ask' ? 'ask before writes' : settings.autonomy === 'auto' ? 'auto with checkpoints' : 'full send'],
                  ['Tests', settings.autoTest ? 'run after every edit' : 'manual only'],
                  ['Plugins', `${Object.values(settings.plugins).filter(Boolean).length} enabled`],
                  ['Look', `${ACCENTS[settings.accent]?.name} · ${settings.density} · ${settings.uiFont}px`],
                  ['Telemetry', 'off — always'],
                ].map(([k, v]) => (
                  <div className="kv" key={k} style={{ padding: '9px 0' }}>
                    <span>{k}</span>
                    <b style={{ fontSize: 11.5 }}>{v}</b>
                  </div>
                ))}
              </div>

              <div className="note ok" style={{ marginTop: 16 }}>
                <Zap />
                <span>
                  Tip: press <span className="kbd">⌘K</span> in the harness to switch models, personas or plugins without leaving the
                  keyboard.
                </span>
              </div>
            </>
          )}

          <div className="ob-foot">
            <button className="btn btn-quiet btn-sm" onClick={finish}>
              Skip setup
            </button>
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--muted-dim)' }}>
              saved locally · editable later
            </span>
            <div className="left">
              {step > 0 && (
                <button className="btn btn-ghost" onClick={back}>
                  <ArrowLeft size={14} /> Back
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button className="btn btn-primary" onClick={next}>
                  {step === 1 && !keyReady ? 'Continue without a key' : 'Continue'} <ArrowRight size={14} />
                </button>
              ) : (
                <button className="btn btn-primary btn-lg" onClick={finish}>
                  Open the harness <ArrowRight size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
