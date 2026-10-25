# ============================================================
#  SLURP — установка и запуск на Windows одним скриптом
#  Запуск:  powershell -ExecutionPolicy Bypass -File install.ps1
# ============================================================
$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $root

function Say($text, $color = 'Gray') { Write-Host $text -ForegroundColor $color }
function Ok($text)   { Write-Host "[ OK ] $text" -ForegroundColor Green }
function Warn($text) { Write-Host "[ !! ] $text" -ForegroundColor Yellow }
function Bad($text)  { Write-Host "[ XX ] $text" -ForegroundColor Red }
function Rule()      { Write-Host ("-" * 62) -ForegroundColor DarkGray }

Clear-Host
Say ""
Say "   SLURP  -  agentic coding environment" 'White'
Say "   установка и запуск на Windows" 'DarkGray'
Rule
Say ""

# ---------- 1. Node.js ----------
Say "1/4  Проверяю Node.js..." 'Cyan'
$node = Get-Command node -ErrorAction SilentlyContinue
$npm  = Get-Command npm  -ErrorAction SilentlyContinue

if (-not $node -or -not $npm) {
  Bad "Node.js не найден."
  Say ""
  Say "  Нужен Node.js 20 LTS. Установить можно так:" 'Gray'
  Say "    winget install OpenJS.NodeJS.LTS" 'White'
  Say ""
  Say "  Или скачай установщик вручную: https://nodejs.org" 'Gray'
  Say "  После установки ЗАКРОЙ это окно, открой новое и запусти скрипт снова." 'Gray'
  Say ""
  $ans = Read-Host "Попробовать установить через winget сейчас? (y/n)"
  if ($ans -eq 'y') {
    try {
      winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
      Warn "Установка завершена. Перезапусти терминал и запусти этот скрипт снова."
    } catch {
      Bad "winget не сработал: $($_.Exception.Message)"
      Say "  Поставь Node вручную с https://nodejs.org и вернись сюда." 'Gray'
    }
  }
  Say ""
  Read-Host "Нажми Enter, чтобы закрыть"
  exit 1
}

$ver = (& node -v).Trim()
Ok "Node.js $ver"
$major = [int](($ver -replace '^v','') -split '\.')[0]
if ($major -lt 18) {
  Bad "Слишком старая версия Node ($ver). Нужна 18.17 или новее (лучше 20 LTS)."
  Say "  Скачай новую с https://nodejs.org - старая не даст собрать проект." 'Gray'
  Read-Host "Нажми Enter, чтобы закрыть"
  exit 1
}
try { $npmVer = (& npm -v).Trim(); Ok "npm $npmVer" } catch { Warn "npm не ответил на 'npm -v', но продолжаем" }

# ---------- 2. Зависимости ----------
Say ""
Say "2/4  Ставлю зависимости (20-60 секунд, качается ~110 МБ)..." 'Cyan'
if (Test-Path "node_modules") {
  Ok "node_modules уже есть - пропускаю"
} else {
  & npm install --no-audit --no-fund 2>&1 | ForEach-Object { Write-Host "   $_" -ForegroundColor DarkGray }
  if ($LASTEXITCODE -ne 0) {
    Bad "npm install завершился с ошибкой (код $LASTEXITCODE)."
    Say ""
    Say "  Что делать по тексту ошибки выше:" 'Gray'
    Say "   EPERM / EACCES          -> не запускай от администратора и не держи проект в C:\Program Files" 'Gray'
    Say "   ECONNRESET / ETIMEDOUT  -> сеть/прокси/антивирус. Попробуй: npm config set registry https://registry.npmmirror.com" 'Gray'
    Say "   ERESOLVE                -> npm install --legacy-peer-deps" 'Gray'
    Say "   выполнения сценариев    -> npm.cmd install" 'Gray'
    Say ""
    Read-Host "Нажми Enter, чтобы закрыть"
    exit 1
  }
  Ok "Зависимости установлены"
}

# ---------- 3. Проверка сборки ----------
Say ""
Say "3/4  Проверяю, что проект собирается..." 'Cyan'
& npx vite build 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Warn "Сборка не прошла, но dev-сервер может всё равно работать - пробую запустить."
} else {
  Ok "Сборка проходит"
}

# ---------- 4. Запуск ----------
Say ""
Say "4/4  Запускаю сервер..." 'Cyan'
Say ""
Rule
Say "  Адрес:  http://localhost:5173" 'White'
Say "  Стоп:   Ctrl + C в этом окне" 'DarkGray'
Rule
Say ""

Start-Job -ScriptBlock {
  Start-Sleep -Seconds 6
  try { Start-Process "http://localhost:5173" } catch {}
} | Out-Null

& npm run dev
$code = $LASTEXITCODE
Say ""
if ($code -ne 0) {
  Bad "Сервер завершился с кодом $code."
  Say "  Частые причины: порт 5173 занят (запусти: npm run dev -- --port 5174)" 'Gray'
  Say "                  или политика PowerShell блокирует npm (используй: npm.cmd run dev)" 'Gray'
  Read-Host "Нажми Enter, чтобы закрыть"
}
