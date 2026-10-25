using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media;
using Microsoft.Win32;
using WpfSelectionChangedEventArgs = System.Windows.Controls.SelectionChangedEventArgs;

namespace Slurp;

public partial class MainWindow : Window
{
    private AppSettings _settings;
    private readonly ObservableCollection<ChatTurn> _turns = new();
    private readonly ObservableCollection<ToolLogEntry> _log = new();
    private readonly List<LlmMessage> _conversation = new();
    private CancellationTokenSource? _cts;

    private int _steps;
    private int _inTokens;
    private int _outTokens;

    public MainWindow()
    {
        InitializeComponent();
        _settings = SettingsStore.Load();

        Messages.ItemsSource = _turns;
        ToolLog.ItemsSource = _log;

        InitializeCombos();
        RestoreWorkspace();
        UpdateInfoPanel();
        UpdateWatermark();

        PreviewKeyDown += MainWindow_PreviewKeyDown;
        Closing += MainWindow_Closing;
        Loaded += MainWindow_Loaded;
    }

    // ------------------------------------------------------------------ setup

    private void MainWindow_Loaded(object sender, RoutedEventArgs e)
    {
        if (!_settings.Onboarded)
        {
            OnboardingOverlay.Visibility = Visibility.Visible;
            return;
        }

        Composer.Focus();
    }

    private void InitializeCombos()
    {
        ModelCombo.ItemsSource = null;
        ModelCombo.ItemsSource = Catalog.Models;
        ModelCombo.DisplayMemberPath = "Label";
        ModelCombo.SelectedItem = Catalog.ModelOf(_settings.ModelId);

        AutonomyCombo.ItemsSource = null;
        AutonomyCombo.ItemsSource = new[] { "Ask — спрашивать всё", "Auto — файлы сам", "Yolo — не спрашивать" };
        AutonomyCombo.SelectedIndex = (int)_settings.Autonomy;
    }

    private void RestoreWorkspace()
    {
        if (!string.IsNullOrWhiteSpace(_settings.LastWorkspace) && Directory.Exists(_settings.LastWorkspace))
            SetWorkspace(_settings.LastWorkspace);
        else
            SetWorkspace(null);
    }

    private void SetWorkspace(string? path)
    {
        if (string.IsNullOrEmpty(path))
        {
            WorkspaceName.Text = "выбрать папку…";
            WorkspacePath.Text = "пока не выбрана — агент ничего не прочитает";
            OpenFolderButton.IsEnabled = false;
            SendButton.IsEnabled = false;
            return;
        }

        WorkspaceName.Text = Path.GetFileName(path.TrimEnd('\\', '/')) is { Length: > 0 } name ? name : path;
        WorkspacePath.Text = path;
        _settings.LastWorkspace = path;
        SettingsStore.Save(_settings);
        SendButton.IsEnabled = true;
        OpenFolderButton.IsEnabled = true;

        if (_turns.Count == 0)
        {
            _turns.Add(new ChatTurn
            {
                Role = "assistant",
                Text = $"Рабочая папка: {path}\n\nНапиши, что сделать. Я прочитаю нужные файлы, поменяю их на диске "
                       + "и прогоню проверку. Перед каждой записью спрошу разрешение — режим Ask.\n\n"
                       + "Например: «посмотри package.json и добавь скрипт lint», «почему падает тест login.spec.ts», "
                       + "«сделай тёмную тему в settings.css»."
            });
        }
    }

    private void UpdateInfoPanel()
    {
        var model = Catalog.ModelOf(_settings.ModelId);
        InfoModel.Text = model.Name;
        InfoSteps.Text = _steps.ToString();
        InfoTokens.Text = $"{_inTokens:N0} / {_outTokens:N0}";
        var cost = _inTokens / 1_000_000.0 * model.PriceIn + _outTokens / 1_000_000.0 * model.PriceOut;
        InfoCost.Text = "$" + cost.ToString("0.0000");
        CostText.Text = $"{_steps} шагов  ·  ${cost:0.0000}";
    }

    private void UpdateWatermark()
    {
        var empty = string.IsNullOrEmpty(Composer.Text);
        Watermark.Visibility = empty && !Composer.IsKeyboardFocusWithin ? Visibility.Visible : Visibility.Collapsed;
    }

    // ------------------------------------------------------------------ ui events

