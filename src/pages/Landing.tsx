import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Download, Github } from 'lucide-react'
import { Brand, Mark } from '../components/Brand'
import { APP, IS_LOCAL_FILE } from '../lib/app-info'
import { PROVIDERS } from '../lib/models'

function useScrolled() {
  const [y, setY] = useState(false)
  useEffect(() => {
    const onScroll = () => setY(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return y
}

const POINTS = [
  ['01', 'Любая модель', 'Claude, GPT-5, Gemini, DeepSeek, Kimi, Qwen — или локальная через Ollama. Свои ключи.'],
  ['02', 'Видно каждый шаг', 'План, вызовы инструментов, диффы и вывод тестов — до того, как что-то попадёт в код.'],
  ['03', 'Настраивается целиком', 'Модель, персона, автономность, права инструментов, тема. Всё решается до первого запроса.'],
]

export default function Landing() {
  const scrolled = useScrolled()
  return (
    <div className="site">
      <div className="site-bg">
        <div className="grid-lines" />
      </div>

      <header className={`nav${scrolled ? ' scrolled' : ''}`}>
        <div className="wrap nav-inner">
          <Brand />
          <div className="nav-right">
            <a className="nav-link nav-icon" href={APP.repo} target="_blank" rel="noreferrer" aria-label="GitHub">
              <Github size={15} />
            </a>
            <a
              className="btn btn-primary btn-sm"
              href={APP.primary.href}
              download={APP.primary.external ? undefined : true}
              target={APP.primary.external ? '_blank' : undefined}
              rel={APP.primary.external ? 'noreferrer' : undefined}
            >
              <Download size={13} /> Скачать
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="hero hero-min">
          <div className="wrap">
            <div className="eyebrow-line">
              v{APP.version} · Windows · {APP.exeSize}
            </div>
            <h1>
              Код по разговору.
              <br />
              <span className="muted-h">Без лишнего.</span>
            </h1>
            <p className="lede-min">
              SLURP — среда для вайбкодинга: агент читает репозиторий, пишет план, правит файлы и показывает диффы.
              Один файл, запускается двойным кликом.
            </p>
            <div className="cta-row">
              <a
                className="btn btn-primary btn-lg"
                href={APP.primary.href}
                download={APP.primary.external ? undefined : true}
                target={APP.primary.external ? '_blank' : undefined}
                rel={APP.primary.external ? 'noreferrer' : undefined}
              >
                <Download size={16} /> {APP.primary.label}
              </a>
              <Link to="/app" className="cta-quiet">
                Открыть в браузере <ArrowRight size={14} />
              </Link>
            </div>
            <div className="hero-foot">
              {APP.primary.note} · без Node.js · работает офлайн
            </div>
          </div>
        </section>

        <section className="wrap">
          <div className="prov-line">
            {PROVIDERS.filter((p) => ['anthropic', 'openai', 'google', 'deepseek', 'moonshot', 'qwen', 'mistral', 'ollama'].includes(p.id)).map(
              (p) => (
                <span key={p.id}>
                  <i style={{ background: p.color }} />
                  {p.name}
                </span>
              ),
            )}
          </div>
        </section>

        <section className="wrap points">
          {POINTS.map(([n, title, text]) => (
            <div className="point" key={n}>
              <span className="num">{n}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </section>

        <section className="wrap preview-min">
          <div className="window">
            <div className="window-bar">
              <div className="dots">
                <i />
                <i />
                <i />
              </div>
              <div className="window-path">acme-web / main</div>
              <span className="live-pill" style={{ marginLeft: 'auto' }}>
                session live
              </span>
            </div>
            <div className="window-body" style={{ gridTemplateColumns: '1fr' }}>
              <div className="mock-main">
                <div className="mock-msg user">harden auth before we ship friday — sessions never expire</div>
                <div className="mock-tool">
                  <span className="ok">✓</span> grep <span style={{ color: 'var(--muted-dim)' }}>session|cookie</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--muted-dim)' }}>7 hits</span>
                </div>
                <div className="mock-diff">
                  <div className="head">
                    src/server/auth/session.ts
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
                    <span className="sign">+</span> cookies().set(COOKIE, token, {'{'} httpOnly, secure {'}'})
                  </div>
                </div>
                <div className="mock-tool">
                  <span className="ok">✓</span> pnpm test <span style={{ color: 'var(--muted-dim)' }}>13 passed</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--muted-dim)' }}>1.84s</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="wrap get" id="get">
          <h2>Скачать</h2>
          <p>Windows 10/11 · x64 · {APP.exeSize} · без установки</p>
          <div className="cta-row" style={{ marginTop: 26 }}>
            <a
              className="btn btn-primary btn-lg"
              href={APP.primary.href}
              download={APP.primary.external ? undefined : true}
              target={APP.primary.external ? '_blank' : undefined}
              rel={APP.primary.external ? 'noreferrer' : undefined}
            >
              <Download size={16} /> {APP.primary.label}
            </a>
            {IS_LOCAL_FILE ? null : (
              <a className="cta-quiet" href={APP.zip} target="_blank" rel="noreferrer">
                исходники (ZIP)
              </a>
            )}
          </div>
          <ol className="steps-min">
            <li>
              <span>Скачай SLURP.exe</span>
            </li>
            <li>
              <span>Windows покажет предупреждение — «Подробнее» → «Выполнить в любом случае» (файл без платной подписи)</span>
            </li>
            <li>
              <span>Откроется приложение в браузере. Всё.</span>
            </li>
          </ol>
          <div className="cmd-box">
            <span style={{ color: 'var(--muted-dim)' }}>sha256</span>
            <a href={APP.sums} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
              SHA256.txt
            </a>
            <span style={{ color: 'var(--muted-dim)' }}>рядом с файлом</span>
          </div>
        </section>
      </main>

      <footer className="footer-min">
        <div className="wrap">
          <Mark size={18} />
          <span>SLURP {APP.version}</span>
          <span className="dot">·</span>
          <a href={APP.repo} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <span className="dot">·</span>
          <Link to="/download">загрузка</Link>
          <span className="dot">·</span>
          <span className="muted">без телеметрии</span>
        </div>
      </footer>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="footer-min">
      <div className="wrap">
        <Mark size={18} />
        <span>SLURP {APP.version}</span>
        <span className="dot">·</span>
        <a href={APP.repo} target="_blank" rel="noreferrer">
          GitHub
        </a>
        <span className="dot">·</span>
        <Link to="/">главная</Link>
      </div>
    </footer>
  )
}
