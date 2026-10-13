namespace SlurpPcBoost.Models;

/// <summary>Группа твиков одной категории — используется для вывода списка на странице «Оптимизация».</summary>
public sealed class TweakGroup
{
    public TweakGroup(string name, System.Windows.Media.SolidColorBrush brush, IReadOnlyList<Tweak> items)
    {
        Name = name;
        Brush = brush;
        Items = items;
    }

    public string Name { get; }

    public System.Windows.Media.SolidColorBrush Brush { get; }

    public IReadOnlyList<Tweak> Items { get; }

    public string CountText => $"{Items.Count} шт.";

    public int PotentialImpact => Items.Sum(t => t.ImpactPercent);

    public string ImpactText => $"+{PotentialImpact}% FPS";
}
