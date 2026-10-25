import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Download as DownloadIcon, ExternalLink, FileCode2, ShieldCheck, Sparkles } from 'lucide-react'
import { Footer } from './Landing'
import { Brand } from '../components/Brand'
import { CopyButton, Reveal, Seg } from '../components/ui'
import { APP } from '../lib/app-info'

const PLATFORMS = [
  {
    id: 'win',
    label: 'Windows',
    glyph: '❖',
    note: 'Windows 10/11 · any modern browser',
    steps: [
      'Download SLURP.html (or grab the ZIP and take it from release/).',
      'Move it anywhere you like — Desktop, C:\\dev, a USB stick. It is a single file.',
      'Double-click it. It opens in Edge or Chrome and the app is running. No installer, no Node.js, no admin rights.',
    ],
    tip: 'If Edge asks “Open file?”, tick “Always open files of this type” so the next launches are one click.',
  },
  {
    id: 'mac',
    label: 'macOS',
    glyph: '⌘',
    note: 'macOS 12+ · Safari, Chrome, Arc',
    steps: [
      'Download SLURP.html and drop it in Applications or anywhere else.',
      'Double-click it — the default browser opens it as a local app.',
      'Optionally drag it into the Dock for a one-click launch.',
    ],
    tip: 'Gatekeeper never blocks it: it is an HTML file, not a binary, so it is not quarantined.',
  },
  {
    id: 'linux',
    label: 'Linux',
    glyph: '⌥',
    note: 'any distro with a browser',
    steps: [
      'Download SLURP.html.',
      'Open it with your browser: xdg-open SLURP.html',
      'Or drop it into a desktop-entry launcher and pin it.',
    ],
    tip: 'Fully offline: the file never makes a network request unless you add an API key.',
  },
] as const

const SELLING_POINTS = [
  ['No install, no Node.js', 'One HTML file holds the app, the styles, the fonts and the agent engine. Nothing to compile, nothing to sign.', Sparkles],
  ['Works offline', 'Zero network requests until you paste a provider key. Open it on a plane and the harness still runs.', ShieldCheck],
  ['Portable and auditable', 'Copy it to a USB stick, email it, read the source. Same file on every machine you own.', FileCode2],
]

