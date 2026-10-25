import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Cpu,
  Download,
  FileCode2,
  GitBranch,
  Globe2,
  Layers,
  ListChecks,
  Lock,
  Menu,
  Plug,
  Play,
  Plus,
  Sliders,
  Sparkles,
  SquareTerminal,
  Wand2,
  Zap,
  X,
} from 'lucide-react'
import { Brand, Mark } from '../components/Brand'
import { CopyButton, Reveal } from '../components/ui'
import { APP } from '../lib/app-info'
import { PluginIcon } from '../components/glyphs'
import { MODELS, PROVIDERS, fmtContext, fmtPrice, providerById, type ProviderId } from '../lib/models'
import { PLUGINS } from '../lib/plugins'

function useScrollY() {
  const [y, setY] = useState(0)
  useEffect(() => {
    const onScroll = () => setY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return y
}

const NAV = [
  { href: '#features', label: 'Product' },
  { href: '#models', label: 'Models' },
  { href: '#tuning', label: 'Tuning' },
  { href: '#plugins', label: 'Plugins' },
  { href: '#download', label: 'Download' },
]

function Nav() {
  const y = useScrollY()
  const [open, setOpen] = useState(false)
  return (
    <>
      <header className={`nav${y > 12 ? ' scrolled' : ''}`}>
        <div className="wrap nav-inner">
          <Brand />
          <nav className="nav-links">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="nav-link">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="nav-right">
            <Link to="/app" className="btn btn-quiet btn-sm hide-sm" style={{ height: 34 }}>
              Open web demo
            </Link>
            <Link to="/download" className="btn btn-primary btn-sm" style={{ height: 34 }}>
              <Download size={14} /> Download
            </Link>
            <button className="nav-burger" onClick={() => setOpen((v) => !v)} aria-label="Menu">
              {open ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>
      </header>
      {open && (
        <div className="mobile-menu">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} onClick={() => setOpen(false)}>
              {n.label}
            </a>
          ))}
          <Link to="/app" onClick={() => setOpen(false)}>
            Open web demo
          </Link>
        </div>
      )}
    </>
  )
}