    private void PickFolder_Click(object sender, RoutedEventArgs e)
    {
        var dialog = new OpenFolderDialog { Title = "Выбери папку проекта" };
        if (dialog.ShowDialog(this) != true) return;

        var path = dialog.FolderName;
        if (_conversation.Count > 0)
        {
            var answer = MessageBox.Show(this,
                "Сменить рабочую папку? Контекст текущей сессии будет очищен.",
                "SLURP", MessageBoxButton.YesNo, MessageBoxImage.Question);
            if (answer != MessageBoxResult.Yes) return;
        }

        _conversation.Clear();
        _turns.Clear();
        _log.Clear();
        _steps = 0;
        _inTokens = 0;
        _outTokens = 0;
        SessionTitle.Text = "Сессия · " + (Path.GetFileName(path.TrimEnd('\\', '/')) is { Length: > 0 } n ? n : path);
        SetWorkspace(path);
        UpdateInfoPanel();
        HatchOnboarding();
        Composer.Focus();
    }

    private void OpenFolder_Click(object sender, RoutedEventArgs e)
    {
        var path = _settings.LastWorkspace;
        if (string.IsNullOrWhiteSpace(path) || !Directory.Exists(path)) return;
        try
        {
            Process.Start(new ProcessStartInfo("explorer.exe", $"\"{path}\"") { UseShellExecute = true });
        }
        catch (Exception ex)
        {
            MessageBox.Show(this, ex.Message, "SLURP", MessageBoxButton.OK, MessageBoxImage.Warning);
        }
    }

    private void Settings_Click(object sender, RoutedEventArgs e)
    {
        OpenSettings();
        HatchOnboarding();
    }

    private void OpenSettings()
    {
        var window = new SettingsWindow(_settings) { Owner = this };
        if (window.ShowDialog() != true) return;

        _settings = window.Settings;
        SettingsStore.Save(_settings);
        InitializeCombos();
        UpdateInfoPanel();
    }

    private void ModelCombo_SelectionChanged(object sender, WpfSelectionChangedEventArgs e)
    {
        if (ModelCombo.SelectedItem is ModelInfo model)
        {
            _settings.ModelId = model.Id;
            SettingsStore.Save(_settings);
            UpdateInfoPanel();
        }
    }

    private void Autonomy_SelectionChanged(object sender, WpfSelectionChangedEventArgs e)
    {
        if (AutonomyCombo.SelectedIndex >= 0)
        {
            _settings.Autonomy = (Autonomy)AutonomyCombo.SelectedIndex;
            SettingsStore.Save(_settings);
        }
    }

