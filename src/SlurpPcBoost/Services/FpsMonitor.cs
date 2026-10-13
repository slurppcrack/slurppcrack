namespace SlurpPcBoost.Services;

/// <summary>
/// Монитор «FPS» в демонстрационном режиме.
/// В реальном приложении здесь был бы захват кадров через ETW PresentMon;
/// в демо-версии генерируется правдоподобный сигнал с плавными колебаниями,
/// зависящий от числа включённых твиков.
/// </summary>
public sealed class FpsMonitor
{
    public const int HistoryLength = 60;

    private readonly Random _random = new();
    private readonly List<double> _samples = new();
    private double _climb;
    private double _lastWindowAverage;

    public bool IsRunning { get; private set; }

    public double Current { get; private set; } = 62;

    public double Minimum { get; private set; } = double.MaxValue;

    public double Maximum { get; private set; }

    /// <summary>Средний FPS за последние ~10 секунд.</summary>
    public double Average => _lastWindowAverage > 0 ? _lastWindowAverage : Current;

    /// <summary>Оценка «1% low» — самые низкие кадры за сессию.</summary>
    public double OnePercentLow => Minimum == double.MaxValue ? Current : Minimum;

    /// <summary>История кадров по времени (от старых к новым).</summary>
    public IReadOnlyList<double> History => _samples.ToArray();

    public void Start() => IsRunning = true;

    public void Stop() => IsRunning = false;

    /// <summary>Плавно подтянуть FPS к значению, соответствующему оценке 0–1.</summary>
    public void SetTargetScore(double score01)
    {
        var target = 30 + (Math.Clamp(score01, 0, 1) * 270);
        _climb = target - Current;
    }

    /// <summary>Мгновенно пересчитать FPS (после применения оптимизаций) и очистить статистику.</summary>
    public void Recalculate(double score01)
    {
        var target = 30 + (Math.Clamp(score01, 0, 1) * 270);
        Current = Math.Clamp(target + (_random.NextDouble() * 8) - 4, 25, 335);
        _climb = 0;
        ResetStats();
        _samples.Clear();
        _lastWindowAverage = Current;
        _samples.Add(Current);
    }

    /// <summary>Шаг симуляции (вызывается по таймеру ~раз в 500 мс).</summary>
    public IReadOnlyList<double> Tick()
    {
        if (!IsRunning)
        {
            return History;
        }

        var wobble = (_random.NextDouble() * 2) - 1;

        if (Math.Abs(_climb) > 1.5)
        {
            // Плавно подтягиваемся к новому значению после применения твиков.
            Current += _climb * 0.22;
            Current += wobble * 4;
        }
        else
        {
            Current += wobble * 12;
        }

        Current = Math.Clamp(Current, 25, 335);

        if (Current < Minimum)
        {
            Minimum = Current;
        }

        if (Current > Maximum)
        {
            Maximum = Current;
        }

        _samples.Add(Current);
        while (_samples.Count > HistoryLength)
        {
            _samples.RemoveAt(0);
        }

        var take = Math.Min(20, _samples.Count);
        _lastWindowAverage = _samples.Skip(_samples.Count - take).Average();

        _climb *= 0.55;
        return History;
    }

    public void ResetStats()
    {
        Minimum = double.MaxValue;
        Maximum = 0;
    }
}
