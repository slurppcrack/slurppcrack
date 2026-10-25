import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Download as DownloadIcon, Github } from 'lucide-react'
import { Footer } from './Landing'
import { Brand } from '../components/Brand'
import { Reveal } from '../components/ui'
import { APP } from '../lib/app-info'

export default function Download() {
  return (
    <div className="site">
      <div className="site-bg">
        <div className="grid-lines" />
      </div>
      <header className="nav scrolled">
        <div className="wrap nav-inner">
          <Brand />
          <div className="nav-right">
            <Link to="/" className="nav-link">
              Назад
            </Link>
            <a
              className="btn btn-primary btn-sm"
              href={APP.primary.href}
              download={APP.primary.external ? undefined : true}
              target={APP.primary.external ? '_blank' : undefined}
              rel={APP.primary.external ? 'noreferrer' : undefined}
            >
              <DownloadIcon size={13} /> Скачать
            </a>
          </div>
        </div>
      </header>

      <main className="wrap" style={{ paddingTop: 130, paddingBottom: 60 }}>
        <Reveal>
          <div className="eyebrow-line">загрузка · v{APP.version} · {APP.stack}</div>
          <h1 style={{ fontSize: 'clamp(34px, 5vw, 54px)', marginTop: 12, letterSpacing: '-0.04em' }}>
            Одно окно. <span className="muted-h">Твои файлы.</span>
          </h1>
          <p className="lede-min" style={{ marginTop: 16 }}>
            SLURP — отдельное приложение для Windows на C# и WPF. Не вкладка в браузере и не веб-обёртка: агент
            открывает выбранную папку, читает файлы, правит их на диске и запускает сборку с тестами.
          </p>

          <div className="cta-row" style={{ marginTop: 30 }}>
            <a
              className="btn btn-primary btn-lg"
              href={APP.primary.href}
              download={APP.primary.external ? undefined : true}
              target={APP.primary.external ? '_blank' : undefined}
              rel={APP.primary.external ? 'noreferrer' : undefined}
            >
              <DownloadIcon size={16} /> {APP.primary.label}
            </a>
            <a className="cta-quiet" href={APP.zip} target="_blank" rel="noreferrer">
              Весь репозиторий
            </a>
          </div>

          <div className="dl-alt">
            <span>В архиве</span>
            <span className="muted">desktop/Slurp.Desktop (C#/WPF) · BUILD-WINDOWS.bat · START-HERE.txt</span>
          </div>
        </Reveal>

        <Reveal delay={60}>
          <section className="dl-block">
            <h3>Как получить приложение</h3>
            <ol className="steps-min">
              <li>
                <span>
                  Скачай ZIP ({APP.bundleSize}) и распакуй — например в <b>D:\SLURP</b>.
                </span>
              </li>
              <li>
                <span>
                  Двойной клик по <b>BUILD-WINDOWS.bat</b>. Скрипт проверит .NET SDK, при необходимости поставит его
                  через winget и выполнит <span className="mono">dotnet publish -c Release -r win-x64</span>.
                </span>
              </li>
              <li>
                <span>
                  Через 1–3 минуты рядом появится <b>SLURP.exe</b> и откроется окно приложения. Этот exe дальше
                  запускается сам, без Node.js, без браузера и без .NET на машине.
                </span>
              </li>
            </ol>
          </section>

          <section className="dl-block">
            <h3>Почему не готовый exe прямо сейчас</h3>
            <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.65 }}>
              Честно: сервер, на котором собирается этот сайт, — Linux без Windows и без .NET SDK, а WPF-приложение
              можно скомпилировать только с Windows-таргетингом. Поэтому вместо нерабочей заглушки с расширением
              .exe здесь лежат настоящие исходники и один скрипт сборки. После того как кто-то выполнит{' '}
              <span className="mono">npm run build:win</span> на Windows, файл попадёт в{' '}
              <span className="mono">public/download/SLURP.exe</span> и кнопка начнёт отдавать готовый бинарник.
            </p>
          </section>

          <section className="dl-block">
            <h3>Что внутри приложения</h3>
            <div className="facts">
              {[
                ['Интерфейс', 'нативное окно WPF, тёмная тема, чат и журнал инструментов'],
                ['Агент', 'list_files, read_file, grep, write_file, apply_patch, run_command'],
                ['Модели', 'Claude, GPT, DeepSeek, Gemini, Kimi, Qwen, Mistral, OpenRouter, Ollama'],
                ['Ключи', 'локально в %APPDATA%\\SLURP, шифрование Windows DPAPI'],
              ].map(([k, v]) => (
                <div key={k} className="fact">
                  <span>{k}</span>
                  <b>{v}</b>
                </div>
              ))}
            </div>
            <p className="muted" style={{ fontSize: 12.5, marginTop: 14, lineHeight: 1.6 }}>
              Каждый шаг записи и каждая shell-команда по умолчанию спрашивают разрешение — режим Ask, Auto или Yolo
              переключается в шапке и в настройках.
            </p>
          </section>

          <div className="cta-row" style={{ marginTop: 34 }}>
            <Link to="/" className="cta-quiet">
              <ArrowLeft size={14} /> На главную
            </Link>
            <a className="cta-quiet" href={APP.repo} target="_blank" rel="noreferrer">
              <Github size={14} /> GitHub
            </a>
            <span className="chip" style={{ marginLeft: 'auto' }}>
              <Check size={11} /> без телеметрии
            </span>
          </div>
        </Reveal>
      </main>
      <Footer />
    </div>
  )
}