function HeroWindow() {
  return (
    <div style={{ position: 'relative' }}>
      <div className="window">
        <div className="window-bar">
          <div className="dots">
            <i />
            <i />
            <i />
          </div>
          <div className="window-path">
            <GitBranch size={11} /> acme-web <span style={{ opacity: 0.4 }}>/</span> main
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="live-pill">session live</span>
          </div>
        </div>
        <div className="window-body">
          <div className="mock-rail">
            <div className="k">Session</div>
            <div className="row active">
              <Wand2 /> Harden the auth flow
            </div>
            <div className="row">
              <SquareTerminal /> Fix flaky checkout test
            </div>
            <div className="row">
              <Layers /> Add usage chart
            </div>
            <div className="k" style={{ marginTop: 8 }}>
              Pinned
            </div>
            <div className="row">
              <FileCode2 /> middleware.ts
            </div>
            <div className="row">
              <Globe2 /> docs.stripe.com
            </div>
          </div>
          <div className="mock-main">
            <div className="mock-head">
              <span className="mock-model">
                <i /> Claude Sonnet 4.5 <ChevronDown size={10} />
              </span>
              <span className="chip" style={{ height: 22, fontSize: 10.5 }}>
                keep going
              </span>
              <span className="mono" style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--muted-dim)' }}>
                41.2k / 200k
              </span>
            </div>
            <div className="mock-msg user">harden auth before we ship friday — sessions never expire</div>
            <div className="mock-tool">
              <span className="ok">✓</span> grep <span style={{ color: 'var(--muted-dim)' }}>session|cookie</span>
              <span style={{ marginLeft: 'auto', color: 'var(--muted-dim)' }}>7 hits</span>
            </div>
            <div className="mock-diff">
              <div className="head">
                <FileCode2 size={10} /> src/server/auth/session.ts
                <span style={{ marginLeft: 'auto', color: 'var(--accent)' }}>+14</span>
                <span style={{ color: 'var(--red)' }}>−3</span>
              </div>
              <div className="ln ctx">
                <span className="sign" /> if (!token) return null
              </div>
              <div className="ln add">
                <span className="sign">+</span> if (session.expiresAt &lt; Date.now()) {'{'}
              </div>
              <div className="ln add">
                <span className="sign">+</span> delete it, return null
              </div>
              <div className="ln del">
                <span className="sign">−</span> return db.session.findUnique({'{'}
              </div>
              <div className="ln add">
                <span className="sign">+</span> cookies().set(COOKIE, token, {'{'}
              </div>
              <div className="ln add">
                <span className="sign">+</span> httpOnly, sameSite: 'lax', secure
              </div>
              <div className="ln ctx">
                <span className="sign" /> {'}'})
              </div>
            </div>
            <div className="mock-tool">
              <span className="ok">✓</span> pnpm test <span style={{ color: 'var(--muted-dim)' }}>13 passed</span>
              <span style={{ marginLeft: 'auto', color: 'var(--muted-dim)' }}>1.84s</span>
            </div>
            <div className="mock-composer">
              <span className="caret" /> ask for a change, or type / for commands
              <span className="mock-send">
                <ArrowRight size={12} />
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="float-chip a">
        <span className="ico" style={{ background: '#4d6bfe', color: '#fff' }}>
          ⌁
        </span>
        DeepSeek V3.2 <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>$0.28/M</span>
      </div>
      <div className="float-chip b">
        <span className="ico" style={{ background: 'rgba(198,255,74,.16)', color: 'var(--accent)' }}>
          ⛨
        </span>
        Checkpoint saved
      </div>
      <div className="float-chip c">
        <span className="ico" style={{ background: 'rgba(182,155,255,.16)', color: 'var(--violet)' }}>
          ⇌
        </span>
        MCP · postgres
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section className="hero">
      <div className="wrap">
        <div className="hero-grid">
          <div>
            <div className="hero-badge">
              <b>v0.9.4</b>
              <span className="long">— bring-your-own-model agent harness</span>
              <span className="pill">open beta</span>
            </div>
            <h1>
              Talk to your repo.
              <br />
              <span className="grad">Ship the thing.</span>
            </h1>
            <p className="hero-lede">
              SLURP is a local-first coding environment for the way you actually work now. Pick any model — frontier or a 32B
              on your own laptop — describe what you want, and watch it plan, edit, run tests and show you every diff.
            </p>
            <div className="hero-actions">
              <a href={APP.blob} target="_blank" rel="noreferrer" className="btn btn-primary btn-lg">
                <Download size={16} /> Download the app · {APP.size}
              </a>
              <Link to="/app" className="btn btn-ghost btn-lg">
                Try the web demo <ArrowRight size={15} />
              </Link>
            </div>
            <div className="hero-meta">
              <span>
                <Check size={13} /> macOS · Windows · Linux
              </span>
              <span>
                <Check size={13} /> 15 models, 11 providers
              </span>
              <span>
                <Check size={13} /> No telemetry, ever
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <HeroWindow />
          </div>
        </div>

        <div className="stat-strip">
          {[
            ['15', 'models in the box'],
            ['11', 'providers wired in'],
            ['12', 'first-party plugins'],
            ['0', 'bytes of telemetry'],
          ].map(([b, s]) => (
            <div key={s}>
              <b>{b}</b>
              <span>{s}</span>
            </div>
          ))}
        </div>

        <div className="marquee">
          <div className="marquee-track">
            {[...PROVIDERS, ...PROVIDERS].map((p, i) => (
              <span className="marquee-item" key={`${p.id}-${i}`}>
                <i style={{ background: p.color }} /> {p.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Bento() {
  return (
    <section className="section" id="features">
      <div className="wrap">
        <Reveal>
          <div className="section-head">
            <span className="eyebrow">The difference</span>
            <h2>
              Not a chat box with a file tree.
              <br />
              <span style={{ color: 'var(--muted)' }}>An actual harness.</span>
            </h2>
            <p>
              Most AI editors bolt a chat onto a text field. SLURP is built around the loop that ships software: explore,
              plan, patch, verify, and leave a trail you can audit.
            </p>
          </div>
        </Reveal>

        <div className="bento">
          <Reveal className="b-4">
            <div className="bento-card" style={{ height: '100%' }}>
              <div className="glyph">
                <Sliders />
              </div>
              <h3>Every knob, before you write a line</h3>
              <p>
                A real setup wizard on first launch: pick your provider, paste a key (stored in the OS keychain), choose a
                main model and a cheap subagent model, set autonomy, temperature, context budget and step ceiling.
              </p>
              <div className="visual-slot" style={{ display: 'grid', gap: 11 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', marginBottom: 6 }}>
                    <span>autonomy</span>
                    <span style={{ color: 'var(--accent)' }}>ask before writes</span>
                  </div>
                  <div className="meter">
                    <i style={{ width: '62%' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', marginBottom: 6 }}>
                    <span>context budget</span>
                    <span style={{ color: 'var(--accent)' }}>120k tokens</span>
                  </div>
                  <div className="meter">
                    <i style={{ width: '60%' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className="chip chip-accent" style={{ height: 21, fontSize: 10.5 }}>
                    The Surgeon
                  </span>
                  <span className="chip" style={{ height: 21, fontSize: 10.5 }}>
                    planner on
                  </span>
                  <span className="chip" style={{ height: 21, fontSize: 10.5 }}>
                    test watcher
                  </span>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal className="b-2" delay={60}>
            <div className="bento-card" style={{ height: '100%' }}>
              <div className="glyph">
                <ListChecks />
              </div>
              <h3>Plans you can read</h3>
              <p>The agent writes its plan as a live checklist before touching a file. You see progress, not a spinner.</p>
              <div className="visual-slot">
                <div className="plan-row done">
                  <span className="box">✓</span> Map the auth surface
                </div>
                <div className="plan-row done">
                  <span className="box">✓</span> Harden session cookie
                </div>
                <div className="plan-row doing">
                  <span className="box" /> Gate protected routes
                </div>
                <div className="plan-row">
                  <span className="box" /> Run the suite
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal className="b-2" delay={80}>
            <div className="bento-card" style={{ height: '100%' }}>
              <div className="glyph">
                <Zap />
              </div>
              <h3>Model per task</h3>
              <p>
                Sonnet for the surgery, DeepSeek or Qwen for the boilerplate, a local 32B for anything you cannot send
                off-box. Swap mid-session without losing context.
              </p>
              <div className="visual-slot" style={{ display: 'grid', gap: 6 }}>
                {[
                  ['claude', 'main', '#d97757', 'now'],
                  ['deepseek', 'subagent', '#4d6bfe', 'auto'],
                  ['ollama', 'private', '#e8e8e8', 'idle'],
                ].map(([n, r, c, s]) => (
                  <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i style={{ width: 6, height: 6, borderRadius: 99, background: c as string, display: 'block' }} />
                    <span style={{ color: 'var(--text-soft)' }}>{n}</span>
                    <span style={{ color: 'var(--muted-dim)' }}>{r}</span>
                    <span style={{ marginLeft: 'auto', color: s === 'now' ? 'var(--accent)' : 'var(--muted-dim)' }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal className="b-2" delay={100}>
            <div className="bento-card" style={{ height: '100%' }}>
              <div className="glyph">
                <FileCode2 />
              </div>
              <h3>Diffs, not vibes</h3>
              <p>
                Every edit arrives as a reviewable patch with fuzzy matching and a one-key revert back to any checkpoint.
              </p>
              <div className="visual-slot" style={{ padding: 0 }}>
                <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', color: 'var(--muted)' }}>
                  session.ts
                </div>
                <div style={{ padding: '6px 0' }}>
                  <div style={{ color: '#dcffbe', background: 'rgba(198,255,74,.07)', padding: '0 10px' }}>
                    + expiresAt &lt; now → revoke
                  </div>
                  <div style={{ color: '#ffb6ae', background: 'rgba(255,107,94,.07)', padding: '0 10px' }}>
                    − trust the cookie
                  </div>
                  <div style={{ color: 'var(--muted-dim)', padding: '0 10px' }}>httpOnly · secure</div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal className="b-2" delay={120}>
            <div className="bento-card" style={{ height: '100%' }}>
              <div className="glyph">
                <Lock />
              </div>
              <h3>Local by default</h3>
              <p>
                Keys in the keychain, secrets scrubbed from tool output, your code only leaves the machine to the provider
                you chose. Offline mode works with Ollama.
              </p>
              <div className="visual-slot" style={{ display: 'grid', gap: 7 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>telemetry</span>
                  <span style={{ color: 'var(--red)' }}>off</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>keys</span>
                  <span style={{ color: 'var(--accent)' }}>OS keychain</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>index</span>
                  <span style={{ color: 'var(--accent)' }}>on-device</span>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal className="b-3" delay={140}>
            <div className="bento-card" style={{ height: '100%' }}>
              <div className="glyph">
                <Plug />
              </div>
              <h3>Extend it like a real tool</h3>
              <p>
                MCP servers, custom tools, and plugins that hook the loop: PR writers, browser QA, secrets vaults, voice
                mode. Write one in 40 lines of TypeScript.
              </p>
              <div className="visual-slot" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['git-guard', 'test-watcher', 'mcp-bridge', 'repo-lens', 'cost-guard', 'prscribe', 'browser-eyes'].map(
                  (p) => (
                    <span className="chip" key={p}>
                      {p}
                    </span>
                  ),
                )}
              </div>
            </div>
          </Reveal>

          <Reveal className="b-3" delay={160}>
            <div className="bento-card" style={{ height: '100%' }}>
              <div className="glyph">
                <Cpu />
              </div>
              <h3>The loop that actually converges</h3>
              <p>
                Explore → plan → patch → verify → summarise. The agent runs your tests, reads the failures, and fixes them
                before it ever says “done”.
              </p>
              <div className="visual-slot" style={{ display: 'grid', gap: 6 }}>
                {[
                  ['explore', 'grep · read · lsp'],
                  ['patch', 'apply_patch'],
                  ['verify', 'pnpm test --changed'],
                  ['report', 'diff + summary'],
                ].map(([a, b], i) => (
                  <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--muted-dim)' }}>{String(i + 1).padStart(2, '0')}</span>
                    <span style={{ color: 'var(--text-soft)', width: 62 }}>{a}</span>
                    <span style={{ color: 'var(--muted-dim)' }}>{b}</span>
                    {i < 3 && <span style={{ marginLeft: 'auto', color: 'var(--accent)' }}>↓</span>}
                    {i === 3 && <span style={{ marginLeft: 'auto', color: 'var(--accent)' }}>✓</span>}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function ModelsSection() {
  const [filter, setFilter] = useState<ProviderId | 'all'>('all')
  const list = useMemo(() => (filter === 'all' ? MODELS : MODELS.filter((m) => m.provider === filter)), [filter])
  const present = PROVIDERS.filter((p) => MODELS.some((m) => m.provider === p.id))

  return (
    <section className="section" id="models" style={{ background: 'linear-gradient(180deg, transparent, rgba(255,255,255,.014), transparent)' }}>
      <div className="wrap">
        <Reveal>
          <div className="section-head">
            <span className="eyebrow">Model agnostic by design</span>
            <h2>Your model. Your keys. Your bill.</h2>
            <p>
              No bundled credits, no router markup. Bring a key for any provider, or point SLURP at Ollama and LM Studio and
              pay nothing at all. Prices below are the providers' own rates, per million tokens.
            </p>
          </div>
        </Reveal>

        <Reveal delay={60}>
          <div className="model-filters">
            <button className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>
              All 15
            </button>
            {present.map((p) => (
              <button key={p.id} className={filter === p.id ? 'on' : ''} onClick={() => setFilter(p.id)}>
                {p.name}
              </button>
            ))}
          </div>
          <div className="site-models">
            {list.map((m) => {
              const p = providerById(m.provider)
              return (
                <div className="site-model" key={m.id}>
                  <div className="site-model-top">
                    <div>
                      <h4>{m.name}</h4>
                      <div className="prov" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <i style={{ width: 5, height: 5, borderRadius: 99, background: p.color, display: 'block' }} />
                        {p.name}
                      </div>
                    </div>
                    {m.local ? (
                      <span className="chip chip-accent">local</span>
                    ) : m.agentic ? (
                      <span className="chip">agentic</span>
                    ) : null}
                  </div>
                  <p>{m.blurb}</p>
                  <div className="site-model-foot">
                    <span>{fmtContext(m.context)} ctx</span>
                    <span style={{ color: 'var(--muted-dim)' }}>·</span>
                    <span>{fmtPrice(m)}</span>
                    <span className="grow" style={{ display: 'flex', gap: 2 }} title={`coding ${m.coding}/5`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <i
                          key={i}
                          style={{
                            width: 3,
                            height: 9,
                            borderRadius: 1,
                            background: i < m.coding ? 'var(--accent)' : 'rgba(255,255,255,.14)',
                            display: 'block',
                          }}
                        />
                      ))}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Tuning() {
  return (
    <section className="section" id="tuning">
      <div className="wrap">
        <div className="split">
          <Reveal>
            <div>
              <span className="eyebrow">Tune everything</span>
              <h2 style={{ fontSize: 'clamp(28px, 3.4vw, 42px)', letterSpacing: '-0.035em', marginTop: 14 }}>
                Configure it once. It stays yours.
              </h2>
              <p style={{ marginTop: 14, color: 'var(--muted)', fontSize: 15, lineHeight: 1.65 }}>
                A first-run wizard covers the essentials in ninety seconds, then a real settings surface covers everything
                else — including things other tools hide in a config file.
              </p>
              <div className="feature-list">
                {[
                  ['Main + subagent model', 'Expensive brain, cheap hands. Delegate grep-and-summarise work automatically.', Sparkles],
                  ['Persona and rules', 'Pick an operating style — Surgeon, Architect, Racer, Mentor — or write your own system prompt.', ListChecks],
                  ['Autonomy dial', 'Ask before every write, auto-apply with checkpoints, or full send. Per-project.', Zap],
                  ['Tool permissions', 'Twelve built-in tools with individual toggles. Turn off shell if you want a read-only agent.', Lock],
                  ['Context budget', 'Cap tokens per run and per file. Watch the meter fill live instead of discovering it on the invoice.', Layers],
                  ['Theme and type', 'Six accents, UI density, and independent editor/mono font sizes. The agent writes, you look at it.', Sliders],
                ].map(([title, desc, Icon]: any) => (
                  <div className="feature-item" key={title}>
                    <span className="bullet">
                      <Icon />
                    </span>
                    <div>
                      <b>{title}</b>
                      <span>{desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={80} className="split-media">
            <div className="settings-mock">
              <div className="window-bar">
                <div className="dots">
                  <i />
                  <i />
                  <i />
                </div>
                <div className="window-path">settings / models & behaviour</div>
              </div>
              <div className="sm-body">
                <div className="sm-row">
                  <div className="lbl">
                    <span>Temperature</span>
                    <span>0.3</span>
                  </div>
                  <div className="slider-mock">
                    <i style={{ width: '30%' }} />
                    <b style={{ left: '30%' }} />
                  </div>
                </div>
                <div className="sm-row">
                  <div className="lbl">
                    <span>Context budget</span>
                    <span>120k</span>
                  </div>
                  <div className="slider-mock">
                    <i style={{ width: '60%' }} />
                    <b style={{ left: '60%' }} />
                  </div>
                </div>
                <div className="sm-row">
                  <div className="lbl">
                    <span>Accent</span>
                    <span>acid lime</span>
                  </div>
                  <div className="swatches">
                    {['#c6ff4a', '#6ef7c4', '#8ad8ff', '#b69bff', '#ff9d5c', '#ff8ab5'].map((c, i) => (
                      <i key={c} className={i === 0 ? 'on' : ''} style={{ background: c }} />
                    ))}
                  </div>
                </div>
                {[
                  ['Checkpoints before writes', true],
                  ['Run tests after every edit', true],
                  ['Commit when the suite is green', false],
                  ['Telemetry', false],
                ].map(([label, on]) => (
                  <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>{label}</span>
                    <span style={{ marginLeft: 'auto' }} className={`toggle-mock${on ? '' : ' off'}`} />
                  </div>
                ))}
                <div
                  style={{
                    borderTop: '1px solid var(--line)',
                    paddingTop: 12,
                    display: 'flex',
                    gap: 6,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  <span className="chip chip-accent">Surgeon</span>
                  <span className="chip">planner</span>
                  <span className="chip">subagent: gpt-5-mini</span>
                  <span className="mono" style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--muted-dim)' }}>
                    saved locally
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function PluginsSection() {
  return (
    <section className="section" id="plugins">
      <div className="wrap">
        <Reveal>
          <div className="section-head">
            <span className="eyebrow">Plugins</span>
            <h2>Twelve already installed. Thousands more possible.</h2>
            <p>
              Plugins are just TypeScript modules that hook the agent loop. The ones below ship in the box, disabled unless
              you turn them on — you decide what has permission to touch your machine.
            </p>
          </div>
        </Reveal>
        <Reveal delay={60}>
          <div className="plugin-strip">
            {PLUGINS.slice(0, 9).map((p) => (
              <div className="plugin-mini" key={p.id}>
                <span className="pg">
                  <PluginIcon category={p.category} size={14} />
                </span>
                <div>
                  <b>
                    {p.name}
                    {p.verified && <Check size={10} style={{ color: 'var(--accent)' }} />}
                  </b>
                  <span>{p.tagline}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 26 }}>
            <Link to="/settings?tab=plugins" className="btn btn-ghost">
              Browse the plugin registry <ArrowUpRight size={14} />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}


function DownloadSection() {
  return (
    <section className="section" id="download">
      <div className="wrap">
        <Reveal>
          <div className="download-wrap">
            <span className="eyebrow">Get SLURP</span>
            <h2 style={{ marginTop: 14 }}>One file. Double-click. Done.</h2>
            <p style={{ color: 'var(--muted)', marginTop: 14, fontSize: 15, maxWidth: '56ch', marginInline: 'auto' }}>
              The whole app ships as a single {APP.size} HTML file — the harness, the settings, the wizard, the fonts.
              No installer, no Node.js, no account. Works offline.
            </p>
            <div className="dl-buttons">
              <a className="dl-btn primary" href={APP.blob} target="_blank" rel="noreferrer">
                <span style={{ display: 'grid', placeItems: 'center', width: 20 }}>
                  <Download size={16} />
                </span>
                <span>
                  <span className="os">offline · v{APP.version} · {APP.size}</span>
                  <span className="nm">Download {APP.file}</span>
                </span>
                <ArrowRight size={14} style={{ marginLeft: 'auto' }} />
              </a>
              <a className="dl-btn" href={APP.zip} target="_blank" rel="noreferrer">
                <span style={{ display: 'grid', placeItems: 'center', width: 20 }}>
                  <FileCode2 size={15} />
                </span>
                <span>
                  <span className="os">source · npm</span>
                  <span className="nm">Get the repo (ZIP)</span>
                </span>
              </a>
              <Link to="/app" className="dl-btn">
                <span style={{ display: 'grid', placeItems: 'center', width: 20 }}>
                  <Play size={14} />
                </span>
                <span>
                  <span className="os">nothing to install</span>
                  <span className="nm">Run it here</span>
                </span>
              </Link>
            </div>
            <div className="cmd-box">
              <span style={{ color: 'var(--muted-dim)' }}>$</span> open SLURP.html
              <CopyButton text="open SLURP.html" />
            </div>
            <div className="dl-note">
              <span>v{APP.version} · single file · {APP.size}</span>
              <span>·</span>
              <span>Windows · macOS · Linux</span>
              <span>·</span>
              <span>SHA-256 on the download page</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

const FAQS = [
  [
    'Do I need my own API key?',
    'Yes for cloud models — SLURP does not resell tokens or add markup. Paste a key for Anthropic, OpenAI, Google, DeepSeek, xAI, Moonshot, Qwen, Mistral or OpenRouter and it stays in your OS keychain. If you would rather pay nothing, install Ollama and pick a local model; the whole loop works offline.',
  ],
  [
    'Is my code sent anywhere I do not control?',
    'Only to the provider you selected, and only the file excerpts the agent actually reads. There is no telemetry, no fallback router, and no analytics endpoint. The semantic index is built on-device with a local embedding model; turning it off changes nothing else. Read-only network access for tools like fetch_url is a permission you can revoke.',
  ],
  [
    'How is this different from a chat sidebar in my editor?',
    'A chat sidebar suggests code. A harness executes a loop: it greps the repo, plans, applies a patch, runs your tests, reads the failures and tries again — then shows you a diff and a summary. SLURP also does checkpoints, budgets, tool permissions and multi-model delegation, which are the things that make agents reliable instead of impressive once.',
  ],
  [
    'What happens when the agent gets it wrong?',
    'Every write is preceded by a checkpoint. One keystroke reverts the entire session, or just one file. In "ask before writes" mode you approve each patch as it comes. The diff is always visible and always copyable, so you can review before anything hits your branch.',
  ],
  [
    'Can I use it on a team?',
    'Yes. Settings are plain JSON you can commit to a repo, so model choice, personas, tool permissions and plugin config are shared and reviewable. The Pair Room plugin shares a live session over an encrypted room, and PRscribe pushes a branch and writes the pull request when a run lands green.',
  ],
  [
    'What is the license and how much will it cost?',
    'The app is free during open beta. The runtime is source-available and the plugin SDK is MIT. After beta, the editor, the local models path and all plugins shown here stay free; a paid tier is planned for hosted session sync and team policy controls. No feature is paywalled for solo users in this build.',
  ],
]

function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section className="section" id="faq">
      <div className="wrap">
        <Reveal>
          <div className="section-head center">
            <span className="eyebrow">Straight answers</span>
            <h2>Questions people actually ask</h2>
          </div>
        </Reveal>
        <div className="faq">
          {FAQS.map(([q, a], i) => (
            <div className={`faq-item${open === i ? ' open' : ''}`} key={q}>
              <button className="faq-q" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                {q}
                <Plus size={16} />
              </button>
              {open === i && <div className="faq-a">{a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="section" style={{ paddingBottom: 40 }}>
      <div className="wrap">
        <Reveal>
          <div
            className="card"
            style={{
              padding: 'clamp(28px, 5vw, 56px)',
              textAlign: 'center',
              background:
                'radial-gradient(80% 120% at 50% 0%, rgba(198,255,74,.11), transparent 65%), linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,.01))',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
              <Mark size={40} />
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 3.4vw, 40px)' }}>Your next feature is a conversation away.</h2>
            <p style={{ color: 'var(--muted)', marginTop: 12, fontSize: 15 }}>
              Download the desktop app, or poke at the harness right here in the browser.
            </p>
            <div className="hero-actions" style={{ justifyContent: 'center', marginTop: 26 }}>
              <Link to="/download" className="btn btn-primary btn-lg">
                <Download size={16} /> Download SLURP
              </Link>
              <Link to="/app" className="btn btn-ghost btn-lg">
                Open the web demo <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <Brand />
            <p style={{ marginTop: 14, color: 'var(--muted)', fontSize: 13, maxWidth: '32ch', lineHeight: 1.6 }}>
              The agentic coding environment for people who would rather describe the change than type it.
            </p>
            <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
              <span className="chip">
                <span style={{ width: 5, height: 5, borderRadius: 99, background: 'var(--accent)', display: 'block' }} />
                all systems normal
              </span>
            </div>
          </div>
          {[
            ['Product', [['Features', '#features'], ['Models', '#models'], ['Plugins', '#plugins'], ['Download', '/download'], ['Web demo', '/app']]],
            ['Resources', [['Docs', '#faq'], ['Changelog', '#faq'], ['Plugin SDK', '#plugins'], ['Status', '#faq'], ['Security', '#faq']]],
            ['Company', [['About', '#faq'], ['Blog', '#faq'], ['Careers', '#faq'], ['Contact', '#faq']]],
          ].map(([title, links]: any) => (
            <div key={title}>
              <h5>{title}</h5>
              <ul>
                {links.map(([label, href]: any) => (
                  <li key={label}>
                    {href.startsWith('/') ? <Link to={href}>{label}</Link> : <a href={href}>{label}</a>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span>© 2026 SLURP Labs. Built with a harness, obviously.</span>
          <span className="socials">
            <a href="#faq">GitHub</a>
            <a href="#faq">Discord</a>
            <a href="#faq">X</a>
            <a href="#faq">Privacy</a>
          </span>
        </div>
      </div>
    </footer>
  )
}

export default function Landing() {
  return (
    <div className="site">
      <div className="site-bg">
        <div className="grid-lines" />
      </div>
      <Nav />
      <Hero />
      <Bento />
      <ModelsSection />
      <Tuning />
      <PluginsSection />
      <DownloadSection />
      <Faq />
      <FinalCta />
      <Footer />
    </div>
  )
}
