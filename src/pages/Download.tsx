import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Download as DownloadIcon, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react'
import { Footer } from './Landing'
import { Brand } from '../components/Brand'
import { CopyButton, Reveal, Seg } from '../components/ui'

const RELEASES = [
  {
    id: 'mac',
    label: 'macOS',
    note: 'Universal — Apple silicon & Intel',
    file: 'Slurp-0.9.4-universal.dmg',
    size: '94.2 MB',
    sha: 'a41f3c9e7b2d84f1c0a5db6e9f3a7c2d8e1b4f60a9c3d2e7b8f1a4c6d9e0b2f5',
    req: ['macOS 12 Monterey or newer', 'Apple silicon or Intel', '~340 MB on disk'],
    steps: ['Open the .dmg and drag SLURP into Applications.', 'Launch it — the binary is signed and notarised, so no Gatekeeper dance.', 'The setup wizard opens. Pick a provider, paste a key, done.'],
  },
  {
    id: 'win',
    label: 'Windows',
    note: 'x64 installer · arm64 portable available',
    file: 'Slurp-Setup-0.9.4.exe',
    size: '88.6 MB',
    sha: 'c92b7e1a4d8f0c3b6e5a2d9f7c1b8e4a0d3f6c9b2e5a8d1f4c7b0e3a6d9f2c5b',
    req: ['Windows 10 (21H2) or newer', 'x64 or arm64', '~360 MB on disk'],
    steps: ['Run the installer. It is signed; SmartScreen shows the publisher name.', 'SLURP registers a terminal command: slurp.', 'On first launch Windows asks once for a keychain unlock.'],
  },
  {
    id: 'linux',
    label: 'Linux',
    note: 'AppImage · .deb · .rpm · AUR',
    file: 'Slurp-0.9.4-x86_64.AppImage',
    size: '91.8 MB',
    sha: 'e7d2a5c8b1f4e0d3a6c9b2e5d8f1a4c7b0e3d6a9f2c5b8e1d4a7c0f3b6e9d2a5',
    req: ['glibc 2.31+ (Ubuntu 20.04+)', 'x86_64 or aarch64', '~330 MB on disk'],
    steps: ['chmod +x Slurp-*.AppImage && ./Slurp-*.AppImage', 'Or install the .deb for a tray icon and desktop entry.', 'On Wayland, launch with --ozone-platform=wayland for native scaling.'],
  },
] as const

const CHECKS = [
  ['Checksum', 'sha256 — verify with shasum -a 256 <file>'],
  ['Signing', 'Apple notarised · Windows Authenticode · Linux GPG'],
  ['Network', 'No telemetry. Outbound calls only to providers you configure.'],
  ['Uninstall', 'One command, zero leftovers in your repo.'],
]

const CHANGELOG = [
  ['0.9.4', '2 days ago', [
    'Subagent delegation: hand grep-and-summarise work to a cheap model automatically.',
    'New Repo Lens index — on-device embeddings, 6× fewer tokens to find the right file.',
    'Session replay: scrub through every tool call of a finished run.',
    'Fixed: checkpoints were not restored when a run failed mid-patch.',
  ]],
  ['0.9.2', '3 weeks ago', [
    'Kimi K2 Thinking and DeepSeek V3.2 added to the catalog with live pricing.',
    'Autonomy dial now respects per-directory rules.',
    'Diff view shows the agent\'s reasoning inline, collapsed by default.',
  ]],
  ['0.9.0', '2 months ago', [
    'First public beta. Planner-first loop, 12 tools, plugin SDK v1.',
  ]],
]

