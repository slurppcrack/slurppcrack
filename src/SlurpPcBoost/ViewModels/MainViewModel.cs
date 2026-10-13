using System.Windows.Input;
using SlurpPcBoost.Mvvm;
using SlurpPcBoost.Services;

namespace SlurpPcBoost.ViewModels;

/// <summary>Вью-модель главного окна: навигация и общие команды в шапке.</summary>
public sealed class MainViewModel : ObservableObject
{
    public MainViewModel(AppState state)
    {
        State = state;

        NavigateCommand = new RelayCommand(parameter =>
        {
            if (parameter is string page && page.Length > 0)
            {
                State.ActivePage = page;
            }
        });

        ScanCommand = new AsyncRelayCommand(State.ScanAsync, () => !State.IsBusy && !State.IsScanning);
        ApplyRecommendedCommand = new AsyncRelayCommand(State.ApplyRecommendedAsync, () => !State.IsBusy);
        ToggleGameModeCommand = new AsyncRelayCommand(State.ToggleGameModeAsync, () => !State.IsBusy);
        ToggleAutoModeCommand = new RelayCommand(() => State.IsAutoMode = !State.IsAutoMode);

        Dashboard = new DashboardViewModel(state);
        Optimize = new OptimizeViewModel(state);
        Games = new GamesViewModel(state);
        Settings = new SettingsViewModel(state);
        Log = new LogViewModel(state);
    }

    public AppState State { get; }

    public DashboardViewModel Dashboard { get; }

    public OptimizeViewModel Optimize { get; }

    public GamesViewModel Games { get; }

    public SettingsViewModel Settings { get; }

    public LogViewModel Log { get; }

    public ICommand NavigateCommand { get; }

    public ICommand ScanCommand { get; }

    public ICommand ApplyRecommendedCommand { get; }

    public ICommand ToggleGameModeCommand { get; }

    public ICommand ToggleAutoModeCommand { get; }
}