export default function Download() {
  const [os, setOs] = useState<'win' | 'mac' | 'linux'>('win')
  const [tab, setTab] = useState<'run' | 'verify' | 'notes'>('run')
  const active = PLATFORMS.find((p) => p.id === os)!

  return (
    <div className="site">
      <div className="site-bg">
        <div className="grid-lines" />
      </div>
      <header className="nav scrolled">
        <div className="wrap nav-inner">
          <Brand />
          <nav className="nav-links">
            <Link to="/" className="nav-link">
              ← Back to overview
            </Link>
          </nav>
          <div className="nav-right">
            <Link to="/app" className="btn btn-ghost btn-sm" style={{ height: 34 }}>
              Open in browser
            </Link>
          </div>
        </div>
      </header>

      <div className="wrap" style={{ paddingTop: 118, paddingBottom: 40, position: 'relative', zIndex: 1 }}>
        <Reveal>
          <div style={{ maxWidth: 740 }}>
            <span className="eyebrow">Download · v{APP.version}</span>
            <h1 style={{ fontSize: 'clamp(34px, 5vw, 56px)', marginTop: 14, letterSpacing: '-0.04em' }}>Get the app.</h1>
            <p style={{ marginTop: 16, color: 'var(--muted)', fontSize: 16, lineHeight: 1.65 }}>
              One self-contained file, {APP.size}. Double-click it and the whole harness runs — landing, agent loop,
              settings, first-run wizard. No installer, no runtime to download, no account.
            </p>
          </div>
        </Reveal>

        <Reveal delay={60}>
          <div style={{ marginTop: 38 }}>
            <Seg
              value={os}
              onChange={setOs}
              options={[
                { id: 'win', label: 'Windows' },
                { id: 'mac', label: 'macOS' },
                { id: 'linux', label: 'Linux' },
              ]}
            />
          </div>

          <div className="card" style={{ marginTop: 18, padding: 'clamp(20px, 3vw, 32px)', display: 'grid', gap: 24 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 18 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'rgba(198,255,74,.1)',
                  border: '1px solid rgba(198,255,74,.28)',
                  color: 'var(--accent)',
                  fontSize: 24,
                  flex: 'none',
                }}
              >
                {active.glyph}
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: 21 }}>SLURP for {active.label}</h2>
                  <span className="chip chip-accent">v{APP.version}</span>
                  <span className="chip">offline build</span>
                </div>
                <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
                  {active.note} · {APP.size} · same file on every OS
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <a className="btn btn-primary btn-lg" href={APP.blob} target="_blank" rel="noreferrer" style={{ minWidth: 200 }}>
                  <DownloadIcon size={16} /> Get {APP.file}
                </a>
                <a className="btn btn-ghost btn-lg" href={APP.zip} target="_blank" rel="noreferrer">
                  Source ZIP
                </a>
              </div>
            </div>

            <div className="note info" style={{ fontSize: 12.5 }}>
              <ExternalLink />
              <span>
                GitHub opens the file in a viewer — press the <b>download icon</b> in its top-right corner (“Download raw
                file”) to save it to disk. Then double-click the saved file. The ZIP route works the same way: unzip, then
                open <span className="mono">release/SLURP.html</span>.
              </span>
            </div>

            <div
              className="mono"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid var(--line)',
                background: 'rgba(0,0,0,.35)',
                fontSize: 11,
                color: 'var(--muted)',
              }}
            >
              <span style={{ color: 'var(--text-soft)' }}>{APP.file}</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>{APP.size}</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <a href={APP.sums} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
                sha256 in SHA256.txt ↗
              </a>
              <span style={{ marginLeft: 'auto' }}>
                <CopyButton text={APP.file} />
              </span>
            </div>

            <div>
              <div className="seg" style={{ marginBottom: 14 }}>
                {[
                  ['run', 'How to run it'],
                  ['verify', 'Verify the file'],
                  ['notes', 'What is inside'],
                ].map(([id, label]) => (
                  <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id as any)}>
                    {label}
                  </button>
                ))}
              </div>

              {tab === 'run' && (
                <div style={{ display: 'grid', gap: 10 }}>
                  {active.steps.map((s, i) => (
                    <div key={s} style={{ display: 'flex', gap: 12 }}>
                      <span
                        className="mono"
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 7,
                          display: 'grid',
                          placeItems: 'center',
                          background: 'rgba(255,255,255,.05)',
                          border: '1px solid var(--line)',
                          fontSize: 10.5,
                          color: 'var(--accent)',
                          flex: 'none',
                        }}
                      >
                        {i + 1}
                      </span>
                      <p style={{ fontSize: 13.5, color: 'var(--text-soft)', lineHeight: 1.6 }}>{s}</p>
                    </div>
                  ))}
                  <div className="note ok" style={{ marginTop: 6 }}>
                    <Sparkles />
                    <span>{active.tip}</span>
                  </div>
                </div>
              )}

              {tab === 'verify' && (
                <div style={{ display: 'grid', gap: 14 }}>
                  <p style={{ color: 'var(--muted)', fontSize: 13.5, lineHeight: 1.6 }}>
                    The file is plain text — you can read every line of it. The published checksum lives in{' '}
                    <a href={APP.sums} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
                      release/SHA256.txt
                    </a>{' '}
                    next to the file (it cannot live inside the file itself). Compare after downloading:
                  </p>
                  <div
                    className="mono"
                    style={{ padding: 12, borderRadius: 10, background: 'rgba(0,0,0,.4)', border: '1px solid var(--line)', fontSize: 11.5, color: 'var(--text-soft)' }}
                  >
                    {active.id === 'win' ? 'certutil -hashfile SLURP.html SHA256' : 'shasum -a 256 SLURP.html'}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 10 }}>
                    {[
                      ['Contents', 'HTML + JS + CSS + fonts, inlined. No external requests.'],
                      ['Network', 'None until you paste a provider API key.'],
                      ['Storage', 'Settings live in this browser profile’s localStorage.'],
                      ['Safety', 'An HTML file cannot install anything or touch your filesystem.'],
                    ].map(([k, v]) => (
                      <div key={k} style={{ padding: 13, borderRadius: 11, border: '1px solid var(--line)', background: 'rgba(255,255,255,.02)' }}>
                        <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted-dim)', marginBottom: 5 }}>
                          {k}
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-soft)', lineHeight: 1.5 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === 'notes' && (
                <div style={{ display: 'grid', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                      <span className="mono" style={{ fontSize: 12, color: 'var(--accent)' }}>v0.9.4</span>
                      <span style={{ fontSize: 11.5, color: 'var(--muted-dim)' }}>current build</span>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 5 }}>
                      {[
                        'Agent loop you can watch: reasoning, plan, tool calls, diffs, test output, summary with cost.',
                        'Full settings surface: models, subagent, persona, provider keys, tool permissions, plugins, theme.',
                        'First-run wizard with eight steps and a live preview of every choice.',
                        'Single-file build: works from file://, hash routing, zero network requests.',
                      ].map((t) => (
                        <li key={t} style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.55 }}>
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-dim)', marginBottom: 8 }}>
                      Not in this build yet
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 5 }}>
                      {[
                        'Real filesystem access — the tools are simulated in this build, so diffs look right but your files are untouched.',
                        'Native window and OS keychain — that is the Tauri wrapper, the next milestone.',
                        'Live API calls need a provider key and a browser that allows CORS to that provider.',
                      ].map((t) => (
                        <li key={t} style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.55 }}>
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 18, display: 'grid', gap: 8 }}>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-dim)' }}>
                Requirements
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Any modern browser', 'No Node.js', 'No admin rights', 'Works offline', '868 KB'].map((r) => (
                  <span className="chip" key={r}>
                    <Check size={11} /> {r}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginTop: 28 }}>
            {SELLING_POINTS.map(([t, d, Icon]: any) => (
              <div className="card" key={t} style={{ padding: 18 }}>
                <Icon size={16} style={{ color: 'var(--accent)', marginBottom: 10 }} />
                <b style={{ fontSize: 13.5, display: 'block', marginBottom: 4 }}>{t}</b>
                <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6 }}>{d}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="card" style={{ marginTop: 28, padding: 22, display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <b style={{ fontSize: 14 }}>Prefer to work from source?</b>
                <p style={{ color: 'var(--muted)', fontSize: 12.5, marginTop: 4 }}>
                  Clone the repo and run the dev server — hot reload, TypeScript checks and the same app. Node.js 18+ is
                  required for that route only.
                </p>
              </div>
              <a className="btn btn-ghost" href={APP.repo} target="_blank" rel="noreferrer">
                GitHub <ExternalLink size={14} />
              </a>
              <Link to="/app" className="btn btn-quiet">
                Open in browser <ArrowRight size={14} />
              </Link>
            </div>
            <div className="mono" style={{ fontSize: 11.5, padding: '10px 12px', borderRadius: 9, border: '1px solid var(--line)', background: 'rgba(0,0,0,.35)', color: 'var(--muted)' }}>
              npm install && npm run dev <span style={{ color: 'var(--muted-dim)' }}>· or npm run build:app to rebuild the single file</span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div style={{ marginTop: 24 }}>
            <Link to="/" className="btn btn-quiet">
              <ArrowLeft size={14} /> Back to overview
            </Link>
          </div>
        </Reveal>
      </div>
      <Footer />
    </div>
  )
}
