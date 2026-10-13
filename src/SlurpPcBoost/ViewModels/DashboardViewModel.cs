using System.Diagnostics;
using System.IO;
using System.Windows.Input;
using SlurpPcBoost.Models;
using SlurpPcBoost.Mvvm;
using SlurpPcBoost.Services;

using Path = System.IO.Path;

namespace SlurpPcBoost.ViewModels;

/// <summary>Страница «Обзор системы».</summary>
public sealed class DashboardViewModel : ViewModelBase
{
    public DashboardViewModel(AppState state) : base(state)
    {
        ScanCommand = new AsyncRelayCommand(State.ScanAsync, () => !State.IsBusy && !State.IsScanning);
        ApplyRecommendedCommand = new AsyncRelayCommand(State.ApplyRecommendedAsync, () => !State.IsBusy);
        ApplyAllCommand = new AsyncRelayCommand(State.ApplyAllAsync, () => !State.IsBusy);
        RevertAllCommand = new AsyncRelayCommand(State.RevertAllAsync, () => !State.IsBusy);
        ToggleGameModeCommand = new AsyncRelayCommand(State.ToggleGameModeAsync, () => !State.IsBusy);
        TogglePauseCommand = new RelayCommand(State.TogglePause);
        ToggleAutoModeCommand = new RelayCommand(() => State.IsAutoMode = !State.IsAutoMode);
        ResetStatsCommand = new RelayCommand(State.ResetStats);
        OpenLogCommand = new RelayCommand(() => State.ActivePage = "logs");
        OpenOptimizeCommand = new RelayCommand(() => State.ActivePage = "optimize");

        InfoItems = BuildInfoItems(state);
    }

    public IReadOnlyList<InfoItem> InfoItems { get; }

    public string DeviceHeadline => State.System.MachineName;

    public string DeviceSubline => State.System.DeviceSummary;

    public string UserLine => $"Пользователь: {State.System.UserName}" +
                              (State.System.IsElevated ? " • права администратора" : " • обычные права");

    public string DemoBadgeText => "ДЕМО-РЕЖИМ";

    public bool HasProgress => State.OptimizationPercent > 0;

    public string OptimizationCaption => State.AppointedCount == 0
        ? "Профиль не применён"
        : $"{State.AppliedCountText} твиков • {State.ProgressSummary}";

    public ICommand ScanCommand { get; }

    public ICommand ApplyRecommendedCommand { get; }

    public ICommand ApplyAllCommand { get; }

    public ICommand RevertAllCommand { get; }

    public ICommand ToggleGameModeCommand { get; }

    public ICommand TogglePauseCommand { get; }

    public ICommand ToggleAutoModeCommand { get; }

    public ICommand ResetStatsCommand { get; }

    public ICommand OpenLogCommand { get; }

    public ICommand OpenOptimizeCommand { get; }

    private static IReadOnlyList<InfoItem> BuildInfoItems(AppState state)
    {
        var s = state.System;
        return new List<InfoItem>
        {
            new("Процессор", s.CpuName, $"{s.Threads} логических ядер"),
            new("Видеокарта", s.GpuName, "Основной адаптер"),
            new("Оперативная память", s.RamText, "Объём физической памяти"),
            new("Операционная система", s.OsName, s.OsArch),
            new($"Диск {s.SystemDrive}", s.DriveFreeText, "Системный раздел"),
            new("Время работы", s.UptimeText, "С последней перезагрузки"),
            new("Имя ПК", s.MachineName, s.UserName),
            new("Версия приложения", s.AppVersionText, "Slurp PC Boost"),
        };
    }

    /// <summary>Открыть папку с журналом в проводнике (необязательное действие в настройках).</summary>
    public static void OpenLogFolder()
    {
        var dir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "SlurpPCBoost",
            "logs");

        try
        {
            Directory.CreateDirectory(dir);
            Process.Start(new ProcessStartInfo { FileName = dir, UseShellExecute = true });
        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex);
        }
    }
}
