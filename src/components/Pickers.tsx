import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Search, Sparkles } from 'lucide-react'
import { MODELS, PROVIDERS, fmtContext, fmtPrice, modelById, providerById, type ProviderId } from '../lib/models'
import { ACCENTS, PERSONAS, useSettings } from '../lib/store'
import { CloseX, Modal } from './ui'
import { PersonaIcon } from './glyphs'

function Bars({ n }: { n: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }} title={`${n}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <i
          key={i}
          style={{
            width: 3,
            height: 9,
            borderRadius: 1,
            display: 'block',
            background: i < n ? 'var(--accent)' : 'rgba(255,255,255,.16)',
          }}
        />
      ))}
    </span>
  )
}

export function ModelPicker({ onClose, mode = 'main' }: { onClose: () => void; mode?: 'main' | 'sub' }) {
  const { settings, set } = useSettings()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<ProviderId | 'all'>('all')
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => inputRef.current?.focus(), [])

  const list = useMemo(() => {
    const needle = q.toLowerCase()
    return MODELS.filter((m) => {
      if (filter !== 'all' && m.provider !== filter) return false
      if (!needle) return true
      return (
        m.name.toLowerCase().includes(needle) ||
        m.tags.some((t) => t.includes(needle)) ||
        providerById(m.provider).name.toLowerCase().includes(needle)
      )
    })
  }, [q, filter])

  const current = mode === 'main' ? settings.modelId : settings.subagentModelId
  const present = PROVIDERS.filter((p) => MODELS.some((m) => m.provider === p.id))

  const pick = (id: string) => {
    set(mode === 'main' ? 'modelId' : 'subagentModelId', id)
    onClose()
  }

  return (
    <Modal onClose={onClose} label="Pick a model">
      <div className="modal-head">
        <Sparkles size={15} style={{ color: 'var(--accent)' }} />
        <div>
          <h3>{mode === 'main' ? 'Main model' : 'Subagent model'}</h3>
          <div className="sm">
            {mode === 'main' ? 'does the thinking and the writing' : 'does the cheap grunt work'}
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <CloseX onClose={onClose} />
        </div>
      </div>
      <div className="palette-search">
        <Search />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search 15 models — name, provider, tag…"
        />
        <span className="kbd">esc</span>
      </div>
      <div className="model-filters" style={{ padding: '10px 12px 0', marginBottom: 0 }}>
        <button className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>
          All
        </button>
        {present.map((p) => (
          <button key={p.id} className={filter === p.id ? 'on' : ''} onClick={() => setFilter(p.id)}>
            {p.name}
          </button>
        ))}
      </div>
      <div className="modal-body">
        <div className="mp-list">
          {list.map((m) => {
            const p = providerById(m.provider)
            return (
              <button key={m.id} className={`mp-item${current === m.id ? ' on' : ''}`} onClick={() => pick(m.id)}>
                <span className="mp-logo" style={{ color: p.color }}>
                  {p.glyph}
                </span>
                <span className="mp-main">
                  <b>
                    {m.name}
                    {m.local && <span className="chip" style={{ height: 17, fontSize: 9.5 }}>local</span>}
                    {m.tags.includes('open-weights') && (
                      <span className="chip" style={{ height: 17, fontSize: 9.5 }}>open</span>
                    )}
                  </b>
                  <span>{m.blurb}</span>
                </span>
                <span className="mp-meta">
                  <span className="hide-xs">{fmtContext(m.context)}</span>
                  <span className="hide-xs" style={{ color: 'var(--muted-dim)' }}>·</span>
                  <span>{fmtPrice(m)}</span>
                  <Bars n={m.coding} />
                  {current === m.id && <Check size={13} style={{ color: 'var(--accent)' }} />}
                </span>
              </button>
            )
          })}
          {list.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              Nothing matches “{q}”. Add a custom provider in Settings → Providers.
            </div>
          )}
        </div>
      </div>
      <div className="modal-foot">
        <span>Prices are provider list rates per 1M tokens.</span>
        <span style={{ marginLeft: 'auto' }}>Keys live in your OS keychain</span>
      </div>
    </Modal>
  )
}

export type Cmd = { id: string; group: string; label: string; hint?: string; icon?: any; run: () => void }

export function CommandPalette({
  onClose,
  commands,
}: {
  onClose: () => void
  commands: Cmd[]
}) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => inputRef.current?.focus(), [])

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().replace(/^\//, '')
    if (!needle) return commands
    return commands.filter((c) => (c.label + ' ' + (c.hint ?? '') + ' ' + c.group).toLowerCase().includes(needle))
  }, [q, commands])

  useEffect(() => setSel(0), [q])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSel((s) => Math.min(s + 1, filtered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSel((s) => Math.max(s - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        filtered[sel]?.run()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [filtered, sel, onClose])

  let lastGroup = ''
  return (
    <Modal onClose={onClose} label="Command palette">
      <div className="palette-search">
        <Search />
        <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a command or a model name…" />
        <span className="kbd">⌘K</span>
      </div>
      <div className="palette-list">
        {filtered.map((c, i) => {
          const showGroup = c.group !== lastGroup
          lastGroup = c.group
          const Icon = c.icon
          return (
            <div key={c.id}>
              {showGroup && <div className="palette-group">{c.group}</div>}
              <button className={`palette-item${i === sel ? ' sel' : ''}`} onMouseEnter={() => setSel(i)} onClick={() => { c.run(); onClose() }}>
                {Icon ? <Icon /> : <span style={{ width: 15 }} />}
                {c.label}
                {c.hint && <span className="d">{c.hint}</span>}
              </button>
            </div>
          )
        })}
        {filtered.length === 0 && <div style={{ padding: 26, textAlign: 'center', color: 'var(--muted)' }}>No command matches.</div>}
      </div>
      <div className="modal-foot">
        <span className="kbd">↑</span>
        <span className="kbd">↓</span>
        <span>navigate</span>
        <span className="kbd">↵</span>
        <span>run</span>
        <span style={{ marginLeft: 'auto' }}>SLURP · command palette</span>
      </div>
    </Modal>
  )
}

export function PersonaPickerInline() {
  const { settings, set, patch } = useSettings()
  return (
    <div className="persona-grid">
      {PERSONAS.map((p) => (
        <button key={p.id} className={`persona${settings.persona === p.id ? ' on' : ''}`} onClick={() => patch({ persona: p.id, customPrompt: p.id === 'custom' ? settings.customPrompt : p.prompt })}>
          <span className="em">
            <PersonaIcon id={p.id} />
          </span>
          <span>
            <b>{p.name}</b>
            <span>{p.desc}</span>
          </span>
        </button>
      ))}
    </div>
  )
}

export function AccentPicker() {
  const { settings, set } = useSettings()
  return (
    <div className="accent-row">
      {Object.entries(ACCENTS).map(([id, a]) => (
        <button
          key={id}
          className={`accent-sw${settings.accent === id ? ' on' : ''}`}
          style={{ background: a.hex }}
          title={a.name}
          aria-label={a.name}
          onClick={() => set('accent', id)}
        />
      ))}
    </div>
  )
}

export function ModelChip({ id, onClick, compact }: { id: string; onClick?: () => void; compact?: boolean }) {
  const m = modelById(id)
  const p = providerById(m.provider)
  return (
    <button className="model-trigger" onClick={onClick}>
      <span className="pdot" style={{ background: p.color }} />
      {compact ? m.short : m.name}
      <span className="mono" style={{ color: 'var(--muted-dim)', fontSize: 10 }}>
        {fmtContext(m.context)}
      </span>
    </button>
  )
}
