import { estimateCost, modelById } from './models'

export type Todo = { label: string; status: 'todo' | 'doing' | 'done' }

export type DiffLine = { t: 'add' | 'del' | 'ctx'; n?: number; text: string }

export type Item =
  | { id: string; kind: 'user'; text: string; at: number }
  | { id: string; kind: 'thinking'; text: string; live?: boolean }
  | { id: string; kind: 'text'; text: string; live?: boolean }
  | { id: string; kind: 'plan'; todos: Todo[] }
  | {
      id: string
      kind: 'tool'
      tool: string
      target?: string
      status: 'running' | 'ok' | 'error' | 'waiting'
      summary?: string
      meta?: string
      startedAt: number
    }
  | { id: string; kind: 'diff'; file: string; lines: DiffLine[]; added: number; removed: number; live?: boolean }
  | { id: string; kind: 'terminal'; title: string; lines: { text: string; tone?: 'ok' | 'err' | 'dim' | 'warn' }[]; status: 'running' | 'ok' | 'error' }
  | { id: string; kind: 'note'; tone: 'info' | 'warn' | 'ok'; text: string }
  | {
      id: string
      kind: 'done'
      headline: string
      bullets: string[]
      stats: { files: number; added: number; removed: number; steps: number; ms: number; inTok: number; outTok: number; cost: number }
    }

export type RunOpts = {
  modelId: string
  autonomy: 'ask' | 'auto' | 'yolo'
  persona: string
  planner: boolean
  autoTest: boolean
  onEvent: (item: Item) => void
  requestApproval?: (info: { tool: string; target: string }) => Promise<boolean>
  signal: { aborted: boolean }
}

const sleep = (ms: number, signal?: { aborted: boolean }) =>
  new Promise<void>((res) => {
    const start = Date.now()
    const tick = () => {
      if (signal?.aborted) return res()
      if (Date.now() - start >= ms) return res()
      setTimeout(tick, Math.min(40, ms))
    }
    tick()
  })

let uid = 0
const nid = (p: string) => `${p}-${++uid}-${Math.random().toString(36).slice(2, 6)}`

const FILES: Record<string, string> = {
  'src/server/auth/session.ts': `import { cookies } from 'next/headers'
import { db } from '@/server/db'

const COOKIE = 'acme_session'
const TTL = 60 * 60 * 24 * 30

export async function currentUser() {
  const token = cookies().get(COOKIE)?.value
  if (!token) return null
  return db.session.findUnique({ where: { token }, include: { user: true } })
}

export async function signIn(email: string) {
  const user = await db.user.findUnique({ where: { email } })
  if (!user) throw new Error('unknown user')
  const token = crypto.randomUUID()
  await db.session.create({ data: { token, userId: user.id, expiresAt: new Date(Date.now() + TTL * 1000) } })
  cookies().set(COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/' })
  return user
}`,
  'middleware.ts': `import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED = ['/app', '/settings', '/billing']

export function middleware(req: NextRequest) {
  const authed = Boolean(req.cookies.get('acme_session'))
  const needsAuth = PROTECTED.some((p) => req.nextUrl.pathname.startsWith(p))
  if (needsAuth && !authed) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}`,
  'src/app/(auth)/login/page.tsx': `'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
    setPending(false)
    if (!res.ok) return setError('No account with that email')
    router.push('/app')
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="card">
      <h1>Sign in</h1>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@acme.dev" />
      {error && <p className="error">{error}</p>}
      <button disabled={pending}>{pending ? 'Signing in…' : 'Continue'}</button>
    </form>
  )
}`,
}

type Kind = 'auth' | 'dashboard' | 'api' | 'payments' | 'generic'

function classify(prompt: string): Kind {
  const p = prompt.toLowerCase()
  if (/(auth|login|sign in|signup|sign up|session|oauth|password)/.test(p)) return 'auth'
  if (/(chart|dashboard|analytics|graph|metric|report)/.test(p)) return 'dashboard'
  if (/(api|endpoint|route|database|schema|migration|rest)/.test(p)) return 'api'
  if (/(payment|stripe|checkout|billing|subscription)/.test(p)) return 'payments'
  return 'generic'
}

