using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Media;
using System.Windows.Threading;
using SlurpPcBoost.Models;
using SlurpPcBoost.Mvvm;

namespace SlurpPcBoost.Services;

/// <summary>
/// Центральное состояние приложения: данные каталога, прогресс оптимизации,
/// живые метрики (FPS и загрузка) и журнал. Вью-модели страниц обращаются к нему.
/// </summary>
public sealed class AppState : ObservableObject
{
    private const double MaxBoost = OptimizationEngine.MaxBoostPercent;

    private readonly FpsMonitor _fps = new();
    private readonly OptimizationEngine _engine;
    private readonly DispatcherTimer _timer;
    private readonly Random _random = new();

    private string _activePage = "dashboard";
    private bool _isBusy;
    private string _busyText = "Работаем…";
    private bool _isScanning;
    private double _scanProgress;
    private string _statusText = "Готово к работе";
    private bool _isGameMode;
    private bool _isAutoMode;
    private bool _isPaused;
    private bool _hasScanned;
    private int _monitorTick;
    private double _baselineFps = 62;
    private double _peakFps;
    private double _cpuLoad = 42;
    private double _gpuLoad = 55;
    private double _ramLoad = 47;

    public AppState(CatalogService catalog, AppLogService log, IDialogService dialogs)
    {
        Catalog = catalog;
        Log = log;
        Dialogs = dialogs;
        System = SystemInfoService.Load();

        Tweaks = new ObservableCollection<Tweak>(catalog.Tweaks);
        Games = new ObservableCollection<GameProfile>(catalog.Games);
        Groups = catalog.Categories
            .Select(c => new TweakGroup(c.Name, c.Brush, Tweaks.Where(t => t.Category == c.Name).ToList()))
            .ToList();

        foreach (var tweak in Tweaks)
        {
            tweak.StateChanged += OnTweakStateChanged;
        }

        _engine = new OptimizationEngine(log);
        _fps.Start();
        _fps.Recalculate(OptimizationEngine.BaselineScore);
        _baselineFps = Math.Round(_fps.Current);
        _peakFps = _baselineFps;

        _timer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(500) };
        _timer.Tick += OnTimerTick;
        _timer.Start();

