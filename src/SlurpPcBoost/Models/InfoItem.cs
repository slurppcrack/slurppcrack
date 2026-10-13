namespace SlurpPcBoost.Models;

/// <summary>Плитка с информацией о системе на дашборде.</summary>
public sealed class InfoItem
{
    public InfoItem(string label, string value, string hint = "")
    {
        Label = label;
        Value = value;
        Hint = hint;
    }

    public string Label { get; }

    public string Value { get; }

    public string Hint { get; }

    public bool HasHint => !string.IsNullOrEmpty(Hint);
}
