using System.Windows;
using System.Windows.Media;
using SlurpPcBoost.Services;
using SlurpPcBoost.ViewModels;

namespace SlurpPcBoost;

public partial class MainWindow : Window
{
    public MainWindow(MainViewModel viewModel)
    {
        InitializeComponent();

        DataContext = viewModel;

        // Иконка рисуется кодом — внешний .ico не нужен, а TaskbarIcon не ломается.
        Icon = SystemInfoService.CreateAppIcon();

        StateChanged += (_, _) => UpdateMaximizeIcon();
        UpdateMaximizeIcon();
    }

    /// <summary>Переключает иконку «развернуть/восстановить» при смене состояния окна.</summary>
    private void UpdateMaximizeIcon()
    {
        if (MaximizeIcon is null)
        {
            return;
        }

        MaximizeIcon.Data = (Geometry?)TryFindResource(
            WindowState == WindowState.Maximized ? "Icon.Restore" : "Icon.Maximize");
    }

    private void Minimize_Click(object sender, RoutedEventArgs e) => WindowState = WindowState.Minimized;

    private void Maximize_Click(object sender, RoutedEventArgs e)
        => WindowState = WindowState == WindowState.Maximized ? WindowState.Normal : WindowState.Maximized;

    private void Close_Click(object sender, RoutedEventArgs e) => Close();
}
