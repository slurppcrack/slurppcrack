using SlurpPcBoost.Mvvm;

namespace SlurpPcBoost.Models;

/// <summary>Игровой профиль на странице «Игры».</summary>
public sealed class GameProfile : ObservableObject
{
    private bool _isOptimized;
    private string _preset = "Без оптимизации";
    private bool _isBusy;

    public GameProfile(string name, string category, string initials, string colorFrom, string colorTo)
    {
        Name = name;
        Category = category;
        Initials = initials;
        Gradient = CreateGradient(colorFrom, colorTo);
        Accent = new System.Windows.Media.SolidColorBrush(
            (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString(colorFrom)!);
        Accent.Freeze();
    }

    public string Name { get; }

    public string Category { get; }

    public string Initials { get; }

    public System.Windows.Media.LinearGradientBrush Gradient { get; }

    public System.Windows.Media.SolidColorBrush Accent { get; }

    public string Preset
    {
        get => _preset;
        set
        {
            if (SetProperty(ref _preset, value))
            {
                OnPropertyChanged(nameof(StatusText));
            }
        }
    }

    public bool IsBusy
    {
        get => _isBusy;
        set
        {
            if (SetProperty(ref _isBusy, value))
            {
                OnPropertyChanged(nameof(StatusText));
            }
        }
    }

    public bool IsOptimized
    {
        get => _isOptimized;
        set
        {
            if (SetProperty(ref _isOptimized, value))
            {
                OnPropertyChanged(nameof(StatusText));
            }
        }
    }

    public string StatusText => IsBusy ? "Применяется профиль…" : IsOptimized ? $"Пресет: {Preset}" : "Стандартные настройки";

    public bool Matches(string search)
        => string.IsNullOrWhiteSpace(search)
           || Name.Contains(search, StringComparison.OrdinalIgnoreCase)
           || Category.Contains(search, StringComparison.OrdinalIgnoreCase);

    private static System.Windows.Media.LinearGradientBrush CreateGradient(string from, string to)
    {
        var brush = new System.Windows.Media.LinearGradientBrush
        {
            StartPoint = new System.Windows.Point(0, 0),
            EndPoint = new System.Windows.Point(1, 1),
            GradientStops =
            {
                new System.Windows.Media.GradientStop(
                    (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString(from)!, 0),
                new System.Windows.Media.GradientStop(
                    (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString(to)!, 1),
            },
        };
        brush.Freeze();
        return brush;
    }
}
