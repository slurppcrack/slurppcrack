using SlurpPcBoost.Models;

namespace SlurpPcBoost.Services;

/// <summary>
/// Дополнительные «подвиги» движка в демо-режиме имитируются задержками,
/// чтобы поведение приложения было похоже на настоящее применение твиков.
/// Точка расширения: здесь подключаются реальные действия (реестр, службы, WMI).
/// </summary>
public sealed class OptimizationEngine
{
    private readonly AppLogService _log;

    public OptimizationEngine(AppLogService log) => _log = log;

    /// <summary>Сколько максимум процентов FPS «даёт» полный набор твиков (демо-оценка).</summary>
    public const double MaxBoostPercent = 38;

    /// <summary>Вес системы «как есть» до любых оптимизаций.</summary>
    public const double BaselineScore = 0.15;

    public static int TotalImpact(IEnumerable<Tweak> tweaks)
        => tweaks.Sum(t => t.ImpactPercent);

    public static int AppliedImpact(IEnumerable<Tweak> tweaks)
        => tweaks.Where(t => t.IsApplied).Sum(t => t.ImpactPercent);

    /// <summary>Нормированная оценка производительности 0–1 (0.15 — чистая система, 1.0 — всё применено).</summary>
    public static double Score01(IReadOnlyCollection<Tweak> tweaks)
    {
        var total = TotalImpact(tweaks);
        if (total == 0)
        {
            return BaselineScore;
        }

        var applied = AppliedImpact(tweaks);
        return BaselineScore + ((1 - BaselineScore) * (double)applied / total);
    }

    /// <summary>Процент прироста к базовой производительности (для надписей «+18%»).</summary>
    public static int BoostPercent(IReadOnlyCollection<Tweak> tweaks)
    {
        var total = TotalImpact(tweaks);
        if (total == 0)
        {
            return 0;
        }

        return (int)Math.Round(AppliedImpact(tweaks) / (double)total * MaxBoostPercent);
    }

    /// <summary>Имитация применения одного твика.</summary>
    public async Task ApplyAsync(Tweak tweak, CancellationToken token = default)
    {
        tweak.IsBusy = true;
        try
        {
            _log.Info($"Применяем: {tweak.Title}");
            await Task.Delay(Random.Shared.Next(420, 780), token).ConfigureAwait(true);
            _log.Detail($"Демо-режим: изменения в системе не вносились ({tweak.Id})");
            tweak.SetAppliedSilently(true);
            _log.Success($"«{tweak.Title}» применено • ожидаемый прирост +{tweak.ImpactPercent}% FPS");
        }
        finally
        {
            tweak.IsBusy = false;
        }
    }

    /// <summary>Имитация отката одного твика.</summary>
    public async Task RevertAsync(Tweak tweak, CancellationToken token = default)
    {
        tweak.IsBusy = true;
        try
        {
            _log.Info($"Откатываем: {tweak.Title}");
            await Task.Delay(Random.Shared.Next(320, 620), token).ConfigureAwait(true);
            tweak.SetAppliedSilently(false);
            _log.Success($"«{tweak.Title}» отключено");
        }
        finally
        {
            tweak.IsBusy = false;
        }
    }

    /// <summary>Применить набор твиков «пачкой» с прогрессом.</summary>
    public async Task ApplyRangeAsync(
        IReadOnlyList<Tweak> tweaks,
        Action<Tweak, int, int> progress,
        CancellationToken token = default)
    {
        for (var i = 0; i < tweaks.Count; i++)
        {
            var tweak = tweaks[i];
            if (tweak.IsApplied)
            {
                continue;
            }

            progress(tweak, i + 1, tweaks.Count);
            tweak.IsBusy = true;
            await Task.Delay(Random.Shared.Next(70, 150), token).ConfigureAwait(true);
            tweak.SetAppliedSilently(true);
            tweak.IsBusy = false;
        }
    }

    /// <summary>Откатить набор твиков «пачкой».</summary>
    public async Task RevertRangeAsync(
        IReadOnlyList<Tweak> tweaks,
        Action<Tweak, int, int> progress,
        CancellationToken token = default)
    {
        for (var i = 0; i < tweaks.Count; i++)
        {
            var tweak = tweaks[i];
            if (!tweak.IsApplied)
            {
                continue;
            }

            progress(tweak, i + 1, tweaks.Count);
            tweak.IsBusy = true;
            await Task.Delay(Random.Shared.Next(45, 110), token).ConfigureAwait(true);
            tweak.SetAppliedSilently(false);
            tweak.IsBusy = false;
        }
    }

    /// <summary>Демо-«профиль игры»: подбирает твики под жанр и применяет их.</summary>
    public async Task ApplyGameProfileAsync(
        GameProfile game,
        IReadOnlyList<Tweak> tweaks,
        Action<Tweak, int, int> progress,
        string preset,
        CancellationToken token = default)
    {
        game.IsBusy = true;
        try
        {
            _log.Info($"Профиль «{game.Name}»: подбираем настройки под {game.Category}");
            await Task.Delay(400, token).ConfigureAwait(true);

            var selection = tweaks.Where(t => !t.IsApplied).ToList();
            await ApplyRangeAsync(selection, progress, token).ConfigureAwait(true);

            game.Preset = preset;
            game.IsOptimized = true;
            _log.Success($"Профиль «{game.Name}» применён • пресет «{preset}»");
        }
        finally
        {
            game.IsBusy = false;
        }
    }

    /// <summary>Откат профиля игры.</summary>
    public async Task RevertGameProfileAsync(GameProfile game, CancellationToken token = default)
    {
        game.IsBusy = true;
        try
        {
            await Task.Delay(350, token).ConfigureAwait(true);
            game.IsOptimized = false;
            game.Preset = "Без оптимизации";
            _log.Success($"Профиль «{game.Name}» отключён");
        }
        finally
        {
            game.IsBusy = false;
        }
    }
}
