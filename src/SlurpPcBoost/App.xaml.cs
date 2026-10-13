using System.Windows;
using System.Windows.Threading;
using SlurpPcBoost.Mvvm;
using SlurpPcBoost.Services;
using SlurpPcBoost.ViewModels;

namespace SlurpPcBoost;

/// <summary>Точка входа: собираем сервисы, состояние и главное окно.</summary>
public partial class App : Application
{
    private AppLogService? _log;

    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        _log = new AppLogService();
        AsyncRelayCommand.ErrorHandler = ex => _log?.Error("Ошибка в команде", ex);
        DispatcherUnhandledException += OnDispatcherUnhandledException;
        AppDomain.CurrentDomain.UnhandledException += (_, args) =>
        {
            if (args.ExceptionObject is Exception ex)
            {
                _log?.Error("Необработанная ошибка", ex);
            }
        };

        var catalog = new CatalogService();
        catalog.Load();

        var dialogs = new DialogService();
        var state = new AppState(catalog, _log, dialogs);
        var viewModel = new MainViewModel(state);

        var window = new MainWindow(viewModel);
        MainWindow = window;
        window.Show();
    }

    private void OnDispatcherUnhandledException(object sender, DispatcherUnhandledExceptionEventArgs e)
    {
        _log?.Error("Ошибка интерфейса", e.Exception);
        MessageBox.Show(
            $"Произошла непредвиденная ошибка:\n\n{e.Exception.Message}\n\nПодробности — в журнале приложения.",
            "Slurp PC Boost",
            MessageBoxButton.OK,
            MessageBoxImage.Error);

        e.Handled = true;
    }
}
