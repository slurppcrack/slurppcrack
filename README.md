# SLURP

> Код по разговору. Среда для вайбкодинга в духе OpenCode / DeepSeek harness.

Агент читает репозиторий, пишет план, правит файлы, гоняет тесты и показывает диффы.
Модель любая: Claude, GPT-5, Gemini, DeepSeek, Kimi, Qwen, Grok, Mistral, OpenRouter —
или локальная через Ollama. Свои ключи, без посредников.

## Скачать

| Что | Файл | Вес |
| --- | --- | --- |
| **Приложение для Windows** | [`public/download/SLURP.exe`](public/download/SLURP.exe) | 915 КБ |
| То же самое одним HTML-файлом (любая ОС) | [`public/download/SLURP.html`](public/download/SLURP.html) | 841 КБ |

Запуск: скачать → двойной клик. Внутри уже всё (интерфейс, движок агента, шрифты).
Node.js, установщик, интернет и права администратора не нужны.
SmartScreen покажет «Неизвестный издатель» — файл не подписан платным сертификатом:
**Подробнее → Выполнить в любом случае**. Контрольные суммы — в `public/download/SHA256.txt`.

## Что внутри приложения

- **Харнесс** — прогон задачи: рассуждение → план → вызовы инструментов → диффы → тесты → итог со стоимостью.
  Слэш-команды (`/model`, `/undo`, `/cost`), ⌘K-палитра, подтверждение записи, метры контекста и бюджета.
- **Настройки** — модели (главная + дешёвый субагент), персона и правила, ключи провайдеров,
  права 12 инструментов, плагины, тема (6 акцентов, плотность, размеры шрифтов), приватность.
- **Визард первого запуска** — 8 шагов с живым предпросмотром каждого выбора.
- **Живой режим** — вставил ключ провайдера, и запросы идут в реальный API (SSE-стриминг).

Чего пока нет: доступа к реальным файлам на диске (инструменты симулированы — диффы выглядят
правильно, файлы не меняются) и нативного окна. Это следующий шаг, интерфейс и движок к нему готовы.

## Структура

```
public/download/       готовые сборки: SLURP.exe, SLURP.html, SHA256.txt
native/launcher.c      запускатор для .exe: распаковывает HTML во %TEMP% и открывает браузер
scripts/build-single.mjs   собирает один самодостаточный HTML
scripts/build-exe.mjs      приклеивает HTML к .exe (stub + payload + футер SLURPEXE)
src/pages/             Landing, Download, Harness, Settings, Onboarding
src/lib/               models, plugins, store, agent (движок прогона), llm (стриминг), app-info
src/styles/            base.css, site.css, app.css
```

## Разработка

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # типы + прод-сборка в dist/
npm run build:app   # пересобрать public/download/SLURP.html + SLURP.exe + SHA256.txt
```

Стек: React 18 + TypeScript + Vite, своя дизайн-система без UI-китов, self-hosted variable-шрифты.

## Как собирается .exe

`native/launcher.c` — 120 строк на C: читает сам себя, находит в конце футер `SLURPEXE`,
достаёт HTML-payload, пишет его во `%TEMP%` и открывает браузером. Сборка кросс-компилятором:

```bash
zig cc -target x86_64-windows-gnu -O2 -s -Wl,--subsystem,windows \
       -o native/SLURP-stub.exe native/launcher.c -lshell32 -luser32
```

`npm run build:app` дописывает HTML к стабу и проверяет, что payload читается обратно байт в байт.