        Log.Info($"Slurp PC Boost {System.AppVersionText} запущен");
        Log.Info($"Система: {System.OsName} • {System.DeviceSummary}");
        Log.Warning("Активен ДЕМО-РЕЖИМ: настройки системы не изменяются, сеть и реестр не затрагиваются");
    }

    public CatalogService Catalog { get; }

    public AppLogService Log { get; }

    public IDialogService Dialogs { get; }

    public SystemInfo System { get; }

    public ObservableCollection<Tweak> Tweaks { get; }

    public ObservableCollection<GameProfile> Games { get; }

    public IReadOnlyList<TweakGroup> Groups { get; }

    // ── Навигация и «занятость» ──────────────────────────────────────────────

    public string ActivePage
    {
        get => _activePage;
        set
        {
            if (SetProperty(ref _activePage, value))
            {
                OnPropertyChanged(nameof(IsDashboardPage));
                OnPropertyChanged(nameof(IsOptimizePage));
                OnPropertyChanged(nameof(IsGamesPage));
                OnPropertyChanged(nameof(IsSettingsPage));
                OnPropertyChanged(nameof(IsLogPage));
                OnPropertyChanged(nameof(PageTitle));
            }
        }
    }

    public bool IsDashboardPage => ActivePage == "dashboard";

    public bool IsOptimizePage => ActivePage == "optimize";

    public bool IsGamesPage => ActivePage == "games";

    public bool IsSettingsPage => ActivePage == "settings";

    public bool IsLogPage => ActivePage == "logs";

    public string PageTitle => ActivePage switch
    {
        "optimize" => "Оптимизация",
        "games" => "Игры",
        "settings" => "Настройки",
        "logs" => "Журнал событий",
        _ => "Обзор системы",
    };

    public bool IsBusy
    {
        get => _isBusy;
        private set
        {
            if (SetProperty(ref _isBusy, value))
            {
                OnPropertyChanged(nameof(IsNotBusy));
            }
        }
    }

    public bool IsNotBusy => !IsBusy;

    public string BusyText
    {
        get => _busyText;
        private set => SetProperty(ref _busyText, value);
    }

    public string StatusText
    {
        get => _statusText;
        private set => SetProperty(ref _statusText, value);
    }

    public bool IsScanning
    {
        get => _isScanning;
        private set
        {
            if (SetProperty(ref _isScanning, value))
            {
                OnPropertyChanged(nameof(IsNotScanning));
            }
        }
    }

    public bool IsNotScanning => !IsScanning;

    public double ScanProgress
    {
        get => _scanProgress;
        private set => SetProperty(ref _scanProgress, value);
    }

    public bool IsGameMode
    {
        get => _isGameMode;
        private set
        {
            if (SetProperty(ref _isGameMode, value))
            {
                OnPropertyChanged(nameof(GameModeText));
            }
        }
    }

    public string GameModeText => IsGameMode ? "Игровой режим включён" : "Игровой режим выключен";

    public bool IsAutoMode
    {
        get => _isAutoMode;
        set
        {
            if (SetProperty(ref _isAutoMode, value))
            {
                Log.Info(value
                    ? "Авто-оптимизация включена: приложение будет следить за фоном"
                    : "Авто-оптимизация выключена");
            }
        }
    }

    public bool IsPaused
    {
        get => _isPaused;
        private set => SetProperty(ref _isPaused, value);
    }

    public bool HasScanned
    {
        get => _hasScanned;
        private set => SetProperty(ref _hasScanned, value);
    }

    // ── Прогресс оптимизации ────────────────────────────────────────────────

    public int AppointedCount => Tweaks.Count(t => t.IsApplied);

    public string AppliedCountText => $"{AppointedCount} / {Tweaks.Count}";

    public int BoostPercent => OptimizationEngine.BoostPercent(Tweaks);

    public string BoostPercentText => $"+{BoostPercent}%";

    public string MaxBoostText => $"+{MaxBoost:0}% FPS";

    public int OptimizationPercent => (int)Math.Round(BoostPercent / MaxBoost * 100);

    public string OptimizationPercentText => $"{OptimizationPercent}%";

    public bool HasAppliedTweaks => AppointedCount > 0;

    public string ProgressSummary => AppointedCount == 0
        ? "Оптимизация ещё не применялась"
        : $"{AppointedCount} из {Tweaks.Count} твиков активно • прирост ≈ {BoostPercentText} FPS";

    // ── FPS и живые метрики ─────────────────────────────────────────────────

    public double CurrentFps => Math.Round(_fps.Current);

    public double AverageFps => Math.Round(_fps.Average);

    public double OneLowFps => Math.Round(Math.Min(_fps.OnePercentLow, _fps.Current));

    public double MaxFps => Math.Round(Math.Max(_fps.Maximum, _fps.Current));

    public double BaselineFps => Math.Round(_baselineFps);

    public double PeakFps => Math.Round(_peakFps);

    public double PotentialFps { get; private set; } = 300;

    public string FpsStatusText => IsPaused
        ? "Мониторинг на паузе"
        : OneLowFps / Math.Max(AverageFps, 1) > 0.72
            ? "Стабильный фреймтайм"
            : "Есть просадки кадров";

    public PointCollection FpsHistoryPoints { get; private set; } = new();

    public PointCollection FpsAreaPoints { get; private set; } = new();

    public double CpuLoad => Math.Round(_cpuLoad);

    public double GpuLoad => Math.Round(_gpuLoad);

    public double RamLoad => Math.Round(_ramLoad);

    public string CpuLoadText => $"{CpuLoad:0}%";

    public string GpuLoadText => $"{GpuLoad:0}%";

    public string RamLoadText => $"{RamLoad:0}%";

    public string MonitorButtonText => IsPaused ? "Возобновить" : "Пауза";

    public string LastScanText => HasScanned
        ? $"Последнее сканирование: {DateTime.Now:HH:mm}"
        : "Сканирование ещё не запускалось";

    // ── Действия ────────────────────────────────────────────────────────────

    private async void OnTweakStateChanged(Tweak tweak, bool isApplied)
    {
        if (IsBusy)
        {
            return;
        }

        if (tweak.Risk == TweakRisk.Advanced && isApplied)
        {
            var confirmed = Dialogs.Confirm(
                "Продвинутый твик",
                $"«{tweak.Title}» относится к продвинутым настройкам.\n\n" +
                "В демо-версии система не изменяется, но в реальном приложении такие " +
                "твики стоит применять осознанно.\n\nПродолжить?");

            if (!confirmed)
            {
                tweak.SetAppliedSilently(false);
                return;
            }
        }

        await RunBusyAsync(
            $"{(isApplied ? "Применяем" : "Откатываем")} «{tweak.Title}»",
            async () =>
            {
                if (isApplied)
                {
                    await _engine.ApplyAsync(tweak);
                }
                else
                {
                    await _engine.RevertAsync(tweak);
                }
            },
            jumpToTarget: false);
    }

    public async Task ScanAsync()
    {
        if (IsScanning || IsBusy)
        {
            return;
        }

        IsScanning = true;
        ScanProgress = 0;
        StatusText = "Сканируем систему…";
        Log.Info("Сканирование: опрашиваем процессор, память, видеокарту и сеть");

        try
        {
            for (var step = 1; step <= 20; step++)
            {
                await Task.Delay(120);
                ScanProgress = step * 5;
                if (step == 6)
                {
                    Log.Detail($"{System.CpuName} • {System.Threads} потоков • {System.RamText}");
                }
                else if (step == 12)
                {
                    Log.Detail($"{System.GpuName} • {System.OsName}");
                }
            }

            // Базовая оценка — «как есть» до оптимизаций (та же шкала, что у монитора FPS).
            _baselineFps = Math.Round((30 + (OptimizationEngine.BaselineScore * 270)) + _random.Next(-6, 7));
            // 30 + 270 = 300 FPS — максимум демо-шкалы (Score01 == 1.0)
            PotentialFps = Math.Round(300.0 + _random.Next(-8, 9));
            _peakFps = Math.Max(_peakFps, _baselineFps);
            HasScanned = true;

            _fps.Recalculate(OptimizationEngine.Score01(Tweaks));
            RaiseFpsProperties();

            Log.Success($"Анализ завершён: базовая оценка ≈ {BaselineFps:0} FPS, потенциал до {PotentialFps:0} FPS");
            StatusText = "Анализ завершён";
        }
        catch (Exception ex)
        {
            Log.Error("Сканирование не удалось", ex);
            StatusText = "Ошибка сканирования";
        }
        finally
        {
            IsScanning = false;
        }
    }

    public Task ApplyRecommendedAsync()
    {
        var recommended = Tweaks.Where(t => t.Risk == TweakRisk.Safe && !t.IsApplied).ToList();
        if (recommended.Count == 0)
        {
            Log.Info("Рекомендованные твики уже применены — всё уже настроено");
            return Task.CompletedTask;
        }

        return RunBusyAsync(
            "Применяем рекомендованные твики",
            () => _engine.ApplyRangeAsync(recommended, OnBulkProgress),
            jumpToTarget: true);
    }

    public Task ApplyAllAsync()
    {
        var pending = Tweaks.Where(t => !t.IsApplied).ToList();
        if (pending.Count == 0)
        {
            Log.Info("Все твики уже применены");
            return Task.CompletedTask;
        }

        return RunBusyAsync(
            "Применяем все твики",
            () => _engine.ApplyRangeAsync(pending, OnBulkProgress),
            jumpToTarget: true);
    }

    public Task RevertAllAsync()
    {
        var applied = Tweaks.Where(t => t.IsApplied).ToList();
        if (applied.Count == 0)
        {
            Log.Info("Нечего откатывать — активных твиков нет");
            return Task.CompletedTask;
        }

        return RunBusyAsync(
            "Возвращаем настройки по умолчанию",
            async () =>
            {
                await _engine.RevertRangeAsync(applied, OnBulkProgress);
                IsGameMode = false;
            },
            jumpToTarget: true);
    }

    public Task ToggleGameModeAsync()
    {
        if (IsGameMode)
        {
            var safe = Tweaks.Where(t => t.Risk == TweakRisk.Safe && t.IsApplied).ToList();
            return RunBusyAsync(
                "Выключаем игровой режим",
                async () =>
                {
                    await _engine.RevertRangeAsync(safe, OnBulkProgress);
                    IsGameMode = false;
                    Log.Info("Игровой режим выключен: фоновые службы вернулись в обычное состояние");
                },
                jumpToTarget: true);
        }

        var recommended = Tweaks.Where(t => t.Risk == TweakRisk.Safe && !t.IsApplied).ToList();
        return RunBusyAsync(
            "Включаем игровой режим",
            async () =>
            {
                await _engine.ApplyRangeAsync(recommended, OnBulkProgress);
                IsGameMode = true;
                Log.Success("Игровой режим включён: уведомления, апдейтеры и телеметрия на паузе");
            },
            jumpToTarget: true);
    }

    public Task OptimizeGameAsync(GameProfile game)
    {
        if (game.IsOptimized)
        {
            return RunBusyAsync(
                $"Отключаем профиль «{game.Name}»",
                () => _engine.RevertGameProfileAsync(game),
                jumpToTarget: false);
        }

        var preset = game.Category.Contains("Battle Royale", StringComparison.OrdinalIgnoreCase)
            ? "Максимальный FPS"
            : "Киберспорт";

        return RunBusyAsync(
            $"Оптимизируем «{game.Name}»",
            () => _engine.ApplyGameProfileAsync(game, Tweaks, OnBulkProgress, preset),
            jumpToTarget: true);
    }

    public void TogglePause()
    {
        IsPaused = !IsPaused;
        OnPropertyChanged(nameof(MonitorButtonText));
        OnPropertyChanged(nameof(FpsStatusText));

        if (IsPaused)
        {
            _fps.Stop();
            Log.Warning("Мониторинг приостановлен");
        }
        else
        {
            _fps.Start();
            Log.Info("Мониторинг возобновлён");
        }
    }

    public void ResetStats()
    {
        _fps.ResetStats();
        _peakFps = Math.Max(BaselineFps, CurrentFps);
        RaiseFpsProperties();
        Log.Info("Статистика FPS сброшена");
    }

    public void SaveLog()
    {
        try
        {
            var path = Log.SaveToFile();
            Log.Success($"Журнал сохранён: {path}");
            Dialogs.Info("Журнал сохранён", $"Файл журнала:\n{path}");
        }
        catch (Exception ex)
        {
            Log.Error("Не удалось сохранить журнал", ex);
            Dialogs.Info("Ошибка", $"Не удалось сохранить журнал:\n{ex.Message}");
        }
    }

    public void ClearLog()
    {
        Log.Entries.Clear();
        Log.Info("Журнал очищен");
    }

    // ── Внутренняя механика ─────────────────────────────────────────────────

    private void SetTweaksEnabled(bool enabled)
    {
        foreach (var tweak in Tweaks)
        {
            tweak.IsEnabled = enabled;
        }
    }

    private void OnBulkProgress(Tweak tweak, int index, int total)
    {
        BusyText = $"{tweak.Title}  ({index}/{total})";
        StatusText = $"Применяем твики: {index} из {total}";
    }

    private async Task RunBusyAsync(string busyText, Func<Task> action, bool jumpToTarget)
    {
        if (IsBusy)
        {
            return;
        }

        IsBusy = true;
        BusyText = busyText;
        StatusText = busyText;
        SetTweaksEnabled(false);

        try
        {
            await action();
        }
        catch (Exception ex)
        {
            Log.Error("Операция прервана", ex);
        }
        finally
        {
            IsBusy = false;
            SetTweaksEnabled(true);
            StatusText = "Готово к работе";
            RaiseOptimizationProperties();
            RecalculateFps(jumpToTarget);
        }
    }

    private void RecalculateFps(bool jumpToTarget)
    {
        var score = OptimizationEngine.Score01(Tweaks);
        if (jumpToTarget)
        {
            _fps.Recalculate(score);
        }
        else
        {
            _fps.SetTargetScore(score);
        }

        _peakFps = Math.Max(_peakFps, _fps.Current);
        RaiseFpsProperties();
    }

    private void RaiseOptimizationProperties()
    {
        OnPropertyChanged(nameof(AppointedCount));
        OnPropertyChanged(nameof(AppliedCountText));
        OnPropertyChanged(nameof(BoostPercent));
        OnPropertyChanged(nameof(BoostPercentText));
        OnPropertyChanged(nameof(OptimizationPercent));
        OnPropertyChanged(nameof(OptimizationPercentText));
        OnPropertyChanged(nameof(ProgressSummary));
        OnPropertyChanged(nameof(MaxBoostText));
        OnPropertyChanged(nameof(HasAppliedTweaks));
        OnPropertyChanged(nameof(LastScanText));
    }

    private void RaiseFpsProperties()
    {
        OnPropertyChanged(nameof(CurrentFps));
        OnPropertyChanged(nameof(AverageFps));
        OnPropertyChanged(nameof(OneLowFps));
        OnPropertyChanged(nameof(MaxFps));
        OnPropertyChanged(nameof(BaselineFps));
        OnPropertyChanged(nameof(PeakFps));
        OnPropertyChanged(nameof(PotentialFps));
        OnPropertyChanged(nameof(FpsStatusText));
        OnPropertyChanged(nameof(FpsHistoryPoints));
        OnPropertyChanged(nameof(FpsAreaPoints));
        OnPropertyChanged(nameof(CpuLoad));
        OnPropertyChanged(nameof(GpuLoad));
        OnPropertyChanged(nameof(RamLoad));
        OnPropertyChanged(nameof(CpuLoadText));
        OnPropertyChanged(nameof(GpuLoadText));
        OnPropertyChanged(nameof(RamLoadText));
    }

    private void OnTimerTick(object? sender, EventArgs e)
    {
        _monitorTick++;

        if (!IsPaused)
        {
            var history = _fps.Tick();
            RebuildChart(history);
            _peakFps = Math.Max(_peakFps, _fps.Current);

            // Имитация снижения нагрузки по мере применения твиков.
            var score = OptimizationEngine.Score01(Tweaks);
            var targetCpu = 62 - (34 * score);
            var targetGpu = 72 - (20 * score);
            var targetRam = 58 - (16 * score);

            _cpuLoad = Smooth(_cpuLoad, targetCpu + Noise(4));
            _gpuLoad = Smooth(_gpuLoad, targetGpu + Noise(3));
            _ramLoad = Smooth(_ramLoad, targetRam + Noise(2.5));

            RaiseFpsProperties();
        }

        if (IsAutoMode && !IsBusy && _monitorTick % 60 == 0)
        {
            Log.Detail($"Авто-мониторинг: {FpsStatusText.ToLowerInvariant()}, твиков активно {AppointedCount}");
        }
    }

    private void RebuildChart(IReadOnlyList<double> history)
    {
        if (history.Count < 2)
        {
            return;
        }

        // Точки в системе координат 1000 x 100 (масштабируется вьюбоксом).
        var min = history.Min() - 6;
        var max = history.Max() + 6;
        var span = Math.Max(max - min, 1);

        var line = new PointCollection(history.Count);
        for (var i = 0; i < history.Count; i++)
        {
            var x = i / (double)(history.Count - 1) * 1000;
            var y = 92 - (((history[i] - min) / span) * 84);
            line.Add(new Point(x, y));
        }

        var area = new PointCollection(line) { new Point(1000, 100), new Point(0, 100) };

        line.Freeze();
        area.Freeze();

        FpsHistoryPoints = line;
        FpsAreaPoints = area;
    }

    private double Smooth(double current, double target) => current + ((target - current) * 0.25);

    private double Noise(double amplitude) => ((_random.NextDouble() * 2) - 1) * amplitude;
}
