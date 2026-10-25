import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  FileCode2,
  GitCommitHorizontal,
  Info,
  ListChecks,
  RotateCcw,
  Sparkles,
  SquareTerminal,
  Zap,
} from 'lucide-react'
import type { Item, Todo } from '../lib/agent'
import { estimateCost, fmtContext, modelById } from '../lib/models'

export function Mono({ children }: { children: React.ReactNode }) {
  return <span className="mono">{children}</span>
}

function fmtTok(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`
}

function ms(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}s` : `${n}ms`
}

function DiffCard({ item }: { item: Extract<Item, { kind: 'diff' }> }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="diff-card">
      <div className="diff-head">
        <FileCode2 size={12} style={{ color: 'var(--muted)', flex: 'none' }} />
        <span className="file">{item.file}</span>
        <span className="stat">
          <span className="add">+{item.added}</span>
          <span className="del">−{item.removed}</span>
        </span>
        <button className="icon-btn" style={{ width: 20, height: 20 }} onClick={() => setOpen((v) => !v)} aria-label="Toggle diff">
          <ChevronDown size={13} style={{ transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform .2s' }} />
        </button>
      </div>
      {open && (
        <div className="diff-body">
          {item.lines.map((l, i) => (
            <div className={`diff-line ${l.t}`} key={i}>
              <span className="sign">{l.t === 'add' ? '+' : l.t === 'del' ? '−' : ' '}</span>
              {l.text || ' '}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PlanCard({ todos }: { todos: Todo[] }) {
  const done = todos.filter((t) => t.status === 'done').length
  return (
    <div className="plan-card">
      <div className="pc-head">
        <ListChecks /> Plan
        <span className="count">
          {done}/{todos.length}
        </span>
      </div>
      {todos.map((t, i) => (
        <div className={`pc-row ${t.status}`} key={i}>
          <span className="box">{t.status === 'done' && <Check size={9} strokeWidth={3.5} />}</span>
          {t.label}
        </div>
      ))}
    </div>
  )
}

function ToolRow({ item }: { item: Extract<Item, { kind: 'tool' }> }) {
  return (
    <div className="tool-row">
      {item.status === 'running' ? (
        <span className="spin" />
      ) : (
        <span className="tick">
          <Check size={12} strokeWidth={3} />
        </span>
      )}
      <span className="tname">{item.tool}</span>
      {item.target && <span className="target">{item.target}</span>}
      <span className="res">{item.status === 'running' ? 'running…' : item.summary}</span>
      {item.meta && <span className="res" style={{ color: 'var(--muted-dim)' }}>{item.meta}</span>}
    </div>
  )
}

function TermCard({ item }: { item: Extract<Item, { kind: 'terminal' }> }) {
  return (
    <div className="term-card">
      <div className="term-head">
        <span className="dots">
          <i />
          <i />
          <i />
        </span>
        <SquareTerminal size={11} />
        {item.title}
        <span className="status">{item.status === 'running' ? 'running' : 'exit 0'}</span>
      </div>
      <div className="term-body">
        {item.lines.map((l, i) => (
          <div className={`l tone-${l.tone ?? 'none'}`} key={i}>
            {l.text || '\u00a0'}
          </div>
        ))}
        {item.status === 'running' && <span className="cursor" />}
      </div>
    </div>
  )
}

function DoneCard({
  item,
  modelId,
  onFollowUp,
}: {
  item: Extract<Item, { kind: 'done' }>
  modelId: string
  onFollowUp: (text: string) => void
}) {
  const model = modelById(modelId)
  return (
    <div className="done-card">
      <div className="dc-head">
        <span className="ok">
          <Check size={12} strokeWidth={3.5} />
        </span>
        <h4>{item.headline}</h4>
      </div>
      <ul>
        {item.bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      <div className="dc-stats">
        <span className="chip">
          <FileCode2 size={11} style={{ color: 'var(--accent)' }} /> {item.stats.files} files
        </span>
        <span className="chip">
          <span style={{ color: 'var(--accent)' }}>+{item.stats.added}</span>
          <span style={{ color: 'var(--red)' }}>−{item.stats.removed}</span>
        </span>
        <span className="chip">
          <Zap size={11} style={{ color: 'var(--accent)' }} /> {item.stats.steps} tool calls
        </span>
        <span className="chip">{ms(item.stats.ms)}</span>
        <span className="chip">
          {fmtTok(item.stats.inTok)} in / {fmtTok(item.stats.outTok)} out
        </span>
        <span className="chip chip-accent">~${item.stats.cost.toFixed(4)} · {model.short}</span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => onFollowUp('add a rate limit to the login endpoint and cover it with a test')}>
          <Sparkles size={12} /> Add rate limiting
        </button>
        <button className="btn btn-quiet btn-sm" onClick={() => onFollowUp('show me the full diff of what you changed')}>
          <FileCode2 size={12} /> Full diff
        </button>
        <button className="btn btn-quiet btn-sm" onClick={() => onFollowUp('revert everything and try a smaller change')}>
          <RotateCcw size={12} /> Try smaller
        </button>
        <button className="btn btn-quiet btn-sm" onClick={() => onFollowUp('commit this with a good message')}>
          <GitCommitHorizontal size={12} /> Commit
        </button>
      </div>
    </div>
  )
}

export function Thread({
  items,
  modelId,
  onFollowUp,
  thinkingLive,
}: {
  items: Item[]
  modelId: string
  onFollowUp: (text: string) => void
  thinkingLive?: boolean
}) {
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const scroller = endRef.current?.closest('.thread') as HTMLElement | null
    if (!scroller) return
    const distance = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight
    if (distance < 280) endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }, [items.length, items[items.length - 1]])

  return (
    <>
      {items.map((item) => {
        switch (item.kind) {
          case 'user':
            return (
              <div className="user-msg" key={item.id}>
                {item.text}
              </div>
            )
          case 'thinking':
            return (
              <div className="thinking" key={item.id}>
                <div className="head">
                  <Brain size={12} /> reasoning {item.live && '· thinking'}
                </div>
                <p className={item.live ? 'cursor' : ''}>{item.text}</p>
              </div>
            )
          case 'text':
            return (
              <div className="assistant" key={item.id}>
                <p className={item.live ? 'cursor' : ''}>{item.text}</p>
              </div>
            )
          case 'plan':
            return <PlanCard key={item.id} todos={(item as any).todos} />
          case 'tool':
            return <ToolRow key={item.id} item={item} />
          case 'diff':
            return <DiffCard key={item.id} item={item} />
          case 'terminal':
            return <TermCard key={item.id} item={item} />
          case 'note':
            return (
              <div className={`note ${item.tone}`} key={item.id}>
                {item.tone === 'warn' ? <AlertTriangle /> : item.tone === 'ok' ? <CheckCircle2 /> : <Info />}
                <span>{item.text}</span>
              </div>
            )
          case 'done':
            return <DoneCard key={item.id} item={item} modelId={modelId} onFollowUp={onFollowUp} />
          default:
            return null
        }
      })}
      <div ref={endRef} />
    </>
  )
}

export function TypingIndicator({ modelId }: { modelId: string }) {
  const model = modelById(modelId)
  return (
    <div className="tool-row" style={{ borderStyle: 'dashed' }}>
      <span className="spin" />
      <span className="tname">{model.short}</span>
      <span className="target">
        working · {fmtContext(model.context)} context · ${model.priceIn}/M in
      </span>
      <span className="res">esc to stop</span>
    </div>
  )
}

export function CostLine({ modelId, tokens }: { modelId: string; tokens: number }) {
  const m = modelById(modelId)
  return <span className="cost-hint">~${estimateCost(m, tokens, tokens * 0.18).toFixed(4)} est.</span>
}
