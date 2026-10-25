# Как запустить SLURP у себя на ПК

Инструкция на 3 минуты. Нужен только **Node.js 18+** (лучше LTS 20/22). Всё остальное — статика:
никакой базы данных, сервера и регистрации нет.

---

## Шаг 0. Поставить Node.js

- **Windows:** скачай установщик с [nodejs.org](https://nodejs.org) (кнопка LTS) **или** в PowerShell:
  ```powershell
  winget install OpenJS.NodeJS.LTS
  ```
- **macOS:** [nodejs.org](https://nodejs.org) или `brew install node`
- **Linux:** `sudo apt install nodejs npm` (или [nodesource](https://github.com/nodesource/distributions))

После установки **закрой и заново открой терминал** и проверь:

```bash
node -v     # должно быть v18.17 или выше, например v22.x
npm -v
```

> Если пишет «node не является внутренней или внешней командой» — терминал не подхватил PATH.
> Перезапусти терминал, а если не помогло — перезагрузи компьютер.

---

## Шаг 1. Скачать проект

### Вариант А — без Git (проще)

Открой в браузере и скачай архив:

```
https://github.com/slurppcrack/slurppcrack/archive/refs/heads/arena/630fbf79-slurppcrack.zip
```

Распакуй, например в `C:\dev\slurp` или `~/dev/slurp`.

### Вариант Б — через Git

```bash
git clone -b arena/630fbf79-slurppcrack https://github.com/slurppcrack/slurppcrack.git slurp
cd slurp
```

---

## Шаг 2. Запустить

В терминале **из папки проекта** (там, где лежит `package.json`):

```bash
npm install     # один раз, ~20–40 секунд
npm run dev     # запускает dev-сервер
```

Появится:

```
  VITE v5.4.x  ready in 200 ms
  ➜  Local:   http://localhost:5173/
```

Открой **http://localhost:5173** в браузере. Чтобы остановить сервер — `Ctrl + C` в терминале.

---

## Что смотреть (по порядку)

| Адрес | Что там |
| --- | --- |
| `http://localhost:5173/` | Лендинг: hero, бенто-фичи, каталог моделей с фильтрами, тюнинг, плагины, скачивание, FAQ |
| `/download` | Страница загрузки: переключи ОС, вкладки «установка / проверка / release notes» |
| `/app` | **Главное.** Нажми любую из 4 подсказок под «What are we building?» и смотри прогон агента |
| `/settings` | Все настройки: модели, персона, ключи, права инструментов, плагины, тема |
| `/setup` | Визард первого запуска из 8 шагов |

### Если терминал пишет «не является внутренней или внешней командой»

Это `cmd.exe` (чёрное окно DOS). В нём нет `unzip` и `git`, а команды PowerShell он не понимает.
Выбери любой из трёх путей.

**А. Совсем без терминала (самый надёжный).** Скачай архив в браузере:

```
https://github.com/slurppcrack/slurppcrack/archive/refs/heads/arena/630fbf79-slurppcrack.zip
```

Правый клик по файлу → «Извлечь все» → зайди в распакованную папку → **двойной клик по `start.cmd`**.
Дальше скрипт всё сделает сам: проверит Node, поставит зависимости, запустит сервер и откроет браузер.

**Б. Одна строка для `cmd.exe`** — только встроенные средства Windows (PowerShell 5.1 + Expand-Archive):

```cmd
powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol='Tls12'; $ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri 'https://github.com/slurppcrack/slurppcrack/archive/refs/heads/arena/630fbf79-slurppcrack.zip' -OutFile 'slurp.zip'; Expand-Archive -Force 'slurp.zip' -DestinationPath '.'; Set-Location 'slurppcrack-arena-630fbf79-slurppcrack'; .\start.cmd"
```

**В. Открыть настоящий PowerShell.** Win + X → «Терминал» (или «Windows PowerShell»), затем:

```powershell
curl.exe -L https://github.com/slurppcrack/slurppcrack/archive/refs/heads/arena/630fbf79-slurppcrack.zip -o slurp.zip; Expand-Archive -Force slurp.zip -DestinationPath .; cd slurppcrack-arena-630fbf79-slurppcrack; .\install.ps1
```

> `curl.exe` (именно с `.exe`) есть в Windows 10 1803+ и Windows 11. Если его нет — используй способ Б.

**Как понять, какое окно открыто:** в `cmd.exe` приглашение выглядит как `C:\Users\Ты>`,
в PowerShell — `PS C:\Users\Ты>`. Команды у них разные, и это главная причина таких ошибок.

### Что обязательно попробовать в `/app`

1. Нажми подсказку **«Harden the auth flow»** → пойдёт рассуждение, план, tool-calls, диффы, тесты, карточка итога.
2. **`/settings → General → Default autonomy = Ask`** → вернись в `/app` и запусти прогон: появится
   жёлтая плашка **«Approve write?»** — это гейт записи. Reject останавливает агента, Approve продолжает.
3. **`/settings → Appearance`** → смени акцент (6 цветов), плотность и размеры шрифтов — интерфейс меняется на лету.
4. **⌘K / Ctrl+K** в `/app` — палитра команд: переключение моделей, персоны, панелей.
5. В composer набери **`/`** — выпадет список команд (`/model`, `/undo`, `/cost`, `/mcp`…). Попробуй `/cost`.
6. **`/settings → Plugins`** — включай/выключай плагины, они появляются в левом рельсе харнесса.
7. **`/setup`** — пройди визард целиком, в конце будет сводка выбранного.

Все настройки хранятся в `localStorage` браузера. Сбросить: `/settings → Privacy & data → Clear`.

---

## Живой режим (настоящий API вместо симуляции)

Демо работает без ключей. Если хочешь реальные ответы модели:

1. `/settings → Providers & keys` → вставь ключ провайдера (например, DeepSeek или Anthropic).
2. Вернись в `/app` — бейдж `DEMO` в шапке сменится на `LIVE`, в composer появится тумблер `live`.

Важные оговорки, чтобы не удивляться:

- **Ключ хранится только в твоём браузере** (`localStorage`). Никуда не отправляется, кроме самого провайдера.
- **CORS.** Браузер шлёт запрос напрямую в API провайдера. Anthropic это разрешает (в коде есть нужный
  заголовок), DeepSeek и OpenAI-совместимые эндпоинты обычно тоже. Если увидишь ошибку сети/CORS —
  это ограничение браузера, а не логики: в десктоп-версии (Tauri/Electron) запрос уходит из нативного
  слоя, и проблемы нет.
- **Инструменты.** В демо файловые операции симулированы: агент показывает правдоподобные диффы, но
  реальные файлы на диске не меняет. Настоящие `read_file` / `apply_patch` / `run_command` — это
  следующий этап (десктоп-обёртка).
- Если прогон уже идёт, тумблер `live` не переключится — дождись конца или нажми `esc` (стоп).

---

## Продакшн-сборка (как на хостинге)

```bash
npm run build      # проверка типов + сборка в dist/
npm run preview    # локальный предпросмотр собранного на http://localhost:4173
```

Содержимое `dist/` — обычная статика: можно закинуть на Vercel, Netlify, Cloudflare Pages, GitHub Pages
или любой nginx. Для SPA-роутинга нужен fallback на `index.html` (на Vercel/Netlify он по умолчанию).

---

## Если что-то пошло не так

| Симптом | Что делать |
| --- | --- |
| `node -v` показывает v16 или ниже | Поставь Node 20/22 LTS. Vite 5 требует Node ≥ 18.17 |
| `npm install` падает с `EACCES` / `EPERM` | Не запускай от администратора. На macOS/Linux не используй `sudo` |
| PowerShell: «выполнение сценариев отключено» | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, затем новый терминал |
| Порт 5173 занят | `npm run dev -- --port 5174` |
| Белый экран в браузере | Открой консоль (F12). Скорее всего dev-сервер не запущен или открыт не тот адрес |
| Скачал ZIP — `npm install` не находит `package.json` | Терминал открыт не в той папке: `cd` в папку, где лежит `package.json` (внутри архива она вложена: `slurppcrack-arena-.../`) |
| Хочу начать с чистого листа | `/settings → Privacy & data → Clear all local data` |

---

## Где что править

| Хочешь изменить | Файл |
| --- | --- |
| Тексты лендинга, FAQ, блоки | `src/pages/Landing.tsx` |
| Страницу загрузки, версии, checksums | `src/pages/Download.tsx` |
| Поведение агента, планы, диффы | `src/lib/agent.ts` |
| Список моделей, цены, контекст | `src/lib/models.ts` |
| Плагины в реестре | `src/lib/plugins.ts` |
| Настройки по умолчанию, персоны | `src/lib/store.tsx` |
| Настройки UI (страница) | `src/pages/Settings.tsx` |
| Визард первого запуска | `src/pages/Onboarding.tsx` |
| Цвета, отступы, типографика | `src/styles/base.css`, `site.css`, `app.css` |

После сохранения файла dev-сервер перезагружает страницу сам (HMR).

---

## Windows: один скрипт вместо команд

В проекте лежат `install.ps1` и `start.cmd` — они делают всё сами: проверяют Node.js, ставят
зависимости, проверяют сборку, запускают сервер и открывают браузер. Если что-то падает —
пишут по-русски, что именно и что делать.

**Способ 1 — двойной клик:** распакуй архив и дважды кликни **`start.cmd`**.

**Способ 2 — PowerShell** (из папки проекта):

```powershell
powershell -ExecutionPolicy Bypass -File install.ps1
```

**Способ 3 — скачать и запустить одной строкой** (скачивает архив в текущую папку,
распаковывает в `slurp`, запускает установщик):

```powershell
curl.exe -L https://github.com/slurppcrack/slurppcrack/archive/refs/heads/arena/630fbf79-slurppcrack.zip -o slurp.zip; Expand-Archive -Force slurp.zip -DestinationPath .; cd slurppcrack-arena-630fbf79-slurppcrack; powershell -ExecutionPolicy Bypass -File install.ps1
```
