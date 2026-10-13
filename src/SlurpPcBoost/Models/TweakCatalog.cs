namespace SlurpPcBoost.Models;

/// <summary>Каталог твиков: категории и список параметров оптимизации.</summary>
public static class TweakCatalog
{
    public const string Cpu = "Процессор";
    public const string Ram = "Память";
    public const string Gpu = "Видеокарта";
    public const string Net = "Сеть";
    public const string Windows = "Windows";
    public const string Game = "Игровой режим";

    public static IReadOnlyList<CategoryInfo> Categories { get; } = new List<CategoryInfo>
    {
        new(Cpu, "#FF9A3D"),
        new(Ram, "#4FC3F7"),
        new(Gpu, "#A97BFF"),
        new(Net, "#3EDC97"),
        new(Windows, "#FFD166"),
        new(Game, "#FF6FB5"),
    };

    public static System.Windows.Media.SolidColorBrush BrushFor(string category)
        => Categories.FirstOrDefault(c => c.Name == category)?.Brush ?? Categories[0].Brush;

    public static List<Tweak> CreateDefaultTweaks() => new()
    {
        // ── Процессор ─────────────────────────────────────────────────────────
        new Tweak
        {
            Id = "cpu.priority",
            Title = "Высокий приоритет игры в планировщике",
            Description = "Игровой процесс получает приоритет у планировщика Windows, фоновые задачи уходят на второй план.",
            Category = Cpu,
            ImpactPercent = 5,
            Risk = TweakRisk.Safe,
        },
        new Tweak
        {
            Id = "cpu.no-parking",
            Title = "Отключить парковку ядер (C-State parking)",
            Description = "Все ядра остаются активными, убирая микрофризы в момент скачков нагрузки.",
            Category = Cpu,
            ImpactPercent = 3,
            Risk = TweakRisk.Safe,
        },
        new Tweak
        {
            Id = "cpu.power-plan",
            Title = "Схема питания «Максимальная производительность»",
            Description = "Снимает лимит частоты процессора и запрещает снижение частоты во время игры.",
            Category = Cpu,
            ImpactPercent = 4,
            Risk = TweakRisk.Safe,
        },
        new Tweak
        {
            Id = "cpu.background-services",
            Title = "Приостановить SysMain и Windows Search",
            Description = "Индексация и предвыборка перестают нагружать диски и CPU во время игры.",
            Category = Cpu,
            ImpactPercent = 3,
            Risk = TweakRisk.Advanced,
        },

        // ── Память ────────────────────────────────────────────────────────────
        new Tweak
        {
            Id = "ram.standby-cache",
            Title = "Очистка standby-кэша и рабочего набора",
            Description = "Освобождает зарезервированную память перед запуском тяжёлой игры.",
            Category = Ram,
            ImpactPercent = 2,
            Risk = TweakRisk.Safe,
        },
        new Tweak
        {
            Id = "ram.prefetch",
            Title = "Отключить Prefetch / Superfetch",
            Description = "Меньше обращений к диску при старте игры и переключении сцен.",
            Category = Ram,
            ImpactPercent = 2,
            Risk = TweakRisk.Advanced,
        },
        new Tweak
        {
            Id = "ram.memory-scheduler",
            Title = "Оптимизировать планировщик памяти",
            Description = "Приоритет приложений в рабочем наборе вместо системного кэша.",
            Category = Ram,
            ImpactPercent = 2,
            Risk = TweakRisk.Safe,
        },

        // ── Видеокарта ────────────────────────────────────────────────────────
        new Tweak
        {
            Id = "gpu.msi-mode",
            Title = "MSI-режим прерываний для видеокарты",
            Description = "Прерывания обрабатываются без задержек — заметнее всего в киберспортивных шутерах.",
            Category = Gpu,
            ImpactPercent = 6,
            Risk = TweakRisk.Advanced,
        },
        new Tweak
        {
            Id = "gpu.max-perf",
            Title = "Форсировать максимальную производительность GPU",
            Description = "Видеокарта не сбрасывает частоты между кадрами, меньше «просадок» 1% low.",
            Category = Gpu,
            ImpactPercent = 4,
            Risk = TweakRisk.Advanced,
        },
        new Tweak
        {
            Id = "gpu.hags",
            Title = "Аппаратное планирование GPU (HAGS)",
            Description = "Планирование кадров передаётся видеокарте, снижая нагрузку на CPU.",
            Category = Gpu,
            ImpactPercent = 3,
            Risk = TweakRisk.Safe,
        },
        new Tweak
        {
            Id = "gpu.telemetry",
            Title = "Отключить сервисы телеметрии GPU",
            Description = "Фоновые сборщики статистики драйвера перестают вмешиваться в кадры.",
            Category = Gpu,
            ImpactPercent = 2,
            Risk = TweakRisk.Advanced,
        },

        // ── Сеть ──────────────────────────────────────────────────────────────
        new Tweak
        {
            Id = "net.flush",
            Title = "Сброс кэша DNS и стека TCP/IP",
            Description = "Чистый сетевой стек после месяцев аптайма — меньше задержка в онлайн-играх.",
            Category = Net,
            ImpactPercent = 2,
            Risk = TweakRisk.Safe,
        },
        new Tweak
        {
            Id = "net.nagle",
            Title = "Отключить алгоритм Nagle (TcpAckFrequency)",
            Description = "Пакеты отправляются сразу, а не пачками — минус задержка ввода на сервере.",
            Category = Net,
            ImpactPercent = 3,
            Risk = TweakRisk.Advanced,
        },
        new Tweak
        {
            Id = "net.adapter-power",
            Title = "Запретить отключение сетевого адаптера",
            Description = "Windows не «усыпляет» сетевую карту при простое — нет лагов на старте матча.",
            Category = Net,
            ImpactPercent = 2,
            Risk = TweakRisk.Safe,
        },

        // ── Windows ───────────────────────────────────────────────────────────
        new Tweak
        {
            Id = "win.visual-effects",
            Title = "Отключить лишние визуальные эффекты",
            Description = "Прозрачность, тени и анимации окон не отъедают ресурсы во время игры.",
            Category = Windows,
            ImpactPercent = 3,
            Risk = TweakRisk.Safe,
        },
        new Tweak
        {
            Id = "win.telemetry",
            Title = "Выключить телеметрию и фоновые задачи",
            Description = "DiagTrack и запланированные задачи перестают просыпаться во время игры.",
            Category = Windows,
            ImpactPercent = 2,
            Risk = TweakRisk.Advanced,
        },
        new Tweak
        {
            Id = "win.autostart",
            Title = "Подчистить автозагрузку",
            Description = "Из старта убираются апдейтеры и лаунчеры, которые не нужны во время игры.",
            Category = Windows,
            ImpactPercent = 3,
            Risk = TweakRisk.Safe,
        },

        // ── Игровой режим ─────────────────────────────────────────────────────
        new Tweak
        {
            Id = "game.mode",
            Title = "Включить игровой режим Windows",
            Description = "Система приостанавливает обновления и фоновые процессы на время матча.",
            Category = Game,
            ImpactPercent = 3,
            Risk = TweakRisk.Safe,
        },
        new Tweak
        {
            Id = "game.dvr",
            Title = "Отключить Game DVR и запись Xbox Game Bar",
            Description = "Фоновая запись видео забирает до нескольких процентов FPS в тяжёлых сценах.",
            Category = Game,
            ImpactPercent = 4,
            Risk = TweakRisk.Safe,
        },
        new Tweak
        {
            Id = "game.notifications",
            Title = "Не отвлекать во время игры",
            Description = "Уведомления и лишние оверлеи не крадут фокус и не вызывают просадки кадров.",
            Category = Game,
            ImpactPercent = 2,
            Risk = TweakRisk.Safe,
        },
    };
}
