using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;
using Microsoft.Win32;
using WpfSelectionChangedEventArgs = System.Windows.Controls.SelectionChangedEventArgs;

namespace Slurp;

public partial class MainWindow : Window
{
    private AppSettings _settings;
    private readonly ObservableCollection<Session> _sessions = new();
    private Session? _current;
    private CancellationTokenSource? _cts;

    public MainWindow()
    {
        InitializeComponent();
        _settings = SettingsStore.Load();

        SessionsList.ItemsSource = _sessions;
        InitializeCombos();
        RestoreWorkspace();
        CreateSession();

        PreviewKeyDown += PreviewKeyDownHandler;
        Loaded += MainWindow_Loaded;
        StateChanged += MainWindow_StateChanged;
        Closing += MainWindow_Closing;
    }

    // ------------------------------------------------------------------ lifecycle

    private void MainWindow_Loaded(object sender, RoutedEventArgs e)
    {
        if (RootGrid.RenderTransform is ScaleTransform scale)
        {
            var zoom = new DoubleAnimation(0.988, 1, TimeSpan.FromMilliseconds(340))
            {
                EasingFunction = new CubicEase { EasingMode = EasingMode.EaseOut }
            };
            scale.BeginAnimation(ScaleTransform.ScaleXProperty, zoom);
            scale.BeginAnimation(ScaleTransform.ScaleYProperty, zoom);
        }

        RootGrid.BeginAnimation(OpacityProperty, new DoubleAnimation(0, 1, TimeSpan.FromMilliseconds(240))
        {
            EasingFunction = new CubicEase { EasingMode = EasingMode.EaseOut }
        });

        if (!_settings.Onboarded)
        {
            OnboardingOverlay.Visibility = Visibility.Visible;
            return;
        }

        Composer.Focus();
    }

    private void MainWindow_StateChanged(object? sender, EventArgs e)
    {
        // WindowChrome hides the native frame, so pad the maximised window by the
        // resize border it no longer has. Invisible on our dark background.
        var pad = WindowState == WindowState.Maximized
            ? SystemParameters.WindowResizeBorderThickness.Left
            : 0;
        RootGrid.Margin = new Thickness(pad);
    }

    private void MainWindow_Closing(object? sender, CancelEventArgs e)
    {
        try { _cts?.Cancel(); } catch { }
        SettingsStore.Save(_settings);
    }

    // ------------------------------------------------------------------ window chrome

    private void TitleBar_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        if (e.ClickCount == 2)
        {
            ToggleMaximize();
            return;
        }

        if (WindowState == WindowState.Maximized) return;