const PLANS: Record<Kind, Todo[]> = {
  auth: [
    { label: 'Map the existing auth surface', status: 'todo' },
    { label: 'Harden the session cookie + expiry', status: 'todo' },
    { label: 'Gate protected routes in middleware', status: 'todo' },
    { label: 'Rebuild the login form with real error states', status: 'todo' },
    { label: 'Run the auth test suite', status: 'todo' },
  ],
  dashboard: [
    { label: 'Find the metrics endpoint and its shape', status: 'todo' },
    { label: 'Add a typed data hook with loading states', status: 'todo' },
    { label: 'Build the chart component', status: 'todo' },
    { label: 'Handle empty, slow and error states', status: 'todo' },
    { label: 'Verify in the browser at 3 breakpoints', status: 'todo' },
  ],
  api: [
    { label: 'Read the existing route conventions', status: 'todo' },
    { label: 'Define the request/response schema', status: 'todo' },
    { label: 'Implement the handler with validation', status: 'todo' },
    { label: 'Add error paths and a rate limit', status: 'todo' },
    { label: 'Cover it with integration tests', status: 'todo' },
  ],
  payments: [
    { label: 'Inspect the billing models', status: 'todo' },
    { label: 'Create the checkout session endpoint', status: 'todo' },
    { label: 'Add the webhook + idempotency guard', status: 'todo' },
    { label: 'Wire the pricing UI to real prices', status: 'todo' },
    { label: 'Replay webhooks in test mode', status: 'todo' },
  ],
  generic: [
    { label: 'Locate the files that own this behaviour', status: 'todo' },
    { label: 'Write the smallest correct change', status: 'todo' },
    { label: 'Keep types honest across the boundary', status: 'todo' },
    { label: 'Run the relevant checks', status: 'todo' },
    { label: 'Summarise what moved', status: 'todo' },
  ],
}

const diff = (file: string, raw: string): Extract<Item, { kind: 'diff' }> => {
  const lines: DiffLine[] = raw.split('\n').map((text) => {
    if (text.startsWith('+')) return { t: 'add', text: text.slice(1) }
    if (text.startsWith('-')) return { t: 'del', text: text.slice(1) }
    return { t: 'ctx', text: text.replace(/^ /, '') }
  })
  return {
    id: nid('diff'),
    kind: 'diff',
    file,
    lines,
    added: lines.filter((l) => l.t === 'add').length,
    removed: lines.filter((l) => l.t === 'del').length,
    live: true,
  }
}

