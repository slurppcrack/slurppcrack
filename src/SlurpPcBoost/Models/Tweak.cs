using SlurpPcBoost.Mvvm;

namespace SlurpPcBoost.Models;

/// <summary>Насколько твик «рискованный». Безопасные включаются в рекомендации по умолчанию.</summary>
public enum TweakRisk
{
    Safe,
    Advanced,
}

/// <summary>Один пункт оптимизации (в демо-режиме только имитируется его применение).</summary>
public sealed class Tweak : ObservableObject
{
    private bool _isApplied;
    private bool _isBusy;
    private bool _isEnabled = true;
    private bool _suppressNotifications;

    public string Id { get; init; } = string.Empty;

    public string Title { get; init; } = string.Empty;

    public string Description { get; init; } = string.Empty;

    public string Category { get; init; } = string.Empty;

    public int ImpactPercent { get; init; }

    public TweakRisk Risk { get; init; } = TweakRisk.Safe;

    public string ImpactText => $"+{ImpactPercent}% FPS";

    public string RiskText => Risk == TweakRisk.Advanced ? "Продвинутое" : "Безопасно";

    public bool IsAdvanced => Risk == TweakRisk.Advanced;

    /// <summary>Состояние переключателя (применён твик или нет).</summary>
    public bool IsApplied
    {
        get => _isApplied;
        set
        {
            if (SetProperty(ref _isApplied, value))
            {
                OnPropertyChanged(nameof(StateText));
                if (!_suppressNotifications)
                {
                    StateChanged?.Invoke(this, value);
                }
            }
        }
    }

    /// <summary>true, пока имитируется применение — блокирует повторные клики по свитчу.</summary>
    public bool IsBusy
    {
        get => _isBusy;
        set
        {
            if (SetProperty(ref _isBusy, value))
            {
                OnPropertyChanged(nameof(StateText));
            }
        }
    }

    /// <summary>Можно ли взаимодействовать со свитчем (движок выключает на время массовых операций).</summary>
    public bool IsEnabled
    {
        get => _isEnabled;
        set => SetProperty(ref _isEnabled, value);
    }

    public string StateText => IsBusy ? "Применяется…" : IsApplied ? "Применено" : "Выключено";

    /// <summary>Пользователь переключил свитч (движок сам меняет состояние молча, поэтому это событие приходит только от UI).</summary>
    public event Action<Tweak, bool>? StateChanged;

    /// <summary>Установить состояние без уведомления UI — используется движком оптимизации.</summary>
    internal void SetAppliedSilently(bool value)
    {
        _suppressNotifications = true;
        try
        {
            IsApplied = value;
        }
        finally
        {
            _suppressNotifications = false;
        }
    }
}