    private void Composer_KeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key == Key.Enter && (Keyboard.Modifiers & ModifierKeys.Control) != 0)
        {
            e.Handled = true;
            _ = SendAsync();
        }
    }

    private void Composer_TextChanged(object sender, System.Windows.Controls.TextChangedEventArgs e) => UpdateWatermark();

    private void Composer_GotKeyboardFocus(object sender, KeyboardFocusChangedEventArgs e) => UpdateWatermark();

    private void Composer_LostKeyboardFocus(object sender, KeyboardFocusChangedEventArgs e) => UpdateWatermark();

    private void MainWindow_PreviewKeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key == Key.Escape && _cts is { IsCancellationRequested: false })
        {
            _cts.Cancel();
            e.Handled = true;
        }
        else if (e.Key == Key.O && (Keyboard.Modifiers & ModifierKeys.Control) != 0)
        {
            PickFolder_Click(this, new RoutedEventArgs());
            e.Handled = true;
        }
    }

    private void Send_Click(object sender, RoutedEventArgs e) => _ = SendAsync();

    private void Stop_Click(object sender, RoutedEventArgs e) => _cts?.Cancel();

    private void MainWindow_Closing(object? sender, CancelEventArgs e)
    {
        try { _cts?.Cancel(); } catch { }
        SettingsStore.Save(_settings);
    }

    // ------------------------------------------------------------------ onboarding

    private void OnboardingSettings_Click(object sender, RoutedEventArgs e)
    {
        OpenSettings();
        HatchOnboarding();
    }

    private void OnboardingFolder_Click(object sender, RoutedEventArgs e)
    {
        PickFolder_Click(sender, e);
        HatchOnboarding();
    }

    private void OnboardingSkip_Click(object sender, RoutedEventArgs e)
    {
        _settings.Onboarded = true;
        SettingsStore.Save(_settings);
        HatchOnboarding();
    }

    private void HatchOnboarding()
    {
        var ready = !string.IsNullOrWhiteSpace(_settings.LastWorkspace) && Directory.Exists(_settings.LastWorkspace);
        if (ready)
        {
            _settings.Onboarded = true;
            SettingsStore.Save(_settings);
            OnboardingOverlay.Visibility = Visibility.Collapsed;
            Composer.Focus();
        }
        else if (_settings.Onboarded)
        {
            OnboardingOverlay.Visibility = Visibility.Collapsed;
        }
    }

    // ------------------------------------------------------------------ agent run

    private async Task SendAsync()
    {
        var text = Composer.Text?.Trim() ?? "";
        if (string.IsNullOrWhiteSpace(text)) return;
        if (_cts is { IsCancellationRequested: false }) return;

        if (string.IsNullOrWhiteSpace(_settings.LastWorkspace) || !Directory.Exists(_settings.LastWorkspace))
        {
            MessageBox.Show(this, "Сначала выбери рабочую папку — агент работает только внутри неё.",
                "SLURP", MessageBoxButton.OK, MessageBoxImage.Information);
            return;
        }

        var provider = Catalog.ProviderOf(Catalog.ModelOf(_settings.ModelId));
        if (provider.NeedsKey && string.IsNullOrWhiteSpace(_settings.KeyFor(provider.Id)))
        {
            var goToSettings = MessageBox.Show(this,
                $"Для {provider.Name} не задан ключ. Открыть настройки?",
                "SLURP", MessageBoxButton.YesNo, MessageBoxImage.Question);
            if (goToSettings == MessageBoxResult.Yes)
            {
                OpenSettings();
                HatchOnboarding();
            }
            return;
        }

        Composer.Text = "";
        UpdateWatermark();
        _turns.Add(new ChatTurn { Role = "user", Text = text });
        ScrollToEnd();

        _cts = new CancellationTokenSource();
        SetRunning(true, "думает…");

        var assistant = new ChatTurn { Role = "assistant", Text = "" };
        _turns.Add(assistant);

        var agent = new Agent(_settings, _settings.LastWorkspace);

        agent.Delta += piece => Dispatcher.Invoke(() =>
        {
            assistant.Text += piece;
            Messages.Items.Refresh();
            ScrollToEnd();
        });

        agent.Usage += (inTok, outTok) => Dispatcher.Invoke(() =>
        {
            _inTokens += inTok;
            _outTokens += outTok;
            UpdateInfoPanel();
        });

        agent.ToolStarted += (tool, detail) => Dispatcher.Invoke(() =>
        {
            StatusChip.Text = tool;
            StatusChip.Foreground = Brushes.White;
        });

        agent.ToolFinished += entry => Dispatcher.Invoke(() =>
        {
            _log.Insert(0, entry);
            _steps++;
            UpdateInfoPanel();
            StatusChip.Text = entry.Ok ? "готов" : "инструмент вернул ошибку";
            StatusChip.Foreground = entry.Ok ? (Brush)FindResource("Accent") : (Brush)FindResource("Danger");
        });

        agent.Notice += message => Dispatcher.Invoke(() =>
        {
            _turns.Add(new ChatTurn { Role = "assistant", Text = message });
            ScrollToEnd();
        });

        agent.ApprovalRequired = (tool, detail) =>
        {
            var result = MessageBox.Show(this,
                $"Агент хочет выполнить:\n\n{tool}\n{detail}\n\nРазрешить?",
                "SLURP — подтверждение", MessageBoxButton.YesNo, MessageBoxImage.Question, MessageBoxResult.Yes);
            return Task.FromResult(result == MessageBoxResult.Yes);
        };

        try
        {
            await agent.RunAsync(text, _conversation, _cts.Token);
        }
        catch (OperationCanceledException)
        {
            _turns.Add(new ChatTurn { Role = "assistant", Text = "Остановлено." });
        }
        catch (Exception ex)
        {
            _turns.Add(new ChatTurn { Role = "assistant", Text = "Ошибка: " + ex.Message });
            StatusChip.Text = "ошибка";
            StatusChip.Foreground = (Brush)FindResource("Danger");
        }
        finally
        {
            _cts?.Dispose();
            _cts = null;
            SetRunning(false, "готов");
            UpdateInfoPanel();
            ScrollToEnd();
            Composer.Focus();
        }
    }

    private void SetRunning(bool running, string status)
    {
        StatusChip.Text = status;
        if (running) StatusChip.Foreground = (Brush)FindResource("Accent");
        StopButton.Visibility = running ? Visibility.Visible : Visibility.Collapsed;
        SendButton.IsEnabled = !running;
        Composer.IsEnabled = !running;
        PickFolderButton.IsEnabled = !running;
    }

    private void ScrollToEnd() => ChatScroll.ScrollToEnd();
}