        try { DragMove(); } catch (InvalidOperationException) { }
    }

    private void ToggleMaximize() =>
        WindowState = WindowState == WindowState.Maximized ? WindowState.Normal : WindowState.Maximized;

    private void Minimize_Click(object sender, RoutedEventArgs e) => WindowState = WindowState.Minimized;

    private void Maximize_Click(object sender, RoutedEventArgs e) => ToggleMaximize();

    private void Close_Click(object sender, RoutedEventArgs e) => Close();

    // ------------------------------------------------------------------ sessions

    private void CreateSession()
    {
        var session = new Session
        {
            Title = "Новая сессия",
            Subtitle = DateTime.Now.ToString("сегодня · HH:mm")
        };
        _sessions.Insert(0, session);
        SessionsCount.Text = _sessions.Count.ToString();
        SessionsList.SelectedItem = session;
        Activate(session);
    }

    private void NewSession_Click(object sender, RoutedEventArgs e)
    {
        if (_current is { Turns.Count: 0 })
        {
            Composer.Focus();
            return;
        }
        CreateSession();
    }

    private void SessionsList_SelectionChanged(object sender, WpfSelectionChangedEventArgs e)
    {
        if (SessionsList.SelectedItem is Session session)
            Activate(session);
    }

    private void Activate(Session session)
    {
        _current = session;
        Messages.ItemsSource = session.Turns;
        ActivityList.ItemsSource = session.Log;

        HeroPanel.Visibility = session.Turns.Count == 0 ? Visibility.Visible : Visibility.Collapsed;
        ActivityEmpty.Visibility = session.Log.Count == 0 ? Visibility.Visible : Visibility.Collapsed;
        SessionTitle.Text = session.Turns.Count == 0 ? "сессия" : session.Title.ToUpperInvariant();
        TitleSubtitle.Text = "— " + session.Title;

        UpdateInfoPanel();
        ScrollToEnd();
    }

    private void RenameCurrent(string text)
    {
        if (_current is null) return;
        if (_current.Turns.Count > 1) return; // only the first user message names the session

        var title = text.Replace('\n', ' ').Trim();
        if (title.Length > 38) title = title[..38] + "…";
        _current.Title = title;
        _current.Subtitle = DateTime.Now.ToString("сегодня · HH:mm");
        SessionsList.Items.Refresh();
        SessionTitle.Text = title.ToUpperInvariant();
        TitleSubtitle.Text = "— " + title;
    }

    // ------------------------------------------------------------------ workspace

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
            WorkspacePath.Text = "агент работает только внутри неё";
            WorkspacePill.Text = "папка";
            OpenFolderButton.IsEnabled = false;
            SendButton.IsEnabled = false;
            return;
        }

        var name = Path.GetFileName(path.TrimEnd('\\', '/'));
        if (string.IsNullOrWhiteSpace(name)) name = path;

        WorkspaceName.Text = name;
        WorkspacePath.Text = path;
        WorkspacePill.Text = name;
        OpenFolderButton.IsEnabled = true;
        SendButton.IsEnabled = true;

        _settings.LastWorkspace = path;
        SettingsStore.Save(_settings);
    }

    private void PickFolder_Click(object sender, RoutedEventArgs e)
    {
        var dialog = new OpenFolderDialog { Title = "Выбери папку проекта" };
        if (dialog.ShowDialog(this) != true) return;

        var path = dialog.FolderName;
        if (_current is { Turns.Count: > 0 })
        {
            var answer = MessageBox.Show(this,
                "Сменить рабочую папку? Контекст текущей сессии будет очищен.",
                "SLURP", MessageBoxButton.YesNo, MessageBoxImage.Question);
            if (answer != MessageBoxResult.Yes) return;

            _current.Turns.Clear();
            _current.Log.Clear();
            _current.Conversation.Clear();
            _current.Steps = 0;
            _current.InTokens = 0;
            _current.OutTokens = 0;
        }

        SetWorkspace(path);
        Activate(_current!);
        PatchOnboarding();
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

    // ------------------------------------------------------------------ settings

    private void Settings_Click(object sender, RoutedEventArgs e)
    {
        OpenSettings();
        PatchOnboarding();
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

    private void UpdateInfoPanel()
    {
        var model = Catalog.ModelOf(_settings.ModelId);
        InfoModel.Text = model.Name;

        var steps = _current?.Steps ?? 0;
        var inTok = _current?.InTokens ?? 0;
        var outTok = _current?.OutTokens ?? 0;

        InfoSteps.Text = steps.ToString();
        InfoTokens.Text = $"{inTok:N0} / {outTok:N0}";
        var cost = inTok / 1_000_000.0 * model.PriceIn + outTok / 1_000_000.0 * model.PriceOut;
        InfoCost.Text = "$" + cost.ToString("0.0000");
        CostText.Text = $"{steps} шагов  ·  ${cost:0.0000}";
    }

    // ------------------------------------------------------------------ composer

    private void UpdateWatermark()
    {
        var empty = string.IsNullOrEmpty(Composer.Text);
        Watermark.Visibility = empty && !Composer.IsKeyboardFocusWithin ? Visibility.Visible : Visibility.Collapsed;
    }

    private void Composer_TextChanged(object sender, System.Windows.Controls.TextChangedEventArgs e) => UpdateWatermark();

    private void Composer_GotKeyboardFocus(object sender, KeyboardFocusChangedEventArgs e) => UpdateWatermark();

    private void Composer_LostKeyboardFocus(object sender, KeyboardFocusChangedEventArgs e) => UpdateWatermark();

    private void Composer_KeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key == Key.Enter && (Keyboard.Modifiers & ModifierKeys.Control) != 0)
        {
            e.Handled = true;
            Send_Click(sender, e);
        }
    }

    private void Suggestion_Click(object sender, RoutedEventArgs e)
    {
        if (sender is System.Windows.Controls.Button { Content: string text })
        {
            Composer.Text = text;
            Composer.CaretIndex = text.Length;
            Composer.Focus();
            UpdateWatermark();
        }
    }

    private void PreviewKeyDownHandler(object sender, KeyEventArgs e)
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

    // ------------------------------------------------------------------ agent

    private async Task SendAsync()
    {
        var text = Composer.Text?.Trim() ?? "";
        if (string.IsNullOrWhiteSpace(text)) return;
        if (_cts is { IsCancellationRequested: false }) return;
        if (_current is null) return;

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
                PatchOnboarding();
            }
            return;
        }

        var session = _current;
        RenameCurrent(text);

        Composer.Text = "";
        UpdateWatermark();

        session.Turns.Add(new ChatTurn { Role = "user", Text = text });
        HeroPanel.Visibility = Visibility.Collapsed;
        if (ReferenceEquals(session, _current)) ScrollToEnd();

        _cts = new CancellationTokenSource();
        SetRunning(true);

        var assistant = new ChatTurn { Role = "assistant", Text = "" };
        session.Turns.Add(assistant);

        var agent = new Agent(_settings, _settings.LastWorkspace);

        agent.Delta += piece => Dispatcher.Invoke(() =>
        {
            assistant.Text += piece;
            if (ReferenceEquals(session, _current))
            {
                Messages.Items.Refresh();
                ScrollToEnd();
            }
        });

        agent.Usage += (inTok, outTok) => Dispatcher.Invoke(() =>
        {
            session.InTokens += inTok;
            session.OutTokens += outTok;
            if (ReferenceEquals(session, _current)) UpdateInfoPanel();
        });

        agent.ToolStarted += (tool, detail) => Dispatcher.Invoke(() =>
        {
            StatusText.Text = detail.Length > 0 ? $"{tool} · {detail}" : tool;
        });

        agent.ToolFinished += entry => Dispatcher.Invoke(() =>
        {
            session.Log.Insert(0, entry);
            session.Steps++;
            if (ReferenceEquals(session, _current))
            {
                ActivityEmpty.Visibility = Visibility.Collapsed;
                UpdateInfoPanel();
            }
            StatusText.Text = entry.Ok ? "готов" : "инструмент вернул ошибку";
        });

        agent.Notice += message => Dispatcher.Invoke(() =>
        {
            session.Turns.Add(new ChatTurn { Role = "assistant", Text = message });
            if (ReferenceEquals(session, _current)) ScrollToEnd();
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
            await agent.RunAsync(text, session.Conversation, _cts.Token);
        }
        catch (OperationCanceledException)
        {
            session.Turns.Add(new ChatTurn { Role = "assistant", Text = "Остановлено." });
        }
        catch (Exception ex)
        {
            session.Turns.Add(new ChatTurn { Role = "assistant", Text = "Ошибка: " + ex.Message });
            StatusText.Text = "ошибка";
        }
        finally
        {
            _cts?.Dispose();
            _cts = null;
            SetRunning(false);
            UpdateInfoPanel();
            if (ReferenceEquals(session, _current)) ScrollToEnd();
            Composer.Focus();
        }
    }

    private void SetRunning(bool running)
    {
        SendButton.IsEnabled = !running && !string.IsNullOrWhiteSpace(_settings.LastWorkspace);
        Composer.IsEnabled = !running;
        WorkspaceCardButton.IsEnabled = !running;

        StopButton.Visibility = running ? Visibility.Visible : Visibility.Collapsed;

        if (running)
        {
            StartPulse();
            return;
        }

        StopPulse();
        StatusText.Text = "готов";
    }

    private void StartPulse()
    {
        var pulse = new DoubleAnimation(0.35, 1, TimeSpan.FromSeconds(1.1))
        {
            AutoReverse = true,
            RepeatBehavior = RepeatBehavior.Forever,
            EasingFunction = new SineEase { EasingMode = EasingMode.EaseInOut }
        };
        RunDot.BeginAnimation(OpacityProperty, pulse);
    }

    private void StopPulse()
    {
        RunDot.BeginAnimation(OpacityProperty, null);
        RunDot.Opacity = 0.4;
    }

    // ------------------------------------------------------------------ onboarding

    private void OnboardingSettings_Click(object sender, RoutedEventArgs e)
    {
        OpenSettings();
        PatchOnboarding();
    }

    private void OnboardingFolder_Click(object sender, RoutedEventArgs e)
    {
        PickFolder_Click(sender, e);
        PatchOnboarding();
    }

    private void OnboardingSkip_Click(object sender, RoutedEventArgs e)
    {
        _settings.Onboarded = true;
        SettingsStore.Save(_settings);
        PatchOnboarding();
    }

    private void PatchOnboarding()
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

    private void ScrollToEnd()
    {
        ChatScroll.ScrollToEnd();
    }
}