export async function runAgent(prompt: string, o: RunOpts) {
  const model = modelById(o.modelId)
  const started = Date.now()
  let inTok = 0
  let outTok = 0
  let added = 0
  let removed = 0
  let files = 0
  let steps = 0
  signalCheck(o.signal)

  const kind = classify(prompt)
  const plan = PLANS[kind].map((t) => ({ ...t }))
  const planId = nid('plan')

  const stream = async (id: string, kindName: 'text' | 'thinking', full: string) => {
    o.onEvent({ id, kind: kindName, text: '', live: true })
    let shown = ''
    const chunks = full.split(/(?=[ ,.])/)
    for (const c of chunks) {
      if (o.signal.aborted) break
      shown += c
      o.onEvent({ id, kind: kindName, text: shown, live: true })
      outTok += 1
      await sleep(14 + Math.random() * 18, o.signal)
    }
    o.onEvent({ id, kind: kindName, text: full, live: false })
  }

  const tool = async (name: string, target: string, summary: string, meta?: string, ms = 700) => {
    const id = nid('tool')
    const t0 = Date.now()
    o.onEvent({ id, kind: 'tool', tool: name, target, status: 'running', startedAt: t0 })
    await sleep(ms * 0.6, o.signal)
    o.onEvent({ id, kind: 'tool', tool: name, target, status: 'ok', summary, meta, startedAt: t0 })
    steps++
    inTok += 240 + Math.floor(Math.random() * 900)
    return id
  }

  const gate = async (name: string, target: string) => {
    if (o.autonomy !== 'ask' || !o.requestApproval) return true
    const ok = await o.requestApproval({ tool: name, target })
    return ok
  }

  const mark = (idx: number, status: Todo['status']) => {
    plan[idx].status = status
    o.onEvent({ id: planId, kind: 'plan', todos: plan.map((t) => ({ ...t })) })
  }

  const thinking =
    kind === 'auth'
      ? `The session module is the source of truth here. If I set the cookie properly the middleware can stay dumb, which is what I want — one place that decides who you are, one place that enforces it. The login form is currently swallowing errors, so I'll give it real states while I'm in there.`
      : kind === 'dashboard'
        ? `Before touching the chart I need the exact shape of /api/metrics. If it is per-day buckets I can keep the component dumb and do all the shaping in one hook. Empty and slow states matter more than the pretty path — that is where these pages usually break.`
        : kind === 'api'
          ? `I'll follow the conventions already in the routes folder instead of inventing a new one. Validation belongs at the edge, so the handler can assume a typed body. Rate limiting is cheap to add now and annoying to bolt on later.`
          : kind === 'payments'
            ? `Billing rewards paranoia. Checkout session first, then the webhook with an idempotency key so a retried delivery cannot double-charge. Prices get read from the same source as the UI so they cannot drift.`
            : `I'll start by finding the smallest set of files that actually owns this. Anything I do not need to touch, I will leave exactly as it is — a smaller diff is easier to review and easier to revert.`

  // 1. thinking
  await stream(nid('think'), 'thinking', thinking)

  // 2. plan
  if (o.planner) {
    o.onEvent({ id: planId, kind: 'plan', todos: plan.map((t) => ({ ...t })) })
    await sleep(420, o.signal)
    mark(0, 'doing')
  }

  // 3. explore
  const grepTarget =
    kind === 'auth' ? 'session|cookie|middleware' : kind === 'dashboard' ? 'metrics|useQuery' : kind === 'api' ? 'route\\.ts|zod' : 'export '
  await tool('grep', `/${grepTarget}/`, `7 matches in 4 files`, 'rg --type ts -l')
  const readFile = Object.keys(FILES)[0]
  await tool('read_file', readFile, `${FILES[readFile].split('\n').length} lines`, 'range 1-48', 900)
  if (o.planner) mark(0, 'done')

  // 4. approval gate for the first write
  const firstPatch = Object.keys(FILES)[1]
  const allowed = await gate('apply_patch', firstPatch)
  if (!allowed) {
    o.onEvent({
      id: nid('note'),
      kind: 'note',
      tone: 'warn',
      text: 'Write rejected. The agent stopped here — nothing on disk changed. Your working tree is untouched.',
    })
    o.onEvent({ id: nid('done'), kind: 'done', headline: 'Run stopped by you', bullets: ['No files were modified', 'Checkpoint discarded'], stats: { files: 0, added: 0, removed: 0, steps, ms: Date.now() - started, inTok, outTok, cost: estimateCost(model, inTok, outTok) } })
    return
  }

  if (o.planner) mark(1, 'doing')

  if (kind === 'auth') {
    const d = diff('src/server/auth/session.ts', `-const COOKIE = 'acme_session'
+const COOKIE = 'acme_session'
+const MAX_AGE = 60 * 60 * 24 * 30
+const isProd = process.env.NODE_ENV === 'production'
 
 export async function currentUser() {
   const token = cookies().get(COOKIE)?.value
   if (!token) return null
-  return db.session.findUnique({ where: { token }, include: { user: true } })
+  const session = await db.session.findUnique({
+    where: { token },
+    include: { user: true },
+  })
+  if (!session) return null
+  if (session.expiresAt.getTime() < Date.now()) {
+    await db.session.delete({ where: { token } })
+    return null
+  }
+  return session
 }
 
 export async function signIn(email: string) {
   const user = await db.user.findUnique({ where: { email } })
   if (!user) throw new Error('unknown user')
   const token = crypto.randomUUID()
-  await db.session.create({ data: { token, userId: user.id, expiresAt: new Date(Date.now() + TTL * 1000) } })
-  cookies().set(COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/' })
+  await db.session.create({
+    data: { token, userId: user.id, expiresAt: new Date(Date.now() + MAX_AGE * 1000) },
+  })
+  cookies().set(COOKIE, token, {
+    httpOnly: true,
+    sameSite: 'lax',
+    secure: isProd,
+    maxAge: MAX_AGE,
+    path: '/',
+  })
   return user
 }`)
    o.onEvent(d)
    files++
    added += d.added
    removed += d.removed
    await tool('apply_patch', 'src/server/auth/session.ts', 'expiry enforced, cookie hardened', '+14 −3', 800)
    if (o.planner) mark(1, 'done')

    if (o.planner) mark(2, 'doing')
    const d2 = diff('middleware.ts', `-export function middleware(req: NextRequest) {
-  const authed = Boolean(req.cookies.get('acme_session'))
-  const needsAuth = PROTECTED.some((p) => req.nextUrl.pathname.startsWith(p))
-  if (needsAuth && !authed) {
+const COOKIE = 'acme_session'
+
+export async function middleware(req: NextRequest) {
+  const needsAuth = PROTECTED.some((p) => req.nextUrl.pathname.startsWith(p))
+  if (!needsAuth) return NextResponse.next()
+
+  // One source of truth: the session row, not just the cookie's existence.
+  const token = req.cookies.get(COOKIE)?.value
+  const session = token ? await getSession(token) : null
+  if (!session) {
     const url = req.nextUrl.clone()
     url.pathname = '/login'
     url.searchParams.set('next', req.nextUrl.pathname)
-    return NextResponse.redirect(url)
+    const res = NextResponse.redirect(url)
+    res.cookies.delete(COOKIE)
+    return res
   }
   return NextResponse.next()
 }
+
+export const config = { matcher: ['/app/:path*', '/settings/:path*', '/billing/:path*'] }`)
    o.onEvent(d2)
    files++
    added += d2.added
    removed += d2.removed
    await tool('apply_patch', 'middleware.ts', 'expired sessions now redirect cleanly', '+16 −6', 700)
    if (o.planner) mark(2, 'done')

    if (o.planner) mark(3, 'doing')
    const d3 = diff('src/app/(auth)/login/page.tsx', ` 'use client'
-import { useState } from 'react'
+import { useState, useTransition } from 'react'
 import { useRouter } from 'next/navigation'
 
 export default function LoginPage() {
   const router = useRouter()
   const [email, setEmail] = useState('')
   const [error, setError] = useState<string | null>(null)
-  const [pending, setPending] = useState(false)
+  const [pending, startTransition] = useTransition()
 
-  async function submit(e: React.FormEvent) {
+  function submit(e: React.FormEvent) {
     e.preventDefault()
-    setPending(true)
     setError(null)
-    const res = await fetch('/api/auth/login', {
-      method: 'POST',
-      body: JSON.stringify({ email }),
+    startTransition(async () => {
+      const res = await fetch('/api/auth/login', {
+        method: 'POST',
+        headers: { 'content-type': 'application/json' },
+        body: JSON.stringify({ email }),
+      })
+      if (!res.ok) {
+        const body = await res.json().catch(() => ({}))
+        setError(body.message ?? 'No account with that email')
+        return
+      }
+      router.push(new URLSearchParams(location.search).get('next') ?? '/app')
+      router.refresh()
     })
-    setPending(false)
-    if (!res.ok) return setError('No account with that email')
-    router.push('/app')
-    router.refresh()
   }
 
   return (
-    <form onSubmit={submit} className="card">
-      <h1>Sign in</h1>
-      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@acme.dev" />
-      {error && <p className="error">{error}</p>}
-      <button disabled={pending}>{pending ? 'Signing in…' : 'Continue'}</button>
-    </form>
+    <form onSubmit={submit} className="card" aria-busy={pending}>
+      <h1>Sign in</h1>
+      <p className="muted">Use the email your workspace was created with.</p>
+      <label>
+        Email
+        <input
+          type="email"
+          required
+          autoComplete="email"
+          value={email}
+          onChange={(e) => setEmail(e.target.value)}
+          placeholder="you@acme.dev"
+        />
+      </label>
+      {error && <p role="alert" className="error">{error}</p>}
+      <button disabled={pending}>{pending ? 'Signing in…' : 'Continue'}</button>
+    </form>
   )
 }`)
    o.onEvent(d3)
    files++
    added += d3.added
    removed += d3.removed
    await tool('apply_patch', 'src/app/(auth)/login/page.tsx', 'real error states + return-to path', '+38 −14', 850)
    if (o.planner) mark(3, 'done')
  } else if (kind === 'dashboard') {
    const d = diff('src/features/metrics/use-metrics.ts', `+import { useQuery } from '@tanstack/react-query'
+
+export type Point = { day: string; value: number }
+
+export type Metrics = {
+  revenue: Point[]
+  activeUsers: Point[]
+  conversion: number
+}
+
+class MetricsError extends Error {}
+
+async function load(signal: AbortSignal): Promise<Metrics> {
+  const res = await fetch('/api/metrics', { signal })
+  if (!res.ok) throw new MetricsError(\`metrics failed: \${res.status}\`)
+  const json = (await res.json()) as Partial<Metrics>
+  return {
+    revenue: json.revenue ?? [],
+    activeUsers: json.activeUsers ?? [],
+    conversion: json.conversion ?? 0,
+  }
+}
+
+export function useMetrics(range: '7d' | '30d' | '90d') {
+  return useQuery({
+    queryKey: ['metrics', range],
+    queryFn: ({ signal }) => load(signal),
+    staleTime: 60_000,
+    retry: (count, err) => !(err instanceof MetricsError) && count < 2,
+  })
+}`)
    o.onEvent(d)
    files++
    added += d.added
    removed += d.removed
    await tool('apply_patch', 'src/features/metrics/use-metrics.ts', 'typed hook, abortable, honest retries', '+26 −0', 780)
    if (o.planner) mark(1, 'done')
    if (o.planner) mark(2, 'doing')
    const d2 = diff('src/features/metrics/revenue-chart.tsx', `+'use client'
+import { useMemo } from 'react'
+import { useMetrics } from './use-metrics'
+
+export function RevenueChart({ range = '30d' }: { range?: '7d' | '30d' | '90d' }) {
+  const { data, isPending, error } = useMetrics(range)
+
+  const path = useMemo(() => {
+    if (!data?.revenue.length) return ''
+    const max = Math.max(...data.revenue.map((p) => p.value), 1)
+    const step = 100 / Math.max(data.revenue.length - 1, 1)
+    return data.revenue
+      .map((p, i) => \`\${i ? 'L' : 'M'}\${(i * step).toFixed(2)} \${(40 - (p.value / max) * 36).toFixed(2)}\`)
+      .join(' ')
+  }, [data])
+
+  if (isPending) return <ChartSkeleton />
+  if (error) return <ChartEmpty title="Could not load revenue" hint={error.message} />
+  if (!data?.revenue.length) return <ChartEmpty title="No revenue yet" hint="Numbers appear after the first payment." />
+
+  return (
+    <figure className="chart">
+      <figcaption>
+        <span>Revenue</span>
+        <strong>{formatMoney(data.revenue.at(-1)!.value)}</strong>
+      </figcaption>
+      <svg viewBox="0 0 100 44" preserveAspectRatio="none" role="img" aria-label="Revenue over time">
+        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
+      </svg>
+    </figure>
+  )
+}`)
    o.onEvent(d2)
    files++
    added += d2.added
    removed += d2.removed
    await tool('apply_patch', 'src/features/metrics/revenue-chart.tsx', 'chart + skeleton + empty states', '+34 −0', 720)
    if (o.planner) mark(2, 'done')
  } else if (kind === 'payments') {
    const d = diff('src/server/billing/checkout.ts', `+import Stripe from 'stripe'
+import { db } from '@/server/db'
+import { currentUser } from '@/server/auth/session'
+
+const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-09-30' })
+
+export async function createCheckout(priceId: string, plan: 'pro' | 'team') {
+  const session = await currentUser()
+  if (!session) throw new Response('unauthorized', { status: 401 })
+
+  const customer =
+    session.user.stripeId ??
+    (await stripe.customers.create({ email: session.user.email })).id
+
+  const checkout = await stripe.checkout.sessions.create({
+    mode: 'subscription',
+    customer,
+    line_items: [{ price: priceId, quantity: 1 }],
+    allow_promotion_codes: true,
+    client_reference_id: session.user.id,
+    subscription_data: { metadata: { plan } },
+    success_url: \`\${process.env.APP_URL}/app?welcome=1\`,
+    cancel_url: \`\${process.env.APP_URL}/pricing\`,
+  })
+
+  if (!session.user.stripeId) {
+    await db.user.update({ where: { id: session.user.id }, data: { stripeId: customer } })
+  }
+  return checkout.url
+}`)
    o.onEvent(d)
    files++
    added += d.added
    removed += d.removed
    await tool('apply_patch', 'src/server/billing/checkout.ts', 'checkout session + customer reuse', '+30 −0', 820)
    if (o.planner) mark(1, 'done')
  } else if (kind === 'api') {
    const d = diff('src/app/api/metrics/route.ts', `+import { NextResponse } from 'next/server'
+import { z } from 'zod'
+import { db } from '@/server/db'
+import { currentUser } from '@/server/auth/session'
+
+const Query = z.object({
+  range: z.enum(['7d', '30d', '90d']).default('30d'),
+})
+
+export async function GET(req: Request) {
+  const session = await currentUser()
+  if (!session) return NextResponse.json({ message: 'unauthorized' }, { status: 401 })
+
+  const parsed = Query.safeParse(Object.fromEntries(new URL(req.url).searchParams))
+  if (!parsed.success) {
+    return NextResponse.json({ message: 'bad range', issues: parsed.error.issues }, { status: 422 })
+  }
+
+  const days = { '7d': 7, '30d': 30, '90d': 90 }[parsed.data.range]
+  const since = new Date(Date.now() - days * 86_400_000)
+
+  const rows = await db.event.groupBy({
+    by: ['day'],
+    where: { userId: session.user.id, day: { gte: since } },
+    _sum: { cents: true },
+    orderBy: { day: 'asc' },
+  })
+
+  return NextResponse.json({
+    revenue: rows.map((r) => ({ day: r.day.toISOString().slice(0, 10), value: (r._sum.cents ?? 0) / 100 })),
+    activeUsers: [],
+    conversion: 0,
+  }, { headers: { 'cache-control': 'private, max-age=60' } })
+}`)
    o.onEvent(d)
    files++
    added += d.added
    removed += d.removed
    await tool('apply_patch', 'src/app/api/metrics/route.ts', 'validated + cached route', '+32 −0', 760)
    if (o.planner) mark(2, 'done')
  } else {
    const d = diff('src/app/api/metrics/route.ts', `+import { NextResponse } from 'next/server'
+import { db } from '@/server/db'
+import { currentUser } from '@/server/auth/session'
+
+export async function GET() {
+  const session = await currentUser()
+  if (!session) {
+    return NextResponse.json({ message: 'unauthorized' }, { status: 401 })
+  }
+
+  const events = await db.event.findMany({
+    where: { userId: session.user.id },
+    orderBy: { createdAt: 'asc' },
+    take: 500,
+  })
+
+  return NextResponse.json({ events })
+}`)
    o.onEvent(d)
    files++
    added += d.added
    removed += d.removed
    await tool('apply_patch', 'src/app/api/metrics/route.ts', 'small focused handler', '+18 −0', 700)
    if (o.planner) mark(1, 'done')
  }

  // 5. tests
  if (o.autoTest) {
    if (o.planner) mark(o.planner ? plan.length - 2 : 3, 'doing')
    const tid = nid('term')
    o.onEvent({ id: tid, kind: 'terminal', title: 'pnpm test --changed', lines: [], status: 'running' })
    const lines: { text: string; tone?: 'ok' | 'err' | 'dim' | 'warn' }[] = [
      { text: ' RUN  v3.2.4  /Users/you/acme-web', tone: 'dim' },
      { text: ' ✓ src/server/auth/session.test.ts (6 tests) 42ms', tone: 'ok' },
      { text: ' ✓ src/app/(auth)/login/page.test.tsx (4 tests) 118ms', tone: 'ok' },
      { text: ' ✓ middleware.test.ts (3 tests) 27ms', tone: 'ok' },
      { text: '', tone: 'dim' },
      { text: ' Test Files  3 passed (3)', tone: 'ok' },
      { text: '      Tests  13 passed (13)', tone: 'ok' },
      { text: '   Duration  1.84s', tone: 'dim' },
    ]
    for (let i = 0; i < lines.length; i++) {
      if (o.signal.aborted) break
      await sleep(120 + Math.random() * 160, o.signal)
      o.onEvent({ id: tid, kind: 'terminal', title: 'pnpm test --changed', lines: lines.slice(0, i + 1), status: i === lines.length - 1 ? 'ok' : 'running' })
    }
    steps++
    if (o.planner) mark(plan.length - 2, 'done')
  }

  // 6. summary
  const headline =
    kind === 'auth'
      ? 'Auth is locked down and the login flow tells the truth'
      : kind === 'dashboard'
        ? 'The dashboard now survives real data'
        : kind === 'payments'
          ? 'Checkout is live and idempotent'
          : kind === 'api'
            ? 'The endpoint validates before it trusts'
            : 'Change landed and verified'

  await stream(
    nid('text'),
    'text',
    kind === 'auth'
      ? `Sessions now expire for real — the cookie is httpOnly, sameSite=lax, secure in prod, and the row is deleted on use after expiry. Middleware checks the session row instead of trusting that a cookie exists, which was the actual hole. The login form keeps your destination, surfaces server messages and uses a transition so the button cannot be double-fired.\n\nNext good move: add rate limiting on /api/auth/login. Want me to?`
      : kind === 'dashboard'
        ? `The chart is fed by one typed hook with an AbortSignal, so switching ranges cancels the old request instead of racing it. Skeleton while loading, a real empty state, and failures show the message rather than an empty axis.\n\nNext good move: cache the metrics response at the edge. Want me to?`
        : `Change is in and the checks are green. I kept the diff as small as I could — nothing outside the files that own this behaviour was touched.`
  )

  if (o.planner) mark(plan.length - 1, 'done')

  o.onEvent({
    id: nid('done'),
    kind: 'done',
    headline,
    bullets:
      kind === 'auth'
        ? ['Expiry enforced on read + row cleanup', 'Cookie is httpOnly, sameSite=lax, secure in prod', 'Middleware validates the session row', 'Login form: return-to, server errors, no double submit']
        : kind === 'dashboard'
          ? ['One typed, abortable data hook', 'Skeleton, empty and error states', 'Chart is a pure function of data', 'No new dependencies']
          : ['Focused diff, no drive-by edits', 'Types stay honest at the boundary', 'Checks pass'],
    stats: { files, added, removed, steps, ms: Date.now() - started, inTok, outTok, cost: estimateCost(model, inTok, outTok) },
  })
}

function signalCheck(s: { aborted: boolean }) {
  if (s.aborted) throw new Error('aborted')
}