export default function Download() {
  const [os, setOs] = useState<'mac' | 'win' | 'linux'>('mac')
  const active = RELEASES.find((r) => r.id === os)!
  const [tab, setTab] = useState<'install' | 'verify' | 'notes'>('install')

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
              Web demo
            </Link>
          </div>
        </div>
      </header>

      <div className="wrap" style={{ paddingTop: 118, paddingBottom: 40, position: 'relative', zIndex: 1 }}>
        <Reveal>
          <div style={{ maxWidth: 720 }}>
            <span className="eyebrow">Download · v0.9.4</span>
            <h1 style={{ fontSize: 'clamp(34px, 5vw, 56px)', marginTop: 14, letterSpacing: '-0.04em' }}>
              Get the desktop app.
            </h1>
            <p style={{ marginTop: 16, color: 'var(--muted)', fontSize: 16, lineHeight: 1.65 }}>
              The desktop build has what the browser cannot: filesystem access, a real shell, OS keychain, native notifications
              and the local model runtime. Free during open beta.
            </p>
          </div>
        </Reveal>

        <Reveal delay={60}>
          <div style={{ marginTop: 40 }}>
            <Seg
              value={os}
              onChange={setOs}
              options={[
                { id: 'mac', label: 'macOS' },
                { id: 'win', label: 'Windows' },
                { id: 'linux', label: 'Linux' },
              ]}
            />
          </div>

          <div
            className="card"
            style={{ marginTop: 18, padding: 'clamp(20px, 3vw, 32px)', display: 'grid', gap: 24 }}
          >
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
                {active.id === 'mac' ? '⌘' : active.id === 'win' ? '❖' : '⌥'}
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: 21 }}>SLURP for {active.label}</h2>
                  <span className="chip chip-accent">0.9.4</span>
                  <span className="chip">stable</span>
                </div>
                <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
                  {active.note} · {active.size}
                </p>
              </div>
              <a
                className="btn btn-primary btn-lg"
                href={`#${active.file}`}
                onClick={(e) => e.preventDefault()}
                style={{ minWidth: 210 }}
              >
                <DownloadIcon size={16} /> Download {active.label}
              </a>
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
              <span style={{ color: 'var(--text-soft)' }}>{active.file}</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span style={{ overflowWrap: 'anywhere' }}>sha256 {active.sha}</span>
              <span style={{ marginLeft: 'auto' }}>
                <CopyButton text={active.sha} />
              </span>
            </div>

            <div>
              <div className="seg" style={{ marginBottom: 14 }}>
                {[
                  ['install', 'How to install'],
                  ['verify', 'Verify the download'],
                  ['notes', 'Release notes'],
                ].map(([id, label]) => (
                  <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id as any)}>
                    {label}
                  </button>
                ))}
              </div>

              {tab === 'install' && (
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
                  <div className="mono" style={{ marginTop: 6, fontSize: 11.5, color: 'var(--muted)' }}>
                    also available:{' '}
                    <span style={{ color: 'var(--accent)' }}>
                      {active.id === 'mac' ? 'brew install --cask slurp' : active.id === 'win' ? 'winget install Slurp.Slurp' : 'yay -S slurp-bin'}
                    </span>
                  </div>
                </div>
              )}

              {tab === 'verify' && (
                <div style={{ display: 'grid', gap: 14 }}>
                  <p style={{ color: 'var(--muted)', fontSize: 13.5, lineHeight: 1.6 }}>
                    Every build is reproducible from a tagged commit. Compare the hash after download:
                  </p>
                  <div className="mono" style={{ padding: 12, borderRadius: 10, background: 'rgba(0,0,0,.4)', border: '1px solid var(--line)', fontSize: 11.5, color: 'var(--text-soft)' }}>
                    {active.id === 'win' ? 'certutil -hashfile ' : 'shasum -a 256 '}
                    {active.file}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 10 }}>
                    {CHECKS.map(([k, v]) => (
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
                <div style={{ display: 'grid', gap: 18 }}>
                  {CHANGELOG.map(([v, when, items]: any) => (
                    <div key={v}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                        <span className="mono" style={{ fontSize: 12, color: 'var(--accent)' }}>v{v}</span>
                        <span style={{ fontSize: 11.5, color: 'var(--muted-dim)' }}>{when}</span>
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 5 }}>
                        {items.map((it: string) => (
                          <li key={it} style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.55 }}>
                            {it}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 18, display: 'grid', gap: 8 }}>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-dim)' }}>
                Requirements
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {active.req.map((r) => (
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
            {[
              ['No account required', 'Download, paste a key, start. Email is optional and only used if you enable team sync.', Sparkles],
              ['Signed and notarised', 'macOS notarisation, Windows Authenticode, GPG-signed Linux packages. Every build.', ShieldCheck],
              ['Web demo included', 'Do not want to install anything? The full harness runs in the browser with a simulated repo.', ArrowRight],
            ].map(([t, d, Icon]: any) => (
              <div className="card" key={t} style={{ padding: 18 }}>
                <Icon size={16} style={{ color: 'var(--accent)', marginBottom: 10 }} />
                <b style={{ fontSize: 13.5, display: 'block', marginBottom: 4 }}>{t}</b>
                <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6 }}>{d}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="card" style={{ marginTop: 28, padding: 22, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <b style={{ fontSize: 14 }}>Prefer to poke at it first?</b>
              <p style={{ color: 'var(--muted)', fontSize: 12.5, marginTop: 4 }}>
                The web demo is the same harness with a sandboxed fake repo, a working settings surface and a scripted run.
              </p>
            </div>
            <Link to="/app" className="btn btn-ghost">
              Open web demo <ExternalLink size={14} />
            </Link>
            <Link to="/" className="btn btn-quiet">
              <ArrowLeft size={14} /> Overview
            </Link>
          </div>
        </Reveal>
      </div>
      <Footer />
    </div>
  )
}
