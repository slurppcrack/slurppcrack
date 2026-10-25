# SLURP — как запустить

SLURP — нативное приложение для Windows на **C# / .NET 8 / WPF**. Оно открывает папку с проектом,
читает и правит настоящие файлы на диске, запускает сборку и тесты. Никакой браузерной обёртки.

## 1. Получить приложение (Windows 10/11, x64)

1. Скачай `SLURP-Windows.zip` с сайта (кнопка «Скачать») или возьми папку `desktop/Slurp.Desktop`
   прямо из этого репозитория.
2. Распакуй в любую папку, например `D:\SLURP`.
3. Двойной клик по **`BUILD-WINDOWS.bat`**:
   - проверяет .NET SDK 8, при отсутствии ставит его через `winget`;
   - выполняет `dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true`;
   - копирует результат в `SLURP.exe` рядом с bat и запускает его.
4. Дальше запускай **`SLURP.exe`** — он автономный: .NET внутри, Node.js и права администратора не нужны.

Вручную то же самое:

```powershell
cd desktop\Slurp.Desktop
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true
# результат: bin\Release\net8.0-windows\win-x64\publish\SLURP.exe
```

> Готового `SLURP.exe` в репозитории нет намеренно: WPF компилируется только с Windows-таргетингом,
> а сборочный хост — Linux без .NET SDK. Скрипт делает ровно эту сборку одной командой.

## 2. Первый запуск

- **Модель** — в шапке окна: Claude 4.5, GPT-5, DeepSeek V3.2 / R1, Gemini 2.5 Pro, Kimi K2, Qwen3 Coder,
  Mistral Medium 3, OpenRouter, локальные Ollama и LM Studio.
- **Ключ** — Настройки → Провайдеры и ключи. Шифруется Windows DPAPI, лежит в
  `%APPDATA%\SLURP\settings.json`. Там же кнопка «проверить» — дёргает `/models` у провайдера.
- **Папка** — Ctrl+O. Все инструменты ограничены этой папкой: выход за её пределы блокируется.
- **Автономность** — Ask (всё подтверждать), Auto (файлы сам, shell подтверждай), Yolo (ничего не спрашивать).
- **Горячие клавиши** — Ctrl+Enter отправить, Esc остановить, Ctrl+O выбрать папку.

## 3. Что умеет агент

| Инструмент | Что делает |
| --- | --- |
| `list_files` | обход папки по glob (`**/*.cs`), без `node_modules`, `.git`, `bin`, `obj` |
| `read_file` | чтение с номерами строк и диапазоном |
| `grep` | поиск регулярки по файлам, `путь:строка:текст` |
| `write_file` | создание / полная перезапись |
| `apply_patch` | точечная замена `old` → `new`, диф минимальный |
| `run_command` | `cmd.exe` в рабочей папке: сборка, тесты, git |

Каждый вызов пишется в журнал слева. Цикл: прочитать → поправить → проверить → отчитаться,
до 40 шагов на задачу (меняется в настройках).

## 4. Сайт

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc --noEmit + vite build
```

Пересборка того, что отдаётся на скачивание:

```bash
npm run build:app   # → public/download/SLURP-Windows.zip (исходники + BUILD-WINDOWS.bat)
npm run build:win   # → public/download/SLURP.exe (нужен .NET SDK 8; на Windows)
```

После `npm run build:win` в `src/lib/app-info.ts` можно переключить `EXE_READY` на `true` —
кнопка на сайте начнёт отдавать готовый бинарник вместо архива с исходниками.

## Частые проблемы

| Симптом | Что делать |
| --- | --- |
| `dotnet: не является внутренней командой` | bat сам ставит SDK; если winget недоступен — поставь .NET SDK 8 с dotnet.microsoft.com и запусти bat снова |
| Ошибка NuGet при первой сборке | нужен интернет: подтягиваются Windows Desktop targeting pack и System.Security.Cryptography.ProtectedData |
| SmartScreen «Неизвестный издатель» | файл собран локально и не подписан платным сертификатом — «Подробнее» → «Выполнить в любом случае» |
| 401 от провайдера | неверный ключ: Настройки → «проверить» рядом с провайдером |
| Агент пишет «путь вне рабочей папки» | инструменты не выходят за пределы выбранной папки — это защита, а не баг |
