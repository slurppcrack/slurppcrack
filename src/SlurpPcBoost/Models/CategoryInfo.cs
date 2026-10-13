namespace SlurpPcBoost.Models;

/// <summary>Категория твиков (Процессор, Сеть, ...).</summary>
public sealed class CategoryInfo
{
    public CategoryInfo(string name, string colorHex)
    {
        Name = name;
        ColorHex = colorHex;
        Brush = new System.Windows.Media.SolidColorBrush(
            (System.Windows.Media.Color)System.Windows.Media.ColorConverter.ConvertFromString(colorHex)!);
        Brush.Freeze();
    }

    public string Name { get; }

    public string ColorHex { get; }

    public System.Windows.Media.SolidColorBrush Brush { get; }

    public override string ToString() => Name;
}
