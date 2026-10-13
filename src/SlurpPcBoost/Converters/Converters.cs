using System.Globalization;
using System.Windows;
using System.Windows.Data;
using System.Windows.Media;

namespace SlurpPcBoost.Converters;

/// <summary>bool → Visibility. Свойство <see cref="Invert"/> позволяет инвертировать логику.</summary>
public sealed class BoolToVisibilityConverter : IValueConverter
{
    public bool Invert { get; set; }

    public bool UseHidden { get; set; }

    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        var flag = value is bool b && b;
        if (Invert)
        {
            flag = !flag;
        }

        if (flag)
        {
            return Visibility.Visible;
        }

        return UseHidden ? Visibility.Hidden : Visibility.Collapsed;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        var visible = value is Visibility v && v == Visibility.Visible;
        return Invert ? !visible : visible;
    }
}

/// <summary>Инверсия bool (например, IsEnabled = !IsBusy).</summary>
public sealed class BoolNegationConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
        => !(value is bool b && b);

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => !(value is bool b && b);
}

/// <summary>Пустая строка → Visibility (для плейсхолдеров в полях поиска).</summary>
public sealed class EmptyStringToVisibilityConverter : IValueConverter
{
    public bool Invert { get; set; }

    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        var isEmpty = string.IsNullOrEmpty(value as string);
        if (Invert)
        {
            isEmpty = !isEmpty;
        }

        return isEmpty ? Visibility.Visible : Visibility.Collapsed;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => Binding.DoNothing;
}

/// <summary>
/// Процент (0–100) → штриховая обводка для кругового индикатора.
/// ConverterParameter — полная длина окружности в единицах толщины штриха
/// (для диаметра 150 и толщины 10 это ≈ 44.0).
/// </summary>
public sealed class RingDashConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        var percent = value is double d ? d : 0;
        percent = Math.Clamp(percent, 0, 100);

        var total = 44.0;
        if (parameter is string text && double.TryParse(text, NumberStyles.Float, CultureInfo.InvariantCulture, out var parsed))
        {
            total = parsed;
        }

        var filled = Math.Max(total * percent / 100.0, percent > 0 ? 0.8 : 0);
        var dashes = new DoubleCollection { filled, Math.Max(total - filled, 0.01) };
        dashes.Freeze();
        return dashes;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => Binding.DoNothing;
}

/// <summary>Сравнивает значение элемента со значением из второго биндинга (для чипов-фильтров).</summary>
public sealed class FilterEqualsConverter : IMultiValueConverter
{
    public object Convert(object?[] values, Type targetType, object? parameter, CultureInfo culture)
    {
        if (values.Length < 2)
        {
            return false;
        }

        var item = values[0] as string;
        var selected = values[1] as string;
        return string.Equals(item, selected, StringComparison.OrdinalIgnoreCase);
    }

    public object[] ConvertBack(object? value, Type[] targetTypes, object? parameter, CultureInfo culture)
        => new[] { Binding.DoNothing };
}
