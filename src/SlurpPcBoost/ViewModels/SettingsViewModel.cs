using System.Windows.Input;
using SlurpPcBoost.Mvvm;
using SlurpPcBoost.Services;

namespace SlurpPcBoost.ViewModels;

/// <summary>Страница «Настройки».</summary>
public sealed class SettingsViewModel : ViewModelBase
{
    private string _preset = "Сбалансированный";

    public SettingsViewModel(AppState state) : base(state)
    {
        TogglePauseCommand = new RelayCommand(State.TogglePause);
        ToggleAutoModeCommand = new RelayCommand(() => State.IsAutoMode = !State.IsAutoMode);
        ToggleGameModeCommand = new AsyncRelayCommand(State.ToggleGameModeAsync, () => !State.IsBusy);
        ResetStatsCommand = new RelayCommand(State.ResetStats);
        SaveLogCommand = new RelayCommand(State.SaveLog);
        ClearLogCommand = new RelayCommand(State.ClearLog);
        OpenLogFolderCommand = new RelayCommand(DashboardViewModel.OpenLogFolder);
        RevertAllCommand = new AsyncRelayCommand(State.RevertAllAsync, () => !State.IsBusy);
    }

    public IReadOnlyList<string> Presets { get; } = new[]
    {
        "Сбалансированный",
        "Максимальный FPS",
        "Тихий режим",
    };

    /// <summary>Выбранный профиль. В демо-режиме только записывается в журнал.</summary>
    public string Preset
    {
        get => _preset;
        set
        {
            if (SetProperty(ref _preset, value))
            {
                State.Log.Info($"Выбран профиль оптимизации: «{value}»");
            }
        }
    }

    public string DeviceHeadline => $"{State.System.MachineName} • {State.System.OsName}";

    public string DeviceSubline => State.System.DeviceSummary;

    public string PrivilegesText => State.System.IsElevated
        ? "Приложение запущено с правами администратора — доступны системные твики"
        : "Приложение запущено с обычными правами — системные твики были бы недоступны";

    public string DemoText =>
        "ДЕМО-РЕЖИМ включён: приложение ничего не меняет в системе — ни реестр, ни службы, " +
        "ни настройки сети. Все действия только имитируются и записываются в журнал.";

    public string RealModeHint =>
        "Чтобы превратить демо в настоящий оптимизатор, подключите реальные действия в " +
        "OptimizationEngine (реестр, службы Windows, схемы питания) и запросите права " +
        "администратора в app.manifest.";

    public ICommand TogglePauseCommand { get; }

    public ICommand ToggleAutoModeCommand { get; }

    public ICommand ToggleGameModeCommand { get; }

    public ICommand ResetStatsCommand { get; }

    public ICommand SaveLogCommand { get; }

    public ICommand ClearLogCommand { get; }

    public ICommand OpenLogFolderCommand { get; }

    public ICommand RevertAllCommand { get; }
}
