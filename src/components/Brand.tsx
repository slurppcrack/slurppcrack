import { Link } from 'react-router-dom'

export function Mark({ size = 26 }: { size?: number }) {
  return (
    <span className="brand-mark" style={{ width: size, height: size, borderRadius: size * 0.3 }}>
      <svg viewBox="0 0 64 64" fill="none" aria-hidden>
        <path
          d="M32 10c8.6 10.6 15 17.6 15 25.6a15 15 0 1 1-30 0C17 27.6 23.4 20.6 32 10Z"
          fill="currentColor"
          fillOpacity="0.92"
        />
        <circle cx="26.5" cy="34" r="4.2" fill="#0a0f06" fillOpacity="0.6" />
      </svg>
    </span>
  )
}

export function Brand({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="brand" aria-label="SLURP home">
      <Mark />
      <span>slurp</span>
      <span
        className="mono"
        style={{
          fontSize: 9.5,
          color: 'var(--muted-dim)',
          border: '1px solid var(--line)',
          padding: '1px 5px',
          borderRadius: 5,
          letterSpacing: '0.04em',
        }}
      >
        v0.9.5
      </span>
    </Link>
  )
}
