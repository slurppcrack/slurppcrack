# SLURP

> Код по разговору. Нативное приложение для вайбкодинга на C# / .NET 8 / WPF.

Агент открывает твою папку с проектом, читает файлы, правит их на диске, запускает сборку и тесты.
Модель любая: Claude, GPT-5, Gemini, DeepSeek, Kimi, Qwen, Mistral, OpenRouter — или локальная через
Ollama / LM Studio. Свои ключи, без посредников.

## Скачать и запустить

| Что | Файл |
| --- | --- |
| Приложение (исходники + сборка в один клик) | [`public/download/SLURP-Windows-r2.zip`](public/download/SLURP-Windows-r2.zip) |
| Готовый бинарник после локальной сборки | `public/download/SLURP.exe` (`npm run build:win` на Windows) |

1. Распакуй архив, например в `D:\SLURP`.
2. Двойной клик по **`BUILD-WINDOWS.bat`** — скрипт поставит .NET SDK 8 через winget, если его нет,
   и выполнит `dotnet publish -c Release -r win-x64`.
3. Рядом появится **`SLURP.exe`** и сразу откроется. Дальше exe автономен: .NET внутри,
   Node.js и права администратора не нужны.

Готового `.exe` в репозитории нет намеренно: WPF компилируется только с Windows-таргетингом, а хост,
где собирался сайт, — Linux без .NET SDK. Никаких заглушек с расширением `.exe` здесь не лежит.

## Что внутри приложения

- **Чат-харнесс** — стриминг ответа, журнал инструментов, счётчик шагов и стоимости, стоп по Esc.
- **Настоящие инструменты** — `list_files`, `read_file`, `grep`, `write_file`, `apply_patch`, `run_command`
  в пределах выбранной папки; выход за её границы блокируется.
- **Автономность** — Ask (подтверждать каждую запись и команду), Auto (файлы сам, shell подтверждай),
  Yolo (ничего не спрашивать).
- **Настройки** — модели и провайдеры, поведение (хирург / архитектор / гонщик / ментор / свои правила),
  лимит шагов, температура, проверка ключа запросом к `/models`.
- **Ключи** — `%APPDATA%\SLURP\settings.json`, шифрование Windows DPAPI под текущего пользователя.
- **Первый запуск** — онбординг: модель → ключ → папка.

## Структура

```
desktop/Slurp.Desktop/     приложение C#/WPF (net8.0-windows, single-file publish)
  MainWindow.xaml(.cs)     окно: сессии, чат, журнал инструментов, онбординг
  SettingsWindow.xaml(.cs) модели, провайдеры, ключи, поведение агента
  Agent.cs                 цикл: модель → инструменты → результат → снова
  Llm.cs                   стриминг OpenAI-совместимых API и Anthropic Messages
  Tools.cs                 файловые и shell-инструменты с защитой путей
  SettingsStore.cs         настройки + DPAPI-шифрование ключей
BUILD-WINDOWS.bat          сборка SLURP.exe одним двойным кликом
scripts/build-wpf.mjs      dotnet publish → public/download/SLURP.exe + SHA256.txt
scripts/pack-windows.mjs   исходники + bat → public/download/SLURP-Windows-r2.zip
src/pages/                 Landing, Download, Harness, Settings, Onboarding (сайт)
src/lib/                   models, plugins, store, app-info, llm (веб-демо)
```

## Сайт и разработка

```bash
npm install
npm run dev         # http://localhost:5173
npm run build       # tsc --noEmit + vite build
npm run build:app   # пересобрать ZIP для скачивания
npm run build:win   # собрать public/download/SLURP.exe (нужен .NET SDK 8)
```

Стек сайта: React 18 + TypeScript + Vite, своя дизайн-система без UI-китов, self-hosted variable-шрифты.
Стек приложения: .NET 8, WPF, System.Text.Json, HttpClient (SSE), DPAPI, `PublishSingleFile`.

Подробная пошаговая инструкция — в [RUN.md](RUN.md).
