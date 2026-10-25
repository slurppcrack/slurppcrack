import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Download as DownloadIcon, Github } from 'lucide-react'
import { Footer } from './Landing'
import { Brand } from '../components/Brand'
import { Reveal } from '../components/ui'
import { APP, IS_LOCAL_FILE } from '../lib/app-info'

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
          <div className="eyebrow-line">загрузка · v{APP.version}</div>
          <h1 style={{ fontSize: 'clamp(34px, 5vw, 54px)', marginTop: 12, letterSpacing: '-0.04em' }}>
            Один файл. <span className="muted-h">Двойной клик.</span>
          </h1>
          <p className="lede-min" style={{ marginTop: 16 }}>
            SLURP для Windows — {APP.exeSize}. Внутри уже всё: интерфейс, движок агента, шрифты. Ставить нечего,
            интернет не нужен, права администратора тоже.
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
              ZIP со всем репозиторием
            </a>
          </div>

          <div className="dl-alt">
            <span>Не Windows?</span>
            <a href={APP.html} download>
              Тот же интерфейс одним HTML-файлом — открой в любом браузере
            </a>
          </div>
        </Reveal>

        <Reveal delay={60}>
          <section className="dl-block">
            <h3>Как запустить</h3>
            <ol className="steps-min">
              <li>
                <span>Скачай {APP.exeFile} в любую папку.</span>
              </li>
              <li>
                <span>
                  Запусти. Windows SmartScreen покажет «Неизвестный издатель» — файл не подписан платным сертификатом.
                  Нажми <b>«Подробнее»</b> → <b>«Выполнить в любом случае»</b>.
                </span>
              </li>
              <li>
                <span>Приложение откроется в браузере в новом окне. Дальше — визард настройки.</span>
              </li>
            </ol>
          </section>

          <section className="dl-block">
            <h3>Проверить файл</h3>
            <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.6 }}>
              Сумма лежит рядом: <a href={APP.sums} style={{ color: 'var(--accent)' }}>release/SHA256.txt</a>. Сверь после
              скачивания:
            </p>
            <div className="cmd-box" style={{ marginTop: 12 }}>
              <span style={{ color: 'var(--muted-dim)' }}>&gt;</span> certutil -hashfile SLURP.exe SHA256
            </div>
            <div style={{ marginTop: 10 }}>
              <a className="cta-quiet" href={APP.sums} target="_blank" rel="noreferrer" download>
                Скачать SHA256.txt
              </a>
            </div>
          </section>

          <section className="dl-block">
            <h3>Что внутри</h3>
            <div className="facts">
              {[
                ['Интерфейс', 'харнесс, настройки, визард, лендинг'],
                ['Агент', 'план, инструменты, диффы, тесты, стоимость'],
                ['Сеть', 'ноль запросов, пока не вставишь свой ключ'],
                ['Вес', APP.exeSize],
              ].map(([k, v]) => (
                <div key={k} className="fact">
                  <span>{k}</span>
                  <b>{v}</b>
                </div>
              ))}
            </div>
            <p className="muted" style={{ fontSize: 12.5, marginTop: 14, lineHeight: 1.6 }}>
              Пока нет доступа к реальным файлам на диске: правки и тесты симулированы, чтобы можно было оценить
              интерфейс и логику. Нативная оболочка — следующий шаг.
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
