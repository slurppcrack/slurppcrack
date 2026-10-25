using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Interop;
using System.Windows.Media;

namespace Slurp;

public partial class SettingsWindow : Window
{
    private sealed class ProviderRow
    {
        public required Provider Provider { get; init; }
        public PasswordBox? KeyBox { get; init; }
        public required TextBox UrlBox { get; init; }
        public required TextBlock Status { get; init; }
        public required Button TestButton { get; init; }
    }

    private readonly List<ProviderRow> _rows = new();
    private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromSeconds(15) };

    private static readonly string[] PersonaIds = { "surgeon", "architect", "racer", "mentor", "custom" };

    [DllImport("dwmapi.dll", PreserveSig = true)]
    private static extern int DwmSetWindowAttribute(IntPtr hwnd, int attribute, ref int value, int size);

    public AppSettings Settings { get; }

    protected override void OnSourceInitialized(EventArgs e)
    {
        base.OnSourceInitialized(e);
        // paint the native caption dark so the dialog does not flash a white bar
        try
        {
            var handle = new WindowInteropHelper(this).Handle;
            var dark = 1;
            if (DwmSetWindowAttribute(handle, 20, ref dark, sizeof(int)) != 0)
                DwmSetWindowAttribute(handle, 19, ref dark, sizeof(int));
        }
        catch
        {
            // older Windows: keep the default caption
        }
    }

    public SettingsWindow(AppSettings settings)
    {
        InitializeComponent();

        // work on a copy: closing with Cancel must not mutate the live settings
        Settings = new AppSettings
        {
            ModelId = settings.ModelId,
            Persona = settings.Persona,
            Autonomy = settings.Autonomy,
            Temperature = settings.Temperature,
            MaxSteps = settings.MaxSteps,
            CustomRules = settings.CustomRules,
            SaveKeys = settings.SaveKeys,
            LastWorkspace = settings.LastWorkspace,
            Onboarded = settings.Onboarded,
            Keys = new Dictionary<string, string>(settings.Keys),
            BaseUrls = new Dictionary<string, string>(settings.BaseUrls)
        };

        ModelCombo.ItemsSource = Catalog.Models;
        ModelCombo.DisplayMemberPath = "Label";
        ModelCombo.SelectedItem = Catalog.ModelOf(Settings.ModelId);
        ModelCombo.SelectionChanged += (_, _) => UpdateModelHint();

        PersonaCombo.ItemsSource = new[]
        {
            "Хирург — минимальные точные диффы",
            "Архитектор — сначала план, потом код",
            "Гонщик — быстрый рабочий срез",
            "Ментор — объясняет по ходу",
            "Свои правила"
        };
        var personaIndex = Array.IndexOf(PersonaIds, Settings.Persona);
        PersonaCombo.SelectedIndex = personaIndex < 0 ? 0 : personaIndex;

        AutonomyCombo.ItemsSource = new[] { "Ask — спрашивать всё", "Auto — файлы сам", "Yolo — не спрашивать" };
        AutonomyCombo.SelectedIndex = (int)Settings.Autonomy;

        RulesBox.Text = Settings.CustomRules;
        StepsBox.Text = Settings.MaxSteps.ToString();
        TempBox.Text = Settings.Temperature.ToString("0.##");
        SaveKeysCheck.IsChecked = Settings.SaveKeys;

        BuildProviderRows();
        UpdateModelHint();
    }

    private void UpdateModelHint()
    {
        if (ModelCombo.SelectedItem is not ModelInfo model) return;
        var provider = Catalog.ProviderOf(model);
        ModelHint.Text = $"{provider.Name} · {model.ApiId} · окно {model.Context / 1000}K"
                         + (model.Local ? " · локально, бесплатно" : $" · ${model.PriceIn} / ${model.PriceOut} за 1M токенов");
    }

    private void BuildProviderRows()
    {
        foreach (var provider in Catalog.Providers)
        {
            var card = new Border
            {
                Style = (Style)FindResource("ToolLine"),
                Margin = new Thickness(0, 0, 0, 8),
                Padding = new Thickness(12, 10, 12, 10)
            };

            var stack = new StackPanel();

            var header = new Grid();
            header.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            header.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

            var title = new TextBlock
            {
                Text = provider.Name,
                FontSize = 13,
                FontWeight = FontWeights.SemiBold,
                VerticalAlignment = VerticalAlignment.Center
            };
            header.Children.Add(title);

            var status = new TextBlock
            {
                Text = string.IsNullOrWhiteSpace(Settings.KeyFor(provider.Id)) ? "нет ключа" : "ключ сохранён",
                Style = (Style)FindResource("CapText"),
                VerticalAlignment = VerticalAlignment.Center
            };
            if (!string.IsNullOrWhiteSpace(Settings.KeyFor(provider.Id)))
                status.Foreground = (Brush)FindResource("Accent");
            Grid.SetColumn(status, 1);
            header.Children.Add(status);

            stack.Children.Add(header);

            PasswordBox? keyBox = null;
            if (provider.NeedsKey)
            {
                var keyRow = new Grid { Margin = new Thickness(0, 8, 0, 0) };
                keyRow.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
                keyRow.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

                keyBox = new PasswordBox
                {
                    Password = Settings.KeyFor(provider.Id),
                    FontFamily = new FontFamily("Consolas"),
                    FontSize = 12
                };
                var box = keyBox;
                box.PasswordChanged += (_, _) =>
                {
                    status.Text = string.IsNullOrWhiteSpace(box.Password) ? "нет ключа" : "не сохранено";
                    status.Foreground = string.IsNullOrWhiteSpace(box.Password)
                        ? (Brush)FindResource("Muted")
                        : (Brush)FindResource("Text");
                };
                keyRow.Children.Add(keyBox);

                var testButton = new Button
                {
                    Content = "проверить",
                    Style = (Style)FindResource("GhostButton"),
                    Margin = new Thickness(8, 0, 0, 0),
                    Padding = new Thickness(10, 5, 10, 5)
                };
                Grid.SetColumn(testButton, 1);
                keyRow.Children.Add(testButton);

                stack.Children.Add(keyRow);

                var urlRow = new Grid { Margin = new Thickness(0, 6, 0, 0) };
                var urlLabel = new TextBlock
                {
                    Text = "base url",
                    Style = (Style)FindResource("CapText"),
                    VerticalAlignment = VerticalAlignment.Center,
                    Width = 58
                };
                var urlBox = new TextBox
                {
                    Text = Settings.BaseUrlFor(provider),
                    Style = (Style)FindResource("MonoBox")
                };
                urlBox.SetValue(Grid.ColumnProperty, 1);
                urlRow.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
                urlRow.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
                urlRow.Children.Add(urlLabel);
                urlRow.Children.Add(urlBox);
                stack.Children.Add(urlRow);

                card.Child = stack;

                var row = new ProviderRow
                {
                    Provider = provider,
                    KeyBox = keyBox,
                    UrlBox = urlBox,
                    Status = status,
                    TestButton = testButton
                };
                testButton.Click += async (_, _) => await TestAsync(row);
                _rows.Add(row);
            }
            else
            {
                var urlBox = new TextBox
                {
                    Text = Settings.BaseUrlFor(provider),
                    Style = (Style)FindResource("MonoBox"),
                    Margin = new Thickness(0, 8, 0, 0)
                };
                stack.Children.Add(urlBox);

                var hint = new TextBlock
                {
                    Text = "локальный сервер — ключ не нужен, просто запусти его",
                    Style = (Style)FindResource("CapText"),
                    Margin = new Thickness(0, 6, 0, 0)
                };
                stack.Children.Add(hint);

                card.Child = stack;
                _rows.Add(new ProviderRow
                {
                    Provider = provider,
                    KeyBox = null,
                    UrlBox = urlBox,
                    Status = status,
                    TestButton = new Button() // unused for local providers
                });
            }

            ProvidersHost.Children.Add(card);
        }
    }

    private async Task TestAsync(ProviderRow row)
    {
        var key = row.KeyBox?.Password?.Trim() ?? "";
        var baseUrl = row.UrlBox.Text.Trim().TrimEnd('/');
        if (row.Provider.NeedsKey && key.Length == 0)
        {
            row.Status.Text = "вставь ключ";
            row.Status.Foreground = (Brush)FindResource("Danger");
            return;
        }

        row.TestButton.IsEnabled = false;
        row.Status.Text = "проверяю…";
        row.Status.Foreground = (Brush)FindResource("Muted");

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, baseUrl + "/models");
            if (row.Provider.Protocol == ProviderProtocol.Anthropic)
            {
                request.Headers.Add("x-api-key", key);
                request.Headers.Add("anthropic-version", "2023-06-01");
            }
            else if (key.Length > 0)
            {
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", key);
            }

            using var response = await Http.SendAsync(request);
            if (response.IsSuccessStatusCode)
            {
                row.Status.Text = "ключ рабочий";
                row.Status.Foreground = (Brush)FindResource("Accent");
            }
            else
            {
                row.Status.Text = $"ответ {(int)response.StatusCode}";
                row.Status.Foreground = (Brush)FindResource("Danger");
            }
        }
        catch (Exception ex)
        {
            row.Status.Text = "нет связи: " + Shorten(ex.Message);
            row.Status.Foreground = (Brush)FindResource("Danger");
        }
        finally
        {
            row.TestButton.IsEnabled = true;
        }
    }

    private static string Shorten(string s) => s.Length > 40 ? s[..40] + "…" : s;

    // ------------------------------------------------------------------ actions

    private void OpenFolder_Click(object sender, RoutedEventArgs e)
    {
        var dir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "SLURP");
        try
        {
            Directory.CreateDirectory(dir);
            Process.Start(new ProcessStartInfo("explorer.exe", $"\"{dir}\"") { UseShellExecute = true });
        }
        catch (Exception ex)
        {
            MessageBox.Show(this, ex.Message, "SLURP", MessageBoxButton.OK, MessageBoxImage.Warning);
        }
    }

    private void ResetKeys_Click(object sender, RoutedEventArgs e)
    {
        if (MessageBox.Show(this, "Удалить все сохранённые ключи?", "SLURP",
                MessageBoxButton.YesNo, MessageBoxImage.Question) != MessageBoxResult.Yes) return;

        foreach (var row in _rows)
        {
            if (row.KeyBox is null) continue;
            row.KeyBox.Password = "";
            row.Status.Text = "нет ключа";
            row.Status.Foreground = (Brush)FindResource("Muted");
        }
        SaveHint.Text = "ключи очищены — нажми «Сохранить», чтобы записать";
    }

    private void Cancel_Click(object sender, RoutedEventArgs e)
    {
        DialogResult = false;
        Close();
    }

    private void Save_Click(object sender, RoutedEventArgs e)
    {
        if (ModelCombo.SelectedItem is ModelInfo model) Settings.ModelId = model.Id;

        var personaIndex = Math.Max(0, PersonaCombo.SelectedIndex);
        Settings.Persona = PersonaIds[Math.Min(personaIndex, PersonaIds.Length - 1)];
        Settings.CustomRules = RulesBox.Text ?? "";

        Settings.Autonomy = (Autonomy)Math.Max(0, AutonomyCombo.SelectedIndex);

        Settings.MaxSteps = int.TryParse(StepsBox.Text.Trim(), out var steps) ? Math.Clamp(steps, 1, 200) : 40;
        Settings.Temperature = double.TryParse(TempBox.Text.Trim().Replace(',', '.'), out var temp)
            ? Math.Clamp(temp, 0, 2)
            : 0.3;

        Settings.SaveKeys = SaveKeysCheck.IsChecked == true;

        Settings.Keys = new Dictionary<string, string>();
        Settings.BaseUrls = new Dictionary<string, string>();
        foreach (var row in _rows)
        {
            if (row.KeyBox is not null && !string.IsNullOrWhiteSpace(row.KeyBox.Password))
                Settings.Keys[row.Provider.Id] = row.KeyBox.Password.Trim();

            var url = row.UrlBox.Text.Trim().TrimEnd('/');
            if (!string.IsNullOrEmpty(url) && url != row.Provider.BaseUrl)
                Settings.BaseUrls[row.Provider.Id] = url;
        }

        DialogResult = true;
        Close();
    }
}
