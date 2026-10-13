using SlurpPcBoost.Mvvm;
using SlurpPcBoost.Services;

namespace SlurpPcBoost.ViewModels;

/// <summary>База для вью-моделей страниц: даёт доступ к состоянию приложения.</summary>
public abstract class ViewModelBase : ObservableObject
{
    protected ViewModelBase(AppState state) => State = state;

    public AppState State { get; }
}
