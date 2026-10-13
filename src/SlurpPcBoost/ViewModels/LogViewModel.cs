using System.Windows.Input;
using SlurpPcBoost.Models;
using SlurpPcBoost.Mvvm;
using SlurpPcBoost.Services;

namespace SlurpPcBoost.ViewModels;

/// <summary>Страница «Журнал» — что делало приложение.</summary>
public sealed class LogViewModel : ViewModelBase
{
    public LogViewModel(AppState state) : base(state)
    {
        ClearCommand = new RelayCommand(State.ClearLog);
        SaveCommand = new RelayCommand(State.SaveLog);
        BackCommand = new RelayCommand(() => State.ActivePage = "dashboard");
        ToggleAutoModeCommand = new RelayCommand(() => State.IsAutoMode = !State.IsAutoMode);
    }

    public System.Collections.ObjectModel.ObservableCollection<LogEntry> Entries => State.Log.Entries;

    public int ErrorCount => State.Log.ErrorCount;

    public ICommand ClearCommand { get; }

    public ICommand SaveCommand { get; }

    public ICommand BackCommand { get; }

    public ICommand ToggleAutoModeCommand { get; }
}
